// Sideload Spanish — Content Script: Word Replacer
// Walks DOM text nodes, replaces English words with Spanish translations.
// Integrates with SideloadTiers for difficulty progression and density scaling.

(() => {
  // Elements whose text content should never be touched
  const EXCLUDED_TAGS = new Set([
    'CODE', 'PRE', 'SCRIPT', 'STYLE', 'INPUT', 'TEXTAREA', 'SELECT', 'OPTION',
    'NOSCRIPT', 'SVG', 'MATH', 'KBD', 'SAMP', 'VAR',
  ]);

  // Matches a standalone word (letters, hyphens, apostrophes)
  const WORD_RE = /\b([a-zA-Z][a-zA-Z'-]*[a-zA-Z]|[a-zA-Z])\b/g;

  // Simple proper noun heuristic: word starts with uppercase and is not at sentence start
  const LOOKS_LIKE_PROPER_NOUN = /^[A-Z][a-z]/;

  // URL / email patterns to skip
  const URL_RE = /https?:\/\/\S+/gi;
  const EMAIL_RE = /\S+@\S+\.\S+/gi;

  let vocabMap = null;       // Map<lowercase_en, { es, tier }> — filtered by unlocked tiers
  let fullVocab = [];        // Raw vocabulary array (all tiers)
  let wordsPerTier = {};     // tier → total word count
  let knownWords = new Set(); // Words marked as known in IndexedDB
  let currentDensity = 0.05; // Default tier-1 density
  let enabled = true;

  /**
   * Load vocabulary JSON and initialize tier-aware state.
   */
  async function loadVocabulary() {
    try {
      const url = chrome.runtime.getURL('data/vocabulary.json');
      const response = await fetch(url);
      fullVocab = await response.json();

      wordsPerTier = SideloadTiers.countWordsPerTier(fullVocab);
      console.log(`[Sideload] Vocabulary loaded: ${fullVocab.length} words across ${Object.keys(wordsPerTier).length} tiers`);
    } catch (err) {
      console.error('[Sideload] Failed to load vocabulary:', err);
      fullVocab = [];
      wordsPerTier = {};
    }
  }

  /**
   * Rebuild the vocabMap based on current progress and unlocked tiers.
   */
  async function rebuildVocabMap() {
    let progress = { total: 0, known: 0, tiers: {} };
    let densityOverride = null;

    try {
      progress = await SideloadStorage.getProgress();
      densityOverride = await SideloadStorage.getSetting('densityOverride', null);
      knownWords = await SideloadStorage.getKnownWords();
    } catch (err) {
      // Storage not ready — use defaults
    }

    const unlockedTiers = SideloadTiers.getUnlockedTiers(progress, wordsPerTier);
    currentDensity = SideloadTiers.getDensity(unlockedTiers, densityOverride);

    const filtered = SideloadTiers.filterByUnlockedTiers(fullVocab, unlockedTiers);

    vocabMap = new Map();
    for (const entry of filtered) {
      vocabMap.set(entry.en.toLowerCase(), { es: entry.es, tier: entry.tier });
    }

    const maxTier = Math.max(...unlockedTiers);
    console.log(`[Sideload] Active: ${vocabMap.size} words, tier ${maxTier} unlocked, density ${(currentDensity * 100).toFixed(0)}%`);
  }

  /**
   * Check if a node is inside an excluded element.
   */
  function isExcluded(node) {
    let current = node.parentElement;
    while (current) {
      if (EXCLUDED_TAGS.has(current.tagName)) return true;
      if (current.classList?.contains('sideload-word')) return true;
      if (current.isContentEditable) return true;
      current = current.parentElement;
    }
    return false;
  }

  /**
   * Check if a word looks like a proper noun based on its position in text.
   */
  function isProbablyProperNoun(word, fullText, matchIndex) {
    if (!LOOKS_LIKE_PROPER_NOUN.test(word)) return false;

    const before = fullText.slice(0, matchIndex).trimEnd();
    if (before.length === 0) return false;

    const lastChar = before[before.length - 1];
    if ('.!?'.includes(lastChar)) return false;

    return true;
  }

  /**
   * Collect all text nodes under a root element.
   */
  function collectTextNodes(root) {
    const nodes = [];
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
      acceptNode(node) {
        if (!node.textContent.trim()) return NodeFilter.FILTER_REJECT;
        if (isExcluded(node)) return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      },
    });

    let node;
    while ((node = walker.nextNode())) {
      nodes.push(node);
    }
    return nodes;
  }

  /**
   * Find all potential word matches in a text node.
   * Returns array of { word, wordLower, entry, index, length }.
   */
  function findMatches(text) {
    const matches = [];
    WORD_RE.lastIndex = 0;
    let match;

    while ((match = WORD_RE.exec(text)) !== null) {
      const word = match[1];
      const wordLower = word.toLowerCase();
      const entry = vocabMap.get(wordLower);

      if (!entry) continue;
      if (isProbablyProperNoun(word, text, match.index)) continue;

      matches.push({
        word,
        wordLower,
        entry,
        index: match.index,
        length: match[0].length,
      });
    }

    return matches;
  }

  /**
   * Build a replacement fragment for a single text node.
   * Applies density sampling to limit how many words get replaced.
   * Returns null if no replacements were made.
   */
  function buildReplacementFragment(textNode) {
    const text = textNode.textContent;

    // Skip text that looks like URLs or emails
    if (URL_RE.test(text) || EMAIL_RE.test(text)) return null;
    URL_RE.lastIndex = 0;
    EMAIL_RE.lastIndex = 0;

    // Find all potential matches
    const allMatches = findMatches(text);
    if (allMatches.length === 0) return null;

    // Apply density sampling
    const selectedMatches = SideloadTiers.applyDensity(allMatches, currentDensity);
    if (selectedMatches.length === 0) return null;

    // Sort by index so we process left-to-right
    selectedMatches.sort((a, b) => a.index - b.index);

    // Build fragment
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;

    for (const m of selectedMatches) {
      // Add text before this match
      if (m.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, m.index)));
      }

      // Create replacement span
      const span = document.createElement('span');
      const isKnown = knownWords.has(m.wordLower);
      span.className = isKnown ? 'sideload-word sideload-word--known' : 'sideload-word';
      span.dataset.original = m.word;
      span.dataset.tier = m.entry.tier;
      span.dataset.es = m.entry.es;
      span.textContent = m.entry.es;

      fragment.appendChild(span);
      lastIndex = m.index + m.length;
    }

    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }

    return fragment;
  }

  /**
   * Run replacement on all text nodes under a root.
   */
  function replaceWords(root = document.body) {
    if (!vocabMap || vocabMap.size === 0 || !enabled) return;

    const textNodes = collectTextNodes(root);

    // Batch: compute all replacements first, then apply
    const replacements = [];
    for (const node of textNodes) {
      const fragment = buildReplacementFragment(node);
      if (fragment) {
        replacements.push({ node, fragment });
      }
    }

    // Apply all at once
    for (const { node, fragment } of replacements) {
      node.parentNode.replaceChild(fragment, node);
    }

    if (replacements.length > 0) {
      console.log(`[Sideload] Replaced words in ${replacements.length} text nodes`);
    }
  }

  /**
   * Initialize: load vocab, compute tiers, run replacement.
   */
  async function init() {
    await loadVocabulary();
    await rebuildVocabMap();

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => replaceWords());
    } else {
      setTimeout(() => replaceWords(), 0);
    }
  }

  // Listen for messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SET_ENABLED') {
      enabled = message.enabled;
      if (enabled) replaceWords();
    }

    if (message.type === 'SETTINGS_CHANGED') {
      // Rebuild vocab map with new settings, then re-run
      rebuildVocabMap().then(() => {
        // Note: already-replaced words stay; new density applies to future replacements
      });
    }
  });

  init();
})();
