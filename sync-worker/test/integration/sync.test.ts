import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { spawn, type ChildProcess } from 'child_process';
import path from 'path';

const PORT = 3457;
const BASE = `http://127.0.0.1:${PORT}`;
const WORKER_DIR = path.resolve(__dirname, '../..');

const WEBHOOK_SECRET = 'integration-test-secret';

let spinProcess: ChildProcess;

function json(data: unknown): string {
  return JSON.stringify(data);
}

async function hmacSign(body: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'],
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(body));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function waitForServer(url: string, maxWaitMs = 15000): Promise<void> {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    try {
      await fetch(url);
      return;
    } catch {
      await new Promise((r) => setTimeout(r, 300));
    }
  }
  throw new Error(`Server did not start within ${maxWaitMs}ms`);
}

beforeAll(async () => {
  spinProcess = spawn('spin', ['up', '--listen', `127.0.0.1:${PORT}`], {
    cwd: WORKER_DIR,
    stdio: 'pipe',
    env: {
      ...process.env,
      SPIN_VARIABLE_LEMON_WEBHOOK_SECRET: WEBHOOK_SECRET,
    },
  });
  await waitForServer(`${BASE}/sync`);
}, 30000);

afterAll(() => {
  spinProcess?.kill();
});

async function createTestKey(): Promise<{ key: string; account_id: string }> {
  const res = await fetch(`${BASE}/admin/create-key`, {
    method: 'POST',
    headers: { 'X-Admin-Secret': 'dev-secret' },
  });
  return res.json() as Promise<{ key: string; account_id: string }>;
}

describe('Auth', () => {
  it('rejects missing auth header', async () => {
    const res = await fetch(`${BASE}/sync`);
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Missing authorization');
  });

  it('rejects invalid key format', async () => {
    const res = await fetch(`${BASE}/sync`, {
      headers: { Authorization: 'Bearer INVALID-KEY' },
    });
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Invalid key format');
  });

  it('rejects unknown key', async () => {
    const res = await fetch(`${BASE}/sync`, {
      headers: { Authorization: 'Bearer SL-FAKE-FAKE-FAKE' },
    });
    expect(res.status).toBe(401);
    const body = await res.json() as { error: string };
    expect(body.error).toBe('Unknown key');
  });
});

