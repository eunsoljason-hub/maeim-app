"use client";

import { useEffect, useMemo, useState } from "react";
import { MOODS, moodById } from "@/lib/constants";
import { dateKey, fmtDateLong, pad2 } from "@/lib/date";
import type { DiaryEntry } from "@/lib/types";

const GROWTH_KEY = "maeum.growthNotes.v1";

/** 정확히 한 달 전 날짜 (31일 → 다음 달 말일로 보정). */
export function monthAgoKey(base: Date = new Date()): string {
  const day = base.getDate();
  const target = new Date(base.getFullYear(), base.getMonth() - 1, day);
  if (target.getMonth() !== ((base.getMonth() - 1 + 12) % 12)) {
    /* 3월 31일 → 2월 31일은 3월로 넘어가므로 그 달의 마지막 날로 맞춘다. */
    target.setDate(0);
  }
  return dateKey(target);
}

const SAMPLE = {
  mood: "anxious" as const,
  intensity: 4,
  energy: 2,
  text:
    "복직까지 100일도 안 남았는데 그동안 아무것도 못 한 것 같아 조급하다. 애들 재우고 나면 기운이 없어서 아무것도 시작하지 못하고, 내일도 똑같을 것 같다. 남들은 다 잘 살아가는 것 같은데 나만 제자리인 기분.",
};

function loadGrowthNotes(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(GROWTH_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, string>;
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * 한 달 전 오늘의 나와 지금의 나를 나란히 놓고 성장을 확인하는 카드.
 * 실제 기록이 있으면 그대로 보여주고, 없으면 데모용 예시 기록을 보여준다.
 */
export function MonthAgoCard({
  diaries,
  todayMood,
  todayEnergy,
}: {
  diaries: DiaryEntry[];
  todayMood: string | null;
  todayEnergy: number | null;
}) {
  const key = useMemo(() => monthAgoKey(), []);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = loadGrowthNotes();
    setNotes(stored);
    setDraft(stored[key] ?? "");
  }, [key]);

  const real = useMemo(
    () =>
      [...diaries]
        .filter((entry) => entry.date === key)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
    [diaries, key],
  );

  const past = real
    ? { mood: real.mood, intensity: real.intensity, energy: real.energy ?? null, text: real.text }
    : SAMPLE;
  const pastMood = moodById(past.mood);
  const nowMood = todayMood ? moodById(todayMood) : null;

  const save = () => {
    const value = draft.trim();
    const next = { ...notes };
    if (value) next[key] = value;
    else delete next[key];
    setNotes(next);
    try {
      window.localStorage.setItem(GROWTH_KEY, JSON.stringify(next));
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <section className="month-card" aria-label="한 달 전 오늘의 나">
      <div className="month-head">
        <div>
          <p className="month-kicker">한 달 전 오늘의 나</p>
          <b>{fmtDateLong(key)}</b>
        </div>
        <span className={`month-tag ${real ? "" : "sample"}`}>
          {real ? "내 기록" : "예시 기록"}
        </span>
      </div>

      <div className="month-body">
        <div className="month-past">
          <span className="month-label">그때의 나</span>
          <div className="month-mood">
            <span aria-hidden="true">{pastMood.emoji}</span>
            {pastMood.label}
            <em>마음 {past.intensity}/5</em>
            {past.energy ? <em>에너지 {past.energy}/5</em> : null}
          </div>
          <p className="month-text">
            {past.text || "그날은 글로 남기지 않았어요. 그래도 그때의 마음은 여기 있었어요."}
          </p>
        </div>

        <div className="month-arrow" aria-hidden="true">
          ↓
        </div>

        <div className="month-now">
          <span className="month-label">지금의 나</span>
          <div className="month-mood">
            {nowMood ? (
              <>
                <span aria-hidden="true">{nowMood.emoji}</span>
                {nowMood.label}
              </>
            ) : (
              <span>오늘의 체크인을 하면 함께 보여요</span>
            )}
            {todayEnergy ? <em>에너지 {todayEnergy}/5</em> : null}
          </div>
        </div>
      </div>

      <p className="month-message">
        한 달 전의 고민이 <b>지금은 얼마나 작아 보이나요?</b> 그때보다 이만큼 성장했어요.
      </p>

      <div className="month-note">
        <label htmlFor="growth-note">지금의 나에게 한마디</label>
        <textarea
          id="growth-note"
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 300))}
          rows={2}
          maxLength={300}
          placeholder="예: 그때는 하루하루가 벅찼는데, 지금은 아이들과 웃을 여유가 생겼다."
        />
        <div className="month-note-foot">
          <span className="tiny">{draft.length} / 300</span>
          <button type="button" onClick={save}>
            {saved ? "남겼어요 ✓" : "성장 코멘트 남기기"}
          </button>
        </div>
        {notes[key] && !saved ? (
          <p className="month-saved">남긴 코멘트 · {notes[key]}</p>
        ) : null}
      </div>

      <p className="month-footnote">
        {real
          ? `${pad2(1)}달 전 오늘 남긴 기록을 그대로 가져왔어요.`
          : "아직 한 달 전 기록이 없어서, 그날의 마음을 예시로 보여드려요. 오늘 기록이 쌓이면 진짜 과거의 나와 비교할 수 있어요."}
      </p>
    </section>
  );
}

/**오늘의 기분 선택지 (다이어리 폼에서 재사용) */
export const DIARY_MOODS = MOODS;
