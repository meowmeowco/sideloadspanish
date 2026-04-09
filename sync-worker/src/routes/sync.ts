import { getSyncBlob, setSyncBlob } from '../lib/kv';
import type { AuthenticatedRequest, SyncBlob } from '../lib/types';

const MAX_CIPHERTEXT_LENGTH = 1_400_000; // ~1MB base64

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export function handleGetSync(request: Request): Response {
  const { license } = request as AuthenticatedRequest;
  const blob = getSyncBlob(license.account_id);
  return json({ data: blob ?? null });
}

export async function handlePutSync(request: Request): Promise<Response> {
  const { license } = request as AuthenticatedRequest;

  let body: { iv?: string; ciphertext?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ error: 'Invalid JSON' }, 400);
  }

  if (!body.iv || typeof body.iv !== 'string') {
    return json({ error: 'Missing or invalid iv' }, 400);
  }
  if (!body.ciphertext || typeof body.ciphertext !== 'string') {
    return json({ error: 'Missing or invalid ciphertext' }, 400);
  }
  if (body.ciphertext.length > MAX_CIPHERTEXT_LENGTH) {
    return json({ error: 'Payload too large' }, 413);
  }

  const blob: SyncBlob = {
    iv: body.iv,
    ciphertext: body.ciphertext,
    updated_at: new Date().toISOString(),
  };

  setSyncBlob(license.account_id, blob);

  return json({ ok: true, updated_at: blob.updated_at });
}
