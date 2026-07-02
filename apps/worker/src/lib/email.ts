import type { DocState, Env } from "@docracy/shared";

// Using Resend's shared testing domain until docracy.io is connected and verified in Resend
// (Domains → Add Domain → DNS records). Switch back to noreply@docracy.io once that's done.
const FROM = "Docracy <onboarding@resend.dev>";

async function send(env: Env, to: string, subject: string, html: string): Promise<void> {
  if (!env.RESEND_API_KEY) {
    console.log(`[email:dev] to=${to} subject="${subject}"\n${html}\n`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  });
  if (!res.ok) {
    console.error(`Resend send failed (${res.status}): ${await res.text()}`);
  }
}

function statusLines(doc: DocState): string {
  return [...doc.signers]
    .sort((a, b) => a.order - b.order)
    .map((s) =>
      s.status === "signed"
        ? `Signed by: ${s.name} ✓ (${formatDate(s.signedAt!)})`
        : `Pending: ${s.name}`
    )
    .join("<br>");
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export async function sendSigningInvite(env: Env, doc: DocState, order: number, token: string): Promise<void> {
  const signer = doc.signers.find((s) => s.order === order)!;
  const link = `${env.PUBLIC_APP_URL}/sign/${token}`;
  await send(
    env,
    signer.email,
    "You have a document to sign",
    `<p>Hi ${signer.name},</p><p>Please review and sign the document: <a href="${link}">${link}</a></p><p>${statusLines(doc)}</p>`
  );
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
    `<p>Hi ${signer.name},</p><p>You still need to sign: <a href="${link}">${link}</a></p>${tone}`
  );
}

export async function sendCompletionEmails(env: Env, doc: DocState, finalPdf: Uint8Array): Promise<void> {
  const attachmentBase64 = bytesToBase64(finalPdf);
  for (const signer of doc.signers) {
    if (!env.RESEND_API_KEY) {
      console.log(`[email:dev] to=${signer.email} subject="Signed document" (final PDF attached, ${finalPdf.byteLength} bytes)\n${statusLines(doc)}\n`);
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
        html: `<p>Everyone has signed. Final document attached.</p><p>${statusLines(doc)}</p>`,
        attachments: [{ filename: "signed-document.pdf", content: attachmentBase64 }],
      }),
    });
    if (!res.ok) {
      console.error(`Resend send failed (${res.status}): ${await res.text()}`);
    }
  }
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}
