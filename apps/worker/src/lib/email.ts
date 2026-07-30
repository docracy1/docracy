import { resolveEmailLogoUrl } from "./branding";
import { mergePdfs } from "./pdf";
import { trackEvent } from "./analytics";
import { sendSigningSmsLink } from "./sms";
import type { DocState, Env } from "@docracy/shared";

// docracy.io is verified in Resend (DKIM on the root domain, SPF/bounce handling via the
// send.docracy.io subdomain) — the visible sender address is the root domain itself.
const FROM = "Docracy <noreply@docracy.io>";

// Every caller of this already runs non-blocking (ctx.waitUntil) or is itself best-effort, but a
// stalled connection to Resend should still give up in bounded time rather than hang forever —
// same reasoning as the FreeTSA client's timeout.
const RESEND_TIMEOUT_MS = 8000;

/** POSTs to Resend's API with a timeout, logging (never throwing) on failure — a broken outbound
 *  email call must never surface as an error to whatever triggered the send. */
async function resendFetch(env: Env, body: unknown): Promise<void> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), RESEND_TIMEOUT_MS);
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      console.error(`Resend send failed (${res.status}): ${await res.text()}`);
    }
  } catch (err) {
    console.error("Resend request failed:", err);
  } finally {
    clearTimeout(timeout);
  }
}

interface SendOptions {
  /** Short, stable label identifying which email template this is (e.g. "signing_invite",
   *  "onboarding_step1") — attached to the Resend send as a tag (echoed back verbatim on every
   *  webhook event for this message, see routes/resendWebhook.ts) and to the email_sent funnel
   *  event, so opens/clicks/bounces can be attributed back to a specific campaign. Required, not
   *  optional, so a new call site can't silently ship with no attribution. */
  emailType: string;
  replyTo?: string;
}

