-- docracy.io migration 0037 (13.11.2026): own cookieless visitor count (src/lib/visitorCount.ts). Idempotent.
-- Apply (owner only) with
--   npx wrangler d1 execute docracy-index --remote --file=migrations/0037_visitor_count.sql
-- from apps/worker. A later `wrangler d1 migrations apply` (the CI deploy job on main runs it) re-runs it harmlessly.
--
-- One row per public page view, no IP, no cookie, nothing personal: day, time, path (public pages only, no query,
-- never a signing link), kind of page, source host, device class, country, kind of network ('dc'/'isp') and a
-- visitor hash that changes every day (SHA-256 of day, secret salt, IP and user agent, 16 hex chars).
-- `seconds` is the time the page was visible, sent by the browser when it is left. Kept 180 days (daily cron).
-- Only one index besides the rowid: every index costs a billed D1 write per page view.

CREATE TABLE IF NOT EXISTS analytics_events (
  id INTEGER PRIMARY KEY,               -- rowid; grows with time, used for the daily cap
  day TEXT NOT NULL,                    -- YYYY-MM-DD, UTC
  ts INTEGER NOT NULL,                  -- unix seconds
  path TEXT NOT NULL,
  kind TEXT NOT NULL,                   -- home, landing, template, templates, blog, prepare, pricing, docs, legal, login
  source TEXT,                          -- host of the referrer or utm_source, NULL = direct
  device TEXT,                          -- mobile, tablet, desktop
  country TEXT,                         -- two letters from Cloudflare
  net TEXT,                             -- 'dc' (data centre / hosting network), 'isp', NULL = unknown
  visitor TEXT NOT NULL,                -- 16 hex chars, new every day
  seconds INTEGER                       -- visible time on the page, NULL until the browser reports it
);
CREATE INDEX IF NOT EXISTS analytics_events_day ON analytics_events (day);
