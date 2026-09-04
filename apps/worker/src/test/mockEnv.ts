import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";
import { PDFDocument } from "pdf-lib";
import type { Env } from "@docracy/shared";
import { resetRateLimitMemoryForTests } from "../lib/ratelimit";

/** Minimal in-memory stand-ins for the KV/R2 methods this app actually uses. */
function createMockKV() {
  const store = new Map<string, string | Uint8Array>();
  return {
    async get(key: string, type?: "json" | "arrayBuffer") {
      const raw = store.get(key);
      if (raw === undefined) return null;
      if (type === "arrayBuffer") {
        const bytes = raw instanceof Uint8Array ? raw : new TextEncoder().encode(raw);
        return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      }
      return type === "json" ? JSON.parse(raw as string) : raw;
    },
    async put(key: string, value: string | Uint8Array, _opts?: { expirationTtl?: number }) {
      store.set(key, value);
    },
    async list({ prefix, cursor }: { prefix?: string; cursor?: string } = {}) {
      const keys = [...store.keys()]
        .filter((k) => !prefix || k.startsWith(prefix))
        .map((name) => ({ name }));
      return { keys, list_complete: true, cursor: cursor ?? "" };
    },
    async delete(key: string) {
      store.delete(key);
    },
    // Existing tests poke at this directly assuming string values (every non-binary KV key) —
    // the widened Map above only exists so recordOtsProof/lookupOtsProof (verification.ts) can
    // round-trip raw bytes through the same mock via the typed get/put methods above.
    _store: store as Map<string, string>,
  };
}

function createMockR2() {
  const store = new Map<string, Uint8Array>();
  // Kept separate from `store` (rather than wrapping stored values in a {bytes, httpMetadata}
  // shape) so tests that write directly into `_store` with raw bytes — see cleanup.test.ts —
  // keep working unchanged; they just never set/read metadata, which they don't need anyway.
  const metaStore = new Map<string, { contentType?: string }>();
  return {
    async put(key: string, value: Uint8Array, options?: { httpMetadata?: { contentType?: string } }) {
      store.set(key, value);
      if (options?.httpMetadata) metaStore.set(key, options.httpMetadata);
      else metaStore.delete(key);
    },
    async get(key: string) {
      const bytes = store.get(key);
      if (!bytes) return null;
      return {
        arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
        httpMetadata: metaStore.get(key),
      };
    },
    async list({ prefix }: { prefix?: string; cursor?: string } = {}) {
      const objects = [...store.keys()]
        .filter((k) => !prefix || k.startsWith(prefix))
        .map((key) => ({ key }));
      return { objects, truncated: false, cursor: "" };
    },
    async delete(keys: string | string[]) {
      for (const key of Array.isArray(keys) ? keys : [keys]) {
        store.delete(key);
        metaStore.delete(key);
      }
    },
    _store: store,
  };
}

// Throws by default (answerSupportQuestion treats that as "can't answer" and returns null) —
// tests exercising a real answer override this with `vi.spyOn(env.AI, "run").mockResolvedValueOnce(...)`.
function createMockAI() {
  return {
    async run() {
      throw new Error("Mock AI: no response configured for this test");
    },
  };
}

const MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0001_init.sql", import.meta.url).toString()),
  "utf-8"
);
const API_TOKENS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0002_api_tokens.sql", import.meta.url).toString()),
  "utf-8"
);
const STRIPE_CUSTOMER_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0003_stripe_customer.sql", import.meta.url).toString()),
  "utf-8"
);
const TEMPLATES_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0004_templates.sql", import.meta.url).toString()),
  "utf-8"
);
const WEBHOOKS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0005_webhooks.sql", import.meta.url).toString()),
  "utf-8"
);
const TEAM_AND_BRANDING_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0006_team_and_branding.sql", import.meta.url).toString()),
  "utf-8"
);
const ENTERPRISE_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0007_enterprise.sql", import.meta.url).toString()),
  "utf-8"
);
const ENTERPRISE_EXPIRY_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0008_enterprise_expiry.sql", import.meta.url).toString()),
  "utf-8"
);
const CLOUD_CONNECTORS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0009_cloud_connectors.sql", import.meta.url).toString()),
  "utf-8"
);
const PAYMENT_FAILED_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0010_payment_failed.sql", import.meta.url).toString()),
  "utf-8"
);
const WORKSPACE_SLUG_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0011_workspace_slug.sql", import.meta.url).toString()),
  "utf-8"
);
const BLOG_POSTS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0012_blog_posts.sql", import.meta.url).toString()),
  "utf-8"
);
const ONBOARDING_EMAILS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0013_onboarding_emails.sql", import.meta.url).toString()),
  "utf-8"
);
const TEMPLATE_USAGE_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0014_template_usage.sql", import.meta.url).toString()),
  "utf-8"
);
const CONTACTS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0015_contacts.sql", import.meta.url).toString()),
  "utf-8"
);
const ONBOARDING_LEADS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0016_onboarding_leads.sql", import.meta.url).toString()),
  "utf-8"
);
const LOCALE_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0019_locale.sql", import.meta.url).toString()),
  "utf-8"
);
const MARKETING_EMAIL_OPTIN_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0021_marketing_email_optin.sql", import.meta.url).toString()),
  "utf-8"
);
const WHATSAPP_QUOTA_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0022_whatsapp_quota.sql", import.meta.url).toString()),
  "utf-8"
);
const MARKETPLACE_TEMPLATES_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0023_marketplace_templates.sql", import.meta.url).toString()),
  "utf-8"
);
const MARKETPLACE_ANONYMOUS_SUBMIT_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0024_marketplace_anonymous_submit.sql", import.meta.url).toString()),
  "utf-8"
);
const MARKETPLACE_SEO_FIELDS_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0025_marketplace_seo_fields.sql", import.meta.url).toString()),
  "utf-8"
);
const TEMPLATE_TOPIC_QUEUE_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0026_template_topic_queue.sql", import.meta.url).toString()),
  "utf-8"
);
const ONBOARDING_LEADS_STEP2_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0028_onboarding_leads_step2.sql", import.meta.url).toString()),
  "utf-8"
);
const STRIPE_CHECKOUT_SESSION_MIGRATION_SQL = readFileSync(
  fileURLToPath(new URL("../../migrations/0029_stripe_checkout_session.sql", import.meta.url).toString()),
  "utf-8"
);

// sql.js's default WASM build doesn't compile in the FTS5 extension. It's swapped for a plain
// table here — full-text MATCH queries aren't exercised by anything built in this pass anyway
// (find_documents, the one feature that needs FTS5, is explicitly deferred to a follow-up plan)
// and the INSERT/DELETE statements our code issues against it are identical either way.
const TEST_MIGRATION_SQL =
  MIGRATION_SQL.replace(
    /CREATE VIRTUAL TABLE documents_fts USING fts5\([^)]*\);/,
    "CREATE TABLE documents_fts (doc_id TEXT, title TEXT);"
  ) +
  API_TOKENS_MIGRATION_SQL +
  STRIPE_CUSTOMER_MIGRATION_SQL +
  TEMPLATES_MIGRATION_SQL +
  WEBHOOKS_MIGRATION_SQL +
  TEAM_AND_BRANDING_MIGRATION_SQL +
  ENTERPRISE_MIGRATION_SQL +
  ENTERPRISE_EXPIRY_MIGRATION_SQL +
  CLOUD_CONNECTORS_MIGRATION_SQL +
  PAYMENT_FAILED_MIGRATION_SQL +
  WORKSPACE_SLUG_MIGRATION_SQL +
  BLOG_POSTS_MIGRATION_SQL +
  ONBOARDING_EMAILS_MIGRATION_SQL +
  TEMPLATE_USAGE_MIGRATION_SQL +
  CONTACTS_MIGRATION_SQL +
  ONBOARDING_LEADS_MIGRATION_SQL +
  LOCALE_MIGRATION_SQL +
  MARKETING_EMAIL_OPTIN_MIGRATION_SQL +
  WHATSAPP_QUOTA_MIGRATION_SQL +
  MARKETPLACE_TEMPLATES_MIGRATION_SQL +
  MARKETPLACE_ANONYMOUS_SUBMIT_MIGRATION_SQL +
  MARKETPLACE_SEO_FIELDS_MIGRATION_SQL +
  TEMPLATE_TOPIC_QUEUE_MIGRATION_SQL +
  ONBOARDING_LEADS_STEP2_MIGRATION_SQL +
  STRIPE_CHECKOUT_SESSION_MIGRATION_SQL;

