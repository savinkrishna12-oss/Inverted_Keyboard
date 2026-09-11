// Local Storage and Statistics Management
import { ACHIEVEMENTS } from '../data/achievementsList.js';

const STATS_KEY = 'cursed_keyboard_stats';
const ACHIEVEMENTS_KEY = 'cursed_keyboard_achievements';
const SETTINGS_KEY = 'cursed_keyboard_settings';
const LEADERBOARD_KEY = 'cursed_keyboard_leaderboard_v2';
const LAST_NAME_KEY = 'cursed_keyboard_last_player_name';

const DEFAULT_STATS = {
  highScore: 0,
  bestWPM: 0,
  bestAccuracy: 0,
  gamesPlayed: 0,
  roundsCompleted: 0,
  totalCharactersTyped: 0,
  totalMistakes: 0,
  totalSecondsPlayed: 0,
  kevinConsults: 0,
  betrayalsSurvived: 0
};

export class StorageManager {
  constructor() {
    this.stats = this.loadStats();
    this.unlockedAchievements = this.loadAchievements();
  }

  loadStats() {
    try {
      const data = localStorage.getItem(STATS_KEY);
      return data ? { ...DEFAULT_STATS, ...JSON.parse(data) } : { ...DEFAULT_STATS };
    } catch (e) {
      return { ...DEFAULT_STATS };
    }
  }

