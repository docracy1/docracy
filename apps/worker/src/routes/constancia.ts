import { Hono } from "hono";
import { verifyConstanciaToken } from "@docracy/shared";
import type { Env, Locale } from "@docracy/shared";
import { checkTokenAccessRateLimit } from "../lib/ratelimit";
import {
  getConstanciaProfile,
  listCompletedInYear,
  listConstanciaReceipts,
  receiptObjectKey,
  toPublicConstanciaRow,
  totalsByCurrency,
} from "../lib/constancia";

const constancia = new Hono<{ Bindings: Env }>();

constancia.get("/:token/receipts/:id", async (c) => {
  const token = c.req.param("token");
  const id = c.req.param("id");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }
  const verified = await verifyConstanciaToken(token, c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 401);
  const files = await listConstanciaReceipts(c.env, verified.workspaceId, verified.year);
  const meta = files.find((f) => f.id === id);
  if (!meta) return c.json({ error: "Not found" }, 404);
  const obj = await c.env.DOCRACY_DOCS.get(receiptObjectKey(verified.workspaceId, verified.year, id));
  if (!obj) return c.json({ error: "Not found" }, 404);
  const bytes = new Uint8Array(await obj.arrayBuffer());
  return new Response(bytes, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${meta.filename.replace(/"/g, "")}"`,
      "Cache-Control": "private, max-age=300",
    },
  });
});

constancia.get("/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const verified = await verifyConstanciaToken(token, c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 401);

  const locale: Locale = c.req.query("locale") === "es" ? "es" : "en";
  const profile = await getConstanciaProfile(c.env, verified.workspaceId);
  const [documents, receipts] = await Promise.all([
    listCompletedInYear(c.env, verified.workspaceId, verified.year, locale),
    listConstanciaReceipts(c.env, verified.workspaceId, verified.year),
  ]);
  const publicDocs = documents.map(toPublicConstanciaRow);

  return c.json({
    year: verified.year,
    subjectName: profile?.subjectName ?? "",
    documents: publicDocs,
    totals: totalsByCurrency(publicDocs),
    receipts: receipts.map((r) => ({
      id: r.id,
      filename: r.filename,
      uploadedAt: r.uploadedAt,
      size: r.size,
    })),
  });
});

export default constancia;
