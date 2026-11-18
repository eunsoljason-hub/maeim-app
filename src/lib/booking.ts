import {
  DAILY_SESSION_CAP,
  FREE_CANCELLATION_HOURS,
  PRICES,
  SLOT_BUFFER_MINUTES,
  SLOT_MINUTES,
} from "./constants";
import { hoursUntil, slotDateTime, timeToMinutes } from "./date";
import type { Booking, Slot } from "./types";

export type SlotState =
  | "open"
  | "closed"
  | "booked"
  | "buffer"
  | "past"
  | "cap";

export const SLOT_STATE_LABEL: Record<SlotState, string> = {
  open: "3~10분",
  closed: "닫힘",
  booked: "예약됨",
  buffer: "준비 중",
  past: "지난 시간",
  cap: "마감",
};

export function isActiveBooking(booking: Booking) {
  return booking.status === "pending" || booking.status === "confirmed";
}

export function activeBookings(bookings: Booking[]) {
  return bookings.filter(isActiveBooking);
}

export function bookingsForDate(bookings: Booking[], dateKey: string) {
  return activeBookings(bookings).filter((b) => b.dateKey === dateKey);
}

/** Counts sessions actually held or held-open that day (completed included). */
export function dailySessionCount(bookings: Booking[], dateKey: string) {
  return bookings.filter(
    (b) =>
      b.dateKey === dateKey &&
      (b.status === "pending" ||
        b.status === "confirmed" ||
        b.status === "completed"),
  ).length;
}

export function isDailyCapReached(bookings: Booking[], dateKey: string) {
  return dailySessionCount(bookings, dateKey) >= DAILY_SESSION_CAP;
}

/** End of a booking including the 5-minute buffer kept between sessions. */
export function bookingBlockEnd(booking: Booking) {
  return (
    timeToMinutes(booking.time) + booking.minutes + SLOT_BUFFER_MINUTES
  );
}

export function slotStateFor(
  dateKey: string,
  time: string,
  slots: Slot[],
  bookings: Booking[],
  now: Date = new Date(),
): SlotState {
  const slot = slots.find((s) => s.dateKey === dateKey && s.time === time);
  if (slot?.status === "closed") return "closed";

  const start = timeToMinutes(time);
  const dayBookings = bookingsForDate(bookings, dateKey);

  if (dayBookings.some((b) => timeToMinutes(b.time) === start)) return "booked";

  const inBuffer = dayBookings.some(
    (b) =>
      timeToMinutes(b.time) < start && bookingBlockEnd(b) > start,
  );
  if (inBuffer) return "buffer";

  if (slot?.status === "booked") return "booked";

  if (slotDateTime(dateKey, time).getTime() <= now.getTime()) return "past";

  if (dayBookings.length >= DAILY_SESSION_CAP) return "cap";

  return "open";
}

export function isSlotBookable(state: SlotState) {
  return state === "open";
}

/** Price must come from the server-defined table, never from the client payload. */
export function priceForMinutes(minutes: number) {
  return PRICES[minutes] ?? 0;
}

export function isSupportedLength(minutes: number) {
  return Object.prototype.hasOwnProperty.call(PRICES, minutes);
}

export function canCancelFree(booking: Booking, now: Date = new Date()) {
  if (booking.status !== "pending" && booking.status !== "confirmed") {
    return false;
  }
  return hoursUntil(slotDateTime(booking.dateKey, booking.time), now) >=
    FREE_CANCELLATION_HOURS;
}

export function cancellationDeadline(booking: Booking) {
  const start = slotDateTime(booking.dateKey, booking.time);
  return new Date(start.getTime() - FREE_CANCELLATION_HOURS * 3_600_000);
}

export function dailyRevenue(bookings: Booking[], dateKey: string) {
  return bookings
    .filter(
      (b) =>
        b.dateKey === dateKey &&
        (b.status === "confirmed" || b.status === "completed"),
    )
    .reduce((sum, b) => sum + b.price, 0);
}

/** Reserves a free default slot set when the host has not opened any slots yet. */
export function defaultSlotList(
  dateKey: string,
  times: readonly string[],
  closed: Set<string>,
): Slot[] {
  return times.map((time) => ({
    id: `${dateKey}|${time}`,
    dateKey,
    time,
    minutes: SLOT_MINUTES,
    status: closed.has(`${dateKey}|${time}`) ? "closed" : "open",
  }));
}
