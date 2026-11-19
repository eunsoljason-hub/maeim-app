import type {
  Course,
  CourseCategory,
  MoodId,
  PaymentMethodId,
  ThemeId,
  VisualizationGroup,
} from "./types";

export const APP_NAME = "인유";
export const APP_NAME_EN = "InYou";
/** Brand lock-up for places with room for both scripts. */
export const APP_NAME_FULL = `${APP_NAME} (${APP_NAME_EN})`;
export const APP_TAGLINE = "3분이면 시작되는 마음 돌봄";
export const APP_DESCRIPTION =
  "명상과 시각화 코스, 매일 남기는 마음일기, 그리고 은솔님과 3·5·10분으로 이야기하는 1:1 마이크로 리스닝 상담.";

export const HOST = {
  id: "eunsol",
  displayName: "은솔님",
  initial: "은",
  role: "리스너",
  intro: "복직·육아·진로 사이에서 흔들리는 마음, 3분부터 들어드려요.",
  rating: 4.9,
  sessionCount: 128,
  averageMinutes: 4,
  /** Displayed on the host profile card. */
  bio:
    "복직을 앞둔 엄마로 살아본 사람입니다. 해결해 드리는 대신, 지금 가장 무거운 것 하나를 같이 꺼내봐요.",
} as const;

export const THEMES: Record<
  ThemeId,
  { label: string; accent: string; background: string; textTone: string }
> = {
  forest: {
    label: "새벽 숲",
    accent: "#B9DDC0",
    background: "#0A1A16",
    textTone: "#EEF3EC",
  },
  lake: {
    label: "잔잔한 호수",
    accent: "#C6DEEE",
    background: "#0E1A26",
    textTone: "#EEF3EC",
  },
  night: {
    label: "밤하늘",
    accent: "#D3CFF0",
    background: "#080B16",
    textTone: "#EEF3EC",
  },
};

export const MOODS: {
  id: MoodId;
  emoji: string;
  label: string;
  short: string;
  color: string;
}[] = [
  { id: "calm", emoji: "😌", label: "편안해요", short: "편안", color: "#7E9A87" },
  { id: "good", emoji: "🙂", label: "괜찮아요", short: "괜찮음", color: "#9AA87E" },
  { id: "flat", emoji: "😐", label: "그저그래요", short: "그저그럼", color: "#A9A6A0" },
  { id: "heavy", emoji: "😔", label: "가라앉아요", short: "가라앉음", color: "#8B93A8" },
  { id: "anxious", emoji: "😣", label: "불안해요", short: "불안", color: "#B39A8B" },
  { id: "angry", emoji: "😤", label: "화가 나요", short: "화남", color: "#B98A82" },
  { id: "tired", emoji: "🥱", label: "지쳐요", short: "지침", color: "#A79BB5" },
  { id: "hope", emoji: "🌤️", label: "기대돼요", short: "기대", color: "#C2A877" },
];

/** The six quick moods on the home screen (one tap → diary). */
export const QUICK_MOOD_IDS: MoodId[] = [
  "calm",
  "good",
  "flat",
  "heavy",
  "anxious",
  "tired",
];

export function moodById(id: MoodId | string | null | undefined) {
  return MOODS.find((m) => m.id === id) ?? MOODS[2];
}

/**
 * 듣기 코스는 두 갈래로 나뉘어요.
 * - meditation: 호흡·바디스캔·수면·마음챙김처럼 몸의 감각에 머무는 명상
 * - visualization: 장면·빛·내면의 이미지를 그려보는 시각화
 */
/**
 * 듣기 코스는 두 갈래로 나뉜다.
 * - meditation: 3·10·20·30분 호흡·바디스캔·수면 명상 + 자유 타이머
 * - visualization: 아침 / 비우기 / 소망 세 가지 시각화
 */
export const COURSE_CATEGORIES: {
  id: CourseCategory;
  label: string;
  description: string;
}[] = [
  { id: "meditation", label: "명상", description: "3 · 10 · 20 · 30분, 그리고 자유 타이머" },
  { id: "visualization", label: "시각화", description: "아침 · 비우기 · 소망" },
];

export function coursesByCategory(category: CourseCategory): Course[] {
  return COURSES.filter((course) => course.category === category);
}

