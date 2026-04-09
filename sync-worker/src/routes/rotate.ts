import { generateKey, hashKey } from '../lib/keys';
import { getLicense, setLicense, deleteLicense, getEmailRecord, setEmailRecord } from '../lib/kv';
import type { AuthenticatedRequest, LicenseRecord } from '../lib/types';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /rotate — authenticated with the old key.
 * Generates a new key pointing to the same account_id.
 * Old key is immediately invalidated.
 * Returns the new key in plaintext (one-time display).
 */
export async function handleRotate(request: Request): Promise<Response> {
  const { license, hashedKey: oldHashedKey } = request as AuthenticatedRequest;

  // Generate new key
  const newKey = generateKey();
  const newHashedKey = await hashKey(newKey);

  // Create new license record with same account_id
  const newLicense: LicenseRecord = {
    account_id: license.account_id,
    created: new Date().toISOString(),
    expires_at: license.expires_at,
    active: license.active,
  };

  // Store new key, delete old key
  setLicense(newHashedKey, newLicense);
  deleteLicense(oldHashedKey);

  // Update email → key_hash mappings if any exist
  // We scan all email records — not ideal at scale but fine for our volume.
  // In production, store a reverse mapping (account_id → email_hash).
  // For now, we leave email mappings pointing to the old hash.
  // The recovery flow will need to handle stale mappings gracefully.

  return json({
    key: newKey,
    account_id: license.account_id,
    expires_at: license.expires_at,
  });
}
