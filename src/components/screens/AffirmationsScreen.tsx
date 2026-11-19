"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import {
  loadSessions,
  makeAffirmation,
  makeSession,
  resetSessions,
  saveSessions,
  totalSentences,
} from "@/lib/affirmations";
import {
  DEFAULT_SESSIONS,
  affirmationTextFor,
  sessionDescriptionFor,
  sessionTitleFor,
  type Affirmation,
  type AffirmationSession,
} from "@/lib/data/affirmations";
import { useI18n } from "@/lib/i18n/LangProvider";

type ScriptMode = "both" | "ko" | "en" | "ja";

const AUTO_MS = 9000;

export function AffirmationsScreen() {
  const router = useRouter();
  const { toast, recordPlay } = useApp();
  const { t, lang } = useI18n();

  const [sessions, setSessions] = useState<AffirmationSession[]>([]);
  const [ready, setReady] = useState(false);
  const [activeId, setActiveId] = useState<string>(DEFAULT_SESSIONS[0].id);
  const [index, setIndex] = useState(0);
  const [script, setScript] = useState<ScriptMode>("both");
  const [auto, setAuto] = useState(false);
  const [view, setView] = useState<"card" | "list">("card");
  const [itemEditor, setItemEditor] = useState<
    | { mode: "add" } | { mode: "edit"; item: Affirmation; index: number } | null
  >(null);
  const [editorKo, setEditorKo] = useState("");
  const [editorEn, setEditorEn] = useState("");
  const [editorJa, setEditorJa] = useState("");
  const [sessionEditor, setSessionEditor] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("✶");
  const [newDesc, setNewDesc] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmItemDelete, setConfirmItemDelete] = useState<string | null>(null);
  const touchX = useRef<number | null>(null);
  const openedAtRef = useRef<number>(Date.now());

  useEffect(() => {
    setSessions(loadSessions());
    setReady(true);
  }, []);

  const persist = (next: AffirmationSession[]) => {
    setSessions(next);
    if (!saveSessions(next)) {
      toast(t("aff.session.storageFull"));
    }
  };

  const session = useMemo(
    () => sessions.find((item) => item.id === activeId) ?? sessions[0] ?? null,
    [sessions, activeId],
  );
  const items = session?.items ?? [];
  const current = items[Math.min(index, Math.max(0, items.length - 1))] ?? null;
  const total = totalSentences(sessions);

  useEffect(() => {
    setIndex(0);
    setAuto(false);
  }, [activeId]);

  useEffect(() => {
    if (index < items.length) return;
    setIndex(Math.max(0, items.length - 1));
  }, [items.length, index]);

  const go = (delta: number) => {
    if (!items.length) return;
    setIndex((prev) => Math.min(items.length - 1, Math.max(0, prev + delta)));
  };

  useEffect(() => {
    if (!auto || !items.length || view !== "card") return;
    const timer = window.setInterval(() => {
      setIndex((prev) => {
        if (prev >= items.length - 1) {
          setAuto(false);
          return prev;
        }
        return prev + 1;
      });
    }, AUTO_MS);
    return () => window.clearInterval(timer);
  }, [auto, items.length, view]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (itemEditor || sessionEditor) return;
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.length, itemEditor, sessionEditor]);

  const openAdd = () => {
    setEditorKo("");
    setEditorEn("");
    setEditorJa("");
    setItemEditor({ mode: "add" });
  };

  const openEdit = (item: Affirmation, itemIndex: number) => {
    setEditorKo(item.ko);
    setEditorEn(item.en);
    setEditorJa(item.ja ?? "");
    setItemEditor({ mode: "edit", item, index: itemIndex });
  };

  const submitItem = () => {
    if (!session || !itemEditor) return;
    const ko = editorKo.trim();
    const en = editorEn.trim();
    const ja = editorJa.trim();
    if (!ko && !en && !ja) {
      toast(t("aff.editor.needOne"));
      return;
    }
    let nextItems: Affirmation[];
    if (itemEditor.mode === "add") {
      nextItems = [...items, makeAffirmation(ko || en || ja, en || ko || ja, ja || en || ko)];
    } else {
      nextItems = items.map((item) =>
        item.id === itemEditor.item.id
          ? {
              ...item,
              ko: ko || item.ko,
              en: en || item.en,
              ja: ja || item.ja,
            }
          : item,
      );
    }
    persist(
      sessions.map((entry) =>
        entry.id === session.id ? { ...entry, items: nextItems } : entry,
      ),
    );
    setItemEditor(null);
    toast(itemEditor.mode === "add" ? t("aff.toast.added") : t("aff.toast.edited"));
  };

  const deleteItem = (item: Affirmation) => {
    if (!session) return;
    if (confirmItemDelete !== item.id) {
      setConfirmItemDelete(item.id);
      return;
    }
    persist(
      sessions.map((entry) =>
        entry.id === session.id
          ? { ...entry, items: entry.items.filter((one) => one.id !== item.id) }
          : entry,
      ),
    );
    setConfirmItemDelete(null);
    toast(t("aff.toast.deleted"));
  };

  const createSession = () => {
    if (!newTitle.trim()) {
      toast(t("aff.session.needTitle"));
      return;
    }
    const made = makeSession(newTitle, newEmoji, newDesc);
    persist([...sessions, made]);
    setActiveId(made.id);
    setSessionEditor(false);
    setNewTitle("");
    setNewEmoji("✶");
    setNewDesc("");
    toast(t("aff.session.created"));
  };

  const renameSession = () => {
    if (!session || session.builtin) return;
    const value = window.prompt(t("aff.session.name"), sessionTitleFor(session, lang));
    if (value === null) return;
    const title = value.trim().slice(0, 40);
    if (!title) return;
    persist(
      sessions.map((entry) =>
        entry.id === session.id ? { ...entry, title } : entry,
      ),
    );
  };

  const deleteSession = () => {
    if (!session || session.builtin) return;
    if (confirmDelete !== session.id) {
      setConfirmDelete(session.id);
      return;
    }
    const next = sessions.filter((entry) => entry.id !== session.id);
    const fallback = next.find((entry) => entry.builtin) ?? next[0];
    persist(next);
    setConfirmDelete(null);
    if (fallback) setActiveId(fallback.id);
    toast(t("aff.session.deleted"));
  };

  const finish = () => {
    const minutes = Math.max(1, Math.round((Date.now() - openedAtRef.current) / 60000));
    void recordPlay(`affirmations:${session?.id ?? "positive"}`, minutes);
    const params = new URLSearchParams({
      moment: "after",
      from: "affirmations",
      session: session ? sessionTitleFor(session, lang) : t("aff.title"),
      count: String(items.length),
    });
    router.push(`/diary?${params.toString()}`);
  };

  if (!ready || !session) {
    return (
      <main className="page">
        <div className="hub-skeleton" aria-hidden="true" />
      </main>
    );
  }

  const scriptLabel: Record<ScriptMode, string> = {
    both: t("aff.both"),
    ko: t("aff.koOnly"),
    en: t("aff.enOnly"),
    ja: t("aff.jaOnly"),
  };

  const cardText = (item: Affirmation) => {
    if (script === "ko") return { ko: item.ko, en: "", ja: "" };
    if (script === "en") return { ko: "", en: item.en, ja: "" };
    if (script === "ja") return { ko: "", en: "", ja: item.ja };
    return { ko: item.ko, en: item.en, ja: item.ja };
  };

  return (
    <main className="page aff-page">
      <header className="view-head">
        <div>
          <p className="eyebrow">{t("aff.eyebrow")}</p>
          <h1>{t("aff.title")}</h1>
        </div>
        <div className="view-head-right">
          <LangSwitch />
          <span className="tag">{t("aff.count", { n: total })}</span>
        </div>
      </header>
      <p className="view-lead">{t("aff.lead")}</p>

      <div className="aff-sessions" role="tablist" aria-label={t("aff.title")}>
        {sessions.map((entry) => (
          <button
            key={entry.id}
            type="button"
            role="tab"
            aria-selected={entry.id === session.id}
            className={`aff-chip ${entry.id === session.id ? "on" : ""}`}
            onClick={() => setActiveId(entry.id)}
          >
            <span className="e" aria-hidden="true">
              {entry.emoji}
            </span>
            <span className="t">
              {sessionTitleFor(entry, lang)}
              <em>{entry.items.length}</em>
            </span>
          </button>
        ))}
        <button type="button" className="aff-chip add" onClick={() => setSessionEditor(true)}>
          <span className="e" aria-hidden="true">
            ＋
          </span>
          <span className="t">{t("aff.newSession")}</span>
        </button>
      </div>

      <div className="aff-desc">
        <b>
          {session.emoji} {sessionTitleFor(session, lang)}
        </b>
        <span>{sessionDescriptionFor(session, lang) || t("aff.mySession")}</span>
        {!session.builtin ? (
          <span className="aff-owner-actions">
            <button type="button" onClick={renameSession}>
              {t("aff.rename")}
            </button>
            <button
              type="button"
              className={confirmDelete === session.id ? "danger" : ""}
              onClick={deleteSession}
            >
              {confirmDelete === session.id ? t("aff.confirmDelete") : t("aff.deleteSession")}
            </button>
          </span>
        ) : null}
      </div>

      <div className="aff-toolbar">
        <div className="seg inline" role="group" aria-label={t("aff.card")}>
          <button
            type="button"
            className={view === "card" ? "on" : ""}
            onClick={() => setView("card")}
          >
            {t("aff.card")}
          </button>
          <button
            type="button"
            className={view === "list" ? "on" : ""}
            onClick={() => setView("list")}
          >
            {t("aff.list")}
          </button>
        </div>
        <button
          type="button"
          className="aff-tool"
          onClick={() =>
            setScript((prev) =>
              prev === "both" ? "ko" : prev === "ko" ? "en" : prev === "en" ? "ja" : "both",
            )
          }
        >
          {scriptLabel[script]}
        </button>
        {view === "card" ? (
          <button type="button" className="aff-tool" onClick={() => setAuto((prev) => !prev)}>
            {auto ? t("aff.autoOn") : t("aff.auto")}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <span className="e">{session.emoji}</span>
          {t("aff.empty")}
          <br />
          {t("aff.emptyHint")}
          <button type="button" className="btn sage-wash" onClick={openAdd} style={{ marginTop: 12 }}>
            ＋ {t("aff.addSentence")}
          </button>
        </div>
      ) : view === "card" ? (
        <>
          <section
            className="aff-card"
            onTouchStart={(event) => {
              touchX.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchX.current === null) return;
              const delta =
                (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
              touchX.current = null;
              if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
            }}
            aria-live="polite"
          >
            <div className="aff-card-top">
              <span className="aff-count">
                {index + 1} <i>/ {items.length}</i>
              </span>
              <span className="aff-session-name">{sessionTitleFor(session, lang)}</span>
            </div>
            <div className="aff-text">
              {current ? (
                <>
                  {cardText(current).ko ? <p className="ko">{cardText(current).ko}</p> : null}
                  {cardText(current).en ? <p className="en">{cardText(current).en}</p> : null}
                  {cardText(current).ja ? <p className="en ja">{cardText(current).ja}</p> : null}
                </>
              ) : null}
            </div>
            <div className="aff-progress" aria-hidden="true">
              <span style={{ width: `${((index + 1) / items.length) * 100}%` }} />
            </div>
            <div className="aff-nav">
              <button
                type="button"
                className="aff-arrow"
                onClick={() => go(-1)}
                aria-label={t("aff.prev")}
              >
                ‹
              </button>
              <button
                type="button"
                className="aff-edit"
                onClick={() => current && openEdit(current, index)}
              >
                {t("aff.editCard")}
              </button>
              <button
                type="button"
                className="aff-arrow"
                onClick={() => go(1)}
                aria-label={t("aff.next")}
              >
                ›
              </button>
            </div>
          </section>

          <div className="aff-card-actions">
            <button type="button" className="btn sage-wash" onClick={openAdd}>
              ＋ {t("aff.addSentence")}
            </button>
            <button type="button" className="btn" onClick={finish}>
              {t("aff.finish")}
            </button>
          </div>
        </>
      ) : (
        <section className="aff-list" aria-label={t("aff.list")}>
          {items.map((item, itemIndex) => (
            <article key={item.id} className="aff-row">
              <span className="aff-row-num">{itemIndex + 1}</span>
              <div className="aff-row-text">
                <p className="ko">{item.ko}</p>
                <p className="en">{item.en}</p>
                {item.ja ? <p className="en ja">{item.ja}</p> : null}
              </div>
              <div className="aff-row-actions">
                <button type="button" onClick={() => openEdit(item, itemIndex)} aria-label={t("common.edit")}>
                  ✎
                </button>
                <button
                  type="button"
                  className={confirmItemDelete === item.id ? "danger" : ""}
                  onClick={() => deleteItem(item)}
                  aria-label={t("common.delete")}
                >
                  {confirmItemDelete === item.id ? t("aff.confirmDelete") : "✕"}
                </button>
              </div>
            </article>
          ))}
          <div className="aff-card-actions">
            <button type="button" className="btn sage-wash" onClick={openAdd}>
              ＋ {t("aff.addSentence")}
            </button>
            <button type="button" className="btn" onClick={finish}>
              {t("aff.finish")}
            </button>
          </div>
        </section>
      )}

      <p className="tiny" style={{ textAlign: "center", marginTop: 14 }}>
        {t("aff.foot")}{" "}
        <button
          type="button"
          className="linklike"
          onClick={() => {
            if (!window.confirm(t("aff.resetConfirm"))) return;
            const fresh = resetSessions();
            setSessions(fresh);
            setActiveId(fresh[0].id);
            toast(t("aff.resetDone"));
          }}
        >
          {t("aff.reset")}
        </button>
      </p>

      <Sheet open={Boolean(itemEditor)} onClose={() => setItemEditor(null)} labelledBy="aff-editor-title">
        <h3 id="aff-editor-title">
          {itemEditor?.mode === "add" ? t("aff.editor.add") : t("aff.editor.edit")}
        </h3>
        <p className="lead">{t("aff.editor.lead")}</p>
        <label className="field">
          <span>{t("aff.editor.ko")}</span>
          <textarea
            value={editorKo}
            onChange={(event) => setEditorKo(event.target.value)}
            rows={2}
            maxLength={120}
            placeholder="나는 지금 이대로도 충분합니다."
          />
        </label>
        <label className="field">
          <span>{t("aff.editor.en")}</span>
          <textarea
            value={editorEn}
            onChange={(event) => setEditorEn(event.target.value)}
            rows={2}
            maxLength={160}
            placeholder="I am enough, exactly as I am."
          />
        </label>
        <label className="field">
          <span>{t("aff.editor.ja")}</span>
          <textarea
            value={editorJa}
            onChange={(event) => setEditorJa(event.target.value)}
            rows={2}
            maxLength={160}
            placeholder="私は今のままで十分です。"
          />
        </label>
        <button type="button" className="btn block" onClick={submitItem}>
          {itemEditor?.mode === "add" ? t("aff.editor.create") : t("aff.editor.save")}
        </button>
      </Sheet>

      <Sheet open={sessionEditor} onClose={() => setSessionEditor(false)} labelledBy="aff-session-title">
        <h3 id="aff-session-title">{t("aff.session.title")}</h3>
        <p className="lead">{t("aff.session.lead")}</p>
        <label className="field">
          <span>{t("aff.session.name")}</span>
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            maxLength={40}
            placeholder={t("aff.session.namePh")}
          />
        </label>
        <label className="field">
          <span>{t("aff.session.emoji")}</span>
          <input
            value={newEmoji}
            onChange={(event) => setNewEmoji(event.target.value.slice(0, 2))}
            maxLength={2}
            placeholder="✶"
          />
        </label>
        <label className="field">
          <span>{t("aff.session.desc")}</span>
          <input
            value={newDesc}
            onChange={(event) => setNewDesc(event.target.value)}
            maxLength={80}
            placeholder={t("aff.session.descPh")}
          />
        </label>
        <button type="button" className="btn block" onClick={createSession}>
          {t("aff.session.create")}
        </button>
      </Sheet>

      <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
        {t("aff.baseNote")}
        <br />
        <Link href="/diary" className="link">
          {t("aff.openDiary")}
        </Link>
      </p>
    </main>
  );
}
