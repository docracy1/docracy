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

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
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

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

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

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Authorization shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Authorization through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Authorization constitutes the entire understanding between the parties regarding its subject " +
          "matter and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Authorization is found invalid or unenforceable, the remaining provisions " +
          "shall continue in full force and effect.",
      },

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

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

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

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

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

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Confirmation shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Confirmation is found invalid or unenforceable, the remaining provisions " +
          "shall continue in full force and effect.",
      },

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
  {
    slug: "client-contract",
    title: "CLIENT CONTRACT",
    signerLabels: ["Business", "Client"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Business: ", blank: TEXT_BLANK },
      { type: "field", label: "Client: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Scope of Engagement" },
      {
        type: "paragraph",
        text: "The Business agrees to provide the following work or services to the Client:",
      },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Timeline" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "Expected Completion: ", blank: DATE_BLANK },

      { type: "section", text: "Payment Terms" },
      { type: "field", label: "Total Fee: ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Responsibilities" },
      {
        type: "paragraph",
        text:
          "Each party agrees to fulfill the responsibilities described above in good faith and to communicate " +
          "promptly about any changes that affect scope, timeline, or cost.",
      },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text:
          "Both parties agree to keep any non-public information shared during this engagement confidential, " +
          "both during and after the engagement.",
      },

      { type: "section", text: "Termination" },
      {
        type: "paragraph",
        text:
          "Either party may terminate this contract with written notice. Work completed and expenses incurred " +
          "up to the termination date remain payable.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Business", order: 1 },
          { label: "Client", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "service-agreement",
    title: "SERVICE AGREEMENT",
    signerLabels: ["Provider", "Client"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Provider: ", blank: TEXT_BLANK },
      { type: "field", label: "Client: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Services Provided" },
      { type: "paragraph", text: "The Provider agrees to deliver the following services:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Service Level" },
      {
        type: "paragraph",
        text: "The Provider will perform the services with reasonable skill and care, and within the schedule below.",
      },
      { type: "field", label: "Schedule / Frequency: ", blank: TEXT_BLANK },

      { type: "section", text: "Fees" },
      {
        type: "table",
        widths: [0.6, 0.4],
        headers: ["Fee Type", "Amount"],
        rows: [
          ["Setup Fee", TEXT_BLANK],
          ["Recurring Fee", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Term and Renewal" },
      {
        type: "paragraph",
        text:
          "This Agreement begins on the start date below and continues until either party gives written notice " +
          "of termination.",
      },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text: "Both parties agree to keep any non-public information shared under this Agreement confidential.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Provider", order: 1 },
          { label: "Client", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "scope-of-work",
    title: "SCOPE OF WORK",
    signerLabels: ["Client", "Contractor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Client: ", blank: TEXT_BLANK },
      { type: "field", label: "Contractor: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Project Overview" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Deliverables" },
      {
        type: "paragraph",
        text: "The Contractor will deliver the following, in the order and by the dates listed:",
      },
      {
        type: "table",
        widths: [0.6, 0.4],
        headers: ["Deliverable", "Due Date"],
        rows: [
          [TEXT_BLANK, DATE_BLANK],
          [TEXT_BLANK, DATE_BLANK],
          [TEXT_BLANK, DATE_BLANK],
        ],
      },

      { type: "section", text: "Out of Scope" },
      {
        type: "paragraph",
        text: "Any work not listed above is considered out of scope and will require a separate written agreement.",
      },

      { type: "section", text: "Fees" },
      { type: "field", label: "Total Fee: ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Client", order: 1 },
          { label: "Contractor", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "supplier-terms",
    title: "SUPPLIER TERMS",
    signerLabels: ["Buyer", "Supplier"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Buyer: ", blank: TEXT_BLANK },
      { type: "field", label: "Supplier: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Goods or Services Supplied" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Pricing" },
      {
        type: "table",
        widths: [0.6, 0.4],
        headers: ["Item", "Unit Price"],
        rows: [
          [TEXT_BLANK, TEXT_BLANK],
          [TEXT_BLANK, TEXT_BLANK],
        ],
      },

      { type: "section", text: "Delivery Terms" },
      { type: "field", label: "Lead Time: ", blank: TEXT_BLANK },
      { type: "field", label: "Delivery Location: ", blank: TEXT_BLANK },

      { type: "section", text: "Payment Terms" },
      { type: "field", label: "Payment Due: ", blank: TEXT_BLANK },

      { type: "section", text: "Quality and Returns" },
      {
        type: "paragraph",
        text:
          "The Supplier warrants that goods or services will match the agreed specification. Defective or " +
          "non-conforming items may be returned or credited at the Buyer's request.",
      },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text: "Both parties agree to keep pricing and any other non-public terms of this Agreement confidential.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Buyer", order: 1 },
          { label: "Supplier", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "employee-onboarding-agreement",
    title: "EMPLOYEE ONBOARDING AGREEMENT",
    signerLabels: ["Employer", "Employee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Employer: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },

      { type: "section", text: "Acknowledgements" },
      {
        type: "paragraph",
        text: "By signing below, the Employee confirms they have received and reviewed the following:",
      },
      {
        type: "table",
        widths: [0.7, 0.3],
        headers: ["Item", "Received"],
        rows: [
          ["Employee Handbook", TEXT_BLANK],
          ["Company Policies", TEXT_BLANK],
          ["Equipment / Access Credentials", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to keep confidential information encountered during employment private, both " +
          "during and after employment.",
      },

      { type: "section", text: "Code of Conduct" },
      {
        type: "paragraph",
        text: "The Employee agrees to follow the Employer's code of conduct and workplace policies as provided.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
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
    slug: "contractor-onboarding-agreement",
    title: "CONTRACTOR ONBOARDING AGREEMENT",
    signerLabels: ["Company", "Contractor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Contractor: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },

      { type: "section", text: "Engagement Details" },
      { type: "field", label: "Project / Role: ", blank: TEXT_BLANK },
      { type: "field", label: "Point of Contact: ", blank: TEXT_BLANK },

      { type: "section", text: "Acknowledgements" },
      {
        type: "paragraph",
        text: "By signing below, the Contractor confirms they have received and reviewed the following:",
      },
      {
        type: "table",
        widths: [0.7, 0.3],
        headers: ["Item", "Received"],
        rows: [
          ["System / Tool Access", TEXT_BLANK],
          ["Relevant Company Policies", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Independent Contractor Status" },
      {
        type: "paragraph",
        text:
          "The Contractor is engaged as an independent contractor, not an employee, and is responsible for their " +
          "own taxes and benefits.",
      },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text: "The Contractor agrees to keep any non-public information encountered during the engagement confidential.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Company", order: 1 },
          { label: "Contractor", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "payment-terms-agreement",
    title: "PAYMENT TERMS AGREEMENT",
    signerLabels: ["Payer", "Payee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Payer: ", blank: TEXT_BLANK },
      { type: "field", label: "Payee: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Amount Owed" },
      { type: "field", label: "Total Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "For: ", blank: TEXT_BLANK },

      { type: "section", text: "Payment Schedule" },
      { type: "field", label: "Due Date: ", blank: DATE_BLANK },
      { type: "field", label: "Payment Method: ", blank: TEXT_BLANK },

      { type: "section", text: "Late Payment" },
      {
        type: "paragraph",
        text:
          "If payment is not received by the due date above, the Payee may charge reasonable late fees or " +
          "interest as allowed by law, and may pursue collection of the amount owed.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Payer", order: 1 },
          { label: "Payee", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "installment-agreement",
    title: "INSTALLMENT AGREEMENT",
    signerLabels: ["Debtor", "Creditor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Debtor: ", blank: TEXT_BLANK },
      { type: "field", label: "Creditor: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Total Amount Owed" },
      { type: "field", label: "Total Amount: ", blank: TEXT_BLANK },

      { type: "section", text: "Installment Schedule" },
      {
        type: "table",
        widths: [0.3, 0.35, 0.35],
        headers: ["Installment #", "Amount", "Due Date"],
        rows: [
          ["1", TEXT_BLANK, DATE_BLANK],
          ["2", TEXT_BLANK, DATE_BLANK],
          ["3", TEXT_BLANK, DATE_BLANK],
        ],
      },

      { type: "section", text: "Missed Payments" },
      {
        type: "paragraph",
        text:
          "If any installment is not paid within the agreed grace period, the Creditor may declare the full " +
          "remaining balance due immediately.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Debtor", order: 1 },
          { label: "Creditor", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "privacy-acknowledgement",
    title: "PRIVACY ACKNOWLEDGEMENT",
    signerLabels: ["Individual"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Individual: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Acknowledgement" },
      {
        type: "paragraph",
        text:
          "The Individual acknowledges that they have received, read, and understood the Company's privacy " +
          "policy describing what personal data is collected, how it is used, and how it is protected.",
      },

      { type: "section", text: "Consent" },
      {
        type: "paragraph",
        text:
          "The Individual consents to the collection and use of their personal data as described in the privacy " +
          "policy referenced above.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Acknowledgement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Acknowledgement is found invalid or unenforceable, the remaining provisions " +
          "shall continue in full force and effect.",
      },

      { type: "section", text: "Signature" },
      {
        type: "signatures",
        signers: [{ label: "Individual", order: 1 }],
      },
    ],
  },
  {
    slug: "data-processing-agreement",
    title: "DATA PROCESSING AGREEMENT",
    signerLabels: ["Data Controller", "Data Processor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Data Controller: ", blank: TEXT_BLANK },
      { type: "field", label: "Data Processor: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Subject Matter and Duration" },
      {
        type: "paragraph",
        text:
          "This Agreement governs the Data Processor's processing of personal data on behalf of the Data " +
          "Controller for the duration of their underlying business relationship.",
      },

      { type: "section", text: "Nature and Purpose of Processing" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Categories of Data and Data Subjects" },
      { type: "field", label: "Data Categories: ", blank: TEXT_BLANK },
      { type: "field", label: "Data Subjects: ", blank: TEXT_BLANK },

      { type: "section", text: "Processor Obligations" },
      {
        type: "paragraph",
        text:
          "The Data Processor agrees to process personal data only on documented instructions from the Data " +
          "Controller, to maintain appropriate technical and organizational security measures, and to assist the " +
          "Data Controller in responding to data subject requests.",
      },

      { type: "section", text: "Sub-processors" },
      {
        type: "paragraph",
        text:
          "The Data Processor will not engage a sub-processor without the Data Controller's prior written " +
          "authorization, and remains liable for any sub-processor's performance.",
      },

      { type: "section", text: "Breach Notification" },
      {
        type: "paragraph",
        text:
          "The Data Processor will notify the Data Controller without undue delay after becoming aware of a " +
          "personal data breach.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      {
        type: "signatures",
        signers: [
          { label: "Data Controller", order: 1 },
          { label: "Data Processor", order: 2 },
        ],
      },
    ],
  },
  {
    slug: "promissory-note",
    title: "PROMISSORY NOTE",
    signerLabels: ["Borrower"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Lender: ", blank: TEXT_BLANK },
      { type: "field", label: "Borrower: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Loan Amount" },
      { type: "field", label: "Principal Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "Date of Loan: ", blank: DATE_BLANK },

      { type: "section", text: "Interest and Repayment" },
      { type: "field", label: "Interest Rate: ", blank: TEXT_BLANK },
      { type: "field", label: "Repayment Schedule: ", blank: TEXT_BLANK },
      { type: "field", label: "Final Due Date: ", blank: DATE_BLANK },

      { type: "section", text: "Default" },
      {
        type: "paragraph",
        text:
          "If the Borrower fails to make a payment when due and does not cure the default within a reasonable " +
          "cure period after written notice, the entire remaining balance becomes immediately due and payable, " +
          "and the Lender may pursue any remedy available by law.",
      },

      { type: "section", text: "Prepayment" },
      { type: "paragraph", text: "The Borrower may prepay all or part of the outstanding balance at any time without penalty." },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Note shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Note through good-faith " +
          "negotiation. If unresolved within 30 days, either party may pursue mediation or binding arbitration " +
          "before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Note constitutes the entire understanding between the parties regarding its subject matter and " +
          "supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Note is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signature" },
      { type: "signatures", signers: [{ label: "Borrower", order: 1 }] },
    ],
  },
  {
    slug: "llc-operating-agreement",
    title: "LLC OPERATING AGREEMENT",
    signerLabels: ["Member A", "Member B"],
    blocks: [
      { type: "section", text: "Company Formation" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Principal Address: ", blank: TEXT_BLANK },
      { type: "field", label: "State of Formation: ", blank: TEXT_BLANK },

      { type: "section", text: "Members and Ownership" },
      {
        type: "table",
        widths: [0.5, 0.25, 0.25],
        headers: ["Member", "Capital Contribution", "Ownership %"],
        rows: [
          [TEXT_BLANK, TEXT_BLANK, TEXT_BLANK],
          [TEXT_BLANK, TEXT_BLANK, TEXT_BLANK],
        ],
      },

      { type: "section", text: "Management" },
      {
        type: "paragraph",
        text:
          "The Company will be member-managed. Decisions in the ordinary course of business may be made by a " +
          "majority of the Members; major decisions (sale of the Company, taking on debt above a threshold the " +
          "Members agree on, admitting a new Member) require unanimous consent.",
      },

      { type: "section", text: "Profits, Losses, and Distributions" },
      {
        type: "paragraph",
        text:
          "Profits and losses are allocated to each Member in proportion to their ownership percentage above. " +
          "Distributions are made at times and in amounts the Members agree by majority vote.",
      },

      { type: "section", text: "Transfer of Membership Interest" },
      {
        type: "paragraph",
        text: "A Member may not transfer their membership interest without the prior written consent of the other Members.",
      },

      { type: "section", text: "Dissolution" },
      {
        type: "paragraph",
        text: "The Company dissolves upon unanimous written agreement of the Members or as otherwise required by law.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Member A", order: 1 }, { label: "Member B", order: 2 }] },
    ],
  },
  {
    slug: "sublease-agreement",
    title: "SUBLEASE AGREEMENT",
    signerLabels: ["Sublessor", "Subtenant"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Sublessor (Original Tenant): ", blank: TEXT_BLANK },
      { type: "field", label: "Subtenant: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Property" },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Sublease Term" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "End Date: ", blank: DATE_BLANK },
      {
        type: "paragraph",
        text: "This sublease may not extend beyond the term of the Sublessor's original lease with the property owner.",
      },

      { type: "section", text: "Rent and Deposit" },
      {
        type: "table",
        widths: [0.5, 0.5],
        headers: ["Item", "Amount"],
        rows: [
          ["Monthly Rent", TEXT_BLANK],
          ["Security Deposit", TEXT_BLANK],
          ["Payment Due Date", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Landlord Consent" },
      {
        type: "paragraph",
        text:
          "The Sublessor confirms that this sublease is permitted under the original lease, or that the property " +
          "owner has separately consented to it in writing.",
      },

      { type: "section", text: "Condition and Responsibilities" },
      {
        type: "paragraph",
        text:
          "The Subtenant agrees to follow all terms of the original lease that apply to occupants and to return " +
          "the property in the same condition, except for normal wear.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Sublessor", order: 1 }, { label: "Subtenant", order: 2 }] },
    ],
  },
  {
    slug: "liability-waiver",
    title: "LIABILITY WAIVER",
    signerLabels: ["Participant"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Organization: ", blank: TEXT_BLANK },
      { type: "field", label: "Participant: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Activity" },
      { type: "paragraph", text: "Description of activity, event, or service:" },
      { type: "field", label: "", blank: TEXT_BLANK },
      { type: "field", label: "Date of Activity: ", blank: DATE_BLANK },

      { type: "section", text: "Assumption of Risk" },
      {
        type: "paragraph",
        text:
          "The Participant understands that the activity described above carries inherent risks, including the " +
          "risk of property damage, personal injury, or death, and voluntarily assumes those risks.",
      },

      { type: "section", text: "Release of Liability" },
      {
        type: "paragraph",
        text:
          "In exchange for being permitted to participate, the Participant releases the Organization, its owners, " +
          "employees, and agents from any claims, liability, or damages arising from participation, except for " +
          "claims arising from the Organization's gross negligence or willful misconduct.",
      },

      { type: "section", text: "Medical Treatment" },
      {
        type: "paragraph",
        text:
          "The Participant authorizes the Organization to obtain emergency medical treatment on their behalf if " +
          "needed, at the Participant's expense.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Waiver shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Waiver through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Waiver constitutes the entire understanding between the parties regarding its subject matter and " +
          "supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Waiver is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signature" },
      { type: "signatures", signers: [{ label: "Participant", order: 1 }] },
    ],
  },
  {
    slug: "roommate-agreement",
    title: "ROOMMATE AGREEMENT",
    signerLabels: ["Roommate A", "Roommate B"],
    blocks: [
      { type: "section", text: "Parties and Property" },
      { type: "field", label: "Roommate A: ", blank: TEXT_BLANK },
      { type: "field", label: "Roommate B: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Term" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "End Date: ", blank: DATE_BLANK },

      { type: "section", text: "Rent and Expenses" },
      {
        type: "table",
        widths: [0.5, 0.25, 0.25],
        headers: ["Expense", "Roommate A Share", "Roommate B Share"],
        rows: [
          ["Rent", TEXT_BLANK, TEXT_BLANK],
          ["Utilities", TEXT_BLANK, TEXT_BLANK],
          ["Other (internet, etc.)", TEXT_BLANK, TEXT_BLANK],
        ],
      },

      { type: "section", text: "House Rules" },
      {
        type: "paragraph",
        text:
          "Both roommates agree to keep shared spaces reasonably clean, give advance notice before having " +
          "overnight guests, and resolve disagreements about noise, chores, or shared items directly and in good faith.",
      },

      { type: "section", text: "Moving Out" },
      {
        type: "paragraph",
        text: "A roommate who intends to move out before the end date above will give the other roommate at least 30 days' written notice.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Roommate A", order: 1 }, { label: "Roommate B", order: 2 }] },
    ],
  },
  {
    slug: "cash-receipt",
    title: "CASH RECEIPT",
    signerLabels: ["Recipient"],
    blocks: [
      { type: "section", text: "Payment Details" },
      { type: "field", label: "Received From: ", blank: TEXT_BLANK },
      { type: "field", label: "Received By: ", blank: TEXT_BLANK },
      { type: "field", label: "Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "Date Received: ", blank: DATE_BLANK },
      { type: "field", label: "Payment Method: ", blank: TEXT_BLANK },

      { type: "section", text: "For" },
      { type: "paragraph", text: "This payment is for:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Balance" },
      { type: "field", label: "Remaining Balance (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Acknowledgement" },
      { type: "paragraph", text: "This receipt confirms that the payment described above was received in the amount stated." },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Receipt shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Receipt is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signature" },
      { type: "signatures", signers: [{ label: "Recipient", order: 1 }] },
    ],
  },
  {
    slug: "construction-contract",
    title: "CONSTRUCTION CONTRACT",
    signerLabels: ["Owner", "Contractor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Owner: ", blank: TEXT_BLANK },
      { type: "field", label: "Contractor: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Project Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Scope of Work" },
      { type: "paragraph", text: "Description of the work to be performed:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Schedule" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "Estimated Completion: ", blank: DATE_BLANK },

      { type: "section", text: "Contract Price and Payment" },
      {
        type: "table",
        widths: [0.6, 0.4],
        headers: ["Payment Milestone", "Amount"],
        rows: [
          ["Deposit (on signing)", TEXT_BLANK],
          ["Progress Payment", TEXT_BLANK],
          ["Final Payment (on completion)", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Change Orders" },
      {
        type: "paragraph",
        text:
          "Any change to the scope, schedule, or price described above must be agreed in writing by both parties " +
          "before the additional work begins.",
      },

      { type: "section", text: "Warranty" },
      {
        type: "paragraph",
        text:
          "The Contractor warrants that the work will be performed in a workmanlike manner and will correct any " +
          "defects in materials or workmanship reported within a reasonable time after completion.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Owner", order: 1 }, { label: "Contractor", order: 2 }] },
    ],
  },
  {
    slug: "cease-and-desist-letter",
    title: "CEASE AND DESIST LETTER",
    signerLabels: ["Sender"],
    blocks: [
      { type: "section", text: "From" },
      { type: "field", label: "Sender: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "To" },
      { type: "field", label: "Recipient: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Conduct at Issue" },
      { type: "paragraph", text: "Description of the conduct the Sender demands the Recipient stop:" },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Demand" },
      {
        type: "paragraph",
        text:
          "The Sender demands that the Recipient immediately cease and desist from the conduct described above, " +
          "and confirm in writing within the deadline below that they will do so.",
      },
      { type: "field", label: "Response Deadline: ", blank: DATE_BLANK },

      { type: "section", text: "Reservation of Rights" },
      {
        type: "paragraph",
        text:
          "If the Recipient does not comply, the Sender reserves the right to pursue all available legal remedies, " +
          "including seeking damages and injunctive relief, without further notice.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This letter, and any dispute concerning the conduct described above, shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signature" },
      { type: "signatures", signers: [{ label: "Sender", order: 1 }] },
    ],
  },
  {
    slug: "letter-of-intent",
    title: "LETTER OF INTENT",
    signerLabels: ["Party A", "Party B"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Party A: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Party B: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Background and Purpose" },
      {
        type: "paragraph",
        text:
          "The parties are considering a definitive agreement for the proposed transaction described below and " +
          "wish to record their current understanding of its principal terms before that agreement is negotiated.",
      },
      { type: "field", label: "Proposed Transaction: ", blank: TEXT_BLANK },

      { type: "section", text: "Proposed Terms" },
      {
        type: "table",
        widths: [0.4, 0.6],
        headers: ["Term", "Summary"],
        rows: [
          ["Purchase Price / Consideration", TEXT_BLANK],
          ["Structure", TEXT_BLANK],
          ["Target Timeline", TEXT_BLANK],
        ],
      },

      { type: "section", text: "Non-Binding Effect" },
      {
        type: "paragraph",
        text:
          "This Letter of Intent is a statement of preliminary intent only. Except for the binding " +
          "Confidentiality and Exclusivity sections below, nothing in this Letter obligates either party to " +
          "complete the proposed transaction, and neither party may rely on it as a commitment to do so. A " +
          "binding obligation to proceed arises only upon signing a separate, definitive agreement.",
      },

      { type: "section", text: "Confidentiality (Binding)" },
      {
        type: "paragraph",
        text:
          "Each party agrees to keep this Letter's existence and terms, and any non-public information exchanged " +
          "while negotiating the proposed transaction, confidential, and to use it only to evaluate the " +
          "transaction.",
      },

      { type: "section", text: "Exclusivity (Binding)" },
      {
        type: "paragraph",
        text:
          "For the period stated below, the party identified as the transaction's target will not solicit, " +
          "negotiate, or accept a competing offer from any third party.",
      },
      { type: "field", label: "Exclusivity Period (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Expiration of this Letter" },
      {
        type: "paragraph",
        text:
          "This Letter, and each party's obligations under it, expires automatically on the date below unless " +
          "the parties have by then signed a definitive agreement or agreed in writing to extend it.",
      },
      { type: "field", label: "Expiration Date: ", blank: DATE_BLANK },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Letter shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Letter, including its " +
          "binding Confidentiality and Exclusivity provisions, through good-faith negotiation. If unresolved " +
          "within 30 days, either party may pursue mediation or binding arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "As to the binding provisions above, this Letter constitutes the entire understanding between the " +
          "parties regarding its subject matter and supersedes all prior discussions, agreements, or " +
          "representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Letter is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Party A", order: 1 }, { label: "Party B", order: 2 }] },
    ],
  },
  {
    slug: "bill-of-sale",
    title: "BILL OF SALE",
    signerLabels: ["Seller", "Buyer"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Seller: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Buyer: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Description of Item(s)" },
      {
        type: "paragraph",
        text: "The Seller sells, transfers, and delivers to the Buyer full ownership of the following item(s):",
      },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Sale Price" },
      { type: "field", label: "Sale Price: ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Method: ", blank: TEXT_BLANK },
      { type: "field", label: "Date of Sale: ", blank: DATE_BLANK },

      { type: "section", text: "As-Is, No Warranty" },
      {
        type: "paragraph",
        text:
          "Except for the warranty of title below, the item(s) are sold \"as-is, where-is,\" with no warranty of " +
          "any kind, express or implied, including as to condition, merchantability, or fitness for a particular " +
          "purpose. The Buyer accepts the item(s) after their own inspection or opportunity to inspect.",
      },

      { type: "section", text: "Seller's Warranty of Title" },
      {
        type: "paragraph",
        text:
          "The Seller warrants that they are the lawful owner of the item(s), that the item(s) are free of all " +
          "liens, encumbrances, and claims of any third party, and that the Seller has full right and authority " +
          "to sell and transfer the item(s) to the Buyer.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Bill of Sale shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Bill of Sale constitutes the entire understanding between the parties regarding the sale of the " +
          "item(s) described above and supersedes all prior discussions, agreements, or representations, whether " +
          "written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Bill of Sale is found invalid or unenforceable, the remaining provisions " +
          "shall continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Seller", order: 1 }, { label: "Buyer", order: 2 }] },
    ],
  },
  {
    slug: "loan-agreement",
    title: "LOAN AGREEMENT",
    signerLabels: ["Lender", "Borrower"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Lender: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Borrower: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Loan Amount" },
      { type: "field", label: "Principal Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "Date Funds Disbursed: ", blank: DATE_BLANK },

      { type: "section", text: "Interest Rate" },
      { type: "field", label: "Annual Interest Rate: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "Interest accrues on the outstanding principal balance from the date of disbursement until repaid in full.",
      },

      { type: "section", text: "Repayment Terms" },
      { type: "field", label: "Repayment Schedule: ", blank: TEXT_BLANK },
      { type: "field", label: "Final Due Date: ", blank: DATE_BLANK },

      { type: "section", text: "Collateral" },
      { type: "paragraph", text: "This loan is (check one and describe any collateral securing it):" },
      { type: "field", label: "Secured / Unsecured — Collateral (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Default and Acceleration" },
      {
        type: "paragraph",
        text:
          "If the Borrower fails to make any payment when due and does not cure the default within a reasonable " +
          "cure period after written notice from the Lender, the Lender may declare the entire outstanding " +
          "principal balance, together with accrued interest, immediately due and payable, and may pursue any " +
          "remedy available by law, including against any collateral securing this loan.",
      },

      { type: "section", text: "Prepayment" },
      {
        type: "paragraph",
        text:
          "The Borrower may prepay all or part of the outstanding balance at any time without penalty. " +
          "Prepayments are applied first to accrued interest, then to outstanding principal.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement constitutes the entire understanding between the parties regarding its subject matter " +
          "and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Agreement is found invalid or unenforceable, the remaining provisions shall " +
          "continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Lender", order: 1 }, { label: "Borrower", order: 2 }] },
    ],
  },
  {
    slug: "power-of-attorney",
    title: "POWER OF ATTORNEY",
    signerLabels: ["Principal", "Agent (Attorney-in-Fact)"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Principal: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Agent (Attorney-in-Fact): ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Grant of Authority" },
      {
        type: "paragraph",
        text:
          "The Principal appoints the Agent as their attorney-in-fact, to act in the Principal's name and on the " +
          "Principal's behalf as described in the Scope of Authority below.",
      },

      { type: "section", text: "Scope of Authority" },
      {
        type: "paragraph",
        text:
          "The Agent is authorized to act for the Principal in the following matters — for example, financial " +
          "accounts or real estate transactions — or as a general power covering all lawful acts the Principal " +
          "could perform personally:",
      },
      { type: "field", label: "", blank: TEXT_BLANK },

      { type: "section", text: "Effective Date" },
      { type: "field", label: "This Power of Attorney takes effect on: ", blank: DATE_BLANK },

      { type: "section", text: "Durability" },
      {
        type: "paragraph",
        text:
          "A durable power of attorney remains in effect if the Principal becomes incapacitated; a non-durable " +
          "power of attorney ends at that point.",
      },
      { type: "field", label: "Is this Power of Attorney durable? (Yes/No): ", blank: TEXT_BLANK },

      { type: "section", text: "Revocation" },
      {
        type: "paragraph",
        text:
          "The Principal may revoke this Power of Attorney at any time by delivering written notice to the Agent " +
          "and to any third party relying on it. It also ends automatically upon the Principal's death.",
      },

      { type: "section", text: "State Requirements — Notarization and Witnessing" },
      {
        type: "paragraph",
        text:
          "Many states require a power of attorney to be notarized, witnessed, or both before it is legally " +
          "valid and before banks, hospitals, or government agencies will honor it. Requirements vary by state " +
          "and by the type of authority granted — real estate and healthcare powers often carry stricter rules " +
          "than a general financial power. Confirm the notarization and witnessing requirements that apply where " +
          "the Principal lives and where the Agent will use this document, and arrange for notarization and/or " +
          "witnesses accordingly before relying on it. This document alone, without the signing formalities your " +
          "state requires, may not be sufficient to grant valid legal authority.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Power of Attorney shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Power of Attorney through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Power of Attorney constitutes the entire understanding between the parties regarding its subject " +
          "matter and supersedes all prior discussions, agreements, or representations, whether written or oral.",
      },

      { type: "section", text: "Severability" },
      {
        type: "paragraph",
        text:
          "If any provision of this Power of Attorney is found invalid or unenforceable, the remaining " +
          "provisions shall continue in full force and effect.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Principal", order: 1 }, { label: "Agent", order: 2 }] },
    ],
  },
  {
    slug: "last-will-and-testament",
    title: "LAST WILL AND TESTAMENT",
    signerLabels: ["Testator", "Witness"],
    blocks: [
      { type: "section", text: "Declaration" },
      { type: "field", label: "I, ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "being of sound mind and legal age, declare this to be my Last Will and Testament, revoking all prior " +
          "wills and codicils I have previously made.",
      },

      { type: "section", text: "Revocation of Prior Wills" },
      {
        type: "paragraph",
        text: "I revoke all prior wills and codicils made by me at any time before this Will.",
      },

      { type: "section", text: "Appointment of Executor" },
      { type: "paragraph", text: "I appoint the following person as Executor of this Will:" },
      { type: "field", label: "Executor: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "If this Executor is unable or unwilling to serve, I appoint the following person as alternate " +
          "Executor:",
      },
      { type: "field", label: "Alternate Executor: ", blank: TEXT_BLANK },

      { type: "section", text: "Guardian for Minor Children" },
      {
        type: "paragraph",
        text:
          "If I have minor children at the time of my death, I appoint the following person as their guardian:",
      },
      { type: "field", label: "Guardian: ", blank: TEXT_BLANK },

      { type: "section", text: "Distribution of Property" },
      {
        type: "paragraph",
        text:
          "I direct that my property be distributed as follows, with any property not specifically listed below " +
          "distributed as part of my residuary estate:",
      },
      { type: "field", label: "Specific Bequest 1: ", blank: TEXT_BLANK },
      { type: "field", label: "Specific Bequest 2: ", blank: TEXT_BLANK },

      { type: "section", text: "Residuary Estate" },
      {
        type: "paragraph",
        text:
          "I give the remainder of my estate, after payment of debts, taxes, and expenses, to the following " +
          "person(s) or organization(s):",
      },
      { type: "field", label: "Residuary Beneficiary: ", blank: TEXT_BLANK },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Will shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Witness Attestation and State Requirements" },
      {
        type: "paragraph",
        text:
          "For this Will to be valid, it must be signed following the formalities your state requires — most " +
          "states require it to be signed in the presence of at least two witnesses who are not beneficiaries, " +
          "and some allow or require a self-proving affidavit signed before a notary. This template captures a " +
          "testator and a single witness signature; confirm your state's exact witness count and notarization " +
          "requirements and add additional witness signature lines before relying on this Will, or have an " +
          "attorney licensed in your state review it. An improperly witnessed will may be invalid.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Testator", order: 1 }, { label: "Witness", order: 2 }] },
    ],
  },
  {
    slug: "restricted-stock-purchase-agreement",
    title: "RESTRICTED STOCK PURCHASE AGREEMENT",
    signerLabels: ["Company", "Purchaser"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Purchaser: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Purchase of Shares" },
      {
        type: "paragraph",
        text: "The Company agrees to sell, and the Purchaser agrees to purchase, the following shares:",
      },
      { type: "field", label: "Number of Shares: ", blank: TEXT_BLANK },
      { type: "field", label: "Class of Stock: ", blank: TEXT_BLANK },
      { type: "field", label: "Purchase Price per Share: ", blank: TEXT_BLANK },

      { type: "section", text: "Vesting Schedule" },
      {
        type: "paragraph",
        text:
          "The shares are subject to vesting. Unless stated otherwise below, unvested shares remain subject to " +
          "the Company's repurchase right described in this Agreement.",
      },
      { type: "field", label: "Vesting Commencement Date: ", blank: DATE_BLANK },
      { type: "field", label: "Vesting Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Company Repurchase Right" },
      {
        type: "paragraph",
        text:
          "If the Purchaser's service with the Company ends before all shares have vested, the Company has the " +
          "right, but not the obligation, to repurchase any unvested shares at the original purchase price paid " +
          "for those shares.",
      },

      { type: "section", text: "Restrictions on Transfer" },
      {
        type: "paragraph",
        text:
          "The Purchaser may not sell, transfer, pledge, or otherwise dispose of any unvested shares, or any " +
          "vested shares still subject to a right of first refusal under the Company's governing documents, " +
          "without the Company's prior written consent.",
      },

      { type: "section", text: "Representations" },
      {
        type: "paragraph",
        text:
          "The Purchaser represents that the shares are being purchased for their own account, for investment " +
          "purposes, and not with a view toward resale or distribution, and acknowledges that the shares have " +
          "not been registered under applicable securities laws.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Entire Agreement" },
      {
        type: "paragraph",
        text:
          "This Agreement, together with the Company's governing documents, constitutes the entire understanding " +
          "between the parties regarding the shares and supersedes all prior discussions or agreements on the " +
          "subject.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Purchaser", order: 2 }] },
    ],
  },
  {
    slug: "stock-option-grant-notice",
    title: "STOCK OPTION GRANT NOTICE",
    signerLabels: ["Company", "Optionee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Optionee: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Grant of Option" },
      {
        type: "paragraph",
        text:
          "The Company grants the Optionee an option to purchase shares of the Company's stock, subject to the " +
          "terms below and the Company's equity incentive plan, if any.",
      },
      { type: "field", label: "Number of Shares: ", blank: TEXT_BLANK },
      { type: "field", label: "Exercise Price per Share: ", blank: TEXT_BLANK },
      { type: "field", label: "Type of Option (ISO / NSO): ", blank: TEXT_BLANK },

      { type: "section", text: "Vesting Schedule" },
      { type: "field", label: "Vesting Commencement Date: ", blank: DATE_BLANK },
      { type: "field", label: "Vesting Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Expiration" },
      {
        type: "paragraph",
        text:
          "This option expires on the earlier of the expiration date stated below, or a shorter period following " +
          "termination of the Optionee's service, as set out in the Company's equity incentive plan.",
      },
      { type: "field", label: "Expiration Date: ", blank: DATE_BLANK },

      { type: "section", text: "Termination of Service" },
      {
        type: "paragraph",
        text:
          "Unvested shares are forfeited immediately if the Optionee's service with the Company ends for any " +
          "reason, unless the Company's equity incentive plan or a separate written agreement states otherwise.",
      },

      { type: "section", text: "Tax Consequences" },
      {
        type: "paragraph",
        text:
          "The Optionee acknowledges that the tax treatment of this option depends on its type (ISO or NSO), the " +
          "timing of exercise, and applicable law, and that the Company is not providing tax advice. The Optionee " +
          "should consult their own tax advisor, including about whether an early-exercise 83(b) election may " +
          "apply.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Grant Notice shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Optionee", order: 2 }] },
    ],
  },
  {
    slug: "parking-space-lease-agreement",
    title: "PARKING SPACE LEASE AGREEMENT",
    signerLabels: ["Landlord", "Tenant"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Landlord: ", blank: TEXT_BLANK },
      { type: "field", label: "Tenant: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Parking Space" },
      { type: "field", label: "Property Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Space Number / Description: ", blank: TEXT_BLANK },

      { type: "section", text: "Term" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "End Date (or Month-to-Month): ", blank: TEXT_BLANK },

      { type: "section", text: "Rent" },
      { type: "field", label: "Monthly Rent: ", blank: TEXT_BLANK },
      { type: "field", label: "Due Date Each Month: ", blank: TEXT_BLANK },

      { type: "section", text: "Vehicle Information" },
      { type: "field", label: "Make/Model: ", blank: TEXT_BLANK },
      { type: "field", label: "License Plate: ", blank: TEXT_BLANK },

      { type: "section", text: "Use of Space" },
      {
        type: "paragraph",
        text:
          "The Tenant may park only the vehicle described above in the assigned space, and may not sublease, " +
          "store other items in, or block access to the space.",
      },

      { type: "section", text: "Liability" },
      {
        type: "paragraph",
        text:
          "The Landlord is not responsible for damage to, or theft from, the Tenant's vehicle while parked in the " +
          "space, except where caused by the Landlord's own negligence.",
      },

      { type: "section", text: "Termination" },
      {
        type: "paragraph",
        text:
          "Either party may terminate this Agreement with written notice as required by local law or as stated " +
          "in the Term section above.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Landlord", order: 1 }, { label: "Tenant", order: 2 }] },
    ],
  },
  {
    slug: "month-to-month-rental-agreement",
    title: "MONTH-TO-MONTH RENTAL AGREEMENT",
    signerLabels: ["Landlord", "Tenant"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Landlord: ", blank: TEXT_BLANK },
      { type: "field", label: "Tenant: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Premises" },
      { type: "field", label: "Property Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text:
          "This tenancy begins on the date below and continues month-to-month until either party ends it with " +
          "written notice, as required by local law.",
      },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "Notice Period Required to End Tenancy: ", blank: TEXT_BLANK },

      { type: "section", text: "Rent" },
      { type: "field", label: "Monthly Rent: ", blank: TEXT_BLANK },
      { type: "field", label: "Due Date Each Month: ", blank: TEXT_BLANK },
      { type: "field", label: "Late Fee (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Security Deposit" },
      { type: "field", label: "Deposit Amount: ", blank: TEXT_BLANK },

      { type: "section", text: "Utilities" },
      { type: "field", label: "Utilities Included in Rent: ", blank: TEXT_BLANK },
      { type: "field", label: "Utilities Paid by Tenant: ", blank: TEXT_BLANK },

      { type: "section", text: "Maintenance" },
      {
        type: "paragraph",
        text:
          "The Landlord is responsible for maintaining the property in a habitable condition. The Tenant agrees " +
          "to report needed repairs promptly and to avoid causing damage beyond normal wear and tear.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation before resorting to litigation or, where applicable, the local landlord-tenant " +
          "resolution process.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Landlord", order: 1 }, { label: "Tenant", order: 2 }] },
    ],
  },
  {
    slug: "equipment-loan-agreement",
    title: "EQUIPMENT LOAN AGREEMENT",
    signerLabels: ["Lender", "Borrower"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Lender: ", blank: TEXT_BLANK },
      { type: "field", label: "Borrower: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Description of Equipment" },
      { type: "field", label: "Equipment: ", blank: TEXT_BLANK },
      { type: "field", label: "Serial / Identifying Number: ", blank: TEXT_BLANK },
      { type: "field", label: "Estimated Value: ", blank: TEXT_BLANK },

      { type: "section", text: "Loan Period" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "Return Date: ", blank: DATE_BLANK },

      { type: "section", text: "Condition of Equipment" },
      {
        type: "paragraph",
        text:
          "The Borrower acknowledges receiving the Equipment in good working condition, except as noted here:",
      },
      { type: "field", label: "Noted Condition Issues: ", blank: TEXT_BLANK },

      { type: "section", text: "Use and Care" },
      {
        type: "paragraph",
        text:
          "The Borrower agrees to use the Equipment only for its intended purpose, to operate it safely and " +
          "properly, and not to lend, sublease, or transfer it to any third party without the Lender's written " +
          "consent.",
      },

      { type: "section", text: "Liability for Damage or Loss" },
      {
        type: "paragraph",
        text:
          "The Borrower is responsible for any damage to or loss of the Equipment while in their possession, " +
          "beyond normal wear and tear, and agrees to reimburse the Lender for repair or replacement cost.",
      },

      { type: "section", text: "Return of Equipment" },
      {
        type: "paragraph",
        text:
          "The Borrower agrees to return the Equipment by the Return Date above, in the same condition it was " +
          "received, except for normal wear and tear.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Lender", order: 1 }, { label: "Borrower", order: 2 }] },
    ],
  },
  {
    slug: "employee-non-disclosure-agreement",
    title: "EMPLOYEE NON-DISCLOSURE AGREEMENT",
    signerLabels: ["Employer", "Employee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Employer: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Definition of Confidential Information" },
      {
        type: "paragraph",
        text:
          "\"Confidential Information\" means any non-public information the Employee learns or has access to " +
          "during employment, including business plans, customer data, pricing, source code, product plans, and " +
          "other proprietary information, however it is disclosed.",
      },

      { type: "section", text: "Obligations of Employee" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to use Confidential Information only to perform their job duties, to keep it " +
          "confidential during and after employment, and not to disclose it to any third party without the " +
          "Employer's written consent.",
      },

      { type: "section", text: "Exclusions" },
      {
        type: "paragraph",
        text:
          "This Agreement does not apply to information that is already public, becomes public through no fault " +
          "of the Employee, or that the Employee is required to disclose by law, provided reasonable notice is " +
          "given to the Employer where legally permitted.",
      },

      { type: "section", text: "Duration" },
      {
        type: "paragraph",
        text:
          "The Employee's confidentiality obligations under this Agreement continue during employment and " +
          "indefinitely afterward, for as long as the information remains confidential.",
      },

      { type: "section", text: "Return of Materials" },
      {
        type: "paragraph",
        text:
          "Upon request or at the end of employment, the Employee agrees to return or destroy all materials " +
          "containing Confidential Information in their possession.",
      },

      { type: "section", text: "Remedies" },
      {
        type: "paragraph",
        text:
          "The Employee acknowledges that a breach of this Agreement could cause the Employer irreparable harm, " +
          "and that the Employer may seek injunctive relief in addition to any other available remedy.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Employer", order: 1 }, { label: "Employee", order: 2 }] },
    ],
  },
  {
    slug: "retainer-agreement",
    title: "RETAINER AGREEMENT",
    signerLabels: ["Client", "Consultant"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Client: ", blank: TEXT_BLANK },
      { type: "field", label: "Consultant: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Services" },
      {
        type: "paragraph",
        text: "The Consultant agrees to make themselves available to provide the following services on an ongoing basis:",
      },
      { type: "field", label: "Description of Services: ", blank: TEXT_BLANK },

      { type: "section", text: "Retainer Fee" },
      { type: "field", label: "Monthly Retainer Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "Hours / Scope Included: ", blank: TEXT_BLANK },
      { type: "field", label: "Rate for Work Beyond Included Scope: ", blank: TEXT_BLANK },

      { type: "section", text: "Term and Renewal" },
      {
        type: "paragraph",
        text:
          "This Agreement begins on the start date below and renews automatically each month unless either " +
          "party gives written notice to end it, as described in Termination below.",
      },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },

      { type: "section", text: "Termination" },
      { type: "field", label: "Notice Period to Terminate: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "Fees already paid for the current period are non-refundable, unless stated otherwise here.",
      },

      { type: "section", text: "Independent Contractor Status" },
      {
        type: "paragraph",
        text:
          "The Consultant is an independent contractor, not an employee of the Client, and is responsible for " +
          "their own taxes, insurance, and benefits.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Client", order: 1 }, { label: "Consultant", order: 2 }] },
    ],
  },
  {
    slug: "corporate-resolution",
    title: "CORPORATE RESOLUTION",
    signerLabels: ["President", "Secretary"],
    blocks: [
      { type: "section", text: "Company Information" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "State of Incorporation: ", blank: TEXT_BLANK },

      { type: "section", text: "Meeting or Written Consent" },
      {
        type: "paragraph",
        text:
          "The undersigned, being the directors (or the sole director) of the Company, certify that the " +
          "following resolutions were duly adopted, either at a meeting held on the date below or by unanimous " +
          "written consent in lieu of a meeting:",
      },
      { type: "field", label: "Date: ", blank: DATE_BLANK },

      { type: "section", text: "Resolutions Adopted" },
      { type: "field", label: "Resolution 1: ", blank: TEXT_BLANK },
      { type: "field", label: "Resolution 2: ", blank: TEXT_BLANK },
      { type: "field", label: "Resolution 3 (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Effect" },
      {
        type: "paragraph",
        text:
          "These resolutions are effective as of the date above and remain in effect until amended or revoked by " +
          "a subsequent resolution of the Company's directors.",
      },

      { type: "section", text: "Certification" },
      {
        type: "paragraph",
        text:
          "The Secretary certifies that the foregoing is a true and accurate record of the resolutions adopted " +
          "by the Company's directors.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Resolution shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "President", order: 1 }, { label: "Secretary", order: 2 }] },
    ],
  },
  {
    slug: "copyright-assignment-agreement",
    title: "COPYRIGHT ASSIGNMENT AGREEMENT",
    signerLabels: ["Assignor", "Assignee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Assignor: ", blank: TEXT_BLANK },
      { type: "field", label: "Assignee: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Description of Work" },
      {
        type: "paragraph",
        text: "This Agreement covers the assignment of all copyright interest in the following work:",
      },
      { type: "field", label: "Description of Work: ", blank: TEXT_BLANK },
      { type: "field", label: "Date of Creation: ", blank: DATE_BLANK },

      { type: "section", text: "Assignment of Rights" },
      {
        type: "paragraph",
        text:
          "The Assignor irrevocably assigns to the Assignee all right, title, and interest in the copyright to " +
          "the Work described above, including the exclusive rights to reproduce, distribute, display, perform, " +
          "and create derivative works from it, throughout the world and for the full duration of the copyright.",
      },

      { type: "section", text: "Consideration" },
      { type: "field", label: "Payment / Consideration: ", blank: TEXT_BLANK },

      { type: "section", text: "Moral Rights" },
      {
        type: "paragraph",
        text:
          "To the extent permitted by applicable law, the Assignor waives any moral rights in the Work. In " +
          "jurisdictions where moral rights cannot be waived, the Assignor agrees not to assert them against the " +
          "Assignee's use of the Work.",
      },

      { type: "section", text: "Representations" },
      {
        type: "paragraph",
        text:
          "The Assignor represents that they are the sole author and owner of the Work, that it is original, and " +
          "that it does not infringe any third party's rights.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Assignor", order: 1 }, { label: "Assignee", order: 2 }] },
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
