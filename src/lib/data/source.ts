import type {
  Booking,
  CounselingNote,
  DiaryEntry,
  DiaryMoment,
  MoodId,
  PlayRecord,
  Slot,
  SlotStatus,
  Snapshot,
} from "../types";

export type StoreMode = "demo" | "supabase";

export interface NewDiaryInput {
  date: string;
  moment: DiaryMoment;
  mood: MoodId;
  intensity: number;
  text: string;
}

export interface NewBookingInput {
  slotId: string;
  dateKey: string;
  time: string;
  minutes: number;
  price: number;
  clientName: string;
  status: Booking["status"];
  paymentStatus: Booking["paymentStatus"];
  consentListening: boolean;
  consentBriefing: boolean;
  orderId: string | null;
  paymentKey: string | null;
}

export interface NewNoteInput {
  bookingId: string;
  line1: string;
  line2: string;
  line3: string;
  nextStep: string;
}

export interface DataSource {
  readonly mode: StoreMode;
  load(): Promise<Snapshot>;
  addDiary(input: NewDiaryInput): Promise<DiaryEntry>;
  deleteDiary(id: string): Promise<void>;
  addPlay(courseId: string, minutes: number): Promise<PlayRecord>;
  setSlotStatus(slot: Pick<Slot, "id" | "dateKey" | "time" | "minutes">, status: SlotStatus): Promise<void>;
  createBooking(input: NewBookingInput): Promise<Booking>;
  updateBooking(id: string, patch: Partial<Booking>): Promise<void>;
  saveNote(input: NewNoteInput): Promise<CounselingNote>;
}

export function newId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `id_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}
