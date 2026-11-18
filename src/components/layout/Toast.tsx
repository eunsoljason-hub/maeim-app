"use client";

import { useApp } from "@/components/providers/AppProvider";

export function Toast() {
  const { toastMessage } = useApp();
  return (
    <div
      className={`toast ${toastMessage ? "show" : ""}`}
      role="status"
      aria-live="polite"
    >
      {toastMessage?.message ?? ""}
    </div>
  );
}
