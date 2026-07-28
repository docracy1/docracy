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

/** Shared branded shell for Docracy's outbound email — a plain white card on a light gray
 *  background, table-based layout since email clients don't reliably support flexbox/grid.
 *
 *  Header: logo only, no adjacent text, no caption — `customLogoUrl` swaps in a workspace's own
 *  branding here (only ever passed by sendSigningInvite, since that's the one email a document's
 *  actual signer sees). Footer: always Docracy's own logo regardless of `customLogoUrl` — a
 *  neutral "sent via Docracy.io" attribution distinct from whatever brand the header shows, plus
 *  a plain-text sign-off with no personal name (never "Odo"/founder/team — see SIGN_OFF below). */
function emailShell(appUrl: string, bodyHtml: string, customLogoUrl?: string | null): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e6e9ee;max-width:480px;width:100%;">
        <tr>
          <td align="left" style="padding:28px 32px 8px 32px;">
            <img src="${customLogoUrl ?? `${appUrl}/docracy-wordmark.png`}" alt="${customLogoUrl ? "" : "Docracy.io"}" width="100" style="display:block;width:100px;max-width:100px;height:auto;" />
          </td>
        </tr>
        <tr>
          <td style="padding:8px 32px 28px 32px;">
            ${bodyHtml}
          </td>
        </tr>
      </table>
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;width:100%;">
        <tr>
          <td align="center" style="padding:20px 32px 0 32px;">
            <img src="${appUrl}/docracy-wordmark.png" alt="Docracy.io" width="70" style="display:block;width:70px;max-width:70px;height:auto;margin:0 auto 8px;" />
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 0 32px;text-align:center;font-size:12px;color:${MUTED};line-height:1.6;">
            Docracy.io — Simple document signing
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`.trim();
}

function ctaButton(url: string, label: string): string {
  return `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:24px 0;"><tr><td style="border-radius:6px;background:${PRIMARY};">
    <a href="${url}" style="display:inline-block;padding:12px 28px;font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;border-radius:6px;">${label}</a>
  </td></tr></table>`;
}

export async function sendSigningInvite(env: Env, doc: DocState, order: number, token: string): Promise<void> {
  const signer = doc.signers.find((s) => s.order === order)!;
  const link = `${env.PUBLIC_APP_URL}/sign/${token}`;
  // doc.title is only ever set for paid, account-linked documents — anonymous docs (the entire
  // free tier) never get a title, so this can't assume one exists.
  const docLabel = doc.title ? `"${escapeHtml(doc.title)}"` : "a document";
  const messageLine = doc.customMessage
    ? escapeHtml(doc.customMessage).replace(/\n/g, "<br>")
    : `You've been invited to sign ${docLabel} through Docracy.`;

  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Ready to sign</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};">Hi ${escapeHtml(signer.name)},</p>
    <p style="margin:8px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      ${messageLine}
    </p>
    ${ctaButton(link, "Sign here")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    <p style="margin:24px 0 0 0;font-size:14px;color:${INK};">
      We'll let you know once everyone's signed.
    </p>
  `;

  const subject = doc.customSubject?.trim() || "Ready to sign — you have a document waiting";
  const customLogoUrl = await resolveEmailLogoUrl(env, doc.accountId);
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Your document's status link</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Bookmark this link to check on your signing chain any time — it's the only way to get back to
      it, so hang on to this email.
    </p>
    ${ctaButton(link, "View status")}
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">You're copied on ${docLabel}</p>
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">${docLabel} was cancelled</p>
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">${escapeHtml(declinerName)} declined to sign</p>
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
  const subject = urgent ? "Reminder: this signing link expires soon" : "Reminder: you have a document waiting to be signed";
  const tone = urgent
    ? `<p style="margin:16px 0 0 0;font-size:15px;color:${INK};"><strong>This link expires soon.</strong> Please sign before it does, or the document will be deleted.</p>`
    : "";
  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">You still have a document to sign</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};">Hi ${escapeHtml(signer.name)},</p>
    ${ctaButton(link, "Sign here")}
    ${tone}
    ${SIGN_OFF}
  `;
  const customLogoUrl = await resolveEmailLogoUrl(env, doc.accountId);
  await send(env, signer.email, subject, emailShell(env.PUBLIC_APP_URL, body, customLogoUrl), { emailType: "reminder" });
}

