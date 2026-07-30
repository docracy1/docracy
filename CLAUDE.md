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

## Trust / compliance (Phase 0)

Public pages: `/trust` (security posture, subprocessors, questionnaire answers) and `/dpa` (Art. 28 draft). Honest SES disclaimer — no identity verification, no SOC 2 yet; Cloudflare infra certifications noted as shared responsibility. Countersigned DPA via `sales@docracy.io`.

## i18n (EN + ES)

Lightweight catalogs — no i18next. Locales: `en` | `es` (US Spanish, tú-form). Stored in `localStorage` (`docracy_locale` / `chasa_locale`), browser `navigator.language` as fallback.

| Product | Catalogs | Switcher |
|---------|----------|----------|
| Docracy | `apps/web/src/lib/i18n/` | Header |
| Chasa | `apps/web/app/src/lib/i18n/` | AppShell sidebar / More / Login |

**Phased:** P1 landing/pricing/login/sign (Docracy) + login/shell/welcome (Chasa) → P2 rest of app → P3 emails → P4 docs/blog. Add keys to both `en.ts` and `es.ts`, then `t("key")` in components.

## Weekly SEO blog (Monday cron)

Daily Worker cron `0 8 * * *` (UTC) calls `runWeeklyBlogPublish` on Mondays (`apps/worker/src/lib/blogWeekly.ts`):

1. Publish oldest **draft** in `blog_posts` if any (admin-prepared).
2. Else take next `queued` row from `blog_topic_queue` (migration `0018`), draft with Workers AI, publish to `blog_posts`.

Local test: `curl "http://127.0.0.1:8787/__scheduled?cron=0+8+*+*+*"` on a Monday, or temporarily force the Monday branch.

Dynamic posts appear on `/blog` via API. Sitemap: `https://api.docracy.io/api/blog-posts/sitemap.xml` (also in `robots.txt`). Static `ARTICLES` / prerender remain for handcrafted posts (e.g. W-9 with screenshots).

Add topics: insert into `blog_topic_queue` (`status='queued'`) or create admin drafts with `publish:false`.

## Git workflow (Cursor + Claude Code)

Both tools work on this folder. Before starting: `git pull --rebase`. After finishing: commit + push.

## Done (production)

- Cloud connectors: Dropbox, OneDrive, Box, Google Drive (paid OAuth + upload)
- Turnstile on login
- Admin analytics sidebar (requires `CF_ANALYTICS_API_TOKEN` secret for read API)

## Sync note

Do not edit the copy under `/Users/reinhold/new project/docracy` — this folder is canonical.
