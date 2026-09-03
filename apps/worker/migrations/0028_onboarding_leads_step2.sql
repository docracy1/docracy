-- Day-2 Docstoc-style check-in for preparer marketing opt-ins (same cadence as account
-- onboarding step2). Account drip already had step2_sent_at from migration 0013; leads did not.
ALTER TABLE onboarding_leads ADD COLUMN step2_sent_at TEXT;
