// Sideload Spanish — Popup Dashboard + Settings

document.addEventListener('DOMContentLoaded', async () => {
  const TIER_LABELS = { 1: 'A1', 2: 'A2', 3: 'B1', 4: 'B2', 5: 'C1' };
  const TIER_NAMES = {
    1: 'A1 — Beginner',
    2: 'A2 — Elementary',
    3: 'B1 — Intermediate',
    4: 'B2 — Upper Intermediate',
    5: 'C1 — Advanced',
  };

  // ── Elements ──
  const globalToggle = document.getElementById('globalToggle');
  const currentTierEl = document.getElementById('currentTier');
  const wordsKnownEl = document.getElementById('wordsKnown');
  const tierProgressEl = document.getElementById('tierProgress');
  const tierHintEl = document.getElementById('tierHint');
  const tierBarsEl = document.getElementById('tierBars');
  const densitySlider = document.getElementById('densitySlider');
  const densityValueEl = document.getElementById('densityValue');
  const blacklistInput = document.getElementById('blacklistInput');
  const saveBlacklistBtn = document.getElementById('saveBlacklist');
  const resetProgressBtn = document.getElementById('resetProgress');
  const strugglingSection = document.getElementById('strugglingSection');
  const strugglingHint = document.getElementById('strugglingHint');
  const strugglingList = document.getElementById('strugglingList');

  // ── Load vocabulary for tier totals + struggling word lookups ──
  let vocabTierTotals = {};
  try {
    const url = chrome.runtime.getURL('data/vocabulary.json');
    const response = await fetch(url);
    fullVocab = await response.json();
    vocabTierTotals = SideloadTiers.countWordsPerTier(fullVocab);
  } catch (err) {
    console.error('[Sideload Popup] Failed to load vocabulary:', err);
  }

  // ── Render progress ──
  async function renderProgress() {
    let progress;
    try {
      progress = await SideloadStorage.getProgress();
      console.log('[Sideload Popup] Progress from service worker:', JSON.stringify(progress));
    } catch (err) {
      console.error('[Sideload Popup] Failed to get progress:', err);
      progress = { total: 0, known: 0, tiers: {} };
    }
    const unlockedTiers = SideloadTiers.getUnlockedTiers(progress, vocabTierTotals);
    const maxTier = Math.max(...unlockedTiers);

    // Current tier display
    currentTierEl.textContent = TIER_NAMES[maxTier] || 'A1';

    // Words known
    const totalVocab = Object.values(vocabTierTotals).reduce((a, b) => a + b, 0);
    wordsKnownEl.textContent = `${progress.known} / ${totalVocab}`;

    // Tier progress bar (progress within current max tier)
    const tierTotal = vocabTierTotals[maxTier] || 1;
    const tierKnown = progress.tiers[maxTier]?.known || 0;
    const tierPct = Math.round((tierKnown / tierTotal) * 100);
    tierProgressEl.style.width = `${tierPct}%`;

    if (maxTier < 5) {
      const remaining = Math.ceil(tierTotal * SideloadTiers.UNLOCK_THRESHOLD) - tierKnown;
      tierHintEl.textContent = remaining > 0
        ? `${remaining} more to unlock ${TIER_LABELS[maxTier + 1]}`
        : `${TIER_LABELS[maxTier + 1]} unlocked!`;
    } else {
      tierHintEl.textContent = tierPct >= 80 ? 'Master level!' : 'Keep going!';
    }

    // Tier breakdown bars with readiness indicators
    let strugglingWords = [];
    try {
      strugglingWords = await SideloadStorage.getStrugglingWords() || [];
    } catch (_) { /* ignore */ }

    tierBarsEl.innerHTML = '';
    for (let t = 1; t <= 5; t++) {
      const total = vocabTierTotals[t] || 0;
      const known = progress.tiers[t]?.known || 0;
      const pct = total > 0 ? Math.round((known / total) * 100) : 0;
      const isLocked = !unlockedTiers.has(t);
      const readiness = SideloadTiers.getTierReadiness(t, progress, vocabTierTotals, strugglingWords);

      const readinessIcon = {
        green: '🟢',
        yellow: '🟡',
        grey: '⚪',
        locked: '🔒',
      }[readiness] || '';

      const readinessTitle = {
        green: 'Ready to advance',
        yellow: '5+ struggling words — consider reviewing',
        grey: `Below ${Math.round(SideloadTiers.UNLOCK_THRESHOLD * 100)}% known`,
        locked: 'Locked',
      }[readiness] || '';

      const row = document.createElement('div');
      row.className = `tier-row${isLocked ? ' tier-row--locked' : ''}`;

      row.innerHTML = `
        <span class="tier-row__label">${TIER_LABELS[t]}</span>
        <div class="tier-row__bar">
          <div class="tier-row__fill tier-row__fill--${t}" style="width: ${pct}%"></div>
        </div>
        <span class="tier-row__count">${known}/${total}</span>
        <span class="tier-row__readiness" title="${readinessTitle}">${readinessIcon}</span>
      `;

      tierBarsEl.appendChild(row);
    }
  }

  // ── Render struggling words ──
  async function renderStruggling() {
    try {
      const words = await SideloadStorage.getStrugglingWords();
      if (!words || words.length === 0) {
        strugglingSection.style.display = 'none';
        return;
      }

      strugglingSection.style.display = '';
      strugglingHint.textContent = `${words.length} word${words.length > 1 ? 's' : ''} seen 10+ times without marking known`;
      strugglingList.innerHTML = '';

      // Find most seen word for header stat
      const topWord = words[0];
      if (topWord) {
        const vocabEntry = fullVocab.find((v) => v.en.toLowerCase() === topWord.en);
        const es = vocabEntry ? vocabEntry.es : topWord.en;
        strugglingHint.textContent += ` — most seen: "${es}" (${topWord.seen}x)`;
      }

      // Show up to 20 words
      const capped = words.slice(0, 20);
      for (const word of capped) {
        const vocabEntry = fullVocab.find((v) => v.en.toLowerCase() === word.en);
        const es = vocabEntry ? vocabEntry.es : '?';

        const row = document.createElement('div');
        row.className = 'struggling-row';
        row.innerHTML = `
          <span class="struggling-row__word">${es}</span>
          <span class="struggling-row__original">${word.en}</span>
          <span class="struggling-row__seen">${word.seen}x</span>
          <button class="struggling-row__know btn btn--tiny">Know it</button>
        `;

        // Click "Know it" → mark known
        const btn = row.querySelector('.struggling-row__know');
        btn.addEventListener('click', async () => {
          await SideloadStorage.markKnown(word.en, word.tier || 1);
          btn.textContent = '✓';
          btn.disabled = true;
          row.classList.add('struggling-row--known');
        });

        strugglingList.appendChild(row);
      }
    } catch (err) {
      console.error('[Sideload Popup] Failed to load struggling words:', err);
    }
  }

  // ── Load settings ──
  async function loadSettings() {
    const enabled = await SideloadStorage.getSetting('enabled', true);
    globalToggle.checked = enabled;

    const densityOverride = await SideloadStorage.getSetting('densityOverride', null);
    if (densityOverride !== null) {
      const sliderVal = Math.round(densityOverride * 100);
      densitySlider.value = sliderVal;
      densityValueEl.textContent = `${sliderVal}%`;
    } else {
      densitySlider.value = 0;
      densityValueEl.textContent = 'Auto';
    }

    const blacklist = await SideloadStorage.getSetting('blacklist', '');
    blacklistInput.value = blacklist;
  }

  // ── Broadcast settings change to all tabs ──
  function broadcastSettings() {
    chrome.runtime.sendMessage({ type: 'SETTINGS_CHANGED', settings: {} });
  }

  // ── Event handlers ──

  globalToggle.addEventListener('change', async () => {
    const enabled = globalToggle.checked;
    await SideloadStorage.setSetting('enabled', enabled);

    // Toggle all tabs
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id) {
        chrome.tabs.sendMessage(tab.id, { type: 'SET_ENABLED', enabled }).catch(() => {});
      }
    }
  });

  densitySlider.addEventListener('input', () => {
    const val = parseInt(densitySlider.value, 10);
    densityValueEl.textContent = val === 0 ? 'Auto' : `${val}%`;
  });

  densitySlider.addEventListener('change', async () => {
    const val = parseInt(densitySlider.value, 10);
    const override = val === 0 ? null : val / 100;
    await SideloadStorage.setSetting('densityOverride', override);
    broadcastSettings();
  });

  saveBlacklistBtn.addEventListener('click', async () => {
    const value = blacklistInput.value.trim();
    await SideloadStorage.setSetting('blacklist', value);
    saveBlacklistBtn.textContent = 'Saved!';
    setTimeout(() => { saveBlacklistBtn.textContent = 'Save'; }, 1500);
    broadcastSettings();
  });

  resetProgressBtn.addEventListener('click', async () => {
    if (!confirm('Reset all progress? This cannot be undone.')) return;
    await SideloadStorage.resetProgress();
    await renderProgress();
    broadcastSettings();
  });

  // ── Init ──
  await SideloadStorage.open();
  await renderProgress();
  await renderStruggling();
  await loadSettings();
});
