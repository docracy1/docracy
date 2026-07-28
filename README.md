Docracy — Free, Anonymous, Sequential E‑Signature + API‑First Workflow Engine
Docracy is a free, no‑signup, sequential e‑signature tool with a fully anonymous flow.
State lives in Cloudflare KV, PDFs in R2, reminders via a daily Cron Trigger, and email via Resend.
Documents self‑delete after 9 days. No accounts, no database for the free flow.

The paid tier (accounts, OAuth, extended retention, audit trail, search, summarize, manual reminders) is implemented at the API level and ready for activation once account creation ships.

Live Services
Frontend: https://docracy.pages.dev

Worker API: https://docracy-worker.rl-d77.workers.dev

Connector (MCP): https://docracy-connector.rl-d77.workers.dev/mcp

Features
Free Tier (Fully Anonymous)
Sequential e‑signature flow

No accounts, no login

No database writes

State in Cloudflare KV

PDFs stored in R2

Automatic deletion after 9 days

Daily reminder cron

Email delivery via Resend

MCP connector (paid): check_status + find_documents

Local dev without Cloudflare account

Full flow: prepare → upload → place fields → signers → sequential signing → completion email

Paid Tier (Account‑Based, API‑First)
Already implemented at API level, ready for activation:

Account system (magic‑link login)

OAuth for connector tools

Extended retention

Audit trail

Document search

Document summarization

Pending‑by‑counterparty listing

Manual reminders / resend link

Custom branding

D1 indexing for paid accounts (derived index, never source of truth)

Integrations
Cloudflare
KV (state)

R2 (PDF storage)

D1 (derived index for paid accounts)

Cron Trigger (daily reminders)

Workers (API + MCP connector)

Pages (frontend hosting)

Email
Resend (magic links, reminders, completion emails)

Cloud Storage APIs
Box

Dropbox

OneDrive

MCP (Model Context Protocol)
Paid tools: check_status, find_documents
Requires a paid API key (revoked when the subscription ends)

Repository Layout
apps/worker — Cloudflare Worker: free‑tier API routes, daily reminder cron, and best‑effort indexing into D1 for paid accounts.

apps/web — React + Vite frontend: prepare/upload, signing, and status pages.

apps/connector — Cloudflare Worker running a remote MCP server.

packages/shared — shared types (DocState, Signer, Env) and HMAC token sign/verify logic.

Important:  
D1 (docracy-index) is a derived index, never the source of truth.
Anonymous documents never touch it.

Local Development (No Cloudflare Account Needed)
Code
npm install
cp apps/worker/.dev.vars.example apps/worker/.dev.vars

npm run dev:worker
npm run dev:web
npm run dev:connector
Emails are logged locally when RESEND_API_KEY is unset.

Walk the flow:

localhost:5173/prepare

Upload PDF

Add signers

Place fields

Submit

Copy signer links from worker console

Sign sequentially

Completion email logged locally

Reminder cron locally:

Code
curl "http://127.0.0.1:8787/__scheduled?cron=0+8+*+*+*"
Run tests:

Code
npm test
Deployment
Either deploy manually:

Code
wrangler deploy
npm run build:web
wrangler pages deploy dist --project-name=docracy
Or connect repo to Cloudflare for automatic builds on main.

Setup Checklist (One‑Time)
Create Resend account + API key

Point domain (e.g., docracy.io) to Cloudflare

Create KV, R2, D1 resources

Set secrets (TOKEN_SECRET, RESEND_API_KEY)

Add R2 lifecycle rule (delete after 9 days)

Set PUBLIC_APP_URL

Deploy connector with same TOKEN_SECRET

Status
Free tier is fully live.
Paid tier is implemented at API level and ready for activation once accounts ship.

License
To be announced.
