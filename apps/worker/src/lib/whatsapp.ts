import type { DocState, Env } from "@docracy/shared";

// A stalled connection to Meta's Graph API must still give up in bounded time — same reasoning as
// email.ts's RESEND_TIMEOUT_MS.
const WHATSAPP_TIMEOUT_MS = 8000;
const GRAPH_API_VERSION = "v20.0";

/** Normalizes an international phone number to E.164 ("+15551234567"), or null if invalid.
 *  Unlike lib/sms.ts's normalizeUsPhone, this isn't restricted to US numbers — WhatsApp is a
 *  global channel. Accepts 8-15 digits (ITU E.164 range), with or without a leading "+". */
export function normalizeE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 8 || digits.length > 15) return null;
  if (digits.startsWith("0")) return null;
  return `+${digits}`;
}

/**
 * Sends the signing link as a pre-approved WhatsApp template message via Meta's Cloud API.
 * No-ops (never throws) if the doc has WhatsApp invites off, the signer has no whatsappPhone, or
 * the number doesn't normalize. Falls back to a console.log dev line when WHATSAPP_ACCESS_TOKEN /
 * WHATSAPP_PHONE_NUMBER_ID aren't configured, matching email.ts's send()/lib/sms.ts's dev-fallback
 * convention.
 *
 * biz_opaque_callback_data carries "{docId}:{signerOrder}" — Meta echoes this back verbatim on the
 * delivery/read status callbacks (see routes/whatsappWebhook.ts), so that webhook can attribute a
 * receipt to the right signer without needing a separate message-id lookup index.
 */
export async function sendWhatsAppSigningLink(env: Env, doc: DocState, signerOrder: number, signUrl: string): Promise<void> {
  if (!doc.whatsappInvites) return;

  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer?.whatsappPhone) return;

  const to = normalizeE164(signer.whatsappPhone);
  if (!to) return;

  const templateName = env.WHATSAPP_TEMPLATE_NAME || "signing_invite";
  const templateLang = env.WHATSAPP_TEMPLATE_LANG || (doc.locale === "es" ? "es" : "en_US");

  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[whatsapp:dev] to=${to} template=${templateName}/${templateLang} link=${signUrl}`);
    return;
  }

  const body = {
    messaging_product: "whatsapp",
    to: to.replace("+", ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [{ type: "body", parameters: [{ type: "text", text: signUrl }] }],
    },
    biz_opaque_callback_data: `${doc.docId}:${signerOrder}`,
  };

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), WHATSAPP_TIMEOUT_MS);
  try {
    const res = await fetch(`https://graph.facebook.com/${GRAPH_API_VERSION}/${env.WHATSAPP_PHONE_NUMBER_ID}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`WhatsApp send failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("WhatsApp request failed:", err);
  } finally {
    clearTimeout(timeout);
  }
}
