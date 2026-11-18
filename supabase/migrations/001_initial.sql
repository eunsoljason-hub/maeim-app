-- =============================================================================
-- 마음명상 · 001_initial.sql
-- 명상 코스 · 마음일기 · 1:1 마이크로 리스닝 상담
--
-- Supabase SQL Editor에서 파일 전체를 한 번 실행하세요.
-- (Dashboard → SQL → New query → Run)
--
-- 핵심 원칙
--  1) 마음일기는 본인만 읽고 쓴다. 호스트는 상담 예약 단위로 동의한 경우에만
--     최근 7일 기록을 볼 수 있다.
--  2) 상담 가격은 서버(트리거)가 정한다. 클라이언트가 보낸 금액은 신뢰하지 않는다.
--  3) 슬롯 하나에는 활성 예약이 하나만. 하루 6건, 슬롯 사이 5분 버퍼.
--  4) 결제 승인 전에는 예약이 confirmed가 될 수 없다.
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- 0. 공통 유틸
-- -----------------------------------------------------------------------------

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- 1. users — auth.users와 1:1
-- -----------------------------------------------------------------------------

create table if not exists public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '이용자' check (char_length(name) between 1 and 40),
  handle text check (handle is null or char_length(handle) <= 40),
  avatar_url text,
  role text not null default 'client' check (role in ('client', 'host')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists users_touch_updated_at on public.users;
create trigger users_touch_updated_at
  before update on public.users
  for each row execute function public.touch_updated_at();

-- 카카오 로그인으로 auth.users에 행이 생기면 프로필을 자동 생성
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, name, handle, avatar_url)
  values (
    new.id,
    coalesce(
      nullif(new.raw_user_meta_data ->> 'name', ''),
      nullif(new.raw_user_meta_data ->> 'nickname', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      '이용자'
    ),
    nullif(
      coalesce(
        new.raw_user_meta_data ->> 'preferred_username',
        split_part(coalesce(new.email, ''), '@', 1)
      ),
      ''
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 현재 사용자가 호스트인지 확인 (RLS 재귀 없이 security definer로 조회)
-- users 테이블이 만들어진 뒤에 정의해야 SQL 함수 본문 검증을 통과합니다.
create or replace function public.is_host()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.users
    where id = auth.uid() and role = 'host'
  );
$$;

-- -----------------------------------------------------------------------------
-- 2. courses — 명상 코스 4종
-- -----------------------------------------------------------------------------

create table if not exists public.courses (
  id text primary key,
  title text not null,
  subtitle text,
  description text,
  minutes integer not null check (minutes between 3 and 60),
  theme text not null check (theme in ('forest', 'lake', 'night')),
  glyph text,
  tag text,
  tone text default 'lake',
  audio_path text,               -- R2 서명 URL 또는 Supabase Storage 경로 (/audio/*.mp3)
  breath_inhale integer not null default 4 check (breath_inhale between 1 and 20),
  breath_hold integer not null default 2 check (breath_hold between 0 and 20),
  breath_exhale integer not null default 6 check (breath_exhale between 1 and 30),
  is_free boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.courses
  (id, title, subtitle, description, minutes, theme, glyph, tag, tone,
   audio_path, breath_inhale, breath_hold, breath_exhale, is_free, sort_order)
values
  (
    'c10', '10분 코스', '하루를 정리하는 호흡',
    '첫 30초에 오늘의 목표를 하나로 정하고, 8분 명상과 2분의 정적으로 마무리해요.',
    10, 'lake', '🌊', '데일리', 'lake', null, 4, 2, 6, true, 1
  ),
  (
    'c20', '20분 코스', '깊은 이완 · 바디스캔',
    '발끝부터 머리까지 몸의 감각을 지나가며 긴장을 풀어요. 긴 코스가 아니라 다른 종류의 명상이에요.',
    20, 'forest', '🌿', '깊은 이완', 'forest', null, 4, 2, 6, false, 2
  ),
  (
    'vis', '시각화 명상', '나만의 안전한 방',
    '눈을 감고 나만의 안전한 방을 그려봐요. 문을 닫고, 조명을 고르고, 숨을 고르는 시간.',
    10, 'night', '🌙', '시각화', 'night', null, 4, 2, 6, false, 3
  ),
  (
    'sleep', '수면 호흡', '4-7-8 호흡으로 잠들기',
    '들이쉬기 4초, 멈추기 7초, 내쉬기 8초. 잠들기 전 휴대폰을 내려놓고 천천히 호흡해요.',
    10, 'night', '💤', '수면', 'night', null, 4, 7, 8, false, 4
  )
on conflict (id) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  minutes = excluded.minutes,
  theme = excluded.theme,
  glyph = excluded.glyph,
  tag = excluded.tag,
  tone = excluded.tone,
  breath_inhale = excluded.breath_inhale,
  breath_hold = excluded.breath_hold,
  breath_exhale = excluded.breath_exhale,
  is_free = excluded.is_free,
  sort_order = excluded.sort_order;

-- -----------------------------------------------------------------------------
-- 3. plays — 명상 완료 기록
-- -----------------------------------------------------------------------------

create table if not exists public.plays (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  course_id text references public.courses (id) on delete set null,
  minutes integer not null check (minutes between 1 and 120),
  completed_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 4. diaries — 마음일기 (민감정보 취급)
-- -----------------------------------------------------------------------------

create table if not exists public.diaries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  date date not null default ((now() at time zone 'Asia/Seoul')::date),
  moment text not null check (moment in ('before', 'after')),
  mood text not null check (
    mood in ('calm', 'good', 'flat', 'heavy', 'anxious', 'angry', 'tired', 'hope')
  ),
  intensity integer not null default 3 check (intensity between 1 and 5),
  text text not null default '' check (char_length(text) <= 600),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- 5. slots — 호스트가 여는 상담 시간
-- -----------------------------------------------------------------------------

create table if not exists public.slots (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.users (id) on delete cascade,
  starts_at timestamptz not null,
  minutes integer not null default 10 check (minutes between 5 and 30),
  status text not null default 'open' check (status in ('open', 'closed', 'booked')),
  created_at timestamptz not null default now(),
  unique (host_id, starts_at)
);

-- -----------------------------------------------------------------------------
-- 6. bookings — 1:1 리스닝 상담 예약·결제
-- -----------------------------------------------------------------------------

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  slot_id uuid references public.slots (id) on delete set null,
  host_id uuid not null references public.users (id) on delete cascade,
  client_id uuid not null references public.users (id) on delete cascade,
  client_name text not null default '고객' check (char_length(client_name) <= 40),
  starts_at timestamptz not null,
  minutes integer not null check (minutes in (3, 5, 10)),
  price integer not null check (price in (3900, 5900, 9900)),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'cancelled', 'completed')),
  payment_status text not null default 'pending'
    check (payment_status in ('pending', 'paid', 'failed', 'cancelled')),
  payment_key text,
  order_id text unique,
  consent_listening boolean not null default false,
  consent_briefing boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists bookings_touch_updated_at on public.bookings;
create trigger bookings_touch_updated_at
  before update on public.bookings
  for each row execute function public.touch_updated_at();

-- 가격은 서버가 정하고, 슬롯 시간과 일치해야 하며, 하루 상한/버퍼를 지킨다.
create or replace function public.prepare_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  slot_row public.slots;
  expected_price integer;
begin
  if new.slot_id is null then
    raise exception 'slot_required';
  end if;

  select * into slot_row from public.slots where id = new.slot_id;
  if slot_row.id is null then
    raise exception 'slot_not_found';
  end if;
  if slot_row.status = 'closed' then
    raise exception 'slot_closed';
  end if;

  new.host_id := slot_row.host_id;
  new.starts_at := slot_row.starts_at;

  expected_price := case new.minutes
    when 3 then 3900
    when 5 then 5900
    when 10 then 9900
    else null
  end;
  if expected_price is null then
    raise exception 'unsupported_length';
  end if;
  new.price := expected_price;

  if new.status not in ('pending', 'confirmed') then
    raise exception 'invalid_initial_status';
  end if;

  if (
    select count(*)
    from public.bookings b
    where b.host_id = new.host_id
      and b.status in ('pending', 'confirmed', 'completed')
      and (b.starts_at at time zone 'Asia/Seoul')::date
          = (new.starts_at at time zone 'Asia/Seoul')::date
  ) >= 6 then
    raise exception 'daily_cap_reached';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.host_id = new.host_id
      and b.status in ('pending', 'confirmed')
      and b.id <> new.id
      and tstzrange(
            b.starts_at,
            b.starts_at + make_interval(mins => b.minutes + 5),
            '[)'
          ) && tstzrange(
            new.starts_at,
            new.starts_at + make_interval(mins => new.minutes + 5),
            '[)'
          )
  ) then
    raise exception 'slot_taken';
  end if;

  if new.consent_listening is not true then
    raise exception 'consent_required';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_prepare on public.bookings;
create trigger bookings_prepare
  before insert on public.bookings
  for each row execute function public.prepare_booking();

-- 결제·시간·가격은 수정 불가. 완료 처리는 호스트만.
create or replace function public.guard_booking_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.price <> old.price
     or new.minutes <> old.minutes
     or new.starts_at <> old.starts_at
     or new.client_id <> old.client_id
     or new.host_id <> old.host_id then
    raise exception 'immutable_booking_fields';
  end if;

  if new.status = 'completed' and not public.is_host() then
    raise exception 'host_only';
  end if;

  if new.status = 'confirmed'
     and old.status <> 'confirmed'
     and not public.is_host()
     and new.payment_status <> 'paid' then
    raise exception 'payment_required';
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_guard_update on public.bookings;
create trigger bookings_guard_update
  before update on public.bookings
  for each row execute function public.guard_booking_update();

-- 슬롯 상태는 예약과 자동으로 동기화
create or replace function public.sync_slot_status()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.slot_id is null then
    return new;
  end if;

  if new.status in ('pending', 'confirmed') then
    update public.slots
      set status = 'booked'
      where id = new.slot_id and status <> 'booked';
  elsif new.status in ('cancelled', 'completed') then
    if not exists (
      select 1 from public.bookings b
      where b.slot_id = new.slot_id
        and b.id <> new.id
        and b.status in ('pending', 'confirmed')
    ) then
      update public.slots
        set status = 'open'
        where id = new.slot_id and status = 'booked';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists bookings_sync_slot on public.bookings;
create trigger bookings_sync_slot
  after insert or update of status on public.bookings
  for each row execute function public.sync_slot_status();

-- -----------------------------------------------------------------------------
-- 7. notes — 상담 후 3줄 요약 + 다음 한 걸음
-- -----------------------------------------------------------------------------

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  booking_id uuid not null unique references public.bookings (id) on delete cascade,
  host_id uuid not null references public.users (id) on delete cascade,
  line1 text not null default '' check (char_length(line1) <= 400),
  line2 text not null default '' check (char_length(line2) <= 400),
  line3 text not null default '' check (char_length(line3) <= 400),
  next_step text not null default '' check (char_length(next_step) <= 400),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists notes_touch_updated_at on public.notes;
create trigger notes_touch_updated_at
  before update on public.notes
  for each row execute function public.touch_updated_at();

-- -----------------------------------------------------------------------------
-- 8. 인덱스
-- -----------------------------------------------------------------------------

create index if not exists diaries_user_created_idx on public.diaries (user_id, created_at desc);
create index if not exists diaries_user_date_idx on public.diaries (user_id, date);
create index if not exists plays_user_completed_idx on public.plays (user_id, completed_at desc);
create index if not exists slots_host_starts_idx on public.slots (host_id, starts_at);
create index if not exists bookings_client_starts_idx on public.bookings (client_id, starts_at desc);
create index if not exists bookings_host_starts_idx on public.bookings (host_id, starts_at desc);
create index if not exists bookings_active_idx on public.bookings (status) where status in ('pending', 'confirmed');

-- 슬롯 하나에 활성 예약은 하나만
create unique index if not exists bookings_one_active_per_slot
  on public.bookings (slot_id)
  where status in ('pending', 'confirmed');

-- -----------------------------------------------------------------------------
-- 9. RLS
-- -----------------------------------------------------------------------------

alter table public.users enable row level security;
alter table public.courses enable row level security;
alter table public.plays enable row level security;
alter table public.diaries enable row level security;
alter table public.slots enable row level security;
alter table public.bookings enable row level security;
alter table public.notes enable row level security;

-- users -----------------------------------------------------------------------
drop policy if exists users_select_self on public.users;
create policy users_select_self on public.users
  for select to authenticated
  using (id = auth.uid() or public.is_host());

drop policy if exists users_insert_self on public.users;
create policy users_insert_self on public.users
  for insert to authenticated
  with check (id = auth.uid());

drop policy if exists users_update_self on public.users;
create policy users_update_self on public.users
  for update to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- courses ---------------------------------------------------------------------
drop policy if exists courses_select_all on public.courses;
create policy courses_select_all on public.courses
  for select to anon, authenticated
  using (true);

-- plays -----------------------------------------------------------------------
drop policy if exists plays_select_own on public.plays;
create policy plays_select_own on public.plays
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists plays_insert_own on public.plays;
create policy plays_insert_own on public.plays
  for insert to authenticated
  with check (user_id = auth.uid());

-- diaries ---------------------------------------------------------------------
drop policy if exists diaries_select_own on public.diaries;
create policy diaries_select_own on public.diaries
  for select to authenticated
  using (user_id = auth.uid());

-- 호스트는 '동의한 예약'의 최근 7일 기록만 볼 수 있다.
drop policy if exists diaries_select_host on public.diaries;
create policy diaries_select_host on public.diaries
  for select to authenticated
  using (
    public.is_host()
    and exists (
      select 1
      from public.bookings b
      where b.host_id = auth.uid()
        and b.client_id = diaries.user_id
        and b.consent_briefing = true
        and b.status in ('pending', 'confirmed', 'completed')
        and diaries.date between
            (b.starts_at at time zone 'Asia/Seoul')::date - 7
            and (b.starts_at at time zone 'Asia/Seoul')::date + 1
    )
  );

drop policy if exists diaries_insert_own on public.diaries;
create policy diaries_insert_own on public.diaries
  for insert to authenticated
  with check (user_id = auth.uid());

drop policy if exists diaries_update_own on public.diaries;
create policy diaries_update_own on public.diaries
  for update to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

drop policy if exists diaries_delete_own on public.diaries;
create policy diaries_delete_own on public.diaries
  for delete to authenticated
  using (user_id = auth.uid());

-- slots -----------------------------------------------------------------------
drop policy if exists slots_select_visible on public.slots;
create policy slots_select_visible on public.slots
  for select to anon, authenticated
  using (status <> 'closed' or host_id = auth.uid());

drop policy if exists slots_insert_host on public.slots;
create policy slots_insert_host on public.slots
  for insert to authenticated
  with check (host_id = auth.uid() and public.is_host());

drop policy if exists slots_update_host on public.slots;
create policy slots_update_host on public.slots
  for update to authenticated
  using (host_id = auth.uid() and public.is_host())
  with check (host_id = auth.uid() and public.is_host());

drop policy if exists slots_delete_host on public.slots;
create policy slots_delete_host on public.slots
  for delete to authenticated
  using (host_id = auth.uid() and public.is_host());

-- bookings --------------------------------------------------------------------
drop policy if exists bookings_select_own on public.bookings;
create policy bookings_select_own on public.bookings
  for select to authenticated
  using (client_id = auth.uid() or host_id = auth.uid());

drop policy if exists bookings_insert_client on public.bookings;
create policy bookings_insert_client on public.bookings
  for insert to authenticated
  with check (client_id = auth.uid() and consent_listening = true);

drop policy if exists bookings_update_participant on public.bookings;
create policy bookings_update_participant on public.bookings
  for update to authenticated
  using (client_id = auth.uid() or host_id = auth.uid())
  with check (client_id = auth.uid() or host_id = auth.uid());

-- notes -----------------------------------------------------------------------
drop policy if exists notes_select_participant on public.notes;
create policy notes_select_participant on public.notes
  for select to authenticated
  using (
    host_id = auth.uid()
    or exists (
      select 1 from public.bookings b
      where b.id = notes.booking_id and b.client_id = auth.uid()
    )
  );

drop policy if exists notes_insert_host on public.notes;
create policy notes_insert_host on public.notes
  for insert to authenticated
  with check (host_id = auth.uid() and public.is_host());

drop policy if exists notes_update_host on public.notes;
create policy notes_update_host on public.notes
  for update to authenticated
  using (host_id = auth.uid() and public.is_host())
  with check (host_id = auth.uid() and public.is_host());

-- -----------------------------------------------------------------------------
-- 10. 권한 (RLS가 실제 접근을 제한하고, GRANT는 문만 열어준다)
-- -----------------------------------------------------------------------------

grant usage on schema public to anon, authenticated;
grant execute on function public.is_host() to anon, authenticated;

grant select on public.courses, public.slots to anon;
grant select, insert, update, delete on public.users, public.plays, public.diaries,
  public.slots, public.bookings, public.notes to authenticated;

-- 역할 상승 방지: 인증된 사용자는 users.role을 직접 바꿀 수 없다.
revoke update (role) on public.users from authenticated;

-- -----------------------------------------------------------------------------
-- 11. 호스트 계정 승격 (최초 1회, 본인 가입 후 실행)
-- -----------------------------------------------------------------------------
-- Supabase → Authentication → Users 에서 은솔님 계정의 UUID를 복사한 뒤:
--
--   update public.users set role = 'host' where id = '<은솔님 auth uid>';
--
-- 이후 /host 화면은 로그인 계정의 role이 host일 때만 열립니다.
-- -----------------------------------------------------------------------------
