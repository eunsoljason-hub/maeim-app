"use client";

import Link from "next/link";
import { createPortal } from "react-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { MonthAgoCard } from "@/components/diary/MonthAgoCard";
import { Sheet } from "@/components/ui/Sheet";
import { MOODS, moodById } from "@/lib/constants";
import { dateKey } from "@/lib/date";
import { loadTodayCheckIn } from "@/lib/checkin";
import { useI18n, formatDateKey, formatDateShort } from "@/lib/i18n/LangProvider";
import { moodLabel } from "@/lib/i18n/labels";
import { monthMoodStrip } from "@/lib/briefing";
import {
  EMPTY_EXTRAS,
  MAX_MEDIA_PER_ENTRY,
  loadExtrasMap,
  mediaObjectUrl,
  prepareAudioBlob,
  prepareMediaFile,
  removeDiaryExtras,
  saveDiaryExtras,
  deleteMediaBlob,
  type DiaryExtras,
  type DiaryMediaMeta,
} from "@/lib/media";
import type { DiaryEntry, DiaryMoment, MoodId } from "@/lib/types";

interface SessionContext {
  type: string;
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
      type: "diary.session.visualization",
      detail: `${label ?? ""}${minutes ? ` · ${minutes}min` : ""}`,
    };
  }
  if (from === "player" && session === "meditation") {
    return {
      type: "diary.session.meditation",
      detail: `${label ?? ""}${minutes ? ` · ${minutes}min` : ""}`,
    };
  }
  if (from === "timer") {
    return {
      type: "diary.session.timer",
      detail: label ?? (seconds ? `${Math.round(Number(seconds) / 60)}min` : ""),
    };
  }
  if (from === "affirmations") {
    return {
      type: "diary.session.affirmations",
      detail: `${session ?? ""}${count ? ` · ${count}` : ""}`,
    };
  }
  return null;
}

