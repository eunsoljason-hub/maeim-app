import type { SupabaseClient } from "@supabase/supabase-js";
import { dateKeyOfOffset } from "../date";
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
import {
  type DataSource,
  type NewBookingInput,
  type NewDiaryInput,
  type NewNoteInput,
} from "./source";

type Row = Record<string, unknown>;

const SEOUL_FORMAT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** Splits a timestamptz into the Korean calendar day and HH:MM slot label. */
export function seoulDateTime(iso: string) {
  const parts = SEOUL_FORMAT.formatToParts(new Date(iso));
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? "";
  const hour = get("hour") === "24" ? "00" : get("hour");
  return {
    dateKey: `${get("year")}-${get("month")}-${get("day")}`,
    time: `${hour}:${get("minute")}`,
  };
}

function toIso(dateKey: string, time: string) {
  // Korea has no DST; the service operates on Asia/Seoul only.
  return `${dateKey}T${time}:00+09:00`;
}

function asDiary(row: Row): DiaryEntry {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    date: String(row.date),
    createdAt: String(row.created_at ?? new Date().toISOString()),
    moment: row.moment === "after" ? "after" : ("before" as DiaryMoment),
    mood: String(row.mood) as MoodId,
    intensity: Number(row.intensity ?? 3),
    text: String(row.text ?? ""),
  };
}

function asPlay(row: Row): PlayRecord {
  return {
    id: String(row.id),
    userId: (row.user_id as string | null) ?? null,
    courseId: String(row.course_id),
    minutes: Number(row.minutes ?? 0),
    completedAt: String(row.completed_at ?? new Date().toISOString()),
  };
}

function asSlot(row: Row): Slot {
  const { dateKey, time } = seoulDateTime(String(row.starts_at));
  return {
    id: String(row.id),
    dateKey,
    time,
    minutes: Number(row.minutes ?? 10),
    status: (row.status as SlotStatus) ?? "open",
  };
}

