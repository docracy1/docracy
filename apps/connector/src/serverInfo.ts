import type { ConnectorEnv } from "./types";

/** MCP `Implementation` metadata (see index.ts / paidTools.ts) — icons per SEP-973 (MCP spec
 *  2025-11-25+). Client support for rendering it varies (Claude.ai's custom-connector UI doesn't
 *  yet, as of when this was written), but it's spec-compliant now so it starts working the moment
 *  clients catch up. */
export function buildServerInfo(env: Pick<ConnectorEnv, "PUBLIC_APP_URL">) {
  const app = env.PUBLIC_APP_URL.replace(/\/$/, "");
  return {
    name: "docracy",
    version: "0.1.0",
    websiteUrl: app,
    icons: [{ src: `${app}/docracy-seal-icon.png`, mimeType: "image/png" as const }],
  };
}
