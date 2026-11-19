import type { Lang } from "./i18n/dict";

/* ------------------------------- 위젯 스튜디오 ------------------------------- */

export type WidgetSize = "small" | "medium" | "large";
export type WidgetStyle = "cream" | "night" | "cosmic" | "gold";

export interface WidgetSettings {
  size: WidgetSize;
  style: WidgetStyle;
  /** 위젯 안에서만 쓰는 표시 언어 (앱 언어와 별개) */
  lang: Lang;
  showDirection: boolean;
  showStats: boolean;
  showAffirmation: boolean;
  showMood: boolean;
  affirmationIndex: number;
  caption: string;
  /** 사용자가 위젯 언어를 직접 고른 적이 있는지 */
  langSet?: boolean;
}

export const WIDGET_KEY = "maeum.widgets.v1";

export function defaultWidget(): WidgetSettings {
  return {
    size: "medium",
    style: "cream",
    lang: "ko",
    showDirection: true,
    showStats: true,
    showAffirmation: true,
    showMood: true,
    affirmationIndex: 0,
    caption: "",
  };
}

export function loadWidget(): WidgetSettings {
  const base = defaultWidget();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(WIDGET_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<WidgetSettings>;
    return {
      size:
        parsed.size === "small" || parsed.size === "medium" || parsed.size === "large"
          ? parsed.size
          : base.size,
      style:
        parsed.style === "cream" ||
        parsed.style === "night" ||
        parsed.style === "cosmic" ||
        parsed.style === "gold"
          ? parsed.style
          : base.style,
      lang:
        parsed.lang === "ko" || parsed.lang === "en" || parsed.lang === "ja"
          ? parsed.lang
          : base.lang,
      showDirection: parsed.showDirection !== false,
      showStats: parsed.showStats !== false,
      showAffirmation: parsed.showAffirmation !== false,
      showMood: parsed.showMood !== false,
      affirmationIndex:
        typeof parsed.affirmationIndex === "number" ? Math.max(0, parsed.affirmationIndex) : 0,
      caption: typeof parsed.caption === "string" ? parsed.caption.slice(0, 80) : "",
      langSet: Boolean(parsed.langSet),
    };
  } catch {
    return base;
  }
}

export function saveWidget(value: WidgetSettings): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(WIDGET_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/* --------------------------------- 리마인더 --------------------------------- */

export type ReminderMethod = "push" | "sound" | "banner";

export interface ReminderSettings {
  enabled: boolean;
  /** "HH:MM" 여러 개 */
  times: string[];
  methods: ReminderMethod[];
  message: string;
  lang: Lang;
  /** 사용자가 알림 언어/문구를 직접 고른 적이 있는지 */
  langSet?: boolean;
  /** 마지막으로 알림을 띄운 "YYYY-MM-DD|HH:MM" (같은 시간 중복 방지) */
  lastFired: string;
}

export const REMINDER_KEY = "maeum.reminders.v1";

export const REMINDER_DEFAULT_MESSAGE: Record<Lang, string> = {
  ko: "잠시 하던 일을 멈추고 조용한 곳으로 가서, 3분 동안 에고를 떠나 내면 깊숙이 영혼으로 여행하는 시간을 가져보세요",
  en: "Pause what you're doing, find a quiet place, and take three minutes to leave the ego behind and travel deep into your inner world.",
  ja: "今していることを少し止めて静かな場所へ行き、3分間、エゴから離れて内面の奥深く、魂へ旅する時間を持ってみましょう。",
};

export function defaultReminder(): ReminderSettings {
  return {
    enabled: false,
    times: ["21:00"],
    methods: ["banner", "sound"],
    message: REMINDER_DEFAULT_MESSAGE.ko,
    lang: "ko",
    lastFired: "",
  };
}

export function isValidTime(value: string): boolean {
  if (!/^\d{2}:\d{2}$/.test(value)) return false;
  const [h, m] = value.split(":").map(Number);
  return h >= 0 && h < 24 && m >= 0 && m < 60;
}

export function loadReminder(): ReminderSettings {
  const base = defaultReminder();
  if (typeof window === "undefined") return base;
  try {
    const raw = window.localStorage.getItem(REMINDER_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<ReminderSettings>;
    return {
      enabled: Boolean(parsed.enabled),
      times: Array.isArray(parsed.times)
        ? parsed.times.filter((time): time is string => typeof time === "string" && isValidTime(time))
        : base.times,
      methods: Array.isArray(parsed.methods)
        ? parsed.methods.filter(
            (m): m is ReminderMethod => m === "push" || m === "sound" || m === "banner",
          )
        : base.methods,
      message:
        typeof parsed.message === "string" && parsed.message.trim()
          ? parsed.message.slice(0, 200)
          : base.message,
      lang:
        parsed.lang === "ko" || parsed.lang === "en" || parsed.lang === "ja"
          ? parsed.lang
          : base.lang,
      lastFired: typeof parsed.lastFired === "string" ? parsed.lastFired : "",
      langSet: Boolean(parsed.langSet),
    };
  } catch {
    return base;
  }
}

export function saveReminder(value: ReminderSettings): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(REMINDER_KEY, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** 종소리 — 파일 없이 WebAudio로 만드는 부드러운 세 번의 종. */
export function playBell() {
  if (typeof window === "undefined") return;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return;
  try {
    const ctx = new Ctor();
    const now = ctx.currentTime;
    [0, 0.9, 1.8].forEach((offset, index) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = index === 2 ? 660 : 528;
      gain.gain.setValueAtTime(0.0001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.12, now + offset + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + 2.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 2.6);
    });
    window.setTimeout(() => void ctx.close(), 5200);
  } catch {
    /* audio blocked */
  }
}
