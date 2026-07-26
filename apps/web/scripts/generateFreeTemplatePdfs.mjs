// Shared PDF layout engine implementing the global standard for all Docracy free templates:
//   Margins  — top 48pt, bottom 48pt, left 64pt, right 64pt
//   Spacing  — section heading 24pt, paragraph 12pt, table 16pt, signature block 32pt
//   Fonts    — title 21pt bold, section heading 15pt bold, body 11.5pt, table 11pt
//   Fields   — "____________________________" for text, "____ / ____ / ______" for date,
//              "Signature (Role): ____" always labeled per party
//
// Run with: node scripts/generateFreeTemplatePdfs.mjs
// Writes PDFs to public/free-templates/<slug>.pdf and prints the exact DocField fractions to
// paste into src/lib/freeTemplates.ts for each template (signature/date live-field positions
// depend on where the layout happens to land the signature block, which varies by body length).

import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outDir = path.join(__dirname, "..", "public", "free-templates");

// --- Global layout standard ---
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

const TEXT_BLANK = "_".repeat(28);
const DATE_BLANK = "____ / ____ / ______";

// Matches FIELD_SIZE_BY_TYPE in Prepare.tsx (0.26/0.07 signature, 0.16/0.04 date) — same fixed
// US Letter page every other template/generator in this repo uses, so a field placed here
// behaves identically to one placed anywhere else in the app.
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
    if (font.widthOfTextAtSize(test, size) <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Renders one template's block list to a fresh PDF, returning the bytes plus the live
 *  signature/date field fractions (top-left-origin, matching every field position elsewhere
 *  in the app) for whichever page/row the layout happened to land them on. */
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

  // Title — centered, bold
  const titleWidth = bold.widthOfTextAtSize(title, TITLE_SIZE);
  drawText(title, TITLE_SIZE, bold, INK, MARGIN_LEFT + (CONTENT_W - titleWidth) / 2);
  y -= TITLE_SIZE * 1.4;

  // Gaps behave like collapsing CSS margins: each block declares what it wants *before* it, and
  // the larger of "what the previous block left behind" vs "what this block asked for" wins —
  // never both added together. Without this, a section heading directly after a paragraph would
  // get paragraph's 12pt trailing gap *plus* its own 24pt, stacking to 36pt instead of the 24pt
  // the global standard actually specifies.
  let pendingGap = SECTION_GAP; // first block after the title gets the standard section gap
  const applyGap = (wanted) => {
    y -= Math.max(pendingGap, wanted);
    pendingGap = 0;
  };

  for (const block of blocks) {
    if (block.type === "section") {
      applyGap(SECTION_GAP);
      ensureSpace(SECTION_SIZE * 1.4);
      drawText(block.text, SECTION_SIZE, bold);
      y -= SECTION_SIZE * 1.4;
      pendingGap = 6; // tight to its own following content, but still collapses upward if needed
    } else if (block.type === "paragraph") {
      applyGap(PARAGRAPH_GAP);
      const lines = wrapText(block.text, font, BODY_SIZE, CONTENT_W);
      for (const line of lines) {
        ensureSpace(BODY_SIZE * 1.4);
        drawText(line, BODY_SIZE, font);
        y -= BODY_SIZE * 1.4;
      }
      pendingGap = PARAGRAPH_GAP;
    } else if (block.type === "field") {
      applyGap(block.gapBefore ?? 4);
      ensureSpace(BODY_SIZE * 1.4 + (block.live === "signature" ? SIG_H : block.live === "date" ? DATE_H : 0));
      const lineTopY = y;
      drawText(block.label + block.blank, BODY_SIZE, font);
      if (block.live) {
        const labelWidth = font.widthOfTextAtSize(block.label, BODY_SIZE);
        const w = block.live === "signature" ? SIG_W : DATE_W;
        const h = block.live === "signature" ? SIG_H : DATE_H;
        const pageIndex = doc.getPages().indexOf(page);
        fields.push({
          id: `ft${fieldIdCounter++}`,
          signerOrder: block.signerOrder,
          page: pageIndex,
          xFrac: (MARGIN_LEFT + labelWidth) / PAGE_W,
          yFrac: (PAGE_H - lineTopY) / PAGE_H,
          wFrac: w / PAGE_W,
          hFrac: h / PAGE_H,
          type: block.live,
        });
        y -= h; // reserve blank room below the printed line for the live field to render into
      } else {
        y -= BODY_SIZE * 1.4;
      }
      pendingGap = 4;
    } else if (block.type === "table") {
      applyGap(TABLE_GAP);
      const rowHeight = TABLE_SIZE * 1.4 + 12;
      ensureSpace(rowHeight * (block.rows.length + 1));
      const colWidths = block.widths.map((f) => f * CONTENT_W);
      const colX = [MARGIN_LEFT];
      for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i] + colWidths[i]);

      const drawRow = (cells, f, color) => {
        cells.forEach((cell, i) => drawText(cell, TABLE_SIZE, f, color, colX[i]));
        y -= rowHeight;
        page.drawLine({
          start: { x: MARGIN_LEFT, y: y + rowHeight - (rowHeight - TABLE_SIZE * 1.4) / 2 - TABLE_SIZE * 1.2 },
          end: { x: MARGIN_LEFT + CONTENT_W, y: y + rowHeight - (rowHeight - TABLE_SIZE * 1.4) / 2 - TABLE_SIZE * 1.2 },
          thickness: 0.75,
          color: RULE,
        });
      };
      drawRow(block.headers, bold, INK);
      for (const row of block.rows) {
        ensureSpace(rowHeight);
        drawRow(row, font, INK);
      }
      pendingGap = TABLE_GAP;
    } else if (block.type === "signatures") {
      applyGap(SIGNATURE_GAP);
      for (const signer of block.signers) {
        ensureSpace(BODY_SIZE * 1.4 + SIG_H + BODY_SIZE * 1.4 + 4 + BODY_SIZE * 1.4 + DATE_H);

        const sigLabel = `${signer.label} Signature: `;
        let lineTopY = y;
        drawText(sigLabel + TEXT_BLANK, BODY_SIZE, font);
        const sigLabelWidth = font.widthOfTextAtSize(sigLabel, BODY_SIZE);
        const pageIndex = doc.getPages().indexOf(page);
        fields.push({
          id: `ft${fieldIdCounter++}`,
          signerOrder: signer.order,
          page: pageIndex,
          xFrac: (MARGIN_LEFT + sigLabelWidth) / PAGE_W,
          yFrac: (PAGE_H - lineTopY) / PAGE_H,
          wFrac: SIG_W / PAGE_W,
          hFrac: SIG_H / PAGE_H,
          type: "signature",
        });
        y -= SIG_H;

        drawText("Name: " + TEXT_BLANK, BODY_SIZE, font);
        y -= BODY_SIZE * 1.4 + 4;

        const dateLabel = "Date: ";
        lineTopY = y;
        drawText(dateLabel + DATE_BLANK, BODY_SIZE, font);
        const dateLabelWidth = font.widthOfTextAtSize(dateLabel, BODY_SIZE);
        fields.push({
          id: `ft${fieldIdCounter++}`,
          signerOrder: signer.order,
          page: pageIndex,
          xFrac: (MARGIN_LEFT + dateLabelWidth) / PAGE_W,
          yFrac: (PAGE_H - lineTopY) / PAGE_H,
          wFrac: DATE_W / PAGE_W,
          hFrac: DATE_H / PAGE_H,
          type: "date",
        });
        y -= DATE_H;
        y -= SECTION_GAP;
      }
    }
  }

  page.drawText("Docracy.io — free e-signature tool. Not legal advice.", {
    x: MARGIN_LEFT,
    y: MARGIN_BOTTOM - 24 < 12 ? 12 : MARGIN_BOTTOM - 24,
    size: 8,
    font,
    color: MUTED,
  });

  return { pdfBytes: await doc.save(), fields };
}