function asBooking(row: Row, userId: string): Booking {
  const { dateKey, time } = seoulDateTime(String(row.starts_at));
  return {
    id: String(row.id),
    slotId: String(row.slot_id ?? ""),
    dateKey,
    time,
    minutes: Number(row.minutes ?? 3),
    price: Number(row.price ?? 0),
    clientName: String(row.client_name ?? "고객"),
    clientId: (row.client_id as string | null) ?? null,
    mine: row.client_id === userId,
    status: (row.status as Booking["status"]) ?? "pending",
    paymentStatus: (row.payment_status as Booking["paymentStatus"]) ?? "pending",
    paymentKey: (row.payment_key as string | null) ?? null,
    orderId: (row.order_id as string | null) ?? null,
    consentListening: Boolean(row.consent_listening),
    consentBriefing: Boolean(row.consent_briefing),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function asNote(row: Row): CounselingNote {
  return {
    id: String(row.id),
    bookingId: String(row.booking_id),
    line1: String(row.line1 ?? ""),
    line2: String(row.line2 ?? ""),
    line3: String(row.line3 ?? ""),
    nextStep: String(row.next_step ?? ""),
    createdAt: String(row.created_at ?? new Date().toISOString()),
  };
}

function fail(context: string, error: { message?: string } | null): never {
  throw new Error(`${context}: ${error?.message ?? "알 수 없는 오류"}`);
}

/**
 * Supabase-backed adapter. Row Level Security decides what a client and the
 * host can see; this class only maps rows to the app's types.
 */
export class SupabaseDataSource implements DataSource {
  readonly mode = "supabase" as const;

  constructor(
    private readonly client: SupabaseClient,
    private readonly userId: string,
  ) {}

  async load(): Promise<Snapshot> {
    const today = dateKeyOfOffset(0);
    const horizon = dateKeyOfOffset(7);
    const fromIso = toIso(today, "00:00");
    const toIsoDate = toIso(horizon, "23:59");

    const [diaries, plays, slots, bookings, notes] = await Promise.all([
      this.client
        .from("diaries")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(400),
      this.client
        .from("plays")
        .select("*")
        .order("completed_at", { ascending: false })
        .limit(400),
      this.client
        .from("slots")
        .select("*")
        .gte("starts_at", fromIso)
        .lte("starts_at", toIsoDate)
        .order("starts_at", { ascending: true }),
      this.client
        .from("bookings")
        .select("*")
        .order("starts_at", { ascending: true }),
      this.client
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false }),
    ]);

    if (diaries.error) fail("일기를 불러오지 못했어요", diaries.error);
    if (plays.error) fail("명상 기록을 불러오지 못했어요", plays.error);
    if (slots.error) fail("슬롯을 불러오지 못했어요", slots.error);
    if (bookings.error) fail("예약을 불러오지 못했어요", bookings.error);
    if (notes.error) fail("상담 노트를 불러오지 못했어요", notes.error);

    return {
      diaries: (diaries.data ?? []).map((row) => asDiary(row as Row)),
      plays: (plays.data ?? []).map((row) => asPlay(row as Row)),
      slots: (slots.data ?? []).map((row) => asSlot(row as Row)),
      bookings: (bookings.data ?? []).map((row) => asBooking(row as Row, this.userId)),
      notes: (notes.data ?? []).map((row) => asNote(row as Row)),
    };
  }

  async addDiary(input: NewDiaryInput): Promise<DiaryEntry> {
    const { data, error } = await this.client
      .from("diaries")
      .insert({
        user_id: this.userId,
        date: input.date,
        moment: input.moment,
        mood: input.mood,
        intensity: input.intensity,
        text: input.text,
      })
      .select("*")
      .single();
    if (error || !data) fail("일기를 저장하지 못했어요", error);
    return asDiary(data as Row);
  }

  async deleteDiary(id: string): Promise<void> {
    const { error } = await this.client.from("diaries").delete().eq("id", id);
    if (error) fail("일기를 삭제하지 못했어요", error);
  }

  async addPlay(courseId: string, minutes: number, _seconds?: number): Promise<PlayRecord> {
    const { data, error } = await this.client
      .from("plays")
      .insert({
        user_id: this.userId,
        course_id: courseId,
        minutes,
      })
      .select("*")
      .single();
    if (error || !data) fail("명상 기록을 저장하지 못했어요", error);
    return asPlay(data as Row);
  }

  async setSlotStatus(
    slot: Pick<Slot, "id" | "dateKey" | "time" | "minutes">,
    status: SlotStatus,
  ): Promise<void> {
    const { data, error } = await this.client
      .from("slots")
      .upsert(
        {
          host_id: this.userId,
          starts_at: toIso(slot.dateKey, slot.time),
          minutes: slot.minutes ?? 10,
          status,
        },
        { onConflict: "host_id,starts_at" },
      )
      .select("id")
      .single();
    if (error) fail("슬롯을 변경하지 못했어요", error);
    // The caller keeps its optimistic id; the next load() reconciles it with the uuid.
    void data;
  }

  async createBooking(input: NewBookingInput): Promise<Booking> {
    const { data, error } = await this.client
      .from("bookings")
      .insert({
        slot_id: input.slotId,
        client_id: this.userId,
        client_name: input.clientName,
        starts_at: toIso(input.dateKey, input.time),
        minutes: input.minutes,
        price: input.price,
        status: input.status,
        payment_status: input.paymentStatus,
        payment_key: input.paymentKey,
        order_id: input.orderId,
        consent_listening: input.consentListening,
        consent_briefing: input.consentBriefing,
      })
      .select("*")
      .single();
    if (error || !data) fail("예약을 만들지 못했어요", error);
    return asBooking(data as Row, this.userId);
  }

  async updateBooking(id: string, patch: Partial<Booking>): Promise<void> {
    const update: Row = {};
    if (patch.status) update.status = patch.status;
    if (patch.paymentStatus) update.payment_status = patch.paymentStatus;
    if (patch.paymentKey !== undefined) update.payment_key = patch.paymentKey;
    if (patch.orderId !== undefined) update.order_id = patch.orderId;
    if (patch.consentBriefing !== undefined) {
      update.consent_briefing = patch.consentBriefing;
    }
    const { error } = await this.client
      .from("bookings")
      .update(update)
      .eq("id", id);
    if (error) fail("예약을 변경하지 못했어요", error);
  }

  async saveNote(input: NewNoteInput): Promise<CounselingNote> {
    const { data, error } = await this.client
      .from("notes")
      .upsert(
        {
          booking_id: input.bookingId,
          host_id: this.userId,
          line1: input.line1,
          line2: input.line2,
          line3: input.line3,
          next_step: input.nextStep,
        },
        { onConflict: "booking_id" },
      )
      .select("*")
      .single();
    if (error || !data) fail("상담 노트를 저장하지 못했어요", error);
    return asNote(data as Row);
  }
}

