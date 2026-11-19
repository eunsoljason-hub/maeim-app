"use client";

import { useEffect, useRef, useState } from "react";
import { stopWarpAudio } from "@/lib/audio/warp";

/**
 * 체크인 직후 재생되는 코스믹 워프.
 *
 * 우주 공간으로 빨려 들어가는 느낌을 내기 위해, 투명 캔버스 위에 매 프레임
 *  · 별가루를 원근 투영해 찍고 (남은 잔상 = 자연스러운 모션 블러 궤적)
 *  · 성운 덩어리가 바깥으로 흘러 지나가고
 *  · 중심에서 웜홀 링이 퍼져 나가고
 *  · 마지막에 코어 빛이 화면을 채우며 빨려 들어간다
 * 배경의 깊은 우주 그라데이션은 CSS가 그린다.
 *
 * 효과음은 버튼 클릭 제스처에서 미리 열어 둔 WebAudio 신스(primeWarpAudio)가 낸다.
 */

const WARP_MS = 4600;
const LEAVE_AT = 3900;

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

const TINTS = ["232,239,255", "160,192,255", "228,190,255"];

function halo(inner: string, mid: string) {
  const size = 160;
  const c = document.createElement("canvas");
  c.width = size;
  c.height = size;
  const g = c.getContext("2d");
  if (g) {
    const grd = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    grd.addColorStop(0, inner);
    grd.addColorStop(0.4, mid);
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
    const ctx = canvas.getContext("2d");
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

    const core = halo("rgba(255,255,255,0.95)", "rgba(172,190,255,0.45)");
    const sprites = [
      halo("rgba(146,160,255,0.55)", "rgba(72,64,168,0.28)"),
      halo("rgba(255,176,226,0.45)", "rgba(128,62,156,0.22)"),
      halo("rgba(122,226,255,0.4)", "rgba(34,94,152,0.2)"),
      halo("rgba(190,176,255,0.38)", "rgba(58,50,140,0.18)"),
    ];

    const stars: Star[] = [];
    const wisps: Wisp[] = [];

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
      maxR = Math.hypot(cx, cy) * 1.06;
    };
    layout();

    const seed = (rad = 0.05 + Math.random() * 0.95): Star => ({
      ang: Math.random() * Math.PI * 2,
      rad,
      depth: 0.35 + Math.random() * 0.65,
      w: 0.6 + Math.random() * 1.7,
      tint: Math.random() < 0.6 ? 0 : Math.random() < 0.72 ? 1 : 2,
    });

    const count = reduce ? 160 : width < 430 ? 340 : 520;
    for (let i = 0; i < count; i += 1) stars.push(seed());

    for (let i = 0; i < 6; i += 1) {
      wisps.push({
        ang: Math.random() * Math.PI * 2,
        rad: Math.random() * 0.9,
        speed: 0.06 + Math.random() * 0.14,
        size: 150 + Math.random() * 210,
        sprite: i % sprites.length,
      });
    }

    let raf = 0;
    let last = performance.now();
    const started = last;
    let spin = Math.random() * Math.PI;
    const trail = new Map<number, { x: number; y: number }>();

    const draw = (now: number) => {
      const dt = Math.min(46, Math.max(4, now - last));
      last = now;
      const step = dt / 1000;
      const progress = reduce ? 0.3 : Math.min(1, (now - started) / WARP_MS);

      /* 빨려 들어가는 속도 곡선 — 천천히 떠오르다 후반에 깊게 가속 */
      const ramp = Math.min(1, progress / 0.62);
      const speed = reduce ? 0 : 0.5 + Math.pow(ramp, 1.7) * 4.6;
      spin += step * (0.05 + speed * 0.02);

      /* 남은 잔상을 지워 궤적(모션 블러)을 남긴다 */
      ctx.globalCompositeOperation = "destination-out";
      ctx.globalAlpha = 1;
      ctx.fillStyle = `rgba(0,0,0,${reduce ? 1 : 1 - Math.pow(0.8, dt / 16.67)})`;
      ctx.fillRect(0, 0, width, height);

      ctx.globalCompositeOperation = "lighter";

      /* 성운 — 중심에서 바깥으로 흘러 지나가는 덩어리 */
      for (const wisp of wisps) {
        const rad =
          (wisp.rad + ((now - started) / 1000) * wisp.speed * (0.5 + speed * 0.55)) % 1.3;
        const x = cx + Math.cos(wisp.ang) * rad * maxR;
        const y = cy + Math.sin(wisp.ang) * rad * maxR * 0.94;
        const scale = wisp.size * (0.5 + rad * 1.5);
        const fade = Math.sin(Math.min(1, rad / 1.25) * Math.PI);
        ctx.globalAlpha = Math.max(0, fade * 0.13);
        ctx.drawImage(sprites[wisp.sprite], x - scale / 2, y - scale / 2, scale, scale);
      }

      /* 웜홀 링 — 중심에서 퍼져 나가는 가는 원 */
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(178,198,255,1)";
      for (let i = 0; i < 5; i += 1) {
        const phase = (((now - started) / 2100 + i / 5) % 1 + 1) % 1;
        const radius = Math.pow(phase, 1.6) * maxR * 1.2;
        const alpha = Math.pow(1 - phase, 2) * 0.34;
        if (alpha < 0.005) continue;
        ctx.globalAlpha = alpha;
        ctx.beginPath();
        ctx.ellipse(cx, cy, radius, radius * 0.93, spin * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }

      /* 별가루 — 원근 투영 + 잔상이 길게 늘어난다.
         가산 합성으로 빛나되, 한 번의 알파를 낮게 잡아 화면이 하얗게 뜨지 않게 한다. */
      ctx.globalCompositeOperation = "lighter";
      ctx.lineCap = "round";
      for (let i = 0; i < stars.length; i += 1) {
        const star = stars[i];
        if (!reduce) {
          star.rad += (0.22 + Math.pow(star.rad, 1.25) * 2.2) * speed * (0.55 + star.depth) * step;
          star.ang += spin * step * 0.35;
        }
        if (star.rad > 1.18) {
          Object.assign(star, seed(0.02 + Math.random() * 0.08));
          trail.delete(i);
          continue;
        }
        const x = cx + Math.cos(star.ang) * star.rad * maxR;
        const y = cy + Math.sin(star.ang) * star.rad * maxR * 0.94;
        const prev = trail.get(i);
        trail.set(i, { x, y });

        const alpha =
          Math.min(0.85, 0.12 + Math.pow(star.rad, 0.8) * 0.75) * (0.45 + star.depth * 0.55);
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = `rgba(${TINTS[star.tint]},1)`;
        ctx.lineWidth = 1.1 + star.rad * 3 * star.w;
        if (prev && Math.hypot(x - prev.x, y - prev.y) < 90) {
          ctx.beginPath();
          ctx.moveTo(prev.x, prev.y);
          ctx.lineTo(x, y);
          ctx.stroke();
        }
        /* 별의 머리 — 점 하나가 빛나며 지나간다 */
        if (star.rad > 0.16) {
          ctx.beginPath();
          ctx.arc(x, y, 0.6 + star.rad * 1.9 * star.w, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${TINTS[star.tint]},1)`;
          ctx.fill();
        }
      }

      /* 코어 — 빨려 들어갈수록 하얗게 타오르는 중심 */
      const flare = Math.pow(progress, 2.2);
      const coreSize = maxR * (0.22 + flare * 0.85);
      ctx.globalAlpha = 0.08 + flare * 0.26;
      ctx.drawImage(core, cx - coreSize / 2, cy - coreSize / 2, coreSize, coreSize);

      /* 마지막 한순간 — 빛 속으로 사라진다 */
      if (!reduce && progress > 0.88) {
        ctx.globalCompositeOperation = "source-over";
        ctx.globalAlpha = Math.min(0.55, ((progress - 0.88) / 0.12) * 0.55);
        ctx.fillStyle = "rgba(233,238,255,1)";
        ctx.fillRect(0, 0, width, height);
      }

      ctx.globalAlpha = 1;
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
