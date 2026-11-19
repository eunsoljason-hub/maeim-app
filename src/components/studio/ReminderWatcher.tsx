"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LangProvider";
import { dateKey } from "@/lib/date";
import { loadReminder, playBell, saveReminder } from "@/lib/studio";

/**
 * 맞춤 알람 — 앱이 열려 있는 동안 설정한 시간에 배너+모달을 띄우고,
 * 선택에 따라 종소리와 브라우저 알림을 함께 보낸다.
 */
export function ReminderWatcher() {
  const { t } = useI18n();
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onReminder = (event: Event) => {
      const detail = (event as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message ?? t("reminder.modalTitle"));
    };
    window.addEventListener("inyou:reminder", onReminder);
    return () => window.removeEventListener("inyou:reminder", onReminder);
  }, [t]);

  useEffect(() => {
    const check = () => {
      const settings = loadReminder();
      if (!settings.enabled || settings.times.length === 0) return;
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, "0")}:${String(
        now.getMinutes(),
      ).padStart(2, "0")}`;
      if (!settings.times.includes(hhmm)) return;
      const stamp = `${dateKey(now)}|${hhmm}`;
      if (settings.lastFired === stamp) return;

      saveReminder({ ...settings, lastFired: stamp });

      if (settings.methods.includes("sound")) playBell();
      if (
        settings.methods.includes("push") &&
        typeof window !== "undefined" &&
        "Notification" in window &&
        Notification.permission === "granted"
      ) {
        try {
          new Notification(t("reminder.modalTitle"), { body: settings.message });
        } catch {
          /* ignore */
        }
      }
      if (settings.methods.includes("banner") || settings.methods.length === 0) {
        window.dispatchEvent(
          new CustomEvent("inyou:reminder", { detail: { message: settings.message } }),
        );
      }
    };

    check();
    const timer = window.setInterval(check, 20000);
    return () => window.clearInterval(timer);
  }, [t]);

  if (!message) return null;

  return (
    <div className="reminder-overlay" role="dialog" aria-modal="true" aria-labelledby="reminder-title">
      <div className="reminder-modal">
        <span className="reminder-bell" aria-hidden="true">
          ✶
        </span>
        <h2 id="reminder-title">{t("reminder.modalTitle")}</h2>
        <p>{message}</p>
        <Link href="/player/c3" className="btn" onClick={() => setMessage(null)}>
          {t("reminder.go")}
        </Link>
        <button type="button" className="reminder-later" onClick={() => setMessage(null)}>
          {t("reminder.later")}
        </button>
      </div>
    </div>
  );
}
