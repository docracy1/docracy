import { sanitizeJsonStringNewlines } from "./aiJson";
import { createBlogPost, listPublishedBlogPosts, slugify, updateBlogPost } from "./blogPosts";
import { ensureWeeklyBlogInfra } from "./blogTopicQueue";
import { pingIndexNow } from "./indexNow";
import type { Env } from "@docracy/shared";

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
/** Kept for local `__scheduled?cron=` testing; production uses the daily cron + Monday check. */
export const BLOG_WEEKLY_CRON = "0 9 * * 1";

export function isWeeklyBlogMondayUtc(now = new Date()): boolean {
  return now.getUTCDay() === 1;
}

interface TopicRow {
  id: string;
  slug: string;
  title: string;
  angle: string;
  cluster: string;
  status: string;
}

interface DraftedPost {
  title: string;
  description: string;
  body: string;
  slug: string;
}

const SYSTEM_PROMPT = `
You write SEO blog posts for Docracy (docracy.io) — a free, no-signup sequential e-signature tool.
Paid plan is a flat $10/month per workspace (not per seat) with templates, AI tools, connectors, etc.

Respond with ONLY a JSON object — no markdown fences, no prose outside JSON:
{"title":"...","description":"...","body":"...","slug":"..."}

Rules:
- title: clear how-to or question style, under 70 characters, include the main keyword naturally
- description: meta description, 140–160 characters, compelling, includes keyword
- slug: lowercase kebab-case, 3–80 chars, match the title topic (letters, numbers, hyphens only)
- body: the FULL article as plain text using these markers only:
  - Lines starting with "## " for H2 section titles
  - Lines starting with "### " for FAQ questions
  - Blank line between paragraphs
  - Bullet lines starting with "- " for lists
- Structure like a strong competitor SEO guide: intro, can-you / what-is sections, step-by-step with Docracy,
  business/sender angle when relevant, mistakes list, FAQ (5–7 ### questions), short closing CTA
- Mention Docracy naturally; do not invent features. Signers need no account. Free for short signing chains (up to 2 signers).
- Do NOT claim identity verification. Do NOT give tax or legal advice — add a one-line disclaimer where relevant.
- Do NOT use **, *, # (except ## / ###), or HTML.
- Aim for roughly 900–1400 words of useful content.
`.trim();

function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

function parseDraft(raw: string, fallback: TopicRow): DraftedPost | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(sanitizeJsonStringNewlines(match[0])) as Record<string, unknown>;
    const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 120) : "";
    const description = typeof parsed.description === "string" ? parsed.description.trim().slice(0, 200) : "";
    const body = typeof parsed.body === "string" ? parsed.body.trim().slice(0, 20000) : "";
    let slug =
      typeof parsed.slug === "string" && parsed.slug.trim()
        ? slugify(parsed.slug.trim())
        : slugify(title || fallback.slug);
    if (!slug) slug = fallback.slug;
    if (!title || !body || body.length < 400) return null;
    return {
      title,
      description: description || title,
      body,
      slug: slug.slice(0, 80),
    };
  } catch {
    return null;
  }
}

