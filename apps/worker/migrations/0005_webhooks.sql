-- Outbound webhook subscriptions for paid accounts, notified on document lifecycle events.
-- The secret is stored in recoverable form (not hashed) because it's used live as an HMAC signing
-- key on every delivery — shown once at creation, like the connector API token flow, and never
-- re-returned by the list endpoint. `events` is a JSON-serialized string array, same convention as
-- templates' `fields` column.
CREATE TABLE webhooks (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT NOT NULL,
  events TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_webhooks_account ON webhooks(account_id, created_at);
