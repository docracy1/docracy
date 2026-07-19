import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { createWebhook, listWebhooks, deleteWebhook, WEBHOOK_EVENT_TYPES, type WebhookEventType } from "../lib/webhooks";
import type { Env } from "@docracy/shared";

interface CreateWebhookBody {
  url: string;
  events: string[];
}

const MAX_WEBHOOKS_PER_ACCOUNT = 10;

type Variables = { account: AccountContext | null };
const webhooks = new Hono<{ Bindings: Env; Variables: Variables }>();

webhooks.post("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;

  let body: CreateWebhookBody;
  try {
    body = await c.req.json<CreateWebhookBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  let url: URL;
  try {
    url = new URL(body.url);
  } catch {
    return c.json({ error: "That doesn't look like a valid URL" }, 400);
  }
  if (url.protocol !== "https:") {
    return c.json({ error: "Webhook URL must use https://" }, 400);
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return c.json({ error: "At least one event must be selected" }, 400);
  }
  if (!body.events.every((e) => (WEBHOOK_EVENT_TYPES as readonly string[]).includes(e))) {
    return c.json({ error: `events must be one of: ${WEBHOOK_EVENT_TYPES.join(", ")}` }, 400);
  }

  const existing = await listWebhooks(c.env, account.id);
  if (existing.length >= MAX_WEBHOOKS_PER_ACCOUNT) {
    return c.json({ error: `You can have up to ${MAX_WEBHOOKS_PER_ACCOUNT} webhooks` }, 400);
  }

  const { webhookId, secret } = await createWebhook(c.env, account.id, url.toString(), body.events as WebhookEventType[]);
  return c.json({ webhookId, secret });
});

webhooks.get("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ webhooks: [] });
  }
  const account = c.get("account")!;
  const list = await listWebhooks(c.env, account.id);
  return c.json({ webhooks: list });
});

webhooks.delete("/:id", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  const deleted = await deleteWebhook(c.env, account.id, c.req.param("id"));
  if (!deleted) {
    return c.json({ error: "Webhook not found" }, 404);
  }
  return c.json({ ok: true });
});

export default webhooks;
