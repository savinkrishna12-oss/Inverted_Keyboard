// Main Application Bootstrap & Orchestrator
import { soundEngine } from './audio/soundEngine.js';
import { storage } from './engine/storage.js';
import { GameEngine } from './engine/gameEngine.js';
import { MappingEngine, CURSE_MODES, MODE_INFO } from './engine/mappingEngine.js';
import { VirtualKeyboard } from './ui/virtualKeyboard.js';
import { DiagnosticsPanel } from './ui/diagnostics.js';
import { KevinMascot } from './ui/kevinMascot.js';
import { CertificateGenerator } from './ui/certificate.js';
import { RandomEventsEngine } from './engine/randomEvents.js';
import { EasterEggManager } from './engine/easterEggs.js';
import { ACHIEVEMENTS } from './data/achievementsList.js';
import { ReactionBubbleManager } from './ui/reactionBubble.js';
import { FUNNY_LOADING_MESSAGES } from './data/roastsDatabase.js';

class CursedKeyboardApp {
  constructor() {
    this.mainContainer = document.getElementById('main-content');
    this.themeSelect = document.getElementById('theme-select');
    this.modeSelect = document.getElementById('mode-select');
    this.soundBtn = document.getElementById('btn-sound');
    this.lessChaosBtn = document.getElementById('btn-less-chaos');
    this.achievementsBtn = document.getElementById('btn-achievements');
    this.statsBtn = document.getElementById('btn-stats');
    this.leaderboardBtn = document.getElementById('btn-leaderboard');

    this.currentView = 'START'; // START, PLAYING
    this.selectedMode = 'QUICK';
    this.selectedCurse = CURSE_MODES.MIRROR;
    this.lessChaos = false;

    this.gameEngine = null;
    this.virtualKeyboard = null;
    this.diagnostics = null;
    this.kevin = null;
    this.randomEvents = null;
    this.easterEggs = null;
    this.reactionBubbleManager = null;

    this.antiProductivityInterval = null;
    this.playTimeTracker = null;

    this.init();
  }

  init() {
    this.setupTheme();
    this.setupSoundButton();
    this.setupLessChaos();
    this.setupNavButtons();
    this.setupGlobalKeyboardEvents();
    this.setupAntiProductivityTimer();
    this.showStartScreen();
  }

  setupLessChaos() {
    this.lessChaos = storage.getSetting('less_chaos', false);
    this.updateLessChaosUI();
    if (this.lessChaosBtn) {
      this.lessChaosBtn.addEventListener('click', () => {
        this.lessChaos = !this.lessChaos;
        storage.setSetting('less_chaos', this.lessChaos);
        this.updateLessChaosUI();
        soundEngine.playKeyClick();
        if (this.gameEngine) this.gameEngine.setLessChaos(this.lessChaos);
        if (this.reactionBubbleManager) this.reactionBubbleManager.setLessChaos(this.lessChaos);
      });
    }
  }

  updateLessChaosUI() {
    if (this.lessChaosBtn) {
      this.lessChaosBtn.textContent = this.lessChaos ? '🎛️ Less Chaos: ON' : '🎛️ Less Chaos: OFF';
    }
    if (this.lessChaos) {
      document.body.classList.add('less-chaos-mode');
    } else {
      document.body.classList.remove('less-chaos-mode');
    }
  }

  setupTheme() {
    const savedTheme = storage.getSetting('theme', 'hacker');
    document.body.setAttribute('data-theme', savedTheme);
    this.themeSelect.value = savedTheme;

    this.themeSelect.addEventListener('change', (e) => {
      const theme = e.target.value;
      document.body.setAttribute('data-theme', theme);
      storage.setSetting('theme', theme);
      soundEngine.playKeyClick();
    });
  }

  setupSoundButton() {
    const updateLabel = () => {
      const muted = soundEngine.isMuted();
      this.soundBtn.textContent = muted ? '🔇 Sound: OFF' : '🔊 Sound: ON';
    };
    updateLabel();

    this.soundBtn.addEventListener('click', () => {
      soundEngine.init();
      soundEngine.toggleMute();
      updateLabel();
      soundEngine.playKeyClick();
    });
  }

  setupNavButtons() {
    this.modeSelect.addEventListener('change', (e) => {
      this.selectedMode = e.target.value;
      if (this.currentView === 'START') {
        this.updateHeroModePills();
      } else {
        this.switchGameMode(this.selectedMode);
      }
    });

    this.achievementsBtn.addEventListener('click', () => this.showAchievementsModal());
    this.statsBtn.addEventListener('click', () => this.showStatsModal());
    if (this.leaderboardBtn) {
      this.leaderboardBtn.addEventListener('click', () => this.showLeaderboardModal());
    }
  }

  setupAntiProductivityTimer() {
    // Check every second and track play time
    this.playTimeTracker = setInterval(() => {
      if (this.currentView === 'PLAYING') {
        const newlyUnlocked = storage.recordTime(1);
        newlyUnlocked.forEach(ach => this.showToast(`🏆 Achievement Unlocked: ${ach.title}!`, '🎉'));
      }
    }, 1000);

    // Anti-productivity prompt after 10-15 minutes
    this.antiProductivityInterval = setTimeout(() => {
      this.showAntiProductivityDialog();
    }, 12 * 60 * 1000);
  }

