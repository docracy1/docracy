-- D1 is a derived search/audit index, never the source of truth — KV + R2 remain authoritative
-- for the signing engine. These tables only ever get rows for account-linked (paid connector)
-- documents; the anonymous free-tier flow never touches D1 at all.

CREATE TABLE accounts (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  created_at TEXT NOT NULL,
  is_paid INTEGER NOT NULL DEFAULT 0,
  paid_at TEXT,
  last_login_at TEXT
);

-- Single-use magic-link tokens. Only a hash of the emailed token is stored, never the raw value.
CREATE TABLE magic_links (
  token_hash TEXT PRIMARY KEY,
  email TEXT NOT NULL COLLATE NOCASE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  consumed_at TEXT,
  requested_ip TEXT
);
CREATE INDEX idx_magic_links_email ON magic_links(email);
CREATE INDEX idx_magic_links_expires ON magic_links(expires_at);

CREATE TABLE sessions (
  token_hash TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  user_agent TEXT,
  ip TEXT
);
CREATE INDEX idx_sessions_account ON sessions(account_id);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);

CREATE TABLE oauth_authorizations (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  client_id TEXT NOT NULL,
  authorized_at TEXT NOT NULL,
  revoked_at TEXT
);
CREATE INDEX idx_oauth_auth_account ON oauth_authorizations(account_id);

CREATE TABLE documents (
  doc_id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL,
  preparer_signs INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  completed_at TEXT,
  expires_at TEXT NOT NULL
);
CREATE INDEX idx_documents_account ON documents(account_id);
CREATE INDEX idx_documents_account_status ON documents(account_id, status);
CREATE INDEX idx_documents_account_created ON documents(account_id, created_at);

CREATE VIRTUAL TABLE documents_fts USING fts5(
  doc_id UNINDEXED,
  title,
  content=''
);

CREATE TABLE signers (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
  "order" INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  status TEXT NOT NULL,
  signed_at TEXT,
  link_sent_at TEXT,
  UNIQUE(doc_id, "order")
);
CREATE INDEX idx_signers_doc ON signers(doc_id);
CREATE INDEX idx_signers_email ON signers(email COLLATE NOCASE);
CREATE INDEX idx_signers_company ON signers(company COLLATE NOCASE);
CREATE INDEX idx_signers_name ON signers(name COLLATE NOCASE);

CREATE TABLE document_versions (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  r2_key TEXT NOT NULL,
  created_at TEXT NOT NULL,
  triggered_by_signer_order INTEGER,
  byte_size INTEGER,
  UNIQUE(doc_id, version_number)
);
CREATE INDEX idx_versions_doc ON document_versions(doc_id, version_number);

CREATE TABLE audit_events (
  id TEXT PRIMARY KEY,
  doc_id TEXT NOT NULL REFERENCES documents(doc_id) ON DELETE CASCADE,
  account_id TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'created' | 'invite_sent' | 'viewed' | 'signed' | 'reminder_sent' | 'link_resent' | 'completed'
  signer_order INTEGER,
  actor_label TEXT,
  detail TEXT,
  ip TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX idx_audit_doc ON audit_events(doc_id, created_at);
CREATE INDEX idx_audit_account ON audit_events(account_id, created_at);
