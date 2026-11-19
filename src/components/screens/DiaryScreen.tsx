"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { PracticeStatsCard } from "@/components/practice/PracticeStatsCard";
import { buildWeeklyBriefing, weekMoodStrip } from "@/lib/briefing";
import { HOST, MOODS, moodById } from "@/lib/constants";
import { dateKey, fmtDateLong, fmtDateShort } from "@/lib/date";
import { ENERGY_LABELS, loadTodayCheckIn } from "@/lib/checkin";
import { MonthAgoCard } from "@/components/diary/MonthAgoCard";
import {
  EMPTY_EXTRAS,
  MAX_MEDIA_PER_ENTRY,
  loadExtrasMap,
  mediaObjectUrl,
  newLocalId,
  normalizeUrl,
  prepareAudioBlob,
  prepareMediaFile,
  removeDiaryExtras,
  saveDiaryExtras,
  deleteMediaBlob,
  type DiaryExtras,
  type DiaryLink,
  type DiaryMediaMeta,
} from "@/lib/media";
import type { DiaryMoment, MoodId } from "@/lib/types";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";

const PROMPTS = [
  { label: "오늘 있었던 일", fill: "오늘 있었던 일: " },
  { label: "몸의 느낌", fill: "몸이 느낀 것: " },
  { label: "내일의 나에게", fill: "내일의 나에게: " },
];

interface SessionContext {
  title: string;
  detail: string;
}

function readSessionContext(params: URLSearchParams): SessionContext | null {
  const from = params.get("from");
  const label = params.get("label");
  const session = params.get("session");
  const minutes = params.get("minutes");
  const seconds = params.get("seconds");
  const count = params.get("count");

  if (from === "player" && session === "visualization") {
    return {
      title: "시각화를 마치고",
      detail: `${label ?? "시각화"}${minutes ? ` · ${minutes}분` : ""} · 장면을 마음에 남겼어요`,
    };
  }
  if (from === "player" && session === "meditation") {
    return {
      title: "명상을 마치고",
      detail: `${label ?? "명상"}${minutes ? ` · ${minutes}분` : ""} · 숨을 고르고 돌아왔어요`,
    };
  }
  if (from === "timer") {
    return {
      title: "자유 명상을 마치고",
      detail: `${label ?? (seconds ? `${Math.round(Number(seconds) / 60)}분` : "타이머 명상")}를 기록했어요`,
    };
  }
  if (from === "affirmations") {
    return {
      title: "확언을 마치고",
      detail: `${session ?? "확언"}${count ? ` · ${count}문장` : ""} · 말로 오늘을 새겼어요`,
    };
  }
  return null;
}

