#!/usr/bin/env bash
# Idempotent Cloud Agent bootstrap for the Docracy monorepo.
# Durable, source-derived setup only — dev servers live in environment.json "terminals".
set -euo pipefail

cd "$(dirname "$0")/.."

# Install all workspace dependencies (root + apps/* + packages/*).
npm install

# Seed local worker config from the committed example. .dev.vars is gitignored, so it is
# absent on a fresh checkout. Without RESEND_API_KEY the worker logs emails (incl. signing
# links) to its console instead of sending them.
if [ ! -f apps/worker/.dev.vars ]; then
  cp apps/worker/.dev.vars.example apps/worker/.dev.vars
fi

# Apply D1 migrations to the local (miniflare) database so D1-backed API routes
# (marketplace, blog, roadmap, etc.) work in dev. The anonymous signing flow itself
# only uses KV + R2 and does not depend on D1.
( cd apps/worker && npx wrangler d1 migrations apply docracy-index --local )
