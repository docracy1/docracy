-- Enterprise deals are paid as a one-time Stripe charge (see 0007_enterprise.sql), not a
-- recurring subscription — Stripe never sends a follow-up "this lapsed" event for those, so
-- expiry has to be tracked and enforced here instead. Set once, a year out, when the account is
-- first flagged enterprise (lib/billing.ts's markAccountEnterprise); enforced by the daily sweep
-- in lib/enterpriseExpiry.ts.

ALTER TABLE accounts ADD COLUMN enterprise_expires_at TEXT;
