import { Hono } from "hono";
import { PDFDocument } from "pdf-lib";
import { createDocumentCore } from "../lib/documentCreation";
import { checkRateLimit, checkInviteRateLimit } from "../lib/ratelimit";
import { optionalAccount, type AccountContext } from "../lib/auth";
import type { DocField, Env } from "@docracy/shared";

interface CreateDocumentBody {
  preparerSigns: boolean;
  preparerEmail?: string;
  signers: Array<{ order: number; name: string; email: string; pin?: string }>;
  fields: DocField[];
  customSubject?: string;
  customMessage?: string;
  signingMode?: "sequential" | "parallel";
}

const MAX_PDF_BYTES = 15 * 1024 * 1024; // 15MB
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_SUBJECT_LENGTH = 150;
const MAX_MESSAGE_LENGTH = 1000;
const FIELD_TYPES = new Set(["signature", "initials", "text", "date"]);
const PIN_RE = /^\d{4,8}$/;

type Variables = { account: AccountContext | null };
const documents = new Hono<{ Bindings: Env; Variables: Variables }>();

documents.post("/", optionalAccount, async (c) => {
  const account = c.get("account");
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  const allowed = await checkRateLimit(c.env, ip);
  if (!allowed) {
    return c.json({ error: "Too many documents created recently. Please try again later." }, 429);
  }

  const form = await c.req.parseBody();
  const pdfFile = form["pdf"];
  const metaRaw = form["meta"];

  if (!(pdfFile instanceof File) || typeof metaRaw !== "string") {
    return c.json({ error: "Expected multipart form with 'pdf' file and 'meta' JSON field" }, 400);
  }

  if (pdfFile.size > MAX_PDF_BYTES) {
    return c.json({ error: `PDF must be under ${MAX_PDF_BYTES / (1024 * 1024)}MB` }, 400);
  }

  const pdfBytes = new Uint8Array(await pdfFile.arrayBuffer());
  const header = new TextDecoder().decode(pdfBytes.slice(0, 5));
  if (header !== "%PDF-") {
    return c.json({ error: "That file doesn't look like a valid PDF" }, 400);
  }

  // A real parse, not just the header sniff above — the header check alone lets a corrupt or
  // (previously) an encrypted PDF through, which would then only fail once someone actually
  // tries to sign it, deadlocking the chain with no useful error days into a signing round.
  let pageCount: number;
  try {
    const probe = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
    pageCount = probe.getPageCount();
  } catch {
    return c.json({ error: "That PDF couldn't be read — it may be corrupted" }, 400);
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
    return c.json(
      { error: `Free plan supports up to ${maxSigners} signers. Sign in with a paid account for unlimited signers.` },
      402
    );
  }
  // PIN-protected signing links are a paid-tier feature — same 402 pattern as the signer cap above.
  if (meta.signers.some((s) => s.pin) && !account?.isPaid) {
    return c.json({ error: "PIN-protected signing links require a paid account." }, 402);
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

  // Per-recipient cap, independent of the per-IP creation limit above: without this, one IP could
  // fan invite emails out across many separate documents that all name the same victim address —
  // each document creation still passes the IP limit since it's a distinct "creation" event.
  const recipientEmails = new Set(seenEmails);
  if (meta.preparerEmail) recipientEmails.add(meta.preparerEmail.trim().toLowerCase());
  for (const email of recipientEmails) {
    if (!(await checkInviteRateLimit(c.env, email))) {
      return c.json(
        { error: "Too many documents have recently been sent to one of these email addresses. Please try again later." },
        429
      );
    }
  }

  // Only a *paid* account attaches to the document — a signed-in-but-unpaid visitor still gets
  // the anonymous, no-D1-indexing free-tier path (accountId stays null), identical to before this
  // middleware existed. workspaceId (not id) so a document created by any team member is indexed
  // under the shared workspace every teammate's dashboard queries against.
  const accountId = account?.isPaid ? account.workspaceId : null;

  const { docId, statusToken } = await createDocumentCore({
    env: c.env,
    ctx: c.executionCtx,
    pdfBytes,
    filename: pdfFile.name || "document.pdf",
    preparerSigns: meta.preparerSigns,
    preparerEmail: meta.preparerEmail,
    signers: meta.signers,
    fields: meta.fields,
    accountId,
    creatorIp: ip,
    customSubject: meta.customSubject?.trim() || undefined,
    customMessage: meta.customMessage?.trim() || undefined,
    signingMode: meta.signingMode,
  });

  return c.json({ docId, statusToken });
});

export default documents;
