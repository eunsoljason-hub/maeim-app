"use client";

import { useState, type ReactNode } from "react";
import { Sheet } from "@/components/ui/Sheet";
import { COUNSELING_URL } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/LangProvider";

/**
 * 1:1 상담은 앱 안에서 예약하지 않는다.
 * 외부 예약 페이지로 이동하는 버튼 하나만 두고, 주소는
 * NEXT_PUBLIC_COUNSELING_URL 로 바꿀 수 있다.
 */
export function CounselButton({
  className = "btn",
  children,
}: {
  className?: string;
  children?: ReactNode;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  if (COUNSELING_URL) {
    return (
      <a
        href={COUNSELING_URL}
        target="_blank"
        rel="noreferrer noopener"
        className={className}
      >
        {children ?? t("counsel.cta")}
      </a>
    );
  }

  return (
    <>
      <button type="button" className={className} onClick={() => setOpen(true)}>
        {children ?? t("counsel.cta")}
      </button>
      <Sheet open={open} onClose={() => setOpen(false)} labelledBy="counsel-title">
        <h3 id="counsel-title">{t("counsel.pending")}</h3>
        <p className="lead">{t("counsel.pendingBody")}</p>
        <button className="btn block" onClick={() => setOpen(false)}>
          {t("counsel.close")}
        </button>
      </Sheet>
    </>
  );
}
