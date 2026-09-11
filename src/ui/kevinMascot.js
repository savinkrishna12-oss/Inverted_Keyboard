// Kevin the Keyboard Technician Mascot
import { soundEngine } from '../audio/soundEngine.js';

const KEVIN_ADVICE = [
  "Try pressing the correct key.",
  "Have you considered simply not making mistakes?",
  "Your keyboard is not the problem. Look in a mirror.",
  "I refuse to comment on this performance without legal counsel.",
  "Skill issue. Immense, unprecedented skill issue.",
  "Maybe switch to a typewriter or smoke signals.",
  "I've been in IT for 20 years and this physically hurt me.",
  "Turn the monitor off and on again. Maybe it resets your fingers.",
  "Bro typed with the confidence of someone who forgot their glasses.",
  "Have you checked if your keyboard is plugged into another dimension?"
];

const KEVIN_MISTAKE_ROASTS = [
  "I've seen calculators type better.",
  "That was not even in the same postal code as the right key.",
  "Are you typing with your elbows?",
  "NASA has requested you stop transmitting nonsense.",
  "The backspace key is filing for worker's compensation."
];

const KEVIN_PRAISE_ROASTS = [
  "Okay, calm down Einstein.",
  "Suspiciously competent. Are you an undercover bot?",
  "Don't get cocky. The next key is waiting.",
  "Keyboard engineers are mildly perturbed by your competence."
];

export class KevinMascot {
  constructor(containerEl, onConsult) {
    this.container = containerEl;
    this.onConsult = onConsult;
    this.bubbleTimeout = null;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="kevin-wrapper">
        <div class="kevin-bubble" id="kevin-bubble">
          <span id="kevin-bubble-text">Hi, I'm Kevin. I repair keyboards. Yours is hopeless.</span>
        </div>
        <div class="kevin-avatar" id="kevin-avatar" title="Click Kevin or Ask for Advice">
          <div class="kevin-sprite">
            <div class="kevin-face">
              <div class="kevin-glasses">
                <span class="lens"></span>
                <span class="bridge"></span>
                <span class="lens"></span>
              </div>
              <div class="kevin-expression normal" id="kevin-expression">😐</div>
              <div class="kevin-tie">👔</div>
            </div>
            <div class="kevin-wrench">🔧</div>
          </div>
          <div class="kevin-name-tag">KEVIN (IT DEPT)</div>
        </div>
        <button type="button" class="kevin-advice-btn" id="kevin-advice-btn">
          Ask Kevin for advice 💡
        </button>
      </div>
    `;

    this.bubbleEl = this.container.querySelector('#kevin-bubble');
    this.bubbleText = this.container.querySelector('#kevin-bubble-text');
    this.expressionEl = this.container.querySelector('#kevin-expression');
    this.avatarEl = this.container.querySelector('#kevin-avatar');
    this.adviceBtn = this.container.querySelector('#kevin-advice-btn');

    this.adviceBtn.addEventListener('click', () => this.giveAdvice());
    this.avatarEl.addEventListener('click', () => this.giveAdvice());
  }

  say(message, expression = '😐', durationMs = 4500) {
    soundEngine.playKevinQuip();
    if (this.bubbleText) this.bubbleText.textContent = message;
    if (this.expressionEl) this.expressionEl.textContent = expression;
    if (this.bubbleEl) {
      this.bubbleEl.classList.add('visible', 'pop-in');
      clearTimeout(this.bubbleTimeout);
      this.bubbleTimeout = setTimeout(() => {
        this.bubbleEl.classList.remove('pop-in');
        this.bubbleEl.classList.remove('visible');
      }, durationMs);
    }
  }

  giveAdvice() {
    const advice = KEVIN_ADVICE[Math.floor(Math.random() * KEVIN_ADVICE.length)];
    this.say(advice, '🧐', 5000);
    if (this.onConsult) this.onConsult();
  }

  onManyMistakes() {
    const roast = KEVIN_MISTAKE_ROASTS[Math.floor(Math.random() * KEVIN_MISTAKE_ROASTS.length)];
    this.say(roast, '🤦‍♂️', 4500);
  }

  onHighCombo() {
    const praise = KEVIN_PRAISE_ROASTS[Math.floor(Math.random() * KEVIN_PRAISE_ROASTS.length)];
    this.say(praise, '😏', 4000);
  }

  onRoundFailed() {
    this.say("I could have done better with my monitor turned off.", '💀', 5000);
  }
}
