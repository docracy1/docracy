import { generateOpaqueToken, hashOpaqueToken } from "@docracy/shared";
import type { Env } from "@docracy/shared";

export const CLOUD_PROVIDERS = ["dropbox", "onedrive", "box", "google"] as const;
export type CloudProvider = (typeof CLOUD_PROVIDERS)[number];

export interface CloudConnectionSummary {
  provider: CloudProvider;
  connectedEmail: string | null;
  createdAt: string;
}

interface ConnectionRow {
  id: string;
  account_id: string;
  provider: CloudProvider;
  access_token: string;
  refresh_token: string | null;
  expires_at: string | null;
  connected_email: string | null;
  box_folder_id: string | null;
  google_folder_id: string | null;
  created_at: string;
}

interface TokenResult {
  accessToken: string;
  refreshToken: string | null;
  expiresInSec: number | null;
}

const STATE_TTL_SECONDS = 10 * 60;

/** Cloud connections only ever belong to an Enterprise account — every caller has already gone
 *  through requirePaidAccount, so a missing D1 binding here means the deployment simply
 *  hasn't been configured yet, not a real runtime state to recover from. */
function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

function redirectUri(env: Env, provider: CloudProvider): string {
  return `${env.PUBLIC_WORKER_URL}/api/account/connectors/${provider}/callback`;
}

interface ProviderConfig {
  clientId(env: Env): string | undefined;
  clientSecret(env: Env): string | undefined;
  buildAuthorizeUrl(env: Env, state: string): string;
  exchangeCode(env: Env, code: string): Promise<TokenResult>;
  refresh(env: Env, refreshToken: string): Promise<TokenResult>;
  fetchConnectedEmail(env: Env, accessToken: string): Promise<string | null>;
  upload(env: Env, row: ConnectionRow, filename: string, bytes: Uint8Array): Promise<void>;
}

