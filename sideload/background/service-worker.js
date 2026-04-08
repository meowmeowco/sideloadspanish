// Sideload Spanish — Background Service Worker (CQRS)
//
// Commands (write): mutate word records in IndexedDB, then update read projections.
// Queries (read): return pre-computed projections — no table scans.
//
// Projections (in-memory, rebuilt from IDB on service worker wake):
//   _progress  — { total, known, tiers: { [tier]: { total, known } } }
//   _knownSet  — Set<string> of known word keys
//
// The projections are the single source of truth for all read operations.
// They are rebuilt on startup and kept in sync by every command.

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
      }
      if (!db.objectStoreNames.contains(SETTINGS_STORE)) {
        db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };

    req.onsuccess = (e) => {
      _db = e.target.result;
      _db.onclose = () => { _db = null; };
      resolve(_db);
    };
    req.onerror = (e) => reject(new Error(`IndexedDB: ${e.target.error}`));
  });
}

function tx(storeName, mode, op) {
  return openDB().then((db) => new Promise((resolve, reject) => {
    try {
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
    } catch (err) {
      _db = null;
      openDB().then((db2) => {
        const t = db2.transaction(storeName, mode);
        const store = t.objectStore(storeName);
        const req = op(store);
        if (req) {
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        } else {
          t.oncomplete = () => resolve();
          t.onerror = () => reject(t.error);
        }
      }).catch(reject);
    }
  }));
}

// ── Read projections (in-memory) ──

let _progress = { total: 0, known: 0, tiers: {} };
let _knownSet = new Set();
let _projectionsReady = null; // Promise that resolves when projections are built

/**
 * Rebuild projections from IndexedDB. Called once on service worker wake.
 */
function rebuildProjections() {
  _projectionsReady = (async () => {
    const records = await tx(WORDS_STORE, 'readonly', (s) => s.getAll());

    const tiers = {};
    let total = 0;
    let known = 0;
    const knownSet = new Set();

    for (const r of records || []) {
      total++;
      if (r.known) {
        known++;
        knownSet.add(r.en);
      }
      if (!tiers[r.tier]) tiers[r.tier] = { total: 0, known: 0 };
      tiers[r.tier].total++;
      if (r.known) tiers[r.tier].known++;
    }

    _progress = { total, known, tiers };
    _knownSet = knownSet;

    console.log(`[Sideload SW] Projections built: ${known} known / ${total} tracked`);
  })();

  return _projectionsReady;
}

/**
 * Ensure projections are ready before any operation.
 */
function ensureProjections() {
  return _projectionsReady || rebuildProjections();
}

// ── Commands (write) ──

const Commands = {
  async markKnown({ word, tier }) {
    await ensureProjections();
    const key = word.toLowerCase();

    // Write to IDB
    const existing = await tx(WORDS_STORE, 'readonly', (s) => s.get(key));
    const record = existing || { en: key, tier, seen: 0, clicked_known: 0, known: false };
    const wasKnown = record.known;
    const updated = { ...record, clicked_known: record.clicked_known + 1, known: true };
    await tx(WORDS_STORE, 'readwrite', (s) => s.put(updated));

    // Update projections
    if (!existing) {
      _progress.total++;
      if (!_progress.tiers[tier]) _progress.tiers[tier] = { total: 0, known: 0 };
      _progress.tiers[tier].total++;
    }
    if (!wasKnown) {
      _progress.known++;
      _progress.tiers[tier].known++;
      _knownSet.add(key);
    }
  },

  async recordSeen({ word, tier }) {
    await ensureProjections();
    const key = word.toLowerCase();

    const existing = await tx(WORDS_STORE, 'readonly', (s) => s.get(key));
    const record = existing || { en: key, tier, seen: 0, clicked_known: 0, known: false };
    const updated = { ...record, seen: record.seen + 1 };
    await tx(WORDS_STORE, 'readwrite', (s) => s.put(updated));

    // Update projections if new word
    if (!existing) {
      _progress.total++;
      if (!_progress.tiers[tier]) _progress.tiers[tier] = { total: 0, known: 0 };
      _progress.tiers[tier].total++;
    }
  },

  async setSetting({ key, value }) {
    await tx(SETTINGS_STORE, 'readwrite', (s) => s.put({ key, value }));
  },

  async resetProgress() {
    await tx(WORDS_STORE, 'readwrite', (s) => s.clear());
    // Reset projections
    _progress = { total: 0, known: 0, tiers: {} };
    _knownSet = new Set();
  },
};

// ── Queries (read) — projections only, no IDB access ──

const Queries = {
  async getWordProgress({ word }) {
    // Single-record lookup still hits IDB (not worth projecting every word)
    return tx(WORDS_STORE, 'readonly', (s) => s.get(word.toLowerCase()));
  },

  async getProgress() {
    await ensureProjections();
    // Return a copy so callers can't mutate the projection
    return {
      total: _progress.total,
      known: _progress.known,
      tiers: Object.fromEntries(
        Object.entries(_progress.tiers).map(([t, v]) => [t, { ...v }])
      ),
    };
  },

  async getKnownWords() {
    await ensureProjections();
    return [..._knownSet];
  },

  async getSetting({ key }) {
    const record = await tx(SETTINGS_STORE, 'readonly', (s) => s.get(key));
    return record ? record.value : undefined;
  },

  async getSettings() {
    const records = await tx(SETTINGS_STORE, 'readonly', (s) => s.getAll());
    const settings = {};
    for (const r of records || []) settings[r.key] = r.value;
    return settings;
  },

  async getStrugglingWords({ threshold }) {
    const t = threshold || 10;
    const all = await tx(WORDS_STORE, 'readonly', (s) => s.getAll());
    return (all || [])
      .filter((r) => r.seen >= t && !r.known)
      .sort((a, b) => b.seen - a.seen);
  },
};

// ── Unified dispatch ──

const Dispatch = { ...Queries, ...Commands };

// ── Bootstrap projections on wake ──

rebuildProjections();

// ── Message routing ──

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Sideload] Extension installed.');
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'STORAGE') {
    const { action, ...params } = message;
    const op = Dispatch[action];

    (async () => {
      try {
        if (!op) throw new Error(`Unknown action: ${action}`);
        const data = await op(params);
        sendResponse({ data });
      } catch (err) {
        console.error(`[Sideload SW] ${action} error:`, err);
        sendResponse({ error: err.message });
      }
    })();

    return true;
  }

  if (message.type === 'GET_TAB_ID') {
    sendResponse({ tabId: sender.tab?.id ?? null });
    return false;
  }

  if (message.type === 'TOGGLE_TAB') {
    chrome.tabs.sendMessage(message.tabId, { type: 'SET_ENABLED', enabled: message.enabled });
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
