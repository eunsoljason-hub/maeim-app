"use client";

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
        <button className="sheet-x" onClick={onClose} aria-label="닫기">
          ✕
        </button>
        {children}
      </div>
    </>
  );
}
