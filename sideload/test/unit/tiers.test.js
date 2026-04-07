/**
 * Unit tests for lib/tiers.js — tier unlock logic and density scaling.
 *
 * Since tiers.js uses an IIFE that assigns to globalThis.SideloadTiers,
 * we evaluate it in a controlled scope.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const tiersSource = fs.readFileSync(
  path.resolve(__dirname, '../../lib/tiers.js'),
  'utf-8'
);

let SideloadTiers;

beforeAll(() => {
  // Evaluate tiers.js in a function scope to capture the IIFE result
  const fn = new Function(`${tiersSource}; return SideloadTiers;`);
  SideloadTiers = fn();
});

describe('countWordsPerTier', () => {
  it('counts words by tier', () => {
    const vocab = [
      { en: 'house', es: 'casa', tier: 1 },
      { en: 'time', es: 'tiempo', tier: 1 },
      { en: 'city', es: 'ciudad', tier: 2 },
    ];
    const counts = SideloadTiers.countWordsPerTier(vocab);
    expect(counts).toEqual({ 1: 2, 2: 1 });
  });

  it('returns empty for empty vocab', () => {
    expect(SideloadTiers.countWordsPerTier([])).toEqual({});
  });
});

describe('getUnlockedTiers', () => {
  it('always unlocks tier 1', () => {
    const progress = { total: 0, known: 0, tiers: {} };
    const wordsPerTier = { 1: 100, 2: 200 };
    const unlocked = SideloadTiers.getUnlockedTiers(progress, wordsPerTier);
    expect(unlocked.has(1)).toBe(true);
    expect(unlocked.has(2)).toBe(false);
  });

  it('unlocks tier 2 when tier 1 is 80% known', () => {
    const progress = {
      total: 100,
      known: 80,
      tiers: { 1: { total: 100, known: 80 } },
    };
    const wordsPerTier = { 1: 100, 2: 200 };
    const unlocked = SideloadTiers.getUnlockedTiers(progress, wordsPerTier);
    expect(unlocked.has(2)).toBe(true);
  });

  it('does not unlock tier 2 at 79%', () => {
    const progress = {
      total: 100,
      known: 79,
      tiers: { 1: { total: 100, known: 79 } },
    };
    const wordsPerTier = { 1: 100, 2: 200 };
    const unlocked = SideloadTiers.getUnlockedTiers(progress, wordsPerTier);
    expect(unlocked.has(2)).toBe(false);
  });

  it('unlocks tiers sequentially — cannot skip', () => {
    const progress = {
      total: 300,
      known: 160,
      tiers: {
        1: { total: 100, known: 80 },
        2: { total: 200, known: 80 }, // only 40%, not enough
      },
    };
    const wordsPerTier = { 1: 100, 2: 200, 3: 300 };
    const unlocked = SideloadTiers.getUnlockedTiers(progress, wordsPerTier);
    expect(unlocked.has(1)).toBe(true);
    expect(unlocked.has(2)).toBe(true);
    expect(unlocked.has(3)).toBe(false);
  });
});

describe('getDensity', () => {
  it('returns tier 1 density for tier 1', () => {
    const density = SideloadTiers.getDensity(new Set([1]), null);
    expect(density).toBe(0.05);
  });

  it('returns tier 3 density when tier 3 is highest', () => {
    const density = SideloadTiers.getDensity(new Set([1, 2, 3]), null);
    expect(density).toBe(0.15);
  });

  it('respects user override', () => {
    const density = SideloadTiers.getDensity(new Set([1, 2, 3]), 0.5);
    expect(density).toBe(0.5);
  });

  it('clamps user override to 0-1', () => {
    expect(SideloadTiers.getDensity(new Set([1]), 1.5)).toBe(1);
    expect(SideloadTiers.getDensity(new Set([1]), -0.2)).toBe(0);
  });
});

describe('applyDensity', () => {
  it('returns empty for 0 density', () => {
    const matches = [1, 2, 3, 4, 5];
    expect(SideloadTiers.applyDensity(matches, 0)).toEqual([]);
  });

  it('returns all for 1.0 density', () => {
    const matches = [1, 2, 3];
    expect(SideloadTiers.applyDensity(matches, 1)).toEqual([1, 2, 3]);
  });

  it('returns subset for 0.5 density', () => {
    const matches = Array.from({ length: 20 }, (_, i) => i);
    const result = SideloadTiers.applyDensity(matches, 0.5);
    expect(result.length).toBe(10);
    // All elements should be from original
    for (const r of result) {
      expect(matches).toContain(r);
    }
  });

  it('always returns at least 1 match when density > 0', () => {
    const matches = [1];
    expect(SideloadTiers.applyDensity(matches, 0.01).length).toBeGreaterThanOrEqual(1);
  });
});

describe('filterByUnlockedTiers', () => {
  it('filters to unlocked tiers only', () => {
    const vocab = [
      { en: 'house', es: 'casa', tier: 1 },
      { en: 'city', es: 'ciudad', tier: 2 },
      { en: 'theory', es: 'teoría', tier: 3 },
    ];
    const filtered = SideloadTiers.filterByUnlockedTiers(vocab, new Set([1, 2]));
    expect(filtered).toHaveLength(2);
    expect(filtered.map((w) => w.en)).toEqual(['house', 'city']);
  });
});
