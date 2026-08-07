-- Tracks the free (signed-up, non-paid) tier's monthly WhatsApp-signer quota — see
-- lib/whatsappQuota.ts. Paid accounts never consult these columns (WhatsApp is unlimited/bundled
-- for them); anonymous documents never reach this table at all.
--
-- whatsapp_quota_month: the "YYYY-MM" (UTC) the count below applies to. A read that finds this
-- stale (not the current month) treats the account as having a fresh quota rather than writing a
-- reset eagerly — see peekWhatsappQuotaRemaining/consumeWhatsappQuota.
-- whatsapp_quota_used: WhatsApp-invited signers consumed so far in whatsapp_quota_month.
ALTER TABLE accounts ADD COLUMN whatsapp_quota_month TEXT;
ALTER TABLE accounts ADD COLUMN whatsapp_quota_used INTEGER NOT NULL DEFAULT 0;
