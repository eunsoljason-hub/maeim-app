"use client";

import { useEffect, useMemo, useState } from "react";
import { useI18n, formatDateKey } from "@/lib/i18n/LangProvider";
import { moodLabel } from "@/lib/i18n/labels";
import type { MoodId } from "@/lib/types";
import type { DiaryEntry } from "@/lib/types";
import { dateKey } from "@/lib/date";

const GROWTH_KEY = "maeum.growthNotes.v1";

/** 정확히 한 달 전 날짜 (31일 → 그 달 마지막 날로 보정). */
export function monthAgoKey(base: Date = new Date()): string {
  const day = base.getDate();
  const target = new Date(base.getFullYear(), base.getMonth() - 1, day);
  if (target.getMonth() !== ((base.getMonth() - 1 + 12) % 12)) {
    target.setDate(0);
  }
  return dateKey(target);
}

const SAMPLE = {
  ko: {
    mood: "anxious" as MoodId,
    text: "복직까지 100일도 안 남았는데 그동안 아무것도 못 한 것 같아 조급하다. 애들 재우고 나면 기운이 없어서 아무것도 시작하지 못하고, 내일도 똑같을 것 같다. 남들은 다 잘 살아가는 것 같은데 나만 제자리인 기분.",
  },
  en: {
    mood: "anxious" as MoodId,
    text: "Less than 100 days until I go back to work, and I feel like I've done nothing. Once the kids are asleep I have no energy left to start anything, and I'm sure tomorrow will be the same. Everyone else seems to be getting somewhere while I stand still.",
  },
  ja: {
    mood: "anxious" as MoodId,
    text: "復職まで100日もないのに、何もできていない気がして焦っていた。子どもたちを寝かしつけると力が出ず、何も始められない。明日も同じだろうと思っていた。みんなはうまくやっているのに、私だけ立ち止まっている気がした。",
  },
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
 * 한 달 전 오늘의 나 — 두 가지만 남긴 카드.
 * ① 그때의 나(마음과 그날의 글) ② 지금의 나에게 한마디.
 */
export function MonthAgoCard({ diaries }: { diaries: DiaryEntry[] }) {
  const { t, lang } = useI18n();
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

  const sample = SAMPLE[lang] ?? SAMPLE.ko;
  const past = real
    ? { mood: real.mood, text: real.text }
    : { mood: sample.mood, text: sample.text };

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
    <section className="month-card" aria-label={t("month.kicker")}>
      <div className="month-head">
        <p className="month-kicker">{t("month.kicker")}</p>
        <span className={`month-tag ${real ? "" : "sample"}`}>
          {real ? formatDateKey(key, lang) : t("month.sample")}
        </span>
      </div>

      <div className="month-past">
        <span className="month-label">{t("month.past")}</span>
        <div className="month-mood">
          <span aria-hidden="true">{moodEmoji(past.mood)}</span>
          {moodLabel(past.mood as MoodId, t)}
        </div>
        <p className="month-text">{past.text || t("month.noRecord")}</p>
      </div>

      <div className="month-note">
        <label htmlFor="growth-note">{t("month.note")}</label>
        <textarea
          id="growth-note"
          value={draft}
          onChange={(event) => setDraft(event.target.value.slice(0, 300))}
          rows={2}
          maxLength={300}
          placeholder={t("month.notePh")}
        />
        <div className="month-note-foot">
          <span className="tiny">{draft.length} / 300</span>
          <button type="button" onClick={save}>
            {saved ? t("month.saved") : t("month.save")}
          </button>
        </div>
      </div>
    </section>
  );
}

function moodEmoji(id: MoodId | string | null | undefined) {
  const map: Record<string, string> = {
    calm: "😌",
    good: "🙂",
    flat: "😐",
    heavy: "😔",
    anxious: "😣",
    angry: "😤",
    tired: "🥱",
    hope: "🌤️",
  };
  return map[String(id)] ?? "·";
}
