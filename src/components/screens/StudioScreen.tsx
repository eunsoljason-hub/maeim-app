"use client";

import { useEffect, useState } from "react";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";
import { ReminderSettingsPanel } from "@/components/studio/ReminderSettings";
import { WidgetStudio } from "@/components/studio/WidgetStudio";
import { useI18n } from "@/lib/i18n/LangProvider";
import {
  REMINDER_DEFAULT_MESSAGE,
  defaultReminder,
  defaultWidget,
  loadReminder,
  loadWidget,
  saveReminder,
  saveWidget,
  type ReminderSettings,
  type WidgetSettings,
} from "@/lib/studio";

export function StudioScreen() {
  const { t, lang } = useI18n();
  const [tab, setTab] = useState<"widgets" | "reminders">("widgets");
  const [widget, setWidget] = useState<WidgetSettings>(defaultWidget);
  const [reminder, setReminder] = useState<ReminderSettings>(defaultReminder);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setWidget(loadWidget());
    setReminder(loadReminder());
    setReady(true);
  }, []);

  const updateWidget = (next: WidgetSettings) => {
    setWidget(next);
    saveWidget(next);
  };

  const updateReminder = (next: ReminderSettings) => {
    setReminder(next);
    saveReminder(next);
  };

  return (
    <main className="page studio-page">
      <LifeDirectionBanner />
      <header className="view-head">
        <div>
          <p className="eyebrow">{t("studio.eyebrow")}</p>
          <h1>{t("studio.title")}</h1>
        </div>
        <LangSwitch />
      </header>

      <div className="growth-tabs studio-tabs" role="tablist" aria-label={t("studio.title")}>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "widgets"}
          className={`growth-tab ${tab === "widgets" ? "on" : ""}`}
          onClick={() => setTab("widgets")}
        >
          <span aria-hidden="true">▦</span>
          {t("studio.tab.widgets")}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "reminders"}
          className={`growth-tab ${tab === "reminders" ? "on" : ""}`}
          onClick={() => setTab("reminders")}
        >
          <span aria-hidden="true">⏰</span>
          {t("studio.tab.reminders")}
        </button>
      </div>

      {!ready ? (
        <div className="hub-skeleton" aria-hidden="true" />
      ) : tab === "widgets" ? (
        <WidgetStudio value={widget} onChange={updateWidget} />
      ) : (
        <ReminderSettingsPanel value={reminder} onChange={updateReminder} />
      )}
    </main>
  );
}
