import type { Env } from "@docracy/shared";
import { requestTimestamp } from "./timestamp";
import { sendHealthAlert } from "./email";

// Any real, previously-hashed-looking value works here — FreeTSA only cares that it's 32 bytes
// of hex, not that it corresponds to a real document.
const PROBE_SHA256_HEX = "0".repeat(64);

// How many days of daily status history to keep in KV — old entries are left to expire via TTL
// rather than actively pruned, so this only needs to bound the read, not the write.
const STATUS_HISTORY_DAYS = 90;
const STATUS_HISTORY_TTL_SECONDS = 100 * 24 * 60 * 60;

export interface HealthCheckResult {
  name: string;
  ok: boolean;
  detail?: string;
}

async function checkFreeTSA(): Promise<HealthCheckResult> {
  const result = await requestTimestamp(PROBE_SHA256_HEX);
  return result ? { name: "FreeTSA", ok: true } : { name: "FreeTSA", ok: false, detail: "requestTimestamp returned null" };
}

async function checkStripe(env: Env): Promise<HealthCheckResult> {
  if (!env.STRIPE_SECRET_KEY) return { name: "Stripe", ok: true, detail: "not configured" };
  try {
    const res = await fetch("https://api.stripe.com/v1/balance", {
      headers: { Authorization: `Bearer ${env.STRIPE_SECRET_KEY}` },
    });
    return res.ok ? { name: "Stripe", ok: true } : { name: "Stripe", ok: false, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { name: "Stripe", ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function checkD1(env: Env): Promise<HealthCheckResult> {
  if (!env.DOCRACY_DB) return { name: "D1", ok: true, detail: "not configured" };
  try {
    await env.DOCRACY_DB.prepare("SELECT 1").first();
    return { name: "D1", ok: true };
  } catch (err) {
    return { name: "D1", ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function checkKV(env: Env): Promise<HealthCheckResult> {
  try {
    await env.DOCRACY_KV.get("healthcheck:probe");
    return { name: "KV", ok: true };
  } catch (err) {
    return { name: "KV", ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

async function checkMcpConnector(env: Env): Promise<HealthCheckResult> {
  try {
    const res = await fetch(`${env.PUBLIC_CONNECTOR_URL}/mcp`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json, text/event-stream" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list" }),
    });
    return res.ok
      ? { name: "MCP connector", ok: true }
      : { name: "MCP connector", ok: false, detail: `HTTP ${res.status}` };
  } catch (err) {
    return { name: "MCP connector", ok: false, detail: err instanceof Error ? err.message : String(err) };
  }
}

export async function runHealthCheck(env: Env): Promise<HealthCheckResult[]> {
  return Promise.all([checkFreeTSA(), checkStripe(env), checkD1(env), checkKV(env), checkMcpConnector(env)]);
}

/** Runs daily alongside the reminder sweep (see index.ts) — emails FEEDBACK_EMAIL only when
 *  something is actually broken, never on a clean run. Also persists today's result to KV so the
 *  public status page (GET /api/status) can show a real history rather than only "right now" —
 *  starting from whenever this first deploys, never backfilled/fabricated for earlier dates. */
export async function runHealthCheckAndAlert(env: Env): Promise<void> {
  const results = await runHealthCheck(env);
  await recordDailyStatus(env, results);
  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    await sendHealthAlert(env, failures);
  }
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // yyyy-mm-dd
}

export interface DailyStatusRecord {
  date: string;
  ok: boolean;
  results: HealthCheckResult[];
}

async function recordDailyStatus(env: Env, results: HealthCheckResult[]): Promise<void> {
  const record: DailyStatusRecord = { date: todayKey(), ok: results.every((r) => r.ok), results };
  await env.DOCRACY_KV.put(`status-history:${record.date}`, JSON.stringify(record), {
    expirationTtl: STATUS_HISTORY_TTL_SECONDS,
  });
}

/** Reads whatever daily records actually exist for the last `STATUS_HISTORY_DAYS` days — short at
 *  first (real history only starts accumulating once this ships), never padded with fabricated
 *  "operational" days before tracking began. */
export async function readStatusHistory(env: Env): Promise<DailyStatusRecord[]> {
  const days: string[] = [];
  const now = new Date();
  for (let i = 0; i < STATUS_HISTORY_DAYS; i++) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
    days.push(d.toISOString().slice(0, 10));
  }
  const records = await Promise.all(
    days.map(async (date) => {
      const raw = await env.DOCRACY_KV.get(`status-history:${date}`);
      return raw ? (JSON.parse(raw) as DailyStatusRecord) : null;
    })
  );
  return records.filter((r): r is DailyStatusRecord => r !== null).sort((a, b) => a.date.localeCompare(b.date));
}
