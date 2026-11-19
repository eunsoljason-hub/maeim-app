"use client";

import { useEffect, useRef } from "react";

/**
 * 인유 홈의 "내면 우주" 오브.
 * CSS 레이어 대신 캔버스에 매 프레임(≈60fps) 직접 그려서, 성운이 소용돌이치고
 * 별빛이 궤도를 돌며 반짝이고 빛의 파동이 일렁이는 것이 눈에 보이게 한다.
 * prefers-reduced-motion 이면 움직이지 않는 한 장면만 그린다.
 */

type Star = {
  r: number;
  a: number;
  speed: number;
  size: number;
  twSpeed: number;
  twPhase: number;
  color: string;
};

type Cloud = {
  orbit: number;
  a: number;
  speed: number;
  radius: number;
  color: string;
  alpha: number;
  wobble: number;
  wobblePhase: number;
  wobbleSpeed: number;
};

type Band = {
  rx: number;
  ry: number;
  speed: number;
  phase: number;
  width: number;
  alpha: number;
  color: string;
  waves: number;
};

type Wave = {
  offset: number;
  amp: number;
  freq: number;
  speed: number;
  phase: number;
  width: number;
  alpha: number;
  color: string;
};

const STAR_COLORS = ["255,255,255", "216,230,255", "255,231,196", "220,200,255", "191,241,230"];

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export function InnerOrb() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let R = 106;
    let dpr = 1;
    let raf = 0;
    let startedAt = 0;
    let running = true;

    const stars: Star[] = Array.from({ length: 132 }, () => {
      const r = Math.sqrt(Math.random()) * 0.93 + 0.05;
      return {
        r,
        a: rand(0, Math.PI * 2),
        // 안쪽일수록 빨리 돌아 구체가 회전하는 느낌을 준다
        speed: rand(0.05, 0.16) * (0.45 + (1 - r)) * (Math.random() < 0.22 ? -1 : 1),
        size: rand(0.55, 1.95),
        twSpeed: rand(0.6, 2.2),
        twPhase: rand(0, Math.PI * 2),
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      };
    });

    const clouds: Cloud[] = [
      { orbit: 0.17, a: 0.4, speed: 0.16, radius: 0.66, color: "126,166,255", alpha: 0.62, wobble: 0.055, wobblePhase: 0, wobbleSpeed: 0.42 },
      { orbit: 0.14, a: 3.1, speed: -0.12, radius: 0.58, color: "190,142,255", alpha: 0.56, wobble: 0.06, wobblePhase: 1.7, wobbleSpeed: 0.36 },
      { orbit: 0.2, a: 1.9, speed: 0.1, radius: 0.5, color: "88,224,204", alpha: 0.42, wobble: 0.05, wobblePhase: 3.2, wobbleSpeed: 0.5 },
      { orbit: 0.1, a: 4.6, speed: 0.19, radius: 0.44, color: "255,226,178", alpha: 0.4, wobble: 0.045, wobblePhase: 5.1, wobbleSpeed: 0.55 },
      { orbit: 0.22, a: 5.6, speed: -0.14, radius: 0.4, color: "126,214,255", alpha: 0.34, wobble: 0.05, wobblePhase: 2.4, wobbleSpeed: 0.46 },
    ];

    const bands: Band[] = [
      { rx: 0.92, ry: 0.42, speed: 0.22, phase: 0, width: 7, alpha: 0.2, color: "150,200,255", waves: 3 },
      { rx: 0.8, ry: 0.56, speed: -0.16, phase: 1.2, width: 5, alpha: 0.17, color: "200,170,255", waves: 2 },
      { rx: 0.68, ry: 0.7, speed: 0.12, phase: 2.6, width: 4.5, alpha: 0.14, color: "140,240,220", waves: 4 },
    ];

    const waves: Wave[] = [
      { offset: -0.16, amp: 0.055, freq: 2.2, speed: 0.55, phase: 0, width: 1.6, alpha: 0.28, color: "210,228,255" },
      { offset: 0.02, amp: 0.045, freq: 1.6, speed: -0.42, phase: 1.4, width: 1.2, alpha: 0.2, color: "255,236,208" },
      { offset: 0.2, amp: 0.05, freq: 2.8, speed: 0.48, phase: 2.9, width: 1.4, alpha: 0.16, color: "180,240,225" },
    ];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const cssSize = rect.width || canvas.clientWidth || 212;
      dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      canvas.width = Math.round(cssSize * dpr);
      canvas.height = Math.round(cssSize * dpr);
      R = cssSize / 2;
    };

    const draw = (t: number) => {
      const size = R * 2;
      const cx = R;
      const cy = R;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, size, size);

      const breath = 1 + 0.03 * Math.sin(t * 0.55) + 0.012 * Math.sin(t * 1.31 + 1.2);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(breath, breath);
      ctx.translate(-cx, -cy);

      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, R - 0.5, 0, Math.PI * 2);
      ctx.clip();

      /* 심연 바탕 */
      const base = ctx.createRadialGradient(cx - R * 0.34, cy - R * 0.4, R * 0.06, cx, cy, R * 1.06);
      base.addColorStop(0, "#3b4382");
      base.addColorStop(0.34, "#262c62");
      base.addColorStop(0.66, "#151a3c");
      base.addColorStop(1, "#070916");
      ctx.fillStyle = base;
      ctx.fillRect(0, 0, size, size);

      /* 성운 — 제자리에서 소용돌이치며 일렁인다 */
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(t * 0.05);
      ctx.translate(-cx, -cy);
      ctx.globalCompositeOperation = "screen";
      for (const cl of clouds) {
        const ang = cl.a + t * cl.speed;
        const px =
          cx +
          Math.cos(ang) * R * cl.orbit +
          Math.sin(t * cl.wobbleSpeed + cl.wobblePhase) * R * cl.wobble;
        const py =
          cy +
          Math.sin(ang) * R * cl.orbit * 0.82 +
          Math.cos(t * cl.wobbleSpeed * 1.27 + cl.wobblePhase) * R * cl.wobble;
        const pr = R * cl.radius * (1 + 0.1 * Math.sin(t * 0.45 + cl.wobblePhase));
        const a = cl.alpha * (0.72 + 0.28 * Math.sin(t * 0.5 + cl.wobblePhase));
        const g = ctx.createRadialGradient(px, py, 0, px, py, pr);
        g.addColorStop(0, `rgba(${cl.color},${a})`);
        g.addColorStop(0.42, `rgba(${cl.color},${a * 0.42})`);
        g.addColorStop(1, `rgba(${cl.color},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(px, py, pr, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      /* 오로라 띠 — 기울어진 타원 궤도를 돌며 흐른다 */
      ctx.globalCompositeOperation = "lighter";
      for (const band of bands) {
        const rot = t * band.speed + band.phase;
        const rx = R * band.rx;
        const ry = R * band.ry;
        const segs = 40;
        for (let s = 0; s < segs; s++) {
          const p0 = s / segs;
          const p1 = (s + 1) / segs;
          const a0 = rot + p0 * Math.PI * 2;
          const a1 = rot + p1 * Math.PI * 2;
          const w0 = 1 + 0.14 * Math.sin(a0 * band.waves + t * 1.1);
          const w1 = 1 + 0.14 * Math.sin(a1 * band.waves + t * 1.1);
          const x0 = cx + Math.cos(a0) * rx * w0;
          const y0 = cy + Math.sin(a0) * ry * w0;
          const x1 = cx + Math.cos(a1) * rx * w1;
          const y1 = cy + Math.sin(a1) * ry * w1;
          const shimmer = 0.35 + 0.65 * Math.abs(Math.sin(a0 * 1.3 + t * 0.8));
          ctx.strokeStyle = `rgba(${band.color},${band.alpha * shimmer})`;
          ctx.lineWidth = band.width * (0.7 + 0.3 * shimmer);
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(x0, y0);
          ctx.lineTo(x1, y1);
          ctx.stroke();
        }
      }

      /* 별빛 — 궤도를 돌고, 가까운 별은 꼬리를 끈다 */
      for (const st of stars) {
        const ang = st.a + t * st.speed;
        const rr = R * st.r * (1 + 0.025 * Math.sin(t * 0.7 + st.twPhase));
        const x = cx + Math.cos(ang) * rr;
        const y = cy + Math.sin(ang) * rr;
        const flick = 0.5 + 0.5 * Math.sin(t * st.twSpeed + st.twPhase);
        const tw = 0.35 + 0.65 * flick;
        const depth = 0.5 + 0.5 * (1 - st.r);
        const alpha = Math.min(1, tw * depth);
        ctx.fillStyle = `rgba(${st.color},${alpha})`;
        ctx.beginPath();
        ctx.arc(x, y, st.size, 0, Math.PI * 2);
        ctx.fill();
        if (st.size > 1.3) {
          ctx.fillStyle = `rgba(${st.color},${alpha * 0.22})`;
          ctx.beginPath();
          ctx.arc(x, y, st.size * 3, 0, Math.PI * 2);
          ctx.fill();
          /* 짧은 꼬리 — 회전 방향을 보여준다 */
          const tail = 0.06 * Math.sign(st.speed || 1);
          ctx.strokeStyle = `rgba(${st.color},${alpha * 0.3})`;
          ctx.lineWidth = st.size * 0.8;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(cx + Math.cos(ang - tail) * rr, cy + Math.sin(ang - tail) * rr);
          ctx.stroke();
        }
      }

      /* 빛의 파동 — 구체 안을 가로질러 유기적으로 일렁인다 */
      for (const w of waves) {
        const yBase = cy + R * w.offset;
        const amp = R * w.amp;
        const phase = t * w.speed + w.phase;
        ctx.beginPath();
        for (let i = 0; i <= 44; i++) {
          const q = i / 44;
          const px = cx - R + q * R * 2;
          const py =
            yBase +
            Math.sin(q * Math.PI * w.freq + phase) * amp +
            Math.sin(q * Math.PI * w.freq * 2.3 + phase * 1.7) * amp * 0.4;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.strokeStyle = `rgba(${w.color},${w.alpha})`;
        ctx.lineWidth = w.width;
        ctx.lineCap = "round";
        ctx.stroke();
      }

      /* 중심의 빛 알갱이 — 조금씩 떠다니며 숨 쉰다 */
      const coreX = cx - R * 0.2 + Math.cos(t * 0.27) * R * 0.09;
      const coreY = cy - R * 0.26 + Math.sin(t * 0.33) * R * 0.08;
      const coreR = R * (0.36 + 0.04 * Math.sin(t * 0.7 + 0.6));
      const cg = ctx.createRadialGradient(coreX, coreY, 0, coreX, coreY, coreR);
      cg.addColorStop(0, "rgba(255,255,255,0.95)");
      cg.addColorStop(0.22, "rgba(226,236,255,0.5)");
      cg.addColorStop(0.62, "rgba(196,210,255,0.14)");
      cg.addColorStop(1, "rgba(226,236,255,0)");
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(coreX, coreY, coreR, 0, Math.PI * 2);
      ctx.fill();

      /* 안쪽 가장자리를 어둡게 눌러 입체감을 준다 */
      ctx.globalCompositeOperation = "source-over";
      const vig = ctx.createRadialGradient(cx, cy, R * 0.58, cx, cy, R);
      vig.addColorStop(0, "rgba(4,6,20,0)");
      vig.addColorStop(0.78, "rgba(4,6,20,0.32)");
      vig.addColorStop(1, "rgba(3,4,14,0.86)");
      ctx.fillStyle = vig;
      ctx.beginPath();
      ctx.arc(cx, cy, R, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      /* 테두리를 스치는 빛 — 천천히 세 바퀴 돈다 */
      ctx.globalCompositeOperation = "lighter";
      for (let k = 0; k < 3; k++) {
        const head = t * 0.4 + (k * Math.PI * 2) / 3;
        const segs = 16;
        for (let s = 0; s < segs; s++) {
          const p0 = s / segs;
          const p1 = (s + 1) / segs;
          const a0 = head + p0 * 0.9;
          const a1 = head + p1 * 0.9;
          const fade = Math.sin(p0 * Math.PI);
          ctx.strokeStyle = `rgba(214,228,255,${0.34 * fade})`;
          ctx.lineWidth = 1.6;
          ctx.beginPath();
          ctx.arc(cx, cy, R - 1.4, a0, a1);
          ctx.stroke();
          ctx.strokeStyle = `rgba(170,196,255,${0.1 * fade})`;
          ctx.lineWidth = 5;
          ctx.beginPath();
          ctx.arc(cx, cy, R - 1.4, a0, a1);
          ctx.stroke();
        }
      }

      ctx.globalCompositeOperation = "source-over";
      ctx.restore();
    };

    const loop = (now: number) => {
      if (!startedAt) startedAt = now;
      const t = (now - startedAt) / 1000;
      draw(t);
      if (running && !reduceMotion) raf = requestAnimationFrame(loop);
    };

    resize();
    if (reduceMotion) {
      draw(3.2);
    } else {
      raf = requestAnimationFrame(loop);
    }

    const onResize = () => {
      resize();
      if (reduceMotion) draw(3.2);
    };

    const onVisibility = () => {
      if (reduceMotion) return;
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(raf);
      } else if (!running) {
        running = true;
        raf = requestAnimationFrame(loop);
      }
    };

    const resizeObserver =
      typeof ResizeObserver !== "undefined" ? new ResizeObserver(onResize) : null;
    resizeObserver?.observe(canvas);
    window.addEventListener("resize", onResize);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      resizeObserver?.disconnect();
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={canvasRef} className="orb-canvas" aria-hidden="true" />;
}
