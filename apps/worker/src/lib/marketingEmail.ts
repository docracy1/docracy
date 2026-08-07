// Admin-composed marketing/product-update broadcasts — see routes/admin.ts's
// GET /marketing-email/recipients-count and POST /marketing-email/send, and
// routes/unsubscribe.ts for the one-click opt-out this appends a link for.
//
// Deliberately a plain sequential loop, not a queue — recipient volume here is "occasional email
// to people who opted in," nowhere near the scale that would justify one (see CLAUDE.md's YAGNI
// convention). A single failed send is caught and skipped so it can't abort the rest of the batch.
import { sendMarketingEmail } from "./email";
import { signUnsubscribeToken, type UnsubscribeKind } from "./marketingUnsubscribe";
import type { Env } from "@docracy/shared";

export interface MarketingRecipient {
  email: string;
  kind: UnsubscribeKind;
  /** accounts.id for kind "account"; the lead's own email for kind "lead" — whichever
   *  onboarding_leads/accounts uses as its own key, so the unsubscribe link can update the right
   *  row without a second lookup. */
  id: string;
}

/** The combined, deduplicated-by-email recipient list: accounts that ticked "send me occasional
 *  product news" (accounts.marketing_opt_in) plus onboarding_leads rows that haven't clicked
 *  unsubscribe. An address present in both collapses to a single send — the account row wins
 *  (its own opt-in is the more durable, account-settings-driven signal) so nobody gets it twice. */
export async function getMarketingRecipients(env: Env): Promise<MarketingRecipient[]> {
  if (!env.DOCRACY_DB) return [];

  const [{ results: accountRows }, { results: leadRows }] = await Promise.all([
    env.DOCRACY_DB.prepare(`SELECT id, email FROM accounts WHERE marketing_opt_in = 1`).all<{
      id: string;
      email: string;
    }>(),
    env.DOCRACY_DB.prepare(`SELECT email FROM onboarding_leads WHERE marketing_unsubscribed = 0`).all<{
      email: string;
    }>(),
  ]);

  const byEmail = new Map<string, MarketingRecipient>();
  for (const row of accountRows) {
    byEmail.set(row.email.trim().toLowerCase(), { email: row.email, kind: "account", id: row.id });
  }
  for (const row of leadRows) {
    const key = row.email.trim().toLowerCase();
    if (byEmail.has(key)) continue;
    byEmail.set(key, { email: row.email, kind: "lead", id: row.email });
  }
  return [...byEmail.values()];
}

export async function getMarketingRecipientsCount(env: Env): Promise<number> {
  return (await getMarketingRecipients(env)).length;
}

const FOOTER_MUTED = "#6b7785"; // matches email.ts's own MUTED constant (not exported)

function unsubscribeFooterHtml(unsubscribeUrl: string): string {
  return `<p style="margin:32px 0 0 0;padding-top:16px;border-top:1px solid #e2e6ea;font-size:12px;color:${FOOTER_MUTED};line-height:1.6;">
    You're receiving this because you opted in to Docracy product updates.
    <a href="${unsubscribeUrl}" style="color:${FOOTER_MUTED};text-decoration:underline;">Unsubscribe</a>
    &middot; Docracy, RELACON GmbH, Elisabethstra&szlig;e 15/5b, 1010 Vienna, Austria
  </p>`;
}

/** Sends `subject`/`bodyHtml` (admin-authored, used as-is — plain text or simple HTML) to every
 *  current opted-in recipient, with a per-recipient signed unsubscribe link appended to each send.
 *  One recipient's failure is logged and skipped, never abandons the rest of the batch. */
export async function sendMarketingBroadcast(
  env: Env,
  subject: string,
  bodyHtml: string
): Promise<{ sent: number; failed: number }> {
  const recipients = await getMarketingRecipients(env);
  let sent = 0;
  let failed = 0;
  for (const recipient of recipients) {
    try {
      const token = await signUnsubscribeToken({ kind: recipient.kind, id: recipient.id }, env.TOKEN_SECRET);
      const unsubscribeUrl = `${env.PUBLIC_APP_URL}/api/unsubscribe?token=${encodeURIComponent(token)}`;
      await sendMarketingEmail(env, recipient.email, subject, `${bodyHtml}${unsubscribeFooterHtml(unsubscribeUrl)}`);
      sent++;
    } catch (err) {
      failed++;
      console.error(`Marketing email failed for ${recipient.email} (non-fatal):`, err);
    }
  }
  return { sent, failed };
}
