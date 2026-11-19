"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { useI18n } from "@/lib/i18n/LangProvider";
import {
  DEFAULT_LEVEL_THEME,
  LEVEL_THEMES,
  LEVEL_THEME_KEY,
  fmtMinutes,
  levelForMinutes,
  practiceStats,
  type LevelThemeId,
} from "@/lib/stats";

/**
 * 오늘 / 이번 주 / 총 누적 시간과 누적 시간 레벨을 한 카드에 보여준다.
 * 세션을 마칠 때마다 plays 기록이 쌓여 자동으로 갱신된다.
 */
export function PracticeStatsCard({ compact = false }: { compact?: boolean }) {
  const { plays, hydrated } = useApp();
  const { t, lang } = useI18n();
  const [themeId, setThemeId] = useState<LevelThemeId>(DEFAULT_LEVEL_THEME);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LEVEL_THEME_KEY);
      if (stored === "inyou" || stored === "cosmic" || stored === "english") {
        setThemeId(stored);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const choose = (id: LevelThemeId) => {
    setThemeId(id);
    try {
      window.localStorage.setItem(LEVEL_THEME_KEY, id);
    } catch {
      /* ignore */
    }
  };

  const stats = practiceStats(plays);
  const level = levelForMinutes(stats.totalMinutes, themeId);

  const minutesText = (value: number) => {
    const total = Math.max(0, Math.round(value));
    if (total < 60) return t("stats.minutes", { n: total });
    const h = Math.floor(total / 60);
    const m = total % 60;
    return m ? t("stats.hoursMin", { h, m }) : t("stats.hours", { h });
  };

  return (
    <section className={`practice-card ${compact ? "compact" : ""}`} aria-label={t("stats.title")}>
      <div className="practice-head">
        <div className="practice-level">
          <span className="practice-badge" aria-hidden="true">
            {level.level}
          </span>
          <div className="practice-level-txt">
            <span className="practice-lv">LV.{level.level}</span>
            <b>{t(`level.${themeId}.${level.level}`)}</b>
            <span className="practice-theme-hint">{t(`level.${themeId}.hint`)}</span>
          </div>
        </div>
        <span className="practice-total">
          {hydrated ? minutesText(stats.totalMinutes) : "–"}
        </span>
      </div>

      <div className="practice-gauge" aria-hidden="true">
        <span style={{ width: `${Math.round(level.progress * 100)}%` }} />
      </div>
      <p className="practice-next">
        {hydrated ? (
          level.nextMinutes === null ? (
            <>{t("stats.max")}</>
          ) : (
            <>
              {t("stats.next", {
                name: t(`level.${themeId}.${level.level + 1}`),
                time: minutesText(level.remainingMinutes ?? 0),
              })}
            </>
          )
        ) : (
          t("stats.loading")
        )}
      </p>

      <div className="practice-grid">
        <div>
          <b>{hydrated ? minutesText(stats.todayMinutes) : "–"}</b>
          <span>
            {t("stats.today")} · {t("stats.sessions", { n: stats.todaySessions })}
          </span>
        </div>
        <div>
          <b>{hydrated ? minutesText(stats.weekMinutes) : "–"}</b>
          <span>
            {t("stats.week")} · {t("stats.sessions", { n: stats.weekSessions })}
          </span>
        </div>
        <div>
          <b>{hydrated ? minutesText(stats.totalMinutes) : "–"}</b>
          <span>
            {t("stats.total")} · {t("stats.sessions", { n: stats.totalSessions })}
          </span>
        </div>
      </div>

      <div className="practice-themes" role="group" aria-label={t("stats.theme")}>
        {LEVEL_THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            lang={lang}
            className={item.id === themeId ? "on" : ""}
            onClick={() => choose(item.id)}
            aria-pressed={item.id === themeId}
          >
            {t(`level.theme.${item.id}`)}
          </button>
        ))}
      </div>
    </section>
  );
}

/** 다른 화면에서 같은 계산이 필요할 때. */
export function totalMinutesText(minutes: number, t: (key: string, vars?: Record<string, string | number>) => string) {
  return minutes >= 60
    ? t("stats.hoursMin", { h: Math.floor(minutes / 60), m: Math.round(minutes % 60) })
    : t("stats.minutes", { n: Math.round(minutes) });
}

export { fmtMinutes };
