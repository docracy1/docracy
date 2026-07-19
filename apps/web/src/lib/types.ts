export type DocFieldType = "signature" | "initials" | "text" | "date";

/** `type` is optional and always read via `field.type ?? "signature"` — see the matching comment
 *  in packages/shared/src/types.ts (this is a deliberate frontend-only duplicate of that type). */
export interface DocField {
  id: string;
  signerOrder: number;
  page: number;
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
  type?: DocFieldType;
}

export interface SignerInput {
  order: number;
  name: string;
  email: string;
  /** Optional 4-8 digit PIN gating this signer's link — never sent back to the client once set. */
  pin?: string;
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
