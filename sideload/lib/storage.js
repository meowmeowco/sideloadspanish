// Sideload Spanish — Storage Client
// Proxies all storage operations to the service worker via chrome.runtime messages.
// The service worker owns the IndexedDB instance (extension origin),
// making data accessible from content scripts, popup, and background alike.

const SideloadStorage = (() => {
  /**
   * Send a storage request to the service worker and return the response.
   * @param {string} action
   * @param {Object} params
   * @returns {Promise<any>}
   */
  function request(action, params = {}) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'STORAGE', action, ...params }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (response && response.error) {
          reject(new Error(response.error));
          return;
        }
        resolve(response?.data);
      });
    });
  }

  return {
    open() { return Promise.resolve(); },
    getWordProgress(word) { return request('getWordProgress', { word }); },
    markKnown(word, tier) { return request('markKnown', { word, tier }); },
    recordSeen(word, tier) { return request('recordSeen', { word, tier }); },
    getProgress() { return request('getProgress'); },
    getKnownWords() { return request('getKnownWords').then((arr) => new Set(arr)); },
    getSetting(key, defaultValue) {
      return request('getSetting', { key }).then((val) => val !== undefined ? val : defaultValue);
    },
    setSetting(key, value) { return request('setSetting', { key, value }); },
    getSettings() { return request('getSettings'); },
    resetProgress() { return request('resetProgress'); },
  };
})();
