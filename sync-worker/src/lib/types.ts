export interface LicenseRecord {
  readonly account_id: string;
  readonly created: string;
  readonly expires_at: string;
  readonly active: boolean;
}

export interface SyncBlob {
  readonly iv: string;
  readonly ciphertext: string;
  readonly updated_at: string;
}

export interface EmailRecord {
  readonly key_hashes: readonly string[];
}

export interface ClaimRecord {
  readonly license_key: string;
  readonly account_id: string;
  readonly created: string;
}

// itty-router middleware attaches these to the request object
export interface AuthenticatedRequest extends Request {
  license: LicenseRecord;
  hashedKey: string;
}
