import type { Env } from "@docracy/shared";
import { requestTimestamp } from "./timestamp";
import { sendHealthAlert } from "./email";

// Any real, previously-hashed-looking value works here — FreeTSA only cares that it's 32 bytes
// of hex, not that it corresponds to a real document.
const PROBE_SHA256_HEX = "0".repeat(64);

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

export async function runHealthCheck(env: Env): Promise<HealthCheckResult[]> {
  return Promise.all([checkFreeTSA(), checkStripe(env), checkD1(env), checkKV(env)]);
}

/** Runs daily alongside the reminder sweep (see index.ts) — emails FEEDBACK_EMAIL only when
 *  something is actually broken, never on a clean run. */
export async function runHealthCheckAndAlert(env: Env): Promise<void> {
  const results = await runHealthCheck(env);
  const failures = results.filter((r) => !r.ok);
  if (failures.length > 0) {
    await sendHealthAlert(env, failures);
  }
}
