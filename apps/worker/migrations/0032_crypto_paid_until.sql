-- Crypto (NOWPayments) subscription payments have no card-style auto-debit — the account pays
-- one invoice at a time, and this column tracks how long that invoice's payment covers. Unlike
-- Stripe (whose own recurring engine + subscription_deleted webhook flips is_paid off), a crypto
-- payment needs its own expiry backstop — see lib/paymentFreeze.ts's crypto sweep. NULL for every
-- account that has never paid via crypto (all Stripe-only accounts, which is everyone today).
ALTER TABLE accounts ADD COLUMN crypto_paid_until TEXT;
