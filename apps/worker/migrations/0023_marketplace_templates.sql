-- Community-submitted templates for the public Marketplace (apps/web's /free-templates page,
-- rebranded "Marketplace"). A paid workspace can submit one of its own saved `templates` rows;
-- this snapshots the PDF + fields at submission time into its own row/R2 object rather than
-- referencing the original live template, so a later edit or deletion of the private template
-- never silently changes (or breaks) something already public.
--
-- status: 'pending' (default, awaiting admin review — never publicly listed), 'approved'
-- (publicly listed), 'rejected' (kept for the submitter's own record, never listed). There is no
-- fully-automatic publish path — every row starts 'pending' and only an admin approval flips it.
CREATE TABLE marketplace_templates (
  id TEXT PRIMARY KEY,
  account_id TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  source_template_id TEXT, -- the private templates.id this was submitted from, if it still exists
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
CREATE INDEX idx_marketplace_templates_account ON marketplace_templates(account_id, submitted_at);
CREATE INDEX idx_marketplace_templates_status ON marketplace_templates(status, submitted_at);