/** 명상 탭의 다섯 갈래. `minutes`가 null이면 자유 타이머. */
export const MEDITATION_BUCKETS: {
  id: string;
  label: string;
  minutes: number | null;
  hint: string;
  glyph: string;
}[] = [
  { id: "m3", label: "3분", minutes: 3, hint: "지금 이 순간으로", glyph: "🫧" },
  { id: "m10", label: "10분", minutes: 10, hint: "하루를 정리하는", glyph: "🌊" },
  { id: "m20", label: "20분", minutes: 20, hint: "깊은 이완", glyph: "🌿" },
  { id: "m30", label: "30분", minutes: 30, hint: "긴 호흡", glyph: "🌲" },
  { id: "timer", label: "타이머", minutes: null, hint: "원하는 만큼", glyph: "⏱️" },
];

export const TIMER_COURSE_ID = "timer";

export function meditationCoursesFor(minutes: number | null): Course[] {
  if (minutes === null) return [];
  return COURSES.filter(
    (course) => course.category === "meditation" && course.minutes === minutes,
  );
}

/** 시각화 세 갈래. */
export const VISUALIZATION_GROUPS: {
  id: VisualizationGroup;
  label: string;
  labelEn: string;
  kicker: string;
  description: string;
  glyph: string;
}[] = [
  {
    id: "morning",
    label: "아침",
    labelEn: "Morning",
    kicker: "하루를 여는 빛",
    description: "눈을 뜨자마자, 오늘의 나를 먼저 만나요.",
    glyph: "🌅",
  },
  {
    id: "release",
    label: "비우기 시각화",
    labelEn: "Letting Go",
    kicker: "내려놓는 시간",
    description: "안고 있던 것을 하나씩 바닥에 내려놓아요.",
    glyph: "🍃",
  },
  {
    id: "wish",
    label: "소망 시각화",
    labelEn: "Wish",
    kicker: "원하는 것을 그리는",
    description: "이미 이루어진 장면을 먼저 살아봐요.",
    glyph: "🌱",
  },
];

export function visualizationCoursesFor(group: VisualizationGroup): Course[] {
  return COURSES.filter(
    (course) => course.category === "visualization" && course.group === group,
  );
}

