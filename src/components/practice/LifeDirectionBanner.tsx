"use client";

import { useEffect, useState } from "react";

/**
 * 화면 맨 위에 고정되는 "삶의 방향" 배너.
 * 사용자가 원하는 삶의 방향이나 핵심 문장을 직접 적어 두고, 어느 화면에서든
 * 다시 보며 하루의 기준으로 삼는다. localStorage에 저장된다.
 */
export const DIRECTION_KEY = "maeum.direction.v1";
export const DEFAULT_DIRECTION =
  "나는 나만의 속도로, 사랑하는 사람들과 오래 웃으며 살아갑니다.";

interface Direction {
  text: string;
  updatedAt: string;
}

export function loadDirection(): Direction {
  if (typeof window === "undefined") {
    return { text: DEFAULT_DIRECTION, updatedAt: "" };
  }
  try {
    const raw = window.localStorage.getItem(DIRECTION_KEY);
    if (!raw) return { text: DEFAULT_DIRECTION, updatedAt: "" };
    const parsed = JSON.parse(raw) as Partial<Direction>;
    if (typeof parsed.text === "string" && parsed.text.trim()) {
      return { text: parsed.text.trim(), updatedAt: String(parsed.updatedAt ?? "") };
    }
    return { text: DEFAULT_DIRECTION, updatedAt: "" };
  } catch {
    return { text: DEFAULT_DIRECTION, updatedAt: "" };
  }
}

export function LifeDirectionBanner({ compact = false }: { compact?: boolean }) {
  const [text, setText] = useState(DEFAULT_DIRECTION);
  const [draft, setDraft] = useState(DEFAULT_DIRECTION);
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadDirection();
    setText(saved.text);
    setDraft(saved.text);
    setReady(true);
  }, []);

  const save = () => {
    const value = draft.trim() || DEFAULT_DIRECTION;
    setText(value);
    setDraft(value);
    setEditing(false);
    try {
      window.localStorage.setItem(
        DIRECTION_KEY,
        JSON.stringify({ text: value, updatedAt: new Date().toISOString() }),
      );
    } catch {
      /* 저장 실패해도 표시는 유지한다 */
    }
  };

  return (
    <section className={`direction-banner ${compact ? "compact" : ""}`} aria-label="나의 삶의 방향">
      <div className="direction-mark" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M12 3.5 14.6 9l6 .9-4.3 4.2 1 6-5.3-2.8L6.7 20l1-6L3.4 9.9 9.4 9z" />
        </svg>
      </div>
      {editing ? (
        <div className="direction-edit">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 160))}
            rows={2}
            maxLength={160}
            placeholder="내가 향하는 삶의 방향, 오늘 지키고 싶은 한 문장"
            aria-label="삶의 방향 문장"
            autoFocus
          />
          <div className="direction-edit-actions">
            <button type="button" className="direction-save" onClick={save}>
              저장
            </button>
            <button
              type="button"
              className="direction-cancel"
              onClick={() => {
                setDraft(text);
                setEditing(false);
              }}
            >
              취소
            </button>
          </div>
        </div>
      ) : (
        <div className="direction-body">
          <span className="direction-label">나의 삶의 방향</span>
          <p className="direction-text">{ready ? text : DEFAULT_DIRECTION}</p>
        </div>
      )}
      {!editing ? (
        <button
          type="button"
          className="direction-edit-btn"
          onClick={() => setEditing(true)}
          aria-label="삶의 방향 수정"
        >
          ✎
        </button>
      ) : null}
    </section>
  );
}
