// Procedural Web Audio API Sound Engine (Zero external audio assets required)
class SoundEngine {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.masterGain = null;
    this.hasInteracted = false;
    
    // Load mute preference
    try {
      this.muted = localStorage.getItem('cursed_muted') === 'true';
    } catch (e) {
      this.muted = false;
    }
  }

  init() {
    if (this.ctx) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.hasInteracted = true;
    } catch (err) {
      console.warn('Web Audio not supported or blocked:', err);
    }
  }

  ensureContext() {
    if (!this.ctx) this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  toggleMute() {
    this.muted = !this.muted;
    try {
      localStorage.setItem('cursed_muted', this.muted);
    } catch (e) {}
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : 0.45, this.ctx.currentTime, 0.02);
    }
    return this.muted;
  }

  isMuted() {
    return this.muted;
  }

  // Mechanical switch click
  playKeyClick(isCursed = false) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    filter.type = 'lowpass';
    filter.frequency.value = isCursed ? 800 : 2400;

    // Pitch variation
    const baseFreq = isCursed ? 180 + Math.random() * 80 : 380 + Math.random() * 100;
    osc.type = isCursed ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(baseFreq, t);
    osc.frequency.exponentialRampToValueAtTime(40, t + 0.04);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.05);
  }

  // Wrong key funny buzzer / cartoon sound variations
  playError() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const variation = Math.floor(Math.random() * 4);

    if (variation === 0) {
      // 1. Dissonant minor second buzzer
      const osc1 = this.ctx.createOscillator();
      const osc2 = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'square';
      osc1.frequency.setValueAtTime(110, t);
      osc2.frequency.setValueAtTime(117, t);
      osc1.frequency.linearRampToValueAtTime(80, t + 0.15);
      osc2.frequency.linearRampToValueAtTime(85, t + 0.15);

      gain.gain.setValueAtTime(0.4, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.16);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(this.masterGain);

      osc1.start(t);
      osc2.start(t);
      osc1.stop(t + 0.16);
      osc2.stop(t + 0.16);
    } else if (variation === 1) {
      // 2. Comedic spring / cartoon squeak
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(450, t);
      osc.frequency.exponentialRampToValueAtTime(140, t + 0.18);

      gain.gain.setValueAtTime(0.35, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.19);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.2);
    } else if (variation === 2) {
      // 3. Deep disappointment "bruh" thud
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(95, t);
      osc.frequency.exponentialRampToValueAtTime(45, t + 0.22);

      gain.gain.setValueAtTime(0.45, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.23);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.24);
    } else {
      // 4. Quick dissonant double-honk
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'square';
      osc.frequency.setValueAtTime(130, t);
      osc.frequency.setValueAtTime(120, t + 0.08);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.19);
    }
  }

  // Correct key pleasant harmonic ping
  playCorrect(streak = 1) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale based on streak modulo
    const scale = [523.25, 587.33, 659.25, 783.99, 880.00, 1046.50];
    const freq = scale[(streak - 1) % scale.length];

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.1);
  }

  // Combo milestone celebration
  playComboMilestone(comboLevel) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const notes = [440, 554.37, 659.25, 880];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t + idx * 0.06);

      gain.gain.setValueAtTime(0.3, t + idx * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.06 + 0.2);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t + idx * 0.06);
      osc.stop(t + idx * 0.06 + 0.25);
    });
  }

  // Siren / alarm for Betrayal Mode & low sanity
  playWarningAlarm() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.linearRampToValueAtTime(900, t + 0.12);
    osc.frequency.linearRampToValueAtTime(600, t + 0.24);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.28);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.3);
  }

  // Dramatic countdown beep (3, 2, 1)
  playCountdown(pitch = 440) {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(pitch, t);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.2);
  }

  // Movie Mode & Boss dramatic cinema boom
  playDramaticBoom() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noise = this.ctx.createBufferSource();
    const filter = this.ctx.createBiquadFilter();
    const gain = this.ctx.createGain();

    // Deep sub-bass drop
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + 1.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.linearRampToValueAtTime(60, t + 1.2);

    gain.gain.setValueAtTime(0.6, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 1.5);
  }

  // Achievement unlock triumphant fanfare
  playAchievement() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const chord = [523.25, 659.25, 783.99, 1046.50]; // C Major
    chord.forEach(freq => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.25, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(t);
      osc.stop(t + 0.8);
    });
  }

  // Kevin mascot sarcastic squeak
  playKevinQuip() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(680, t + 0.08);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.1);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  // Sanity crash death sound
  playSanityCrash() {
    if (this.muted) return;
    this.ensureContext();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.linearRampToValueAtTime(40, t + 0.8);

    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(this.masterGain);

    osc.start(t);
    osc.stop(t + 0.95);
  }
}

export const soundEngine = new SoundEngine();
