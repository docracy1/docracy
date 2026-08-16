-- Marketplace submission opens up to everyone, not just paid accounts with an existing saved
-- template — account_id becomes nullable so an anonymous (or free-tier, no-saved-template)
-- visitor can submit a document straight from Prepare.tsx. SQLite can't ALTER a column's NOT NULL
-- constraint directly, hence the recreate-and-copy (table is new/near-empty, so this is cheap).
ALTER TABLE marketplace_templates RENAME TO marketplace_templates_old;

CREATE TABLE marketplace_templates (
  id TEXT PRIMARY KEY,
  account_id TEXT REFERENCES accounts(id) ON DELETE CASCADE,
  source_template_id TEXT,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  category TEXT,
  description TEXT NOT NULL DEFAULT '',
  signer_count INTEGER NOT NULL,
  page_count INTEGER NOT NULL,
  fields TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  rejection_reason TEXT,
  submitted_at TEXT NOT NULL,
  reviewed_at TEXT,
  reviewed_by TEXT
);
INSERT INTO marketplace_templates SELECT * FROM marketplace_templates_old;
DROP TABLE marketplace_templates_old;

CREATE INDEX idx_marketplace_templates_account ON marketplace_templates(account_id, submitted_at);
CREATE INDEX idx_marketplace_templates_status ON marketplace_templates(status, submitted_at);
