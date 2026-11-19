"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { CheckInScreen } from "@/components/checkin/CheckInScreen";
import { CosmicWarp } from "@/components/checkin/CosmicWarp";
import { CounselButton } from "@/components/counsel/CounselButton";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";
import { PracticeStatsCard } from "@/components/practice/PracticeStatsCard";
import { COURSES, HOST, recommendForHour } from "@/lib/constants";
import {
  loadTodayCheckIn,
  markCosmicSeen,
  saveCheckIn,
  type CheckIn,
} from "@/lib/checkin";
import { streakDays, weekMoodStrip, weekStats } from "@/lib/briefing";
import { dateKey, hourBucket } from "@/lib/date";
import { useI18n } from "@/lib/i18n/LangProvider";
import { formatDateKey, weekdayNarrow } from "@/lib/i18n/LangProvider";
import { courseText } from "@/lib/i18n/courses";
import { moodLabel } from "@/lib/i18n/labels";

type Phase = "loading" | "checkin" | "warp" | "hub";

const REC_KICKERS: Record<string, string> = {
  dawn: "rec.sleep",
  morning: "rec.morning",
  afternoon: "rec.midday",
  evening: "rec.evening",
  night: "rec.night",
};

export function InnerHubScreen() {
  const { diaries, plays, slots, bookings, hydrated } = useApp();
  const { t, lang } = useI18n();
  const [now, setNow] = useState<Date | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);

  useEffect(() => {
    setNow(new Date());
    const today = loadTodayCheckIn();
    if (today) {
      setCheckIn(today);
      setPhase("hub");
    } else {
      setPhase("checkin");
    }
  }, []);

  const hour = now?.getHours() ?? 20;
  const recommendation = recommendForHour(hour);
  const recText = courseText(recommendation.course, lang);
  const greeting = t(`hub.greeting.${hourBucket(hour)}`);
  const dateLabel = now ? formatDateKey(dateKey(now), lang) : "";

  const stats = useMemo(
    () => (now ? weekStats(diaries, plays, now) : { sessions: 0, minutes: 0, diaryDays: 0 }),
    [diaries, plays, now],
  );
  const streak = useMemo(() => (now ? streakDays(diaries, now) : 0), [diaries, now]);
  const week = useMemo(() => (now ? weekMoodStrip(diaries, now) : []), [diaries, now]);

  const quote = `quote.${(now ? now.getDate() : 0) % 7}`;

  if (phase === "loading") {
    return (
      <main className="page hub-page">
        <div className="hub-skeleton" aria-hidden="true" />
      </main>
    );
  }

  if (phase === "checkin") {
    return (
      <CheckInScreen
        initialMood={checkIn?.mood ?? null}
        initialEnergy={checkIn?.energy ?? 3}
        canClose={Boolean(checkIn)}
        onClose={() => setPhase("hub")}
        onSubmit={(moodId, energy) => {
          const saved = saveCheckIn(moodId, energy);
          setCheckIn(saved);
          setPhase("warp");
        }}
      />
    );
  }

  if (phase === "warp") {
    return (
      <CosmicWarp
        message={t("cosmic.message")}
        kicker={t("cosmic.kicker")}
        sub={t("cosmic.sub")}
        skipLabel={t("cosmic.skip")}
        onDone={() => {
          markCosmicSeen();
          setPhase("hub");
        }}
      />
    );
  }

  return (
    <main className="page hub-page">
      <LifeDirectionBanner />
      <header className="hub-head">
        <div className="hub-topline">
          <p className="date">{dateLabel || "\u00a0"}</p>
          <div className="hub-top-actions">
            <LangSwitch />
            {checkIn ? (
              <button
                type="button"
                className="checkin-again"
                onClick={() => setPhase("checkin")}
              >
                {t("hub.checkAgain")}
              </button>
            ) : null}
          </div>
        </div>
        <h1 className="hub-greeting">{greeting}</h1>
        {checkIn ? (
          <p className="hub-checkin-line">
            {t("hub.checkinLine", {
              mood: moodLabel(checkIn.mood, t),
              energy: checkIn.energy,
            })}
          </p>
        ) : null}
      </header>

      <section className="inner-message" aria-label={t("hub.kicker")}>
        <span className="inner-orbit" aria-hidden="true" />
        <p className="inner-kicker">{t("hub.kicker")}</p>
        <h2>
          {t("hub.message1")}
          <br />
          {t("hub.message2")}
        </h2>
        <p className="inner-sub">{t("hub.messageSub")}</p>
      </section>

      <nav className="session-grid" aria-label={t("hub.sessions")}>
        <Link href="/visualization" className="session-card s-vis">
          <span className="session-glyph" aria-hidden="true">
            🌌
          </span>
          <span className="session-kicker">{t("hub.vis.kicker")}</span>
          <strong>{t("tab.visualization")}</strong>
          <span className="session-desc">{t("hub.vis.desc")}</span>
          <span className="session-meta">{t("hub.vis.meta")}</span>
          <span className="session-go">{t("hub.enter")} ›</span>
        </Link>

        <Link href="/meditation" className="session-card s-med">
          <span className="session-glyph" aria-hidden="true">
            🫧
          </span>
          <span className="session-kicker">{t("hub.med.kicker")}</span>
          <strong>{t("tab.meditation")}</strong>
          <span className="session-desc">{t("hub.med.desc")}</span>
          <span className="session-meta">{t("hub.med.meta")}</span>
          <span className="session-go">{t("hub.enter")} ›</span>
        </Link>

        <Link href="/affirmations" className="session-card s-aff">
          <span className="session-glyph" aria-hidden="true">
            ✶
          </span>
          <span className="session-kicker">{t("hub.aff.kicker")}</span>
          <strong>{t("tab.affirmations")}</strong>
          <span className="session-desc">{t("hub.aff.desc")}</span>
          <span className="session-meta">{t("hub.aff.meta")}</span>
          <span className="session-go">{t("hub.enter")} ›</span>
        </Link>
      </nav>

      <section className="hub-recommend" aria-label={t("hub.recommend")}>
        <div className="hub-recommend-head">
          <span className="tiny">{t(REC_KICKERS[hourBucket(hour)] ?? "rec.midday")}</span>
          <Link className="link" href={`/player/${recommendation.course.id}`}>
            {t("hub.startNow")}
          </Link>
        </div>
        <Link href={`/player/${recommendation.course.id}`} className="hub-recommend-card">
          <span className="glyph" aria-hidden="true">
            {recommendation.course.glyph}
          </span>
          <span className="txt">
            <b>{recText.title}</b>
            <span>
              {t("player.breathing", {
                inhale: recommendation.course.breath.inhale,
                hold: recommendation.course.breath.hold,
                exhale: recommendation.course.breath.exhale,
              })}
            </span>
          </span>
          <span className="mins">{t("common.minutes", { n: recommendation.course.minutes })}</span>
        </Link>
      </section>

      <PracticeStatsCard />

      <div className="stat-row">
        <div className="stat">
          <b>{hydrated ? `${streak}` : "–"}</b>
          <span>{t("hub.contScan")}</span>
        </div>
        <div className="stat">
          <b>{hydrated ? `${stats.sessions}` : "–"}</b>
          <span>{t("hub.weekSessions")}</span>
        </div>
        <div className="stat">
          <b>{hydrated ? `${stats.diaryDays}` : "–"}</b>
          <span>{t("hub.weekRecords")}</span>
        </div>
      </div>

      <div className="section-head">
        <h2>{t("hub.thisWeekMind")}</h2>
        <Link className="link" href="/diary">
          {t("hub.openDiary")}
        </Link>
      </div>
      <div className="card week" aria-label={t("hub.thisWeekMind")}>
        <div className="week-row">
          {(week.length
            ? week
            : Array.from({ length: 7 }, (_, index) => ({
                key: `placeholder-${index}`,
                weekday: "",
                day: 0,
                isToday: false,
                mood: null,
                count: 0,
              }))
          ).map((item) => (
            <div
              key={item.key}
              className={`day ${item.mood ? "has" : ""} ${item.isToday ? "today" : ""}`}
            >
              <div className="d">{weekdayNarrow(item.key, lang)}</div>
              <div className="m" aria-hidden="true">
                {item.mood ? moodEmoji(item.mood) : "·"}
              </div>
              <div className="n">{item.day || ""}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="section-head">
        <h2>{t("hub.counsel")}</h2>
        <span className="tiny">{lang === "ko" ? HOST.displayName : "Eunsol"}</span>
      </div>
      <div className="card consult-teaser">
        <div className="host-avatar" aria-hidden="true">
          {lang === "ko" ? HOST.initial : "E"}
        </div>
        <div className="txt">
          <b>{t("hub.counsel")}</b>
          <p>{t("hub.counselDesc")}</p>
        </div>
        <CounselButton className="go">{t("counsel.cta")}</CounselButton>
      </div>

      <div className="hub-links">
        <Link href="/growth" className="hub-link">
          🌱 {t("growth.title")}
        </Link>
        <Link href="/studio" className="hub-link">
          ✶ {t("studio.link")}
        </Link>
        <Link href="/affirmations" className="hub-link">
          🗂 {t("tab.affirmations")}
        </Link>
      </div>

      <p className="quote">{t(quote)}</p>
      <p className="tiny" style={{ textAlign: "center", marginTop: 4 }}>
        {t("hub.footer", { courses: COURSES.length })}
      </p>
      <p className="tiny" style={{ textAlign: "center" }}>
        {t("common.localOnly")}
      </p>
    </main>
  );
}

function moodEmoji(id: string) {
  const map: Record<string, string> = {
    calm: "😌",
    good: "🙂",
    flat: "😐",
    heavy: "😔",
    anxious: "😣",
    angry: "😤",
    tired: "🥱",
    hope: "🌤️",
  };
  return map[id] ?? "·";
}
