"use client";

import { useState } from "react";
import { emptyMandalart, type MandalartState } from "@/lib/growth";

const POSITIONS = [0, 1, 2, 3, 5, 6, 7, 8];
const BLOCK_LABELS = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

const SAMPLE: MandalartState = {
  center: "복직과 수익화를 함께 굴리는 1년",
  themes: [
    "재정",
    "커리어",
    "건강",
    "가족",
    "마음",
    "콘텐츠",
    "배움",
    "시간",
  ],
  actions: [
    ["가계부 주 1회", "비상금 100만원", "구독 정리", "수입원 2개", "지출 상한 정하기", "보험 점검", "세금 달력", "월 결산"],
    ["복직 준비 30분", "업무 노트 정리", "동료 3명 연락", "자격증 1개", "이력서 갱신", "면담 준비", "발표 1회", "회고 쓰기"],
    ["주 3회 걷기", "물 1.5L", "23시 취침", "허리 스트레칭", "점심 산책", "커피 2잔", "월 1회 검진", "체력 기록"],
    ["아이와 10분", "주말 나들이", "가족 식탁", "남편과 대화", "잠자리 책", "부모님 안부", "사진 남기기", "생일 챙기기"],
    ["아침 명상 3분", "주 1회 일기", "확언 10문장", "감정 이름 붙이기", "숨 고르기", "비우기 시각화", "감사 3가지", "쉬는 날"],
    ["릴스 주 3회", "블로그 2편", "썸네일 템플릿", "댓글 10개", "주제 30개", "촬영 1회", "편집 1회", "성과 보기"],
    ["책 1권", "강의 1개", "노트 정리", "질문 3개", "사례 수집", "실습 1회", "피드백 받기", "가르치기"],
    ["주간 계획", "하루 1집중", "알림 정리", "20분 타이머", "일요일 리셋", "버퍼 시간", "거절 연습", "쉼 예약"],
  ],
};

export function Mandalart({
  value,
  onChange,
}: {
  value: MandalartState;
  onChange: (next: MandalartState) => void;
}) {
  const [editing, setEditing] = useState<number | null>(4);
  const [confirmSample, setConfirmSample] = useState(false);

  const themeIndexFor = (block: number) => (block < 4 ? block : block - 1);

  const cellValue = (block: number, cell: number): string => {
    if (block === 4) {
      if (cell === 4) return value.center;
      return value.themes[POSITIONS.indexOf(cell)] ?? "";
    }
    const t = themeIndexFor(block);
    if (cell === 4) return value.themes[t] ?? "";
    return value.actions[t]?.[POSITIONS.indexOf(cell)] ?? "";
  };

  const setCell = (block: number, cell: number, text: string) => {
    const next = {
      center: value.center,
      themes: [...value.themes],
      actions: value.actions.map((row) => [...row]),
    };
    const clipped = text.slice(0, 40);
    if (block === 4) {
      if (cell === 4) next.center = text.slice(0, 60);
      else next.themes[POSITIONS.indexOf(cell)] = clipped;
    } else {
      const t = themeIndexFor(block);
      if (cell === 4) next.themes[t] = clipped;
      else next.actions[t][POSITIONS.indexOf(cell)] = clipped;
    }
    onChange(next);
  };

  const filledCells =
    (value.center.trim() ? 1 : 0) +
    value.themes.filter((theme) => theme.trim()).length +
    value.actions.flat().filter((action) => action.trim()).length;

  return (
    <section className="growth-panel" aria-label="만다라트 계획표">
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">Mandal-art 9×9</p>
          <h2>만다라트</h2>
        </div>
        <span className="tiny">{filledCells} / 81칸</span>
      </header>

      <p className="growth-lead">
        가운데에 핵심 목표, 둘레 8칸에 세부 주제, 각 주제마다 8개의 실천 항목. 블록을 누르면
        3×3 입력판이 열려요.
      </p>

      <div className="mandala-mini" role="grid" aria-label="만다라트 9×9 미니맵">
        {Array.from({ length: 9 }, (_, block) => (
          <button
            key={block}
            type="button"
            className={`mandala-block ${block === 4 ? "core" : ""} ${
              editing === block ? "editing" : ""
            }`}
            onClick={() => setEditing(block)}
            aria-label={`${BLOCK_LABELS[block]}번 블록 편집`}
          >
            {Array.from({ length: 9 }, (_, cell) => {
              const text = cellValue(block, cell);
              const isCenter = cell === 4;
              return (
                <span
                  key={cell}
                  className={`mandala-cell ${isCenter ? "center" : ""} ${
                    text.trim() ? "" : "empty"
                  }`}
                >
                  {text || (isCenter ? (block === 4 ? "핵심 목표" : "주제") : "")}
                </span>
              );
            })}
          </button>
        ))}
      </div>

      <div className="mandala-editor">
        <div className="mandala-editor-head">
          <b>
            {editing === null
              ? "블록을 골라주세요"
              : editing === 4
                ? "가운데 블록 · 핵심 목표와 8개 주제"
                : `${BLOCK_LABELS[editing]}번 블록 · ${value.themes[themeIndexFor(editing)] || "주제"}의 실천 8가지`}
          </b>
          {editing !== null ? (
            <button type="button" className="tiny linklike" onClick={() => setEditing(null)}>
              접기
            </button>
          ) : null}
        </div>

        {editing !== null ? (
          <div className="mandala-board" role="group" aria-label="3×3 입력판">
            {Array.from({ length: 9 }, (_, cell) => (
              <input
                key={cell}
                className={`mandala-input ${cell === 4 ? "center" : ""}`}
                value={cellValue(editing, cell)}
                onChange={(event) => setCell(editing, cell, event.target.value)}
                maxLength={editing === 4 && cell === 4 ? 60 : 40}
                placeholder={
                  cell === 4
                    ? editing === 4
                      ? "핵심 목표"
                      : "주제"
                    : editing === 4
                      ? "주제"
                      : "실천 항목"
                }
                aria-label={`${BLOCK_LABELS[editing]}번 블록 ${cell + 1}칸`}
              />
            ))}
          </div>
        ) : (
          <p className="tiny">미니맵에서 수정할 3×3 블록을 눌러주세요.</p>
        )}
      </div>

      <div className="mandala-actions">
        <button
          type="button"
          className="growth-reset"
          onClick={() => {
            if (!confirmSample) {
              setConfirmSample(true);
              window.setTimeout(() => setConfirmSample(false), 2600);
              return;
            }
            setConfirmSample(false);
            onChange(SAMPLE);
          }}
        >
          {confirmSample ? "한 번 더 누르면 예시로 채워요" : "예시로 채워보기"}
        </button>
        <button
          type="button"
          className="growth-reset"
          onClick={() => {
            if (window.confirm("만다라트를 모두 비울까요?")) onChange(emptyMandalart());
          }}
        >
          전체 비우기
        </button>
      </div>
      <p className="growth-saved">입력하는 대로 자동 저장돼요.</p>
    </section>
  );
}
