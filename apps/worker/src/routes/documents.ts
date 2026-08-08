import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { PDFDocument } from "pdf-lib";
import { createDocumentCore } from "../lib/documentCreation";
import { isSmsCarrier, normalizeUsPhone } from "../lib/sms";
import { normalizeE164 } from "../lib/whatsapp";
import { consumeWhatsappQuota, consumeWhatsappQuotaWithOverage, FREE_MONTHLY_LIMIT, PAID_MONTHLY_LIMIT } from "../lib/whatsappQuota";
import { reportWhatsappOverageUsage, whatsappOverageConfigured } from "../lib/whatsappOverage";
import { getStripeCustomerId } from "../lib/billing";
import { NOTRACK_COOKIE_NAME, trackEvent } from "../lib/analytics";
import { checkRateLimit, checkInviteRateLimit } from "../lib/ratelimit";
import { optionalAccount, type AccountContext } from "../lib/auth";
import { resolveTtlDays } from "../lib/docTtl";
import { schedulePreparerLeadEmails } from "../lib/onboardingEmails";
import { clampAttachmentLimits } from "../lib/signerAttachments";
import type { DocField, Env, Locale } from "@docracy/shared";

interface CreateDocumentBody {
  preparerSigns: boolean;
  preparerEmail?: string;
  /** Explicit marketing opt-in for the preparer tips drip — ignored unless preparerEmail is set. */
  preparerMarketingOptIn?: boolean;
  signers: Array<{
    order: number;
    name: string;
    email: string;
    pin?: string;
    phone?: string;
    smsCarrier?: string;
    whatsappPhone?: string;
  }>;
  fields: DocField[];
  ccRecipients?: Array<{ name?: string; email: string }>;
  customSubject?: string;
  customMessage?: string;
  /** Preparer's browser locale (see apps/web/src/lib/i18n's detectLocale) — determines the
   *  language of every email tied to this document. */
  locale?: Locale;
  signingMode?: "sequential" | "parallel";
  /** Paid-only retention override in days — free ignores / rejects. */
  ttlDays?: number;
  /** Also text signing links via US carrier gateways (Resend — no extra SMS vendor). */
  smsInvites?: boolean;
  /** Also send signing links via WhatsApp — requires a signed-up account (free-tier: 2/month, paid: unlimited). */
  whatsappInvites?: boolean;
  /** Paid — require signers to upload attachments before signing. */
  signerAttachments?: { enabled: boolean; maxFiles?: number; maxBytesPerFile?: number };
  /** Set only when these fields were loaded from a saved (paid-tier) template — see
   *  routes/templates.ts's GET /:id, which fires the matching template_started event. Purely for
   *  the Template funnel's template_completed step; never persisted on the resulting document. */
  templateId?: string;
}

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 1000;
const FIELD_TYPES = new Set(["signature", "initials", "text", "date", "checkbox", "dropdown"]);
const PIN_RE = /^\d{4,8}$/;
const FREE_TIER_MAX_CCS = 2;
const MAX_DROPDOWN_OPTIONS = 20;

type Variables = { account: AccountContext | null };
const documents = new Hono<{ Bindings: Env; Variables: Variables }>();

