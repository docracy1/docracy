# Docracy

Free, no-signup, sequential e-signature tool. State lives in Cloudflare KV, PDFs in R2, reminders via
a daily Cron Trigger, email via Resend. Documents self-delete 9 days after creation. No accounts, no
database for the free flow — it's fully anonymous.

**Live:**
- Frontend: https://docracy.pages.dev
- Worker API: https://docracy-worker.rl-d77.workers.dev
- Connector (MCP): https://docracy-connector.rl-d77.workers.dev/mcp

## Layout

- `apps/worker` — Cloudflare Worker: the free-tier API routes, the daily reminder cron, and (for
  logged-in paid accounts only) best-effort indexing into D1.
- `apps/web` — React + Vite frontend: prepare/upload, signing, and status pages.
- `apps/connector` — Cloudflare Worker running a remote MCP server. Free tier: one authless tool,
  `check_status`. Paid tools (search, summarize, audit trail, manual reminders) are a follow-up phase
  that needs accounts/OAuth — not built yet.
- `packages/shared` — types (`DocState`, `Signer`, `Env`) and the HMAC token sign/verify logic shared
  between `apps/worker` and `apps/connector`. Everything else is deliberately duplicated rather than
  shared, per this project's YAGNI convention — token verification is the one place where copy-paste
  drift would be a security bug, not just a nuisance.

D1 (`docracy-index`) is a **derived index, never the source of truth** — it only ever gets rows for
documents created by a logged-in paid account (none exist yet, since accounts aren't built). Anonymous
documents (100% of traffic today) never touch it. See `apps/worker/migrations/0001_init.sql` for the
schema and `apps/worker/src/lib/index-d1.ts` for the best-effort (`waitUntil` + swallow-and-log) writes.

## Local development (no Cloudflare account needed)

```
npm install
cp apps/worker/.dev.vars.example apps/worker/.dev.vars   # TOKEN_SECRET can be any string locally

npm run dev:worker      # terminal 1 — runs the Worker on http://127.0.0.1:8787 with emulated KV/R2/D1
npm run dev:web         # terminal 2 — runs the frontend on http://localhost:5173, proxying /api to the worker
npm run dev:connector   # terminal 3 (optional) — runs the MCP connector on http://127.0.0.1:8787 too, pick a different port if running alongside the worker
```

With `RESEND_API_KEY` unset, the worker logs every email (including magic links) to the `dev:worker`
console instead of sending it — that's how you get signer links while testing locally.

Walk the flow: open `localhost:5173/prepare`, upload a PDF, add 2 signers, place a couple of fields,
submit. Copy signer #1's link from the worker console, open it, sign, submit. Signer #2's link then
appears in the console — repeat, and you should get a "fully signed" status plus a completion email
(logged) to both.

To exercise the reminder cron locally: `curl "http://127.0.0.1:8787/__scheduled?cron=0+8+*+*+*"` while
`wrangler dev` is running (wrangler's built-in test-scheduled endpoint).

Run everything's tests: `npm test` (or `npm run test:shared` / `test:worker` / `test:connector`
individually).

## One-time setup before deploying for real

1. **Resend** (email): create a free account at resend.com, verify a sending domain (or use their
   shared test domain while developing), and grab an API key.
2. **Domain**: buy `docracy.io` (or a subdomain of an existing domain) and point it at Cloudflare.
3. **Cloudflare resources** (run once you have a Cloudflare account and `wrangler login`'d):
   ```
   cd apps/worker
   wrangler login
   wrangler kv namespace create DOCRACY_KV
   wrangler kv namespace create DOCRACY_KV --preview
   wrangler r2 bucket create docracy-docs
   wrangler d1 create docracy-index
   wrangler d1 migrations apply docracy-index --remote
   ```
   Copy the returned IDs into `wrangler.toml` (`id` / `preview_id` for KV, `database_id` for D1).
4. **Secrets** (the same `TOKEN_SECRET` value must be set on *both* `apps/worker` and `apps/connector`
   — the connector verifies links signed by the worker):
   ```
   wrangler secret put TOKEN_SECRET        # any long random string, e.g. `openssl rand -hex 32`
   wrangler secret put RESEND_API_KEY
   ```
5. **R2 lifecycle rule**: in the Cloudflare dashboard, on the `docracy-docs` bucket, add a lifecycle
   rule deleting objects under the `docs/` prefix after 9 days (matches `DOC_TTL_DAYS` in `wrangler.toml`).
6. Update `PUBLIC_APP_URL` in `wrangler.toml` to the real frontend domain once it's live.
7. For the connector: `cd apps/connector && wrangler kv namespace create` isn't needed — it binds the
   *same* `DOCRACY_KV` namespace ID as the worker (read-only). Just run `wrangler secret put TOKEN_SECRET`
   with the same value as step 4, then `wrangler deploy`.

## Deploying

Either run `wrangler deploy` (from `apps/worker` and `apps/connector`) and `npm run build:web` +
`wrangler pages deploy dist --project-name=docracy` (from `apps/web`) locally, **or** connect the repo
to Cloudflare (Workers Builds for the workers, Pages for the frontend) so pushes to `main` build and
deploy automatically — no local Node required for that path.

## Out of scope so far

- Billing/paid-tier unlock (Stripe) — the free-tier signer cap (2) is enforced server-side; a real
  paid gate is future work. A `is_paid` manual flag exists in the `accounts` table for once accounts ship.
- Accounts, magic-link login, and OAuth for the connector — needed before any of the 5 paid connector
  tools (`find_documents`, `summarize_document`, `list_pending_by_counterparty`, `get_audit_trail`,
  `send_reminder`/`resend_link`) can be built. `check_status` (free, no login) is the only one live today.
- Custom branding, extended retention.
