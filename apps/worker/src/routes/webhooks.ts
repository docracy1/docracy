import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { createWebhook, listWebhooks, deleteWebhook, WEBHOOK_EVENT_TYPES, type WebhookEventType } from "../lib/webhooks";
import type { Env } from "@docracy/shared";

interface CreateWebhookBody {
  url: string;
  events: string[];
}

const MAX_WEBHOOKS_PER_ACCOUNT = 10;

/** Block localhost / private / link-local hosts to reduce SSRF via outbound webhook delivery. */
export function isBlockedWebhookHost(hostname: string): boolean {
  let host = hostname.toLowerCase().replace(/\.$/, "");
  if (host.startsWith("[") && host.endsWith("]")) host = host.slice(1, -1);

  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host === "0:0:0:0:0:0:0:1"
  ) {
    return true;
  }
  if (host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) return true;

  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const parts = ipv4.slice(1).map((p) => Number(p));
    if (parts.some((n) => n > 255)) return true;
    const [a, b] = parts;
    if (a === 0 || a === 10 || a === 127) return true;
    if (a === 169 && b === 254) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 100 && b >= 64 && b <= 127) return true; // CGNAT
  }
  return false;
}

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
  if (isBlockedWebhookHost(url.hostname)) {
    return c.json({ error: "Webhook URL host is not allowed" }, 400);
  }

  if (!Array.isArray(body.events) || body.events.length === 0) {
    return c.json({ error: "At least one event must be selected" }, 400);
  }
  if (!body.events.every((e) => (WEBHOOK_EVENT_TYPES as readonly string[]).includes(e))) {
    return c.json({ error: `events must be one of: ${WEBHOOK_EVENT_TYPES.join(", ")}` }, 400);
  }

  const existing = await listWebhooks(c.env, account.workspaceId);
  if (existing.length >= MAX_WEBHOOKS_PER_ACCOUNT) {
    return c.json({ error: `You can have up to ${MAX_WEBHOOKS_PER_ACCOUNT} webhooks` }, 400);
  }

  const { webhookId, secret } = await createWebhook(c.env, account.workspaceId, url.toString(), body.events as WebhookEventType[]);
  return c.json({ webhookId, secret });
});

webhooks.get("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ webhooks: [] });
  }
  const account = c.get("account")!;
  const list = await listWebhooks(c.env, account.workspaceId);
  return c.json({ webhooks: list });
});

webhooks.delete("/:id", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  const deleted = await deleteWebhook(c.env, account.workspaceId, c.req.param("id"));
  if (!deleted) {
    return c.json({ error: "Webhook not found" }, 404);
  }
  return c.json({ ok: true });
});

export default webhooks;