/** Preparer-facing nudges about one specific signer's progress on a document they sent — distinct
 *  from sendCompletionEmails below (which goes to the *signers* once everyone's done) and from
 *  sendReminder (which goes to the *signer* themselves). Only sent when the preparer gave an email
 *  at creation time (doc.preparerEmail) — see lib/documentCreation.ts and lib/completionEmails.ts
 *  for the sweep/event-driven triggers. All three share the same status-page CTA so the preparer
 *  always lands on the one page that shows every signer's live status. */
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">${escapeHtml(signerName)} hasn't opened your document yet</p>
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">${escapeHtml(signerName)} opened your document but hasn't signed yet</p>
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">${escapeHtml(signerName)} just signed your document</p>
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
    ${ctaButton(`${env.PUBLIC_APP_URL}/prepare?ref=completion-email`, "Send your own free")}`;
  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Everyone has signed</p>
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
}

export async function sendMagicLink(env: Env, email: string, link: string): Promise<void> {
  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Sign in to Docracy</p>
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">You're invited to a Docracy workspace</p>
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

// No personal name in the sign-off — not a founder, not "Odo", not "Team" or "Support". Kept as
// one constant so it can't drift between templates.
const SIGN_OFF = `<p style="margin:16px 0 0 0;font-size:15px;color:${INK};">Best,<br>Docracy.io</p>`;

/** The onboarding drip, scheduled by lib/onboardingEmails.ts at account creation and sent by its
 *  cron sweep at 3 minutes / 24 hours / 3 days — each step skipped once the account has actually
 *  sent a document (checked live, not tracked on this email itself). The former 4-hour "step 2"
 *  was retired: that slot's content ("you haven't sent anything yet") is superseded by the
 *  per-document preparer-notification family below, which covers the case where a document *was*
 *  sent but the recipient hasn't acted — a more specific, more useful nudge than a generic timer. */
export async function sendOnboardingStep1(env: Env, email: string): Promise<void> {
  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Your first document takes 30 seconds</p>
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
    ${ctaButton(env.PUBLIC_APP_URL, "Upload document")}
    <p style="margin:0;font-size:14px;color:${MUTED};">If you need help, just reply to this email.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Your first document takes 30 seconds", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "onboarding_step1",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

export async function sendOnboardingStep3(env: Env, email: string): Promise<void> {
  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Try sending one quick document</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Just a quick reminder — you can send your first document anytime. No setup, no accounts, no
      complexity.
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Most users start with a small NDA or client contract and finish in under a minute.
    </p>
    ${ctaButton(env.PUBLIC_APP_URL, "Send your first document")}
    <p style="margin:0;font-size:14px;color:${MUTED};">If you prefer templates, you can use one instantly.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Try sending one quick document", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "onboarding_step3",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

export async function sendOnboardingStep4(env: Env, email: string): Promise<void> {
  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Want to give Docracy.io a quick try?</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      If you still want to try Docracy.io, you can send a quick document now. It's simple: upload →
      add fields → send.
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};">Or choose a template:</p>
    ${templateList(["NDA", "Client contract", "Service agreement", "Onboarding docs", "Rental agreement", "Work order"])}
    ${ctaButton(env.PUBLIC_APP_URL, "Send a document")}
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Your document is on its way</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Thanks for sending with Docracy.io. Keep the status link from your confirmation email — that's
      how you track who has signed.
    </p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Want a free account so every document you send lives in one place? No password — just a magic
      link to your email.
    </p>
    ${ctaButton(`${env.PUBLIC_APP_URL}/login?utm_source=email&utm_medium=preparer-lead&utm_campaign=step1`, "Create a free account")}
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
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Next time, start from a template</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      Free templates for the agreements people send most often — NDAs, contractor agreements, offer
      letters — ready to fill and send without rebuilding fields from scratch.
    </p>
    ${templateList(["Mutual NDA", "Independent contractor agreement", "Offer letter", "Freelance service agreement"])}
    ${ctaButton(`${env.PUBLIC_APP_URL}/free-templates?utm_source=email&utm_medium=preparer-lead&utm_campaign=step3`, "Browse free templates")}
    <p style="margin:0;font-size:14px;color:${MUTED};">Still free, still no account required.</p>
    ${SIGN_OFF}
  `;
  await send(env, email, "Next time, start from a template", emailShell(env.PUBLIC_APP_URL, body), {
    emailType: "preparer_lead_step3",
    replyTo: env.FEEDBACK_EMAIL,
  });
}

export async function sendPreparerLeadStep4(env: Env, email: string): Promise<void> {
  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">When free isn't enough</p>
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
