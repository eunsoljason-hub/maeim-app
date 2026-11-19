"use client";

import { useEffect, useRef, useState } from "react";
import { stopWarpAudio } from "@/lib/audio/warp";

/**
 * 체크인 직후 재생되는 코스믹 워프.
 *
 * 우주 공간으로 빨려 들어가는 느낌을 내기 위해 한 장의 캔버스에
 *  · 원근 투영된 3겹 별가루(가까운 별은 길게 늘어나고, 먼 별은 점으로 남는다)
 *  · 바깥으로 흘러 지나가는 성운 덩어리
 *  · 중심에서 퍼져 나가는 웜홀 링
 *  · 마지막에 빛으로 빨려 들어가는 코어 플레어
 * 를 겹쳐 그린다. 효과음은 버튼 클릭 제스처에서 미리 열어 둔
 * WebAudio 신스(primeWarpAudio)가 이어서 낸다.
 */

const WARP_MS = 4400;
const LEAVE_AT = 3760;

type Star = {
  ang: number;
  rad: number;
  depth: number;
  w: number;
  tint: number;
};

type Wisp = {
  ang: number;
  rad: number;
  speed: number;
  size: number;
  sprite: number;
};

const TINTS = [
  "226,234,255",
  "152,186,255",
  "226,190,255",
];

function halo(inner: string, mid: string) {
  const size = 192;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (g) {
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.42, mid);
    grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, size, size);
  }
  return c;
}

