import { moodById } from "./constants";
import { dateKeyOfOffset } from "./date";
import type { DiaryEntry, MoodId, WeeklyBriefing } from "./types";

const STOPWORDS = new Set([
  "오늘",
  "그냥",
  "너무",
  "정말",
  "조금",
  "많이",
  "것",
  "수",
  "때",
  "내가",
  "나는",
  "저는",
  "그리고",
  "하지만",
  "그래서",
  "있는",
  "없는",
  "했다",
  "한다",
  "같아요",
  "같다",
  "같아",
  "좀",
  "더",
  "잘",
  "안",
  "못",
  "이",
  "그",
  "저",
  "나",
  "내",
  "마음",
  "생각",
  "기분",
]);

function tokenize(text: string) {
  return text
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(
      (word) =>
        word.length >= 2 && !STOPWORDS.has(word) && !/^\d+$/.test(word),
    );
}

/**
 * Builds the 7-day mood card that the listener reads before a session.
 * Deliberately reads only the last 7 days and only what the client consented to share.
 */
export function buildWeeklyBriefing(
  diaries: DiaryEntry[],
  now: Date = new Date(),
): WeeklyBriefing {
  const from = dateKeyOfOffset(-6, now);
  const to = dateKeyOfOffset(0, now);
  const recent = diaries.filter((d) => d.date >= from && d.date <= to);

  const moodCounts = new Map<MoodId, number>();
  for (const entry of recent) {
    moodCounts.set(entry.mood, (moodCounts.get(entry.mood) ?? 0) + 1);
  }
  let dominantMood: MoodId | null = null;
  let dominantCount = 0;
  moodCounts.forEach((count, mood) => {
    if (count > dominantCount) {
      dominantMood = mood;
      dominantCount = count;
    }
  });

  const activeDays = new Set(recent.map((d) => d.date)).size;
  const averageIntensity = recent.length
    ? recent.reduce((sum, d) => sum + (d.intensity || 3), 0) / recent.length
    : 0;

  const before = recent.filter((d) => d.moment === "before");
  const after = recent.filter((d) => d.moment === "after");
  const avg = (list: DiaryEntry[]) =>
    list.length
      ? list.reduce((sum, d) => sum + (d.intensity || 3), 0) / list.length
      : null;
  const beforeAvg = avg(before);
  const afterAvg = avg(after);
  const shift =
    beforeAvg !== null && afterAvg !== null
      ? Math.round((beforeAvg - afterAvg) * 10) / 10
      : null;

  const wordCounts = new Map<string, number>();
  for (const entry of recent) {
    for (const word of tokenize(entry.text)) {
      wordCounts.set(word, (wordCounts.get(word) ?? 0) + 1);
    }
  }
  const topWords = [...wordCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([word]) => word);

  const lines: string[] = [];
  if (!recent.length) {
    lines.push("최근 7일 기록이 아직 없어요. 상담 첫머리에 지금 마음을 여쭤보세요.");
  } else {
    lines.push(
      `최근 7일 중 ${activeDays}일 기록 · 일기 ${recent.length}개`,
    );
    if (dominantMood) {
      lines.push(
        `가장 자주 ‘${moodById(dominantMood).label}’ (${dominantCount}회) · 평균 마음 크기 ${averageIntensity.toFixed(1)}/5`,
      );
    }
    if (shift !== null) {
      if (shift > 0.3) {
        lines.push(`명상 후 마음의 크기가 평균 ${shift.toFixed(1)}만큼 내려갔어요.`);
      } else if (shift < -0.3) {
        lines.push(`명상 후 오히려 마음이 ${Math.abs(shift).toFixed(1)}만큼 올라갔어요. 천천히 살펴볼 지점이에요.`);
      } else {
        lines.push("명상 전후 마음의 크기는 거의 비슷했어요.");
      }
    } else if (before.length || after.length) {
      lines.push("명상 전/후 기록이 아직 한쪽만 있어요. 비교는 다음 기록부터 볼 수 있어요.");
    }
    if (topWords.length) {
      lines.push(`자주 나온 말: ${topWords.map((w) => `‘${w}’`).join(", ")}`);
    }
  }

  return {
    totalEntries: recent.length,
    activeDays,
    dominantMood,
    dominantCount,
    averageIntensity: Math.round(averageIntensity * 10) / 10,
    beforeCount: before.length,
    afterCount: after.length,
    shift,
    topWords,
    lines,
  };
}

/** Last mood recorded per day for the home 7-day strip. */
export function weekMoodStrip(diaries: DiaryEntry[], now: Date = new Date()) {
  return Array.from({ length: 7 }, (_, index) => {
    const offset = index - 6;
    const key = dateKeyOfOffset(offset, now);
    const entries = diaries
      .filter((d) => d.date === key)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = entries.at(-1) ?? null;
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return {
      key,
      isToday: offset === 0,
      mood: last?.mood ?? null,
      count: entries.length,
      weekday: ["일", "월", "화", "수", "목", "금", "토"][date.getDay()],
      day: date.getDate(),
    };
  });
}

/** Last 30 days of mood, newest last — the diary's month-at-a-glance strip. */
export function monthMoodStrip(diaries: DiaryEntry[], now: Date = new Date()) {
  return Array.from({ length: 30 }, (_, index) => {
    const offset = index - 29;
    const key = dateKeyOfOffset(offset, now);
    const entries = diaries
      .filter((d) => d.date === key)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = entries.at(-1) ?? null;
    const date = new Date(now);
    date.setDate(date.getDate() + offset);
    return {
      key,
      isToday: offset === 0,
      mood: last?.mood ?? null,
      count: entries.length,
      day: date.getDate(),
    };
  });
}

export function streakDays(diaries: DiaryEntry[], now: Date = new Date()) {
  const days = new Set(diaries.map((d) => d.date));
  let cursor = new Date(now);
  if (!days.has(dateKeyOfOffset(0, cursor))) {
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  let streak = 0;
  while (days.has(dateKeyOfOffset(0, cursor))) {
    streak += 1;
    cursor = new Date(cursor.getTime() - 86_400_000);
  }
  return streak;
}

export function weekStats(diaries: DiaryEntry[], plays: { completedAt: string; minutes: number }[], now: Date = new Date()) {
  const weekStart = new Date(now);
  weekStart.setHours(0, 0, 0, 0);
  weekStart.setDate(weekStart.getDate() - ((weekStart.getDay() + 6) % 7));
  const from = weekStart.toISOString();
  const weekPlays = plays.filter((p) => p.completedAt >= from);
  return {
    sessions: weekPlays.length,
    minutes: weekPlays.reduce((sum, p) => sum + p.minutes, 0),
    diaryDays: new Set(
      diaries
        .filter((d) => new Date(`${d.date}T00:00:00`).getTime() >= weekStart.getTime())
        .map((d) => d.date),
    ).size,
  };
}
