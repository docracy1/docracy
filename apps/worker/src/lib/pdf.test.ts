import { describe, it, expect } from "vitest";
import { PDFDocument } from "pdf-lib";
import { burnFields, decodedByteLength, generateCertificate, MAX_SIGNATURE_IMAGE_BYTES } from "./pdf";
import type { DocField, DocState } from "@docracy/shared";

// A real minimal 1x1 PNG — needed because pdf-lib's embedPng actually decodes the image.
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";

async function makeBlankPdfBytes(): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  doc.addPage([400, 500]);
  return doc.save();
}

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

describe("burnFields", () => {
  const baseField = { id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.3, hFrac: 0.08 };

  it("draws an image for a signature field (type omitted, defaults to signature)", async () => {
    const pdfBytes = await makeBlankPdfBytes();
    const result = await burnFields(pdfBytes, [baseField], [{ fieldId: "f1", value: TINY_PNG }], "anna@example.com", new Date().toISOString());
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(1);
  });

  it("draws an image for an explicit initials field", async () => {
    const pdfBytes = await makeBlankPdfBytes();
    const field: DocField = { ...baseField, type: "initials" };
    const result = await burnFields(pdfBytes, [field], [{ fieldId: "f1", value: TINY_PNG }], "anna@example.com", new Date().toISOString());
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(1);
  });

  it("draws plain text for a text field without attempting to decode it as an image", async () => {
    const pdfBytes = await makeBlankPdfBytes();
    const field: DocField = { ...baseField, type: "text" };
    const result = await burnFields(pdfBytes, [field], [{ fieldId: "f1", value: "Freelance Contract LLC" }], "anna@example.com", new Date().toISOString());
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(1);
    expect(result.byteLength).toBeGreaterThan(pdfBytes.byteLength);
  });

  it("draws plain text for a date field", async () => {
    const pdfBytes = await makeBlankPdfBytes();
    const field: DocField = { ...baseField, type: "date" };
    const result = await burnFields(pdfBytes, [field], [{ fieldId: "f1", value: "Jul 19, 2026" }], "anna@example.com", new Date().toISOString());
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(1);
  });

  it("truncates a text value too long to fit the field's width instead of throwing", async () => {
    const pdfBytes = await makeBlankPdfBytes();
    const field: DocField = { ...baseField, type: "text" };
    const longValue = "This is a very long piece of text that will not fit in a narrow field box at all";
    await expect(
      burnFields(pdfBytes, [field], [{ fieldId: "f1", value: longValue }], "anna@example.com", new Date().toISOString())
    ).resolves.toBeInstanceOf(Uint8Array);
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
