import { Hono } from "hono";
import { isValidSha256Hex, lookupVerification, lookupOtsProof } from "../lib/verification";
import { checkOtsProof } from "../lib/opentimestamps";
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
  const hasOtsProof = (await lookupOtsProof(c.env, hash)) !== null;
  return c.json({ found: true, ...record, hasOtsProof });
});

// A standard OpenTimestamps .ots proof — verifiable by anyone via opentimestamps.org or the `ots`
// CLI, independent of Docracy staying up. Submitted as a background step at completion (see
// lib/opentimestamps.ts), so it can be briefly absent right after signing even when found=true
// above; a 404 here just means "not yet available," not "never was."
verifyPublic.get("/:hash/ots", async (c) => {
  const hash = c.req.param("hash");
  if (!isValidSha256Hex(hash)) {
    return c.json({ error: "Not a valid SHA-256 hash (expected 64 hex characters)" }, 400);
  }
  const proof = await lookupOtsProof(c.env, hash);
  if (!proof) return c.json({ error: "No blockchain timestamp proof available yet for this hash" }, 404);
  return new Response(proof, {
    headers: {
      "content-type": "application/octet-stream",
      "content-disposition": `attachment; filename="${hash}.ots"`,
    },
  });
});

// Live confirmation, not just "a proof file exists" — fetches the actual Bitcoin block from a
// public explorer and checks its Merkle root against this hash's proof chain right now. Slower
// than the plain lookup above (a few real network round-trips), so it's a separate opt-in call
// the frontend makes only after a match is already found. See lib/opentimestamps.ts.
verifyPublic.get("/:hash/ots-status", async (c) => {
  const hash = c.req.param("hash");
  if (!isValidSha256Hex(hash)) {
    return c.json({ error: "Not a valid SHA-256 hash (expected 64 hex characters)" }, 400);
  }
  const proof = await lookupOtsProof(c.env, hash);
  if (!proof) return c.json({ available: false, confirmed: false, confirmedAt: null });
  const result = await checkOtsProof(proof);
  return c.json({ available: true, ...result });
});