async function send(env: Env, to: string, subject: string, html: string, opts: SendOptions): Promise<void> {
  trackEvent(env, { event: "email_sent", emailType: opts.emailType });
  if (!env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${to} subject="${subject}"${opts.replyTo ? ` reply-to=${opts.replyTo}` : ""}\n${html}\n`);
    return;
  }
  await resendFetch(env, {
    from: FROM,
    to,
    subject,
    html,
    tags: [{ name: "email_type", value: opts.emailType }],
    ...(opts.replyTo ? { reply_to: opts.replyTo } : {}),
  });
}

/** Plain-text outbound email — used for US carrier email-to-SMS gateways (lib/sms.ts). */
export async function sendPlainText(env: Env, to: string, text: string, emailType: string): Promise<void> {
  trackEvent(env, { event: "email_sent", emailType });
  const subject = text.length > 70 ? `${text.slice(0, 67)}…` : text;
  if (!env.RESEND_API_KEY) {
    console.log(`[sms:dev] to=${to}\n${text}\n`);
    return;
  }
  await resendFetch(env, {
    from: FROM,
    to,
    subject,
    text,
    tags: [{ name: "email_type", value: emailType }],
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function statusLines(doc: DocState): string {
  return [...doc.signers]
    .sort((a, b) => a.order - b.order)
    .map((s) => {
      if (s.status === "signed") return `Signed by: ${escapeHtml(s.name)} ✓ (${formatDate(s.signedAt!)})`;
      if (s.status === "declined") return `Declined: ${escapeHtml(s.name)}`;
      return `Pending: ${escapeHtml(s.name)}`;
    })
    .join("<br>");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const PRIMARY = "#2f7ed8";
const INK = "#1a2b3c";
const MUTED = "#6b7785";

/** Shared branded shell for Docracy's outbound email — Swipesign-style: light gray canvas,
 *  white card, centered logo, table layout (email clients don't reliably support flexbox/grid).
 *
 *  Header: logo only, centered — `customLogoUrl` swaps in a workspace's own branding here (only
 *  ever passed by signer-facing emails). Footer: always Docracy's own wordmark + short tagline,
 *  plus a plain-text sign-off with no personal name (never "Odo"/founder/"team" — see SIGN_OFF). */
function emailShell(appUrl: string, bodyHtml: string, customLogoUrl?: string | null): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#eef1f5;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;max-width:520px;width:100%;">
        <tr>
          <td align="center" style="padding:32px 32px 12px 32px;">
            <img src="${customLogoUrl ?? `${appUrl}/docracy-wordmark.png`}" alt="${customLogoUrl ? "" : "Docracy"}" width="120" style="display:block;width:120px;max-width:120px;height:auto;margin:0 auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:8px 36px 36px 36px;">
            ${bodyHtml}
          </td>
        </tr>
      </table>
      <table role="presentation" width="520" cellpadding="0" cellspacing="0" style="max-width:520px;width:100%;">
        <tr>
          <td style="padding:24px 32px 0 32px;text-align:center;font-size:12px;color:${MUTED};line-height:1.6;">
            Free, no-signup e-signatures · <a href="${appUrl}" style="color:${MUTED};text-decoration:underline;">docracy.io</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

/** Centered, brand-blue headline — matches the Swipesign mail pattern used for reminders & invites. */
function emailHeadline(text: string): string {
  return `<p style="margin:0 0 20px 0;font-size:22px;font-weight:700;color:${PRIMARY};text-align:center;line-height:1.3;">${text}</p>`;
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:28px auto;"><tr><td align="center" style="border-radius:999px;background:${PRIMARY};">
    <a href="${url}" style="display:inline-block;padding:14px 40px;font-size:16px;font-weight:700;color:#ffffff;text-decoration:none;border-radius:999px;">${label}</a>
  </td></tr></table>`;
}

// No personal name — not a founder, not "Odo", not "Team"/"Support". Warm close, brand only.
const SIGN_OFF = `<p style="margin:28px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">Until soon,<br><em style="font-style:italic;color:${MUTED};">Docracy</em></p>`;

export async function sendSigningInvite(env: Env, doc: DocState, order: number, token: string): Promise<void> {
  const signer = doc.signers.find((s) => s.order === order)!;
  const link = `${env.PUBLIC_APP_URL}/sign/${token}`;
  // doc.title is only ever set for paid, account-linked documents — anonymous docs (the entire
  // free tier) never get a title, so this can't assume one exists.
  const docLabel = doc.title ? `"${escapeHtml(doc.title)}"` : "a document";
  const messageLine = doc.customMessage
    ? escapeHtml(doc.customMessage).replace(/\n/g, "<br>")
    : `You've been invited to sign ${docLabel} through Docracy.`;

  const subject = doc.customSubject?.trim() || "Ready to sign — you have a document waiting";
  const customLogoUrl = await resolveEmailLogoUrl(env, doc.accountId);
  // White-label pays to hide Docracy. On the free/default path, every invite is a free ad to
  // someone who just used e-sign successfully — one muted line, never compete with Sign here.
  const viralFooter = customLogoUrl
    ? ""
    : `<p style="margin:24px 0 0 0;font-size:12px;color:${MUTED};line-height:1.5;">
      Need to send documents yourself? Free at <a href="${env.PUBLIC_APP_URL}/try" style="color:${MUTED};">docracy.io/try</a>
    </p>`;
  const body = `
    ${emailHeadline(`Ready to sign`)}
    <p style="margin:0;font-size:15px;font-weight:700;color:${INK};">Dear ${escapeHtml(signer.name)},</p>
    <p style="margin:12px 0 0 0;font-size:15px;color:${INK};line-height:1.55;">
      ${messageLine}
    </p>
    ${ctaButton(link, "Sign here")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    <p style="margin:24px 0 0 0;font-size:14px;color:${INK};">
      We'll let you know once everyone's signed.
    </p>
    ${viralFooter}
    ${SIGN_OFF}
  `;
  await send(env, signer.email, subject, emailShell(env.PUBLIC_APP_URL, body, customLogoUrl), { emailType: "signing_invite" });
  try {
    await sendSigningSmsLink(env, doc, order, link);
  } catch (err) {
    console.error(`Signing invite SMS failed for doc ${doc.docId} signer ${order} (non-fatal):`, err);
  }
}

export async function sendPreparerStatusLink(env: Env, preparerEmail: string, statusToken: string): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  const body = `
    ${emailHeadline(`Your document's status link`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Bookmark this link to check on your signing chain any time — it's the only way to get back to
      it, so hang on to this email.
    </p>
    ${ctaButton(link, "View status")}
    <p style="margin:24px 0 0 0;font-size:14px;color:${MUTED};line-height:1.5;">
      Want every document in one place?
      <a href="${env.PUBLIC_APP_URL}/login?ref=status-email" style="color:${PRIMARY};">Create a free account</a>
      — no password.
    </p>
    ${SIGN_OFF}
  `;
  await send(env, preparerEmail, "Your document's status link", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "preparer_status_link",
  });
}

export async function sendCcInvite(
  env: Env,
  doc: DocState,
  cc: { email: string; name?: string },
  statusToken: string
): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  const docLabel = doc.title ? `"${escapeHtml(doc.title)}"` : "a document";
  const greeting = cc.name ? `Hi ${escapeHtml(cc.name)},` : "Hi,";
  const body = `
    ${emailHeadline(`You're copied on ${docLabel}`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      ${greeting} you've been added as a viewer — you don't need to sign. Use the link below to follow progress.
    </p>
    ${ctaButton(link, "View status")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    ${SIGN_OFF}
  `;
  const customLogoUrl = await resolveEmailLogoUrl(env, doc.accountId);
  await send(env, cc.email, `You're copied on a document`, emailShell(env.PUBLIC_APP_URL, body, customLogoUrl), {
    emailType: "cc_invite",
  });
}

export async function sendDocumentVoidedNotice(
  env: Env,
  to: string,
  doc: DocState,
  statusToken: string,
  reason?: string
): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  const docLabel = doc.title ? `"${escapeHtml(doc.title)}"` : "The document";
  const reasonLine = reason
    ? `<p style="margin:12px 0 0 0;font-size:14px;color:${MUTED};line-height:1.5;">Reason: ${escapeHtml(reason)}</p>`
    : "";
  const body = `
    ${emailHeadline(`${docLabel} was cancelled`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Signing has been stopped. No further action is needed.
    </p>
    ${reasonLine}
    ${ctaButton(link, "View status")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    ${SIGN_OFF}
  `;
  await send(env, to, "Document cancelled", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "document_voided",
  });
}

