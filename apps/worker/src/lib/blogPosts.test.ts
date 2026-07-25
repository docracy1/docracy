import { describe, it, expect } from "vitest";
import {
  createBlogPost,
  deleteBlogPost,
  getBlogPostById,
  getPublishedBlogPost,
  isValidBlogSlug,
  listAllBlogPosts,
  listPublishedBlogPosts,
  slugify,
  updateBlogPost,
} from "./blogPosts";
import { makeMockEnv } from "../test/mockEnv";

describe("slugify", () => {
  it("lowercases, hyphenates, and strips punctuation", () => {
    expect(slugify("Docracy vs Foo: Which Is Better?")).toBe("docracy-vs-foo-which-is-better");
  });

  it("collapses repeated separators and trims leading/trailing hyphens", () => {
    expect(slugify("  Hello,   World!!  ")).toBe("hello-world");
  });
});

describe("isValidBlogSlug", () => {
  it("accepts lowercase letters, numbers, and single hyphens", () => {
    expect(isValidBlogSlug("my-first-post")).toBe(true);
    expect(isValidBlogSlug("post123")).toBe(true);
  });

  it("rejects uppercase, spaces, double hyphens, or out-of-range length", () => {
    expect(isValidBlogSlug("My-Post")).toBe(false);
    expect(isValidBlogSlug("my post")).toBe(false);
    expect(isValidBlogSlug("my--post")).toBe(false);
    expect(isValidBlogSlug("ab")).toBe(false);
    expect(isValidBlogSlug("a".repeat(81))).toBe(false);
  });
});

describe("createBlogPost", () => {
  it("creates a draft (publish: false) with no published_at", async () => {
    const { env } = makeMockEnv();
    const result = await createBlogPost(env, {
      slug: "my-first-post",
      title: "My First Post",
      description: "A test post",
      body: "Hello world",
      publish: false,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    const post = await getBlogPostById(env, result.id);
    expect(post?.publishedAt).toBeNull();
    expect(post?.slug).toBe("my-first-post");
  });

  it("creates a published post with a stamped published_at", async () => {
    const { env } = makeMockEnv();
    const result = await createBlogPost(env, {
      slug: "my-published-post",
      title: "My Published Post",
      description: "",
      body: "Hello world",
      publish: true,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    const post = await getBlogPostById(env, result.id);
    expect(post?.publishedAt).toBeTruthy();
  });

  it("rejects an invalid slug", async () => {
    const { env } = makeMockEnv();
    const result = await createBlogPost(env, { slug: "Not Valid", title: "X", description: "", body: "Y", publish: false });
    expect(result.ok).toBe(false);
  });

  it("rejects a slug already taken, case-insensitively", async () => {
    const { env } = makeMockEnv();
    await createBlogPost(env, { slug: "taken-slug", title: "First", description: "", body: "Y", publish: false });
    const result = await createBlogPost(env, { slug: "taken-slug", title: "Second", description: "", body: "Z", publish: false });
    expect(result.ok).toBe(false);
  });

  it("rejects an empty title or body", async () => {
    const { env } = makeMockEnv();
    expect((await createBlogPost(env, { slug: "a-slug", title: "", description: "", body: "x", publish: false })).ok).toBe(false);
    expect((await createBlogPost(env, { slug: "b-slug", title: "Title", description: "", body: "", publish: false })).ok).toBe(false);
  });
});

describe("listAllBlogPosts / listPublishedBlogPosts", () => {
  it("listAllBlogPosts includes drafts; listPublishedBlogPosts excludes them", async () => {
    const { env } = makeMockEnv();
    await createBlogPost(env, { slug: "draft-post", title: "Draft", description: "", body: "x", publish: false });
    await createBlogPost(env, { slug: "live-post", title: "Live", description: "", body: "y", publish: true });

    const all = await listAllBlogPosts(env);
    expect(all.map((p) => p.slug).sort()).toEqual(["draft-post", "live-post"]);

    const published = await listPublishedBlogPosts(env);
    expect(published.map((p) => p.slug)).toEqual(["live-post"]);
  });

  it("returns an empty array when DOCRACY_DB isn't bound (listPublishedBlogPosts only)", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    expect(await listPublishedBlogPosts(env)).toEqual([]);
  });
});

describe("getPublishedBlogPost", () => {
  it("returns a published post by slug, case-insensitively", async () => {
    const { env } = makeMockEnv();
    await createBlogPost(env, { slug: "hello-world", title: "Hello World", description: "d", body: "b", publish: true });
    const post = await getPublishedBlogPost(env, "Hello-World");
    expect(post?.title).toBe("Hello World");
  });

  it("returns null for a draft (not yet published)", async () => {
    const { env } = makeMockEnv();
    await createBlogPost(env, { slug: "still-a-draft", title: "Draft", description: "", body: "b", publish: false });
    expect(await getPublishedBlogPost(env, "still-a-draft")).toBeNull();
  });

  it("returns null for an unknown slug", async () => {
    const { env } = makeMockEnv();
    expect(await getPublishedBlogPost(env, "nope")).toBeNull();
  });
});

describe("updateBlogPost", () => {
  it("updates only the fields provided", async () => {
    const { env } = makeMockEnv();
    const { id } = (await createBlogPost(env, {
      slug: "editable-post",
      title: "Original Title",
      description: "Original description",
      body: "Original body",
      publish: false,
    })) as { ok: true; id: string };

    const result = await updateBlogPost(env, id, { title: "New Title" });
    expect(result.ok).toBe(true);

    const post = await getBlogPostById(env, id);
    expect(post?.title).toBe("New Title");
    expect(post?.description).toBe("Original description");
    expect(post?.body).toBe("Original body");
  });

  it("publishing stamps published_at; unpublishing clears it", async () => {
    const { env } = makeMockEnv();
    const { id } = (await createBlogPost(env, {
      slug: "publish-toggle",
      title: "T",
      description: "",
      body: "b",
      publish: false,
    })) as { ok: true; id: string };

    await updateBlogPost(env, id, { publish: true });
    const published = await getBlogPostById(env, id);
    expect(published?.publishedAt).toBeTruthy();

    await updateBlogPost(env, id, { publish: false });
    const unpublished = await getBlogPostById(env, id);
    expect(unpublished?.publishedAt).toBeNull();
  });

  it("does not stamp a fresh published_at on an already-published post", async () => {
    const { env } = makeMockEnv();
    const { id } = (await createBlogPost(env, {
      slug: "already-live",
      title: "T",
      description: "",
      body: "b",
      publish: true,
    })) as { ok: true; id: string };
    const original = await getBlogPostById(env, id);

    await updateBlogPost(env, id, { title: "Updated Title", publish: true });
    const after = await getBlogPostById(env, id);
    expect(after?.publishedAt).toBe(original?.publishedAt);
  });

  it("returns an error for an unknown id", async () => {
    const { env } = makeMockEnv();
    const result = await updateBlogPost(env, "nope", { title: "X" });
    expect(result.ok).toBe(false);
  });
});

describe("deleteBlogPost", () => {
  it("removes a post", async () => {
    const { env } = makeMockEnv();
    const { id } = (await createBlogPost(env, { slug: "to-delete", title: "T", description: "", body: "b", publish: false })) as {
      ok: true;
      id: string;
    };

    await deleteBlogPost(env, id);

    expect(await getBlogPostById(env, id)).toBeNull();
  });
});
