import type { ThemeId } from "@/lib/types";

function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

const STAR_RANDOM = seeded(20261118);
const STARS = Array.from({ length: 64 }, () => ({
  x: +(STAR_RANDOM() * 430).toFixed(1),
  y: +(STAR_RANDOM() * 600).toFixed(1),
  r: +(STAR_RANDOM() * 1.25 + 0.35).toFixed(2),
  opacity: +(0.18 + STAR_RANDOM() * 0.6).toFixed(2),
}));

/**
 * Three scenic meditation backdrops (새벽 숲 · 잔잔한 호수 · 밤하늘).
 * Pure SVG so they render offline, at any size, with no image requests.
 */
export function SceneArt({ theme }: { theme: ThemeId }) {
  return (
    <div className="scene" aria-hidden="true">
      <svg
        className="scene-art scene-forest"
        viewBox="0 0 430 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gForest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0C211C" />
            <stop offset="55%" stopColor="#173D31" />
            <stop offset="100%" stopColor="#2C5744" />
          </linearGradient>
          <radialGradient id="moonForest" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#E8F3DF" stopOpacity=".55" />
            <stop offset="100%" stopColor="#E8F3DF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="430" height="900" fill="url(#gForest)" />
        <circle cx="322" cy="128" r="120" fill="url(#moonForest)" />
        <circle cx="322" cy="128" r="34" fill="#EAF3E0" opacity=".28" />
        <path
          d="M0 520 L74 470 L152 506 L232 458 L318 500 L430 452 L430 900 L0 900 Z"
          fill="#0B241E"
          opacity=".55"
        />
        <path
          d="M0 606 L92 548 L182 588 L272 542 L362 582 L430 554 L430 900 L0 900 Z"
          fill="#081D17"
          opacity=".82"
        />
        <g fill="#06170F">
          <g transform="translate(42,792) scale(1.15)">
            <polygon points="0,-150 26,-58 -26,-58" />
            <polygon points="0,-112 22,-24 -22,-24" />
            <polygon points="0,-70 18,10 -18,10" />
          </g>
          <g transform="translate(104,824) scale(1.35)">
            <polygon points="0,-150 26,-58 -26,-58" />
            <polygon points="0,-112 22,-24 -22,-24" />
            <polygon points="0,-70 18,10 -18,10" />
          </g>
          <g transform="translate(178,800) scale(.95)">
            <polygon points="0,-150 26,-58 -26,-58" />
            <polygon points="0,-112 22,-24 -22,-24" />
            <polygon points="0,-70 18,10 -18,10" />
          </g>
          <g transform="translate(262,830) scale(1.4)">
            <polygon points="0,-150 26,-58 -26,-58" />
            <polygon points="0,-112 22,-24 -22,-24" />
            <polygon points="0,-70 18,10 -18,10" />
          </g>
          <g transform="translate(338,806) scale(1.08)">
            <polygon points="0,-150 26,-58 -26,-58" />
            <polygon points="0,-112 22,-24 -22,-24" />
            <polygon points="0,-70 18,10 -18,10" />
          </g>
          <g transform="translate(398,840) scale(1.3)">
            <polygon points="0,-150 26,-58 -26,-58" />
            <polygon points="0,-112 22,-24 -22,-24" />
            <polygon points="0,-70 18,10 -18,10" />
          </g>
        </g>
        <ellipse cx="215" cy="700" rx="280" ry="70" fill="#CFE7D5" opacity=".05" />
        <ellipse cx="215" cy="760" rx="320" ry="52" fill="#CFE7D5" opacity=".045" />
      </svg>

      <svg
        className="scene-art scene-lake"
        viewBox="0 0 430 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gLake" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#0C1724" />
            <stop offset="52%" stopColor="#1E3A50" />
            <stop offset="100%" stopColor="#3D6076" />
          </linearGradient>
          <linearGradient id="gWater" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#20415A" stopOpacity=".95" />
            <stop offset="100%" stopColor="#0B1723" />
          </linearGradient>
          <radialGradient id="moonLake" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#F2F7FF" stopOpacity=".5" />
            <stop offset="100%" stopColor="#F2F7FF" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="430" height="900" fill="url(#gLake)" />
        <circle cx="334" cy="168" r="132" fill="url(#moonLake)" />
        <circle cx="334" cy="168" r="38" fill="#F4F8FF" opacity=".82" />
        <path
          d="M0 560 L80 500 L160 540 L250 486 L330 528 L430 480 L430 620 L0 620 Z"
          fill="#0E1F2C"
          opacity=".9"
        />
        <rect y="600" width="430" height="300" fill="url(#gWater)" />
        <g stroke="#D6E8F6" strokeWidth="2" opacity=".16">
          <line x1="270" y1="640" x2="336" y2="640" />
          <line x1="258" y1="666" x2="350" y2="666" />
          <line x1="268" y1="694" x2="338" y2="694" />
          <line x1="286" y1="722" x2="322" y2="722" />
          <line x1="248" y1="752" x2="360" y2="752" />
        </g>
        <g stroke="#C9DEEC" strokeWidth="1.5" opacity=".1">
          <line x1="30" y1="650" x2="190" y2="650" />
          <line x1="60" y1="690" x2="230" y2="690" />
          <line x1="20" y1="740" x2="200" y2="740" />
          <line x1="120" y1="790" x2="330" y2="790" />
          <line x1="60" y1="840" x2="280" y2="840" />
        </g>
        <ellipse cx="300" cy="640" rx="42" ry="5" fill="#F2F7FF" opacity=".22" />
      </svg>

      <svg
        className="scene-art scene-night"
        viewBox="0 0 430 900"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <linearGradient id="gNight" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#070A14" />
            <stop offset="55%" stopColor="#161D38" />
            <stop offset="100%" stopColor="#2A2450" />
          </linearGradient>
          <radialGradient id="moonNight" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor="#F6F2E6" stopOpacity=".45" />
            <stop offset="100%" stopColor="#F6F2E6" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="430" height="900" fill="url(#gNight)" />
        <g fill="#EFEFFA">
          {STARS.map((star, index) => (
            <circle
              key={index}
              cx={star.x}
              cy={star.y}
              r={star.r}
              opacity={star.opacity}
            />
          ))}
        </g>
        <circle cx="112" cy="180" r="130" fill="url(#moonNight)" />
        <circle cx="112" cy="180" r="38" fill="#FAF6EA" opacity=".9" />
        <circle cx="126" cy="168" r="34" fill="#141A31" opacity=".92" />
        <path
          d="M0 640 C80 600 150 650 230 616 C310 582 380 636 430 606 L430 900 L0 900 Z"
          fill="#0A0E1C"
          opacity=".9"
        />
        <path
          d="M0 720 C110 686 190 730 300 700 C360 684 400 700 430 690 L430 900 L0 900 Z"
          fill="#070A15"
          opacity=".95"
        />
        <g opacity=".12" stroke="#F4F1E6" strokeWidth="1.2">
          <path d="M0 560 q60 -18 120 0 t120 0 t120 0 t70 0" fill="none" />
        </g>
      </svg>
      <div className="scene-veil" />
    </div>
  );
}
