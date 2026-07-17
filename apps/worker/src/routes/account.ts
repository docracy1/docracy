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
  preparer_signs: number;
  order1_status: string | null;
}

account.get("/documents", requireAccount, async (c) => {
  const acct = c.get("account")!;
  if (!c.env.DOCRACY_DB) {
    return c.json({ documents: [] });
  }

  // order1_status: the preparer, when they also sign, is always seeded as signer order 1 (see
  // documentCreation.ts) — joining it here is what lets the dashboard tell "waiting on you" apart
  // from "waiting on someone else" without a second round trip.
  const { results } = await c.env.DOCRACY_DB.prepare(
    `SELECT d.doc_id, d.title, d.status, d.created_at, d.completed_at, d.preparer_signs, s1.status AS order1_status
     FROM documents d
     LEFT JOIN signers s1 ON s1.doc_id = d.doc_id AND s1."order" = 1
     WHERE d.account_id = ?
     ORDER BY d.created_at DESC`
  )
    .bind(acct.id)
    .all<DocumentRow>();

  // A viewer token (order 0) recomputed on the fly — same deterministic HMAC used when the
  // document was created (see documentCreation.ts), so the dashboard can link straight to each
  // document's existing /status/:token page without storing the token anywhere. The order-1
  // (signer) token is recomputed the same way, but only handed out when it's actually this
  // account's turn to sign.
  const documents = await Promise.all(
    results.map(async (r) => {
      const awaitingYou = r.status === "pending" && !!r.preparer_signs && r.order1_status === "pending";
      return {
        docId: r.doc_id,
        title: r.title,
        status: r.status,
        createdAt: r.created_at,
        completedAt: r.completed_at,
        statusToken: await signToken(r.doc_id, 0, c.env.TOKEN_SECRET),
        awaitingYou,
        signToken: awaitingYou ? await signToken(r.doc_id, 1, c.env.TOKEN_SECRET) : null,
      };
    })
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
