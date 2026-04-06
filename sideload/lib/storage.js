// Sideload Spanish — IndexedDB Storage
// Manages per-word progress and extension settings.

const SideloadStorage = (() => {
  const DB_NAME = 'sideload-spanish';
  const DB_VERSION = 1;
  const WORDS_STORE = 'words';
  const SETTINGS_STORE = 'settings';

  let _db = null;

  /**
   * Open (or create) the IndexedDB database.
   * @returns {Promise<IDBDatabase>}
   */
  function open() {
    if (_db) return Promise.resolve(_db);

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        if (!db.objectStoreNames.contains(WORDS_STORE)) {
          const wordsStore = db.createObjectStore(WORDS_STORE, { keyPath: 'en' });
          wordsStore.createIndex('tier', 'tier', { unique: false });
          wordsStore.createIndex('known', 'known', { unique: false });
        }

        if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
          db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        }
      };

      request.onsuccess = (event) => {
        _db = event.target.result;
        resolve(_db);
      };

      request.onerror = (event) => {
        reject(new Error(`IndexedDB error: ${event.target.error}`));
      };
    });
  }

  /**
   * Run a transaction and return a promise.
   * @param {string} storeName
   * @param {'readonly'|'readwrite'} mode
   * @param {(store: IDBObjectStore) => IDBRequest} operation
   * @returns {Promise<any>}
   */
  function tx(storeName, mode, operation) {
    return open().then((db) => {
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, mode);
        const store = transaction.objectStore(storeName);
        const request = operation(store);

        if (request) {
          request.onsuccess = () => resolve(request.result);
          request.onerror = () => reject(request.error);
        } else {
          transaction.oncomplete = () => resolve();
          transaction.onerror = () => reject(transaction.error);
        }
      });
    });
  }

  /**
   * Get progress for a single word.
   * @param {string} word - English word
   * @returns {Promise<{en: string, tier: number, seen: number, clicked_known: number, known: boolean}|undefined>}
   */
  function getWordProgress(word) {
    return tx(WORDS_STORE, 'readonly', (store) => store.get(word.toLowerCase()));
  }

  /**
   * Mark a word as known (increment clicked_known, set known flag).
   * @param {string} word - English word
   * @param {number} tier - Word tier
   * @returns {Promise<void>}
   */
  function markKnown(word, tier) {
    const key = word.toLowerCase();
    return getWordProgress(key).then((existing) => {
      const record = existing || { en: key, tier, seen: 0, clicked_known: 0, known: false };
      const updated = {
        ...record,
        clicked_known: record.clicked_known + 1,
        known: true,
      };
      return tx(WORDS_STORE, 'readwrite', (store) => store.put(updated));
    });
  }

  /**
   * Record that a word was seen (displayed on page).
   * @param {string} word - English word
   * @param {number} tier - Word tier
   * @returns {Promise<void>}
   */
  function recordSeen(word, tier) {
    const key = word.toLowerCase();
    return getWordProgress(key).then((existing) => {
      const record = existing || { en: key, tier, seen: 0, clicked_known: 0, known: false };
      const updated = {
        ...record,
        seen: record.seen + 1,
      };
      return tx(WORDS_STORE, 'readwrite', (store) => store.put(updated));
    });
  }

  /**
   * Get aggregate progress: total words, known words, per-tier breakdown.
   * @returns {Promise<{total: number, known: number, tiers: Object}>}
   */
  function getProgress() {
    return tx(WORDS_STORE, 'readonly', (store) => store.getAll()).then((records) => {
      const tiers = {};
      let total = 0;
      let known = 0;

      for (const record of records || []) {
        total++;
        if (record.known) known++;

        if (!tiers[record.tier]) {
          tiers[record.tier] = { total: 0, known: 0 };
        }
        tiers[record.tier].total++;
        if (record.known) tiers[record.tier].known++;
      }

      return { total, known, tiers };
    });
  }

  /**
   * Get a setting value.
   * @param {string} key
   * @param {any} defaultValue
   * @returns {Promise<any>}
   */
  function getSetting(key, defaultValue) {
    return tx(SETTINGS_STORE, 'readonly', (store) => store.get(key)).then(
      (record) => (record ? record.value : defaultValue)
    );
  }

  /**
   * Set a setting value.
   * @param {string} key
   * @param {any} value
   * @returns {Promise<void>}
   */
  function setSetting(key, value) {
    return tx(SETTINGS_STORE, 'readwrite', (store) => store.put({ key, value }));
  }

  /**
   * Get all settings as a flat object.
   * @returns {Promise<Object>}
   */
  function getSettings() {
    return tx(SETTINGS_STORE, 'readonly', (store) => store.getAll()).then((records) => {
      const settings = {};
      for (const record of records || []) {
        settings[record.key] = record.value;
      }
      return settings;
    });
  }

  /**
   * Reset all progress (clear words store).
   * @returns {Promise<void>}
   */
  function resetProgress() {
    return tx(WORDS_STORE, 'readwrite', (store) => store.clear());
  }

  return {
    open,
    getWordProgress,
    markKnown,
    recordSeen,
    getProgress,
    getSetting,
    setSetting,
    getSettings,
    resetProgress,
  };
})();
