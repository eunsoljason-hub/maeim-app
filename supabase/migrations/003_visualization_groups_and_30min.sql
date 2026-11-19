-- -----------------------------------------------------------------------------
-- 003. 시각화 3분류(아침/비우기/소망) · 30분 명상 · 새 시각화 코스 동기화
-- -----------------------------------------------------------------------------
-- 앱의 src/lib/constants.ts COURSES와 같은 내용을 DB에도 맞춘다.
-- (plays.course_id → courses.id 외래키 때문에 새 코스 id는 여기에도 있어야 한다)

alter table public.courses
  add column if not exists course_group text;

alter table public.courses
  drop constraint if exists courses_group_check;

alter table public.courses
  add constraint courses_group_check
  check (course_group is null or course_group in ('morning', 'release', 'wish'));

update public.courses set course_group = null where category = 'meditation';
update public.courses set course_group = 'morning' where id = 'vis-light';
update public.courses set course_group = 'release' where id = 'vis';
update public.courses set course_group = 'wish' where id = 'vis-garden';

insert into public.courses
  (id, category, course_group, title, subtitle, description, minutes, theme, glyph, tag, tone,
   audio_path, breath_inhale, breath_hold, breath_exhale, is_free, sort_order)
values
  (
    'c30', 'meditation', null, '30분 깊은 명상', '호흡 · 바디스캔 · 정적',
    '10분 호흡, 15분 바디스캔, 5분의 정적. 아이들이 잠든 밤, 한 번쯤 길게 앉아보고 싶은 날을 위한 코스예요.',
    30, 'forest', '🌲', '긴 호흡', 'forest', null, 4, 2, 6, false, 5
  ),
  (
    'vis-dawn', 'visualization', 'morning', '아침의 첫 빛', '눈뜨자마자 5분',
    '이불 속에서 눈을 감은 채, 창으로 들어오는 첫 빛을 몸에 천천히 부어요. 오늘의 나를 먼저 만나는 5분.',
    5, 'lake', '🌅', '아침', 'lake', null, 4, 2, 6, true, 10
  ),
  (
    'vis-light', 'visualization', 'morning', '빛의 호수', '빛으로 채우는 몸',
    '머리끝으로 스며든 따뜻한 빛이 어깨와 가슴을 지나 발끝까지 천천히 내려가는 장면을 그려봐요. 무거운 곳에 빛을 머물게 해요.',
    8, 'lake', '✨', '아침', 'lake', null, 4, 2, 6, true, 11
  ),
  (
    'vis-window', 'visualization', 'morning', '창가의 아침', '커피 한 잔의 7분',
    '창가에 앉아 세상이 하나씩 움직이기 시작하는 걸 지켜봐요. 서두르지 않고, 오늘의 속도를 정하는 7분.',
    7, 'forest', '🌤️', '아침', 'forest', null, 4, 2, 6, false, 12
  ),
  (
    'vis', 'visualization', 'release', '안전한 방', '나만의 안전한 방',
    '눈을 감고 나만의 안전한 방을 그려봐요. 문을 닫고, 조명을 고르고, 숨을 고르는 시간.',
    10, 'night', '🌙', '비우기', 'night', null, 4, 2, 6, true, 20
  ),
  (
    'vis-river', 'visualization', 'release', '흘려보내는 강', '생각을 물에 띄워 보내기',
    '떠오르는 생각을 나뭇잎에 하나씩 얹어 강물에 띄워요. 붙잡지 않고, 밀어내지도 않고, 그냥 흘러가게.',
    10, 'forest', '🍃', '비우기', 'forest', null, 4, 2, 6, false, 21
  ),
  (
    'vis-basket', 'visualization', 'release', '비우는 바구니', '오늘 안고 있던 것 내려놓기',
    '하루 동안 안고 있던 것들을 바구니에 담아요. 바구니는 내가 원할 때 열어볼 수 있어요. 지금은 잠깐 내려두는 것.',
    8, 'night', '🧺', '비우기', 'night', null, 4, 2, 6, false, 22
  ),
  (
    'vis-garden', 'visualization', 'wish', '내면의 정원', '마음속 정원을 거닐기',
    '문을 열면 내가 가꾼 정원이 있어요. 오늘 마음에 필요한 나무 한 그루를 심고, 그 그늘에 잠깐 앉아봐요.',
    12, 'forest', '🌷', '소망', 'forest', null, 4, 2, 6, true, 30
  ),
  (
    'vis-seed', 'visualization', 'wish', '소망의 씨앗', '이루어진 하루를 미리 살아보기',
    '이루고 싶은 일이 이미 이루어진 아침을 그려봐요. 그 아침의 공기, 표정, 첫 마디 말까지.',
    10, 'lake', '🌱', '소망', 'lake', null, 4, 2, 6, false, 31
  ),
  (
    'vis-future', 'visualization', 'wish', '미래의 나를 만나기', '1년 뒤의 나와 대화하기',
    '1년 뒤의 내가 지금의 나를 기다리고 있어요. 그 사람은 무엇을 하고, 무엇을 내려놓았을까요.',
    12, 'night', '🪞', '소망', 'night', null, 4, 2, 6, false, 32
  )
on conflict (id) do update set
  category = excluded.category,
  course_group = excluded.course_group,
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
