/**
 * Fly Bird - Royal Flight
 * High-Speed Arcade Engine, Fairytale Castle Horizon, Silky 60-144Hz Physics,
 * Fair Obstacle Generation, Zero Lag, Seamless Parallax & Beautiful Royal Mascot.
 */

// Canvas roundRect polyfill
if (typeof CanvasRenderingContext2D !== 'undefined' && !CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x, y, w, h, radii) {
    const r = typeof radii === 'number' ? radii : (Array.isArray(radii) ? (radii[0] || 4) : 4);
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

// Robust color parsing (Cached to avoid GC pressure and lag)
function hexToRgb(hex) {
  if (!hex || typeof hex !== 'string') return [30, 60, 100];
  if (hex.startsWith('rgb')) {
    const parts = hex.match(/\d+/g);
    if (parts && parts.length >= 3) {
      return [parseInt(parts[0], 10), parseInt(parts[1], 10), parseInt(parts[2], 10)];
    }
  }
  const clean = hex.replace('#', '');
  if (clean.length === 6) {
    const bigint = parseInt(clean, 16);
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  } else if (clean.length === 3) {
    const r = parseInt(clean[0] + clean[0], 16);
    const g = parseInt(clean[1] + clean[1], 16);
    const b = parseInt(clean[2] + clean[2], 16);
    return [r, g, b];
  }
  return [35, 75, 125];
}

// Real-time Action Synthesizer Frequency Map
const ACTION_NOTE_FREQ = {
  E2: 82.41, G2: 98.00, A2: 110.00, B2: 123.47,
  C3: 130.81, D3: 146.83, Ds3: 155.56, E3: 164.81, Fs3: 185.00, G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, Ds4: 311.13, E4: 329.63, Fs4: 369.99, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, Ds5: 622.25, E5: 659.25, Fs5: 739.99, G5: 783.99, A5: 880.00, B5: 987.77,
  C6: 1046.50, D6: 1174.66, E6: 1318.51
};

class ActionSoundtrack {
  constructor(audioCtx, isMutedGetter) {
    this.ctx = audioCtx;
    this.isMutedGetter = isMutedGetter;
    this.isPlaying = false;
    this.isPaused = false;
    this.tempo = 136;
    this.intensity = 0;
    this.step = 0;
    this.nextStepTime = 0;
    this.timerId = null;
    this.noiseBuffer = null;
    this.musicGain = null;
    this.compressor = null;

    this.initAudioNodes();
    this.initNoiseBuffer();

    const F = ACTION_NOTE_FREQ;
    this.bassPattern = [
      F.E2, F.E3, F.E2, F.E3, F.E2, F.E3, F.G2, F.B2,
      F.E2, F.E3, F.E2, F.E3, F.E2, F.E3, F.B2, F.D3,
      F.C3, F.C4, F.C3, F.C4, F.C3, F.C4, F.E3, F.G3,
      F.C3, F.C4, F.C3, F.C4, F.C3, F.C4, F.G3, F.B3,
      F.D3, F.D4, F.D3, F.D4, F.D3, F.D4, F.Fs3, F.A3,
      F.D3, F.D4, F.D3, F.D4, F.D3, F.D4, F.A3, F.C4,
      F.B2, F.B3, F.B2, F.B3, F.B2, F.B3, F.Ds3, F.Fs3,
      F.B2, F.B3, F.B2, F.B3, F.B2, F.Ds3, F.Fs3, F.A3
    ];

    this.leadPattern = [
      F.E4, null, F.G4, null, F.B4, null, F.E5, null,
      F.D5, null, F.B4, null, F.A4, null, F.B4, null,
      F.G4, null, F.A4, null, F.B4, null, F.D5, null,
      F.C5, null, F.A4, null, F.G4, null, F.E4, null,
      F.Fs4, null, F.A4, null, F.D5, null, F.Fs5, null,
      F.E5, null, F.D5, null, F.A4, null, F.D5, null,
      F.B4, null, F.Ds5, null, F.Fs5, null, F.A5, null,
      F.G5, null, F.Fs5, null, F.Ds5, null, F.B4, null
    ];

    this.arpPattern = [
      F.E5, F.G5, F.B5, F.E6, F.B5, F.G5, F.E5, F.B4,
      F.E5, F.G5, F.B5, F.E6, F.B5, F.G5, F.B5, F.E6,
      F.C5, F.E5, F.G5, F.C6, F.G5, F.E5, F.C5, F.G4,
      F.C5, F.E5, F.G5, F.C6, F.G5, F.E5, F.G5, F.C6,
      F.D5, F.Fs5, F.A5, F.D6, F.A5, F.Fs5, F.D5, F.A4,
      F.D5, F.Fs5, F.A5, F.D6, F.A5, F.Fs5, F.A5, F.D6,
      F.B4, F.Ds5, F.Fs5, F.B5, F.Fs5, F.Ds5, F.B4, F.Fs4,
      F.B4, F.Ds5, F.Fs5, F.B5, F.Fs5, F.Ds5, F.Fs5, F.B5
    ];
  }

  isMuted() {
    return typeof this.isMutedGetter === 'function' ? this.isMutedGetter() : false;
  }

  initAudioNodes() {
    if (!this.ctx || this.musicGain) return;
    try {
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-18, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(12, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.isMuted() ? 0 : 0.22, this.ctx.currentTime);

      this.musicGain.connect(this.compressor);
      this.compressor.connect(this.ctx.destination);
    } catch (e) {}
  }

  initNoiseBuffer() {
    if (this.noiseBuffer || !this.ctx) return;
    try {
      const sampleRate = this.ctx.sampleRate || 44100;
      const bufferSize = Math.floor(sampleRate * 0.4);
      this.noiseBuffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
      const output = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
    } catch (e) {}
  }

  triggerKick(time) {
    if (!this.ctx || this.isMuted()) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(150, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

      gain.gain.setValueAtTime(0.7, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.13);
    } catch (e) {}
  }

  triggerSnare(time) {
    if (!this.ctx || this.isMuted() || !this.noiseBuffer) return;
    try {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, time);
      filter.Q.setValueAtTime(1.2, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.32, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.musicGain);

      noise.start(time);
      noise.stop(time + 0.15);

      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

      oscGain.gain.setValueAtTime(0.35, time);
      oscGain.gain.exponentialRampToValueAtTime(0.001, time + 0.09);

      osc.connect(oscGain);
      oscGain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.1);
    } catch (e) {}
  }

  triggerHiHat(time, open = false) {
    if (!this.ctx || this.isMuted() || !this.noiseBuffer) return;
    try {
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'highpass';
      filter.frequency.setValueAtTime(7500, time);

      const gain = this.ctx.createGain();
      const dur = open ? 0.11 : 0.04;
      gain.gain.setValueAtTime(open ? 0.2 : 0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      noise.start(time);
      noise.stop(time + dur + 0.01);
    } catch (e) {}
  }

  triggerBass(freq, time, dur = 0.14) {
    if (!this.ctx || this.isMuted() || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(700, time);
      filter.frequency.exponentialRampToValueAtTime(220, time + dur);

      gain.gain.setValueAtTime(0.38, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + dur + 0.01);
    } catch (e) {}
  }

  triggerLead(freq, time, dur = 0.16) {
    if (!this.ctx || this.isMuted() || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(2600, time);
      filter.frequency.exponentialRampToValueAtTime(900, time + dur);

      gain.gain.setValueAtTime(0.24, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + dur + 0.01);
    } catch (e) {}
  }

  triggerArp(freq, time, dur = 0.07) {
    if (!this.ctx || this.isMuted() || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.18, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + dur + 0.01);
    } catch (e) {}
  }

  playStep(stepIdx, time) {
    if (stepIdx % 4 === 0) {
      this.triggerKick(time);
    }
    if (stepIdx % 8 === 4) {
      this.triggerSnare(time);
    }
    const isOffbeat = (stepIdx % 2 === 1);
    this.triggerHiHat(time, isOffbeat && stepIdx % 4 === 2);

    const bassNote = this.bassPattern[stepIdx];
    if (bassNote) {
      this.triggerBass(bassNote, time, 0.12);
    }

    const leadNote = this.leadPattern[stepIdx];
    if (leadNote) {
      this.triggerLead(leadNote, time, 0.16);
    }

    if (this.intensity >= 1) {
      const arpNote = this.arpPattern[stepIdx];
      if (arpNote) {
        this.triggerArp(arpNote, time);
      }
    }
  }

  scheduler() {
    if (!this.isPlaying || this.isPaused || !this.ctx) return;
    try {
      const secPerBeat = 60.0 / this.tempo;
      const secPerStep = secPerBeat / 4;

      while (this.nextStepTime < this.ctx.currentTime + 0.1) {
        this.playStep(this.step, this.nextStepTime);
        this.nextStepTime += secPerStep;
        this.step = (this.step + 1) % 64;
      }
    } catch (e) {}
  }

  start() {
    if (this.isPlaying && !this.isPaused) return;
    if (!this.ctx) return;

    this.initAudioNodes();
    this.initNoiseBuffer();

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    this.isPaused = false;
    this.step = 0;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    const targetVol = this.isMuted() ? 0 : 0.22;
    if (this.musicGain) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.setValueAtTime(this.musicGain.gain.value, this.ctx.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.1);
      } catch (e) {}
    }

    clearInterval(this.timerId);
    this.timerId = setInterval(() => this.scheduler(), 30);
  }

  pause() {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.05);
      } catch (e) {}
    }
    clearInterval(this.timerId);
    this.timerId = null;
  }

  resume() {
    if (!this.isPlaying || !this.isPaused) return;
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    this.isPaused = false;
    this.nextStepTime = this.ctx.currentTime + 0.05;

    const targetVol = this.isMuted() ? 0 : 0.22;
    if (this.musicGain) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(targetVol, this.ctx.currentTime + 0.08);
      } catch (e) {}
    }

    clearInterval(this.timerId);
    this.timerId = setInterval(() => this.scheduler(), 30);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = false;
    this.step = 0;
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.1);
      } catch (e) {}
    }
    clearInterval(this.timerId);
    this.timerId = null;
  }

  setMuted(muted) {
    if (!this.musicGain || !this.ctx) return;
    try {
      const target = muted ? 0 : (this.isPlaying && !this.isPaused ? 0.22 : 0);
      this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.musicGain.gain.linearRampToValueAtTime(target, this.ctx.currentTime + 0.05);
    } catch (e) {}
  }

  setIntensity(level) {
    this.intensity = level;
    if (level >= 2) {
      this.tempo = 144;
    } else if (level === 1) {
      this.tempo = 140;
    } else {
      this.tempo = 136;
    }
  }
}

