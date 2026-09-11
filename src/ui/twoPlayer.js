// Two Player Split-Screen Duel Mode
import { MappingEngine, CURSE_MODES } from '../engine/mappingEngine.js';
import { getRandomSentence } from '../data/sentences.js';
import { soundEngine } from '../audio/soundEngine.js';

export class TwoPlayerDuel {
  constructor(containerEl, onDuelEnd) {
    this.container = containerEl;
    this.onDuelEnd = onDuelEnd;

    this.p1 = {
      name: "Player 1 (Keyboard Survivor)",
      sentence: "",
      typed: "",
      mistakes: 0,
      startTime: 0,
      endTime: 0,
      mappingEngine: new MappingEngine(CURSE_MODES.MIRROR),
      finished: false
    };

    this.p2 = {
      name: "Player 2 (Keyboard Victim)",
      sentence: "",
      typed: "",
      mistakes: 0,
      startTime: 0,
      endTime: 0,
      mappingEngine: new MappingEngine(CURSE_MODES.ALPHABET_CHAOS),
      finished: false
    };

    this.activePlayer = 1; // 1 or 2
    this.roundStarted = false;
  }

  start() {
    const s1 = getRandomSentence();
    const s2 = getRandomSentence();
    this.p1.sentence = s1.text;
    this.p2.sentence = s2.text;

    this.p1.typed = "";
    this.p2.typed = "";
    this.p1.mistakes = 0;
    this.p2.mistakes = 0;
    this.p1.finished = false;
    this.p2.finished = false;

    this.activePlayer = 1;
    this.render();
  }

  render() {
    this.container.innerHTML = `
      <div class="two-player-screen">
        <div class="two-player-header">
          <h2>⚔️ TWO PLAYER LOCAL DUEL ⚔️</h2>
          <div class="two-player-sub">Two players. One shared keyboard. Infinite betrayal.</div>
          <button type="button" class="tp-exit-btn" id="tp-exit">Return to Main Menu</button>
        </div>

        <div class="duel-turn-banner" id="duel-turn-banner">
          👉 CURRENT TURN: <strong>PLAYER 1 (KEYBOARD SURVIVOR)</strong> — PRESS ANY KEY TO START
        </div>

        <div class="two-player-split">
          <!-- Player 1 Card -->
          <div class="player-panel ${this.activePlayer === 1 ? 'active-player' : 'inactive-player'}" id="p1-panel">
            <div class="player-tag tag-p1">PLAYER 1: Keyboard Survivor</div>
            <div class="player-curse-label">CURSE: MIRROR (Q↔P)</div>
            <div class="player-target-box">
              <div class="target-title">SENTENCE TO TYPE:</div>
              <div class="target-text" id="p1-target">${this.p1.sentence}</div>
            </div>
            <div class="player-input-box">
              <div class="input-title">YOUR INPUT:</div>
              <div class="input-display" id="p1-input">${this.p1.typed || '<span class="cursor">_</span>'}</div>
            </div>
            <div class="player-stats-row">
              <span>Mistakes: <strong id="p1-mistakes">${this.p1.mistakes}</strong></span>
              <span>Progress: <strong id="p1-prog">0%</strong></span>
            </div>
            <div class="player-status-badge" id="p1-status">Waiting to play</div>
          </div>

          <!-- Player 2 Card -->
          <div class="player-panel ${this.activePlayer === 2 ? 'active-player' : 'inactive-player'}" id="p2-panel">
            <div class="player-tag tag-p2">PLAYER 2: Keyboard Victim</div>
            <div class="player-curse-label">CURSE: ALPHABET CHAOS</div>
            <div class="player-target-box">
              <div class="target-title">SENTENCE TO TYPE:</div>
              <div class="target-text" id="p2-target">${this.p2.sentence}</div>
            </div>
            <div class="player-input-box">
              <div class="input-title">YOUR INPUT:</div>
              <div class="input-display" id="p2-input">${this.p2.typed || '<span class="cursor">_</span>'}</div>
            </div>
            <div class="player-stats-row">
              <span>Mistakes: <strong id="p2-mistakes">${this.p2.mistakes}</strong></span>
              <span>Progress: <strong id="p2-prog">0%</strong></span>
            </div>
            <div class="player-status-badge" id="p2-status">Waiting for Player 1</div>
          </div>
        </div>

        <div class="duel-footer-hint">
          💡 Player 1 completes their sentence first. Then Player 2 attempts theirs under a completely different curse!
        </div>
      </div>
    `;

    this.container.querySelector('#tp-exit').addEventListener('click', () => {
      if (this.onDuelEnd) this.onDuelEnd();
    });
  }

