-- Editorial queue for the Monday SEO blog cron (lib/blogWeekly.ts). Topics are seeded here;
-- the cron picks the oldest `queued` row, drafts with Workers AI, publishes to blog_posts,
-- then marks the topic `published`. Admin can also insert rows later via D1 / future UI.
CREATE TABLE blog_topic_queue (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE COLLATE NOCASE,
  title TEXT NOT NULL,
  -- Short brief for the model: audience, angle, must-cover sections.
  angle TEXT NOT NULL,
  cluster TEXT NOT NULL DEFAULT 'Signing',
  -- queued | published | skipped
  status TEXT NOT NULL DEFAULT 'queued',
  published_post_id TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  published_at TEXT
);

CREATE INDEX idx_blog_topic_queue_status_order ON blog_topic_queue(status, sort_order, created_at);

-- ~3 months of Monday posts. Slugs must not collide with static ARTICLES / BLOG_POSTS.
INSERT INTO blog_topic_queue (id, slug, title, angle, cluster, status, sort_order, created_at) VALUES
('btq_01', 'how-to-sign-an-nda-without-an-account', 'How to sign an NDA online without creating an account',
 'Audience: freelancers and small businesses. Explain NDAs briefly, when e-sign is valid (ESIGN/eIDAS), then a clear Docracy step-by-step: upload PDF or free template, add signers, place signature fields, send, sign without signup, download. Include mistakes and FAQ. Position Docracy as free/no-signup for short chains. Not tax or legal advice.',
 'NDA', 'queued', 10, '2026-07-29T00:00:00.000Z'),
('btq_02', 'how-to-collect-contractor-w9s-digitally', 'How businesses collect contractor W-9s digitally',
 'Audience: finance ops / founders hiring contractors. Cover requester vs payee, why TIN security matters, digital collection workflow, storing signed W-9s, reminders, pairing with contractor agreements. Step-by-step sending a W-9 PDF with Docracy. FAQ + mistakes. Not tax advice; point to IRS Form W-9 instructions.',
 'Signing', 'queued', 20, '2026-07-29T00:00:00.000Z'),
('btq_03', 'how-to-sign-a-freelance-contract-online', 'How to sign a freelance contract online',
 'Audience: freelancers and clients. What belongs in a simple freelance agreement, why e-sign beats printing, Docracy upload/send/sign flow, optional free templates. Mistakes (scope, payment, IP). FAQ. Soft CTA to Docracy free flow.',
 'Contract', 'queued', 30, '2026-07-29T00:00:00.000Z'),
('btq_04', 'how-to-send-an-offer-letter-for-esignature', 'How to send an offer letter for e-signature',
 'Audience: small HR / founders. Offer letter basics, what to include, sequential signing if needed, Docracy steps with free offer-letter template mention. Mistakes and FAQ. Not employment-law advice.',
 'Small Business', 'queued', 40, '2026-07-29T00:00:00.000Z'),
('btq_05', 'how-to-sign-a-vendor-agreement-online', 'How to sign a vendor agreement online',
 'Audience: ops buying from vendors. Vendor agreement purpose, key clauses at a high level, digital signing workflow with Docracy, tracking status, storing signed PDFs. FAQ + mistakes.',
 'Small Business', 'queued', 50, '2026-07-29T00:00:00.000Z'),
('btq_06', 'are-electronic-signatures-legal-for-contracts', 'Are electronic signatures legal for business contracts?',
 'Audience: US/EU small business. Explain ESIGN, UETA, eIDAS in plain English, intent/consent/record integrity, when wet ink still preferred, how Docracy audit trail fits. FAQ. Not legal advice.',
 'Signing', 'queued', 60, '2026-07-29T00:00:00.000Z'),
('btq_07', 'how-to-get-a-client-to-sign-a-contract-faster', 'How to get a client to sign a contract faster',
 'Audience: freelancers and agencies. Friction causes (accounts, long tools), tips: clear CTA, mobile-friendly link, fewer fields, sequential vs parallel, reminders. Show Docracy no-signup signer experience. FAQ.',
 'Contract', 'queued', 70, '2026-07-29T00:00:00.000Z'),
('btq_08', 'how-to-sign-a-mutual-nda-online', 'How to sign a mutual NDA online',
 'Audience: startups and freelancers. One-way vs mutual NDA, when mutual fits, step-by-step with Docracy free mutual NDA template, both parties sign without accounts. Mistakes + FAQ.',
 'NDA', 'queued', 80, '2026-07-29T00:00:00.000Z'),
('btq_09', 'how-to-create-a-reusable-contract-template', 'How to create a reusable contract template for e-signature',
 'Audience: teams sending the same agreement often. Why templates beat rewriting PDFs, field placement once, Docracy paid templates briefly vs free one-off sends. Steps + FAQ.',
 'Contract', 'queued', 90, '2026-07-29T00:00:00.000Z'),
('btq_10', 'how-to-onboard-independent-contractors-with-esign', 'How to onboard independent contractors with e-signatures',
 'Audience: companies hiring 1099 contractors. Packet idea: ICA + W-9 + NDA, order of signing, digital collection, Docracy sequential chains. Mistakes (employee vs contractor — high level only). FAQ. Not legal/tax advice.',
 'Freelancer', 'queued', 100, '2026-07-29T00:00:00.000Z'),
('btq_11', 'how-to-sign-a-service-agreement-online', 'How to sign a service agreement online',
 'Audience: agencies and clients. What a service agreement covers, e-sign steps in Docracy, download + certificate. Mistakes and FAQ.',
 'Contract', 'queued', 110, '2026-07-29T00:00:00.000Z'),
('btq_12', 'simple-esignature-vs-docusign-for-small-teams', 'Simple e-signature vs DocuSign for small teams',
 'Audience: teams comparing tools. When enterprise DocuSign is overkill, what small teams need (speed, price, no signer accounts), honest Docracy positioning ($10/mo workspace, free short chains). Not a full feature matrix — practical fit. FAQ.',
 'Comparison', 'queued', 120, '2026-07-29T00:00:00.000Z');
