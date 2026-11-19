"use client";

import { useEffect, useRef, useState } from "react";

/**
 * 체크인 직후 재생되는 코스믹 줌인.
 * 별들이 바깥으로 빨려 나가는 워프 장면 위로 안내 문구가 떠오른 뒤,
 * 내면 허브로 넘긴다.
 */
export function CosmicWarp({
  message,
  onDone,
}: {
  message: string;
  onDone: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const doneRef = useRef(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const count = 260;
    const stars = Array.from({ length: count }, () => ({
      x: (Math.random() - 0.5) * width * 1.4,
      y: (Math.random() - 0.5) * height * 1.4,
      z: Math.random() * width,
      p: Math.random() * Math.PI * 2,
      hue: Math.random(),
    }));

    let raf = 0;
    const started = performance.now();
    let last = started;
    let speed = 6;

    const draw = (now: number) => {
      const dt = Math.min(48, now - last) / 16.67;
      last = now;
      const elapsed = now - started;
      speed = 5 + Math.min(1, elapsed / 2600) * 34;

      /* 우주 배경: 안쪽이 밝은 원형 그라데이션 */
      ctx.fillStyle = "#05060f";
      ctx.fillRect(0, 0, width, height);
      const glow = ctx.createRadialGradient(
        width / 2,
        height / 2,
        0,
        width / 2,
        height / 2,
        Math.max(width, height) * 0.7,
      );
      glow.addColorStop(0, "rgba(78,74,140,0.55)");
      glow.addColorStop(0.35, "rgba(34,44,86,0.5)");
      glow.addColorStop(0.7, "rgba(12,16,38,0.9)");
      glow.addColorStop(1, "rgba(4,5,14,1)");
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, width, height);

      const cx = width / 2;
      const cy = height / 2;

      for (const star of stars) {
        const prevZ = star.z;
        star.z -= speed * dt;
        if (star.z <= 1) {
          star.z = width;
          star.x = (Math.random() - 0.5) * width * 1.4;
          star.y = (Math.random() - 0.5) * height * 1.4;
          star.p = Math.random() * Math.PI * 2;
          star.hue = Math.random();
        }
        const scale = width / star.z;
        const x = cx + star.x * scale;
        const y = cy + star.y * scale;
        if (x < -80 || x > width + 80 || y < -80 || y > height + 80) continue;

        const px = cx + star.x * (width / prevZ);
        const py = cy + star.y * (width / prevZ);
        const size = Math.max(0.6, 2.6 * scale * 0.35);
        const alpha = Math.min(1, Math.max(0.12, 1 - star.z / width));
        const hue = star.hue;
        const color =
          hue < 0.34
            ? `rgba(208,214,255,${alpha})`
            : hue < 0.68
              ? `rgba(180,226,235,${alpha})`
              : `rgba(236,208,246,${alpha})`;

        ctx.strokeStyle = color;
        ctx.lineWidth = size;
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.stroke();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    window.addEventListener("resize", resize);

    const leaveTimer = window.setTimeout(() => setLeaving(true), 3000);
    const doneTimer = window.setTimeout(() => {
      if (doneRef.current) return;
      doneRef.current = true;
      onDone();
    }, 3700);

    return () => {
      cancelAnimationFrame(raf);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(doneTimer);
      window.removeEventListener("resize", resize);
    };
  }, [onDone]);

  return (
    <div className={`cosmic-warp ${leaving ? "leaving" : ""}`} role="status" aria-live="polite">
      <canvas ref={canvasRef} className="cosmic-canvas" aria-hidden="true" />
      <div className="cosmic-veil" aria-hidden="true" />
      <div className="cosmic-copy">
        <p className="cosmic-kicker">INYOU · 내면으로</p>
        <p className="cosmic-message">{message}</p>
        <p className="cosmic-sub">잠시만, 숨을 고르고 들어갑니다.</p>
        <button
          type="button"
          className="cosmic-skip"
          onClick={() => {
            if (doneRef.current) return;
            doneRef.current = true;
            onDone();
          }}
        >
          건너뛰기
        </button>
      </div>
    </div>
  );
}
