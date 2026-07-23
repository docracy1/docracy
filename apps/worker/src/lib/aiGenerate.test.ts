import { describe, it, expect, vi, afterEach } from "vitest";
import { PDFDocument } from "pdf-lib";
import { draftAgreementContent, buildAgreementPdf } from "./aiGenerate";
import { makeMockEnv } from "../test/mockEnv";

describe("draftAgreementContent", () => {
  afterEach(() => vi.restoreAllMocks());

  it("parses a clean JSON object into structured content", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: JSON.stringify({
        title: "Web Design Agreement",
        signerLabels: ["Client", "Freelancer"],
        body: "Some contract body text.",
      }),
    });
    const result = await draftAgreementContent(env, "a web design contract for $2,500");
    expect(result).toEqual({
      title: "Web Design Agreement",
      signerLabels: ["Client", "Freelancer"],
      body: "Some contract body text.",
    });
  });

  it("extracts the JSON object even if wrapped in prose", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: `Sure!\n${JSON.stringify({ title: "T", signerLabels: ["A", "B"], body: "Body." })}\nLet me know if you need changes.`,
    });
    const result = await draftAgreementContent(env, "prompt");
    expect(result?.title).toBe("T");
  });

  it("parses JSON containing literal (unescaped) newlines inside the body string", async () => {
    // Real Workers AI models (llama-3.1-8b-instruct-fp8 observed in practice) frequently emit
    // JSON-shaped output with actual line breaks inside string values instead of the `\n` escape
    // the JSON spec requires — plain JSON.parse throws on that, so this must be handled.
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response:
        '{"title": "Web Design Contract", "signerLabels": ["Client", "Freelancer"], "body": "Scope of Work:\nBuild a site.\n\nPayment:\n$2,500 total."}',
    });
    const result = await draftAgreementContent(env, "a web design contract");
    expect(result?.title).toBe("Web Design Contract");
    expect(result?.body).toContain("Scope of Work:");
    expect(result?.body).toContain("Payment:");
  });

  it("returns null when fewer than 2 signer labels are given", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({
      response: JSON.stringify({ title: "T", signerLabels: ["Solo"], body: "Body." }),
    });
    const result = await draftAgreementContent(env, "prompt");
    expect(result).toBeNull();
  });

  it("returns null when the response isn't valid JSON", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: "I need more details to draft this." });
    const result = await draftAgreementContent(env, "prompt");
    expect(result).toBeNull();
  });

  it("returns null when the request throws, without propagating the error", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockRejectedValueOnce(new Error("boom"));
    const result = await draftAgreementContent(env, "prompt");
    expect(result).toBeNull();
  });
});

describe("buildAgreementPdf", () => {
  it("produces a valid, loadable PDF with one signature+date field pair per signer", async () => {
    const { pdfBytes, fields } = await buildAgreementPdf(
      "Simple Agreement",
      ["Client", "Freelancer"],
      "Paragraph one.\n\nParagraph two with more detail about scope and payment."
    );
    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBeGreaterThanOrEqual(1);
    expect(fields).toHaveLength(4); // signature + date, per signer
    expect(fields.filter((f) => f.signerOrder === 1)).toHaveLength(2);
    expect(fields.filter((f) => f.signerOrder === 2)).toHaveLength(2);
    for (const f of fields) {
      expect(f.xFrac).toBeGreaterThanOrEqual(0);
      expect(f.xFrac).toBeLessThanOrEqual(1);
      expect(f.yFrac).toBeGreaterThanOrEqual(0);
      expect(f.yFrac).toBeLessThanOrEqual(1);
      expect(f.wFrac).toBeGreaterThan(0);
      expect(f.hFrac).toBeGreaterThan(0);
      expect(f.page).toBeLessThan(loaded.getPageCount());
    }
  });

  it("paginates onto a second page for a very long body", async () => {
    const longBody = Array.from({ length: 80 }, (_, i) => `Paragraph ${i}: ` + "word ".repeat(80)).join("\n\n");
    const { pdfBytes, fields } = await buildAgreementPdf("Long Agreement", ["Party A", "Party B"], longBody);
    const loaded = await PDFDocument.load(pdfBytes);
    expect(loaded.getPageCount()).toBeGreaterThan(1);
    // Every field must land on a page that actually exists.
    for (const f of fields) {
      expect(f.page).toBeGreaterThanOrEqual(0);
      expect(f.page).toBeLessThan(loaded.getPageCount());
    }
  });
});
