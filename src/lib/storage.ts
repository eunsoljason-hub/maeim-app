import {
  DEFAULT_CLOSED_SLOTS_TODAY,
  DEFAULT_CLOSED_SLOTS_TOMORROW,
  DEFAULT_COURSE_ID,
  SLOT_MINUTES,
  SLOT_TIMES,
} from "./constants";
import { dateKeyOfOffset } from "./date";
import { courseById } from "./constants";
import type { Slot, ThemeId } from "./types";

export const STORAGE_KEY = "maeum.app.v1";
export const HOST_UNLOCK_KEY = "maeum.host.unlocked.v1";
export const PENDING_BOOKING_KEY = "maeum.pendingBooking.v1";

export type SoundId = "none" | "rain" | "wave" | "fire";

export interface AppPrefs {
  courseId: string;
  minutes: number;
  theme: ThemeId;
  sound: SoundId;
}

export function defaultPrefs(): AppPrefs {
  const course = courseById(DEFAULT_COURSE_ID);
  return {
    courseId: course.id,
    minutes: course.minutes,
    theme: course.theme,
    sound: "none",
  };
}

export function buildDefaultSlots(now: Date = new Date()): Slot[] {
  const slots: Slot[] = [];
  const plans = [
    { key: dateKeyOfOffset(0, now), closed: DEFAULT_CLOSED_SLOTS_TODAY },
    { key: dateKeyOfOffset(1, now), closed: DEFAULT_CLOSED_SLOTS_TOMORROW },
  ];
  for (const plan of plans) {
    for (const time of SLOT_TIMES) {
      slots.push({
        id: `${plan.key}|${time}`,
        dateKey: plan.key,
        time,
        minutes: SLOT_MINUTES,
        status: plan.closed.includes(time) ? "closed" : "open",
      });
    }
  }
  return slots;
}

export function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeJson(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — the app keeps working in memory */
  }
}

export function removeKey(key: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    /* ignore */
  }
}

export function isSoundId(value: unknown): value is SoundId {
  return value === "none" || value === "rain" || value === "wave" || value === "fire";
}

/** Reads the saved player preferences directly (used before providers hydrate). */
export function loadStoredPrefs(): AppPrefs {
  return normalizePrefs(readJson<unknown>(`${STORAGE_KEY}.prefs`, null));
}

export function normalizePrefs(raw: unknown): AppPrefs {
  const base = defaultPrefs();
  if (!raw || typeof raw !== "object") return base;
  const candidate = raw as Partial<AppPrefs>;
  const course = courseById(candidate.courseId ?? base.courseId);
  return {
    courseId: course.id,
    minutes:
      typeof candidate.minutes === "number" ? candidate.minutes : course.minutes,
    theme: candidate.theme === "forest" || candidate.theme === "lake" || candidate.theme === "night" ? candidate.theme : base.theme,
    sound: isSoundId(candidate.sound) ? candidate.sound : base.sound,
  };
}
