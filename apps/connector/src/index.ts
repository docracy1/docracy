import { createMcpHandler } from "agents/mcp";
import { buildFreeServer, buildPaidServer } from "./paidTools";
import { resolvePaidAccountId } from "./tokenAuth";
import type { ConnectorEnv as Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // mcp.docracy.io serves no browsable pages — /mcp is an MCP protocol endpoint, not a page
    // meant for search indexing (find_documents still 401s without a valid API key). Without this,
    // Cloudflare's own default robots.txt permits Googlebot to crawl the domain, which then reports
    // those responses as indexing errors in Search Console for a page that was never meant to be
    // indexed.
    if (new URL(request.url).pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
    }

    const accountId = await resolvePaidAccountId(request, env);
    if (!accountId) {
      // check_status is free for anyone — see paidTools.ts's buildFreeServer. It only resolves a
      // link/token the caller already has, so there's no private data at stake; find_documents
      // stays paid-only below.
      const freeServer = buildFreeServer(env);
      const freeHandler = createMcpHandler(freeServer, { route: "/mcp" });
      return freeHandler(request, env, ctx);
    }
    const server = buildPaidServer(env, accountId);
    const handler = createMcpHandler(server, { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
