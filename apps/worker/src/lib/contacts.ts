import type { Env } from "@docracy/shared";

export interface Contact {
  id: string;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ContactRow {
  id: string;
  name: string;
  email: string;
  company: string | null;
  created_at: string;
  updated_at: string;
}

function rowToContact(r: ContactRow): Contact {
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    company: r.company,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function listContacts(env: Env, workspaceId: string): Promise<Contact[]> {
  if (!env.DOCRACY_DB) return [];
  const { results } = await env.DOCRACY_DB.prepare(
    `SELECT id, name, email, company, created_at, updated_at
     FROM contacts WHERE workspace_id = ? ORDER BY name COLLATE NOCASE ASC`
  )
    .bind(workspaceId)
    .all<ContactRow>();
  return results.map(rowToContact);
}

export async function createContact(
  env: Env,
  workspaceId: string,
  input: { name: string; email: string; company?: string }
): Promise<Contact> {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await env.DOCRACY_DB!.prepare(
    `INSERT INTO contacts (id, workspace_id, name, email, company, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
  )
    .bind(id, workspaceId, input.name.trim(), input.email.trim().toLowerCase(), input.company?.trim() || null, now, now)
    .run();
  return {
    id,
    name: input.name.trim(),
    email: input.email.trim().toLowerCase(),
    company: input.company?.trim() || null,
    createdAt: now,
    updatedAt: now,
  };
}

export async function upsertContact(
  env: Env,
  workspaceId: string,
  input: { name: string; email: string; company?: string }
): Promise<Contact> {
  const email = input.email.trim().toLowerCase();
  const existing = await env.DOCRACY_DB!.prepare(
    `SELECT id, name, email, company, created_at, updated_at FROM contacts WHERE workspace_id = ? AND email = ? COLLATE NOCASE`
  )
    .bind(workspaceId, email)
    .first<ContactRow>();
  if (!existing) return createContact(env, workspaceId, input);

  const now = new Date().toISOString();
  await env.DOCRACY_DB!.prepare(
    `UPDATE contacts SET name = ?, company = ?, updated_at = ? WHERE id = ? AND workspace_id = ?`
  )
    .bind(input.name.trim(), input.company?.trim() || null, now, existing.id, workspaceId)
    .run();
  return {
    id: existing.id,
    name: input.name.trim(),
    email,
    company: input.company?.trim() || null,
    createdAt: existing.created_at,
    updatedAt: now,
  };
}

export async function updateContact(
  env: Env,
  workspaceId: string,
  id: string,
  input: { name?: string; email?: string; company?: string | null }
): Promise<Contact | null> {
  const existing = await env.DOCRACY_DB!.prepare(
    `SELECT id, name, email, company, created_at, updated_at FROM contacts WHERE id = ? AND workspace_id = ?`
  )
    .bind(id, workspaceId)
    .first<ContactRow>();
  if (!existing) return null;

  const name = input.name?.trim() ?? existing.name;
  const email = input.email?.trim().toLowerCase() ?? existing.email;
  const company = input.company === undefined ? existing.company : input.company?.trim() || null;
  const now = new Date().toISOString();
  await env.DOCRACY_DB!.prepare(
    `UPDATE contacts SET name = ?, email = ?, company = ?, updated_at = ? WHERE id = ? AND workspace_id = ?`
  )
    .bind(name, email, company, now, id, workspaceId)
    .run();
  return { id, name, email, company, createdAt: existing.created_at, updatedAt: now };
}

export async function deleteContact(env: Env, workspaceId: string, id: string): Promise<boolean> {
  const result = await env.DOCRACY_DB!.prepare(`DELETE FROM contacts WHERE id = ? AND workspace_id = ?`)
    .bind(id, workspaceId)
    .run();
  return (result.meta.changes ?? 0) > 0;
}
