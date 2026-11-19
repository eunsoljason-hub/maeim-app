/**
 * 코스믹 워프 진입 효과음 — 우주로 빨려 들어가는 몽환적인 앰비언트.
 *
 * 브라우저 자동재생 정책 때문에, 이 모듈의 `primeWarpAudio()`는 반드시
 * "IN YOU 당신안으로" 버튼의 onClick 같은 사용자 제스처 안에서 호출한다.
 * 그 순간 AudioContext를 만들어 두면, 화면이 바뀐 뒤에도(제스처 밖에서)
 * 소리를 이어서 낼 수 있다. 음원 파일 없이 WebAudio 신스로만 합성한다.
 */

type Ctx = AudioContext;

let ctx: Ctx | null = null;
let master: GainNode | null = null;
let stopTimer: number | null = null;
let active = false;

function ensureContext(): Ctx | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx || ctx.state === "closed") ctx = new Ctor();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

/** 사용자 제스처 안에서 호출 — 컨텍스트를 열고 우주 진입음을 시작한다. */
export function primeWarpAudio() {
  try {
    const audio = ensureContext();
    if (!audio) return;
    if (active) return;
    active = true;
    build(audio);
  } catch {
    /* 오디오를 못 켜도 전환 연출은 그대로 진행한다 */
    active = false;
  }
}

function noiseBuffer(audio: Ctx, seconds: number, shaping = 0.02) {
  const buffer = audio.createBuffer(1, Math.floor(audio.sampleRate * seconds), audio.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    last = (last + shaping * white) / (1 + shaping);
    data[i] = last * 3.4;
  }
  return buffer;
}

