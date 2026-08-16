import { createMcpHandler } from "agents/mcp";
import { buildFreeServer, buildPaidServer } from "./paidTools";
import { resolvePaidAccountId } from "./tokenAuth";
import type { ConnectorEnv as Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    // mcp.docracy.io serves no browsable pages — /mcp is an auth-gated Streamable HTTP endpoint
    // that 401s without a valid API key. Without this, Cloudflare's own default robots.txt permits
    // Googlebot to crawl the domain, which then reports that 401 as an indexing error in Search
    // Console for a page that was never meant to be indexed.
    if (new URL(request.url).pathname === "/robots.txt") {
      return new Response("User-agent: *\nDisallow: /\n", { headers: { "content-type": "text/plain" } });
    }

    const accountId = await resolvePaidAccountId(request, env);
    if (!accountId) {
      // Time-boxed test (see paidTools.ts's buildFreeServer): serves check_status only, so an
      // anonymous AI-agent caller gets one real, useful tool instead of an immediate 401. Remove
      // this branch (and the FREE_CHECK_STATUS_TEST var in wrangler.toml) to revert to paid-only.
      if (env.FREE_CHECK_STATUS_TEST === "true") {
        const freeServer = buildFreeServer(env);
        const freeHandler = createMcpHandler(freeServer, { route: "/mcp" });
        return freeHandler(request, env, ctx);
      }
      return Response.json(
        {
          error:
            "A paid Docracy API key is required. Sign in, upgrade, then copy your connector URL from Dashboard → Connector & API key.",
        },
        { status: 401, headers: { "WWW-Authenticate": 'Bearer realm="docracy"' } }
      );
    }
    const server = buildPaidServer(env, accountId);
    const handler = createMcpHandler(server, { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