export function DiaryScreen() {
  const { diaries, saveDiary, updateDiary, removeDiary, mode, hydrated, toast } = useApp();
  const { t, lang } = useI18n();

  const [moment, setMoment] = useState<DiaryMoment>("after");
  const [mood, setMood] = useState<MoodId | null>(null);
  const [energy, setEnergy] = useState(3);
  const [text, setText] = useState("");
  const [saving, setSaving] = useState(false);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const incomingApplied = useRef(false);

  const [session, setSession] = useState<SessionContext | null>(null);
  const [media, setMedia] = useState<DiaryMediaMeta[]>([]);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [extrasMap, setExtrasMap] = useState<Record<string, DiaryExtras>>({});
  const [audioTick, setAudioTick] = useState(0);
  const [voiceSupported, setVoiceSupported] = useState(true);

  /* 지난 기록 고치기 */
  const [editEntry, setEditEntry] = useState<DiaryEntry | null>(null);
  const [editMood, setEditMood] = useState<MoodId | null>(null);
  const [editText, setEditText] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  /* 사진·영상 확대 보기 */
  const [preview, setPreview] = useState<DiaryMediaMeta | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const recordTimerRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const recordSecondsRef = useRef(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setVoiceSupported(
        typeof window.MediaRecorder !== "undefined" &&
          typeof navigator !== "undefined" &&
          Boolean(navigator.mediaDevices?.getUserMedia),
      );
    }
  }, []);

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

  const month = useMemo(() => (hydrated ? monthMoodStrip(diaries) : []), [diaries, hydrated]);
  const monthDays = month.filter((day) => day.mood).length;
  const sorted = useMemo(
    () => [...diaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [diaries],
  );

  const onPickFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (media.length >= MAX_MEDIA_PER_ENTRY) {
      toast(t("diary.mediaFull", { n: MAX_MEDIA_PER_ENTRY }));
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
        toast(error instanceof Error ? error.message : t("diary.media"));
      }
    }
    if (added.length) {
      setMedia((prev) => [...prev, ...added]);
      toast(t("diary.attached", { n: added.length }));
    }
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

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

  const startRecording = useCallback(async () => {
    if (!voiceSupported) {
      toast(t("diary.voiceUnsupported"));
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
          toast(t("diary.voiceTooShort"));
          return;
        }
        try {
          const meta = await prepareAudioBlob(blob, seconds);
          setMedia((prev) => [...prev, meta]);
          setAudioTick((value) => value + 1);
          toast(t("diary.voiceSaved", { n: seconds }));
        } catch (error) {
          toast(error instanceof Error ? error.message : t("diary.voiceUnsupported"));
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
      toast(t("diary.voiceDenied"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast, voiceSupported, t]);

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
    setSession(null);
    setMedia([]);
  };

  const onSave = async () => {
    if (!mood) {
      toast(t("diary.needMood"));
      return;
    }
    if (saving) return;
    if (recording) stopRecording();
    setSaving(true);
    try {
      const entry = await saveDiary({
        moment,
        mood,
        intensity: 3,
        energy,
        sessionLabel: session ? t(session.type) : undefined,
        text,
      });
      if (media.length) {
        const extras: DiaryExtras = { links: [], media };
        const stored = saveDiaryExtras(entry.id, extras);
        if (!stored) toast(t("diary.extrasFull"));
        setExtrasMap(loadExtrasMap());
      }
      resetDraft();
      toast(mode === "supabase" ? t("diary.savedAccount") : t("diary.savedLocal"));
      setAudioTick((value) => value + 1);
    } catch (error) {
      toast(error instanceof Error ? error.message : t("diary.saving"));
    } finally {
      setSaving(false);
    }
  };

  const openEdit = (entry: DiaryEntry) => {
    setEditEntry(entry);
    setEditMood(entry.mood);
    setEditText(entry.text ?? "");
  };

  const closeEdit = () => {
    setEditEntry(null);
    setEditMood(null);
    setEditText("");
  };

  const saveEdit = async () => {
    if (!editEntry) return;
    if (!editMood) {
      toast(t("diary.needMood"));
      return;
    }
    if (editSaving) return;
    setEditSaving(true);
    try {
      await updateDiary(editEntry.id, { mood: editMood, text: editText.trim() });
      toast(t("diary.editSaved"));
      closeEdit();
    } catch (error) {
      toast(error instanceof Error ? error.message : t("diary.saving"));
    } finally {
      setEditSaving(false);
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
      toast(t("diary.deleteDone"));
    } catch (error) {
      toast(error instanceof Error ? error.message : t("common.delete"));
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
      toast(t("diary.deleteAllDone"));
    } catch {
      toast(t("diary.deleteDone"));
    }
  };

  return (
    <main className="page">
      <header className="view-head">
        <div>
          <p className="eyebrow">{t("diary.title")}</p>
          <h1>{t("diary.today")}</h1>
        </div>
        <div className="view-head-right">
          <LangSwitch />
        </div>
      </header>

      {session ? (
        <div className="session-done">
          <span className="session-done-badge">{t("diary.sessionDone")}</span>
          <b>{t(session.type)}</b>
          <p>{session.detail}</p>
          <span className="tiny">{t("diary.todayHint")}</span>
        </div>
      ) : null}

      <div className="today-head">
        <p className="eyebrow">{formatDateKey(dateKey(), lang)}</p>
        <span className="tiny">{t("diary.todayHint")}</span>
      </div>

      <section className="card diary-form">
        <div className="form-label">
          <span>{t("diary.mood")}</span>
          <span className="tiny">{t("diary.moodHint")}</span>
        </div>
        <div className="mood-grid" role="group" aria-label={t("diary.mood")}>
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
              <span className="l">{moodLabel(item.id, t)}</span>
            </button>
          ))}
        </div>

        <div className="form-label" style={{ marginTop: 18 }}>
          <span>{t("diary.text")}</span>
          <span className="tiny">{t("diary.textHint")}</span>
        </div>
        <textarea
          className="diary-textarea"
          maxLength={600}
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder={t("diary.textPh")}
          aria-label={t("diary.text")}
        />
        <div className="prompt-chips">
          {[1, 2, 3].map((n) => {
            const label = t(`diary.prompt${n}`);
            return (
              <button
                key={n}
                type="button"
                className="pchip"
                onClick={() => {
                  const fill = `${label}: `;
                  setText((prev) => (prev ? `${prev.replace(/\s*$/, "")}\n${fill}` : fill));
                  window.setTimeout(() => {
                    const area = document.querySelector<HTMLTextAreaElement>(".diary-textarea");
                    area?.focus();
                    area?.setSelectionRange(area.value.length, area.value.length);
                  }, 0);
                }}
              >
                {label}
              </button>
            );
          })}
        </div>

        <div className="form-label" style={{ marginTop: 20 }}>
          <span>{t("diary.voice")}</span>
          <span className="tiny">{t("diary.voiceHint")}</span>
        </div>
        <div className="voice-box">
          <button
            type="button"
            className={`voice-btn ${recording ? "rec" : ""}`}
            onClick={recording ? stopRecording : startRecording}
          >
            {recording ? t("diary.voiceStop") : t("diary.voiceStart")}
          </button>
          <span className="voice-state">
            {recording
              ? t("diary.voiceRecording", { n: recordSeconds })
              : voiceSupported
                ? t("diary.voiceHint2")
                : t("diary.voiceUnsupported")}
          </span>
        </div>

        <div className="form-label" style={{ marginTop: 20 }}>
          <span>{t("diary.media")}</span>
          <span className="tiny">
            {t("diary.mediaHint", {
              n: media.filter((item) => item.kind !== "audio").length,
              max: MAX_MEDIA_PER_ENTRY,
            })}
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
          {uploading ? t("diary.attaching") : t("diary.attach")}
        </button>

        {media.length > 0 ? (
          <div className="media-grid" key={audioTick}>
            {media.map((item) => (
              <MediaPreview
                key={item.id}
                meta={item}
                onRemove={() => removeMedia(item)}
                onOpen={() => setPreview(item)}
              />
            ))}
          </div>
        ) : null}

        <div className="form-foot">
          <span className="count">{text.length} / 600</span>
          <button className="btn" type="button" onClick={onSave} disabled={saving}>
            {saving ? t("diary.saving") : t("diary.save")}
          </button>
        </div>
      </section>

      <div className="section-head">
        <h2>{t("diary.week")}</h2>
        <span className="tiny">
          {mode === "supabase" ? t("diary.weekAccount") : t("diary.weekLocal")}
        </span>
      </div>

      <div className="card month30" aria-label={t("diary.week")}>
        {month.length > 0 ? (
          <>
            <div className="month30-grid">
              {month.map((day) => {
                const item = day.mood ? moodById(day.mood) : null;
                return (
                  <div
                    key={day.key}
                    className={`m30 ${item ? "has" : ""} ${day.isToday ? "today" : ""}`}
                    title={`${day.day}${item ? ` · ${moodLabel(item.id, t)}` : ""}`}
                  >
                    {item ? <span aria-hidden="true">{item.emoji}</span> : <span className="none" />}
                  </div>
                );
              })}
            </div>
            <p className="month30-foot">{t("diary.month30Count", { days: monthDays })}</p>
          </>
        ) : (
          <p className="month30-foot">{t("diary.briefingEmpty")}</p>
        )}
      </div>

      <MonthAgoCard diaries={diaries} />

      <div className="section-head">
        <h2>{t("diary.entries")}</h2>
        <span className="tiny">{hydrated ? t("diary.count", { n: sorted.length }) : ""}</span>
      </div>

      <div className="diary-list">
        {sorted.length === 0 ? (
          <div className="empty">
            <span className="e">📝</span>
            {t("diary.entriesEmpty")}
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
                  className="entry-edit"
                  onClick={() => openEdit(entry)}
                  aria-label={t("diary.editTitle")}
                >
                  ✎
                </button>
                <button
                  type="button"
                  className={`del ${confirmId === entry.id ? "confirm" : ""}`}
                  onClick={() => onDelete(entry.id)}
                  aria-label={t("common.delete")}
                >
                  {confirmId === entry.id ? t("diary.deleteConfirm") : "✕"}
                </button>
                <button type="button" className="entry-open" onClick={() => openEdit(entry)}>
                  <div className="entry-top">
                    <span className="badge after">{entry.sessionLabel ?? t("diary.today")}</span>
                    <span className="when">
                      {formatDateShort(entry.date, lang)} {hhmm}
                    </span>
                    {entry.editedAt ? (
                      <span className="edited">{t("diary.edited")}</span>
                    ) : null}
                  </div>
                  <div className="moodline">
                    <span className="e" aria-hidden="true">
                      {item.emoji}
                    </span>
                    {moodLabel(item.id, t)}
                  </div>
                  {entry.text ? <p className="body">{entry.text}</p> : null}
                </button>

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
                      <SavedMedia key={meta.id} meta={meta} onOpen={() => setPreview(meta)} />
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
          {confirmClear ? t("diary.deleteAllConfirm") : t("diary.deleteAll")}
        </button>
      )}

      <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
        {t("diary.foot")}
      </p>
      <p className="tiny" style={{ textAlign: "center" }}>
        <Link href="/affirmations" className="link">
          {t("tab.affirmations")}
        </Link>
        {" · "}
        <Link href="/growth" className="link">
          {t("tab.growth")}
        </Link>
      </p>

      {/* 지난 기록 고치기 */}
      <Sheet open={Boolean(editEntry)} onClose={closeEdit} labelledBy="entry-edit-title">
        <h3 id="entry-edit-title">{t("diary.editTitle")}</h3>
        <p className="lead">
          {editEntry
            ? `${formatDateShort(editEntry.date, lang)} · ${t("diary.editHint")}`
            : t("diary.editHint")}
        </p>
        <div className="mood-grid" role="group" aria-label={t("diary.mood")}>
          {MOODS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`mood ${editMood === item.id ? "on" : ""}`}
              onClick={() => setEditMood(item.id)}
              aria-pressed={editMood === item.id}
            >
              <span className="e" aria-hidden="true">
                {item.emoji}
              </span>
              <span className="l">{moodLabel(item.id, t)}</span>
            </button>
          ))}
        </div>
        <textarea
          className="diary-textarea"
          maxLength={600}
          value={editText}
          onChange={(event) => setEditText(event.target.value)}
          placeholder={t("diary.textPh")}
          aria-label={t("diary.text")}
          style={{ marginTop: 12 }}
        />
        <p className="fine">{t("diary.editKeepMedia")}</p>
        <button
          type="button"
          className="btn block"
          onClick={() => void saveEdit()}
          disabled={editSaving}
        >
          {editSaving ? t("diary.saving") : t("common.save")}
        </button>
        <button type="button" className="btn block sage-wash" onClick={closeEdit}>
          {t("common.cancel")}
        </button>
      </Sheet>

      <MediaLightbox meta={preview} onClose={() => setPreview(null)} />
    </main>
  );
}

