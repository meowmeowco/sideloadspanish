// Sideload Spanish — Background Service Worker
// Owns the IndexedDB instance and handles storage requests from
// content scripts and popup via message passing.

// ── IndexedDB ──

const DB_NAME = 'sideload-spanish';
const DB_VERSION = 1;
const WORDS_STORE = 'words';
const SETTINGS_STORE = 'settings';

let _db = null;

function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(WORDS_STORE)) {
        const store = db.createObjectStore(WORDS_STORE, { keyPath: 'en' });
        store.createIndex('tier', 'tier', { unique: false });
        store.createIndex('known', 'known', { unique: false });
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => { _db = e.target.result; resolve(_db); };
    req.onerror = (e) => reject(new Error(`IndexedDB: ${e.target.error}`));
  });
}

function tx(storeName, mode, op) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const store = t.objectStore(storeName);
    const req = op(store);

    if (req) {
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    } else {
      t.oncomplete = () => resolve();
      t.onerror = () => reject(t.error);
    }
  }));
}

// ── Storage operations ──

const StorageOps = {
  async getWordProgress({ word }) {
    return tx(WORDS_STORE, 'readonly', (s) => s.get(word.toLowerCase()));
  },

  async markKnown({ word, tier }) {
    const key = word.toLowerCase();
    const existing = await tx(WORDS_STORE, 'readonly', (s) => s.get(key));
    const record = existing || { en: key, tier, seen: 0, clicked_known: 0, known: false };
    const updated = { ...record, clicked_known: record.clicked_known + 1, known: true };
    await tx(WORDS_STORE, 'readwrite', (s) => s.put(updated));
  },

  async recordSeen({ word, tier }) {
    const key = word.toLowerCase();
    const existing = await tx(WORDS_STORE, 'readonly', (s) => s.get(key));
    const record = existing || { en: key, tier, seen: 0, clicked_known: 0, known: false };
    const updated = { ...record, seen: record.seen + 1 };
    await tx(WORDS_STORE, 'readwrite', (s) => s.put(updated));
  },

  async getProgress() {
    const records = await tx(WORDS_STORE, 'readonly', (s) => s.getAll());
    const tiers = {};
    let total = 0;
    let known = 0;

    for (const r of records || []) {
      total++;
      if (r.known) known++;
      if (!tiers[r.tier]) tiers[r.tier] = { total: 0, known: 0 };
      tiers[r.tier].total++;
      if (r.known) tiers[r.tier].known++;
    }

    return { total, known, tiers };
  },

  async getKnownWords() {
    const records = await tx(WORDS_STORE, 'readonly', (s) => s.getAll());
    // Return as array — client converts to Set
    return (records || []).filter((r) => r.known).map((r) => r.en);
  },

  async getSetting({ key }) {
    const record = await tx(SETTINGS_STORE, 'readonly', (s) => s.get(key));
    return record ? record.value : undefined;
  },

  async setSetting({ key, value }) {
    await tx(SETTINGS_STORE, 'readwrite', (s) => s.put({ key, value }));
  },

  async getSettings() {
    const records = await tx(SETTINGS_STORE, 'readonly', (s) => s.getAll());
    const settings = {};
    for (const r of records || []) settings[r.key] = r.value;
    return settings;
  },

  async resetProgress() {
    await tx(WORDS_STORE, 'readwrite', (s) => s.clear());
  },
};

// ── Message routing ──

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Sideload] Extension installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Storage requests
  if (message.type === 'STORAGE') {
    const { action, ...params } = message;
    const op = StorageOps[action];

    if (!op) {
      sendResponse({ error: `Unknown storage action: ${action}` });
      return false;
    }

    op(params)
      .then((data) => sendResponse({ data }))
      .catch((err) => sendResponse({ error: err.message }));

    return true; // Keep message channel open for async response
  }

  // Tab management
  if (message.type === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab?.id ?? null });
    return false;
  }

  if (message.type === 'TOGGLE_TAB') {
    const { tabId, enabled } = message;
    chrome.tabs.sendMessage(tabId, { type: 'SET_ENABLED', enabled });
    return false;
  }

  if (message.type === 'SETTINGS_CHANGED') {
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_CHANGED',
            settings: message.settings,
          }).catch(() => {});
        }
      }
    });
    return false;
  }

  return false;
});
