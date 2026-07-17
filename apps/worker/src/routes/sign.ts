import { Hono } from "hono";
import { getDoc, putDoc, isSignerOnTurn, currentTurnOrder } from "../lib/kv";
import { burnFields, decodedByteLength, generateCertificate, MAX_SIGNATURE_IMAGE_BYTES, type FieldValue } from "../lib/pdf";
import { sendSigningInvite, sendCompletionEmails } from "../lib/email";
import { recordViewedOnce, indexSignerSigned, indexInviteSent, indexCompleted } from "../lib/index-d1";
import { checkTokenAccessRateLimit } from "../lib/ratelimit";
import { sha256Hex } from "../lib/hash";
import { requestTimestamp } from "../lib/timestamp";
import { verifyToken, signToken } from "@docracy/shared";
import type { AuditEvent, Env } from "@docracy/shared";

function indexNonFatal(
  ctx: { waitUntil(promise: Promise<unknown>): void },
  docId: string,
  label: string,
  work: Promise<void>
) {
  ctx.waitUntil(work.catch((err) => console.error(`D1 indexing (${label}) failed for doc ${docId} (non-fatal):`, err)));
}

const sign = new Hono<{ Bindings: Env }>();

function statusPayload(doc: Awaited<ReturnType<typeof getDoc>>) {
  if (!doc) return null;
  return {
    docId: doc.docId,
    status: doc.status,
    signers: [...doc.signers]
      .sort((a, b) => a.order - b.order)
      .map((s) => ({ order: s.order, name: s.name, status: s.status, signedAt: s.signedAt })),
  };
}

sign.get("/status/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const verified = await verifyToken(token, c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 403);

  const doc = await getDoc(c.env, verified.docId);
  if (!doc) return c.json({ error: "This document has expired or doesn't exist" }, 404);

  return c.json(statusPayload(doc));
});