async function draftFromTopic(env: Env, topic: TopicRow): Promise<DraftedPost | null> {
  try {
    const result = await env.AI.run((env.WORKERS_AI_MODEL || DEFAULT_MODEL) as keyof AiModels, {
      temperature: 0.45,
      max_tokens: 2800,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Write the blog post for this queue item.\n` +
            `Suggested title: ${topic.title}\n` +
            `Preferred slug: ${topic.slug}\n` +
            `Cluster: ${topic.cluster}\n` +
            `Brief:\n${topic.angle}`,
        },
      ],
    });
    const raw = (result as { response?: string }).response?.trim();
    if (!raw) return null;
    return parseDraft(raw, topic);
  } catch (err) {
    console.error("Weekly blog AI draft failed:", err);
    return null;
  }
}

async function nextQueuedTopic(env: Env): Promise<TopicRow | null> {
  const db = requireDb(env);
  return (
    (await db
      .prepare(
        `SELECT id, slug, title, angle, cluster, status FROM blog_topic_queue
         WHERE status = 'queued' ORDER BY sort_order ASC, created_at ASC LIMIT 1`
      )
      .first<TopicRow>()) ?? null
  );
}

/** Prefer publishing an existing admin draft; otherwise generate from the topic queue. */
async function publishOldestDraft(env: Env): Promise<string | null> {
  const db = requireDb(env);
  const draft = await db
    .prepare(
      `SELECT id, slug FROM blog_posts WHERE published_at IS NULL ORDER BY created_at ASC LIMIT 1`
    )
    .first<{ id: string; slug: string }>();
  if (!draft) return null;
  const result = await updateBlogPost(env, draft.id, { publish: true });
  if (!result.ok) return null;
  console.log(`Weekly blog: published existing draft ${draft.slug}`);
  return draft.slug;
}

async function markTopicPublished(env: Env, topicId: string, postId: string): Promise<void> {
  const db = requireDb(env);
  await db
    .prepare(
      `UPDATE blog_topic_queue SET status = 'published', published_post_id = ?, published_at = ? WHERE id = ?`
    )
    .bind(postId, new Date().toISOString(), topicId)
    .run();
}

async function ensureUniqueSlug(env: Env, desired: string): Promise<string> {
  const published = await listPublishedBlogPosts(env);
  const taken = new Set(published.map((p) => p.slug.toLowerCase()));
  // Also avoid colliding with drafts
  const db = requireDb(env);
  const { results } = await db.prepare(`SELECT slug FROM blog_posts`).all<{ slug: string }>();
  for (const r of results) taken.add(r.slug.toLowerCase());

  let slug = desired;
  let n = 2;
  while (taken.has(slug.toLowerCase())) {
    const base = desired.slice(0, 76);
    slug = `${base}-${n}`;
    n += 1;
  }
  return slug;
}

/**
 * Monday job: publish one blog post.
 * 1) If an admin draft exists, publish the oldest.
 * 2) Else take the next queued SEO topic, draft with Workers AI, publish.
 */
export async function runWeeklyBlogPublish(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) {
    console.log("Weekly blog: skipped (no D1)");
    return;
  }

  await ensureWeeklyBlogInfra(env);

  const fromDraft = await publishOldestDraft(env);
  if (fromDraft) {
    await pingIndexNow([`/blog/${fromDraft}`]);
    return;
  }

  const topic = await nextQueuedTopic(env);
  if (!topic) {
    console.log("Weekly blog: no queued topics left");
    return;
  }

  const draft = await draftFromTopic(env, topic);
  if (!draft) {
    console.error(`Weekly blog: AI draft failed for topic ${topic.slug}`);
    return;
  }

  const slug = await ensureUniqueSlug(env, draft.slug || topic.slug);
  const created = await createBlogPost(env, {
    slug,
    title: draft.title,
    description: draft.description,
    body: draft.body,
    publish: true,
  });
  if (!created.ok) {
    console.error(`Weekly blog: create failed for ${slug}: ${created.error}`);
    return;
  }

  await markTopicPublished(env, topic.id, created.id);
  console.log(`Weekly blog: published ${slug} from topic ${topic.id}`);
  await pingIndexNow([`/blog/${slug}`]);
}

/** XML sitemap fragment listing published D1 posts (for robots.txt second sitemap). */
export async function blogPostsSitemapXml(env: Env): Promise<string> {
  const posts = await listPublishedBlogPosts(env);
  const urls = posts
    .map((p) => {
      const lastmod = (p.publishedAt ?? p.createdAt).slice(0, 10);
      return `  <url>\n    <loc>https://docracy.io/blog/${p.slug}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>0.6</priority>\n  </url>`;
    })
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}