export async function sendSignerDeclinedNotice(
  env: Env,
  to: string,
  doc: DocState,
  declinerName: string,
  statusToken: string,
  reason?: string
): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  const reasonLine = reason
    ? `<p style="margin:12px 0 0 0;font-size:14px;color:${MUTED};line-height:1.5;">Reason: ${escapeHtml(reason)}</p>`
    : "";
  const body = `
    ${emailHeadline(`${escapeHtml(declinerName)} declined to sign`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      The signing chain has been stopped.
    </p>
    ${reasonLine}
    ${ctaButton(link, "View status")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    ${SIGN_OFF}
  `;
  await send(env, to, `${declinerName} declined to sign`, emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "signer_declined",
  });
}

export async function sendReminder(env: Env, doc: DocState, order: number, token: string, urgent: boolean): Promise<void> {
  const signer = doc.signers.find((s) => s.order === order)!;
  const link = `${env.PUBLIC_APP_URL}/sign/${token}`;
  const docLabel = doc.title ? `"${escapeHtml(doc.title)}"` : "a document";
  const expiresDate = formatDate(doc.expiresAt);
  const subject = urgent
    ? "🥲 Your signing link expires soon…"
    : "Reminder: you have a document waiting to be signed";
  const headline = urgent
    ? "Your signing link expires soon 🥲"
    : "You still have a document to sign";
  const bodyCopy = urgent
    ? `Your signature workflow concerning ${docLabel} expires on ${expiresDate}. Please sign before then — after that the link is removed and the document can no longer be completed.`
    : `Just a friendly reminder — you still have ${docLabel} waiting for your signature.`;
  const body = `
    ${emailHeadline(headline)}
    <p style="margin:0;font-size:15px;font-weight:700;color:${INK};">Dear ${escapeHtml(signer.name)},</p>
    <p style="margin:12px 0 0 0;font-size:15px;color:${INK};line-height:1.55;">
      ${bodyCopy}
    </p>
    ${ctaButton(link, "Sign here")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">
      You can also open the link from the original invite email if you still have it.
    </p>
    ${SIGN_OFF}
  `;
  const customLogoUrl = await resolveEmailLogoUrl(env, doc.accountId);
  await send(env, signer.email, subject, emailShell(env.PUBLIC_APP_URL, body, customLogoUrl), { emailType: "reminder" });
}

