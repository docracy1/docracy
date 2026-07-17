import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { registerCheckStatus } from "./checkStatusTool";
import { buildPaidServer } from "./paidTools";
import { SERVER_INFO } from "./serverInfo";
import { resolvePaidAccountId } from "./tokenAuth";
import type { ConnectorEnv as Env } from "./types";

// Free tier: exactly one tool, no login required — mirrors the status page anyone in a
// signing chain can already see, just reachable from Claude instead of a browser. A valid API
// token (see tokenAuth.ts) unlocks the paid tool set instead (see paidTools.ts), which keeps this
// tool and adds find_documents on top of it.
function buildServer(env: Env) {
  const server = new McpServer(SERVER_INFO);
  registerCheckStatus(server, env);
  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const accountId = await resolvePaidAccountId(request, env);
    const server = accountId ? buildPaidServer(env, accountId) : buildServer(env);
    const handler = createMcpHandler(server, { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
