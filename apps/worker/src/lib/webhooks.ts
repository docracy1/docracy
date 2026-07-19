import { generateOpaqueToken, hmacKey } from "@docracy/shared";
import type { Env } from "@docracy/shared";

export const WEBHOOK_EVENT_TYPES = ["document.created", "document.signer.signed", "document.completed"] as const;
export type WebhookEventType = (typeof WEBHOOK_EVENT_TYPES)[number];

export interface WebhookSummary {
  id: string;
  url: string;
  events: WebhookEventType[];
  createdAt: string;
}

interface WebhookRow {
  id: string;
  account_id: string;
  url: string;
  secret: string;
  events: string;
  created_at: string;
}

function rowToSummary(row: WebhookRow): WebhookSummary {
  return { id: row.id, url: row.url, events: JSON.parse(row.events) as WebhookEventType[], createdAt: row.created_at };
}

/** Webhooks only ever belong to a paid account — every caller has already gone through
 *  requirePaidAccount, so a missing D1 binding here means the deployment simply hasn't been
 *  configured for it yet, not a real runtime state to recover from. */
function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

export async function createWebhook(
  env: Env,
  accountId: string,
  url: string,
  events: WebhookEventType[]
): Promise<{ webhookId: string; secret: string }> {
  const db = requireDb(env);
  const webhookId = crypto.randomUUID();
  const secret = `whsec_${generateOpaqueToken()}`;
  await db
    .prepare(`INSERT INTO webhooks (id, account_id, url, secret, events, created_at) VALUES (?, ?, ?, ?, ?, ?)`)
    .bind(webhookId, accountId, url, secret, JSON.stringify(events), new Date().toISOString())
    .run();
  return { webhookId, secret };
}

export async function listWebhooks(env: Env, accountId: string): Promise<WebhookSummary[]> {
  const db = requireDb(env);
  const { results } = await db
    .prepare(`SELECT * FROM webhooks WHERE account_id = ? ORDER BY created_at DESC`)
    .bind(accountId)
    .all<WebhookRow>();
  return results.map(rowToSummary);
}

export async function deleteWebhook(env: Env, accountId: string, webhookId: string): Promise<boolean> {
  const db = requireDb(env);
  // A SELECT-then-DELETE rather than trusting a row-count from the DELETE itself, so ownership is
  // checked the same way (and as portably) as templates.ts's deleteTemplate.
  const row = await db.prepare(`SELECT id FROM webhooks WHERE id = ? AND account_id = ?`).bind(webhookId, accountId).first();
  if (!row) return false;
  await db.prepare(`DELETE FROM webhooks WHERE id = ?`).bind(webhookId).run();
  return true;
}

const DELIVERY_TIMEOUT_MS = 8000;

async function signPayload(secret: string, body: string): Promise<string> {
  const key = await hmacKey(secret);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Best-effort, single-attempt delivery to every one of an account's webhooks subscribed to
 * `eventType` — mirrors requestTimestamp's fetch-with-timeout shape (timestamp.ts) and the
 * fire-and-forget non-fatal-on-failure convention used throughout for outbound network calls.
 * Never throws; a slow or failing subscriber endpoint must never affect the signing flow that
 * triggered it. No delivery log or retry queue in v1 — same posture as outbound email today.
 */
export async function deliverWebhookEvent(
  env: Env,
  accountId: string,
  eventType: WebhookEventType,
  payload: unknown
): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const db = env.DOCRACY_DB;
  const { results } = await db
    .prepare(`SELECT * FROM webhooks WHERE account_id = ?`)
    .bind(accountId)
    .all<WebhookRow>();

  const subscribed = results.filter((row) => (JSON.parse(row.events) as string[]).includes(eventType));
  if (subscribed.length === 0) return;

  const body = JSON.stringify({ event: eventType, data: payload });

  await Promise.all(
    subscribed.map(async (row) => {
      try {
        const signature = await signPayload(row.secret, body);
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), DELIVERY_TIMEOUT_MS);
        try {
          await fetch(row.url, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Docracy-Event": eventType,
              "X-Docracy-Signature": signature,
            },
            body,
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timeout);
        }
      } catch (err) {
        console.error(`Webhook delivery failed for account ${accountId}, webhook ${row.id} (non-fatal):`, err);
      }
    })
  );
}
