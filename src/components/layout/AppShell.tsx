"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { TabBar, ServiceWorkerRegistrar } from "./TabBar";
import { Toast } from "./Toast";
import { ReminderWatcher } from "@/components/studio/ReminderWatcher";

const DOC_ROUTES = ["/terms", "/privacy", "/refund"];
const NO_TAB_ROUTES = ["/login", "/counseling/success", "/counseling/fail", "/meditation/timer"];

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const isDoc = DOC_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
  const isPlayer = pathname.startsWith("/player");
  const hideTabs = NO_TAB_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  return (
    <>
      <ServiceWorkerRegistrar />
      {isDoc ? (
        <div className="doc-body">{children}</div>
      ) : (
        <div className="app-shell" data-player={isPlayer ? "true" : "false"}>
          <div className="screen">{children}</div>
          {!hideTabs && <TabBar />}
          <Toast />
          <ReminderWatcher />
        </div>
      )}
    </>
  );
}
