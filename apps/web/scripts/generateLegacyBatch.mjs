#!/usr/bin/env node
/**
 * Generate PDFs + freeTemplatesLegacyBatch.ts from legacyBatch/catalog.json.
 * Run from apps/web: node scripts/generateLegacyBatch.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { blocksForTemplate } from "./legacyBatch/archetypes.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname, "legacyBatch/catalog.json"), "utf8"));
const outDir = path.join(__dirname, "..", "public", "free-templates");

// --- Minimal copy of generateFreeTemplatePdfs layout engine ---
const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN_TOP = 48;
const MARGIN_BOTTOM = 48;
const MARGIN_LEFT = 64;
const MARGIN_RIGHT = 64;
const CONTENT_W = PAGE_W - MARGIN_LEFT - MARGIN_RIGHT;
const CONTENT_TOP_Y = PAGE_H - MARGIN_TOP;
const TITLE_SIZE = 21;
const SECTION_SIZE = 15;
const BODY_SIZE = 11.5;
const TABLE_SIZE = 11;
const SECTION_GAP = 24;
const PARAGRAPH_GAP = 12;
const TABLE_GAP = 16;
const SIGNATURE_GAP = 32;
const INK = rgb(0.1, 0.1, 0.12);
const MUTED = rgb(0.45, 0.45, 0.48);
const RULE = rgb(0.82, 0.82, 0.85);
const SIG_W = 0.26 * PAGE_W;
const SIG_H = 0.07 * PAGE_H;
const DATE_W = 0.16 * PAGE_W;
const DATE_H = 0.04 * PAGE_H;

function wrapText(text, font, size, maxWidth) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth || !current) current = test;
    else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

async function renderTemplate(title, blocks) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = CONTENT_TOP_Y;
  const fields = [];
  let fieldIdCounter = 0;
  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = CONTENT_TOP_Y;
  };
  const ensureSpace = (needed) => {
    if (y - needed < MARGIN_BOTTOM) newPage();
  };
  const drawText = (text, size, f, color = INK, x = MARGIN_LEFT) => {
    page.drawText(text, { x, y, size, font: f, color });
  };
  let pendingGap = SECTION_GAP;
  const applyGap = (wanted) => {
    y -= Math.max(pendingGap, wanted);
    pendingGap = 0;
  };
  const titleWidth = bold.widthOfTextAtSize(title, TITLE_SIZE);
  drawText(title, TITLE_SIZE, bold, INK, MARGIN_LEFT + (CONTENT_W - titleWidth) / 2);
  y -= TITLE_SIZE * 1.4;
  for (const block of blocks) {
    if (block.type === "section") {
      applyGap(SECTION_GAP);
      ensureSpace(SECTION_SIZE * 1.4);
      drawText(block.text, SECTION_SIZE, bold);
      y -= SECTION_SIZE * 1.4;
      pendingGap = 6;
    } else if (block.type === "paragraph") {
      applyGap(PARAGRAPH_GAP);
      for (const line of wrapText(block.text, font, BODY_SIZE, CONTENT_W)) {
        ensureSpace(BODY_SIZE * 1.4);
        drawText(line, BODY_SIZE, font);
        y -= BODY_SIZE * 1.4;
      }
      pendingGap = PARAGRAPH_GAP;
    } else if (block.type === "field") {
      applyGap(block.gapBefore ?? 4);
      ensureSpace(BODY_SIZE * 1.4);
      drawText(block.label + block.blank, BODY_SIZE, font);
      y -= BODY_SIZE * 1.4;
      pendingGap = 4;
    } else if (block.type === "signatures") {
      applyGap(SIGNATURE_GAP);
      for (const signer of block.signers) {
        ensureSpace(BODY_SIZE * 1.4 + SIG_H + BODY_SIZE * 1.4 + 4 + BODY_SIZE * 1.4 + DATE_H);
        const sigLabel = `${signer.label} Signature: `;
        let lineTopY = y;
        drawText(sigLabel + "_".repeat(28), BODY_SIZE, font);
        const sigLabelWidth = font.widthOfTextAtSize(sigLabel, BODY_SIZE);
        const pageIndex = doc.getPages().indexOf(page);
        fields.push({
          id: `lb${fieldIdCounter++}`,
          signerOrder: signer.order,
          page: pageIndex,
          xFrac: (MARGIN_LEFT + sigLabelWidth) / PAGE_W,
          yFrac: (PAGE_H - lineTopY) / PAGE_H,
          wFrac: SIG_W / PAGE_W,
          hFrac: SIG_H / PAGE_H,
          type: "signature",
        });
        y -= SIG_H;
        drawText("Name: " + "_".repeat(28), BODY_SIZE, font);
        y -= BODY_SIZE * 1.4 + 4;
        const dateLabel = "Date: ";
        lineTopY = y;
        drawText(dateLabel + "____ / ____ / ______", BODY_SIZE, font);
        const dateLabelWidth = font.widthOfTextAtSize(dateLabel, BODY_SIZE);
        fields.push({
          id: `lb${fieldIdCounter++}`,
          signerOrder: signer.order,
          page: pageIndex,
          xFrac: (MARGIN_LEFT + dateLabelWidth) / PAGE_W,
          yFrac: (PAGE_H - lineTopY) / PAGE_H,
          wFrac: DATE_W / PAGE_W,
          hFrac: DATE_H / PAGE_H,
          type: "date",
        });
        y -= DATE_H + SECTION_GAP;
      }
    }
  }
  page.drawText("Docracy.io — free e-signature tool. Not legal advice.", {
    x: MARGIN_LEFT,
    y: Math.max(12, MARGIN_BOTTOM - 24),
    size: 8,
    font,
    color: MUTED,
  });
  return { pdfBytes: await doc.save(), fields };
}

function esc(s) {
  return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
}

fs.mkdirSync(outDir, { recursive: true });
const tsEntries = [];

for (const tpl of catalog) {
  const blocks = blocksForTemplate(tpl);
  const title = tpl.name.toUpperCase();
  const { pdfBytes, fields } = await renderTemplate(title, blocks);
  fs.writeFileSync(path.join(outDir, `${tpl.slug}.pdf`), pdfBytes);

  const fieldLines = fields
    .map(
      (f) =>
        `      { id: "${f.id}", signerOrder: ${f.signerOrder}, page: ${f.page}, xFrac: ${f.xFrac}, yFrac: ${f.yFrac}, wFrac: ${f.wFrac}, hFrac: ${f.hFrac}, type: "${f.type}" }`
    )
    .join(",\n");

  const optionalCategory = tpl.recurringCategory
    ? `\n    recurringCategory: "${esc(tpl.recurringCategory)}",`
    : "";

  const keyClauses = tpl.keyClauses.map((c) => `"${esc(c)}"`).join(",\n      ");
  const fillInFields = tpl.fillInFields.map((c) => `"${esc(c)}"`).join(",\n      ");
  const chatgptPrompts = tpl.chatgptPrompts.map((c) => `"${esc(c)}"`).join(",\n      ");
  const signerLabels = tpl.signerLabels.map((c) => `"${esc(c)}"`).join(", ");

  tsEntries.push(`  {
    slug: "${esc(tpl.slug)}",
    name: "${esc(tpl.name)}",
    seoTitle: "${esc(tpl.seoTitle)}",
    description:
      "${esc(tpl.description)}",
    useCase:
      "${esc(tpl.useCase)}",
    signerLabels: [${signerLabels}],
    pdfPath: "/free-templates/${esc(tpl.slug)}.pdf",
    fields: [
${fieldLines}
    ],${optionalCategory}
    definition:
      "${esc(tpl.definition)}",
    keyClauses: [
      ${keyClauses}
    ],
    fillInFields: [
      ${fillInFields}
    ],
    legalSummary:
      "${esc(tpl.legalSummary)}",
    chatgptPrompts: [
      ${chatgptPrompts}
    ],
  }`);
  console.log(`Generated ${tpl.slug} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
}

const tsOut = `import type { FreeTemplate } from "./freeTemplates";

/** Hand-curated docracy.com-history templates — generated by scripts/generateLegacyBatch.mjs */
export const LEGACY_BATCH_TEMPLATES: FreeTemplate[] = [
${tsEntries.join(",\n")}
];
`;

fs.writeFileSync(path.join(__dirname, "..", "src", "lib", "freeTemplatesLegacyBatch.ts"), tsOut);
console.log(`\nWrote ${catalog.length} templates to freeTemplatesLegacyBatch.ts`);
