import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { ALLOWED_LOGO_CONTENT_TYPES, MAX_LOGO_BYTES, deleteLogo, hasCustomLogo, logoPath, uploadLogo } from "../lib/branding";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };
const branding = new Hono<{ Bindings: Env; Variables: Variables }>();

branding.get("/logo", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ hasLogo: false, logoPath: null });
  }
  const account = c.get("account")!;
  const hasLogo = await hasCustomLogo(c.env, account.workspaceId);
  return c.json({ hasLogo, logoPath: hasLogo ? logoPath(account.workspaceId) : null });
});

// Shared workspace resource, same as templates/webhooks — any teammate can manage it, not just
// the owner (unlike billing/team membership, which are genuinely owner-only concerns).
branding.post("/logo", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;

  const form = await c.req.parseBody();
  const file = form["logo"];
  if (!(file instanceof File)) {
    return c.json({ error: "Expected multipart form with a 'logo' file" }, 400);
  }
  if (file.size > MAX_LOGO_BYTES) {
    return c.json({ error: `Logo must be under ${MAX_LOGO_BYTES / (1024 * 1024)}MB` }, 400);
  }
  const contentType = file.type;
  if (!ALLOWED_LOGO_CONTENT_TYPES.has(contentType)) {
    return c.json({ error: "Logo must be a PNG, JPEG, or WebP image" }, 400);
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  await uploadLogo(c.env, account.workspaceId, bytes, contentType);
  return c.json({ ok: true, logoPath: logoPath(account.workspaceId) });
});

branding.delete("/logo", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  await deleteLogo(c.env, account.workspaceId);
  return c.json({ ok: true });
});

export default branding;
