export type DocFieldType = "signature" | "initials" | "text" | "date";

/**
 * `type` is optional and always read via `field.type ?? "signature"` — every field placed before
 * this property existed is a signature field, and treating a missing type as anything else would
 * silently reinterpret already-created, in-flight documents.
 */
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
  /** HMAC-SHA256 hex digest of an optional PIN the preparer set for this signer, never the raw
   *  PIN — see lib/signUnlock.ts. Absent entirely for the (default) no-PIN case. */
  pinHash?: string;
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
  /** "sequential" (default) means only the current signer in order may act — the flow this app
   *  started with. "parallel" means every signer gets their invite at once and any of them may
   *  act in any order; completion still just means "no signer remains pending." Optional and
   *  always read via `doc.signingMode ?? "sequential"` so every document created before this
   *  field existed keeps behaving exactly as before. */
  signingMode?: "sequential" | "parallel";
  signers: Signer[];
  fields: DocField[];
  /** Optional so any doc written before this field existed still deserializes — always read via
   *  `doc.events ?? []`, never assume it's present. */
  events?: AuditEvent[];
  /** RFC 3161 trusted timestamp over the final signed PDF's hash, from a third-party Time-Stamp
   *  Authority (see lib/timestamp.ts) — proves the document existed at this time independent of
   *  Docracy's own clock/servers. Best-effort: absent if the TSA was unreachable when the last
   *  signer completed, never blocks completion. */
  timestampToken?: string;
  timestampGenTime?: string;
  /** Preparer-supplied overrides for the signing-invite email, applied to every invite in the
   *  chain (not just the first) — read fresh off the doc at each send, since sequential mode sends
   *  invites one at a time as the chain advances. Falls back to the default subject/copy when
   *  absent. Length-capped at creation (see routes/documents.ts). */
  customSubject?: string;
  customMessage?: string;
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
  /** This worker's own public origin (e.g. https://docracy-worker.rl-d77.workers.dev) — used only
   *  to build absolute URLs to this worker's own routes for contexts that can't use a relative
   *  path, like a custom workspace logo embedded in an outbound email. Optional: emails just fall
   *  back to the default Docracy wordmark until this is set. */
  PUBLIC_WORKER_URL?: string;
}
