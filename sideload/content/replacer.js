// Sideload Spanish — Content Script: Word Replacer
// Walks DOM text nodes, replaces English words with Spanish translations.

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

  let vocabMap = null; // Map<lowercase_en, { es, tier }>
  let enabled = true;

  /**
   * Load vocabulary JSON and build lookup map.
   */
  async function loadVocabulary() {
    try {
      const url = chrome.runtime.getURL('data/vocabulary.json');
      const response = await fetch(url);
      const words = await response.json();

      vocabMap = new Map();
      for (const entry of words) {
        vocabMap.set(entry.en.toLowerCase(), { es: entry.es, tier: entry.tier });
      }

      console.log(`[Sideload] Vocabulary loaded: ${vocabMap.size} words`);
    } catch (err) {
      console.error('[Sideload] Failed to load vocabulary:', err);
      vocabMap = new Map();
    }
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
   * A word at the start of text that's capitalized is NOT treated as a proper noun.
   */
  function isProbablyProperNoun(word, fullText, matchIndex) {
    if (!LOOKS_LIKE_PROPER_NOUN.test(word)) return false;

    // Check if this is at the very start of the text node (after optional whitespace)
    const before = fullText.slice(0, matchIndex).trimEnd();
    if (before.length === 0) return false;

    // Check if preceded by sentence-ending punctuation
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
   * Build a replacement fragment for a single text node.
   * Returns null if no replacements were made.
   */
  function buildReplacementFragment(textNode) {
    const text = textNode.textContent;

    // Skip text that looks like URLs or emails
    if (URL_RE.test(text) || EMAIL_RE.test(text)) return null;
    // Reset regex state
    URL_RE.lastIndex = 0;
    EMAIL_RE.lastIndex = 0;

    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    let hasReplacement = false;

    WORD_RE.lastIndex = 0;
    let match;

    while ((match = WORD_RE.exec(text)) !== null) {
      const word = match[1];
      const wordLower = word.toLowerCase();
      const entry = vocabMap.get(wordLower);

      if (!entry) continue;
      if (isProbablyProperNoun(word, text, match.index)) continue;

      hasReplacement = true;

      // Add text before this match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }

      // Create replacement span
      const span = document.createElement('span');
      span.className = 'sideload-word';
      span.dataset.original = word;
      span.dataset.tier = entry.tier;
      span.dataset.es = entry.es;
      span.textContent = entry.es;

      fragment.appendChild(span);
      lastIndex = match.index + match[0].length;
    }

    if (!hasReplacement) return null;

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
   * Initialize: load vocab, run replacement, set up observer.
   */
  async function init() {
    await loadVocabulary();

    // Use requestIdleCallback if available, otherwise setTimeout
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => replaceWords());
    } else {
      setTimeout(() => replaceWords(), 0);
    }
  }

  // Listen for enable/disable messages from background
  chrome.runtime.onMessage.addListener((message) => {
    if (message.type === 'SET_ENABLED') {
      enabled = message.enabled;
      // If re-enabled, re-run replacement
      if (enabled) replaceWords();
    }
  });

  init();
})();
