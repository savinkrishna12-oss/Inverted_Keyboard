// Core Game Engine for Cursed Keyboard
import { MappingEngine, CURSE_MODES } from './mappingEngine.js';
import { getRandomSentence, getBossSentence, injectMathExpressionIntoSentence } from '../data/sentences.js';
import { soundEngine } from '../audio/soundEngine.js';
import { storage } from './storage.js';
import {
  getContextMistakeRoast,
  getEndOfRoundRoast,
  getMistakeCounterLabel,
  getRandomMoodLabels,
  RARE_REACTIONS
} from '../data/roastsDatabase.js';

const ROASTS_CORRECT = [
  "WAIT... YOU ACTUALLY KNOW HOW TO TYPE?",
  "Suspiciously competent. 🤨",
  "Unfortunately, you're good at this. ✨",
  "Keyboard engineers are crying. 😭",
  "A momentary lapse in your usual failure. 😂",
  "Don't get used to it. 🗿",
  "Miracles do happen occasionally. 🌟"
];

const ROASTS_MISTAKE = [
  "INCORRECT.",
  "Your keyboard has filed a formal complaint.",
  "That was not even close.",
  "Bro typed with confidence.",
  "Your ancestors felt that mistake.",
  "Interesting strategy. Completely wrong.",
  "NASA has been notified.",
  "Please return your keyboard to the manufacturer.",
  "That key did NOT say that.",
  "Skill issue of astronomical proportions."
];

const COMBO_TIERS = [
  { count: 100, text: "ABSOLUTELY UNNECESSARY." },
  { count: 50, text: "WHO GAVE THIS PERSON PERMISSION TO TYPE?" },
  { count: 25, text: "THE KEYBOARD FEARS YOU." },
  { count: 10, text: "You're getting dangerous." },
  { count: 5, text: "Okay." }
];

const RIDICULOUS_TITLES = [
  "Keyboard Victim",
  "Certified Button Masher",
  "Typing Goblin",
  "QWERTY Survivor",
  "Keyboard Conspiracy Theorist",
  "Professional Typistn't",
  "Human Error Incarnate",
  "The Chosen One",
  "Unemployed Hacker",
  "Ctrl+Alt+Despair",
  "Keyboard Final Boss",
  "Touch-Typing Menace",
  "Certified Skill Issue"
];

const FINAL_VERDICTS = [
  "You typed like someone who discovered the keyboard five minutes ago.",
  "You are officially stronger than your keyboard.",
  "Your performance has been forwarded to absolutely nobody.",
  "Congratulations. You wasted time successfully.",
  "Even Kevin from IT was rendered speechless by this.",
  "Your keyboard manufacturer will hear about this."
];

export class GameEngine {
  constructor({ virtualKeyboard, diagnostics, kevin, reactionManager, onGameOver, onRoundComplete, onTimerTick }) {
    this.vk = virtualKeyboard;
    this.diag = diagnostics;
    this.kevin = kevin;
    this.reactionManager = reactionManager;
    this.onGameOver = onGameOver;
    this.onRoundComplete = onRoundComplete;
    this.onTimerTick = onTimerTick;

    this.mappingEngine = new MappingEngine(CURSE_MODES.MIRROR);
    this.gameMode = 'QUICK'; // QUICK, ENDLESS, BOSS, CHAOS, WHAT_IF
    this.currentCurse = CURSE_MODES.MIRROR;
    this.lessChaos = false;
    this.playerName = storage.getLastPlayerName();

    this.currentRound = 1;
    this.maxRounds = 5;
    this.targetSentence = "";
    this.typedBuffer = "";
    this.mistakesInRound = 0;
    this.totalMistakesInGame = 0;
    this.totalCharactersTypedInGame = 0;

    // Leaderboard-specific metrics
    this.correctCharsCount = 0;
    this.incorrectCharsCount = 0;
    this.levelsCompletedCount = 0;

    // Round timer (2 minutes per round)
    this.roundTimeLimit = 120;
    this.roundTimeLeft = 120;
    this.roundTimerInterval = null;

    this.consecutiveMistakes = 0;
    this.sameWrongKeyCount = 0;
    this.lastWrongKey = null;
    this.sameTargetMissCount = 0;
    this.lastTargetChar = null;

    this.combo = 0;
    this.bestCombo = 0;
    this.sanity = 100; // 0 to 100
    this.startTime = 0;
    this.roundStartTime = 0;
    this.betrayalTimer = null;
    this.isRoundActive = false;
    this.betrayalsInGame = 0;

    // Dynamic Math Mutation tracking
    this.wasLastRoundFast = false;
    this.lastRoundWpm = 0;
    this.lastRoundDurationSec = 0;
    this.isMathMutated = false;

    // Mistake limit per level
    this.currentMistakeLimit = 6;
  }

