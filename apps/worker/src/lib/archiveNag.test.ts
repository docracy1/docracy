import { describe, expect, it } from "vitest";
import { archiveNagDue } from "./archiveNag";
import type { DocState } from "@docracy/shared";

function makeDoc(overrides: Partial<DocState> = {}): DocState {
  const now = Date.now();
  return {
    docId: "doc-1",
    accountId: null,
    title: "Acme contractor NDA",
    createdAt: new Date(now - 7 * 86400000).toISOString(),
    expiresAt: new Date(now + 2 * 86400000).toISOString(),
    preparerSigns: false,
    status: "completed",
    completedAt: new Date(now - 6 * 86400000).toISOString(),
    signers: [
      {
        order: 1,
        name: "Alex",
        email: "alex@example.com",
        status: "signed",
        signedAt: new Date(now - 6 * 86400000).toISOString(),
        linkSentAt: new Date(now - 7 * 86400000).toISOString(),
        remindersSent: [],
      },
    ],
    fields: [],
    preparerEmail: "founder@studio.com",
    ...overrides,
  };
}

describe("archiveNagDue", () => {
  const now = Date.parse("2026-09-04T12:00:00Z");

  it("is due for a completed unpaid doc expiring in 2 days", () => {
    const doc = makeDoc({ expiresAt: new Date(now + 2 * 86400000).toISOString() });
    expect(archiveNagDue(doc, now, false)).toBe(true);
  });

  it("skips paid workspaces", () => {
    const doc = makeDoc({ expiresAt: new Date(now + 2 * 86400000).toISOString() });
    expect(archiveNagDue(doc, now, true)).toBe(false);
  });

  it("skips pending docs and docs already nagged", () => {
    expect(archiveNagDue(makeDoc({ status: "pending" }), now, false)).toBe(false);
    expect(archiveNagDue(makeDoc({ archiveNagSentAt: new Date(now).toISOString() }), now, false)).toBe(false);
  });

  it("skips when there is no preparer email or expiry is still far out", () => {
    expect(archiveNagDue(makeDoc({ preparerEmail: undefined }), now, false)).toBe(false);
    expect(
      archiveNagDue(makeDoc({ expiresAt: new Date(now + 8 * 86400000).toISOString() }), now, false)
    ).toBe(false);
  });
});
