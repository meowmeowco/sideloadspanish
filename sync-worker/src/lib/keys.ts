const KEY_REGEX = /^SL-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

export function isValidKeyFormat(key: string): boolean {
  return KEY_REGEX.test(key);
}

export function generateKey(): string {
  const segment = (): string => {
    const bytes = crypto.getRandomValues(new Uint8Array(4));
    return Array.from(bytes)
      .map((b) => CHARSET[b % CHARSET.length])
      .join('');
  };
  return `SL-${segment()}-${segment()}-${segment()}`;
}

export async function hashKey(key: string): Promise<string> {
  const encoded = new TextEncoder().encode(key);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateAccountId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
