-- Cosmetic workspace label shown on branded sign/status pages and outbound emails alongside the
-- existing custom logo (see lib/branding.ts) — letters/numbers only, no subdomain routing.
ALTER TABLE accounts ADD COLUMN workspace_slug TEXT;
CREATE UNIQUE INDEX idx_accounts_workspace_slug ON accounts(workspace_slug COLLATE NOCASE);