/** Quoted title for preparer-facing copy, or a neutral fallback when the doc has no title. */
function preparerDocLabel(doc: DocState): string {
  return doc.title ? `"${escapeHtml(doc.title)}"` : "your document";
}

export async function sendCompletionEmailNotOpened(
  env: Env,
  preparerEmail: string,
  doc: DocState,
  signerName: string,
  statusToken: string
): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  const body = `
    ${emailHeadline(`${escapeHtml(signerName)} hasn't opened your document yet`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      You sent ${preparerDocLabel(doc)} to ${escapeHtml(signerName)} a few hours ago, and the link hasn't been
      opened yet. This sometimes just means it landed in a spam folder or got missed.
    </p>
    ${ctaButton(link, "Check status")}
    <p style="margin:0;font-size:14px;color:${MUTED};">
      From that page you can resend the signing link if you'd like to follow up directly.
    </p>
    ${SIGN_OFF}
  `;
  await send(env, preparerEmail, `${signerName} hasn't opened your document yet`, emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "completion_not_opened",
  });
}

export async function sendCompletionEmailViewedNotSigned(
  env: Env,
  preparerEmail: string,
  doc: DocState,
  signerName: string,
  statusToken: string
): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  const body = `
    ${emailHeadline(`${escapeHtml(signerName)} opened your document but hasn't signed yet`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      ${escapeHtml(signerName)} opened ${preparerDocLabel(doc)} but hasn't completed signing. A quick
      follow-up message often helps at this stage.
    </p>
    ${ctaButton(link, "Check status")}
    <p style="margin:0;font-size:14px;color:${MUTED};">
      You'll find their contact details and a resend option on the status page.
    </p>
    ${SIGN_OFF}
  `;
  await send(env, preparerEmail, `${signerName} opened your document but hasn't signed yet`, emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "completion_viewed_not_signed",
  });
}

export async function sendCompletionEmailSigned(
  env: Env,
  preparerEmail: string,
  doc: DocState,
  signerName: string,
  statusToken: string
): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  const body = `
    ${emailHeadline(`${escapeHtml(signerName)} just signed your document`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Good news — ${escapeHtml(signerName)} just signed ${preparerDocLabel(doc)}.
    </p>
    ${ctaButton(link, "View status")}
    <p style="margin:0;font-size:14px;color:${MUTED};">
      We'll let you know as soon as everyone's signed and the final copy is ready.
    </p>
    ${SIGN_OFF}
  `;
  await send(env, preparerEmail, `${signerName} just signed your document`, emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "completion_signed",
  });
}

