import { describe, it, expect } from "vitest";
import { findDocuments } from "./paidTools";
import type { ConnectorEnv } from "./types";

interface Row {
  doc_id: string;
  account_id: string;
  title: string;
  status: string;
  created_at: string;
  signers: Array<{ name: string; email: string; company?: string }>;
}

function makeMockD1(rows: Row[]) {
  return {
    prepare: (sql: string) => ({
      bind: (...args: unknown[]) => ({
        all: async () => {
          const placeholderCount = (sql.match(/\?/g) ?? []).length;
          if (args.length !== placeholderCount) {
            throw new Error(`D1_ERROR: Wrong number of parameter bindings for SQL query.`);
          }
          const [accountId, trimmed] = args as [string, string];
          const needle = trimmed.toLowerCase();
          const matched = rows.filter((r) => {
            if (r.account_id !== accountId) return false;
            if (!trimmed) return true;
            const haystack = [r.title, ...r.signers.flatMap((s) => [s.name, s.email, s.company ?? ""])]
              .join(" ")
              .toLowerCase();
            return haystack.includes(needle);
          });
          return {
            results: matched.map((r) => ({
              doc_id: r.doc_id,
              title: r.title,
              status: r.status,
              created_at: r.created_at,
            })),
          };
        },
      }),
    }),
  };
}

function makeEnv(rows: Row[], withDb = true): ConnectorEnv {
  return {
    DOCRACY_KV: {} as ConnectorEnv["DOCRACY_KV"],
    TOKEN_SECRET: "test-secret",
    DOCRACY_DB: withDb ? (makeMockD1(rows) as unknown as ConnectorEnv["DOCRACY_DB"]) : undefined,
  };
}

const ROWS: Row[] = [
  {
    doc_id: "doc-1",
    account_id: "acct-1",
    title: "Lease Agreement",
    status: "completed",
    created_at: "2026-01-01T00:00:00Z",
    signers: [{ name: "Anna", email: "anna@example.com", company: "Acme" }],
  },
  {
    doc_id: "doc-2",
    account_id: "acct-1",
    title: "NDA",
    status: "pending",
    created_at: "2026-02-01T00:00:00Z",
    signers: [{ name: "Max", email: "max@example.com" }],
  },
  {
    doc_id: "doc-3",
    account_id: "acct-2",
    title: "Not Mine",
    status: "pending",
    created_at: "2026-01-15T00:00:00Z",
    signers: [],
  },
];

describe("findDocuments", () => {
  it("returns only the requesting account's documents when the query is empty", async () => {
    const env = makeEnv(ROWS);
    const results = await findDocuments(env, "acct-1", "");
    expect(results.map((r) => r.docId).sort()).toEqual(["doc-1", "doc-2"]);
  });

  it("matches by document title", async () => {
    const env = makeEnv(ROWS);
    const results = await findDocuments(env, "acct-1", "lease");
    expect(results.map((r) => r.docId)).toEqual(["doc-1"]);
  });

  it("matches by signer company", async () => {
    const env = makeEnv(ROWS);
    const results = await findDocuments(env, "acct-1", "Acme");
    expect(results.map((r) => r.docId)).toEqual(["doc-1"]);
  });

  it("never returns another account's documents, even with a matching query", async () => {
    const env = makeEnv(ROWS);
    const results = await findDocuments(env, "acct-1", "Not Mine");
    expect(results).toEqual([]);
  });

  it("returns an empty list when DOCRACY_DB isn't bound", async () => {
    const env = makeEnv(ROWS, false);
    const results = await findDocuments(env, "acct-1", "");
    expect(results).toEqual([]);
  });
});
