/**
 * Fly Bird - Royal Flight
 * High-Speed Arcade Engine, Funny English UI, Spectacular Fairytale Castle,
 * Corner-Only Realm Alerts & Cape-Free Royal Bird
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
    this.arcTo(x, y + x, y, r);
    this.closePath();
    return this;
  };
}

// Robust color parsing (never falls back to pure white!)
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

function lerpColor(c1, c2, t) {
  const rgb1 = hexToRgb(c1);
  const rgb2 = hexToRgb(c2);
  const r = Math.round(rgb1[0] + (rgb2[0] - rgb1[0]) * t);
  const g = Math.round(rgb1[1] + (rgb2[1] - rgb1[1]) * t);
  const b = Math.round(rgb1[2] + (rgb2[2] - rgb1[2]) * t);
  return `rgb(${r}, ${g}, ${b})`;
}

// ==========================================
// HIGH-ENERGY ARCADE ACTION SOUNDTRACK
// Synthesized in real-time via Web Audio API (Zero lag, zero downloads, seamless loop)
// ==========================================
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
    this.tempo = 136; // Fast arcade action tempo
    this.intensity = 0; // 0 = Daytime, 1 = Sunset, 2 = Midnight
    this.step = 0;
    this.nextStepTime = 0;
    this.timerId = null;
    this.noiseBuffer = null;
    this.musicGain = null;
    this.compressor = null;

    this.initAudioNodes();
    this.initNoiseBuffer();

    const F = ACTION_NOTE_FREQ;

    // 64-step Driving Bassline (4 bars of 16 sixteenths)
    this.bassPattern = [
      // Bar 0: Em
      F.E2, F.E3, F.E2, F.E3, F.E2, F.E3, F.G2, F.B2,
      F.E2, F.E3, F.E2, F.E3, F.E2, F.E3, F.B2, F.D3,
      // Bar 1: C Major
      F.C3, F.C4, F.C3, F.C4, F.C3, F.C4, F.E3, F.G3,
      F.C3, F.C4, F.C3, F.C4, F.C3, F.C4, F.G3, F.B3,
      // Bar 2: D Major
      F.D3, F.D4, F.D3, F.D4, F.D3, F.D4, F.Fs3, F.A3,
      F.D3, F.D4, F.D3, F.D4, F.D3, F.D4, F.A3, F.C4,
      // Bar 3: B Dominant
      F.B2, F.B3, F.B2, F.B3, F.B2, F.B3, F.Ds3, F.Fs3,
      F.B2, F.B3, F.B2, F.B3, F.B2, F.Ds3, F.Fs3, F.A3
    ];

    // 64-step Action Heroic Lead Riff
    this.leadPattern = [
      // Bar 0
      F.E4, null, F.G4, null, F.B4, null, F.E5, null,
      F.D5, null, F.B4, null, F.A4, null, F.B4, null,
      // Bar 1
      F.G4, null, F.A4, null, F.B4, null, F.D5, null,
      F.C5, null, F.A4, null, F.G4, null, F.E4, null,
      // Bar 2
      F.Fs4, null, F.A4, null, F.D5, null, F.Fs5, null,
      F.E5, null, F.D5, null, F.A4, null, F.D5, null,
      // Bar 3
      F.B4, null, F.Ds5, null, F.Fs5, null, F.A5, null,
      F.G5, null, F.Fs5, null, F.Ds5, null, F.B4, null
    ];

    // Arpeggio patterns for Sunset & Midnight
    this.arpPattern = [
      // Bar 0: Em
      F.E5, F.G5, F.B5, F.E6, F.B5, F.G5, F.E5, F.B4,
      F.E5, F.G5, F.B5, F.E6, F.B5, F.G5, F.B5, F.E6,
      // Bar 1: C
      F.C5, F.E5, F.G5, F.C6, F.G5, F.E5, F.C5, F.G4,
      F.C5, F.E5, F.G5, F.C6, F.G5, F.E5, F.G5, F.C6,
      // Bar 2: D
      F.D5, F.Fs5, F.A5, F.D6, F.A5, F.Fs5, F.D5, F.A4,
      F.D5, F.Fs5, F.A5, F.D6, F.A5, F.Fs5, F.A5, F.D6,
      // Bar 3: B
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
      const bufferSize = Math.floor(sampleRate * 0.5);
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
      osc.frequency.setValueAtTime(160, time);
      osc.frequency.exponentialRampToValueAtTime(36, time + 0.08);

      gain.gain.setValueAtTime(0.72, time);
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
      // Noise component
      const noise = this.ctx.createBufferSource();
      noise.buffer = this.noiseBuffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1900, time);
      filter.Q.setValueAtTime(1.2, time);

      const noiseGain = this.ctx.createGain();
      noiseGain.gain.setValueAtTime(0.35, time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + 0.14);

      noise.connect(filter);
      filter.connect(noiseGain);
      noiseGain.connect(this.musicGain);

      noise.start(time);
      noise.stop(time + 0.15);

      // Body punch
      const osc = this.ctx.createOscillator();
      const oscGain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(220, time);
      osc.frequency.exponentialRampToValueAtTime(80, time + 0.08);

      oscGain.gain.setValueAtTime(0.38, time);
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
      const dur = open ? 0.12 : 0.04;
      gain.gain.setValueAtTime(open ? 0.22 : 0.13, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      noise.start(time);
      noise.stop(time + dur + 0.01);
    } catch (e) {}
  }

  triggerBass(freq, time, dur = 0.11) {
    if (!this.ctx || this.isMuted() || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, time);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(950, time);
      filter.frequency.exponentialRampToValueAtTime(220, time + dur);
      filter.Q.setValueAtTime(2.8, time);

      gain.gain.setValueAtTime(0.34, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + dur + 0.02);
    } catch (e) {}
  }

  triggerLead(freq, time, dur = 0.14) {
    if (!this.ctx || this.isMuted() || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(freq, time);

      const vol = this.intensity >= 2 ? 0.22 : 0.18;
      gain.gain.setValueAtTime(vol, time);
      gain.gain.setValueAtTime(vol, time + dur * 0.7);
      gain.gain.exponentialRampToValueAtTime(0.001, time + dur);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + dur + 0.02);
    } catch (e) {}
  }

  triggerArp(freq, time) {
    if (!this.ctx || this.isMuted() || !freq) return;
    try {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, time);

      gain.gain.setValueAtTime(0.12, time);
      gain.gain.exponentialRampToValueAtTime(0.001, time + 0.08);

      osc.connect(gain);
      gain.connect(this.musicGain);

      osc.start(time);
      osc.stop(time + 0.09);
    } catch (e) {}
  }

  playStep(stepIdx, time) {
    // 1. Drum Kit
    const isKick = [0, 4, 8, 12, 14, 16, 20, 24, 28, 32, 36, 40, 44, 46, 48, 52, 56, 60, 62].includes(stepIdx);
    const isExtraKick = this.intensity >= 2 && [2, 6, 10, 18, 22, 26, 34, 38, 42, 50, 54, 58].includes(stepIdx);
    if (isKick || isExtraKick) {
      this.triggerKick(time);
    }

    const isSnare = [4, 12, 20, 28, 36, 44, 52, 60].includes(stepIdx);
    if (isSnare) {
      this.triggerSnare(time);
    }

    const isOpenHat = [14, 30, 46, 62].includes(stepIdx);
    const isClosedHat = [2, 6, 10, 18, 22, 26, 34, 38, 42, 50, 54, 58].includes(stepIdx);
    const isFastHat = this.intensity >= 1 && stepIdx % 2 === 1;

    if (isOpenHat) {
      this.triggerHiHat(time, true);
    } else if (isClosedHat || isFastHat) {
      this.triggerHiHat(time, false);
    }

    // 2. Rolling Bass
    const bassNote = this.bassPattern[stepIdx];
    if (bassNote) {
      this.triggerBass(bassNote, time, 0.10);
    }

    // 3. Heroic Action Lead
    const leadNote = this.leadPattern[stepIdx];
    if (leadNote) {
      this.triggerLead(leadNote, time, 0.16);
    }

    // 4. Arpeggiator (Sunset & Midnight adrenaline boost!)
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

      while (this.nextStepTime < this.ctx.currentTime + 0.12) {
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
    this.timerId = setInterval(() => this.scheduler(), 25);
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
    this.timerId = setInterval(() => this.scheduler(), 25);
  }

  stop() {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    this.isPaused = false;
    this.step = 0;
    if (this.musicGain && this.ctx) {
      try {
        this.musicGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.musicGain.gain.linearRampToValueAtTime(0.0001, this.ctx.currentTime + 0.12);
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

// Web Audio API Synthesizer & Sound FX Manager
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
      osc.frequency.setValueAtTime(380, now);
      osc.frequency.exponentialRampToValueAtTime(880, now + 0.11);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.11);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.12);
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
        const delay = idx * 0.055;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.3, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.27);
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
      osc.frequency.setValueAtTime(940, now);
      osc.frequency.setValueAtTime(1280, now + 0.07);

      gain.gain.setValueAtTime(0.24, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playLevelUp() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.09;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.22);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.24);
      });
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
      osc.frequency.setValueAtTime(260, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.2);

      gain.gain.setValueAtTime(0.42, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.22);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.23);
    } catch (e) {}
  }

  playGameOver() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349, 247];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.12;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.27);
      });
    } catch (e) {}
  }
}

// Funny Quotes
const FUNNY_DEATH_QUOTES = [
  "Emotional damage! 💀",
  "That pipe came out of nowhere, right?",
  "Gravity: 1 • Bird: 0 🪦",
  "Certified Skill Issue! 🤦",
  "Those pipes have personal beef with you.",
  "Did you forget how to flap? 🪽",
  "Oof! The floor is NOT lava, but it hurts.",
  "Bonk of the Century! 💥",
  "At least your crown stayed shiny! 👑"
];

// 100% Pure Hex Themes (Zero white-glitch risk!)
const THEMES = [
  {
    id: 0,
    name: "☀️ Day",
    skyTop: "#1e88e5",
    skyMid: "#64b5f6",
    skyBot: "#bbdefb",
    sunColor: "#fff9c4",
    sunGlow: "rgba(255, 238, 88, 0.45)",
    sunY: 130,
    showMoon: false,
    cloudColor: "#ffffff",
    cloudShade: "#bbdefb",
    mountainColor: "#32629b",
    castleColor: "#1d457a",
    castleRoof: "#29b6f6",
    castleWindow: "#fff59d",
    hillBack: "#5cbf60",
    hillFront: "#43a047",
    pipeBase: "#43a047",
    pipeHighlight: "#81c784",
    pipeShadow: "#2e7d32",
    pipeOutline: "#1b5e20",
    hasFireflies: false
  },
  {
    id: 1,
    name: "🌅 Sunset",
    skyTop: "#3e1254",
    skyMid: "#c2185b",
    skyBot: "#ffb74d",
    sunColor: "#ff7043",
    sunGlow: "rgba(255, 112, 67, 0.5)",
    sunY: 260,
    showMoon: false,
    cloudColor: "#ffe0b2",
    cloudShade: "#ad1457",
    mountainColor: "#51175e",
    castleColor: "#391044",
    castleRoof: "#e91e63",
    castleWindow: "#ffe082",
    hillBack: "#6d4c41",
    hillFront: "#4e342e",
    pipeBase: "#558b2f",
    pipeHighlight: "#9ccc65",
    pipeShadow: "#33691e",
    pipeOutline: "#1b3e0e",
    hasFireflies: true
  },
  {
    id: 2,
    name: "🌙 Midnight",
    skyTop: "#050b1a",
    skyMid: "#0d1b3e",
    skyBot: "#1a237e",
    sunColor: "#ffffff",
    sunGlow: "rgba(255, 255, 255, 0.2)",
    sunY: -100,
    showMoon: true,
    cloudColor: "#1a237e",
    cloudShade: "#0d1b3e",
    mountainColor: "#0b1533",
    castleColor: "#060c20",
    castleRoof: "#3949ab",
    castleWindow: "#ffd54f",
    hillBack: "#1b5e20",
    hillFront: "#0d3b13",
    pipeBase: "#2e7d32",
    pipeHighlight: "#66bb6a",
    pipeShadow: "#1b5e20",
    pipeOutline: "#09250c",
    hasFireflies: true
  }
];

// High-Speed Arcade Physics Configuration
const CONFIG = {
  V_WIDTH: 440,
  V_HEIGHT: 740,
  GRAVITY: 0.42,
  FLAP_POWER: -7.9,
  MAX_FALL_SPEED: 12.5,
  PIPE_SPEED_BASE: 3.3,
  PIPE_SPAWN_INTERVAL: 96,
  PIPE_GAP: 168,
  PIPE_WIDTH: 72,
  GROUND_HEIGHT: 95
};

// ==========================================
// GAME STATE MANAGEMENT
// ==========================================
class FlyBirdGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d', { alpha: false });
    this.sound = new SoundFX();

    // DOM UI Elements
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

    // State Variables
    this.state = 'START';
    this.score = 0;
    this.coins = 0;
    this.totalCoins = parseInt(localStorage.getItem('flybird_coins') || '0', 10);
    this.bestScore = parseInt(localStorage.getItem('flybird_best') || '0', 10);
    this.frame = 0;
    this.speed = CONFIG.PIPE_SPEED_BASE;
    this.shakeTime = 0;

    // Theme state
    this.activeThemeIdx = 0;
    this.prevThemeIdx = 0;
    this.themeTransition = 1.0;

    // Player Bird (No cape, pure crown & plump cuteness)
    this.bird = {
      x: 110,
      y: CONFIG.V_HEIGHT / 2 - 35,
      vy: 0,
      radius: 20,
      angle: 0,
      wingTimer: 0,
      blinkTimer: 0,
      isBlinking: false
    };

    this.pipes = [];
    this.coinItems = [];
    this.particles = [];
    this.goldSparkles = [];
    this.clouds = [];
    this.stars = [];
    this.fireflies = [];
    this.groundScroll = 0;
    this.hillScroll = 0;
    this.lastActionTimestamp = 0;

    this.initAtmosphere();
    this.setupResolution();
    this.bindEvents();
    this.updateHUD();

    this.lastTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  setupResolution() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
    this.width = CONFIG.V_WIDTH;
    this.height = CONFIG.V_HEIGHT;

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.ctx.resetTransform?.();
    this.ctx.scale(dpr, dpr);
  }

  initAtmosphere() {
    this.clouds = [
      { x: 30, y: 70, scale: 0.95, speed: 0.4 },
      { x: 210, y: 130, scale: 1.25, speed: 0.55 },
      { x: 380, y: 55, scale: 0.75, speed: 0.35 },
      { x: 130, y: 200, scale: 0.85, speed: 0.45 }
    ];

    this.stars = [];
    for (let i = 0; i < 45; i++) {
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
      if (now - this.lastActionTimestamp < 50) return;
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

    // Mobile Direct Touch
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleAction(e);
    }, { passive: false });

    // Desktop Click
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

    // Desktop Keyboard
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

    // Buttons
    const tapBtn = document.getElementById('tap-to-fly-btn');
    if (tapBtn) {
      const handleTapBtn = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleAction(null);
      };
      tapBtn.addEventListener('touchstart', handleTapBtn, { passive: false });
      tapBtn.addEventListener('click', handleTapBtn);
    }

    const playAgainBtn = document.getElementById('play-again-btn');
    if (playAgainBtn) {
      const handleRestart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resetGame();
      };
      playAgainBtn.addEventListener('touchstart', handleRestart, { passive: false });
      playAgainBtn.addEventListener('click', handleRestart);
    }

    const resumeBtn = document.getElementById('resume-btn');
    if (resumeBtn) {
      const handleResume = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.togglePause();
      };
      resumeBtn.addEventListener('touchstart', handleResume, { passive: false });
      resumeBtn.addEventListener('click', handleResume);
    }

    const pauseRestartBtn = document.getElementById('pause-restart-btn');
    if (pauseRestartBtn) {
      const handlePauseRestart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.resetGame();
      };
      pauseRestartBtn.addEventListener('touchstart', handlePauseRestart, { passive: false });
      pauseRestartBtn.addEventListener('click', handlePauseRestart);
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
    this.coinItems = [];
    this.particles = [];
    this.goldSparkles = [];

    this.bird.x = 110;
    this.bird.y = CONFIG.V_HEIGHT / 2 - 35;
    this.bird.vy = 0;
    this.bird.angle = 0;

    this.startScreen.classList.add('active');
    this.gameoverScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.updateHUD();
  }

  // ==========================================
  // REALM PROGRESSION (Corner-only indicator!)
  // ==========================================
  checkThemeMilestones() {
    let targetIdx = 0;
    if (this.score >= 25) {
      targetIdx = 2; // Midnight (25+ pts)
    } else if (this.score >= 10) {
      targetIdx = 1; // Sunset (10+ pts)
    } else {
      targetIdx = 0; // Daytime
    }

    if (targetIdx !== this.activeThemeIdx) {
      this.prevThemeIdx = this.activeThemeIdx;
      this.activeThemeIdx = targetIdx;
      this.themeTransition = 0.0;
      
      // Update corner HUD pill ONLY (No middle popup!)
      if (this.realmIndicatorEl) {
        this.realmIndicatorEl.textContent = THEMES[targetIdx].name;
      }
      if (this.realmPillEl) {
        this.realmPillEl.classList.remove('realm-glow-pop');
        void this.realmPillEl.offsetWidth; // force reflow
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
    this.shakeTime = 20;

    this.sound.playHit();
    setTimeout(() => this.sound.playGameOver(), 200);

    const isNewBest = this.score > this.bestScore;
    if (isNewBest) {
      this.bestScore = this.score;
      localStorage.setItem('flybird_best', this.bestScore);
    }
    this.totalCoins += this.coins;
    localStorage.setItem('flybird_coins', this.totalCoins);

    // Update Game Over Dialog
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

    // Funny Medals
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

  spawnPipes() {
    const minTop = 75;
    const maxTop = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - CONFIG.PIPE_GAP - 95;
    const topHeight = minTop + Math.random() * (maxTop - minTop);

    const pipeX = CONFIG.V_WIDTH + 20;
    const bottomY = topHeight + CONFIG.PIPE_GAP;

    const newPipe = {
      x: pipeX,
      topHeight: topHeight,
      bottomY: bottomY,
      width: CONFIG.PIPE_WIDTH,
      passed: false
    };

    this.pipes.push(newPipe);

    if (Math.random() < 0.75) {
      this.coinItems.push({
        x: pipeX + CONFIG.PIPE_WIDTH / 2,
        y: topHeight + CONFIG.PIPE_GAP / 2,
        radius: 14,
        collected: false,
        bobPhase: Math.random() * Math.PI * 2
      });
    }
  }

  spawnFeathers() {
    for (let i = 0; i < 5; i++) {
      this.particles.push({
        x: this.bird.x - 18 + Math.random() * 8,
        y: this.bird.y + 4 + Math.random() * 8,
        vx: -2.0 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2.5,
        size: 3 + Math.random() * 4,
        color: '#ffffff',
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
        size: 3 + Math.random() * 5,
        color: ['#fff9c4', '#ffca28', '#ff9800', '#ffffff'][Math.floor(Math.random() * 4)],
        alpha: 1,
        life: 26
      });
    }
  }

  // ==========================================
  // PHYSICS & UPDATE LOOP (Fast, Zero Lag)
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

    // PLAYING:
    this.scrollScenery(this.speed);
    this.speed = CONFIG.PIPE_SPEED_BASE + Math.min(2.0, Math.floor(this.score / 8) * 0.22);

    // Bird physics
    this.bird.vy += CONFIG.GRAVITY;
    this.bird.vy = Math.min(this.bird.vy, CONFIG.MAX_FALL_SPEED);
    this.bird.y += this.bird.vy;

    if (this.bird.vy < 0) {
      this.bird.angle = Math.max(-0.48, this.bird.angle - 0.14);
    } else {
      this.bird.angle = Math.min(1.25, this.bird.angle + 0.05);
    }

    this.bird.wingTimer += (this.bird.vy < 0 ? 0.3 : 0.09);

    // Blinking
    this.bird.blinkTimer++;
    if (this.bird.blinkTimer > 170 && Math.random() < 0.08) {
      this.bird.isBlinking = true;
      if (this.bird.blinkTimer > 182) {
        this.bird.isBlinking = false;
        this.bird.blinkTimer = 0;
      }
    }

    // Spawn pipes
    if (this.frame % Math.max(78, CONFIG.PIPE_SPAWN_INTERVAL - Math.floor(this.score / 6) * 3) === 0) {
      this.spawnPipes();
    }

    const birdBox = {
      x: this.bird.x - this.bird.radius * 0.75,
      y: this.bird.y - this.bird.radius * 0.75,
      w: this.bird.radius * 1.5,
      h: this.bird.radius * 1.5
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
        this.checkThemeMilestones();
        this.updateHUD();
        this.coinItems.splice(i, 1);
        continue;
      }

      if (c.x < -40) {
        this.coinItems.splice(i, 1);
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
    this.hillScroll = (this.hillScroll + amt * 0.45) % 200;

    this.clouds.forEach(cloud => {
      cloud.x -= cloud.speed * (amt / 2);
      if (cloud.x < -130) {
        cloud.x = CONFIG.V_WIDTH + 70;
        cloud.y = 35 + Math.random() * 180;
      }
    });
  }

  checkPipeCollision(b, p) {
    if (b.x + b.w > p.x && b.x < p.x + p.width && b.y < p.topHeight) {
      return true;
    }
    if (b.x + b.w > p.x && b.x < p.x + p.width && b.y + b.h > p.bottomY) {
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
      if (pt.alpha <= 0 || pt.size <= 0.5) {
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
  // RENDERING
  // ==========================================
  render() {
    const ctx = this.ctx;
    ctx.save();

    if (this.shakeTime > 0) {
      const intensity = (this.shakeTime / 20) * 10;
      const sx = (Math.random() - 0.5) * intensity;
      const sy = (Math.random() - 0.5) * intensity;
      ctx.translate(sx, sy);
    }

    const currTheme = THEMES[this.activeThemeIdx];
    const prevTheme = THEMES[this.prevThemeIdx];
    const t = this.themeTransition;

    // 1. Sky Gradient
    const skyTop = lerpColor(prevTheme.skyTop, currTheme.skyTop, t);
    const skyMid = lerpColor(prevTheme.skyMid, currTheme.skyMid, t);
    const skyBot = lerpColor(prevTheme.skyBot, currTheme.skyBot, t);

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
      this.drawSun(ctx, currTheme, prevTheme, t, sunAlpha);
    }

    // 4. Parallax Misty Mountains
    this.drawMountains(ctx, currTheme, prevTheme, t);

    // 5. Spectacular Royal Fairytale Castle
    this.drawSpectacularCastle(ctx, currTheme, prevTheme, t);

    // 6. Clouds
    this.drawClouds(ctx, currTheme, prevTheme, t);

    // 7. Rolling Green Hills
    this.drawHills(ctx, currTheme, prevTheme, t);

    // 8. Fireflies
    if (currTheme.hasFireflies || prevTheme.hasFireflies) {
      this.drawFireflies(ctx);
    }

    // 9. Pipes
    this.drawPipes(ctx, currTheme, prevTheme, t);

    // 10. Coins
    this.drawCoins(ctx);

    // 11. Particles & Sparkles
    this.drawParticles(ctx);

    // 12. Cape-Free Royal Bird
    this.drawRoyalBird(ctx);

    // 13. Ground
    this.drawGround(ctx, currTheme, prevTheme, t);

    ctx.restore();
  }

  drawSun(ctx, curr, prev, t, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const sunY = prev.sunY + (curr.sunY - prev.sunY) * t;
    const sunColor = lerpColor(prev.sunColor, curr.sunColor, t);
    const sunX = CONFIG.V_WIDTH * 0.72;

    const glowGrad = ctx.createRadialGradient(sunX, sunY, 15, sunX, sunY, 80);
    glowGrad.addColorStop(0, curr.sunGlow);
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(sunX, sunY, 80, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(sunX, sunY, 28, 0, Math.PI * 2);
    ctx.fillStyle = sunColor;
    ctx.shadowColor = sunColor;
    ctx.shadowBlur = 20;
    ctx.fill();

    ctx.restore();
  }

  drawMoon(ctx, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;

    const moonX = CONFIG.V_WIDTH * 0.76;
    const moonY = 110;

    const glowGrad = ctx.createRadialGradient(moonX, moonY, 15, moonX, moonY, 65);
    glowGrad.addColorStop(0, 'rgba(255, 255, 230, 0.45)');
    glowGrad.addColorStop(1, 'transparent');
    ctx.fillStyle = glowGrad;
    ctx.beginPath();
    ctx.arc(moonX, moonY, 65, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonX, moonY, 22, 0, Math.PI * 2);
    ctx.fillStyle = '#fffde7';
    ctx.fill();

    ctx.beginPath();
    ctx.arc(moonX + 9, moonY - 5, 18, 0, Math.PI * 2);
    ctx.fillStyle = '#0d1b3e';
    ctx.fill();

    ctx.restore();
  }

  drawStars(ctx, alpha) {
    if (alpha <= 0) return;
    ctx.save();
    ctx.fillStyle = '#ffffff';

    this.stars.forEach(s => {
      s.twinklePhase += s.twinkleSpeed;
      const twAlpha = (0.4 + Math.sin(s.twinklePhase) * 0.5) * alpha;
      ctx.globalAlpha = Math.max(0, twAlpha);
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.fill();
    });

    if (this.frame % 160 < 25) {
      const shootProg = (this.frame % 160) / 25;
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
        ctx.shadowColor = '#ffee58';
        ctx.shadowBlur = 8;
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // Mountains: Beautiful soft atmospheric ridges with NO WHITE GLITCH!
  drawMountains(ctx, curr, prev, t) {
    const mountainCol = lerpColor(prev.mountainColor, curr.mountainColor, t);
    ctx.fillStyle = mountainCol;
    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - 30;

    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(0, baseY - 60);
    ctx.lineTo(60, baseY - 120);
    ctx.lineTo(135, baseY - 70);
    ctx.lineTo(220, baseY - 135);
    ctx.lineTo(310, baseY - 85);
    ctx.lineTo(390, baseY - 145);
    ctx.lineTo(CONFIG.V_WIDTH, baseY - 95);
    ctx.lineTo(CONFIG.V_WIDTH, baseY);
    ctx.closePath();
    ctx.fill();
  }

  // Spectacular Fairytale Castle - Beautifully seated on the middle hill
  drawSpectacularCastle(ctx, curr, prev, t) {
    ctx.save();
    const stoneCol = lerpColor(prev.castleColor, curr.castleColor, t);
    const roofCol = lerpColor(prev.castleRoof, curr.castleRoof, t);
    const winCol = lerpColor(prev.castleWindow, curr.castleWindow, t);
    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - 35;

    // Centered Castle Horizon Position
    const castleX = CONFIG.V_WIDTH / 2 - 45;
    
    // Back Stone Curtain Wall
    ctx.fillStyle = stoneCol;
    ctx.fillRect(castleX - 70, baseY - 65, 230, 65);

    // Stone Archways beneath wall
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.arc(castleX - 35, baseY - 10, 12, Math.PI, 0);
    ctx.arc(castleX + 45, baseY - 10, 14, Math.PI, 0);
    ctx.arc(castleX + 115, baseY - 10, 12, Math.PI, 0);
    ctx.fill();

    // Towers Array: [x, width, height, spireHeight, flag]
    const towers = [
      { x: castleX - 75, w: 26, h: 95, spireH: 35, flag: true },
      { x: castleX - 42, w: 32, h: 125, spireH: 42, flag: false },
      { x: castleX - 4, w: 44, h: 165, spireH: 58, flag: true }, // Grand Citadel Keep
      { x: castleX + 48, w: 32, h: 130, spireH: 46, flag: true },
      { x: castleX + 88, w: 34, h: 105, spireH: 36, flag: false },
      { x: castleX + 130, w: 22, h: 80, spireH: 28, flag: true }
    ];

    towers.forEach(tw => {
      const tx = tw.x;
      const ty = baseY - tw.h;

      // Stone Wall
      ctx.fillStyle = stoneCol;
      ctx.fillRect(tx, ty, tw.w, tw.h);

      // Crenellations
      const crenW = 5;
      for (let cx = tx - 2; cx < tx + tw.w + 2; cx += crenW * 2) {
        ctx.fillRect(cx, ty - 6, crenW, 6);
      }

      // Conical Spire Roof
      ctx.fillStyle = roofCol;
      ctx.beginPath();
      ctx.moveTo(tx - 3, ty);
      ctx.lineTo(tx + tw.w / 2, ty - tw.spireH);
      ctx.lineTo(tx + tw.w + 3, ty);
      ctx.closePath();
      ctx.fill();

      // Golden Tip
      ctx.fillStyle = '#ffd54f';
      ctx.beginPath();
      ctx.arc(tx + tw.w / 2, ty - tw.spireH, 2.2, 0, Math.PI * 2);
      ctx.fill();

      // Fluttering Red Pennant Flags
      if (tw.flag) {
        const flagWave = Math.sin(this.frame * 0.16 + tw.x) * 2;
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.moveTo(tx + tw.w / 2, ty - tw.spireH);
        ctx.lineTo(tx + tw.w / 2, ty - tw.spireH - 12);
        ctx.stroke();

        ctx.fillStyle = '#ff3d00';
        ctx.beginPath();
        ctx.moveTo(tx + tw.w / 2, ty - tw.spireH - 12);
        ctx.lineTo(tx + tw.w / 2 + 10, ty - tw.spireH - 8 + flagWave);
        ctx.lineTo(tx + tw.w / 2, ty - tw.spireH - 4);
        ctx.closePath();
        ctx.fill();
      }

      // Glowing Arched Castle Windows
      ctx.fillStyle = winCol;
      const winRows = Math.floor(tw.h / 36);
      for (let r = 1; r <= winRows; r++) {
        const wy = ty + r * 28;
        ctx.beginPath();
        ctx.roundRect(tx + tw.w / 2 - 3, wy, 6, 8.5, [3, 3, 0, 0]);
        ctx.fill();
      }
    });

    ctx.restore();
  }

  drawClouds(ctx, curr, prev, t) {
    const cloudCol = lerpColor(prev.cloudColor, curr.cloudColor, t);
    const shadeCol = lerpColor(prev.cloudShade, curr.cloudShade, t);

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

  drawHills(ctx, curr, prev, t) {
    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT;
    const hillB = lerpColor(prev.hillBack, curr.hillBack, t);
    const hillF = lerpColor(prev.hillFront, curr.hillFront, t);

    ctx.fillStyle = hillB;
    ctx.beginPath();
    ctx.moveTo(-50, baseY);
    for (let x = -50; x <= CONFIG.V_WIDTH + 50; x += 30) {
      const y = baseY - 42 + Math.sin((x + this.hillScroll * 0.6) * 0.015) * 22;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CONFIG.V_WIDTH + 50, baseY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = hillF;
    ctx.beginPath();
    ctx.moveTo(-50, baseY);
    for (let x = -50; x <= CONFIG.V_WIDTH + 50; x += 35) {
      const y = baseY - 18 + Math.sin((x + this.hillScroll) * 0.024) * 15;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(CONFIG.V_WIDTH + 50, baseY);
    ctx.closePath();
    ctx.fill();
  }

  drawPipes(ctx, curr, prev, t) {
    const pipeOutline = lerpColor(prev.pipeOutline, curr.pipeOutline, t);
    const pipeBase = lerpColor(prev.pipeBase, curr.pipeBase, t);
    const pipeHighlight = lerpColor(prev.pipeHighlight, curr.pipeHighlight, t);
    const pipeShadow = lerpColor(prev.pipeShadow, curr.pipeShadow, t);
    const capHeight = 30;
    const capOverhang = 6;

    this.pipes.forEach(p => {
      this.drawPipeShaft(ctx, p.x, 0, p.width, p.topHeight - capHeight, pipeBase, pipeHighlight, pipeShadow, pipeOutline);
      this.drawPipeCap(ctx, p.x - capOverhang, p.topHeight - capHeight, p.width + capOverhang * 2, capHeight, pipeBase, pipeHighlight, pipeShadow, pipeOutline, true);

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

  // Cape-Free Royal Bird (Clean, Chubby, Twinkling Crown)
  drawRoyalBird(ctx) {
    const b = this.bird;
    ctx.save();
    ctx.translate(b.x, b.y);
    ctx.rotate(b.angle);

    // 1. Aerodynamic Speed Streaks
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.lineWidth = 2.8;
    ctx.lineCap = 'round';
    [-12, 1, 15].forEach((offsetY, idx) => {
      ctx.beginPath();
      const wave = Math.sin(this.frame * 0.28 + idx) * 4.5;
      ctx.moveTo(-36, offsetY + wave);
      ctx.quadraticCurveTo(-48, offsetY + wave - 3, -62, offsetY + wave + 2);
      ctx.stroke();
    });

    // 2. Tail Feathers
    ctx.lineWidth = 2.6;
    [-7, 0, 7].forEach((to) => {
      ctx.beginPath();
      ctx.ellipse(-26, 2 + to, 9.5, 4.8, -0.28, 0, Math.PI * 2);
      const tailGrad = ctx.createLinearGradient(-35, to, -18, to);
      tailGrad.addColorStop(0, '#1565c0');
      tailGrad.addColorStop(1, '#1e88e5');
      ctx.fillStyle = tailGrad;
      ctx.fill();
      ctx.strokeStyle = '#06285e';
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-30, 2 + to, 4, 1.6, -0.28, 0, Math.PI * 2);
      ctx.fill();
    });

    // 3. Main Body
    ctx.beginPath();
    ctx.ellipse(0, 0, 25, 21, 0, 0, Math.PI * 2);
    const bodyGrad = ctx.createRadialGradient(-5, -7, 3, 0, 0, 26);
    bodyGrad.addColorStop(0, '#64b5f6');
    bodyGrad.addColorStop(0.4, '#2196f3');
    bodyGrad.addColorStop(0.8, '#1976d2');
    bodyGrad.addColorStop(1, '#0d47a1');
    ctx.fillStyle = bodyGrad;
    ctx.fill();
    ctx.lineWidth = 3.2;
    ctx.strokeStyle = '#06285e';
    ctx.stroke();

    // Top Head 3D Specular Highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-3, -12, 10, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 4. White Belly
    ctx.beginPath();
    ctx.ellipse(7, 7, 14, 11, 0.28, 0, Math.PI * 2);
    const bellyGrad = ctx.createLinearGradient(0, -2, 12, 18);
    bellyGrad.addColorStop(0, '#ffffff');
    bellyGrad.addColorStop(0.65, '#f0f9ff');
    bellyGrad.addColorStop(1, '#d8eefc');
    ctx.fillStyle = bellyGrad;
    ctx.fill();

    ctx.strokeStyle = 'rgba(187, 222, 251, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(6, 12, 5, 0.2, Math.PI * 0.8);
    ctx.arc(12, 11, 4.5, 0.2, Math.PI * 0.8);
    ctx.stroke();

    // 5. Rosy Cheek Blush
    ctx.fillStyle = 'rgba(255, 105, 180, 0.72)';
    ctx.beginPath();
    ctx.ellipse(10, 6, 6, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 64, 129, 0.75)';
    [8, 10.5, 13].forEach((fx, i) => {
      ctx.beginPath();
      ctx.arc(fx, 6 + (i === 1 ? -1 : 0.5), 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // 6. Wing
    ctx.save();
    const wingAngle = Math.sin(b.wingTimer * 10) * 0.5;
    ctx.translate(-4, 0);
    ctx.rotate(wingAngle);

    ctx.beginPath();
    ctx.ellipse(-5, 0, 15, 8.5, -0.2, 0, Math.PI * 2);
    const wingGrad = ctx.createLinearGradient(-16, -6, 8, 4);
    wingGrad.addColorStop(0, '#42a5f5');
    wingGrad.addColorStop(0.7, '#1e88e5');
    wingGrad.addColorStop(1, '#1565c0');
    ctx.fillStyle = wingGrad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#06285e';
    ctx.stroke();

    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6, 0, 6.5, 0, Math.PI);
    ctx.moveTo(-10, 2);
    ctx.lineTo(-4, 5);
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-6, -3, 8, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 7. Eyes
    const eyeX = 12;
    const eyeY = -6;
    const eyeRadius = 8;

    if (!b.isBlinking) {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#06285e';
      ctx.stroke();

      ctx.beginPath();
      ctx.arc(eyeX + 2.5, eyeY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0288d1';
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeX + 3, eyeY, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = '#050c26';
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX + 1.8, eyeY - 2.2, 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeX + 4.2, eyeY + 1.5, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6.5, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = '#06285e';
      ctx.stroke();
    }

    // 8. Beak
    ctx.beginPath();
    ctx.moveTo(19, -3.5);
    ctx.quadraticCurveTo(33, 1, 30, 4.5);
    ctx.quadraticCurveTo(25, 9, 17, 6.5);
    ctx.closePath();

    const beakGrad = ctx.createLinearGradient(19, 0, 31, 4);
    beakGrad.addColorStop(0, '#ffb74d');
    beakGrad.addColorStop(0.4, '#ffa726');
    beakGrad.addColorStop(1, '#e65100');
    ctx.fillStyle = beakGrad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#8d4000';
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(18, 2, 2.5, Math.PI * 0.8, Math.PI * 1.5);
    ctx.strokeStyle = '#8d4000';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(23, 0.5, 4.5, 1.4, 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 9. Brooch
    ctx.beginPath();
    ctx.arc(6, 13, 5.5, 0, Math.PI * 2);
    const broochGrad = ctx.createRadialGradient(5, 11, 1, 6, 13, 5.5);
    broochGrad.addColorStop(0, '#fff9c4');
    broochGrad.addColorStop(0.6, '#ffca28');
    broochGrad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = broochGrad;
    ctx.fill();
    ctx.lineWidth = 2.2;
    ctx.strokeStyle = '#6d3c0e';
    ctx.stroke();

    ctx.fillStyle = '#6d3c0e';
    ctx.beginPath();
    ctx.moveTo(3.5, 14.5);
    ctx.lineTo(8.5, 14.5);
    ctx.lineTo(8.5, 12);
    ctx.lineTo(6, 13.2);
    ctx.lineTo(3.5, 12);
    ctx.closePath();
    ctx.fill();

    // 10. Golden Royal Crown
    ctx.save();
    ctx.translate(5, -19);
    ctx.rotate(0.18);

    ctx.beginPath();
    ctx.moveTo(-12, 4.5);
    ctx.lineTo(12, 4.5);
    ctx.lineTo(14, -8);
    ctx.lineTo(7, -1.5);
    ctx.lineTo(0, -13);
    ctx.lineTo(-7, -1.5);
    ctx.lineTo(-14, -8);
    ctx.closePath();

    const crownGrad = ctx.createLinearGradient(0, -13, 0, 5);
    crownGrad.addColorStop(0, '#fffde7');
    crownGrad.addColorStop(0.3, '#fff176');
    crownGrad.addColorStop(0.65, '#ffca28');
    crownGrad.addColorStop(1, '#ff8f00');
    ctx.fillStyle = crownGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#5d370e';
    ctx.stroke();

    ctx.fillStyle = '#fff9c4';
    for (let px = -9; px <= 9; px += 4.5) {
      ctx.beginPath();
      ctx.arc(px, 3, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    const rubyTips = [
      { x: -14, y: -8 },
      { x: 0, y: -13 },
      { x: 14, y: -8 }
    ];

    rubyTips.forEach((tip, idx) => {
      ctx.beginPath();
      ctx.arc(tip.x, tip.y, 2.8, 0, Math.PI * 2);
      ctx.fillStyle = '#e53935';
      ctx.fill();
      ctx.lineWidth = 1.3;
      ctx.strokeStyle = '#3e0606';
      ctx.stroke();

      const twinkle = Math.sin(this.frame * 0.16 + idx * 2);
      if (twinkle > 0.4) {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tip.x, tip.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(tip.x - 0.8, tip.y - 0.8, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, 2.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e0606';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();

    ctx.restore();
  }

  // Foreground Ground
  drawGround(ctx, curr, prev, t) {
    const groundY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT;
    const groundH = CONFIG.GROUND_HEIGHT;

    const earthGrad = ctx.createLinearGradient(0, groundY, 0, CONFIG.V_HEIGHT);
    if (this.activeThemeIdx === 2) {
      earthGrad.addColorStop(0, '#5d4e28');
      earthGrad.addColorStop(1, '#332711');
    } else {
      earthGrad.addColorStop(0, '#ded895');
      earthGrad.addColorStop(0.15, '#c9ba6b');
      earthGrad.addColorStop(1, '#9e8d47');
    }
    ctx.fillStyle = earthGrad;
    ctx.fillRect(0, groundY, CONFIG.V_WIDTH, groundH);

    ctx.fillStyle = this.activeThemeIdx === 2 ? '#388e3c' : '#55c544';
    ctx.fillRect(0, groundY, CONFIG.V_WIDTH, 14);

    ctx.fillStyle = this.activeThemeIdx === 2 ? '#1b5e20' : '#3ca02e';
    ctx.fillRect(0, groundY + 12, CONFIG.V_WIDTH, 4);

    ctx.fillStyle = this.activeThemeIdx === 2 ? '#4caf50' : '#73d763';
    for (let x = -36; x < CONFIG.V_WIDTH + 36; x += 18) {
      const gx = x - this.groundScroll;
      ctx.beginPath();
      ctx.moveTo(gx, groundY);
      ctx.lineTo(gx + 9, groundY + 8);
      ctx.lineTo(gx + 18, groundY);
      ctx.fill();
    }

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
      ctx.shadowColor = '#ffb300';
      ctx.shadowBlur = 6;
      ctx.beginPath();
      ctx.arc(sp.x, sp.y, sp.size, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  }

  // MAIN GAME LOOP
  loop(timestamp) {
    this.update();
    this.render();
    requestAnimationFrame((t) => this.loop(t));
  }
}

// Initialize on page load
window.addEventListener('DOMContentLoaded', () => {
  window.flyBirdGame = new FlyBirdGame();
});