  showAntiProductivityDialog() {
    soundEngine.playKevinQuip();
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal';
    modal.innerHTML = `
      <div class="game-over-card" style="max-width: 500px;">
        <h2>⚠️ PRODUCTIVITY NOTICE</h2>
        <p style="font-size: 1.1rem; margin: 12px 0;">You have been playing this completely useless typing game for a concerning amount of time.</p>
        <p style="color: var(--text-secondary);">Would you like to return to actual productivity?</p>
        <div class="go-actions-row" style="margin-top: 16px;">
          <button type="button" class="action-btn" id="prod-yes">YES, PLEASE</button>
          <button type="button" class="action-btn secondary" id="prod-no">NO, KEEP SUFFERING</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    const handleChoice = (isYes) => {
      modal.remove();
      if (isYes) {
        this.showToast("Excellent decision. Just kidding! Returning to game.", "😈");
      } else {
        this.showToast("Respectable commitment to procrastination.", "🫡");
      }
    };

    modal.querySelector('#prod-yes').addEventListener('click', () => handleChoice(true));
    modal.querySelector('#prod-no').addEventListener('click', () => handleChoice(false));
  }

  // ==========================================================================
  // VIEW: START SCREEN
  // ==========================================================================
  showStartScreen() {
    this.currentView = 'START';
    if (this.randomEvents) this.randomEvents.stopMonitoring();

    this.mainContainer.innerHTML = `
      <div class="start-screen">
        <div class="hero-badge">⚠️ WARNING: HARMFUL TO REPUTATION AS A FAST TYPIST</div>
        <h1 class="hero-title">CURSED KEYBOARD</h1>
        <p class="hero-subtitle">
          You know how to type. Unfortunately, your keyboard has decided otherwise.
          Every key has been maliciously rewired to question your sanity.
        </p>

        <button type="button" class="regret-btn" id="btn-regret">
          <span>PRESS THIS BUTTON AND REGRET IT</span> 💀
        </button>

        <div class="hero-modes-row" id="hero-modes-row">
          <button type="button" class="mode-pill-btn ${this.selectedMode === 'QUICK' ? 'active' : ''}" data-mode="QUICK">⚡ Quick Game (5 Rounds)</button>
          <button type="button" class="mode-pill-btn ${this.selectedMode === 'ENDLESS' ? 'active' : ''}" data-mode="ENDLESS">♾️ Endless Mode</button>
          <button type="button" class="mode-pill-btn ${this.selectedMode === 'BOSS' ? 'active' : ''}" data-mode="BOSS">👹 Boss Mode</button>
          <button type="button" class="mode-pill-btn ${this.selectedMode === 'CHAOS' ? 'active' : ''}" data-mode="CHAOS">🌪️ Alphabet Chaos</button>
          <button type="button" class="mode-pill-btn ${this.selectedMode === 'WHAT_IF' ? 'active' : ''}" data-mode="WHAT_IF">🧪 "WHAT IF?" Stack</button>
        </div>
      </div>
    `;

    const regretBtn = this.mainContainer.querySelector('#btn-regret');
    regretBtn.addEventListener('click', () => {
      soundEngine.init();
      this.promptPlayerNameAndLaunch();
    });

    const modePills = this.mainContainer.querySelectorAll('.mode-pill-btn');
    modePills.forEach(pill => {
      pill.addEventListener('click', () => {
        soundEngine.init();
        soundEngine.playKeyClick();
        this.selectedMode = pill.dataset.mode;
        this.modeSelect.value = this.selectedMode;
        modePills.forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
      });
    });
  }

  updateHeroModePills() {
    const pills = this.mainContainer.querySelectorAll('.mode-pill-btn');
    pills.forEach(p => {
      if (p.dataset.mode === this.selectedMode) p.classList.add('active');
      else p.classList.remove('active');
    });
  }

  promptPlayerNameAndLaunch() {
    soundEngine.playKeyClick();
    const currentName = storage.getLastPlayerName();

    const existing = document.querySelector('.player-name-modal');
    if (existing) return;

    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal player-name-modal';
    modal.innerHTML = `
      <div class="game-over-card" style="max-width: 500px;">
        <div class="go-header">
          <div class="hero-badge">HALL OF SHAME & GLORY</div>
          <h2 style="font-size: 1.8rem; margin: 12px 0 6px 0;">ENTER YOUR CODENAME</h2>
          <p style="color: var(--text-secondary); font-size: 0.95rem; margin-bottom: 8px;">
            Set your identity for the Leaderboard. We track your levels completed, time taken, correct keystrokes, and catastrophic typos.
          </p>
        </div>

        <form id="name-entry-form" style="margin: 18px 0;">
          <div style="text-align: left; margin-bottom: 8px;">
            <label for="player-name-input" style="font-size: 0.82rem; font-weight: 800; color: var(--accent-color); letter-spacing: 0.05em; text-transform: uppercase;">PLAYER HANDLE</label>
          </div>
          <input 
            type="text" 
            id="player-name-input" 
            class="name-text-input" 
            maxlength="22" 
            value="${this.escapeHtml(currentName)}" 
            placeholder="Type your name..." 
            autocomplete="off" 
            required 
          />
          <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 8px; font-size: 0.8rem; color: var(--text-secondary);">
            <span>💾 Remembered in browser memory</span>
            <span>⏱️ 2 Min / Round Limit</span>
          </div>

          <div class="go-actions-row" style="margin-top: 22px;">
            <button type="submit" class="action-btn" id="btn-submit-name">START GAME 🚀</button>
            <button type="button" class="action-btn secondary" id="btn-view-leaderboard-from-name">🏆 LEADERBOARD</button>
            <button type="button" class="action-btn secondary" id="btn-cancel-name">CANCEL</button>
          </div>
        </form>
      </div>
    `;

    document.body.appendChild(modal);

    const input = modal.querySelector('#player-name-input');
    if (input) {
      setTimeout(() => {
        input.focus();
        input.select();
      }, 60);
    }

    const form = modal.querySelector('#name-entry-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const enteredName = storage.setLastPlayerName(input.value);
      modal.remove();
      this.beginCountdownAndLaunch(enteredName);
    });

    modal.querySelector('#btn-view-leaderboard-from-name').addEventListener('click', () => {
      this.showLeaderboardModal();
    });

    modal.querySelector('#btn-cancel-name').addEventListener('click', () => {
      modal.remove();
    });
  }

  async beginCountdownAndLaunch(playerName = null) {
    const activePlayerName = playerName || storage.getLastPlayerName();
    const startScreen = this.mainContainer.querySelector('.start-screen');
    startScreen.innerHTML = `
      <div class="start-screen">
        <div class="hero-badge">INITIATING HARDWARE CORRUPTION</div>
        <div class="movie-countdown" id="launch-countdown" style="font-size: 6rem; margin: 20px 0;">3</div>
        <h2 id="launch-text" style="font-size: 1.8rem; color: var(--accent-color);">Prepare yourself, ${this.escapeHtml(activePlayerName)}...</h2>
      </div>
    `;

    const cdEl = startScreen.querySelector('#launch-countdown');
    const textEl = startScreen.querySelector('#launch-text');

    for (let count = 3; count > 0; count--) {
      if (cdEl) cdEl.textContent = count;
      soundEngine.playCountdown(350 + (4 - count) * 150);
      await new Promise(r => setTimeout(r, 750));
    }

    if (cdEl) cdEl.textContent = "1...";
    await new Promise(r => setTimeout(r, 200));

    if (cdEl) cdEl.style.display = 'none';
    if (textEl) {
      textEl.innerHTML = `<span style="color: #ff416c; font-size: 2.3rem; font-weight: 900;">YOUR KEYBOARD IS NOW YOUR ENEMY.</span>`;
    }
    soundEngine.playDramaticBoom();

    await new Promise(r => setTimeout(r, 1100));

    this.showGameplayScreen(activePlayerName);
  }

  // ==========================================================================
  // VIEW: GAMEPLAY SCREEN
  // ==========================================================================
  showGameplayScreen(playerName = null) {
    this.currentView = 'PLAYING';
    const activePlayer = playerName || storage.getLastPlayerName();

    this.mainContainer.innerHTML = `
      <div class="gameplay-screen">
        <!-- Top HUD -->
        <div class="game-hud-top">
          <div class="hud-item player-wrap">
            <span class="hud-label">Player</span>
            <div class="hud-player-badge" id="hud-player-name">👤 ${this.escapeHtml(activePlayer)}</div>
          </div>

          <div class="hud-item timer-wrap">
            <span class="hud-label">Round Timer</span>
            <div class="hud-timer-badge" id="hud-timer">⏳ 02:00</div>
          </div>

          <div class="hud-item">
            <span class="hud-label">Round</span>
            <span class="hud-val" id="hud-round">1 / 5</span>
          </div>

          <div class="hud-item sanity-wrap">
            <span class="hud-label">Remaining Sanity: <strong id="hud-sanity-txt">100%</strong></span>
            <div class="sanity-bar-bg">
              <div class="sanity-bar-fill" id="hud-sanity-fill" style="width: 100%;"></div>
            </div>
          </div>

          <div class="hud-item">
            <span class="hud-label">Streak / Combo</span>
            <div class="combo-badge" id="hud-combo">🔥 0</div>
          </div>

          <div class="hud-item mistake-wrap">
            <span class="hud-label">Mistakes</span>
            <div class="hud-mistake-row">
              <span class="hud-val" id="hud-mistakes" style="color: var(--cursed-accent);">0 😭</span>
              <span class="mistake-sub-badge" id="hud-mistake-label">Perfect 👑</span>
            </div>
          </div>
        </div>

        <!-- Central Body (Arena + Sidebar) -->
        <div class="gameplay-body">
          <div class="typing-arena">
            <!-- Animated Reaction Speech Bubble Anchor -->
            <div class="reaction-bubble-anchor" id="reaction-bubble-anchor"></div>

            <div class="curse-banner">
              <div>
                <div class="curse-title" id="curse-title">MODE 1: MIRROR</div>
                <div class="curse-sub" id="curse-desc">Q becomes P, W becomes O, your patience becomes 0.</div>
              </div>
              <div id="curse-tag" class="hero-badge" style="margin: 0;">ACTIVE</div>
            </div>

            <div class="target-container">
              <div class="section-tag" id="type-this-tag">TYPE THIS:</div>
              <div class="sentence-display" id="sentence-display"></div>
            </div>

            <div class="target-container">
              <div class="section-tag">YOUR INPUT:</div>
              <div class="user-input-box">
                <span class="user-input-text" id="user-input-text"></span>
                <span class="input-cursor"></span>
              </div>
            </div>
          </div>

          <!-- Sidebar (Diagnostics + Kevin Mascot) -->
          <div class="game-sidebar">
            <div id="diagnostics-container"></div>
            <div id="kevin-container"></div>
          </div>
        </div>

        <!-- Visual Virtual Keyboard -->
        <div class="virtual-keyboard-section" id="virtual-keyboard-container"></div>
      </div>
    `;

    // Instantiate Subcomponents
    const diagContainer = this.mainContainer.querySelector('#diagnostics-container');
    const kevinContainer = this.mainContainer.querySelector('#kevin-container');
    const vkContainer = this.mainContainer.querySelector('#virtual-keyboard-container');
    const bubbleAnchor = this.mainContainer.querySelector('#reaction-bubble-anchor');

    this.diagnostics = new DiagnosticsPanel(diagContainer);
    this.kevin = new KevinMascot(kevinContainer, () => {
      const unl = storage.recordKevinConsult();
      if (unl) this.showToast(`🏆 Achievement: ${unl.title}!`, '👓');
    });

    this.reactionBubbleManager = new ReactionBubbleManager(bubbleAnchor);
    this.reactionBubbleManager.setLessChaos(this.lessChaos);

    // Mapping Engine for Virtual Keyboard
    const tempMapping = new MappingEngine(CURSE_MODES.MIRROR);
    this.virtualKeyboard = new VirtualKeyboard(vkContainer, tempMapping, (clickedKey) => {
      // Direct click on virtual keyboard simulates physical keypress
      this.handleInputKey({ key: clickedKey });
    });

    // Game Engine
    this.gameEngine = new GameEngine({
      virtualKeyboard: this.virtualKeyboard,
      diagnostics: this.diagnostics,
      kevin: this.kevin,
      reactionManager: this.reactionBubbleManager,
      onGameOver: (result) => this.showGameOverModal(result),
      onRoundComplete: (engine) => {
        const loadingMsg = FUNNY_LOADING_MESSAGES[Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length)];
        this.showRoundTransitionToast(loadingMsg);
        this.updateGameplayUI();
      },
      onTimerTick: (secondsLeft) => {
        this.updateTimerUI(secondsLeft);
      }
    });

    this.gameEngine.setLessChaos(this.lessChaos);

    // Ensure virtual keyboard uses gameEngine's mapping
    this.virtualKeyboard.setMappingEngine(this.gameEngine.mappingEngine);

    // Random Events Engine
    this.randomEvents = new RandomEventsEngine({
      virtualKeyboard: this.virtualKeyboard,
      appContainer: this.mainContainer
    });
    this.randomEvents.startMonitoring(20, 35);

    // Easter Egg Manager
    this.easterEggs = new EasterEggManager({
      kevin: this.kevin,
      onSecretMode: () => {},
      showToast: (msg, icon) => this.showToast(msg, icon)
    });

    // Start round with chosen player name
    this.gameEngine.startNewGame(this.selectedMode, CURSE_MODES.MIRROR, activePlayer);

    this.updateGameplayUI();
  }

  updateTimerUI(secondsLeft) {
    if (!this.mainContainer) return;
    const timerEl = this.mainContainer.querySelector('#hud-timer');
    if (!timerEl) return;

    const mins = Math.floor(secondsLeft / 60);
    const secs = secondsLeft % 60;
    const timeFormatted = `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    timerEl.textContent = `⏳ ${timeFormatted}`;

    if (secondsLeft <= 5) {
      timerEl.className = 'hud-timer-badge timer-critical';
    } else if (secondsLeft <= 15) {
      timerEl.className = 'hud-timer-badge timer-warning';
    } else {
      timerEl.className = 'hud-timer-badge';
    }
  }

