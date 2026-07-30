/**
 * Browser-local pending claim for anonymous document creates.
 * The claimToken is never put in the URL — only localStorage — and is redeemed
 * after signup via POST /api/account/documents/claim.
 */

const STORAGE_KEY = "docracy:pendingClaim";

export interface PendingClaim {
  docId: string;
  claimToken: string;
  savedAt: string;
}

export function savePendingClaim(docId: string, claimToken: string): void {
  try {
    const payload: PendingClaim = { docId, claimToken, savedAt: new Date().toISOString() };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // private mode / quota — claim just won't auto-redeem
  }
}

export function readPendingClaim(): PendingClaim | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as PendingClaim;
    if (!parsed?.docId || !parsed?.claimToken) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearPendingClaim(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

/** True when this browser created the anonymous doc and still has its claim token. */
export function hasPendingClaimForDoc(docId: string): boolean {
  const pending = readPendingClaim();
  return !!pending && pending.docId === docId;
}
