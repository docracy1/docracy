import { describe, it, expect, vi, afterEach } from "vitest";
import {
  isProviderConfigured,
  getAuthorizeUrl,
  handleCallback,
  listConnections,
  deleteConnection,
  deleteConnectionsForAccount,
  uploadCompletedDocument,
} from "./cloudConnectors";
import { makeMockEnv } from "../test/mockEnv";

const DROPBOX_ENV = { DROPBOX_CLIENT_ID: "dbx-id", DROPBOX_CLIENT_SECRET: "dbx-secret" };

function mockDropboxSuccess() {
  return vi.spyOn(global, "fetch").mockImplementation(async (input) => {
    const url = String(input);
    if (url.includes("oauth2/token")) {
      return new Response(JSON.stringify({ access_token: "at-1", refresh_token: "rt-1", expires_in: 3600 }), {
        status: 200,
      });
    }
    if (url.includes("get_current_account")) {
      return new Response(JSON.stringify({ email: "user@example.com" }), { status: 200 });
    }
    if (url.includes("content.dropboxapi.com/2/files/upload")) {
      return new Response("{}", { status: 200 });
    }
    throw new Error(`Unexpected fetch to ${url}`);
  });
}

describe("isProviderConfigured", () => {
  it("is false until both client id and secret env vars are set", async () => {
    const { env } = makeMockEnv();
    expect(isProviderConfigured(env, "dropbox")).toBe(false);

    const { env: configured } = makeMockEnv(DROPBOX_ENV);
    expect(isProviderConfigured(configured, "dropbox")).toBe(true);
  });

  it("accepts ONEDRIVE_* secrets as a matched OneDrive pair", () => {
    const { env } = makeMockEnv({
      ONEDRIVE_CLIENT_ID: "ms-id",
      ONEDRIVE_CLIENT_SECRET: "ms-secret",
    });
    expect(isProviderConfigured(env, "onedrive")).toBe(true);
  });
});

describe("getAuthorizeUrl", () => {
  it("builds a provider authorize URL carrying a fresh state token", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    const url = await getAuthorizeUrl(env, "dropbox", "workspace-1");
    const parsed = new URL(url);
    expect(parsed.hostname).toBe("www.dropbox.com");
    expect(parsed.searchParams.get("client_id")).toBe("dbx-id");
    expect(parsed.searchParams.get("state")).toBeTruthy();
  });
});

describe("handleCallback", () => {
  afterEach(() => vi.restoreAllMocks());

  it("rejects a callback with an unknown or missing state token", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    const result = await handleCallback(env, "dropbox", "some-code", "bogus-state");
    expect(result).toEqual({ ok: false, error: "Invalid or expired state" });
  });

  it("exchanges a valid code+state for tokens and stores the connection", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    const url = await getAuthorizeUrl(env, "dropbox", "workspace-1");
    const state = new URL(url).searchParams.get("state")!;
    mockDropboxSuccess();

    const result = await handleCallback(env, "dropbox", "auth-code", state);
    expect(result).toEqual({ ok: true });

    const list = await listConnections(env, "workspace-1");
    expect(list).toEqual([{ provider: "dropbox", connectedEmail: "user@example.com", createdAt: expect.any(String) }]);
  });

  it("consumes the state token — a replayed callback fails the second time", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    const url = await getAuthorizeUrl(env, "dropbox", "workspace-1");
    const state = new URL(url).searchParams.get("state")!;
    mockDropboxSuccess();

    await handleCallback(env, "dropbox", "auth-code", state);
    const second = await handleCallback(env, "dropbox", "auth-code", state);
    expect(second).toEqual({ ok: false, error: "Invalid or expired state" });
  });

  it("reconnecting the same provider updates the existing row instead of duplicating it", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    mockDropboxSuccess();

    const firstUrl = await getAuthorizeUrl(env, "dropbox", "workspace-1");
    await handleCallback(env, "dropbox", "auth-code-1", new URL(firstUrl).searchParams.get("state")!);

    const secondUrl = await getAuthorizeUrl(env, "dropbox", "workspace-1");
    await handleCallback(env, "dropbox", "auth-code-2", new URL(secondUrl).searchParams.get("state")!);

    const list = await listConnections(env, "workspace-1");
    expect(list).toHaveLength(1);
  });
});

describe("listConnections / deleteConnection", () => {
  afterEach(() => vi.restoreAllMocks());

  it("does not let one workspace see or delete another workspace's connection", async () => {
    const { env } = makeMockEnv(DROPBOX_ENV);
    mockDropboxSuccess();
    const url = await getAuthorizeUrl(env, "dropbox", "workspace-1");
    await handleCallback(env, "dropbox", "auth-code", new URL(url).searchParams.get("state")!);

    expect(await listConnections(env, "workspace-2")).toEqual([]);
    expect(await deleteConnection(env, "workspace-2", "dropbox")).toBe(false);

    expect(await deleteConnection(env, "workspace-1", "dropbox")).toBe(true);
    expect(await listConnections(env, "workspace-1")).toEqual([]);
  });

  it("rejects an unknown provider name", async () => {
    const { env } = makeMockEnv();
    expect(await deleteConnection(env, "workspace-1", "not-a-provider")).toBe(false);
  });
});

