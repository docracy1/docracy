-- One active MCP connector token per paid account. Only a hash of the token is stored, never the
-- raw value — same convention as magic_links/sessions. UNIQUE(account_id) enforces "one active
-- token per account" as a DB invariant: issuing a new one requires deleting the old row first.
CREATE TABLE api_tokens (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  last_used_at TEXT
);