export const COURSES: Course[] = [
  /* ------------------------------- 명상 ------------------------------- */
  {
    id: "c3",
    category: "meditation",
    title: "3분 마음챙김",
    subtitle: "지금 이 순간으로 돌아오기",
    description:
      "앉은 자리에서 숨만 세어도 충분해요. 3분 동안 들이쉬고 내쉬는 숨에 주의를 두고, 생각은 흘려보내요.",
    minutes: 3,
    theme: "lake",
    glyph: "🫧",
    tone: "lake",
    tag: "마음챙김",
    audioUrl: null,
    bgmId: "morning-meditation",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: true,
    sortOrder: 1,
  },
  {
    id: "c10",
    category: "meditation",
    title: "10분 코스",
    subtitle: "하루를 정리하는 호흡",
    description:
      "첫 30초에 오늘의 목표를 하나로 정하고, 8분 명상과 2분의 정적으로 마무리해요. 잠들기 전, 아이를 재운 뒤 함께해요.",
    minutes: 10,
    theme: "lake",
    glyph: "🌊",
    tone: "lake",
    tag: "데일리",
    audioUrl: null,
    bgmId: "rain-solace",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: true,
    sortOrder: 2,
  },
  {
    id: "sleep",
    category: "meditation",
    title: "수면 호흡",
    subtitle: "4-7-8 호흡으로 잠들기",
    description:
      "들이쉬기 4초, 멈추기 7초, 내쉬기 8초. 잠들기 전 휴대폰을 내려놓고 천천히 호흡해요.",
    minutes: 10,
    theme: "night",
    glyph: "💤",
    tone: "night",
    tag: "수면",
    audioUrl: null,
    bgmId: "summer-rain",
    breath: { inhale: 4, hold: 7, exhale: 8 },
    free: false,
    sortOrder: 3,
  },
  {
    id: "c20",
    category: "meditation",
    title: "20분 코스",
    subtitle: "깊은 이완 · 바디스캔",
    description:
      "발끝부터 머리까지 몸의 감각을 하나씩 지나가며 긴장을 풀어요. 긴 코스가 아니라 다른 종류의 명상이에요.",
    minutes: 20,
    theme: "forest",
    glyph: "🌿",
    tone: "forest",
    tag: "깊은 이완",
    audioUrl: null,
    bgmId: "yoga-relax",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 4,
  },
  {
    id: "c30",
    category: "meditation",
    title: "30분 깊은 명상",
    subtitle: "호흡 · 바디스캔 · 정적",
    description:
      "10분 호흡, 15분 바디스캔, 5분의 정적. 아이들이 잠든 밤, 한 번쯤 길게 앉아보고 싶은 날을 위한 코스예요.",
    minutes: 30,
    theme: "forest",
    glyph: "🌲",
    tone: "forest",
    tag: "긴 호흡",
    audioUrl: null,
    bgmId: "summer-rain",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 5,
  },

  /* ------------------------------ 시각화 · 아침 ------------------------------ */
  {
    id: "vis-dawn",
    category: "visualization",
    group: "morning",
    title: "아침의 첫 빛",
    subtitle: "눈뜨자마자 5분",
    description:
      "이불 속에서 눈을 감은 채, 창으로 들어오는 첫 빛을 몸에 천천히 부어요. 오늘의 나를 먼저 만나는 5분.",
    minutes: 5,
    theme: "lake",
    glyph: "🌅",
    tone: "lake",
    tag: "아침",
    audioUrl: null,
    bgmId: "morning-meditation",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: true,
    sortOrder: 10,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "잠에서 깬 몸에 빛을 채우고, 오늘 하루의 중심을 한 문장으로 정한다.",
      steps: [
        { at: 0, label: "눈을 감아요", line: "눈을 감고, 아직 이불 속에 있다고 생각해요. 몸이 깨어나는 소리를 들어봐요." },
        { at: 45, label: "빛이 들어와요", line: "창문 틈으로 아침 빛이 들어옵니다. 그 빛을 이마에 살짝 얹어봐요." },
        { at: 90, label: "빛이 내려가요", line: "빛이 얼굴을 지나 목덜미, 어깨로 천천히 내려갑니다. 어깨가 조금 내려가요." },
        { at: 165, label: "숨을 세 번", line: "들이쉬며 빛을 마시고, 내쉬며 어젯밤의 피로를 내보내요. 세 번만." },
        { at: 225, label: "오늘의 한 문장", line: "오늘 하루, 나는 ___ 하겠다고 조용히 정해봐요. 한 가지면 충분해요." },
        { at: 285, label: "눈을 떠요", line: "손끝과 발끝을 조금 움직이고, 천천히 눈을 떠요. 오늘도 여기까지 왔어요." },
      ],
    },
  },
  {
    id: "vis-light",
    category: "visualization",
    group: "morning",
    title: "빛의 호수",
    subtitle: "빛으로 채우는 몸",
    description:
      "머리끝으로 스며든 따뜻한 빛이 어깨와 가슴을 지나 발끝까지 천천히 내려가는 장면을 그려봐요. 무거운 곳에 빛을 머물게 해요.",
    minutes: 8,
    theme: "lake",
    glyph: "✨",
    tone: "lake",
    tag: "아침",
    audioUrl: null,
    bgmId: "interstellar-light",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: true,
    sortOrder: 11,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "몸의 무거운 곳을 찾아 빛으로 채우고, 그 감각을 하루로 가져간다.",
      steps: [
        { at: 0, label: "호수의 수면", line: "잔잔한 호수 위에 서 있다고 생각해요. 발밑이 물처럼 부드러워요." },
        { at: 70, label: "머리끝의 빛", line: "정수리에 따뜻한 빛 한 줄기가 닿아요. 머리 안이 환해집니다." },
        { at: 150, label: "어깨로", line: "빛이 어깨로 흘러내려요. 굳어 있던 어깨가 빛을 머금고 풀립니다." },
        { at: 250, label: "가슴과 배", line: "가슴을 지나 배까지. 오늘 마음이 조여 있던 곳에 빛을 조금 더 머물게 해요." },
        { at: 370, label: "발끝까지", line: "빛이 허벅지, 무릎, 발끝까지 내려가요. 발끝이 따뜻해집니다." },
        { at: 450, label: "돌아오기", line: "빛이 몸 전체를 감싸고 있어요. 이 감각을 기억한 채로 숨을 세 번 쉬어요." },
      ],
    },
  },
  {
    id: "vis-window",
    category: "visualization",
    group: "morning",
    title: "창가의 아침",
    subtitle: "커피 한 잔의 7분",
    description:
      "창가에 앉아 세상이 하나씩 움직이기 시작하는 걸 지켜봐요. 서두르지 않고, 오늘의 속도를 정하는 7분.",
    minutes: 7,
    theme: "forest",
    glyph: "🌤️",
    tone: "forest",
    tag: "아침",
    audioUrl: null,
    bgmId: "yoga-relax",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 12,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "아침의 소리를 듣고 오늘의 속도를 스스로 정한다.",
      steps: [
        { at: 0, label: "창가에 앉아요", line: "창가에 앉아 따뜻한 잔을 손에 쥐었다고 생각해요. 손바닥의 온기를 느껴요." },
        { at: 60, label: "바깥의 소리", line: "창밖의 소리를 하나씩 세어봐요. 새소리, 발소리, 멀리 지나가는 차." },
        { at: 150, label: "빛의 각도", line: "빛이 방 안으로 들어오는 각도를 눈으로 그려봐요. 천천히 움직이고 있어요." },
        { at: 250, label: "오늘의 속도", line: "오늘 나는 어떤 속도로 살고 싶은지 물어봐요. 빠르게, 또는 조금 느리게." },
        { at: 370, label: "첫 모금", line: "잔을 한 모금 마신다고 생각하며, 오늘의 첫 장면을 마음에 담아요." },
      ],
    },
  },

  /* ----------------------------- 시각화 · 비우기 ----------------------------- */
  {
    id: "vis",
    category: "visualization",
    group: "release",
    title: "안전한 방",
    subtitle: "나만의 안전한 방",
    description:
      "눈을 감고 나만의 안전한 방을 그려봐요. 문을 닫고, 조명을 고르고, 숨을 고르는 시간.",
    minutes: 10,
    theme: "night",
    glyph: "🌙",
    tone: "night",
    tag: "비우기",
    audioUrl: null,
    bgmId: "rain-solace",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: true,
    sortOrder: 20,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "문을 닫은 안전한 공간을 만들어, 오늘의 긴장을 잠시 내려놓는다.",
      steps: [
        { at: 0, label: "문 앞에 서요", line: "내 방의 문 앞에 서 있다고 생각해요. 손잡이를 잡고 천천히 열어요." },
        { at: 75, label: "문을 닫아요", line: "들어가서 문을 닫아요. 이 안에서는 아무도 나를 부르지 않아요." },
        { at: 165, label: "조명을 골라요", line: "방의 빛을 골라봐요. 따뜻한 등, 작은 촛불, 혹은 달빛." },
        { at: 260, label: "바닥에 앉아요", line: "가장 편한 자리에 앉아요. 등이 기대는 느낌, 바닥의 온기를 느껴요." },
        { at: 360, label: "오늘의 무게", line: "오늘 하루 가장 무거웠던 것 하나를 떠올리고, 옆에 내려놓아요." },
        { at: 480, label: "숨을 고르고", line: "방 안의 공기를 한 번 깊게 마셔요. 이 방은 언제든 다시 열 수 있어요." },
        { at: 555, label: "문을 열어요", line: "조금 가벼워진 몸으로 문을 열고 나와요. 오늘 할 수 있는 만큼만." },
      ],
    },
  },
  {
    id: "vis-river",
    category: "visualization",
    group: "release",
    title: "흘려보내는 강",
    subtitle: "생각을 물에 띄워 보내기",
    description:
      "떠오르는 생각을 나뭇잎에 하나씩 얹어 강물에 띄워요. 붙잡지 않고, 밀어내지도 않고, 그냥 흘러가게.",
    minutes: 10,
    theme: "forest",
    glyph: "🍃",
    tone: "forest",
    tag: "비우기",
    audioUrl: null,
    bgmId: "shamanic-forest",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 21,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "생각을 판단하지 않고 흘려보내는 연습.",
      steps: [
        { at: 0, label: "강가에 서요", line: "맑은 강가에 서 있다고 생각해요. 물소리가 가까워요." },
        { at: 80, label: "나뭇잎 하나", line: "손에 나뭇잎 하나를 들었어요. 오늘 가장 자주 떠오른 생각을 얹어봐요." },
        { at: 170, label: "물에 띄워요", line: "나뭇잎을 물에 조용히 내려놓아요. 잠깐 떠 있다가 흘러가요." },
        { at: 280, label: "하나 더", line: "다음 생각이 오면 또 하나 얹어요. 미움도 걱정도 그대로 실어 보내요." },
        { at: 400, label: "강을 바라봐요", line: "강은 멈추지 않고 흐르고, 나는 강가에 서 있어요. 그것만으로 충분해요." },
        { at: 520, label: "손을 씻어요", line: "물에 손을 담갔다가 꺼내요. 오늘은 여기까지 흘려보내요." },
      ],
    },
  },
  {
    id: "vis-basket",
    category: "visualization",
    group: "release",
    title: "비우는 바구니",
    subtitle: "오늘 안고 있던 것 내려놓기",
    description:
      "하루 동안 안고 있던 것들을 바구니에 담아요. 바구니는 내가 원할 때 열어볼 수 있어요. 지금은 잠깐 내려두는 것.",
    minutes: 8,
    theme: "night",
    glyph: "🧺",
    tone: "night",
    tag: "비우기",
    audioUrl: null,
    bgmId: "tibetan-bowls",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 22,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "해야 할 일과 감정을 눈에 보이는 바구니에 담아 잠시 내려놓는다.",
      steps: [
        { at: 0, label: "바구니 준비", line: "앞에 커다란 바구니가 하나 있다고 생각해요. 뚜껑은 열려 있어요." },
        { at: 80, label: "해야 할 일", line: "오늘 해야 한다고 마음에 걸린 일들을 하나씩 담아요. 전부 다." },
        { at: 190, label: "사람들", line: "걱정되는 사람, 신경 쓰이는 말도 담아요. 판단하지 않고 담기만 해요." },
        { at: 300, label: "내 감정", line: "서운함, 미안함, 지침도 담아요. 무거운 것일수록 바구니가 잘 받아줘요." },
        { at: 400, label: "뚜껑을 덮어요", line: "바구니 뚜껑을 덮고, 한 발짝 뒤로 물러나요. 지금은 내려놓아도 괜찮아요." },
        { at: 480, label: "빈손", line: "두 손이 가벼워졌어요. 이 가벼움을 오늘 하나 기억해 두기로 해요." },
      ],
    },
  },

  /* ------------------------------ 시각화 · 소망 ------------------------------ */
  {
    id: "vis-garden",
    category: "visualization",
    group: "wish",
    title: "내면의 정원",
    subtitle: "마음속 정원을 거닐기",
    description:
      "문을 열면 내가 가꾼 정원이 있어요. 오늘 마음에 필요한 나무 한 그루를 심고, 그 그늘에 잠깐 앉아봐요.",
    minutes: 12,
    theme: "forest",
    glyph: "🌷",
    tone: "forest",
    tag: "소망",
    audioUrl: null,
    bgmId: "hang-flute",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: true,
    sortOrder: 30,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "지금 마음에 필요한 것을 나무 한 그루로 심고, 자라는 모습을 상상한다.",
      steps: [
        { at: 0, label: "정원의 문", line: "정원 문을 열면, 내가 가꾼 길이 보여요. 흙 냄새를 한 번 들이마셔요." },
        { at: 90, label: "지금의 마음", line: "오늘 내 마음에 가장 필요한 게 무엇인지 물어봐요. 쉼, 용기, 혹은 기다림." },
        { at: 210, label: "나무 고르기", line: "그 마음과 닮은 나무를 골라요. 작은 묘목일 수도, 오래된 나무일 수도 있어요." },
        { at: 330, label: "심어요", line: "흙을 파고 나무를 심어요. 뿌리를 흙에 펼치고, 물을 천천히 부어요." },
        { at: 470, label: "그늘에 앉아요", line: "나무 그늘에 앉아요. 잎이 자라는 소리를 상상해 봐요." },
        { at: 610, label: "자라는 시간", line: "이 나무는 내가 재촉하지 않아도 자라요. 오늘 심은 것으로 충분해요." },
        { at: 700, label: "문을 닫고", line: "정원 문을 닫고 돌아와요. 필요할 때 다시 올 수 있어요." },
      ],
    },
  },
  {
    id: "vis-seed",
    category: "visualization",
    group: "wish",
    title: "소망의 씨앗",
    subtitle: "이루어진 하루를 미리 살아보기",
    description:
      "이루고 싶은 일이 이미 이루어진 아침을 그려봐요. 그 아침의 공기, 표정, 첫 마디 말까지.",
    minutes: 10,
    theme: "lake",
    glyph: "🌱",
    tone: "lake",
    tag: "소망",
    audioUrl: null,
    bgmId: "hang-flute",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 31,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "소망이 이루어진 뒤의 구체적인 장면을 감각으로 먼저 경험한다.",
      steps: [
        { at: 0, label: "씨앗 하나", line: "손바닥에 작은 씨앗 하나를 올려봐요. 아직 아무것도 아니지만, 전부를 담고 있어요." },
        { at: 80, label: "이루어진 아침", line: "그 소망이 이루어진 날의 아침을 그려봐요. 어디에서 눈을 떴나요?" },
        { at: 190, label: "첫 마디", line: "그 아침 가장 먼저 하는 말은 무엇인가요? 소리 내어 말해봐도 좋아요." },
        { at: 300, label: "몸의 감각", line: "그때 어깨는 어떤가요? 가슴은? 몸이 먼저 기억하게 해요." },
        { at: 420, label: "누구와 함께", line: "그 장면에 함께 있는 사람을 떠올려요. 그 사람의 얼굴을 봐요." },
        { at: 540, label: "돌아와서", line: "그 감각을 가슴에 두고, 오늘 할 수 있는 아주 작은 한 걸음을 정해요." },
      ],
    },
  },
  {
    id: "vis-future",
    category: "visualization",
    group: "wish",
    title: "미래의 나를 만나기",
    subtitle: "1년 뒤의 나와 대화하기",
    description:
      "1년 뒤의 내가 지금의 나를 기다리고 있어요. 그 사람은 무엇을 하고, 무엇을 내려놓았을까요.",
    minutes: 12,
    theme: "night",
    glyph: "🪞",
    tone: "night",
    tag: "소망",
    audioUrl: null,
    bgmId: "cosmic-exploration",
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 32,
    guide: {
      narrator: "인유 가이드 · 은솔",
      intent: "미래의 자기와 대화하며 지금의 선택을 스스로 격려한다.",
      steps: [
        { at: 0, label: "길의 끝", line: "긴 복도 끝에 문이 하나 있어요. 그 문 너머에 1년 뒤의 내가 있어요." },
        { at: 90, label: "문을 열면", line: "문을 열면, 조금 더 편안한 표정의 내가 서 있어요. 천천히 그 얼굴을 봐요." },
        { at: 210, label: "그 사람의 하루", line: "그 사람은 아침에 무엇을 하고, 저녁에 무엇을 할까요? 하루를 그려봐요." },
        { at: 330, label: "내려놓은 것", line: "그 사람이 더 이상 하지 않는 일은 무엇일까요? 무엇을 내려놓았을까요." },
        { at: 450, label: "질문 하나", line: "지금의 내가 그 사람에게 묻고 싶은 것 하나를 조용히 물어봐요." },
        { at: 570, label: "대답을 들어요", line: "그 사람의 대답을 서두르지 않고 들어요. 짧아도 괜찮아요." },
        { at: 680, label: "손을 잡고", line: "그 사람이 내 손을 잡아줘요. '천천히 와도 돼'라고 말해요." },
      ],
    },
  },
];

