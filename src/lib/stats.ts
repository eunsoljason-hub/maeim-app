import type { PlayRecord } from "./types";

/** 누적 시간 구간 (분). 0 · 10h · 30h · 100h · 200h · 300h · 500h */
export const LEVEL_THRESHOLD_MINUTES = [0, 600, 1800, 6000, 12000, 18000, 30000] as const;

export type LevelThemeId = "inyou" | "cosmic" | "english";

export interface LevelTheme {
  id: LevelThemeId;
  label: string;
  hint: string;
  names: string[];
}

/**
 * 레벨 이름 테마 3안.
 * 기본값은 인유 브랜드형('씨앗 → 내면의 우주')이고, 사용자가 바꿀 수 있다.
 */
export const LEVEL_THEMES: LevelTheme[] = [
  {
    id: "inyou",
    label: "인유 브랜드형",
    hint: "씨앗에서 내면의 우주까지",
    names: ["씨앗", "새싹", "뿌리", "나무", "숲", "정원", "내면의 우주"],
  },
  {
    id: "cosmic",
    label: "우주·시적형",
    hint: "별먼지에서 영혼의 항해자까지",
    names: [
      "별먼지",
      "별빛",
      "성운",
      "은하",
      "성좌",
      "초월자",
      "영혼의 항해자",
    ],
  },
  {
    id: "english",
    label: "영어·명상 직관형",
    hint: "Beginner → Awakened Soul",
    names: [
      "비기너",
      "시커",
      "메디테이터",
      "프랙티셔너",
      "마스터",
      "어웨이큰",
      "어웨이큰드 소울",
    ],
  },
];

export const LEVEL_THEME_KEY = "maeum.level.theme.v1";
export const DEFAULT_LEVEL_THEME: LevelThemeId = "inyou";

export function levelThemeById(id: string | null | undefined): LevelTheme {
  return LEVEL_THEMES.find((theme) => theme.id === id) ?? LEVEL_THEMES[0];
}

export interface LevelState {
  /** 1부터 시작하는 레벨 번호 */
  level: number;
  name: string;
  /** 다음 레벨까지 남은 분 (최고 레벨이면 null) */
  remainingMinutes: number | null;
  /** 현재 구간에서의 진행률 0~1 */
  progress: number;
  /** 현재 레벨이 시작된 누적 분 */
  floorMinutes: number;
  /** 다음 레벨 기준 누적 분 (최고 레벨이면 null) */
  nextMinutes: number | null;
}

export function levelForMinutes(
  totalMinutes: number,
  themeId: LevelThemeId = DEFAULT_LEVEL_THEME,
): LevelState {
  const theme = levelThemeById(themeId);
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
    name: theme.names[index] ?? theme.names[theme.names.length - 1],
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

  return {
    todayMinutes: Math.round(todayMinutes),
    weekMinutes: Math.round(weekMinutes),
    totalMinutes: Math.round(totalMinutes),
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
