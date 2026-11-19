"use client";

import { useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
import { useI18n } from "@/lib/i18n/LangProvider";
import {
  LEVEL_THRESHOLD_MINUTES,
  fmtMinutes,
  levelForMinutes,
  practiceStats,
} from "@/lib/stats";

/**
 * 현재 레벨과 총 누적 시간, 다음 레벨까지의 게이지를 담은 단정한 카드.
 * 레벨은 비기너 · 시커 · 딥다이버 · 어웨이큰 · 마스터의 단일 5단계 체계이고,
 * 오른쪽 위 ⓘ 를 누르면 5단계 구성과 시간 기준을 시트로 안내한다.
 * 세션을 마칠 때마다 plays 기록이 쌓여 자동으로 갱신된다.
 */
export function PracticeStatsCard({ compact = false }: { compact?: boolean }) {
  const { plays, hydrated } = useApp();
  const { t } = useI18n();
  const [infoOpen, setInfoOpen] = useState(false);

  const stats = practiceStats(plays);
  const level = levelForMinutes(stats.totalMinutes);
  const levelName = t(`level.${level.level}`);

  const rangeText = (index: number) => {
    const floor = LEVEL_THRESHOLD_MINUTES[index] ?? 0;
    const next = LEVEL_THRESHOLD_MINUTES[index + 1] ?? null;
    return next === null
      ? t("stats.rangeMax", { a: Math.round(floor / 60) })
      : t("stats.range", { a: Math.round(floor / 60), b: Math.round(next / 60) });
  };

  const minutesText = (value: number) => {
    const raw = Math.max(0, value);
    if (raw > 0 && raw < 1) {
      return `${Math.round(raw * 60)}${t("common.seconds")}`;
    }
    const total = Math.round(raw);
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
            <b>{levelName}</b>
            <span className="practice-theme-hint">{rangeText(level.level - 1)}</span>
          </div>
        </div>
        <button
          type="button"
          className="practice-info"
          onClick={() => setInfoOpen(true)}
          aria-label={t("stats.levelInfo")}
        >
          i
        </button>
      </div>

      <div className="practice-hero">
        <b>{hydrated ? minutesText(stats.totalMinutes) : "–"}</b>
        <span>{t("stats.total")}</span>
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
                name: t(`level.${level.level + 1}`),
                time: minutesText(level.remainingMinutes ?? 0),
              })}
            </>
          )
        ) : (
          t("stats.loading")
        )}
      </p>

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} labelledBy="level-guide-title">
        <h3 id="level-guide-title">{t("stats.levelSheetTitle")}</h3>
        <p className="lead">{t("stats.levelSheetLead")}</p>
        <ul className="level-list">
          {[1, 2, 3, 4, 5].map((n) => (
            <li key={n} className={n === level.level ? "on" : ""}>
              <span className="lv">LV.{n}</span>
              <b>{t(`level.${n}`)}</b>
              <span className="rg">{rangeText(n - 1)}</span>
              {n === level.level ? <span className="now">{t("stats.current")}</span> : null}
            </li>
          ))}
        </ul>
        <button type="button" className="btn block" onClick={() => setInfoOpen(false)}>
          {t("common.close")}
        </button>
      </Sheet>
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
