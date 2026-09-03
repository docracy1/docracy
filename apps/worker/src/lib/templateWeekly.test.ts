import { describe, expect, it } from "vitest";
import { parseAndValidateDraft, runWeeklyTemplateCatchUpIfEmpty } from "./templateWeekly";
import { renderTemplatePdf, TEXT_BLANK } from "./templatePdf";
import { ensureWeeklyTemplateInfra, shouldCatchUpWeeklyTemplates } from "./templateTopicQueue";
import { makeMockEnv } from "../test/mockEnv";

const baseTopic = {
  id: "ttq_test",
  slug: "sample-consulting-sow",
  title: "Creative Services Statement of Work",
  category: "Consulting",
  angle: "test",
  status: "queued",
};

function richDraftJson(overrides: Record<string, unknown> = {}) {
  const paragraphs = Array.from({ length: 10 }, (_, i) => ({
    type: "paragraph",
    text:
      `This is substantive paragraph ${i + 1} describing obligations, payment, timeline, and confidentiality ` +
      `for a small-business agreement. It uses [Client Name] and [Fee] placeholders and continues with enough ` +
      `words to clear the minimum word-count gate for FreeTemplate-parity weekly drafts.`,
  }));
  const body = {
    title: "Creative Services Statement of Work",
    seoTitle: "Free Creative Services Statement of Work Template",
    description: "Defines deliverables, milestones, fees, and acceptance for a creative services engagement.",
    useCase:
      "Use this when a client accepts a creative project proposal and you need signed scope, milestones, and payment terms before work starts.",
    definition:
      "A statement of work is a contract attachment that describes the specific services, deliverables, and timeline for a project engagement.",
    keyClauses: [
      "Scope of services",
      "Deliverables and milestones",
      "Fees and payment schedule",
      "Acceptance criteria",
      "Change orders",
      "Intellectual property",
    ],
    fillInFields: [
      "[Provider Name]",
      "[Client Name]",
      "[Project Name]",
      "[Start Date]",
      "[Fee]",
      "[Milestone 1]",
    ],
    legalSummary:
      "Signing confirms both parties agree to the described scope and fees. The provider must deliver the listed work; the client must pay per the schedule and provide timely feedback.",
    chatgptPrompts: [
      "Fill this SOW for a brand identity package with three milestones.",
      "Explain the acceptance and change-order clauses in plain language.",
      "Adapt this SOW for an ongoing monthly retainer instead of a fixed project.",
    ],
    signerLabels: ["Provider", "Client"],
    category: "Consulting",
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Provider: " },
      { type: "field", label: "Client: " },
      { type: "section", text: "Scope of Services" },
      ...paragraphs.slice(0, 2),
      { type: "field", label: "Project name: " },
      { type: "section", text: "Deliverables and Milestones" },
      ...paragraphs.slice(2, 4),
      { type: "field", label: "Milestone 1: " },
      { type: "section", text: "Fees and Payment" },
      ...paragraphs.slice(4, 6),
      { type: "field", label: "Total fee: " },
      { type: "section", text: "Acceptance" },
      ...paragraphs.slice(6, 8),
      { type: "section", text: "Governing Law" },
      ...paragraphs.slice(8, 10),
      { type: "field", label: "Governing law: " },
      {
        type: "signatures",
        signers: [
          { label: "Provider", order: 1 },
          { label: "Client", order: 2 },
        ],
      },
    ],
    ...overrides,
  };
  return JSON.stringify(body);
}

describe("weekly template FreeTemplate-parity validation", () => {
  it("accepts a rich multi-section draft", () => {
    const draft = parseAndValidateDraft(richDraftJson(), baseTopic);
    expect(draft).not.toBeNull();
    expect(draft!.seoTitle.startsWith("Free")).toBe(true);
    expect(draft!.keyClauses.length).toBeGreaterThanOrEqual(4);
    expect(draft!.blocks.filter((b) => b.type === "section").length).toBeGreaterThanOrEqual(5);
  });

  it("rejects a thin draft missing SEO fields and sections", () => {
    const thin = JSON.stringify({
      title: "Thin NDA",
      seoTitle: "Free Thin NDA Template",
      description: "A short NDA.",
      useCase: "Use when needed.",
      definition: "An NDA.",
      keyClauses: ["Confidentiality"],
      fillInFields: ["[Name]"],
      legalSummary: "You agree.",
      chatgptPrompts: ["Fill it"],
      signerLabels: ["A", "B"],
      blocks: [
        { type: "section", text: "Terms" },
        { type: "paragraph", text: "Keep secrets." },
        {
          type: "signatures",
          signers: [
            { label: "A", order: 1 },
            { label: "B", order: 2 },
          ],
        },
      ],
    });
    expect(parseAndValidateDraft(thin, baseTopic)).toBeNull();
  });
});

