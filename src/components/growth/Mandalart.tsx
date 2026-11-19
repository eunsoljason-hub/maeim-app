"use client";

import { useState } from "react";
import { emptyMandalart, type MandalartState } from "@/lib/growth";
import { useI18n } from "@/lib/i18n/LangProvider";
import type { Lang } from "@/lib/i18n/dict";

const POSITIONS = [0, 1, 2, 3, 5, 6, 7, 8];

const SAMPLE: Record<Lang, MandalartState> = {
  ko: {
    center: "복직과 수익화를 함께 굴리는 1년",
    themes: ["재정", "커리어", "건강", "가족", "마음", "콘텐츠", "배움", "시간"],
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
  },
  en: {
    center: "A year of returning to work and building income",
    themes: ["Money", "Career", "Health", "Family", "Mind", "Content", "Learning", "Time"],
    actions: [
      ["Weekly budget", "Emergency fund", "Cancel subscriptions", "Two income streams", "Set a spending cap", "Check insurance", "Tax calendar", "Monthly review"],
      ["Prep 30 min", "Work notes", "Contact 3 peers", "One certificate", "Update résumé", "Prepare review", "One presentation", "Weekly retro"],
      ["Walk 3x", "1.5L water", "Sleep by 11", "Stretch back", "Lunch walk", "Two coffees", "Annual checkup", "Track energy"],
      ["10 min with kids", "Weekend outing", "Family dinner", "Talk with partner", "Bedtime story", "Call parents", "Take photos", "Remember birthdays"],
      ["3-min morning", "Weekly journal", "10 affirmations", "Name feelings", "Pause to breathe", "Letting-go visual", "Three gratitudes", "One day off"],
      ["3 reels weekly", "2 blog posts", "Thumbnail template", "Reply to 10", "30 topic ideas", "One shoot", "One edit", "Review results"],
      ["One book", "One course", "Take notes", "Three questions", "Collect cases", "One practice", "Ask feedback", "Teach it"],
      ["Weekly plan", "One focus daily", "Clear notifications", "20-min timer", "Sunday reset", "Buffer time", "Practice saying no", "Book rest"],
    ],
  },
  ja: {
    center: "復職と収入づくりを両立する一年",
    themes: ["お金", "キャリア", "健康", "家族", "心", "発信", "学び", "時間"],
    actions: [
      ["週1家計簿", "緊急費100万", "サブスク整理", "収入源2つ", "支出上限", "保険見直し", "税金カレンダー", "月次決算"],
      ["復職準備30分", "業務ノート", "同僚3人連絡", "資格1つ", "履歴書更新", "面談準備", "発表1回", "週次振り返り"],
      ["週3散歩", "水1.5L", "23時就寝", "腰ストレッチ", "昼散歩", "コーヒー2杯", "年1健診", "体力記録"],
      ["子どもと10分", "週末お出かけ", "家族の食卓", "夫と対話", "寝る前の本", "両親に連絡", "写真を残す", "誕生日を祝う"],
      ["朝3分瞑想", "週1記録", "言葉10文", "感情に名前", "呼吸を整える", "手放すイメージ", "感謝3つ", "休む日"],
      ["リール週3", "ブログ2本", "サムネ雛形", "コメント10", "テーマ30", "撮影1回", "編集1回", "成果確認"],
      ["本1冊", "講座1つ", "ノート整理", "質問3つ", "事例収集", "実践1回", "感想をもらう", "教える"],
      ["週間計画", "1日1集中", "通知整理", "20分タイマー", "日曜リセット", "余白時間", "断る練習", "休息予約"],
    ],
  },
};

export function Mandalart({
  value,
  onChange,
}: {
  value: MandalartState;
  onChange: (next: MandalartState) => void;
}) {
  const { t, lang } = useI18n();
  const [editing, setEditing] = useState<number | null>(4);
  const [confirmSample, setConfirmSample] = useState(false);

  const themeIndexFor = (block: number) => (block < 4 ? block : block - 1);

  const cellValue = (block: number, cell: number): string => {
    if (block === 4) {
      if (cell === 4) return value.center;
      return value.themes[POSITIONS.indexOf(cell)] ?? "";
    }
    const tIndex = themeIndexFor(block);
    if (cell === 4) return value.themes[tIndex] ?? "";
    return value.actions[tIndex]?.[POSITIONS.indexOf(cell)] ?? "";
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
      const tIndex = themeIndexFor(block);
      if (cell === 4) next.themes[tIndex] = clipped;
      else next.actions[tIndex][POSITIONS.indexOf(cell)] = clipped;
    }
    onChange(next);
  };

  const filledCells =
    (value.center.trim() ? 1 : 0) +
    value.themes.filter((theme) => theme.trim()).length +
    value.actions.flat().filter((action) => action.trim()).length;

  const sample = SAMPLE[lang] ?? SAMPLE.ko;

  return (
    <section className="growth-panel" aria-label={t("mandala.title")}>
      <header className="growth-panel-head">
        <div>
          <p className="eyebrow">{t("mandala.eyebrow")}</p>
          <h2>{t("mandala.title")}</h2>
        </div>
        <span className="tiny">{t("mandala.count", { n: filledCells })}</span>
      </header>

      <p className="growth-lead">{t("mandala.lead")}</p>

      <div className="mandala-mini" role="grid" aria-label={t("mandala.title")}>
        {Array.from({ length: 9 }, (_, block) => (
          <button
            key={block}
            type="button"
            className={`mandala-block ${block === 4 ? "core" : ""} ${
              editing === block ? "editing" : ""
            }`}
            onClick={() => setEditing(block)}
            aria-label={t("mandala.blockEdit", { n: block + 1 })}
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
                  {text || (isCenter ? (block === 4 ? t("mandala.core") : t("mandala.theme")) : "")}
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
              ? t("mandala.chooseBlock")
              : editing === 4
                ? t("mandala.centerBlock")
                : t("mandala.themeBlock", {
                    n: editing + 1,
                    theme: value.themes[themeIndexFor(editing)] || t("mandala.theme"),
                  })}
          </b>
          {editing !== null ? (
            <button type="button" className="tiny linklike" onClick={() => setEditing(null)}>
              {t("common.less")}
            </button>
          ) : null}
        </div>

        {editing !== null ? (
          <div className="mandala-board" role="group" aria-label={t("mandala.block", { n: editing + 1 })}>
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
                      ? t("mandala.core")
                      : t("mandala.theme")
                    : editing === 4
                      ? t("mandala.theme")
                      : t("mandala.action")
                }
                aria-label={`${t("mandala.block", { n: editing + 1 })} ${cell + 1}`}
              />
            ))}
          </div>
        ) : (
          <p className="tiny">{t("mandala.pickHint")}</p>
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
            onChange(sample);
          }}
        >
          {confirmSample ? t("mandala.sampleConfirm") : t("mandala.sample")}
        </button>
        <button
          type="button"
          className="growth-reset"
          onClick={() => {
            if (window.confirm(t("mandala.clearConfirm"))) onChange(emptyMandalart());
          }}
        >
          {t("mandala.clear")}
        </button>
      </div>
      <p className="growth-saved">{t("growth.saved")}</p>
    </section>
  );
}
