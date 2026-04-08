import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const source = fs.readFileSync(
  path.resolve(__dirname, '../../lib/struggling.js'),
  'utf-8'
);

let SideloadStruggling;

beforeAll(() => {
  const fn = new Function(`${source}; return SideloadStruggling;`);
  SideloadStruggling = fn();
});

describe('isStruggling', () => {
  it('returns false for null record', () => {
    expect(SideloadStruggling.isStruggling(null)).toBe(false);
  });

  it('returns false when seen < threshold', () => {
    expect(SideloadStruggling.isStruggling({ seen: 5, known: false })).toBe(false);
  });

  it('returns true when seen >= threshold and not known', () => {
    expect(SideloadStruggling.isStruggling({ seen: 10, known: false })).toBe(true);
    expect(SideloadStruggling.isStruggling({ seen: 15, known: false })).toBe(true);
  });

  it('returns false when known even if seen >= threshold', () => {
    expect(SideloadStruggling.isStruggling({ seen: 20, known: true })).toBe(false);
  });

  it('respects custom threshold', () => {
    expect(SideloadStruggling.isStruggling({ seen: 5, known: false }, 5)).toBe(true);
    expect(SideloadStruggling.isStruggling({ seen: 4, known: false }, 5)).toBe(false);
  });
});

describe('getStrugglingWords', () => {
  it('filters and sorts by seen count descending', () => {
    const records = [
      { en: 'time', seen: 15, known: false },
      { en: 'house', seen: 3, known: false },
      { en: 'water', seen: 12, known: false },
      { en: 'book', seen: 20, known: true },
    ];

    const result = SideloadStruggling.getStrugglingWords(records);
    expect(result).toHaveLength(2);
    expect(result[0].en).toBe('time');
    expect(result[1].en).toBe('water');
  });

  it('returns empty for no struggling words', () => {
    const records = [
      { en: 'house', seen: 3, known: false },
      { en: 'book', seen: 20, known: true },
    ];
    expect(SideloadStruggling.getStrugglingWords(records)).toHaveLength(0);
  });
});
