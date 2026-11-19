"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { SceneArt } from "@/components/player/SceneArt";
import { Sheet } from "@/components/ui/Sheet";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useWakeLock } from "@/hooks/useWakeLock";
import { AmbientSound, SOUND_OPTIONS, type SoundId } from "@/lib/audio/ambient";
import { COURSES, THEMES, courseById } from "@/lib/constants";
import { BGM_TRACKS, bgmById } from "@/lib/data/bgm";
import { fmtClock } from "@/lib/date";
import { useI18n } from "@/lib/i18n/LangProvider";
import { courseText } from "@/lib/i18n/courses";
import { loadStoredPrefs, readJson, removeKey, writeJson } from "@/lib/storage";
import type { ThemeId } from "@/lib/types";

const RING_RADIUS = 126;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;
const BGM_KEY_PREFIX = "maeum.player.bgm.";

export function PlayerScreen({ courseId }: { courseId: string }) {
  const course = courseById(courseId);
  const router = useRouter();
  const { setPrefs, recordPlay } = useApp();
  const { t, lang } = useI18n();
  const text = courseText(course, lang);
  const reducedMotion = usePrefersReducedMotion();
  const wakeLock = useWakeLock();
  const requestWakeLock = wakeLock.request;
  const releaseWakeLock = wakeLock.release;

  const [minutes, setMinutes] = useState(course.minutes);
  const [theme, setTheme] = useState<ThemeId>(course.theme);
  const [sound, setSound] = useState<SoundId>("none");
  const [bgmId, setBgmId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(course.minutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState("waiting");
  const [beat, setBeat] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useState(false);
  const [bgmOpen, setBgmOpen] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  const endAtRef = useRef(0);
  const breathRef = useRef<HTMLDivElement | null>(null);
  const ambientRef = useRef<AmbientSound | null>(null);
  const narrationRef = useRef<HTMLAudioElement | null>(null);
  const bgmRef = useRef<HTMLAudioElement | null>(null);
  const lastSecondRef = useRef(-1);
  const lastBeatRef = useRef("");
  const bootRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);

  const positionKey = `maeum.player.position.${course.id}`;
  const minuteOptions = Array.from(new Set([10, 20, course.minutes])).sort((a, b) => a - b);
  const total = minutes * 60;
  const breath = course.breath;
  const cycle = breath.inhale + breath.hold + breath.exhale;
  const bgm = bgmById(bgmId);

  /* Restore the course's saved preset + last position once, on mount. */
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const stored = loadStoredPrefs();
    const sameCourse = stored.courseId === course.id;
    const nextMinutes = sameCourse ? stored.minutes : course.minutes;
    const nextTheme = sameCourse ? stored.theme : course.theme;
    setMinutes(nextMinutes);
    setTheme(nextTheme);
    setSound(stored.sound);
    setRemaining(nextMinutes * 60);

    const savedBgm = readJson<string | null>(`${BGM_KEY_PREFIX}${course.id}`, course.bgmId ?? null);
    if (savedBgm === null || typeof savedBgm === "string") {
      setBgmId(savedBgm && bgmById(savedBgm) ? savedBgm : course.bgmId ?? null);
    } else {
      setBgmId(course.bgmId ?? null);
    }

    const saved = readJson<number | null>(positionKey, null);
    if (typeof saved === "number" && saved > 5 && saved < nextMinutes * 60 - 5) {
      setResumeAt(saved);
    }
    // Intentionally runs once per mounted course page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  const stopAudio = useCallback(() => {
    narrationRef.current?.pause();
    if (bgmRef.current) {
      bgmRef.current.pause();
      bgmRef.current.currentTime = 0;
    }
    ambientRef.current?.stop();
  }, []);

  const startAudio = useCallback(() => {
    if (course.audioUrl && narrationRef.current) {
      narrationRef.current.volume = 1;
      void narrationRef.current.play().catch(() => undefined);
    }
    const track = bgmById(bgmId);
    if (track && bgmRef.current) {
      bgmRef.current.volume = course.audioUrl ? 0.28 : 0.6;
      void bgmRef.current.play().catch(() => undefined);
      return;
    }
    if (sound === "none") return;
    if (!ambientRef.current) ambientRef.current = new AmbientSound();
    ambientRef.current.play(sound);
  }, [course.audioUrl, bgmId, sound]);

  useEffect(() => {
    return () => {
      stopAudio();
      ambientRef.current?.dispose();
      ambientRef.current = null;
    };
  }, [stopAudio]);

  /* 배경음 트랙이 바뀌면 새 <audio> 엘리먼트가 붙은 뒤에 재생한다. */
  useEffect(() => {
    if (!running) return;
    if (!bgmId) return;
    const el = bgmRef.current;
    if (!el) return;
    el.volume = course.audioUrl ? 0.28 : 0.6;
    void el.play().catch(() => undefined);
  }, [bgmId, running, course.audioUrl]);

  const savePosition = useCallback(
    (left: number) => {
      if (left > 3 && left < total - 3) writeJson(positionKey, left);
      else removeKey(positionKey);
    },
    [positionKey, total],
  );

  const handleFinish = useCallback(() => {
    setRunning(false);
    setFinished(true);
    setRemaining(0);
    setPhase("still");
    setBeat("");
    lastBeatRef.current = "";
    void releaseWakeLock();
    stopAudio();
    removeKey(positionKey);
    void recordPlay(course.id, minutes);
    finishTimerRef.current = window.setTimeout(() => {
      const params = new URLSearchParams({
        moment: "after",
        from: "player",
        course: course.id,
        session: course.category,
        label: text.title,
        minutes: String(minutes),
      });
      router.push(`/diary?${params.toString()}`);
    }, 1400);
  }, [course.category, course.id, text.title, minutes, positionKey, recordPlay, releaseWakeLock, router, stopAudio, t]);

  /* Never navigate away after the user has already left the player. */
  useEffect(() => {
    return () => {
      if (finishTimerRef.current) window.clearTimeout(finishTimerRef.current);
    };
  }, []);

  /* Main timer + breathing loop. Uses an absolute end time so the countdown
     stays correct when the phone screen locks or the tab is backgrounded. */
  useEffect(() => {
    if (!running) return;
    let raf = 0;

    const loop = () => {
      const left = (endAtRef.current - Date.now()) / 1000;
      if (left <= 0) {
        handleFinish();
        return;
      }
      const second = Math.ceil(left);
      if (second !== lastSecondRef.current) {
        lastSecondRef.current = second;
        setRemaining(left);
      }

      const elapsed = total - left;
      const phaseT = elapsed % cycle;
      let label = "";
      let scale = 0.84;
      let local = 0;
      let phaseDuration = breath.inhale;

      if (phaseT < breath.inhale) {
        label = "inhale";
        local = phaseT;
        phaseDuration = breath.inhale;
        scale = 0.84 + 0.32 * smooth(local / phaseDuration);
      } else if (phaseT < breath.inhale + breath.hold) {
        label = "hold";
        local = phaseT - breath.inhale;
        phaseDuration = breath.hold;
        scale = 1.16;
      } else {
        label = "exhale";
        local = phaseT - breath.inhale - breath.hold;
        phaseDuration = breath.exhale;
        scale = 1.16 - 0.32 * smooth(local / phaseDuration);
      }

      const beatLabel = String(Math.max(1, Math.ceil(phaseDuration - local)));
      if (beatLabel !== lastBeatRef.current) {
        lastBeatRef.current = beatLabel;
        setBeat(beatLabel);
        setPhase(label);
      }
      if (!reducedMotion && breathRef.current) {
        breathRef.current.style.transform = `scale(${scale.toFixed(3)})`;
      }
      raf = requestAnimationFrame(loop);
    };

    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running, total, cycle, breath, reducedMotion, handleFinish]);

  const start = () => {
    if (finished) {
      reset();
    }
    const left = finished || remaining <= 0 ? minutes * 60 : remaining;
    endAtRef.current = Date.now() + left * 1000;
    lastSecondRef.current = -1;
    setRunning(true);
    setFinished(false);
    setResumeAt(null);
    void requestWakeLock();
    startAudio();
  };

  const pause = () => {
    const left = Math.max(0, (endAtRef.current - Date.now()) / 1000);
    setRemaining(left);
    setRunning(false);
    savePosition(left);
    void releaseWakeLock();
    stopAudio();
    setPhase("paused");
    setBeat("tap");
    lastBeatRef.current = "tap";
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(minutes * 60);
    setPhase("waiting");
    setBeat("");
    lastBeatRef.current = "";
    setResumeAt(null);
    void releaseWakeLock();
    stopAudio();
    removeKey(positionKey);
    if (breathRef.current) breathRef.current.style.transform = "scale(0.84)";
  };

  const changeMinutes = (next: number) => {
    if (next === minutes) return;
    setMinutes(next);
    setRemaining(next * 60);
    setRunning(false);
    setFinished(false);
    setPhase("waiting");
    setBeat("");
    setResumeAt(null);
    stopAudio();
    void releaseWakeLock();
    setPrefs({ courseId: course.id, minutes: next });
    removeKey(positionKey);
  };

  const changeTheme = (next: ThemeId) => {
    setTheme(next);
    setPrefs({ courseId: course.id, theme: next });
  };

  const changeSound = (next: SoundId) => {
    setSound(next);
    setBgmId(null);
    writeJson(`${BGM_KEY_PREFIX}${course.id}`, null);
    setPrefs({ courseId: course.id, sound: next });
    if (!running) return;
    bgmRef.current?.pause();
    ambientRef.current?.stop();
    if (next !== "none") {
      if (!ambientRef.current) ambientRef.current = new AmbientSound();
      ambientRef.current.play(next);
    }
  };

  const changeBgm = (next: string | null) => {
    setBgmId(next);
    writeJson(`${BGM_KEY_PREFIX}${course.id}`, next);
    setBgmOpen(false);
    if (next) ambientRef.current?.stop();
  };

  const elapsed = Math.max(0, total - remaining);
  const progress = total > 0 ? elapsed / total : 0;
  const themeMeta = THEMES[theme];

  const localizedSteps = text.guideSteps ?? [];
  const guideStep = localizedSteps.length
    ? [...localizedSteps].reverse().find((step) => step.at <= elapsed) ?? localizedSteps[0]
    : null;
  const nextGuideStep = localizedSteps.find((step) => step.at > elapsed) ?? null;

  return (
    <main className="player-page" data-theme={theme}>
      <SceneArt theme={theme} />

      <div className="player-inner">
        <header className="player-head">
          <Link
            href={course.category === "visualization" ? "/visualization" : "/meditation"}
            className="icon-btn player-icon"
            aria-label={t("common.back")}
          >
            ‹
          </Link>
          <div className="titles">
            <p className="player-kicker">
              {t(course.category === "visualization" ? "tab.visualization" : "tab.meditation")} ·{" "}
              {text.tag}
            </p>
            <h2>{text.title}</h2>
          </div>
          <div className="player-head-actions">
            {course.guide ? (
              <button
                className="icon-btn player-icon"
                onClick={() => setGuideOpen(true)}
                aria-label={t("player.guide")}
              >
                ☰
              </button>
            ) : null}
            <button
              className="icon-btn player-icon"
              onClick={() => setInfoOpen(true)}
              aria-label={t("player.info")}
            >
              i
            </button>
          </div>
        </header>

        <div className="ring-wrap">
          <svg className="breath-ring" viewBox="0 0 280 280" aria-hidden="true">
            <circle className="ring-track" cx="140" cy="140" r={RING_RADIUS} />
            <circle
              className="ring-progress"
              cx="140"
              cy="140"
              r={RING_RADIUS}
              strokeDasharray={RING_LENGTH.toFixed(2)}
              strokeDashoffset={(RING_LENGTH * (1 - progress)).toFixed(2)}
              style={{ stroke: themeMeta.accent }}
              transform="rotate(-90 140 140)"
            />
          </svg>
          <div
            className="breath"
            ref={breathRef}
            style={reducedMotion ? { transform: "scale(1)" } : undefined}
          >
            <div className="breath-core" />
          </div>
          <div className="breath-label">
            <span className="phase">{t(`player.${phase}`)}</span>
            <span className="beat">{beat === "tap" ? t("player.tapResume") : beat ? `${beat}${t("common.seconds")}` : ""}</span>
          </div>
        </div>

        <div className={`timer ${finished ? "done" : ""}`} aria-live="off">
          {fmtClock(remaining)}
        </div>
        <p className="timer-sub">
          {t("common.minutes", { n: minutes })} · {t(`theme.${theme}`)}
          {wakeLock.active ? ` · ${t("player.wake")}` : ""}
        </p>

        {course.guide && guideStep ? (
          <button type="button" className="guide-now" onClick={() => setGuideOpen(true)}>
            <span className="guide-now-kicker">
              {running || elapsed > 0 ? t("player.guideNow") : t("player.guideIntro")}
            </span>
            <span className="guide-now-line">{guideStep.line}</span>
            <span className="guide-now-next">
              {nextGuideStep
                ? t("player.guideNext", {
                    label: nextGuideStep.label,
                    time: fmtClock(nextGuideStep.at - elapsed),
                  })
                : t("player.guideLast")}
            </span>
          </button>
        ) : null}

        <div className="controls">
          <button className="ctrl" onClick={reset} aria-label={t("common.reset")}>
            ↺
          </button>
          <button
            className="ctrl main"
            onClick={running ? pause : start}
            aria-label={running ? t("common.pause") : t("common.start")}
          >
            {running ? "❚❚" : finished ? "↻" : "▶"}
          </button>
          <button
            className="ctrl"
            onClick={() =>
              router.push(
                `/diary?moment=${finished ? "after" : "before"}&from=player&session=${course.category}&label=${encodeURIComponent(
                  text.title,
                )}`,
              )
            }
            aria-label={t("diary.title")}
          >
            ✎
          </button>
        </div>
        <p className="ctrl-note">
          {finished
            ? t("player.finishedNote")
            : running
              ? course.guide
                ? t("player.runningGuide")
                : t("player.runningNote")
              : t("player.hintNote")}
        </p>

        {resumeAt !== null && !running && !finished && (
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <button
              className="chip"
              onClick={() => {
                setRemaining(resumeAt);
                setResumeAt(null);
                endAtRef.current = Date.now() + resumeAt * 1000;
                lastSecondRef.current = -1;
                setFinished(false);
                setRunning(true);
                void requestWakeLock();
                startAudio();
              }}
            >
              {t("player.resume", { time: fmtClock(resumeAt) })}
            </button>
          </div>
        )}

        <div className="player-panel">
          <p className="panel-label">{t("player.time")}</p>
          <div className="chips">
            {minuteOptions.map((value) => (
              <button
                key={value}
                className={`chip ${minutes === value ? "on" : ""}`}
                onClick={() => changeMinutes(value)}
                aria-pressed={minutes === value}
              >
                {t("common.minutes", { n: value })}
              </button>
            ))}
          </div>
          <p className="panel-label">{t("player.background")}</p>
          <div className="chips">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <button
                key={id}
                className={`chip ${theme === id ? "on" : ""}`}
                onClick={() => changeTheme(id)}
                aria-pressed={theme === id}
              >
                {t(`theme.${id}`)}
              </button>
            ))}
          </div>
          <p className="panel-label">{t("player.sound")}</p>
          <div className="chips">
            {SOUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`chip ${!bgmId && sound === option.id ? "on" : ""}`}
                onClick={() => changeSound(option.id)}
                aria-pressed={!bgmId && sound === option.id}
              >
                {t(`sound.${option.id}`)}
              </button>
            ))}
            <button
              className={`chip ${bgmId ? "on" : ""}`}
              onClick={() => setBgmOpen(true)}
              aria-pressed={Boolean(bgmId)}
            >
              {t("player.tracks")}
            </button>
          </div>
          <p className="panel-note">
            {bgm
              ? t("player.noteBgm", { title: bgm.title, artist: bgm.artist, license: bgm.license })
              : course.audioUrl
                ? t("player.noteNarration")
                : t("player.noteSynth")}
          </p>
          <div className="player-hint">
            <span>
              {t("player.breathing", {
                inhale: course.breath.inhale,
                hold: course.breath.hold,
                exhale: course.breath.exhale,
              })}
            </span>
            <span>{wakeLock.supported ? t("player.wake") : t("player.wakeUnsupported")}</span>
            {course.guide ? (
              <span>{t("player.guideCount", { n: course.guide.steps.length })}</span>
            ) : null}
          </div>
        </div>
      </div>

      {course.audioUrl && <audio ref={narrationRef} src={course.audioUrl} preload="none" />}
      {bgm ? <audio key={bgm.id} ref={bgmRef} src={bgm.audioUrl} loop preload="none" /> : null}

      <Sheet open={infoOpen} onClose={() => setInfoOpen(false)} labelledBy="player-info-title">
        <h3 id="player-info-title">{text.title}</h3>
        <p className="lead">{text.description}</p>
        <div className="sum">
          <div className="sum-row">
            <span>{t("player.length")}</span>
            <b>{t("common.minutes", { n: minutes })}</b>
          </div>
          <div className="sum-row">
            <span>{t("player.theme")}</span>
            <b>{t(`theme.${theme}`)}</b>
          </div>
          <div className="sum-row">
            <span>{t("player.breath")}</span>
            <b>
              {course.breath.inhale}s · {course.breath.hold}s · {course.breath.exhale}s
            </b>
          </div>
          {course.guide ? (
            <div className="sum-row">
              <span>{t("player.guide")}</span>
              <b>{t("player.guideCount", { n: course.guide.steps.length })}</b>
            </div>
          ) : null}
        </div>
        <p className="fine">{t("player.fine")}</p>
        <button className="btn block" onClick={() => setInfoOpen(false)}>
          {t("common.close")}
        </button>
      </Sheet>

      {course.guide ? (
        <Sheet open={guideOpen} onClose={() => setGuideOpen(false)} labelledBy="guide-title">
          <h3 id="guide-title">{t("player.guideTitle", { title: text.title })}</h3>
          <p className="lead">{text.guideIntent}</p>
          <p className="guide-narrator">{t("player.narrator")}</p>
          <ol className="guide-steps">
            {(text.guideSteps ?? []).map((step, index) => {
              const active = guideStep?.at === step.at && (running || elapsed > 0);
              return (
                <li key={`${step.at}-${index}`} className={active ? "on" : ""}>
                  <span className="at">{fmtClock(step.at)}</span>
                  <div>
                    <b>{step.label}</b>
                    <p>{step.line}</p>
                  </div>
                </li>
              );
            })}
          </ol>
          <div className="guide-audio-slot">
            <div>
              <b>{t("player.audioSlot")}</b>
              <p>
                {course.audioUrl
                  ? t("player.audioSlotOn")
                  : t("player.audioSlotOff", { id: course.id })}
              </p>
            </div>
            <span className={`slot-badge ${course.audioUrl ? "on" : ""}`}>
              {course.audioUrl ? t("player.slotReady") : t("player.slotPending")}
            </span>
          </div>
          <button className="btn block" onClick={() => setGuideOpen(false)}>
            {t("common.close")}
          </button>
        </Sheet>
      ) : null}

      <Sheet open={bgmOpen} onClose={() => setBgmOpen(false)} labelledBy="bgm-title">
        <h3 id="bgm-title">{t("player.bgmTitle")}</h3>
        <p className="lead">{t("player.bgmLead")}</p>
        <div className="bgm-list">
          <button
            type="button"
            className={`bgm-item ${!bgmId ? "on" : ""}`}
            onClick={() => changeBgm(null)}
          >
            <span className="bgm-theme">{t("player.bgmDefault")}</span>
            <span className="bgm-body">
              <b>{t("player.bgmDefault")}</b>
              <span>{t("player.bgmDefaultDesc")}</span>
            </span>
          </button>
          {BGM_TRACKS.map((track) => (
            <button
              key={track.id}
              type="button"
              className={`bgm-item ${bgmId === track.id ? "on" : ""}`}
              onClick={() => changeBgm(track.id)}
            >
              <span className="bgm-theme">{track.theme}</span>
              <span className="bgm-body">
                <b>{track.title}</b>
                <span>
                  {track.artist} · {track.duration} · {track.license}
                </span>
                <span className="bgm-license">{track.appUse}</span>
              </span>
            </button>
          ))}
        </div>
        <p className="fine">{t("player.bgmFine")}</p>
        <button className="btn block" onClick={() => setBgmOpen(false)}>
          {t("common.close")}
        </button>
      </Sheet>
    </main>
  );
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}

/** 정적 export용: 홈 추천 카드가 참조하는 코스 id 목록 */
export const PLAYER_COURSE_IDS = COURSES.map((course) => course.id);
