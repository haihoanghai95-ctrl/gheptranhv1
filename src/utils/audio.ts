// Web Audio API Synthesizer for Toddler Jigsaw Puzzle

class AudioManager {
  private ctx: AudioContext | null = null;
  private soundEnabled: boolean = true;

  private initContext() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  public setSoundEnabled(enabled: boolean) {
    this.soundEnabled = enabled;
  }

  public isSoundEnabled(): boolean {
    return this.soundEnabled;
  }

  // Soft cheerful pop when tapping or lifting a piece
  public playPop() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const now = this.ctx.currentTime;

      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(580, now + 0.08);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.09);
    } catch {
      // Audio fallback silent
    }
  }

  // Crisp, satisfying snap chime when correctly placing a piece
  public playSnap() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;

      // Note 1 (E5)
      const osc1 = this.ctx.createOscillator();
      const gain1 = this.ctx.createGain();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(659.25, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc1.connect(gain1);
      gain1.connect(this.ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.15);

      // Note 2 (B5) with slight delay for bell chime
      const osc2 = this.ctx.createOscillator();
      const gain2 = this.ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(987.77, now + 0.06);
      gain2.gain.setValueAtTime(0.28, now + 0.06);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc2.connect(gain2);
      gain2.connect(this.ctx.destination);
      osc2.start(now + 0.06);
      osc2.stop(now + 0.28);
    } catch {
      // Audio fallback silent
    }
  }

  // Gentle soft boing when dropped incorrectly
  public playWrong() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(280, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.15);
    } catch {
      // Audio fallback
    }
  }

  // Cheerful victory fanfare when puzzle is completed
  public playFanfare() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const now = this.ctx.currentTime;
      // Melody: C5, E5, G5, C6 triumph
      const notes = [
        { freq: 523.25, start: 0.0, dur: 0.12 },
        { freq: 659.25, start: 0.12, dur: 0.12 },
        { freq: 783.99, start: 0.24, dur: 0.15 },
        { freq: 1046.5, start: 0.42, dur: 0.45 },
      ];

      notes.forEach((note) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(note.freq, now + note.start);

        gain.gain.setValueAtTime(0.24, now + note.start);
        gain.gain.exponentialRampToValueAtTime(0.001, now + note.start + note.dur);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + note.start);
        osc.stop(now + note.start + note.dur);
      });
    } catch {
      // Audio fallback
    }
  }

  // Realistic Enthusiastic Clapping / Applause Synthesizer
  public playApplause() {
    if (!this.soundEnabled) return;
    try {
      this.initContext();
      if (!this.ctx) return;

      const ctx = this.ctx;
      const now = ctx.currentTime;
      const totalDuration = 2.4; // seconds of applause

      // Generate a shared buffer of white noise for the claps
      const bufferSize = Math.floor(ctx.sampleRate * 0.08); // 80ms per individual hand clap
      const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      // Schedule ~45 distinct hand claps clustered naturally like a clapping audience
      const clapCount = 42;
      for (let i = 0; i < clapCount; i++) {
        // Claps are distributed with higher density in the middle
        const progress = i / clapCount;
        const jitter = (Math.random() - 0.5) * 0.08;
        // Natural distribution curve
        const clapTime = now + progress * totalDuration + jitter;
        if (clapTime < now) continue;

        const source = ctx.createBufferSource();
        source.buffer = noiseBuffer;

        // Bandpass filter centered around natural cupped palm frequency (800Hz - 1400Hz)
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 850 + Math.random() * 550;
        filter.Q.value = 2.5 + Math.random() * 2.0;

        // Gain envelope for a sharp snap with quick decay
        const gain = ctx.createGain();
        // Envelope starts loud and fades towards the end of applause
        const volumeProfile = Math.sin(progress * Math.PI) * 0.28 + 0.05;
        const clapVolume = volumeProfile * (0.6 + Math.random() * 0.4);

        gain.gain.setValueAtTime(0.001, clapTime);
        gain.gain.linearRampToValueAtTime(clapVolume, clapTime + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, clapTime + 0.055);

        source.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        source.start(clapTime);
        source.stop(clapTime + 0.06);
      }
    } catch {
      // Audio fallback
    }
  }
}

export const audioManager = new AudioManager();
