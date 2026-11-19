"use client";

import { useEffect, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
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
  const theme = LEVEL_THEMES.find((item) => item.id === themeId) ?? LEVEL_THEMES[0];

  return (
    <section className={`practice-card ${compact ? "compact" : ""}`} aria-label="수행 시간과 레벨">
      <div className="practice-head">
        <div className="practice-level">
          <span className="practice-badge" aria-hidden="true">
            {level.level}
          </span>
          <div className="practice-level-txt">
            <span className="practice-lv">LV.{level.level}</span>
            <b>{level.name}</b>
            <span className="practice-theme-hint">{theme.hint}</span>
          </div>
        </div>
        <span className="practice-total">{hydrated ? fmtMinutes(stats.totalMinutes) : "–"}</span>
      </div>

      <div className="practice-gauge" aria-hidden="true">
        <span style={{ width: `${Math.round(level.progress * 100)}%` }} />
      </div>
      <p className="practice-next">
        {hydrated ? (
          level.nextMinutes === null ? (
            <>최고 레벨이에요. 쌓인 시간이 그대로 당신의 것이 됩니다.</>
          ) : (
            <>
              다음 레벨 <b>{theme.names[level.level]}</b>까지{" "}
              <b>{fmtMinutes(level.remainingMinutes ?? 0)}</b> 남았어요
            </>
          )
        ) : (
          "기록을 불러오는 중이에요"
        )}
      </p>

      <div className="practice-grid">
        <div>
          <b>{hydrated ? fmtMinutes(stats.todayMinutes) : "–"}</b>
          <span>오늘 · {stats.todaySessions}회</span>
        </div>
        <div>
          <b>{hydrated ? fmtMinutes(stats.weekMinutes) : "–"}</b>
          <span>이번 주 · {stats.weekSessions}회</span>
        </div>
        <div>
          <b>{hydrated ? fmtMinutes(stats.totalMinutes) : "–"}</b>
          <span>총 누적 · {stats.totalSessions}회</span>
        </div>
      </div>

      <div className="practice-themes" role="group" aria-label="레벨 이름 테마">
        {LEVEL_THEMES.map((item) => (
          <button
            key={item.id}
            type="button"
            className={item.id === themeId ? "on" : ""}
            onClick={() => choose(item.id)}
            aria-pressed={item.id === themeId}
          >
            {item.label}
          </button>
        ))}
      </div>
    </section>
  );
}
