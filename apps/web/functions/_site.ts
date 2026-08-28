/** Pages Function bindings for public URL env vars (see apps/web/wrangler.toml [vars]). */
export type SiteBindings = {
  ASSETS?: { fetch: typeof fetch };
  PUBLIC_APP_URL?: string;
  PUBLIC_WORKER_URL?: string;
  PUBLIC_CONNECTOR_URL?: string;
};

const DEFAULTS = {
  PUBLIC_APP_URL: "https://docracy.io",
  PUBLIC_WORKER_URL: "https://api.docracy.io",
  PUBLIC_CONNECTOR_URL: "https://mcp.docracy.io",
} as const;

function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

export function resolveSiteEnv(env: SiteBindings = {}) {
  const appUrl = stripTrailingSlash(env.PUBLIC_APP_URL ?? DEFAULTS.PUBLIC_APP_URL);
  const workerUrl = stripTrailingSlash(env.PUBLIC_WORKER_URL ?? DEFAULTS.PUBLIC_WORKER_URL);
  const connectorUrl = stripTrailingSlash(env.PUBLIC_CONNECTOR_URL ?? DEFAULTS.PUBLIC_CONNECTOR_URL);
  return {
    appUrl,
    workerUrl,
    connectorUrl,
    appHost: new URL(appUrl).host,
  };
}
