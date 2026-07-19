import type { DocField, SignerInput, StatusPayload } from "./types";

// Empty in dev (Vite proxies /api to the local worker); set to the deployed worker's absolute
// URL for production builds, since the frontend (Pages) and worker live on different domains.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

async function asJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error((body as { error?: string }).error ?? `Request failed (${res.status})`);
  }
  return res.json();
}

const REQUEST_TIMEOUT_MS = 30_000;

/** Every call needs `credentials: "include"` once session cookies exist — dev is same-origin via
 *  the Vite proxy, but production is cross-origin (Pages domain vs Workers domain). A timeout is
 *  applied so a stalled network request can't leave a caller's loading state stuck forever with
 *  no error ever surfacing — plain `fetch()` has no default timeout of its own. */
async function apiFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    return await fetch(`${API_BASE}${path}`, { ...init, credentials: "include", signal: controller.signal });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error("The request took too long — check your connection and try again.");
    }
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

export async function createDocument(
  pdf: File,
  preparerSigns: boolean,
  signers: SignerInput[],
  fields: DocField[],
  preparerEmail?: string
): Promise<{ docId: string; statusToken: string }> {
  const form = new FormData();
  form.set("pdf", pdf);
  form.set("meta", JSON.stringify({ preparerSigns, preparerEmail, signers, fields }));
  const res = await apiFetch("/api/documents", { method: "POST", body: form });
  return asJson(res);
}

export async function fetchStatus(token: string): Promise<StatusPayload> {
  const res = await apiFetch(`/api/status/${token}`);
  return asJson(res);
}

export interface SignPayload {
  onTurn: boolean;
  docId?: string;
  pdfBase64?: string;
  fields?: DocField[];
  status: StatusPayload;
}

export async function fetchSignView(token: string): Promise<SignPayload> {
  const res = await apiFetch(`/api/sign/${token}`);
  return asJson(res);
}

export async function submitSignature(
  token: string,
  values: Array<{ fieldId: string; value: string }>,
  consent: boolean
): Promise<{ ok: true; status: StatusPayload }> {
  const res = await apiFetch(`/api/sign/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values, consent }),
  });
  return asJson(res);
}

export async function submitFeedback(email: string, message: string): Promise<{ ok: true }> {
  const res = await apiFetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message }),
  });
  return asJson(res);
}

export async function requestMagicLink(email: string): Promise<{ ok: true }> {
  const res = await apiFetch("/api/auth/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return asJson(res);
}

export async function consumeMagicLinkToken(token: string): Promise<{ ok: true }> {
  const res = await apiFetch("/api/auth/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return asJson(res);
}

export async function logout(): Promise<{ ok: true }> {
  const res = await apiFetch("/api/auth/logout", { method: "POST" });
  return asJson(res);
}

export interface Account {
  id: string;
  email: string;
  isPaid: boolean;
}

export async function fetchMe(): Promise<{ account: Account | null }> {
  const res = await apiFetch("/api/auth/me");
  return asJson(res);
}

/** Returns the Stripe-hosted checkout URL to redirect the browser to. */
export async function startCheckout(): Promise<{ url: string }> {
  const res = await apiFetch("/api/billing/checkout", { method: "POST" });
  return asJson(res);
}

/** Returns the Stripe-hosted Customer Portal URL, where a paid account can cancel or manage
 *  their own subscription. */
export async function openBillingPortal(): Promise<{ url: string }> {
  const res = await apiFetch("/api/billing/portal", { method: "POST" });
  return asJson(res);
}

export interface DocumentSummary {
  docId: string;
  title: string;
  status: "pending" | "completed";
  createdAt: string;
  completedAt: string | null;
  statusToken: string;
  awaitingYou: boolean;
  signToken: string | null;
}

export async function fetchMyDocuments(): Promise<{ documents: DocumentSummary[] }> {
  const res = await apiFetch("/api/account/documents");
  return asJson(res);
}

export async function fetchTokenStatus(): Promise<{ hasToken: boolean }> {
  const res = await apiFetch("/api/account/token");
  return asJson(res);
}

/** Returns the raw token exactly once — the caller must show/copy it immediately, since it's
 *  never re-exposed after this. */
export async function regenerateApiToken(): Promise<{ token: string; connectorUrl: string }> {
  const res = await apiFetch("/api/account/token/regenerate", { method: "POST" });
  return asJson(res);
}

export interface TemplateSummary {
  id: string;
  name: string;
  signerCount: number;
  pageCount: number;
  createdAt: string;
}

export async function fetchTemplates(): Promise<{ templates: TemplateSummary[] }> {
  const res = await apiFetch("/api/account/templates");
  return asJson(res);
}

export async function fetchTemplate(
  id: string
): Promise<{ name: string; signerCount: number; fields: DocField[]; pdfBase64: string }> {
  const res = await apiFetch(`/api/account/templates/${id}`);
  return asJson(res);
}

export async function createTemplate(
  pdf: File,
  name: string,
  signerCount: number,
  fields: DocField[]
): Promise<{ templateId: string }> {
  const form = new FormData();
  form.set("pdf", pdf);
  form.set("meta", JSON.stringify({ name, signerCount, fields }));
  const res = await apiFetch("/api/account/templates", { method: "POST", body: form });
  return asJson(res);
}

export async function deleteTemplate(id: string): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/account/templates/${id}`, { method: "DELETE" });
  return asJson(res);
}
