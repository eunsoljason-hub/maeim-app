"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { LANG_KEY, translate, type Lang } from "./dict";

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nValue | null>(null);

function detectLang(): Lang {
  if (typeof window === "undefined") return "ko";
  try {
    const stored = window.localStorage.getItem(LANG_KEY);
    if (stored === "ko" || stored === "en" || stored === "ja") return stored;
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("ko")) return "ko";
    if (nav.startsWith("ja")) return "ja";
    return "en";
  } catch {
    return "en";
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("ko");

  useEffect(() => {
    const next = detectLang();
    setLangState(next);
    document.documentElement.lang = next;
  }, []);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore */
    }
    document.documentElement.lang = next;
  }, []);

  const t = useCallback(
    (key: string, vars?: Record<string, string | number>) => translate(lang, key, vars),
    [lang],
  );

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const context = useContext(I18nContext);
  if (!context) {
    return {
      lang: "ko",
      setLang: () => undefined,
      t: (key, vars) => translate("ko", key, vars),
    };
  }
  return context;
}

/* ------------------------------- 날짜 표기 ------------------------------- */

const WEEKDAYS: Record<Lang, string[]> = {
  ko: ["일", "월", "화", "수", "목", "금", "토"],
  en: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  ja: ["日", "月", "火", "水", "木", "金", "土"],
};

const MONTHS_EN = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

/** "YYYY-MM-DD" → 언어별 긴 날짜. */
export function formatDateKey(key: string, lang: Lang): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (lang === "en") {
    return `${WEEKDAYS.en[date.getDay()]}, ${MONTHS_EN[date.getMonth()]} ${date.getDate()}, ${y}`;
  }
  if (lang === "ja") {
    return `${y}年${date.getMonth() + 1}月${date.getDate()}日（${WEEKDAYS.ja[date.getDay()]}）`;
  }
  return `${date.getMonth() + 1}월 ${date.getDate()}일 ${WEEKDAYS.ko[date.getDay()]}요일`;
}

/** "YYYY-MM-DD" → "11/19 (수)" 같은 짧은 표기. */
export function formatDateShort(key: string, lang: Lang): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (lang === "en") {
    return `${MONTHS_EN[date.getMonth()].slice(0, 3)} ${date.getDate()}`;
  }
  if (lang === "ja") {
    return `${date.getMonth() + 1}/${date.getDate()}（${WEEKDAYS.ja[date.getDay()]}）`;
  }
  return `${date.getMonth() + 1}/${date.getDate()} (${WEEKDAYS.ko[date.getDay()]})`;
}

/** 요일 한 글자 (주간 스트립용). */
export function weekdayNarrow(key: string, lang: Lang): string {
  const [y, m, d] = key.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  if (lang === "en") return ["S", "M", "T", "W", "T", "F", "S"][date.getDay()];
  if (lang === "ja") return WEEKDAYS.ja[date.getDay()];
  return WEEKDAYS.ko[date.getDay()];
}
