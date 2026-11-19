"use client";

import Link from "next/link";
import { useState } from "react";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { VISUALIZATION_GROUPS, visualizationCoursesFor } from "@/lib/constants";
import { bgmById } from "@/lib/data/bgm";
import { courseText } from "@/lib/i18n/courses";
import { useI18n } from "@/lib/i18n/LangProvider";
import type { VisualizationGroup } from "@/lib/types";

/**
 * 시각화 — 두 단계.
 * 1단계: 아침 · 비우기 · 소망 세 갈래의 큰 카테고리 카드만.
 * 2단계: 고른 갈래 안의 세 코스를 뒤로가기와 함께 보여 준다.
 */
export function VisualizationScreen() {
  const { t, lang } = useI18n();
  const [openGroup, setOpenGroup] = useState<VisualizationGroup | null>(null);
  const group = openGroup
    ? VISUALIZATION_GROUPS.find((item) => item.id === openGroup) ?? null
    : null;

  if (group) {
    const courses = visualizationCoursesFor(group.id);
    return (
      <main className="page">
        <button type="button" className="vis-back" onClick={() => setOpenGroup(null)}>
          <span aria-hidden="true">‹</span> {t("common.back")}
        </button>

        <header className="view-head">
          <div>
            <p className="eyebrow">{t("vis.title")}</p>
            <h1>
              {group.glyph} {t(`vis.group.${group.id}`)}
            </h1>
          </div>
          <div className="view-head-right">
            <LangSwitch />
          </div>
        </header>
        <p className="view-lead">
          {t(`vis.group.${group.id}.kicker`)} · {t(`vis.group.${group.id}.desc`)}
        </p>

        <div className="vis-list" style={{ marginTop: 16 }}>
          {courses.map((course) => {
            const text = courseText(course, lang);
            const bgm = bgmById(course.bgmId);
            return (
              <Link key={course.id} href={`/player/${course.id}`} className="vis-card">
                <span className="vis-glyph" aria-hidden="true">
                  {course.glyph}
                </span>
                <span className="vis-card-body">
                  <b>{text.title}</b>
                  <span className="vis-sub">{text.subtitle}</span>
                  <span className="vis-meta">
                    <em>{t("common.minutes", { n: course.minutes })}</em>
                    <span>{t(`theme.${course.theme}`)}</span>
                    {course.guide ? (
                      <span>{t("vis.guideSteps", { n: course.guide.steps.length })}</span>
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

        <div className="tip-card">
          <b>{t("vis.tipTitle")}</b>
          <p>{t("vis.tip")}</p>
        </div>
      </main>
    );
  }

  return (
    <main className="page">
      <header className="view-head">
        <div>
          <p className="eyebrow">{t("vis.eyebrow")}</p>
          <h1>{t("vis.title")}</h1>
        </div>
        <div className="view-head-right">
          <LangSwitch />
          <span className="tag">{t("vis.tag")}</span>
        </div>
      </header>
      <p className="view-lead">{t("vis.lead")}</p>

      <nav className="vis-cats" aria-label={t("vis.title")}>
        {VISUALIZATION_GROUPS.map((item) => {
          const courses = visualizationCoursesFor(item.id);
          return (
            <button
              key={item.id}
              type="button"
              className={`vis-cat vis-cat-${item.id}`}
              onClick={() => setOpenGroup(item.id)}
            >
              <span className="vis-cat-glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <span className="vis-cat-body">
                <span className="vis-cat-kicker">{t(`vis.group.${item.id}.kicker`)}</span>
                <b>
                  {t(`vis.group.${item.id}`)}
                  {lang !== "ja" ? <em>{item.labelEn}</em> : null}
                </b>
                <span className="vis-cat-desc">{t(`vis.group.${item.id}.desc`)}</span>
                <span className="vis-cat-chips">
                  {courses.map((course) => (
                    <span key={course.id}>{courseText(course, lang).title}</span>
                  ))}
                </span>
              </span>
              <span className="vis-go" aria-hidden="true">
                ›
              </span>
            </button>
          );
        })}
      </nav>

      <div className="tip-card">
        <b>{t("vis.tipTitle")}</b>
        <p>{t("vis.tip")}</p>
      </div>
    </main>
  );
}
