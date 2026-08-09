import { createMcpHandler } from "agents/mcp";
import { buildPaidServer } from "./paidTools";
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
