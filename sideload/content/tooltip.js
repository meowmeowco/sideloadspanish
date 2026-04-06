// Sideload Spanish — Tooltip & Click-to-Know
// Hover shows original word + tier. Click marks word as known.

(() => {
  const TIER_LABELS = {
    1: 'A1 — Beginner',
    2: 'A2 — Elementary',
    3: 'B1 — Intermediate',
    4: 'B2 — Upper Intermediate',
    5: 'C1 — Advanced',
  };

  let tooltipEl = null;
  let hideTimeout = null;

  /**
   * Create the tooltip element (singleton, reused across hovers).
   */
  function ensureTooltip() {
    if (tooltipEl) return tooltipEl;

    tooltipEl = document.createElement('div');
    tooltipEl.className = 'sideload-tooltip';
    tooltipEl.setAttribute('role', 'tooltip');
    document.body.appendChild(tooltipEl);
    return tooltipEl;
  }

  /**
   * Position the tooltip near the target element, clamped to viewport.
   */
  function positionTooltip(target) {
    const tip = ensureTooltip();
    const rect = target.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();

    // Default: above the word, centered
    let top = rect.top - tipRect.height - 8;
    let left = rect.left + (rect.width - tipRect.width) / 2;

    // If above would go off-screen, show below
    if (top < 4) {
      top = rect.bottom + 8;
    }

    // Clamp horizontal to viewport
    left = Math.max(4, Math.min(left, window.innerWidth - tipRect.width - 4));

    tip.style.top = `${top + window.scrollY}px`;
    tip.style.left = `${left + window.scrollX}px`;
  }

  /**
   * Show the tooltip for a sideload-word element.
   */
  function showTooltip(target) {
    clearTimeout(hideTimeout);

    const original = target.dataset.original;
    const tier = parseInt(target.dataset.tier, 10);
    const spanish = target.dataset.es;
    const tierLabel = TIER_LABELS[tier] || `Tier ${tier}`;
    const isKnown = target.classList.contains('sideload-word--known');

    const tip = ensureTooltip();
    tip.innerHTML = '';

    // Original word
    const originalLine = document.createElement('div');
    originalLine.className = 'sideload-tooltip__original';
    originalLine.textContent = original;
    tip.appendChild(originalLine);

    // Translation
    const transLine = document.createElement('div');
    transLine.className = 'sideload-tooltip__translation';
    transLine.textContent = `→ ${spanish}`;
    tip.appendChild(transLine);

    // Tier badge
    const tierLine = document.createElement('div');
    tierLine.className = 'sideload-tooltip__tier';
    tierLine.textContent = tierLabel;
    tip.appendChild(tierLine);

    // Known status / action hint
    const actionLine = document.createElement('div');
    actionLine.className = 'sideload-tooltip__action';
    actionLine.textContent = isKnown ? '✓ Known' : 'Click to mark as known';
    tip.appendChild(actionLine);

    tip.classList.add('sideload-tooltip--visible');

    // Position after content is set (need measured size)
    requestAnimationFrame(() => positionTooltip(target));
  }

  /**
   * Hide the tooltip with a short delay (allows moving to tooltip).
   */
  function hideTooltip() {
    clearTimeout(hideTimeout);
    hideTimeout = setTimeout(() => {
      if (tooltipEl) {
        tooltipEl.classList.remove('sideload-tooltip--visible');
      }
    }, 150);
  }

  /**
   * Handle click: mark word as known, update visual state.
   */
  function handleClick(target) {
    if (target.classList.contains('sideload-word--known')) return;

    const original = target.dataset.original;
    const tier = parseInt(target.dataset.tier, 10);

    // Visual feedback: brief pulse then known state
    target.classList.add('sideload-word--pulse');
    setTimeout(() => {
      target.classList.remove('sideload-word--pulse');
      target.classList.add('sideload-word--known');
    }, 300);

    // Update tooltip immediately
    if (tooltipEl && tooltipEl.classList.contains('sideload-tooltip--visible')) {
      const actionLine = tooltipEl.querySelector('.sideload-tooltip__action');
      if (actionLine) actionLine.textContent = '\u2713 Known';
    }

    // Persist to IndexedDB
    if (typeof SideloadStorage !== 'undefined') {
      SideloadStorage.markKnown(original, tier).catch((err) => {
        console.error('[Sideload] Failed to mark known:', err);
      });
    }
  }

  // Event delegation on document body
  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.sideload-word');
    if (target) showTooltip(target);
  });

  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('.sideload-word');
    if (target) hideTooltip();
  });

  document.addEventListener('click', (e) => {
    const target = e.target.closest('.sideload-word');
    if (target) {
      e.preventDefault();
      e.stopPropagation();
      handleClick(target);
    }
  });

  // Keep tooltip alive when hovering over the tooltip itself
  document.addEventListener('mouseover', (e) => {
    if (e.target.closest('.sideload-tooltip')) {
      clearTimeout(hideTimeout);
    }
  });

  document.addEventListener('mouseout', (e) => {
    if (e.target.closest('.sideload-tooltip')) {
      hideTooltip();
    }
  });

  // Dismiss on scroll
  let scrollTimer = null;
  window.addEventListener('scroll', () => {
    if (tooltipEl && tooltipEl.classList.contains('sideload-tooltip--visible')) {
      clearTimeout(scrollTimer);
      scrollTimer = setTimeout(() => {
        if (tooltipEl) tooltipEl.classList.remove('sideload-tooltip--visible');
      }, 50);
    }
  }, { passive: true });
})();
