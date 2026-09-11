// Random In-Game Events Engine
import { soundEngine } from '../audio/soundEngine.js';

export class RandomEventsEngine {
  constructor({ virtualKeyboard, appContainer, onEventStart, onEventEnd }) {
    this.vk = virtualKeyboard;
    this.appContainer = appContainer;
    this.onEventStart = onEventStart;
    this.onEventEnd = onEventEnd;
    this.timer = null;
    this.activeEventModal = null;
  }

  startMonitoring(minIntervalSec = 22, maxIntervalSec = 45) {
    this.scheduleNext(minIntervalSec, maxIntervalSec);
  }

  stopMonitoring() {
    clearTimeout(this.timer);
  }

  scheduleNext(minSec = 22, maxSec = 45) {
    clearTimeout(this.timer);
    const delayMs = (Math.floor(Math.random() * (maxSec - minSec)) + minSec) * 1000;
    this.timer = setTimeout(() => {
      this.triggerRandomEvent();
      this.scheduleNext(minSec, maxSec);
    }, delayMs);
  }

  triggerRandomEvent() {
    const events = [
      () => this.eventKeyboardPanic(),
      () => this.eventWindowsUpdate(),
      () => this.eventTechnicalDifficulties(),
      () => this.eventCapsLockIncident(),
      () => this.eventGravityFailure(),
      () => this.eventKeyboardMigration(),
      () => this.eventNpcMode(),
      () => this.eventFakeSystemNotification()
    ];

    const chosen = events[Math.floor(Math.random() * events.length)];
    chosen();
  }

  // 8. FAKE SYSTEM NOTIFICATION
  eventFakeSystemNotification() {
    soundEngine.playKevinQuip();
    const fakeAlerts = [
      { title: "🔔 SYSTEM MESSAGE", text: "Keyboard has requested emotional support. 😭⌨️" },
      { title: "⚠️ WINDOWS-ISH WARNING", text: "Your typing may be causing unnecessary keyboard wear. 🔨💀" },
      { title: "📡 NETWORK ALERT", text: "Your mistakes have been successfully uploaded to nobody. 🚀😂" },
      { title: "🧑‍💻 IT DEPARTMENT", text: "We have absolutely no idea what you're doing. 🤷‍♂️👓" },
      { title: "⚠️ TYPING PERFORMANCE ALERT", text: "Your accuracy has reached historically low levels. This achievement cannot be reversed. 📉🗿" }
    ];
    const alert = fakeAlerts[Math.floor(Math.random() * fakeAlerts.length)];
    const card = document.createElement('div');
    card.className = 'fake-system-toast';
    card.innerHTML = `
      <div class="fake-toast-hdr">${alert.title}</div>
      <div class="fake-toast-body">${alert.text}</div>
    `;
    document.body.appendChild(card);
    setTimeout(() => {
      card.classList.add('fade-out');
      setTimeout(() => card.remove(), 400);
    }, 4500);
  }

  // 1. KEYBOARD PANIC
  eventKeyboardPanic() {
    soundEngine.playWarningAlarm();
    this.showEventBanner("⚠️ EVENT: KEYBOARD PANIC! HARDWARE SEIZURE IN PROGRESS");
    this.vk.triggerPanic(3000);
  }

  // 2. WINDOWS UPDATE
  eventWindowsUpdate() {
    soundEngine.playWarningAlarm();
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal windows-update-modal';
    modal.innerHTML = `
      <div class="update-box">
        <div class="update-spinner"></div>
        <h2 class="update-title">Working on updates</h2>
        <div class="update-percent" id="upd-perc">0%</div>
        <p class="update-subtitle">Installing Critical Cursed Keyboard Driver Update v99.4</p>
        <p class="update-subtext">Don't turn off your PC. This will take between 5 seconds and 40 years.</p>
      </div>
    `;
    document.body.appendChild(modal);

    const percEl = modal.querySelector('#upd-perc');
    const steps = [0, 12, 34, 57, 78, 89, 99];
    let stepIdx = 0;

    const interval = setInterval(() => {
      stepIdx++;
      if (stepIdx < steps.length) {
        if (percEl) percEl.textContent = `${steps[stepIdx]}%`;
      } else {
        clearInterval(interval);
        if (percEl) percEl.textContent = "100%";
        modal.querySelector('.update-title').textContent = "Just kidding.";
        modal.querySelector('.update-subtitle').textContent = "Returning you to your suffering immediately.";
        setTimeout(() => {
          modal.remove();
        }, 1200);
      }
    }, 400);
  }

  // 3. TECHNICAL DIFFICULTIES
  eventTechnicalDifficulties() {
    soundEngine.playError();
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal tech-diff-modal';
    modal.innerHTML = `
      <div class="tech-diff-card">
        <div class="test-pattern-bar"></div>
        <h1>PLEASE STAND BY</h1>
        <h2>⚠️ TECHNICAL DIFFICULTIES</h2>
        <p>We have absolutely no idea what happened.</p>
        <div class="tech-joke">A technician has been dispatched into the void.</div>
      </div>
    `;
    document.body.appendChild(modal);

    setTimeout(() => {
      modal.remove();
    }, 2800);
  }

  // 4. CAPS LOCK INCIDENT
  eventCapsLockIncident() {
    soundEngine.playWarningAlarm();
    document.body.classList.add('caps-lock-incident');
    this.showEventBanner("📢 EVENT: CAPS LOCK INCIDENT — WHY ARE YOU SHOUTING?!");

    setTimeout(() => {
      document.body.classList.remove('caps-lock-incident');
    }, 4500);
  }

  // 5. GRAVITY FAILURE
  eventGravityFailure() {
    soundEngine.playWarningAlarm();
    this.showEventBanner("🚀 EVENT: ZERO GRAVITY DETECTED — KEYBOARD DRIFTING!");
    this.vk.triggerGravityFailure(4500);
  }

  // 6. KEYBOARD MIGRATION
  eventKeyboardMigration() {
    soundEngine.playWarningAlarm();
    this.showEventBanner("🦆 EVENT: KEYBOARD MIGRATION — KEYS FLYING SOUTH FOR WINTER");
    this.vk.triggerMigration(4000);
  }

  // 7. NPC MODE
  eventNpcMode() {
    soundEngine.playKevinQuip();
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal npc-modal';
    modal.innerHTML = `
      <div class="npc-dialog-box">
        <div class="npc-portrait">🧙‍♂️</div>
        <div class="npc-content">
          <div class="npc-name">ELDER QWERTYUS</div>
          <div class="npc-speech">"Have you tried typing correctly?"</div>
          <div class="npc-actions">
            <button type="button" class="npc-btn" id="npc-no-btn">NO</button>
            <button type="button" class="npc-btn" id="npc-definitely-not-btn">ABSOLUTELY NOT</button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const handleAnswer = () => {
      modal.querySelector('.npc-speech').textContent = '"Understandable. Have a terrible day."';
      modal.querySelector('.npc-actions').innerHTML = '<span class="npc-bye">Closing consultation...</span>';
      setTimeout(() => modal.remove(), 1200);
    };

    modal.querySelector('#npc-no-btn').addEventListener('click', handleAnswer);
    modal.querySelector('#npc-definitely-not-btn').addEventListener('click', handleAnswer);
  }

  showEventBanner(text) {
    const banner = document.createElement('div');
    banner.className = 'event-flash-banner';
    banner.textContent = text;
    document.body.appendChild(banner);

    setTimeout(() => {
      banner.classList.add('fade-out');
      setTimeout(() => banner.remove(), 500);
    }, 3000);
  }
}
