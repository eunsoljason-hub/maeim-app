"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TABS = [
  {
    href: "/",
    label: "명상",
    match: (path: string) => path === "/",
    icon: (
      <>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6.5 10.5V20h11v-9.5" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
  },
  {
    href: "/player",
    label: "플레이어",
    match: (path: string) => path.startsWith("/player"),
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <path d="M10.4 8.8 16 12l-5.6 3.2z" fill="currentColor" stroke="none" />
      </>
    ),
  },
  {
    href: "/diary",
    label: "마음일기",
    match: (path: string) => path.startsWith("/diary"),
    icon: (
      <>
        <path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v13H8.5A2.5 2.5 0 0 1 6 17.5z" />
        <path d="M6 17.5A2.5 2.5 0 0 1 8.5 15H18" />
        <path d="M9.5 8h5" />
      </>
    ),
  },
  {
    href: "/counseling",
    label: "1:1 상담",
    match: (path: string) => path.startsWith("/counseling"),
    icon: (
      <>
        <path d="M4.5 6.5A2 2 0 0 1 6.5 4.5h11a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4.5 4v-4h-1z" />
        <path d="M8.5 9h7" />
        <path d="M8.5 12h4.5" />
      </>
    ),
  },
];

export function TabBar() {
  const pathname = usePathname() ?? "/";

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {TABS.map((tab) => {
        const active = tab.match(pathname);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`tab ${active ? "on" : ""}`}
            aria-current={active ? "page" : undefined}
          >
            <svg viewBox="0 0 24 24" aria-hidden="true">
              {tab.icon}
            </svg>
            <span>{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

/** Registers the PWA service worker after hydration (production only). */
export function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator)) return;
    const timer = window.setTimeout(() => {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        /* offline support is optional; never block the app */
      });
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);
  return null;
}
