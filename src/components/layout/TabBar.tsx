"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";

const TABS = [
  {
    href: "/",
    label: "내면",
    match: (path: string) => path === "/",
    icon: (
      <>
        <circle cx="12" cy="12" r="3.2" />
        <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2" />
        <path d="M6.2 6.2 7.8 7.8M16.2 16.2l1.6 1.6M17.8 6.2l-1.6 1.6M7.8 16.2l-1.6 1.6" />
      </>
    ),
  },
  {
    href: "/meditation",
    label: "명상",
    match: (path: string) => path.startsWith("/meditation"),
    icon: (
      <>
        <path d="M4 11.5 12 4l8 7.5" />
        <path d="M6.5 10.5V20h11v-9.5" />
        <path d="M10 20v-5h4v5" />
      </>
    ),
  },
  {
    href: "/visualization",
    label: "시각화",
    match: (path: string) => path.startsWith("/visualization"),
    icon: (
      <>
        <path d="M12 3.6 13.9 9l5.5.4-4.2 3.5 1.3 5.4L12 15.4l-4.5 2.9 1.3-5.4L4.6 9.4 10.1 9z" />
      </>
    ),
  },
  {
    href: "/affirmations",
    label: "확언",
    match: (path: string) => path.startsWith("/affirmations"),
    icon: (
      <>
        <path d="M5 5.5h14v10H10l-5 4z" />
        <path d="M8.5 9.5h7M8.5 12.5h4.5" />
      </>
    ),
  },
  {
    href: "/diary",
    label: "기록",
    match: (path: string) => path.startsWith("/diary"),
    icon: (
      <>
        <path d="M6 4.5h9.5A2.5 2.5 0 0 1 18 7v13H8.5A2.5 2.5 0 0 1 6 17.5z" />
        <path d="M6 17.5A2.5 2.5 0 0 1 8.5 15H18" />
        <path d="M9.5 8h5" />
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
