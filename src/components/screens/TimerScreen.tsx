"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useWakeLock } from "@/hooks/useWakeLock";
import { AmbientSound, SOUND_OPTIONS, type SoundId } from "@/lib/audio/ambient";
import { THEMES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/LangProvider";
import { fmtClock, pad2 } from "@/lib/date";
import { newLocalId } from "@/lib/media";
import { readJson, writeJson } from "@/lib/storage";
import type { ThemeId } from "@/lib/types";

const SESSIONS_KEY = "maeum.timer.sessions.v1";

interface TimerSession {
  id: string;
  startedAt: string;
  endedAt: string;
  seconds: number;
}

function loadTimerSessions(): TimerSession[] {
  const raw = readJson<unknown>(SESSIONS_KEY, []);
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (entry): entry is TimerSession =>
        Boolean(entry) &&
        typeof entry === "object" &&
        typeof (entry as TimerSession).id === "string" &&
        typeof (entry as TimerSession).seconds === "number",
    )
    .slice(0, 12);
}

export function TimerScreen() {
  const router = useRouter();
  const { recordPlay, toast } = useApp();
  const { t } = useI18n();
  const reducedMotion = usePrefersReducedMotion();
  const wakeLock = useWakeLock();
  const requestWakeLock = wakeLock.request;
  const releaseWakeLock = wakeLock.release;

  const [running, setRunning] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [finished, setFinished] = useState<number | null>(null);
  const [theme, setTheme] = useState<ThemeId>("night");
  const [sound, setSound] = useState<SoundId>("none");
  const [sessions, setSessions] = useState<TimerSession[]>([]);

  const startRef = useRef(0);
  const baseRef = useRef(0);
  const startedAtRef = useRef<Date | null>(null);
  const ambientRef = useRef<AmbientSound | null>(null);
  const finishRef = useRef(false);

  useEffect(() => {
    setSessions(loadTimerSessions());
  }, []);

  useEffect(() => {
    if (!running) return;
    let raf = 0;
    const loop = () => {
      const value = baseRef.current + (Date.now() - startRef.current) / 1000;
      setElapsed(value);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [running]);

  const stopAudio = useCallback(() => {
    ambientRef.current?.stop();
  }, []);

  useEffect(() => {
    return () => {
      stopAudio();
      ambientRef.current?.dispose();
      ambientRef.current = null;
    };
  }, [stopAudio]);

  const playSound = (kind: SoundId) => {
    setSound(kind);
    if (!ambientRef.current) ambientRef.current = new AmbientSound();
    if (kind === "none") ambientRef.current.stop();
    else ambientRef.current.play(kind);
  };

  const start = () => {
    setFinished(null);
    startRef.current = Date.now();
    if (!startedAtRef.current) startedAtRef.current = new Date();
    setRunning(true);
    void requestWakeLock();
    if (sound !== "none") {
      if (!ambientRef.current) ambientRef.current = new AmbientSound();
      ambientRef.current.play(sound);
    }
  };

  const pause = () => {
    baseRef.current += (Date.now() - startRef.current) / 1000;
    setElapsed(baseRef.current);
    setRunning(false);
    void releaseWakeLock();
    stopAudio();
  };

  const finish = async () => {
    if (finishRef.current) return;
    const seconds = Math.floor(
      baseRef.current + (running ? (Date.now() - startRef.current) / 1000 : 0),
    );
    if (seconds < 10) {
      toast(t("timer.tooShort"));
      return;
    }
    finishRef.current = true;
    setRunning(false);
    setElapsed(seconds);
    setFinished(seconds);
    void releaseWakeLock();
    stopAudio();

    const endedAt = new Date();
    const startedAt = startedAtRef.current ?? new Date(endedAt.getTime() - seconds * 1000);
    const record: TimerSession = {
      id: newLocalId("timer"),
      startedAt: startedAt.toISOString(),
      endedAt: endedAt.toISOString(),
      seconds,
    };
    const next = [record, ...loadTimerSessions()].slice(0, 12);
    writeJson(SESSIONS_KEY, next);
    setSessions(next);

    const minutes = Math.max(0.1, Math.round((seconds / 60) * 10) / 10);
    await recordPlay("timer", minutes, seconds);
    toast(t("timer.recorded", { time: fmtDuration(seconds, t) }));

    baseRef.current = 0;
    startedAtRef.current = null;
    finishRef.current = false;
  };

  const reset = () => {
    setRunning(false);
    setElapsed(0);
    setFinished(null);
    baseRef.current = 0;
    startedAtRef.current = null;
    void releaseWakeLock();
    stopAudio();
  };

  const themeMeta = THEMES[theme];
  const totalThisWeek = sessions
    .filter((entry) => Date.now() - new Date(entry.endedAt).getTime() < 7 * 86400000)
    .reduce((sum, entry) => sum + entry.seconds, 0);

  return (
    <main className="timer-page" data-theme={theme} style={{ background: themeMeta.background }}>
      <div className="timer-inner">
        <header className="timer-head">
          <Link href="/meditation" className="icon-btn player-icon" aria-label={t("common.back")}>
            ‹
          </Link>
          <div className="titles">
            <p className="player-kicker">{t("timer.kicker")}</p>
            <h2>{t("timer.title")}</h2>
          </div>
          <span className="timer-live">{running ? t("timer.state.running") : finished ? t("timer.state.done") : t("timer.state.idle")}</span>
        </header>

        <div className={`timer-clock ${running ? "running" : ""} ${reducedMotion ? "still" : ""}`}>
          <span className="timer-halo" aria-hidden="true" />
          <span className="timer-value">{fmtClock(elapsed)}</span>
          <span className="timer-caption">
            {finished !== null
              ? t("timer.recorded", { time: fmtDuration(finished, t) })
              : running
                ? t("timer.caption.running")
                : elapsed > 0
                  ? t("timer.caption.paused")
                  : t("timer.caption.idle")}
          </span>
        </div>

        {finished !== null ? (
          <div className="timer-result">
            <p className="timer-result-big">{fmtDuration(finished, t)}</p>
            <p className="timer-result-sub">
              {t("timer.resultSub")}
            </p>
            <div className="timer-result-actions">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  router.push(
                    `/diary?moment=after&from=timer&seconds=${finished}&label=${encodeURIComponent(
                      fmtDuration(finished, t),
                    )}`,
                  )
                }
              >
                {t("timer.toDiary")}
              </button>
              <button type="button" className="btn ghost" onClick={reset}>
                {t("timer.again")}
              </button>
            </div>
          </div>
        ) : (
          <div className="timer-controls">
            <button type="button" className="ctrl" onClick={reset} aria-label={t("common.reset")}>
              ↺
            </button>
            <button
              type="button"
              className="ctrl main"
              onClick={running ? pause : start}
              aria-label={running ? t("timer.pause") : t("timer.start")}
            >
              {running ? "❚❚" : "▶"}
            </button>
            <button
              type="button"
              className="ctrl end"
              onClick={finish}
              aria-label={t("timer.record")}
              disabled={elapsed < 10}
            >
              ■
            </button>
          </div>
        )}

        <p className="timer-note">
          {running ? t("timer.noteRunning") : t("timer.noteIdle")}
        </p>

        <div className="timer-panel">
          <p className="panel-label">{t("timer.background")}</p>
          <div className="chips">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`chip ${theme === id ? "on" : ""}`}
                onClick={() => setTheme(id)}
                aria-pressed={theme === id}
              >
                {t(`theme.${id}`)}
              </button>
            ))}
          </div>
          <p className="panel-label">{t("timer.sound")}</p>
          <div className="chips">
            {SOUND_OPTIONS.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`chip ${sound === option.id ? "on" : ""}`}
                onClick={() => playSound(option.id)}
                aria-pressed={sound === option.id}
              >
                {t(`sound.${option.id}`)}
              </button>
            ))}
          </div>
          <div className="player-hint">
            <span>{wakeLock.supported ? t("player.wake") : t("player.wakeUnsupported")}</span>
            <span>{t("timer.weekTotal", { time: fmtDuration(totalThisWeek, t) })}</span>
          </div>
        </div>

        {sessions.length > 0 ? (
          <section className="timer-history" aria-label={t("timer.history")}>
            <div className="section-head" style={{ margin: "22px 0 8px" }}>
              <h2>{t("timer.history")}</h2>
              <span className="tiny">{sessions.length}</span>
            </div>
            <ul>
              {sessions.map((entry) => {
                const ended = new Date(entry.endedAt);
                return (
                  <li key={entry.id}>
                    <span className="when">
                      {`${ended.getMonth() + 1}/${ended.getDate()} ${pad2(ended.getHours())}:${pad2(
                        ended.getMinutes(),
                      )}`}
                    </span>
                    <b>{fmtDuration(entry.seconds, t)}</b>
                  </li>
                );
              })}
            </ul>
            <Link href="/diary" className="link" style={{ display: "inline-block", marginTop: 10 }}>
              {t("timer.toDiaryList")} ›
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function fmtDuration(
  seconds: number,
  t: (key: string, vars?: Record<string, string | number>) => string,
) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}${t("common.seconds")}`;
  return `${m}${t("common.min")} ${pad2(s)}${t("common.seconds")}`;
}