async function formTokenRequest(url: string, body: Record<string, string>): Promise<TokenResult> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(body).toString(),
  });
  if (!res.ok) throw new Error(`Token request to ${url} failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as { access_token: string; refresh_token?: string; expires_in?: number };
  return {
    accessToken: json.access_token,
    refreshToken: json.refresh_token ?? null,
    expiresInSec: json.expires_in ?? null,
  };
}

const DROPBOX: ProviderConfig = {
  clientId: (env) => env.DROPBOX_CLIENT_ID,
  clientSecret: (env) => env.DROPBOX_CLIENT_SECRET,
  buildAuthorizeUrl: (env, state) => {
    const params = new URLSearchParams({
      client_id: env.DROPBOX_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri(env, "dropbox"),
      token_access_type: "offline",
      state,
    });
    return `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
  },
  exchangeCode: (env, code) =>
    formTokenRequest("https://api.dropboxapi.com/oauth2/token", {
      code,
      grant_type: "authorization_code",
      client_id: env.DROPBOX_CLIENT_ID!,
      client_secret: env.DROPBOX_CLIENT_SECRET!,
      redirect_uri: redirectUri(env, "dropbox"),
    }),
  refresh: (env, refreshToken) =>
    formTokenRequest("https://api.dropboxapi.com/oauth2/token", {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.DROPBOX_CLIENT_ID!,
      client_secret: env.DROPBOX_CLIENT_SECRET!,
    }),
  fetchConnectedEmail: async (_env, accessToken) => {
    const res = await fetch("https://api.dropboxapi.com/2/users/get_current_account", {
      method: "POST",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email ?? null;
  },
  upload: async (_env, row, filename, bytes) => {
    const res = await fetch("https://content.dropboxapi.com/2/files/upload", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${row.access_token}`,
        "Content-Type": "application/octet-stream",
        "Dropbox-API-Arg": JSON.stringify({ path: `/${filename}`, mode: "add", autorename: true }),
      },
      body: bytes,
    });
    if (!res.ok) throw new Error(`Dropbox upload failed: ${res.status} ${await res.text()}`);
  },
};

const MS_SCOPE = "Files.ReadWrite.AppFolder offline_access User.Read";

/** Prod was configured with ONEDRIVE_* wrangler secrets; wrangler.toml uses MS_CLIENT_ID in [vars].
 *  When both ONEDRIVE_* are set, use them as a matched pair so client id and secret belong to the same app. */
function msCredentials(env: Env): { clientId?: string; clientSecret?: string } {
  if (env.ONEDRIVE_CLIENT_ID && env.ONEDRIVE_CLIENT_SECRET) {
    return { clientId: env.ONEDRIVE_CLIENT_ID, clientSecret: env.ONEDRIVE_CLIENT_SECRET };
  }
  return {
    clientId: env.MS_CLIENT_ID ?? env.ONEDRIVE_CLIENT_ID,
    clientSecret: env.MS_CLIENT_SECRET ?? env.ONEDRIVE_CLIENT_SECRET,
  };
}

const ONEDRIVE: ProviderConfig = {
  clientId: (env) => msCredentials(env).clientId,
  clientSecret: (env) => msCredentials(env).clientSecret,
  buildAuthorizeUrl: (env, state) => {
    const { clientId } = msCredentials(env);
    const params = new URLSearchParams({
      client_id: clientId!,
      response_type: "code",
      redirect_uri: redirectUri(env, "onedrive"),
      scope: MS_SCOPE,
      state,
    });
    return `https://login.microsoftonline.com/common/oauth2/v2.0/authorize?${params.toString()}`;
  },
  exchangeCode: (env, code) => {
    const { clientId, clientSecret } = msCredentials(env);
    return formTokenRequest("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      code,
      grant_type: "authorization_code",
      client_id: clientId!,
      client_secret: clientSecret!,
      redirect_uri: redirectUri(env, "onedrive"),
      scope: MS_SCOPE,
    });
  },
  refresh: (env, refreshToken) => {
    const { clientId, clientSecret } = msCredentials(env);
    return formTokenRequest("https://login.microsoftonline.com/common/oauth2/v2.0/token", {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: clientId!,
      client_secret: clientSecret!,
      scope: MS_SCOPE,
    });
  },
  fetchConnectedEmail: async (_env, accessToken) => {
    const res = await fetch("https://graph.microsoft.com/v1.0/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { mail?: string; userPrincipalName?: string };
    return json.mail ?? json.userPrincipalName ?? null;
  },
  upload: async (_env, row, filename, bytes) => {
    const res = await fetch(
      `https://graph.microsoft.com/v1.0/me/drive/special/approot:/${encodeURIComponent(filename)}:/content`,
      {
        method: "PUT",
        headers: { Authorization: `Bearer ${row.access_token}`, "Content-Type": "application/octet-stream" },
        body: bytes,
      }
    );
    if (!res.ok) throw new Error(`OneDrive upload failed: ${res.status} ${await res.text()}`);
  },
};

const BOX_FOLDER_NAME = "Docracy Signed Documents";

async function ensureBoxFolderId(env: Env, row: ConnectionRow): Promise<string> {
  if (row.box_folder_id) return row.box_folder_id;

  const create = await fetch("https://api.box.com/2.0/folders", {
    method: "POST",
    headers: { Authorization: `Bearer ${row.access_token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ name: BOX_FOLDER_NAME, parent: { id: "0" } }),
  });

  let folderId: string;
  if (create.status === 409) {
    const conflict = (await create.json()) as { context_info?: { conflicts?: Array<{ id: string }> } };
    const existing = conflict.context_info?.conflicts?.[0]?.id;
    if (!existing) throw new Error("Box folder conflict but no existing folder id returned");
    folderId = existing;
  } else if (create.ok) {
    const created = (await create.json()) as { id: string };
    folderId = created.id;
  } else {
    throw new Error(`Box folder creation failed: ${create.status} ${await create.text()}`);
  }

  const db = requireDb(env);
  await db.prepare(`UPDATE cloud_connections SET box_folder_id = ? WHERE id = ?`).bind(folderId, row.id).run();
  return folderId;
}

const BOX: ProviderConfig = {
  clientId: (env) => env.BOX_CLIENT_ID,
  clientSecret: (env) => env.BOX_CLIENT_SECRET,
  buildAuthorizeUrl: (env, state) => {
    const params = new URLSearchParams({
      client_id: env.BOX_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri(env, "box"),
      state,
    });
    return `https://account.box.com/api/oauth2/authorize?${params.toString()}`;
  },
  exchangeCode: (env, code) =>
    formTokenRequest("https://api.box.com/oauth2/token", {
      code,
      grant_type: "authorization_code",
      client_id: env.BOX_CLIENT_ID!,
      client_secret: env.BOX_CLIENT_SECRET!,
    }),
  refresh: (env, refreshToken) =>
    formTokenRequest("https://api.box.com/oauth2/token", {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.BOX_CLIENT_ID!,
      client_secret: env.BOX_CLIENT_SECRET!,
    }),
  fetchConnectedEmail: async (_env, accessToken) => {
    const res = await fetch("https://api.box.com/2.0/users/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { login?: string };
    return json.login ?? null;
  },
  upload: async (env, row, filename, bytes) => {
    const folderId = await ensureBoxFolderId(env, row);
    const form = new FormData();
    form.append("attributes", JSON.stringify({ name: filename, parent: { id: folderId } }));
    form.append("file", new Blob([bytes], { type: "application/pdf" }), filename);
    const res = await fetch("https://upload.box.com/api/2.0/files/content", {
      method: "POST",
      headers: { Authorization: `Bearer ${row.access_token}` },
      body: form,
    });
    if (!res.ok) throw new Error(`Box upload failed: ${res.status} ${await res.text()}`);
  },
};

const GOOGLE_FOLDER_NAME = "Docracy Signed Documents";
const GOOGLE_CONNECTOR_SCOPE =
  "https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/userinfo.email";

async function ensureGoogleFolderId(env: Env, row: ConnectionRow): Promise<string> {
  if (row.google_folder_id) return row.google_folder_id;

  const q = encodeURIComponent(
    `name='${GOOGLE_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`
  );
  const list = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name)&pageSize=1`,
    { headers: { Authorization: `Bearer ${row.access_token}` } }
  );
  if (!list.ok) throw new Error(`Google Drive folder lookup failed: ${list.status} ${await list.text()}`);
  const listed = (await list.json()) as { files?: Array<{ id: string }> };
  let folderId = listed.files?.[0]?.id;

  if (!folderId) {
    const create = await fetch("https://www.googleapis.com/drive/v3/files?fields=id", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${row.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: GOOGLE_FOLDER_NAME,
        mimeType: "application/vnd.google-apps.folder",
      }),
    });
    if (!create.ok) throw new Error(`Google Drive folder creation failed: ${create.status} ${await create.text()}`);
    const created = (await create.json()) as { id: string };
    folderId = created.id;
  }

  const db = requireDb(env);
  await db.prepare(`UPDATE cloud_connections SET google_folder_id = ? WHERE id = ?`).bind(folderId, row.id).run();
  return folderId;
}

const GOOGLE: ProviderConfig = {
  clientId: (env) => env.GOOGLE_INTEGRATIONS_CLIENT_ID,
  clientSecret: (env) => env.GOOGLE_INTEGRATIONS_CLIENT_SECRET,
  buildAuthorizeUrl: (env, state) => {
    const params = new URLSearchParams({
      client_id: env.GOOGLE_INTEGRATIONS_CLIENT_ID!,
      response_type: "code",
      redirect_uri: redirectUri(env, "google"),
      scope: GOOGLE_CONNECTOR_SCOPE,
      access_type: "offline",
      prompt: "consent",
      state,
    });
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  },
  exchangeCode: (env, code) =>
    formTokenRequest("https://oauth2.googleapis.com/token", {
      code,
      grant_type: "authorization_code",
      client_id: env.GOOGLE_INTEGRATIONS_CLIENT_ID!,
      client_secret: env.GOOGLE_INTEGRATIONS_CLIENT_SECRET!,
      redirect_uri: redirectUri(env, "google"),
    }),
  refresh: (env, refreshToken) =>
    formTokenRequest("https://oauth2.googleapis.com/token", {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: env.GOOGLE_INTEGRATIONS_CLIENT_ID!,
      client_secret: env.GOOGLE_INTEGRATIONS_CLIENT_SECRET!,
    }),
  fetchConnectedEmail: async (_env, accessToken) => {
    const res = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { email?: string };
    return json.email ?? null;
  },
  upload: async (env, row, filename, bytes) => {
    const folderId = await ensureGoogleFolderId(env, row);
    const metadata = JSON.stringify({ name: filename, parents: [folderId] });
    const boundary = "docracy_upload_boundary";
    const encoder = new TextEncoder();
    const metaPart = encoder.encode(
      `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`
    );
    const fileHeader = encoder.encode(
      `--${boundary}\r\nContent-Type: application/pdf\r\n\r\n`
    );
    const footer = encoder.encode(`\r\n--${boundary}--`);
    const body = new Uint8Array(metaPart.length + fileHeader.length + bytes.length + footer.length);
    body.set(metaPart, 0);
    body.set(fileHeader, metaPart.length);
    body.set(bytes, metaPart.length + fileHeader.length);
    body.set(footer, metaPart.length + fileHeader.length + bytes.length);

    const res = await fetch(
      "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${row.access_token}`,
          "Content-Type": `multipart/related; boundary=${boundary}`,
        },
        body,
      }
    );
    if (!res.ok) throw new Error(`Google Drive upload failed: ${res.status} ${await res.text()}`);
  },
};