  // ==========================================================================
  // INPUT & EVENT HANDLER
  // ==========================================================================
  setupGlobalKeyboardEvents() {
    window.addEventListener('keydown', (e) => {
      // If modal dialog is open, do not intercept keys
      if (document.querySelector('.player-name-modal') || document.querySelector('.cursed-overlay-modal')) {
        return;
      }

      // If on start screen, any key press (Enter, Space, letters) opens name prompt!
      if (this.currentView === 'START') {
        if (e.key === 'Enter' || e.key === ' ' || e.key.length === 1) {
          e.preventDefault();
          soundEngine.init();
          this.promptPlayerNameAndLaunch();
          return;
        }
      }

      // Blur focused UI controls so space/letters don't trigger dropdown search or button clicks
      if (document.activeElement && ['SELECT', 'BUTTON'].includes(document.activeElement.tagName)) {
        document.activeElement.blur();
      }

      // Prevent browser spacebar scroll and tab navigation while in game
      if (['Space', ' ', 'Tab'].includes(e.key) && this.currentView === 'PLAYING') {
        e.preventDefault();
      }

      // Check easter eggs first
      if (this.easterEggs && this.easterEggs.handleKeyDown(e)) {
        return;
      }

      if (this.currentView === 'PLAYING') {
        this.handleInputKey(e);
      }
    }, { capture: true });
  }

