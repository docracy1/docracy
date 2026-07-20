import { Hono } from "hono";
import { requireApiTokenAccount, type ApiTokenAccount } from "../lib/apiTokenAuth";
import { getTemplate, listTemplates } from "../lib/templates";
import { createWebhook, deleteWebhook, WEBHOOK_EVENT_TYPES, type WebhookEventType } from "../lib/webhooks";
import { createDocumentCore } from "../lib/documentCreation";
import type { Env } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Zapier's own trigger keys are kebab-case; translate to this app's internal dot-case event
// names so the REST Hook subscribe URL can bake the event into its own path (one dedicated
// subscribe endpoint per trigger, no need to guess intent from the request body).
const EVENT_SLUGS: Record<string, WebhookEventType> = {
  "document-created": "document.created",
  "signer-signed": "document.signer.signed",
  "document-completed": "document.completed",
};

type Variables = { apiAccount: ApiTokenAccount };
const zapier = new Hono<{ Bindings: Env; Variables: Variables }>();

zapier.use("*", requireApiTokenAccount);

// Zapier's "test" step when a user connects their account — any 200 with identifying JSON works;
// the email doubles as Zapier's connection label ("Docracy (you@example.com)").
zapier.get("/auth-test", async (c) => {
  const account = c.get("apiAccount");
  return c.json({ email: account.email, workspaceId: account.workspaceId });
});

// REST Hook subscribe: Zapier calls this the moment a user turns on a Zap using this trigger,
// posting the URL it wants events delivered to. Reuses the same webhooks a Dashboard user could
// create by hand — a Zapier-created subscription is just a webhook row like any other.
zapier.post("/hooks/:event", async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const eventType = EVENT_SLUGS[c.req.param("event")];
  if (!eventType) {
    return c.json({ error: `Unknown event. Must be one of: ${Object.keys(EVENT_SLUGS).join(", ")}` }, 400);
  }

  let body: { target_url?: string };
  try {
    body = await c.req.json<{ target_url?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.target_url) {
    return c.json({ error: "Missing target_url" }, 400);
  }

  const account = c.get("apiAccount");
  const { webhookId } = await createWebhook(c.env, account.workspaceId, body.target_url, [eventType]);
  return c.json({ id: webhookId });
});

// REST Hook unsubscribe: Zapier calls this with whatever `id` the subscribe response returned,
// when a user turns the Zap off or deletes it.
zapier.delete("/hooks/:id", async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("apiAccount");
  const deleted = await deleteWebhook(c.env, account.workspaceId, c.req.param("id"));
  if (!deleted) return c.json({ error: "Subscription not found" }, 404);
  return c.json({ ok: true });
});

// Backs the Action's dynamic "which template" dropdown field.
zapier.get("/templates", async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json([]);
  }
  const account = c.get("apiAccount");
  const templates = await listTemplates(c.env, account.workspaceId);
  // Zapier's dynamic-dropdown convention: an array of {id, name} (or any object with an `id`).
  return c.json(templates.map((t) => ({ id: t.id, name: `${t.name} (${t.signerCount} signer${t.signerCount === 1 ? "" : "s"})` })));
});

interface CreateFromTemplateBody {
  templateId?: string;
  signers?: Array<{ name?: string; email?: string }>;
}

// The Action: "Send a document for signature" — reuses a saved template's PDF + field layout so
// a Zap only ever needs to supply who's signing, never a PDF upload or field placement (neither
// of which fit a Zapier action's plain-field input model).
zapier.post("/documents", async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("apiAccount");

  let body: CreateFromTemplateBody;
  try {
    body = await c.req.json<CreateFromTemplateBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.templateId) {
    return c.json({ error: "Missing templateId" }, 400);
  }

  const template = await getTemplate(c.env, account.workspaceId, body.templateId);
  if (!template) {
    return c.json({ error: "Template not found" }, 404);
  }

  const signers = body.signers ?? [];
  if (signers.length !== template.summary.signerCount) {
    return c.json(
      { error: `This template needs exactly ${template.summary.signerCount} signer(s), got ${signers.length}` },
      400
    );
  }
  for (const s of signers) {
    if (!s.name?.trim()) return c.json({ error: "Every signer needs a name" }, 400);
    if (!s.email || !EMAIL_RE.test(s.email.trim())) {
      return c.json({ error: `"${s.email}" doesn't look like a valid email address` }, 400);
    }
  }

  const { docId, statusToken } = await createDocumentCore({
    env: c.env,
    ctx: c.executionCtx,
    pdfBytes: template.pdfBytes,
    filename: `${template.summary.name}.pdf`,
    preparerSigns: false,
    signers: signers.map((s) => ({ name: s.name!.trim(), email: s.email!.trim() })),
    fields: template.fields,
    accountId: account.workspaceId,
    title: template.summary.name,
  });

  return c.json({ docId, statusToken, statusUrl: `${c.env.PUBLIC_APP_URL}/status/${statusToken}` });
});

export default zapier;
