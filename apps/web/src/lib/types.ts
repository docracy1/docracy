/**
 * Every field is a signature field — signing it burns in the drawn signature plus the signer's
 * email and the date automatically, so there's nothing else to place.
 */
export interface DocField {
  id: string;
  signerOrder: number;
  page: number;
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
}

export interface SignerInput {
  order: number;
  name: string;
  email: string;
}

export interface StatusSigner {
  order: number;
  name: string;
  status: "pending" | "signed";
  signedAt: string | null;
}

export interface StatusPayload {
  docId: string;
  status: "pending" | "completed";
  signers: StatusSigner[];
}
