"use client";

import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { loadDirectionText } from "@/components/practice/LifeDirectionBanner";
import { DEFAULT_SESSIONS, affirmationTextFor } from "@/lib/data/affirmations";
import { loadTodayCheckIn } from "@/lib/checkin";
import { translate, type Lang } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/LangProvider";
import { moodEmojiOf } from "@/lib/i18n/emoji";
import {
  defaultWidget,
  type WidgetSettings,
  type WidgetSize,
  type WidgetStyle,
} from "@/lib/studio";
import { levelForMinutes, practiceStats } from "@/lib/stats";

const STYLES: WidgetStyle[] = ["cream", "night", "cosmic", "gold"];
const SIZES: WidgetSize[] = ["small", "medium", "large"];

export function WidgetStudio({
  value,
  onChange,
}: {
  value: WidgetSettings;
  onChange: (next: WidgetSettings) => void;
}) {
  const { t, lang } = useI18n();
  const { plays } = useApp();
  const [direction, setDirection] = useState("");

  useEffect(() => {
    setDirection(loadDirectionText());
  }, []);

  const effectiveLang = value.langSet ? value.lang : lang;
  const stats = practiceStats(plays);
  const level = levelForMinutes(stats.totalMinutes);
  const checkIn = loadTodayCheckIn();
  const affirmation = DEFAULT_SESSIONS[0].items[value.affirmationIndex % 30];

  const text = useMemo(
    () => ({
      direction:
        direction || translate(effectiveLang, "direction.default"),
      affirmation: affirmationTextFor(affirmation, effectiveLang),
      level: translate(effectiveLang, `level.${level.level}`),
      today: translate(effectiveLang, "widget.todayMood"),
      total: translate(effectiveLang, "widget.total"),
      cta: translate(effectiveLang, "widget.cta"),
      minutes: (n: number) =>
        n >= 60
          ? translate(effectiveLang, "stats.hoursMin", {
              h: Math.floor(n / 60),
              m: Math.round(n % 60),
            })
          : translate(effectiveLang, "stats.minutes", { n: Math.round(n) }),
    }),
    [direction, affirmation, effectiveLang, level.level],
  );

  const update = (patch: Partial<WidgetSettings>) => onChange({ ...value, ...patch });

  return (
    <section className="growth-panel widget-panel" aria-label={t("studio.tab.widgets")}>
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">{t("studio.eyebrow")}</p>
          <h2>{t("studio.tab.widgets")}</h2>
        </div>
        <span className="tiny">{t("widget.saved")}</span>
      </header>
      <p className="growth-lead">{t("widget.lead")}</p>

      <div className="widget-size-tabs" role="group" aria-label={t("widget.size")}>
        {SIZES.map((size) => (
          <button
            key={size}
            type="button"
            className={value.size === size ? "on" : ""}
            onClick={() => update({ size })}
            aria-pressed={value.size === size}
          >
            {t(`widget.${size}`)}
          </button>
        ))}
      </div>

      <div className={`widget-stage size-${value.size}`}>
        <div className={`widget-face ${value.style} size-${value.size}`}>
          <div className="widget-glow" aria-hidden="true" />
          {value.size === "small" ? (
            <>
              <p className="widget-aff small">{text.affirmation}</p>
              <span className="widget-cta">{text.cta} ›</span>
            </>
          ) : null}

          {value.size === "medium" ? (
            <>
              {value.showDirection ? <p className="widget-direction">{text.direction}</p> : null}
              {value.showStats ? (
                <div className="widget-stats">
                  <span className="widget-level">LV.{level.level}</span>
                  <b>{text.level}</b>
                  <span className="widget-total">
                    {text.total} {text.minutes(stats.totalMinutes)}
                  </span>
                </div>
              ) : null}
            </>
          ) : null}

          {value.size === "large" ? (
            <>
              {value.showDirection ? <p className="widget-direction">{text.direction}</p> : null}
              {value.showAffirmation ? <p className="widget-aff">{text.affirmation}</p> : null}
              <div className="widget-bottom">
                {value.showMood && checkIn ? (
                  <span className="widget-mood">
                    {moodEmojiOf(checkIn.mood)} {text.today}
                  </span>
                ) : null}
                {value.showStats ? (
                  <span className="widget-total">
                    LV.{level.level} {text.level} · {text.minutes(stats.totalMinutes)}
                  </span>
                ) : null}
              </div>
              <span className="widget-cta">{text.cta} ›</span>
            </>
          ) : null}

          {value.caption ? <p className="widget-caption">{value.caption}</p> : null}
        </div>
      </div>

      <div className="widget-controls">
        <div className="widget-row">
          <span className="widget-label">{t("widget.style")}</span>
          <div className="widget-swatches">
            {STYLES.map((style) => (
              <button
                key={style}
                type="button"
                className={`swatch ${style} ${value.style === style ? "on" : ""}`}
                onClick={() => update({ style })}
                aria-label={t(`widget.style.${style}`)}
                title={t(`widget.style.${style}`)}
              />
            ))}
          </div>
        </div>

        <div className="widget-row">
          <span className="widget-label">{t("widget.items")}</span>
          <div className="widget-toggles">
            {(
              [
                ["showDirection", "widget.direction"],
                ["showStats", "widget.stats"],
                ["showAffirmation", "widget.affirmation"],
                ["showMood", "widget.mood"],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={value[key] ? "on" : ""}
                onClick={() => update({ [key]: !value[key] } as Partial<WidgetSettings>)}
                aria-pressed={value[key]}
              >
                {t(label)}
              </button>
            ))}
          </div>
        </div>

        <div className="widget-row">
          <span className="widget-label">{t("widget.affirmation")}</span>
          <button
            type="button"
            className="growth-reset"
            onClick={() =>
              update({ affirmationIndex: (value.affirmationIndex + 1) % 30 })
            }
          >
            {t("widget.affPrev")} ›
          </button>
        </div>

        <label className="widget-caption-field">
          <span>{t("widget.caption")}</span>
          <input
            value={value.caption}
            onChange={(event) => update({ caption: event.target.value.slice(0, 80) })}
            placeholder={t("widget.captionPh")}
            maxLength={80}
          />
        </label>

        <label className="widget-caption-field">
          <span>{t("lang.label")}</span>
          <select
            value={effectiveLang}
            onChange={(event) => update({ lang: event.target.value as Lang, langSet: true })}
          >
            <option value="ko">한국어</option>
            <option value="en">English</option>
            <option value="ja">日本語</option>
          </select>
        </label>

        <button type="button" className="growth-reset" onClick={() => onChange(defaultWidget())}>
          {t("widget.reset")}
        </button>
      </div>

      <p className="growth-saved widget-native">{t("widget.native")}</p>
      <p className="tiny">
        {t("lang.label")}: {lang.toUpperCase()}
      </p>
    </section>
  );
}