export const DEFAULT_COURSE_ID = "c10";

export function courseById(id: string | null | undefined): Course {
  return COURSES.find((c) => c.id === id) ?? COURSES[0];
}

/** Recommends a course for the current hour, following the blueprint's rhythm. */
export function recommendForHour(hour: number): {
  course: Course;
  kicker: string;
} {
  if (hour < 9) return { course: courseById("vis-dawn"), kicker: "하루를 여는" };
  if (hour < 15) return { course: courseById("c10"), kicker: "잠깐 멈추는" };
  if (hour < 20) return { course: courseById("c20"), kicker: "저녁에 어울리는" };
  if (hour < 23) return { course: courseById("vis"), kicker: "하루를 내려놓는" };
  return { course: courseById("sleep"), kicker: "잠들기 전" };
}

/* ------------------------------- pricing ------------------------------- */

export const COUNSELING_LENGTHS = [3, 5, 10] as const;
export type CounselingLength = (typeof COUNSELING_LENGTHS)[number];

export const PRICES: Record<number, number> = {
  3: 3900,
  5: 5900,
  10: 9900,
};

export const LENGTH_HINTS: Record<number, string> = {
  3: "한숨 돌리기",
  5: "한 가지 고민",
  10: "차분히 정리",
};

export const LENGTH_PROTOCOLS: Record<
  number,
  { title: string; steps: string[] }
