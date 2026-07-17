import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { registerCheckStatus } from "./checkStatusTool";
import { SERVER_INFO } from "./serverInfo";
import type { ConnectorEnv as Env } from "./types";

export interface DocumentSearchResult {
  docId: string;
  title: string;
  status: string;
  createdAt: string;
}

interface DocumentSearchRow {
  doc_id: string;
  title: string;
  status: string;
  created_at: string;
}

/**
 * Every query is filtered by `accountId`, which the caller (index.ts) resolves server-side from
 * the caller's own API token — never a client-supplied value, so one paid account can never see
 * another's documents.
 */
export async function findDocuments(env: Env, accountId: string, query: string): Promise<DocumentSearchResult[]> {
  if (!env.DOCRACY_DB) return [];

  const trimmed = query.trim();
  const like = `%${trimmed}%`;
  const { results } = await env.DOCRACY_DB.prepare(
    `SELECT DISTINCT d.doc_id, d.title, d.status, d.created_at
     FROM documents d
     LEFT JOIN signers s ON s.doc_id = d.doc_id
     WHERE d.account_id = ?
       AND (? = '' OR d.title LIKE ? OR s.name LIKE ? OR s.email LIKE ? OR s.company LIKE ?)
     ORDER BY d.created_at DESC
     LIMIT 20`
  )
    .bind(accountId, trimmed, like, like, like, like)
    .all<DocumentSearchRow>();

  return results.map((r) => ({ docId: r.doc_id, title: r.title, status: r.status, createdAt: r.created_at }));
}

/** Paid tool set, scoped to a single already-resolved account (see index.ts) — everything the
 *  free tier gets, plus find_documents. Upgrading never takes a tool away. */
export function buildPaidServer(env: Env, accountId: string) {
  const server = new McpServer(SERVER_INFO);
  registerCheckStatus(server, env);

  server.registerTool(
    "find_documents",
    {
      title: "Find your documents",
      description:
        "Search your own Docracy documents by title or a signer's name/email/company. Leave the query empty to list your most recent documents.",
      inputSchema: {
        query: z.string().optional().describe("Text to search for, or omit to list recent documents."),
      },
    },
    async ({ query }) => {
      const results = await findDocuments(env, accountId, query ?? "");
      if (results.length === 0) {
        return { content: [{ type: "text", text: "No matching documents found." }] };
      }
      const lines = results.map(
        (r) => `${r.title} — ${r.status} (created ${new Date(r.createdAt).toLocaleDateString()})`
      );
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  return server;
}
