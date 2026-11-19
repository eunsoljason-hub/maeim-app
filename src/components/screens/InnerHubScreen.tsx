"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { CheckInScreen } from "@/components/checkin/CheckInScreen";
import { CosmicWarp } from "@/components/checkin/CosmicWarp";
import {
  COURSES,
  HOST,
  SLOT_TIMES,
  THEMES,
  moodById,
  recommendForHour,
} from "@/lib/constants";
import {
  loadTodayCheckIn,
  markCosmicSeen,
  saveCheckIn,
  type CheckIn,
} from "@/lib/checkin";
import { slotStateFor } from "@/lib/booking";
import { streakDays, weekMoodStrip, weekStats } from "@/lib/briefing";
import { dateKey, fmtDateHeading, fmtWon, greetingForHour } from "@/lib/date";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";
import { PracticeStatsCard } from "@/components/practice/PracticeStatsCard";

const QUOTES = [
  "“잘하고 있어요. 오늘도 여기까지 왔으니까.”",
  "“마음이 무거운 날은, 무겁다고 말해도 괜찮아요.”",
  "“3분의 침묵도 당신 편이에요.”",
  "“아무것도 하지 않는 시간이 회복을 만들어요.”",
  "“오늘의 감정은 판단이 아니라 정보예요.”",
  "“숨을 고르면, 다시 고를 수 있어요.”",
  "“완벽하지 않은 하루도 기록할 가치가 있어요.”",
];

const ENTRY_MESSAGE = "지금부터 당신의 내면을 들여다보도록 하겠습니다";

type Phase = "loading" | "checkin" | "warp" | "hub";

export function InnerHubScreen() {
  const { diaries, plays, slots, bookings, hydrated, mode } = useApp();
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
  const greeting = greetingForHour(hour);
  const dateLabel = now ? fmtDateHeading(now) : "";

  const stats = useMemo(
    () => (now ? weekStats(diaries, plays, now) : { sessions: 0, minutes: 0, diaryDays: 0 }),
    [diaries, plays, now],
  );
  const streak = useMemo(() => (now ? streakDays(diaries, now) : 0), [diaries, now]);
  const week = useMemo(() => (now ? weekMoodStrip(diaries, now) : []), [diaries, now]);

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

  const quote = QUOTES[(now ? now.getDate() : 0) % QUOTES.length];
  const mood = checkIn ? moodById(checkIn.mood) : null;

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
        message={ENTRY_MESSAGE}
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
          {checkIn ? (
            <button
              type="button"
              className="checkin-again"
              onClick={() => setPhase("checkin")}
            >
              오늘 체크인 다시하기
            </button>
          ) : null}
        </div>
        <h1 className="hub-greeting">{greeting}</h1>
        {checkIn && mood ? (
          <p className="hub-checkin-line">
            오늘의 체크인 · {mood.emoji} {mood.label} · 에너지 {checkIn.energy}/5
          </p>
        ) : null}
      </header>

      <section className="inner-message" aria-label="내면 안내">
        <span className="inner-orbit" aria-hidden="true" />
        <p className="inner-kicker">INYOU · INNER SPACE</p>
        <h2>
          이제 여긴 당신의 내면입니다.
          <br />
          에고를 벗어나 내면에 집중하는 시간입니다.
        </h2>
        <p className="inner-sub">
          세 가지 문 중 오늘 끌리는 곳으로 들어가 보세요. 어디로 들어가도, 끝에는
          마음기록이 기다리고 있어요.
        </p>
      </section>

      <nav className="session-grid" aria-label="세션 선택">
        <Link href="/visualization" className="session-card s-vis">
          <span className="session-glyph" aria-hidden="true">
            🌌
          </span>
          <span className="session-kicker">상상으로 여는</span>
          <strong>시각화</strong>
          <span className="session-desc">아침 · 비우기 · 소망</span>
          <span className="session-meta">가이드 스크립트 · 배경음 선택</span>
          <span className="session-go">들어가기 ›</span>
        </Link>

        <Link href="/meditation" className="session-card s-med">
          <span className="session-glyph" aria-hidden="true">
            🫧
          </span>
          <span className="session-kicker">숨으로 돌아오는</span>
          <strong>명상</strong>
          <span className="session-desc">3 · 10 · 20 · 30분 · 타이머</span>
          <span className="session-meta">호흡 · 바디스캔 · 자유 명상</span>
          <span className="session-go">들어가기 ›</span>
        </Link>

        <Link href="/affirmations" className="session-card s-aff">
          <span className="session-glyph" aria-hidden="true">
            ✶
          </span>
          <span className="session-kicker">말로 새기는</span>
          <strong>확언</strong>
          <span className="session-desc">긍정 · 부 · 자녀 · 비젼</span>
          <span className="session-meta">한·영 120문장 · 나만의 확언</span>
          <span className="session-go">들어가기 ›</span>
        </Link>
      </nav>

      <section className="hub-recommend" aria-label="지금 추천">
        <div className="hub-recommend-head">
          <span className="tiny">{recommendation.kicker}</span>
          <Link className="link" href={`/player/${recommendation.course.id}`}>
            바로 시작
          </Link>
        </div>
        <Link href={`/player/${recommendation.course.id}`} className="hub-recommend-card">
          <span className="glyph" aria-hidden="true">
            {recommendation.course.glyph}
          </span>
          <span className="txt">
            <b>{recommendation.course.title}</b>
            <span>
              {THEMES[recommendation.course.theme].label} · {recommendation.course.subtitle}
            </span>
          </span>
          <span className="mins">{recommendation.course.minutes}분</span>
        </Link>
      </section>

      <PracticeStatsCard />

      <div className="stat-row">
        <div className="stat">
          <b>{hydrated ? `${streak}일` : "–"}</b>
          <span>연속 기록</span>
        </div>
        <div className="stat">
          <b>{hydrated ? `${stats.sessions}회` : "–"}</b>
          <span>이번 주 세션</span>
        </div>
        <div className="stat">
          <b>{hydrated ? `${stats.diaryDays}일` : "–"}</b>
          <span>이번 주 기록</span>
        </div>
      </div>

      <div className="section-head">
        <h2>이번 주 마음</h2>
        <Link className="link" href="/diary">
          마음기록 보기
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
            const dayMood = item.mood ? moodById(item.mood) : null;
            return (
              <div
                key={item.key}
                className={`day ${dayMood ? "has" : ""} ${item.isToday ? "today" : ""}`}
              >
                <div className="d">{item.weekday}</div>
                <div className="m" aria-hidden="true">
                  {dayMood ? dayMood.emoji : "·"}
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
              <p>{fmtWon(3900)}부터 · 마음기록을 바탕으로 이야기해요.</p>
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
      <p className="tiny" style={{ textAlign: "center", marginTop: 4 }}>
        {COURSES.length}개 코스 · 확언 120문장 · 기록은 이 기기에만 저장돼요
      </p>
    </main>
  );
}
