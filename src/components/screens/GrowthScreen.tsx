"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LifeDirectionBanner } from "@/components/practice/LifeDirectionBanner";
import { LifeHexagon } from "@/components/growth/LifeHexagon";
import { LifeRoadmap } from "@/components/growth/LifeRoadmap";
import { Mandalart } from "@/components/growth/Mandalart";
import { NeedsPyramid } from "@/components/growth/NeedsPyramid";
import { defaultGrowth, loadGrowth, saveGrowth, type GrowthState } from "@/lib/growth";

const TOOLS = [
  { id: "needs", label: "욕구 피라미드", glyph: "▲" },
  { id: "hex", label: "인생 육각형", glyph: "⬡" },
  { id: "roadmap", label: "인생 로드맵", glyph: "↧" },
  { id: "mandalart", label: "만다라트", glyph: "▦" },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

export function GrowthScreen() {
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
      <LifeDirectionBanner />
      <header className="view-head">
        <div>
          <p className="eyebrow">나를 아는 네 가지 도구</p>
          <h1>성장</h1>
        </div>
        <Link className="tag" href="/">
          내면으로
        </Link>
      </header>

      <div className="growth-tabs" role="tablist" aria-label="성장 도구">
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
            {item.label}
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
        네 도구는 모두 이 기기에 저장돼요. 정답을 맞히는 표가 아니라, 지금의 나를 비춰보는
        거울로 써 주세요.
      </p>
    </main>
  );
}
