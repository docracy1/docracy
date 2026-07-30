import { attributionLabel } from "./attribution";
import type { CcRecipientInput, DocField, SignerInput, StatusPayload } from "./types";

// Empty in dev (Vite proxies /api to the local worker); set to the deployed worker's absolute
// URL for production builds, since the frontend (Pages) and worker live on different domains.
const API_BASE = import.meta.env.VITE_API_URL ?? "";

/** Makes a worker-relative path (e.g. a `brandLogoPath` from a sign/status payload) absolute,
 *  the same way every other API call already resolves against this environment's worker. */
export function apiUrl(path: string): string {
  return `${API_BASE}${path}`;
}

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

export interface CreateDocumentOptions {
  preparerEmail?: string;
  /** Explicit opt-in for the preparer tips drip — must be paired with preparerEmail. */
  preparerMarketingOptIn?: boolean;
  customSubject?: string;
  customMessage?: string;
  signingMode?: "sequential" | "parallel";
  ccRecipients?: CcRecipientInput[];
  /** Paid only — retention days (1–90). Omitted / free always uses the default (9). */
  ttlDays?: number;
  smsInvites?: boolean;
  signerAttachments?: { enabled: boolean; maxFiles?: number; maxBytesPerFile?: number };
  /** Set when these fields came from a saved (paid-tier) template id or a free-template slug —
   *  always fires the template_completed funnel event; the persistent "Recurring Templates" usage
   *  counter additionally requires a logged-in paid account (no workspace to key a free-tier
   *  anonymous send's usage against otherwise). */
  templateId?: string;
}

export async function createDocument(
  pdf: File,
  preparerSigns: boolean,
  signers: SignerInput[],
  fields: DocField[],
  options: CreateDocumentOptions = {}
): Promise<{ docId: string; statusToken: string; claimToken?: string }> {
  const form = new FormData();
  form.set("pdf", pdf);
  form.set("meta", JSON.stringify({ preparerSigns, signers, fields, ...options }));
  const res = await apiFetch("/api/documents", { method: "POST", body: form });
  return asJson(res);
}

export async function fetchStatus(token: string): Promise<StatusPayload> {
  const res = await apiFetch(`/api/status/${token}`);
  return asJson(res);
}

export interface SignPayload {
  onTurn: boolean;
  needsPin?: boolean;
  docId?: string;
  pdfBase64?: string;
  fields?: DocField[];
  signerAttachments?: {
    maxFiles: number;
    maxBytesPerFile: number;
    uploaded: Array<{ id: string; name: string; sizeBytes: number }>;
  };
  status: StatusPayload;
  brandLogoPath?: string | null;
  brandWorkspaceSlug?: string | null;
}

export async function fetchSignView(token: string, unlockToken?: string): Promise<SignPayload> {
  const res = await apiFetch(`/api/sign/${token}`, {
    headers: unlockToken ? { "X-Sign-Unlock": unlockToken } : undefined,
  });
  return asJson(res);
}

export async function unlockSign(token: string, pin: string): Promise<{ unlockToken: string }> {
  const res = await apiFetch(`/api/sign/${token}/unlock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pin }),
  });
  return asJson(res);
}

export async function submitSignature(
  token: string,
  values: Array<{ fieldId: string; value: string }>,
  consent: boolean,
  unlockToken?: string
): Promise<{ ok: true; status: StatusPayload }> {
  const res = await apiFetch(`/api/sign/${token}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(unlockToken ? { "X-Sign-Unlock": unlockToken } : {}) },
    body: JSON.stringify({ values, consent }),
  });
  return asJson(res);
}

export async function uploadSignAttachment(
  token: string,
  file: File,
  unlockToken?: string
): Promise<{ uploadedCount: number; attachment: { id: string; name: string; sizeBytes: number } }> {
  const form = new FormData();
  form.set("file", file);
  const res = await apiFetch(`/api/sign/${token}/attachments`, {
    method: "POST",
    body: form,
    headers: unlockToken ? { "X-Sign-Unlock": unlockToken } : undefined,
  });
  return asJson(res);
}

