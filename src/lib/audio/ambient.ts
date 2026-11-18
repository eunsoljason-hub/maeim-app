export type SoundId = "none" | "rain" | "wave" | "fire";

export const SOUND_OPTIONS: { id: SoundId; label: string }[] = [
  { id: "none", label: "무음" },
  { id: "rain", label: "빗소리" },
  { id: "wave", label: "파도" },
  { id: "fire", label: "장작불" },
];

/**
 * WebAudio ambient noise — no audio files needed, works offline.
 * The real app layers each course's licensed BGM/narration on top when an
 * audio URL is configured (see `audioUrl` in the course seed).
 */
export class AmbientSound {
  private ctx: AudioContext | null = null;
  private source: AudioBufferSourceNode | null = null;
  private lfo: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private current: SoundId = "none";

  get kind() {
    return this.current;
  }

  private ensureContext(): AudioContext | null {
    if (typeof window === "undefined") return null;
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    if (!this.ctx) this.ctx = new Ctor();
    if (this.ctx.state === "suspended") void this.ctx.resume();
    return this.ctx;
  }

  play(kind: SoundId) {
    if (kind === "none") {
      this.stop();
      return;
    }
    try {
      this.start(kind);
    } catch {
      /* AudioContext blocked or unavailable — meditation continues in silence */
      this.teardownNodes();
      this.current = "none";
    }
  }

  private start(kind: SoundId) {
    const ctx = this.ensureContext();
    if (!ctx) return;
    this.teardownNodes();

    const duration = 5;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * duration, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let last = 0;
    for (let i = 0; i < data.length; i += 1) {
      const white = Math.random() * 2 - 1;
      last = (last + 0.02 * white) / 1.02;
      data[i] = last * 3.2;
    }

    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value =
      kind === "rain" ? 2600 : kind === "wave" ? 620 : 340;
    filter.Q.value = 0.6;

    const gain = ctx.createGain();
    gain.gain.value = kind === "rain" ? 0.05 : 0.085;

    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    if (kind === "wave" || kind === "fire") {
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = kind === "wave" ? 0.11 : 0.23;
      lfoGain.gain.value = kind === "wave" ? 0.045 : 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
      this.lfo = lfo;
    }

    source.start();
    this.source = source;
    this.gain = gain;
    this.filter = filter;
    this.current = kind;
  }

  stop() {
    this.teardownNodes();
    this.current = "none";
  }

  private teardownNodes() {
    try {
      this.source?.stop();
      this.source?.disconnect();
    } catch {
      /* already stopped */
    }
    try {
      this.lfo?.stop();
      this.lfo?.disconnect();
    } catch {
      /* already stopped */
    }
    this.gain?.disconnect();
    this.filter?.disconnect();
    this.source = null;
    this.lfo = null;
    this.gain = null;
    this.filter = null;
  }

  dispose() {
    this.teardownNodes();
    if (this.ctx) {
      void this.ctx.close();
      this.ctx = null;
    }
  }
}

const FORMAT_HINT: Record<Exclude<SoundId, "none">, string> = {
  rain: "빗소리",
  wave: "파도",
  fire: "장작불",
};

export function soundLabel(kind: SoundId) {
  if (kind === "none") return "무음";
  return FORMAT_HINT[kind];
}
