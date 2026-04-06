// Sideload Spanish — chrome.storage.local Storage
// Uses chrome.storage.local for cross-context data sharing
// (content scripts, popup, and service worker all see the same data).

const SideloadStorage = (() => {
  const WORDS_KEY = 'sideload_words';     // { [en]: { en, tier, seen, clicked_known, known } }
  const SETTINGS_KEY = 'sideload_settings'; // { [key]: value }

  /**
   * Read a top-level key from chrome.storage.local.
   * @param {string} key
   * @param {any} defaultValue
   * @returns {Promise<any>}
   */
  function read(key, defaultValue) {
    return new Promise((resolve) => {
      chrome.storage.local.get(key, (result) => {
        resolve(result[key] !== undefined ? result[key] : defaultValue);
      });
    });
  }

  /**
   * Write a top-level key to chrome.storage.local.
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  function write(key, value) {
    return new Promise((resolve) => {
      chrome.storage.local.set({ [key]: value }, resolve);
    });
  }

  /**
   * Open / init — no-op for chrome.storage, kept for API compat.
   * @returns {Promise<void>}
   */
  function open() {
    return Promise.resolve();
  }

  /**
   * Get progress for a single word.
   * @param {string} word - English word
   * @returns {Promise<Object|undefined>}
   */
  async function getWordProgress(word) {
    const words = await read(WORDS_KEY, {});
    return words[word.toLowerCase()];
  }

  /**
   * Mark a word as known (increment clicked_known, set known flag).
   * @param {string} word - English word
   * @param {number} tier - Word tier
   * @returns {Promise<void>}
   */
  async function markKnown(word, tier) {
    const key = word.toLowerCase();
    const words = await read(WORDS_KEY, {});
    const existing = words[key] || { en: key, tier, seen: 0, clicked_known: 0, known: false };

    words[key] = {
      ...existing,
      clicked_known: existing.clicked_known + 1,
      known: true,
    };

    await write(WORDS_KEY, words);
  }

  /**
   * Record that a word was seen (displayed on page).
   * @param {string} word - English word
   * @param {number} tier - Word tier
   * @returns {Promise<void>}
   */
  async function recordSeen(word, tier) {
    const key = word.toLowerCase();
    const words = await read(WORDS_KEY, {});
    const existing = words[key] || { en: key, tier, seen: 0, clicked_known: 0, known: false };

    words[key] = {
      ...existing,
      seen: existing.seen + 1,
    };

    await write(WORDS_KEY, words);
  }

  /**
   * Get aggregate progress: total words, known words, per-tier breakdown.
   * @returns {Promise<{total: number, known: number, tiers: Object}>}
   */
  async function getProgress() {
    const words = await read(WORDS_KEY, {});
    const tiers = {};
    let total = 0;
    let known = 0;

    for (const record of Object.values(words)) {
      total++;
      if (record.known) known++;

      if (!tiers[record.tier]) {
        tiers[record.tier] = { total: 0, known: 0 };
      }
      tiers[record.tier].total++;
      if (record.known) tiers[record.tier].known++;
    }

    return { total, known, tiers };
  }

  /**
   * Get set of all known word keys.
   * @returns {Promise<Set<string>>}
   */
  async function getKnownWords() {
    const words = await read(WORDS_KEY, {});
    const known = new Set();
    for (const record of Object.values(words)) {
      if (record.known) known.add(record.en);
    }
    return known;
  }

  /**
   * Get a setting value.
   * @param {string} key
   * @param {any} defaultValue
   * @returns {Promise<any>}
   */
  async function getSetting(key, defaultValue) {
    const settings = await read(SETTINGS_KEY, {});
    return settings[key] !== undefined ? settings[key] : defaultValue;
  }

  /**
   * Set a setting value.
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  async function setSetting(key, value) {
    const settings = await read(SETTINGS_KEY, {});
    settings[key] = value;
    await write(SETTINGS_KEY, settings);
  }

  /**
   * Get all settings as a flat object.
   * @returns {Promise<Object>}
   */
  async function getSettings() {
    return read(SETTINGS_KEY, {});
  }

  /**
   * Reset all progress (clear words data).
   * @returns {Promise<void>}
   */
  async function resetProgress() {
    await write(WORDS_KEY, {});
  }

  return {
    open,
    getWordProgress,
    markKnown,
    recordSeen,
    getProgress,
    getKnownWords,
    getSetting,
    setSetting,
    getSettings,
    resetProgress,
  };
})();
