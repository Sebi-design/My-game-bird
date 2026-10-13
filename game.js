/**
 * Fly Bird - Royal Flight
 * Complete Game Engine, Dynamic Multi-Theme System, Zero-Lag Mobile Touch & Pro Vector Bird
 */

// Canvas roundRect polyfill for older browser support
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

// ==========================================
// COLOR UTILITIES FOR SMOOTH THEME BLENDING
// ==========================================
function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  const bigint = parseInt(clean, 16);
  if (clean.length === 6) {
    return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255];
  }
  return [255, 255, 255];
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
// AUDIO SYSTEM (Web Audio API Synthesizer)
// ==========================================
class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('flybird_muted') === 'true';
    this.initAudio();
  }

  initAudio() {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        this.ctx = new AudioContext();
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
    return this.muted;
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
      osc.frequency.exponentialRampToValueAtTime(840, now + 0.12);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.13);
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
        const delay = idx * 0.06;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, now + delay);

        gain.gain.setValueAtTime(0.28, now + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, now + delay + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + delay);
        osc.stop(now + delay + 0.3);
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
      osc.frequency.setValueAtTime(920, now);
      osc.frequency.setValueAtTime(1240, now + 0.08);

      gain.gain.setValueAtTime(0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
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
        const start = now + idx * 0.1;

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.3, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.25);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.26);
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
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(45, now + 0.22);

      gain.gain.setValueAtTime(0.4, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.25);
    } catch (e) {}
  }

  playGameOver() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    try {
      const now = this.ctx.currentTime;
      const notes = [440, 392, 349, 261];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const start = now + idx * 0.14;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);

        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.28);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(start);
        osc.stop(start + 0.3);
      });
    } catch (e) {}
  }
}

// ==========================================
// REALM THEMES DEFINITIONS
// ==========================================
const THEMES = [
  {
    id: 0,
    name: "☀️ Ziua",
    alertTitle: "☀️ REGATUL ZILEI",
    skyTop: "#1e88e5",
    skyMid: "#64b5f6",
    skyBot: "#e1f5fe",
    sunColor: "#fff9c4",
    sunGlow: "rgba(255, 238, 88, 0.4)",
    sunY: 130,
    showMoon: false,
    cloudColor: "rgba(255, 255, 255, 0.92)",
    cloudShade: "rgba(187, 222, 251, 0.5)",
    mountainColor: "rgba(79, 134, 198, 0.35)",
    castleColor: "rgba(41, 98, 175, 0.42)",
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
    name: "🌅 Apus Regal",
    alertTitle: "🌅 NIVEL 2: APUS REGAL!",
    skyTop: "#3e1254",
    skyMid: "#c2185b",
    skyBot: "#ffb74d",
    sunColor: "#ff7043",
    sunGlow: "rgba(255, 112, 67, 0.45)",
    sunY: 260,
    showMoon: false,
    cloudColor: "rgba(255, 224, 178, 0.88)",
    cloudShade: "rgba(194, 24, 91, 0.38)",
    mountainColor: "rgba(88, 24, 98, 0.42)",
    castleColor: "rgba(61, 14, 74, 0.55)",
    hillBack: "#795548",
    hillFront: "#5d4037",
    pipeBase: "#558b2f",
    pipeHighlight: "#9ccc65",
    pipeShadow: "#33691e",
    pipeOutline: "#1b3e0e",
    hasFireflies: true
  },
  {
    id: 2,
    name: "🌙 Noapte Regală",
    alertTitle: "🌙 NIVEL 3: NOAPTE REGALĂ!",
    skyTop: "#050b1a",
    skyMid: "#0d1b3e",
    skyBot: "#1a237e",
    sunColor: "#ffffff",
    sunGlow: "rgba(255, 255, 255, 0.15)",
    sunY: -100,
    showMoon: true,
    cloudColor: "rgba(57, 73, 171, 0.65)",
    cloudShade: "rgba(26, 35, 126, 0.7)",
    mountainColor: "rgba(13, 27, 62, 0.65)",
    castleColor: "rgba(8, 17, 43, 0.8)",
    hillBack: "#1b5e20",
    hillFront: "#0d3b13",
    pipeBase: "#2e7d32",
    pipeHighlight: "#66bb6a",
    pipeShadow: "#1b5e20",
    pipeOutline: "#09250c",
    hasFireflies: true
  }
];