/* ------------------------------ 미리보기 부품 ------------------------------ */

function MediaPreview({
  meta,
  onRemove,
  onOpen,
}: {
  meta: DiaryMediaMeta;
  onRemove: () => void;
  onOpen: () => void;
}) {
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
          <span className="media-fallback">🎙 {failed ? "—" : "…"}</span>
        )
      ) : meta.thumb ? (
        <button type="button" className="media-thumb" onClick={onOpen} aria-label={meta.name}>
          <img src={meta.thumb} alt={meta.name} />
        </button>
      ) : (
        <span className="media-fallback">🎞 {meta.name}</span>
      )}
      {meta.kind === "video" ? <span className="media-play">▶</span> : null}
      <button type="button" className="media-del" onClick={onRemove} aria-label="delete">
        ✕
      </button>
      <span className="media-name">{meta.name}</span>
    </div>
  );
}

function SavedMedia({ meta, onOpen }: { meta: DiaryMediaMeta; onOpen: () => void }) {
  const [url, setUrl] = useState<string | null>(null);

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
        <span className="tiny">🎙 {meta.duration ? `${Math.round(meta.duration)}s` : ""}</span>
        {url ? <audio controls src={url} /> : <span className="tiny">…</span>}
      </div>
    );
  }

  return (
    <button type="button" className={`saved-media ${meta.kind}`} onClick={onOpen}>
      {meta.thumb ? <img src={meta.thumb} alt={meta.name} /> : <span>🎞</span>}
      {meta.kind === "video" ? <span className="media-play">▶</span> : null}
    </button>
  );
}

