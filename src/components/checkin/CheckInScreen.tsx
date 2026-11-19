"use client";

import { useState } from "react";
import { MOODS } from "@/lib/constants";
import { ENERGY_LABELS } from "@/lib/checkin";
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
  const [mood, setMood] = useState<MoodId | null>(initialMood ?? null);
  const [energy, setEnergy] = useState<number>(initialEnergy ?? 3);
  const [error, setError] = useState("");

  return (
    <main className="checkin-screen" data-cosmic="true">
      <div className="checkin-stars" aria-hidden="true" />
      <div className="checkin-inner">
        <header className="checkin-head">
          <p className="checkin-brand">인유 · InYou</p>
          <h1>
            잠깐, 지금의 나를
            <br />
            먼저 만나볼까요?
          </h1>
          <p className="checkin-sub">
            기분과 에너지를 고르면, 당신의 내면으로 들어가는 문이 열려요.
          </p>
        </header>

        <section className="checkin-block" aria-label="지금의 기분">
          <div className="checkin-label">
            <span>지금의 기분</span>
            <span className="tiny">가장 가까운 하나</span>
          </div>
          <div className="checkin-moods" role="group">
            {MOODS.map((item) => (
              <button
                key={item.id}
                type="button"
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
                <span className="l">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="checkin-block" aria-label="에너지 레벨">
          <div className="checkin-label">
            <span>에너지 레벨</span>
            <span className="tiny">{ENERGY_LABELS[energy]}</span>
          </div>
          <div className="checkin-energy">
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={energy}
              onChange={(event) => setEnergy(Number(event.target.value))}
              aria-label="에너지 레벨 1에서 5"
            />
            <div className="checkin-energy-dots" aria-hidden="true">
              {[1, 2, 3, 4, 5].map((value) => (
                <span key={value} className={value <= energy ? "on" : ""} />
              ))}
            </div>
            <div className="checkin-energy-legend">
              <span>지침</span>
              <b>{energy} / 5</b>
              <span>충만</span>
            </div>
          </div>
        </section>

        {error ? <p className="checkin-error">{error}</p> : null}

        <button
          type="button"
          className="btn checkin-start"
          onClick={() => {
            if (!mood) {
              setError("지금의 기분을 하나만 골라주세요.");
              return;
            }
            onSubmit(mood, energy);
          }}
        >
          내면으로 들어가기
        </button>

        {canClose && onClose ? (
          <button type="button" className="checkin-close" onClick={onClose}>
            나중에 할게요
          </button>
        ) : (
          <p className="checkin-foot">
            기록은 이 기기에만 저장돼요. 언제든 다시 체크인할 수 있어요.
          </p>
        )}
      </div>
    </main>
  );
}
