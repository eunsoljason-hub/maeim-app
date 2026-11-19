"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LifeHexagon } from "@/components/growth/LifeHexagon";
import { LifeRoadmap } from "@/components/growth/LifeRoadmap";
import { Mandalart } from "@/components/growth/Mandalart";
import { NeedsPyramid } from "@/components/growth/NeedsPyramid";
import { defaultGrowth, loadGrowth, saveGrowth, type GrowthState } from "@/lib/growth";
import { useI18n } from "@/lib/i18n/LangProvider";
import { LangSwitch } from "@/components/i18n/LangSwitch";

const TOOLS = [
  { id: "needs", key: "growth.tab.needs", glyph: "▲" },
  { id: "hex", key: "growth.tab.hex", glyph: "⬡" },
  { id: "roadmap", key: "growth.tab.roadmap", glyph: "↧" },
  { id: "mandalart", key: "growth.tab.mandalart", glyph: "▦" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

export function GrowthScreen() {
  const { t } = useI18n();
  const [state, setState] = useState<GrowthState>(defaultGrowth);
  const [ready, setReady] = useState(false);
  const [tool, setTool] = useState<ToolId>("needs");

  useEffect(() => {
    setState(loadGrowth());
    setReady(true);
  }, []);

  const update = (next: GrowthState) => {
    setState(next);
    saveGrowth(next);
  };

  return (
    <main className="page growth-page">
      <header className="view-head">
        <div>
          <p className="eyebrow">{t("growth.eyebrow")}</p>
          <h1>{t("growth.title")}</h1>
        </div>
        <div className="view-head-right">
          <LangSwitch />
          <Link className="tag" href="/">
            {t("growth.toInner")}
          </Link>
        </div>
      </header>

      <div className="growth-tabs" role="tablist" aria-label={t("growth.title")}>
        {TOOLS.map((item) => (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={tool === item.id}
            className={`growth-tab ${tool === item.id ? "on" : ""}`}
            onClick={() => setTool(item.id)}
          >
            <span aria-hidden="true">{item.glyph}</span>
            {t(item.key)}
          </button>
        ))}
      </div>

      {!ready ? (
        <div className="hub-skeleton" aria-hidden="true" />
      ) : tool === "needs" ? (
        <NeedsPyramid value={state.needs} onChange={(needs) => update({ ...state, needs })} />
      ) : tool === "hex" ? (
        <LifeHexagon value={state.hex} onChange={(hex) => update({ ...state, hex })} />
      ) : tool === "roadmap" ? (
        <LifeRoadmap value={state.roadmap} onChange={(roadmap) => update({ ...state, roadmap })} />
      ) : (
        <Mandalart
          value={state.mandalart}
          onChange={(mandalart) => update({ ...state, mandalart })}
        />
      )}

      <p className="growth-footnote">
        {t("growth.footnote")}
      </p>
    </main>
  );
}
