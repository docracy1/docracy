-- Reusable document templates for paid accounts: a saved PDF + its placed signature-field
-- positions, so a new document can start pre-filled instead of every field being re-placed by
-- hand each time. Fields are stored as a JSON-serialized DocField[] rather than normalized rows —
-- they're only ever read/written whole (never queried by individual field), same reasoning as
-- storing DocState whole in KV for documents.
CREATE TABLE templates (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  signer_count INTEGER NOT NULL,
  page_count INTEGER NOT NULL,
  fields TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_templates_account ON templates(account_id, created_at);