describe("uploadCompletedDocument", () => {
  afterEach(() => vi.restoreAllMocks());

  it("uploads to every connected provider for the workspace", async () => {
    const { env, d1 } = makeMockEnv(DROPBOX_ENV);
    await d1
      .prepare(
        `INSERT INTO cloud_connections (id, account_id, provider, access_token, refresh_token, expires_at, connected_email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind("conn-1", "workspace-1", "dropbox", "at-valid", null, null, "user@example.com", new Date().toISOString())
      .run();

    const fetchMock = vi.spyOn(global, "fetch").mockResolvedValue(new Response("{}", { status: 200 }));

    await uploadCompletedDocument(env, "workspace-1", "doc-1", "doc-1.pdf", new Uint8Array([1, 2, 3]));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://content.dropboxapi.com/2/files/upload");
    expect((init!.headers as Record<string, string>).Authorization).toBe("Bearer at-valid");
  });

  it("refreshes an expired access token before uploading, and persists the refreshed token", async () => {
    const { env, d1 } = makeMockEnv(DROPBOX_ENV);
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    await d1
      .prepare(
        `INSERT INTO cloud_connections (id, account_id, provider, access_token, refresh_token, expires_at, connected_email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind("conn-1", "workspace-1", "dropbox", "at-stale", "rt-1", yesterday, "user@example.com", new Date().toISOString())
      .run();

    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      if (url.includes("oauth2/token")) {
        return new Response(JSON.stringify({ access_token: "at-fresh", refresh_token: "rt-2", expires_in: 3600 }), {
          status: 200,
        });
      }
      return new Response("{}", { status: 200 });
    });

    await uploadCompletedDocument(env, "workspace-1", "doc-1", "doc-1.pdf", new Uint8Array([1, 2, 3]));

    const row = (await d1
      .prepare("SELECT access_token, refresh_token FROM cloud_connections WHERE id = ?")
      .bind("conn-1")
      .first()) as { access_token: string; refresh_token: string } | null;
    expect(row?.access_token).toBe("at-fresh");
    expect(row?.refresh_token).toBe("rt-2");
  });

  it("one failing connection does not block another connection's upload", async () => {
    const { env, d1 } = makeMockEnv(DROPBOX_ENV);
    await d1
      .prepare(
        `INSERT INTO cloud_connections (id, account_id, provider, access_token, refresh_token, expires_at, connected_email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind("conn-1", "workspace-1", "dropbox", "at-valid", null, null, "user@example.com", new Date().toISOString())
      .run();
    await d1
      .prepare(
        `INSERT INTO cloud_connections (id, account_id, provider, access_token, refresh_token, expires_at, connected_email, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .bind("conn-2", "workspace-1", "onedrive", "at-valid", null, null, "user@example.com", new Date().toISOString())
      .run();

    const calledUrls: string[] = [];
    vi.spyOn(global, "fetch").mockImplementation(async (input) => {
      const url = String(input);
      calledUrls.push(url);
      if (url.includes("dropboxapi")) throw new Error("connection refused");
      return new Response("{}", { status: 200 });
    });

    await expect(
      uploadCompletedDocument(env, "workspace-1", "doc-1", "doc-1.pdf", new Uint8Array([1, 2, 3]))
    ).resolves.toBeUndefined();

    expect(calledUrls.some((u) => u.includes("graph.microsoft.com"))).toBe(true);
  });

  it("does nothing when the workspace has no connections", async () => {
    const { env } = makeMockEnv();
    const fetchMock = vi.spyOn(global, "fetch");
    await uploadCompletedDocument(env, "workspace-1", "doc-1", "doc-1.pdf", new Uint8Array([1, 2, 3]));
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("deleteConnectionsForAccount", () => {
  afterEach(() => vi.restoreAllMocks());

  it("removes every connection for the account", async () => {
    const { env, d1 } = makeMockEnv(DROPBOX_ENV);
    mockDropboxSuccess();
    const url = await getAuthorizeUrl(env, "dropbox", "workspace-1");
    await handleCallback(env, "dropbox", "auth-code", new URL(url).searchParams.get("state")!);
    expect(await listConnections(env, "workspace-1")).toHaveLength(1);

    await deleteConnectionsForAccount(env, "workspace-1");

    expect(await listConnections(env, "workspace-1")).toEqual([]);
    const row = await d1.prepare("SELECT COUNT(*) as n FROM cloud_connections WHERE account_id = ?").bind("workspace-1").first();
    expect((row as { n: number }).n).toBe(0);
  });
});
