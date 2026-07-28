# Docracy

Free, fast e-signatures for simple agreements, with a paid workspace for automation, AI, templates, embedded signing, and cloud integrations.

- Live app: [docracy.pages.dev](https://docracy.pages.dev)
- Worker API: [docracy-worker.rl-d77.workers.dev](https://docracy-worker.rl-d77.workers.dev)
- MCP server: [docracy-connector.rl-d77.workers.dev/mcp](https://docracy-connector.rl-d77.workers.dev/mcp)

## What Docracy does

Docracy is built for low-friction signing:

- upload a PDF or start from a template
- add signers and place fields
- send a sequential signing chain with no signer account required
- email the finished PDF and completion certificate automatically

The free anonymous flow stores document state in Cloudflare KV, PDFs in R2, sends mail through Resend, and deletes documents after a short retention window. Paid workspaces add accounts, dashboard/history, AI features, reusable templates, automations, integrations, and team workflows.

## Plans

### Free

- no account required
- up to 2 signers per document
- sequential or all-at-once signing
- signature, initials, text, date, checkbox, and dropdown fields
- up to 2 CC recipients
- document status page, decline/cancel flow, completion certificate
- optional SMS signing links for US numbers via carrier email-to-SMS gateways
- automatic deletion after 9 days, or earlier once the document is completed and sent

### Paid ($10/month per workspace)

- unlimited signers
- unlimited teammates
- dashboard with document history
- reusable templates
- bulk send from a template
- custom document expiry (1-90 days)
- embedded signing via iframe
- saved contacts and signer reassignment
- white-label branding
- PIN-protected signing links
- webhooks
- API key + MCP connector
- AI tools
- Dropbox, OneDrive, and Box auto-upload
- signer-required attachments
- anchor tag detection in PDFs

### Enterprise

Everything in Paid, plus:

- invoice billing and annual contracts
- premium support
- volume discounts and onboarding help
- optional SSO / multi-workspace setup

## Current feature set

### Signing flow

- sequential or parallel signing
- no signer login required
- prepare, sign, status, and dashboard flows
- completion PDF + certificate email
- pending document cancel / void support
- signer reassignment for paid workspaces

### Field types

- signature
- initials
- text
- date
- checkbox
- dropdown

### Smart document prep

- AI field auto-detect
- AI contract explainer
- AI risk / clause highlighter
- AI-generated agreements
- anchor tags like `{{sig1}}`, `{{date_2}}`, or `{{dropdown_1:Yes|No}}`

### Templates and sending

- free public templates
- saved workspace templates
- bulk send from a saved template
- custom expiry on paid plans

### Attachments and SMS

- optional signer attachments on paid plans
- attachment downloads from status page and dashboard
- free SMS signing links for US numbers only, sent through carrier email-to-SMS gateways using Resend

### Integrations and automation

- Dropbox auto-upload
- OneDrive auto-upload
- Box auto-upload
- webhooks
- Zapier triggers and actions
- MCP connector for Claude, ChatGPT, Grok, Perplexity, and Cursor

## Architecture

- `apps/web` — React + Vite frontend
- `apps/worker` — Cloudflare Worker API, cron reminders, billing hooks, D1 indexing for paid accounts
- `apps/connector` — remote MCP server
- `packages/shared` — shared types and HMAC token sign/verify logic

Core infra:

- Cloudflare KV for document state
- Cloudflare R2 for PDFs and uploads
- Cloudflare D1 for paid-account derived indexing only
- Cloudflare Pages for the frontend
- Resend for email delivery

## Important design rules

- D1 is a derived index, never the source of truth.
- Anonymous/free documents do not depend on D1.
- Shared code is intentionally minimal; only cross-cutting token logic belongs in `packages/shared`.
- Never commit `.env` or `.dev.vars`.

## Local development

```bash
npm install
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
npm run dev:worker
npm run dev:web
npm run dev:connector
```

Without `RESEND_API_KEY`, outgoing emails are logged to the worker console instead.

### Local URLs

- web: `http://localhost:5173`
- worker: `http://127.0.0.1:8787`

### Typical local flow

1. Open `http://localhost:5173/prepare`
2. Upload a PDF
3. Add signers
4. Place fields
5. Submit
6. Copy signing links from the worker console
7. Complete the signing flow

### Trigger the daily reminder cron locally

```bash
curl "http://127.0.0.1:8787/__scheduled?cron=0+8+*+*+*"
```

## Tests

```bash
npm test
```

## Deployment

### Worker

```bash
npm run deploy:worker
```

### Web

```bash
npm run build:web
./node_modules/.bin/wrangler pages deploy apps/web/dist --project-name=docracy
```

### Connector

```bash
npm run deploy:connector
```

## One-time setup checklist

- create a Resend account and API key
- provision Cloudflare KV, R2, and D1
- set worker secrets such as `TOKEN_SECRET` and `RESEND_API_KEY`
- configure `PUBLIC_APP_URL`
- deploy the MCP connector with the same token secret
- add an R2 lifecycle rule for document cleanup

## Billing notes

- paid checkout is live via Stripe
- enterprise can be sold through Stripe annual billing or manual invoicing / custom onboarding
- MCP/API access is revoked when paid status is removed

## Repository status

This repository is live and in active use. Free signing, paid workspaces, billing, AI tools, MCP, webhooks, Zapier, embedded signing, cloud connectors, SMS invites, signer attachments, and bulk send are all implemented.

## License

TBD.
