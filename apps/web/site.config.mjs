/**
 * Single source for public production URLs (web build scripts + Vite).
 * Keep in sync with apps/worker/wrangler.toml [vars] and apps/web/wrangler.toml [vars].
 *
 * Cutover to docstoc.io: set PUBLIC_APP_URL / PUBLIC_WORKER_URL / PUBLIC_CONNECTOR_URL
 * (or VITE_PUBLIC_* for client builds) before rebuild + redeploy.
 */
function stripTrailingSlash(url) {
  return url.replace(/\/$/, "");
}

export const PUBLIC_APP_URL = stripTrailingSlash(
  process.env.PUBLIC_APP_URL || process.env.VITE_PUBLIC_APP_URL || "https://docracy.io",
);
export const PUBLIC_WORKER_URL = stripTrailingSlash(
  process.env.PUBLIC_WORKER_URL || process.env.VITE_PUBLIC_WORKER_URL || "https://api.docracy.io",
);
export const PUBLIC_CONNECTOR_URL = stripTrailingSlash(
  process.env.PUBLIC_CONNECTOR_URL || process.env.VITE_PUBLIC_CONNECTOR_URL || "https://mcp.docracy.io",
);

export const PUBLIC_APP_HOST = new URL(PUBLIC_APP_URL).host;
export const PUBLIC_WORKER_HOST = new URL(PUBLIC_WORKER_URL).host;
export const PUBLIC_CONNECTOR_HOST = new URL(PUBLIC_CONNECTOR_URL).host;

/** Rewrite committed public/*.txt assets when regenerating SEO discovery files. */
export function rewriteLegacyPublicUrls(content) {
  return content
    .replaceAll("https://docracy.io", PUBLIC_APP_URL)
    .replaceAll("https://api.docracy.io", PUBLIC_WORKER_URL)
    .replaceAll("https://mcp.docracy.io", PUBLIC_CONNECTOR_URL);
}
