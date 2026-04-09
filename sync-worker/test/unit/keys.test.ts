import { describe, it, expect } from 'vitest';
import { isValidKeyFormat, generateKey, hashKey, generateAccountId } from '../../src/lib/keys';

describe('isValidKeyFormat', () => {
  it('accepts valid keys', () => {
    expect(isValidKeyFormat('SL-ABCD-1234-EF56')).toBe(true);
    expect(isValidKeyFormat('SL-0000-ZZZZ-9999')).toBe(true);
  });

  it('rejects lowercase', () => {
    expect(isValidKeyFormat('SL-abcd-1234-ef56')).toBe(false);
  });

  it('rejects wrong prefix', () => {
    expect(isValidKeyFormat('XX-ABCD-1234-EF56')).toBe(false);
  });

  it('rejects wrong segment length', () => {
    expect(isValidKeyFormat('SL-ABC-1234-EF56')).toBe(false);
    expect(isValidKeyFormat('SL-ABCDE-1234-EF56')).toBe(false);
  });

  it('rejects missing segments', () => {
    expect(isValidKeyFormat('SL-ABCD-1234')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidKeyFormat('')).toBe(false);
  });

  it('rejects special characters', () => {
    expect(isValidKeyFormat('SL-AB!D-1234-EF56')).toBe(false);
  });
});

describe('generateKey', () => {
  it('produces valid format', () => {
    const key = generateKey();
    expect(isValidKeyFormat(key)).toBe(true);
  });

  it('produces unique keys', () => {
    const keys = new Set(Array.from({ length: 50 }, () => generateKey()));
    expect(keys.size).toBe(50);
  });

  it('starts with SL- prefix', () => {
    expect(generateKey().startsWith('SL-')).toBe(true);
  });
});

describe('hashKey', () => {
  it('produces 64-char hex string', async () => {
    const hash = await hashKey('SL-ABCD-1234-EF56');
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
  });

  it('is deterministic', async () => {
    const hash1 = await hashKey('SL-TEST-TEST-TEST');
    const hash2 = await hashKey('SL-TEST-TEST-TEST');
    expect(hash1).toBe(hash2);
  });

  it('produces different hashes for different keys', async () => {
    const hash1 = await hashKey('SL-AAAA-AAAA-AAAA');
    const hash2 = await hashKey('SL-BBBB-BBBB-BBBB');
    expect(hash1).not.toBe(hash2);
  });
});

describe('generateAccountId', () => {
  it('produces 32-char hex string', () => {
    const id = generateAccountId();
    expect(id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('produces unique IDs', () => {
    const ids = new Set(Array.from({ length: 50 }, () => generateAccountId()));
    expect(ids.size).toBe(50);
  });
});
