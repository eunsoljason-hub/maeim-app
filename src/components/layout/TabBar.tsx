"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { useI18n } from "@/lib/i18n/LangProvider";

type Tab = {
  href: string;
  labelKey: string;
  match: (path: string) => boolean;
  /** 앱의 주요 실행 메뉴(시각화·명상·확언) — 하단 바에서 컬러 필로 묶어 강조한다. */
  core?: boolean;
  icon: React.ReactNode;
};

const TABS: Tab[] = [
  {
    href: "/",
    labelKey: "tab.home",
    match: (path: string) => path === "/",
    icon: (
      <>
        <path d="M4 11.2 12 4.4l8 6.8" />
        <path d="M6.4 10.4V19.6h11.2v-9.2" />
        <path d="M10.2 19.6v-4.4h3.6v4.4" />
      </>
    ),
  },
  {
    href: "/meditation",
    labelKey: "tab.meditation",
    match: (path: string) => path.startsWith("/meditation"),
    core: true,
    icon: (
      <>
        <path d="M12 5.4c1.2 2.1 1.2 4.3 0 6.4-1.2-2.1-1.2-4.3 0-6.4Z" />
        <path d="M12 11.8c-2.6-1.4-5.1-1.4-7.4.1 1.6 2.6 4 3.7 7.4 3.1 3.4.6 5.8-.5 7.4-3.1-2.3-1.5-4.8-1.5-7.4-.1Z" />
        <path d="M5.4 18.6h13.2" />
      </>
    ),
  },
  {
    href: "/visualization",
    labelKey: "tab.visualization",
    match: (path: string) => path.startsWith("/visualization"),
    core: true,
    icon: (
      <>
        <path d="M12 3.6 13.9 9l5.5.4-4.2 3.5 1.3 5.4L12 15.4l-4.5 2.9 1.3-5.4L4.6 9.4 10.1 9z" />
      </>
    ),
  },
  {
    href: "/affirmations",
    labelKey: "tab.affirmations",
    match: (path: string) => path.startsWith("/affirmations"),
    core: true,
    icon: (
      <>
        <path d="M5 5.5h14v10H10l-5 4z" />
        <path d="M8.5 9.5h7M8.5 12.5h4.5" />
      </>
    ),
  },
  {
    href: "/diary",
    labelKey: "tab.diary",
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
    href: "/growth",
    labelKey: "tab.growth",
    match: (path: string) => path.startsWith("/growth"),
    icon: (
      <>
        <path d="M4.5 18.5c0-5 3.5-9 7.5-11 4 2 7.5 6 7.5 11" />
        <path d="M12 18.5V9.5" />
        <path d="M8.8 13.2 12 12l3.2 1.2" />
      </>
    ),
  },
  {
    href: "/counseling",
    labelKey: "tab.openUp",
    match: (path: string) => path.startsWith("/counseling"),
    icon: (
      <>
        <path d="M12 19.2s-6.5-3.9-6.5-8.3a3.5 3.5 0 0 1 6.5-1.8 3.5 3.5 0 0 1 6.5 1.8c0 4.4-6.5 8.3-6.5 8.3Z" />
      </>
    ),
  },
];

/** 실행 메뉴(연속된 core 탭)를 한 묶음으로 만든다. */
function groupTabs(tabs: Tab[]): { core: boolean; items: Tab[] }[] {
  const groups: { core: boolean; items: Tab[] }[] = [];
  for (const tab of tabs) {
    const last = groups[groups.length - 1];
    if (tab.core && last?.core) {
      last.items.push(tab);
    } else {
      groups.push({ core: Boolean(tab.core), items: [tab] });
    }
  }
  return groups;
}

export function TabBar() {
  const pathname = usePathname() ?? "/";
  const { t } = useI18n();

  const renderTab = (tab: Tab) => {
    const active = tab.match(pathname);
    return (
      <Link
        key={tab.href}
        href={tab.href}
        className={`tab ${active ? "on" : ""} ${tab.core ? "core" : ""}`}
        aria-current={active ? "page" : undefined}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          {tab.icon}
        </svg>
        <span>{t(tab.labelKey)}</span>
      </Link>
    );
  };

  return (
    <nav className="tabbar" aria-label="주요 메뉴">
      {groupTabs(TABS).map((group) =>
        group.core ? (
          <div className="tab-core" role="group" aria-label={t("tab.coreGroup")} key={group.items[0].href}>
            {group.items.map(renderTab)}
          </div>
        ) : (
          group.items.map(renderTab)
        ),
      )}
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