// --- Template content, transcribed from the drafted PDF layouts ---
const TEMPLATES = [
  {
    slug: "employment-agreement",
    title: "EMPLOYMENT AGREEMENT",
    signerLabels: ["Employer", "Employee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Employer: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Position and Start Date" },
      { type: "paragraph", text: "The Employee is hired for the position of:" },
      { type: "field", label: "Position: ", blank: TEXT_BLANK },
      { type: "paragraph", text: "Employment begins on:" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },

      { type: "section", text: "Duties and Responsibilities" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to perform all duties associated with the position and comply with company " +
          "policies, procedures, and reasonable instructions.",
      },

      { type: "section", text: "Compensation" },
      { type: "field", label: "Salary / Rate: ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Work Schedule" },
      { type: "paragraph", text: `The Employee will work ${TEXT_BLANK} hours per week.` },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to maintain confidentiality regarding all non-public information obtained during " +
          "employment. This obligation continues after employment ends.",
      },

      { type: "section", text: "Termination" },
      {
        type: "paragraph",
        text:
          "Either party may terminate this Agreement with reasonable notice. The Employer may terminate " +
          "employment immediately for misconduct or breach of this Agreement.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Employer", order: 1 },
          { label: "Employee", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "rental-agreement",
    title: "RENTAL AGREEMENT",
    signerLabels: ["Owner", "Renter"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Owner: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Renter: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Property Description" },
      { type: "paragraph", text: "Description of rented property/item:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Rental Term" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "End Date: ", blank: DATE_BLANK },

      { type: "section", text: "Payment Terms" },
      {
        type: "table",
        widths: [0.5, 0.5],
        headers: ["Item", "Amount"],
        rows: [
          ["Rent Amount", TEXT_BLANK],
          ["Deposit", TEXT_BLANK],
          ["Payment Due Date", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Use and Responsibilities" },
      {
        type: "paragraph",
        text: "The Renter agrees to use the property responsibly and return it in the same condition, except for normal wear.",
      },

      { type: "section", text: "Damages and Liability" },
      {
        type: "paragraph",
        text: "The Renter is responsible for any damage beyond normal wear. The Owner is not liable for injuries resulting from improper use.",
      },

      { type: "section", text: "Termination" },
      { type: "paragraph", text: "This Agreement may be terminated according to the terms stated here." },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Owner", order: 1 },
          { label: "Renter", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "authorization-form",
    title: "AUTHORIZATION FORM",
    signerLabels: ["Authorizing Party", "Authorized Individual"],
    blocks: [
      { type: "section", text: "Authorizing Party" },
      { type: "field", label: "Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Authorized Individual" },
      { type: "field", label: "Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Relationship/Role: ", blank: TEXT_BLANK },

      { type: "section", text: "Scope of Authorization" },
      { type: "paragraph", text: "The authorized individual is permitted to:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Duration" },
      { type: "field", label: "Valid from: ", blank: DATE_BLANK },
      { type: "field", label: "To: ", blank: DATE_BLANK },

      { type: "section", text: "Limitations" },
      { type: "paragraph", text: "This authorization does not include:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Authorizing Party", order: 1 },
          { label: "Authorized Individual (optional)", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "purchase-order",
    title: "PURCHASE ORDER",
    signerLabels: ["Buyer", "Seller"],
    blocks: [
      { type: "section", text: "Buyer Information" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Seller Information" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Items Ordered" },
      {
        type: "table",
        widths: [0.4, 0.18, 0.2, 0.22],
        headers: ["Item Description", "Quantity", "Unit Price", "Total"],
        rows: [
          ["_".repeat(18), "_".repeat(8), "_".repeat(10), "_".repeat(8)],
          ["_".repeat(18), "_".repeat(8), "_".repeat(10), "_".repeat(8)],
          ["_".repeat(18), "_".repeat(8), "_".repeat(10), "_".repeat(8)],
        ],
      },

      { type: "section", text: "Total Cost" },
      { type: "field", label: "Total Amount Due: ", blank: TEXT_BLANK },

      { type: "section", text: "Delivery Terms" },
      { type: "field", label: "Delivery Date: ", blank: DATE_BLANK },
      { type: "field", label: "Delivery Conditions: ", blank: TEXT_BLANK },

      { type: "section", text: "Payment Terms" },
      { type: "field", label: "Payment Terms: ", blank: TEXT_BLANK },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Buyer", order: 1 },
          { label: "Seller", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "work-order",
    title: "WORK ORDER",
    signerLabels: ["Client", "Service Provider"],
    blocks: [
      { type: "section", text: "Client Information" },
      { type: "field", label: "Name/Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Service Provider Information" },
      { type: "field", label: "Name/Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Work Description" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Materials" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Estimated Cost" },
      {
        type: "table",
        widths: [0.5, 0.5],
        headers: ["Cost Type", "Amount"],
        rows: [
          ["Labor", TEXT_BLANK],
          ["Materials", TEXT_BLANK],
          ["Total Estimate", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Completion Date" },
      { type: "field", label: "Expected Completion: ", blank: DATE_BLANK },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Client", order: 1 },
          { label: "Service Provider", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "delivery-confirmation",
    title: "DELIVERY CONFIRMATION",
    signerLabels: ["Sender", "Recipient"],
    blocks: [
      { type: "section", text: "Sender Information" },
      { type: "field", label: "Name/Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Recipient Information" },
      { type: "field", label: "Name/Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Items Delivered" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Condition" },
      { type: "paragraph", text: "Condition upon delivery:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Delivery Date" },
      { type: "field", label: "", blank: DATE_BLANK },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Sender", order: 1 },
          { label: "Recipient", order: 2 },
        ],
      },
    ],
  },
];

fs.mkdirSync(outDir, { recursive: true });

for (const t of TEMPLATES) {
  const { pdfBytes, fields } = await renderTemplate(t.title, t.blocks);
  const outPath = path.join(outDir, `${t.slug}.pdf`);
  fs.writeFileSync(outPath, pdfBytes);
  console.log(`\n=== ${t.slug} ===`);
  console.log(`Wrote ${outPath} (${(pdfBytes.length / 1024).toFixed(1)} KB)`);
  console.log("fields:", JSON.stringify(fields));
}
