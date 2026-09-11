// Cursed Keyboard Mapping Engine

export const CURSE_MODES = {
  MIRROR: 'MIRROR',
  ALPHABET_CHAOS: 'ALPHABET_CHAOS',
  ONE_KEY_OFF: 'ONE_KEY_OFF',
  REVERSE_EVERYTHING: 'REVERSE_EVERYTHING',
  EMOTIONAL_KEYBOARD: 'EMOTIONAL_KEYBOARD',
  BETRAYAL: 'BETRAYAL',
  BOSS: 'BOSS',
  WHAT_IF: 'WHAT_IF'
};

export const MODE_INFO = {
  MIRROR: {
    title: "MODE 1: MIRROR",
    subtitle: "Your keyboard is reflected in a carnival mirror.",
    desc: "Q becomes P, W becomes O, and your sanity becomes zero."
  },
  ALPHABET_CHAOS: {
    title: "MODE 2: ALPHABET CHAOS",
    subtitle: "THE KEYBOARD HAS FORGOTTEN EVERYTHING.",
    desc: "Every single key maps to a completely random different key."
  },
  ONE_KEY_OFF: {
    title: "MODE 3: ONE KEY OFF",
    subtitle: "Every key outputs the letter next to it.",
    desc: "You will spend the next five minutes questioning your spatial awareness."
  },
  REVERSE_EVERYTHING: {
    title: "MODE 4: REVERSE EVERYTHING",
    subtitle: "Typing forward writes backward.",
    desc: "You type HELLO, the computer hears OLLEH."
  },
  EMOTIONAL_KEYBOARD: {
    title: "MODE 5: EMOTIONAL KEYBOARD",
    subtitle: "The keyboard has developed existential dread.",
    desc: "Space says 'NOPE', Backspace says 'REGRET', Shift says 'WHY ARE YOU YELLING?'."
  },
  BETRAYAL: {
    title: "MODE 6: BETRAYAL MODE",
    subtitle: "Loyalty is a lie.",
    desc: "Every 12 seconds, the mapping secretly scrambles mid-sentence."
  },
  BOSS: {
    title: "MODE 7: BOSS MODE",
    subtitle: "Abandon all hope, ye who type here.",
    desc: "Insane phrases, aggressive scrambles, zero sympathy."
  },
  WHAT_IF: {
    title: "EXPERIMENT MODE: WHAT IF?",
    subtitle: "Multiple simultaneous curses active.",
    desc: "Because a single disaster simply wasn't enough."
  }
};

const QWERTY_ROWS = [
  ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p'],
  ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
  ['z', 'x', 'c', 'v', 'b', 'n', 'm']
];

const SYMBOL_BASE_KEY_MAP = {
  '!': '1', '@': '2', '#': '3', '$': '4', '%': '5',
  '^': '6', '&': '7', '*': '8', '(': '9', ')': '0',
  '_': '-', '+': '=', '{': '[', '}': ']', ':': ';',
  '"': "'", '<': ',', '>': '.', '?': '/', '|': '\\',
  '~': '`'
};

export class MappingEngine {
  constructor(mode = CURSE_MODES.MIRROR) {
    this.mode = mode;
    this.mapping = {}; // char -> cursedChar
    this.reverseMapping = {}; // what physical key produces targetChar?
    this.activeCurseStack = [];
    this.generateMapping(mode);
  }

  setMode(mode) {
    this.mode = mode;
    this.generateMapping(mode);
  }

  generateMapping(mode = this.mode) {
    this.mapping = {};
    this.reverseMapping = {};
    this.activeCurseStack = [mode];

    switch (mode) {
      case CURSE_MODES.MIRROR:
        this.generateMirrorMapping();
        break;

      case CURSE_MODES.ALPHABET_CHAOS:
        this.generateChaosMapping();
        break;

      case CURSE_MODES.ONE_KEY_OFF:
        this.generateOneKeyOffMapping();
        break;

      case CURSE_MODES.REVERSE_EVERYTHING:
        // Standard mapping for characters, but typing engine reverses output insertion
        this.generateIdentityMapping();
        break;

      case CURSE_MODES.EMOTIONAL_KEYBOARD:
        this.generateEmotionalMapping();
        break;

      case CURSE_MODES.BETRAYAL:
        // Betrayal starts with Mirror or Chaos and switches dynamically
        this.generateChaosMapping();
        break;

      case CURSE_MODES.BOSS:
        // Boss combines Chaos and One-Key-Off
        this.generateOneKeyOffMapping();
        break;

      case CURSE_MODES.WHAT_IF: {
        // Pick 2 or 3 curses to combine
        const pool = [CURSE_MODES.MIRROR, CURSE_MODES.ALPHABET_CHAOS, CURSE_MODES.ONE_KEY_OFF, CURSE_MODES.EMOTIONAL_KEYBOARD];
        const shuffled = pool.sort(() => Math.random() - 0.5);
        this.activeCurseStack = [shuffled[0], shuffled[1]];
        if (Math.random() > 0.5) this.activeCurseStack.push(CURSE_MODES.BETRAYAL);
        this.generateChaosMapping();
        break;
      }

      default:
        this.generateMirrorMapping();
    }

    this.buildReverseMapping();
  }

