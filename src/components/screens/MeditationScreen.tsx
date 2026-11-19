"use client";

import Link from "next/link";
import { MEDITATION_BUCKETS, THEMES, meditationCoursesFor } from "@/lib/constants";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";

export function MeditationScreen() {
  return (
    <main className="page">
      <LifeDirectionBanner />
      <header className="view-head">
        <div>
          <p className="eyebrow">호흡으로 돌아오는 시간</p>
          <h1>명상</h1>
        </div>
        <span className="tag">5가지</span>
      </header>
      <p className="view-lead">
        시간이 정해져 있으면 고르기 쉽고, 정하기 어려운 날에는 타이머로 시작해요.
      </p>

      {MEDITATION_BUCKETS.map((bucket) => {
        const courses = meditationCoursesFor(bucket.minutes);
        const isTimer = bucket.minutes === null;
        return (
          <section key={bucket.id} className="med-block" aria-label={`${bucket.label} 명상`}>
            <div className="med-head">
              <span className="med-num">
                {bucket.minutes === null ? "∞" : bucket.minutes}
                {bucket.minutes === null ? "" : <i>분</i>}
              </span>
              <span className="med-head-txt">
                <b>{bucket.label}</b>
                <span>{bucket.hint}</span>
              </span>
              <span className="med-glyph" aria-hidden="true">
                {bucket.glyph}
              </span>
            </div>

            {isTimer ? (
              <Link href="/meditation/timer" className="timer-card">
                <div className="timer-card-top">
                  <span className="timer-chip">자유 명상</span>
                  <span className="tiny">00:00부터 시작</span>
                </div>
                <b>원하는 만큼 앉아 있어요</b>
                <p>시작과 끝을 내가 정하고, 끝나면 실제 시간(분:초)이 기록에 남아요.</p>
                <span className="timer-card-go">타이머 열기 ›</span>
              </Link>
            ) : (
              <div className="course-grid">
                {courses.map((course) => (
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
            )}
          </section>
        );
      })}

      <div className="tip-card">
        <b>어떤 코스를 고를까요?</b>
        <p>
          3분은 지금 이 순간으로 돌아오기, 10분은 하루 정리, 20분은 바디스캔, 30분은
          길게 앉는 날에 어울려요. 자유 타이머는 끝나는 시간을 내가 정하고 싶을 때
          써요.
        </p>
      </div>
    </main>
  );
}
