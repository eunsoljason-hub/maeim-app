"use client";

import { useMemo } from "react";
import { HEX_DEFAULT, type HexState } from "@/lib/growth";
import { useI18n } from "@/lib/i18n/LangProvider";

const SIZE = 240;
const CENTER = SIZE / 2;
const RADIUS = 92;

function point(index: number, ratio: number) {
  const angle = (-90 + index * 60) * (Math.PI / 180);
  const r = RADIUS * ratio;
  return {
    x: CENTER + Math.cos(angle) * r,
    y: CENTER + Math.sin(angle) * r,
  };
}

function polygon(ratio: number) {
  return Array.from({ length: 6 }, (_, i) => {
    const p = point(i, ratio);
    return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
  }).join(" ");
}

export function LifeHexagon({
  value,
  onChange,
}: {
  value: HexState;
  onChange: (next: HexState) => void;
}) {
  const { t } = useI18n();

  const dataPolygon = useMemo(
    () =>
      value.scores
        .map((score, i) => {
          const p = point(i, Math.min(1, Math.max(0.08, score / 10)));
          return `${p.x.toFixed(1)},${p.y.toFixed(1)}`;
        })
        .join(" "),
    [value.scores],
  );

  const shownLabel = (index: number) =>
    value.labels[index] === HEX_DEFAULT.labels[index]
      ? t(`hex.${index + 1}`)
      : value.labels[index];

  const average =
    value.scores.reduce((sum, score) => sum + score, 0) / Math.max(1, value.scores.length);
  const lowestIndex = value.scores.indexOf(Math.min(...value.scores));
  const highestIndex = value.scores.indexOf(Math.max(...value.scores));

  const setLabel = (index: number, label: string) => {
    const labels = value.labels.map((item, i) => (i === index ? label.slice(0, 12) : item));
    onChange({ ...value, labels });
  };

  const setScore = (index: number, score: number) => {
    const scores = value.scores.map((item, i) => (i === index ? score : item));
    onChange({ ...value, scores });
  };

  return (
    <section className="growth-panel" aria-label={t("hex.title")}>
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">{t("hex.eyebrow")}</p>
          <h2>{t("hex.title")}</h2>
        </div>
        <span className="tiny">{t("hex.average", { n: average.toFixed(1) })}</span>
      </header>

      <div className="hex-wrap">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="hex-chart" role="img" aria-label={t("hex.title")}>
          {[0.2, 0.4, 0.6, 0.8, 1].map((ratio) => (
            <polygon
              key={ratio}
              points={polygon(ratio)}
              fill="none"
              stroke="rgba(38,40,47,.1)"
              strokeWidth={1}
            />
          ))}
          {Array.from({ length: 6 }, (_, i) => {
            const p = point(i, 1);
            return (
              <line
                key={i}
                x1={CENTER}
                y1={CENTER}
                x2={p.x}
                y2={p.y}
                stroke="rgba(38,40,47,.1)"
                strokeWidth={1}
              />
            );
          })}
          <polygon
            points={dataPolygon}
            fill="rgba(126,154,135,.32)"
            stroke="#4e6b5b"
            strokeWidth={2}
            strokeLinejoin="round"
          />
          {value.scores.map((score, i) => {
            const p = point(i, Math.min(1, Math.max(0.08, score / 10)));
            return <circle key={i} cx={p.x} cy={p.y} r={3.4} fill="#4e6b5b" />;
          })}
          {value.labels.map((label, i) => {
            const p = point(i, 1.19);
            const anchor = p.x < CENTER - 4 ? "end" : p.x > CENTER + 4 ? "start" : "middle";
            return (
              <text
                key={`${label}-${i}`}
                x={p.x}
                y={p.y}
                textAnchor={anchor}
                dominantBaseline="middle"
                fontSize={10.5}
                fill="#6e6c78"
                fontWeight={600}
              >
                {shownLabel(i) || t("hex.item", { n: i + 1 })}
              </text>
            );
          })}
        </svg>
      </div>

      <p className="hex-hint">
        {t("hex.hint", {
          low: shownLabel(lowestIndex),
          lowScore: value.scores[lowestIndex],
          high: shownLabel(highestIndex),
          highScore: value.scores[highestIndex],
        })}
      </p>

      <div className="hex-list">
        {value.labels.map((label, index) => (
          <div key={index} className="hex-row">
            <input
              value={shownLabel(index)}
              onChange={(event) => setLabel(index, event.target.value)}
              maxLength={12}
              aria-label={t("hex.item", { n: index + 1 })}
              className="hex-name"
            />
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={value.scores[index]}
              onChange={(event) => setScore(index, Number(event.target.value))}
              aria-label={`${shownLabel(index)} ${value.scores[index]}`}
              className="hex-range"
            />
            <span className="hex-score">{value.scores[index]}</span>
          </div>
        ))}
      </div>

      <button
        type="button"
        className="growth-reset"
        onClick={() =>
          onChange({
            labels: [...HEX_DEFAULT.labels],
            scores: [...HEX_DEFAULT.scores],
          })
        }
      >
        {t("hex.reset")}
      </button>
    </section>
  );
}
