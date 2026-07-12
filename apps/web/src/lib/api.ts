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
  const res = await fetch(`${API_BASE}/api/documents`, { method: "POST", body: form });
  return asJson(res);
}

export async function fetchStatus(token: string): Promise<StatusPayload> {
  const res = await fetch(`${API_BASE}/api/status/${token}`);
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
  const res = await fetch(`${API_BASE}/api/sign/${token}`);
  return asJson(res);
}

export async function submitSignature(
  token: string,
  values: Array<{ fieldId: string; value: string }>,
  consent: boolean
): Promise<{ ok: true; status: StatusPayload }> {
  const res = await fetch(`${API_BASE}/api/sign/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ values, consent }),
  });
  return asJson(res);
}

export async function submitFeedback(email: string, message: string): Promise<{ ok: true }> {
  const res = await fetch(`${API_BASE}/api/feedback`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message }),
  });
  return asJson(res);
}
