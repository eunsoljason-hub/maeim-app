"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { PracticeStatsCard } from "@/components/practice/PracticeStatsCard";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { MonthAgoCard } from "@/components/diary/MonthAgoCard";
import { MOODS, moodById } from "@/lib/constants";
import { dateKey } from "@/lib/date";
import { ENERGY_LABELS, loadTodayCheckIn } from "@/lib/checkin";
import { useI18n, formatDateKey, formatDateShort, weekdayNarrow } from "@/lib/i18n/LangProvider";
import { moodLabel } from "@/lib/i18n/labels";
import { weekMoodStrip } from "@/lib/briefing";
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
  const { diaries, saveDiary, removeDiary, mode, hydrated, toast } = useApp();
  const { t, lang } = useI18n();

  const [moment, setMoment] = useState<DiaryMoment>("after");
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
  const [voiceSupported, setVoiceSupported] = useState(true);

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

  const week = useMemo(() => (hydrated ? weekMoodStrip(diaries) : []), [diaries, hydrated]);
  const sorted = useMemo(
    () => [...diaries].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [diaries],
  );

  const addLink = () => {
    const normalized = normalizeUrl(linkInput);
    if (!normalized) {
      toast(t("diary.linkInvalid"));
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
  }, [toast, voiceSupported]);

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
        intensity,
        energy,
        sessionLabel: session ? t(session.type) : undefined,
        text,
      });
      const extras: DiaryExtras = { links, media };
      if (links.length || media.length) {
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
      <LifeDirectionBanner />
      <header className="view-head">
        <div>
          <p className="eyebrow">{t("diary.eyebrow")}</p>
          <h1>{t("diary.title")}</h1>
        </div>
        <div className="view-head-right">
          <LangSwitch />
          <span className="tag">{t("diary.count", { n: diaries.length })}</span>
        </div>
      </header>

      <PracticeStatsCard compact />

      <MonthAgoCard diaries={diaries} todayMood={mood} todayEnergy={energy} />

      {session ? (
        <div className="session-done">
          <span className="session-done-badge">{t("diary.sessionDone")}</span>
          <b>{t(session.type)}</b>
          <p>{session.detail}</p>
          <span className="tiny">{t("diary.todayHint")}</span>
        </div>
      ) : null}

      <div className="today-head">
        <div>
          <p className="eyebrow">{t("diary.today")}</p>
          <b>{formatDateKey(dateKey(), lang)}</b>
        </div>
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
          <span>{t("diary.intensity")}</span>
          <span className="tiny">{intensity}/5</span>
        </div>
        <div className="intensity" role="group" aria-label={t("diary.intensity")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`dot ${intensity === value ? "on" : ""}`}
              onClick={() => setIntensity(value)}
              aria-pressed={intensity === value}
              aria-label={`${t("diary.intensity")} ${value}`}
            >
              {value}
            </button>
          ))}
          <span className="scale-note">{t("diary.intensityScale")}</span>
        </div>

        <div className="form-label" style={{ marginTop: 18 }}>
          <span>{t("diary.energy")}</span>
          <span className="tiny">
            {energy}/5 · {t(`energy.${energy}`)}
          </span>
        </div>
        <div className="intensity" role="group" aria-label={t("diary.energy")}>
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              type="button"
              className={`dot ${energy === value ? "on" : ""}`}
              onClick={() => setEnergy(value)}
              aria-pressed={energy === value}
              aria-label={`${t("diary.energy")} ${value}`}
            >
              {value}
            </button>
          ))}
          <span className="scale-note">{t("diary.energyScale")}</span>
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
          <span>{t("diary.links")}</span>
          <span className="tiny">{links.length}</span>
        </div>
        <div className="link-form">
          <input
            value={linkInput}
            onChange={(event) => setLinkInput(event.target.value)}
            placeholder={t("diary.linkPh")}
            inputMode="url"
            aria-label={t("diary.links")}
          />
          <input
            value={linkLabel}
            onChange={(event) => setLinkLabel(event.target.value)}
            placeholder={t("diary.linkLabelPh")}
            aria-label={t("diary.linkLabelPh")}
          />
          <button type="button" className="btn sage-wash" onClick={addLink}>
            {t("diary.linkAdd")}
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
                  aria-label={t("common.delete")}
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
        ) : null}

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
              <MediaPreview key={item.id} meta={item} onRemove={() => removeMedia(item)} />
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

      {week.length > 0 && (
        <div className="card week" style={{ marginBottom: 10 }} aria-label={t("diary.week")}>
          <div className="week-row">
            {week.map((day) => {
              const item = day.mood ? moodById(day.mood) : null;
              return (
                <div
                  key={day.key}
                  className={`day ${item ? "has" : ""} ${day.isToday ? "today" : ""}`}
                >
                  <div className="d">{weekdayNarrow(day.key, lang)}</div>
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

      <div className="empty" style={{ marginTop: 4 }}>
        <span className="e">🌱</span>
        {week.some((day) => day.mood) ? t("diary.foot") : t("diary.briefingEmpty")}
      </div>

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
                  className={`del ${confirmId === entry.id ? "confirm" : ""}`}
                  onClick={() => onDelete(entry.id)}
                  aria-label={t("common.delete")}
                >
                  {confirmId === entry.id ? t("diary.deleteConfirm") : "✕"}
                </button>
                <div className="entry-top">
                  <span className="badge after">{entry.sessionLabel ?? t("diary.today")}</span>
                  <span className="when">
                    {formatDateShort(entry.date, lang)} {hhmm}
                  </span>
                </div>
                <div className="moodline">
                  <span className="e" aria-hidden="true">
                    {item.emoji}
                  </span>
                  {moodLabel(item.id, t)}
                  <span className="tiny" style={{ fontWeight: 500, marginLeft: 4 }}>
                    {t("month.intensity", { n: entry.intensity })}
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
          <span className="media-fallback">🎙 {failed ? "—" : "…"}</span>
        )
      ) : meta.thumb ? (
        <img src={meta.thumb} alt={meta.name} />
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
        <span className="tiny">🎙 {meta.duration ? `${Math.round(meta.duration)}s` : ""}</span>
        {url ? <audio controls src={url} /> : <span className="tiny">…</span>}
      </div>
    );
  }

  return (
    <button type="button" className={`saved-media ${meta.kind}`} onClick={() => void open()}>
      {meta.thumb ? <img src={meta.thumb} alt={meta.name} /> : <span>🎞</span>}
      {meta.kind === "video" ? <span className="media-play">▶</span> : null}
      {opening ? <span className="media-opening">…</span> : null}
    </button>
  );
}
