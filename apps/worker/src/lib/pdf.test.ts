import { describe, it, expect } from "vitest";
import { inflateSync } from "node:zlib";
import { PDFDocument } from "pdf-lib";
import {
  burnFields,
  decodedByteLength,
  generateCertificate,
  stampPageFooters,
  mergePdfs,
  MAX_SIGNATURE_IMAGE_BYTES,
} from "./pdf";
import { docracySealPngBytes } from "./docracySealPng";
import type { DocField, DocState } from "@docracy/shared";

// A real minimal 1x1 PNG — needed because pdf-lib's embedPng actually decodes the image.
const TINY_PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
const TINY_PNG_BYTES = Uint8Array.from(atob(TINY_PNG.split(",")[1]!), (c) => c.charCodeAt(0));

async function makeBlankPdfBytes(pageCount = 1): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  for (let i = 0; i < pageCount; i++) doc.addPage([400, 500]);
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

describe("stampPageFooters", () => {
  it("keeps page count and grows the PDF when stamping every page", async () => {
    const pdfBytes = await makeBlankPdfBytes(3);
    const result = await stampPageFooters(pdfBytes, {
      docId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      completedAt: "2026-01-02T12:00:00Z",
    });
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(3);
    expect(result.byteLength).toBeGreaterThan(pdfBytes.byteLength);
  });

  it("accepts a white-label PNG logo in place of the Docracy seal", async () => {
    const pdfBytes = await makeBlankPdfBytes(1);
    const result = await stampPageFooters(pdfBytes, {
      docId: "doc-wl",
      completedAt: "2026-01-02T12:00:00Z",
      brand: { logoBytes: TINY_PNG_BYTES, logoContentType: "image/png" },
    });
    const loaded = await PDFDocument.load(result);
    expect(loaded.getPageCount()).toBe(1);
    expect(result.byteLength).toBeGreaterThan(0);
  });

  it("embeds the real Docracy seal bytes", () => {
    expect(docracySealPngBytes().byteLength).toBeGreaterThan(1000);
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

  /**
   * pdf-lib encodes StandardFonts text as hex `<…>` Tj operands inside FlateDecode streams.
   * Inflate those streams and decode hex so certificate copy is assertable.
   */
  function pdfSearchableText(bytes: Uint8Array): string {
    const buf = Buffer.from(bytes);
    const decoded: string[] = [];
    const streamMarker = Buffer.from("stream");
    const endMarker = Buffer.from("endstream");
    let i = 0;
    while (i < buf.length) {
      const start = buf.indexOf(streamMarker, i);
      if (start < 0) break;
      let dataStart = start + streamMarker.length;
      if (buf[dataStart] === 0x0d) dataStart++;
      if (buf[dataStart] === 0x0a) dataStart++;
      const end = buf.indexOf(endMarker, dataStart);
      if (end < 0) break;
      try {
        const inflated = inflateSync(buf.subarray(dataStart, end)).toString("latin1");
        for (const m of inflated.matchAll(/<([0-9A-Fa-f]+)>/g)) {
          decoded.push(Buffer.from(m[1]!, "hex").toString("utf8"));
        }
      } catch {
        /* image / xref streams */
      }
      i = end + endMarker.length;
    }
    return decoded.join("\n");
  }

  it("produces a loadable single-page PDF", async () => {
    const bytes = await generateCertificate(doc, "bbb");
    const loaded = await PDFDocument.load(bytes);
    expect(loaded.getPageCount()).toBe(1);
    expect(bytes.byteLength).toBeGreaterThan(0);
  });

  it("embeds honest SES / ESIGN / UETA seals and brand caption, not PDF/A LTV QES AES seals", async () => {
    const text = pdfSearchableText(await generateCertificate(doc, "bbb"));
    expect(text).toContain("Signed with Docracy");
    expect(text).toContain("Signature Certificate");
    // Center acronyms + under-seal captions (whole strings); arc letters are one glyph each
    expect(text).toContain("SES");
    expect(text).toContain("ESIGN");
    expect(text).toContain("UETA");
    expect(text).toContain("eIDAS SES");
    expect(text).toContain("US ESIGN Act");
    expect(text).toContain("US UETA");
    expect(text).toContain("Aligns with eIDAS SES and US ESIGN & UETA");
    expect(text).toContain("No identity verification");
    expect(text).toContain("Not AES/QES");
    expect(text).toContain("Not PDF/A or PAdES-LTV");
    // The cert explicitly DISCLAIMS QES/AES status ("not a Qualified..."), so the substring
    // legitimately appears — what must never appear is an affirmative claim of QES/AES status.
    expect(text).not.toContain("This is a Qualified Electronic Signature");
    expect(text).not.toContain("This is an Advanced Electronic Signature");
    expect(text).toContain("not a Qualified Electronic Signature");
    expect(text).toContain("does not issue Qualified or Advanced Electronic Signatures");
    expect(text).not.toContain("PDF/A-2");
    expect(text).not.toContain("PDF/A-3");
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

describe("mergePdfs", () => {
  async function makePdfWithPages(pageCount: number): Promise<Uint8Array> {
    const doc = await PDFDocument.create();
    for (let i = 0; i < pageCount; i++) doc.addPage([400, 500]);
    return doc.save();
  }

  it("concatenates every page from every input PDF, in order", async () => {
    const a = await makePdfWithPages(2);
    const b = await makePdfWithPages(1);

    const merged = await mergePdfs([a, b]);

    const loaded = await PDFDocument.load(merged);
    expect(loaded.getPageCount()).toBe(3);
  });

  it("returns a valid single-input PDF unchanged in page count", async () => {
    const a = await makePdfWithPages(1);

    const merged = await mergePdfs([a]);

    const loaded = await PDFDocument.load(merged);
    expect(loaded.getPageCount()).toBe(1);
  });
});
