import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import {
  CLOUD_PROVIDERS,
  getAuthorizeUrl,
  handleCallback,
  isProviderConfigured,
  listConnections,
  deleteConnection,
  type CloudProvider,
} from "../lib/cloudConnectors";
import type { Env } from "@docracy/shared";

function isCloudProvider(value: string): value is CloudProvider {
  return (CLOUD_PROVIDERS as readonly string[]).includes(value);
}

type Variables = { account: AccountContext | null };
const connectors = new Hono<{ Bindings: Env; Variables: Variables }>();

connectors.get("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ connections: [] });
  const account = c.get("account")!;
  const connections = await listConnections(c.env, account.workspaceId);
  return c.json({ connections });
});

connectors.get("/:provider/authorize", requirePaidAccount, async (c) => {
  const provider = c.req.param("provider");
  if (!isCloudProvider(provider)) return c.json({ error: "Unknown provider" }, 404);
  if (!c.env.DOCRACY_DB || !isProviderConfigured(c.env, provider)) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  const url = await getAuthorizeUrl(c.env, provider, account.workspaceId);
  return c.json({ url });
});

// No auth middleware: this is the OAuth redirect target hit directly by the browser after the
// user grants consent on the provider's own site — it can't rely on our session cookie being
// present. Identity is recovered from the validated, single-use `state` token instead.
connectors.get("/:provider/callback", async (c) => {
  const provider = c.req.param("provider");
  const appUrl = c.env.PUBLIC_APP_URL;
  if (!isCloudProvider(provider)) return c.redirect(`${appUrl}/dashboard?connector=error`);
  if (!c.env.DOCRACY_DB || !isProviderConfigured(c.env, provider)) {
    return c.redirect(`${appUrl}/dashboard?connector=error`);
  }

  const code = c.req.query("code");
  const state = c.req.query("state");
  if (!code || !state) return c.redirect(`${appUrl}/dashboard?connector=error`);

  const result = await handleCallback(c.env, provider, code, state);
  return c.redirect(`${appUrl}/dashboard?connector=${result.ok ? "connected" : "error"}`);
});

connectors.delete("/:provider", requirePaidAccount, async (c) => {
  const provider = c.req.param("provider");
  if (!isCloudProvider(provider)) return c.json({ error: "Unknown provider" }, 404);
  const account = c.get("account")!;
  const deleted = await deleteConnection(c.env, account.workspaceId, provider);
  if (!deleted) return c.json({ error: "Connection not found" }, 404);
  return c.json({ ok: true });
});

export default connectors;