export async function sendCompletionEmails(
  env: Env,
  doc: DocState,
  finalPdf: Uint8Array,
  certificatePdf?: Uint8Array
): Promise<void> {
  // One combined attachment (final pages + certificate page appended) rather than two separate
  // files — purely a delivery-format convenience. The certificate is still generated, hashed, and
  // stored in R2 as its own object beforehand (see generateCertificate's doc comment on why), so
  // this merge changes nothing about the audit trail, only what the recipient downloads.
  const combinedPdf = certificatePdf ? await mergePdfs([finalPdf, certificatePdf]) : finalPdf;
  const attachments = [{ filename: "signed-document.pdf", content: bytesToBase64(combinedPdf) }];
  const customLogoUrl = await resolveEmailLogoUrl(env, doc.accountId);
  // White-labeled workspaces pay to hide Docracy — skip the viral CTA in those completion emails.
  const viralCta = customLogoUrl
    ? ""
    : `
    <p style="margin:24px 0 0 0;font-size:14px;color:${MUTED};line-height:1.5;">
      Sent with Docracy — free e-signatures for simple agreements.
    </p>
    ${ctaButton(`${env.PUBLIC_APP_URL}/try`, "Send your own free")}`;
  const body = `
    ${emailHeadline(`Everyone has signed`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      The signed document, including a certificate of completion, is attached.
    </p>
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    ${viralCta}
    ${SIGN_OFF}
  `;
  const html = emailShell(env.PUBLIC_APP_URL, body, customLogoUrl);

  for (const signer of doc.signers) {
    trackEvent(env, { event: "email_sent", emailType: "completion_all_signed" });
    if (!env.RESEND_API_KEY) {
      console.log(
        `[email:dev] to=${signer.email} subject="Signed document" (combined PDF attached, ${combinedPdf.byteLength} bytes)\n${statusLines(doc)}\n`
      );
      continue;
    }
    await resendFetch(env, {
      from: FROM,
      to: signer.email,
      subject: "Your document is fully signed",
      html,
      attachments,
      tags: [{ name: "email_type", value: "completion_all_signed" }],
    });
  }

  // CC viewers get the same completed PDF; skip anyone already covered as a signer.
  const signerEmails = new Set(doc.signers.map((s) => s.email.trim().toLowerCase()));
  for (const cc of doc.ccRecipients ?? []) {
    if (signerEmails.has(cc.email.trim().toLowerCase())) continue;
    trackEvent(env, { event: "email_sent", emailType: "completion_all_signed" });
    if (!env.RESEND_API_KEY) {
      console.log(
        `[email:dev] to=${cc.email} subject="Signed document (CC)" (combined PDF attached, ${combinedPdf.byteLength} bytes)\n${statusLines(doc)}\n`
      );
      continue;
    }
    await resendFetch(env, {
      from: FROM,
      to: cc.email,
      subject: "Your document is fully signed",
      html,
      attachments,
      tags: [{ name: "email_type", value: "completion_all_signed" }],
    });
  }

  // Anonymous preparers were told "we'll let you know when everyone's signed" in
  // sendCompletionEmailSigned — deliver that promise with the PDF + an upgrade ask.
  // Skip if they were already emailed as a signer or CC.
  const preparer = doc.preparerEmail?.trim().toLowerCase();
  if (preparer && !signerEmails.has(preparer) && !(doc.ccRecipients ?? []).some((c) => c.email.trim().toLowerCase() === preparer)) {
    const preparerUpgrade =
      customLogoUrl || doc.accountId
        ? ""
        : `
    <p style="margin:24px 0 0 0;font-size:14px;color:${MUTED};line-height:1.5;">
      Want every signed PDF in one place, reusable templates, and more than 2 signers?
    </p>
    ${ctaButton(`${env.PUBLIC_APP_URL}/price`, "See paid plans")}
    <p style="margin:12px 0 0 0;font-size:13px;color:${MUTED};">
      Or <a href="${env.PUBLIC_APP_URL}/login?ref=preparer-done" style="color:${PRIMARY};">create a free account</a> to keep history without paying.
    </p>`;
    const preparerBody = `
    ${emailHeadline(`Everyone has signed — your document is ready`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      The signed document, including a certificate of completion, is attached.
    </p>
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    ${preparerUpgrade}
    ${SIGN_OFF}
  `;
    const preparerHtml = emailShell(env.PUBLIC_APP_URL, preparerBody, customLogoUrl);
    trackEvent(env, { event: "email_sent", emailType: "completion_preparer_done" });
    if (!env.RESEND_API_KEY) {
      console.log(
        `[email:dev] to=${doc.preparerEmail} subject="Everyone has signed" (combined PDF attached, ${combinedPdf.byteLength} bytes)\n${statusLines(doc)}\n`
      );
    } else {
      await resendFetch(env, {
        from: FROM,
        to: doc.preparerEmail!,
        subject: "Everyone has signed — your document is ready",
        html: preparerHtml,
        attachments,
        tags: [{ name: "email_type", value: "completion_preparer_done" }],
      });
    }
  }
}

