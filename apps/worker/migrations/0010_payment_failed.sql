-- Tracks a Stripe invoice.payment_failed event so the Dashboard can show an immediate "please
-- settle your unpaid invoice" banner, and a daily cron sweep can freeze (downgrade) the account
-- if it stays unresolved for 7 days. Cleared the moment payment succeeds again.
ALTER TABLE accounts ADD COLUMN payment_failed_at TEXT;
