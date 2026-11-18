"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { buildWeeklyBriefing, weekMoodStrip } from "@/lib/briefing";
import { HOST, MOODS, moodById } from "@/lib/constants";
import { fmtDateShort } from "@/lib/date";
import type { DiaryMoment, MoodId } from "@/lib/types";

const PROMPTS = [
  { label: "오늘 있었던 일", fill: "오늘 있었던 일: " },
  { label: "몸의 느낌", fill: "몸이 느낀 것: " },
  { label: "내일의 나에게", fill: "내일의 나에게: " },
];

export function DiaryScreen() {
  const { diaries, saveDiary, removeDiary, mode, hydrated, toast } = useApp();

  const [moment, setMoment] = useState<DiaryMoment>("before");
  const [mood, setMood] = useState<MoodId | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingApplied = useRef(false);

  /* Quick-mood taps and player completion arrive as query params. */
  useEffect(() => {
    if (incomingApplied.current) return;
    const params = new URLSearchParams(window.location.search);
    const wantedMood = params.get("mood");
    const wantedMoment = params.get("moment");
    const fromPlayer = params.get("from") === "player";
    let touched = false;
    if (wantedMood && MOODS.some((m) => m.id === wantedMood)) {
      setMood(wantedMood as MoodId);
      touched = true;
    }
    if (wantedMoment === "after") {
      setMoment("after");
      touched = true;
    }
    if (fromPlayer) {
      setMoment("after");
      touched = true;
    }
    if (touched) incomingApplied.current = true;
  }, []);

  const week = useMemo(
    () => (hydrated ? weekMoodStrip(diaries) : []),
    [diaries, hydrated],
  );
  const briefing = useMemo(
    () => (hydrated ? buildWeeklyBriefing(diaries) : null),
    [diaries, hydrated],
  );
  const sorted = useMemo(
    () =>
      [...diaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [diaries],
  );

  const onSave = async () => {
    if (!mood) {
      toast("오늘의 감정을 하나 골라주세요");
      return;
    }
    if (saving) return;
    setSaving(true);
    try {
      await saveDiary({ moment, mood, intensity, text });
      setMood(null);
      setText("");
      setIntensity(3);
      setMoment("before");
      toast(
        mode === "supabase"
          ? "마음일기에 저장했어요. 내 계정에만 보관돼요."
          : "마음일기에 저장했어요. 이 기기에만 보관돼요.",
      );
    } catch (error) {
      toast(error instanceof Error ? error.message : "저장하지 못했어요");
    } finally {
      setSaving(false);
    }
  };

  const onDelete = async (id: string) => {
    if (confirmId !== id) {
      setConfirmId(id);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmId(null), 2600);
      return;
    }
    setConfirmId(null);
    try {
      await removeDiary(id);
      toast("기록을 지웠어요");
    } catch (error) {
      toast(error instanceof Error ? error.message : "삭제하지 못했어요");
    }
  };

  const onClearAll = async () => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmTimer.current) clearTimeout(confirmTimer.current);
      confirmTimer.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);
    try {
      await Promise.all(diaries.map((entry) => removeDiary(entry.id)));
      toast("이 기기의 마음일기를 모두 지웠어요");
    } catch {
      toast("일부 기록을 지우지 못했어요");
    }
  };

  return (
    <main className="page">
      <header className="view-head">
        <div>
          <p className="eyebrow">매일 마음 일기</p>
          <h1>오늘의 마음을 남겨요</h1>
        </div>
        <span className="tag">{diaries.length}개</span>
      </header>

      <div className="seg" style={{ marginTop: 16 }} role="tablist" aria-label="기록 시점">
        <button
          type="button"
          className={moment === "before" ? "on" : ""}
          onClick={() => setMoment("before")}
          role="tab"
          aria-selected={moment === "before"}
        >
          명상 전
        </button>
        <button
          type="button"
          className={moment === "after" ? "on" : ""}
          onClick={() => setMoment("after")}
          role="tab"
          aria-selected={moment === "after"}
        >
          명상 후
        </button>
      </div>

      <section className="card diary-form">
        <div className="form-label">
          <span>지금 감정</span>
          <span className="tiny">하나만 골라도 좋아요</span>
        </div>
        <div className="mood-grid" role="group" aria-label="감정 선택">
          {MOODS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mood ${mood === item.id ? "on" : ""}`}
              onClick={() => setMood(item.id)}
              aria-pressed={mood === item.id}
            >
              <span className="e" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="l">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="form-label" style={{ marginTop: 18 }}>
          <span>마음의 크기</span>
          <span className="tiny">{intensity}/5</span>
        </div>
        <div className="intensity" role="group" aria-label="마음의 크기">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`dot ${intensity === value ? "on" : ""}`}
              onClick={() => setIntensity(value)}
              aria-pressed={intensity === value}
              aria-label={`마음의 크기 ${value}`}
            >
              {value}
            </button>
          ))}
          <span className="scale-note">작게 — 크게</span>
        </div>

        <div className="form-label" style={{ marginTop: 18 }}>
          <span>한 줄도 괜찮아요</span>
          <span className="tiny">최대 600자</span>
        </div>
        <textarea
          className="diary-textarea"
          maxLength={600}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="오늘 마음에 남은 것을 적어보세요. 아무도 평가하지 않아요."
          aria-label="마음일기 본문"
        />
        <div className="prompt-chips">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt.fill}
              type="button"
              className="pchip"
              onClick={() => {
                setText((prev) =>
                  prev ? `${prev.replace(/\s*$/, "")}\n${prompt.fill}` : prompt.fill,
                );
                window.setTimeout(() => {
                  const area = document.querySelector<HTMLTextAreaElement>(
                    ".diary-textarea",
                  );
                  area?.focus();
                  area?.setSelectionRange(area.value.length, area.value.length);
                }, 0);
              }}
            >
              {prompt.label}
            </button>
          ))}
        </div>

        <div className="form-foot">
          <span className="count">{text.length} / 600</span>
          <button
            className="btn"
            type="button"
            onClick={onSave}
            disabled={saving}
          >
            {saving ? "저장 중…" : "일기 저장"}
          </button>
        </div>
      </section>

      <div className="section-head">
        <h2>최근 7일 요약</h2>
        <span className="tiny">
          {mode === "supabase" ? "내 계정에만 저장" : "이 기기에만 저장돼요"}
        </span>
      </div>

      {week.length > 0 && (
        <div className="card week" style={{ marginBottom: 10 }} aria-label="이번 주 감정">
          <div className="week-row">
            {week.map((day) => {
              const item = day.mood ? moodById(day.mood) : null;
              return (
                <div
                  key={day.key}
                  className={`day ${item ? "has" : ""} ${day.isToday ? "today" : ""}`}
                >
                  <div className="d">{day.weekday}</div>
                  <div className="m" aria-hidden="true">
                    {item ? item.emoji : "·"}
                  </div>
                  <div className="n">{day.day}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {briefing && briefing.totalEntries > 0 ? (
        <div className="card briefing">
          <div className="row">
            <h3>상담 브리핑 카드</h3>
            <span className="spacer" />
            <span className="tiny">{HOST.displayName}이 미리 읽어요</span>
          </div>
          <ul>
            {briefing.lines.map((line) => (
              <li key={line}>{line}</li>
            ))}
          </ul>
          {briefing.totalEntries >= 3 ? (
            <Link
              href="/counseling"
              className="btn sage-wash"
              style={{ height: 40, fontSize: 12.5, marginTop: 12, width: "100%" }}
            >
              3분 상담 예약하기 · 3,900원부터
            </Link>
          ) : (
            <p className="tiny" style={{ marginTop: 10 }}>
              기록이 3개 이상 쌓이면 상담 화면에서 요약 카드가 함께 보여요.
            </p>
          )}
        </div>
      ) : (
        <div className="empty">
          <span className="e">🌱</span>
          아직 이번 주 기록이 없어요.
          <br />
          오늘의 마음을 한 줄로 남겨보세요.
        </div>
      )}

      <div className="section-head">
        <h2>지난 기록</h2>
        <span className="tiny">{hydrated ? `${sorted.length}개` : ""}</span>
      </div>

      <div className="diary-list">
        {sorted.length === 0 ? (
          <div className="empty">
            <span className="e">📝</span>
            아직 기록이 없어요.
            <br />
            첫 기록은 1분이면 충분해요.
          </div>
        ) : (
          sorted.map((entry) => {
            const item = moodById(entry.mood);
            const created = new Date(entry.createdAt);
            const hhmm = `${String(created.getHours()).padStart(2, "0")}:${String(
              created.getMinutes(),
            ).padStart(2, "0")}`;
            return (
              <article key={entry.id} className="entry">
                <button
                  type="button"
                  className={`del ${confirmId === entry.id ? "confirm" : ""}`}
                  onClick={() => onDelete(entry.id)}
                  aria-label="기록 삭제"
                >
                  {confirmId === entry.id ? "삭제?" : "✕"}
                </button>
                <div className="entry-top">
                  <span className={`badge ${entry.moment === "after" ? "after" : ""}`}>
                    {entry.moment === "after" ? "명상 후" : "명상 전"}
                  </span>
                  <span className="when">
                    {fmtDateShort(entry.date)} {hhmm}
                  </span>
                </div>
                <div className="moodline">
                  <span className="e" aria-hidden="true">
                    {item.emoji}
                  </span>
                  {item.label}
                  <span className="tiny" style={{ fontWeight: 500, marginLeft: 4 }}>
                    마음의 크기 {entry.intensity}/5
                  </span>
                </div>
                {entry.text ? <p className="body">{entry.text}</p> : null}
              </article>
            );
          })
        )}
      </div>

      {sorted.length > 0 && (
        <button type="button" className="clear-all" onClick={onClearAll}>
          {confirmClear
            ? "한 번 더 누르면 모두 지워져요"
            : mode === "supabase"
              ? "내 마음일기 모두 지우기"
              : "이 기기의 기록 모두 지우기"}
        </button>
      )}

      {mode === "supabase" && diaries.length > 0 && (
        <p className="tiny" style={{ textAlign: "center", marginTop: 12 }}>
          상담을 예약하고 브리핑 열람에 동의한 경우에만, 최근 7일 요약이{" "}
          {HOST.displayName} 화면에 보여요.
        </p>
      )}
      <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
        기록은 언제든 직접 지울 수 있어요.
      </p>
    </main>
  );
}
