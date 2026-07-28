-- Saved contacts for paid workspaces (Prepare autocomplete + reassignment).
CREATE TABLE contacts (
  id TEXT PRIMARY KEY,
  workspace_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE,
  company TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(workspace_id, email)
);
CREATE INDEX idx_contacts_workspace ON contacts(workspace_id);
CREATE INDEX idx_contacts_email ON contacts(email COLLATE NOCASE);
