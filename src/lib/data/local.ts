import { SLOT_MINUTES } from "../constants";
import {
  buildDefaultSlots,
  readJson,
  STORAGE_KEY,
  writeJson,
} from "../storage";
import type {
  Booking,
  CounselingNote,
  DiaryEntry,
  PlayRecord,
  Slot,
  SlotStatus,
  Snapshot,
} from "../types";
import {
  newId,
  type DataSource,
  type NewBookingInput,
  type NewDiaryInput,
  type NewNoteInput,
} from "./source";

interface LocalSnapshot extends Snapshot {}

function emptySnapshot(): LocalSnapshot {
  return {
    diaries: [],
    plays: [],
    slots: buildDefaultSlots(),
    bookings: [],
    notes: [],
  };
}

function isBookingStatus(value: unknown): value is Booking["status"] {
  return (
    value === "pending" ||
    value === "confirmed" ||
    value === "cancelled" ||
    value === "completed"
  );
}

function isPaymentStatus(value: unknown): value is Booking["paymentStatus"] {
  return (
    value === "pending" ||
    value === "paid" ||
    value === "demo" ||
    value === "failed" ||
    value === "cancelled"
  );
}

function normalize(raw: unknown): LocalSnapshot {
  const base = emptySnapshot();
  if (!raw || typeof raw !== "object") return base;
  const value = raw as Partial<LocalSnapshot>;

  const diaries = Array.isArray(value.diaries)
    ? value.diaries.filter(
        (entry): entry is DiaryEntry =>
          !!entry &&
          typeof entry.id === "string" &&
          typeof entry.date === "string" &&
          typeof entry.mood === "string" &&
          typeof entry.text === "string",
      )
    : [];

  const plays = Array.isArray(value.plays)
    ? value.plays.filter(
        (play): play is PlayRecord =>
          !!play && typeof play.id === "string" && typeof play.courseId === "string",
      )
    : [];

  const slots = Array.isArray(value.slots) && value.slots.length
    ? value.slots.filter(
        (slot): slot is Slot =>
          !!slot &&
          typeof slot.id === "string" &&
          typeof slot.dateKey === "string" &&
          typeof slot.time === "string",
      )
    : base.slots;

  const bookings = Array.isArray(value.bookings)
    ? value.bookings
        .filter(
          (booking): booking is Booking =>
            !!booking &&
            typeof booking.id === "string" &&
            typeof booking.dateKey === "string" &&
            typeof booking.time === "string" &&
            isBookingStatus(booking.status) &&
            isPaymentStatus(booking.paymentStatus),
        )
        .map((booking) => ({
          ...booking,
          clientId: booking.clientId ?? null,
        }))
    : [];

  const notes = Array.isArray(value.notes)
    ? value.notes.filter(
        (note): note is CounselingNote =>
          !!note && typeof note.id === "string" && typeof note.bookingId === "string",
      )
    : [];

  return { diaries, plays, slots, bookings, notes };
}

/**
 * Demo/local adapter: everything stays on this device (localStorage).
 * No account, no server, no payment — the app is fully testable offline.
 */
export class LocalDataSource implements DataSource {
  readonly mode = "demo" as const;
  private snapshot: LocalSnapshot;
  private loaded = false;

  constructor() {
    this.snapshot = emptySnapshot();
  }

  private ensureSlots() {
    const known = new Set(this.snapshot.slots.map((s) => s.id));
    for (const slot of buildDefaultSlots()) {
      if (!known.has(slot.id)) this.snapshot.slots.push(slot);
    }
  }

  private persist() {
    writeJson(STORAGE_KEY, this.snapshot);
  }

  async load(): Promise<Snapshot> {
    if (!this.loaded) {
      this.snapshot = normalize(readJson<unknown>(STORAGE_KEY, null));
      this.loaded = true;
    }
    this.ensureSlots();
    this.persist();
    return structuredClone(this.snapshot);
  }

  async addDiary(input: NewDiaryInput): Promise<DiaryEntry> {
    const entry: DiaryEntry = {
      id: newId(),
      userId: null,
      date: input.date,
      createdAt: new Date().toISOString(),
      moment: input.moment,
      mood: input.mood,
      intensity: input.intensity,
      text: input.text,
    };
    await this.load();
    this.snapshot.diaries.push(entry);
    this.persist();
    return entry;
  }

  async deleteDiary(id: string): Promise<void> {
    await this.load();
    this.snapshot.diaries = this.snapshot.diaries.filter((d) => d.id !== id);
    this.persist();
  }

  async addPlay(courseId: string, minutes: number): Promise<PlayRecord> {
    const play: PlayRecord = {
      id: newId(),
      userId: null,
      courseId,
      minutes,
      completedAt: new Date().toISOString(),
    };
    await this.load();
    this.snapshot.plays.push(play);
    this.persist();
    return play;
  }

  async setSlotStatus(
    slot: Pick<Slot, "id" | "dateKey" | "time" | "minutes">,
    status: SlotStatus,
  ): Promise<void> {
    await this.load();
    const existing = this.snapshot.slots.find((s) => s.id === slot.id);
    if (existing) {
      existing.status = status;
    } else {
      this.snapshot.slots.push({
        id: slot.id,
        dateKey: slot.dateKey,
        time: slot.time,
        minutes: slot.minutes ?? SLOT_MINUTES,
        status,
      });
    }
    this.persist();
  }

  async createBooking(input: NewBookingInput): Promise<Booking> {
    await this.load();
    const booking: Booking = {
      id: newId(),
      slotId: input.slotId,
      dateKey: input.dateKey,
      time: input.time,
      minutes: input.minutes,
      price: input.price,
      clientName: input.clientName,
      clientId: null,
      mine: true,
      status: input.status,
      paymentStatus: input.paymentStatus,
      paymentKey: input.paymentKey,
      orderId: input.orderId,
      consentListening: input.consentListening,
      consentBriefing: input.consentBriefing,
      createdAt: new Date().toISOString(),
    };
    this.snapshot.bookings.push(booking);
    this.persist();
    return booking;
  }

  async updateBooking(id: string, patch: Partial<Booking>): Promise<void> {
    await this.load();
    const booking = this.snapshot.bookings.find((b) => b.id === id);
    if (!booking) return;
    Object.assign(booking, patch);
    this.persist();
  }

  async saveNote(input: NewNoteInput): Promise<CounselingNote> {
    await this.load();
    const note: CounselingNote = {
      id: newId(),
      bookingId: input.bookingId,
      line1: input.line1,
      line2: input.line2,
      line3: input.line3,
      nextStep: input.nextStep,
      createdAt: new Date().toISOString(),
    };
    this.snapshot.notes = [
      ...this.snapshot.notes.filter((n) => n.bookingId !== input.bookingId),
      note,
    ];
    this.persist();
    return note;
  }
}