const PROVIDERS: Record<CloudProvider, ProviderConfig> = {
  dropbox: DROPBOX,
  onedrive: ONEDRIVE,
  box: BOX,
  google: GOOGLE,
};

export function isProviderConfigured(env: Env, provider: CloudProvider): boolean {
  const config = PROVIDERS[provider];
  return !!config.clientId(env) && !!config.clientSecret(env);
}

export async function getAuthorizeUrl(env: Env, provider: CloudProvider, workspaceId: string): Promise<string> {
  const state = generateOpaqueToken();
  const hash = await hashOpaqueToken(state, env.TOKEN_SECRET);
  await env.DOCRACY_KV.put(
    `connectorstate:${hash}`,
    JSON.stringify({ workspaceId, provider }),
    { expirationTtl: STATE_TTL_SECONDS }
  );
  return PROVIDERS[provider].buildAuthorizeUrl(env, state);
}

export async function handleCallback(
  env: Env,
  provider: CloudProvider,
  code: string,
  state: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const hash = await hashOpaqueToken(state, env.TOKEN_SECRET);
  const stateKey = `connectorstate:${hash}`;
  const record = await env.DOCRACY_KV.get<{ workspaceId: string; provider: CloudProvider }>(stateKey, "json");
  if (!record || record.provider !== provider) return { ok: false, error: "Invalid or expired state" };
  await env.DOCRACY_KV.delete(stateKey);

  const config = PROVIDERS[provider];
  let tokens: TokenResult;
  try {
    tokens = await config.exchangeCode(env, code);
  } catch (err) {
    console.error(`Cloud connector (${provider}) token exchange failed:`, err);
    return { ok: false, error: "Token exchange failed" };
  }

  const connectedEmail = await config.fetchConnectedEmail(env, tokens.accessToken);
  const expiresAt = tokens.expiresInSec ? new Date(Date.now() + tokens.expiresInSec * 1000).toISOString() : null;

  const db = requireDb(env);
  await db
    .prepare(
      `INSERT INTO cloud_connections (id, account_id, provider, access_token, refresh_token, expires_at, connected_email, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(account_id, provider) DO UPDATE SET
         access_token = excluded.access_token,
         refresh_token = excluded.refresh_token,
         expires_at = excluded.expires_at,
         connected_email = excluded.connected_email`
    )
    .bind(
      crypto.randomUUID(),
      record.workspaceId,
      provider,
      tokens.accessToken,
      tokens.refreshToken,
      expiresAt,
      connectedEmail,
      new Date().toISOString()
    )
    .run();

  return { ok: true };
}

