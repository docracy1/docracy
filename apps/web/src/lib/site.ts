/** Client-side public URLs — defaults match site.config.mjs / wrangler [vars]. */
function stripTrailingSlash(url: string): string {
  return url.replace(/\/$/, "");
}

function readPublicUrl(viteKey: string, processKey: string, fallback: string): string {
  const viteEnv = typeof import.meta !== "undefined" ? import.meta.env : undefined;
  const fromVite = viteEnv?.[viteKey];
  if (typeof fromVite === "string" && fromVite) return stripTrailingSlash(fromVite);

  if (typeof process !== "undefined" && process.env) {
    const fromProcess = process.env[processKey] || process.env[viteKey];
    if (typeof fromProcess === "string" && fromProcess) return stripTrailingSlash(fromProcess);
  }

  return fallback;
}

export const PUBLIC_APP_URL = readPublicUrl(
  "VITE_PUBLIC_APP_URL",
  "PUBLIC_APP_URL",
  "https://docracy.io",
);
export const PUBLIC_WORKER_URL = readPublicUrl(
  "VITE_PUBLIC_WORKER_URL",
  "PUBLIC_WORKER_URL",
  "https://api.docracy.io",
);
export const PUBLIC_CONNECTOR_URL = readPublicUrl(
  "VITE_PUBLIC_CONNECTOR_URL",
  "PUBLIC_CONNECTOR_URL",
  "https://mcp.docracy.io",
);

export const PUBLIC_APP_HOST = new URL(PUBLIC_APP_URL).host;
