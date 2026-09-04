import { Hono } from "hono";
import { verifyPayerToken } from "@docracy/shared";
import type { Env, Locale } from "@docracy/shared";
import { checkTokenAccessRateLimit } from "../lib/ratelimit";
import { listCompletedInYear, toPublicConstanciaRow, totalsByCurrency } from "../lib/constancia";

const payer = new Hono<{ Bindings: Env }>();

payer.get("/:token", async (c) => {
  const token = c.req.param("token");
  if (!(await checkTokenAccessRateLimit(c.env, token))) {
    return c.json({ error: "Too many requests. Please try again shortly." }, 429);
  }

  const verified = await verifyPayerToken(token, c.env.TOKEN_SECRET);
  if (!verified) return c.json({ error: "Invalid or tampered link" }, 401);

  const locale: Locale = c.req.query("locale") === "es" ? "es" : "en";
  const documents = await listCompletedInYear(c.env, verified.workspaceId, verified.year, locale);
  const publicDocs = documents.map(toPublicConstanciaRow);

  return c.json({
    year: verified.year,
    documents: publicDocs,
    totals: totalsByCurrency(publicDocs),
  });
});

export default payer;
