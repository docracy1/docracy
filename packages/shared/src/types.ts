/**
 * Every field is a signature field — signing it burns in the drawn signature plus the signer's
 * email and the date automatically (see pdf.ts's burnFields), so there's nothing else to place.
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

export interface Signer {
  order: number;
  name: string;
  email: string;
  /** Optional — lets the paid connector's find_documents search by company. Never required. */
  company?: string;
  status: "pending" | "signed";
  signedAt: string | null;
  linkSentAt: string | null;
  remindersSent: number[];
}

export type AuditEventType = "created" | "invite_sent" | "consented" | "signed" | "completed";

/**
 * One entry in a document's append-only event log — this is what gives an anonymous, no-account
 * signature real evidentiary weight (who did what, from where, when). Stored directly on the
 * KV-resident DocState rather than in D1, since anonymous docs (100% of traffic today) never
 * touch D1 at all.
 */
export interface AuditEvent {
  type: AuditEventType;
  signerOrder: number | null;
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
  /** SHA-256 hex digest of the PDF at this point in the chain — present only for "created" |
   *  "signed" | "completed", the three events where the PDF bytes actually changed. Lets anyone
   *  verify later that a given PDF matches what was actually signed, without trusting Docracy's
   *  servers to still be running. */
  pdfSha256: string | null;
}

export interface DocState {
  docId: string;
  /** null for every anonymous document (the entire product today). Only set when a logged-in
   *  paid account creates a document via the connector's upload route. */
  accountId: string | null;
  /** null for anonymous documents. Defaults to the uploaded filename for account-linked ones. */
  title: string | null;
  createdAt: string;
  expiresAt: string;
  preparerSigns: boolean;
  status: "pending" | "completed";
  completedAt: string | null;
  signers: Signer[];
  fields: DocField[];
  /** Optional so any doc written before this field existed still deserializes — always read via
   *  `doc.events ?? []`, never assume it's present. */
  events?: AuditEvent[];
}

export interface Env {
  DOCRACY_KV: KVNamespace;
  DOCRACY_DOCS: R2Bucket;
  /** Only bound in apps/worker (writer) and apps/connector (reader) once the D1 phase lands. */
  DOCRACY_DB?: D1Database;
  TOKEN_SECRET: string;
  RESEND_API_KEY?: string;
  PUBLIC_APP_URL: string;
  /** Base URL of the deployed MCP connector (apps/connector) — used only to build the ready-to-
   *  paste connector URL returned by the API-token endpoints. */
  PUBLIC_CONNECTOR_URL: string;
  FREE_TIER_MAX_SIGNERS: string;
  DOC_TTL_DAYS: string;
  FEEDBACK_EMAIL: string;
  /** Absent until a real Stripe account exists — billing routes must degrade gracefully (501),
   *  never throw, when these are unset. See lib/billing.ts. */
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  /** The Stripe Price ID for the paid subscription (created in the Stripe dashboard). */
  STRIPE_PRICE_ID?: string;
}