class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('flybird_muted') === 'true';
    this.music = null;
    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
        this.music = new ActionSoundtrack(this.ctx, () => this.muted);
      }
    } catch (e) {}
  }

  ensureContext() {
    if (!this.ctx) this.initAudio();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('flybird_muted', this.muted);
    if (this.music) {
      this.music.setMuted(this.muted);
    }
    return this.muted;
  }

  startMusic() {
    this.ensureContext();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().then(() => {
        if (this.music) this.music.start();
      }).catch(() => {});
    } else if (this.music) {
      this.music.start();
    }
  }

  pauseMusic() {
    if (this.music) this.music.pause();
  }

  resumeMusic() {
    this.ensureContext();
    if (this.music) this.music.resume();
  }

  stopMusic() {
    if (this.music) this.music.stop();
  }

  setMusicIntensity(level) {
    if (this.music) this.music.setIntensity(level);
  }

  playFlap() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(860, now + 0.1);

      gain.gain.setValueAtTime(0.26, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.11);
    } catch (e) {}
  }

  playCoin() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      [1174, 1760, 2349].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const delay = idx * 0.05;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.28, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.24);
      });
    } catch (e) {}
  }

  playScore() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659, now);
      osc.frequency.setValueAtTime(987, now + 0.07);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.19);
    } catch (e) {}
  }

  playHit() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(140, now);
      osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.17);
    } catch (e) {}
  }

  playGameOver() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349, 293];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.24);
      });
    } catch (e) {}
  }

  playLevelUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;
    try {
      const now = this.ctx.currentTime;
      const chords = [523.25, 659.25, 783.99, 1046.50];
      chords.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.06;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.24, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.38);
      });
    } catch (e) {}
  }
}

// Funny English Death Quotes
const FUNNY_DEATH_QUOTES = [
  "Emotional damage! 💀",
  "Gravity: 1, Royal Bird: 0.",
  "That pipe came out of nowhere, right?",
  "Ouch. Even the crown felt that one.",
  "Those pipes have personal beef with you.",
  "Did someone grease the airspace?",
  "Flapping wings is hard work, okay?",
  "Fly higher next time, Your Majesty!",
  "Bonk of the Century! 🔔",
  "At least your crown stayed shiny! 👑"
];

// Rich Fairytale Color Themes with Complete Grounding
const THEMES = [
  {
    id: 0,
    name: "☀️ Day",
    skyTop: "#1976d2",
    skyMid: "#42a5f5",
    skyBot: "#bbdefb",
    sunColor: "#fffde7",
    sunGlow: "rgba(255, 245, 157, 0.45)",
    sunY: 130,
    showMoon: false,
    cloudColor: "#ffffff",
    cloudShade: "#e1f5fe",
    mountainFar: "#7eaad6",
    mountainMid: "#4779aa",
    castleStone: "#546e7a",
    castleStoneLight: "#90a4ae",
    castleStoneDark: "#37474f",
    castleRoof: "#1565c0",
    castleRoofHighlight: "#42a5f5",
    castleWindow: "#fff59d",
    castleWindowGlow: "rgba(255, 245, 157, 0.6)",
    hillBack: "#43a047",
    hillFront: "#2e7d32",
    hillHighlight: "#66bb6a",
    pipeBase: "#388e3c",
    pipeHighlight: "#81c784",
    pipeShadow: "#1b5e20",
    pipeOutline: "#0d3c10",
    hasFireflies: false
  },
  {
    id: 1,
    name: "🌅 Sunset",
    skyTop: "#2d0a4e",
    skyMid: "#b71c1c",
    skyBot: "#ff9800",
    sunColor: "#ff7043",
    sunGlow: "rgba(255, 112, 67, 0.55)",
    sunY: 260,
    showMoon: false,
    cloudColor: "#ffe0b2",
    cloudShade: "#ad1457",
    mountainFar: "#5c1b63",
    mountainMid: "#3e0f44",
    castleStone: "#4a284e",
    castleStoneLight: "#7b4b80",
    castleStoneDark: "#2c1230",
    castleRoof: "#880e4f",
    castleRoofHighlight: "#ec407a",
    castleWindow: "#ffd54f",
    castleWindowGlow: "rgba(255, 213, 79, 0.7)",
    hillBack: "#5d4037",
    hillFront: "#3e2723",
    hillHighlight: "#8d6e63",
    pipeBase: "#558b2f",
    pipeHighlight: "#9ccc65",
    pipeShadow: "#33691e",
    pipeOutline: "#1b3e0e",
    hasFireflies: true
  },
  {
    id: 2,
    name: "🌙 Midnight",
    skyTop: "#030712",
    skyMid: "#0a1329",
    skyBot: "#132147",
    sunColor: "#ffffff",
    sunGlow: "rgba(255, 255, 255, 0.2)",
    sunY: -100,
    showMoon: true,
    cloudColor: "#152042",
    cloudShade: "#091026",
    mountainFar: "#0e1a38",
    mountainMid: "#070e22",
    castleStone: "#1e293b",
    castleStoneLight: "#334155",
    castleStoneDark: "#0f172a",
    castleRoof: "#1e3a8a",
    castleRoofHighlight: "#3b82f6",
    castleWindow: "#fde047",
    castleWindowGlow: "rgba(253, 224, 71, 0.85)",
    hillBack: "#143317",
    hillFront: "#0a1f0d",
    hillHighlight: "#2e7d32",
    pipeBase: "#1b5e20",
    pipeHighlight: "#4caf50",
    pipeShadow: "#0d3b13",
    pipeOutline: "#051f08",
    hasFireflies: true
  }
];

// Pre-calculate numerical RGB palettes for zero-garbage 60-144Hz color interpolation
const THEME_RGB = THEMES.map(theme => {
  const result = {};
  for (const k in theme) {
    if (typeof theme[k] === 'string' && theme[k].startsWith('#')) {
      result[k] = hexToRgb(theme[k]);
    }
  }
  return result;
});

function fastLerpColor(key, prevIdx, currIdx, t) {
  const c1 = THEME_RGB[prevIdx]?.[key] || [50, 80, 120];
  const c2 = THEME_RGB[currIdx]?.[key] || [50, 80, 120];
  const r = (c1[0] + (c2[0] - c1[0]) * t) | 0;
  const g = (c1[1] + (c2[1] - c1[1]) * t) | 0;
  const b = (c1[2] + (c2[2] - c1[2]) * t) | 0;
  return `rgb(${r},${g},${b})`;
}

// Arcade Game & Physics Configuration
const CONFIG = {
  V_WIDTH: 440,
  V_HEIGHT: 740,
  GRAVITY: 0.38,
  FLAP_POWER: -7.5,
  MAX_FALL_SPEED: 11.5,
  PIPE_SPEED_BASE: 3.2,
  PIPE_GAP: 175,           // Generous, fair gap
  PIPE_WIDTH: 72,
  MIN_PIPE_SPACING: 260,   // Guaranteed horizontal clearance (NEVER overlaps)
  GROUND_HEIGHT: 95
};

