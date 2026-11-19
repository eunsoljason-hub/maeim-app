"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { useApp } from "@/components/providers/AppProvider";
import { Sheet } from "@/components/ui/Sheet";
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
  type Affirmation,
  type AffirmationSession,
} from "@/lib/data/affirmations";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";

type ScriptMode = "both" | "ko" | "en";

const SCRIPT_LABEL: Record<ScriptMode, string> = {
  both: "한·영 함께",
  ko: "한국어만",
  en: "English only",
};

const AUTO_MS = 9000;

export function AffirmationsScreen() {
  const router = useRouter();
  const { toast, recordPlay } = useApp();

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
  const [sessionEditor, setSessionEditor] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newEmoji, setNewEmoji] = useState("✶");
  const [newDesc, setNewDesc] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [confirmItemDelete, setConfirmItemDelete] = useState<string | null>(null);
  const touchX = useRef<number | null>(null);
  const openedAtRef = useRef<number>(Date.now());
  const readRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setSessions(loadSessions());
    setReady(true);
  }, []);

  const persist = (next: AffirmationSession[]) => {
    setSessions(next);
    if (!saveSessions(next)) {
      toast("저장 공간이 부족해요. 사진·영상 첨부를 줄인 뒤 다시 시도해 주세요.");
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
    setItemEditor({ mode: "add" });
  };

  const openEdit = (item: Affirmation, itemIndex: number) => {
    setEditorKo(item.ko);
    setEditorEn(item.en);
    setItemEditor({ mode: "edit", item, index: itemIndex });
  };

  const submitItem = () => {
    if (!session || !itemEditor) return;
    const ko = editorKo.trim();
    const en = editorEn.trim();
    if (!ko && !en) {
      toast("문장을 하나 이상 적어주세요");
      return;
    }
    let nextItems: Affirmation[];
    if (itemEditor.mode === "add") {
      nextItems = [...items, makeAffirmation(ko || en, en)];
    } else {
      nextItems = items.map((item) =>
        item.id === itemEditor.item.id
          ? { ...item, ko: ko || item.ko, en: en || item.en }
          : item,
      );
    }
    persist(
      sessions.map((entry) =>
        entry.id === session.id ? { ...entry, items: nextItems } : entry,
      ),
    );
    setItemEditor(null);
    toast(itemEditor.mode === "add" ? "문장을 추가했어요" : "문장을 고쳤어요");
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
    toast("문장을 지웠어요");
  };

  const createSession = () => {
    if (!newTitle.trim()) {
      toast("세션 제목을 적어주세요");
      return;
    }
    const made = makeSession(newTitle, newEmoji, newDesc);
    persist([...sessions, made]);
    setActiveId(made.id);
    setSessionEditor(false);
    setNewTitle("");
    setNewEmoji("✶");
    setNewDesc("");
    toast("새 확언 세션을 만들었어요. 문장을 추가해 보세요.");
  };

  const renameSession = () => {
    if (!session || session.builtin) return;
    const value = window.prompt("세션 제목을 적어주세요", session.title);
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
    toast("세션을 지웠어요");
  };

  const finish = () => {
    const minutes = Math.max(1, Math.round((Date.now() - openedAtRef.current) / 60000));
    void recordPlay(`affirmations:${session?.id ?? "positive"}`, minutes);
    const params = new URLSearchParams({
      moment: "after",
      from: "affirmations",
      session: session?.title ?? "확언",
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

  return (
    <main className="page aff-page">
      <LifeDirectionBanner />
      <header className="view-head">
        <div>
          <p className="eyebrow">말로 새기는 시간</p>
          <h1>확언</h1>
        </div>
        <span className="tag">{total}문장</span>
      </header>
      <p className="view-lead">
        소리 내어 읽어도, 마음속으로 읽어도 좋아요. 30문장이 끝나면 오늘의 마음기록으로
        이어집니다.
      </p>

      <div className="aff-sessions" role="tablist" aria-label="확언 세션">
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
              {entry.title}
              <em>{entry.items.length}</em>
            </span>
          </button>
        ))}
        <button type="button" className="aff-chip add" onClick={() => setSessionEditor(true)}>
          <span className="e" aria-hidden="true">
            ＋
          </span>
          <span className="t">새 세션</span>
        </button>
      </div>

      <div className="aff-desc">
        <b>
          {session.emoji} {session.title}
        </b>
        <span>{session.description || (session.builtin ? "" : "내가 만든 확언 세션")}</span>
        {!session.builtin ? (
          <span className="aff-owner-actions">
            <button type="button" onClick={renameSession}>
              이름 바꾸기
            </button>
            <button
              type="button"
              className={confirmDelete === session.id ? "danger" : ""}
              onClick={deleteSession}
            >
              {confirmDelete === session.id ? "정말 지울까요?" : "세션 지우기"}
            </button>
          </span>
        ) : null}
      </div>

      <div className="aff-toolbar">
        <div className="seg inline" role="group" aria-label="보기 방식">
          <button
            type="button"
            className={view === "card" ? "on" : ""}
            onClick={() => setView("card")}
          >
            카드
          </button>
          <button
            type="button"
            className={view === "list" ? "on" : ""}
            onClick={() => setView("list")}
          >
            목록
          </button>
        </div>
        <button
          type="button"
          className="aff-tool"
          onClick={() =>
            setScript((prev) => (prev === "both" ? "ko" : prev === "ko" ? "en" : "both"))
          }
        >
          {SCRIPT_LABEL[script]}
        </button>
        {view === "card" ? (
          <button type="button" className="aff-tool" onClick={() => setAuto((prev) => !prev)}>
            {auto ? "자동 넘김 중" : "자동 넘김"}
          </button>
        ) : null}
      </div>

      {items.length === 0 ? (
        <div className="empty">
          <span className="e">{session.emoji}</span>
          아직 문장이 없어요.
          <br />
          첫 문장을 직접 적어보세요.
          <button type="button" className="btn sage-wash" onClick={openAdd} style={{ marginTop: 12 }}>
            ＋ 문장 추가
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
              const delta = (event.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
              touchX.current = null;
              if (Math.abs(delta) > 45) go(delta < 0 ? 1 : -1);
            }}
            aria-live="polite"
          >
            <div className="aff-card-top">
              <span className="aff-count">
                {index + 1} <i>/ {items.length}</i>
              </span>
              <span className="aff-session-name">{session.title}</span>
            </div>
            <div className="aff-text">
              {script !== "en" ? <p className="ko">{current?.ko}</p> : null}
              {script !== "ko" && current?.en ? <p className="en">{current.en}</p> : null}
            </div>
            <div className="aff-progress" aria-hidden="true">
              <span style={{ width: `${((index + 1) / items.length) * 100}%` }} />
            </div>
            <div className="aff-nav">
              <button type="button" className="aff-arrow" onClick={() => go(-1)} aria-label="이전 문장">
                ‹
              </button>
              <button type="button" className="aff-edit" onClick={() => current && openEdit(current, index)}>
                이 문장 수정
              </button>
              <button type="button" className="aff-arrow" onClick={() => go(1)} aria-label="다음 문장">
                ›
              </button>
            </div>
          </section>

          <div className="aff-card-actions">
            <button type="button" className="btn sage-wash" onClick={openAdd}>
              ＋ 문장 추가
            </button>
            <button type="button" className="btn" onClick={finish}>
              확언 마치고 마음기록 남기기
            </button>
          </div>
        </>
      ) : (
        <section className="aff-list" aria-label="확언 목록">
          {items.map((item, itemIndex) => (
            <article key={item.id} className="aff-row">
              <span className="aff-row-num">{itemIndex + 1}</span>
              <div className="aff-row-text">
                <p className="ko">{item.ko}</p>
                <p className="en">{item.en}</p>
              </div>
              <div className="aff-row-actions">
                <button type="button" onClick={() => openEdit(item, itemIndex)} aria-label="수정">
                  ✎
                </button>
                <button
                  type="button"
                  className={confirmItemDelete === item.id ? "danger" : ""}
                  onClick={() => deleteItem(item)}
                  aria-label="삭제"
                >
                  {confirmItemDelete === item.id ? "삭제?" : "✕"}
                </button>
              </div>
            </article>
          ))}
          <div className="aff-card-actions">
            <button type="button" className="btn sage-wash" onClick={openAdd}>
              ＋ 문장 추가
            </button>
            <button type="button" className="btn" onClick={finish}>
              확언 마치고 마음기록 남기기
            </button>
          </div>
        </section>
      )}

      <p className="tiny" style={{ textAlign: "center", marginTop: 14 }}>
        확언은 이 기기에 저장돼요.{" "}
        <button
          type="button"
          className="linklike"
          onClick={() => {
            if (!window.confirm("모든 세션을 기본 120문장으로 되돌릴까요? 직접 만든 세션은 사라져요.")) return;
            const fresh = resetSessions();
            setSessions(fresh);
            setActiveId(fresh[0].id);
            toast("기본 문장으로 되돌렸어요");
          }}
        >
          기본 문장으로 되돌리기
        </button>
      </p>

      <Sheet open={Boolean(itemEditor)} onClose={() => setItemEditor(null)} labelledBy="aff-editor-title">
        <h3 id="aff-editor-title">
          {itemEditor?.mode === "add" ? "문장 추가" : "문장 수정"}
        </h3>
        <p className="lead">한국어와 영어를 함께 적으면 카드에서 나란히 보여요.</p>
        <label className="field">
          <span>한국어</span>
          <textarea
            value={editorKo}
            onChange={(event) => setEditorKo(event.target.value)}
            rows={2}
            maxLength={120}
            placeholder="나는 지금 이대로도 충분합니다."
          />
        </label>
        <label className="field">
          <span>English</span>
          <textarea
            value={editorEn}
            onChange={(event) => setEditorEn(event.target.value)}
            rows={2}
            maxLength={160}
            placeholder="I am enough, exactly as I am."
          />
        </label>
        <button type="button" className="btn block" onClick={submitItem}>
          {itemEditor?.mode === "add" ? "추가하기" : "저장하기"}
        </button>
      </Sheet>

      <Sheet open={sessionEditor} onClose={() => setSessionEditor(false)} labelledBy="aff-session-title">
        <h3 id="aff-session-title">새 확언 세션</h3>
        <p className="lead">제목을 직접 정하고, 문장은 만든 뒤에 하나씩 채워요.</p>
        <label className="field">
          <span>제목</span>
          <input
            value={newTitle}
            onChange={(event) => setNewTitle(event.target.value)}
            maxLength={40}
            placeholder="예: 복직을 앞둔 나에게"
          />
        </label>
        <label className="field">
          <span>이모지 (선택)</span>
          <input
            value={newEmoji}
            onChange={(event) => setNewEmoji(event.target.value.slice(0, 2))}
            maxLength={2}
            placeholder="✶"
          />
        </label>
        <label className="field">
          <span>한 줄 소개 (선택)</span>
          <input
            value={newDesc}
            onChange={(event) => setNewDesc(event.target.value)}
            maxLength={80}
            placeholder="무엇을 위한 확언인가요?"
          />
        </label>
        <button type="button" className="btn block" onClick={createSession}>
          세션 만들기
        </button>
      </Sheet>

      <p className="tiny" style={{ textAlign: "center", marginTop: 10 }}>
        기본 4개 세션은 모두 수정할 수 있어요. 마음에 들지 않는 문장은 지워도 괜찮아요.
        <br />
        <Link href="/diary" className="link">
          지난 마음기록 보기
        </Link>
      </p>
    </main>
  );
}
