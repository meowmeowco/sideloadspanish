import { hashKey } from '../lib/keys';
import { getEmailRecord, getLicense } from '../lib/kv';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * POST /recover — look up keys associated with an email.
 *
 * Privacy model: we don't return full keys. In production, this would
 * trigger an email with the key(s). For now, we return the count of
 * associated keys and whether any are active — enough for the user
 * to know recovery is possible.
 *
 * Full email delivery is a production concern (Lemon Squeezy transactional
 * email or SMTP integration).
 */
export async function handleRecover(request: Request): Promise<Response> {
  let body: { email?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.email || typeof body.email !== 'string') {
    return json({ error: 'Missing email' }, 400);
  }

  const emailHash = await hashKey(body.email.toLowerCase().trim());
  const emailRecord = getEmailRecord(emailHash);

  if (!emailRecord || emailRecord.key_hashes.length === 0) {
    // Don't reveal whether the email exists
    return json({
      found: false,
      message: 'If this email has an associated key, you will receive it shortly.',
    });
  }

  // Check how many keys are active
  let activeCount = 0;
  for (const keyHash of emailRecord.key_hashes) {
    const license = getLicense(keyHash);
    if (license?.active) activeCount++;
  }

  return json({
    found: true,
    key_count: emailRecord.key_hashes.length,
    active_count: activeCount,
    message: 'If this email has an associated key, you will receive it shortly.',
  });
}
