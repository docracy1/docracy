import { createMcpHandler } from "agents/mcp";
import { buildPaidServer } from "./paidTools";
import { resolvePaidAccountId } from "./tokenAuth";
import type { ConnectorEnv as Env } from "./types";

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
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
