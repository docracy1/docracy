/**
 * Deliberately narrower than @docracy/shared's Env — this worker only binds a read-only KV
 * namespace and the token secret (see wrangler.toml), not the full docracy-worker binding set
 * (R2, D1, Resend key, etc.). Using the shared Env type here would claim bindings this worker
 * doesn't actually have.
 */
export interface ConnectorEnv {
  DOCRACY_KV: KVNamespace;
  TOKEN_SECRET: string;
  /** Read-only — find_documents queries the same index docracy-worker writes to.
   *  Optional so local/dev can run without D1 (find_documents then returns []). Auth still
   *  requires a valid paid API token via KV (+ D1 is_paid when this binding exists). */
  DOCRACY_DB?: D1Database;
}