  setPlayerName(name) {
    if (name && name.trim()) {
      this.playerName = name.trim();
    }
  }

  setLessChaos(enabled) {
    this.lessChaos = enabled;
    if (this.reactionManager) {
      this.reactionManager.setLessChaos(enabled);
    }
  }

  startNewGame(gameMode = 'QUICK', initialCurse = CURSE_MODES.MIRROR, playerName = null) {
    this.gameMode = gameMode;
    if (playerName) {
      this.setPlayerName(playerName);
    }
    this.currentRound = 1;
    this.currentCurse = initialCurse;
    this.maxRounds = (gameMode === 'ENDLESS') ? 9999 : (gameMode === 'BOSS' ? 3 : 5);

    this.totalMistakesInGame = 0;
    this.totalCharactersTypedInGame = 0;
    this.correctCharsCount = 0;
    this.incorrectCharsCount = 0;
    this.levelsCompletedCount = 0;

    this.consecutiveMistakes = 0;
    this.sameWrongKeyCount = 0;
    this.lastWrongKey = null;
    this.sameTargetMissCount = 0;
    this.lastTargetChar = null;

    this.combo = 0;
    this.bestCombo = 0;
    this.sanity = 100;
    this.betrayalsInGame = 0;
    this.startTime = Date.now();

    this.wasLastRoundFast = false;
    this.lastRoundWpm = 0;
    this.lastRoundDurationSec = 0;
    this.isMathMutated = false;
    this.currentMistakeLimit = 6;

    this.diag.reset();
    this.startRound();
  }

  startRound() {
    this.typedBuffer = "";
    this.mistakesInRound = 0;
    this.consecutiveMistakes = 0;
    this.roundStartTime = Date.now();
    this.isRoundActive = true;

    // Calculate mistake limit for current level:
    // - In modes containing 5 levels: starts at 6 and decreases by 1 each round (6, 5, 4, 3, 2)
    // - In Endless mode: starts at 10 and decreases by 1 as rounds advance (10, 9, 8, 7..., min 1)
    if (this.gameMode === 'ENDLESS') {
      this.currentMistakeLimit = Math.max(1, 10 - (this.currentRound - 1));
    } else {
      this.currentMistakeLimit = Math.max(1, 6 - (this.currentRound - 1));
    }

    // Reset and start 120s (2 minutes) timer for this round
    this.startRoundTimer();

    // Pick curse based on gameMode
    if (this.gameMode === 'CHAOS') {
      const curses = [CURSE_MODES.MIRROR, CURSE_MODES.ALPHABET_CHAOS, CURSE_MODES.ONE_KEY_OFF, CURSE_MODES.EMOTIONAL_KEYBOARD, CURSE_MODES.BETRAYAL];
      this.currentCurse = curses[Math.floor(Math.random() * curses.length)];
    } else if (this.gameMode === 'BOSS') {
      this.currentCurse = CURSE_MODES.BOSS;
    } else if (this.gameMode === 'WHAT_IF') {
      this.currentCurse = CURSE_MODES.WHAT_IF;
    }

    this.mappingEngine.setMode(this.currentCurse);
    if (this.vk && this.vk.setMappingEngine) {
      this.vk.setMappingEngine(this.mappingEngine);
    } else {
      this.vk.updateMappings();
    }

    // Select sentence
    if (this.gameMode === 'BOSS') {
      this.targetSentence = getBossSentence(this.currentRound).text;
    } else {
      this.targetSentence = getRandomSentence().text;
    }

    // Dynamic Mathematical Expression Injection:
    // Trigger conditions:
    // 1. After 3 levels completed (levelsCompletedCount >= 3 or currentRound >= 4)
    // 2. OR player completed previous level fastly (wasLastRoundFast: roundWpm >= 32 or roundDurationSec <= 25)
    // 3. Injected randomly (75% probability when eligible, or 10% surprise)
    const isAfter3Levels = this.levelsCompletedCount >= 3 || this.currentRound >= 4;
    const isFastPlayer = !!this.wasLastRoundFast;
    const isEligible = isAfter3Levels || isFastPlayer;
    const roll = Math.random();
    const shouldInjectMath = (isEligible && roll < 0.75) || (roll < 0.10);

    if (shouldInjectMath) {
      this.targetSentence = injectMathExpressionIntoSentence(this.targetSentence);
      this.isMathMutated = true;

      if (isFastPlayer) {
        if (this.kevin) {
          this.kevin.say("⚡ SPEED DEMON DETECTED! Deploying math equations to slow you down! 🧮🤯", '⚡', 3500);
        }
        if (this.reactionManager) {
          this.reactionManager.showReaction({ message: "⚡ SPEED LIMIT VIOLATION! Math formula injected! 🧮" });
        }
      } else if (isAfter3Levels) {
        if (this.kevin) {
          this.kevin.say("🧠 LEVEL 3+ UNLOCKED! Complex equations injected into sentence! 📐😈", '🤓', 3500);
        }
        if (this.reactionManager) {
          this.reactionManager.showReaction({ message: "🧠 LEVEL 3+ ACTIVE! Random math expression added! 🧮" });
        }
      } else {
        if (this.reactionManager) {
          this.reactionManager.showReaction({ message: "🎲 RANDOM EVENT: Math mutation active! 🧮" });
        }
      }
    } else {
      this.isMathMutated = false;
    }

    this.updateTargetHint();

    // Set up Betrayal timer if Betrayal mode
    this.setupBetrayalTimer();
  }