export async function declineSign(
  token: string,
  reason?: string,
  unlockToken?: string
): Promise<{ ok: true; status: StatusPayload }> {
  const res = await apiFetch(`/api/sign/${token}/decline`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(unlockToken ? { "X-Sign-Unlock": unlockToken } : {}) },
    body: JSON.stringify({ reason: reason || undefined }),
  });
  return asJson(res);
}

export async function voidDocument(token: string, reason?: string): Promise<{ ok: true; status: StatusPayload }> {
  const res = await apiFetch(`/api/status/${token}/void`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || undefined }),
  });
  return asJson(res);
}

export async function voidAccountDocument(docId: string, reason?: string): Promise<{ ok: true; status: string }> {
  const res = await apiFetch(`/api/account/documents/${docId}/void`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason: reason || undefined }),
  });
  return asJson(res);
}

export function statusAttachmentDownloadUrl(token: string, signerOrder: number, attachmentId: string): string {
  return apiUrl(`/api/status/${token}/attachments/${signerOrder}/${attachmentId}`);
}

export function accountAttachmentDownloadUrl(docId: string, signerOrder: number, attachmentId: string): string {
  return apiUrl(`/api/account/documents/${docId}/attachments/${signerOrder}/${attachmentId}`);
}

export async function fetchDocumentAttachments(
  docId: string
): Promise<{ signers: Array<{ order: number; name: string; attachments: Array<{ id: string; name: string; sizeBytes: number; uploadedAt: string }> }> }> {
  const res = await apiFetch(`/api/account/documents/${docId}/attachments`);
  return asJson(res);
}

