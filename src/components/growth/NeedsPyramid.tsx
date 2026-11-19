"use client";

import { NEED_STAGES, type NeedsState } from "@/lib/growth";
import { useI18n } from "@/lib/i18n/LangProvider";

export function NeedsPyramid({
  value,
  onChange,
}: {
  value: NeedsState;
  onChange: (next: NeedsState) => void;
}) {
  const { t } = useI18n();
  const stage = NEED_STAGES.find((item) => item.level === value.level) ?? null;
  const ordered = [...NEED_STAGES].reverse();

  return (
    <section className="growth-panel" aria-label={t("needs.title")}>
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">{t("needs.eyebrow")}</p>
          <h2>{t("needs.title")}</h2>
        </div>
        <span className="tiny">{t("needs.hint")}</span>
      </header>

      <div className="pyramid">
        {ordered.map((item) => {
          const selected = value.level === item.level;
          const width = 48 + (5 - item.level) * 13;
          return (
            <button
              key={item.level}
              type="button"
              className={`pyramid-row ${selected ? "on" : ""}`}
              style={{
                width: `${width}%`,
                background: selected
                  ? item.color
                  : `color-mix(in srgb, ${item.color} 26%, #fffdf8)`,
                borderColor: selected ? "transparent" : "rgba(38,40,47,.08)",
              }}
              onClick={() =>
                onChange({
                  ...value,
                  level: selected ? null : item.level,
                  updatedAt: new Date().toISOString(),
                })
              }
              aria-pressed={selected}
            >
              <span className="pyramid-num">{item.level}</span>
              <span className="pyramid-label">
                {t(`needs.${item.level}`)}
                <em>{t(`needs.${item.level}.hint`)}</em>
              </span>
              {selected ? <span className="pyramid-check">✓</span> : null}
            </button>
          );
        })}
      </div>

      <p className="pyramid-caption">{t("needs.caption")}</p>

      <div className="growth-field">
        <label htmlFor="needs-note">{t("needs.note")}</label>
        <textarea
          id="needs-note"
          rows={3}
          maxLength={400}
          value={value.note}
          onChange={(event) =>
            onChange({
              ...value,
              note: event.target.value,
              updatedAt: new Date().toISOString(),
            })
          }
          placeholder={
            stage
              ? t("needs.notePhStage", { hint: t(`needs.${stage.level}.hint`) })
              : t("needs.notePh")
          }
        />
      </div>

      <p className="growth-saved">
        {stage
          ? t("needs.current", { level: stage.level, label: t(`needs.${stage.level}`) })
          : t("needs.none")}
      </p>
    </section>
  );
}