export async function listConnections(env: Env, workspaceId: string): Promise<CloudConnectionSummary[]> {
  const db = requireDb(env);
  const { results } = await db
    .prepare(`SELECT provider, connected_email, created_at FROM cloud_connections WHERE account_id = ?`)
    .bind(workspaceId)
    .all<{ provider: CloudProvider; connected_email: string | null; created_at: string }>();
  return results.map((r) => ({ provider: r.provider, connectedEmail: r.connected_email, createdAt: r.created_at }));
}

export async function deleteConnection(env: Env, workspaceId: string, provider: string): Promise<boolean> {
  if (!(CLOUD_PROVIDERS as readonly string[]).includes(provider)) return false;
  const db = requireDb(env);
  const row = await db
    .prepare(`SELECT id FROM cloud_connections WHERE account_id = ? AND provider = ?`)
    .bind(workspaceId, provider)
    .first();
  if (!row) return false;
  await db.prepare(`DELETE FROM cloud_connections WHERE account_id = ? AND provider = ?`).bind(workspaceId, provider).run();
  return true;
}

export async function deleteConnectionsForAccount(env: Env, accountId: string): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await env.DOCRACY_DB.prepare(`DELETE FROM cloud_connections WHERE account_id = ?`).bind(accountId).run();
}

/** Refreshes and persists a new access token if this connection's has expired, returning a
 *  guaranteed-valid access token either way. Providers with no `expires_at` (shouldn't happen in
 *  practice, since all three issue expiring tokens) are treated as always valid. */