export async function reassignSigner(
  docId: string,
  order: number,
  input: { name: string; email: string; pin?: string; saveContact?: boolean; company?: string }
): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/account/documents/${docId}/signers/${order}/reassign`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export interface ContactSummary {
  id: string;
  name: string;
  email: string;
  company: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function fetchContacts(): Promise<{ contacts: ContactSummary[] }> {
  const res = await apiFetch("/api/account/contacts");
  return asJson(res);
}

export async function createContact(input: {
  name: string;
  email: string;
  company?: string;
}): Promise<{ contact: ContactSummary }> {
  const res = await apiFetch("/api/account/contacts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function updateContact(
  id: string,
  input: { name?: string; email?: string; company?: string | null }
): Promise<{ contact: ContactSummary }> {
  const res = await apiFetch(`/api/account/contacts/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function deleteContact(id: string): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/account/contacts/${id}`, { method: "DELETE" });
  return asJson(res);
}

export async function submitFeedback(email: string, message: string): Promise<{ ok: true; aiAnswer?: string }> {
  const res = await apiFetch("/api/feedback", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, message }),
  });
  return asJson(res);
}

export async function requestMagicLink(
  email: string,
  turnstileToken?: string,
  next?: string
): Promise<{ ok: true }> {
  const res = await apiFetch("/api/auth/request-link", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, turnstileToken, attribution: attributionLabel(), next }),
  });
  return asJson(res);
}

export async function consumeMagicLinkToken(token: string): Promise<{ ok: true; next?: string }> {
  const res = await apiFetch("/api/auth/consume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token, attribution: attributionLabel() }),
  });
  return asJson(res);
}

export async function adminLogin(email: string, password: string): Promise<{ ok: true }> {
  const res = await apiFetch("/api/auth/admin-login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
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
  isEnterprise: boolean;
  /** ISO timestamp of the workspace's first unresolved Stripe payment failure, or null — drives
   *  the Dashboard's "please settle your unpaid invoice" banner. */
  paymentFailedAt: string | null;
}

export async function fetchMe(): Promise<{ account: Account | null; isAdmin: boolean }> {
  const res = await apiFetch("/api/auth/me");
  return asJson(res);
}

/** Returns the Stripe-hosted checkout URL to redirect the browser to. Omit `plan` (or pass
 *  "paid") for the standard $10/month subscription; pass "enterprise" for the Enterprise plan's
 *  recurring annual subscription — same self-serve flow either way. */
export async function startCheckout(plan?: "paid" | "enterprise"): Promise<{ url: string }> {
  const res = await apiFetch("/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan, attribution: attributionLabel() }),
  });
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
  status: "pending" | "completed" | "voided";
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

/** Redeem an anonymous create's claimToken onto the signed-in account's dashboard history. */
export async function claimDocument(
  claimToken: string
): Promise<{ ok: true; docId: string; title: string; alreadyClaimed?: boolean }> {
  const res = await apiFetch("/api/account/documents/claim", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ claimToken }),
  });
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

export interface BulkSendRecipient {
  signers: Array<{ name: string; email: string }>;
  title?: string;
}

export interface BulkSendResultDoc {
  docId: string;
  statusToken: string;
  statusUrl: string;
  title: string;
  recipientLabel: string;
}

export async function bulkSendFromTemplate(input: {
  templateId: string;
  recipients: BulkSendRecipient[];
  ttlDays?: number;
  customSubject?: string;
  customMessage?: string;
  signingMode?: "sequential" | "parallel";
  preparerEmail?: string;
}): Promise<{ batchId: string; documents: BulkSendResultDoc[] }> {
  const res = await apiFetch("/api/account/bulk-send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function createEmbedSession(input: {
  docId: string;
  signerOrder: number;
  allowedOrigins: string[];
  returnUrl?: string;
  ttlSeconds?: number;
}): Promise<{ embedToken: string; embedUrl: string; expiresAt: string }> {
  const res = await apiFetch("/api/embed/sessions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function resolveEmbedSession(
  token: string,
  parentOrigin: string | null
): Promise<{
  signToken: string;
  docId: string;
  order: number;
  allowedOrigins: string[];
  returnUrl?: string;
}> {
  const headers: Record<string, string> = {};
  if (parentOrigin) headers["X-Embed-Parent-Origin"] = parentOrigin;
  const res = await apiFetch(`/api/embed/sessions/${token}`, { headers });
  return asJson(res);
}

export interface TemplateUsageEntry {
  templateId: string;
  completedCount: number;
  lastCompletedAt: string;
  isRecurring: boolean;
  suggestSaving: boolean;
  teamUpsell: boolean;
}

/** Every template (saved-template id or free-template slug) this workspace has completed at
 *  least once, most-used first — drives the "Recurring Templates" badges/upsells across the
 *  Template Library, Dashboard Quick Actions, and the in-editor template picker. */
export async function fetchTemplateUsage(): Promise<{ usage: TemplateUsageEntry[] }> {
  const res = await apiFetch("/api/account/templates/usage");
  return asJson(res);
}

export type WebhookEventType = "document.created" | "document.signer.signed" | "document.completed";

export interface WebhookSummary {
  id: string;
  url: string;
  events: WebhookEventType[];
  createdAt: string;
}

export async function fetchWebhooks(): Promise<{ webhooks: WebhookSummary[] }> {
  const res = await apiFetch("/api/account/webhooks");
  return asJson(res);
}

/** Returns the raw secret exactly once — the caller must show/copy it immediately, since it's
 *  never re-exposed by fetchWebhooks afterward. */
export async function createWebhook(
  url: string,
  events: WebhookEventType[]
): Promise<{ webhookId: string; secret: string }> {
  const res = await apiFetch("/api/account/webhooks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url, events }),
  });
  return asJson(res);
}

export async function deleteWebhook(id: string): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/account/webhooks/${id}`, { method: "DELETE" });
  return asJson(res);
}

export type CloudProvider = "dropbox" | "onedrive" | "box" | "google";

export interface CloudConnectionSummary {
  provider: CloudProvider;
  connectedEmail: string | null;
  createdAt: string;
}

export async function fetchConnectors(): Promise<{ connections: CloudConnectionSummary[] }> {
  const res = await apiFetch("/api/account/connectors");
  return asJson(res);
}

export async function getConnectorAuthorizeUrl(provider: CloudProvider): Promise<{ url: string }> {
  const res = await apiFetch(`/api/account/connectors/${provider}/authorize`);
  return asJson(res);
}

