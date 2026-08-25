# AGENTS.md

## Cursor Cloud specific instructions

Docracy is a Cloudflare Workers + Vite monorepo. Standard commands live in `README.md` / root `package.json` (`npm run dev:worker`, `npm run dev:web`, `npm test`, `npm run typecheck`).

### Required local services

| Service | Command | URL | Notes |
|---------|---------|-----|-------|
| Worker API | `npm run dev:worker` | `http://localhost:8787` | Needs `apps/worker/.dev.vars` (copy from `.dev.vars.example`). Uses local KV/R2/D1 via wrangler `--persist-to=.wrangler/state`. |
| Web (Vite) | `npm run dev:web` | `http://localhost:5173` | Proxies `/api` → `http://127.0.0.1:8787`. |

Optional: `npm run dev:connector` (MCP on `:8788`) — same `TOKEN_SECRET` as the worker.

### Gotchas

- **No lint script** at the repo root; use `npm run typecheck` (includes web build + prerender) as the static check.
- **Vite binds IPv6 `::1` only** by default. Prefer `http://localhost:5173` (not `http://127.0.0.1:5173`) when curling or opening the UI. Worker listens on both.
- Without `RESEND_API_KEY`, signing/invite emails print to the **worker console** (tmux/wrangler output). Copy signer links from there after submit.
- Leave Stripe/Turnstile secrets unset locally; billing returns 501 and login Turnstile is skipped.
- Workers AI binding warns in local mode (`remote` resources); free anonymous signing does not need it.
- Do not commit `.dev.vars` / `.env`. Zapier/Pipedream/marketing packages are not required for core prepare→sign E2E.