async function ensureFreshToken(env: Env, row: ConnectionRow): Promise<string> {
  if (!row.expires_at || new Date(row.expires_at).getTime() > Date.now()) return row.access_token;
  if (!row.refresh_token) return row.access_token;

  const tokens = await PROVIDERS[row.provider].refresh(env, row.refresh_token);
  const expiresAt = tokens.expiresInSec ? new Date(Date.now() + tokens.expiresInSec * 1000).toISOString() : null;
  const db = requireDb(env);
  await db
    .prepare(`UPDATE cloud_connections SET access_token = ?, refresh_token = ?, expires_at = ? WHERE id = ?`)
    .bind(tokens.accessToken, tokens.refreshToken ?? row.refresh_token, expiresAt, row.id)
    .run();
  return tokens.accessToken;
}

/**
 * Best-effort delivery of a completed document to every cloud provider connected for `workspaceId`
 * — mirrors deliverWebhookEvent's contract exactly: never throws, one failing connection never
 * blocks another, no retry queue in v1.
 */
export async function uploadCompletedDocument(
  env: Env,
  workspaceId: string,
  docId: string,
  filename: string,
  bytes: Uint8Array
): Promise<void> {
  if (!env.DOCRACY_DB) return;
  const db = env.DOCRACY_DB;
  const { results } = await db
    .prepare(`SELECT * FROM cloud_connections WHERE account_id = ?`)
    .bind(workspaceId)
    .all<ConnectionRow>();

  await Promise.all(
    results.map(async (row) => {
      try {
        const freshRow = { ...row, access_token: await ensureFreshToken(env, row) };
        await PROVIDERS[row.provider].upload(env, freshRow, filename, bytes);
      } catch (err) {
        console.error(`Cloud connector upload (${row.provider}) failed for doc ${docId} (non-fatal):`, err);
      }
    })
  );
}
