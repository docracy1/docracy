import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { createContact, deleteContact, listContacts, updateContact } from "../lib/contacts";
import type { Env } from "@docracy/shared";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Variables = { account: AccountContext | null };
const contacts = new Hono<{ Bindings: Env; Variables: Variables }>();

contacts.get("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ contacts: [] });
  const account = c.get("account")!;
  return c.json({ contacts: await listContacts(c.env, account.workspaceId) });
});

contacts.post("/", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  let body: { name?: string; email?: string; company?: string };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const name = body.name?.trim() ?? "";
  const email = body.email?.trim() ?? "";
  if (!name) return c.json({ error: "A name is required" }, 400);
  if (!EMAIL_RE.test(email)) return c.json({ error: "That doesn't look like a valid email address" }, 400);

  try {
    const contact = await createContact(c.env, account.workspaceId, {
      name,
      email,
      company: body.company,
    });
    return c.json({ contact }, 201);
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return c.json({ error: "A contact with that email already exists" }, 409);
    }
    throw err;
  }
});

contacts.patch("/:id", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  let body: { name?: string; email?: string; company?: string | null };
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (body.email !== undefined && !EMAIL_RE.test(body.email.trim())) {
    return c.json({ error: "That doesn't look like a valid email address" }, 400);
  }
  try {
    const contact = await updateContact(c.env, account.workspaceId, c.req.param("id"), body);
    if (!contact) return c.json({ error: "Contact not found" }, 404);
    return c.json({ contact });
  } catch (err) {
    const message = err instanceof Error ? err.message : "";
    if (message.includes("UNIQUE")) {
      return c.json({ error: "A contact with that email already exists" }, 409);
    }
    throw err;
  }
});

contacts.delete("/:id", requirePaidAccount, async (c) => {
  if (!c.env.DOCRACY_DB) {
    return c.json({ error: "Not available on this deployment yet." }, 501);
  }
  const account = c.get("account")!;
  const ok = await deleteContact(c.env, account.workspaceId, c.req.param("id"));
  if (!ok) return c.json({ error: "Contact not found" }, 404);
  return c.json({ ok: true });
});

export default contacts;
