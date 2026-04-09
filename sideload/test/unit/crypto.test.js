/**
 * Unit tests for lib/crypto.js — E2E encryption (PBKDF2 + AES-256-GCM).
 */
import { describe, it, expect } from 'vitest';

// crypto.js uses conditional module.exports
const { deriveKey, encrypt, decrypt } = await import('../../lib/crypto.js');

const TEST_KEY = 'SL-TEST-ABCD-1234';
const TEST_PIN = '5678';
const TEST_ACCOUNT = 'abc123def456';

describe('deriveKey', () => {
  it('returns a CryptoKey', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    expect(key).toBeDefined();
    expect(key.type).toBe('secret');
    expect(key.algorithm.name).toBe('AES-GCM');
  });

  it('is deterministic for same inputs', async () => {
    const key1 = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const key2 = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    // Can't compare CryptoKey directly — verify by encrypting/decrypting
    const blob = await encrypt('test', key1);
    const plain = await decrypt(blob, key2);
    expect(plain).toBe('test');
  });

  it('produces different keys for different PINs', async () => {
    const key1 = await deriveKey(TEST_KEY, '1111', TEST_ACCOUNT);
    const key2 = await deriveKey(TEST_KEY, '2222', TEST_ACCOUNT);
    const blob = await encrypt('test', key1);
    await expect(decrypt(blob, key2)).rejects.toThrow();
  });

  it('produces different keys for different license keys', async () => {
    const key1 = await deriveKey('SL-AAAA-AAAA-AAAA', TEST_PIN, TEST_ACCOUNT);
    const key2 = await deriveKey('SL-BBBB-BBBB-BBBB', TEST_PIN, TEST_ACCOUNT);
    const blob = await encrypt('test', key1);
    await expect(decrypt(blob, key2)).rejects.toThrow();
  });

  it('produces different keys for different account IDs', async () => {
    const key1 = await deriveKey(TEST_KEY, TEST_PIN, 'account-a');
    const key2 = await deriveKey(TEST_KEY, TEST_PIN, 'account-b');
    const blob = await encrypt('test', key1);
    await expect(decrypt(blob, key2)).rejects.toThrow();
  });
});

describe('encrypt / decrypt round-trip', () => {
  it('round-trips a simple string', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const plaintext = 'hello, sideload!';
    const blob = await encrypt(plaintext, key);
    const result = await decrypt(blob, key);
    expect(result).toBe(plaintext);
  });

  it('round-trips a JSON payload', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const payload = JSON.stringify({
      words: [
        { en: 'time', known: true, clicked_known: 3, seen: 12, tier: 1 },
        { en: 'house', known: false, clicked_known: 0, seen: 5, tier: 1 },
      ],
      version: 2,
    });
    const blob = await encrypt(payload, key);
    const result = await decrypt(blob, key);
    expect(JSON.parse(result)).toEqual(JSON.parse(payload));
  });

  it('round-trips empty string', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const blob = await encrypt('', key);
    const result = await decrypt(blob, key);
    expect(result).toBe('');
  });

  it('round-trips unicode content', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const text = '¡Hola! 日本語 🎉';
    const blob = await encrypt(text, key);
    expect(await decrypt(blob, key)).toBe(text);
  });
});

describe('encrypt output format', () => {
  it('produces base64 iv and ciphertext', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const blob = await encrypt('test', key);
    expect(blob.iv).toMatch(/^[A-Za-z0-9+/]+=*$/);
    expect(blob.ciphertext).toMatch(/^[A-Za-z0-9+/]+=*$/);
  });

  it('produces unique IVs on each call', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const ivs = new Set();
    for (let i = 0; i < 20; i++) {
      const blob = await encrypt('same-plaintext', key);
      ivs.add(blob.iv);
    }
    expect(ivs.size).toBe(20);
  });

  it('produces different ciphertexts for same plaintext (due to random IV)', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const blob1 = await encrypt('same', key);
    const blob2 = await encrypt('same', key);
    expect(blob1.ciphertext).not.toBe(blob2.ciphertext);
  });
});

describe('decrypt failure', () => {
  it('throws on wrong key', async () => {
    const key1 = await deriveKey(TEST_KEY, '1111', TEST_ACCOUNT);
    const key2 = await deriveKey(TEST_KEY, '9999', TEST_ACCOUNT);
    const blob = await encrypt('secret', key1);
    await expect(decrypt(blob, key2)).rejects.toThrow();
  });

  it('throws on tampered ciphertext', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const blob = await encrypt('secret', key);
    const tampered = { ...blob, ciphertext: blob.ciphertext.slice(0, -4) + 'AAAA' };
    await expect(decrypt(tampered, key)).rejects.toThrow();
  });

  it('throws on tampered iv', async () => {
    const key = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const blob = await encrypt('secret', key);
    const tampered = { ...blob, iv: blob.iv.slice(0, -2) + 'AA' };
    await expect(decrypt(tampered, key)).rejects.toThrow();
  });
});
