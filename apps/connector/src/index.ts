import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { createMcpHandler } from "agents/mcp";
import { z } from "zod";
import { checkStatus } from "./status";
import type { ConnectorEnv as Env } from "./types";

// Free tier: exactly one tool, no login required — mirrors the status page anyone in a
// signing chain can already see, just reachable from Claude instead of a browser. Everything
// else (find_documents, summarize_document, etc.) needs a paid account and ships in a later
// phase once accounts/OAuth exist.
function buildServer(env: Env) {
  const server = new McpServer({ name: "docracy", version: "0.1.0" });

  server.registerTool(
    "check_status",
    {
      title: "Check signing status",
      description:
        "Look up the status of a Docracy signing chain from a sign or status link — who's signed, who's still pending.",
      inputSchema: {
        link: z.string().describe("The docracy.pages.dev sign or status link (or just the token) you were emailed."),
      },
    },
    async ({ link }) => {
      const result = await checkStatus(env, link);
      if (!result.found) {
        return { content: [{ type: "text", text: result.error ?? "Not found." }] };
      }
      const lines = (result.signers ?? []).map((s) =>
        s.status === "signed"
          ? `Signed by: ${s.name} ✓ (${new Date(s.signedAt!).toLocaleDateString()})`
          : `Pending: ${s.name}`
      );
      const summary = result.status === "completed" ? "Fully signed." : "Signing in progress.";
      return { content: [{ type: "text", text: [summary, ...lines].join("\n") }] };
    }
  );

  return server;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const handler = createMcpHandler(buildServer(env), { route: "/mcp" });
    return handler(request, env, ctx);
  },
};