documents.post("/", optionalAccount, async (c) => {
  const account = c.get("account");
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";

  // Logs the funnel event before returning, for the higher-signal failure modes worth tracking
  // for conversion analysis (a PDF that can't be used at all, rate limits, paid-tier gating) — not
  // for plain malformed-request shapes (bad JSON, missing multipart fields), which represent a
  // broken client rather than a real visitor hitting a real funnel obstacle.
  const failWith = <T>(event: "upload_failed" | "send_failed", body: T, status: 400 | 402 | 429, errorCode: string) => {
    trackEvent(c.env, {
      event,
      route: "prepare",
      userAgent: c.req.header("user-agent"),
      country: c.req.header("CF-IPCountry"),
      userId: account?.workspaceId ?? null,
      errorCode,
    });
    return c.json(body, status);
  };

  const allowed = await checkRateLimit(c.env, ip);
  if (!allowed) {
    return failWith("send_failed", { error: "Too many documents created recently. Please try again later." }, 429, "rate_limited");
  }

  const form = await c.req.parseBody();
  const pdfFile = form["pdf"];
  const metaRaw = form["meta"];

  if (!(pdfFile instanceof File) || typeof metaRaw !== "string") {
    return c.json({ error: "Expected multipart form with 'pdf' file and 'meta' JSON field" }, 400);
  }

  if (pdfFile.size > MAX_PDF_BYTES) {
    return failWith("upload_failed", { error: `PDF must be under ${MAX_PDF_BYTES / (1024 * 1024)}MB` }, 400, "pdf_too_large");
  }

  const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
  const header = new TextDecoder().decode(pdfBytes.slice(0, 5));
  if (header !== "%PDF-") {
    return failWith("upload_failed", { error: "That file doesn't look like a valid PDF" }, 400, "not_a_pdf");
  }

  // A real parse, not just the header sniff above — the header check alone lets a corrupt or
  // (previously) an encrypted PDF through, which would then only fail once someone actually
  // tries to sign it, deadlocking the chain with no useful error days into a signing round.
  let pageCount: number;
  try {
    const probe = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pageCount = probe.getPageCount();
  } catch {
    return failWith("upload_failed", { error: "That PDF couldn't be read — it may be corrupted" }, 400, "pdf_unreadable");
  }

  let meta: CreateDocumentBody;
  try {
    meta = JSON.parse(metaRaw);
  } catch {
    return c.json({ error: "Invalid 'meta' JSON" }, 400);
  }

  // Paid accounts have no signer cap at all; anonymous/free stays exactly as it was.
  const maxSigners = account?.isPaid ? Infinity : Number(c.env.FREE_TIER_MAX_SIGNERS);
  if (meta.signers.length === 0) {
    return c.json({ error: "At least one signer is required" }, 400);
  }
  if (meta.signers.length > maxSigners) {
    return failWith(
      "send_failed",
      { error: `Free plan supports up to ${maxSigners} signers. Sign in with a paid account for unlimited signers.` },
      402,
      "signer_cap_exceeded"
    );
  }
  // PIN-protected signing links are normally a paid-tier feature — except for a WhatsApp signer,
  // where the PIN is mandatory (see below) regardless of plan: it's the "sole control" factor that
  // makes the AES-track claim on /trust defensible — without it, anyone who can open that WhatsApp
  // thread could sign, not just the phone's owner. So only a *non*-WhatsApp PIN is paid-gated here.
  if (meta.signers.some((s) => s.pin && !s.whatsappPhone?.trim()) && !account?.isPaid) {
    return failWith("send_failed", { error: "PIN-protected signing links require a paid account." }, 402, "pin_requires_paid");
  }

  const seenEmails = new Set<string>();
  for (const s of meta.signers) {
    if (!s.name?.trim()) {
      return c.json({ error: "Every signer needs a name" }, 400);
    }
    const email = s.email?.trim().toLowerCase() ?? "";
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: `"${s.email}" doesn't look like a valid email address` }, 400);
    }
    if (seenEmails.has(email)) {
      return c.json({ error: `${s.email} is used for more than one signer` }, 400);
    }
    seenEmails.add(email);
    if (s.pin && !PIN_RE.test(s.pin)) {
      return c.json({ error: "A signer's PIN must be 4-8 digits" }, 400);
    }
    if (s.phone?.trim() && !normalizeUsPhone(s.phone)) {
      return c.json(
        {
          error: `"${s.phone}" isn't a valid US mobile number — SMS signing links are US-only; signers outside the US receive email invites instead`,
        },
        400
      );
    }
    if (s.smsCarrier && !isSmsCarrier(s.smsCarrier)) {
      return c.json({ error: "Unknown mobile carrier — choose AT&T, T-Mobile, Verizon, Sprint, or US Cellular" }, 400);
    }
    if (s.phone?.trim() && !s.smsCarrier) {
      return c.json({ error: "Pick a mobile carrier when adding a phone number for SMS" }, 400);
    }
    if (s.smsCarrier && !s.phone?.trim()) {
      return c.json({ error: "A phone number is required when a carrier is selected" }, 400);
    }
    if (s.whatsappPhone?.trim() && !normalizeE164(s.whatsappPhone)) {
      return c.json({ error: `"${s.whatsappPhone}" doesn't look like a valid phone number for WhatsApp` }, 400);
    }
    if (s.whatsappPhone?.trim() && !s.pin?.trim()) {
      return c.json(
        { error: "A PIN is required for signers using WhatsApp — it pairs with the phone-bound link to prove sole control." },
        400
      );
    }
  }
  if (meta.smsInvites && !meta.signers.some((s) => s.phone?.trim() && s.smsCarrier)) {
    return c.json({ error: "SMS is on but no signer has a phone number and carrier" }, 400);
  }
  if (meta.whatsappInvites && !meta.signers.some((s) => s.whatsappPhone?.trim())) {
    return c.json({ error: "WhatsApp is on but no signer has a phone number" }, 400);
  }
  if (!meta.fields?.every((f) => f.signerOrder >= 1 && f.signerOrder <= meta.signers.length)) {
    return c.json({ error: "A field is assigned to a signer that doesn't exist" }, 400);
  }
  const isFrac = (n: unknown): n is number => typeof n === "number" && n >= 0 && n <= 1;
  const geometryOk = meta.fields?.every(
    (f) =>
      Number.isInteger(f.page) &&
      f.page >= 0 &&
      f.page < pageCount &&
      isFrac(f.xFrac) &&
      isFrac(f.yFrac) &&
      isFrac(f.wFrac) &&
      isFrac(f.hFrac) &&
      f.xFrac + f.wFrac <= 1 &&
      f.yFrac + f.hFrac <= 1
  );
  if (!geometryOk) {
    return c.json({ error: "A field is positioned outside the document" }, 400);
  }
  const typeOk = meta.fields?.every((f) => f.type === undefined || FIELD_TYPES.has(f.type));
  if (!typeOk) {
    return c.json({ error: "A field has an unrecognized type" }, 400);
  }
  for (const f of meta.fields ?? []) {
    if (f.type === "dropdown") {
      const opts = (f.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        return c.json({ error: "Dropdown fields need at least two options" }, 400);
      }
      if (opts.length > MAX_DROPDOWN_OPTIONS) {
        return c.json({ error: `Dropdown fields support at most ${MAX_DROPDOWN_OPTIONS} options` }, 400);
      }
      f.options = opts;
    }
  }
  const signerOrdersWithFields = new Set(meta.fields.map((f) => f.signerOrder));
  const unassignedSigner = meta.signers.find((_, i) => !signerOrdersWithFields.has(i + 1));
  if (unassignedSigner) {
    return c.json({ error: `${unassignedSigner.name || "A signer"} doesn't have a field placed yet` }, 400);
  }
  if (meta.preparerEmail && !EMAIL_RE.test(meta.preparerEmail.trim())) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }
  if (meta.customSubject && meta.customSubject.length > MAX_SUBJECT_LENGTH) {
    return c.json({ error: `Custom subject must be under ${MAX_SUBJECT_LENGTH} characters` }, 400);
  }
  if (meta.customMessage && meta.customMessage.length > MAX_MESSAGE_LENGTH) {
    return c.json({ error: `Custom message must be under ${MAX_MESSAGE_LENGTH} characters` }, 400);
  }
  if (meta.signingMode !== undefined && meta.signingMode !== "sequential" && meta.signingMode !== "parallel") {
    return c.json({ error: "signingMode must be 'sequential' or 'parallel'" }, 400);
  }

  const ccRecipients = meta.ccRecipients ?? [];
  const maxCcs = account?.isPaid ? Infinity : FREE_TIER_MAX_CCS;
  if (ccRecipients.length > maxCcs) {
    return failWith(
      "send_failed",
      {
        error: `Free plan supports up to ${FREE_TIER_MAX_CCS} CC viewers. Sign in with a paid account for unlimited viewers.`,
      },
      402,
      "cc_cap_exceeded"
    );
  }
  for (const cc of ccRecipients) {
    const email = cc.email?.trim().toLowerCase() ?? "";
    if (!EMAIL_RE.test(email)) {
      return c.json({ error: `"${cc.email}" doesn't look like a valid email address` }, 400);
    }
    if (seenEmails.has(email)) {
      return c.json({ error: `${cc.email} is already a signer — remove them from viewers or signers` }, 400);
    }
  }
  const seenCcEmails = new Set<string>();
  for (const cc of ccRecipients) {
    const email = cc.email.trim().toLowerCase();
    if (seenCcEmails.has(email)) {
      return c.json({ error: `${cc.email} is listed as a viewer more than once` }, 400);
    }
    seenCcEmails.add(email);
  }

  // Per-recipient cap, independent of the per-IP creation limit above: without this, one IP could
  // fan invite emails out across many separate documents that all name the same victim address —
  // each document creation still passes the IP limit since it's a distinct "creation" event.
  const inviteEmails = new Set([...seenEmails, ...seenCcEmails]);
  if (meta.preparerEmail) inviteEmails.add(meta.preparerEmail.trim().toLowerCase());
  for (const email of inviteEmails) {
    if (!(await checkInviteRateLimit(c.env, email))) {
      return failWith(
        "send_failed",
        { error: "Too many documents have recently been sent to one of these email addresses. Please try again later." },
        429,
        "invite_rate_limited"
      );
    }
  }

  // Any signed-in account attaches to the document so Dashboard history works for free accounts
  // too. Paid-only entitlements (signer caps, TTL, attachments, etc.) stay gated on isPaid below.
  // Truly anonymous (signed-out) sends keep accountId null and never touch the D1 document index.
  // workspaceId (not id) so team-member creates index under the shared workspace.
  const accountId = account?.workspaceId ?? null;

  if (meta.ttlDays !== undefined && !account?.isPaid) {
    return failWith(
      "send_failed",
      { error: "Custom document expiry requires a paid account." },
      402,
      "ttl_requires_paid"
    );
  }
  if (meta.signerAttachments?.enabled && !account?.isPaid) {
    return failWith(
      "send_failed",
      { error: "Signer attachments require a paid account." },
      402,
      "attachments_requires_paid"
    );
  }
  const ttl = resolveTtlDays(c.env, { isPaid: !!account?.isPaid, ttlDays: meta.ttlDays });
  if ("error" in ttl) {
    return c.json({ error: ttl.error }, 400);
  }

  // WhatsApp is the AES-track channel — gated to signed-up accounts (anonymous senders are
  // rejected outright). Free accounts hard-stop at FREE_MONTHLY_LIMIT/month, no exceptions. Paid
  // accounts get PAID_MONTHLY_LIMIT/month included; past that they either hard-stop too (if this
  // deployment hasn't configured Stripe overage billing) or keep going with the excess billed at
  // $0.50/unit (see lib/whatsappOverage.ts). Checked last, immediately before creation, so a
  // request that fails any earlier validation or rate limit never consumes quota for a document
  // that was never actually going to be created.
  const whatsappSignerCount = meta.signers.filter((s) => s.whatsappPhone?.trim()).length;
  if (whatsappSignerCount > 0) {
    if (!account) {
      return failWith(
        "send_failed",
        { error: "WhatsApp signing requires a free Docracy account — sign up (no password) to use it." },
        402,
        "whatsapp_requires_account"
      );
    }
    if (account.isPaid && whatsappOverageConfigured(c.env)) {
      const overageUnits = await consumeWhatsappQuotaWithOverage(c.env, account.workspaceId, whatsappSignerCount);
      if (overageUnits > 0) {
        const stripeCustomerId = await getStripeCustomerId(c.env, account.workspaceId);
        if (stripeCustomerId) {
          c.executionCtx.waitUntil(
            reportWhatsappOverageUsage(c.env, stripeCustomerId, overageUnits).catch((err) =>
              console.error(`WhatsApp overage report failed for account ${account.workspaceId} (non-fatal):`, err)
            )
          );
        } else {
          // Shouldn't happen for a real paid account (every checkout sets this), but billing
          // silently going uncollected is worse than a loud log — never blocks the send either way.
          console.error(
            `WhatsApp overage: paid account ${account.workspaceId} has no Stripe customer id — ${overageUnits} unit(s) not billed`
          );
        }
      }
    } else {
      const allowed = await consumeWhatsappQuota(c.env, account.workspaceId, account.isPaid, whatsappSignerCount);
      if (!allowed) {
        const limit = account.isPaid ? PAID_MONTHLY_LIMIT : FREE_MONTHLY_LIMIT;
        return failWith(
          "send_failed",
          {
            error: account.isPaid
              ? `Paid accounts get ${limit} WhatsApp-signed invites per month — you've used them all this month.`
              : `Free accounts get ${limit} WhatsApp-signed invites per month — you've used them all. Upgrade for ${PAID_MONTHLY_LIMIT}/month.`,
          },
          402,
          "whatsapp_quota_exceeded"
        );
      }
    }
  }

  const { docId, statusToken, claimToken } = await createDocumentCore({
    env: c.env,
    ctx: c.executionCtx,
    pdfBytes,
    filename: pdfFile.name || "document.pdf",
    preparerSigns: meta.preparerSigns,
    preparerEmail: meta.preparerEmail,
    signers: meta.signers,
    fields: meta.fields,
    ccRecipients,
    accountId,
    creatorIp: ip,
    creatorCountry: c.req.header("CF-IPCountry"),
    skipFunnelTracking: getCookie(c, NOTRACK_COOKIE_NAME) === "1",
    customSubject: meta.customSubject?.trim() || undefined,
    customMessage: meta.customMessage?.trim() || undefined,
    locale: meta.locale,
    signingMode: meta.signingMode,
    templateId: meta.templateId,
    ttlDays: ttl.ttlDays,
    smsInvites: meta.smsInvites || undefined,
    whatsappInvites: meta.whatsappInvites || undefined,
    signerAttachments: meta.signerAttachments?.enabled
      ? { enabled: true, ...clampAttachmentLimits(meta.signerAttachments) }
      : undefined,
  });

  // Opt-in only — the preparer email itself is collected for the status link. Marketing tips are
  // a separate, explicit checkbox so this stays GDPR-clean for EU visitors.
  if (meta.preparerMarketingOptIn && meta.preparerEmail?.trim()) {
    c.executionCtx.waitUntil(
      schedulePreparerLeadEmails(c.env, meta.preparerEmail, "preparer_optin", meta.locale).catch((err) =>
        console.error("Preparer lead scheduling failed (non-fatal):", err)
      )
    );
  }

  return c.json({ docId, statusToken, ...(claimToken ? { claimToken } : {}) });
});

export default documents;
