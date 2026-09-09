-- Tracks which staged "please renew" reminders (see lib/paymentFreeze.ts's crypto reminder sweep)
-- have already fired for a crypto-paid account's current lapsed period, so a daily sweep never
-- re-sends the same one twice — same "staged nudges, marked once sent" idiom as Signer's
-- completionNudgesSent (packages/shared/src/types.ts). JSON array of "day2"/"day4"; NULL/absent
-- means none sent yet. Cleared back to NULL on the next successful payment (extendCryptoPaidUntil)
-- so each lapsed period gets its own fresh reminder cycle.
ALTER TABLE accounts ADD COLUMN crypto_reminders_sent TEXT;
