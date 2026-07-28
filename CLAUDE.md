# Docracy — agent context

Canonical project path: `/Users/reinhold/docracy`

Free, no-signup sequential e-signature. State in Cloudflare KV, PDFs in R2, email via Resend, 9-day TTL.

**Live:** https://docracy.pages.dev · API: https://docracy-worker.rl-d77.workers.dev · MCP: https://docracy-connector.rl-d77.workers.dev/mcp

## Monorepo layout

| Path | Role |
|------|------|
| `apps/worker` | Cloudflare Worker — API, cron reminders, D1 indexing (paid only) |
| `apps/web` | React + Vite frontend |
| `apps/connector` | MCP server (paid: `check_status` + `find_documents`) |
| `packages/shared` | Shared types + HMAC token sign/verify (only shared code — YAGNI elsewhere) |

## Conventions

- **D1 is derived index only**, never source of truth. Anonymous docs never touch D1.
- **YAGNI:** duplicate code intentionally except token verification in `packages/shared`.
- **Secrets:** `.dev.vars` locally, `wrangler secret` in prod. Never commit `.env` / `.dev.vars`.
- **Node:** use `/Users/reinhold/.local/node/bin/node` if system node differs.

## Local dev

```bash
npm install
cp apps/worker/.dev.vars.example apps/worker/.dev.vars
npm run dev:worker    # :8787
npm run dev:web       # :5173
npm test
```

Without `RESEND_API_KEY`, emails (incl. signer links) log to the worker console.

## Git workflow (Cursor + Claude Code)

Both tools work on this folder. Before starting: `git pull --rebase`. After finishing: commit + push.

## Done (production)

- Cloud connectors: Dropbox, OneDrive, Box (Enterprise OAuth + upload)
- Turnstile on login
- Admin analytics sidebar (requires `CF_ANALYTICS_API_TOKEN` secret for read API)

## Sync note

Do not edit the copy under `/Users/reinhold/new project/docracy` — this folder is canonical.
