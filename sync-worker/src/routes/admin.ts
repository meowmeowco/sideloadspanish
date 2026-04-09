import { generateKey, hashKey, generateAccountId } from '../lib/keys';
import { setLicense } from '../lib/kv';
import type { LicenseRecord } from '../lib/types';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleCreateKey(request: Request): Promise<Response> {
  // Dev-only: gated by X-Admin-Secret header
  const secret = request.headers.get('X-Admin-Secret');
  if (secret !== 'dev-secret') {
    return json({ error: 'Unauthorized' }, 401);
  }

  const key = generateKey();
  const hashedKey = await hashKey(key);
  const accountId = generateAccountId();

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

  const license: LicenseRecord = {
    account_id: accountId,
    created: now.toISOString(),
    expires_at: expiresAt.toISOString(),
    active: true,
  };

  setLicense(hashedKey, license);

  return json({
    key,
    account_id: accountId,
    expires_at: license.expires_at,
  }, 201);
}
