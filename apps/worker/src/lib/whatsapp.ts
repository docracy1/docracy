import { signToken, type DocState, type Env, type Locale } from "@docracy/shared";

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
 * POSTs a single-variable template message to Meta's Cloud API — shared by sendWhatsAppSigningLink
 * and sendWhatsAppPin, which differ only in template name, variable name/value, and the
 * biz_opaque_callback_data suffix. Never throws; falls back to a console.log dev line when
 * WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID aren't configured, matching email.ts's send()/
 * lib/sms.ts's dev-fallback convention.
 */
async function sendWhatsAppTemplate(
  env: Env,
  to: string,
  templateName: string,
  templateLang: string,
  parameterName: string,
  parameterValue: string,
  bizOpaqueCallbackData: string
): Promise<void> {
  if (!env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID) {
    console.log(`[whatsapp:dev] to=${to} template=${templateName}/${templateLang} ${parameterName}=${parameterValue}`);
    return;
  }

  const body = {
    messaging_product: "whatsapp",
    to: to.replace("+", ""),
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      // Named body variable, not positional {{1}} — "parameter_name" is the Meta-documented field
      // for this; confirmed correct against the official Cloud API docs.
      components: [{ type: "body", parameters: [{ type: "text", parameter_name: parameterName, text: parameterValue }] }],
    },
    biz_opaque_callback_data: bizOpaqueCallbackData,
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

function whatsappTemplateLang(env: Env, doc: DocState): string {
  return env.WHATSAPP_TEMPLATE_LANG || (doc.locale === "es" ? "es" : "en_US");
}

/**
 * Sends the signing link as a pre-approved WhatsApp template message via Meta's Cloud API.
 * No-ops (never throws) if the doc has WhatsApp invites off, the signer has no whatsappPhone, or
 * the number doesn't normalize.
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
  await sendWhatsAppTemplate(env, to, templateName, whatsappTemplateLang(env, doc), "signing_link", signUrl, `${doc.docId}:${signerOrder}`);
}

/**
 * Sends a signer's PIN as a separate, pre-approved WhatsApp template message — always via a
 * distinct template from the signing-invite one (WHATSAPP_PIN_TEMPLATE_NAME, default
 * "signing_pin"), since re-using the invite template's approved wording for a different variable's
 * meaning would misrepresent the message to Meta's review. Called ~30 seconds after the signing
 * link by lib/pinDelivery.ts, for signers who chose "whatsapp" as their pinDeliveryChannel.
 *
 * biz_opaque_callback_data gets a ":pin" suffix so routes/whatsappWebhook.ts can tell this receipt
 * apart from the signing-link one and skip it — whatsappDeliveredAt/whatsappReadAt track receipt of
 * the signing link specifically, not of this follow-up message.
 */
export async function sendWhatsAppPin(env: Env, doc: DocState, signerOrder: number, pin: string): Promise<void> {
  const signer = doc.signers.find((s) => s.order === signerOrder);
  if (!signer?.whatsappPhone) return;

  const to = normalizeE164(signer.whatsappPhone);
  if (!to) return;

  const templateName = env.WHATSAPP_PIN_TEMPLATE_NAME || "signing_pin";
  await sendWhatsAppTemplate(env, to, templateName, whatsappTemplateLang(env, doc), "pin_code", pin, `${doc.docId}:${signerOrder}:pin`);
}

/** Canonical forwardable URL for the signed PDF (+ pay CTA when the sender attached a checkout). */
export function signedPageUrl(appUrl: string, token: string, locale: Locale = "en"): string {
  const path = locale === "es" ? `/es/firmado/${token}` : `/signed/${token}`;
  return `${appUrl.replace(/\/$/, "")}${path}`;
}

/**
 * After the chain completes, text each WhatsApp signer the shareable signed-copy (and pay) page.
 * Reuses the live invite template (`WHATSAPP_TEMPLATE_NAME` / `signing_invite`, named variable
 * `signing_link`) — same approved Meta template as sendWhatsAppSigningLink, with the /signed URL
 * in the link slot. No second template to submit. The invite copy still reads as a link to open;
 * the page itself is the completed PDF + pay CTA.
 *
 * Does not consume extra monthly quota: follow-up on an already-counted invite. Never throws.
 * biz_opaque_callback_data uses a ":done" suffix so the inbound webhook ignores these receipts
 * the same way it ignores PIN messages (parts.length !== 2).
 */
export async function sendWhatsAppCompletedReceipts(env: Env, doc: DocState): Promise<void> {
  if (!doc.whatsappInvites) return;

  const locale: Locale = doc.locale ?? "en";
  const statusToken = await signToken(doc.docId, 0, env.TOKEN_SECRET);
  const receiptUrl = signedPageUrl(env.PUBLIC_APP_URL, statusToken, locale);
  const templateName = env.WHATSAPP_TEMPLATE_NAME || "signing_invite";
  const lang = whatsappTemplateLang(env, doc);

  for (const signer of doc.signers) {
    if (!signer.whatsappPhone) continue;
    const to = normalizeE164(signer.whatsappPhone);
    if (!to) continue;
    await sendWhatsAppTemplate(
      env,
      to,
      templateName,
      lang,
      "signing_link",
      receiptUrl,
      `${doc.docId}:${signer.order}:done`
    );
  }
}
