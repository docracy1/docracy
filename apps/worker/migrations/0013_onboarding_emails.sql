-- Tracks per-account progress through the 4-step onboarding email drip (3 minutes / 4 hours /
-- 24 hours / 3 days after signup). One row per new account, inserted by auth.ts at account
-- creation. The cron sweep in lib/onboardingEmails.ts checks account_created_at against each
-- threshold and the *live* documents table (not cached here) to skip any step once the account
-- has actually sent a document — see runOnboardingEmailSweep for the exact logic.
CREATE TABLE onboarding_emails (
  account_id TEXT PRIMARY KEY REFERENCES accounts(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  account_created_at TEXT NOT NULL,
  step1_sent_at TEXT,
  step2_sent_at TEXT,
  step3_sent_at TEXT,
  step4_sent_at TEXT
);