  saveStats() {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(this.stats));
    } catch (e) {}
  }

  loadAchievements() {
    try {
      const data = localStorage.getItem(ACHIEVEMENTS_KEY);
      return data ? JSON.parse(data) : {};
    } catch (e) {
      return {};
    }
  }

  saveAchievements() {
    try {
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(this.unlockedAchievements));
    } catch (e) {}
  }

  isUnlocked(id) {
    return !!this.unlockedAchievements[id];
  }

  unlockAchievement(id) {
    if (this.isUnlocked(id)) return null;
    const ach = ACHIEVEMENTS.find(a => a.id === id);
    if (!ach) return null;

    this.unlockedAchievements[id] = Date.now();
    this.saveAchievements();
    return ach;
  }

  recordRound({ wpm, accuracy, characters, mistakes, isPerfect, isBoss, isMovie, sanity }) {
    this.stats.roundsCompleted += 1;
    this.stats.totalCharactersTyped += characters;
    this.stats.totalMistakes += mistakes;

    if (wpm > this.stats.bestWPM) this.stats.bestWPM = Math.round(wpm);
    if (accuracy > this.stats.bestAccuracy) this.stats.bestAccuracy = Math.round(accuracy);

    const newlyUnlocked = [];

    if (mistakes > 0 && !this.isUnlocked('first_blood')) {
      newlyUnlocked.push(this.unlockAchievement('first_blood'));
    }
    if (mistakes >= 10 && !this.isUnlocked('why_did_i_press_that')) {
      newlyUnlocked.push(this.unlockAchievement('why_did_i_press_that'));
    }
    if (this.stats.roundsCompleted >= 5 && !this.isUnlocked('keyboard_psychology')) {
      newlyUnlocked.push(this.unlockAchievement('keyboard_psychology'));
    }
    if (this.stats.roundsCompleted >= 25 && !this.isUnlocked('i_should_have_stopped')) {
      newlyUnlocked.push(this.unlockAchievement('i_should_have_stopped'));
    }
    if (isPerfect && !this.isUnlocked('robot_in_disguise')) {
      newlyUnlocked.push(this.unlockAchievement('robot_in_disguise'));
    }
    if (isBoss && !this.isUnlocked('nasa_called')) {
      newlyUnlocked.push(this.unlockAchievement('nasa_called'));
    }
    if (isMovie && !this.isUnlocked('absolute_cinema')) {
      newlyUnlocked.push(this.unlockAchievement('absolute_cinema'));
    }
    if (sanity < 5 && sanity > 0 && !this.isUnlocked('professional_regret')) {
      newlyUnlocked.push(this.unlockAchievement('professional_regret'));
    }
    if (wpm >= 45 && !this.isUnlocked('speed_demon')) {
      newlyUnlocked.push(this.unlockAchievement('speed_demon'));
    }

    this.saveStats();
    return newlyUnlocked.filter(Boolean);
  }

  recordTime(seconds) {
    this.stats.totalSecondsPlayed += seconds;
    const newlyUnlocked = [];
    if (this.stats.totalSecondsPlayed >= 600 && !this.isUnlocked('touch_grass')) {
      newlyUnlocked.push(this.unlockAchievement('touch_grass'));
    }
    if (this.stats.totalSecondsPlayed >= 1800 && !this.isUnlocked('this_is_not_productive')) {
      newlyUnlocked.push(this.unlockAchievement('this_is_not_productive'));
    }
    this.saveStats();
    return newlyUnlocked.filter(Boolean);
  }

  recordKevinConsult() {
    this.stats.kevinConsults = (this.stats.kevinConsults || 0) + 1;
    let unlocked = null;
    if (this.stats.kevinConsults >= 5 && !this.isUnlocked('kevin_friend')) {
      unlocked = this.unlockAchievement('kevin_friend');
    }
    this.saveStats();
    return unlocked;
  }

  recordBetrayal() {
    this.stats.betrayalsSurvived = (this.stats.betrayalsSurvived || 0) + 1;
    let unlocked = null;
    if (!this.isUnlocked('betrayal_survivor')) {
      unlocked = this.unlockAchievement('betrayal_survivor');
    }
    this.saveStats();
    return unlocked;
  }

  recordCombo(combo) {
    if (combo >= 50 && !this.isUnlocked('qwerty_warrior')) {
      return this.unlockAchievement('qwerty_warrior');
    }
    return null;
  }

  saveGameScore(score) {
    this.stats.gamesPlayed += 1;
    if (score > this.stats.highScore) {
      this.stats.highScore = score;
    }
    this.saveStats();
  }

  getSetting(key, fallback = null) {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      const parsed = data ? JSON.parse(data) : {};
      return parsed[key] !== undefined ? parsed[key] : fallback;
    } catch (e) {
      return fallback;
    }
  }

  setSetting(key, val) {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      const parsed = data ? JSON.parse(data) : {};
      parsed[key] = val;
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
    } catch (e) {}
  }

  getLastPlayerName() {
    try {
      return localStorage.getItem(LAST_NAME_KEY) || 'Keyboard Warrior';
    } catch (e) {
      return 'Keyboard Warrior';
    }
  }

  setLastPlayerName(name) {
    try {
      const clean = (name || '').trim() || 'Keyboard Warrior';
      localStorage.setItem(LAST_NAME_KEY, clean);
      return clean;
    } catch (e) {
      return name;
    }
  }

  getLeaderboard() {
    try {
      const data = localStorage.getItem(LEADERBOARD_KEY);
      const list = data ? JSON.parse(data) : [];
      if (!Array.isArray(list)) return [];

      // Consolidate duplicates by normalized player name (case-insensitive), keeping best entry
      const uniqueMap = new Map();
      for (const item of list) {
        if (!item || !item.name) continue;
        const key = item.name.trim().toLowerCase();
        if (!uniqueMap.has(key)) {
          uniqueMap.set(key, item);
        } else {
          const existing = uniqueMap.get(key);
          const isBetter =
            (item.levelsCompleted > existing.levelsCompleted) ||
            (item.levelsCompleted === existing.levelsCompleted && item.score > existing.score) ||
            (item.levelsCompleted === existing.levelsCompleted && item.score === existing.score && item.timeTakenSec < existing.timeTakenSec);
          if (isBetter) {
            uniqueMap.set(key, { ...item, attempts: (existing.attempts || 1) + 1 });
          } else {
            existing.attempts = (existing.attempts || 1) + 1;
          }
        }
      }

      const deduplicated = Array.from(uniqueMap.values());
      deduplicated.sort((a, b) => {
        if (b.levelsCompleted !== a.levelsCompleted) {
          return b.levelsCompleted - a.levelsCompleted;
        }
        if (a.timeTakenSec !== b.timeTakenSec) {
          return a.timeTakenSec - b.timeTakenSec;
        }
        if (a.incorrectChars !== b.incorrectChars) {
          return a.incorrectChars - b.incorrectChars;
        }
        return b.score - a.score;
      });

      return deduplicated;
    } catch (e) {
      return [];
    }
  }

  addLeaderboardEntry({ name, levelsCompleted = 0, timeTakenSec = 0, correctChars = 0, incorrectChars = 0, score = 0, wpm = 0, mode = 'QUICK' }) {
    try {
      const cleanName = (name || '').trim() || this.getLastPlayerName();
      this.setLastPlayerName(cleanName);

      const mins = Math.floor(timeTakenSec / 60);
      const secs = timeTakenSec % 60;
      const timeFormatted = `${mins}m ${secs.toString().padStart(2, '0')}s`;

      const list = this.getLeaderboard();
      const normalizedName = cleanName.toLowerCase();
      const existingIndex = list.findIndex(item => (item.name || '').trim().toLowerCase() === normalizedName);

      let targetEntry;
      let isUpdate = false;
      let isNewPersonalBest = false;

      if (existingIndex !== -1) {
        isUpdate = true;
        const existing = list[existingIndex];

        // Compare if current run improved the record:
        // Better if more levels completed, or higher score, or faster time
        const isBetter = 
          levelsCompleted > existing.levelsCompleted ||
          (levelsCompleted === existing.levelsCompleted && score >= existing.score) ||
          (levelsCompleted === existing.levelsCompleted && timeTakenSec <= existing.timeTakenSec) ||
          (existing.levelsCompleted === 0 && levelsCompleted === 0 && score >= existing.score);

        if (isBetter) {
          isNewPersonalBest = true;
          targetEntry = {
            id: existing.id,
            name: cleanName, // update casing if changed
            levelsCompleted: Number(levelsCompleted) || 0,
            timeTakenSec: Number(timeTakenSec) || 0,
            timeFormatted: timeFormatted,
            correctChars: Number(correctChars) || 0,
            incorrectChars: Number(incorrectChars) || 0,
            score: Number(score) || 0,
            wpm: Number(wpm) || 0,
            mode: mode,
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            attempts: (existing.attempts || 1) + 1
          };
        } else {
          // Retain personal best achievements, but update date and increment attempts
          targetEntry = {
            ...existing,
            date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            attempts: (existing.attempts || 1) + 1
          };
        }

        list[existingIndex] = targetEntry;
      } else {
        targetEntry = {
          id: Date.now() + '_' + Math.random().toString(36).substr(2, 4),
          name: cleanName,
          levelsCompleted: Number(levelsCompleted) || 0,
          timeTakenSec: Number(timeTakenSec) || 0,
          timeFormatted: timeFormatted,
          correctChars: Number(correctChars) || 0,
          incorrectChars: Number(incorrectChars) || 0,
          score: Number(score) || 0,
          wpm: Number(wpm) || 0,
          mode: mode,
          date: new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
          attempts: 1
        };
        list.push(targetEntry);
      }

      // Sort criteria:
      // 1. Levels completed successfully (descending)
      // 2. Time taken (ascending: faster is better)
      // 3. Incorrect keystrokes (ascending: fewer mistakes is better)
      // 4. Correct keystrokes / Score (descending)
      list.sort((a, b) => {
        if (b.levelsCompleted !== a.levelsCompleted) {
          return b.levelsCompleted - a.levelsCompleted;
        }
        if (a.timeTakenSec !== b.timeTakenSec) {
          return a.timeTakenSec - b.timeTakenSec;
        }
        if (a.incorrectChars !== b.incorrectChars) {
          return a.incorrectChars - b.incorrectChars;
        }
        return b.score - a.score;
      });

      // Keep top 50
      const trimmed = list.slice(0, 50);
      localStorage.setItem(LEADERBOARD_KEY, JSON.stringify(trimmed));

      const rank = trimmed.findIndex(item => item.id === targetEntry.id) + 1;
      return { 
        entry: targetEntry, 
        rank, 
        leaderboard: trimmed,
        isUpdate,
        isNewPersonalBest
      };
    } catch (e) {
      return { entry: null, rank: 1, leaderboard: [], isUpdate: false, isNewPersonalBest: false };
    }
  }

  clearLeaderboard() {
    try {
      localStorage.removeItem(LEADERBOARD_KEY);
    } catch (e) {}
  }
}

export const storage = new StorageManager();
