-- Running balance (in cents) of WhatsApp overage a crypto-paid account has incurred past its
-- monthly included allowance (see lib/whatsappQuota.ts's PAID_MONTHLY_LIMIT) that couldn't be
-- billed the Stripe metered-usage way, since a crypto-only account has no stripe_customer_id (see
-- lib/whatsappOverage.ts). Accrued by routes/documents.ts, added on top of the flat crypto renewal
-- price at the next /api/billing/crypto-checkout, and settled back toward 0 once that invoice is
-- actually paid (routes/billing.ts's crypto-webhook) — never collected any other way, since
-- NOWPayments has no auto-debit to charge outside of a checkout the account itself initiates.
ALTER TABLE accounts ADD COLUMN crypto_whatsapp_overage_cents INTEGER NOT NULL DEFAULT 0;