sign.get("/sign/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const verified = await verifyToken(token, c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 403);

  const doc = await getDoc(c.env, verified.docId);
  if (!doc) return c.json({ error: "This document has expired or doesn't exist" }, 404);

  if (!isSignerOnTurn(doc, verified.order)) {
    return c.json({ onTurn: false, status: statusPayload(doc) });
  }

  if (doc.accountId) {
    indexNonFatal(c.executionCtx, doc.docId, "viewed", recordViewedOnce(c.env, doc, verified.order));
  }

  const pdfObj = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/working.pdf`);
  if (!pdfObj) return c.json({ error: "Document blob missing" }, 404);
  const pdfBase64 = arrayBufferToBase64(await pdfObj.arrayBuffer());

  return c.json({
    onTurn: true,
    docId: doc.docId,
    pdfBase64,
    fields: doc.fields.filter((f) => f.signerOrder === verified.order),
    status: statusPayload(doc),
  });
});

sign.post("/sign/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const verified = await verifyToken(token, c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 403);

  const doc = await getDoc(c.env, verified.docId);
  if (!doc) return c.json({ error: "This document has expired or doesn't exist" }, 404);

  if (!isSignerOnTurn(doc, verified.order)) {
    return c.json({ error: "It's not your turn to sign yet" }, 409);
  }

  let body: { values: FieldValue[]; consent?: boolean };
  try {
    body = await c.req.json<{ values: FieldValue[]; consent?: boolean }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  // The legal weight of an electronic signature rests on the signer affirmatively agreeing to
  // sign electronically — the web UI's checkbox is the primary control, this is defense in depth
  // (and the source of truth recorded in the "consented" audit event below).
  if (body.consent !== true) {
    return c.json({ error: "You must confirm you agree to sign electronically before submitting" }, 400);
  }

  const myFields = doc.fields.filter((f) => f.signerOrder === verified.order);

  // Defense in depth: creation already requires every signer to have a field, but if that were
  // ever bypassed, a signer with zero fields would otherwise trivially "complete" their turn
  // without signing anything at all — an empty array vacuously passes an every()/some() check.
  if (myFields.length === 0) {
    return c.json({ error: "This signer has no signature field to sign — contact whoever prepared this document" }, 400);
  }

  const valueById = new Map(body.values?.map((v) => [v.fieldId, v.value]) ?? []);
  const missing = myFields.some((f) => !valueById.get(f.id)?.trim());
  if (missing) {
    return c.json({ error: "Please fill in every field before submitting" }, 400);
  }

  const oversized = myFields.some((f) => decodedByteLength(valueById.get(f.id)!) > MAX_SIGNATURE_IMAGE_BYTES);
  if (oversized) {
    return c.json({ error: "Signature image is too large" }, 400);
  }

  const ip = c.req.header("CF-Connecting-IP") ?? null;
  const userAgent = c.req.header("User-Agent") ?? null;

  const workingObj = await c.env.DOCRACY_DOCS.get(`docs/${doc.docId}/working.pdf`);
  if (!workingObj) return c.json({ error: "Document blob missing" }, 404);
  const workingBytes = new Uint8Array(await workingObj.arrayBuffer());

  const signer = doc.signers.find((s) => s.order === verified.order)!;
  const signedAt = new Date().toISOString();

  const updatedBytes = await burnFields(workingBytes, myFields, body.values, signer.email, signedAt);
  const signedHash = await sha256Hex(updatedBytes);

  // Re-fetch and re-check right before committing: burnFields above is the slowest step in this
  // handler, so a near-simultaneous duplicate submission (double-click, a retried request) could
  // otherwise slip through the earlier isSignerOnTurn check too and double-advance the chain —
  // double-sending the next signer's invite, or on the last signer, double-sending completion
  // emails with the signed PDF attached to everyone. This doesn't fully eliminate the race (KV
  // has no compare-and-swap), but it collapses the window from "the whole PDF burn" to "one KV
  // read plus a couple of writes," which is enough for the double-click/retry case this guards.
  const freshDoc = await getDoc(c.env, verified.docId);
  if (!freshDoc || !isSignerOnTurn(freshDoc, verified.order)) {
    return c.json({ error: "This submission was already received" }, 409);
  }

  await c.env.DOCRACY_DOCS.put(`docs/${freshDoc.docId}/working.pdf`, updatedBytes);

  const freshSigner = freshDoc.signers.find((s) => s.order === verified.order)!;
  freshSigner.status = "signed";
  freshSigner.signedAt = signedAt;

  const events: AuditEvent[] = [
    ...(freshDoc.events ?? []),
    { type: "consented", signerOrder: verified.order, ip, userAgent, timestamp: signedAt, pdfSha256: null },
    { type: "signed", signerOrder: verified.order, ip, userAgent, timestamp: signedAt, pdfSha256: signedHash },
  ];

  if (freshDoc.accountId) {
    indexNonFatal(c.executionCtx, freshDoc.docId, "signed", indexSignerSigned(c.env, freshDoc, verified.order, updatedBytes, ip));
  }

  const nextOrder = currentTurnOrder(freshDoc);
  if (nextOrder !== null) {
    const nextSigner = freshDoc.signers.find((s) => s.order === nextOrder)!;
    nextSigner.linkSentAt = new Date().toISOString();
    events.push({
      type: "invite_sent",
      signerOrder: nextOrder,
      ip: null,
      userAgent: null,
      timestamp: nextSigner.linkSentAt,
      pdfSha256: null,
    });
    freshDoc.events = events;
    await putDoc(c.env, freshDoc);

    const nextToken = await signToken(freshDoc.docId, nextOrder, c.env.TOKEN_SECRET);
    await sendSigningInvite(c.env, freshDoc, nextOrder, nextToken);

    if (freshDoc.accountId) {
      indexNonFatal(c.executionCtx, freshDoc.docId, "invite_sent", indexInviteSent(c.env, freshDoc, nextOrder));
    }
  } else {
    freshDoc.status = "completed";
    freshDoc.completedAt = new Date().toISOString();
    events.push({
      type: "completed",
      signerOrder: null,
      ip: null,
      userAgent: null,
      timestamp: freshDoc.completedAt,
      pdfSha256: signedHash,
    });
    freshDoc.events = events;

    const timestamp = await requestTimestamp(signedHash);
    if (timestamp) {
      freshDoc.timestampToken = timestamp.tokenBase64;
      freshDoc.timestampGenTime = timestamp.genTime;
    }

    await c.env.DOCRACY_DOCS.put(`docs/${freshDoc.docId}/final.pdf`, updatedBytes);
    const certificateBytes = await generateCertificate(freshDoc, signedHash);
    await c.env.DOCRACY_DOCS.put(`docs/${freshDoc.docId}/certificate.pdf`, certificateBytes);

    await putDoc(c.env, freshDoc);
    await sendCompletionEmails(c.env, freshDoc, updatedBytes, certificateBytes);

    if (freshDoc.accountId) {
      indexNonFatal(c.executionCtx, freshDoc.docId, "completed", indexCompleted(c.env, freshDoc));
    }
  }

  return c.json({ ok: true, status: statusPayload(freshDoc) });
});

function arrayBufferToBase64(buf: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (const b of bytes) binary += String.fromCharCode(b);
  return btoa(binary);
}

export default sign;
