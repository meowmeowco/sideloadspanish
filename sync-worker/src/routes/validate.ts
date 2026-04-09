import { isValidKeyFormat, hashKey } from '../lib/keys';
import { getLicense } from '../lib/kv';

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function handleValidate(request: Request): Promise<Response> {
  let body: { key?: string };
  try {
    body = await request.json() as typeof body;
  } catch {
    return json({ valid: false, error: 'Invalid JSON' }, 400);
  }

  if (!body.key || !isValidKeyFormat(body.key)) {
    return json({ valid: false, error: 'Invalid key format' }, 400);
  }

  const hashed = await hashKey(body.key);
  const license = getLicense(hashed);

  if (!license) {
    return json({ valid: false, error: 'Unknown key' }, 404);
  }

  return json({
    valid: true,
    active: license.active,
    expires_at: license.expires_at,
    account_id: license.account_id,
  });
}
