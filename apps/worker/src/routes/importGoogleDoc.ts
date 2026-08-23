import { Hono } from "hono";
import { checkGoogleDocImportRateLimit } from "../lib/ratelimit";
import type { Env } from "@docracy/shared";

/** Public, no-auth import of a Google Doc as a ready-to-sign PDF — no OAuth, no paid plan, no
 *  account. Works only for documents shared as "Anyone with the link can view", by hitting
 *  Google's own public export-by-URL endpoint server-side (avoids the CORS block a client-side
 *  fetch to docs.google.com would hit, and keeps the doc ID extraction/validation in one place). */
export const importGoogleDoc = new Hono<{ Bindings: Env }>();

const DOC_ID_RE = /\/document\/d\/([a-zA-Z0-9_-]+)/;

importGoogleDoc.post("/", async (c) => {
  const ip = c.req.header("CF-Connecting-IP") ?? "unknown";
  if (!(await checkGoogleDocImportRateLimit(c.env, ip))) {
    return c.json({ error: "Too many imports. Please try again shortly." }, 429);
  }

  let body: { url?: string };
  try {
    body = await c.req.json<{ url?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }

  const match = body.url?.match(DOC_ID_RE);
  if (!match) {
    return c.json({ error: "That doesn't look like a Google Docs link." }, 400);
  }

  let upstream: Response;
  try {
    upstream = await fetch(`https://docs.google.com/document/d/${match[1]}/export?format=pdf`);
  } catch {
    return c.json({ error: "Couldn't reach Google Docs — please try again." }, 502);
  }

  // A private doc doesn't 404/403 here — Google serves an HTML sign-in/permission page with a 200,
  // so content-type (not status) is what actually distinguishes a real export from a login wall.
  const contentType = upstream.headers.get("content-type") ?? "";
  if (!upstream.ok || !contentType.includes("application/pdf")) {
    return c.json(
      { error: 'Couldn\'t access that document — make sure it\'s shared as "Anyone with the link can view."' },
      400
    );
  }

  const bytes = await upstream.arrayBuffer();
  return new Response(bytes, { headers: { "content-type": "application/pdf" } });
});
