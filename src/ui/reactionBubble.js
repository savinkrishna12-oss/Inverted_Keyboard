// Reaction Speech Bubble and Sarcastic Judgment Display Component
export class ReactionBubbleManager {
  constructor(containerEl) {
    this.container = containerEl;
    this.activeBubble = null;
    this.bubbleTimeout = null;
    this.lessChaos = false;
  }

  setLessChaos(enabled) {
    this.lessChaos = enabled;
  }

  // Show a dynamic sarcastic reaction bubble
  showReaction({
    message,
    pressedKey = null,
    neededKey = null,
    isRare = false,
    rareData = null
  }) {
    // If rare reaction triggered
    if (isRare && rareData) {
      this.handleRareReaction(rareData);
      return;
    }

    if (!this.container) return;

    // Clear previous bubble if exists
    if (this.activeBubble) {
      this.activeBubble.remove();
      this.activeBubble = null;
    }
    clearTimeout(this.bubbleTimeout);

    const bubble = document.createElement('div');
    bubble.className = 'reaction-speech-bubble';
    if (this.lessChaos) {
      bubble.classList.add('less-chaos');
    }

    // Slight randomized offset and rotation for organic comedy feel
    const rot = this.lessChaos ? 0 : (Math.random() * 8 - 4).toFixed(1);
    const offsetX = this.lessChaos ? 0 : (Math.random() * 30 - 15).toFixed(0);
    bubble.style.transform = `translateX(${offsetX}px) rotate(${rot}deg)`;

    let keyCompareHtml = '';
    if (pressedKey && neededKey && pressedKey.toLowerCase() !== neededKey.toLowerCase()) {
      keyCompareHtml = `
        <div class="bubble-key-compare">
          <span class="bad-key">${pressedKey.toUpperCase()} ❌</span>
          <span class="compare-arrow">wanted</span>
          <span class="good-key">${neededKey.toUpperCase()} ✅</span>
        </div>
      `;
    }

    bubble.innerHTML = `
      <div class="bubble-tail"></div>
      <div class="bubble-content">
        ${keyCompareHtml}
        <div class="bubble-text">${message}</div>
      </div>
    `;

    this.container.appendChild(bubble);
    this.activeBubble = bubble;

    // UI screen jitter unless less chaos
    if (!this.lessChaos) {
      this.triggerUIJitter();
    }

    const duration = message.length > 35 ? 2200 : 1600;
    this.bubbleTimeout = setTimeout(() => {
      if (this.activeBubble === bubble) {
        bubble.classList.add('bubble-exit');
        setTimeout(() => {
          bubble.remove();
          if (this.activeBubble === bubble) this.activeBubble = null;
        }, 300);
      }
    }, duration);
  }

  triggerUIJitter() {
    const arena = document.querySelector('.typing-arena');
    if (arena) {
      arena.classList.add('arena-reaction-shake');
      setTimeout(() => arena.classList.remove('arena-reaction-shake'), 240);
    }
  }

  handleRareReaction(rareData) {
    if (rareData.type === 'banner') {
      const banner = document.createElement('div');
      banner.className = 'rare-event-flash';
      banner.innerHTML = `
        <div class="rare-flash-title">${rareData.title}</div>
        <div class="rare-flash-sub">${rareData.subtext}</div>
      `;
      document.body.appendChild(banner);
      setTimeout(() => {
        banner.classList.add('fade-out');
        setTimeout(() => banner.remove(), 400);
      }, 2600);
    } else if (rareData.type === 'trophy') {
      const banner = document.createElement('div');
      banner.className = 'rare-event-flash golden-trophy';
      banner.innerHTML = `
        <div class="rare-flash-title">${rareData.title}</div>
        <div class="rare-flash-sub">${rareData.subtext}</div>
      `;
      document.body.appendChild(banner);
      setTimeout(() => {
        banner.classList.add('fade-out');
        setTimeout(() => banner.remove(), 500);
      }, 3200);
    }
  }

  // Interval joke sequence
  triggerIntervalBreak() {
    const overlay = document.createElement('div');
    overlay.className = 'cursed-overlay-modal interval-modal';
    overlay.innerHTML = `
      <div class="interval-card">
        <h1 class="interval-title">🎬 INTERVAL</h1>
        <p class="interval-text">കാരണം നിന്റെ typing കണ്ടിട്ട് game-നും ഒരു break വേണം. 😭☕</p>
        <div class="interval-sub">(The game is emotionally recovering from your typos)</div>
        <button type="button" class="action-btn" id="interval-resume-btn">നമുക്ക് തുടരാം (Resume Suffering)</button>
      </div>
    `;
    document.body.appendChild(overlay);
    overlay.querySelector('#interval-resume-btn').addEventListener('click', () => {
      overlay.remove();
    });
  }
}
