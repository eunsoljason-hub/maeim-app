import type { MoodId, ThemeId } from "@/lib/types";
import type { Lang } from "./dict";

type Translate = (key: string, vars?: Record<string, string | number>) => string;

export function moodLabel(id: MoodId, t: Translate) {
  return t(`mood.${id}`);
}

export function moodShort(id: MoodId, t: Translate) {
  return t(`mood.short.${id}`);
}

export function themeLabel(id: ThemeId, t: Translate) {
  return t(`theme.${id}`);
}

export function localeTag(lang: Lang) {
  return lang === "ko" ? "ko-KR" : lang === "ja" ? "ja-JP" : "en-US";
}
