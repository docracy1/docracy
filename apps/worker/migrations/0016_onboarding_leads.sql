-- Anonymous preparers who opt in to tips after sending a document. Separate from
-- onboarding_emails (which is account-keyed and assumes "hasn't sent yet") because these
-- people have already sent — the drip content and skip rules are different.
--
-- email is the primary key: one drip per address, re-opting-in on a later send does not
-- restart the sequence. Deleted when the same email creates an account so the account
-- onboarding sequence takes over without a double drip.
CREATE TABLE onboarding_leads (
  email TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  opted_in_at TEXT NOT NULL,
  step1_sent_at TEXT,
  step3_sent_at TEXT,
  step4_sent_at TEXT
);
