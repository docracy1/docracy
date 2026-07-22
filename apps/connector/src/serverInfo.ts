/** Shared MCP `Implementation` metadata for both the free and paid server variants (see
 *  index.ts / paidTools.ts) — icons per SEP-973 (MCP spec 2025-11-25+). Client support for
 *  rendering it varies (Claude.ai's custom-connector UI doesn't yet, as of when this was
 *  written), but it's spec-compliant now so it starts working the moment clients catch up. */
export const SERVER_INFO = {
  name: "docracy",
  version: "0.1.0",
  websiteUrl: "https://docracy.io",
  icons: [{ src: "https://docracy.io/docracy-seal-icon.png", mimeType: "image/png" }],
};
