import type { DocState, Env } from "@docracy/shared";

// Using Resend's shared testing domain until docracy.io is connected and verified in Resend
// (Domains → Add Domain → DNS records). Switch back to noreply@docracy.io once that's done.
const FROM = "Docracy <onboarding@resend.dev>";

async function send(env: Env, to: string, subject: string, html: string, replyTo?: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${to} subject="${subject}"${replyTo ? ` reply-to=${replyTo}` : ""}\n${html}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html, ...(replyTo ? { reply_to: replyTo } : {}) }),
  });
  if (!res.ok) {
    console.error(`Resend send failed (${res.status}): ${await res.text()}`);
  }
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
    .map((s) =>
      s.status === "signed"
        ? `Signed by: ${escapeHtml(s.name)} ✓ (${formatDate(s.signedAt!)})`
        : `Pending: ${escapeHtml(s.name)}`
    )
    .join("<br>");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

const WORDMARK_URL = "https://docracy.pages.dev/docracy-wordmark.png";
const PRIMARY = "#2f7ed8";
const INK = "#1a2b3c";
const MUTED = "#6b7785";

/** Shared branded shell for Docracy's outbound email — a plain white card on a light gray
 *  background, table-based layout since email clients don't reliably support flexbox/grid. */
function emailShell(bodyHtml: string): string {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f7fa;padding:32px 16px;font-family:Arial,Helvetica,sans-serif;">
  <tr>
    <td align="center">
      <table role="presentation" width="480" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;border:1px solid #e6e9ee;max-width:480px;width:100%;">
        <tr>
          <td style="padding:28px 32px 8px 32px;">
            <img src="${WORDMARK_URL}" alt="Docracy" height="26" style="display:block;" />
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
          <td style="padding:20px 32px 0 32px;text-align:center;font-size:12px;color:${MUTED};line-height:1.6;">
            docracy.pages.dev<br />
            Free, no-signup electronic signatures that disappear when the chain is done.
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

  const body = `
    <p style="margin:0 0 4px 0;font-size:20px;font-weight:bold;color:${INK};">Ready to sign</p>
    <p style="margin:16px 0 0 0;font-size:15px;color:${INK};">Hi ${escapeHtml(signer.name)},</p>
    <p style="margin:8px 0 0 0;font-size:15px;color:${INK};line-height:1.5;">
      You've been invited to sign ${docLabel} through Docracy.
    </p>
    ${ctaButton(link, "Sign here")}
    <p style="margin:0;font-size:13px;color:${MUTED};line-height:1.5;">${statusLines(doc)}</p>
    <p style="margin:24px 0 0 0;font-size:14px;color:${INK};">
      We'll let you know once everyone's signed,<br />The Docracy team
    </p>
  `;

  await send(env, signer.email, "Ready to sign — you have a document waiting", emailShell(body));
}

export async function sendPreparerStatusLink(env: Env, preparerEmail: string, statusToken: string): Promise<void> {
  const link = `${env.PUBLIC_APP_URL}/status/${statusToken}`;
  await send(
    env,
    preparerEmail,
    "Your document's status link",
    `<p>Bookmark this link to check on your signing chain any time — it's the only way to get back to it, so hang on to this email: <a href="${link}">${link}</a></p>`
  );
}

export async function sendReminder(env: Env, doc: DocState, order: number, token: string, urgent: boolean): Promise<void> {
  const signer = doc.signers.find((s) => s.order === order)!;
  const link = `${env.PUBLIC_APP_URL}/sign/${token}`;
  const subject = urgent ? "Reminder: this signing link expires soon" : "Reminder: you have a document waiting to be signed";
  const tone = urgent
    ? `<p><strong>This link expires soon.</strong> Please sign before it does, or the document will be deleted.</p>`
    : "";
  await send(
    env,
    signer.email,
    subject,
    `<p>Hi ${escapeHtml(signer.name)},</p><p>You still need to sign: <a href="${link}">${link}</a></p>${tone}`
  );
}

export async function sendCompletionEmails(
  env: Env,
  doc: DocState,
  finalPdf: Uint8Array,
  certificatePdf?: Uint8Array
): Promise<void> {
  const attachmentBase64 = bytesToBase64(finalPdf);
  const attachments = [{ filename: "signed-document.pdf", content: attachmentBase64 }];
  if (certificatePdf) {
    attachments.push({ filename: "certificate-of-completion.pdf", content: bytesToBase64(certificatePdf) });
  }

  for (const signer of doc.signers) {
    if (!env.RESEND_API_KEY) {
      console.log(
        `[email:dev] to=${signer.email} subject="Signed document" (final PDF attached, ${finalPdf.byteLength} bytes` +
          `${certificatePdf ? `; certificate attached, ${certificatePdf.byteLength} bytes` : ""})\n${statusLines(doc)}\n`
      );
      continue;
    }
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM,
        to: signer.email,
        subject: "Your document is fully signed",
        html: `<p>Everyone has signed. Final document and certificate of completion attached.</p><p>${statusLines(doc)}</p>`,
        attachments,
      }),
    });
    if (!res.ok) {
      console.error(`Resend send failed (${res.status}): ${await res.text()}`);
    }
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
  await send(env, email, "Your Docracy sign-in link", emailShell(body));
}

export async function sendHealthAlert(
  env: Env,
  failures: { name: string; detail?: string }[]
): Promise<void> {
  const lines = failures.map((f) => `${escapeHtml(f.name)}: ${escapeHtml(f.detail ?? "failed")}`).join("<br>");
  await send(env, env.FEEDBACK_EMAIL, "Docracy healthcheck failure", `<p>${lines}</p>`);
}

export async function sendFeedback(env: Env, fromEmail: string, message: string): Promise<void> {
  const body = escapeHtml(message).replace(/\n/g, "<br>");
  await send(
    env,
    env.FEEDBACK_EMAIL,
    "Docracy feedback",
    `<p>From: ${escapeHtml(fromEmail)}</p><p>${body}</p>`,
    fromEmail
  );
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
