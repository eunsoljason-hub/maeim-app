"use client";

import { useMemo } from "react";
import type { HexState } from "@/lib/growth";

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
    <section className="growth-panel" aria-label="인생 육각형">
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">Life balance</p>
          <h2>인생 육각형</h2>
        </div>
        <span className="tiny">평균 {average.toFixed(1)} / 10</span>
      </header>

      <div className="hex-wrap">
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="hex-chart" role="img" aria-label="인생 균형 육각형 차트">
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
                {label || `항목 ${i + 1}`}
              </text>
            );
          })}
        </svg>
      </div>

      <p className="hex-hint">
        가장 낮은 곳은 <b>{value.labels[lowestIndex]}</b> {value.scores[lowestIndex]}점, 가장 높은 곳은{" "}
        <b>{value.labels[highestIndex]}</b> {value.scores[highestIndex]}점이에요. 모양이 한쪽으로
        치우쳐도 괜찮아요. 지금의 균형을 보는 것부터 시작해요.
      </p>

      <div className="hex-list">
        {value.labels.map((label, index) => (
          <div key={index} className="hex-row">
            <input
              value={label}
              onChange={(event) => setLabel(index, event.target.value)}
              maxLength={12}
              aria-label={`${index + 1}번째 항목 이름`}
              className="hex-name"
            />
            <input
              type="range"
              min={1}
              max={10}
              step={1}
              value={value.scores[index]}
              onChange={(event) => setScore(index, Number(event.target.value))}
              aria-label={`${label || `항목 ${index + 1}`} 점수`}
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
            labels: ["건강", "마음", "가족", "커리어", "재정", "성장"],
            scores: [6, 6, 7, 4, 4, 6],
          })
        }
      >
        예시 값으로 되돌리기
      </button>
    </section>
  );
}
