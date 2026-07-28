import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { bulkSendFromTemplate } from "../lib/bulkSend";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const bulkSend = new Hono<{ Bindings: Env; Variables: Variables }>();

bulkSend.post("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;

  let body: {
    templateId?: string;
    recipients?: Array<{ signers?: Array<{ name?: string; email?: string }>; title?: string }>;
    ttlDays?: number;
    customSubject?: string;
    customMessage?: string;
    signingMode?: "sequential" | "parallel";
    preparerEmail?: string;
  };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  if (!body.templateId) {
    return c.json({ error: "Missing templateId" }, 400);
  }
  if (body.signingMode !== undefined && body.signingMode !== "sequential" && body.signingMode !== "parallel") {
    return c.json({ error: "signingMode must be 'sequential' or 'parallel'" }, 400);
  }

  const result = await bulkSendFromTemplate({
    env: c.env,
    ctx: c.executionCtx,
    workspaceId: account.workspaceId,
    templateId: body.templateId,
    recipients: (body.recipients ?? []).map((r) => ({
      signers: (r.signers ?? []).map((s) => ({ name: s.name ?? "", email: s.email ?? "" })),
      title: r.title,
    })),
    ttlDays: body.ttlDays,
    customSubject: body.customSubject?.trim() || undefined,
    customMessage: body.customMessage?.trim() || undefined,
    signingMode: body.signingMode,
    preparerEmail: body.preparerEmail,
  });

  if ("error" in result) {
    return c.json({ error: result.error }, result.status);
  }
  return c.json(result);
});

export default bulkSend;
