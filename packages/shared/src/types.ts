/** Mirrors apps/web/src/lib/i18n's Locale — duplicated intentionally (see CLAUDE.md's YAGNI note)
 *  rather than importing the frontend's i18n module from the worker/shared package. */
export type Locale = "en" | "es";

export type DocFieldType = "signature" | "initials" | "text" | "date" | "checkbox" | "dropdown";

/**
 * `type` is optional and always read via `field.type ?? "signature"` — every field placed before
 * this property existed is a signature field, and treating a missing type as anything else would
 * silently reinterpret already-created, in-flight documents.
 */
export interface DocField {
  id: string;
  signerOrder: number;
  page: number;
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
  type?: DocFieldType;
  /** Checkbox only: when false, the signer may leave it unchecked. Absent/true = required. */
  required?: boolean;
  /** Dropdown only — at least two non-empty choices. Always read via `field.options ?? []`. */
  options?: string[];
}

export interface Signer {
  order: number;
  name: string;
  email: string;
  /** Optional — lets the paid connector's find_documents search by company. Never required. */
  company?: string;
  status: "pending" | "signed" | "declined";
  signedAt: string | null;
  linkSentAt: string | null;
  remindersSent: number[];
  /** HMAC-SHA256 hex digest of an optional PIN the preparer set for this signer, never the raw
   *  PIN — see lib/signUnlock.ts. Absent entirely for the (default) no-PIN case. */
  pinHash?: string;
  /** Set the first time this signer opens their signing link (GET /sign/:token, on-turn and past
   *  any PIN gate) — unlike index-d1.ts's recordViewedOnce (D1-only, so only paid/account-linked
   *  docs), this lives directly on the KV-resident DocState and is populated for every document,
   *  since lib/completionEmails.ts's preparer nudges need it regardless of account status. Optional
   *  so signers created before this field existed still deserialize as "not yet viewed". */
  viewedAt?: string | null;
  /** Which preparer-facing completion nudges AND Completion-funnel analytics checkpoints
   *  (lib/completionEmails.ts) have already fired for this signer, so a sweep never re-sends/
   *  re-logs the same one twice. "not_opened"/"viewed_not_signed" gate the actual preparer email
   *  (only sent when the doc has a preparerEmail); the "analytics_*" markers gate a funnel-only
   *  trackEvent call that fires for every document regardless of preparerEmail, at different (2h/
   *  4h) thresholds than the email nudges use. Optional/absent means none fired yet — always read
   *  via `signer.completionNudgesSent ?? []`. */
  completionNudgesSent?: ("not_opened" | "viewed_not_signed" | "analytics_not_opened_2h" | "analytics_not_signed_4h")[];
  /** Bound into the signing-link HMAC so reassignment invalidates the previous link. Absent on
   *  documents created before this field existed — those keep verifying with the legacy message. */
  linkNonce?: string;
  declinedAt?: string | null;
  declineReason?: string;
  /** Prior assignees after a paid reassignment — audit only, never used for routing. */
  priorAssignees?: Array<{ name: string; email: string; replacedAt: string }>;
  /** US mobile number (10 digits or +1…) — used with smsCarrier when doc.smsInvites is on. */
  phone?: string;
  /** US carrier for email-to-SMS gateway delivery via Resend. */
  smsCarrier?: "att" | "tmobile" | "verizon" | "sprint" | "uscc";
  /** Files this signer uploaded before signing (paid signer-attachments feature). */
  attachments?: SignerAttachment[];
  /** International phone number in E.164 (e.g. "+15551234567") — used when doc.whatsappInvites is
   *  on. Unlike phone/smsCarrier (US-only), this is the AES-track WhatsApp channel and isn't
   *  restricted to the US. */
  whatsappPhone?: string;
  /** Set from the WhatsApp Cloud API webhook's "delivered" status callback (see
   *  routes/whatsappWebhook.ts) — part of the evidence trail behind the AES-track claim: proof the
   *  specific WhatsApp-verified device received the signing link, independent of the signer
   *  actually clicking it. Optional/absent until (if ever) that callback arrives. */
  whatsappDeliveredAt?: string | null;
  /** Set from the WhatsApp Cloud API webhook's "read" status callback — same rationale as
   *  whatsappDeliveredAt, one step further (the message was actually opened on that device). */
  whatsappReadAt?: string | null;
  /** How the preparer wants this signer's PIN (if any) actually delivered to them — Docracy never
   *  auto-sends a PIN over the same message as the signing link (that would defeat the point of a
   *  second factor), so when `pinHash` is set this must be too. Required whenever whatsappPhone is
   *  set (the WhatsApp AES-track channel needs the signer to actually receive the PIN somehow).
   *  Sent ~30 seconds after the signing link (see lib/pinDelivery.ts) — the delay, plus a distinct
   *  message/channel, is what makes the PIN a real second factor rather than security theater. */
  pinDeliveryChannel?: "email" | "whatsapp" | "sms";
  /** Set once the delayed PIN-delivery send has actually fired, so a reassignment or resend never
   *  double-sends it. Optional/absent means not sent yet. */
  pinSentAt?: string | null;
}

