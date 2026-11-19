"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LangProvider";

/**
 * 화면 맨 위에 고정되는 "삶의 방향" 배너.
 * 사용자가 원하는 삶의 방향이나 핵심 문장을 직접 적어 두고, 어느 화면에서든
 * 다시 보며 하루의 기준으로 삼는다. localStorage에 저장된다.
 * 문장은 위젯 스튜디오와 공유된다.
 */
export const DIRECTION_KEY = "maeum.direction.v1";

interface Direction {
  text: string;
  updatedAt: string;
}

export function loadDirectionText(): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(DIRECTION_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw) as Partial<Direction>;
    return typeof parsed.text === "string" ? parsed.text.trim() : "";
  } catch {
    return "";
  }
}

export function saveDirectionText(text: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(
      DIRECTION_KEY,
      JSON.stringify({ text: text.trim(), updatedAt: new Date().toISOString() }),
    );
  } catch {
    /* ignore */
  }
}

export function LifeDirectionBanner({ compact = false }: { compact?: boolean }) {
  const { t } = useI18n();
  const [text, setText] = useState("");
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved = loadDirectionText();
    setText(saved);
    setDraft(saved || t("direction.default"));
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = () => {
    const value = draft.trim() || t("direction.default");
    setText(value);
    setDraft(value);
    setEditing(false);
    saveDirectionText(value);
  };

  return (
    <section
      className={`direction-banner ${compact ? "compact" : ""}`}
      aria-label={t("direction.label")}
    >
      <span className="direction-accent" aria-hidden="true" />
      {editing ? (
        <div className="direction-edit">
          <textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value.slice(0, 160))}
            rows={2}
            maxLength={160}
            placeholder={t("direction.ph")}
            aria-label={t("direction.label")}
            autoFocus
          />
          <div className="direction-edit-actions">
            <button type="button" className="direction-save" onClick={save}>
              {t("direction.save")}
            </button>
            <button
              type="button"
              className="direction-cancel"
              onClick={() => {
                setDraft(text || t("direction.default"));
                setEditing(false);
              }}
            >
              {t("direction.cancel")}
            </button>
          </div>
        </div>
      ) : (
        <div className="direction-body">
          <div className="direction-labelrow">
            <span className="direction-label">{t("direction.label")}</span>
            <span className="direction-rule" aria-hidden="true" />
          </div>
          <p className="direction-text">{ready ? text || t("direction.default") : t("direction.default")}</p>
        </div>
      )}
      {!editing ? (
        <button
          type="button"
          className="direction-edit-btn"
          onClick={() => setEditing(true)}
          aria-label={t("direction.edit")}
        >
          ✎
        </button>
      ) : null}
    </section>
  );
}
