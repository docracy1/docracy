import { Hono } from "hono";
import { isValidSha256Hex, lookupVerification } from "../lib/verification";
import type { Env } from "@docracy/shared";

/** Public, no-auth lookup — mounted at /api/verify. The hash itself is the access gate: it's
 *  effectively unguessable without already possessing the exact signed PDF, so there's no
 *  per-document information disclosed to someone who doesn't already have the file in hand. */
export const verifyPublic = new Hono<{ Bindings: Env }>();

verifyPublic.get("/:hash", async (c) => {
  const hash = c.req.param("hash");
  if (!isValidSha256Hex(hash)) {
    return c.json({ error: "Not a valid SHA-256 hash (expected 64 hex characters)" }, 400);
  }
  const record = await lookupVerification(c.env, hash);
  if (!record) return c.json({ found: false });
  return c.json({ found: true, ...record });
});