  startRoundTimer() {
    clearInterval(this.roundTimerInterval);
    this.roundTimeLeft = this.roundTimeLimit;
    if (this.onTimerTick) this.onTimerTick(this.roundTimeLeft);

    this.roundTimerInterval = setInterval(() => {
      if (!this.isRoundActive) return;
      this.roundTimeLeft--;
      if (this.onTimerTick) this.onTimerTick(this.roundTimeLeft);

      if (this.roundTimeLeft === 30) {
        soundEngine.playWarningAlarm();
        if (this.kevin) this.kevin.say("30 SECONDS REMAINING! HURRY! ⏰😱", '😱', 3000);
        if (this.reactionManager) {
          this.reactionManager.showReaction({ message: "⚠️ 30 SECONDS LEFT! CLOCK IS TICKING! ⏳" });
        }
      } else if (this.roundTimeLeft === 10) {
        soundEngine.playWarningAlarm();
        if (this.kevin) this.kevin.say("10 SECONDS LEFT! TYPE FASTER! ⏰💀", '😱', 2500);
      } else if (this.roundTimeLeft <= 5 && this.roundTimeLeft > 0) {
        soundEngine.playCountdown(380 + (5 - this.roundTimeLeft) * 80);
      } else if (this.roundTimeLeft <= 0) {
        this.handleRoundTimeout();
      }
    }, 1000);
  }

