"use client";

import { useEffect, useState } from "react";
import { useI18n } from "@/lib/i18n/LangProvider";
import {
  REMINDER_DEFAULT_MESSAGE,
  isValidTime,
  playBell,
  type ReminderMethod,
  type ReminderSettings,
} from "@/lib/studio";
import type { Lang } from "@/lib/i18n/dict";

const METHODS: { id: ReminderMethod; key: string }[] = [
  { id: "push", key: "reminder.method.push" },
  { id: "sound", key: "reminder.method.sound" },
  { id: "banner", key: "reminder.method.banner" },
];

export function ReminderSettingsPanel({
  value,
  onChange,
}: {
  value: ReminderSettings;
  onChange: (next: ReminderSettings) => void;
}) {
  const { t, lang } = useI18n();
  const [newTime, setNewTime] = useState("20:00");
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(
    "unsupported",
  );
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !("Notification" in window)) {
      setPermission("unsupported");
      return;
    }
    setPermission(Notification.permission);
  }, []);

  const update = (patch: Partial<ReminderSettings>) => {
    onChange({ ...value, ...patch });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1400);
  };

  const addTime = () => {
    if (!isValidTime(newTime)) return;
    if (value.times.includes(newTime)) return;
    const times = [...value.times, newTime].sort();
    update({ times });
  };

  const askPermission = async () => {
    if (typeof window === "undefined" || !("Notification" in window)) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === "granted") {
      new Notification("InYou", { body: REMINDER_DEFAULT_MESSAGE[lang] });
    }
  };

  const test = () => {
    if (value.methods.includes("sound")) playBell();
    if (value.methods.includes("push") && permission === "granted") {
      new Notification(t("reminder.modalTitle"), { body: value.message });
    }
    window.dispatchEvent(
      new CustomEvent("inyou:reminder", { detail: { message: value.message } }),
    );
  };

  return (
    <section className="growth-panel reminder-panel" aria-label={t("studio.tab.reminders")}>
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">{t("reminder.lead")}</p>
          <h2>{t("studio.tab.reminders")}</h2>
        </div>
        <span className="tiny">{savedFlash ? t("reminder.saved") : ""}</span>
      </header>

      <div className="reminder-toggle">
        <span>{t("reminder.enable")}</span>
        <button
          type="button"
          className={`switch ${value.enabled ? "on" : ""}`}
          onClick={() => update({ enabled: !value.enabled })}
          aria-pressed={value.enabled}
          aria-label={t("reminder.enable")}
        >
          <span />
        </button>
      </div>

      <div className="widget-row reminder-block">
        <span className="widget-label">{t("reminder.times")}</span>
        <ul className="reminder-times">
          {value.times.map((time) => (
            <li key={time}>
              <b>{time}</b>
              <button
                type="button"
                onClick={() => update({ times: value.times.filter((item) => item !== time) })}
                aria-label={`${t("reminder.remove")} ${time}`}
              >
                ✕
              </button>
            </li>
          ))}
          {value.times.length === 0 ? <li className="empty-time">{t("reminder.noTimes")}</li> : null}
        </ul>
        <div className="reminder-add">
          <input
            type="time"
            value={newTime}
            onChange={(event) => setNewTime(event.target.value)}
            aria-label={t("reminder.times")}
          />
          <button type="button" className="growth-reset" onClick={addTime}>
            ＋ {t("reminder.addTime")}
          </button>
        </div>
      </div>

      <div className="widget-row reminder-block">
        <span className="widget-label">{t("reminder.method")}</span>
        <div className="widget-toggles">
          {METHODS.map((method) => (
            <button
              key={method.id}
              type="button"
              className={value.methods.includes(method.id) ? "on" : ""}
              onClick={() =>
                update({
                  methods: value.methods.includes(method.id)
                    ? value.methods.filter((item) => item !== method.id)
                    : [...value.methods, method.id],
                })
              }
              aria-pressed={value.methods.includes(method.id)}
            >
              {t(method.key)}
            </button>
          ))}
        </div>
      </div>

      <div className="widget-row reminder-block">
        <span className="widget-label">{t("reminder.permission")}</span>
        <div className="reminder-permission">
          <span className={`perm-badge ${permission}`}>
            {permission === "granted"
              ? t("reminder.granted")
              : permission === "denied"
                ? t("reminder.denied")
                : permission === "unsupported"
                  ? "—"
                  : t("reminder.ask")}
          </span>
          {permission !== "granted" && permission !== "unsupported" ? (
            <button type="button" className="growth-reset" onClick={() => void askPermission()}>
              {t("reminder.ask")}
            </button>
          ) : null}
        </div>
      </div>

      <label className="widget-caption-field">
        <span>{t("reminder.message")}</span>
        <textarea
          value={value.message}
          onChange={(event) => update({ message: event.target.value.slice(0, 200) })}
          rows={3}
          maxLength={200}
          placeholder={t("reminder.messagePh")}
        />
      </label>

      <div className="reminder-actions">
        <select
          value={value.lang}
          onChange={(event) => {
            const next = event.target.value as Lang;
            update({
              lang: next,
              message:
                value.message === REMINDER_DEFAULT_MESSAGE[value.lang] || !value.message.trim()
                  ? REMINDER_DEFAULT_MESSAGE[next]
                  : value.message,
            });
          }}
          aria-label={t("lang.label")}
        >
          <option value="ko">한국어</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
        </select>
        <button
          type="button"
          className="growth-reset"
          onClick={() => update({ message: REMINDER_DEFAULT_MESSAGE[value.lang] })}
        >
          {t("reminder.default")}
        </button>
      </div>

      <button type="button" className="btn reminder-test" onClick={test}>
        {t("reminder.test")}
      </button>

      <p className="growth-saved">{t("reminder.note")}</p>
    </section>
  );
}
