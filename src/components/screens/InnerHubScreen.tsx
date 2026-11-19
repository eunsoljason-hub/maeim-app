"use client";

import { useEffect, useState } from "react";
import { CheckInScreen } from "@/components/checkin/CheckInScreen";
import { CosmicWarp } from "@/components/checkin/CosmicWarp";
import { LangSwitch } from "@/components/i18n/LangSwitch";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";
import { PracticeStatsCard } from "@/components/practice/PracticeStatsCard";
import {
  loadTodayCheckIn,
  markCosmicSeen,
  saveCheckIn,
  type CheckIn,
} from "@/lib/checkin";
import { useI18n } from "@/lib/i18n/LangProvider";
import { moodLabel } from "@/lib/i18n/labels";

type Phase = "loading" | "checkin" | "warp" | "hub";

/**
 * 첫 화면(인유 홈).
 * 맨 위 VISION → 가운데 호흡하는 내면 우주 오브 → 아래 레벨·누적 시간 카드.
 * 시각화·명상·확언은 하단 탭에서, 마음기록은 카드 아래 작은 링크로 들어간다.
 */
export function InnerHubScreen() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<Phase>("loading");
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);

  useEffect(() => {
    const today = loadTodayCheckIn();
    if (today) {
      setCheckIn(today);
      setPhase("hub");
    } else {
      setPhase("checkin");
    }
  }, []);

  if (phase === "loading") {
    return (
      <main className="page hub-page">
        <div className="hub-skeleton" aria-hidden="true" />
      </main>
    );
  }

  if (phase === "checkin") {
    return (
      <CheckInScreen
        initialMood={checkIn?.mood ?? null}
        initialEnergy={checkIn?.energy ?? 3}
        canClose={Boolean(checkIn)}
        onClose={() => setPhase("hub")}
        onSubmit={(moodId, energy) => {
          const saved = saveCheckIn(moodId, energy);
          setCheckIn(saved);
          setPhase("warp");
        }}
      />
    );
  }

  if (phase === "warp") {
    return (
      <CosmicWarp
        message={t("cosmic.message")}
        kicker={t("cosmic.kicker")}
        sub={t("cosmic.sub")}
        skipLabel={t("cosmic.skip")}
        onDone={() => {
          markCosmicSeen();
          setPhase("hub");
        }}
      />
    );
  }

  return (
    <main className="page hub-page hub-page-minimal">
      {/* 1. 맨 위 — 박스 없는 볼드 VISION */}
      <LifeDirectionBanner />

      {/* 2. 가운데 — 은은하게 호흡하는 내면 우주 오브 */}
      <section className="inner-orb-stage" aria-label={t("hub.kicker")}>
        <div className="orb-halo" aria-hidden="true">
          <span className="orb-ring" />
          <div className="inner-orb">
            <span className="orb-neb orb-neb-a" />
            <span className="orb-neb orb-neb-b" />
            <span className="orb-stars" />
            <span className="orb-stars-far" />
            <span className="orb-core" />
          </div>
        </div>
        <p className="orb-kicker">{t("hub.kicker")}</p>
        <h1 className="orb-title">{t("hub.message1")}</h1>
        <p className="orb-sub">{t("hub.message2")}</p>
        {checkIn ? (
          <p className="orb-checkin">
            {t("hub.checkinLine", {
              mood: moodLabel(checkIn.mood, t),
              energy: checkIn.energy,
            })}
          </p>
        ) : null}
      </section>

      {/* 3. 아래 — 현재 레벨 · 누적 시간 · 다음 레벨 게이지 */}
      <PracticeStatsCard />

      <div className="hub-utility">
        <LangSwitch />
        {checkIn ? (
          <button type="button" className="hub-utility-link" onClick={() => setPhase("checkin")}>
            {t("hub.checkAgain")}
          </button>
        ) : null}
      </div>
    </main>
  );
}
