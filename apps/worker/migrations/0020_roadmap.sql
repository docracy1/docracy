-- Public roadmap: admin adds/removes proposed features, anyone can vote yes/no with no account
-- needed (deduped by an anonymous voter-id cookie, same convention as docracy_notrack).
CREATE TABLE roadmap_features (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE roadmap_votes (
  feature_id TEXT NOT NULL,
  voter_id TEXT NOT NULL,
  vote TEXT NOT NULL CHECK (vote IN ('yes', 'no')),
  created_at TEXT NOT NULL,
  PRIMARY KEY (feature_id, voter_id)
);
CREATE INDEX idx_roadmap_votes_feature ON roadmap_votes(feature_id);

-- Seed with an initial candidate list spanning reach, enterprise-readiness, workflow depth, and
-- the crypto-signing question raised in planning — real votes decide what actually gets built.
INSERT INTO roadmap_features (id, title, description, created_at) VALUES
  ('mobile-apps', 'Native mobile apps (iOS/Android)', 'Prepare, send, and sign documents from a real phone app, not just a mobile browser.', '2026-08-02T00:00:00.000Z'),
  ('doc-versioning', 'Document version comparison', 'See exactly what changed between two versions of a contract before you sign — line-by-line redlining.', '2026-08-02T00:00:00.000Z'),
  ('kiosk-signing', 'In-person / kiosk signing mode', 'Hand someone a tablet to sign on the spot — no email round-trip needed.', '2026-08-02T00:00:00.000Z'),
  ('custom-domain', 'Custom signing-link domain', 'Send signing links from your own subdomain (sign.yourcompany.com) instead of docracy.io.', '2026-08-02T00:00:00.000Z'),
  ('sso-saml', 'SSO / SAML for teams', 'Enterprise single sign-on for team accounts, instead of magic-link-only login.', '2026-08-02T00:00:00.000Z'),
  ('bulk-send-ui', 'Bulk send from one template', 'Send the same template to a whole list of recipients at once, right from the Dashboard — not just via Zapier.', '2026-08-02T00:00:00.000Z'),
  ('wallet-signing', 'Wallet-based signing (MetaMask / WalletConnect)', 'Sign documents using a crypto wallet instead of typing a name — binds the wallet address to the document.', '2026-08-02T00:00:00.000Z'),
  ('onchain-notarization', 'On-chain notarization', 'Optionally anchor a signed document''s hash on a cheap chain (Polygon/Base) for a tamper-proof, independently verifiable audit trail.', '2026-08-02T00:00:00.000Z'),
  ('more-languages', 'More languages beyond English/Spanish', 'French, German, and Portuguese UI and email support.', '2026-08-02T00:00:00.000Z'),
  ('crm-integrations', 'Deeper CRM integrations', 'Native HubSpot / Salesforce connectors, beyond what Zapier already covers.', '2026-08-02T00:00:00.000Z'),
  ('reminder-schedule', 'Configurable reminder schedule', 'Choose how often and when signers get nudged, instead of the fixed default cadence.', '2026-08-02T00:00:00.000Z');