export interface SignerAttachment {
  id: string;
  name: string;
  r2Key: string;
  sizeBytes: number;
  uploadedAt: string;
}

/** Notify-only recipients — get status/completion emails, never a signing turn. Always read via
 *  `doc.ccRecipients ?? []`. */
export interface CcRecipient {
  email: string;
  name?: string;
  notifiedAt?: string | null;
}

export type AuditEventType =
  | "created"
  | "invite_sent"
  | "consented"
  | "signed"
  | "completed"
  | "declined"
  | "voided"
  | "reassigned"
  | "cc_invite_sent"
  | "attachment_uploaded"
  | "whatsapp_delivered"
  | "whatsapp_read"
  | "pin_sent";

/**
 * One entry in a document's append-only event log — this is what gives an anonymous, no-account
 * signature real evidentiary weight (who did what, from where, when). Stored directly on the
 * KV-resident DocState rather than in D1, since anonymous docs (100% of traffic today) never
 * touch D1 at all.
 */
export interface AuditEvent {
  type: AuditEventType;
  signerOrder: number | null;
  ip: string | null;
  userAgent: string | null;
  timestamp: string;
  /** SHA-256 hex digest of the PDF at this point in the chain — present only for "created" |
   *  "signed" | "completed", the three events where the PDF bytes actually changed. Lets anyone
   *  verify later that a given PDF matches what was actually signed, without trusting Docracy's
   *  servers to still be running. */
  pdfSha256: string | null;
}