// sql.js's WASM module only needs loading once per test run; each test still gets its own
// fresh in-memory `SQL.Database()` instance below.
const SQL = await initSqlJs();

/**
 * Real SQLite (sql.js, a WASM build — not a hand-rolled fake) seeded with the actual migration
 * file, wrapped in a thin adapter matching D1Database's shape. This exercises real SQL semantics
 * (including ON CONFLICT upserts) rather than a mock that could silently diverge from what real
 * D1 actually does. See TEST_MIGRATION_SQL above for the one deliberate exception (FTS5).
 */
function createMockD1() {
  const db = new SQL.Database();
  db.run(TEST_MIGRATION_SQL);

  function makeStatement(sql: string, params: unknown[] = []) {
    return {
      bind: (...newParams: unknown[]) => makeStatement(sql, newParams),
      run: async () => {
        const stmt = db.prepare(sql);
        stmt.bind(params as never[]);
        stmt.step();
        stmt.free();
        return { success: true };
      },
      first: async () => {
        const stmt = db.prepare(sql);
        stmt.bind(params as never[]);
        const hasRow = stmt.step();
        const row = hasRow ? stmt.getAsObject() : null;
        stmt.free();
        return row;
      },
      all: async () => {
        const stmt = db.prepare(sql);
        stmt.bind(params as never[]);
        const results: unknown[] = [];
        while (stmt.step()) results.push(stmt.getAsObject());
        stmt.free();
        return { results, success: true };
      },
    };
  }

  return {
    prepare: (sql: string) => makeStatement(sql),
    batch: async (stmts: ReturnType<typeof makeStatement>[]) => Promise.all(stmts.map((s) => s.run())),
    exec: async (sql: string) => {
      db.run(sql);
    },
    _db: db,
  };
}

export function makeMockEnv(overrides: Partial<Env> = {}) {
  resetRateLimitMemoryForTests();
  const kv = createMockKV();
  const r2 = createMockR2();
  const d1 = createMockD1();
  const env = {
    DOCRACY_KV: kv as unknown as Env["DOCRACY_KV"],
    DOCRACY_DOCS: r2 as unknown as Env["DOCRACY_DOCS"],
    DOCRACY_DB: d1 as unknown as Env["DOCRACY_DB"],
    AI: createMockAI() as unknown as Env["AI"],
    TOKEN_SECRET: "test-secret",
    PUBLIC_APP_URL: "http://localhost:5173",
    PUBLIC_CONNECTOR_URL: "http://localhost:8788",
    PUBLIC_WORKER_URL: "http://localhost:8787",
    FREE_TIER_MAX_SIGNERS: "2",
    DOC_TTL_DAYS: "9",
    DOC_TTL_MAX_DAYS: "500",
    FEEDBACK_EMAIL: "feedback-test@example.com",
    ...overrides,
  } as Env;
  return { env, kv, r2, d1 };
}

/** A real, loadable one-page PDF — needed anywhere the code actually parses it (e.g. burnFields). */
export async function makeValidPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([200, 200]);
  return doc.save();
}
