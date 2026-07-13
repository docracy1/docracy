import { Hono } from "hono";
import { requireAccount, requirePaidAccount, type AccountContext } from "../lib/auth";
import { issueApiToken, hasApiToken } from "../lib/apiTokens";
import { signToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const account = new Hono<{ Bindings: Env; Variables: Variables }>();

interface DocumentRow {
  doc_id: string;
  title: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

account.get("/documents", requireAccount, async (c) => {
  const acct = c.get("account")!;
  if (!c.env.DOCRACY_DB) {
    return c.json({ documents: [] });
  }

  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT doc_id, title, status, created_at, completed_at FROM documents WHERE account_id = ? ORDER BY created_at DESC`
  )
    .bind(acct.id)
    .all<DocumentRow>();

  // A viewer token (order 0) recomputed on the fly — same deterministic HMAC used when the
  // document was created (see documentCreation.ts), so the dashboard can link straight to each
  // document's existing /status/:token page without storing the token anywhere.
  const documents = await Promise.all(
    results.map(async (r) => ({
      docId: r.doc_id,
      title: r.title,
      status: r.status,
      createdAt: r.created_at,
      completedAt: r.completed_at,
      statusToken: await signToken(r.doc_id, 0, c.env.TOKEN_SECRET),
    }))
  );

  return c.json({ documents });
});

account.get("/token", requirePaidAccount, async (c) => {
  const acct = c.get("account")!;
  const hasToken = await hasApiToken(c.env, acct.id);
  return c.json({ hasToken });
});

account.post("/token/regenerate", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const acct = c.get("account")!;
  const token = await issueApiToken(c.env, acct.id);
  return c.json({ token, connectorUrl: `${c.env.PUBLIC_CONNECTOR_URL}/mcp?token=${token}` });
});

export default account;
