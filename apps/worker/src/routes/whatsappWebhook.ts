import { Hono } from "hono";
import { verifyAndExtractStatuses } from "../lib/webhookProviders/whatsapp";
import { getDoc, putDoc } from "../lib/kv";
import type { AuditEvent, Env } from "@docracy/shared";

const whatsappWebhook = new Hono<{ Bindings: Env }>();

// Meta's one-time subscription-verification handshake, checked against the URL configured in the
// Meta App dashboard's WhatsApp webhook settings.
whatsappWebhook.get("/", (c) => {
  const mode = c.req.query("hub.mode");
  const token = c.req.query("hub.verify_token");
  const challenge = c.req.query("hub.challenge");
  if (mode === "subscribe" && !!c.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN && token === c.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
    return c.text(challenge ?? "");
  }
  return c.text("Forbidden", 403);
});

// Records delivery/read receipts onto the matching signer — the evidence trail behind the
// AES-track claim (see lib/whatsapp.ts's biz_opaque_callback_data comment for how a receipt maps
// back to a docId/signerOrder without a separate lookup index).
whatsappWebhook.post("/", async (c) => {
  const rawBody = await c.req.text();
  const receipts = await verifyAndExtractStatuses(rawBody, c.req.header("x-hub-signature-256") ?? null, c.env);

  for (const receipt of receipts) {
    const doc = await getDoc(c.env, receipt.docId);
    if (!doc) continue;
    const signer = doc.signers.find((s) => s.order === receipt.signerOrder);
    if (!signer) continue;

    if (receipt.status === "delivered") {
      if (signer.whatsappDeliveredAt) continue; // already recorded — skip the duplicate audit event
      signer.whatsappDeliveredAt = receipt.timestamp;
    } else {
      if (signer.whatsappReadAt) continue;
      signer.whatsappReadAt = receipt.timestamp;
    }

    const event: AuditEvent = {
      type: receipt.status === "delivered" ? "whatsapp_delivered" : "whatsapp_read",
      signerOrder: receipt.signerOrder,
      ip: null,
      userAgent: null,
      timestamp: receipt.timestamp,
      pdfSha256: null,
    };
    doc.events = [...(doc.events ?? []), event];
    await putDoc(c.env, doc);
  }

  // Always 200 — Meta (like Resend/Stripe) will eventually disable a webhook endpoint that keeps
  // returning non-2xx, and an unverifiable/empty payload isn't retry-worthy anyway.
  return c.json({ ok: true });
});

export default whatsappWebhook;
