-- Team accounts (shared workspace) and white-label branding, both paid-tier features.

-- An optional custom logo for the workspace's signing pages and emails — null means "use the
-- default Docracy wordmark". Stored on the workspace owner's own account row, since every
-- workspace's identity is its owner's account id (team_members below always resolves back to it).
ALTER TABLE accounts ADD COLUMN logo_r2_key TEXT;

-- Single-use email invites to join a workspace, same token-hash pattern as magic_links.
CREATE TABLE team_invites (
  id TEXT PRIMARY KEY,
  owner_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL COLLATE NOCASE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  accepted_at TEXT
);
CREATE INDEX idx_team_invites_owner ON team_invites(owner_account_id);
CREATE INDEX idx_team_invites_expires ON team_invites(expires_at);

-- A member account belongs to at most one workspace (UNIQUE member_account_id) — the owner's own
-- account is implicitly the workspace root and never gets a row here. One subscription, multiple
-- logins, shared document/template/webhook visibility scoped by owner_account_id.
CREATE TABLE team_members (
  id TEXT PRIMARY KEY,
  owner_account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  member_account_id TEXT NOT NULL UNIQUE REFERENCES accounts(id) ON DELETE CASCADE,
  joined_at TEXT NOT NULL
);
CREATE INDEX idx_team_members_owner ON team_members(owner_account_id);
