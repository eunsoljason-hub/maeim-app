import {
  DEFAULT_SESSIONS,
  type Affirmation,
  type AffirmationSession,
} from "./data/affirmations";
import { newLocalId } from "./media";

const KEY = "maeum.affirmations.v1";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function isItem(value: unknown): value is Affirmation {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<Affirmation>;
  return (
    typeof item.id === "string" &&
    typeof item.ko === "string" &&
    typeof item.en === "string"
  );
}

function isSession(value: unknown): value is AffirmationSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<AffirmationSession>;
  return (
    typeof session.id === "string" &&
    typeof session.title === "string" &&
    Array.isArray(session.items) &&
    session.items.every(isItem)
  );
}

/** 저장된 확언 세션을 읽는다. 없거나 깨졌으면 기본 120문장으로 되돌린다. */
export function loadSessions(): AffirmationSession[] {
  if (typeof window === "undefined") return clone(DEFAULT_SESSIONS);
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return clone(DEFAULT_SESSIONS);
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed) || parsed.length === 0) return clone(DEFAULT_SESSIONS);
    const sessions = parsed.filter(isSession).map((session) => ({
      ...session,
      items: session.items.filter(isItem),
      builtin: session.builtin !== false,
      emoji: typeof session.emoji === "string" ? session.emoji : "✶",
      description: typeof session.description === "string" ? session.description : "",
      titleEn: typeof session.titleEn === "string" ? session.titleEn : "",
    }));
    if (sessions.length === 0) return clone(DEFAULT_SESSIONS);

    /* 새로 추가된 기본 세션이 있으면 뒤에 붙여 준다. */
    for (const seeded of DEFAULT_SESSIONS) {
      if (!sessions.some((session) => session.id === seeded.id)) {
        sessions.push(clone(seeded));
      }
    }
    return sessions;
  } catch {
    return clone(DEFAULT_SESSIONS);
  }
}

export function saveSessions(sessions: AffirmationSession[]): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(sessions));
    return true;
  } catch {
    return false;
  }
}

export function resetSessions(): AffirmationSession[] {
  const fresh = clone(DEFAULT_SESSIONS);
  saveSessions(fresh);
  return fresh;
}

export function makeSession(title: string, emoji: string, description: string): AffirmationSession {
  return {
    id: `custom-${newLocalId("s")}`,
    title: title.trim().slice(0, 40) || "나의 확언",
    titleEn: "My Affirmations",
    emoji: emoji || "✶",
    description: description.trim().slice(0, 80),
    builtin: false,
    items: [],
  };
}

export function makeAffirmation(ko: string, en: string): Affirmation {
  return {
    id: newLocalId("aff"),
    ko: ko.trim(),
    en: en.trim(),
  };
}

/** 카드에 보여줄 문장이 있는 세션인지. */
export function sessionHasItems(session: AffirmationSession): boolean {
  return session.items.length > 0;
}

export function totalSentences(sessions: AffirmationSession[]): number {
  return sessions.reduce((sum, session) => sum + session.items.length, 0);
}
