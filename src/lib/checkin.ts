import type { MoodId } from "./types";
import { dateKey } from "./date";

/** 첫 화면 체크인 — 오늘의 기분과 에너지. */
export interface CheckIn {
  date: string;
  mood: MoodId;
  /** 1(지침) ~ 5(충만) */
  energy: number;
  createdAt: string;
}

export const CHECKIN_KEY = "maeum.checkin.v1";
/** 우주 진입 연출을 이미 본 날인지 (같은 날 새로고침 때 반복 재생 방지) */
export const COSMIC_SEEN_KEY = "maeum.cosmic.seen.v1";

export const ENERGY_LABELS: Record<number, string> = {
  1: "거의 다 써버림",
  2: "조금 지침",
  3: "보통",
  4: "괜찮은 편",
  5: "충만함",
};

export function todayKey(): string {
  return dateKey(new Date());
}

export function loadCheckIn(): CheckIn | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(CHECKIN_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CheckIn;
    if (!parsed || typeof parsed.mood !== "string" || typeof parsed.energy !== "number") {
      return null;
    }
    return {
      date: String(parsed.date ?? ""),
      mood: parsed.mood as MoodId,
      energy: Math.min(5, Math.max(1, Math.round(parsed.energy))),
      createdAt: String(parsed.createdAt ?? new Date().toISOString()),
    };
  } catch {
    return null;
  }
}

export function loadTodayCheckIn(): CheckIn | null {
  const saved = loadCheckIn();
  if (!saved) return null;
  return saved.date === todayKey() ? saved : null;
}

export function saveCheckIn(mood: MoodId, energy: number): CheckIn {
  const value: CheckIn = {
    date: todayKey(),
    mood,
    energy: Math.min(5, Math.max(1, Math.round(energy))),
    createdAt: new Date().toISOString(),
  };
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(CHECKIN_KEY, JSON.stringify(value));
    } catch {
      /* 저장 실패해도 앱은 계속 쓸 수 있다 */
    }
  }
  return value;
}

export function hasSeenCosmicToday(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(COSMIC_SEEN_KEY) === todayKey();
  } catch {
    return false;
  }
}

export function markCosmicSeen(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(COSMIC_SEEN_KEY, todayKey());
  } catch {
    /* ignore */
  }
}