  handleRoundTimeout() {
    this.isRoundActive = false;
    clearInterval(this.roundTimerInterval);
    clearInterval(this.betrayalTimer);
    soundEngine.playSanityCrash();

    // Deduct 25 sanity for timing out
    this.sanity = Math.max(0, this.sanity - 25);

    if (this.kevin) {
      this.kevin.say("TIME'S UP! 2 minutes elapsed! The keyboard defeated you! ⌛💀", '💀', 4000);
    }
    if (this.reactionManager) {
      this.reactionManager.showReaction({ message: "⏰ TIME OVER! 2 minutes elapsed!" });
    }

    // Modal informing player of timeout
    const timeoutModal = document.createElement('div');
    timeoutModal.className = 'cursed-overlay-modal';
    timeoutModal.innerHTML = `
      <div class="game-over-card" style="max-width: 520px; border-color: #ff4757;">
        <div class="go-header">
          <h1 style="color: #ff4757;">⏰ 2-MINUTE TIME LIMIT REACHED!</h1>
          <div style="font-size: 1.1rem; color: var(--text-secondary); margin-top: 6px;">
            You spent 2 full minutes staring in disbelief at this cursed layout.
          </div>
        </div>
        <div style="background: var(--bg-secondary); border-radius: 12px; padding: 14px; margin: 16px 0; border: 1px solid var(--border-color); text-align: left; font-size: 0.95rem;">
          <div>❤️ <strong>Sanity Penalty:</strong> -25% (Remaining: ${this.sanity}%)</div>
          <div style="margin-top: 6px;">🎯 <strong>Typed so far:</strong> "${this.escapeHtml(this.typedBuffer)}"</div>
          <div style="margin-top: 6px; color: var(--accent-color);">🏆 <strong>Levels Completed So Far:</strong> ${this.levelsCompletedCount}</div>
        </div>
        <div class="go-actions-row">
          ${this.sanity > 0 ? `<button type="button" class="action-btn" id="timeout-retry">Retry Round 🔄</button>` : ''}
          <button type="button" class="action-btn secondary" id="timeout-surrender">End Game & Save Score 🏁</button>
        </div>
      </div>
    `;

    document.body.appendChild(timeoutModal);

    const retryBtn = timeoutModal.querySelector('#timeout-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        timeoutModal.remove();
        this.startRound();
        if (this.onRoundComplete) this.onRoundComplete(this);
      });
    }

    timeoutModal.querySelector('#timeout-surrender').addEventListener('click', () => {
      timeoutModal.remove();
      this.endGame();
    });
  }

  escapeHtml(str) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  updateTargetHint() {
    if (!this.targetSentence || !this.vk || !this.vk.highlightTargetKey) return;
    const nextChar = this.targetSentence[this.typedBuffer.length];
    this.vk.highlightTargetKey(nextChar);
  }

  setupBetrayalTimer() {
    clearInterval(this.betrayalTimer);
    if (this.currentCurse === CURSE_MODES.BETRAYAL || this.gameMode === 'BOSS' || (this.gameMode === 'WHAT_IF' && this.mappingEngine.activeCurseStack.includes(CURSE_MODES.BETRAYAL))) {
      const intervalSec = Math.floor(Math.random() * 8 + 10); // 10 to 18 seconds
      this.betrayalTimer = setTimeout(() => {
        if (this.isRoundActive) {
          this.triggerBetrayal();
          this.setupBetrayalTimer();
        }
      }, intervalSec * 1000);
    }
  }

  triggerBetrayal() {
    soundEngine.playWarningAlarm();
    this.betrayalsInGame++;
    storage.recordBetrayal();
    this.mappingEngine.betray();
    if (this.vk && this.vk.setMappingEngine) {
      this.vk.setMappingEngine(this.mappingEngine);
    } else {
      this.vk.updateMappings();
    }
    this.updateTargetHint();
    this.vk.triggerPanic(1800);

    const banner = document.createElement('div');
    banner.className = 'betrayal-flash-banner';
    banner.innerHTML = `⚠️ KEYBOARD BETRAYAL DETECTED! NEW MAPPING GENERATED!`;
    document.body.appendChild(banner);
    setTimeout(() => banner.remove(), 2500);

    this.kevin.say("Oops! Your keyboard just betrayed you. How tragic.", '😈', 3500);
  }

  checkBufferHasErrors() {
    if (this.typedBuffer.length > this.targetSentence.length) return true;
    for (let i = 0; i < this.typedBuffer.length; i++) {
      const tc = this.targetSentence[i];
      const bc = this.typedBuffer[i];
      const isLetter = /[a-zA-Z]/.test(tc) && /[a-zA-Z]/.test(bc);
      const match = isLetter ? tc.toLowerCase() === bc.toLowerCase() : tc === bc;
      if (!match) return true;
    }
    return false;
  }

  handleKeyDown(e) {
    if (!this.isRoundActive) return false;

    // Ignore non-printable modifier-only presses
    if (['Control', 'Alt', 'Meta', 'Shift', 'CapsLock', 'Tab'].includes(e.key)) {
      // Check emotional phrase
      const emotion = this.mappingEngine.getEmotionalPhrase(e.key);
      if (emotion) {
        this.vk.updateDebugBar(e.key.toUpperCase(), emotion, "Emotional keyboard outburst");
        this.kevin.say(`Keyboard: "${emotion}"`, '🤖', 2500);
      }
      this.vk.highlightKey(e.key);
      return false;
    }

    // Handle Backspace
    if (e.key === 'Backspace') {
      const emotion = this.mappingEngine.getEmotionalPhrase('Backspace');
      if (emotion) {
        this.kevin.say("Backspace says: REGRET.", '🤦‍♂️', 2500);
      }
      if (this.typedBuffer.length > 0) {
        this.typedBuffer = this.typedBuffer.slice(0, -1);
        soundEngine.playKeyClick(true);
        this.vk.highlightKey('Backspace');
        this.vk.updateDebugBar('⌫ BACKSPACE', 'DELETED', 'Attempting to erase shame');
        this.updateTargetHint();
      }
      return true;
    }

    // Normal Character processing
    if (e.key.length === 1) {
      // Check emotional space
      if (e.key === ' ') {
        const emotion = this.mappingEngine.getEmotionalPhrase(' ');
        if (emotion && Math.random() < 0.25) {
          this.kevin.say("Spacebar: 'NOPE'", '😐', 2000);
        }
      }

      // Transform key through cursed engine
      let cursedChar = this.mappingEngine.transformKey(e.key);

      // Expected target character at current buffer position
      const targetIndex = this.currentCurse === CURSE_MODES.REVERSE_EVERYTHING
        ? (this.targetSentence.length - 1 - this.typedBuffer.length)
        : this.typedBuffer.length;

      const targetExpectedChar = this.targetSentence[targetIndex] || '';

      const isLetter = /[a-zA-Z]/.test(targetExpectedChar) && /[a-zA-Z]/.test(cursedChar);
      const isCorrect = isLetter
        ? cursedChar.toLowerCase() === targetExpectedChar.toLowerCase()
        : cursedChar === targetExpectedChar;

      this.diag.recordKey(isCorrect);
      this.totalCharactersTypedInGame++;

      let roastMessage = "";

      if (isCorrect) {
        this.vk.highlightKey(e.key);
        this.correctCharsCount++;

        // Did player recover after multiple consecutive mistakes?
        if (this.consecutiveMistakes >= 3) {
          roastMessage = "Oh! So you DO know how to type! 😭👏";
          if (this.reactionManager) {
            this.reactionManager.showReaction({ message: roastMessage });
          }
        }

        this.consecutiveMistakes = 0;
        this.sameWrongKeyCount = 0;
        this.sameTargetMissCount = 0;

        // Use target's original casing for visual cleanliness
        const charToAppend = isLetter ? targetExpectedChar : cursedChar;
        this.typedBuffer += charToAppend;
        this.combo++;
        if (this.combo > this.bestCombo) this.bestCombo = this.combo;

        // Sound
        soundEngine.playCorrect(this.combo);

        // Sanity recovery on combo
        if (this.combo % 10 === 0) {
          this.sanity = Math.min(100, this.sanity + 4);
        }

        // Check combo milestones
        const tier = COMBO_TIERS.find(t => t.count === this.combo);
        if (tier) {
          soundEngine.playComboMilestone(this.combo);
          roastMessage = tier.text;
          this.kevin.onHighCombo();
          storage.recordCombo(this.combo);
          if (this.reactionManager) {
            this.reactionManager.showReaction({ message: `🔥 ${tier.text}` });
          }
        } else if (!roastMessage) {
          roastMessage = ROASTS_CORRECT[Math.floor(Math.random() * ROASTS_CORRECT.length)];
        }
      } else {
        // Mistake!
        const brokenCombo = this.combo;
        this.combo = 0;
        this.mistakesInRound++;
        this.totalMistakesInGame++;
        this.incorrectCharsCount++;
        this.consecutiveMistakes++;

        // Track repeated wrong key
        const lowerKey = e.key.toLowerCase();
        if (this.lastWrongKey === lowerKey) {
          this.sameWrongKeyCount++;
        } else {
          this.sameWrongKeyCount = 1;
          this.lastWrongKey = lowerKey;
        }

        // Track repeated target miss
        if (this.lastTargetChar === targetExpectedChar) {
          this.sameTargetMissCount++;
        } else {
          this.sameTargetMissCount = 1;
          this.lastTargetChar = targetExpectedChar;
        }

        const neededPhysicalKey = this.mappingEngine.getPhysicalKeyFor(targetExpectedChar);

        // Visual wrong key reaction on virtual keyboard!
        if (this.vk && this.vk.highlightWrongKey) {
          this.vk.highlightWrongKey(e.key, neededPhysicalKey);
        }

        // Funny sound variations
        soundEngine.playError();

        // Also append the mistyped character so player SEES their input and can backspace!
        if (this.typedBuffer.length < this.targetSentence.length + 5) {
          this.typedBuffer += cursedChar;
        }

        // Sanity damage
        this.sanity = Math.max(0, this.sanity - (this.gameMode === 'BOSS' ? 12 : 7));

        // Check for special rare reactions
        const rareRoll = Math.random();
        let triggeredRare = null;
        for (const rare of RARE_REACTIONS) {
          if (rareRoll < rare.chance) {
            triggeredRare = rare;
            break;
          }
        }

        if (triggeredRare) {
          if (triggeredRare.type === 'kevin') {
            this.kevin.say(triggeredRare.speech, '🧐', 4000);
          } else if (this.reactionManager) {
            this.reactionManager.showReaction({ isRare: true, rareData: triggeredRare });
          }
          roastMessage = triggeredRare.title || "THE KEYBOARD HAS WITNESSED ENOUGH 💀";
        } else {
          // Generate context-aware sarcastic roast
          roastMessage = getContextMistakeRoast({
            totalMistakes: this.mistakesInRound,
            consecutiveMistakes: this.consecutiveMistakes,
            sameWrongKeyCount: this.sameWrongKeyCount,
            sameTargetMissCount: this.sameTargetMissCount,
            pressedKey: e.key,
            neededKey: neededPhysicalKey,
            brokenCombo: brokenCombo,
            timePlayedSec: (Date.now() - this.startTime) / 1000
          });

          // Show floating animated speech bubble near typing area!
          if (this.reactionManager) {
            this.reactionManager.showReaction({
              message: roastMessage,
              pressedKey: e.key,
              neededKey: neededPhysicalKey
            });
          }
        }

        if (this.mistakesInRound % 4 === 0) {
          this.kevin.onManyMistakes();
        }

        // Screen shake if sanity low and not in lessChaos mode
        if (this.sanity <= 30 && !this.lessChaos) {
          document.body.classList.add('low-sanity-shake');
          setTimeout(() => document.body.classList.remove('low-sanity-shake'), 300);
        }

        // Check sanity zero death
        if (this.sanity <= 0) {
          this.handleSanityCollapse();
          return true;
        }

        // Check mistake limit exceeded
        if (Number.isFinite(this.currentMistakeLimit) && this.mistakesInRound >= this.currentMistakeLimit) {
          this.handleMistakeLimitExceeded();
          return true;
        } else if (Number.isFinite(this.currentMistakeLimit) && this.mistakesInRound === this.currentMistakeLimit - 1) {
          // Warning when only 1 mistake remains
          soundEngine.playWarningAlarm();
          if (this.kevin) {
            this.kevin.say(`CRITICAL WARNING: 1 MISTAKE LEFT! Next typo fails this level! 🚨😱`, '😱', 3000);
          }
          if (this.reactionManager) {
            this.reactionManager.showReaction({ message: `⚠️ FINAL MISTAKE REMAINING! (${this.mistakesInRound}/${this.currentMistakeLimit}) 🚨` });
          }
        }
      }

      this.updateTargetHint();
      this.vk.updateDebugBar(e.key.toUpperCase(), cursedChar.toUpperCase(), roastMessage);

      // Check round completion: only completes when buffer length matches and all chars are correct!
      const hasErrors = this.checkBufferHasErrors();
      if (!hasErrors && this.typedBuffer.length >= this.targetSentence.length) {
        this.completeRound();
      }

      return true;
    }

    return false;
  }

  handleSanityCollapse() {
    this.isRoundActive = false;
    clearInterval(this.roundTimerInterval);
    clearInterval(this.betrayalTimer);
    soundEngine.playSanityCrash();

    const crashModal = document.createElement('div');
    crashModal.className = 'cursed-overlay-modal sanity-crash-modal';
    crashModal.innerHTML = `
      <div class="sanity-crash-card">
        <div class="bsod-smile">:(</div>
        <h1>SANITY.EXE HAS STOPPED RESPONDING</h1>
        <p>A fatal keyboard exception 0xKEYBOARD_BETRAYAL has occurred at your desk.</p>
        <div class="bsod-details">
          <div>* Error code: USER_RAGE_OVERFLOW</div>
          <div>* Memory dumped to floor</div>
          <div>* Total typos registered: ${this.mistakesInRound}</div>
          <div>* Diagnostic: The keyboard has officially won this battle.</div>
        </div>
        <div class="crash-actions">
          <button type="button" class="action-btn" id="crash-restart">Reboot Sanity</button>
        </div>
      </div>
    `;
    document.body.appendChild(crashModal);

    this.kevin.onRoundFailed();

    crashModal.querySelector('#crash-restart').addEventListener('click', () => {
      crashModal.remove();
      if (this.gameMode === 'ENDLESS') {
        this.endGame();
      } else {
        // Restart round with reset sanity
        this.sanity = 100;
        this.startRound();
        if (this.onRoundComplete) this.onRoundComplete(this);
      }
    });
  }

  handleMistakeLimitExceeded() {
    this.isRoundActive = false;
    clearInterval(this.roundTimerInterval);
    clearInterval(this.betrayalTimer);
    soundEngine.playSanityCrash();

    // Deduct 20 sanity for exceeding mistake limit
    this.sanity = Math.max(0, this.sanity - 20);

    if (this.kevin) {
      this.kevin.say(`MISTAKE LIMIT EXCEEDED! Level ${this.currentRound} allowed ${this.currentMistakeLimit} mistakes, but you committed ${this.mistakesInRound}! 💀`, '💀', 4500);
    }
    if (this.reactionManager) {
      this.reactionManager.showReaction({ message: `❌ MISTAKE LIMIT EXCEEDED! (${this.mistakesInRound} / ${this.currentMistakeLimit})` });
    }

    const limitModal = document.createElement('div');
    limitModal.className = 'cursed-overlay-modal mistake-limit-modal';
    limitModal.innerHTML = `
      <div class="game-over-card" style="max-width: 520px; border-color: #ff4757;">
        <div class="go-header">
          <h1 style="color: #ff4757;">❌ MISTAKE LIMIT EXCEEDED!</h1>
          <div style="font-size: 1.1rem; color: var(--text-secondary); margin-top: 6px;">
            Level ${this.currentRound} only permitted <strong>${this.currentMistakeLimit} mistakes</strong>. You ran out of chances!
          </div>
        </div>
        <div style="background: var(--bg-secondary); border-radius: 12px; padding: 14px; margin: 16px 0; border: 1px solid var(--border-color); text-align: left; font-size: 0.95rem;">
          <div>❤️ <strong>Sanity Penalty:</strong> -20% (Remaining: ${this.sanity}%)</div>
          <div style="margin-top: 6px;">❌ <strong>Mistakes committed:</strong> ${this.mistakesInRound} / ${this.currentMistakeLimit}</div>
          <div style="margin-top: 6px;">🎯 <strong>Typed so far:</strong> "${this.escapeHtml(this.typedBuffer)}"</div>
          <div style="margin-top: 6px; color: var(--accent-color);">🏆 <strong>Levels Completed So Far:</strong> ${this.levelsCompletedCount}</div>
        </div>
        <div class="go-actions-row">
          ${this.sanity > 0 ? `<button type="button" class="action-btn" id="limit-retry">Retry Level 🔄</button>` : ''}
          <button type="button" class="action-btn secondary" id="limit-surrender">End Game & Save Score 🏁</button>
        </div>
      </div>
    `;

    document.body.appendChild(limitModal);

    const retryBtn = limitModal.querySelector('#limit-retry');
    if (retryBtn) {
      retryBtn.addEventListener('click', () => {
        limitModal.remove();
        this.startRound();
        if (this.onRoundComplete) this.onRoundComplete(this);
      });
    }

    limitModal.querySelector('#limit-surrender').addEventListener('click', () => {
      limitModal.remove();
      this.endGame();
    });
  }

  completeRound() {
    this.isRoundActive = false;
    clearInterval(this.roundTimerInterval);
    clearInterval(this.betrayalTimer);
    soundEngine.playAchievement();

    this.levelsCompletedCount++;

    const roundDurationSec = Math.max(1, (Date.now() - this.roundStartTime) / 1000);
    const roundWpm = Math.round((this.targetSentence.length / 5) / (roundDurationSec / 60));
    const roundAcc = Math.round(((this.targetSentence.length) / (this.targetSentence.length + this.mistakesInRound)) * 100);
    const isPerfect = this.mistakesInRound === 0;

    // Record speed metrics for dynamic math mutation
    this.lastRoundWpm = roundWpm;
    this.lastRoundDurationSec = roundDurationSec;
    this.wasLastRoundFast = (roundWpm >= 32 || roundDurationSec <= 25);

    const endOfRoundRoast = getEndOfRoundRoast(this.mistakesInRound);

    if (this.kevin) {
      this.kevin.say(endOfRoundRoast, isPerfect ? '👑' : (this.mistakesInRound > 15 ? '💀' : '😏'), 4500);
    }
    if (this.reactionManager) {
      this.reactionManager.showReaction({ message: `🏁 Round Complete! ${endOfRoundRoast}` });
    }

    // Record stats
    storage.recordRound({
      wpm: roundWpm,
      accuracy: roundAcc,
      characters: this.targetSentence.length,
      mistakes: this.mistakesInRound,
      isPerfect: isPerfect,
      isBoss: this.gameMode === 'BOSS',
      sanity: this.sanity
    });

    if (this.currentRound >= this.maxRounds) {
      this.endGame();
    } else {
      this.currentRound++;
      if (this.onRoundComplete) this.onRoundComplete(this);
      this.startRound();
    }
  }

  endGame() {
    this.isRoundActive = false;
    clearInterval(this.roundTimerInterval);
    clearInterval(this.betrayalTimer);

    const totalSec = Math.max(1, Math.round((Date.now() - this.startTime) / 1000));
    const finalWpm = Math.round((this.totalCharactersTypedInGame / 5) / (totalSec / 60));
    const totalChars = Math.max(1, this.totalCharactersTypedInGame);
    const finalAcc = Math.max(0, Math.min(100, Math.round(((totalChars - this.totalMistakesInGame) / totalChars) * 100)));

    // Score calculation
    const baseScore = totalChars * 10;
    const wpmBonus = finalWpm * 25;
    const accuracyBonus = finalAcc * 20;
    const sanityBonus = this.sanity * 15;
    const mistakePenalty = this.totalMistakesInGame * 15;
    const betrayalBonus = this.betrayalsInGame * 100;
    const levelsBonus = this.levelsCompletedCount * 150;

    const finalScore = Math.max(42, Math.round(baseScore + wpmBonus + accuracyBonus + sanityBonus + levelsBonus - mistakePenalty + betrayalBonus));
    storage.saveGameScore(finalScore);

    // Save to persistent leaderboard
    const leaderboardResult = storage.addLeaderboardEntry({
      name: this.playerName,
      levelsCompleted: this.levelsCompletedCount,
      timeTakenSec: totalSec,
      correctChars: this.correctCharsCount,
      incorrectChars: this.totalMistakesInGame,
      score: finalScore,
      wpm: finalWpm,
      mode: this.gameMode
    });

    const title = RIDICULOUS_TITLES[Math.floor(Math.random() * RIDICULOUS_TITLES.length)];
    const verdict = FINAL_VERDICTS[Math.floor(Math.random() * FINAL_VERDICTS.length)];

    const resultData = {
      score: finalScore,
      wpm: finalWpm,
      accuracy: finalAcc,
      mistakes: this.totalMistakesInGame,
      correctChars: this.correctCharsCount,
      levelsCompleted: this.levelsCompletedCount,
      timeTakenSec: totalSec,
      timeFormatted: `${Math.floor(totalSec / 60)}m ${(totalSec % 60).toString().padStart(2, '0')}s`,
      playerName: this.playerName,
      leaderboardResult: leaderboardResult,
      sanity: this.sanity,
      trust: this.diag.keyboardTrust,
      title: title,
      verdict: verdict,
      rounds: this.currentRound,
      mode: this.gameMode
    };

    if (this.onGameOver) this.onGameOver(resultData);
  }

  getDisplayProgress() {
    return {
      sentence: this.targetSentence,
      typed: this.typedBuffer,
      progressPerc: Math.round((this.typedBuffer.length / Math.max(1, this.targetSentence.length)) * 100),
      combo: this.combo,
      sanity: this.sanity,
      round: this.currentRound,
      maxRounds: this.maxRounds,
      mode: this.gameMode,
      curse: this.currentCurse,
      mistakesInRound: this.mistakesInRound,
      mistakeLabel: getMistakeCounterLabel(this.mistakesInRound),
      moodLabels: getRandomMoodLabels(),
      timeLeft: this.roundTimeLeft,
      correctChars: this.correctCharsCount,
      incorrectChars: this.incorrectCharsCount,
      levelsCompleted: this.levelsCompletedCount,
      playerName: this.playerName,
      isMathMutated: this.isMathMutated,
      mistakeLimit: this.currentMistakeLimit
    };
  }
}
