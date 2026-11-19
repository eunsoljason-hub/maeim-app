"use client";

import { useState } from "react";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { MOODS } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/LangProvider";
import { moodLabel } from "@/lib/i18n/labels";
import { primeWarpAudio } from "@/lib/audio/warp";
import type { MoodId } from "@/lib/types";

/**
 * 첫 화면 — 기분과 에너지를 먼저 확인한다.
 * 완료하면 코스믹 줌인 연출을 거쳐 내면 허브로 들어간다.
 * 버튼은 화면 아래에 붙어 있어, 390×844 같은 모바일 한 화면에 스크롤 없이 다 들어온다.
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
          <h1>{t("checkin.title")}</h1>
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
            <span className="tiny">{t("checkin.energyHint")}</span>
          </div>
          <div className="checkin-energy">
            <div
              className="energy-stack"
              role="group"
              aria-label={`${t("checkin.energy")} 1-5`}
            >
              {[5, 4, 3, 2, 1].map((value) => {
                const label = t(`energy.${value}`);
                return (
                  <button
                    key={value}
                    type="button"
                    className={`energy-step lv${value} ${value === energy ? "on" : ""}`}
                    onClick={() => setEnergy(value)}
                    aria-pressed={value === energy}
                    aria-label={`${value}/5 · ${label}`}
                  >
                    <span className="n" aria-hidden="true">
                      {value}
                    </span>
                    <span className="lbl" aria-hidden="true">
                      {label}
                    </span>
                    <span className="track" aria-hidden="true">
                      <span className="fill" />
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {error ? <p className="checkin-error">{error}</p> : null}

        <div className="checkin-cta">
          <button
            type="button"
            className="btn checkin-start"
            onClick={() => {
              if (!mood) {
                setError(t("checkin.error"));
                return;
              }
              /* 사용자 제스처 안에서 오디오 컨텍스트를 열어, 전환 화면의
                 우주 진입 효과음이 브라우저 자동재생 차단에 걸리지 않게 한다. */
              primeWarpAudio();
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
      </div>
    </main>
  );
}