export function CosmicWarp({
  message,
  onDone,
  kicker = "INYOU · 내면으로",
  sub = "잠시만, 숨을 고르고 들어갑니다.",
  skipLabel = "건너뛰기",
}: {
  message: string;
  onDone: () => void;
  kicker?: string;
  sub?: string;
  skipLabel?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    const reduce =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = window.innerWidth;
    let height = window.innerHeight;
    let cx = width / 2;
    let cy = height / 2;
    let maxR = Math.hypot(cx, cy);
    const dpr = Math.min(2, window.devicePixelRatio || 1);

    let bg: CanvasGradient | null = null;
    let vignette: CanvasGradient | null = null;
    let core: HTMLCanvasElement | null = null;
    const sprites: HTMLCanvasElement[] = [];

    const stars: Star[] = [];
    const wisps: Wisp[] = [];

    const seedStar = (star: Partial<Star> = {}): Star => ({
      ang: Math.random() * Math.PI * 2,
      rad: 0.04 + Math.random() * 0.9,
      depth: 0.3 + Math.random() * 0.7,
      w: 0.55 + Math.random() * 1.5,
      tint: Math.random() < 0.62 ? 0 : Math.random() < 0.7 ? 1 : 2,
      ...star,
    });

    const layout = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      cx = width / 2;
      cy = height / 2;
      maxR = Math.hypot(cx, cy) * 1.08;

      bg = ctx.createRadialGradient(cx, cy, 0, cx, cy * 1.05, maxR * 1.35);
      bg.addColorStop(0, "#1b2140");
      bg.addColorStop(0.28, "#121733");
      bg.addColorStop(0.62, "#090c1d");
      bg.addColorStop(1, "#03040b");

      vignette = ctx.createRadialGradient(cx, cy, maxR * 0.35, cx, cy, maxR * 1.12);
      vignette.addColorStop(0, "rgba(0,0,0,0)");
      vignette.addColorStop(0.72, "rgba(2,3,10,0.35)");
      vignette.addColorStop(1, "rgba(1,2,7,0.92)");
    };

    layout();

    if (!core) {
      core = halo("rgba(255,255,255,0.95)", "rgba(166,184,255,0.45)");
      sprites.push(
        halo("rgba(150,164,255,0.5)", "rgba(70,62,160,0.26)"),
        halo("rgba(255,178,224,0.4)", "rgba(126,64,150,0.2)"),
        halo("rgba(126,224,255,0.36)", "rgba(36,92,148,0.18)"),
        halo("rgba(190,180,255,0.34)", "rgba(60,54,140,0.16)"),
      );
    }

    const count = reduce ? 120 : width < 430 ? 260 : 400;
    for (let i = 0; i < count; i += 1) stars.push(seedStar());

    for (let i = 0; i < 5; i += 1) {
      wisps.push({
        ang: Math.random() * Math.PI * 2,
        rad: Math.random() * 0.85,
        speed: 0.05 + Math.random() * 0.12,
        size: 190 + Math.random() * 240,
        sprite: i % sprites.length,
      });
    }

    let raf = 0;
    let last = performance.now();
    const started = last;
    let spin = Math.random() * Math.PI;

    const draw = (now: number) => {
      const dt = Math.min(46, Math.max(4, now - last));
      last = now;
      const step = dt / 1000;
      const progress = reduce ? 0.34 : Math.min(1, (now - started) / WARP_MS);

      /* 속도 곡선: 천천히 떠오르다가 후반에 깊게 빨려 들어간다 */
      const ramp = Math.min(1, progress / 0.72);
      const speed = 0.32 + Math.pow(ramp, 1.8) * 3.1;
      spin += step * 0.035 * (0.6 + speed * 0.18);

      /* 배경 */
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      ctx.fillStyle = bg ?? "#05060f";
      ctx.fillRect(0, 0, width, height);

      /* 성운 — 중심에서 바깥으로 흘러 지나간다 */
      ctx.globalCompositeOperation = "lighter";
      for (const wisp of wisps) {
        const rad = (wisp.rad + (now - started) / 1000 * wisp.speed * (0.4 + speed * 0.5)) % 1.25;
        const x = cx + Math.cos(wisp.ang) * rad * maxR;
        const y = cy + Math.sin(wisp.ang) * rad * maxR * 0.94;
        const scale = wisp.size * (0.45 + rad * 1.35);
        const fade = Math.sin(Math.min(1, rad / 1.1) * Math.PI);
        ctx.globalAlpha = Math.max(0, fade * 0.16);
        ctx.drawImage(sprites[wisp.sprite], x - scale / 2, y - scale / 2, scale, scale);
      }

      /* 웜홀 링 — 중심에서 퍼져 나가는 얇은 원 */
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i += 1) {
        const phase = ((now - started) / 1800 + i / 5) % 1;
        const radius = Math.pow(phase, 1.7) * maxR * 1.15;
        const alpha = Math.pow(1 - phase, 2.1) * 0.3;
        if (alpha <= 0.004) continue;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "rgba(176,198,255,1)";
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * 0.94, spin * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* 별가루 — 원근 투영으로 길게 늘어나는 궤적 */
      ctx.lineCap = "round";
      for (const star of stars) {
        const prev = star.rad;
        if (!reduce) {
          star.rad +=
            (0.3 + Math.pow(star.rad, 1.45) * 3.4) * speed * (0.55 + star.depth) * step;
          star.ang += spin * step * 0.5;
        }
        if (star.rad > 1.22) {
          Object.assign(star, seedStar({ rad: 0.03 + Math.random() * 0.06 }));
          continue;
        }
        const ca = Math.cos(star.ang);
        const sa = Math.sin(star.ang);
        const r1 = prev * maxR;
        const r2 = star.rad * maxR;
        const x1 = cx + ca * r1;
        const y1 = cy + sa * r1 * 0.96;
        const x2 = cx + ca * r2;
        const y2 = cy + sa * r2 * 0.96;

        const alpha = Math.min(0.95, 0.14 + star.rad * 1.05) * (0.34 + star.depth * 0.66);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgba(${TINTS[star.tint]},1)`;
        ctx.lineWidth = 0.65 + star.rad * 2.1 * star.w;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }

      /* 코어 — 빨려 들어갈수록 하얗게 타오른다 */
      const flare = Math.pow(progress, 2.4);
      const coreSize = maxR * (0.32 + flare * 1.5);
      if (core) {
        ctx.globalAlpha = 0.12 + flare * 0.5;
        ctx.drawImage(core, cx - coreSize / 2, cy - coreSize / 2, coreSize, coreSize);
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
      if (vignette) {
        ctx.fillStyle = vignette;
        ctx.fillRect(0, 0, width, height);
      }

      /* 마지막 한순간 — 빛 속으로 사라진다 */
      if (!reduce && progress > 0.86) {
        ctx.fillStyle = `rgba(238,242,255,${Math.min(0.82, (progress - 0.86) / 0.14 * 0.82)})`;
        ctx.fillRect(0, 0, width, height);
      }

      if (!reduce) raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", layout);

    const leaveTimer = window.setTimeout(() => setLeaving(true), reduce ? 1500 : LEAVE_AT);
    const doneTimer = window.setTimeout(
      () => {
        if (doneRef.current) return;
        doneRef.current = true;
        stopWarpAudio(0.7);
        onDone();
      },
      reduce ? 2100 : WARP_MS,
    );

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener("resize", layout);
    };
  }, [onDone]);

  const finish = () => {
    if (doneRef.current) return;
    doneRef.current = true;
    stopWarpAudio(0.35);
    onDone();
  };

  return (
    <div className={`cosmic-warp ${leaving ? "leaving" : ""}`} role="status" aria-live="polite">
      <canvas ref={canvasRef} className="cosmic-canvas" aria-hidden="true" />
      <div className="cosmic-veil" aria-hidden="true" />
      <div className="cosmic-copy">
        <p className="cosmic-kicker">{kicker}</p>
        <p className="cosmic-message">{message}</p>
        <p className="cosmic-sub">{sub}</p>
        <button type="button" className="cosmic-skip" onClick={finish}>
          {skipLabel}
        </button>
      </div>
    </div>
  );
}
