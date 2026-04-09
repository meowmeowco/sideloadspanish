/**
 * Unit tests for lib/sync.js — sync client orchestration.
 *
 * Mocks fetch() and crypto/merge globals to test sync logic in isolation.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';

// Load dependencies that sync.js expects as globals
const cryptoModule = await import('../../lib/crypto.js');
const mergeModule = await import('../../lib/merge.js');

// Inject globals that sync.js IIFE expects
globalThis.deriveKey = cryptoModule.deriveKey;
globalThis.encrypt = cryptoModule.encrypt;
globalThis.decrypt = cryptoModule.decrypt;
globalThis.mergeWordSets = mergeModule.mergeWordSets;

// Now load sync.js
const SideloadSync = (await import('../../lib/sync.js')).default;

const TEST_KEY = 'SL-TEST-ABCD-1234';
const TEST_PIN = '5678';
const TEST_ACCOUNT = 'abc123def456';

// Mock fetch
let fetchMock;

beforeEach(() => {
  fetchMock = vi.fn();
  globalThis.fetch = fetchMock;
});

function mockJsonResponse(data, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: () => Promise.resolve(data),
  });
}

describe('validate', () => {
  it('sends POST /validate with key', async () => {
    fetchMock.mockReturnValue(mockJsonResponse({ valid: true, active: true }));

    const result = await SideloadSync.validate(TEST_KEY);

    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/validate');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body).key).toBe(TEST_KEY);
    expect(result.valid).toBe(true);
  });
});

describe('pull', () => {
  it('returns blob data on 200', async () => {
    const blob = { iv: 'test-iv', ciphertext: 'test-ct', updated_at: '2026-01-01' };
    fetchMock.mockReturnValue(mockJsonResponse({ data: blob }));

    const result = await SideloadSync.pull(TEST_KEY);
    expect(result).toEqual(blob);
  });

  it('returns null when no blob', async () => {
    fetchMock.mockReturnValue(mockJsonResponse({ data: null }));
    const result = await SideloadSync.pull(TEST_KEY);
    expect(result).toBeNull();
  });

  it('throws INVALID_KEY on 401', async () => {
    fetchMock.mockReturnValue(mockJsonResponse({}, 401));
    await expect(SideloadSync.pull(TEST_KEY)).rejects.toThrow('INVALID_KEY');
  });

  it('throws EXPIRED on 403', async () => {
    fetchMock.mockReturnValue(mockJsonResponse({}, 403));
    await expect(SideloadSync.pull(TEST_KEY)).rejects.toThrow('EXPIRED');
  });

  it('sends Bearer auth header', async () => {
    fetchMock.mockReturnValue(mockJsonResponse({ data: null }));
    await SideloadSync.pull(TEST_KEY);
    const headers = fetchMock.mock.calls[0][1].headers;
    expect(headers.Authorization).toBe(`Bearer ${TEST_KEY}`);
  });
});

describe('push', () => {
  it('sends PUT /sync with blob', async () => {
    fetchMock.mockReturnValue(mockJsonResponse({ ok: true, updated_at: '2026-01-01' }));
    const blob = { iv: 'iv', ciphertext: 'ct' };

    await SideloadSync.push(TEST_KEY, blob);

    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toContain('/sync');
    expect(opts.method).toBe('PUT');
    expect(JSON.parse(opts.body)).toEqual(blob);
  });

  it('throws INVALID_KEY on 401', async () => {
    fetchMock.mockReturnValue(mockJsonResponse({}, 401));
    await expect(SideloadSync.push(TEST_KEY, {})).rejects.toThrow('INVALID_KEY');
  });
});

describe('syncFull', () => {
  it('pushes local data when remote is empty', async () => {
    const localWords = [
      { en: 'house', known: true, clicked_known: 1, seen: 5, tier: 1 },
    ];

    // pull returns null (no remote blob)
    fetchMock
      .mockReturnValueOnce(mockJsonResponse({ data: null }))  // GET /sync
      .mockReturnValueOnce(mockJsonResponse({ ok: true }));    // PUT /sync

    const result = await SideloadSync.syncFull(TEST_KEY, TEST_PIN, TEST_ACCOUNT, localWords);
    expect(result.merged).toHaveLength(1);
    expect(result.merged[0].en).toBe('house');
    expect(result.pushed).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('merges local + remote data and pushes', async () => {
    const localWords = [
      { en: 'house', known: true, clicked_known: 1, seen: 5, tier: 1 },
    ];
    const remoteWords = [
      { en: 'time', known: true, clicked_known: 2, seen: 8, tier: 1 },
    ];

    // Encrypt remote words to simulate a real blob
    const cryptoKey = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const remotePlain = JSON.stringify({ words: remoteWords, version: 2 });
    const remoteBlob = await encrypt(remotePlain, cryptoKey);

    fetchMock
      .mockReturnValueOnce(mockJsonResponse({ data: remoteBlob }))  // GET /sync
      .mockReturnValueOnce(mockJsonResponse({ ok: true }));          // PUT /sync

    const result = await SideloadSync.syncFull(TEST_KEY, TEST_PIN, TEST_ACCOUNT, localWords);
    expect(result.merged).toHaveLength(2);

    const words = result.merged.map((w) => w.en).sort();
    expect(words).toEqual(['house', 'time']);
  });

  it('resolves conflicts using merge rules', async () => {
    const localWords = [
      { en: 'house', known: false, clicked_known: 1, seen: 3, tier: 2 },
    ];
    const remoteWords = [
      { en: 'house', known: true, clicked_known: 5, seen: 1, tier: 1 },
    ];

    const cryptoKey = await deriveKey(TEST_KEY, TEST_PIN, TEST_ACCOUNT);
    const remoteBlob = await encrypt(JSON.stringify({ words: remoteWords, version: 2 }), cryptoKey);

    fetchMock
      .mockReturnValueOnce(mockJsonResponse({ data: remoteBlob }))
      .mockReturnValueOnce(mockJsonResponse({ ok: true }));

    const result = await SideloadSync.syncFull(TEST_KEY, TEST_PIN, TEST_ACCOUNT, localWords);
    const house = result.merged.find((w) => w.en === 'house');

    expect(house.known).toBe(true);           // OR
    expect(house.clicked_known).toBe(5);      // max
    expect(house.seen).toBe(3);               // max
    expect(house.tier).toBe(1);               // min
  });
});