  handleKeyDown(e) {
    if (e.key === 'Tab' || e.key === 'Alt' || e.key === 'Control' || e.key === 'Meta') {
      return;
    }

    const curr = this.activePlayer === 1 ? this.p1 : this.p2;
    if (curr.finished) return;

    if (!curr.startTime) {
      curr.startTime = Date.now();
      const statusEl = this.container.querySelector(this.activePlayer === 1 ? '#p1-status' : '#p2-status');
      if (statusEl) statusEl.textContent = "TYPING IN PROGRESS...";
    }

    if (e.key === 'Backspace') {
      if (curr.typed.length > 0) {
        curr.typed = curr.typed.slice(0, -1);
        soundEngine.playKeyClick(true);
        this.updateDuelUI();
      }
      return;
    }

    if (e.key.length === 1) {
      const cursedChar = curr.mappingEngine.transformKey(e.key);
      const targetChar = curr.sentence[curr.typed.length] || '';

      const isLetter = /[a-zA-Z]/.test(targetChar) && /[a-zA-Z]/.test(cursedChar);
      const isMatch = isLetter ? cursedChar.toLowerCase() === targetChar.toLowerCase() : cursedChar === targetChar;

      if (isMatch) {
        curr.typed += targetChar;
        soundEngine.playCorrect(curr.typed.length);
      } else {
        curr.mistakes++;
        soundEngine.playError();
        if (curr.typed.length < curr.sentence.length + 5) {
          curr.typed += cursedChar;
        }
      }

      this.updateDuelUI();

      // Check if finished without errors
      if (curr.typed === curr.sentence) {
        curr.endTime = Date.now();
        curr.finished = true;
        soundEngine.playAchievement();

        if (this.activePlayer === 1) {
          // Switch to Player 2
          this.activePlayer = 2;
          const banner = this.container.querySelector('#duel-turn-banner');
          if (banner) {
            banner.innerHTML = `👉 PLAYER 1 FINISHED! NOW: <strong>PLAYER 2 (KEYBOARD VICTIM)</strong> — START TYPING!`;
            banner.classList.add('turn-switch');
          }
          const p1Status = this.container.querySelector('#p1-status');
          if (p1Status) p1Status.textContent = "COMPLETED! Waiting for P2...";
          this.renderActivePanels();
        } else {
          // Duel finished!
          this.concludeDuel();
        }
      }
    }
  }

  renderActivePanels() {
    const p1Panel = this.container.querySelector('#p1-panel');
    const p2Panel = this.container.querySelector('#p2-panel');
    if (p1Panel && p2Panel) {
      if (this.activePlayer === 1) {
        p1Panel.classList.add('active-player');
        p1Panel.classList.remove('inactive-player');
        p2Panel.classList.remove('active-player');
        p2Panel.classList.add('inactive-player');
      } else {
        p2Panel.classList.add('active-player');
        p2Panel.classList.remove('inactive-player');
        p1Panel.classList.remove('active-player');
        p1Panel.classList.add('inactive-player');
      }
    }
  }

  updateDuelUI() {
    const p1In = this.container.querySelector('#p1-input');
    const p2In = this.container.querySelector('#p2-input');
    const p1Mist = this.container.querySelector('#p1-mistakes');
    const p2Mist = this.container.querySelector('#p2-mistakes');
    const p1Prog = this.container.querySelector('#p1-prog');
    const p2Prog = this.container.querySelector('#p2-prog');

    if (p1In) p1In.textContent = this.p1.typed || '_';
    if (p2In) p2In.textContent = this.p2.typed || '_';
    if (p1Mist) p1Mist.textContent = this.p1.mistakes;
    if (p2Mist) p2Mist.textContent = this.p2.mistakes;

    if (p1Prog) p1Prog.textContent = `${Math.round((this.p1.typed.length / this.p1.sentence.length) * 100)}%`;
    if (p2Prog) p2Prog.textContent = `${Math.round((this.p2.typed.length / this.p2.sentence.length) * 100)}%`;
  }

  concludeDuel() {
    const time1 = Math.max(1, (this.p1.endTime - this.p1.startTime) / 1000);
    const time2 = Math.max(1, (this.p2.endTime - this.p2.startTime) / 1000);

    const wpm1 = Math.round((this.p1.sentence.length / 5) / (time1 / 60));
    const wpm2 = Math.round((this.p2.sentence.length / 5) / (time2 / 60));

    // Score based on WPM minus mistakes penalty
    const score1 = Math.max(0, wpm1 * 100 - this.p1.mistakes * 50);
    const score2 = Math.max(0, wpm2 * 100 - this.p2.mistakes * 50);

    const p1Wins = score1 >= score2;
    const winner = p1Wins ? this.p1.name : this.p2.name;
    const loser = p1Wins ? this.p2.name : this.p1.name;

    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal duel-result-modal';
    modal.innerHTML = `
      <div class="duel-result-card">
        <div class="duel-trophy">🏆</div>
        <h1 class="duel-winner-title">WINNER: ${winner}</h1>
        <h2 class="duel-winner-quote">"CONGRATULATIONS. YOU ARE BETTER AT THIS USELESS ACTIVITY."</h2>
        <div class="duel-loser-quote">To ${loser}: "You have been defeated by a keyboard."</div>

        <div class="duel-stats-compare">
          <div class="compare-col">
            <h3>PLAYER 1</h3>
            <div>Speed: ${wpm1} WPM</div>
            <div>Mistakes: ${this.p1.mistakes}</div>
            <div>Time: ${time1.toFixed(1)}s</div>
            <div class="compare-score">Score: ${score1}</div>
          </div>
          <div class="vs-badge">VS</div>
          <div class="compare-col">
            <h3>PLAYER 2</h3>
            <div>Speed: ${wpm2} WPM</div>
            <div>Mistakes: ${this.p2.mistakes}</div>
            <div>Time: ${time2.toFixed(1)}s</div>
            <div class="compare-score">Score: ${score2}</div>
          </div>
        </div>

        <div class="duel-actions">
          <button type="button" class="action-btn" id="duel-rematch">Rematch ⚔️</button>
          <button type="button" class="action-btn secondary" id="duel-menu">Main Menu</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#duel-rematch').addEventListener('click', () => {
      modal.remove();
      this.start();
    });

    modal.querySelector('#duel-menu').addEventListener('click', () => {
      modal.remove();
      if (this.onDuelEnd) this.onDuelEnd();
    });
  }
}
