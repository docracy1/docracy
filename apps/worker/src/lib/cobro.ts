import { signToken } from "@docracy/shared";
import { putDoc, listActiveDocIds, getDoc } from "./kv";
import { sha256Hex } from "./hash";
import { indexDocumentCreated } from "./index-d1";
import { sendCobroNotice } from "./email";
import { sendWhatsAppCobro, signedPageUrl } from "./whatsapp";
import { consumeWhatsappQuota, consumeWhatsappQuotaWithOverage, ENTERPRISE_MONTHLY_LIMIT, PAID_MONTHLY_LIMIT } from "./whatsappQuota";
import { reportWhatsappOverageUsage, whatsappOverageConfigured } from "./whatsappOverage";
import { getStripeCustomerId } from "./billing";
import type { AccountContext } from "./auth";
import type { AuditEvent, DocState, Env, Locale, PaymentRequest } from "@docracy/shared";

export const DEFAULT_COBRO_REMIND_DAYS = 30;
export const MIN_COBRO_REMIND_DAYS = 7;
export const MAX_COBRO_REMIND_DAYS = 90;

export function isCobroDoc(doc: Pick<DocState, "kind" | "signers">): boolean {
  return doc.kind === "cobro" || doc.signers.length === 0;
}

export function cobroRemindDue(doc: DocState, nowMs: number): boolean {
  if (doc.kind !== "cobro") return false;
  if (doc.status !== "completed") return false;
  if (doc.cobroPaidAt) return false;
  if (!doc.cobroNextRemindAt) return false;
  if (new Date(doc.expiresAt).getTime() <= nowMs) return false;
  return new Date(doc.cobroNextRemindAt).getTime() <= nowMs;
}

export function nextCobroRemindAt(fromMs: number, everyDays: number): string {
  return new Date(fromMs + everyDays * 24 * 60 * 60 * 1000).toISOString();
}

export const COBRO_PREFS_PREFIX = "cobro-prefs:";

export interface CobroPrefs {
  url: string;
  currency: string;
  updatedAt: string;
}

export function cobroPrefsKey(workspaceId: string): string {
  return `${COBRO_PREFS_PREFIX}${workspaceId}`;
}

export async function getCobroPrefs(env: Env, workspaceId: string): Promise<CobroPrefs | null> {
  return env.DOCRACY_KV.get<CobroPrefs>(cobroPrefsKey(workspaceId), "json");
}

export async function putCobroPrefs(env: Env, workspaceId: string, url: string, currency: string): Promise<CobroPrefs> {
  const prefs: CobroPrefs = { url, currency, updatedAt: new Date().toISOString() };
  await env.DOCRACY_KV.put(cobroPrefsKey(workspaceId), JSON.stringify(prefs));
  return prefs;
}

export async function markCobroPaid(env: Env, doc: DocState): Promise<DocState> {
  if (doc.kind !== "cobro") throw new Error("Not a cobro");
  if (doc.cobroPaidAt) return doc;
  doc.cobroPaidAt = new Date().toISOString();
  doc.cobroNextRemindAt = undefined;
  await putDoc(env, doc);
  return doc;
}

export interface ConsumeWhatsappResult {
  ok: boolean;
  error?: string;
  overageUnits?: number;
}

/** Same paid/enterprise WhatsApp metering as POST /api/documents — cobro is paid-only. */
export async function consumeCobroWhatsapp(
  env: Env,
  account: AccountContext,
  count: number
): Promise<ConsumeWhatsappResult> {
  if (count <= 0) return { ok: true };
  if (!account.isEnterprise && account.isPaid && whatsappOverageConfigured(env)) {
    const overageUnits = await consumeWhatsappQuotaWithOverage(env, account.workspaceId, count);
    return { ok: true, overageUnits };
  }
  const allowed = await consumeWhatsappQuota(env, account.workspaceId, true, account.isEnterprise, count);
  if (!allowed) {
    const limit = account.isEnterprise ? ENTERPRISE_MONTHLY_LIMIT : PAID_MONTHLY_LIMIT;
    return {
      ok: false,
      error: account.isEnterprise
        ? `Your Enterprise plan's fair-use limit is ${limit} WhatsApp messages per month — you've used them all this month. Contact sales@docracy.io for more.`
        : `Paid accounts get ${limit} WhatsApp messages per month — you've used them all this month.`,
    };
  }
  return { ok: true };
}

export function reportCobroWhatsappOverage(
  env: Env,
  ctx: { waitUntil(promise: Promise<unknown>): void },
  account: AccountContext,
  overageUnits: number | undefined
): void {
  if (!overageUnits || overageUnits <= 0) return;
  ctx.waitUntil(
    (async () => {
      const stripeCustomerId = await getStripeCustomerId(env, account.workspaceId);
      if (stripeCustomerId) {
        await reportWhatsappOverageUsage(env, stripeCustomerId, overageUnits);
      } else {
        console.error(
          `WhatsApp overage: paid account ${account.workspaceId} has no Stripe customer id — ${overageUnits} unit(s) not billed`
        );
      }
    })().catch((err) => console.error(`WhatsApp overage report failed for account ${account.workspaceId} (non-fatal):`, err))
  );
}

export interface CreateCobroParams {
  env: Env;
  ctx: { waitUntil(promise: Promise<unknown>): void };
  pdfBytes: Uint8Array;
  filename: string;
  accountId: string;
  preparerEmail: string;
  title: string;
  paymentRequest: PaymentRequest;
  recipient: { name: string; email?: string; whatsappPhone?: string };
  remindEveryDays: number;
  locale?: Locale;
  creatorIp?: string | null;
  ttlDays: number;
}

