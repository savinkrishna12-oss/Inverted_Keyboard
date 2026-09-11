// Visual Virtual Keyboard Component
import { soundEngine } from '../audio/soundEngine.js';

const KEYBOARD_LAYOUT = [
  [
    { key: '`', label: '`' }, { key: '1', label: '1' }, { key: '2', label: '2' }, { key: '3', label: '3' },
    { key: '4', label: '4' }, { key: '5', label: '5' }, { key: '6', label: '6' }, { key: '7', label: '7' },
    { key: '8', label: '8' }, { key: '9', label: '9' }, { key: '0', label: '0' }, { key: '-', label: '-' },
    { key: '=', label: '=' }, { key: 'Backspace', label: '⌫ Backspace', width: 'wide' }
  ],
  [
    { key: 'Tab', label: 'Tab ⇥', width: 'medium' },
    { key: 'q', label: 'Q' }, { key: 'w', label: 'W' }, { key: 'e', label: 'E' }, { key: 'r', label: 'R' },
    { key: 't', label: 'T' }, { key: 'y', label: 'Y' }, { key: 'u', label: 'U' }, { key: 'i', label: 'I' },
    { key: 'o', label: 'O' }, { key: 'p', label: 'P' }, { key: '[', label: '[' }, { key: ']', label: ']' },
    { key: '\\', label: '\\' }
  ],
  [
    { key: 'CapsLock', label: 'Caps 🔒', width: 'medium' },
    { key: 'a', label: 'A' }, { key: 's', label: 'S' }, { key: 'd', label: 'D' }, { key: 'f', label: 'F' },
    { key: 'g', label: 'G' }, { key: 'h', label: 'H' }, { key: 'j', label: 'J' }, { key: 'k', label: 'K' },
    { key: 'l', label: 'L' }, { key: ';', label: ';' }, { key: "'", label: "'" },
    { key: 'Enter', label: '↵ Enter', width: 'wide' }
  ],
  [
    { key: 'Shift', label: '⇧ Shift', width: 'extra-wide' },
    { key: 'z', label: 'Z' }, { key: 'x', label: 'X' }, { key: 'c', label: 'C' }, { key: 'v', label: 'V' },
    { key: 'b', label: 'B' }, { key: 'n', label: 'N' }, { key: 'm', label: 'M' }, { key: ',', label: ',' },
    { key: '.', label: '.' }, { key: '/', label: '/' },
    { key: 'ShiftRight', label: '⇧ Shift', width: 'extra-wide' }
  ],
  [
    { key: 'Control', label: 'Ctrl', width: 'medium' },
    { key: 'Alt', label: 'Alt', width: 'medium' },
    { key: ' ', label: '␣ SPACE (MIND YOUR SANITY)', width: 'spacebar' },
    { key: 'AltGraph', label: 'Alt', width: 'medium' },
    { key: 'ControlRight', label: 'Ctrl', width: 'medium' }
  ]
];

