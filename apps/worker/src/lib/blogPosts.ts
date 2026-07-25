import type { Env } from "@docracy/shared";

export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface BlogPostDetail extends BlogPostSummary {
  body: string;
}

interface BlogPostRow {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function rowToSummary(row: BlogPostRow): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    description: row.description,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  };
}

function rowToDetail(row: BlogPostRow): BlogPostDetail {
  return { ...rowToSummary(row), body: row.body };
}

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function isValidBlogSlug(slug: string): boolean {
  return slug.length >= 3 && slug.length <= 80 && SLUG_RE.test(slug);
}

/** Lowercases, replaces anything that isn't a letter/number with a hyphen, and collapses repeats
 *  — a title like "Docracy vs Foo: Which Is Better?" becomes "docracy-vs-foo-which-is-better". */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

/** Every post, draft or published, most recently created first — admin-only. */
export async function listAllBlogPosts(env: Env): Promise<BlogPostSummary[]> {
  const db = requireDb(env);
  const { results } = await db.prepare(`SELECT * FROM blog_posts ORDER BY created_at DESC`).all<BlogPostRow>();
  return results.map(rowToSummary);
}

/** Published posts only, most recently published first — what the public /blog index shows. */
export async function listPublishedBlogPosts(env: Env): Promise<BlogPostSummary[]> {
  if (!env.DOCRACY_DB) return [];
  const { results } = await env.DOCRACY_DB.prepare(
    `SELECT * FROM blog_posts WHERE published_at IS NOT NULL ORDER BY published_at DESC`
  ).all<BlogPostRow>();
  return results.map(rowToSummary);
}

/** Published-only lookup by slug — a draft resolves as "not found" for anonymous readers, same
 *  as how templates.ts scopes a lookup by account_id so an unauthorized row is indistinguishable
 *  from a missing one. */
export async function getPublishedBlogPost(env: Env, slug: string): Promise<BlogPostDetail | null> {
  if (!env.DOCRACY_DB) return null;
  const row = await env.DOCRACY_DB.prepare(`SELECT * FROM blog_posts WHERE slug = ? COLLATE NOCASE AND published_at IS NOT NULL`)
    .bind(slug)
    .first<BlogPostRow>();
  return row ? rowToDetail(row) : null;
}

/** Any post regardless of draft/published status, by id — admin-only (editing a draft). */
export async function getBlogPostById(env: Env, id: string): Promise<BlogPostDetail | null> {
  const db = requireDb(env);
  const row = await db.prepare(`SELECT * FROM blog_posts WHERE id = ?`).bind(id).first<BlogPostRow>();
  return row ? rowToDetail(row) : null;
}

export interface CreateBlogPostInput {
  slug: string;
  title: string;
  description: string;
  body: string;
  publish: boolean;
}

export async function createBlogPost(
  env: Env,
  input: CreateBlogPostInput
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!isValidBlogSlug(input.slug)) {
    return { ok: false, error: "Slug must be 3-80 lowercase letters, numbers, and hyphens" };
  }
  if (!input.title.trim()) return { ok: false, error: "Title is required" };
  if (!input.body.trim()) return { ok: false, error: "Body is required" };

  const db = requireDb(env);
  const existing = await db.prepare(`SELECT id FROM blog_posts WHERE slug = ? COLLATE NOCASE`).bind(input.slug).first();
  if (existing) return { ok: false, error: "That slug is already taken" };

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  await db
    .prepare(
      `INSERT INTO blog_posts (id, slug, title, description, body, published_at, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(id, input.slug, input.title.trim(), input.description.trim(), input.body, input.publish ? now : null, now, now)
    .run();
  return { ok: true, id };
}

export interface UpdateBlogPostInput {
  title?: string;
  description?: string;
  body?: string;
  publish?: boolean;
}

/** Partial update — only the fields present in `input` change. Toggling `publish` sets/clears
 *  published_at; it does not stamp a fresh published_at on every edit to an already-published
 *  post, so the original publish date survives content tweaks. */
export async function updateBlogPost(
  env: Env,
  id: string,
  input: UpdateBlogPostInput
): Promise<{ ok: true } | { ok: false; error: string }> {
  const db = requireDb(env);
  const existing = await db.prepare(`SELECT * FROM blog_posts WHERE id = ?`).bind(id).first<BlogPostRow>();
  if (!existing) return { ok: false, error: "Post not found" };
  if (input.title !== undefined && !input.title.trim()) return { ok: false, error: "Title is required" };
  if (input.body !== undefined && !input.body.trim()) return { ok: false, error: "Body is required" };

  const title = input.title !== undefined ? input.title.trim() : existing.title;
  const description = input.description !== undefined ? input.description.trim() : existing.description;
  const body = input.body !== undefined ? input.body : existing.body;
  const publishedAt =
    input.publish === undefined ? existing.published_at : input.publish ? existing.published_at ?? new Date().toISOString() : null;

  await db
    .prepare(`UPDATE blog_posts SET title = ?, description = ?, body = ?, published_at = ?, updated_at = ? WHERE id = ?`)
    .bind(title, description, body, publishedAt, new Date().toISOString(), id)
    .run();
  return { ok: true };
}

export async function deleteBlogPost(env: Env, id: string): Promise<void> {
  const db = requireDb(env);
  await db.prepare(`DELETE FROM blog_posts WHERE id = ?`).bind(id).run();
}