  handleInputKey(e) {
    if (!this.gameEngine) return;
    const handled = this.gameEngine.handleKeyDown(e);
    if (handled) {
      this.updateGameplayUI();
    }
  }

  updateGameplayUI() {
    if (!this.gameEngine) return;
    const p = this.gameEngine.getDisplayProgress();

    // Round HUD
    const roundEl = this.mainContainer.querySelector('#hud-round');
    if (roundEl) {
      roundEl.textContent = p.mode === 'ENDLESS' ? `${p.round}` : `${p.round} / ${p.maxRounds}`;
    }

    // Sanity HUD
    const sanityTxt = this.mainContainer.querySelector('#hud-sanity-txt');
    const sanityFill = this.mainContainer.querySelector('#hud-sanity-fill');
    if (sanityTxt && sanityFill) {
      sanityTxt.textContent = `${p.sanity}%`;
      sanityFill.style.width = `${p.sanity}%`;
      if (p.sanity <= 25) {
        sanityFill.classList.add('sanity-low');
      } else {
        sanityFill.classList.remove('sanity-low');
      }
    }

    // Combo
    const comboEl = this.mainContainer.querySelector('#hud-combo');
    if (comboEl) {
      comboEl.textContent = `🔥 ${p.combo}`;
    }

    // Mistakes HUD with Per-Level Limit
    const mistakesEl = this.mainContainer.querySelector('#hud-mistakes');
    const mistakeLabelEl = this.mainContainer.querySelector('#hud-mistake-label');
    if (mistakesEl) {
      if (Number.isFinite(p.mistakeLimit)) {
        mistakesEl.textContent = `${p.mistakesInRound} / ${p.mistakeLimit} 😭`;
        if (p.mistakesInRound >= p.mistakeLimit - 1) {
          mistakesEl.style.color = '#ff4757';
          mistakesEl.style.textShadow = '0 0 10px rgba(255, 71, 87, 0.8)';
        } else {
          mistakesEl.style.color = 'var(--cursed-accent)';
          mistakesEl.style.textShadow = 'none';
        }
      } else {
        mistakesEl.textContent = `${p.mistakesInRound} 😭`;
        mistakesEl.style.color = 'var(--cursed-accent)';
        mistakesEl.style.textShadow = 'none';
      }
    }
    if (mistakeLabelEl) {
      if (Number.isFinite(p.mistakeLimit)) {
        const remaining = Math.max(0, p.mistakeLimit - p.mistakesInRound);
        if (remaining <= 1) {
          mistakeLabelEl.textContent = remaining === 0 ? 'LIMIT REACHED! 💀' : '⚠️ 1 LEFT!';
          mistakeLabelEl.style.background = 'rgba(255, 71, 87, 0.3)';
          mistakeLabelEl.style.color = '#ff4757';
          mistakeLabelEl.style.borderColor = '#ff4757';
        } else {
          mistakeLabelEl.textContent = `${remaining} left`;
          mistakeLabelEl.style.background = '';
          mistakeLabelEl.style.color = '';
          mistakeLabelEl.style.borderColor = '';
        }
      } else if (p.mistakeLabel) {
        mistakeLabelEl.textContent = p.mistakeLabel;
        mistakeLabelEl.style.background = '';
        mistakeLabelEl.style.color = '';
        mistakeLabelEl.style.borderColor = '';
      }
    }

    if (this.diagnostics && p.moodLabels) {
      this.diagnostics.updateMoodLabels(p.moodLabels);
    }

    // Curse Banner Info
    const info = MODE_INFO[p.curse] || MODE_INFO.MIRROR;
    const curseTitle = this.mainContainer.querySelector('#curse-title');
    const curseDesc = this.mainContainer.querySelector('#curse-desc');
    if (curseTitle) curseTitle.textContent = info.title;
    if (curseDesc) curseDesc.textContent = info.desc;

    // Math mutation badge
    const typeThisTag = this.mainContainer.querySelector('#type-this-tag');
    if (typeThisTag) {
      if (p.isMathMutated) {
        typeThisTag.innerHTML = `TYPE THIS: <span class="math-mutation-tag">🧮 MATH MUTATION ACTIVE</span>`;
      } else {
        typeThisTag.textContent = `TYPE THIS:`;
      }
    }

    // Sentence Character-by-character Formatting
    const sentenceEl = this.mainContainer.querySelector('#sentence-display');
    if (sentenceEl) {
      const sentence = p.sentence;
      const typed = p.typed;
      let html = '';

      for (let i = 0; i < sentence.length; i++) {
        const targetChar = sentence[i];
        if (i < typed.length) {
          const typedChar = typed[i];
          const isLetter = /[a-zA-Z]/.test(targetChar) && /[a-zA-Z]/.test(typedChar);
          const isMatch = isLetter ? targetChar.toLowerCase() === typedChar.toLowerCase() : targetChar === typedChar;
          if (isMatch) {
            html += `<span class="char-correct">${this.escapeHtml(targetChar)}</span>`;
          } else {
            html += `<span class="char-wrong" title="You typed: ${typedChar}">${this.escapeHtml(targetChar)}</span>`;
          }
        } else if (i === typed.length) {
          html += `<span class="char-current">${this.escapeHtml(targetChar)}</span>`;
        } else {
          html += `<span class="char-pending">${this.escapeHtml(targetChar)}</span>`;
        }
      }
      sentenceEl.innerHTML = html;
    }

    // User Input Box
    const userInEl = this.mainContainer.querySelector('#user-input-text');
    if (userInEl) {
      const sentence = p.sentence;
      const typed = p.typed;
      let inHtml = '';
      for (let i = 0; i < typed.length; i++) {
        const typedChar = typed[i];
        const targetChar = sentence[i] || '';
        const isLetter = /[a-zA-Z]/.test(targetChar) && /[a-zA-Z]/.test(typedChar);
        const isMatch = isLetter ? targetChar.toLowerCase() === typedChar.toLowerCase() : targetChar === typedChar;
        if (isMatch) {
          inHtml += `<span class="input-char-correct">${this.escapeHtml(typedChar)}</span>`;
        } else {
          inHtml += `<span class="input-char-wrong">${this.escapeHtml(typedChar)}</span>`;
        }
      }
      userInEl.innerHTML = inHtml;
    }
  }

