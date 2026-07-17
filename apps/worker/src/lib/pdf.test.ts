import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { decodedByteLength, generateCertificate, MAX_SIGNATURE_IMAGE_BYTES } from "./pdf";
import type { DocState } from "@docracy/shared";

describe("decodedByteLength", () => {
  it("estimates decoded byte size from a base64 data: URL", () => {
    // "QUJD" is the base64 encoding of the 3 bytes "ABC" — no padding, so the 4:3 ratio is exact.
    expect(decodedByteLength("data:image/png;base64,QUJD")).toBe(3);
  });

  it("handles a raw base64 string with no data: URL prefix", () => {
    expect(decodedByteLength("QUJD")).toBe(3);
  });

  it("flags a string over the signature size cap", () => {
    const big = "A".repeat(3_000_000);
    expect(decodedByteLength(big)).toBeGreaterThan(MAX_SIGNATURE_IMAGE_BYTES);
  });
});

describe("generateCertificate", () => {
  const doc: DocState = {
    docId: "doc-1",
    accountId: null,
    title: null,
    createdAt: new Date("2026-01-01T10:00:00Z").toISOString(),
    expiresAt: new Date("2026-01-10T10:00:00Z").toISOString(),
    preparerSigns: false,
    status: "completed",
    completedAt: new Date("2026-01-02T12:00:00Z").toISOString(),
    signers: [
      {
        order: 1,
        name: "Anna",
        email: "anna@example.com",
        status: "signed",
        signedAt: new Date("2026-01-02T11:00:00Z").toISOString(),
        linkSentAt: new Date("2026-01-01T10:00:00Z").toISOString(),
        remindersSent: [],
      },
    ],
    fields: [],
    events: [
      { type: "created", signerOrder: null, ip: "1.1.1.1", userAgent: null, timestamp: "2026-01-01T10:00:00Z", pdfSha256: "aaa" },
      { type: "invite_sent", signerOrder: 1, ip: null, userAgent: null, timestamp: "2026-01-01T10:00:00Z", pdfSha256: null },
      { type: "consented", signerOrder: 1, ip: "2.2.2.2", userAgent: "test-agent", timestamp: "2026-01-02T11:00:00Z", pdfSha256: null },
      { type: "signed", signerOrder: 1, ip: "2.2.2.2", userAgent: "test-agent", timestamp: "2026-01-02T11:00:00Z", pdfSha256: "bbb" },
      { type: "completed", signerOrder: null, ip: null, userAgent: null, timestamp: "2026-01-02T12:00:00Z", pdfSha256: "bbb" },
    ],
  };

  it("produces a loadable single-page PDF", async () => {
    const bytes = await generateCertificate(doc, "bbb");
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it("doesn't throw when the document has no recorded events (older/degraded doc state)", async () => {
    const { events, ...docWithoutEvents } = doc;
    const bytes = await generateCertificate(docWithoutEvents as DocState, "bbb");
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
  });

  it("still produces a valid certificate when no trusted timestamp was obtained", async () => {
    const bytes = await generateCertificate(doc, "bbb");
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
  });

  it("produces a valid, larger certificate when a trusted timestamp is present", async () => {
    const docWithTimestamp: DocState = { ...doc, timestampGenTime: "2026-01-02T12:00:01Z", timestampToken: "dGVzdA==" };
    const withTimestamp = await generateCertificate(docWithTimestamp, "bbb");
    const without = await generateCertificate(doc, "bbb");
    const loaded = await PDFDocument.load(withTimestamp);
    expect(loaded.getPageCount()).toBe(1);
    expect(withTimestamp.byteLength).toBeGreaterThan(without.byteLength);
  });
});
