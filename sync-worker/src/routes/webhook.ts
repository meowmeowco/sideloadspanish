import { get as getVariable } from '@spinframework/spin-variables';
import { generateKey, hashKey, generateAccountId } from '../lib/keys';
import { getLicense, setLicense, setEmailRecord, getEmailRecord, setClaimRecord } from '../lib/kv';
import type { LicenseRecord, EmailRecord } from '../lib/types';

const GRACE_PERIOD_DAYS = 7;

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * Verify Lemon Squeezy webhook signature (HMAC-SHA256).
 * Uses the raw body bytes to compute the digest.
 */
async function verifySignature(rawBody: Uint8Array, signature: string): Promise<boolean> {
  const secret = getVariable('lemon_webhook_secret');
  if (!secret) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );

  const sig = await crypto.subtle.sign('HMAC', key, rawBody);
  const hexDigest = Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  // Constant-time comparison
  if (hexDigest.length !== signature.length) return false;
  let mismatch = 0;
  for (let i = 0; i < hexDigest.length; i++) {
    mismatch |= hexDigest.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return mismatch === 0;
}

export async function handleWebhook(request: Request): Promise<Response> {
  const signature = request.headers.get('x-signature') || request.headers.get('X-Signature');
  if (!signature) {
    return json({ error: 'Missing signature' }, 401);
  }

  // Read raw body for signature verification
  const rawBody = new Uint8Array(await request.arrayBuffer());

  const valid = await verifySignature(rawBody, signature);
  if (!valid) {
    return json({ error: 'Invalid signature' }, 401);
  }

  // Parse the verified body
  const payload = JSON.parse(new TextDecoder().decode(rawBody));
  const eventName: string = payload.meta?.event_name;
  const attrs = payload.data?.attributes;

  if (!eventName || !attrs) {
    return json({ error: 'Malformed payload' }, 400);
  }

  switch (eventName) {
    case 'subscription_created':
      return await handleSubscriptionCreated(payload);
    case 'subscription_updated':
      return await handleSubscriptionUpdated(attrs);
    case 'subscription_cancelled':
      return await handleSubscriptionCancelled(attrs);
    case 'subscription_expired':
      return await handleSubscriptionExpired(attrs);
    case 'subscription_resumed':
      return await handleSubscriptionResumed(attrs);
    default:
      // Acknowledge unknown events without error
      return json({ ok: true, event: eventName, action: 'ignored' });
  }
}

async function handleSubscriptionCreated(payload: {
  meta: { custom_data?: { claim_token?: string } };
  data: { attributes: { user_email: string; renews_at: string; status: string } };
}): Promise<Response> {
  const attrs = payload.data.attributes;
  const claimToken: string | undefined = payload.meta.custom_data?.claim_token;

  // Generate license key
  const licenseKey = generateKey();
  const hashedKey = await hashKey(licenseKey);
  const accountId = generateAccountId();

  const license: LicenseRecord = {
    account_id: accountId,
    created: new Date().toISOString(),
    expires_at: attrs.renews_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    active: true,
  };

  setLicense(hashedKey, license);

  // Store email hash → key hash mapping for recovery
  if (attrs.user_email) {
    const emailHash = await hashKey(attrs.user_email.toLowerCase().trim());
    const existing = getEmailRecord(emailHash);
    const keyHashes = existing ? [...existing.key_hashes, hashedKey] : [hashedKey];
    const emailRecord: EmailRecord = { key_hashes: keyHashes };
    setEmailRecord(emailHash, emailRecord);
  }

  // Store claim record so the thank-you page can fetch the key
  if (claimToken) {
    setClaimRecord(claimToken, {
      license_key: licenseKey,
      account_id: accountId,
      created: new Date().toISOString(),
    });
  }

  return json({
    ok: true,
    event: 'subscription_created',
    account_id: accountId,
  }, 201);
}

async function handleSubscriptionUpdated(attrs: {
  renews_at?: string;
  status: string;
}): Promise<Response> {
  // On renewal, we'd need the key to update. LS sends the subscription ID
  // but not our license key. For now, this is a no-op acknowledgement.
  // In production, store subscription_id → key_hash mapping on creation.
  return json({ ok: true, event: 'subscription_updated', action: 'acknowledged' });
}

async function handleSubscriptionCancelled(attrs: {
  ends_at?: string;
  status: string;
}): Promise<Response> {
  // Subscription remains active until ends_at — no immediate action needed.
  // The key will expire naturally when ends_at passes.
  return json({ ok: true, event: 'subscription_cancelled', action: 'acknowledged' });
}

async function handleSubscriptionExpired(attrs: {
  ends_at?: string;
  status: string;
}): Promise<Response> {
  // Subscription has actually expired. Ideally we'd deactivate the key here.
  // Requires subscription_id → key_hash mapping (added in production).
  // Grace period purge is handled lazily in auth middleware.
  return json({ ok: true, event: 'subscription_expired', action: 'acknowledged' });
}

async function handleSubscriptionResumed(attrs: {
  renews_at?: string;
  status: string;
}): Promise<Response> {
  return json({ ok: true, event: 'subscription_resumed', action: 'acknowledged' });
}