  generateIdentityMapping() {
    const letters = 'abcdefghijklmnopqrstuvwxyz';
    for (const ch of letters) {
      this.mapping[ch] = ch;
    }
  }

  generateMirrorMapping() {
    // Reverse each row of QWERTY
    QWERTY_ROWS.forEach(row => {
      const len = row.length;
      for (let i = 0; i < len; i++) {
        this.mapping[row[i]] = row[len - 1 - i];
      }
    });

    // Mirror digits 1-0: 1->0, 2->9, etc.
    const digits = '1234567890';
    for (let i = 0; i < digits.length; i++) {
      this.mapping[digits[i]] = digits[digits.length - 1 - i];
    }
  }

  generateChaosMapping() {
    const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');
    let deranged = [...alphabet];

    // Ensure derangement (no letter maps to itself)
    let valid = false;
    let attempts = 0;
    while (!valid && attempts < 100) {
      attempts++;
      deranged.sort(() => Math.random() - 0.5);
      valid = alphabet.every((ch, i) => ch !== deranged[i]);
    }

    alphabet.forEach((ch, idx) => {
      this.mapping[ch] = deranged[idx];
    });

    // Also scramble numbers
    const nums = '1234567890'.split('').sort(() => Math.random() - 0.5);
    '1234567890'.split('').forEach((n, i) => {
      this.mapping[n] = nums[i];
    });
  }

  generateOneKeyOffMapping() {
    // Shift each key in the row by +1 (wrap around)
    QWERTY_ROWS.forEach(row => {
      for (let i = 0; i < row.length; i++) {
        const nextIdx = (i + 1) % row.length;
        this.mapping[row[i]] = row[nextIdx];
      }
    });

    const digits = '1234567890';
    for (let i = 0; i < digits.length; i++) {
      this.mapping[digits[i]] = digits[(i + 1) % digits.length];
    }
  }

  generateEmotionalMapping() {
    // Normal mirror or light shift, plus emotional intercepts
    this.generateMirrorMapping();
  }

  buildReverseMapping() {
    this.reverseMapping = {};
    for (const [physical, cursed] of Object.entries(this.mapping)) {
      this.reverseMapping[cursed] = physical;
    }
  }

  // Transform a physical key string to its cursed output
  transformKey(key) {
    if (key === ' ') return ' ';
    const lower = key.toLowerCase();
    const isUpper = key !== lower && key.toUpperCase() === key;

    if (this.mapping[lower]) {
      const cursed = this.mapping[lower];
      return isUpper ? cursed.toUpperCase() : cursed;
    }

    return key;
  }

  // Get physical key needed to produce a target character
  getPhysicalKeyFor(targetChar) {
    if (targetChar === ' ') return ' ';
    const lower = targetChar.toLowerCase();
    if (this.reverseMapping[lower]) return this.reverseMapping[lower];
    if (SYMBOL_BASE_KEY_MAP[targetChar]) return SYMBOL_BASE_KEY_MAP[targetChar];
    return lower;
  }

  // Check if emotional phrase should be spoken for key
  getEmotionalPhrase(key) {
    if (this.mode !== CURSE_MODES.EMOTIONAL_KEYBOARD && !this.activeCurseStack.includes(CURSE_MODES.EMOTIONAL_KEYBOARD)) {
      return null;
    }

    const emotionalMap = {
      ' ': 'NOPE',
      'Enter': 'ARE YOU SURE?',
      'Backspace': 'REGRET',
      'Shift': 'WHY ARE YOU YELLING?',
      'CapsLock': 'CALM DOWN',
      'Tab': 'ESCAPE IMPOSSIBLE',
      'Escape': 'NICE TRY'
    };

    return emotionalMap[key] || null;
  }

  // Trigger a live Betrayal scramble
  betray() {
    // Switch to a new random chaos mapping
    this.generateChaosMapping();
    this.buildReverseMapping();
    return {
      alert: "⚠️ KEYBOARD BETRAYAL DETECTED! Layout scrambled!"
    };
  }
}