export interface DocState {
  docId: string;
  /** null for every anonymous document (the entire product today). Only set when a logged-in
   *  paid account creates a document via the connector's upload route. */
  accountId: string | null;
  /** null for anonymous documents. Defaults to the uploaded filename for account-linked ones. */
  title: string | null;
  createdAt: string;
  expiresAt: string;
  preparerSigns: boolean;
  status: "pending" | "completed" | "voided";
  completedAt: string | null;
  voidedAt?: string | null;
  voidReason?: string;
  /** Who voided: preparer action vs automatic void after a signer decline. */
  voidedBy?: "preparer" | "decline" | null;
  /** "sequential" (default) means only the current signer in order may act — the flow this app
   *  started with. "parallel" means every signer gets their invite at once and any of them may
   *  act in any order; completion still just means "no signer remains pending." Optional and
   *  always read via `doc.signingMode ?? "sequential"` so every document created before this
   *  field existed keeps behaving exactly as before. */
  signingMode?: "sequential" | "parallel";
  signers: Signer[];
  fields: DocField[];
  /** Notify-only recipients — always read via `doc.ccRecipients ?? []`. */
  ccRecipients?: CcRecipient[];
  /** Optional so any doc written before this field existed still deserializes — always read via
   *  `doc.events ?? []`, never assume it's present. */
  events?: AuditEvent[];
  /** Groups N independent docs created by one bulk-send request. Always read via `doc.batchId`. */
  batchId?: string;
  /** RFC 3161 trusted timestamp over the final signed PDF's hash, from a third-party Time-Stamp
   *  Authority (see lib/timestamp.ts) — proves the document existed at this time independent of
   *  Docracy's own clock/servers. Best-effort: absent if the TSA was unreachable when the last
   *  signer completed, never blocks completion. */
  timestampToken?: string;
  timestampGenTime?: string;
  /** Preparer-supplied overrides for the signing-invite email, applied to every invite in the
   *  chain (not just the first) — read fresh off the doc at each send, since sequential mode sends
   *  invites one at a time as the chain advances. Falls back to the default subject/copy when
   *  absent. Length-capped at creation (see routes/documents.ts). */
  customSubject?: string;
  customMessage?: string;
  /** Preparer's own email, set at creation only if they gave one (see routes/documents.ts) — used
   *  to send the one-time status-link email (lib/documentCreation.ts) and, ongoing, the
   *  preparer-facing completion-nudge sweep (lib/completionEmails.ts). Optional so a doc created
   *  before this field existed just never gets nudges — same "always read the optional field"
   *  pattern as customSubject/customMessage above. */
  preparerEmail?: string;
  /** Preparer's browser locale at creation time (see lib/i18n's detectLocale on the frontend) —
   *  determines the language of every email tied to this document (invite, reminder, completion,
   *  status link). Absent on documents created before this field existed; always read via
   *  `doc.locale ?? "en"`. Not a guess at the *signer's* language, just the best signal available
   *  for an anonymous chain with no per-signer locale of its own. */
  locale?: Locale;
  /** When true, also text signing links to signers with phone + US carrier (via Resend gateways). */
  smsInvites?: boolean;
  /** When true, also send signing links via WhatsApp to signers with a whatsappPhone set (Meta
   *  Cloud API) — the AES-track channel, gated to signed-up accounts (see routes/documents.ts). */
  whatsappInvites?: boolean;
  /** Paid-only: signers must upload file(s) before submitting. Always read via optional chaining. */
  signerAttachments?: {
    enabled: boolean;
    /** Default 3. */
    maxFiles?: number;
    /** Default 5MB per file. */
    maxBytesPerFile?: number;
  };
}