// Game Configuration
const CONFIG = {
  V_WIDTH: 440,
  V_HEIGHT: 740,
  GRAVITY: 0.38,
  FLAP_POWER: -7.5,
  MAX_FALL_SPEED: 11,
  PIPE_SPEED_BASE: 2.3,
  PIPE_SPAWN_INTERVAL: 125,
  PIPE_GAP: 165,
  PIPE_WIDTH: 70,
  GROUND_HEIGHT: 95
};

// ==========================================
// GAME STATE MANAGEMENT
// ==========================================
class FlyBirdGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.ctx = this.canvas.getContext('2d');
    this.sound = new SoundFX();

    // DOM UI Elements
    this.startScreen = document.getElementById('start-screen');
    this.gameoverScreen = document.getElementById('gameover-screen');
    this.pauseScreen = document.getElementById('pause-screen');
    this.inGameScoreEl = document.getElementById('in-game-score');
    this.coinCountEl = document.getElementById('coin-count');
    this.realmIndicatorEl = document.getElementById('realm-indicator');
    this.realmAlertEl = document.getElementById('realm-alert');
    this.realmAlertTextEl = document.getElementById('realm-alert-text');
    this.bestScoreDisplay = document.getElementById('best-score-display');
    this.finalScoreEl = document.getElementById('final-score');
    this.finalBestEl = document.getElementById('final-best');
    this.newRecordTag = document.getElementById('new-record-tag');
    this.finalCoinsEl = document.getElementById('final-coins');
    this.finalRealmEl = document.getElementById('final-realm');
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

    // Player Bird
    this.bird = {
      x: 105,
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
      { x: 30, y: 70, scale: 0.95, speed: 0.3 },
      { x: 210, y: 130, scale: 1.25, speed: 0.45 },
      { x: 380, y: 55, scale: 0.75, speed: 0.28 },
      { x: 130, y: 200, scale: 0.85, speed: 0.35 }
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
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.5,
        pulseSpeed: 0.05 + Math.random() * 0.05,
        pulsePhase: Math.random() * Math.PI * 2
      });
    }
  }

  // ==========================================
  // MOBILE TOUCH & DESKTOP INPUT HANDLERS
  // ==========================================
  bindEvents() {
    window.addEventListener('resize', () => this.setupResolution());

    const handleAction = (e) => {
      // Debounce protection against rapid dual-firing (e.g. touchstart + pointerdown)
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

    // 1. Mobile Direct Touch (Zero Lag, preventDefault stops all browser zoom/scroll)
    this.canvas.addEventListener('touchstart', (e) => {
      e.preventDefault();
      handleAction(e);
    }, { passive: false });

    // 2. Desktop Pointerdown / Click
    this.canvas.addEventListener('pointerdown', (e) => {
      if (e.pointerType !== 'touch') {
        e.preventDefault();
        handleAction(e);
      }
    });

    // Touch wrapper as fallback
    const wrapper = document.getElementById('game-wrapper');
    wrapper.addEventListener('touchstart', (e) => {
      if (!e.target.closest('button')) {
        e.preventDefault();
        handleAction(e);
      }
    }, { passive: false });

    // 3. Desktop Keyboard
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

    // 4. UI Buttons Touch & Click
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
    this.spawnFeathers();
  }

  flap() {
    if (this.state !== 'PLAYING') return;
    this.bird.vy = CONFIG.FLAP_POWER;
    this.bird.wingTimer = 1.0;
    this.sound.playFlap();
    this.spawnFeathers();

    // Spawn tiny golden magic sparkles trailing from crown
    for (let i = 0; i < 3; i++) {
      this.goldSparkles.push({
        x: this.bird.x + (Math.random() - 0.5) * 16,
        y: this.bird.y - 18 + (Math.random() - 0.5) * 8,
        vx: -1.8 - Math.random() * 1.5,
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
    } else if (this.state === 'PAUSED') {
      this.state = 'PLAYING';
      this.pauseScreen.classList.remove('active');
      this.lastTime = performance.now();
    }
  }

  resetGame() {
    this.state = 'START';
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

    this.bird.x = 105;
    this.bird.y = CONFIG.V_HEIGHT / 2 - 35;
    this.bird.vy = 0;
    this.bird.angle = 0;

    this.startScreen.classList.add('active');
    this.gameoverScreen.classList.remove('active');
    this.pauseScreen.classList.remove('active');
    this.updateHUD();
  }

  // ==========================================
  // REALM THEME PROGRESSION
  // ==========================================
  checkThemeMilestones() {
    let targetIdx = 0;
    if (this.score >= 25) {
      targetIdx = 2; // Midnight Realm (25+ pts)
    } else if (this.score >= 10) {
      targetIdx = 1; // Sunset Realm (10+ pts)
    } else {
      targetIdx = 0; // Daytime Realm (0-9 pts)
    }

    if (targetIdx !== this.activeThemeIdx) {
      this.prevThemeIdx = this.activeThemeIdx;
      this.activeThemeIdx = targetIdx;
      this.themeTransition = 0.0;
      this.triggerThemeAlert(THEMES[targetIdx]);
      this.sound.playLevelUp();
    }
  }

  triggerThemeAlert(theme) {
    if (!this.realmAlertEl) return;
    this.realmAlertTextEl.textContent = theme.alertTitle;
    this.realmAlertEl.classList.add('show');
    clearTimeout(this.alertTimeout);
    this.alertTimeout = setTimeout(() => {
      this.realmAlertEl.classList.remove('show');
    }, 2800);
  }

  gameOver() {
    if (this.state === 'GAMEOVER') return;
    this.state = 'GAMEOVER';
    this.gameOverDelay = 25;
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

    if (this.newRecordTag) {
      this.newRecordTag.style.display = isNewBest && this.score > 0 ? 'inline-block' : 'none';
    }

    // Royal Medals
    let medal = 'Niciuna';
    let icon = '—';
    if (this.score >= 50) {
      medal = 'Coroană de Platină 👑';
      icon = '👑';
    } else if (this.score >= 25) {
      medal = 'Aur Regal 🥇';
      icon = '🥇';
    } else if (this.score >= 15) {
      medal = 'Argint Regal 🥈';
      icon = '🥈';
    } else if (this.score >= 7) {
      medal = 'Aripă de Bronz 🥉';
      icon = '🥉';
    }
    this.medalDisplayEl.innerHTML = `<span class="medal-icon">${icon}</span> ${medal}`;

    this.gameoverScreen.classList.add('active');
    this.updateHUD();

    // Explosion particles
    for (let i = 0; i < 26; i++) {
      const angle = (Math.PI * 2 * i) / 26;
      const speed = 2 + Math.random() * 5.5;
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
        vx: -1.6 - Math.random() * 2,
        vy: (Math.random() - 0.5) * 2.5,
        size: 3 + Math.random() * 4,
        color: '#ffffff',
        alpha: 0.9,
        life: 22
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
        life: 28
      });
    }
  }

  // ==========================================
  // PHYSICS & UPDATE LOOP
  // ==========================================
  update() {
    if (this.state === 'PAUSED') return;

    this.frame++;
    if (this.gameOverDelay > 0) this.gameOverDelay--;
    if (this.shakeTime > 0) this.shakeTime--;

    if (this.themeTransition < 1.0) {
      this.themeTransition = Math.min(1.0, this.themeTransition + 0.02);
    }

    this.fireflies.forEach(f => {
      f.x += f.vx;
      f.y += f.vy;
      f.pulsePhase += f.pulseSpeed;
      if (f.x < -20) f.x = CONFIG.V_WIDTH + 20;
      if (f.x > CONFIG.V_WIDTH + 20) f.x = -20;
    });

    if (this.state === 'START') {
      this.bird.y = CONFIG.V_HEIGHT / 2 - 35 + Math.sin(this.frame * 0.08) * 12;
      this.bird.angle = Math.sin(this.frame * 0.08) * 0.08;
      this.bird.wingTimer += 0.06;
      this.scrollScenery(1.2);
      return;
    }

    if (this.state === 'GAMEOVER') {
      if (this.bird.y + this.bird.radius < CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT) {
        this.bird.vy += CONFIG.GRAVITY * 1.25;
        this.bird.y += this.bird.vy;
        this.bird.angle = Math.min(Math.PI / 2, this.bird.angle + 0.12);
      }
      this.updateParticles();
      return;
    }

    // PLAYING:
    this.scrollScenery(this.speed);
    this.speed = CONFIG.PIPE_SPEED_BASE + Math.min(1.6, Math.floor(this.score / 10) * 0.18);

    // Bird physics
    this.bird.vy += CONFIG.GRAVITY;
    this.bird.vy = Math.min(this.bird.vy, CONFIG.MAX_FALL_SPEED);
    this.bird.y += this.bird.vy;

    if (this.bird.vy < 0) {
      this.bird.angle = Math.max(-0.45, this.bird.angle - 0.12);
    } else {
      this.bird.angle = Math.min(1.25, this.bird.angle + 0.045);
    }

    this.bird.wingTimer += (this.bird.vy < 0 ? 0.25 : 0.08);

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
    if (this.frame % Math.max(95, CONFIG.PIPE_SPAWN_INTERVAL - Math.floor(this.score / 6) * 2) === 0) {
      this.spawnPipes();
    }

    // Collision Box
    const birdBox = {
      x: this.bird.x - this.bird.radius * 0.76,
      y: this.bird.y - this.bird.radius * 0.76,
      w: this.bird.radius * 1.52,
      h: this.bird.radius * 1.52
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

      if (p.x + p.width < -50) {
        this.pipes.splice(i, 1);
      }
    }

    // Update Coins
    for (let i = this.coinItems.length - 1; i >= 0; i--) {
      const c = this.coinItems[i];
      c.x -= this.speed;
      c.bobPhase += 0.08;

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
    this.hillScroll = (this.hillScroll + amt * 0.4) % 200;

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
      pt.size *= 0.96;
      if (pt.alpha <= 0 || pt.size <= 0.5) {
        this.particles.splice(i, 1);
      }
    }

    for (let i = this.goldSparkles.length - 1; i >= 0; i--) {
      const sp = this.goldSparkles[i];
      sp.x += sp.vx;
      sp.y += sp.vy;
      sp.alpha -= 1 / sp.life;
      sp.size *= 0.96;
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
      const intensity = (this.shakeTime / 20) * 9;
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

    // 4. Parallax Mountains
    this.drawMountains(ctx, currTheme, prevTheme, t);

    // 5. Clouds
    this.drawClouds(ctx, currTheme, prevTheme, t);

    // 6. Castles
    this.drawCastles(ctx, currTheme, prevTheme, t);

    // 7. Rolling Hills
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

    // 12. Enhanced Royal Bird
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

    if (this.frame % 180 < 25) {
      const shootProg = (this.frame % 180) / 25;
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

  drawMountains(ctx, curr, prev, t) {
    const mountainCol = lerpColor(prev.mountainColor, curr.mountainColor, t);
    ctx.fillStyle = mountainCol;
    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - 30;

    ctx.beginPath();
    ctx.moveTo(0, baseY);
    ctx.lineTo(0, baseY - 60);
    ctx.lineTo(70, baseY - 130);
    ctx.lineTo(150, baseY - 75);
    ctx.lineTo(240, baseY - 150);
    ctx.lineTo(330, baseY - 90);
    ctx.lineTo(410, baseY - 165);
    ctx.lineTo(CONFIG.V_WIDTH, baseY - 110);
    ctx.lineTo(CONFIG.V_WIDTH, baseY);
    ctx.closePath();
    ctx.fill();
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

  drawCastles(ctx, curr, prev, t) {
    const castleCol = lerpColor(prev.castleColor, curr.castleColor, t);
    ctx.fillStyle = castleCol;
    const baseY = CONFIG.V_HEIGHT - CONFIG.GROUND_HEIGHT - 35;

    const castles = [
      { x: 30, w: 58, h: 120, spires: [12, 30, 46] },
      { x: 260, w: 78, h: 150, spires: [16, 40, 62] }
    ];

    castles.forEach(c => {
      ctx.fillRect(c.x, baseY - c.h + 40, c.w, c.h);
      for (let bx = c.x; bx < c.x + c.w; bx += 14) {
        ctx.fillRect(bx, baseY - c.h + 30, 8, 12);
      }
      c.spires.forEach(spX => {
        ctx.beginPath();
        ctx.moveTo(c.x + spX - 9, baseY - c.h + 30);
        ctx.lineTo(c.x + spX, baseY - c.h - 12);
        ctx.lineTo(c.x + spX + 9, baseY - c.h + 30);
        ctx.closePath();
        ctx.fill();

        ctx.fillRect(c.x + spX, baseY - c.h - 22, 2, 11);
        ctx.beginPath();
        ctx.moveTo(c.x + spX + 2, baseY - c.h - 22);
        ctx.lineTo(c.x + spX + 9, baseY - c.h - 17);
        ctx.lineTo(c.x + spX + 2, baseY - c.h - 12);
        ctx.fill();
      });

      if (this.activeThemeIdx === 2) {
        ctx.fillStyle = 'rgba(255, 238, 88, 0.85)';
        ctx.fillRect(c.x + 16, baseY - c.h + 60, 6, 9);
        ctx.fillRect(c.x + 36, baseY - c.h + 60, 6, 9);
        ctx.fillRect(c.x + 26, baseY - c.h + 85, 7, 11);
        ctx.fillStyle = castleCol;
      }
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

  // ==========================================
  // THE ENHANCED ROYAL BIRD (Stunning Pixar/Arcade Vector Art)
  // ==========================================
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
      const wave = Math.sin(this.frame * 0.24 + idx) * 4.5;
      ctx.moveTo(-38, offsetY + wave);
      ctx.quadraticCurveTo(-50, offsetY + wave - 3, -64, offsetY + wave + 2);
      ctx.stroke();
    });

    // 2. Billowing Royal Scarlet Cape
    ctx.save();
    const capeFlutter = Math.sin(this.frame * 0.4) * 7.5;
    ctx.beginPath();
    ctx.moveTo(-11, 4);
    ctx.bezierCurveTo(-26, 0 + capeFlutter, -40, 14 + capeFlutter, -48, 22 + capeFlutter);
    ctx.lineTo(-36, 31 + capeFlutter);
    ctx.bezierCurveTo(-24, 24 + capeFlutter, -14, 19, 0, 16);
    ctx.closePath();

    const capeGrad = ctx.createLinearGradient(-48, 10, 0, 16);
    capeGrad.addColorStop(0, '#ff5252');
    capeGrad.addColorStop(0.35, '#e53935');
    capeGrad.addColorStop(0.75, '#b71c1c');
    capeGrad.addColorStop(1, '#660000');
    ctx.fillStyle = capeGrad;
    ctx.fill();
    ctx.lineWidth = 2.6;
    ctx.strokeStyle = '#3e0606';
    ctx.stroke();

    // Fluffy Ermine Fur Trim on Cape Hem
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(-45, 24 + capeFlutter, 4.5, 0, Math.PI * 2);
    ctx.arc(-41, 28 + capeFlutter, 5, 0, Math.PI * 2);
    ctx.arc(-36, 31 + capeFlutter, 4.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e0606';
    ctx.lineWidth = 1.6;
    ctx.stroke();

    // Royal Ermine spots
    ctx.fillStyle = '#111';
    ctx.beginPath();
    ctx.arc(-41, 27 + capeFlutter, 1.4, 0, Math.PI * 2);
    ctx.arc(-45, 23 + capeFlutter, 1.1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Layered Tail Feathers
    ctx.lineWidth = 2.6;
    [-7, 0, 7].forEach((to, idx) => {
      ctx.beginPath();
      ctx.ellipse(-26, 2 + to, 9.5, 4.8, -0.28, 0, Math.PI * 2);
      const tailGrad = ctx.createLinearGradient(-35, to, -18, to);
      tailGrad.addColorStop(0, '#1565c0');
      tailGrad.addColorStop(1, '#1e88e5');
      ctx.fillStyle = tailGrad;
      ctx.fill();
      ctx.strokeStyle = '#0a2e66';
      ctx.stroke();

      // Tail feather highlight tip
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.beginPath();
      ctx.ellipse(-30, 2 + to, 4, 1.6, -0.28, 0, Math.PI * 2);
      ctx.fill();
    });

    // 4. Main Body: Chubby Vibrant Sky Blue Bird
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

    // Top Head Specular Highlight (3D gloss shine)
    ctx.fillStyle = 'rgba(255, 255, 255, 0.42)';
    ctx.beginPath();
    ctx.ellipse(-3, -12, 10, 4.5, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // 5. Pearlescent Creamy White Belly / Breast
    ctx.beginPath();
    ctx.ellipse(7, 7, 14, 11, 0.28, 0, Math.PI * 2);
    const bellyGrad = ctx.createLinearGradient(0, -2, 12, 18);
    bellyGrad.addColorStop(0, '#ffffff');
    bellyGrad.addColorStop(0.65, '#f0f9ff');
    bellyGrad.addColorStop(1, '#d8eefc');
    ctx.fillStyle = bellyGrad;
    ctx.fill();

    // Belly feather fluff contour
    ctx.strokeStyle = 'rgba(187, 222, 251, 0.6)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(6, 12, 5, 0.2, Math.PI * 0.8);
    ctx.arc(12, 11, 4.5, 0.2, Math.PI * 0.8);
    ctx.stroke();

    // 6. Rosy Cheek Blush with Cute Freckles
    ctx.fillStyle = 'rgba(255, 105, 180, 0.72)';
    ctx.beginPath();
    ctx.ellipse(10, 6, 6, 3.8, 0, 0, Math.PI * 2);
    ctx.fill();
    // 3 tiny cheek freckles
    ctx.fillStyle = 'rgba(255, 64, 129, 0.75)';
    [8, 10.5, 13].forEach((fx, i) => {
      ctx.beginPath();
      ctx.arc(fx, 6 + (i === 1 ? -1 : 0.5), 0.7, 0, Math.PI * 2);
      ctx.fill();
    });

    // 7. Flapping Multi-Feather Wing
    ctx.save();
    const wingAngle = Math.sin(b.wingTimer * 10) * 0.48;
    ctx.translate(-4, 0);
    ctx.rotate(wingAngle);

    // 3 Layered feather fingers
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

    // Feathers inside wing
    ctx.strokeStyle = '#0d47a1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-6, 0, 6.5, 0, Math.PI);
    ctx.moveTo(-10, 2);
    ctx.lineTo(-4, 5);
    ctx.stroke();

    // Wing top highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.beginPath();
    ctx.ellipse(-6, -3, 8, 2.5, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 8. Disney/Pixar Style Cartoon Eyes
    const eyeX = 12;
    const eyeY = -6;
    const eyeRadius = 8;

    if (!b.isBlinking) {
      // Eye socket & White sclera
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, eyeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = '#06285e';
      ctx.stroke();

      // Cyan Iris Ring
      ctx.beginPath();
      ctx.arc(eyeX + 2.5, eyeY, 4.5, 0, Math.PI * 2);
      ctx.fillStyle = '#0288d1';
      ctx.fill();

      // Deep Black Pupil
      ctx.beginPath();
      ctx.arc(eyeX + 3, eyeY, 3.6, 0, Math.PI * 2);
      ctx.fillStyle = '#050c26';
      ctx.fill();

      // Double Specular Reflection Glints
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(eyeX + 1.8, eyeY - 2.2, 2.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.beginPath();
      ctx.arc(eyeX + 4.2, eyeY + 1.5, 1.1, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Cute Happy Curved Blink
      ctx.beginPath();
      ctx.arc(eyeX, eyeY, 6.5, 0.2, Math.PI - 0.2);
      ctx.lineWidth = 2.8;
      ctx.strokeStyle = '#06285e';
      ctx.stroke();
    }

    // 9. Bright Orange Smiling Beak
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

    // Beak smile corner crease
    ctx.beginPath();
    ctx.arc(18, 2, 2.5, Math.PI * 0.8, Math.PI * 1.5);
    ctx.strokeStyle = '#8d4000';
    ctx.lineWidth = 1.8;
    ctx.stroke();

    // Beak top gloss
    ctx.fillStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.beginPath();
    ctx.ellipse(23, 0.5, 4.5, 1.4, 0.28, 0, Math.PI * 2);
    ctx.fill();

    // 10. Golden Royal Brooch at Throat
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

    // Tiny stamped crown in brooch
    ctx.fillStyle = '#6d3c0e';
    ctx.beginPath();
    ctx.moveTo(3.5, 14.5);
    ctx.lineTo(8.5, 14.5);
    ctx.lineTo(8.5, 12);
    ctx.lineTo(6, 13.2);
    ctx.lineTo(3.5, 12);
    ctx.closePath();
    ctx.fill();

    // 11. Golden Royal Crown on Head (Magnificent 3D Model with Twinkling Rubies)
    ctx.save();
    ctx.translate(5, -19);
    ctx.rotate(0.18);

    // Crown Base Band & Peaks
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

    // Pearl band on crown base
    ctx.fillStyle = '#fff9c4';
    for (let px = -9; px <= 9; px += 4.5) {
      ctx.beginPath();
      ctx.arc(px, 3, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    // 3 Sparkling Faceted Ruby Jewels on Peaks
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

      // Twinkling sparkle star glint on gems
      const twinkle = Math.sin(this.frame * 0.15 + idx * 2);
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

    // Center Large Ruby on Crown Headband
    ctx.fillStyle = '#c62828';
    ctx.beginPath();
    ctx.ellipse(0, 1.5, 2.5, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3e0606';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore(); // Crown restore

    ctx.restore(); // Bird transform restore
  }

  // ==========================================
  // FOREGROUND GROUND
  // ==========================================
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

  // ==========================================
  // MAIN GAME LOOP
  // ==========================================
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
