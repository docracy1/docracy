-- Language preference for account-level emails (magic link, team invite, onboarding drip) and the
-- anonymous preparer-lead drip. NULL means "not captured yet" (accounts/leads created before this
-- migration) — always read via `row.locale ?? "en"`, never assume NOT NULL.
ALTER TABLE accounts ADD COLUMN locale TEXT;
ALTER TABLE onboarding_leads ADD COLUMN locale TEXT;
