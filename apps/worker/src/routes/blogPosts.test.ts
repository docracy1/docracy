import { describe, it, expect } from "vitest";
import { blogPostsAdmin, blogPostsPublic } from "./blogPosts";
import { createSession, SESSION_COOKIE_NAME } from "../lib/auth";
import { createBlogPost } from "../lib/blogPosts";
import { makeMockEnv } from "../test/mockEnv";

const MOCK_CTX = { waitUntil: () => {}, passThroughOnException: () => {} } as unknown as ExecutionContext;

async function adminSession(env: Awaited<ReturnType<typeof makeMockEnv>>["env"]) {
  return createSession(env, MOCK_CTX, "acct-admin", "admin@example.com", false, false, null, null);
}

function postJson(body: unknown, headers: Record<string, string> = {}) {
  return { method: "POST", headers: { "Content-Type": "application/json", ...headers }, body: JSON.stringify(body) };
}

describe("GET /api/blog-posts (public)", () => {
  it("lists only published posts", async () => {
    const { env } = makeMockEnv();
    await createBlogPost(env, { slug: "draft", title: "Draft", description: "", body: "b", publish: false });
    await createBlogPost(env, { slug: "live", title: "Live", description: "", body: "b", publish: true });

    const res = await blogPostsPublic.request("/", {}, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { posts: Array<{ slug: string }> } = await res.json();
    expect(body.posts.map((p) => p.slug)).toEqual(["live"]);
  });
});

describe("GET /api/blog-posts/:slug (public)", () => {
  it("404s for a draft", async () => {
    const { env } = makeMockEnv();
    await createBlogPost(env, { slug: "draft", title: "Draft", description: "", body: "b", publish: false });
    const res = await blogPostsPublic.request("/draft", {}, env, MOCK_CTX);
    expect(res.status).toBe(404);
  });

  it("returns a published post's full body", async () => {
    const { env } = makeMockEnv();
    await createBlogPost(env, { slug: "live", title: "Live", description: "d", body: "full body text", publish: true });
    const res = await blogPostsPublic.request("/live", {}, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { post: { body: string } } = await res.json();
    expect(body.post.body).toBe("full body text");
  });

  it("404s for an unknown slug", async () => {
    const { env } = makeMockEnv();
    const res = await blogPostsPublic.request("/nope", {}, env, MOCK_CTX);
    expect(res.status).toBe(404);
  });
});

describe("GET /api/admin/blog-posts", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await blogPostsAdmin.request("/", {}, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("401s for a non-admin account", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const token = await createSession(env, MOCK_CTX, "acct-1", "notadmin@example.com", false, false, null, null);
    const res = await blogPostsAdmin.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("lists drafts and published posts alike for an admin", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    await createBlogPost(env, { slug: "draft", title: "Draft", description: "", body: "b", publish: false });
    await createBlogPost(env, { slug: "live", title: "Live", description: "", body: "b", publish: true });
    const token = await createSession(env, MOCK_CTX, "acct-admin", "admin@example.com", false, false, null, null);

    const res = await blogPostsAdmin.request("/", { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } }, env, MOCK_CTX);
    expect(res.status).toBe(200);
    const body: { posts: Array<{ slug: string }> } = await res.json();
    expect(body.posts.map((p) => p.slug).sort()).toEqual(["draft", "live"]);
  });
});

describe("POST /api/admin/blog-posts", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await blogPostsAdmin.request("/", postJson({ title: "T", body: "b" }), env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("creates a post, deriving the slug from the title when omitted", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const token = await adminSession(env);
    const res = await blogPostsAdmin.request(
      "/",
      postJson({ title: "My New Post!", description: "d", body: "b", publish: true }, { Cookie: `${SESSION_COOKIE_NAME}=${token}` }),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);
    const body: { ok: true; slug: string } = await res.json();
    expect(body.slug).toBe("my-new-post");
  });

  it("400s when the title is missing", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const token = await adminSession(env);
    const res = await blogPostsAdmin.request(
      "/",
      postJson({ body: "b" }, { Cookie: `${SESSION_COOKIE_NAME}=${token}` }),
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(400);
  });
});

describe("PUT /api/admin/blog-posts/:id", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await blogPostsAdmin.request(
      "/some-id",
      { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ title: "X" }) },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(401);
  });

  it("updates a post's fields and publish state", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const token = await adminSession(env);
    const createRes = await blogPostsAdmin.request(
      "/",
      postJson({ title: "Original", description: "d", body: "b", publish: false }, { Cookie: `${SESSION_COOKIE_NAME}=${token}` }),
      env,
      MOCK_CTX
    );
    const { id } = (await createRes.json()) as { id: string };

    const res = await blogPostsAdmin.request(
      `/${id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json", Cookie: `${SESSION_COOKIE_NAME}=${token}` },
        body: JSON.stringify({ title: "Updated", publish: true }),
      },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const publicRes = await blogPostsPublic.request(
      "/",
      {},
      env,
      MOCK_CTX
    );
    const publicBody: { posts: Array<{ title: string }> } = await publicRes.json();
    expect(publicBody.posts.map((p) => p.title)).toEqual(["Updated"]);
  });
});

describe("DELETE /api/admin/blog-posts/:id", () => {
  it("401s without a session", async () => {
    const { env } = makeMockEnv();
    const res = await blogPostsAdmin.request("/some-id", { method: "DELETE" }, env, MOCK_CTX);
    expect(res.status).toBe(401);
  });

  it("removes a post", async () => {
    const { env } = makeMockEnv({ ADMIN_EMAILS: "admin@example.com" });
    const token = await adminSession(env);
    const createRes = await blogPostsAdmin.request(
      "/",
      postJson({ title: "To Delete", body: "b", publish: true }, { Cookie: `${SESSION_COOKIE_NAME}=${token}` }),
      env,
      MOCK_CTX
    );
    const { id } = (await createRes.json()) as { id: string };

    const res = await blogPostsAdmin.request(
      `/${id}`,
      { method: "DELETE", headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      MOCK_CTX
    );
    expect(res.status).toBe(200);

    const getRes = await blogPostsAdmin.request(
      `/${id}`,
      { headers: { Cookie: `${SESSION_COOKIE_NAME}=${token}` } },
      env,
      MOCK_CTX
    );
    expect(getRes.status).toBe(404);
  });
});