> = {
  3: {
    title: "3분 프로토콜",
    steps: [
      "지금 가장 무거운 것 한 가지를 묻고 끝까지 듣기",
      "사실과 감정을 구분해 짚어주기",
      "오늘 할 수 있는 한 가지를 함께 정하기",
    ],
  },
  5: {
    title: "5분 프로토콜",
    steps: [
      "가장 무거운 것 한 가지를 묻고 듣기",
      "사실과 감정을 구분한 뒤 “그때 나는 무엇을 원했나” 묻기",
      "오늘 할 수 있는 한 가지를 함께 정하기",
    ],
  },
  10: {
    title: "10분 프로토콜",
    steps: [
      "최근 7일 일기 요약을 함께 보며 시작",
      "반복되는 패턴 한 가지를 짚기",
      "사실·감정·욕구를 정리하고 다음 한 걸음을 정하기",
    ],
  },
};

/** Toss Payments card fee: 3.4% + VAT 10% → effective 3.74%. */
export const CARD_FEE_RATE = 0.034;
export const VAT_RATE = 0.1;

export function payoutFor(price: number) {
  const fee = price * CARD_FEE_RATE;
  const vat = fee * VAT_RATE;
  const net = Math.round(price - fee - vat);
  return { price, fee: Math.round(fee), vat: Math.round(vat), net };
}

