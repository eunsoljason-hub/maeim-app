/**
 * 성장 탭의 네 가지 도구 상태.
 * 모두 localStorage(`maeum.growth.v1`)에 영구 저장한다.
 */

export interface NeedsState {
  /** 1(생리) ~ 5(자아실현), 아직 고르지 않았으면 null */
  level: number | null;
  note: string;
  updatedAt: string;
}

export interface HexState {
  labels: string[];
  /** 각 항목 1~10 */
  scores: number[];
}

export interface RoadmapItem {
  id: string;
  label: string;
  vision: string;
  goal: string;
}

export interface MandalartState {
  center: string;
  themes: string[];
  /** themes[i]의 실천 항목 8개 */
  actions: string[][];
}

export interface GrowthState {
  needs: NeedsState;
  hex: HexState;
  roadmap: RoadmapItem[];
  mandalart: MandalartState;
}

export const GROWTH_KEY = "maeum.growth.v1";

export const NEED_STAGES = [
  {
    level: 1,
    label: "생리적 욕구",
    en: "Physiological",
    hint: "잠 · 밥 · 숨 · 휴식",
    color: "#c9b28a",
  },
  {
    level: 2,
    label: "안전 욕구",
    en: "Safety",
    hint: "돈 · 건강 · 안정된 집",
    color: "#b9c0a0",
  },
  {
    level: 3,
    label: "소속과 사랑",
    en: "Love & Belonging",
    hint: "가족 · 친구 · 함께하는 사람",
    color: "#9fc0ae",
  },
  {
    level: 4,
    label: "존중 욕구",
    en: "Esteem",
    hint: "인정 · 성취 · 자존감",
    color: "#9aaecb",
  },
  {
    level: 5,
    label: "자아실현",
    en: "Self-actualization",
    hint: "내가 되고 싶은 나",
    color: "#a99fd0",
  },
] as const;

export const HEX_DEFAULT = {
  labels: ["건강", "마음", "가족", "커리어", "재정", "성장"],
  scores: [6, 6, 7, 4, 4, 6],
};

export const ROADMAP_PERIODS = [
  { id: "y10", label: "10년 뒤", hint: "어떤 삶의 모양인가요" },
  { id: "y5", label: "5년 뒤", hint: "무엇이 이루어져 있나요" },
  { id: "y3", label: "3년 뒤", hint: "어디에 서 있나요" },
  { id: "y1", label: "1년 뒤", hint: "올해의 마지막 날" },
  { id: "month", label: "이번 달", hint: "이번 달 안에 할 일" },
] as const;

function emptyRoadmap(): RoadmapItem[] {
  return ROADMAP_PERIODS.map((period) => ({
    id: period.id,
    label: period.label,
    vision: "",
    goal: "",
  }));
}

export function emptyMandalart(): MandalartState {
  return {
    center: "나의 핵심 목표",
    themes: Array.from({ length: 8 }, () => ""),
    actions: Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => "")),
  };
}

export function defaultGrowth(): GrowthState {
  return {
    needs: { level: null, note: "", updatedAt: "" },
    hex: { labels: [...HEX_DEFAULT.labels], scores: [...HEX_DEFAULT.scores] },
    roadmap: emptyRoadmap(),
    mandalart: emptyMandalart(),
  };
}

function clampScore(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 5;
  return Math.min(10, Math.max(1, Math.round(n)));
}

export function loadGrowth(): GrowthState {
  const base = defaultGrowth();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(GROWTH_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<GrowthState>;

    const needsRaw = parsed.needs ?? base.needs;
    const level =
      typeof needsRaw.level === "number" && needsRaw.level >= 1 && needsRaw.level <= 5
        ? needsRaw.level
        : null;

    const hexRaw = parsed.hex ?? base.hex;
    const labels = Array.from({ length: 6 }, (_, i) => {
      const value = hexRaw.labels?.[i];
      return typeof value === "string" && value.trim() ? value.slice(0, 12) : base.hex.labels[i];
    });
    const scores = Array.from({ length: 6 }, (_, i) => clampScore(hexRaw.scores?.[i] ?? 5));

    const roadmap = Array.isArray(parsed.roadmap)
      ? ROADMAP_PERIODS.map((period, i) => {
          const found = parsed.roadmap?.[i];
          return {
            id: period.id,
            label: period.label,
            vision: typeof found?.vision === "string" ? found.vision : "",
            goal: typeof found?.goal === "string" ? found.goal : "",
          };
        })
      : emptyRoadmap();

    const mandalartRaw = parsed.mandalart ?? base.mandalart;
    const mandalart: MandalartState = {
      center:
        typeof mandalartRaw.center === "string" && mandalartRaw.center
          ? mandalartRaw.center.slice(0, 60)
          : base.mandalart.center,
      themes: Array.from({ length: 8 }, (_, i) =>
        typeof mandalartRaw.themes?.[i] === "string"
          ? (mandalartRaw.themes[i] as string).slice(0, 40)
          : "",
      ),
      actions: Array.from({ length: 8 }, (_, i) =>
        Array.from({ length: 8 }, (_, j) =>
          typeof mandalartRaw.actions?.[i]?.[j] === "string"
            ? (mandalartRaw.actions[i][j] as string).slice(0, 40)
            : "",
        ),
      ),
    };

    return {
      needs: {
        level,
        note: typeof needsRaw.note === "string" ? needsRaw.note : "",
        updatedAt: typeof needsRaw.updatedAt === "string" ? needsRaw.updatedAt : "",
      },
      hex: { labels, scores },
      roadmap,
      mandalart,
    };
  } catch {
    return base;
  }
}

export function saveGrowth(state: GrowthState): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(GROWTH_KEY, JSON.stringify(state));
    return true;
  } catch {
    return false;
  }
}