// ==========================================
// GAME ENGINE
// ==========================================
class FlyBirdGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.sound = new SoundFX();

    // DOM Elements
    this.startScreen = document.getElementById('start-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.inGameScoreEl = document.getElementById('in-game-score');
    this.coinCountEl = document.getElementById('coin-count');
    this.realmIndicatorEl = document.getElementById('realm-indicator');
    this.realmPillEl = document.getElementById('realm-pill');
    this.bestScoreDisplay = document.getElementById('best-score-display');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalBestEl = document.getElementById('final-best');
    this.newRecordTag = document.getElementById('new-record-tag');
    this.finalCoinsEl = document.getElementById('final-coins');
    this.finalRealmEl = document.getElementById('final-realm');
    this.funnyQuoteEl = document.getElementById('funny-quote');
    this.medalDisplayEl = document.getElementById('medal-display');
    this.muteBtn = document.getElementById('mute-btn');
    this.pauseBtn = document.getElementById('pause-btn');

    // Game State
    this.state = 'START';
    this.score = 0;
    this.coins = 0;
    this.totalCoins = parseInt(localStorage.getItem('flybird_coins') || '0', 10);
    this.bestScore = parseInt(localStorage.getItem('flybird_best') || '0', 10);
    this.frame = 0;
    this.speed = CONFIG.PIPE_SPEED_BASE;
    this.shakeTime = 0;
    this.gameOverDelay = 0;

    // Theme state
    this.activeThemeIdx = 0;
    this.prevThemeIdx = 0;
    this.themeTransition = 1.0;

    // Player Bird
    this.bird = {
      x: 110,
      y: CONFIG.V_HEIGHT / 2 - 35,
      vy: 0,
      radius: 19,
      angle: 0,
      wingTimer: 0,
      blinkTimer: 0,
      isBlinking: false
    };

    // Obstacle tracking
    this.pipes = [];
    this.lastPipeTopHeight = null;
    this.coinItems = [];
    this.particles = [];
    this.goldSparkles = [];
    this.floatingTexts = [];
    this.clouds = [];
    this.stars = [];
    this.fireflies = [];

    // Smooth Parallax Scenery Offsets
    this.castleScroll = 0;
    this.farMountainScroll = 0;
    this.midMountainScroll = 0;
    this.hillScroll = 0;
    this.groundScroll = 0;

    // Fixed-timestep Game Loop Accumulator
    this.accumulator = 0;
    this.lastTime = performance.now();
    this.lastActionTimestamp = 0;

    this.initAtmosphere();
    this.setupResolution();
    this.bindEvents();
    this.updateHUD();

    requestAnimationFrame((t) => this.loop(t));
  }

  setupResolution() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.width = CONFIG.V_WIDTH;
    this.height = CONFIG.V_HEIGHT;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    if (this.ctx.resetTransform) {
      this.ctx.resetTransform();
    }
    this.ctx.scale(dpr, dpr);
    this.ctx.imageSmoothingEnabled = true;
    this.ctx.imageSmoothingQuality = 'high';
  }

  initAtmosphere() {
    this.clouds = [];
    for (let i = 0; i < 5; i++) {
      this.clouds.push({
        x: Math.random() * CONFIG.V_WIDTH,
        y: 40 + Math.random() * 180,
        scale: 0.7 + Math.random() * 0.6,
        speed: 0.25 + Math.random() * 0.4
      });
    }

    this.stars = [];
    for (let i = 0; i < 40; i++) {
      this.stars.push({
        x: Math.random() * CONFIG.V_WIDTH,
        y: Math.random() * (CONFIG.V_HEIGHT * 0.65),
        radius: 0.8 + Math.random() * 1.8,
        twinkleSpeed: 0.03 + Math.random() * 0.05,
        twinklePhase: Math.random() * Math.PI * 2
      });
    }

    this.fireflies = [];
    for (let i = 0; i < 18; i++) {
      this.fireflies.push({
        x: Math.random() * CONFIG.V_WIDTH,
        y: 200 + Math.random() * (CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - 220),
        vx: (Math.random() - 0.5) * 1.0,
        vy: (Math.random() - 0.5) * 0.6,
        pulseSpeed: 0.05 + Math.random() * 0.05,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  bindEvents() {
    window.addEventListener('resize', () => this.setupResolution());

    const handleAction = (e) => {
      const now = performance.now();
      if (now - this.lastActionTimestamp < 60) return;
      this.lastActionTimestamp = now;

      if (e && e.target) {
        if (e.target.closest('#mute-btn') || e.target.closest('#pause-btn')) return;
      }

      this.sound.ensureContext();

      if (this.state === 'START') {
        this.startGame();
      } else if (this.state === 'PLAYING') {
        this.flap();
      } else if (this.state === 'GAMEOVER') {
        if (this.gameOverDelay <= 0) {
          this.resetGame();
        }
      }
    };

    // Direct touch & pointer events
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleAction(e);
    }, { passive: false });

    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') {
        e.preventDefault();
        handleAction(e);
      }
    });

    const wrapper = document.getElementById('game-wrapper');
    wrapper.addEventListener('touchstart', (e) => {
      if (!e.target.closest('button')) {
        e.preventDefault();
        handleAction(e);
      }
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault();
        handleAction(null);
      } else if (e.code === 'Escape' || e.code === 'KeyP') {
        this.togglePause();
      } else if (e.code === 'KeyM') {
        this.toggleMute();
      }
    });

    const tapBtn = document.getElementById('tap-to-fly-btn');
    if (tapBtn) {
      const onBtnTap = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAction(null);
      };
      tapBtn.addEventListener('touchstart', onBtnTap, { passive: false });
      tapBtn.addEventListener('click', onBtnTap);
    }

    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      const onRestart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resetGame();
      };
      playAgainBtn.addEventListener('touchstart', onRestart, { passive: false });
      playAgainBtn.addEventListener('click', onRestart);
    }

    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      const onResume = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePause();
      };
      resumeBtn.addEventListener('touchstart', onResume, { passive: false });
      resumeBtn.addEventListener('click', onResume);
    }

    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    if (pauseRestartBtn) {
      const onPauseRestart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resetGame();
      };
      pauseRestartBtn.addEventListener('touchstart', onPauseRestart, { passive: false });
      pauseRestartBtn.addEventListener('click', onPauseRestart);
    }

    this.muteBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleMute();
    });

    this.pauseBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      this.togglePause();
    });

    this.updateMuteIcon();
  }

  toggleMute() {
    this.sound.toggleMute();
    this.updateMuteIcon();
  }

  updateMuteIcon() {
    const isMuted = this.sound.muted;
    const svgEl = document.getElementById('sound-icon-svg');
    if (svgEl) {
      if (isMuted) {
        svgEl.innerHTML = '<path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>';
      } else {
        svgEl.innerHTML = '<path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>';
      }
    }
  }

  startGame() {
    this.state = 'PLAYING';
    this.startScreen.classList.remove('active');
    this.gameoverScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.bird.vy = CONFIG.FLAP_POWER;
    this.sound.playFlap();
    this.sound.startMusic();
    this.spawnFeathers();
  }

  flap() {
    if (this.state !== 'PLAYING') return;
    this.bird.vy = CONFIG.FLAP_POWER;
    this.bird.wingTimer = 1.0;
    this.sound.playFlap();
    this.spawnFeathers();

    // Golden sparkles around crown
    for (let i = 0; i < 3; i++) {
      this.goldSparkles.push({
        x: this.bird.x + (Math.random() - 0.5) * 16,
        y: this.bird.y - 18 + (Math.random() - 0.5) * 8,
        vx: -2.2 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2,
        size: 2.5 + Math.random() * 2,
        alpha: 1,
        life: 25
      });
    }
  }

  togglePause() {
    if (this.state === 'PLAYING') {
      this.state = 'PAUSED';
      this.pauseScreen.classList.add('active');
      this.sound.pauseMusic();
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.pauseScreen.classList.remove('active');
      this.lastTime = performance.now();
      this.accumulator = 0;
      this.sound.resumeMusic();
    }
  }

  resetGame() {
    this.state = 'START';
    this.sound.stopMusic();
    this.sound.setMusicIntensity(0);
    this.score = 0;
    this.coins = 0;
    this.frame = 0;
    this.speed = CONFIG.PIPE_SPEED_BASE;
    this.shakeTime = 0;
    this.activeThemeIdx = 0;
    this.prevThemeIdx = 0;
    this.themeTransition = 1.0;
    this.pipes = [];
    this.lastPipeTopHeight = null;
    this.coinItems = [];
    this.particles = [];
    this.goldSparkles = [];
    this.floatingTexts = [];
    this.accumulator = 0;

    this.bird.x = 110;
    this.bird.y = CONFIG.V_HEIGHT / 2 - 35;
    this.bird.vy = 0;
    this.bird.angle = 0;

    this.startScreen.classList.add('active');
    this.gameoverScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.updateHUD();
  }

  checkThemeMilestones() {
    let targetIdx = 0;
    if (this.score >= 25) {
      targetIdx = 2; // Midnight
    } else if (this.score >= 10) {
      targetIdx = 1; // Sunset
    } else {
      targetIdx = 0; // Daytime
    }

    if (targetIdx !== this.activeThemeIdx) {
      this.prevThemeIdx = this.activeThemeIdx;
      this.activeThemeIdx = targetIdx;
      this.themeTransition = 0.0;
      
      if (this.realmIndicatorEl) {
        this.realmIndicatorEl.textContent = THEMES[targetIdx].name;
      }
      if (this.realmPillEl) {
        this.realmPillEl.classList.remove('realm-glow-pop');
        void this.realmPillEl.offsetWidth;
        this.realmPillEl.classList.add('realm-glow-pop');
      }

      this.sound.setMusicIntensity(targetIdx);
      this.sound.playLevelUp();
    }
  }

  gameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.sound.stopMusic();
    this.gameOverDelay = 22;
    this.shakeTime = 18;

    this.sound.playHit();
    setTimeout(() => this.sound.playGameOver(), 180);

    const isNewBest = this.score > this.bestScore;
    if (isNewBest) {
      this.bestScore = this.score;
      localStorage.setItem('flybird_best', this.bestScore);
    }
    this.totalCoins += this.coins;
    localStorage.setItem('flybird_coins', this.totalCoins);

    this.finalScoreEl.textContent = this.score;
    this.finalBestEl.textContent = this.bestScore;
    this.finalCoinsEl.textContent = `+${this.coins}`;
    this.finalRealmEl.textContent = THEMES[this.activeThemeIdx].name;

    if (this.funnyQuoteEl) {
      const randomQuote = FUNNY_DEATH_QUOTES[Math.floor(Math.random() * FUNNY_DEATH_QUOTES.length)];
      this.funnyQuoteEl.textContent = randomQuote;
    }

    if (this.newRecordTag) {
      this.newRecordTag.style.display = isNewBest && this.score > 0 ? 'inline-block' : 'none';
    }

    let medal = 'None';
    let icon = '—';
    if (this.score >= 50) {
      medal = 'Giga-King of the Sky 👑';
      icon = '👑';
    } else if (this.score >= 25) {
      medal = 'Golden Chad 🥇';
      icon = '🥇';
    } else if (this.score >= 15) {
      medal = 'Silver Eagle 🥈';
      icon = '🥈';
    } else if (this.score >= 7) {
      medal = 'Bronze Wing 🥉';
      icon = '🥉';
    } else {
      medal = 'Moldy Potato 🥔';
      icon = '🥔';
    }
    this.medalDisplayEl.innerHTML = `<span class="medal-icon">${icon}</span> ${medal}`;

    this.gameoverScreen.classList.add('active');
    this.updateHUD();

    // Explosion particles
    for (let i = 0; i < 28; i++) {
      const angle = (Math.PI * 2 * i) / 28;
      const speed = 2 + Math.random() * 6;
      this.particles.push({
        x: this.bird.x,
        y: this.bird.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 4 + Math.random() * 6,
        color: ['#ffeb3b', '#ff9800', '#f44336', '#ffffff'][Math.floor(Math.random() * 4)],
        alpha: 1,
        life: 38
      });
    }
  }

  updateHUD() {
    if (this.inGameScoreEl) {
      this.inGameScoreEl.textContent = this.score;
      this.inGameScoreEl.style.display = this.state === 'PLAYING' ? 'block' : 'none';
    }
    if (this.coinCountEl) {
      this.coinCountEl.textContent = this.state === 'PLAYING' ? this.coins : this.totalCoins;
    }
    if (this.bestScoreDisplay) {
      this.bestScoreDisplay.textContent = this.bestScore;
    }
    if (this.realmIndicatorEl) {
      this.realmIndicatorEl.textContent = THEMES[this.activeThemeIdx].name;
    }
  }

  // ==========================================
  // FAIR, BUG-FREE OBSTACLE SPAWNING
  // Never closes up, never overlaps, smooth continuity!
  // ==========================================
  spawnPipes() {
    const minTop = 85;
    const maxTop = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - CONFIG.PIPE_GAP - 90;
    let topHeight = minTop + Math.random() * (maxTop - minTop);

    // Continuity clamp: gap height never jumps more than 125px from previous pipe!
    if (this.lastPipeTopHeight !== null) {
      const maxJump = 125;
      const lower = Math.max(minTop, this.lastPipeTopHeight - maxJump);
      const upper = Math.min(maxTop, this.lastPipeTopHeight + maxJump);
      topHeight = lower + Math.random() * (upper - lower);
    }
    this.lastPipeTopHeight = topHeight;

    const pipeX = CONFIG.V_WIDTH + 40;
    const bottomY = topHeight + CONFIG.PIPE_GAP;

    const newPipe = {
      x: pipeX,
      topHeight: topHeight,
      bottomY: bottomY,
      width: CONFIG.PIPE_WIDTH,
      passed: false
    };

    this.pipes.push(newPipe);

    // Center coin
    if (Math.random() < 0.72) {
      this.coinItems.push({
        x: pipeX + CONFIG.PIPE_WIDTH / 2,
        y: topHeight + CONFIG.PIPE_GAP / 2,
        radius: 13,
        collected: false,
        bobPhase: Math.random() * Math.PI * 2
      });
    }
  }

  spawnFeathers() {
    for (let i = 0; i < 5; i++) {
      const angle = Math.PI * 0.75 + (Math.random() - 0.5) * 0.8;
      const speed = 2.0 + Math.random() * 2.5;
      this.particles.push({
        x: this.bird.x - 16 + Math.random() * 6,
        y: this.bird.y + 4 + Math.random() * 8,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3.2 + Math.random() * 3,
        color: ['#ffffff', '#e1f5fe', '#bbdefb'][Math.floor(Math.random() * 3)],
        alpha: 0.9,
        life: 20
      });
    }
  }

  spawnCoinSparkles(x, y) {
    for (let i = 0; i < 16; i++) {
      const angle = (Math.PI * 2 * i) / 16 + Math.random() * 0.2;
      const speed = 2.5 + Math.random() * 4.5;
      this.particles.push({
        x: x,
        y: y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 4.5,
        color: ['#fff9c4', '#ffca28', '#ff9800', '#ffffff'][Math.floor(Math.random() * 4)],
        alpha: 1,
        life: 26
      });
    }
  }

  // ==========================================
  // PHYSICS & UPDATE STEP (Guaranteed 60Hz tick, No Lag)
  // ==========================================
  update() {
    if (this.state === 'PAUSED') return;

    this.frame++;
    if (this.gameOverDelay > 0) this.gameOverDelay--;
    if (this.shakeTime > 0) this.shakeTime--;

    if (this.themeTransition < 1.0) {
      this.themeTransition = Math.min(1.0, this.themeTransition + 0.025);
    }

    this.fireflies.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      f.pulsePhase += f.pulseSpeed;
      if (f.x < -20) f.x = CONFIG.V_WIDTH + 20;
      if (f.x > CONFIG.V_WIDTH + 20) f.x = -20;
    });

    if (this.state === 'START') {
      this.bird.y = CONFIG.V_HEIGHT / 2 - 35 + Math.sin(this.frame * 0.09) * 12;
      this.bird.angle = Math.sin(this.frame * 0.09) * 0.08;
      this.bird.wingTimer += 0.08;
      this.scrollScenery(1.8);

      // Subtle royal flight dust while hovering
      if (this.frame % 10 === 0) {
        this.goldSparkles.push({
          x: this.bird.x - 22 + (Math.random() - 0.5) * 6,
          y: this.bird.y + 6 + (Math.random() - 0.5) * 6,
          vx: -1.2 - Math.random() * 0.8,
          vy: (Math.random() - 0.5) * 0.8,
          size: 1.8 + Math.random() * 1.5,
          alpha: 0.8,
          life: 20
        });
      }
      return;
    }

    if (this.state === 'GAMEOVER') {
      if (this.bird.y + this.bird.radius < CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT) {
        this.bird.vy += CONFIG.GRAVITY * 1.3;
        this.bird.y += this.bird.vy;
        this.bird.angle = Math.min(Math.PI / 2, this.bird.angle + 0.14);
      }
      this.updateParticles();
      return;
    }

    // PLAYING STATE:
    this.scrollScenery(this.speed);
    this.speed = CONFIG.PIPE_SPEED_BASE + Math.min(1.8, Math.floor(this.score / 10) * 0.18);

    // Bird physics
    this.bird.vy += CONFIG.GRAVITY;
    this.bird.vy = Math.min(this.bird.vy, CONFIG.MAX_FALL_SPEED);
    this.bird.y += this.bird.vy;

    // Smooth rotational banking
    const targetAngle = this.bird.vy < 0 
      ? Math.max(-0.45, this.bird.vy * 0.065) 
      : Math.min(1.2, this.bird.vy * 0.1);
    this.bird.angle += (targetAngle - this.bird.angle) * 0.18;

    this.bird.wingTimer += (this.bird.vy < 0 ? 0.3 : 0.09);

    // Trailing golden dust in flight
    if (this.frame % 5 === 0) {
      this.goldSparkles.push({
        x: this.bird.x - 24 + (Math.random() - 0.5) * 6,
        y: this.bird.y + 4 + (Math.random() - 0.5) * 6,
        vx: -1.8 - Math.random() * 1.2,
        vy: (Math.random() - 0.5) * 1.0,
        size: 2.0 + Math.random() * 1.8,
        alpha: 0.9,
        life: 22
      });
    }

    // Blinking
    this.bird.blinkTimer++;
    if (this.bird.blinkTimer > 170 && Math.random() < 0.08) {
      this.bird.isBlinking = true;
      if (this.bird.blinkTimer > 182) {
        this.bird.isBlinking = false;
        this.bird.blinkTimer = 0;
      }
    }

    // ==========================================
    // GUARANTEED DISTANCE PIPE SPAWNING
    // (Prevents any overlapping obstacles or impassable walls!)
    // ==========================================
    let canSpawn = false;
    if (this.pipes.length === 0) {
      canSpawn = true;
    } else {
      const lastPipe = this.pipes[this.pipes.length - 1];
      const requiredSpacing = Math.max(250, CONFIG.MIN_PIPE_SPACING - Math.min(25, Math.floor(this.score / 10) * 4));
      if ((CONFIG.V_WIDTH + 40) - lastPipe.x >= requiredSpacing) {
        canSpawn = true;
      }
    }
    if (canSpawn) {
      this.spawnPipes();
    }

    // Bird Collision Box (Forgiving, fair boundary)
    const birdBox = {
      x: this.bird.x - 13,
      y: this.bird.y - 13,
      w: 26,
      h: 26
    };

    // Update Pipes
    for (let i = this.pipes.length - 1; i >= 0; i--) {
      const p = this.pipes[i];
      p.x -= this.speed;

      if (!p.passed && p.x + p.width < this.bird.x) {
        p.passed = true;
        this.score++;
        this.sound.playScore();
        this.checkThemeMilestones();
        this.updateHUD();

        // Floating score popup effect
        this.floatingTexts.push({
          x: this.bird.x + 18,
          y: this.bird.y - 20,
          text: '+1',
          color: '#ffffff',
          alpha: 1,
          scale: 1
        });

        if (this.inGameScoreEl) {
          this.inGameScoreEl.classList.remove('score-pop');
          void this.inGameScoreEl.offsetWidth;
          this.inGameScoreEl.classList.add('score-pop');
        }
      }

      if (this.checkPipeCollision(birdBox, p)) {
        this.gameOver();
        return;
      }

      if (p.x + p.width < -60) {
        this.pipes.splice(i, 1);
      }
    }

    // Update Coins
    for (let i = this.coinItems.length - 1; i >= 0; i--) {
      const c = this.coinItems[i];
      c.x -= this.speed;
      c.bobPhase += 0.1;

      const currentY = c.y + Math.sin(c.bobPhase) * 6;
      const dx = this.bird.x - c.x;
      const dy = this.bird.y - currentY;
      const dist = Math.hypot(dx, dy);

      if (!c.collected && dist < this.bird.radius + c.radius) {
        c.collected = true;
        this.coins++;
        this.score += 2;
        this.sound.playCoin();
        this.spawnCoinSparkles(c.x, currentY);

        this.floatingTexts.push({
          x: c.x,
          y: currentY - 14,
          text: '+2 👑',
          color: '#ffd54f',
          alpha: 1,
          scale: 1.15
        });

        this.checkThemeMilestones();
        this.updateHUD();
        this.coinItems.splice(i, 1);
        continue;
      }

      if (c.x < -40) {
        this.coinItems.splice(i, 1);
      }
    }

    // Floating text update
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ft.y -= 1.3;
      ft.alpha -= 0.035;
      if (ft.alpha <= 0) {
        this.floatingTexts.splice(i, 1);
      }
    }

    // Ceiling & Floor
    if (this.bird.y - this.bird.radius <= 0) {
      this.bird.y = this.bird.radius;
      this.bird.vy = 0;
    }

    const groundTop = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT;
    if (this.bird.y + this.bird.radius >= groundTop) {
      this.bird.y = groundTop - this.bird.radius;
      this.gameOver();
      return;
    }

    this.updateParticles();
  }

  scrollScenery(amt) {
    this.groundScroll = (this.groundScroll + amt) % 36;
    this.hillScroll = (this.hillScroll + amt * 0.45) % 240;
    this.midMountainScroll = (this.midMountainScroll + amt * 0.09) % 400;
    this.farMountainScroll = (this.farMountainScroll + amt * 0.04) % 440;
    this.castleScroll = (this.castleScroll + amt * 0.14) % 650;

    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * (amt / 2);
      if (cloud.x < -140) {
        cloud.x = CONFIG.V_WIDTH + 80;
        cloud.y = 35 + Math.random() * 180;
      }
    });
  }

  checkPipeCollision(b, p) {
    const capOverhang = 6;
    const capHeight = 30;

    // Body top pipe
    if (b.x + b.w > p.x && b.x < p.x + p.width && b.y < p.topHeight) {
      return true;
    }
    // Cap top pipe
    if (b.x + b.w > p.x - capOverhang && b.x < p.x + p.width + capOverhang && b.y < p.topHeight && b.y + b.h > p.topHeight - capHeight) {
      return true;
    }

    // Body bottom pipe
    if (b.x + b.w > p.x && b.x < p.x + p.width && b.y + b.h > p.bottomY) {
      return true;
    }
    // Cap bottom pipe
    if (b.x + b.w > p.x - capOverhang && b.x < p.x + p.width + capOverhang && b.y + b.h > p.bottomY && b.y < p.bottomY + capHeight) {
      return true;
    }

    return false;
  }

  updateParticles() {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const pt = this.particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.alpha -= 1 / pt.life;
      pt.size *= 0.95;
      if (pt.alpha <= 0 || pt.size <= 0.4) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.goldSparkles.length - 1; i >= 0; i--) {
      const sp = this.goldSparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.alpha -= 1 / sp.life;
      sp.size *= 0.95;
      if (sp.alpha <= 0 || sp.size <= 0.4) {
        this.goldSparkles.splice(i, 1);
      }
    }
  }

  // ==========================================
  // RENDERING ENGINE
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTime > 0) {
      const intensity = Math.min(8, this.shakeTime * 0.7);
      const sx = (Math.random() - 0.5) * intensity;
      const sy = (Math.random() - 0.5) * intensity;
      ctx.translate(sx, sy);
    }

    const t = this.themeTransition;
    const pIdx = this.prevThemeIdx;
    const cIdx = this.activeThemeIdx;

    // 1. Sky Gradient
    const skyTop = fastLerpColor('skyTop', pIdx, cIdx, t);
    const skyMid = fastLerpColor('skyMid', pIdx, cIdx, t);
    const skyBot = fastLerpColor('skyBot', pIdx, cIdx, t);

    const skyGrad = ctx.createLinearGradient(0, 0, 0, CONFIG.V_HEIGHT);
    skyGrad.addColorStop(0, skyTop);
    skyGrad.addColorStop(0.55, skyMid);
    skyGrad.addColorStop(1, skyBot);
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, CONFIG.V_WIDTH, CONFIG.V_HEIGHT);

    // 2. Stars & Moon (Night)
    if (this.activeThemeIdx === 2 || this.prevThemeIdx === 2) {
      const starAlpha = this.activeThemeIdx === 2 ? t : (1 - t);
      this.drawStars(ctx, starAlpha);
      this.drawMoon(ctx, starAlpha);
    }

    // 3. Sun (Day & Sunset)
    if (this.activeThemeIdx !== 2 || this.prevThemeIdx !== 2) {
      const sunAlpha = this.activeThemeIdx === 2 ? (1 - t) : 1;
      this.drawSun(ctx, THEMES[cIdx], THEMES[pIdx], t, sunAlpha);
    }

    // 4. Parallax Mountains (Distant and Mid-Range - Filled solid to canvas bottom)
    this.drawMountains(ctx, pIdx, cIdx, t);

    // 5. Spectacular Royal Fairytale Castle (Grounded seamless foundation, zero spikes)
    this.drawSpectacularCastle(ctx, pIdx, cIdx, t);

    // 6. Fluffy Animated Clouds
    this.drawClouds(ctx, pIdx, cIdx, t);

    // 7. Parallax Rolling Green Hills (Solid fill, highlighted crests & wildflowers)
    this.drawHills(ctx, pIdx, cIdx, t);

    // 8. Fireflies (Sunset / Night)
    if (THEMES[cIdx].hasFireflies || THEMES[pIdx].hasFireflies) {
      this.drawFireflies(ctx);
    }

    // 9. Pipes
    this.drawPipes(ctx, pIdx, cIdx, t);

    // 10. Coins
    this.drawCoins(ctx);

    // 11. Particles & Sparkles
    this.drawParticles(ctx);

    // 12. Floating Text Indicators
    this.drawFloatingTexts(ctx);

    // 13. Cape-Free Chubby Royal Bird (Ultra-Beautiful, Glossy & Expressive)
    this.drawRoyalBird(ctx);

    // 14. Foreground Ground & Road
    this.drawGround(ctx, pIdx, cIdx, t);

    ctx.restore();
  }

  drawSun(ctx, curr, prev, t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const sunY = prev.sunY + (curr.sunY - prev.sunY) * t;
    const sunColor = fastLerpColor('sunColor', this.prevThemeIdx, this.activeThemeIdx, t);
    const sunX = CONFIG.V_WIDTH * 0.72;

    const glowGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 90);
    glowGrad.addColorStop(0, curr.sunGlow);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 90, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fillStyle = sunColor;
    ctx.fill();

    ctx.restore();
  }

  drawMoon(ctx, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const moonX = CONFIG.V_WIDTH * 0.76;
    const moonY = 110;

    const glowGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 70);
    glowGrad.addColorStop(0, 'rgba(255, 255, 230, 0.45)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 70, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonX, moonY, 23, 0, Math.PI * 2);
    ctx.fillStyle = '#fffde7';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonX + 10, moonY - 5, 19, 0, Math.PI * 2);
    ctx.fillStyle = '#0a1329';
    ctx.fill();

    ctx.restore();
  }

  drawStars(ctx, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.fillStyle = '#ffffff';

    this.stars.forEach(s => {
      s.twinklePhase += s.twinkleSpeed;
      const tw = Math.sin(s.twinklePhase);
      if (tw > 0.2) {
        ctx.globalAlpha = tw * alpha;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    // Shooting star
    const shootCycle = (this.frame % 340);
    if (shootCycle < 24) {
      const shootProg = shootCycle / 24;
      const sx = 100 + shootProg * 140;
      const sy = 40 + shootProg * 70;
      ctx.globalAlpha = (1 - shootProg) * alpha;
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.8;
      ctx.beginPath();
      ctx.moveTo(sx - 35, sy - 18);
      ctx.lineTo(sx, sy);
      ctx.stroke();
    }

    ctx.restore();
  }

  drawFireflies(ctx) {
    ctx.save();
    this.fireflies.forEach(f => {
      const glow = Math.sin(f.pulsePhase);
      if (glow > 0) {
        ctx.globalAlpha = glow * 0.85;
        ctx.fillStyle = '#ffee58';
        ctx.beginPath();
        ctx.arc(f.x, f.y, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // Multi-layered Parallax Mountains (Solidly anchored down to CONFIG.V_HEIGHT - No sky gaps!)
  drawMountains(ctx, pIdx, cIdx, t) {
    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - 32;

    // 1. Far Alpine Mountain Range (Solid fill down to V_HEIGHT)
    const farCol = fastLerpColor('mountainFar', pIdx, cIdx, t);
    ctx.fillStyle = farCol;
    ctx.beginPath();
    ctx.moveTo(-50, CONFIG.V_HEIGHT);
    ctx.lineTo(-50, baseY - 130);

    const farOff = this.farMountainScroll;
    for (let x = -50; x <= CONFIG.V_WIDTH + 60; x += 30) {
      const peakX = x - (farOff % 30);
      const h = Math.sin((peakX + 120) * 0.008) * 85 + Math.cos((peakX + 50) * 0.018) * 35;
      const my = baseY - 135 + h;
      ctx.lineTo(peakX, my);
    }
    ctx.lineTo(CONFIG.V_WIDTH + 60, CONFIG.V_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // 2. Mid Mountain Ridge (Solid fill down to V_HEIGHT)
    const midCol = fastLerpColor('mountainMid', pIdx, cIdx, t);
    ctx.fillStyle = midCol;
    ctx.beginPath();
    ctx.moveTo(-50, CONFIG.V_HEIGHT);
    ctx.lineTo(-50, baseY - 75);

    const midOff = this.midMountainScroll;
    for (let x = -50; x <= CONFIG.V_WIDTH + 60; x += 25) {
      const peakX = x - (midOff % 25);
      const h = Math.sin((peakX + 40) * 0.014) * 58 + Math.cos((peakX + 200) * 0.024) * 26;
      const my = baseY - 80 + h;
      ctx.lineTo(peakX, my);
    }
    ctx.lineTo(CONFIG.V_WIDTH + 60, CONFIG.V_HEIGHT);
    ctx.closePath();
    ctx.fill();
  }

  // ==========================================
  // SPECTACULAR FAIRYTALE CASTLE
  // Clean, elegant royal architecture, smooth green hilltop,
  // NO strange shelves, NO floating green triangles!
  // ==========================================
  drawSpectacularCastle(ctx, pIdx, cIdx, t) {
    ctx.save();

    const stoneCol = fastLerpColor('castleStone', pIdx, cIdx, t);
    const stoneLight = fastLerpColor('castleStoneLight', pIdx, cIdx, t);
    const stoneDark = fastLerpColor('castleStoneDark', pIdx, cIdx, t);
    const roofCol = fastLerpColor('castleRoof', pIdx, cIdx, t);
    const roofHi = fastLerpColor('castleRoofHighlight', pIdx, cIdx, t);
    const winCol = fastLerpColor('castleWindow', pIdx, cIdx, t);
    const hillCol = fastLerpColor('hillBack', pIdx, cIdx, t);

    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - 32;

    const castleTotalWidth = 560;
    const scrollX = -(this.castleScroll % castleTotalWidth);
    const offsets = [scrollX, scrollX + castleTotalWidth];

    offsets.forEach(origX => {
      if (origX + castleTotalWidth < -80 || origX > CONFIG.V_WIDTH + 80) return;

      const cx = origX + 70;

      // --- A. Natural Hill Promontory (Solidly filled to canvas bottom) ---
      // Smooth natural rolling knoll under the castle with zero sharp shelves or spikes!
      ctx.fillStyle = hillCol;
      ctx.beginPath();
      ctx.moveTo(cx - 150, CONFIG.V_HEIGHT);
      ctx.lineTo(cx - 150, baseY + 20);
      ctx.quadraticCurveTo(cx - 60, baseY - 12, cx + 80, baseY - 15);
      ctx.quadraticCurveTo(cx + 220, baseY - 12, cx + 310, baseY + 20);
      ctx.lineTo(cx + 310, CONFIG.V_HEIGHT);
      ctx.closePath();
      ctx.fill();

      // --- B. Back Curtain Wall & Ramparts (Deeply anchored into hill) ---
      // Runs cleanly between outer towers (cx - 72 to cx + 236)
      ctx.fillStyle = stoneCol;
      ctx.fillRect(cx - 72, baseY - 85, 308, 115);

      // Back wall battlements (crenellations)
      for (let bx = cx - 72; bx < cx + 230; bx += 14) {
        ctx.fillRect(bx, baseY - 92, 8, 8);
      }

      // --- C. Background Distant Spires (Atmospheric Depth) ---
      const backTowers = [
        { x: cx - 20, w: 22, h: 145, spireH: 52 },
        { x: cx + 115, w: 24, h: 160, spireH: 58 },
        { x: cx + 195, w: 20, h: 135, spireH: 46 }
      ];

      backTowers.forEach(bt => {
        ctx.fillStyle = stoneDark;
        ctx.fillRect(bt.x, baseY - bt.h, bt.w, bt.h + 25);

        // Distant Spire Roof
        ctx.fillStyle = roofCol;
        ctx.beginPath();
        ctx.moveTo(bt.x - 3, baseY - bt.h);
        ctx.lineTo(bt.x + bt.w / 2, baseY - bt.h - bt.spireH);
        ctx.lineTo(bt.x + bt.w + 3, baseY - bt.h);
        ctx.closePath();
        ctx.fill();

        // Golden Finial
        ctx.fillStyle = '#ffd54f';
        ctx.beginPath();
        ctx.arc(bt.x + bt.w / 2, baseY - bt.h - bt.spireH, 2.4, 0, Math.PI * 2);
        ctx.fill();
      });

      // --- D. Main Royal Citadel Palace (Foreground Towers) ---
      // [x, width, height, spireHeight, flag, crown, isMainKeep]
      const mainTowers = [
        { x: cx - 72, w: 36, h: 115, spireH: 48, flag: true, crown: false, main: false },
        { x: cx - 26, w: 44, h: 162, spireH: 58, flag: false, crown: false, main: false },
        { x: cx + 26, w: 68, h: 202, spireH: 74, flag: true, crown: true, main: true }, // Grand Citadel Keep
        { x: cx + 104, w: 44, h: 158, spireH: 56, flag: false, crown: false, main: false },
        { x: cx + 158, w: 38, h: 122, spireH: 50, flag: true, crown: false, main: false },
        { x: cx + 206, w: 30, h: 92, spireH: 38, flag: false, crown: false, main: false }
      ];

      mainTowers.forEach(tw => {
        const tx = tw.x;
        const ty = baseY - tw.h;

        // Tower Body - extends deeply into hill foundation
        ctx.fillStyle = stoneCol;
        ctx.fillRect(tx, ty, tw.w, tw.h + 30);

        // Delicate stone brick quoin detailing
        ctx.fillStyle = stoneLight;
        for (let qy = ty + 12; qy < baseY; qy += 18) {
          ctx.fillRect(tx, qy, 4.5, 3.5);
          ctx.fillRect(tx + tw.w - 4.5, qy + 9, 4.5, 3.5);
        }

        // Horizontal decorative molding
        ctx.fillStyle = stoneLight;
        ctx.fillRect(tx - 2, ty + 24, tw.w + 4, 3.5);

        // Corbel machicolation supports beneath roof
        ctx.fillStyle = stoneDark;
        ctx.fillRect(tx - 3, ty, tw.w + 6, 5);
        for (let bx = tx - 2; bx < tx + tw.w + 2; bx += 8) {
          ctx.fillRect(bx, ty + 5, 4, 4.5);
        }

        // Crenellations (battlements)
        ctx.fillStyle = stoneCol;
        for (let bx = tx - 3; bx < tx + tw.w + 3; bx += 9) {
          ctx.fillRect(bx, ty - 6, 5, 6);
        }

        // Conical Royal Spire Roof with Gradient
        const spireGrad = ctx.createLinearGradient(tx, ty - tw.spireH, tx + tw.w, ty);
        spireGrad.addColorStop(0, roofHi);
        spireGrad.addColorStop(0.45, roofCol);
        spireGrad.addColorStop(1, '#0d1b3e');
        ctx.fillStyle = spireGrad;

        ctx.beginPath();
        ctx.moveTo(tx - 4, ty);
        ctx.lineTo(tx + tw.w / 2, ty - tw.spireH);
        ctx.lineTo(tx + tw.w + 4, ty);
        ctx.closePath();
        ctx.fill();

        // Golden Crown / Royal Finial
        const tipX = tx + tw.w / 2;
        const tipY = ty - tw.spireH;

        if (tw.crown) {
          ctx.save();
          ctx.translate(tipX, tipY - 5);
          ctx.fillStyle = '#ffd54f';
          ctx.beginPath();
          ctx.moveTo(-8, 3.5);
          ctx.lineTo(8, 3.5);
          ctx.lineTo(9, -6);
          ctx.lineTo(4.5, -1.5);
          ctx.lineTo(0, -10);
          ctx.lineTo(-4.5, -1.5);
          ctx.lineTo(-9, -6);
          ctx.closePath();
          ctx.fill();
          ctx.fillStyle = '#e53935';
          ctx.fillRect(-2.5, -1.5, 5, 3);
          ctx.restore();
        } else {
          ctx.fillStyle = '#ffd54f';
          ctx.beginPath();
          ctx.arc(tipX, tipY, 2.8, 0, Math.PI * 2);
          ctx.fill();
        }

        // Waving Swallowtail Pennants (Fluid sine wave)
        if (tw.flag) {
          const flagWave1 = Math.sin(this.frame * 0.18 + tx * 0.05) * 3;
          const flagWave2 = Math.sin(this.frame * 0.18 + tx * 0.05 + 1.2) * 3;

          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 1.3;
          ctx.beginPath();
          ctx.moveTo(tipX, tipY);
          ctx.lineTo(tipX, tipY - 15);
          ctx.stroke();

          ctx.fillStyle = '#e53935';
          ctx.beginPath();
          ctx.moveTo(tipX, tipY - 15);
          ctx.lineTo(tipX + 17, tipY - 11 + flagWave1);
          ctx.lineTo(tipX + 11.5, tipY - 7.5 + flagWave2);
          ctx.lineTo(tipX + 17, tipY - 4 + flagWave1);
          ctx.lineTo(tipX, tipY - 5);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#ffd54f';
          ctx.fillRect(tipX, tipY - 12, 4, 3);
        }

        // Grand Citadel Shield Ornament
        if (tw.main) {
          const shieldX = tx + tw.w / 2;
          const shieldY = ty + 38;
          ctx.fillStyle = '#ffd54f';
          ctx.beginPath();
          ctx.moveTo(shieldX - 8, shieldY);
          ctx.lineTo(shieldX + 8, shieldY);
          ctx.lineTo(shieldX + 8, shieldY + 7);
          ctx.lineTo(shieldX, shieldY + 15);
          ctx.lineTo(shieldX - 8, shieldY + 7);
          ctx.closePath();
          ctx.fill();

          ctx.fillStyle = '#1565c0';
          ctx.beginPath();
          ctx.arc(shieldX, shieldY + 6, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Glowing Arched Castle Windows (Warm flickering candlelight)
        const windowFlicker = 0.85 + Math.sin(this.frame * 0.12 + tx) * 0.15;
        const winRows = Math.floor((tw.h - 55) / 28);
        for (let r = 1; r <= winRows; r++) {
          const wy = ty + (tw.main ? 52 : 22) + r * 22;
          if (wy > baseY - 35) continue;

          const winCols = tw.main ? [-11, 11] : [0];
          winCols.forEach(wxOff => {
            const wx = tx + tw.w / 2 + wxOff;

            ctx.fillStyle = stoneDark;
            ctx.beginPath();
            ctx.roundRect(wx - 4.5, wy - 1, 9, 13, [4.5, 4.5, 0, 0]);
            ctx.fill();

            ctx.fillStyle = winCol;
            ctx.globalAlpha = windowFlicker;
            ctx.beginPath();
            ctx.roundRect(wx - 3.2, wy + 0.5, 6.4, 10.5, [3.2, 3.2, 0, 0]);
            ctx.fill();

            ctx.strokeStyle = stoneDark;
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(wx, wy + 2);
            ctx.lineTo(wx, wy + 11);
            ctx.moveTo(wx - 3, wy + 6);
            ctx.lineTo(wx + 3, wy + 6);
            ctx.stroke();
            ctx.globalAlpha = 1.0;
          });
        }
      });

      // --- E. Grand Castle Gatehouse & Portcullis ---
      const gateX = cx + 60;
      const gateY = baseY - 20;

      ctx.fillStyle = stoneCol;
      ctx.fillRect(gateX - 28, gateY - 42, 56, 50);

      for (let bx = gateX - 28; bx < gateX + 26; bx += 8) {
        ctx.fillRect(bx, gateY - 48, 5.5, 6.5);
      }

      ctx.fillStyle = stoneDark;
      ctx.beginPath();
      ctx.arc(gateX, gateY - 14, 16, Math.PI, 0);
      ctx.lineTo(gateX + 16, gateY + 8);
      ctx.lineTo(gateX - 16, gateY + 8);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#060a14';
      ctx.beginPath();
      ctx.arc(gateX, gateY - 14, 12, Math.PI, 0);
      ctx.lineTo(gateX + 12, gateY + 8);
      ctx.lineTo(gateX - 12, gateY + 8);
      ctx.closePath();
      ctx.fill();

      // Portcullis Grill
      ctx.strokeStyle = '#607d8b';
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      [-7, 0, 7].forEach(px => {
        ctx.moveTo(gateX + px, gateY - 20);
        ctx.lineTo(gateX + px, gateY + 8);
      });
      [-15, -9, -3, 3].forEach(py => {
        ctx.moveTo(gateX - 10, gateY + py);
        ctx.lineTo(gateX + 10, gateY + py);
      });
      ctx.stroke();

      // Flickering Lantern Torches flanking gate
      [-21, 21].forEach((lx, idx) => {
        const torchX = gateX + lx;
        const torchY = gateY - 20;

        ctx.strokeStyle = '#37474f';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(torchX, torchY + 5);
        ctx.lineTo(torchX, torchY);
        ctx.stroke();

        const flamePulse = Math.sin(this.frame * 0.25 + idx * 2.5) * 1.5;
        ctx.fillStyle = '#ff9800';
        ctx.beginPath();
        ctx.arc(torchX, torchY - 2, 2.6 + flamePulse * 0.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#ffee58';
        ctx.beginPath();
        ctx.arc(torchX, torchY - 2, 1.3, 0, Math.PI * 2);
        ctx.fill();
      });
    });

    ctx.restore();
  }

  drawClouds(ctx, pIdx, cIdx, t) {
    const cloudCol = fastLerpColor('cloudColor', pIdx, cIdx, t);
    const shadeCol = fastLerpColor('cloudShade', pIdx, cIdx, t);

    this.clouds.forEach(c => {
      ctx.save();
      ctx.translate(c.x, c.y);
      ctx.scale(c.scale, c.scale);

      ctx.fillStyle = cloudCol;
      ctx.beginPath();
      ctx.arc(0, 0, 24, 0, Math.PI * 2);
      ctx.arc(22, -10, 28, 0, Math.PI * 2);
      ctx.arc(52, -4, 22, 0, Math.PI * 2);
      ctx.arc(70, 6, 18, 0, Math.PI * 2);
      ctx.arc(36, 12, 22, 0, Math.PI * 2);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = shadeCol;
      ctx.beginPath();
      ctx.arc(36, 12, 18, 0, Math.PI);
      ctx.arc(22, 6, 20, 0, Math.PI);
      ctx.fill();

      ctx.restore();
    });
  }

  // Rolling hills solidly anchored to canvas bottom with crest highlights and flowers
  drawHills(ctx, pIdx, cIdx, t) {
    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT;
    const hillB = fastLerpColor('hillBack', pIdx, cIdx, t);
    const hillF = fastLerpColor('hillFront', pIdx, cIdx, t);
    const hillHi = fastLerpColor('hillHighlight', pIdx, cIdx, t);

    // 1. Back rolling hills - Solid fill all the way to bottom of canvas!
    ctx.fillStyle = hillB;
    ctx.beginPath();
    ctx.moveTo(-50, CONFIG.V_HEIGHT);
    ctx.lineTo(-50, baseY - 42);
    for (let x = -50; x <= CONFIG.V_WIDTH + 50; x += 30) {
      const y = baseY - 42 + Math.sin((x + this.hillScroll * 0.6) * 0.015) * 22;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CONFIG.V_WIDTH + 50, CONFIG.V_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // 2. Front rolling hills - Solid fill all the way to bottom of canvas!
    ctx.fillStyle = hillF;
    ctx.beginPath();
    ctx.moveTo(-50, CONFIG.V_HEIGHT);
    ctx.lineTo(-50, baseY - 18);
    for (let x = -50; x <= CONFIG.V_WIDTH + 50; x += 35) {
      const y = baseY - 18 + Math.sin((x + this.hillScroll) * 0.024) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CONFIG.V_WIDTH + 50, CONFIG.V_HEIGHT);
    ctx.closePath();
    ctx.fill();

    // Lush crest rim highlight on front hills
    ctx.strokeStyle = hillHi;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let x = -50; x <= CONFIG.V_WIDTH + 50; x += 35) {
      const y = baseY - 18 + Math.sin((x + this.hillScroll) * 0.024) * 15;
      if (x === -50) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Delicate wildflower dots along the hill crest
    ctx.fillStyle = '#fffde7';
    for (let x = -30; x <= CONFIG.V_WIDTH + 30; x += 45) {
      const fx = x - (this.hillScroll % 45);
      const fy = baseY - 18 + Math.sin((fx + this.hillScroll) * 0.024) * 15 + 4;
      ctx.beginPath();
      ctx.arc(fx, fy, 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffca28';
      ctx.beginPath();
      ctx.arc(fx, fy, 1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#fffde7';
    }
  }

  drawPipes(ctx, pIdx, cIdx, t) {
    const pipeOutline = fastLerpColor('pipeOutline', pIdx, cIdx, t);
    const pipeBase = fastLerpColor('pipeBase', pIdx, cIdx, t);
    const pipeHighlight = fastLerpColor('pipeHighlight', pIdx, cIdx, t);
    const pipeShadow = fastLerpColor('pipeShadow', pIdx, cIdx, t);
    const capHeight = 30;
    const capOverhang = 6;

    this.pipes.forEach(p => {
      // Top pipe
      this.drawPipeShaft(ctx, p.x, 0, p.width, p.topHeight - capHeight, pipeBase, pipeHighlight, pipeShadow, pipeOutline);
      this.drawPipeCap(ctx, p.x - capOverhang, p.topHeight - capHeight, p.width + capOverhang * 2, capHeight, pipeBase, pipeHighlight, pipeShadow, pipeOutline, true);

      // Bottom pipe
      this.drawPipeCap(ctx, p.x - capOverhang, p.bottomY, p.width + capOverhang * 2, capHeight, pipeBase, pipeHighlight, pipeShadow, pipeOutline, false);
      const bottomShaftH = (CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT) - (p.bottomY + capHeight);
      this.drawPipeShaft(ctx, p.x, p.bottomY + capHeight, p.width, bottomShaftH, pipeBase, pipeHighlight, pipeShadow, pipeOutline);
    });
  }

  drawPipeShaft(ctx, x, y, w, h, base, highlight, shadow, outline) {
    if (h <= 0) return;
    ctx.save();
    ctx.fillStyle = base;
    ctx.fillRect(x, y, w, h);

    ctx.fillStyle = highlight;
    ctx.fillRect(x + 6, y, 14, h);
    ctx.fillStyle = shadow;
    ctx.fillRect(x + w - 16, y, 16, h);

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = outline;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x, y + h);
    ctx.moveTo(x + w, y);
    ctx.lineTo(x + w, y + h);
    ctx.stroke();
    ctx.restore();
  }

  drawPipeCap(ctx, x, y, w, h, base, highlight, shadow, outline, isTop) {
    ctx.save();
    const r = 5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, [r, r, r, r]);
    ctx.fillStyle = base;
    ctx.fill();

    ctx.save();
    ctx.clip();
    ctx.fillStyle = highlight;
    ctx.fillRect(x + 8, y, 16, h);
    ctx.fillStyle = shadow;
    ctx.fillRect(x + w - 18, y, 18, h);

    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.fillRect(x + 4, isTop ? y + h - 5 : y + 2, w - 8, 3.5);

    ctx.fillStyle = '#ffca28';
    [-6, 6].forEach(offset => {
      ctx.beginPath();
      ctx.arc(x + w / 2 + offset * 2.5, y + h / 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.restore();

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = outline;
    ctx.stroke();
    ctx.restore();
  }

  drawCoins(ctx) {
    this.coinItems.forEach(c => {
      if (c.collected) return;
      const cy = c.y + Math.sin(c.bobPhase) * 6;

      ctx.save();
      ctx.translate(c.x, cy);

      ctx.beginPath();
      ctx.arc(0, 0, c.radius, 0, Math.PI * 2);
      const coinGrad = ctx.createRadialGradient(-3, -3, 2, 0, 0, c.radius);
      coinGrad.addColorStop(0, '#fff9c4');
      coinGrad.addColorStop(0.45, '#ffca28');
      coinGrad.addColorStop(1, '#e65100');
      ctx.fillStyle = coinGrad;
      ctx.fill();

      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#b26a00';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(0, 0, c.radius - 3.5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Crown emblem inside coin
      ctx.fillStyle = '#b26a00';
      ctx.beginPath();
      ctx.moveTo(-6, 4);
      ctx.lineTo(6, 4);
      ctx.lineTo(7, -3);
      ctx.lineTo(3, 0);
      ctx.lineTo(0, -5);
      ctx.lineTo(-3, 0);
      ctx.lineTo(-7, -3);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(-5, -5, 2.2, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    });
  }

  drawFloatingTexts(ctx) {
    if (this.floatingTexts.length === 0) return;
    ctx.save();
    ctx.font = 'bold 20px "Luckiest Guy", cursive, sans-serif';
    ctx.textAlign = 'center';

    this.floatingTexts.forEach(ft => {
      ctx.globalAlpha = Math.max(0, ft.alpha);
      ctx.fillStyle = ft.color;
      ctx.strokeStyle = '#1b1202';
      ctx.lineWidth = 3;
      ctx.strokeText(ft.text, ft.x, ft.y);
      ctx.fillText(ft.text, ft.x, ft.y);
    });

    ctx.restore();
  }

  // ==========================================
  // ULTRA-BEAUTIFUL ROYAL BIRD
  // Sleek, adorable cartoon proportions, vibrant celestial plumage,
  // sparkling sapphire Disney eye, rosy blush, 3D gilded crown with rotating glint!
  // ==========================================
  drawRoyalBird(ctx) {
    const b = this.bird;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);

    // 1. Aerodynamic Speed Streaks (Soft, fluid wind wisps)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.75)';
    ctx.lineWidth = 2.4;
    ctx.lineCap = 'round';
    [-11, 2, 14].forEach((offsetY, idx) => {
      ctx.beginPath();
      const wave = Math.sin(this.frame * 0.28 + idx) * 4;
      ctx.moveTo(-35, offsetY + wave);
      ctx.quadraticCurveTo(-46, offsetY + wave - 2.5, -60, offsetY + wave + 2);
      ctx.stroke();
    });

    // 2. Layered Royal Tail Feathers
    ctx.lineWidth = 2.4;
    [-7, 0, 7].forEach((to, idx) => {
      ctx.beginPath();
      ctx.ellipse(-26, 2 + to, 10, 5, -0.28 + idx * 0.04, 0, Math.PI * 2);
      const tailGrad = ctx.createLinearGradient(-36, to, -16, to);
      tailGrad.addColorStop(0, '#0d47a1');
      tailGrad.addColorStop(0.5, '#1976d2');
      tailGrad.addColorStop(1, '#42a5f5');
      ctx.fillStyle = tailGrad;
      ctx.fill();
      ctx.strokeStyle = '#061d47';
      ctx.stroke();

      // Tail feather inner vane
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(-32, 2 + to);
      ctx.lineTo(-20, 2 + to);
      ctx.stroke();
    });

    // 3. Main Chubby Royal Body (Rich multi-stop 3D sphere gradient, sleek head)
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 21.5, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(-6, -8, 2, 0, 0, 27);
    bodyGrad.addColorStop(0, '#90caf9');
    bodyGrad.addColorStop(0.25, '#42a5f5');
    bodyGrad.addColorStop(0.65, '#1e88e5');
    bodyGrad.addColorStop(0.9, '#1565c0');
    bodyGrad.addColorStop(1, '#0d47a1');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#061d47';
    ctx.stroke();

    // Top Head Gloss Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(-3, -12, 10, 4.5, -0.18, 0, Math.PI * 2);
    ctx.fill();

    // 4. Downy White Fluffy Belly with Scalloped Feather Fringe
    ctx.beginPath();
    ctx.ellipse(7, 7, 14.5, 11.5, 0.28, 0, Math.PI * 2);
    const bellyGrad = ctx.createLinearGradient(0, -2, 14, 18);
    bellyGrad.addColorStop(0, '#ffffff');
    bellyGrad.addColorStop(0.6, '#f3f9ff');
    bellyGrad.addColorStop(1, '#d5eaff');
    ctx.fillStyle = bellyGrad;
    ctx.fill();

    // Cute scalloped feather edges on belly
    ctx.strokeStyle = 'rgba(144, 202, 249, 0.7)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(5, 12, 4.5, 0.2, Math.PI * 0.85);
    ctx.arc(11, 11, 4.2, 0.2, Math.PI * 0.85);
    ctx.stroke();

    // 5. Charming Rosy Cheek Blush
    ctx.fillStyle = 'rgba(255, 105, 180, 0.75)';
    ctx.beginPath();
    ctx.ellipse(10.5, 6, 6.2, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    // Cute blush sparkles
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(9, 5, 1, 0, Math.PI * 2);
    ctx.arc(12, 6, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 6. Layered Flapping Wing (Aerodynamic & Silky)
    ctx.save();
    const wingAngle = Math.sin(b.wingTimer * 10) * 0.55;
    ctx.translate(-4, 0);
    ctx.rotate(wingAngle);

    // Primary flight wing
    ctx.beginPath();
    ctx.ellipse(-5, 0, 16, 9, -0.2, 0, Math.PI * 2);
    const wingGrad = ctx.createLinearGradient(-18, -6, 8, 4);
    wingGrad.addColorStop(0, '#64b5f6');
    wingGrad.addColorStop(0.4, '#2196f3');
    wingGrad.addColorStop(0.8, '#1976d2');
    wingGrad.addColorStop(1, '#0d47a1');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#061d47';
    ctx.stroke();

    // Feather division lines
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6, 0, 7, 0, Math.PI);
    ctx.moveTo(-11, 2);
    ctx.lineTo(-4, 5.5);
    ctx.stroke();

    // Wing glossy sheen
    ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
    ctx.beginPath();
    ctx.ellipse(-6, -3, 8.5, 2.8, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Disney / Anime-Style Royal Sparkle Eye
    const eyeX = 12.5;
    const eyeY = -6.5;
    const eyeRadius = 8.5;

    if (!b.isBlinking) {
      // White sclera
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.6;
      ctx.strokeStyle = '#061d47';
      ctx.stroke();

      // Deep sapphire & amethyst iris
      ctx.beginPath();
      ctx.arc(eyeX + 2.5, eyeY, 5, 0, Math.PI * 2);
      const irisGrad = ctx.createLinearGradient(eyeX, eyeY - 5, eyeX + 5, eyeY + 5);
      irisGrad.addColorStop(0, '#00b0ff');
      irisGrad.addColorStop(0.5, '#0288d1');
      irisGrad.addColorStop(1, '#1a237e');
      ctx.fillStyle = irisGrad;
      ctx.fill();

      // Deep midnight pupil
      ctx.beginPath();
      ctx.arc(eyeX + 3.2, eyeY, 3.8, 0, Math.PI * 2);
      ctx.fillStyle = '#060a1f';
      ctx.fill();

      // Primary brilliant white catchlight
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX + 1.8, eyeY - 2.5, 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Secondary soft catchlight
      ctx.beginPath();
      ctx.arc(eyeX + 4.5, eyeY + 1.8, 1.2, 0, Math.PI * 2);
      ctx.fill();

      // Cute upper curved royal eyelash
      ctx.strokeStyle = '#061d47';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.arc(eyeX, eyeY - 2, 7.5, Math.PI * 1.15, Math.PI * 1.85);
      ctx.stroke();
    } else {
      // Blinking happy curve
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6.8, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 3;
      ctx.strokeStyle = '#061d47';
      ctx.stroke();
    }

    // 8. Curved Golden Smile Beak
    ctx.beginPath();
    ctx.moveTo(19, -4);
    ctx.quadraticCurveTo(34, 1, 30.5, 5);
    ctx.quadraticCurveTo(25, 9.5, 16.5, 6.5);
    ctx.closePath();

    const beakGrad = ctx.createLinearGradient(19, -2, 32, 5);
    beakGrad.addColorStop(0, '#ffca28');
    beakGrad.addColorStop(0.4, '#ffa000');
    beakGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = beakGrad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#7c3500';
    ctx.stroke();

    // Happy beak smile line
    ctx.beginPath();
    ctx.arc(18, 2, 2.6, Math.PI * 0.8, Math.PI * 1.55);
    ctx.strokeStyle = '#7c3500';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Gloss highlight on beak
    ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.beginPath();
    ctx.ellipse(23.5, 0.5, 5, 1.5, 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 9. Royal Star Pendant / Brooch
    ctx.beginPath();
    ctx.arc(6, 13.5, 5.8, 0, Math.PI * 2);
    const broochGrad = ctx.createRadialGradient(5, 11.5, 1, 6, 13.5, 6);
    broochGrad.addColorStop(0, '#fffde7');
    broochGrad.addColorStop(0.4, '#ffd54f');
    broochGrad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = broochGrad;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#5d3509';
    ctx.stroke();

    // Crimson ribbon tie
    ctx.fillStyle = '#e53935';
    ctx.beginPath();
    ctx.moveTo(3.5, 15);
    ctx.lineTo(8.5, 15);
    ctx.lineTo(8.5, 12);
    ctx.lineTo(6, 13.5);
    ctx.lineTo(3.5, 12);
    ctx.closePath();
    ctx.fill();

    // 10. Gilded 3D Royal Crown with Rubies & Twinkles
    ctx.save();
    ctx.translate(5, -19.5);
    ctx.rotate(0.18);

    ctx.beginPath();
    ctx.moveTo(-13, 5);
    ctx.lineTo(13, 5);
    ctx.lineTo(15, -8.5);
    ctx.lineTo(7.5, -2);
    ctx.lineTo(0, -14);
    ctx.lineTo(-7.5, -2);
    ctx.lineTo(-15, -8.5);
    ctx.closePath();

    const crownGrad = ctx.createLinearGradient(0, -14, 0, 5);
    crownGrad.addColorStop(0, '#ffffff');
    crownGrad.addColorStop(0.2, '#fff9c4');
    crownGrad.addColorStop(0.55, '#ffca28');
    crownGrad.addColorStop(0.85, '#ff9800');
    crownGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = crownGrad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#4e2803';
    ctx.stroke();

    // Crown base pearl trim
    ctx.fillStyle = '#ffffff';
    for (let px = -10; px <= 10; px += 4) {
      ctx.beginPath();
      ctx.arc(px, 3.2, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Ruby cabochons on peaks
    const rubyTips = [
      { x: -15, y: -8.5 },
      { x: 0, y: -14 },
      { x: 15, y: -8.5 }
    ];

    rubyTips.forEach((tip, idx) => {
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#d50000';
      ctx.fill();
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = '#3e0606';
      ctx.stroke();

      // Gleaming star sparkle on center ruby
      if (idx === 1) {
        const starRot = this.frame * 0.08;
        ctx.save();
        ctx.translate(tip.x, tip.y);
        ctx.rotate(starRot);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(-1.2, -4);
        ctx.lineTo(1.2, -4);
        ctx.lineTo(1.2, 4);
        ctx.lineTo(-1.2, 4);
        ctx.fill();
        ctx.beginPath();
        ctx.moveTo(-4, -1.2);
        ctx.lineTo(4, -1.2);
        ctx.lineTo(4, 1.2);
        ctx.lineTo(-4, 1.2);
        ctx.fill();
        ctx.restore();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tip.x - 0.8, tip.y - 0.8, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.restore();
    ctx.restore();
  }

  // Foreground Ground with Cobblestones and Grass Fringe
  drawGround(ctx, pIdx, cIdx, t) {
    const groundY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT;
    const groundH = CONFIG.GROUND_HEIGHT;

    const earthGrad = ctx.createLinearGradient(0, groundY, 0, CONFIG.V_HEIGHT);
    if (this.activeThemeIdx === 2) {
      earthGrad.addColorStop(0, '#3d341a');
      earthGrad.addColorStop(1, '#1e1608');
    } else {
      earthGrad.addColorStop(0, '#ded895');
      earthGrad.addColorStop(0.15, '#c9ba6b');
      earthGrad.addColorStop(1, '#9e8d47');
    }
    ctx.fillStyle = earthGrad;
    ctx.fillRect(0, groundY, CONFIG.V_WIDTH, groundH);

    // Green grass layer
    ctx.fillStyle = this.activeThemeIdx === 2 ? '#2e7d32' : '#55c544';
    ctx.fillRect(0, groundY, CONFIG.V_WIDTH, 14);

    ctx.fillStyle = this.activeThemeIdx === 2 ? '#1b5e20' : '#3ca02e';
    ctx.fillRect(0, groundY + 12, CONFIG.V_WIDTH, 4);

    // Grass blades
    ctx.fillStyle = this.activeThemeIdx === 2 ? '#388e3c' : '#73d763';
    for (let x = -36; x < CONFIG.V_WIDTH + 36; x += 18) {
      const gx = x - this.groundScroll;
      ctx.beginPath();
      ctx.moveTo(gx, groundY);
      ctx.lineTo(gx + 9, groundY + 8);
      ctx.lineTo(gx + 18, groundY);
      ctx.fill();
    }

    // Cobblestones
    ctx.fillStyle = 'rgba(74, 57, 18, 0.35)';
    for (let x = -36; x < CONFIG.V_WIDTH + 36; x += 36) {
      const gx = x - this.groundScroll;
      ctx.beginPath();
      ctx.roundRect(gx + 6, groundY + 28, 14, 7, 3);
      ctx.roundRect(gx + 24, groundY + 48, 16, 8, 3);
      ctx.roundRect(gx + 10, groundY + 68, 12, 6, 3);
      ctx.fill();
    }

    ctx.lineWidth = 3.5;
    ctx.strokeStyle = '#1b3b12';
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(CONFIG.V_WIDTH, groundY);
    ctx.stroke();
  }

  drawParticles(ctx) {
    this.particles.forEach(pt => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.alpha);
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    this.goldSparkles.forEach(sp => {
      ctx.save();
      ctx.globalAlpha = Math.max(0, sp.alpha);
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // ==========================================
  // BUTTERY SMOOTH 60-144HZ GAME LOOP
  // Fixed-timestep physics accumulator = Zero Stutter & Zero Lag!
  // ==========================================
  loop(timestamp) {
    if (!this.lastTime) this.lastTime = timestamp;
    let dt = (timestamp - this.lastTime) / 1000;
    this.lastTime = timestamp;

    // Clamp delta time to avoid large jumps when tabbing away
    if (dt > 0.1) dt = 0.1;
    if (dt < 0) dt = 0;

    this.accumulator += dt;
    const fixedStep = 1 / 60; // Exact 60 ticks/sec physics

    let steps = 0;
    while (this.accumulator >= fixedStep && steps < 4) {
      this.update();
      this.accumulator -= fixedStep;
      steps++;
    }

    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  window.flyBirdGame = new FlyBirdGame();
});
