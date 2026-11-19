"use client";

import { ROADMAP_PERIODS, type RoadmapItem } from "@/lib/growth";
import { useI18n } from "@/lib/i18n/LangProvider";

export function LifeRoadmap({
  value,
  onChange,
}: {
  value: RoadmapItem[];
  onChange: (next: RoadmapItem[]) => void;
}) {
  const { t } = useI18n();

  const update = (id: string, patch: Partial<RoadmapItem>) => {
    onChange(value.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const filled = value.filter((item) => item.vision.trim() || item.goal.trim()).length;

  return (
    <section className="growth-panel" aria-label={t("roadmap.title")}>
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">{t("roadmap.eyebrow")}</p>
          <h2>{t("roadmap.title")}</h2>
        </div>
        <span className="tiny">{t("roadmap.count", { n: filled })}</span>
      </header>

      <p className="growth-lead">{t("roadmap.lead")}</p>

      <div className="roadmap">
        {ROADMAP_PERIODS.map((period, index) => {
          const item = value.find((entry) => entry.id === period.id);
          const vision = item?.vision ?? "";
          const goal = item?.goal ?? "";
          return (
            <article key={period.id} className={`road-step step-${index}`}>
              <div className="road-rail" aria-hidden="true">
                <span className="road-dot" />
                {index < ROADMAP_PERIODS.length - 1 ? <span className="road-line" /> : null}
              </div>
              <div className="road-card">
                <div className="road-head">
                  <b>{t(`roadmap.${period.id}`)}</b>
                  <span className="tiny">{t(`roadmap.${period.id}.hint`)}</span>
                </div>
                <label className="road-label">
                  <span>{t("roadmap.scene")}</span>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={vision}
                    onChange={(event) => update(period.id, { vision: event.target.value })}
                    placeholder={
                      period.id === "month"
                        ? t("roadmap.scenePhMonth")
                        : t("roadmap.scenePh", { period: t(`roadmap.${period.id}`) })
                    }
                  />
                </label>
                <label className="road-label">
                  <span>{t("roadmap.goal")}</span>
                  <input
                    value={goal}
                    maxLength={80}
                    onChange={(event) => update(period.id, { goal: event.target.value })}
                    placeholder={t("roadmap.goalPh")}
                  />
                </label>
              </div>
            </article>
          );
        })}
      </div>

      <p className="growth-saved">{t("growth.saved")}</p>
    </section>
  );
}
