"use client";

import { useState } from "react";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { MOODS } from "@/lib/constants";
import { ENERGY_LABELS } from "@/lib/checkin";
import { useI18n } from "@/lib/i18n/LangProvider";
import { moodLabel } from "@/lib/i18n/labels";
import type { MoodId } from "@/lib/types";

/**
 * 첫 화면 — 기분과 에너지를 먼저 확인한다.
 * 완료하면 코스믹 줌인 연출을 거쳐 내면 허브로 들어간다.
 */
export function CheckInScreen({
  initialMood,
  initialEnergy,
  onSubmit,
  onClose,
  canClose,
}: {
  initialMood?: MoodId | null;
  initialEnergy?: number;
  onSubmit: (mood: MoodId, energy: number) => void;
  onClose?: () => void;
  canClose?: boolean;
}) {
  const { t, lang } = useI18n();
  const [mood, setMood] = useState<MoodId | null>(initialMood ?? null);
  const [energy, setEnergy] = useState<number>(initialEnergy ?? 3);
  const [error, setError] = useState("");

  return (
    <main className="checkin-screen" data-cosmic="true">
      <div className="checkin-stars" aria-hidden="true" />
      <div className="checkin-inner">
        <div className="checkin-top">
          <p className="checkin-brand">{t("checkin.brand")}</p>
          <LangSwitch tone="dark" />
        </div>

        <header className="checkin-head">
          <h1>
            {t("checkin.title1")}
            <br />
            {t("checkin.title2")}
          </h1>
          <p className="checkin-sub">{t("checkin.sub")}</p>
        </header>

        <section className="checkin-block" aria-label={t("checkin.mood")}>
          <div className="checkin-label">
            <span>{t("checkin.mood")}</span>
            <span className="tiny">{t("checkin.moodHint")}</span>
          </div>
          <div className="checkin-moods" role="group">
            {MOODS.map((item) => (
              <button
                key={item.id}
                type="button"
                lang={lang}
                className={`checkin-mood ${mood === item.id ? "on" : ""}`}
                onClick={() => {
                  setMood(item.id);
                  setError("");
                }}
                aria-pressed={mood === item.id}
              >
                <span className="e" aria-hidden="true">
                  {item.emoji}
                </span>
                <span className="l">{moodLabel(item.id, t)}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="checkin-block" aria-label={t("checkin.energy")}>
          <div className="checkin-label">
            <span>{t("checkin.energy")}</span>
            <span className="tiny">{t(`energy.${energy}`)}</span>
          </div>
          <div className="checkin-energy">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={energy}
              onChange={(event) => setEnergy(Number(event.target.value))}
              aria-label={`${t("checkin.energy")} 1-5`}
            />
            <div className="checkin-energy-dots" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((value) => (
                <span key={value} className={value <= energy ? "on" : ""} />
              ))}
            </div>
            <div className="checkin-energy-legend">
              <span>{t("energy.low")}</span>
              <b>{energy} / 5</b>
              <span>{t("energy.high")}</span>
            </div>
          </div>
        </section>

        {error ? <p className="checkin-error">{error}</p> : null}

        <button
          type="button"
          className="btn checkin-start"
          onClick={() => {
            if (!mood) {
              setError(t("checkin.error"));
              return;
            }
            onSubmit(mood, energy);
          }}
        >
          {t("checkin.start")}
        </button>

        {canClose && onClose ? (
          <button type="button" className="checkin-close" onClick={onClose}>
            {t("checkin.later")}
          </button>
        ) : (
          <p className="checkin-foot">{t("checkin.foot")}</p>
        )}
      </div>
    </main>
  );
}
