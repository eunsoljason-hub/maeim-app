"use client";

import { LANGS } from "@/lib/i18n/dict";
import { useI18n } from "@/lib/i18n/LangProvider";

/**
 * 언어 선택기 — EN / 한국어 / 日本語.
 * 어느 화면에서든 즉시 전환되고, 선택은 localStorage에 남는다.
 */
export function LangSwitch({ tone = "light" }: { tone?: "light" | "dark" }) {
  const { lang, setLang } = useI18n();
  return (
    <div className={`lang-switch ${tone}`} role="group" aria-label="Language">
      {LANGS.map((item) => (
        <button
          key={item.id}
          type="button"
          className={lang === item.id ? "on" : ""}
          onClick={() => setLang(item.id)}
          aria-pressed={lang === item.id}
          aria-label={item.label}
          title={item.label}
        >
          {item.short}
        </button>
      ))}
    </div>
  );
}