export const PAYMENT_METHODS: {
  id: PaymentMethodId;
  label: string;
  sub: string;
  tossMethod: "CARD" | "TRANSFER" | "EASY_PAY";
}[] = [
  { id: "card", label: "신용·체크카드", sub: "토스페이먼츠", tossMethod: "CARD" },
  { id: "transfer", label: "계좌이체", sub: "실시간 이체", tossMethod: "TRANSFER" },
  { id: "easypay", label: "간편결제", sub: "카카오·네이버페이", tossMethod: "EASY_PAY" },
];

/* -------------------------------- slots -------------------------------- */

export const SLOT_MINUTES = 10;
export const SLOT_BUFFER_MINUTES = 5;
export const DAILY_SESSION_CAP = 6;
export const FREE_CANCELLATION_HOURS = 1;

export const SLOT_TIMES = [
  "20:00",
  "20:10",
  "20:20",
  "20:40",
  "21:00",
  "21:10",
  "21:30",
  "22:00",
] as const;

/** Slots the prototype starts with closed, so the grid looks alive on first run. */
export const DEFAULT_CLOSED_SLOTS_TODAY = ["20:10", "21:30", "22:00"];
export const DEFAULT_CLOSED_SLOTS_TOMORROW = ["20:40", "22:00"];

/* -------------------------------- legal -------------------------------- */

