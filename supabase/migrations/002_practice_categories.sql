-- -----------------------------------------------------------------------------
-- 002. 코스 분류(명상 / 시각화) + 시각화 코스 추가 + 인유(InYou) 리브랜딩
-- -----------------------------------------------------------------------------
-- 앱의 src/lib/constants.ts COURSES와 같은 내용을 DB에도 맞춰 둔다.
-- (plays.course_id → courses.id 외래키 때문에 새 코스 id는 여기에도 있어야 한다)

alter table public.courses
  add column if not exists category text not null default 'meditation';

alter table public.courses
  drop constraint if exists courses_category_check;

alter table public.courses
  add constraint courses_category_check
  check (category in ('meditation', 'visualization'));

update public.courses set category = 'visualization' where id in ('vis');
update public.courses set category = 'meditation' where id in ('c3', 'c10', 'c20', 'sleep');

insert into public.courses
  (id, category, title, subtitle, description, minutes, theme, glyph, tag, tone,
   audio_path, breath_inhale, breath_hold, breath_exhale, is_free, sort_order)
values
  (
    'c3', 'meditation', '3분 마음챙김', '지금 이 순간으로 돌아오기',
    '앉은 자리에서 숨만 세어도 충분해요. 3분 동안 들이쉬고 내쉬는 숨에 주의를 두고, 생각은 흘려보내요.',
    3, 'lake', '🫧', '마음챙김', 'lake', null, 4, 2, 6, true, 1
  ),
  (
    'c10', 'meditation', '10분 코스', '하루를 정리하는 호흡',
    '첫 30초에 오늘의 목표를 하나로 정하고, 8분 명상과 2분의 정적으로 마무리해요. 잠들기 전, 아이를 재운 뒤 함께해요.',
    10, 'lake', '🌊', '데일리', 'lake', null, 4, 2, 6, true, 2
  ),
  (
    'c20', 'meditation', '20분 코스', '깊은 이완 · 바디스캔',
    '발끝부터 머리까지 몸의 감각을 하나씩 지나가며 긴장을 풀어요. 긴 코스가 아니라 다른 종류의 명상이에요.',
    20, 'forest', '🌿', '깊은 이완', 'forest', null, 4, 2, 6, false, 3
  ),
  (
    'sleep', 'meditation', '수면 호흡', '4-7-8 호흡으로 잠들기',
    '들이쉬기 4초, 멈추기 7초, 내쉬기 8초. 잠들기 전 휴대폰을 내려놓고 천천히 호흡해요.',
    10, 'night', '💤', '수면', 'night', null, 4, 7, 8, false, 4
  ),
  (
    'vis', 'visualization', '안전한 방', '나만의 안전한 방',
    '눈을 감고 나만의 안전한 방을 그려봐요. 문을 닫고, 조명을 고르고, 숨을 고르는 시간.',
    10, 'night', '🌙', '시각화', 'night', null, 4, 2, 6, false, 5
  ),
  (
    'vis-light', 'visualization', '빛의 호수', '빛으로 채우는 몸',
    '머리끝으로 스며든 따뜻한 빛이 어깨와 가슴을 지나 발끝까지 천천히 내려가는 장면을 그려봐요. 무거운 곳에 빛을 머물게 해요.',
    8, 'lake', '✨', '시각화', 'lake', null, 4, 2, 6, false, 6
  ),
  (
    'vis-garden', 'visualization', '내면의 정원', '마음속 정원을 거닐기',
    '문을 열면 내가 가꾼 정원이 있어요. 오늘 마음에 필요한 나무 한 그루를 심고, 그 그늘에 잠깐 앉아봐요.',
    12, 'forest', '🌷', '시각화', 'forest', null, 4, 2, 6, false, 7
  )
on conflict (id) do update set
  category = excluded.category,
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
