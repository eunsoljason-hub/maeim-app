import type { Course, CourseCategory, MoodId, PaymentMethodId, ThemeId } from "./types";

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
export const COURSE_CATEGORIES: {
  id: CourseCategory;
  label: string;
  description: string;
}[] = [
  { id: "meditation", label: "명상", description: "호흡 · 바디스캔 · 수면 · 마음챙김" },
  { id: "visualization", label: "시각화", description: "장면 · 빛 · 내면의 이미지" },
];

export function coursesByCategory(category: CourseCategory): Course[] {
  return COURSES.filter((course) => course.category === category);
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
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: true,
    sortOrder: 2,
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
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 3,
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
    breath: { inhale: 4, hold: 7, exhale: 8 },
    free: false,
    sortOrder: 4,
  },
  /* ------------------------------ 시각화 ------------------------------ */
  {
    id: "vis",
    category: "visualization",
    title: "안전한 방",
    subtitle: "나만의 안전한 방",
    description:
      "눈을 감고 나만의 안전한 방을 그려봐요. 문을 닫고, 조명을 고르고, 숨을 고르는 시간.",
    minutes: 10,
    theme: "night",
    glyph: "🌙",
    tone: "night",
    tag: "시각화",
    audioUrl: null,
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 5,
  },
  {
    id: "vis-light",
    category: "visualization",
    title: "빛의 호수",
    subtitle: "빛으로 채우는 몸",
    description:
      "머리끝으로 스며든 따뜻한 빛이 어깨와 가슴을 지나 발끝까지 천천히 내려가는 장면을 그려봐요. 무거운 곳에 빛을 머물게 해요.",
    minutes: 8,
    theme: "lake",
    glyph: "✨",
    tone: "lake",
    tag: "시각화",
    audioUrl: null,
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 6,
  },
  {
    id: "vis-garden",
    category: "visualization",
    title: "내면의 정원",
    subtitle: "마음속 정원을 거닐기",
    description:
      "문을 열면 내가 가꾼 정원이 있어요. 오늘 마음에 필요한 나무 한 그루를 심고, 그 그늘에 잠깐 앉아봐요.",
    minutes: 12,
    theme: "forest",
    glyph: "🌷",
    tone: "forest",
    tag: "시각화",
    audioUrl: null,
    breath: { inhale: 4, hold: 2, exhale: 6 },
    free: false,
    sortOrder: 7,
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
  if (hour < 9) return { course: courseById("c10"), kicker: "하루를 여는" };
  if (hour < 15) return { course: courseById("vis"), kicker: "잠깐 멈추는" };
  if (hour < 20) return { course: courseById("c20"), kicker: "저녁에 어울리는" };
  if (hour < 23) return { course: courseById("c10"), kicker: "하루를 내려놓는" };
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
