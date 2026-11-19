"use client";

import Link from "next/link";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { MEDITATION_BUCKETS, meditationCoursesFor } from "@/lib/constants";
import { courseText } from "@/lib/i18n/courses";
import { useI18n } from "@/lib/i18n/LangProvider";

export function MeditationScreen() {
  const { t, lang } = useI18n();

  return (
    <main className="page">
      <header className="view-head">
        <div>
          <p className="eyebrow">{t("med.eyebrow")}</p>
          <h1>{t("med.title")}</h1>
        </div>
        <div className="view-head-right">
          <LangSwitch />
          <span className="tag">{t("med.tag")}</span>
        </div>
      </header>

      {MEDITATION_BUCKETS.map((bucket) => {
        const courses = meditationCoursesFor(bucket.minutes);
        const isTimer = bucket.minutes === null;
        return (
          <section
            key={bucket.id}
            className="med-block"
            aria-label={`${bucket.minutes === null ? t("med.bucket.timer") : `${bucket.minutes}${t("common.min")}`} ${t("med.title")}`}
          >
            <div className="med-head">
              <span className="med-num">
                {bucket.minutes === null ? "∞" : bucket.minutes}
                {bucket.minutes === null ? "" : <i>{t("common.min")}</i>}
              </span>
              <span className="med-head-txt">
                <b>{t("med.title")}</b>
                <span>{t(`med.bucket.${bucket.id}`)}</span>
              </span>
              <span className="med-glyph" aria-hidden="true">
                {bucket.glyph}
              </span>
            </div>

            {isTimer ? (
              <Link href="/meditation/timer" className="course course-solo c-lake">
                <span className="glyph" aria-hidden="true">
                  {bucket.glyph}
                </span>
                <h4>{t("med.timer.title")}</h4>
                <p>{t("med.timer.desc")}</p>
                <span className="meta">
                  <b>{t("med.timer.chip")}</b> · {t("med.timer.from")}
                </span>
              </Link>
            ) : (
              <div className="course-grid">
                {courses.map((course) => {
                  const text = courseText(course, lang);
                  return (
                    <Link
                      key={course.id}
                      href={`/player/${course.id}`}
                      className={`course c-${course.tone}`}
                    >
                      <span className="glyph" aria-hidden="true">
                        {course.glyph}
                      </span>
                      <h4>{text.title}</h4>
                      <p>{text.subtitle}</p>
                      <span className="meta">
                        <b>{t("common.minutes", { n: course.minutes })}</b> · {t(`theme.${course.theme}`)}
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        );
      })}
    </main>
  );
}
