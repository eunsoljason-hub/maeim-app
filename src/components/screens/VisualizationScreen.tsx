"use client";

import Link from "next/link";
import {
  THEMES,
  VISUALIZATION_GROUPS,
  visualizationCoursesFor,
} from "@/lib/constants";
import { bgmById } from "@/lib/data/bgm";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";

export function VisualizationScreen() {
  return (
    <main className="page">
      <LifeDirectionBanner />
      <header className="view-head">
        <div>
          <p className="eyebrow">장면을 그리는 시간</p>
          <h1>시각화</h1>
        </div>
        <span className="tag">3가지 · 9코스</span>
      </header>
      <p className="view-lead">
        아침에 빛을 채우고, 비우고, 소망을 그려요. 각 코스에는 가이드 스크립트와
        가이드 음성을 넣을 자리가 준비되어 있어요.
      </p>

      {VISUALIZATION_GROUPS.map((group, index) => {
        const courses = visualizationCoursesFor(group.id);
        return (
          <section key={group.id} className="vis-group" aria-label={group.label}>
            <div className="vis-group-head">
              <span className="vis-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="vis-group-title">
                <h2>
                  {group.glyph} {group.label}
                  <span className="vis-en">{group.labelEn}</span>
                </h2>
                <p>
                  {group.kicker} · {group.description}
                </p>
              </div>
              <span className="tiny">{courses.length}개</span>
            </div>

            <div className="vis-list">
              {courses.map((course) => {
                const bgm = bgmById(course.bgmId);
                return (
                  <Link key={course.id} href={`/player/${course.id}`} className="vis-card">
                    <span className="vis-glyph" aria-hidden="true">
                      {course.glyph}
                    </span>
                    <span className="vis-card-body">
                      <b>{course.title}</b>
                      <span className="vis-sub">{course.subtitle}</span>
                      <span className="vis-meta">
                        <em>{course.minutes}분</em>
                        <span>{THEMES[course.theme].label}</span>
                        {course.guide ? (
                          <span>가이드 {course.guide.steps.length}단계</span>
                        ) : null}
                        {bgm ? <span>BGM {bgm.title.split(" – ")[0]}</span> : null}
                      </span>
                    </span>
                    <span className="vis-go" aria-hidden="true">
                      ›
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="tip-card">
        <b>가이드 음성 슬롯</b>
        <p>
          모든 시각화 코스에는 단계별 안내 문장이 들어 있어요. 플레이어에서 스크립트를
          보며 따라 할 수 있고, 녹음한 가이드 음성을 연결하면 같은 문장이 나레이션으로
          재생돼요. (파일 자리: <code>/audio/guide/&lt;코스id&gt;.mp3</code>)
        </p>
      </div>
    </main>
  );
}