export async function createCobroDocument(
  params: CreateCobroParams
): Promise<{ docId: string; statusToken: string }> {
  const { env, ctx, pdfBytes, filename, accountId, preparerEmail, paymentRequest, recipient } = params;
  const docId = crypto.randomUUID();
  const now = new Date();
  const nowIso = now.toISOString();
  const expiresAt = new Date(now.getTime() + params.ttlDays * 24 * 60 * 60 * 1000).toISOString();
  const createdHash = await sha256Hex(pdfBytes);
  const remindEveryDays = params.remindEveryDays;
  const locale: Locale = params.locale ?? "en";

  await env.DOCRACY_DOCS.put(`docs/${docId}/original.pdf`, pdfBytes);
  await env.DOCRACY_DOCS.put(`docs/${docId}/working.pdf`, pdfBytes);
  await env.DOCRACY_DOCS.put(`docs/${docId}/final.pdf`, pdfBytes);

  const events: AuditEvent[] = [
    {
      type: "created",
      signerOrder: null,
      ip: params.creatorIp ?? null,
      userAgent: null,
      timestamp: nowIso,
      pdfSha256: createdHash,
    },
  ];

  const doc: DocState = {
    docId,
    accountId,
    title: params.title.trim() || filename,
    createdAt: nowIso,
    expiresAt,
    preparerSigns: false,
    status: "completed",
    completedAt: nowIso,
    signingMode: "sequential",
    signers: [],
    fields: [],
    events,
    locale,
    preparerEmail: preparerEmail.trim() || undefined,
    paymentRequest,
    kind: "cobro",
    cobroRecipient: {
      name: recipient.name.trim(),
      email: recipient.email?.trim() || undefined,
      whatsappPhone: recipient.whatsappPhone?.trim() || undefined,
    },
    cobroRemindEveryDays: remindEveryDays,
    cobroNextRemindAt: nextCobroRemindAt(now.getTime(), remindEveryDays),
    whatsappInvites: recipient.whatsappPhone ? true : undefined,
  };

  await putDoc(env, doc);

  const statusToken = await signToken(docId, 0, env.TOKEN_SECRET);
  ctx.waitUntil(
    deliverCobroNotice(env, doc, statusToken, false).catch((err) =>
      console.error(`Cobro notice failed for doc ${docId} (non-fatal):`, err)
    )
  );
  ctx.waitUntil(
    indexDocumentCreated(env, doc, pdfBytes).catch((err) =>
      console.error(`D1 indexing failed for cobro ${docId} (non-fatal):`, err)
    )
  );

  return { docId, statusToken };
}

export async function deliverCobroNotice(
  env: Env,
  doc: DocState,
  statusToken: string,
  isReminder: boolean,
  opts: { skipWhatsApp?: boolean } = {}
): Promise<void> {
  const locale: Locale = doc.locale ?? "en";
  const pageUrl = signedPageUrl(env.PUBLIC_APP_URL, statusToken, locale);
  const email = doc.cobroRecipient?.email?.trim();
  if (email) {
    await sendCobroNotice(env, email, doc, pageUrl, isReminder);
  }
  if (!opts.skipWhatsApp && doc.cobroRecipient?.whatsappPhone) {
    await sendWhatsAppCobro(env, doc, pageUrl);
  }
}

export async function sendCobroAgain(
  env: Env,
  doc: DocState,
  opts: { skipWhatsApp?: boolean } = {}
): Promise<DocState> {
  if (doc.cobroPaidAt) return doc;
  const statusToken = await signToken(doc.docId, 0, env.TOKEN_SECRET);
  const now = Date.now();
  const everyDays = doc.cobroRemindEveryDays ?? DEFAULT_COBRO_REMIND_DAYS;
  await deliverCobroNotice(env, doc, statusToken, true, opts);
  doc.cobroLastRemindAt = new Date(now).toISOString();
  doc.cobroNextRemindAt = nextCobroRemindAt(now, everyDays);
  await putDoc(env, doc);
  return doc;
}

const SWEEP_CONCURRENCY = 10;

async function processCobroCandidate(env: Env, docId: string): Promise<void> {
  const doc = await getDoc(env, docId);
  if (!doc || !cobroRemindDue(doc, Date.now())) return;
  let skipWhatsApp = false;
  if (doc.cobroRecipient?.whatsappPhone && doc.accountId) {
    const allowed = await consumeWhatsappQuota(env, doc.accountId, true, false, 1);
    if (!allowed) skipWhatsApp = true;
  }
  await sendCobroAgain(env, doc, { skipWhatsApp });
}

/**
 * Daily sweep: re-send cobro pay+file notices when cobroNextRemindAt has passed.
 * Email uses Resend; WhatsApp reuses the live signing_invite template (quota consumed at create
 * and again here — each ping is a new outbound).
 */
export async function runCobroRemindSweep(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (let i = 0; i < docIds.length; i += SWEEP_CONCURRENCY) {
    const batch = docIds.slice(i, i + SWEEP_CONCURRENCY);
    await Promise.all(
      batch.map((id) =>
        processCobroCandidate(env, id).catch((err) =>
          console.error(`Cobro remind failed for doc ${id} (non-fatal):`, err)
        )
      )
    );
  }
}
