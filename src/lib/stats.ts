import type { PlayRecord } from "./types";

/** 누적 수행 시간 구간 (분) — 0 · 10h · 50h · 150h · 300h */
export const LEVEL_THRESHOLD_MINUTES = [0, 600, 3000, 9000, 18000] as const;

export interface LevelState {
  /** 1부터 시작하는 레벨 번호 (1 비기너 ~ 5 마스터) */
  level: number;
  /** 다음 레벨까지 남은 분 (최고 레벨이면 null) */
  remainingMinutes: number | null;
  /** 현재 구간에서의 진행률 0~1 */
  progress: number;
  /** 현재 레벨이 시작된 누적 분 */
  floorMinutes: number;
  /** 다음 레벨 기준 누적 분 (최고 레벨이면 null) */
  nextMinutes: number | null;
}

/**
 * 단일 5단계 레벨 체계.
 * Lv.1 비기너(0~10h) · 시커(10~50h) · 딥다이버(50~150h) · 어웨이큰(150~300h) · 마스터(300h+).
 * 이름은 i18n `level.1` ~ `level.5`에서 가져온다.
 */
export function levelForMinutes(totalMinutes: number): LevelState {
  const total = Math.max(0, totalMinutes);
  let index = 0;
  for (let i = 0; i < LEVEL_THRESHOLD_MINUTES.length; i += 1) {
    if (total >= LEVEL_THRESHOLD_MINUTES[i]) index = i;
  }
  const floor = LEVEL_THRESHOLD_MINUTES[index];
  const next = LEVEL_THRESHOLD_MINUTES[index + 1] ?? null;
  const progress =
    next === null ? 1 : Math.min(1, Math.max(0, (total - floor) / (next - floor)));
  return {
    level: index + 1,
    remainingMinutes: next === null ? null : Math.max(0, Math.ceil(next - total)),
    progress,
    floorMinutes: floor,
    nextMinutes: next,
  };
}

/* --------------------------------- 집계 --------------------------------- */

function startOfToday(now: Date) {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function startOfWeek(now: Date) {
  const d = startOfToday(now);
  /* 월요일 시작 */
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  return d;
}

export interface PracticeStats {
  todayMinutes: number;
  weekMinutes: number;
  totalMinutes: number;
  todaySessions: number;
  weekSessions: number;
  totalSessions: number;
}

/**
 * plays(명상·시각화 플레이어, 자유 타이머, 확언) 기록을 오늘/이번 주/전체로 집계한다.
 * 자유 타이머는 분 단위 소수(예: 12.4분)로 저장되므로 표시할 때 반올림한다.
 */
export function practiceStats(plays: PlayRecord[], now: Date = new Date()): PracticeStats {
  const todayStart = startOfToday(now).getTime();
  const weekStart = startOfWeek(now).getTime();
  let todayMinutes = 0;
  let weekMinutes = 0;
  let totalMinutes = 0;
  let todaySessions = 0;
  let weekSessions = 0;

  for (const play of plays) {
    const at = new Date(play.completedAt).getTime();
    if (Number.isNaN(at)) continue;
    const minutes = Math.max(0, play.minutes || 0);
    totalMinutes += minutes;
    if (at >= weekStart) {
      weekMinutes += minutes;
      weekSessions += 1;
    }
    if (at >= todayStart) {
      todayMinutes += minutes;
      todaySessions += 1;
    }
  }

  const round1 = (value: number) => Math.round(value * 10) / 10;
  return {
    todayMinutes: round1(todayMinutes),
    weekMinutes: round1(weekMinutes),
    totalMinutes: round1(totalMinutes),
    todaySessions,
    weekSessions,
    totalSessions: plays.length,
  };
}

/** 125 → "2시간 5분", 45 → "45분" */
export function fmtMinutes(minutes: number): string {
  const total = Math.max(0, Math.round(minutes));
  if (total < 60) return `${total}분`;
  const hours = Math.floor(total / 60);
  const rest = total % 60;
  if (hours < 100) return rest ? `${hours}시간 ${rest}분` : `${hours}시간`;
  return `${hours}시간`;
}

export function fmtRemaining(minutes: number): string {
  return fmtMinutes(minutes);
}
