"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import {
  COURSES,
  HOST,
  QUICK_MOOD_IDS,
  SLOT_TIMES,
  THEMES,
  moodById,
  recommendForHour,
} from "@/lib/constants";
import { slotStateFor } from "@/lib/booking";
import { streakDays, weekMoodStrip, weekStats } from "@/lib/briefing";
import {
  dateKey,
  fmtDateHeading,
  fmtWon,
  greetingForHour,
  subGreetingForHour,
} from "@/lib/date";

const QUOTES = [
  "“잘하고 있어요. 오늘도 여기까지 왔으니까.”",
  "“마음이 무거운 날은, 무겁다고 말해도 괜찮아요.”",
  "“3분의 침묵도 당신 편이에요.”",
  "“아무것도 하지 않는 시간이 회복을 만들어요.”",
  "“오늘의 감정은 판단이 아니라 정보예요.”",
  "“숨을 고르면, 다시 고를 수 있어요.”",
  "“완벽하지 않은 하루도 기록할 가치가 있어요.”",
];

export function HomeScreen() {
  const { diaries, plays, slots, bookings, user, hydrated, mode, configured } = useApp();
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
  }, []);

  const hour = now?.getHours() ?? 20;
  const recommendation = recommendForHour(hour);
  const greeting = greetingForHour(hour);
  const sub = subGreetingForHour(hour);
  const dateLabel = now ? fmtDateHeading(now) : "";

  const stats = useMemo(
    () => (now ? weekStats(diaries, plays, now) : { sessions: 0, minutes: 0, diaryDays: 0 }),
    [diaries, plays, now],
  );
  const streak = useMemo(
    () => (now ? streakDays(diaries, now) : 0),
    [diaries, now],
  );
  const week = useMemo(
    () => (now ? weekMoodStrip(diaries, now) : []),
    [diaries, now],
  );

  const nextSlot = useMemo(() => {
    if (!now) return null;
    for (const offset of [0, 1]) {
      const d = new Date(now);
      d.setDate(d.getDate() + offset);
      const key = dateKey(d);
      for (const time of SLOT_TIMES) {
        if (slotStateFor(key, time, slots, bookings, now) === "open") {
          return { dateKey: key, time, offset };
        }
      }
    }
    return null;
  }, [now, slots, bookings]);

  const openToday = useMemo(() => {
    if (!now) return 0;
    const key = dateKey(now);
    return SLOT_TIMES.filter(
      (time) => slotStateFor(key, time, slots, bookings, now) === "open",
    ).length;
  }, [now, slots, bookings]);

  const quote = QUOTES[(now ? now.getDate() : 0) % QUOTES.length];

  return (
    <main className="page">
      <header className="home-head">
        <div className="flex items-center justify-between gap-3">
          <p className="date">{dateLabel || "\u00a0"}</p>
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-[10.5px] font-semibold text-sage"
          >
            {user ? (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sage-wash text-[10px] text-sage">
                  {user.name.slice(0, 1)}
                </span>
                {user.name}
              </>
            ) : (
              <>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[rgba(38,40,47,.06)] text-[10px] text-muted">
                  ?
                </span>
                {configured ? "로그인" : "데모 모드"}
              </>
            )}
          </Link>
        </div>
        <h1>{greeting}</h1>
        <p className="sub">{sub}</p>
      </header>

      <section className="card mood-quick" aria-label="지금 마음 체크">
        <div className="card-top">
          <span>지금 마음은 어떤가요?</span>
          <span className="tiny">탭하면 일기에 담겨요</span>
        </div>
        <div className="mood-quick-row">
          {QUICK_MOOD_IDS.map((id) => {
            const mood = moodById(id);
            return (
              <Link
                key={id}
                href={`/diary?mood=${id}&moment=before`}
                className="mq"
                aria-label={`${mood.label} — 마음일기로`}
              >
                <span className="e" aria-hidden="true">
                  {mood.emoji}
                </span>
                <span className="l">{mood.short}</span>
              </Link>
            );
          })}
        </div>
      </section>

      <Link
        href={`/player/${recommendation.course.id}`}
        className="hero block"
        aria-label={`${recommendation.course.title} 시작하기`}
      >
        <div className="hero-glow" aria-hidden="true" />
        <svg
          className="hero-wave"
          viewBox="0 0 430 52"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            d="M0 34 C70 14 120 46 190 30 C260 14 320 44 430 22 L430 52 L0 52 Z"
            fill="#CFE3CE"
            opacity=".28"
          />
          <path
            d="M0 44 C90 26 150 50 220 38 C290 26 350 46 430 34 L430 52 L0 52 Z"
            fill="#CFE3CE"
            opacity=".18"
          />
        </svg>
        <div className="hero-body">
          <p className="hero-kicker">{recommendation.kicker}</p>
          <h2>{recommendation.course.title}</h2>
          <p>
            {THEMES[recommendation.course.theme].label} · {recommendation.course.subtitle}
          </p>
          <span className="btn light">명상 시작하기</span>
        </div>
      </Link>

      <div className="section-head">
        <h2>오늘의 코스</h2>
        <span className="tiny">{COURSES.length}개</span>
      </div>
      <div className="course-grid">
        {COURSES.map((course) => (
          <Link
            key={course.id}
            href={`/player/${course.id}`}
            className={`course c-${course.tone}`}
          >
            <span className="glyph" aria-hidden="true">
              {course.glyph}
            </span>
            <h4>{course.title}</h4>
            <p>{course.subtitle}</p>
            <span className="meta">
              <b>{course.minutes}분</b> · {THEMES[course.theme].label}
            </span>
          </Link>
        ))}
      </div>

      <div className="stat-row">
        <div className="stat">
          <b>{hydrated ? `${streak}일` : "–"}</b>
          <span>연속 기록</span>
        </div>
        <div className="stat">
          <b>{hydrated ? `${stats.sessions}회` : "–"}</b>
          <span>이번 주 명상</span>
        </div>
        <div className="stat">
          <b>{hydrated ? `${stats.minutes}분` : "–"}</b>
          <span>이번 주 시간</span>
        </div>
      </div>

      <div className="section-head">
        <h2>이번 주 마음</h2>
        <Link className="link" href="/diary">
          일기 보기
        </Link>
      </div>
      <div className="card week" aria-label="이번 주 감정">
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
          ).map((item) => {
            const mood = item.mood ? moodById(item.mood) : null;
            return (
              <div
                key={item.key}
                className={`day ${mood ? "has" : ""} ${item.isToday ? "today" : ""}`}
              >
                <div className="d">{item.weekday}</div>
                <div className="m" aria-hidden="true">
                  {mood ? mood.emoji : "·"}
                </div>
                <div className="n">{item.day || ""}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="section-head">
        <h2>1:1 마이크로 상담</h2>
        <span className="tiny">
          {HOST.displayName} · {HOST.role}
        </span>
      </div>
      <div className="card consult-teaser">
        <div className="host-avatar" aria-hidden="true">
          {HOST.initial}
        </div>
        <div className="txt">
          {nextSlot ? (
            <>
              <b>
                {nextSlot.offset === 0 ? "오늘" : "내일"} {nextSlot.time}에 3분 남았어요
              </b>
              <p>
                {openToday > 0
                  ? `오늘 ${openToday}개 슬롯이 열려 있어요. ${fmtWon(3900)}부터.`
                  : `내일 슬롯으로 예약할 수 있어요. ${fmtWon(3900)}부터.`}
              </p>
            </>
          ) : (
            <>
              <b>이번 주 슬롯을 준비 중이에요</b>
              <p>
                {mode === "supabase"
                  ? "호스트가 시간을 열면 바로 예약할 수 있어요."
                  : "호스트 모드에서 시간을 열면 바로 예약할 수 있어요."}
              </p>
            </>
          )}
        </div>
        <Link className="go" href="/counseling">
          예약 ›
        </Link>
      </div>

      <p className="quote">{quote}</p>

      {!configured && (
        <p className="tiny" style={{ textAlign: "center", marginTop: 4 }}>
          데모 모드 · 기록은 이 기기에만 저장돼요
        </p>
      )}
    </main>
  );
}
