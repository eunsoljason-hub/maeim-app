"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { usePrefersReducedMotion } from "@/hooks/usePrefersReducedMotion";
import { useWakeLock } from "@/hooks/useWakeLock";
import { AmbientSound, SOUND_OPTIONS, type SoundId } from "@/lib/audio/ambient";
import { THEMES } from "@/lib/constants";
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
      toast("10초 이상 앉은 뒤에 기록할 수 있어요");
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
    toast(`${fmtDuration(seconds)} 기록했어요`);

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
          <Link href="/meditation" className="icon-btn player-icon" aria-label="명상으로 돌아가기">
            ‹
          </Link>
          <div className="titles">
            <p className="player-kicker">자유 명상 타이머</p>
            <h2>원하는 만큼 앉아 있어요</h2>
          </div>
          <span className="timer-live">{running ? "진행 중" : finished ? "기록됨" : "대기"}</span>
        </header>

        <div className={`timer-clock ${running ? "running" : ""} ${reducedMotion ? "still" : ""}`}>
          <span className="timer-halo" aria-hidden="true" />
          <span className="timer-value">{fmtClock(elapsed)}</span>
          <span className="timer-caption">
            {finished !== null
              ? `${fmtDuration(finished)}를 기록했어요`
              : running
                ? "숨이 들어오는 곳에 머물러 보세요"
                : elapsed > 0
                  ? "잠시 멈춰 있어요"
                  : "시작 버튼을 누르면 시간이 흘러요"}
          </span>
        </div>

        {finished !== null ? (
          <div className="timer-result">
            <p className="timer-result-big">{fmtDuration(finished)}</p>
            <p className="timer-result-sub">
              오늘의 명상이 기록에 남았어요. 이제 마음에 남은 것을 적어볼까요?
            </p>
            <div className="timer-result-actions">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  router.push(
                    `/diary?moment=after&from=timer&seconds=${finished}&label=${encodeURIComponent(
                      fmtDuration(finished),
                    )}`,
                  )
                }
              >
                마음기록 남기기
              </button>
              <button type="button" className="btn ghost" onClick={reset}>
                다시 시작
              </button>
            </div>
          </div>
        ) : (
          <div className="timer-controls">
            <button type="button" className="ctrl" onClick={reset} aria-label="처음부터">
              ↺
            </button>
            <button
              type="button"
              className="ctrl main"
              onClick={running ? pause : start}
              aria-label={running ? "일시정지" : "시작"}
            >
              {running ? "❚❚" : "▶"}
            </button>
            <button
              type="button"
              className="ctrl end"
              onClick={finish}
              aria-label="명상 마치기"
              disabled={elapsed < 10}
            >
              ■
            </button>
          </div>
        )}

        <p className="timer-note">
          {running
            ? "끝나고 싶은 순간에 ■ 를 누르면 실제 앉아 있던 시간이 분:초로 저장돼요."
            : "시간을 정하지 않고, 몸이 원하는 만큼 앉아요. 화면이 꺼지지 않도록 유지돼요."}
        </p>

        <div className="timer-panel">
          <p className="panel-label">배경</p>
          <div className="chips">
            {(Object.keys(THEMES) as ThemeId[]).map((id) => (
              <button
                key={id}
                type="button"
                className={`chip ${theme === id ? "on" : ""}`}
                onClick={() => setTheme(id)}
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
                type="button"
                className={`chip ${sound === option.id ? "on" : ""}`}
                onClick={() => playSound(option.id)}
                aria-pressed={sound === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>
          <div className="player-hint">
            <span>{wakeLock.supported ? "화면 꺼짐 방지" : "화면 유지 미지원"}</span>
            <span>이번 주 타이머 {fmtDuration(totalThisWeek)}</span>
          </div>
        </div>

        {sessions.length > 0 ? (
          <section className="timer-history" aria-label="최근 타이머 기록">
            <div className="section-head" style={{ margin: "22px 0 8px" }}>
              <h2>최근 타이머 기록</h2>
              <span className="tiny">{sessions.length}개</span>
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
                    <b>{fmtDuration(entry.seconds)}</b>
                  </li>
                );
              })}
            </ul>
            <Link href="/diary" className="link" style={{ display: "inline-block", marginTop: 10 }}>
              마음기록에서 함께 보기 ›
            </Link>
          </section>
        ) : null}
      </div>
    </main>
  );
}

function fmtDuration(seconds: number) {
  const total = Math.max(0, Math.round(seconds));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}초`;
  return `${m}분 ${pad2(s)}초`;
}
