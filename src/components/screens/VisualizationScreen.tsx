"use client";

import Link from "next/link";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { VISUALIZATION_GROUPS, visualizationCoursesFor } from "@/lib/constants";
import { bgmById } from "@/lib/data/bgm";
import { courseText } from "@/lib/i18n/courses";
import { useI18n } from "@/lib/i18n/LangProvider";

export function VisualizationScreen() {
  const { t, lang } = useI18n();

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

      {VISUALIZATION_GROUPS.map((group, index) => {
        const courses = visualizationCoursesFor(group.id);
        return (
          <section
            key={group.id}
            className="vis-group"
            aria-label={t(`vis.group.${group.id}`)}
          >
            <div className="vis-group-head">
              <span className="vis-index">{String(index + 1).padStart(2, "0")}</span>
              <div className="vis-group-title">
                <h2>
                  {group.glyph} {t(`vis.group.${group.id}`)}
                  {lang !== "ja" ? <span className="vis-en">{group.labelEn}</span> : null}
                </h2>
                <p>
                  {t(`vis.group.${group.id}.kicker`)} · {t(`vis.group.${group.id}.desc`)}
                </p>
              </div>
              <span className="tiny">{t("vis.count", { n: courses.length })}</span>
            </div>

            <div className="vis-list">
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
          </section>
        );
      })}

      <div className="tip-card">
        <b>{t("vis.tipTitle")}</b>
        <p>{t("vis.tip")}</p>
      </div>
    </main>
  );
}
