export type ThemeId = "forest" | "lake" | "night";

export type MoodId =
  | "calm"
  | "good"
  | "flat"
  | "heavy"
  | "anxious"
  | "angry"
  | "tired"
  | "hope";

export type DiaryMoment = "before" | "after";

export type SlotStatus = "open" | "closed" | "booked";

export type BookingStatus = "pending" | "confirmed" | "cancelled" | "completed";

export type PaymentStatus = "pending" | "paid" | "demo" | "failed" | "cancelled";

export type PaymentMethodId = "card" | "transfer" | "easypay";

/** 명상(호흡·바디스캔·수면·마음챙김)과 시각화(장면·빛·내면 이미지) 두 갈래. */
export type CourseCategory = "meditation" | "visualization";

/** 시각화는 아침 / 비우기 / 소망 세 갈래로 나뉜다. */
export type VisualizationGroup = "morning" | "release" | "wish";

/** 한 줄의 가이드 나레이션. `at`은 코스 시작 후 경과 초. */
export interface GuideStep {
  at: number;
  label: string;
  line: string;
}

/**
 * 시각화 코스의 가이드 스크립트.
 * 지금은 화면 자막으로 쓰고, 녹음한 가이드 음성을 `narrationUrl`에 연결하면
 * 같은 스크립트가 나레이션으로 재생된다.
 */
export interface GuideScript {
  narrator: string;
  intent: string;
  steps: GuideStep[];
}

export interface Course {
  /** Stable identifier used in URLs and the database seed. */
  id: string;
  /** Which of the two listening categories this course belongs to. */
  category: CourseCategory;
  /** Only for visualization courses: 아침 / 비우기 / 소망. */
  group?: VisualizationGroup;
  title: string;
  subtitle: string;
  description: string;
  minutes: number;
  theme: ThemeId;
  glyph: string;
  tone: "lake" | "forest" | "night";
  tag: string;
  /** Optional narration file (R2 signed URL or /audio/guide/*.mp3). */
  audioUrl: string | null;
  /** Default background track id from `lib/data/bgm.ts`. */
  bgmId?: string | null;
  /** Guide narration script shown in the player and used for the voice slot. */
  guide?: GuideScript;
  /** Breathing pattern in seconds: inhale – hold – exhale. */
  breath: { inhale: number; hold: number; exhale: number };
  free: boolean;
  sortOrder: number;
}

export interface DiaryEntry {
  id: string;
  /** Owner id (Supabase auth uid). Null in demo mode. */
  userId: string | null;
  /** Local calendar day, YYYY-MM-DD (Asia/Seoul). */
  date: string;
  /** ISO timestamp. */
  createdAt: string;
  moment: DiaryMoment;
  mood: MoodId;
  intensity: number;
  /** 오늘의 에너지 1~5 (체크인 값). */
  energy?: number;
  /** 어떤 세션을 마치고 남긴 기록인지. */
  sessionLabel?: string;
  /** 마지막으로 고쳐 쓴 시각 (없으면 처음 쓴 기록). */
  editedAt?: string;
  text: string;
}

export interface PlayRecord {
  id: string;
  userId: string | null;
  courseId: string;
  minutes: number;
  /** Exact length for a free-form timer session (분:초 기록용). */
  seconds?: number;
  completedAt: string;
}

export interface Slot {
  /** Demo mode: "YYYY-MM-DD|HH:MM". Supabase mode: uuid. */
  id: string;
  dateKey: string;
  time: string;
  minutes: number;
  status: SlotStatus;
}

export interface Booking {
  id: string;
  slotId: string;
  dateKey: string;
  time: string;
  minutes: number;
  price: number;
  clientName: string;
  /** Client auth id — lets the host attach the right 7-day briefing. */
  clientId: string | null;
  /** True when the booking belongs to the signed-in (or local demo) user. */
  mine: boolean;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentKey: string | null;
  orderId: string | null;
  /** Listening-service consent (mandatory at checkout). */
  consentListening: boolean;
  /** Consent to share the 7-day mood briefing with the host. */
  consentBriefing: boolean;
  createdAt: string;
}

export interface CounselingNote {
  id: string;
  bookingId: string;
  /** Three-line session summary. */
  line1: string;
  line2: string;
  line3: string;
  nextStep: string;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  name: string;
  handle: string;
  role: "client" | "host";
  avatarUrl: string | null;
}

export interface Snapshot {
  diaries: DiaryEntry[];
  plays: PlayRecord[];
  slots: Slot[];
  bookings: Booking[];
  notes: CounselingNote[];
}

export interface WeeklyBriefing {
  totalEntries: number;
  activeDays: number;
  dominantMood: MoodId | null;
  dominantCount: number;
  averageIntensity: number;
  beforeCount: number;
  afterCount: number;
  /** Average intensity of "before" entries minus "after" entries (positive = calmer). */
  shift: number | null;
  topWords: string[];
  /** Human readable summary lines for the host card. */
  lines: string[];
}

export interface PaymentSummary {
  minutes: number;
  price: number;
  fee: number;
  vat: number;
  net: number;
}
