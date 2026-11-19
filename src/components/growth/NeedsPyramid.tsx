"use client";

import { NEED_STAGES, type NeedsState } from "@/lib/growth";

export function NeedsPyramid({
  value,
  onChange,
}: {
  value: NeedsState;
  onChange: (next: NeedsState) => void;
}) {
  const stage = NEED_STAGES.find((item) => item.level === value.level) ?? null;
  const ordered = [...NEED_STAGES].reverse();

  return (
    <section className="growth-panel" aria-label="매슬로우 욕구 피라미드">
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">Maslow · 5 stages</p>
          <h2>욕구 피라미드</h2>
        </div>
        <span className="tiny">지금 머무는 단계를 눌러보세요</span>
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
                {item.label}
                <em>{item.hint}</em>
              </span>
              {selected ? <span className="pyramid-check">✓</span> : null}
            </button>
          );
        })}
      </div>

      <p className="pyramid-caption">
        아래에서 위로: 생리적 욕구 → 안전 → 소속과 사랑 → 존중 → 자아실현
      </p>

      <div className="growth-field">
        <label htmlFor="needs-note">지금 내가 이 단계에 있는 이유</label>
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
              ? `예: 요즘은 ${stage.hint}이 가장 먼저 신경 쓰인다.`
              : "요즘 가장 먼저 채워야 한다고 느끼는 것을 적어보세요."
          }
        />
      </div>

      <p className="growth-saved">
        {stage ? (
          <>
            지금의 단계 · <b>{stage.level}. {stage.label}</b>
          </>
        ) : (
          "아직 단계를 고르지 않았어요."
        )}
      </p>
    </section>
  );
}
