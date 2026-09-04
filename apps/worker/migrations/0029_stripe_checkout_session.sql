-- Last Checkout Session created for an account. Persisted *before* redirecting the browser to
-- Stripe so a missed checkout.session.completed webhook can still be reconciled from the
-- success-url return (POST /api/billing/reconcile) or the hourly catch-up.
ALTER TABLE accounts ADD COLUMN stripe_checkout_session_id TEXT;
ALTER TABLE accounts ADD COLUMN stripe_checkout_created_at TEXT;