export class VirtualKeyboard {
  constructor(containerEl, mappingEngine, onKeyClick) {
    this.container = containerEl;
    this.mappingEngine = mappingEngine;
    this.onKeyClick = onKeyClick;
    this.keyElements = new Map();
    this.isPanicking = false;
    this.isFloating = false;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="virtual-keyboard-header">
        <div class="vk-badge">CURSED HARDWARE SIMULATOR v4.04</div>
        <div class="vk-legend">
          <span class="legend-item"><span class="legend-box normal-box">A</span> Real Key</span>
          <span class="legend-arrow">↓</span>
          <span class="legend-item"><span class="legend-box cursed-box">Z</span> Cursed Output</span>
        </div>
        <div class="vk-mobile-note">⚠️ Highly recommended: play with a physical keyboard for maximum regret.</div>
      </div>
      <div class="virtual-keyboard-matrix" id="vk-matrix"></div>
      <div class="vk-debug-bar" id="vk-debug-bar">
        <div class="debug-col"><span class="debug-label">YOU PRESSED:</span> <span class="debug-val" id="dbg-pressed">—</span></div>
        <div class="debug-arrow">⚡</div>
        <div class="debug-col"><span class="debug-label">COMPUTER HEARD:</span> <span class="debug-val cursed-text" id="dbg-heard">—</span></div>
        <div class="debug-col"><span class="debug-label">DIAGNOSIS:</span> <span class="debug-val roast-text" id="dbg-roast">Ready to disappoint</span></div>
      </div>
    `;

    const matrixEl = this.container.querySelector('#vk-matrix');
    this.keyElements.clear();

    KEYBOARD_LAYOUT.forEach(row => {
      const rowEl = document.createElement('div');
      rowEl.className = 'vk-row';

      row.forEach(keyDef => {
        const keyEl = document.createElement('button');
        keyEl.type = 'button';
        keyEl.className = `vk-key ${keyDef.width || ''}`;
        keyEl.dataset.key = keyDef.key.toLowerCase();

        const normalLabel = keyDef.label;
        const cursedChar = this.mappingEngine.transformKey(keyDef.key);

        keyEl.innerHTML = `
          <span class="vk-key-normal">${normalLabel}</span>
          ${keyDef.key.length === 1 ? `<span class="vk-key-cursed">${cursedChar.toUpperCase()}</span>` : ''}
        `;

        keyEl.addEventListener('click', (e) => {
          e.preventDefault();
          keyEl.blur();
          this.highlightKey(keyDef.key, true);
          if (this.onKeyClick) this.onKeyClick(keyDef.key);
        });

        rowEl.appendChild(keyEl);
        this.keyElements.set(keyDef.key.toLowerCase(), keyEl);
      });

      matrixEl.appendChild(rowEl);
    });

    this.pressedEl = this.container.querySelector('#dbg-pressed');
    this.heardEl = this.container.querySelector('#dbg-heard');
    this.roastEl = this.container.querySelector('#dbg-roast');
  }

  setMappingEngine(engine) {
    this.mappingEngine = engine;
    this.updateMappings();
  }

  highlightTargetKey(targetChar) {
    this.keyElements.forEach(el => el.classList.remove('target-key-hint'));
    if (!targetChar) return;
    const physicalKey = this.mappingEngine.getPhysicalKeyFor(targetChar);
    if (physicalKey) {
      const el = this.keyElements.get(physicalKey.toLowerCase());
      if (el) el.classList.add('target-key-hint');
    }
  }

  updateMappings() {
    this.keyElements.forEach((keyEl, keyStr) => {
      if (keyStr.length === 1) {
        const cursedChar = this.mappingEngine.transformKey(keyStr);
        const cursedEl = keyEl.querySelector('.vk-key-cursed');
        if (cursedEl) {
          cursedEl.textContent = cursedChar.toUpperCase();
          cursedEl.classList.add('cursed-glitch');
          setTimeout(() => cursedEl.classList.remove('cursed-glitch'), 400);
        }
      }
    });
  }

  highlightKey(rawKey, wasDirectClick = false) {
    const lookup = rawKey.toLowerCase();
    const keyEl = this.keyElements.get(lookup);
    if (!keyEl) return;

    keyEl.classList.add('active', 'key-shake');
    setTimeout(() => {
      keyEl.classList.remove('active', 'key-shake');
    }, 180);
  }

  // Dramatic visual reaction for wrong key
  highlightWrongKey(rawKey, neededPhysicalKey = null) {
    const lookup = rawKey.toLowerCase();
    const keyEl = this.keyElements.get(lookup);
    if (keyEl) {
      keyEl.classList.remove('active', 'key-shake');
      keyEl.classList.add('vk-key-wrong', 'key-error-shake');
      setTimeout(() => {
        keyEl.classList.remove('vk-key-wrong', 'key-error-shake');
      }, 340);
    }

    if (neededPhysicalKey) {
      const neededEl = this.keyElements.get(neededPhysicalKey.toLowerCase());
      if (neededEl) {
        neededEl.classList.add('needed-pulse');
        setTimeout(() => neededEl.classList.remove('needed-pulse'), 600);
      }
    }
  }

  updateDebugBar(pressed, heard, roast = 'skill issue.') {
    if (this.pressedEl) this.pressedEl.textContent = pressed;
    if (this.heardEl) this.heardEl.textContent = heard;
    if (this.roastEl) this.roastEl.textContent = roast;
  }

  triggerPanic(durationMs = 2000) {
    this.container.classList.add('vk-panic');
    setTimeout(() => {
      this.container.classList.remove('vk-panic');
    }, durationMs);
  }

  triggerGravityFailure(durationMs = 4000) {
    this.container.classList.add('vk-gravity-loss');
    setTimeout(() => {
      this.container.classList.remove('vk-gravity-loss');
    }, durationMs);
  }

  triggerMigration(durationMs = 3500) {
    this.container.classList.add('vk-migration');
    setTimeout(() => {
      this.container.classList.remove('vk-migration');
    }, durationMs);
  }
}