export async function sendMagicLink(env: Env, email: string, link: string): Promise<void> {
  const body = `
    ${emailHeadline(`Sign in to Docracy`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Click the button below to sign in. This link expires in 15 minutes and can only be used once.
    </p>
    ${ctaButton(link, "Sign in")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">
      If you didn't request this, you can safely ignore this email — no account changes were made.
    </p>
  `;
  await send(env, email, "Your Docracy sign-in link", emailShell(env.PUBLIC_APP_URL, body), { emailType: "magic_link" });
}

export async function sendTeamInvite(env: Env, email: string, ownerEmail: string, link: string): Promise<void> {
  const body = `
    ${emailHeadline(`You're invited to a Docracy workspace`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      ${escapeHtml(ownerEmail)} invited you to join their Docracy workspace — once you accept, you'll
      see the same documents, templates, and webhooks they do. This link expires in 7 days and can
      only be used once.
    </p>
    ${ctaButton(link, "Accept invite")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">
      If you weren't expecting this, you can safely ignore this email — no account changes were made.
    </p>
  `;
  await send(env, email, "You're invited to a Docracy workspace", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "team_invite",
  });
}

export async function sendHealthAlert(
  env: Env,
  failures: { name: string; detail?: string }[]
): Promise<void> {
  const lines = failures.map((f) => `${escapeHtml(f.name)}: ${escapeHtml(f.detail ?? "failed")}`).join("<br>");
  await send(env, env.FEEDBACK_EMAIL, "Docracy healthcheck failure", `<p>${lines}</p>`, { emailType: "health_alert" });
}

export async function sendFeedback(env: Env, fromEmail: string, message: string): Promise<void> {
  const body = escapeHtml(message).replace(/\n/g, "<br>");
  await send(env, env.FEEDBACK_EMAIL, "Docracy feedback", `<p>From: ${escapeHtml(fromEmail)}</p><p>${body}</p>`, {
    emailType: "feedback",
    replyTo: fromEmail,
  });
}

function templateList(items: string[]): string {
  return `<ul style="margin:12px 0;padding-left:20px;font-size:15px;color:${INK};line-height:1.7;">${items
    .map((i) => `<li>${escapeHtml(i)}</li>`)
    .join("")}</ul>`;
}


/** The onboarding drip, scheduled by lib/onboardingEmails.ts at account creation and sent by its
 *  cron sweep at 3 minutes / 24 hours / 3 days — each step skipped once the account has actually
 *  sent a document (checked live, not tracked on this email itself). The former 4-hour "step 2"
 *  was retired: that slot's content ("you haven't sent anything yet") is superseded by the
 *  per-document preparer-notification family below, which covers the case where a document *was*
 *  sent but the recipient hasn't acted — a more specific, more useful nudge than a generic timer. */
export async function sendOnboardingStep1(env: Env, email: string): Promise<void> {
  const body = `
    ${emailHeadline(`Your first document takes 30 seconds`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Thanks for trying Docracy.io — a simple way to send quick agreements without accounts or complexity.
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Most users start by sending one small document. It takes less than 30 seconds:
    </p>
    <p style="margin:12px 0 0 0;font-size:15px;font-weight:bold;color:${INK};">
      Upload your first document → Add signature fields → Send it to your client or team → Done
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};">
      If you don't have a document ready, you can also start with a template:
    </p>
    ${templateList(["NDA (one-way or mutual)", "Client contract", "Onboarding agreement", "Vendor agreement", "Simple personal agreement"])}
    <p style="margin:0;font-size:15px;color:${INK};line-height:1.5;">
      Send your first document now and see how fast the workflow is.
    </p>
    ${ctaButton(`${env.PUBLIC_APP_URL}/try?utm_source=email&utm_medium=onboarding&utm_campaign=step1`, "Try a sample NDA — 30 seconds")}
    <p style="margin:0;font-size:14px;color:${MUTED};">Or upload your own PDF from the homepage. If you need help, just reply.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Your first document takes 30 seconds", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "onboarding_step1",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

export async function sendOnboardingStep3(env: Env, email: string): Promise<void> {
  const body = `
    ${emailHeadline(`Try sending one quick document`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Just a quick reminder — you can send your first document anytime. No setup, no accounts, no
      complexity.
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Most users start with a small NDA or client contract and finish in under a minute.
    </p>
    ${ctaButton(`${env.PUBLIC_APP_URL}/try?utm_source=email&utm_medium=onboarding&utm_campaign=step3`, "Send a sample NDA free")}
    <p style="margin:0;font-size:14px;color:${MUTED};">Or start from any free template — still no account required.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Try sending one quick document", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "onboarding_step3",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

export async function sendOnboardingStep4(env: Env, email: string): Promise<void> {
  const body = `
    ${emailHeadline(`Want to give Docracy.io a quick try?`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      If you still want to try Docracy.io, you can send a quick document now. It's simple: upload →
      add fields → send.
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};">Or choose a template:</p>
    ${templateList(["NDA", "Client contract", "Service agreement", "Onboarding docs", "Rental agreement", "Work order"])}
    ${ctaButton(`${env.PUBLIC_APP_URL}/try?utm_source=email&utm_medium=onboarding&utm_campaign=step4`, "Try a sample NDA free")}
    <p style="margin:0;font-size:14px;color:${MUTED};">Happy to help if you need anything.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Want to give Docracy.io a quick try?", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "onboarding_step4",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

/** Preparer-opt-in drip — for people who already sent a document anonymously and ticked the tips
 *  checkbox. Content must NOT tell them to "send their first document"; they just did. */
export async function sendPreparerLeadStep1(env: Env, email: string): Promise<void> {
  const body = `
    ${emailHeadline(`Your document is on its way`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Thanks for sending with Docracy.io. Keep the status link from your confirmation email — that's
      how you track who has signed.
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Want a free account so every document you send lives in one place? No password — just a magic
      link to your email.
    </p>
    ${ctaButton(`${env.PUBLIC_APP_URL}/login?utm_source=email&utm_medium=preparer-lead&utm_campaign=step1`, "Create a free account")}
    <p style="margin:16px 0 0 0;font-size:14px;color:${MUTED};line-height:1.5;">
      Prefer another quick send first?
      <a href="${env.PUBLIC_APP_URL}/try?utm_source=email&utm_medium=preparer-lead&utm_campaign=step1" style="color:${PRIMARY};">Open a sample NDA</a>
      — still free, still no account.
    </p>
    <p style="margin:0;font-size:14px;color:${MUTED};">You asked for a few tips — reply anytime to stop them.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Your document is on its way", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "preparer_lead_step1",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

export async function sendPreparerLeadStep3(env: Env, email: string): Promise<void> {
  const body = `
    ${emailHeadline(`Next time, start from a template`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Free templates for the agreements people send most often — NDAs, contractor agreements, offer
      letters — ready to fill and send without rebuilding fields from scratch.
    </p>
    ${templateList(["Mutual NDA", "Independent contractor agreement", "Offer letter", "Freelance service agreement"])}
    ${ctaButton(`${env.PUBLIC_APP_URL}/try?utm_source=email&utm_medium=preparer-lead&utm_campaign=step3`, "Send another — sample NDA")}
    <p style="margin:16px 0 0 0;font-size:14px;color:${MUTED};line-height:1.5;">
      Or <a href="${env.PUBLIC_APP_URL}/free-templates?utm_source=email&utm_medium=preparer-lead&utm_campaign=step3" style="color:${PRIMARY};">browse all free templates</a>
      — still free, still no account required.
    </p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Next time, start from a template", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "preparer_lead_step3",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

export async function sendPreparerLeadStep4(env: Env, email: string): Promise<void> {
  const body = `
    ${emailHeadline(`When free isn't enough`)}
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Free covers quick, low-stakes agreements. Paid unlocks recurring templates, more signers, team
      seats, and longer retention — for when signing becomes part of how you work every week.
    </p>
    ${ctaButton(`${env.PUBLIC_APP_URL}/pricing?utm_source=email&utm_medium=preparer-lead&utm_campaign=step4`, "See plans")}
    <p style="margin:0;font-size:14px;color:${MUTED};">No pressure — free stays free.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "When free isn't enough", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "preparer_lead_step4",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
