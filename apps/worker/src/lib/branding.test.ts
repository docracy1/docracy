import { describe, it, expect } from "vitest";
import {
  clearWorkspaceSlug,
  deleteLogo,
  getLogoObject,
  getWorkspaceSlug,
  hasCustomLogo,
  isValidWorkspaceSlug,
  logoPath,
  resolveEmailLogoUrl,
  setWorkspaceSlug,
  uploadLogo,
} from "./branding";
import { makeMockEnv } from "../test/mockEnv";

const TINY_PNG_BYTES = Uint8Array.from(
  atob("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII="),
  (c) => c.charCodeAt(0)
);

async function seedAccount(env: Awaited<ReturnType<typeof makeMockEnv>>["env"], id: string) {
  await env.DOCRACY_DB!.prepare(`INSERT INTO accounts (id, email, created_at, is_paid) VALUES (?, ?, ?, 1)`)
    .bind(id, `${id}@example.com`, new Date().toISOString())
    .run();
}

describe("logoPath", () => {
  it("builds a stable, workspace-keyed path", () => {
    expect(logoPath("acct-1")).toBe("/api/branding/acct-1/logo");
  });
});

describe("uploadLogo / getLogoObject / hasCustomLogo / deleteLogo", () => {
  it("uploads a logo, reports it as present, and serves it back with its content type", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(env, "acct-1");

    expect(await hasCustomLogo(env, "acct-1")).toBe(false);
    expect(await getLogoObject(env, "acct-1")).toBeNull();

    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");

    expect(await hasCustomLogo(env, "acct-1")).toBe(true);
    const logo = await getLogoObject(env, "acct-1");
    expect(logo).not.toBeNull();
    expect(logo!.contentType).toBe("image/png");
    expect(logo!.bytes).toEqual(TINY_PNG_BYTES);

    const row = (await d1.prepare(`SELECT logo_r2_key FROM accounts WHERE id = ?`).bind("acct-1").first()) as {
      logo_r2_key: string | null;
    } | null;
    expect(row?.logo_r2_key).toBe("branding/acct-1/logo");
  });

  it("replaces an existing logo on re-upload", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");
    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");
    const jpegBytes = new Uint8Array([1, 2, 3]);
    await uploadLogo(env, "acct-1", jpegBytes, "image/jpeg");

    const logo = await getLogoObject(env, "acct-1");
    expect(logo!.contentType).toBe("image/jpeg");
    expect(logo!.bytes).toEqual(jpegBytes);
  });

  it("removes a logo, clearing both R2 and the D1 column", async () => {
    const { env, d1 } = makeMockEnv();
    await seedAccount(env, "acct-1");
    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");

    await deleteLogo(env, "acct-1");

    expect(await hasCustomLogo(env, "acct-1")).toBe(false);
    expect(await getLogoObject(env, "acct-1")).toBeNull();
    const row = (await d1.prepare(`SELECT logo_r2_key FROM accounts WHERE id = ?`).bind("acct-1").first()) as {
      logo_r2_key: string | null;
    } | null;
    expect(row?.logo_r2_key).toBeNull();
  });

  it("keeps one workspace's logo isolated from another's", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");
    await seedAccount(env, "acct-2");
    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");

    expect(await hasCustomLogo(env, "acct-2")).toBe(false);
    expect(await getLogoObject(env, "acct-2")).toBeNull();
  });
});

describe("resolveEmailLogoUrl", () => {
  it("returns null for an anonymous document (accountId null)", async () => {
    const { env } = makeMockEnv();
    expect(await resolveEmailLogoUrl(env, null)).toBeNull();
  });

  it("returns null when the workspace has no custom logo", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");
    expect(await resolveEmailLogoUrl(env, "acct-1")).toBeNull();
  });

  it("returns an absolute URL against PUBLIC_WORKER_URL when a logo is set", async () => {
    const { env } = makeMockEnv({ PUBLIC_WORKER_URL: "https://worker.example.com" });
    await seedAccount(env, "acct-1");
    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");

    expect(await resolveEmailLogoUrl(env, "acct-1")).toBe("https://worker.example.com/api/branding/acct-1/logo");
  });

  it("returns null when PUBLIC_WORKER_URL isn't configured, even with a logo set", async () => {
    const { env } = makeMockEnv({ PUBLIC_WORKER_URL: undefined });
    await seedAccount(env, "acct-1");
    await uploadLogo(env, "acct-1", TINY_PNG_BYTES, "image/png");

    expect(await resolveEmailLogoUrl(env, "acct-1")).toBeNull();
  });
});

describe("isValidWorkspaceSlug", () => {
  it("accepts letters and numbers, 3-30 characters", () => {
    expect(isValidWorkspaceSlug("AcmeInc")).toBe(true);
    expect(isValidWorkspaceSlug("abc")).toBe(true);
    expect(isValidWorkspaceSlug("a".repeat(30))).toBe(true);
  });

  it("rejects anything with spaces, symbols, or out-of-range length", () => {
    expect(isValidWorkspaceSlug("ab")).toBe(false);
    expect(isValidWorkspaceSlug("a".repeat(31))).toBe(false);
    expect(isValidWorkspaceSlug("Acme Inc")).toBe(false);
    expect(isValidWorkspaceSlug("acme-inc")).toBe(false);
    expect(isValidWorkspaceSlug("acme_inc")).toBe(false);
    expect(isValidWorkspaceSlug("")).toBe(false);
  });
});

describe("setWorkspaceSlug / getWorkspaceSlug / clearWorkspaceSlug", () => {
  it("sets and reads back a slug", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");

    const result = await setWorkspaceSlug(env, "acct-1", "AcmeInc");
    expect(result.ok).toBe(true);
    expect(await getWorkspaceSlug(env, "acct-1")).toBe("AcmeInc");
  });

  it("rejects an invalid slug without touching D1", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");

    const result = await setWorkspaceSlug(env, "acct-1", "a b");
    expect(result.ok).toBe(false);
    expect(await getWorkspaceSlug(env, "acct-1")).toBeNull();
  });

  it("rejects a slug already taken by another workspace, case-insensitively", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");
    await seedAccount(env, "acct-2");
    await setWorkspaceSlug(env, "acct-1", "AcmeInc");

    const result = await setWorkspaceSlug(env, "acct-2", "acmeinc");
    expect(result.ok).toBe(false);
  });

  it("allows a workspace to re-save its own already-set slug", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");
    await setWorkspaceSlug(env, "acct-1", "AcmeInc");

    const result = await setWorkspaceSlug(env, "acct-1", "AcmeInc");
    expect(result.ok).toBe(true);
  });

  it("clears a slug", async () => {
    const { env } = makeMockEnv();
    await seedAccount(env, "acct-1");
    await setWorkspaceSlug(env, "acct-1", "AcmeInc");

    await clearWorkspaceSlug(env, "acct-1");

    expect(await getWorkspaceSlug(env, "acct-1")).toBeNull();
  });

  it("returns null when DOCRACY_DB isn't bound", async () => {
    const { env } = makeMockEnv({ DOCRACY_DB: undefined });
    expect(await getWorkspaceSlug(env, "acct-1")).toBeNull();
  });
});
