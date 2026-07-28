export type DocFieldType = "signature" | "initials" | "text" | "date" | "checkbox";

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
  /** Checkbox only: when false, the signer may leave it unchecked. Absent/true = required. */
  required?: boolean;
}

export interface SignerInput {
  order: number;
  name: string;
  email: string;
  /** Optional 4-8 digit PIN gating this signer's link — never sent back to the client once set. */
  pin?: string;
}

export interface CcRecipientInput {
  name?: string;
  email: string;
}

export interface StatusSigner {
  order: number;
  name: string;
  status: "pending" | "signed" | "declined";
  signedAt: string | null;
  declinedAt?: string | null;
}

export interface StatusCcRecipient {
  name?: string;
  email: string;
}

export interface StatusPayload {
  docId: string;
  status: "pending" | "completed" | "voided";
  signers: StatusSigner[];
  ccRecipients?: StatusCcRecipient[];
  voidedAt?: string | null;
  voidReason?: string;
  voidedBy?: "preparer" | "decline" | null;
  /** Path (not a full URL — see apiUrl in lib/api.ts) to the workspace's custom logo, in place of
   *  the default Docracy wordmark. Null/absent for anonymous documents or workspaces with none. */
  brandLogoPath?: string | null;
  /** Cosmetic workspace label shown alongside the logo — plain text, not a subdomain/route. Null/
   *  absent for anonymous documents or workspaces that haven't set one. */
  brandWorkspaceSlug?: string | null;
}
