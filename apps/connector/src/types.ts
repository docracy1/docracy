/**
 * Deliberately narrower than @docracy/shared's Env — this worker only binds a read-only KV
 * namespace and the token secret (see wrangler.toml), not the full docracy-worker binding set
 * (R2, D1, Resend key, etc.). Using the shared Env type here would claim bindings this worker
 * doesn't actually have.
 */
export interface ConnectorEnv {
  DOCRACY_KV: KVNamespace;
  TOKEN_SECRET: string;
  /** Read-only — paid tools (find_documents) query the same index docracy-worker writes to.
   *  Optional so the connector still works (free tier only) before this binding exists. */
  DOCRACY_DB?: D1Database;
}