describe('Admin', () => {
  it('rejects without admin secret', async () => {
    const res = await fetch(`${BASE}/admin/create-key`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('creates a key with correct format', async () => {
    const { key, account_id } = await createTestKey();
    expect(key).toMatch(/^SL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(account_id).toMatch(/^[0-9a-f]{32}$/);
  });
});

describe('GET /sync', () => {
  it('returns null for new account', async () => {
    const { key } = await createTestKey();
    const res = await fetch(`${BASE}/sync`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: null };
    expect(body.data).toBeNull();
  });
});

describe('PUT /sync', () => {
  it('stores and retrieves a blob', async () => {
    const { key } = await createTestKey();
    const blob = { iv: 'dGVzdC1pdi0xMjM0', ciphertext: 'ZW5jcnlwdGVkLWRhdGE=' };

    const putRes = await fetch(`${BASE}/sync`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: json(blob),
    });
    expect(putRes.status).toBe(200);
    const putBody = await putRes.json() as { ok: boolean; updated_at: string };
    expect(putBody.ok).toBe(true);
    expect(putBody.updated_at).toBeTruthy();

    const getRes = await fetch(`${BASE}/sync`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    const getBody = await getRes.json() as { data: { iv: string; ciphertext: string; updated_at: string } };
    expect(getBody.data.iv).toBe(blob.iv);
    expect(getBody.data.ciphertext).toBe(blob.ciphertext);
    expect(getBody.data.updated_at).toBeTruthy();
  });

  it('rejects missing iv', async () => {
    const { key } = await createTestKey();
    const res = await fetch(`${BASE}/sync`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: json({ ciphertext: 'abc' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects missing ciphertext', async () => {
    const { key } = await createTestKey();
    const res = await fetch(`${BASE}/sync`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: json({ iv: 'abc' }),
    });
    expect(res.status).toBe(400);
  });

  it('rejects oversized payload', async () => {
    const { key } = await createTestKey();
    const res = await fetch(`${BASE}/sync`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: json({ iv: 'abc', ciphertext: 'x'.repeat(1_500_000) }),
    });
    expect(res.status).toBe(413);
  });
});

describe('POST /validate', () => {
  it('validates an active key', async () => {
    const { key } = await createTestKey();
    const res = await fetch(`${BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json({ key }),
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { valid: boolean; active: boolean };
    expect(body.valid).toBe(true);
    expect(body.active).toBe(true);
  });

  it('rejects invalid format', async () => {
    const res = await fetch(`${BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json({ key: 'bad' }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown key', async () => {
    const res = await fetch(`${BASE}/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json({ key: 'SL-ZZZZ-ZZZZ-ZZZZ' }),
    });
    expect(res.status).toBe(404);
  });
});

// Webhook tests moved to the POST /webhook block below

describe('POST /webhook', () => {
  it('rejects missing signature', async () => {
    const res = await fetch(`${BASE}/webhook`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('rejects invalid signature', async () => {
    const body = json({ meta: { event_name: 'subscription_created' }, data: { attributes: {} } });
    const res = await fetch(`${BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': 'deadbeef' },
      body,
    });
    expect(res.status).toBe(401);
  });

  it('handles subscription_created with valid signature', async () => {
    const body = json({
      meta: {
        event_name: 'subscription_created',
        custom_data: { claim_token: 'test-token-123' },
      },
      data: {
        type: 'subscriptions',
        id: '1',
        attributes: {
          user_email: 'test@example.com',
          status: 'active',
          renews_at: '2026-05-09T00:00:00.000Z',
        },
      },
    });
    const signature = await hmacSign(body, WEBHOOK_SECRET);

    const res = await fetch(`${BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      body,
    });
    expect(res.status).toBe(201);
    const data = await res.json() as { ok: boolean; event: string; account_id: string };
    expect(data.ok).toBe(true);
    expect(data.account_id).toMatch(/^[0-9a-f]{32}$/);
  });

  it('acknowledges unknown events', async () => {
    const body = json({
      meta: { event_name: 'subscription_paused' },
      data: { attributes: { status: 'paused' } },
    });
    const signature = await hmacSign(body, WEBHOOK_SECRET);

    const res = await fetch(`${BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      body,
    });
    expect(res.status).toBe(200);
  });
});

describe('GET /claim', () => {
  it('rejects missing token', async () => {
    const res = await fetch(`${BASE}/claim`);
    expect(res.status).toBe(400);
  });

  it('returns 404 for unknown token', async () => {
    const res = await fetch(`${BASE}/claim?token=nonexistent`);
    expect(res.status).toBe(404);
  });

  it('returns license key for valid claim token', async () => {
    // First, create a subscription via webhook with a claim token
    const claimToken = `claim-${Date.now()}`;
    const body = json({
      meta: {
        event_name: 'subscription_created',
        custom_data: { claim_token: claimToken },
      },
      data: {
        type: 'subscriptions',
        id: '99',
        attributes: {
          user_email: 'claim-test@example.com',
          status: 'active',
          renews_at: '2026-06-01T00:00:00.000Z',
        },
      },
    });
    const signature = await hmacSign(body, WEBHOOK_SECRET);
    await fetch(`${BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      body,
    });

    // Now claim the key
    const res = await fetch(`${BASE}/claim?token=${claimToken}`);
    expect(res.status).toBe(200);
    const data = await res.json() as { license_key: string; account_id: string };
    expect(data.license_key).toMatch(/^SL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(data.account_id).toMatch(/^[0-9a-f]{32}$/);

    // Claim is one-time use
    const res2 = await fetch(`${BASE}/claim?token=${claimToken}`);
    expect(res2.status).toBe(404);
  });

  it('generated key is usable for sync', async () => {
    // Create subscription via webhook
    const claimToken = `sync-claim-${Date.now()}`;
    const body = json({
      meta: {
        event_name: 'subscription_created',
        custom_data: { claim_token: claimToken },
      },
      data: {
        type: 'subscriptions',
        id: '100',
        attributes: {
          user_email: 'sync-test@example.com',
          status: 'active',
          renews_at: '2026-06-01T00:00:00.000Z',
        },
      },
    });
    const signature = await hmacSign(body, WEBHOOK_SECRET);
    await fetch(`${BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      body,
    });

    // Claim the key
    const claimRes = await fetch(`${BASE}/claim?token=${claimToken}`);
    const { license_key } = await claimRes.json() as { license_key: string };

    // Use the key for sync operations
    const getRes = await fetch(`${BASE}/sync`, {
      headers: { Authorization: `Bearer ${license_key}` },
    });
    expect(getRes.status).toBe(200);
    const getData = await getRes.json() as { data: null };
    expect(getData.data).toBeNull();

    // PUT a blob
    const putRes = await fetch(`${BASE}/sync`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${license_key}`, 'Content-Type': 'application/json' },
      body: json({ iv: 'test-iv', ciphertext: 'test-ct' }),
    });
    expect(putRes.status).toBe(200);

    // GET it back
    const getRes2 = await fetch(`${BASE}/sync`, {
      headers: { Authorization: `Bearer ${license_key}` },
    });
    const getData2 = await getRes2.json() as { data: { iv: string; ciphertext: string } };
    expect(getData2.data.iv).toBe('test-iv');
    expect(getData2.data.ciphertext).toBe('test-ct');
  });
});

describe('POST /rotate', () => {
  it('rejects unauthenticated requests', async () => {
    const res = await fetch(`${BASE}/rotate`, { method: 'POST' });
    expect(res.status).toBe(401);
  });

  it('rotates key, old key invalidated, new key works', async () => {
    const { key: oldKey } = await createTestKey();

    // Store a blob with old key
    await fetch(`${BASE}/sync`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${oldKey}`, 'Content-Type': 'application/json' },
      body: json({ iv: 'rotate-iv', ciphertext: 'rotate-ct' }),
    });

    // Rotate
    const rotateRes = await fetch(`${BASE}/rotate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${oldKey}` },
    });
    expect(rotateRes.status).toBe(200);
    const rotateData = await rotateRes.json() as { key: string; account_id: string };
    expect(rotateData.key).toMatch(/^SL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/);
    expect(rotateData.key).not.toBe(oldKey);

    // Old key should now fail
    const oldRes = await fetch(`${BASE}/sync`, {
      headers: { Authorization: `Bearer ${oldKey}` },
    });
    expect(oldRes.status).toBe(401);

    // New key should work and see the same data (same account_id)
    const newRes = await fetch(`${BASE}/sync`, {
      headers: { Authorization: `Bearer ${rotateData.key}` },
    });
    expect(newRes.status).toBe(200);
    const data = await newRes.json() as { data: { iv: string; ciphertext: string } };
    expect(data.data.iv).toBe('rotate-iv');
    expect(data.data.ciphertext).toBe('rotate-ct');
  });
});

describe('POST /recover', () => {
  it('rejects missing email', async () => {
    const res = await fetch(`${BASE}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json({}),
    });
    expect(res.status).toBe(400);
  });

  it('returns generic response for unknown email', async () => {
    const res = await fetch(`${BASE}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json({ email: 'nobody@example.com' }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { found: boolean };
    expect(data.found).toBe(false);
  });

  it('finds keys for email used in webhook', async () => {
    // Create a subscription via webhook with known email
    const email = `recover-test-${Date.now()}@example.com`;
    const webhookBody = json({
      meta: { event_name: 'subscription_created', custom_data: {} },
      data: {
        type: 'subscriptions',
        id: '200',
        attributes: { user_email: email, status: 'active', renews_at: '2026-06-01T00:00:00.000Z' },
      },
    });
    const signature = await hmacSign(webhookBody, WEBHOOK_SECRET);
    await fetch(`${BASE}/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Signature': signature },
      body: webhookBody,
    });

    // Now recover
    const res = await fetch(`${BASE}/recover`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: json({ email }),
    });
    expect(res.status).toBe(200);
    const data = await res.json() as { found: boolean; key_count: number; active_count: number };
    expect(data.found).toBe(true);
    expect(data.key_count).toBeGreaterThanOrEqual(1);
    expect(data.active_count).toBeGreaterThanOrEqual(1);
  });
});

describe('GET /thank-you', () => {
  it('serves the thank-you HTML page', async () => {
    const res = await fetch(`${BASE}/thank-you`);
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    const html = await res.text();
    expect(html).toContain('Sync Activated');
  });
});

describe('404 handling', () => {
  it('returns 404 for unknown routes', async () => {
    const res = await fetch(`${BASE}/nonexistent`);
    expect(res.status).toBe(404);
  });
});
