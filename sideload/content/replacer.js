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

  // English articles that trigger compound replacement
  const ARTICLES = new Set(['the', 'a', 'an']);

  let vocabMap = null;       // Map<lowercase_en, { es, tier, gender }> — filtered by unlocked tiers
  let fullVocab = [];        // Raw vocabulary array (all tiers)
  let wordsPerTier = {};     // tier → total word count
  let knownWords = new Set(); // Words marked as known in IndexedDB
  let strugglingWords = new Set(); // Words seen 10+ times without marking known
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
      const strugglingList = await SideloadStorage.getStrugglingWords();
      strugglingWords = new Set(strugglingList.map((r) => r.en));
    } catch (err) {
      // Storage not ready — use defaults
    }

    const unlockedTiers = SideloadTiers.getUnlockedTiers(progress, wordsPerTier);
    currentDensity = SideloadTiers.getDensity(unlockedTiers, densityOverride);

    const filtered = SideloadTiers.filterByUnlockedTiers(fullVocab, unlockedTiers);

    vocabMap = new Map();
    for (const entry of filtered) {
      vocabMap.set(entry.en.toLowerCase(), {
        es: entry.es,
        tier: entry.tier,
        gender: entry.gender || null,
      });
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
   * Get the Spanish article for a given English article + gender.
   * @param {string} enArticle - 'the', 'a', or 'an'
   * @param {string} gender - 'm' or 'f'
   * @returns {string} Spanish article
   */
  function getSpanishArticle(enArticle, gender) {
    if (enArticle === 'the') {
      return gender === 'f' ? 'la' : 'el';
    }
    // 'a' or 'an'
    return gender === 'f' ? 'una' : 'un';
  }

  /**
   * Find all potential word matches in a text node, including article+noun compounds.
   * Returns array of match objects:
   *   Single: { word, wordLower, entry, index, length, compound: false }
   *   Compound: { word, wordLower, entry, index, length, compound: true,
   *               article, articleEs, fullOriginal, fullEs }
   */
  function findMatches(text) {
    const matches = [];
    const allWords = [];
    WORD_RE.lastIndex = 0;
    let match;

    // First pass: collect all word positions
    while ((match = WORD_RE.exec(text)) !== null) {
      allWords.push({
        word: match[1],
        wordLower: match[1].toLowerCase(),
        index: match.index,
        length: match[0].length,
      });
    }

    // Second pass: detect article+noun bigrams and single-word matches
    const consumed = new Set(); // indices of words already part of a compound

    for (let i = 0; i < allWords.length; i++) {
      const w = allWords[i];

      // Check if this is an article followed by a known noun with gender
      if (ARTICLES.has(w.wordLower) && i + 1 < allWords.length) {
        const next = allWords[i + 1];
        const entry = vocabMap.get(next.wordLower);

        // Only compound if the noun has a gender AND there's only whitespace between
        if (entry && entry.gender) {
          const gap = text.slice(w.index + w.length, next.index);
          if (/^\s+$/.test(gap)) {
            const articleEs = getSpanishArticle(w.wordLower, entry.gender);
            // Preserve capitalisation: if article was "The", capitalise "La"/"El"
            const isCapitalised = w.word[0] === w.word[0].toUpperCase() && w.word[0] !== w.word[0].toLowerCase();
            const articleEsFinal = isCapitalised
              ? articleEs[0].toUpperCase() + articleEs.slice(1)
              : articleEs;

            const fullOriginal = text.slice(w.index, next.index + next.length);
            const fullEs = `${articleEsFinal} ${entry.es}`;

            matches.push({
              word: next.word,
              wordLower: next.wordLower,
              entry,
              index: w.index,
              length: (next.index + next.length) - w.index,
              compound: true,
              article: w.word,
              articleEs: articleEsFinal,
              fullOriginal,
              fullEs,
            });

            consumed.add(i);
            consumed.add(i + 1);
            i++; // skip the noun, already consumed
            continue;
          }
        }
      }

      // Single word match (skip if already consumed by compound)
      if (consumed.has(i)) continue;

      const entry = vocabMap.get(w.wordLower);
      if (!entry) continue;
      if (isProbablyProperNoun(w.word, text, w.index)) continue;
      // Skip standalone articles — they're only useful in compounds
      if (ARTICLES.has(w.wordLower)) continue;

      matches.push({
        word: w.word,
        wordLower: w.wordLower,
        entry,
        index: w.index,
        length: w.length,
        compound: false,
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
      const isStruggling = !isKnown && strugglingWords.has(m.wordLower);
      let cls = 'sideload-word';
      if (isKnown) cls += ' sideload-word--known';
      if (isStruggling) cls += ' sideload-word--struggling';
      span.className = cls;
      span.dataset.tier = m.entry.tier;

      if (m.compound) {
        span.dataset.original = m.fullOriginal;
        span.dataset.noun = m.wordLower;  // The noun word for progress tracking
        span.dataset.es = m.fullEs;
        span.dataset.gender = m.entry.gender;
        span.textContent = m.fullEs;
      } else {
        span.dataset.original = m.word;
        span.dataset.es = m.entry.es;
        if (m.entry.gender) span.dataset.gender = m.entry.gender;
        span.textContent = m.entry.es;
      }

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
   * Check if the current domain is blacklisted.
   */
  async function isDomainBlacklisted() {
    try {
      const blacklist = await SideloadStorage.getSetting('blacklist', '');
      if (!blacklist) return false;
      const domains = blacklist.split(/[\n,]/).map((d) => d.trim().toLowerCase()).filter(Boolean);
      const currentHost = window.location.hostname.toLowerCase();
      return domains.some((d) => currentHost === d || currentHost.endsWith('.' + d));
    } catch (_) {
      return false;
    }
  }

  /**
   * MutationObserver: watch for new DOM nodes and replace words in them.
   */
  function observeDynamicContent() {
    let isReplacing = false;

    const observer = new MutationObserver((mutations) => {
      if (!vocabMap || vocabMap.size === 0 || !enabled) return;
      // Skip mutations caused by our own replacements
      if (isReplacing) return;

      const nodesToProcess = [];
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE
            && !node.classList?.contains('sideload-word')
            && !node.classList?.contains('sideload-tooltip')) {
            nodesToProcess.push(node);
          }
        }
      }

      if (nodesToProcess.length === 0) return;

      isReplacing = true;
      for (const node of nodesToProcess) {
        replaceWords(node);
      }
      isReplacing = false;
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return observer;
  }

  /**
   * Initialize: load vocab, compute tiers, run replacement, observe dynamic content.
   */
  async function init() {
    // Check domain blacklist before doing any work
    if (await isDomainBlacklisted()) {
      console.log('[Sideload] Domain is blacklisted — skipping');
      return;
    }

    await loadVocabulary();
    await rebuildVocabMap();

    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        replaceWords();
        observeDynamicContent();
      });
    } else {
      setTimeout(() => {
        replaceWords();
        observeDynamicContent();
      }, 0);
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
