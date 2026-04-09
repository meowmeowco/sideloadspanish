import { isValidKeyFormat, hashKey } from '../lib/keys';
import { getLicense, deleteSyncBlob } from '../lib/kv';
import type { AuthenticatedRequest } from '../lib/types';

const GRACE_PERIOD_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function jsonError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isPastGracePeriod(expiresAt: string): boolean {
  const expiry = new Date(expiresAt).getTime();
  return Date.now() > expiry + GRACE_PERIOD_MS;
}

export async function withAuth(request: Request): Promise<Response | void> {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonError('Missing authorization', 401);
  }

  const rawKey = authHeader.slice(7);

  if (!isValidKeyFormat(rawKey)) {
    return jsonError('Invalid key format', 401);
  }

  const hashedKey = await hashKey(rawKey);
  const license = getLicense(hashedKey);

  if (!license) {
    return jsonError('Unknown key', 401);
  }

  // Lazy grace period purge (no cron in Spin)
  if (!license.active && isPastGracePeriod(license.expires_at)) {
    deleteSyncBlob(license.account_id);
  }

  if (!license.active) {
    return jsonError('Subscription expired', 403);
  }

  // Attach auth context for downstream handlers
  const req = request as AuthenticatedRequest;
  req.license = license;
  req.hashedKey = hashedKey;
}
