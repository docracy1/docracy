import { Hono } from "hono";
import { getLogoObject } from "../lib/branding";
import type { Env } from "@docracy/shared";

const brandingPublic = new Hono<{ Bindings: Env }>();

// Deliberately unauthenticated — this only ever serves a logo image an account itself chose to
// upload, the same trust level as any other publicly-hosted static asset (the Docracy wordmark
// itself is served the same way, just from Pages instead of R2).
brandingPublic.get("/:accountId/logo", async (c) => {
  if (!c.env.DOCRACY_DB) return c.notFound();
  const logo = await getLogoObject(c.env, c.req.param("accountId"));
  if (!logo) return c.notFound();
  return new Response(logo.bytes, {
    headers: {
      "Content-Type": logo.contentType,
      "Cache-Control": "public, max-age=3600",
    },
  });
});

export default brandingPublic;