export function DiaryScreen() {
  const { diaries, saveDiary, removeDiary, mode, hydrated, toast } = useApp();

  const [moment, setMoment] = useState<DiaryMoment>("before");
  const [mood, setMood] = useState<MoodId | null>(null);
  const [intensity, setIntensity] = useState(3);
  const [energy, setEnergy] = useState(3);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingApplied = useRef(false);

  const [session, setSession] = useState<SessionContext | null>(null);
  const [links, setLinks] = useState<DiaryLink[]>([]);
  const [media, setMedia] = useState<DiaryMediaMeta[]>([]);
  const [linkInput, setLinkInput] = useState("");
  const [linkLabel, setLinkLabel] = useState("");
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [extrasMap, setExtrasMap] = useState<Record<string, DiaryExtras>>({});
  const [audioTick, setAudioTick] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordSecondsRef = useRef(0);

  /* Quick-mood taps and session completions arrive as query params. */
  useEffect(() => {
    if (incomingApplied.current) return;
    const params = new URLSearchParams(window.location.search);
    const wantedMood = params.get("mood");
    const wantedMoment = params.get("moment");
    const fromSession = Boolean(params.get("from"));
    let touched = false;
    const todayCheckIn = loadTodayCheckIn();
    if (todayCheckIn) {
      setEnergy(todayCheckIn.energy);
    }
    if (wantedMood && MOODS.some((m) => m.id === wantedMood)) {
      setMood(wantedMood as MoodId);
      touched = true;
    } else if (todayCheckIn) {
      setMood(todayCheckIn.mood);
    }
    if (wantedMoment === "after" || fromSession) {
      setMoment("after");
      touched = true;
    }
    if (fromSession) {
      setSession(readSessionContext(params));
      touched = true;
    }
    if (touched) incomingApplied.current = true;
  }, []);

  useEffect(() => {
    setExtrasMap(loadExtrasMap());
  }, []);

  const week = useMemo(() => (hydrated ? weekMoodStrip(diaries) : []), [diaries, hydrated]);
  const briefing = useMemo(
    () => (hydrated ? buildWeeklyBriefing(diaries) : null),
    [diaries, hydrated],
  );
  const sorted = useMemo(
    () => [...diaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [diaries],
  );

  const addLink = () => {
    const normalized = normalizeUrl(linkInput);
    if (!normalized) {
      toast("http:// 또는 https:// 주소를 적어주세요");
      return;
    }
    setLinks((prev) => [
      ...prev,
      { id: newLocalId("link"), url: normalized, label: linkLabel.trim() },
    ]);
    setLinkInput("");
    setLinkLabel("");
  };

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (media.length >= MAX_MEDIA_PER_ENTRY) {
      toast(`첨부는 ${MAX_MEDIA_PER_ENTRY}개까지 가능해요`);
      return;
    }
    setUploading(true);
    const room = MAX_MEDIA_PER_ENTRY - media.length;
    const picked = Array.from(files).slice(0, room);
    const added: DiaryMediaMeta[] = [];
    for (const file of picked) {
      try {
        const { meta } = await prepareMediaFile(file);
        added.push(meta);
      } catch (error) {
        toast(error instanceof Error ? error.message : "파일을 붙이지 못했어요");
      }
    }
    if (added.length) {
      setMedia((prev) => [...prev, ...added]);
      toast(`${added.length}개 첨부했어요`);
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const startRecording = useCallback(async () => {
    if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      toast("이 브라우저는 녹음을 지원하지 않아요. 문자로 남겨 주세요.");
      return;
    }
    if (typeof window === "undefined" || typeof window.MediaRecorder === "undefined") {
      toast("이 브라우저는 녹음을 지원하지 않아요. 문자로 남겨 주세요.");
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const recorder = new MediaRecorder(stream);
      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = async () => {
        const seconds = recordSecondsRef.current;
        const blob = new Blob(chunksRef.current, { type: recorder.mimeType || "audio/webm" });
        streamRef.current?.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
        if (blob.size < 400 || seconds < 1) {
          toast("녹음이 너무 짧아 저장하지 않았어요");
          return;
        }
        try {
          const meta = await prepareAudioBlob(blob, seconds);
          setMedia((prev) => [...prev, meta]);
          setAudioTick((value) => value + 1);
          toast(`${seconds}초 음성 기록을 붙였어요`);
        } catch (error) {
          toast(error instanceof Error ? error.message : "녹음을 저장하지 못했어요");
        }
      };
      recorder.start();
      mediaRecorderRef.current = recorder;
      recordSecondsRef.current = 0;
      setRecordSeconds(0);
      setRecording(true);
      recordTimerRef.current = window.setInterval(() => {
        recordSecondsRef.current += 1;
        setRecordSeconds(recordSecondsRef.current);
        if (recordSecondsRef.current >= 180) stopRecording();
      }, 1000);
    } catch {
      toast("마이크 권한이 필요해요. 허용 후 다시 시도해 주세요.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]);


  const stopRecording = useCallback(() => {
    if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
    recordTimerRef.current = null;
    setRecording(false);
    try {
      mediaRecorderRef.current?.stop();
    } catch {
      /* already stopped */
    }
    mediaRecorderRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      if (recordTimerRef.current) window.clearInterval(recordTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          /* ignore */
        }
      }
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  const removeMedia = (meta: DiaryMediaMeta) => {
    setMedia((prev) => prev.filter((item) => item.id !== meta.id));
    void deleteMediaBlob(meta.id);
  };

  const resetDraft = () => {
    setMood(null);
    setText("");
    setIntensity(3);
    setMoment("after");
    setSession(null);
    setLinks([]);
    setMedia([]);
    setLinkInput("");
    setLinkLabel("");
  };

  const onSave = async () => {
    if (!mood) {
      toast("오늘의 감정을 하나 골라주세요");
      return;
    }
    if (saving) return;
    if (recording) stopRecording();
    setSaving(true);
    try {
      const entry = await saveDiary({
        moment,
        mood,
        intensity,
        energy,
        sessionLabel: session?.title,
        text,
      });
      const extras: DiaryExtras = { links, media };
      if (links.length || media.length) {
        const stored = saveDiaryExtras(entry.id, extras);
        if (!stored) {
          toast("기록은 저장됐지만 첨부 목록이 너무 커요. 일부만 남았어요.");
        }
        setExtrasMap(loadExtrasMap());
      }
      resetDraft();
      toast(
        mode === "supabase"
          ? "마음기록을 저장했어요. 내 계정에만 보관돼요."
          : "마음기록을 저장했어요. 이 기기에만 보관돼요.",
      );
      setAudioTick((value) => value + 1);
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
      removeDiaryExtras(id);
      await removeDiary(id);
      setExtrasMap(loadExtrasMap());
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
      for (const entry of diaries) removeDiaryExtras(entry.id);
      await Promise.all(diaries.map((entry) => removeDiary(entry.id)));
      setExtrasMap({});
      toast("이 기기의 마음기록을 모두 지웠어요");
    } catch {
      toast("일부 기록을 지우지 못했어요");
    }
  };

  return (
    <main className="page">
      <LifeDirectionBanner />
      <header className="view-head">
        <div>
          <p className="eyebrow">세션 뒤에 남는 것</p>
          <h1>마음기록</h1>
        </div>
        <span className="tag">{diaries.length}개</span>
      </header>

      <PracticeStatsCard compact />

      <MonthAgoCard diaries={diaries} todayMood={mood} todayEnergy={energy} />

      {session ? (
        <div className="session-done">
          <span className="session-done-badge">세션 완료</span>
          <b>{session.title}</b>
          <p>{session.detail}</p>
          <span className="tiny">지금의 마음을 문자·음성·링크·사진으로 남겨보세요.</span>
        </div>
      ) : null}

      <div className="today-head">
        <div>
          <p className="eyebrow">오늘의 기록</p>
          <b>{fmtDateLong(dateKey())}</b>
        </div>
        <span className="tiny">문자 · 음성 · 링크 · 사진</span>
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
          <span>오늘의 에너지</span>
          <span className="tiny">
            {energy}/5 · {ENERGY_LABELS[energy]}
          </span>
        </div>
        <div className="intensity" role="group" aria-label="오늘의 에너지">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`dot ${energy === value ? "on" : ""}`}
              onClick={() => setEnergy(value)}
              aria-pressed={energy === value}
              aria-label={`에너지 ${value}`}
            >
              {value}
            </button>
          ))}
          <span className="scale-note">지침 — 충만</span>
        </div>

        <div className="form-label" style={{ marginTop: 18 }}>
          <span>문자 기록</span>
          <span className="tiny">한 줄도 괜찮아요 · 최대 600자</span>
        </div>
        <textarea
          className="diary-textarea"
          maxLength={600}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="오늘 마음에 남은 것을 적어보세요. 아무도 평가하지 않아요."
          aria-label="마음기록 본문"
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
                  const area = document.querySelector<HTMLTextAreaElement>(".diary-textarea");
                  area?.focus();
                  area?.setSelectionRange(area.value.length, area.value.length);
                }, 0);
              }}
            >
              {prompt.label}
            </button>
          ))}
        </div>

        {/* 음성 기록 */}
        <div className="form-label" style={{ marginTop: 20 }}>
          <span>음성 기록</span>
          <span className="tiny">최대 3분 · 이 기기에만 저장</span>
        </div>
        <div className="voice-box">
          <button
            type="button"
            className={`voice-btn ${recording ? "rec" : ""}`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? "■ 녹음 중지" : "● 음성으로 남기기"}
          </button>
          <span className="voice-state">
            {recording
              ? `${recordSeconds}초 녹음 중…`
              : typeof window !== "undefined" && typeof window.MediaRecorder === "undefined"
                ? "이 브라우저는 녹음을 지원하지 않아요 (문자로 남겨주세요)"
                : "탭해서 말로 남겨보세요"}
          </span>
        </div>

        {/* 링크 */}
        <div className="form-label" style={{ marginTop: 20 }}>
          <span>링크 추가</span>
          <span className="tiny">{links.length}개</span>
        </div>
        <div className="link-form">
          <input
            value={linkInput}
            onChange={(event) => setLinkInput(event.target.value)}
            placeholder="https://..."
            inputMode="url"
            aria-label="링크 주소"
          />
          <input
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder="이름 (선택)"
            aria-label="링크 이름"
          />
          <button type="button" className="btn sage-wash" onClick={addLink}>
            추가
          </button>
        </div>
        {links.length > 0 ? (
          <ul className="link-list">
            {links.map((link) => (
              <li key={link.id}>
                <a href={link.url} target="_blank" rel="noreferrer noopener">
                  {link.label || link.url}
                </a>
                <button
                  type="button"
                  onClick={() => setLinks((prev) => prev.filter((item) => item.id !== link.id))}
                  aria-label="링크 삭제"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {/* 사진 · 영상 */}
        <div className="form-label" style={{ marginTop: 20 }}>
          <span>사진 · 영상</span>
          <span className="tiny">
            {media.filter((item) => item.kind !== "audio").length}/{MAX_MEDIA_PER_ENTRY} · 원본은
            기기 저장소에 보관
          </span>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="file-input"
          onChange={(event) => void onPickFiles(event.target.files)}
        />
        <button
          type="button"
          className="attach-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          {uploading ? "불러오는 중…" : "＋ 사진 · 영상 첨부"}
        </button>

        {media.length > 0 ? (
          <div className="media-grid" key={audioTick}>
            {media.map((item) => (
              <MediaPreview key={item.id} meta={item} onRemove={() => removeMedia(item)} />
            ))}
          </div>
        ) : null}

        <div className="form-foot">
          <span className="count">{text.length} / 600</span>
          <button className="btn" type="button" onClick={onSave} disabled={saving}>
            {saving ? "저장 중…" : "마음기록 저장"}
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
            const extras = extrasMap[entry.id] ?? EMPTY_EXTRAS;
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
                  <span className="badge after">
                    {entry.sessionLabel ?? "오늘의 기록"}
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

                {extras.links.length > 0 ? (
                  <ul className="entry-links">
                    {extras.links.map((link) => (
                      <li key={link.id}>
                        <a href={link.url} target="_blank" rel="noreferrer noopener">
                          🔗 {link.label || link.url}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {extras.media.length > 0 ? (
                  <div className="entry-media">
                    {extras.media.map((meta) => (
                      <SavedMedia key={meta.id} meta={meta} />
                    ))}
                  </div>
                ) : null}
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
              ? "내 마음기록 모두 지우기"
              : "이 기기의 기록 모두 지우기"}
        </button>
      )}

      <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
        기록은 언제든 직접 지울 수 있어요.
      </p>
    </main>
  );
}

/* ------------------------------ 미리보기 부품 ------------------------------ */

function MediaPreview({ meta, onRemove }: { meta: DiaryMediaMeta; onRemove: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    let created: string | null = null;
    if (meta.kind === "audio" || meta.kind === "video") {
      void mediaObjectUrl(meta).then((value) => {
        if (!active) return;
        if (!value) {
          setFailed(true);
          return;
        }
        created = value.startsWith("blob:") ? value : null;
        setUrl(value);
      });
    }
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [meta]);

  return (
    <div className={`media-item ${meta.kind}`}>
      {meta.kind === "audio" ? (
        url ? (
          <audio controls src={url} className="audio-player" />
        ) : (
          <span className="media-fallback">🎙 {failed ? "재생할 수 없어요" : "불러오는 중…"}</span>
        )
      ) : meta.thumb ? (
        <img src={meta.thumb} alt={meta.name} />
      ) : (
        <span className="media-fallback">🎞 {meta.name}</span>
      )}
      {meta.kind === "video" ? <span className="media-play">▶</span> : null}
      <button type="button" className="media-del" onClick={onRemove} aria-label="첨부 삭제">
        ✕
      </button>
      <span className="media-name">{meta.name}</span>
    </div>
  );
}

function SavedMedia({ meta }: { meta: DiaryMediaMeta }) {
  const [url, setUrl] = useState<string | null>(null);
  const [opening, setOpening] = useState(false);

  const open = async () => {
    if (meta.kind === "audio") return;
    setOpening(true);
    const value = await mediaObjectUrl(meta);
    setOpening(false);
    if (value) window.open(value, "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (meta.kind !== "audio") return;
    let active = true;
    let created: string | null = null;
    void mediaObjectUrl(meta).then((value) => {
      if (!active || !value) return;
      created = value.startsWith("blob:") ? value : null;
      setUrl(value);
    });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [meta]);

  if (meta.kind === "audio") {
    return (
      <div className="entry-audio">
        <span className="tiny">🎙 {meta.duration ? `${Math.round(meta.duration)}초` : "음성"}</span>
        {url ? <audio controls src={url} /> : <span className="tiny">불러오는 중…</span>}
      </div>
    );
  }

  return (
    <button type="button" className={`saved-media ${meta.kind}`} onClick={() => void open()}>
      {meta.thumb ? <img src={meta.thumb} alt={meta.name} /> : <span>🎞</span>}
      {meta.kind === "video" ? <span className="media-play">▶</span> : null}
      {opening ? <span className="media-opening">여는 중…</span> : null}
    </button>
  );
}