/**
 * 사진·영상 확대 보기.
 * 저장된 원본(IndexedDB Blob 또는 data URL)을 이 화면 안에서 바로 띄운다.
 * 새 창(window.open)은 모바일에서 차단되거나 빈 화면이 되기 때문에 쓰지 않는다.
 */
function MediaLightbox({ meta, onClose }: { meta: DiaryMediaMeta | null; onClose: () => void }) {
  const { t } = useI18n();
  const [url, setUrl] = useState<string | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "failed">("loading");

  useEffect(() => {
    if (!meta) {
      setUrl(null);
      setState("loading");
      return;
    }
    let active = true;
    let created: string | null = null;
    setUrl(null);
    setState("loading");
    void mediaObjectUrl(meta).then((value) => {
      if (!active) return;
      if (!value) {
        if (meta.thumb) {
          setUrl(meta.thumb);
          setState("ready");
        } else {
          setState("failed");
        }
        return;
      }
      created = value.startsWith("blob:") ? value : null;
      setUrl(value);
      setState("ready");
    });
    return () => {
      active = false;
      if (created) URL.revokeObjectURL(created);
    };
  }, [meta]);

  useEffect(() => {
    if (!meta) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [meta, onClose]);

  if (!meta || typeof document === "undefined") return null;

  /* 화면 스크롤 컨테이너의 변형(애니메이션)에 fixed가 갇히지 않도록 body로 포털한다. */
  return createPortal(
    <div className="media-lightbox" role="dialog" aria-modal="true" aria-label={meta.name}>
      <button type="button" className="lightbox-backdrop" onClick={onClose} aria-label={t("common.close")} />
      <div className="lightbox-body">
        <button type="button" className="lightbox-x" onClick={onClose} aria-label={t("common.close")}>
          ✕
        </button>
        {state === "ready" && url ? (
          meta.kind === "video" ? (
            <video src={url} controls autoPlay playsInline className="lightbox-media" />
          ) : (
            <img src={url} alt={meta.name} className="lightbox-media" />
          )
        ) : state === "failed" ? (
          <p className="lightbox-fallback">{meta.name}</p>
        ) : (
          <p className="lightbox-fallback">…</p>
        )}
      </div>
    </div>,
    document.body,
  );
}
