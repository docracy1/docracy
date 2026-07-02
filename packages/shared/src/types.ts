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
}

export interface Env {
  DOCRACY_KV: KVNamespace;
  DOCRACY_DOCS: R2Bucket;
  /** Only bound in apps/worker (writer) and apps/connector (reader) once the D1 phase lands. */
  DOCRACY_DB?: D1Database;
  TOKEN_SECRET: string;
  RESEND_API_KEY?: string;
  PUBLIC_APP_URL: string;
  FREE_TIER_MAX_SIGNERS: string;
  DOC_TTL_DAYS: string;
}
