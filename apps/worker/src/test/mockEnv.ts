import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import initSqlJs from "sql.js";
import { PDFDocument } from "pdf-lib";
import type { Env } from "@docracy/shared";

/** Minimal in-memory stand-ins for the KV/R2 methods this app actually uses. */
function createMockKV() {
  const store = new Map<string, string>();
  return {
    async get(key: string, type?: "json") {
      const raw = store.get(key);
      if (raw === undefined) return null;
      return type === "json" ? JSON.parse(raw) : raw;
    },
    async put(key: string, value: string, _opts?: { expirationTtl?: number }) {
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
    _store: store,
  };
}

function createMockR2() {
  const store = new Map<string, Uint8Array>();
  return {
    async put(key: string, value: Uint8Array) {
      store.set(key, value);
    },
    async get(key: string) {
      const bytes = store.get(key);
      if (!bytes) return null;
      return { arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
    },
    async list({ prefix }: { prefix?: string; cursor?: string } = {}) {
      const objects = [...store.keys()]
        .filter((k) => !prefix || k.startsWith(prefix))
        .map((key) => ({ key }));
      return { objects, truncated: false, cursor: "" };
    },
    async delete(keys: string | string[]) {
      for (const key of Array.isArray(keys) ? keys : [keys]) store.delete(key);
    },
    _store: store,
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

// sql.js's default WASM build doesn't compile in the FTS5 extension. It's swapped for a plain
// table here — full-text MATCH queries aren't exercised by anything built in this pass anyway
// (find_documents, the one feature that needs FTS5, is explicitly deferred to a follow-up plan)
// and the INSERT/DELETE statements our code issues against it are identical either way.
const TEST_MIGRATION_SQL =
  MIGRATION_SQL.replace(
    /CREATE VIRTUAL TABLE documents_fts USING fts5\([^)]*\);/,
    "CREATE TABLE documents_fts (doc_id TEXT, title TEXT);"
  ) + API_TOKENS_MIGRATION_SQL;

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
  const kv = createMockKV();
  const r2 = createMockR2();
  const d1 = createMockD1();
  const env = {
    DOCRACY_KV: kv as unknown as Env["DOCRACY_KV"],
    DOCRACY_DOCS: r2 as unknown as Env["DOCRACY_DOCS"],
    DOCRACY_DB: d1 as unknown as Env["DOCRACY_DB"],
    TOKEN_SECRET: "test-secret",
    PUBLIC_APP_URL: "http://localhost:5173",
    PUBLIC_CONNECTOR_URL: "http://localhost:8788",
    FREE_TIER_MAX_SIGNERS: "2",
    DOC_TTL_DAYS: "9",
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
