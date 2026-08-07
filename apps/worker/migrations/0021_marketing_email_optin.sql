-- Consent columns for the new opt-in marketing/product-update email system (see
-- lib/marketingUnsubscribe.ts, lib/marketingEmail.ts, and the admin "Marketing Email" tool in
-- routes/admin.ts). Both default to the safe "no consent yet" state so this migration alone never
-- opts an existing row into anything.
--
-- marketing_opt_in: an account explicitly ticked "Send me occasional product news and updates" in
-- Dashboard settings (PATCH /api/account/marketing-opt-in). Distinct from is_paid — free and paid
-- accounts alike can opt in.
--
-- marketing_unsubscribed: an onboarding_leads row (the existing tips-drip opt-in from
-- migration 0016) that clicked the one-click unsubscribe link on a marketing broadcast. The row
-- itself is never deleted on unsubscribe — that would also kill the still-consented tips drip
-- (onboardingEmails.ts), which is a separate, already-opted-in flow this migration must not touch.
ALTER TABLE accounts ADD COLUMN marketing_opt_in INTEGER NOT NULL DEFAULT 0;
ALTER TABLE onboarding_leads ADD COLUMN marketing_unsubscribed INTEGER NOT NULL DEFAULT 0;
