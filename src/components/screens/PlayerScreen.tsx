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
import { THEMES, courseById } from "@/lib/constants";
import { fmtClock } from "@/lib/date";
import { loadStoredPrefs, readJson, removeKey, writeJson } from "@/lib/storage";
import type { ThemeId } from "@/lib/types";

const RING_RADIUS = 126;
const RING_LENGTH = 2 * Math.PI * RING_RADIUS;

export function PlayerScreen({ courseId }: { courseId: string }) {
  const course = courseById(courseId);
  const router = useRouter();
  const { setPrefs, recordPlay } = useApp();
  const reducedMotion = usePrefersReducedMotion();
  const wakeLock = useWakeLock();
  const requestWakeLock = wakeLock.request;
  const releaseWakeLock = wakeLock.release;

  const [minutes, setMinutes] = useState(course.minutes);
  const [theme, setTheme] = useState<ThemeId>(course.theme);
  const [sound, setSound] = useState<SoundId>("none");
  const [remaining, setRemaining] = useState(course.minutes * 60);
  const [running, setRunning] = useState(false);
  const [finished, setFinished] = useState(false);
  const [phase, setPhase] = useState("시작을 기다리는 중");
  const [beat, setBeat] = useState("");
  const [infoOpen, setInfoOpen] = useState(false);
  const [resumeAt, setResumeAt] = useState<number | null>(null);

  const endAtRef = useRef(0);
  const breathRef = useRef<HTMLDivElement | null>(null);
  const ambientRef = useRef<AmbientSound | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSecondRef = useRef(-1);
  const lastBeatRef = useRef("");
  const bootRef = useRef(false);
  const finishTimerRef = useRef<number | null>(null);

  const positionKey = `maeum.player.position.${course.id}`;
  const minuteOptions = Array.from(new Set([10, 20, course.minutes])).sort((a, b) => a - b);
  const total = minutes * 60;
  const breath = course.breath;
  const cycle = breath.inhale + breath.hold + breath.exhale;

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

    const saved = readJson<number | null>(positionKey, null);
    if (typeof saved === "number" && saved > 5 && saved < nextMinutes * 60 - 5) {
      setResumeAt(saved);
    }
    // Intentionally runs once per mounted course page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [course.id]);

  const stopAudio = useCallback(() => {
    audioRef.current?.pause();
    ambientRef.current?.stop();
  }, []);

  const startAudio = useCallback(() => {
    if (course.audioUrl && audioRef.current) {
      void audioRef.current.play().catch(() => undefined);
      return;
    }
    if (sound === "none") return;
    if (!ambientRef.current) ambientRef.current = new AmbientSound();
    ambientRef.current.play(sound);
  }, [course.audioUrl, sound]);

  useEffect(() => {
    return () => {
      stopAudio();
      ambientRef.current?.dispose();
      ambientRef.current = null;
    };
  }, [stopAudio]);

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
    setPhase("고마워요");
    setBeat("");
    lastBeatRef.current = "";
    void releaseWakeLock();
    stopAudio();
    removeKey(positionKey);
    void recordPlay(course.id, minutes);
    finishTimerRef.current = window.setTimeout(() => {
      router.push(`/diary?moment=after&from=player&course=${course.id}`);
    }, 1400);
  }, [course.id, minutes, positionKey, recordPlay, releaseWakeLock, router, stopAudio]);

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
      const t = elapsed % cycle;
      let label = "";
      let scale = 0.84;
      let local = 0;
      let phaseDuration = breath.inhale;

      if (t < breath.inhale) {
        label = "들이쉬세요";
        local = t;
        phaseDuration = breath.inhale;
        scale = 0.84 + 0.32 * smooth(local / phaseDuration);
      } else if (t < breath.inhale + breath.hold) {
        label = "잠시 머물러요";
        local = t - breath.inhale;
        phaseDuration = breath.hold;
        scale = 1.16;
      } else {
        label = "천천히 내쉬세요";
        local = t - breath.inhale - breath.hold;
        phaseDuration = breath.exhale;
        scale = 1.16 - 0.32 * smooth(local / phaseDuration);
      }

      const beatLabel = `${Math.max(1, Math.ceil(phaseDuration - local))}초`;
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
    setPhase("일시정지");
    setBeat("탭해서 이어서");
    lastBeatRef.current = "탭해서 이어서";
  };

  const reset = () => {
    setRunning(false);
    setFinished(false);
    setRemaining(minutes * 60);
    setPhase("시작을 기다리는 중");
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
    setPhase("시작을 기다리는 중");
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
    setPrefs({ courseId: course.id, sound: next });
    if (!running) return;
    if (course.audioUrl) return;
    ambientRef.current?.stop();
    if (next !== "none") {
      if (!ambientRef.current) ambientRef.current = new AmbientSound();
      ambientRef.current.play(next);
    }
  };

  const elapsed = Math.max(0, total - remaining);
  const progress = total > 0 ? elapsed / total : 0;
  const themeMeta = THEMES[theme];

  return (
    <main className="player-page" data-theme={theme}>
      <SceneArt theme={theme} />

      <div className="player-inner">
        <header className="player-head">
          <Link
            href="/"
            className="icon-btn player-icon"
            aria-label="명상 탭으로 돌아가기"
          >
            ‹
          </Link>
          <div className="titles">
            <p className="player-kicker">지금 재생 중</p>
            <h2>{course.title}</h2>
          </div>
          <button
            className="icon-btn player-icon"
            onClick={() => setInfoOpen(true)}
            aria-label="코스 안내"
          >
            i
          </button>
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
            <span className="phase">{phase}</span>
            <span className="beat">{beat}</span>
          </div>
        </div>

        <div className={`timer ${finished ? "done" : ""}`} aria-live="off">
          {fmtClock(remaining)}
        </div>
        <p className="timer-sub">
          {minutes}분 · {themeMeta.label}
          {wakeLock.active ? " · 화면 켜짐 유지" : ""}
        </p>

        <div className="controls">
          <button className="ctrl" onClick={reset} aria-label="처음부터">
            ↺
          </button>
          <button
            className="ctrl main"
            onClick={running ? pause : start}
            aria-label={running ? "일시정지" : "재생"}
          >
            {running ? "❚❚" : finished ? "↻" : "▶"}
          </button>
          <button
            className="ctrl"
            onClick={() => router.push(`/diary?moment=${finished ? "after" : "before"}`)}
            aria-label="마음일기 쓰기"
          >
            ✎
          </button>
        </div>
        <p className="ctrl-note">
          {finished
            ? "명상을 마쳤어요. 지금 마음을 일기로 남겨보세요."
            : running
              ? "어깨를 내리고, 숨이 들어오는 곳에 집중해 보세요."
              : "명상이 끝나면 마음일기로 이어져요"}
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
              이어서 듣기 · {fmtClock(resumeAt)}
            </button>
          </div>
        )}

        <div className="player-panel">
          <p className="panel-label">시간</p>
          <div className="chips">
            {minuteOptions.map((value) => (
              <button
                key={value}
                className={`chip ${minutes === value ? "on" : ""}`}
                onClick={() => changeMinutes(value)}
                aria-pressed={minutes === value}
              >
                {value}분
              </button>
            ))}
          </div>
          <p className="panel-label">배경</p>
          <div className="chips">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <button
                key={id}
                className={`chip ${theme === id ? "on" : ""}`}
                onClick={() => changeTheme(id)}
                aria-pressed={theme === id}
              >
                {THEMES[id].label}
              </button>
            ))}
          </div>
          <p className="panel-label">사운드</p>
          <div className="chips">
            {SOUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                className={`chip ${sound === option.id ? "on" : ""}`}
                onClick={() => changeSound(option.id)}
                aria-pressed={sound === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          <p className="panel-note">
            {course.audioUrl
              ? "코스 오디오가 함께 재생돼요."
              : "사운드는 기기에서 합성돼요. 실제 코스에서는 BGM과 나레이션이 함께 흘러요."}
          </p>
          <div className="player-hint">
            <span>{course.breath.inhale}-{course.breath.hold}-{course.breath.exhale} 호흡</span>
            <span>{wakeLock.supported ? "화면 꺼짐 방지" : "화면 유지 미지원"}</span>
            {reducedMotion && <span>동작 줄임 모드</span>}
          </div>
        </div>
      </div>

      {course.audioUrl && (
        <audio ref={audioRef} src={course.audioUrl} loop preload="none" />
      )}

      <Sheet
        open={infoOpen}
        onClose={() => setInfoOpen(false)}
        labelledBy="player-info-title"
      >
        <h3 id="player-info-title">{course.title}</h3>
        <p className="lead">{course.description}</p>
        <div className="sum">
          <div className="sum-row">
            <span>길이</span>
            <b>{minutes}분</b>
          </div>
          <div className="sum-row">
            <span>테마</span>
            <b>{themeMeta.label}</b>
          </div>
          <div className="sum-row">
            <span>호흡</span>
            <b>
              {course.breath.inhale}초 · {course.breath.hold}초 · {course.breath.exhale}초
            </b>
          </div>
        </div>
        <p className="fine">
          명상 콘텐츠는 의료 행위가 아닙니다. 몸이 불편하면 언제든 멈추고 편히 쉬어 주세요.
        </p>
        <button className="btn block" onClick={() => setInfoOpen(false)}>
          닫기
        </button>
      </Sheet>
    </main>
  );
}

function smooth(t: number) {
  return t * t * (3 - 2 * t);
}