function build(audio: Ctx) {
  const now = audio.currentTime;
  const bus = audio.createGain();
  bus.gain.value = 0;
  bus.connect(audio.destination);
  master = bus;

  /* 전체 페이드 인 — 몽환적으로 스며들기 */
  bus.gain.setValueAtTime(0.0001, now);
  bus.gain.exponentialRampToValueAtTime(0.34, now + 1.6);
  bus.gain.setValueAtTime(0.34, now + 3.1);

  /* 1) 저음 드론 — 우주의 바닥 진동 */
  const droneFilter = audio.createBiquadFilter();
  droneFilter.type = "lowpass";
  droneFilter.frequency.setValueAtTime(220, now);
  droneFilter.frequency.linearRampToValueAtTime(640, now + 3.4);
  droneFilter.Q.value = 0.9;
  droneFilter.connect(bus);

  [55, 55.6, 82.5].forEach((freq, index) => {
    const osc = audio.createOscillator();
    osc.type = index === 2 ? "triangle" : "sawtooth";
    osc.frequency.value = freq;
    const g = audio.createGain();
    g.gain.value = index === 2 ? 0.1 : 0.16;
    osc.connect(g);
    g.connect(droneFilter);
    osc.start(now);
    osc.stop(now + 6);
  });

  /* 2) 패드 코드 — 넓게 퍼지는 화음 (A / E / C# / F#) */
  const padFilter = audio.createBiquadFilter();
  padFilter.type = "lowpass";
  padFilter.frequency.value = 1800;
  padFilter.Q.value = 0.4;
  padFilter.connect(bus);

  [220, 329.63, 415.3, 554.37].forEach((freq, index) => {
    const osc = audio.createOscillator();
    osc.type = "sine";
    osc.frequency.value = freq;
    const g = audio.createGain();
    g.gain.value = 0.06 - index * 0.008;
    /* 느린 비브라토로 살아있는 느낌 */
    const lfo = audio.createOscillator();
    const lfoGain = audio.createGain();
    lfo.frequency.value = 0.13 + index * 0.037;
    lfoGain.gain.value = 1.6 + index * 0.5;
    lfo.connect(lfoGain);
    lfoGain.connect(osc.detune);
    lfo.start(now);
    lfo.stop(now + 6);
    osc.connect(g);
    g.connect(padFilter);
    osc.start(now);
    osc.stop(now + 6);
  });

  /* 3) 워프 노이즈 — 위로 솟는 바람 소리 (밴드패스 스윕) */
  const whoosh = audio.createBufferSource();
  whoosh.buffer = noiseBuffer(audio, 5.5);
  whoosh.loop = true;
  const whooshFilter = audio.createBiquadFilter();
  whooshFilter.type = "bandpass";
  whooshFilter.Q.value = 1.1;
  whooshFilter.frequency.setValueAtTime(320, now);
  whooshFilter.frequency.exponentialRampToValueAtTime(3400, now + 2.6);
  whooshFilter.frequency.exponentialRampToValueAtTime(1200, now + 4.2);
  const whooshGain = audio.createGain();
  whooshGain.gain.setValueAtTime(0.0001, now);
  whooshGain.gain.exponentialRampToValueAtTime(0.3, now + 1.5);
  whooshGain.gain.exponentialRampToValueAtTime(0.16, now + 3.2);
  whooshGain.gain.exponentialRampToValueAtTime(0.002, now + 4.6);
  whoosh.connect(whooshFilter);
  whooshFilter.connect(whooshGain);
  whooshGain.connect(bus);
  whoosh.start(now);
  whoosh.stop(now + 5);
  active = true;

  /* 4) 반짝임 — 아주 높은 배음이 천천히 흔들린다 */
  const shimmer = audio.createOscillator();
  shimmer.type = "sine";
  shimmer.frequency.value = 1320;
  const shimmerGain = audio.createGain();
  shimmerGain.gain.setValueAtTime(0.0001, now);
  shimmerGain.gain.exponentialRampToValueAtTime(0.022, now + 2.2);
  shimmerGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.4);
  const trem = audio.createOscillator();
  const tremGain = audio.createGain();
  trem.frequency.value = 3.1;
  tremGain.gain.value = 0.012;
  trem.connect(tremGain);
  tremGain.connect(shimmerGain.gain);
  trem.start(now);
  trem.stop(now + 5);
  shimmer.connect(shimmerGain);
  shimmerGain.connect(bus);
  shimmer.start(now);
  shimmer.stop(now + 5);

  /* 5) 마지막 상승 — 빛으로 빨려 들어가는 한 번의 스웰 */
  const rise = audio.createOscillator();
  rise.type = "sine";
  rise.frequency.setValueAtTime(110, now + 1.4);
  rise.frequency.exponentialRampToValueAtTime(660, now + 3.6);
  const riseGain = audio.createGain();
  riseGain.gain.setValueAtTime(0.0001, now + 1.4);
  riseGain.gain.exponentialRampToValueAtTime(0.14, now + 3.2);
  riseGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.2);
  rise.connect(riseGain);
  riseGain.connect(bus);
  rise.start(now + 1.4);
  rise.stop(now + 4.4);

  if (stopTimer) window.clearTimeout(stopTimer);
  /* 안전장치 — 화면이 정리되지 않아도 소리가 남지 않도록 */
  stopTimer = window.setTimeout(() => stopWarpAudio(1.2), 5200);
}

/** 전환이 끝나거나 건너뛸 때 — 짧게 잦아들며 멈춘다. */
export function stopWarpAudio(fade = 0.9) {
  if (stopTimer) {
    window.clearTimeout(stopTimer);
    stopTimer = null;
  }
  if (!ctx || !master) {
    active = false;
    return;
  }
  try {
    const now = ctx.currentTime;
    const gain = master.gain;
    if (typeof gain.cancelAndHoldAtTime === "function") {
      gain.cancelAndHoldAtTime(now);
    } else {
      const level = Math.max(0.0001, gain.value);
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(level, now);
    }
    gain.exponentialRampToValueAtTime(0.0001, now + Math.max(0.15, fade));
  } catch {
    /* 이미 종료된 컨텍스트 */
  }
  master = null;
  active = false;
}
