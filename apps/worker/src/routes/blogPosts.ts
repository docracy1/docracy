import { Hono } from "hono";
import { requireAdminAccount, type AccountContext } from "../lib/auth";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getPublishedBlogPost,
  listAllBlogPosts,
  listPublishedBlogPosts,
  slugify,
  updateBlogPost,
} from "../lib/blogPosts";
import { blogPostsSitemapXml } from "../lib/blogWeekly";
import type { Env } from "@docracy/shared";

type Variables = { account: AccountContext | null };

// Public reads — anyone browsing /blog, no auth. Mounted at /api/blog-posts.
export const blogPostsPublic = new Hono<{ Bindings: Env; Variables: Variables }>();

blogPostsPublic.get("/", async (c) => {
  const posts = await listPublishedBlogPosts(c.env);
  return c.json({ posts });
});

/** Dynamic sitemap for CMS / weekly-cron posts — listed in robots.txt alongside the static sitemap. */
blogPostsPublic.get("/sitemap.xml", async (c) => {
  const xml = await blogPostsSitemapXml(c.env);
  return new Response(xml, {
    headers: {
      "content-type": "application/xml; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
});

blogPostsPublic.get("/:slug", async (c) => {
  const post = await getPublishedBlogPost(c.env, c.req.param("slug"));
  if (!post) return c.json({ error: "Not found" }, 404);
  return c.json({ post });
});

// Admin CRUD — mounted at /api/admin/blog-posts, gated by requireAdminAccount (same allow-list
// as every other /api/admin/* route).
export const blogPostsAdmin = new Hono<{ Bindings: Env; Variables: Variables }>();

blogPostsAdmin.get("/", requireAdminAccount, async (c) => {
  const posts = await listAllBlogPosts(c.env);
  return c.json({ posts });
});

blogPostsAdmin.get("/:id", requireAdminAccount, async (c) => {
  const post = await getBlogPostById(c.env, c.req.param("id"));
  if (!post) return c.json({ error: "Not found" }, 404);
  return c.json({ post });
});

interface CreateBody {
  slug?: string;
  title?: string;
  description?: string;
  body?: string;
  publish?: boolean;
}

blogPostsAdmin.post("/", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  let body: CreateBody;
  try {
    body = await c.req.json<CreateBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  if (!body.title?.trim()) return c.json({ error: "Title is required" }, 400);

  // A caller can supply an explicit slug (e.g. hand-edited after auto-filling from the title), or
  // leave it out and get one derived from the title — same convenience as GitHub/most CMS UIs.
  const slug = body.slug?.trim() || slugify(body.title);
  const result = await createBlogPost(c.env, {
    slug,
    title: body.title,
    description: body.description ?? "",
    body: body.body ?? "",
    publish: !!body.publish,
  });
  if (!result.ok) return c.json({ error: result.error }, 400);
  return c.json({ ok: true, id: result.id, slug });
});

interface UpdateBody {
  title?: string;
  description?: string;
  body?: string;
  publish?: boolean;
}

blogPostsAdmin.put("/:id", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  let body: UpdateBody;
  try {
    body = await c.req.json<UpdateBody>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const result = await updateBlogPost(c.env, c.req.param("id"), body);
  if (!result.ok) return c.json({ error: result.error }, result.error === "Post not found" ? 404 : 400);
  return c.json({ ok: true });
});

blogPostsAdmin.delete("/:id", requireAdminAccount, async (c) => {
  if (!c.env.DOCRACY_DB) return c.json({ error: "Not available on this deployment yet." }, 501);
  await deleteBlogPost(c.env, c.req.param("id"));
  return c.json({ ok: true });
});
