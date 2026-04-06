// Sideload Spanish — Background Service Worker
// Handles extension lifecycle and message routing between popup and content scripts.

chrome.runtime.onInstalled.addListener(() => {
  console.log('[Sideload] Extension installed.');
});

// Message router: forward messages between popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
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
    // Broadcast to all tabs
    chrome.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SETTINGS_CHANGED',
            settings: message.settings,
          }).catch(() => {
            // Tab may not have content script — ignore
          });
        }
      }
    });
    return false;
  }

  return false;
});
