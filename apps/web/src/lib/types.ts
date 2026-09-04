export type DocFieldType = "signature" | "initials" | "text" | "date" | "checkbox" | "dropdown";

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
  /** Dropdown only — at least two choices. */
  options?: string[];
}

export interface SignerInput {
  order: number;
  name: string;
  email: string;
  /** Optional 4-8 digit PIN gating this signer's link — never sent back to the client once set. */
  pin?: string;
  /** How Docracy should deliver `pin` to this signer, ~30 seconds after the signing link — omitted
   *  means the preparer will tell them the PIN themselves (the original, still-default behavior).
   *  Required whenever whatsappPhone is set. */
  pinDeliveryChannel?: "email" | "whatsapp" | "sms";
  phone?: string;
  smsCarrier?: "att" | "tmobile" | "verizon" | "sprint" | "uscc";
  /** International phone number for the WhatsApp channel — requires a signed-up account. */
  whatsappPhone?: string;
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

export interface SignerAttachmentGroup {
  order: number;
  name: string;
  attachments: Array<{ id: string; name: string; sizeBytes: number; uploadedAt: string }>;
}

export interface StatusPayload {
  docId: string;
  status: "pending" | "completed" | "voided";
  signers: StatusSigner[];
  ccRecipients?: StatusCcRecipient[];
  signerAttachmentGroups?: SignerAttachmentGroup[];
  voidedAt?: string | null;
  voidReason?: string;
  voidedBy?: "preparer" | "decline" | null;
  /** False for CC viewer tokens (order -1); preparer status links omit or true. */
  canVoid?: boolean;
  /** Path (not a full URL — see apiUrl in lib/api.ts) to the workspace's custom logo, in place of
   *  the default Docracy wordmark. Null/absent for anonymous documents or workspaces with none. */
  brandLogoPath?: string | null;
  /** Cosmetic workspace label shown alongside the logo — plain text, not a subdomain/route. Null/
   *  absent for anonymous documents or workspaces that haven't set one. */
  brandWorkspaceSlug?: string | null;
  /** Sender-owned payment link shown after everyone has signed. */
  paymentRequest?: { amount: string; currency: string; url: string };
}
