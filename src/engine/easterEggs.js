// Easter Eggs & Secret Triggers
import { soundEngine } from '../audio/soundEngine.js';

export class EasterEggManager {
  constructor({ kevin, onSecretMode, showToast }) {
    this.kevin = kevin;
    this.onSecretMode = onSecretMode;
    this.showToast = showToast;
    this.recentChars = '';
    this.spaceCount = 0;
    this.backspaceCount = 0;
    this.spaceResetTimer = null;
    this.backspaceResetTimer = null;
  }

  handleKeyDown(e) {
    // Intercept ESC
    if (e.key === 'Escape') {
      this.showToast("Nice try. There is no escaping this keyboard.", "😏");
      soundEngine.playKevinQuip();
      return true;
    }

    // Intercept F1
    if (e.key === 'F1') {
      e.preventDefault();
      this.showToast("F1: Help is currently on vacation indefinitely.", "🤷");
      soundEngine.playKevinQuip();
      return true;
    }

    // Intercept F12
    if (e.key === 'F12') {
      e.preventDefault();
      this.showToast("F12: Developer tools? Absolutely not. No inspecting your destiny.", "🚫");
      soundEngine.playWarningAlarm();
      return true;
    }

    // Repeated SPACE detection
    if (e.key === ' ') {
      this.spaceCount++;
      clearTimeout(this.spaceResetTimer);
      this.spaceResetTimer = setTimeout(() => { this.spaceCount = 0; }, 1500);

      if (this.spaceCount >= 6) {
        this.showToast("STOP MASHING SPACEBAR. It has feelings too.", "🛑");
        soundEngine.playError();
        this.spaceCount = 0;
      }
    }

    // Repeated BACKSPACE detection
    if (e.key === 'Backspace') {
      this.backspaceCount++;
      clearTimeout(this.backspaceResetTimer);
      this.backspaceResetTimer = setTimeout(() => { this.backspaceCount = 0; }, 1500);

      if (this.backspaceCount >= 5) {
        this.showToast("YOU CAN'T UNDO LIFE.", "💀");
        soundEngine.playKevinQuip();
        this.backspaceCount = 0;
      }
    }

    // Track sequential typing buffer for secret strings
    if (e.key.length === 1) {
      this.recentChars = (this.recentChars + e.key.toLowerCase()).slice(-20);

      if (this.recentChars.includes('konami')) {
        this.recentChars = '';
        this.triggerKonamiEasterEgg();
      } else if (this.recentChars.includes('skillissue') || this.recentChars.includes('skill issue')) {
        this.recentChars = '';
        this.kevin.say("Someone called? Yes, it's definitely a skill issue.", '👀', 5000);
      }
    }

    return false;
  }

  triggerKonamiEasterEgg() {
    soundEngine.playAchievement();
    this.showToast("🎮 KONAMI CODE DETECTED: SECRET DISCO INVERTED MODE UNLOCKED!", "✨");
    document.body.classList.add('disco-secret-mode');
    setTimeout(() => {
      document.body.classList.remove('disco-secret-mode');
    }, 6000);
    if (this.onSecretMode) this.onSecretMode();
  }

  triggerPerfectRoundCelebration() {
    soundEngine.playAchievement();
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal perfect-round-modal';
    modal.innerHTML = `
      <div class="perfect-card">
        <h1>WAIT.</h1>
        <h2>THAT WAS 100% PERFECT.</h2>
        <div class="robot-face">🤖</div>
        <p>ARE YOU A ROBOT? No human should have survived that cursed mapping with zero mistakes.</p>
        <button type="button" class="perfect-btn" id="perfect-continue">I AM MERELY SUPERIOR</button>
      </div>
    `;
    document.body.appendChild(modal);

    modal.querySelector('#perfect-continue').addEventListener('click', () => {
      modal.remove();
    });
  }
}
