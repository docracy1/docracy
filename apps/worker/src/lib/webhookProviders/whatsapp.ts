import type { Env } from "@docracy/shared";

async function hmacKeyForAppSecret(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["verify"]);
}

function hexDecode(hex: string): Uint8Array | null {
  if (hex.length % 2 !== 0 || !/^[0-9a-fA-F]*$/.test(hex)) return null;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

export interface WhatsappStatusReceipt {
  docId: string;
  signerOrder: number;
  status: "delivered" | "read";
  timestamp: string;
}

/**
 * Verifies Meta's `X-Hub-Signature-256` header (if WHATSAPP_APP_SECRET is configured — skipped
 * gracefully otherwise, same degrade-safe convention as RESEND_WEBHOOK_SECRET elsewhere) and
 * extracts every delivered/read status receipt from the payload. Each receipt's docId/signerOrder
 * comes from the biz_opaque_callback_data stamped at send time (lib/whatsapp.ts), so no separate
 * message-id lookup index is needed. Malformed, unverifiable, or receipt-less payloads yield [].
 */
export async function verifyAndExtractStatuses(
  rawBody: string,
  signatureHeader: string | null,
  env: Env
): Promise<WhatsappStatusReceipt[]> {
  if (env.WHATSAPP_APP_SECRET) {
    if (!signatureHeader?.startsWith("sha256=")) return [];
    const sigBytes = hexDecode(signatureHeader.slice("sha256=".length));
    if (!sigBytes) return [];
    const key = await hmacKeyForAppSecret(env.WHATSAPP_APP_SECRET);
    const valid = await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(rawBody)).catch(() => false);
    if (!valid) return [];
  }

  let payload: {
    entry?: Array<{
      changes?: Array<{
        value?: {
          statuses?: Array<{ status?: string; timestamp?: string; biz_opaque_callback_data?: string }>;
        };
      }>;
    }>;
  };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return [];
  }

  const receipts: WhatsappStatusReceipt[] = [];
  for (const entry of payload.entry ?? []) {
    for (const change of entry.changes ?? []) {
      for (const status of change.value?.statuses ?? []) {
        if (status.status !== "delivered" && status.status !== "read") continue;
        const callbackData = status.biz_opaque_callback_data;
        if (!callbackData) continue;
        const parts = callbackData.split(":");
        // A ":pin" third segment marks a PIN-delivery message (lib/whatsapp.ts's sendWhatsAppPin) —
        // whatsappDeliveredAt/whatsappReadAt track receipt of the signing link specifically, so its
        // receipts are intentionally not recorded here.
        if (parts.length !== 2) continue;
        const [docId, orderStr] = parts;
        const signerOrder = Number(orderStr);
        if (!docId || !Number.isInteger(signerOrder)) continue;
        const timestamp = status.timestamp ? new Date(Number(status.timestamp) * 1000).toISOString() : new Date().toISOString();
        receipts.push({ docId, signerOrder, status: status.status, timestamp });
      }
    }
  }
  return receipts;
}
