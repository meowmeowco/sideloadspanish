import { openDefault, type Store } from '@spinframework/spin-kv';
import type { LicenseRecord, SyncBlob, EmailRecord, ClaimRecord } from './types';

const PREFIX = {
  LICENSE: 'license:',
  SYNC: 'sync:',
  EMAIL: 'email:',
  CLAIM: 'claim:',
} as const;

function store(): Store {
  return openDefault();
}

// ── License records ──

export function getLicense(hashedKey: string): LicenseRecord | null {
  const s = store();
  const key = `${PREFIX.LICENSE}${hashedKey}`;
  if (!s.exists(key)) return null;
  return s.getJson(key) as LicenseRecord;
}

export function setLicense(hashedKey: string, record: LicenseRecord): void {
  store().setJson(`${PREFIX.LICENSE}${hashedKey}`, record);
}

export function deleteLicense(hashedKey: string): void {
  store().delete(`${PREFIX.LICENSE}${hashedKey}`);
}

// ── Sync blobs ──

export function getSyncBlob(accountId: string): SyncBlob | null {
  const s = store();
  const key = `${PREFIX.SYNC}${accountId}`;
  if (!s.exists(key)) return null;
  return s.getJson(key) as SyncBlob;
}

export function setSyncBlob(accountId: string, blob: SyncBlob): void {
  store().setJson(`${PREFIX.SYNC}${accountId}`, blob);
}

export function deleteSyncBlob(accountId: string): void {
  store().delete(`${PREFIX.SYNC}${accountId}`);
}

// ── Email records ──

export function getEmailRecord(hashedEmail: string): EmailRecord | null {
  const s = store();
  const key = `${PREFIX.EMAIL}${hashedEmail}`;
  if (!s.exists(key)) return null;
  return s.getJson(key) as EmailRecord;
}

export function setEmailRecord(hashedEmail: string, record: EmailRecord): void {
  store().setJson(`${PREFIX.EMAIL}${hashedEmail}`, record);
}

// ── Claim tokens (checkout → key delivery) ──

export function getClaimRecord(token: string): ClaimRecord | null {
  const s = store();
  const key = `${PREFIX.CLAIM}${token}`;
  if (!s.exists(key)) return null;
  return s.getJson(key) as ClaimRecord;
}

export function setClaimRecord(token: string, record: ClaimRecord): void {
  store().setJson(`${PREFIX.CLAIM}${token}`, record);
}

export function deleteClaimRecord(token: string): void {
  store().delete(`${PREFIX.CLAIM}${token}`);
}