  escapeHtml(str) {
    if (str === ' ') return '&nbsp;';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ==========================================================================
  // MODALS & OVERLAYS
  // ==========================================================================
  showGameOverModal(result) {
    if (this.randomEvents) this.randomEvents.stopMonitoring();

    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal';
    modal.innerHTML = `
      <div class="game-over-card">
        <div class="go-header">
          <h1>GAME OVER</h1>
          <div style="font-size: 1.1rem; color: var(--text-secondary);">Your keyboard survived. You did not.</div>
          <div class="go-rank-badge" style="margin-top: 6px; font-size: 1rem; color: var(--accent-color); font-weight: 800;">
            🏆 Leaderboard Rank: #${result.leaderboardResult ? result.leaderboardResult.rank : '1'} (${this.escapeHtml(result.playerName)})
            ${result.leaderboardResult && result.leaderboardResult.isUpdate 
              ? (result.leaderboardResult.isNewPersonalBest ? '<span style="color:#56d364; font-size:0.82rem; margin-left:6px;">✨ NEW PERSONAL BEST!</span>' : '<span style="color:#79c0ff; font-weight:700; font-size:0.82rem; margin-left:6px;">(Entry Updated)</span>')
              : '<span style="color:#56d364; font-size:0.82rem; margin-left:6px;">✨ NEW ENTRY!</span>'}
          </div>
          <div class="go-player-title" style="margin-top: 6px;">"${result.title}"</div>
        </div>

        <div class="go-stats-grid">
          <div class="go-stat-box">
            <div class="go-stat-val" style="color: var(--accent-color);">${result.score.toLocaleString()}</div>
            <div class="go-stat-lbl">FINAL SCORE</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val" style="color: #56d364;">${result.levelsCompleted || 0}</div>
            <div class="go-stat-lbl">LEVELS CLEARED</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${result.timeFormatted || '0m 00s'}</div>
            <div class="go-stat-lbl">TIME TAKEN</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${result.wpm}</div>
            <div class="go-stat-lbl">SPEED (WPM)</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${result.accuracy}%</div>
            <div class="go-stat-lbl">ACCURACY</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val" style="color: #ff7b72;">${result.mistakes}</div>
            <div class="go-stat-lbl">MISTAKES</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${result.correctChars || 0}</div>
            <div class="go-stat-lbl">CORRECT KEYS</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${result.sanity}%</div>
            <div class="go-stat-lbl">SANITY LEFT</div>
          </div>
        </div>

        <div class="go-verdict-box">
          "${result.verdict}"
        </div>

        <div class="go-actions-row">
          <button type="button" class="action-btn" id="go-play-again">Play Again 🔄</button>
          <button type="button" class="action-btn secondary" id="go-view-leaderboard">🏆 Leaderboard</button>
          <button type="button" class="action-btn secondary" id="go-flex-cert">Flex Score 📜</button>
          <button type="button" class="action-btn secondary" id="go-change-curse">Change Mode ⚙️</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    modal.querySelector('#go-play-again').addEventListener('click', () => {
      modal.remove();
      this.promptPlayerNameAndLaunch();
    });

    modal.querySelector('#go-view-leaderboard').addEventListener('click', () => {
      const entryId = result.leaderboardResult ? result.leaderboardResult.entry.id : null;
      this.showLeaderboardModal(entryId);
    });

    modal.querySelector('#go-flex-cert').addEventListener('click', () => {
      CertificateGenerator.openModal(result);
    });

    modal.querySelector('#go-change-curse').addEventListener('click', () => {
      modal.remove();
      this.showStartScreen();
    });
  }

  showLeaderboardModal(highlightId = null) {
    soundEngine.playKeyClick();
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal leaderboard-modal';

    const renderRows = () => {
      const list = storage.getLeaderboard();
      if (list.length === 0) {
        return `<tr><td colspan="7" style="text-align: center; padding: 36px; color: #94a3b8; font-weight: 600; font-size: 1.05rem;">No victims recorded yet. Play a round to etch your name in neon! 🎮</td></tr>`;
      }

      return list.map((item, idx) => {
        const rank = idx + 1;
        let rankBadge = '';
        if (rank === 1) {
          rankBadge = `<span class="lb-badge lb-rank-1">🥇 1st</span>`;
        } else if (rank === 2) {
          rankBadge = `<span class="lb-badge lb-rank-2">🥈 2nd</span>`;
        } else if (rank === 3) {
          rankBadge = `<span class="lb-badge lb-rank-3">🥉 3rd</span>`;
        } else {
          rankBadge = `<span class="lb-badge lb-rank-sub">#${rank}</span>`;
        }

        const isCurrent = highlightId && item.id === highlightId;
        const rowClass = isCurrent ? 'lb-row highlight-player' : 'lb-row';

        return `
          <tr class="${rowClass}">
            <td class="lb-col-rank">${rankBadge}</td>
            <td class="lb-col-name">
              <span class="lb-player-name">${this.escapeHtml(item.name)}</span>
              ${item.attempts && item.attempts > 1 ? `<span class="lb-runs-tag" title="${item.attempts} sessions recorded">${item.attempts} runs</span>` : ''}
              ${isCurrent ? '<span class="you-badge">YOU</span>' : ''}
            </td>
            <td class="lb-col-levels"><span class="lb-stat-levels">⭐ ${item.levelsCompleted}</span></td>
            <td class="lb-col-time"><span class="lb-stat-time">⏱️ ${item.timeFormatted || `${item.timeTakenSec}s`}</span></td>
            <td class="lb-col-correct"><span class="lb-stat-correct">✓ ${(item.correctChars || 0).toLocaleString()}</span></td>
            <td class="lb-col-wrong"><span class="lb-stat-mistakes">✕ ${(item.incorrectChars || 0).toLocaleString()}</span></td>
            <td class="lb-col-score"><span class="lb-stat-score">💎 ${(item.score || 0).toLocaleString()}</span></td>
          </tr>
        `;
      }).join('');
    };

    modal.innerHTML = `
      <div class="game-over-card lb-modal-card" style="max-width: 880px; max-height: 88vh; display: flex; flex-direction: column;">
        <div class="lb-modal-header">
          <div class="lb-header-title-box">
            <div class="lb-glowing-subtitle">🔥 GLOBAL HALL OF FAME 🔥</div>
            <h2 class="lb-neon-title">🏆 CURSED KEYBOARD LEADERBOARD</h2>
          </div>
          <button type="button" class="cert-close-btn" id="lb-close" title="Close">✕</button>
        </div>

        <div class="lb-criteria-bar">
          <span class="lb-criteria-chip">⭐ <strong>Levels Cleared</strong></span>
          <span class="lb-criteria-chip">⏱️ <strong>Fastest Time</strong></span>
          <span class="lb-criteria-chip">🎯 <strong>Fewest Mistakes</strong></span>
          <span class="lb-criteria-chip">💎 <strong>Score</strong></span>
        </div>

        <div class="leaderboard-table-container">
          <table class="cursed-leaderboard-table">
            <thead>
              <tr>
                <th style="width: 90px;">Rank</th>
                <th>Player</th>
                <th style="text-align: center;">Levels</th>
                <th>Time</th>
                <th>Correct Keys</th>
                <th>Mistakes</th>
                <th>Score</th>
              </tr>
            </thead>
            <tbody id="lb-table-body">
              ${renderRows()}
            </tbody>
          </table>
        </div>

        <div class="go-actions-row" style="margin-top: 14px;">
          <button type="button" class="action-btn lb-btn-play" id="lb-play">Play Now 🚀</button>
          <button type="button" class="action-btn secondary lb-btn-clear" id="lb-clear">Clear Memory 🗑️</button>
          <button type="button" class="action-btn secondary" id="lb-close-btn">Close</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    const close = () => modal.remove();
    modal.querySelector('#lb-close').addEventListener('click', close);
    modal.querySelector('#lb-close-btn').addEventListener('click', close);

    modal.querySelector('#lb-play').addEventListener('click', () => {
      close();
      if (this.currentView === 'START') {
        this.promptPlayerNameAndLaunch();
      } else {
        this.gameEngine.startNewGame(this.selectedMode);
        this.updateGameplayUI();
      }
    });

    modal.querySelector('#lb-clear').addEventListener('click', () => {
      if (confirm("Are you sure you want to erase all Leaderboard history?")) {
        storage.clearLeaderboard();
        const tbody = modal.querySelector('#lb-table-body');
        if (tbody) tbody.innerHTML = renderRows();
        this.showToast("Leaderboard memory wiped clean.", "🧹");
      }
    });
  }

  showAchievementsModal() {
    soundEngine.playKeyClick();
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal';

    let listHtml = '';
    ACHIEVEMENTS.forEach(ach => {
      const unlocked = storage.isUnlocked(ach.id);
      listHtml += `
        <div class="achievement-card ${unlocked ? 'unlocked' : 'locked'}" style="
          display: flex; align-items: center; gap: 14px; background: var(--bg-secondary);
          border: 1.5px solid ${unlocked ? 'var(--accent-color)' : 'rgba(121, 192, 255, 0.25)'};
          padding: 12px 16px; border-radius: 12px; opacity: ${unlocked ? '1' : '0.88'};
          box-shadow: ${unlocked ? '0 0 16px rgba(247, 120, 186, 0.2)' : 'none'};
        ">
          <div style="font-size: 2.2rem;">${ach.icon}</div>
          <div style="flex: 1;">
            <div style="font-weight: 800; font-size: 1rem; color: ${unlocked ? 'var(--accent-color)' : '#ffffff'};">${ach.title}</div>
            <div style="font-size: 0.85rem; color: #c9d1d9; margin-top: 2px;">${ach.desc}</div>
          </div>
          <div style="font-size: 0.8rem; font-weight: 800; color: ${unlocked ? '#56d364' : '#cbd5e1'}; background: ${unlocked ? 'rgba(86, 211, 100, 0.18)' : 'rgba(255, 255, 255, 0.1)'}; padding: 4px 10px; border-radius: 8px; border: 1px solid ${unlocked ? '#56d364' : 'rgba(255, 255, 255, 0.2)'};">
            ${unlocked ? '✓ UNLOCKED' : '🔒 LOCKED'}
          </div>
        </div>
      `;
    });

    modal.innerHTML = `
      <div class="game-over-card" style="max-width: 680px; max-height: 85vh; display: flex; flex-direction: column;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(121, 192, 255, 0.25); padding-bottom: 12px;">
          <h2 style="color: var(--accent-color); margin: 0;">🏆 CURSED ACHIEVEMENTS</h2>
          <button type="button" class="cert-close-btn" id="ach-close">✕</button>
        </div>
        <div style="overflow-y: auto; display: flex; flex-direction: column; gap: 10px; margin: 16px 0; padding-right: 6px;">
          ${listHtml}
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#ach-close').addEventListener('click', () => modal.remove());
  }

  showStatsModal() {
    soundEngine.playKeyClick();
    const stats = storage.stats;
    const modal = document.createElement('div');
    modal.className = 'cursed-overlay-modal';

    modal.innerHTML = `
      <div class="game-over-card" style="max-width: 580px;">
        <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid rgba(121, 192, 255, 0.25); padding-bottom: 12px;">
          <h2 style="color: var(--accent-color); margin: 0;">📊 LIFETIME USELESS STATISTICS</h2>
          <button type="button" class="cert-close-btn" id="stats-close">✕</button>
        </div>
        <div class="go-stats-grid" style="grid-template-columns: repeat(2, 1fr); margin-top: 14px;">
          <div class="go-stat-box">
            <div class="go-stat-val" style="color: var(--accent-color);">${stats.highScore.toLocaleString()}</div>
            <div class="go-stat-lbl">HIGH SCORE</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${stats.bestWPM} WPM</div>
            <div class="go-stat-lbl">BEST TYPING SPEED</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${stats.bestAccuracy}%</div>
            <div class="go-stat-lbl">BEST ACCURACY</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${stats.roundsCompleted}</div>
            <div class="go-stat-lbl">ROUNDS COMPLETED</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val">${stats.totalCharactersTyped.toLocaleString()}</div>
            <div class="go-stat-lbl">CHARACTERS MASSED</div>
          </div>
          <div class="go-stat-box">
            <div class="go-stat-val" style="color: #ff7b72;">${stats.totalMistakes.toLocaleString()}</div>
            <div class="go-stat-lbl">TOTAL CATASTROPHES</div>
          </div>
        </div>
        <div style="font-size: 0.9rem; color: #c9d1d9; margin-top: 12px; font-weight: 600;">
          Kevin Consults: ${stats.kevinConsults || 0} | Betrayals Survived: ${stats.betrayalsSurvived || 0} | Time Wasted: ${Math.round((stats.totalSecondsPlayed || 0) / 60)} mins
        </div>
      </div>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#stats-close').addEventListener('click', () => modal.remove());
  }

  showRoundTransitionToast(loadingMsg) {
    const toast = document.createElement('div');
    toast.className = 'round-transition-toast';
    toast.innerHTML = `<span style="font-size: 1.4rem;">🔄</span> <span>${loadingMsg}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 1800);
  }

  showToast(message, icon = '🔔') {
    const toast = document.createElement('div');
    toast.className = 'cursed-toast';
    toast.innerHTML = `<span style="font-size: 1.3rem;">${icon}</span> <span>${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 400);
    }, 3500);
  }
}

// Initialize on DOM load
window.addEventListener('DOMContentLoaded', () => {
  new CursedKeyboardApp();
});