export async function disconnectConnector(provider: CloudProvider): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/account/connectors/${provider}`, { method: "DELETE" });
  return asJson(res);
}

export interface TeamMemberSummary {
  accountId: string;
  email: string;
  role: "owner" | "member";
  joinedAt: string;
}

export interface PendingInviteSummary {
  id: string;
  email: string;
  expiresAt: string;
}

export async function fetchTeam(): Promise<{ members: TeamMemberSummary[]; pendingInvites: PendingInviteSummary[] }> {
  const res = await apiFetch("/api/account/team");
  return asJson(res);
}

export async function inviteTeammate(email: string): Promise<{ ok: true }> {
  const res = await apiFetch("/api/account/team/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return asJson(res);
}

export async function cancelTeamInvite(id: string): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/account/team/invites/${id}`, { method: "DELETE" });
  return asJson(res);
}

export async function removeTeamMember(memberAccountId: string): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/account/team/${memberAccountId}`, { method: "DELETE" });
  return asJson(res);
}

export async function acceptTeamInvite(token: string): Promise<{ ok: true }> {
  const res = await apiFetch("/api/account/team/accept", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  return asJson(res);
}

export async function fetchBranding(): Promise<{ hasLogo: boolean; logoPath: string | null }> {
  const res = await apiFetch("/api/account/branding/logo");
  return asJson(res);
}

export async function uploadBrandLogo(file: File): Promise<{ ok: true; logoPath: string }> {
  const form = new FormData();
  form.set("logo", file);
  const res = await apiFetch("/api/account/branding/logo", { method: "POST", body: form });
  return asJson(res);
}

export async function deleteBrandLogo(): Promise<{ ok: true }> {
  const res = await apiFetch("/api/account/branding/logo", { method: "DELETE" });
  return asJson(res);
}

export async function fetchWorkspaceSlug(): Promise<{ slug: string | null }> {
  const res = await apiFetch("/api/account/branding/slug");
  return asJson(res);
}

export async function setWorkspaceSlug(slug: string): Promise<{ ok: true; slug: string }> {
  const res = await apiFetch("/api/account/branding/slug", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  return asJson(res);
}

export async function deleteWorkspaceSlug(): Promise<{ ok: true }> {
  const res = await apiFetch("/api/account/branding/slug", { method: "DELETE" });
  return asJson(res);
}

export interface ContractRisk {
  issue: string;
  severity: "low" | "medium" | "high";
  detail: string;
}

export async function explainDocument(text: string): Promise<{ explanation: string }> {
  const res = await apiFetch("/api/account/ai/explain", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return asJson(res);
}

export async function analyzeDocumentRisks(text: string): Promise<{ risks: ContractRisk[] }> {
  const res = await apiFetch("/api/account/ai/risks", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  return asJson(res);
}

export interface GeneratedAgreement {
  title: string;
  signerLabels: string[];
  pdfBase64: string;
  fields: DocField[];
}

export async function generateContract(prompt: string): Promise<GeneratedAgreement> {
  const res = await apiFetch("/api/account/ai/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt }),
  });
  return asJson(res);
}

export interface FunnelRow {
  // Loosely typed rather than an exhaustive literal union — see apps/worker/src/lib/analytics.ts's
  // FunnelEvent for the full, larger set this can now be; keeping this in lockstep would just be
  // maintenance drift for a value only ever compared against string literals below, never switched
  // on exhaustively.
  event: string;
  route: string;
  traffic_type: "human" | "bot";
  bot_name: string;
  country: string;
  day: string;
  count: number;
}

export interface FunnelStepRow {
  event: string;
  totalCount: number;
  distinctDocuments: number;
  distinctTemplates: number;
}

export interface AttributionRow {
  event: string;
  attribution: string;
  count: number;
}

/** `humansOnly` drops rows from classified bot user agents out of the funnel step counts — see
 *  queryFunnelStepCounts in the worker for why the unfiltered numbers mislead on any funnel that
 *  pairs a server-side page load with a client-side click. */
export async function fetchAdminAnalytics(
  days: number,
  humansOnly = false
): Promise<{
  days: number;
  humansOnly: boolean;
  rows: FunnelRow[];
  funnelSteps: FunnelStepRow[];
  attribution: AttributionRow[];
}> {
  const res = await apiFetch(`/api/admin/analytics?days=${days}${humansOnly ? "&humansOnly=1" : ""}`);
  return asJson(res);
}

export interface AdminEnterpriseAccount {
  email: string;
  isPaid: boolean;
}

export async function fetchAdminEnterpriseAccounts(): Promise<{ accounts: AdminEnterpriseAccount[] }> {
  const res = await apiFetch("/api/admin/enterprise-accounts");
  return asJson(res);
}

export interface AdminAccount {
  email: string;
  createdAt: string;
  isPaid: boolean;
  isEnterprise: boolean;
}

/** Every signup, paid or not — email is the only identity Docracy collects at signup (magic-link
 *  auth has no separate name field). Admin-only. */
export async function fetchAdminAccounts(): Promise<{ accounts: AdminAccount[] }> {
  const res = await apiFetch("/api/admin/accounts");
  return asJson(res);
}

export interface AdminDocumentSigner {
  name: string;
  email: string;
  status: string;
  signedAt: string | null;
}

export interface AdminDocumentRow {
  docId: string;
  title: string;
  status: string;
  createdAt: string;
  completedAt: string | null;
  accountEmail: string;
  signers: AdminDocumentSigner[];
}

/** Account-linked docs for admin drill-down from Documents sent / signed tiles. Admin-only. */
export async function fetchAdminDocuments(
  days: number,
  kind: "sent" | "signed"
): Promise<{ kind: "sent" | "signed"; days: number; documents: AdminDocumentRow[] }> {
  const res = await apiFetch(`/api/admin/documents?days=${days}&kind=${kind}`);
  return asJson(res);
}

/** Manually grants Enterprise (and paid) status to an account by email — for customers who pay
 *  by bank transfer and never touch Stripe Checkout. Admin-only. */
export async function grantEnterprise(email: string): Promise<{ ok: true }> {
  const res = await apiFetch("/api/admin/grant-enterprise", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  return asJson(res);
}

/** Toggles the notrack cookie (see apps/worker/src/lib/analytics.ts) that opts the caller's own
 *  browser out of all funnel tracking — page views, document_created, document_completed. */
export async function setAnalyticsNoTrack(enabled: boolean): Promise<{ ok: true; enabled: boolean }> {
  const res = await apiFetch("/api/admin/analytics/notrack", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ enabled }),
  });
  return asJson(res);
}

export interface DynamicBlogPostSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string | null;
  createdAt: string;
}

export interface DynamicBlogPostDetail extends DynamicBlogPostSummary {
  body: string;
}

/** Published posts only — what the public /blog index merges in alongside the hand-coded
 *  competitor-comparison articles (lib/blog.ts). */
export async function fetchBlogPosts(): Promise<{ posts: DynamicBlogPostSummary[] }> {
  const res = await apiFetch("/api/blog-posts");
  return asJson(res);
}

export async function fetchBlogPost(slug: string): Promise<{ post: DynamicBlogPostDetail }> {
  const res = await apiFetch(`/api/blog-posts/${encodeURIComponent(slug)}`);
  return asJson(res);
}

/** Every post, draft or published — admin-only. */
export async function fetchAdminBlogPosts(): Promise<{ posts: DynamicBlogPostSummary[] }> {
  const res = await apiFetch("/api/admin/blog-posts");
  return asJson(res);
}

export async function fetchAdminBlogPost(id: string): Promise<{ post: DynamicBlogPostDetail }> {
  const res = await apiFetch(`/api/admin/blog-posts/${id}`);
  return asJson(res);
}

export async function createBlogPost(input: {
  title: string;
  slug?: string;
  description: string;
  body: string;
  publish: boolean;
}): Promise<{ ok: true; id: string; slug: string }> {
  const res = await apiFetch("/api/admin/blog-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function updateBlogPost(
  id: string,
  input: { title?: string; description?: string; body?: string; publish?: boolean }
): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/admin/blog-posts/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  return asJson(res);
}

export async function deleteBlogPost(id: string): Promise<{ ok: true }> {
  const res = await apiFetch(`/api/admin/blog-posts/${id}`, { method: "DELETE" });
  return asJson(res);
}
