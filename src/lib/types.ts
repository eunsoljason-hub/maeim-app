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

export interface Course {
  /** Stable identifier used in URLs and the database seed. */
  id: "c10" | "c20" | "vis" | "sleep";
  title: string;
  subtitle: string;
  description: string;
  minutes: number;
  theme: ThemeId;
  glyph: string;
  tone: "lake" | "forest" | "night";
  tag: string;
  /** Optional BGM/narration file (R2 signed URL or /audio/*.mp3). */
  audioUrl: string | null;
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
  text: string;
}

export interface PlayRecord {
  id: string;
  userId: string | null;
  courseId: string;
  minutes: number;
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
