import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { checkStatus } from "./status";
import type { ConnectorEnv as Env } from "./types";

/** Shared between the free and paid tool sets — paid accounts keep check_status, they just also
 *  get find_documents (see paidTools.ts), never lose a tool by upgrading. */
export function registerCheckStatus(server: McpServer, env: Env) {
  server.registerTool(
    "check_status",
    {
      title: "Check signing status",
      description:
        "Look up the status of a Docracy signing chain from a sign or status link — who's signed, who's still pending.",
      inputSchema: {
        link: z.string().describe("The docracy.io sign or status link (or just the token) you were emailed."),
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
}