export interface Env {
  DOCRACY_KV: KVNamespace;
  DOCRACY_DOCS: R2Bucket;
  /** Only bound in apps/worker (writer) and apps/connector (reader) once the D1 phase lands. */
  DOCRACY_DB?: D1Database;
  TOKEN_SECRET: string;
  RESEND_API_KEY?: string;
  /** Signing secret for Resend's outbound webhooks (email.opened/clicked/bounced — see
   *  routes/resendWebhook.ts), in Resend's "whsec_..." Svix format. Absent until manually copied
   *  from the Resend dashboard's webhook config; that route 401s every request until it's set,
   *  same graceful-degradation pattern as STRIPE_WEBHOOK_SECRET below. Set with:
   *  `wrangler secret put RESEND_WEBHOOK_SECRET`. */
  RESEND_WEBHOOK_SECRET?: string;
  /** Cloudflare Workers AI binding, used for AI-first support triage — see lib/support.ts. Free
   *  (10k neurons/day), requires no external account or API key, so unlike the optional secrets
   *  below this is always present. */
  AI: Ai;
  /** Workers AI model ID override, e.g. "@cf/meta/llama-3.1-8b-instruct-fp8" — left configurable
   *  since Cloudflare's model catalog changes; support.ts falls back to a sensible default when
   *  unset. */
  WORKERS_AI_MODEL?: string;
  PUBLIC_APP_URL: string;
  /** Base URL of the deployed MCP connector (apps/connector) — used only to build the ready-to-
   *  paste connector URL returned by the API-token endpoints. */
  PUBLIC_CONNECTOR_URL: string;
  FREE_TIER_MAX_SIGNERS: string;
  DOC_TTL_DAYS: string;
  /** Max custom retention a paid account may set at create time (days). Defaults to 90 when unset. */
  DOC_TTL_MAX_DAYS?: string;
  FEEDBACK_EMAIL: string;
  /** Absent until a real Stripe account exists — billing routes must degrade gracefully (501),
   *  never throw, when these are unset. See lib/billing.ts. */
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  /** The Stripe Price ID for the paid subscription (created in the Stripe dashboard). */
  STRIPE_PRICE_ID?: string;
  /** The Stripe Product ID for the Enterprise plan — recorded here purely for reference/
   *  documentation; nothing reads it at runtime (STRIPE_ENTERPRISE_PRICE_ID below is what
   *  actually gets used to create a checkout session). */
  STRIPE_ENTERPRISE_PRODUCT_ID?: string;
  /** The Stripe Price ID for the Enterprise plan's recurring annual subscription — self-serve via
   *  POST /api/billing/checkout {plan: "enterprise"}, same flow as the standard plan above. Absent
   *  until set, in which case that route 501s for enterprise checkouts specifically (the standard
   *  plan checkout keeps working). Renewal/cancellation both flow through Stripe's own webhooks —
   *  see lib/billingProviders/stripe.ts's metadata.plan === "enterprise" handling. */
  STRIPE_ENTERPRISE_PRICE_ID?: string;
  /** Stripe Price ID for the metered WhatsApp-overage line item ($0.50/unit past the paid plan's
   *  included 10/month — see lib/whatsappOverage.ts) — attached as a second line item at checkout
   *  time (routes/billing.ts) alongside the flat plan price. Absent means new checkouts just get
   *  the flat plan with no overage item, same as today. */
  STRIPE_WHATSAPP_OVERAGE_PRICE_ID?: string;
  /** The Stripe Billing Meter's event_name that STRIPE_WHATSAPP_OVERAGE_PRICE_ID is attached to —
   *  created in the Stripe Dashboard alongside the metered price above. Absent means WhatsApp
   *  overage is never reported, and a paid account that exhausts its included 10/month hard-stops
   *  exactly like a free account would (see routes/documents.ts) rather than billing further. */
  STRIPE_WHATSAPP_METER_NAME?: string;
  /** This worker's own public origin (e.g. https://docracy-worker.rl-d77.workers.dev) — used only
   *  to build absolute URLs to this worker's own routes for contexts that can't use a relative
   *  path, like a custom workspace logo embedded in an outbound email. Optional: emails just fall
   *  back to the default Docracy wordmark until this is set. */
  PUBLIC_WORKER_URL?: string;
  /** Bot-aware funnel tracking (apps/worker/src/lib/analytics.ts) — write-only from the binding;
   *  reading aggregates back requires the separate Analytics Engine SQL HTTP API. */
  ANALYTICS?: AnalyticsEngineDataset;
  /** Comma-separated allow-list of account emails permitted to call GET /api/admin/analytics. */
  ADMIN_EMAILS?: string;
  /** Shared password letting any ADMIN_EMAILS address sign in via POST /api/auth/admin-login
   *  instead of waiting on a magic-link email — set with `wrangler secret put ADMIN_PASSWORD`,
   *  never committed to wrangler.toml. Absent means that route always 501s. */
  ADMIN_PASSWORD?: string;
  /** Bearer token for the small set of /api/automation/* routes (routes/automation.ts) used by
   *  the scheduled weekly content-generation routine — a headless caller with no way to hold an
   *  admin session cookie. Deliberately narrow: these routes can only ever create a draft blog
   *  post or a pending Marketplace submission, never publish/approve/delete anything, so a leaked
   *  token's worst case is spam sitting invisibly in a review queue. Set with `wrangler secret put
   *  AUTOMATION_API_TOKEN`. Absent means those routes always 501. */
  AUTOMATION_API_TOKEN?: string;
  /** Cloudflare account id — needed only for the Analytics Engine SQL HTTP API (see
   *  lib/analyticsQuery.ts). Not secret, just an identifier. */
  CF_ACCOUNT_ID?: string;
  /** Scoped API token (Account Analytics:Read) for the Analytics Engine SQL HTTP API — absent
   *  until manually created in the Cloudflare dashboard; the admin analytics route degrades to a
   *  clear "not configured" response rather than failing when this is unset. */
  CF_ANALYTICS_API_TOKEN?: string;
  /** Legacy alias for CF_ANALYTICS_API_TOKEN — some deployments set this shorter name instead. */
  CF_API_TOKEN?: string;
  /** Paid-plan cloud-storage connectors (lib/cloudConnectors.ts). Each provider's OAuth app
   *  is created in that provider's own developer console; client IDs are public and live here,
   *  client secrets are set via `wrangler secret put {PROVIDER}_CLIENT_SECRET` and never appear in
   *  this file. Routes degrade to a graceful 501 for any provider left unconfigured. */
  DROPBOX_CLIENT_ID?: string;
  DROPBOX_CLIENT_SECRET?: string;
  MS_CLIENT_ID?: string;
  MS_CLIENT_SECRET?: string;
  /** Alias for MS_CLIENT_ID — some deployments set ONEDRIVE_* secrets instead of MS_*. */
  ONEDRIVE_CLIENT_ID?: string;
  /** Alias for MS_CLIENT_SECRET. */
  ONEDRIVE_CLIENT_SECRET?: string;
  BOX_CLIENT_ID?: string;
  BOX_CLIENT_SECRET?: string;
  /** Google Drive cloud connector (Integrations OAuth client). Client ID is public; secret via
   *  `wrangler secret put GOOGLE_INTEGRATIONS_CLIENT_SECRET`. Routes 501 until both are set. */
  GOOGLE_INTEGRATIONS_CLIENT_ID?: string;
  GOOGLE_INTEGRATIONS_CLIENT_SECRET?: string;
  /** Google Sign-In OAuth client. Client ID is public; secret via
   *  `wrangler secret put GOOGLE_LOGIN_CLIENT_SECRET`. */
  GOOGLE_LOGIN_CLIENT_ID?: string;
  GOOGLE_LOGIN_CLIENT_SECRET?: string;
  /** Cloudflare Turnstile secret key for the login form's bot check (lib/turnstile.ts, used by
   *  POST /auth/request-link) — absent until a widget is created (`wrangler turnstile widget
   *  create`) and this is set via `wrangler secret put TURNSTILE_SECRET_KEY`. Requests skip
   *  verification entirely while unset, same graceful-degradation pattern as the other optional
   *  secrets above — this only starts enforcing once both this and the frontend's public site key
   *  (VITE_TURNSTILE_SITE_KEY) are configured together. */
  TURNSTILE_SECRET_KEY?: string;
  /** Meta WhatsApp Cloud API system-user access token — see lib/whatsapp.ts. Absent means every
   *  WhatsApp send degrades to a console.log dev line, same graceful-degradation pattern as
   *  RESEND_API_KEY. Set with `wrangler secret put WHATSAPP_ACCESS_TOKEN`. */
  WHATSAPP_ACCESS_TOKEN?: string;
  /** Meta phone number ID (not the phone number itself) the messages are sent from. */
  WHATSAPP_PHONE_NUMBER_ID?: string;
  /** Name of the pre-approved WhatsApp message template used for signing invites (created and
   *  submitted for approval in Meta Business Manager — not something this codebase can create).
   *  Defaults to "signing_invite" when unset. */
  WHATSAPP_TEMPLATE_NAME?: string;
  /** Meta locale code for the template (e.g. "en_US", "es"). Defaults based on doc.locale when unset. */
  WHATSAPP_TEMPLATE_LANG?: string;
  /** Shared secret Meta's webhook subscription handshake echoes back (hub.verify_token) — see
   *  routes/whatsappWebhook.ts's GET handler. Absent means that handshake always fails closed. */
  WHATSAPP_WEBHOOK_VERIFY_TOKEN?: string;
  /** Meta app secret used to verify the X-Hub-Signature-256 header on inbound webhook POSTs.
   *  Absent means signature verification is skipped, same degrade-safe pattern as
   *  RESEND_WEBHOOK_SECRET. */
  WHATSAPP_APP_SECRET?: string;
  /** Name of the separate pre-approved WhatsApp template used for PIN delivery (distinct content
   *  from the signing-invite template — see lib/whatsapp.ts's sendWhatsAppPin). Defaults to
   *  "signing_pin" when unset. */
  WHATSAPP_PIN_TEMPLATE_NAME?: string;
}