describe("template PDF layout (FreeTemplate scheme)", () => {
  it("renders multi-section blocks with signature fields", async () => {
    const { pdfBytes, fields, pageCount } = await renderTemplatePdf("CREATIVE SERVICES STATEMENT OF WORK", [
      { type: "section", text: "Parties" },
      { type: "field", label: "Provider: ", blank: TEXT_BLANK },
      { type: "paragraph", text: "The parties agree to the following scope of creative services." },
      {
        type: "signatures",
        signers: [
          { label: "Provider", order: 1 },
          { label: "Client", order: 2 },
        ],
      },
    ]);
    expect(pdfBytes.byteLength).toBeGreaterThan(500);
    expect(pageCount).toBeGreaterThanOrEqual(1);
    expect(fields.filter((f) => f.type === "signature")).toHaveLength(2);
    expect(fields.filter((f) => f.type === "date")).toHaveLength(2);
  });
});

async function queuedTopicCount(d1: ReturnType<typeof makeMockEnv>["d1"]): Promise<number> {
  const row = (await d1.prepare(`SELECT COUNT(*) as n FROM template_topic_queue WHERE status = 'queued'`).first()) as {
    n: number;
  } | null;
  return Number(row?.n ?? 0);
}

describe("weekly template runtime infra", () => {
  it("seeds the queue when the table is missing (CI D1 migrations never applied)", async () => {
    const { env, d1 } = makeMockEnv();
    await d1.exec("DROP TABLE template_topic_queue");

    await ensureWeeklyTemplateInfra(env);

    expect(await queuedTopicCount(d1)).toBe(108);
    const first = (await d1
      .prepare(`SELECT slug FROM template_topic_queue WHERE status = 'queued' ORDER BY sort_order ASC LIMIT 1`)
      .first()) as { slug: string } | null;
    expect(first?.slug).toBe("residential-lease-addendum");
  });

  it("is idempotent when migration 0026 already applied", async () => {
    const { env, d1 } = makeMockEnv();
    const before = await queuedTopicCount(d1);
    expect(before).toBe(108);

    await ensureWeeklyTemplateInfra(env);
    await ensureWeeklyTemplateInfra(env);

    expect(await queuedTopicCount(d1)).toBe(108);
  });

  it("catch-up is a no-op once a weekly marketplace row exists", async () => {
    const { env, d1 } = makeMockEnv();
    const now = new Date().toISOString();
    await d1
      .prepare(
        `INSERT INTO marketplace_templates
          (id, account_id, slug, title, category, description, signer_count, page_count, fields,
           status, submitted_at, reviewed_at, origin)
         VALUES (?, NULL, ?, ?, ?, ?, 2, 1, '[]', 'approved', ?, ?, 'weekly')`
      )
      .bind("mt-weekly-1", "weekly-catchup-test", "Weekly Catchup Test", "Consulting", "A weekly row.", now, now)
      .run();

    await runWeeklyTemplateCatchUpIfEmpty(env);

    expect(await queuedTopicCount(d1)).toBe(108);
  });

  it("catch-up runs a publish batch while the weekly list is empty", async () => {
    const { env, d1 } = makeMockEnv();
    await runWeeklyTemplateCatchUpIfEmpty(env);

    const skipped = (await d1
      .prepare(`SELECT COUNT(*) as n FROM template_topic_queue WHERE status = 'skipped'`)
      .first()) as { n: number } | null;
    // Mock AI throws, so drafts are invalid and the batch is skipped rather than published.
    expect(Number(skipped?.n ?? 0)).toBe(10);
    expect(await queuedTopicCount(d1)).toBe(98);
  });
});

describe("shouldCatchUpWeeklyTemplates", () => {
  it("runs only while the weekly list is empty", () => {
    expect(shouldCatchUpWeeklyTemplates(0)).toBe(true);
    expect(shouldCatchUpWeeklyTemplates(1)).toBe(false);
    expect(shouldCatchUpWeeklyTemplates(10)).toBe(false);
  });
});

