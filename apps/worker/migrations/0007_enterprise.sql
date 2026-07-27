-- Enterprise/custom-plan flag. Enterprise deals are hand-negotiated and paid via a Stripe Payment
-- Link sent directly to the customer (not the self-serve $10/mo checkout in routes/billing.ts), so
-- there's no separate "enterprise checkout" flow to build — the webhook just checks whether the
-- completed session's metadata says plan=enterprise (set once on the Payment Link itself in the
-- Stripe Dashboard) and flips this flag alongside the existing is_paid.

ALTER TABLE accounts ADD COLUMN is_enterprise INTEGER NOT NULL DEFAULT 0;
