"use client";

import { useI18n } from "@/lib/i18n/LangProvider";

import { useEffect, type ReactNode } from "react";

export function Sheet({
  open,
  onClose,
  children,
  labelledBy,
}: {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  labelledBy?: string;
}) {
  const { t } = useI18n();
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={onClose} aria-hidden="true" />
      <div
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
      >
        <div className="sheet-grab" aria-hidden="true" />
        <button className="sheet-x" onClick={onClose} aria-label={t("common.close")}>
          ✕
        </button>
        {children}
      </div>
    </>
  );
}