export const CRISIS_LINES = [
  { label: "자살예방상담", number: "109" },
  { label: "정신건강 위기상담", number: "1577-0199" },
];

export const LISTENING_DISCLAIMER =
  "인유의 1:1 마이크로 상담은 의료 행위가 아닌 리스닝(경청) 서비스입니다. 심리상담·치료·진단을 제공하지 않으며, 위기 상황에서는 109 또는 1577-0199에 연락해 주세요.";

/** Commerce information required by Korean e-commerce law — fill before launch. */
export const COMMERCE_INFO = {
  brand: "인유",
  company: "[상호 입력 — 개인사업자 등록 후]",
  representative: "최은솔",
  businessNumber: "[사업자등록번호 입력]",
  mailOrderNumber: "[통신판매업 신고번호 입력 — 면제 시 ‘면제’ 표기]",
  address: "[사업장 주소 입력]",
  contact: "[대표 전화번호 입력]",
  email: "[문의 이메일 입력]",
  privacyOfficer: "[개인정보 보호책임자 성명 입력]",
} as const;

export const SUPPORT_EMAIL = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "";

/**
 * 1:1 상담은 외부 예약 페이지로 연결한다.
 * Vercel 환경변수 NEXT_PUBLIC_COUNSELING_URL 하나만 바꾸면 앱 전체 버튼이 그 주소로 열린다.
 */
export const COUNSELING_URL = process.env.NEXT_PUBLIC_COUNSELING_URL ?? "";
