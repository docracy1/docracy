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
  {
    slug: "living-will-advance-directive",
    title: "LIVING WILL / ADVANCE HEALTHCARE DIRECTIVE",
    signerLabels: ["Principal", "Witness"],
    blocks: [
      { type: "section", text: "Declarant" },
      { type: "field", label: "Principal (Declarant): ", blank: TEXT_BLANK },
      { type: "field", label: "Date of Birth: ", blank: DATE_BLANK, gapBefore: 12 },

      { type: "section", text: "Statement of Intent" },
      {
        type: "paragraph",
        text:
          "I, the undersigned Principal, being of sound mind, willingly and voluntarily make this declaration to " +
          "express my wishes regarding the medical care I want, or do not want, to receive if I become unable to " +
          "communicate my own healthcare decisions — whether because of a terminal condition, permanent " +
          "unconsciousness, or another condition that leaves me unable to participate meaningfully in decisions " +
          "about my own care. This declaration states my own directions to my physicians, caregivers, and family. " +
          "It does not, by itself, appoint another person to make decisions on my behalf.",
      },

      { type: "section", text: "Life-Sustaining Treatment" },
      {
        type: "paragraph",
        text:
          "If my attending physician and at least one other qualified physician determine that I have a terminal " +
          "condition, or am permanently unconscious, and I am no longer able to make or communicate decisions " +
          "regarding my medical care, I direct that the following instructions be followed regarding the use, " +
          "continuation, or withdrawal of life-sustaining treatment, including mechanical ventilation, dialysis, " +
          "and cardiopulmonary resuscitation:",
      },
      { type: "field", label: "My Directions Regarding Life-Sustaining Treatment: ", blank: TEXT_BLANK },

      { type: "section", text: "Artificial Nutrition and Hydration" },
      {
        type: "paragraph",
        text:
          "Artificially administered nutrition and hydration (such as feeding tubes and intravenous fluids) are " +
          "addressed separately from other life-sustaining treatment because they involve distinct medical and " +
          "personal considerations. My directions on this point are:",
      },
      { type: "field", label: "My Directions Regarding Artificial Nutrition and Hydration: ", blank: TEXT_BLANK },

      { type: "section", text: "Pain Relief and Comfort Care" },
      {
        type: "paragraph",
        text:
          "Regardless of any other direction in this declaration, I direct that I be given medication and other " +
          "care needed to keep me comfortable and to relieve pain, even if doing so may hasten the moment of " +
          "death, unless I state an exception below:",
      },
      { type: "field", label: "Exceptions (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Organ and Tissue Donation (Optional)" },
      { type: "field", label: "My Wishes Regarding Organ and Tissue Donation: ", blank: TEXT_BLANK },

      { type: "section", text: "Revocation of Prior Directives" },
      {
        type: "paragraph",
        text:
          "I revoke any prior living will or advance healthcare directive I may have signed. This declaration " +
          "reflects my current wishes and remains in effect until I revoke or replace it in writing.",
      },

      { type: "section", text: "Signing and Witnessing Requirements" },
      {
        type: "paragraph",
        text:
          "Most states require a living will to be signed in the presence of one or more disinterested witnesses, " +
          "and some require or permit notarization instead of or in addition to witnesses. Many states also " +
          "restrict who may serve as a witness — for example, excluding the Principal's healthcare providers, " +
          "prospective heirs, or anyone named as a healthcare agent. Confirm the witnessing and notarization rules " +
          "that apply where the Principal lives before relying on this document, and complete those formalities " +
          "accordingly.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This declaration shall be interpreted under the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Principal", order: 1 }, { label: "Witness", order: 2 }] },
    ],
  },
  {
    slug: "codicil-to-will",
    title: "CODICIL TO WILL",
    signerLabels: ["Testator", "Witness"],
    blocks: [
      { type: "section", text: "Testator and Original Will" },
      { type: "field", label: "Testator: ", blank: TEXT_BLANK },
      { type: "field", label: "Date Original Will Was Signed: ", blank: DATE_BLANK, gapBefore: 12 },

      { type: "section", text: "Purpose of This Codicil" },
      {
        type: "paragraph",
        text:
          "I, the Testator named above, declare this to be a codicil to my will identified above (the " +
          "\"Original Will\"). This codicil amends the Original Will only as set out below. Except as expressly " +
          "amended by this codicil, I ratify and confirm the Original Will in all other respects.",
      },

      { type: "section", text: "Amendment" },
      { type: "field", label: "Article/Section of Original Will Being Amended: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "The provision identified above is amended to read as follows, and to the extent of any conflict this " +
          "amended language controls over the corresponding provision of the Original Will:",
      },
      { type: "field", label: "Amended Provision: ", blank: TEXT_BLANK },
      { type: "field", label: "Additional Amendment (if any): ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Ratification of Remaining Provisions" },
      {
        type: "paragraph",
        text:
          "All other terms, appointments, and dispositions in the Original Will not specifically amended by this " +
          "codicil remain in full force and effect as originally written.",
      },

      { type: "section", text: "Effect on Prior Codicils" },
      {
        type: "paragraph",
        text:
          "I revoke any prior codicil to the Original Will to the extent it conflicts with this codicil. This " +
          "codicil, together with the Original Will and any other codicil not revoked by this one, constitutes my " +
          "entire testamentary plan as of the date below.",
      },

      { type: "section", text: "Signing and Witnessing Requirements" },
      {
        type: "paragraph",
        text:
          "A codicil generally must be executed with the same formalities the relevant state requires for a valid " +
          "will — typically signing in the presence of a required number of disinterested witnesses, and in some " +
          "states a self-proving affidavit or notarization to simplify probate. Requirements vary by state. " +
          "Confirm and complete the formalities that apply where the Testator lives before relying on this " +
          "codicil, and store it with the Original Will so both are found together.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This codicil shall be interpreted under the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Testator", order: 1 }, { label: "Witness", order: 2 }] },
    ],
  },
  {
    slug: "simple-will-small-estate",
    title: "SIMPLE WILL FOR SMALL ESTATE",
    signerLabels: ["Testator", "Witness"],
    blocks: [
      { type: "section", text: "Testator and Revocation" },
      { type: "field", label: "Testator: ", blank: TEXT_BLANK },
      { type: "field", label: "City/State of Residence: ", blank: TEXT_BLANK, gapBefore: 12 },
      {
        type: "paragraph",
        text:
          "I, the Testator named above, being of sound mind, declare this to be my will, intended for a modest " +
          "and straightforward estate. I revoke all prior wills and codicils I have made.",
      },

      { type: "section", text: "Family Status" },
      { type: "field", label: "Marital Status: ", blank: TEXT_BLANK },
      { type: "field", label: "Names of Children (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Appointment of Executor" },
      { type: "field", label: "Executor: ", blank: TEXT_BLANK },
      { type: "field", label: "Alternate Executor: ", blank: TEXT_BLANK, gapBefore: 12 },
      {
        type: "paragraph",
        text:
          "I appoint the Executor named above to collect my assets, pay my debts and expenses, and distribute " +
          "the remainder of my estate as set out below, using any simplified or small-estate procedures available " +
          "under applicable law.",
      },

      { type: "section", text: "Specific Gifts of Personal Property" },
      {
        type: "paragraph",
        text:
          "I make the following specific gifts of personal property, if any; all other property not specifically " +
          "listed here passes as part of my residuary estate below.",
      },
      { type: "field", label: "Specific Gifts (item and recipient): ", blank: TEXT_BLANK },

      { type: "section", text: "Residuary Estate" },
      {
        type: "paragraph",
        text:
          "I give the remainder of my estate not otherwise specifically disposed of above (my residuary estate) " +
          "to the beneficiary or beneficiaries named below, in the shares indicated:",
      },
      { type: "field", label: "Residuary Beneficiary(ies) and Shares: ", blank: TEXT_BLANK },

      { type: "section", text: "Guardian for Minor Children (If Applicable)" },
      { type: "field", label: "Guardian: ", blank: TEXT_BLANK },
      { type: "field", label: "Alternate Guardian: ", blank: TEXT_BLANK },

      { type: "section", text: "Payment of Debts, Expenses, and Taxes" },
      {
        type: "paragraph",
        text:
          "I direct my Executor to pay my legally enforceable debts, funeral expenses, and estate administration " +
          "expenses from my estate before distributing the remainder as provided above.",
      },

      { type: "section", text: "Signing and Witnessing Requirements" },
      {
        type: "paragraph",
        text:
          "To be valid, a will typically must be signed in the presence of a required number of disinterested " +
          "witnesses, and some states allow a self-proving affidavit signed before a notary to simplify probate " +
          "later. Requirements vary by state, including who may serve as a witness. Confirm and complete the " +
          "formalities that apply where the Testator lives before relying on this will.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This will shall be interpreted under the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Testator", order: 1 }, { label: "Witness", order: 2 }] },
    ],
  },
  {
    slug: "durable-power-of-attorney",
    title: "DURABLE POWER OF ATTORNEY",
    signerLabels: ["Principal", "Agent"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Principal: ", blank: TEXT_BLANK },
      { type: "field", label: "Agent: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Successor Agent (if the Agent is unable or unwilling to serve): ", blank: TEXT_BLANK },

      { type: "section", text: "Durability — Effect of Incapacity" },
      {
        type: "paragraph",
        text:
          "This power of attorney is intended to be durable. The authority granted to the Agent under this " +
          "document shall not be affected by, and shall continue notwithstanding, the later incapacity or " +
          "disability of the Principal, to the extent permitted by the durable power of attorney statute of the " +
          "state whose law governs this document.",
      },

      { type: "section", text: "Effective Date" },
      { type: "field", label: "Effective Date: ", blank: DATE_BLANK },
      {
        type: "paragraph",
        text:
          "This power of attorney is effective immediately upon signing unless the Principal instead specifies " +
          "below that it should only become effective upon a determination that the Principal is incapacitated " +
          "(a \"springing\" power of attorney), and describes how that determination is to be made:",
      },
      { type: "field", label: "Springing Condition (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Scope of Authority Granted" },
      {
        type: "paragraph",
        text:
          "The Principal grants the Agent broad authority to act on the Principal's behalf regarding the " +
          "Principal's financial and legal affairs generally, including banking and financial accounts, real " +
          "property transactions, tax matters, insurance and retirement or government benefits, and routine " +
          "business decisions, except as limited below.",
      },
      { type: "field", label: "Additional Instructions or Limitations: ", blank: TEXT_BLANK },

      { type: "section", text: "Agent's Duties and Compensation" },
      {
        type: "paragraph",
        text:
          "The Agent shall act in good faith, within the scope of authority granted, and in the Principal's best " +
          "interest, and shall keep records of significant transactions undertaken on the Principal's behalf.",
      },
      { type: "field", label: "Agent's Compensation (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Reliance by Third Parties" },
      {
        type: "paragraph",
        text:
          "Any third party who acts in good faith reliance on this document, or a copy of it, without actual " +
          "knowledge that it has been revoked or terminated, may rely on it as if it remained in full force and " +
          "effect.",
      },

      { type: "section", text: "Revocation" },
      {
        type: "paragraph",
        text:
          "The Principal may revoke this power of attorney at any time while competent to do so by delivering " +
          "written notice of revocation to the Agent and to any third party relying on it.",
      },

      { type: "section", text: "Notarization and State Requirements" },
      {
        type: "paragraph",
        text:
          "Durable powers of attorney frequently must be notarized, and some states require specific statutory " +
          "wording or a statutory form before banks, title companies, or government agencies will honor them. " +
          "Requirements vary by state and by the scope of authority granted. Confirm the notarization and any " +
          "statutory-form requirements that apply where the Principal lives and where the Agent will use this " +
          "document, and arrange for notarization accordingly before relying on it.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Power of Attorney shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Principal", order: 1 }, { label: "Agent", order: 2 }] },
    ],
  },
  {
    slug: "limited-power-of-attorney",
    title: "LIMITED POWER OF ATTORNEY",
    signerLabels: ["Principal", "Agent"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Principal: ", blank: TEXT_BLANK },
      { type: "field", label: "Agent: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Limited Purpose" },
      {
        type: "paragraph",
        text:
          "The Principal appoints the Agent to act on the Principal's behalf solely for the specific act or " +
          "transaction described below. This power of attorney grants no general, ongoing, or continuing " +
          "authority of any kind.",
      },
      { type: "field", label: "Specific Act or Transaction Authorized: ", blank: TEXT_BLANK },

      { type: "section", text: "Scope Limitations" },
      {
        type: "paragraph",
        text:
          "The Agent's authority under this document is strictly limited to completing the matter described " +
          "above. The Agent has no authority over any other property, account, or affair of the Principal, and " +
          "may not use this document to undertake any unrelated transaction.",
      },

      { type: "section", text: "Effective Period" },
      { type: "field", label: "Effective Date: ", blank: DATE_BLANK },
      { type: "field", label: "Expiration Date or Completion Event: ", blank: TEXT_BLANK },

      { type: "section", text: "Automatic Termination" },
      {
        type: "paragraph",
        text:
          "This power of attorney terminates automatically on the earliest of: completion of the specific act or " +
          "transaction described above, the stated expiration date, the Principal's death, or the Principal's " +
          "written revocation. Unless the Principal expressly states otherwise below, this limited power of " +
          "attorney does not continue if the Principal becomes incapacitated.",
      },
      { type: "field", label: "Instructions Regarding Incapacity (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Revocation" },
      {
        type: "paragraph",
        text:
          "The Principal may revoke this power of attorney at any time by delivering written notice of revocation " +
          "to the Agent and to any third party relying on it.",
      },

      { type: "section", text: "Notarization and State Requirements" },
      {
        type: "paragraph",
        text:
          "Whether this document needs to be notarized or witnessed depends on the specific transaction and the " +
          "state involved — real estate, vehicle title, and certain financial transactions commonly require " +
          "notarization before third parties will accept a power of attorney. Confirm the requirements that apply " +
          "to the specific transaction and to the states where the Principal lives and where the Agent will use " +
          "this document, and arrange for notarization or witnesses accordingly before relying on it.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Power of Attorney shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Principal", order: 1 }, { label: "Agent", order: 2 }] },
    ],
  },
  {
    slug: "medical-power-of-attorney",
    title: "MEDICAL POWER OF ATTORNEY (HEALTHCARE PROXY)",
    signerLabels: ["Principal", "Agent"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Principal: ", blank: TEXT_BLANK },
      { type: "field", label: "Healthcare Agent: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Alternate Healthcare Agent: ", blank: TEXT_BLANK },

      { type: "section", text: "Grant of Healthcare Decision-Making Authority" },
      {
        type: "paragraph",
        text:
          "The Principal appoints the Healthcare Agent named above to make healthcare decisions on the " +
          "Principal's behalf if the Principal's attending physician determines that the Principal is unable to " +
          "make or communicate those decisions personally. This authority covers healthcare decisions only and " +
          "does not grant the Agent any authority over the Principal's finances, property, or other legal " +
          "affairs.",
      },

      { type: "section", text: "Scope of Authority" },
      {
        type: "paragraph",
        text:
          "The Agent's authority includes consenting to, refusing, or withdrawing medical treatment; selecting or " +
          "dismissing physicians and other healthcare providers; and choosing among available healthcare " +
          "facilities and care settings, consistent with the Principal's known wishes and best interests.",
      },
      { type: "field", label: "Additional Instructions or Limitations: ", blank: TEXT_BLANK },

      { type: "section", text: "Authorization to Access Medical Information" },
      {
        type: "paragraph",
        text:
          "The Principal authorizes healthcare providers to disclose the Principal's protected health information " +
          "to the Agent (and any named alternate) to the extent necessary for the Agent to make informed " +
          "healthcare decisions under this document.",
      },

      { type: "section", text: "Guidance on Life-Sustaining Treatment" },
      {
        type: "paragraph",
        text:
          "In making decisions about life-sustaining treatment, the Agent should follow the directions in any " +
          "separate living will or advance healthcare directive the Principal has signed. Where no such document " +
          "addresses the situation, the Agent should act according to the Principal's known wishes or, if those " +
          "are unknown, in the Principal's best interest.",
      },
      { type: "field", label: "Reference to Separate Living Will/Advance Directive (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Effective Date" },
      {
        type: "paragraph",
        text:
          "This medical power of attorney becomes effective only upon a determination, consistent with applicable " +
          "law, that the Principal is unable to make or communicate healthcare decisions, and remains effective " +
          "for as long as that incapacity continues.",
      },

      { type: "section", text: "Revocation" },
      {
        type: "paragraph",
        text:
          "The Principal may revoke this document at any time while able to do so, by written notice, by " +
          "destroying it, or by executing a later medical power of attorney.",
      },

      { type: "section", text: "Notarization and Witnessing Requirements" },
      {
        type: "paragraph",
        text:
          "Requirements for a valid medical power of attorney vary by state — many require one or more " +
          "disinterested witnesses, some require notarization, and some restrict who may serve as a witness or " +
          "as the Agent (for example, excluding the Principal's own healthcare providers). Confirm the " +
          "requirements that apply where the Principal lives and complete them before relying on this document.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This document shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Principal", order: 1 }, { label: "Agent", order: 2 }] },
    ],
  },
  {
    slug: "convertible-promissory-note",
    title: "CONVERTIBLE PROMISSORY NOTE",
    signerLabels: ["Company", "Investor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Investor: ", blank: TEXT_BLANK, gapBefore: 12 },
      {
        type: "paragraph",
        text:
          "This Convertible Promissory Note (this \"Note\") evidences a loan from the Investor to the Company " +
          "on the terms below. Unlike a standard promissory note, the amount owed under this Note is intended to " +
          "convert into equity of the Company upon the events described below, rather than being repaid solely " +
          "in cash.",
      },

      { type: "section", text: "Principal and Interest" },
      { type: "field", label: "Principal Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "Annual Interest Rate: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "Interest accrues on the outstanding principal from the date of this Note until the principal and " +
          "accrued interest are converted or repaid in full, calculated on the basis stated above.",
      },

      { type: "section", text: "Maturity Date" },
      { type: "field", label: "Maturity Date: ", blank: DATE_BLANK },
      {
        type: "paragraph",
        text:
          "If the outstanding principal and accrued interest have not converted into equity under this Note " +
          "before the Maturity Date, the provisions of the \"Treatment at Maturity\" section below apply.",
      },

      { type: "section", text: "Conversion Upon Qualified Financing" },
      {
        type: "paragraph",
        text:
          "If, before repayment or earlier conversion, the Company completes a bona fide equity financing in " +
          "which it sells preferred or other equity securities primarily for cash to one or more investors " +
          "resulting in gross proceeds to the Company of at least the amount stated below (a \"Qualified " +
          "Financing\"), the outstanding principal and accrued interest under this Note will automatically " +
          "convert into the same class of securities issued in that financing, on the same terms as those paid " +
          "by the other investors in the Qualified Financing, subject to the discount and/or valuation cap " +
          "described below.",
      },
      { type: "field", label: "Minimum Qualified Financing Amount: ", blank: TEXT_BLANK },

      { type: "section", text: "Discount Rate and Valuation Cap" },
      {
        type: "paragraph",
        text:
          "The price per share at which this Note converts in a Qualified Financing will be the lower of (a) the " +
          "price per share paid by other investors in that financing, reduced by the discount rate stated below, " +
          "and (b) the price per share obtained by dividing the valuation cap stated below by the Company's fully " +
          "diluted capitalization immediately before the Qualified Financing. If only one of the discount rate or " +
          "valuation cap is filled in below, conversion is based solely on whichever mechanism applies.",
      },
      { type: "field", label: "Discount Rate (if any): ", blank: TEXT_BLANK },
      { type: "field", label: "Valuation Cap (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Treatment at Maturity" },
      {
        type: "paragraph",
        text:
          "If no Qualified Financing has occurred by the Maturity Date, the parties will proceed as indicated " +
          "below (check or describe the option the parties intend in the blank): the Company repays the " +
          "outstanding principal and accrued interest in cash, the Note converts into equity at the valuation " +
          "cap described above as if a Qualified Financing had occurred, or the maturity date is extended by " +
          "mutual written agreement of the parties.",
      },
      { type: "field", label: "Treatment at Maturity if No Conversion: ", blank: TEXT_BLANK },

      { type: "section", text: "Prepayment" },
      {
        type: "paragraph",
        text:
          "Unless the parties agree otherwise in writing, the Company may not prepay this Note before maturity " +
          "without the Investor's written consent, since early repayment would deprive the Investor of the " +
          "conversion right described above.",
      },

      { type: "section", text: "Representations" },
      {
        type: "paragraph",
        text:
          "The Investor represents that it is acquiring this Note for its own account, for investment purposes, " +
          "and not with a view toward resale or distribution, and acknowledges that neither this Note nor any " +
          "securities issuable upon its conversion have been registered under applicable securities laws.",
      },

      { type: "section", text: "Tax and Securities Law Note" },
      {
        type: "paragraph",
        text:
          "This document is a starting draft, not tax or securities-law advice. Convertible notes raise " +
          "securities-law, valuation, and tax issues that depend on the jurisdiction, the parties' status, and " +
          "the eventual terms of any financing round. The parties should have a lawyer and accountant review the " +
          "final terms of this Note, and confirm compliance with applicable securities-law exemptions, before " +
          "signing or exchanging any funds.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Note shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Investor", order: 2 }] },
    ],
  },
  {
    slug: "loan-modification-agreement",
    title: "LOAN MODIFICATION AGREEMENT",
    signerLabels: ["Lender", "Borrower"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Lender: ", blank: TEXT_BLANK },
      { type: "field", label: "Borrower: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Original Loan" },
      {
        type: "paragraph",
        text:
          "This Loan Modification Agreement (this \"Agreement\") amends the loan described below (the \"Original " +
          "Loan\"). Except as expressly modified by this Agreement, all terms of the Original Loan remain in " +
          "full force and effect.",
      },
      { type: "field", label: "Date of Original Loan Document: ", blank: DATE_BLANK },
      { type: "field", label: "Original Principal Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "Outstanding Balance as of This Agreement: ", blank: TEXT_BLANK },

      { type: "section", text: "Reason for Modification" },
      {
        type: "paragraph",
        text:
          "The parties are entering into this Agreement for the reason described below, and agree that the " +
          "modified terms set out here replace the corresponding terms of the Original Loan as of the effective " +
          "date of this Agreement.",
      },
      { type: "field", label: "Reason for Modification: ", blank: TEXT_BLANK },
      { type: "field", label: "Effective Date of This Agreement: ", blank: DATE_BLANK },

      { type: "section", text: "Modified Interest Rate" },
      {
        type: "paragraph",
        text:
          "As of the effective date above, the annual interest rate on the outstanding balance is changed to the " +
          "rate stated below, replacing the interest rate stated in the Original Loan.",
      },
      { type: "field", label: "New Annual Interest Rate: ", blank: TEXT_BLANK },

      { type: "section", text: "Modified Maturity Date and Term" },
      {
        type: "paragraph",
        text:
          "The maturity date of the Original Loan is changed to the date below. Any extension of the repayment " +
          "period is intended to give the Borrower additional time to repay and does not, by itself, forgive any " +
          "portion of the outstanding balance.",
      },
      { type: "field", label: "New Maturity Date: ", blank: DATE_BLANK },

      { type: "section", text: "Revised Payment Schedule" },
      {
        type: "paragraph",
        text: "The Borrower will repay the outstanding balance, as modified, according to the schedule described below.",
      },
      { type: "field", label: "New Payment Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "New Payment Frequency: ", blank: TEXT_BLANK },
      { type: "field", label: "First Payment Due Under This Schedule: ", blank: DATE_BLANK },

      { type: "section", text: "No Novation" },
      {
        type: "paragraph",
        text:
          "This Agreement modifies, but does not replace or extinguish, the Original Loan. The Borrower's " +
          "obligation to repay the outstanding balance, as modified here, continues without interruption, and " +
          "any security or guaranty given for the Original Loan continues to secure the loan as modified unless " +
          "the parties state otherwise in writing.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles. This is a starting draft, not legal or tax advice — loan modifications can affect lien priority and tax treatment, so review with a professional before signing.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Lender", order: 1 }, { label: "Borrower", order: 2 }] },
    ],
  },
  {
    slug: "line-of-credit-agreement",
    title: "LINE OF CREDIT AGREEMENT",
    signerLabels: ["Lender", "Borrower"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Lender: ", blank: TEXT_BLANK },
      { type: "field", label: "Borrower: ", blank: TEXT_BLANK, gapBefore: 12 },
      {
        type: "paragraph",
        text:
          "This Line of Credit Agreement (this \"Agreement\") sets up a revolving credit arrangement under which " +
          "the Borrower may draw, repay, and re-draw funds up to the credit limit stated below, rather than " +
          "receiving a single lump-sum loan.",
      },

      { type: "section", text: "Credit Limit" },
      { type: "field", label: "Maximum Credit Limit: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "At no time may the total outstanding principal drawn under this line of credit exceed the Maximum " +
          "Credit Limit stated above.",
      },

      { type: "section", text: "Draws" },
      {
        type: "paragraph",
        text:
          "The Borrower may request draws against the available credit from time to time in the manner described " +
          "below. Each draw reduces the credit then available, and each repayment of principal restores " +
          "availability by the amount repaid, up to the Maximum Credit Limit.",
      },
      { type: "field", label: "How Draws May Be Requested: ", blank: TEXT_BLANK },
      { type: "field", label: "Draw Period End Date (if any): ", blank: DATE_BLANK },

      { type: "section", text: "Interest on Outstanding Balance" },
      { type: "field", label: "Annual Interest Rate: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "Interest accrues only on the principal amount actually drawn and outstanding from time to time, not " +
          "on the full Maximum Credit Limit, calculated on the basis stated above.",
      },

      { type: "section", text: "Repayment" },
      { type: "field", label: "Minimum Periodic Payment: ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Frequency: ", blank: TEXT_BLANK },
      { type: "field", label: "Final Repayment Date for All Amounts Outstanding: ", blank: DATE_BLANK },

      { type: "section", text: "Fees" },
      {
        type: "paragraph",
        text:
          "Any commitment fee, draw fee, or late-payment fee that applies to this line of credit is described " +
          "below. If none apply, the parties may leave this blank.",
      },
      { type: "field", label: "Fees (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Default" },
      {
        type: "paragraph",
        text:
          "If the Borrower fails to make a required payment when due, or otherwise breaches this Agreement, the " +
          "Lender may suspend further draws and may declare the outstanding balance, together with accrued " +
          "interest, immediately due and payable, subject to any notice or cure period the parties agree to in " +
          "writing.",
      },

      { type: "section", text: "Termination" },
      {
        type: "paragraph",
        text:
          "Either party may terminate the availability of further draws under this line of credit by written " +
          "notice to the other, though termination does not relieve the Borrower of the obligation to repay " +
          "amounts already drawn, with interest, according to this Agreement.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles. This is a starting draft, not legal or tax advice — revolving credit arrangements can be subject to lending-license and interest-rate rules that vary by jurisdiction, so review with a lawyer before signing.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Lender", order: 1 }, { label: "Borrower", order: 2 }] },
    ],
  },
  {
    slug: "simple-investment-agreement",
    title: "INVESTMENT AGREEMENT",
    signerLabels: ["Company", "Investor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Investor: ", blank: TEXT_BLANK, gapBefore: 12 },
      {
        type: "paragraph",
        text:
          "This Investment Agreement (this \"Agreement\") sets out the terms on which the Investor will invest " +
          "cash in the Company in exchange for the equity or other interest described below.",
      },

      { type: "section", text: "Investment Amount" },
      { type: "field", label: "Total Investment Amount: ", blank: TEXT_BLANK },
      { type: "field", label: "Closing Date: ", blank: DATE_BLANK },

      { type: "section", text: "What the Investor Receives" },
      {
        type: "paragraph",
        text:
          "In exchange for the Investment Amount, the Company will issue or transfer to the Investor the equity " +
          "or other interest described below, on or promptly after the Closing Date.",
      },
      { type: "field", label: "Type and Class of Interest Issued: ", blank: TEXT_BLANK },
      { type: "field", label: "Number of Shares or Units (if applicable): ", blank: TEXT_BLANK },
      { type: "field", label: "Price per Share or Unit (if applicable): ", blank: TEXT_BLANK },

      { type: "section", text: "Conditions to Closing" },
      {
        type: "paragraph",
        text:
          "The Company's obligation to issue the interest described above, and the Investor's obligation to fund " +
          "the Investment Amount, are conditioned on delivery of the funds and, where applicable, on any board or " +
          "shareholder approvals needed to authorize the issuance.",
      },

      { type: "section", text: "Company Representations" },
      {
        type: "paragraph",
        text:
          "The Company represents that it has the authority to enter into this Agreement and to issue the " +
          "interest described above, and that it will provide the Investor with reasonably requested information " +
          "about the Company's business and finances relevant to the investment.",
      },

      { type: "section", text: "Investor Representations" },
      {
        type: "paragraph",
        text:
          "The Investor represents that it is investing for its own account and not with a view toward resale or " +
          "distribution, that it has had the opportunity to ask questions about the Company and this investment, " +
          "and that it understands the interest received has not been registered under applicable securities " +
          "laws and may be subject to resale restrictions.",
      },

      { type: "section", text: "Tax and Securities Law Note" },
      {
        type: "paragraph",
        text:
          "This document is a starting draft, not tax or securities-law advice. Issuing equity or other interests " +
          "in exchange for an investment can trigger securities-law filings or exemptions, and can carry tax " +
          "consequences, that depend on the jurisdiction, the amount raised, and the type of investor involved. " +
          "The parties should have a lawyer and accountant review the final terms and confirm compliance with " +
          "applicable securities laws before signing or exchanging any funds.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Investor", order: 2 }] },
    ],
  },
  {
    slug: "founder-vesting-agreement",
    title: "FOUNDER VESTING AGREEMENT",
    signerLabels: ["Company", "Founder"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Founder: ", blank: TEXT_BLANK, gapBefore: 12 },
      {
        type: "paragraph",
        text:
          "This Founder Vesting Agreement (this \"Agreement\") applies a vesting schedule to shares already held " +
          "by, or being issued to, the Founder (the \"Shares\"), sometimes called reverse vesting, so that the " +
          "Shares are earned over time rather than fully owned outright from the start.",
      },

      { type: "section", text: "Shares Subject to Vesting" },
      { type: "field", label: "Number of Shares Subject to This Agreement: ", blank: TEXT_BLANK },
      { type: "field", label: "Class of Shares: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "Except as this Agreement provides, the Founder holds full voting and other rights of a shareholder " +
          "with respect to the Shares, including unvested Shares, but unvested Shares remain subject to the " +
          "Company's repurchase right described below.",
      },

      { type: "section", text: "Vesting Schedule and Cliff" },
      { type: "field", label: "Vesting Commencement Date: ", blank: DATE_BLANK },
      { type: "field", label: "Cliff Period (if any): ", blank: TEXT_BLANK },
      { type: "field", label: "Vesting Schedule After Cliff: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "If a cliff period applies, no Shares vest until the cliff period has elapsed, at which point the " +
          "portion of Shares attributable to that period vests at once, with the remaining Shares vesting " +
          "according to the schedule stated above.",
      },

      { type: "section", text: "Acceleration" },
      {
        type: "paragraph",
        text:
          "Any acceleration of vesting upon a sale of the Company, termination without cause, or other event is " +
          "described below. If the parties do not intend any acceleration, this may be left blank.",
      },
      { type: "field", label: "Acceleration Terms (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Company Repurchase Right" },
      {
        type: "paragraph",
        text:
          "If the Founder's service with the Company ends for any reason before all Shares have vested, the " +
          "Company has the right, but not the obligation, to repurchase all unvested Shares at the price stated " +
          "below, exercisable for the period stated below following the end of service.",
      },
      { type: "field", label: "Repurchase Price per Unvested Share: ", blank: TEXT_BLANK },
      { type: "field", label: "Period to Exercise Repurchase Right: ", blank: TEXT_BLANK },

      { type: "section", text: "Tax Note" },
      {
        type: "paragraph",
        text:
          "Founders receiving shares subject to vesting may wish to consider whether an early tax election (such " +
          "as a Section 83(b) election in the United States, or an equivalent election elsewhere) is available " +
          "and time-sensitive. This document is a starting draft, not tax or legal advice, and does not make any " +
          "election on the Founder's behalf.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles. Vesting and repurchase arrangements can carry significant tax and securities-law consequences, so have a lawyer or accountant review the final terms before signing.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Founder", order: 2 }] },
    ],
  },
  {
    slug: "stock-transfer-agreement",
    title: "STOCK TRANSFER AGREEMENT",
    signerLabels: ["Transferor", "Transferee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Transferor (Seller): ", blank: TEXT_BLANK },
      { type: "field", label: "Transferee (Buyer): ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Company Whose Shares Are Being Transferred: ", blank: TEXT_BLANK, gapBefore: 12 },
      {
        type: "paragraph",
        text:
          "This Stock Transfer Agreement (this \"Agreement\") documents the Transferor's sale and transfer of " +
          "shares already held by the Transferor in the above Company to the Transferee. This is a transfer of " +
          "existing shares between shareholders, not a new issuance of shares by the Company.",
      },

      { type: "section", text: "Shares Being Transferred" },
      { type: "field", label: "Number of Shares: ", blank: TEXT_BLANK },
      { type: "field", label: "Class of Shares: ", blank: TEXT_BLANK },
      { type: "field", label: "Certificate Number(s) (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Purchase Price" },
      { type: "field", label: "Total Purchase Price: ", blank: TEXT_BLANK },
      { type: "field", label: "Closing Date: ", blank: DATE_BLANK },
      {
        type: "paragraph",
        text:
          "The Transferee will pay the Transferor the Total Purchase Price above in exchange for the Shares, and " +
          "the Transferor will deliver the Shares, or take the steps needed to record the transfer, on or " +
          "promptly after the Closing Date.",
      },

      { type: "section", text: "Company and Board Consent" },
      {
        type: "paragraph",
        text:
          "Many companies restrict transfers of their shares by right of first refusal, board approval " +
          "requirement, or other transfer restriction in their governing documents. The parties confirm below " +
          "whether such consent is required and, if so, that it has been obtained.",
      },
      { type: "field", label: "Is Company or Board Consent Required?: ", blank: TEXT_BLANK },
      { type: "field", label: "If Required, Date Consent Was Obtained: ", blank: DATE_BLANK },

      { type: "section", text: "Representations of the Transferor" },
      {
        type: "paragraph",
        text:
          "The Transferor represents that it is the sole owner of the Shares, free and clear of any lien or " +
          "competing claim except as disclosed to the Transferee, and has the full right to transfer the Shares " +
          "on the terms of this Agreement.",
      },

      { type: "section", text: "Representations of the Transferee" },
      {
        type: "paragraph",
        text:
          "The Transferee represents that it is acquiring the Shares for its own account, for investment " +
          "purposes, and not with a view toward resale or distribution, and acknowledges that the Shares may not " +
          "be registered under applicable securities laws and may carry resale restrictions.",
      },

      { type: "section", text: "Tax and Securities Law Note" },
      {
        type: "paragraph",
        text:
          "This document is a starting draft, not tax or securities-law advice. Secondary transfers of shares can " +
          "trigger tax consequences for both parties and may be subject to securities-law resale restrictions " +
          "that depend on the jurisdiction and the Company's own governing documents. The parties should have a " +
          "lawyer and accountant review the final terms before closing.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Transferor", order: 1 }, { label: "Transferee", order: 2 }] },
    ],
  },
  {
    slug: "equity-buy-sell-agreement",
    title: "BUY-SELL AGREEMENT",
    signerLabels: ["Shareholder A", "Shareholder B"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Shareholder A: ", blank: TEXT_BLANK },
      { type: "field", label: "Shareholder B: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Company: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text:
          "Shareholder A and Shareholder B are co-owners of the Company and enter into this Buy-Sell Agreement " +
          "(this \"Agreement\") to agree in advance on what happens to a shareholder's equity in the Company if a " +
          "triggering event described below occurs, so that ownership can pass in an orderly way rather than " +
          "being contested later.",
      },

      { type: "section", text: "Triggering Events" },
      {
        type: "paragraph",
        text:
          "This Agreement applies if, with respect to either shareholder, any of the following occurs: death, " +
          "permanent disability preventing the shareholder from participating in the business, a proposed " +
          "voluntary sale or transfer of the shareholder's equity to a third party, or another event the parties " +
          "describe below.",
      },
      { type: "field", label: "Additional Triggering Events (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Right of First Refusal" },
      {
        type: "paragraph",
        text:
          "If a triggering event occurs, the remaining shareholder (or the Company, if the parties so choose) " +
          "has the right, but not the obligation, to purchase all or part of the affected shareholder's equity " +
          "before it may be transferred to anyone else, for the period stated below after notice of the " +
          "triggering event.",
      },
      { type: "field", label: "Period to Exercise Right of First Refusal: ", blank: TEXT_BLANK },

      { type: "section", text: "Valuation Method" },
      {
        type: "paragraph",
        text:
          "The purchase price for equity acquired under this Agreement will be determined using the method " +
          "described below — for example, a fixed price updated periodically, a formula based on the Company's " +
          "financials, or an independent appraisal.",
      },
      { type: "field", label: "Valuation Method: ", blank: TEXT_BLANK },
      { type: "field", label: "Date Valuation Was Last Updated (if fixed price): ", blank: DATE_BLANK },

      { type: "section", text: "Payment Terms" },
      {
        type: "paragraph",
        text:
          "The purchase price determined above will be paid according to the terms described below — for " +
          "example, in a lump sum at closing, in installments over a stated period, or funded in whole or part " +
          "by life or disability insurance proceeds where a triggering event is death or disability.",
      },
      { type: "field", label: "Payment Terms: ", blank: TEXT_BLANK },

      { type: "section", text: "Insurance Funding" },
      {
        type: "paragraph",
        text:
          "If the parties intend to fund a purchase on death or disability with insurance, the policy details " +
          "and any obligation to maintain the policy are described below. If no insurance funding is intended, " +
          "this may be left blank.",
      },
      { type: "field", label: "Insurance Funding Details (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Tax and Legal Note" },
      {
        type: "paragraph",
        text:
          "This document is a starting draft, not tax or legal advice. Buy-sell arrangements interact with " +
          "estate planning, insurance, and securities-law considerations that vary by jurisdiction and by the " +
          "shareholders' personal circumstances. The parties should have a lawyer and accountant review the " +
          "final terms before signing.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Shareholder A", order: 1 }, { label: "Shareholder B", order: 2 }] },
    ],
  },
  {
    slug: "personal-property-bill-of-sale",
    title: "PERSONAL PROPERTY BILL OF SALE",
    signerLabels: ["Seller", "Buyer"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Seller: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Buyer: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Item(s) Sold" },
      {
        type: "paragraph",
        text:
          "This is a private sale of personal property between individuals, not a commercial transaction. The " +
          "Seller agrees to sell, and the Buyer agrees to buy, the following item(s):",
      },
      { type: "field", label: "Description of Item(s): ", blank: TEXT_BLANK },
      { type: "field", label: "Make / Model / Year (if applicable): ", blank: TEXT_BLANK },
      { type: "field", label: "Serial Number / VIN (if applicable): ", blank: TEXT_BLANK },

      { type: "section", text: "Purchase Price and Payment" },
      { type: "field", label: "Purchase Price: ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Method: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: `Payment is due in full on or before ${DATE_BLANK}, unless the parties agree in writing to a different arrangement.`,
      },

      { type: "section", text: "Condition of Item(s)" },
      {
        type: "paragraph",
        text:
          "Unless otherwise noted below, the item(s) are sold in their current condition, \"as is\" and \"where is,\" " +
          "with no warranty of merchantability, fitness for a particular purpose, or any other condition, express or implied.",
      },
      { type: "field", label: "Known Defects or Issues Disclosed by Seller (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Ownership and Right to Sell" },
      {
        type: "paragraph",
        text:
          "The Seller represents that the Seller is the lawful owner of the item(s) and that they are free of any " +
          "liens, loans, or third-party claims, except as disclosed below.",
      },
      { type: "field", label: "Liens or Claims Disclosed (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Delivery and Risk of Loss" },
      {
        type: "paragraph",
        text: `The item(s) will be delivered to, or made available for pickup by, the Buyer on ${DATE_BLANK} at the following location:`,
      },
      { type: "field", label: "Delivery / Pickup Location: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "Once the Buyer takes possession of the item(s), all risk of loss, theft, or damage transfers to the Buyer.",
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
          "If a dispute arises out of this Agreement, the parties agree to first attempt to resolve it through " +
          "good-faith discussion before pursuing mediation, arbitration, or any other legal remedy.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Seller", order: 1 }, { label: "Buyer", order: 2 }] },
    ],
  },
  {
    slug: "pet-custody-care-agreement",
    title: "PET CUSTODY AND CARE AGREEMENT",
    signerLabels: ["Party A", "Party B"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Party A: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Party B: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "The Pet" },
      { type: "paragraph", text: "This Agreement covers the following pet, currently shared or co-owned by the parties:" },
      { type: "field", label: "Pet's Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Species / Breed: ", blank: TEXT_BLANK },
      { type: "field", label: "Age / Description: ", blank: TEXT_BLANK },

      { type: "section", text: "Ownership" },
      { type: "paragraph", text: "The parties agree on the following ownership arrangement for the pet named above:" },
      { type: "field", label: "Legal / Primary Owner (if applicable): ", blank: TEXT_BLANK },

      { type: "section", text: "Custody Schedule" },
      { type: "paragraph", text: "The parties agree to share time with the pet according to the following schedule:" },
      { type: "field", label: "Custody Schedule: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "Any changes to this schedule must be agreed to in advance by both parties, whether in writing, by text message, or by email.",
      },

      { type: "section", text: "Expenses" },
      {
        type: "paragraph",
        text: "The parties agree to divide the pet's ongoing expenses, including food, grooming, supplies, and routine veterinary care, as follows:",
      },
      { type: "field", label: "Expense Split: ", blank: TEXT_BLANK },
      { type: "paragraph", text: "Receipts for shared expenses should be kept and made available to the other party upon request." },

      { type: "section", text: "Veterinary Care and Major Decisions" },
      {
        type: "paragraph",
        text:
          "Routine veterinary care will be arranged by whichever party has custody at the time. Non-routine or costly " +
          "medical decisions, including major treatment, surgery, or end-of-life decisions, require mutual agreement " +
          "of both parties wherever reasonably possible.",
      },
      { type: "field", label: "Preferred Veterinarian / Clinic: ", blank: TEXT_BLANK },

      { type: "section", text: "Relocation and Travel" },
      {
        type: "paragraph",
        text:
          "A party who plans to move to a new home, or travel with the pet for an extended period, agrees to give the " +
          "other party reasonable advance notice and to discuss any impact on the custody schedule in good faith.",
      },

      { type: "section", text: "If the Arrangement No Longer Works" },
      {
        type: "paragraph",
        text:
          "If either party is no longer able to keep to this arrangement, both parties agree to discuss the pet's " +
          "care and, where possible, agree on new terms in good faith before making any unilateral change to custody or ownership.",
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
          "The parties agree to first attempt to resolve any disagreement about the pet's care or custody through " +
          "good-faith discussion, and if needed, mediation, before pursuing any other remedy.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Party A", order: 1 }, { label: "Party B", order: 2 }] },
    ],
  },
  {
    slug: "personal-property-storage-agreement",
    title: "PERSONAL PROPERTY STORAGE AGREEMENT",
    signerLabels: ["Owner", "Storage Provider"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Owner: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Storage Provider: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Property Being Stored" },
      {
        type: "paragraph",
        text: "The Storage Provider agrees to allow the Owner to store the following personal belongings at the Storage Provider's property:",
      },
      { type: "field", label: "Description of Stored Items: ", blank: TEXT_BLANK },
      { type: "field", label: "Approximate Quantity / Volume: ", blank: TEXT_BLANK },
      { type: "field", label: "Storage Location (address / specific area, e.g. garage, basement): ", blank: TEXT_BLANK },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text: `This storage arrangement begins on ${DATE_BLANK} and continues until ${DATE_BLANK}, unless ended earlier as described below.`,
      },

      { type: "section", text: "Storage Fee" },
      { type: "field", label: "Fee (if any): ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Access to Stored Items" },
      {
        type: "paragraph",
        text:
          "The Owner may access the stored items at reasonable times agreed with the Storage Provider in advance. " +
          "The Storage Provider agrees not to move, use, or dispose of the stored items without the Owner's consent.",
      },

      { type: "section", text: "Condition and Liability" },
      {
        type: "paragraph",
        text:
          "The Owner is responsible for reasonably packing and protecting items before storage. The Storage " +
          "Provider agrees to take reasonable care of the stored items but is not an insurer of them. Except in " +
          "cases of the Storage Provider's gross negligence or intentional misconduct, the Storage Provider is not " +
          "responsible for loss, theft, or damage to the stored items, and the Owner is encouraged to maintain " +
          "their own insurance covering the stored property.",
      },

      { type: "section", text: "Ending the Arrangement and Removal of Property" },
      {
        type: "paragraph",
        text:
          "Either party may end this arrangement by giving the other party reasonable written notice. Upon ending " +
          "the arrangement, the Owner agrees to remove all stored items within a reasonable time, as agreed by the parties.",
      },
      { type: "field", label: "Notice Period: ", blank: TEXT_BLANK },

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
          "good-faith discussion before pursuing mediation, arbitration, or litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Owner", order: 1 }, { label: "Storage Provider", order: 2 }] },
    ],
  },
  {
    slug: "property-management-agreement",
    title: "PROPERTY MANAGEMENT AGREEMENT",
    signerLabels: ["Property Owner", "Property Manager"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Property Owner: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Property Manager: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Managed Property" },
      { type: "field", label: "Property Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Description of Property (e.g. number of units): ", blank: TEXT_BLANK },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text: `This Agreement begins on ${DATE_BLANK} and continues until ${DATE_BLANK}, unless ended earlier as described below.`,
      },

      { type: "section", text: "Property Manager's Duties" },
      {
        type: "paragraph",
        text:
          "The Property Manager agrees to manage the property on the Property Owner's behalf, including advertising " +
          "vacancies, screening and communicating with tenants, collecting rent, coordinating repairs and " +
          "maintenance, and handling day-to-day tenant relations.",
      },
      { type: "field", label: "Additional Duties (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Rent Collection and Disbursement" },
      {
        type: "paragraph",
        text:
          "The Property Manager agrees to collect rent from tenants on the Property Owner's behalf and to remit " +
          "collected rent, less any agreed fees and approved expenses, to the Property Owner according to the following schedule:",
      },
      { type: "field", label: "Disbursement Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Management Fee" },
      { type: "field", label: "Management Fee: ", blank: TEXT_BLANK },
      { type: "field", label: "Fee Basis (e.g. flat fee, percentage of rent collected): ", blank: TEXT_BLANK },

      { type: "section", text: "Maintenance and Repairs" },
      {
        type: "paragraph",
        text:
          "The Property Manager may authorize routine maintenance and repairs up to the amount below without prior " +
          "approval from the Property Owner. Repairs above this amount require the Property Owner's prior approval, " +
          "except in the case of an emergency affecting health, safety, or property damage.",
      },
      { type: "field", label: "Repair Authorization Limit Without Prior Approval: ", blank: TEXT_BLANK },

      { type: "section", text: "Insurance and Liability" },
      {
        type: "paragraph",
        text:
          "The Property Owner is responsible for maintaining adequate property insurance. The Property Manager " +
          "agrees to act in good faith and in the Property Owner's best interest, but is not liable for losses that " +
          "result from the Property Owner's own instructions, tenant actions, or events beyond the Property " +
          "Manager's reasonable control.",
      },

      { type: "section", text: "Termination" },
      {
        type: "paragraph",
        text:
          "Either party may terminate this Agreement by giving the other party written notice as specified below. " +
          "Upon termination, the Property Manager agrees to provide a final accounting and to turn over any funds, " +
          "keys, and records held on the Property Owner's behalf.",
      },
      { type: "field", label: "Notice Period Required to Terminate: ", blank: TEXT_BLANK },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith " +
          "negotiation. If unresolved, either party may pursue mediation or another mutually agreed method before " +
          "resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Property Owner", order: 1 }, { label: "Property Manager", order: 2 }] },
    ],
  },
  {
    slug: "room-rental-agreement",
    title: "ROOM RENTAL AGREEMENT",
    signerLabels: ["Landlord", "Tenant"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Landlord: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Tenant: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "The Room and Property" },
      {
        type: "paragraph",
        text:
          "The Landlord owns or leases the property described below and agrees to rent a single room within it to " +
          "the Tenant. This is not an agreement between co-tenants sharing a lease; the Landlord retains control of " +
          "the rest of the property.",
      },
      { type: "field", label: "Property Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Room Rented (e.g. \"upstairs bedroom\"): ", blank: TEXT_BLANK },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text: `This Agreement begins on ${DATE_BLANK} and continues on a month-to-month basis, or until ${DATE_BLANK}, as agreed by the parties.`,
      },

      { type: "section", text: "Rent" },
      { type: "field", label: "Monthly Rent: ", blank: TEXT_BLANK },
      { type: "field", label: "Due Date: ", blank: TEXT_BLANK },
      { type: "field", label: "Payment Method: ", blank: TEXT_BLANK },

      { type: "section", text: "Security Deposit" },
      { type: "field", label: "Security Deposit Amount: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "The security deposit will be returned to the Tenant after move-out, less any reasonable deductions for " +
          "damage beyond normal wear and tear or unpaid rent, as allowed by applicable law.",
      },

      { type: "section", text: "Shared Spaces and House Rules" },
      {
        type: "paragraph",
        text: "The Tenant may use the shared areas of the property, such as the kitchen, bathroom, and common living areas, subject to the house rules below.",
      },
      { type: "field", label: "Shared Spaces Included: ", blank: TEXT_BLANK },
      { type: "field", label: "House Rules (e.g. quiet hours, guests, smoking, pets): ", blank: TEXT_BLANK },

      { type: "section", text: "Utilities and Services" },
      { type: "field", label: "Utilities Included in Rent: ", blank: TEXT_BLANK },
      { type: "field", label: "Utilities Paid Separately by Tenant (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Landlord's Access" },
      {
        type: "paragraph",
        text:
          "The Landlord may enter the rented room with reasonable advance notice to inspect the premises, make " +
          "repairs, or show the room to prospective tenants or buyers, except in the case of an emergency.",
      },

      { type: "section", text: "Ending the Tenancy" },
      {
        type: "paragraph",
        text:
          "Either party may end this Agreement by giving the other party written notice as specified below, " +
          "subject to any minimum notice period required by applicable law.",
      },
      { type: "field", label: "Notice Period Required: ", blank: TEXT_BLANK },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith " +
          "discussion before pursuing mediation or any other remedy.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Landlord", order: 1 }, { label: "Tenant", order: 2 }] },
    ],
  },
  {
    slug: "remote-work-equipment-agreement",
    title: "REMOTE WORK EQUIPMENT AGREEMENT",
    signerLabels: ["Employer", "Employee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Employer: ", blank: TEXT_BLANK },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Address: ", blank: TEXT_BLANK },

      { type: "section", text: "Equipment Provided" },
      { type: "paragraph", text: "The Employer agrees to provide the Employee with the following equipment for use while working remotely:" },
      { type: "field", label: "Equipment Description (e.g. laptop, monitor, chair): ", blank: TEXT_BLANK },
      { type: "field", label: "Make / Model / Serial Number: ", blank: TEXT_BLANK },
      { type: "field", label: "Estimated Value: ", blank: TEXT_BLANK },

      { type: "section", text: "Ownership" },
      {
        type: "paragraph",
        text:
          "All equipment provided under this Agreement remains the property of the Employer at all times. The " +
          "Employee has no ownership interest in the equipment and may not sell, lend, pledge, or otherwise " +
          "transfer it to any third party.",
      },

      { type: "section", text: "Permitted Use" },
      {
        type: "paragraph",
        text:
          "The equipment is provided solely for the Employee's use in performing work duties. Reasonable incidental " +
          "personal use is permitted unless the Employer's policies state otherwise, but the Employee agrees not to " +
          "use the equipment for unlawful purposes or in a way that violates the Employer's policies.",
      },

      { type: "section", text: "Condition, Care, and Security" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to keep the equipment in good working condition, use reasonable care to protect it " +
          "from damage or theft, and follow any security requirements set by the Employer, including password " +
          "protection, software updates, and data security practices.",
      },

      { type: "section", text: "Loss, Damage, and Repairs" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to promptly notify the Employer of any loss, theft, or damage to the equipment. The " +
          "Employee may be responsible for the cost of repair or replacement in cases of negligence, misuse, or " +
          "failure to report loss or theft in a timely manner, except where prohibited by applicable law.",
      },

      { type: "section", text: "Return of Equipment" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to return all equipment provided under this Agreement in good condition, ordinary " +
          "wear and tear excepted, upon request by the Employer or upon separation from employment, whichever comes first.",
      },
      { type: "field", label: "Return Deadline (if separation occurs): ", blank: TEXT_BLANK },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith " +
          "discussion between the Employee and the Employer's designated representative before pursuing any other remedy.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Employer", order: 1 }, { label: "Employee", order: 2 }] },
    ],
  },
  {
    slug: "performance-improvement-plan-acknowledgment",
    title: "PERFORMANCE IMPROVEMENT PLAN ACKNOWLEDGMENT",
    signerLabels: ["Employer", "Employee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Employer: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Position / Title: ", blank: TEXT_BLANK },

      { type: "section", text: "Purpose of This Acknowledgment" },
      {
        type: "paragraph",
        text:
          "This document confirms that the Employee has received and reviewed a formal Performance Improvement " +
          "Plan (\"PIP\") from the Employer. Signing this Acknowledgment confirms receipt and understanding of the " +
          "plan below; it is not, by itself, a notice of termination or disciplinary action beyond what is " +
          "described in the plan.",
      },
      { type: "field", label: "Date PIP Presented to Employee: ", blank: DATE_BLANK },

      { type: "section", text: "Performance Concerns Identified" },
      {
        type: "paragraph",
        text: "The Employer has identified the following areas where the Employee's performance does not currently meet expectations:",
      },
      { type: "field", label: "Performance Concerns: ", blank: TEXT_BLANK },

      { type: "section", text: "Goals and Expectations" },
      {
        type: "paragraph",
        text: "To address the concerns above, the Employee is expected to meet the following specific, measurable goals during the review period:",
      },
      { type: "field", label: "Goals and Expectations: ", blank: TEXT_BLANK },

      { type: "section", text: "Support and Resources" },
      {
        type: "paragraph",
        text:
          "The Employer agrees to provide the following support to help the Employee meet the goals above, which " +
          "may include additional training, check-ins, mentoring, or adjusted resources:",
      },
      { type: "field", label: "Support Provided: ", blank: TEXT_BLANK },

      { type: "section", text: "Review Timeline" },
      {
        type: "paragraph",
        text: `The Employee's progress will be reviewed on an ongoing basis, with a formal review scheduled for ${DATE_BLANK}. The overall improvement period is expected to conclude on or around ${DATE_BLANK}, unless extended or shortened by the Employer.`,
      },
      { type: "field", label: "Check-in Frequency (e.g. weekly, biweekly): ", blank: TEXT_BLANK },

      { type: "section", text: "Possible Outcomes" },
      {
        type: "paragraph",
        text:
          "At the conclusion of the review period, the Employer will assess whether the goals above have been met. " +
          "Depending on the outcome, this may result in the plan ending successfully, an extension of the review " +
          "period, or further employment action, up to and including termination, in accordance with the " +
          "Employer's policies.",
      },

      { type: "section", text: "Employee Acknowledgment" },
      {
        type: "paragraph",
        text:
          "By signing below, the Employee acknowledges having received, read, and discussed this Performance " +
          "Improvement Plan with the Employer. Signing does not necessarily mean the Employee agrees with every " +
          "concern raised, only that the plan was received and reviewed. The Employee may attach written comments " +
          "to this Acknowledgment if desired.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Employer", order: 1 }, { label: "Employee", order: 2 }] },
    ],
  },
  {
    slug: "bylaws-adoption-resolution",
    title: "BYLAWS ADOPTION RESOLUTION",
    signerLabels: ["President", "Secretary"],
    blocks: [
      { type: "section", text: "Company Information" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "State of Incorporation: ", blank: TEXT_BLANK },

      { type: "section", text: "Meeting or Written Consent" },
      {
        type: "paragraph",
        text:
          "The undersigned, being the President and Secretary of the Company, certify that at a meeting of the " +
          "board of directors held on the date below, or by unanimous written consent of the directors in lieu " +
          "of a meeting, the following resolution regarding the Company's bylaws was duly adopted:",
      },
      { type: "field", label: "Date: ", blank: DATE_BLANK },

      { type: "section", text: "Recitals" },
      {
        type: "paragraph",
        text:
          "The board of directors has reviewed a proposed set of bylaws governing the internal affairs of the " +
          "Company, including the roles and duties of officers and directors, meeting and voting procedures, " +
          "and other matters of corporate governance.",
      },

      { type: "section", text: "Resolution to Adopt Bylaws" },
      {
        type: "paragraph",
        text:
          "RESOLVED, that the bylaws reviewed by the board of directors and identified below are hereby adopted " +
          "as the official bylaws of the Company, and shall govern the internal affairs of the Company until " +
          "amended, restated, or repealed in accordance with their own terms.",
      },
      { type: "field", label: "Description or Title of Adopted Bylaws Document: ", blank: TEXT_BLANK },

      { type: "section", text: "Effective Date" },
      { type: "field", label: "Effective Date of Bylaws: ", blank: DATE_BLANK },

      { type: "section", text: "Filing and Recordkeeping" },
      {
        type: "paragraph",
        text:
          "The Secretary is directed to retain a copy of the adopted bylaws among the Company's official records " +
          "and to make the bylaws available to directors, officers, and shareholders upon reasonable request.",
      },

      { type: "section", text: "Future Amendments" },
      {
        type: "paragraph",
        text:
          "Any future amendment, restatement, or repeal of the bylaws shall be adopted only in accordance with " +
          "the amendment procedures set forth within the bylaws themselves.",
      },

      { type: "section", text: "Certification" },
      {
        type: "paragraph",
        text:
          "The Secretary certifies that the foregoing is a true and accurate record of the resolution adopted " +
          "by the Company's directors regarding the adoption of its bylaws.",
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
    slug: "operating-agreement-amendment",
    title: "OPERATING AGREEMENT AMENDMENT",
    signerLabels: ["Member A", "Member B"],
    blocks: [
      { type: "section", text: "Company Information" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "State of Formation: ", blank: TEXT_BLANK },

      { type: "section", text: "Original Agreement Being Amended" },
      { type: "field", label: "Date of Original Operating Agreement: ", blank: DATE_BLANK },
      {
        type: "paragraph",
        text:
          "This Amendment modifies certain provisions of the operating agreement referenced above (the " +
          "\"Original Agreement\") entered into by the members of the Company. Except as expressly amended " +
          "below, all terms, conditions, and provisions of the Original Agreement remain unchanged and in full " +
          "force and effect.",
      },

      { type: "section", text: "Members Executing This Amendment" },
      { type: "field", label: "Member A Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Member B Name: ", blank: TEXT_BLANK },

      { type: "section", text: "Effective Date of Amendment" },
      { type: "field", label: "Effective Date: ", blank: DATE_BLANK },

      { type: "section", text: "Provisions Being Amended" },
      { type: "field", label: "Section(s) of Original Agreement Being Amended: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "The section(s) identified above are hereby deleted in their entirety, to the extent inconsistent " +
          "with this Amendment, and replaced with the amended language set forth below.",
      },

      { type: "section", text: "Amended Language" },
      { type: "field", label: "New or Amended Provision (1): ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "New or Amended Provision (2): ", blank: TEXT_BLANK },

      { type: "section", text: "Reason for Amendment" },
      { type: "field", label: "Brief Description of Reason for Amendment (optional): ", blank: TEXT_BLANK },

      { type: "section", text: "Ratification of Remaining Terms" },
      {
        type: "paragraph",
        text:
          "Except as specifically amended by this Amendment, the members ratify and confirm all other terms, " +
          "conditions, and provisions of the Original Agreement, which shall continue to govern the affairs of " +
          "the Company without interruption.",
      },

      { type: "section", text: "Counterparts" },
      {
        type: "paragraph",
        text:
          "This Amendment may be executed in counterparts, each of which shall be deemed an original, and all " +
          "of which together shall constitute one and the same instrument.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Amendment shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Member A", order: 1 }, { label: "Member B", order: 2 }] },
    ],
  },
  {
    slug: "buy-sell-agreement",
    title: "LLC/CORPORATION BUY-SELL AGREEMENT",
    signerLabels: ["Member A", "Member B"],
    blocks: [
      { type: "section", text: "Company Information" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Entity Type (LLC or Corporation): ", blank: TEXT_BLANK },
      { type: "field", label: "State of Formation: ", blank: TEXT_BLANK },

      { type: "section", text: "Owners" },
      { type: "field", label: "Member A / Shareholder A Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Member A Ownership Percentage: ", blank: TEXT_BLANK },
      { type: "field", label: "Member B / Shareholder B Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Member B Ownership Percentage: ", blank: TEXT_BLANK },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text:
          "The owners of the Company desire to establish an orderly, predictable process for handling the " +
          "transfer of an ownership interest upon certain triggering events, in order to preserve continuity of " +
          "management and to protect both the Company and its remaining owners.",
      },

      { type: "section", text: "Triggering Events" },
      {
        type: "paragraph",
        text:
          "This Agreement governs the disposition of an owner's interest in the Company upon the occurrence of " +
          "any of the following triggering events: death; permanent disability; divorce or legal separation " +
          "resulting in an award of an ownership interest to a former spouse; bankruptcy, insolvency, or an " +
          "involuntary transfer by operation of law; or a voluntary decision by an owner to withdraw from and " +
          "sell their interest.",
      },

      { type: "section", text: "Right of First Refusal" },
      {
        type: "paragraph",
        text:
          "Before an owner may sell, pledge, transfer, or otherwise dispose of any ownership interest to a " +
          "third party, that owner must first offer the interest to the Company and then to the remaining " +
          "owner(s), on the same terms offered to the third party, giving the Company and remaining owner(s) " +
          "the opportunity to purchase the interest before it may be transferred outside the ownership group.",
      },
      { type: "field", label: "Notice Period for Right of First Refusal (days): ", blank: TEXT_BLANK },

      { type: "section", text: "Valuation of Interest" },
      { type: "field", label: "Valuation Method (e.g., independent appraisal, formula, fixed price): ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text:
          "The value determined under the method selected above shall be used to establish the purchase price " +
          "of an owner's interest for any purchase arising under this Agreement, unless the owners agree in " +
          "writing to a different value at the time of the triggering event.",
      },

      { type: "section", text: "Death or Disability" },
      {
        type: "paragraph",
        text:
          "Upon the death or permanent disability of an owner, the Company and/or the remaining owner(s) shall " +
          "have the option, but not the obligation, to purchase all or a portion of the affected owner's " +
          "interest at the value determined under this Agreement.",
      },
      { type: "field", label: "Funding Source, if any (e.g., life or disability insurance): ", blank: TEXT_BLANK },

      { type: "section", text: "Divorce or Involuntary Transfer" },
      {
        type: "paragraph",
        text:
          "If an owner's interest becomes subject to a property settlement, divorce decree, judgment, " +
          "garnishment, or other involuntary transfer, the affected owner (or the transferee, as applicable) " +
          "shall promptly notify the Company, and the Company and/or remaining owner(s) shall have the right to " +
          "purchase the affected interest under the terms of this Agreement.",
      },

      { type: "section", text: "Purchase Price and Payment Terms" },
      { type: "field", label: "Payment Terms (e.g., lump sum, installment schedule): ", blank: TEXT_BLANK },

      { type: "section", text: "Closing" },
      { type: "field", label: "Closing Period Following Determination of Purchase Price (days): ", blank: TEXT_BLANK },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Member A", order: 1 }, { label: "Member B", order: 2 }] },
    ],
  },
  {
    slug: "code-of-conduct-acknowledgment",
    title: "CODE OF CONDUCT ACKNOWLEDGMENT",
    signerLabels: ["Company", "Employee"],
    blocks: [
      { type: "section", text: "Company and Employee Information" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee Position/Title: ", blank: TEXT_BLANK },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text:
          "The Company has adopted a Code of Conduct setting out the standards of behavior, ethics, and " +
          "professionalism expected of all employees. This Acknowledgment confirms that the Employee has " +
          "received, read, and understood the Code of Conduct.",
      },

      { type: "section", text: "Acknowledgment of Receipt" },
      { type: "field", label: "Date Code of Conduct Was Provided to Employee: ", blank: DATE_BLANK },
      {
        type: "paragraph",
        text:
          "The Employee acknowledges receipt of a copy of the Company's Code of Conduct and confirms having had " +
          "the opportunity to review its contents and ask questions about it before signing this Acknowledgment.",
      },

      { type: "section", text: "Employee's Commitment" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to comply with the standards, policies, and expectations described in the Code " +
          "of Conduct throughout the course of employment with the Company, and understands that the Company " +
          "may update the Code of Conduct from time to time.",
      },

      { type: "section", text: "Reporting Concerns" },
      {
        type: "paragraph",
        text:
          "The Employee understands that any concerns regarding possible violations of the Code of Conduct " +
          "should be reported promptly to the person, role, or department identified below.",
      },
      { type: "field", label: "Reporting Contact or Department: ", blank: TEXT_BLANK },

      { type: "section", text: "Consequences of Non-Compliance" },
      {
        type: "paragraph",
        text:
          "The Employee understands that failure to comply with the Code of Conduct may result in disciplinary " +
          "action, up to and including termination of employment, in accordance with the Company's policies.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Acknowledgment shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Employee", order: 2 }] },
    ],
  },
  {
    slug: "data-breach-notification-acknowledgment",
    title: "DATA BREACH NOTIFICATION ACKNOWLEDGMENT",
    signerLabels: ["Company", "Recipient"],
    blocks: [
      { type: "section", text: "Company and Recipient Information" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Recipient Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Recipient Address or Contact Information: ", blank: TEXT_BLANK },

      { type: "section", text: "Notice of Data Breach" },
      {
        type: "paragraph",
        text:
          "This notice is provided to inform the Recipient that the Company has identified a data security " +
          "incident that may have affected information associated with the Recipient's account or relationship " +
          "with the Company.",
      },
      { type: "field", label: "Date the Incident Was Discovered: ", blank: DATE_BLANK },

      { type: "section", text: "Description of the Incident" },
      { type: "field", label: "Description of How the Incident Occurred: ", blank: TEXT_BLANK },

      { type: "section", text: "Information Involved" },
      { type: "field", label: "Categories of Information Potentially Affected: ", blank: TEXT_BLANK },

      { type: "section", text: "Remedial Measures Taken" },
      {
        type: "paragraph",
        text:
          "The Company has taken, or is taking, the following measures to contain the incident, secure its " +
          "systems, and reduce the risk of a similar incident occurring in the future:",
      },
      { type: "field", label: "Remedial Measures: ", blank: TEXT_BLANK },

      { type: "section", text: "Recommended Steps for Recipient" },
      {
        type: "paragraph",
        text:
          "The Company recommends that the Recipient review account activity, update relevant passwords, and " +
          "remain alert to unexpected communications. Additional recommended precautions specific to this " +
          "incident are described below.",
      },
      { type: "field", label: "Additional Recommended Actions: ", blank: TEXT_BLANK },

      { type: "section", text: "Company Contact for Questions" },
      { type: "field", label: "Contact Name or Department: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact Phone or Email: ", blank: TEXT_BLANK },

      { type: "section", text: "Acknowledgment of Receipt" },
      {
        type: "paragraph",
        text:
          "By signing below, the Recipient acknowledges receipt of this notification and confirms having had " +
          "the opportunity to review its contents and ask the Company any questions before signing.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This notice shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Recipient", order: 2 }] },
    ],
  },
  {
    slug: "whistleblower-policy-acknowledgment",
    title: "WHISTLEBLOWER POLICY ACKNOWLEDGMENT",
    signerLabels: ["Company", "Employee"],
    blocks: [
      { type: "section", text: "Company and Employee Information" },
      { type: "field", label: "Company Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee Position/Title: ", blank: TEXT_BLANK },

      { type: "section", text: "Purpose of the Whistleblower Policy" },
      {
        type: "paragraph",
        text:
          "The Company has adopted a whistleblower policy to encourage employees to report suspected " +
          "misconduct, fraud, illegal activity, or violations of Company policy without fear of retaliation. " +
          "This Acknowledgment confirms that the Employee has received and understands the policy.",
      },

      { type: "section", text: "Acknowledgment of Receipt" },
      { type: "field", label: "Date Whistleblower Policy Was Provided to Employee: ", blank: DATE_BLANK },

      { type: "section", text: "Reporting Procedures" },
      {
        type: "paragraph",
        text:
          "The Employee understands that concerns may be reported through the channel(s) identified below, and " +
          "that reports may generally be made without disclosing the reporter's identity, where permitted.",
      },
      { type: "field", label: "Reporting Contact or Channel (e.g., hotline, email, manager): ", blank: TEXT_BLANK },

      { type: "section", text: "Non-Retaliation Protection" },
      {
        type: "paragraph",
        text:
          "The Company prohibits retaliation of any kind against any employee who, in good faith, reports " +
          "suspected misconduct or participates in an investigation into a report made under this policy. Any " +
          "employee who believes they have experienced retaliation should report it immediately using the " +
          "reporting channel identified above.",
      },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text:
          "The Company will make reasonable efforts to keep the identity of a reporting employee confidential " +
          "to the extent possible, consistent with the need to conduct a fair and thorough investigation and " +
          "any applicable legal requirements.",
      },

      { type: "section", text: "Employee's Understanding" },
      {
        type: "paragraph",
        text:
          "The Employee acknowledges having had the opportunity to review the whistleblower policy and ask " +
          "questions about it before signing, and understands that reports made in bad faith or known to be " +
          "false are not protected under this policy.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Acknowledgment shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Employee", order: 2 }] },
    ],
  },
  {
    slug: "trademark-license-agreement",
    title: "TRADEMARK LICENSE AGREEMENT",
    signerLabels: ["Licensor", "Licensee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Licensor: ", blank: TEXT_BLANK },
      { type: "field", label: "Licensee: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "The Licensed Mark" },
      {
        type: "paragraph",
        text: "This Agreement covers the license of the following trademark, brand name, or logo (the \"Mark\"):",
      },
      { type: "field", label: "Description of Mark: ", blank: TEXT_BLANK },
      { type: "field", label: "Registration Number (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Grant of License" },
      {
        type: "paragraph",
        text:
          "The Licensor grants the Licensee a license to use the Mark solely in connection with the goods, " +
          "services, or business activities described below, and subject to the terms of this Agreement. No " +
          "rights in the Mark are granted beyond those expressly stated here.",
      },
      { type: "field", label: "Permitted Use / Goods or Services: ", blank: TEXT_BLANK },

      { type: "section", text: "Exclusivity and Territory" },
      {
        type: "paragraph",
        text:
          "The license granted is non-exclusive unless the parties indicate otherwise below, and applies only " +
          "within the territory specified.",
      },
      { type: "field", label: "Exclusive / Non-Exclusive: ", blank: TEXT_BLANK },
      { type: "field", label: "Territory: ", blank: TEXT_BLANK },

      { type: "section", text: "Quality Control" },
      {
        type: "paragraph",
        text:
          "The Licensee agrees that all goods and services offered under the Mark will meet quality standards at " +
          "least equal to those the Licensor already maintains, and will not damage the reputation or goodwill " +
          "associated with the Mark. The Licensor may request samples of materials bearing the Mark and may " +
          "require reasonable corrections if quality standards are not met.",
      },

      { type: "section", text: "Royalty or Fee" },
      {
        type: "paragraph",
        text: "In consideration for the license granted, the Licensee will pay the Licensor as follows:",
      },
      { type: "field", label: "Royalty / Fee Amount and Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Term and Termination" },
      {
        type: "paragraph",
        text: `This Agreement begins on ${DATE_BLANK} and continues until terminated. Either party may terminate this Agreement upon written notice if the other party materially breaches its terms and fails to correct the breach within a reasonable period after notice. Upon termination, the Licensee will immediately stop using the Mark and remove it from any materials, signage, products, or marketing still in use.`,
      },

      { type: "section", text: "Ownership and Goodwill" },
      {
        type: "paragraph",
        text:
          "The Licensee acknowledges that the Licensor owns all right, title, and interest in the Mark, including " +
          "any goodwill generated by the Licensee's use of it, and that nothing in this Agreement transfers " +
          "ownership of the Mark to the Licensee.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Licensor", order: 1 }, { label: "Licensee", order: 2 }] },
    ],
  },
  {
    slug: "work-made-for-hire-agreement",
    title: "WORK MADE FOR HIRE AGREEMENT",
    signerLabels: ["Company", "Creator"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Creator: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Description of Engagement" },
      {
        type: "paragraph",
        text: "The Creator has been engaged to perform the following work or services on behalf of the Company:",
      },
      { type: "field", label: "Description of Work/Services: ", blank: TEXT_BLANK },
      { type: "field", label: "Expected Completion Date: ", blank: DATE_BLANK },

      { type: "section", text: "Work Made for Hire" },
      {
        type: "paragraph",
        text:
          "The parties agree that all deliverables, materials, and other work product created by the Creator in " +
          "connection with this engagement (the \"Work\") are intended to constitute \"work made for hire\" under " +
          "applicable copyright law, and that the Company is deemed the author and owner of the Work from the " +
          "moment of its creation.",
      },

      { type: "section", text: "Fallback Assignment" },
      {
        type: "paragraph",
        text:
          "To the extent any portion of the Work is found not to qualify as a work made for hire under applicable " +
          "law, the Creator hereby assigns, and agrees to assign, all right, title, and interest in that portion " +
          "of the Work to the Company, effective as of its creation, including all copyright and other " +
          "intellectual property rights in it.",
      },

      { type: "section", text: "Moral Rights" },
      {
        type: "paragraph",
        text:
          "To the extent permitted by law, the Creator waives any moral rights in the Work, including rights of " +
          "attribution and integrity, in favor of the Company.",
      },

      { type: "section", text: "Further Assurances" },
      {
        type: "paragraph",
        text:
          "The Creator agrees to sign any additional documents and take any further actions reasonably requested " +
          "by the Company to confirm or perfect the Company's ownership of the Work.",
      },

      { type: "section", text: "Consideration" },
      { type: "field", label: "Payment / Consideration: ", blank: TEXT_BLANK },

      { type: "section", text: "Representations" },
      {
        type: "paragraph",
        text:
          "The Creator represents that the Work will be original, that it will not infringe any third party's " +
          "rights, and that the Creator has not granted any conflicting rights in the Work to any other party.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Creator", order: 2 }] },
    ],
  },
  {
    slug: "patent-assignment-agreement",
    title: "PATENT ASSIGNMENT AGREEMENT",
    signerLabels: ["Assignor", "Assignee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Assignor: ", blank: TEXT_BLANK },
      { type: "field", label: "Assignee: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Description of Invention" },
      {
        type: "paragraph",
        text:
          "This Agreement covers the assignment of all rights in the following invention and any related patent " +
          "or patent application (the \"Patent Rights\"):",
      },
      { type: "field", label: "Title of Invention: ", blank: TEXT_BLANK },
      { type: "field", label: "Patent / Application Number (if any): ", blank: TEXT_BLANK },
      { type: "field", label: "Filing / Issue Date (if any): ", blank: DATE_BLANK },

      { type: "section", text: "Assignment of Rights" },
      {
        type: "paragraph",
        text:
          "The Assignor irrevocably assigns to the Assignee all right, title, and interest in and to the " +
          "invention described above, including the Patent Rights, any resulting patents anywhere in the world, " +
          "all priority rights, and the right to sue for and collect damages for past, present, and future " +
          "infringement.",
      },

      { type: "section", text: "Consideration" },
      { type: "field", label: "Payment / Consideration: ", blank: TEXT_BLANK },

      { type: "section", text: "Cooperation with Prosecution" },
      {
        type: "paragraph",
        text:
          "The Assignor agrees to reasonably cooperate with the Assignee, at the Assignee's request and expense, " +
          "in the preparation, filing, and prosecution of patent applications covering the invention, including " +
          "signing documents and providing information needed to secure, maintain, or enforce the Patent Rights.",
      },

      { type: "section", text: "Representations" },
      {
        type: "paragraph",
        text:
          "The Assignor represents that they are the original inventor (or the current lawful owner) of the " +
          "invention, that they have full authority to assign the Patent Rights, and that the Patent Rights are " +
          "free of any liens, licenses, or competing claims of ownership except as disclosed to the Assignee in " +
          "writing.",
      },

      { type: "section", text: "Future Improvements" },
      {
        type: "paragraph",
        text:
          "Unless the parties agree otherwise in writing, this Agreement covers only the invention described " +
          "above and does not extend to any separate inventions or improvements the Assignor develops " +
          "independently after the date of this Agreement.",
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
  {
    slug: "ip-licensing-agreement",
    title: "IP LICENSING AGREEMENT",
    signerLabels: ["Licensor", "Licensee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Licensor: ", blank: TEXT_BLANK },
      { type: "field", label: "Licensee: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Licensed IP" },
      {
        type: "paragraph",
        text:
          "This Agreement covers the license of the following intellectual property (the \"IP\"), which may " +
          "include software, content, a process, or other proprietary material:",
      },
      { type: "field", label: "Description of IP: ", blank: TEXT_BLANK },

      { type: "section", text: "Grant of License" },
      {
        type: "paragraph",
        text:
          "The Licensor grants the Licensee a license to use, and where indicated below to reproduce, distribute, " +
          "or modify, the IP solely for the purposes described below.",
      },
      { type: "field", label: "Permitted Use: ", blank: TEXT_BLANK },

      { type: "section", text: "Exclusivity and Territory" },
      {
        type: "paragraph",
        text:
          "The license granted is non-exclusive unless the parties indicate otherwise below, and applies only " +
          "within the territory specified.",
      },
      { type: "field", label: "Exclusive / Non-Exclusive: ", blank: TEXT_BLANK },
      { type: "field", label: "Territory: ", blank: TEXT_BLANK },

      { type: "section", text: "Fees or Royalty" },
      {
        type: "paragraph",
        text: "In consideration for the license granted, the Licensee will pay the Licensor as follows:",
      },
      { type: "field", label: "Fee / Royalty Amount and Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Term and Termination" },
      {
        type: "paragraph",
        text: `This Agreement begins on ${DATE_BLANK} and continues until terminated. Either party may terminate this Agreement upon written notice if the other party materially breaches its terms and fails to correct the breach within a reasonable period after notice. Upon termination, the Licensee will stop using the IP and, if requested, return or destroy any copies in its possession.`,
      },

      { type: "section", text: "Ownership" },
      {
        type: "paragraph",
        text:
          "The Licensor retains all right, title, and interest in the IP, including any modifications or " +
          "derivative works the Licensee creates under this Agreement, except to the extent the parties expressly " +
          "agree otherwise in writing. Nothing in this Agreement transfers ownership of the IP to the Licensee.",
      },

      { type: "section", text: "Representations" },
      {
        type: "paragraph",
        text:
          "The Licensor represents that it owns or otherwise has the right to license the IP, and that granting " +
          "this license does not violate any agreement with a third party.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Licensor", order: 1 }, { label: "Licensee", order: 2 }] },
    ],
  },
  {
    slug: "vendor-non-disclosure-agreement",
    title: "VENDOR NON-DISCLOSURE AGREEMENT",
    signerLabels: ["Company", "Vendor"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Vendor: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text:
          "The Company intends to share certain confidential information with the Vendor in connection with " +
          "evaluating, negotiating, or carrying out a potential supply, procurement, or vendor relationship (the " +
          "\"Purpose\"):",
      },
      { type: "field", label: "Description of Purpose: ", blank: TEXT_BLANK },

      { type: "section", text: "Confidential Information" },
      {
        type: "paragraph",
        text:
          "\"Confidential Information\" means any business, technical, financial, or other information disclosed " +
          "by the Company to the Vendor in connection with the Purpose, including specifications, pricing, " +
          "forecasts, business plans, and supplier or customer information, whether disclosed orally, in " +
          "writing, or in any other form, and whether or not marked as confidential.",
      },

      { type: "section", text: "Vendor's Obligations" },
      {
        type: "paragraph",
        text:
          "The Vendor agrees to keep the Confidential Information confidential, to use it only for the Purpose, " +
          "and not to disclose it to any third party without the Company's prior written consent. The Vendor " +
          "will limit access to the Confidential Information to its employees, subcontractors, and advisors who " +
          "need it for the Purpose and who are bound by confidentiality obligations at least as protective as " +
          "those in this Agreement.",
      },

      { type: "section", text: "Exclusions" },
      {
        type: "paragraph",
        text:
          "Confidential Information does not include information that is or becomes publicly available through " +
          "no fault of the Vendor, was already lawfully known to the Vendor before disclosure, is independently " +
          "developed by the Vendor without use of the Confidential Information, or is lawfully received from a " +
          "third party without restriction.",
      },

      { type: "section", text: "No License or Commitment" },
      {
        type: "paragraph",
        text:
          "Nothing in this Agreement obligates the Company to enter into any further business relationship with " +
          "the Vendor, and nothing grants the Vendor any license or rights in the Confidential Information beyond " +
          "the limited use permitted for the Purpose.",
      },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text: `This Agreement is effective as of ${DATE_BLANK} and the Vendor's confidentiality obligations will continue for ${TEXT_BLANK} after that date, or until the Confidential Information no longer qualifies for protection under the Exclusions above, whichever comes first.`,
      },

      { type: "section", text: "Return or Destruction of Materials" },
      {
        type: "paragraph",
        text:
          "Upon the Company's written request, or upon completion of the Purpose, the Vendor will promptly " +
          "return or destroy all materials containing Confidential Information and confirm that it has done so.",
      },

      { type: "section", text: "Remedies" },
      {
        type: "paragraph",
        text:
          "The Vendor acknowledges that unauthorized disclosure of Confidential Information may cause the " +
          "Company irreparable harm for which monetary damages alone may not be an adequate remedy, and that the " +
          "Company may seek injunctive relief in addition to any other remedies available at law.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Vendor", order: 2 }] },
    ],
  },
  {
    slug: "multi-party-non-disclosure-agreement",
    title: "MULTI-PARTY NON-DISCLOSURE AGREEMENT",
    signerLabels: ["Party A", "Party B"],
    blocks: [
      { type: "section", text: "Parties" },
      {
        type: "paragraph",
        text:
          "This Agreement is entered into by the following parties (each a \"Party\" and collectively the " +
          "\"Parties\"). Additional parties may be added to this Agreement by signing a counterpart or a joinder " +
          "page listing their name below; once added, an additional party is bound by, and entitled to the " +
          "protections of, this Agreement to the same extent as the Parties named here.",
      },
      { type: "field", label: "Party A: ", blank: TEXT_BLANK },
      { type: "field", label: "Party B: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Additional Party (if any): ", blank: TEXT_BLANK },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text: "The Parties intend to share confidential information with one another in connection with the following matter (the \"Purpose\"):",
      },
      { type: "field", label: "Description of Purpose: ", blank: TEXT_BLANK },

      { type: "section", text: "Confidential Information" },
      {
        type: "paragraph",
        text:
          "\"Confidential Information\" means any business, technical, financial, or other information disclosed " +
          "by one Party (the \"Disclosing Party\") to any other Party (the \"Receiving Party\") in connection " +
          "with the Purpose, whether disclosed orally, in writing, or in any other form, and whether or not " +
          "marked as confidential.",
      },

      { type: "section", text: "Mutual Obligations" },
      {
        type: "paragraph",
        text:
          "Each Party agrees that, when acting as a Receiving Party, it will keep the Confidential Information of " +
          "any other Party confidential, use it only for the Purpose, and not disclose it to anyone outside the " +
          "Parties without the Disclosing Party's prior written consent. These obligations run between each pair " +
          "of Parties individually — every Party owes confidentiality duties directly to every other Party, not " +
          "only to a single lead company.",
      },

      { type: "section", text: "Exclusions" },
      {
        type: "paragraph",
        text:
          "Confidential Information does not include information that is or becomes publicly available through " +
          "no fault of the Receiving Party, was already lawfully known to the Receiving Party before disclosure, " +
          "is independently developed by the Receiving Party without use of the Confidential Information, or is " +
          "lawfully received from a third party without restriction.",
      },

      { type: "section", text: "Access Within Each Party's Organization" },
      {
        type: "paragraph",
        text:
          "Each Receiving Party may share Confidential Information with its own employees, contractors, and " +
          "advisors who need it for the Purpose, provided they are bound by confidentiality obligations at least " +
          "as protective as those in this Agreement. Each Party remains responsible for any breach of this " +
          "Agreement by those it shares information with.",
      },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text: `This Agreement is effective as of ${DATE_BLANK} and each Party's confidentiality obligations will continue for ${TEXT_BLANK} after that date, regardless of whether the Parties' discussions or collaboration under the Purpose end sooner.`,
      },

      { type: "section", text: "No License or Commitment" },
      {
        type: "paragraph",
        text:
          "Nothing in this Agreement obligates any Party to enter into any further business relationship with " +
          "any other Party, and nothing grants any Party rights in another Party's Confidential Information " +
          "beyond the limited use permitted for the Purpose.",
      },

      { type: "section", text: "Remedies" },
      {
        type: "paragraph",
        text:
          "Each Party acknowledges that unauthorized disclosure of another Party's Confidential Information may " +
          "cause irreparable harm for which monetary damages alone may not be an adequate remedy, and that the " +
          "harmed Party may seek injunctive relief in addition to any other remedies available at law.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Party A", order: 1 }, { label: "Party B", order: 2 }] },
    ],
  },  {
    slug: "web-design-services-agreement",
    title: "WEB DESIGN SERVICES AGREEMENT",
    signerLabels: ["Client", "Designer"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Client: ", blank: TEXT_BLANK },
      { type: "field", label: "Designer: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Project Overview" },
      {
        type: "paragraph",
        text: "The Designer agrees to provide website design services for the project described below. This Agreement covers the design phase only and does not include ongoing hosting, domain registration, or software development beyond what is expressly described in the Scope of Design Services.",
      },
      { type: "field", label: "Project / Website Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Project Description: ", blank: TEXT_BLANK },

      { type: "section", text: "Scope of Design Services" },
      {
        type: "paragraph",
        text: "The Designer will provide the following design deliverables as part of this engagement:",
      },
      {
        type: "table",
        widths: [0.7, 0.3],
        headers: ["Deliverable", "Included / Notes"],
        rows: [
          ["Homepage mockup", TEXT_BLANK],
          ["Interior/inner page mockups", TEXT_BLANK],
          ["Mobile-responsive design", TEXT_BLANK],
          ["Style guide (colors, fonts, icons)", TEXT_BLANK],
        ],
      },
      { type: "field", label: "Number of Included Revision Rounds: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Revisions" },
      {
        type: "paragraph",
        text: "The fee described in this Agreement includes the number of revision rounds specified above. Additional revision requests beyond that number will be billed at an hourly or flat rate agreed upon by the parties in writing before the additional work begins.",
      },

      { type: "section", text: "Project Timeline" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "Target Completion Date: ", blank: DATE_BLANK },

      { type: "section", text: "Fees and Payment" },
      { type: "field", label: "Total Design Fee: ", blank: TEXT_BLANK },
      { type: "field", label: "Deposit Due on Signing: ", blank: TEXT_BLANK },
      { type: "field", label: "Balance Due Upon Completion: ", blank: TEXT_BLANK },

      { type: "section", text: "Client Responsibilities" },
      {
        type: "paragraph",
        text: "The Client is responsible for providing text content, images, logos, and other materials needed for the design in a timely manner. Delays in providing these materials may extend the project timeline accordingly.",
      },

      { type: "section", text: "Ownership and Intellectual Property" },
      {
        type: "paragraph",
        text: "Upon receipt of full and final payment, ownership of the final approved design files will transfer to the Client. Until full payment is received, all design work, drafts, and concepts remain the property of the Designer. The Designer retains the right to display the completed design in their portfolio and promotional materials unless the parties agree otherwise in writing.",
      },

      { type: "section", text: "Hosting and Domain Registration" },
      {
        type: "paragraph",
        text: "This Agreement covers design services only. Website hosting, domain name registration, and ongoing technical maintenance are not included and remain the sole responsibility of the Client unless separately agreed in writing.",
      },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text: "Each party agrees to keep confidential any non-public business, technical, or design information shared during the course of this engagement, and not to disclose it to third parties without prior written consent.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text: "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Client", order: 1 }, { label: "Designer", order: 2 }] },
    ],
  },
  {
    slug: "web-development-agreement",
    title: "WEB DEVELOPMENT AGREEMENT",
    signerLabels: ["Client", "Developer"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Client: ", blank: TEXT_BLANK },
      { type: "field", label: "Developer: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Project Overview" },
      {
        type: "paragraph",
        text: "The Developer agrees to build, test, and deploy a website or web application for the Client as described below. This Agreement governs the development work only; ongoing hosting fees, third-party software licenses, and content creation are the Client's responsibility unless stated otherwise.",
      },
      { type: "field", label: "Project Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Project Description: ", blank: TEXT_BLANK },

      { type: "section", text: "Technology Stack" },
      {
        type: "paragraph",
        text: "The website or application will be built using the following technologies, frameworks, and platforms:",
      },
      { type: "field", label: "Technology Stack: ", blank: TEXT_BLANK },
      { type: "field", label: "Hosting Environment: ", blank: TEXT_BLANK },

      { type: "section", text: "Scope of Development Services" },
      {
        type: "paragraph",
        text: "The Developer's services include building the agreed functionality, conducting functional and cross-browser testing, and deploying the completed work to the Client's chosen hosting environment. Features not described in the Project Description are considered out of scope and may require a separate change order and additional fee.",
      },

      { type: "section", text: "Project Milestones and Timeline" },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },
      { type: "field", label: "Target Launch Date: ", blank: DATE_BLANK },

      { type: "section", text: "Fees and Payment" },
      { type: "field", label: "Total Development Fee: ", blank: TEXT_BLANK },
      { type: "field", label: "Deposit Due on Signing: ", blank: TEXT_BLANK },
      { type: "field", label: "Remaining Balance Schedule: ", blank: TEXT_BLANK },

      { type: "section", text: "Testing and Acceptance" },
      {
        type: "paragraph",
        text: "Prior to launch, the Developer will provide the Client a testing or staging environment for review. The Client will have a reasonable period, not to exceed 10 business days unless otherwise agreed, to report any defects for correction before the work is considered accepted.",
      },

      { type: "section", text: "Post-Launch Maintenance and Support" },
      {
        type: "paragraph",
        text: "Following launch, the Developer will provide bug-fix support for defects in the delivered work at no additional charge for the period specified below. Support beyond this period, including new features, content updates, and third-party plugin updates, is available under a separate maintenance agreement.",
      },
      { type: "field", label: "Included Support Period After Launch: ", blank: TEXT_BLANK },

      { type: "section", text: "Source Code and Ownership" },
      {
        type: "paragraph",
        text: "Upon receipt of full and final payment, the Developer will transfer ownership of the custom source code created for this project to the Client. Pre-existing tools, libraries, frameworks, and reusable code owned by the Developer prior to this engagement remain the Developer's property and are licensed to the Client for use with the delivered project.",
      },

      { type: "section", text: "Third-Party Services and Costs" },
      {
        type: "paragraph",
        text: "Any third-party software licenses, hosting fees, domain registration costs, or API subscription fees required for the project are the responsibility of the Client and are not included in the Development Fee unless expressly stated.",
      },

      { type: "section", text: "Confidentiality" },
      {
        type: "paragraph",
        text: "Each party agrees to keep confidential any non-public business or technical information disclosed during this engagement and not to share it with third parties without prior written consent.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text: "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Client", order: 1 }, { label: "Developer", order: 2 }] },
    ],
  },
  {
    slug: "wedding-photography-contract",
    title: "WEDDING PHOTOGRAPHY CONTRACT",
    signerLabels: ["Client", "Photographer"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Client(s): ", blank: TEXT_BLANK },
      { type: "field", label: "Photographer: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Event Details" },
      { type: "field", label: "Wedding Date: ", blank: DATE_BLANK },
      { type: "field", label: "Ceremony Venue and Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Reception Venue and Address: ", blank: TEXT_BLANK },
      { type: "field", label: "Coverage Start Time: ", blank: TEXT_BLANK },

      { type: "section", text: "Coverage" },
      { type: "field", label: "Total Hours of Coverage: ", blank: TEXT_BLANK },
      { type: "field", label: "Number of Photographers Provided: ", blank: TEXT_BLANK },

      { type: "section", text: "Deliverables" },
      {
        type: "paragraph",
        text: "The Photographer will provide professionally edited digital photographs from the event. The approximate number of final edited images and the delivery timeline are as follows:",
      },
      { type: "field", label: "Approximate Number of Edited Images: ", blank: TEXT_BLANK },
      { type: "field", label: "Delivery Timeline After Event (e.g. weeks): ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "The Client will receive digital copies of the final edited images and may use them for personal purposes, including printing, sharing, and posting on personal social media accounts. Any print rights beyond personal use, or licensing of images for commercial purposes, must be separately agreed in writing.",
      },

      { type: "section", text: "Payment and Retainer" },
      { type: "field", label: "Total Package Price: ", blank: TEXT_BLANK },
      { type: "field", label: "Retainer/Deposit Due on Signing: ", blank: TEXT_BLANK },
      { type: "field", label: "Remaining Balance Due Date: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "The retainer is paid to secure the Photographer's services for the date listed above and is non-refundable except as required by law.",
      },

      { type: "section", text: "Cancellation and Rescheduling" },
      {
        type: "paragraph",
        text: "If the Client cancels the event, any amounts paid to date, other than the non-refundable retainer, will be refunded only if the Photographer is able to rebook the date. If the event is rescheduled, the Photographer will make reasonable efforts to accommodate the new date, but availability is not guaranteed. If the Photographer becomes unable to attend the event due to illness, emergency, or other circumstances beyond their control, the Photographer will make reasonable efforts to arrange a qualified substitute, or otherwise will refund all payments made for services not rendered.",
      },

      { type: "section", text: "Model Release and Portfolio Use" },
      {
        type: "paragraph",
        text: "The Client acknowledges and agrees that the Photographer may use images from the event for the Photographer's professional portfolio, website, social media, and other promotional and marketing materials, unless the Client opts out below.",
      },
      { type: "field", label: "Client Opts Out of Portfolio/Marketing Use (Yes/No): ", blank: TEXT_BLANK },

      { type: "section", text: "Liability" },
      {
        type: "paragraph",
        text: "The Photographer will use commercially reasonable efforts to capture and preserve all images but is not liable for lost, damaged, or corrupted images resulting from equipment failure, memory card corruption, or other circumstances beyond the Photographer's reasonable control. In such an event, the Photographer's liability is limited to a refund of fees paid for the affected portion of coverage.",
      },

      { type: "section", text: "Copyright" },
      {
        type: "paragraph",
        text: "The Photographer retains copyright ownership of all images taken during the event. The Client is granted a license to use the delivered images as described in the Deliverables section above.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text: "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Client", order: 1 }, { label: "Photographer", order: 2 }] },
    ],
  },
  {
    slug: "photography-services-agreement",
    title: "PHOTOGRAPHY SERVICES AGREEMENT",
    signerLabels: ["Client", "Photographer"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Client: ", blank: TEXT_BLANK },
      { type: "field", label: "Photographer: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Session Details" },
      { type: "field", label: "Type of Session (e.g. portrait, commercial, product, event): ", blank: TEXT_BLANK },
      { type: "field", label: "Session Date: ", blank: DATE_BLANK },
      { type: "field", label: "Session Location: ", blank: TEXT_BLANK },
      { type: "field", label: "Estimated Session Length: ", blank: TEXT_BLANK },

      { type: "section", text: "Scope of Services" },
      {
        type: "paragraph",
        text: "The Photographer agrees to provide photography services for the session described above, including reasonable direction during the session and post-production editing of the selected final images.",
      },

      { type: "section", text: "Usage Rights Granted to Client" },
      {
        type: "paragraph",
        text: "Upon delivery and payment in full, the Client is granted the following usage rights in the final images:",
      },
      { type: "field", label: "Scope of Use (personal, editorial, or commercial — specify): ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "Commercial use, including advertising, resale, or use in paid marketing campaigns, is permitted only if specified above and may be subject to an additional licensing fee. Any use beyond what is specified above requires the Photographer's prior written consent.",
      },

      { type: "section", text: "Photographer's Reserved Rights" },
      {
        type: "paragraph",
        text: "The Photographer retains copyright ownership of all images produced and may use the images for the Photographer's portfolio, website, social media, and self-promotion, unless the Client requests otherwise in writing prior to the session.",
      },

      { type: "section", text: "Fees and Payment" },
      { type: "field", label: "Session Fee: ", blank: TEXT_BLANK },
      { type: "field", label: "Deposit Due on Booking: ", blank: TEXT_BLANK },
      { type: "field", label: "Balance Due Date: ", blank: TEXT_BLANK },

      { type: "section", text: "Image Selection and Delivery" },
      {
        type: "paragraph",
        text: "The Photographer will provide the Client a selection of proofs from which the Client may choose final images for editing, unless otherwise agreed. Final edited images will be delivered digitally within the timeline specified below.",
      },
      { type: "field", label: "Delivery Timeline After Session: ", blank: TEXT_BLANK },

      { type: "section", text: "Cancellation and Rescheduling" },
      {
        type: "paragraph",
        text: "Either party may reschedule the session with reasonable advance notice, subject to the Photographer's availability. Deposits are non-refundable but may be applied to a rescheduled session date. Cancellations made with less than 48 hours' notice may forfeit the full session fee.",
      },

      { type: "section", text: "Model Releases" },
      {
        type: "paragraph",
        text: "Where the session includes identifiable people other than the Client, the Client is responsible for ensuring appropriate model releases have been obtained before any commercial use of the images, unless the Photographer separately arranges for model releases as part of this engagement.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text: "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Client", order: 1 }, { label: "Photographer", order: 2 }] },
    ],
  },
  {
    slug: "model-release-form",
    title: "MODEL RELEASE FORM",
    signerLabels: ["Photographer", "Model"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Photographer: ", blank: TEXT_BLANK },
      { type: "field", label: "Model: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Grant of Rights" },
      {
        type: "paragraph",
        text: "The Model grants the Photographer, and the Photographer's assigns and licensees, the irrevocable right to use, reproduce, edit, and publish photographs, video, and other likenesses of the Model taken on the date(s) below, in any medium now known or later developed, for the purpose(s) described in this release.",
      },
      { type: "field", label: "Date(s) of Photo/Video Session: ", blank: DATE_BLANK },
      { type: "field", label: "Location of Session: ", blank: TEXT_BLANK },

      { type: "section", text: "Permitted Uses" },
      {
        type: "paragraph",
        text: "The images and likeness described above may be used for the following purpose(s):",
      },
      { type: "field", label: "Permitted Use (commercial, editorial, portfolio, social media, or other — specify): ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "Any use materially different from the purpose specified above requires a separate written agreement between the parties.",
      },

      { type: "section", text: "Compensation" },
      { type: "field", label: "Compensation (enter 'Paid' or 'Unpaid'): ", blank: TEXT_BLANK },
      { type: "field", label: "If Paid, Compensation Amount: ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "If this release is unpaid, the Model acknowledges that participation in the session itself is the sole consideration for the rights granted, and no further compensation will be due.",
      },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text: "Unless a specific time limit is stated below, the rights granted in this release are perpetual and are not limited in duration.",
      },
      { type: "field", label: "Time Limit, if any (leave blank for no limit): ", blank: TEXT_BLANK },

      { type: "section", text: "Model's Representations" },
      {
        type: "paragraph",
        text: "The Model represents that they are at least 18 years of age and have the legal right to enter into this release, or that a parent or legal guardian has provided consent below on the Model's behalf.",
      },

      { type: "section", text: "Parent/Guardian Consent (if Model is a Minor)" },
      { type: "field", label: "Parent/Guardian Name (if applicable): ", blank: TEXT_BLANK },
      {
        type: "paragraph",
        text: "If the Model is under the age of majority in their jurisdiction, the parent or legal guardian identified above confirms they have the legal authority to consent on the Model's behalf and agrees to be bound by the terms of this release.",
      },

      { type: "section", text: "Waiver of Approval Rights" },
      {
        type: "paragraph",
        text: "The Model waives any right to inspect or approve the finished images, video, or related materials, and waives any claim to royalties or additional compensation beyond what is specified above, except as required by law.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text: "The parties agree to first attempt to resolve any dispute arising from this Agreement through good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Photographer", order: 1 }, { label: "Model", order: 2 }] },
    ],
  },
  {
    slug: "website-terms-of-service-acknowledgment",
    title: "WEBSITE TERMS OF SERVICE ACKNOWLEDGMENT",
    signerLabels: ["Company", "User"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "User: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text:
          "The Company operates a website and/or online service (the \"Service\") that is governed by a separately " +
          "published Terms of Service. This Acknowledgment is not itself the Terms of Service and does not restate " +
          "its provisions; it confirms that the User has read, understood, and agreed to be bound by the Terms of " +
          "Service currently in effect for the Service.",
      },

      { type: "section", text: "Terms of Service Reference" },
      { type: "field", label: "Terms of Service URL / Reference: ", blank: TEXT_BLANK },
      { type: "field", label: "Version / Effective Date of Terms Reviewed: ", blank: DATE_BLANK },

      { type: "section", text: "Acknowledgment of Review" },
      {
        type: "paragraph",
        text:
          "The User confirms having had a reasonable opportunity to access, read, and ask questions about the " +
          "Terms of Service referenced above prior to signing this Acknowledgment, and understands that continued " +
          "use of the Service is subject to those Terms.",
      },

      { type: "section", text: "Acceptance" },
      {
        type: "paragraph",
        text:
          "By signing below, the User agrees to comply with the Terms of Service and acknowledges that failure to " +
          "do so may result in suspension or termination of access to the Service, in accordance with the Terms " +
          "of Service.",
      },

      { type: "section", text: "Updates to the Terms of Service" },
      {
        type: "paragraph",
        text:
          "The User understands that the Company may update the Terms of Service from time to time, that the " +
          "current version will be made available at the reference above or a successor location, and that " +
          "continued use of the Service after an update constitutes acceptance of the revised Terms, as described " +
          "in the Terms of Service itself.",
      },

      { type: "section", text: "No Separate Agreement Created" },
      {
        type: "paragraph",
        text:
          "This Acknowledgment is a record confirming the User's acceptance of the Terms of Service and does not " +
          "modify, supersede, or add any terms beyond those set out in the Terms of Service.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Acknowledgment shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Acknowledgment through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "User", order: 2 }] },
    ],
  },
  {
    slug: "acceptable-use-policy-acknowledgment",
    title: "ACCEPTABLE USE POLICY ACKNOWLEDGMENT",
    signerLabels: ["Company", "User"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "User: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text:
          "The Company has adopted an Acceptable Use Policy governing what the User may and may not do when " +
          "accessing or using the Company's service (the \"Service\"). This Acknowledgment confirms that the User " +
          "has received, read, and agreed to comply with that policy.",
      },

      { type: "section", text: "Acceptable Use Policy Reference" },
      { type: "field", label: "Acceptable Use Policy URL / Reference: ", blank: TEXT_BLANK },
      { type: "field", label: "Version / Effective Date of Policy Reviewed: ", blank: DATE_BLANK },

      { type: "section", text: "Examples of Prohibited Uses" },
      {
        type: "paragraph",
        text:
          "Without limiting the full scope of the Acceptable Use Policy, prohibited uses of the Service include, " +
          "for example: sending unsolicited bulk messages or spam; uploading, storing, or transmitting content " +
          "that is illegal or infringes another party's rights; attempting to circumvent, disable, or interfere " +
          "with security features, access controls, or usage limits of the Service; and any use that disrupts or " +
          "places unreasonable load on the Service or its underlying infrastructure.",
      },

      { type: "section", text: "Acknowledgment of Review" },
      {
        type: "paragraph",
        text:
          "The User confirms having had a reasonable opportunity to access, read, and ask questions about the " +
          "Acceptable Use Policy referenced above prior to signing this Acknowledgment.",
      },

      { type: "section", text: "Consequences of Violation" },
      {
        type: "paragraph",
        text:
          "The User understands that violation of the Acceptable Use Policy may result in warning, suspension, or " +
          "termination of access to the Service, and may result in other consequences described in the Acceptable " +
          "Use Policy or applicable agreement with the Company.",
      },

      { type: "section", text: "Updates to the Policy" },
      {
        type: "paragraph",
        text:
          "The User understands that the Company may update the Acceptable Use Policy from time to time, that the " +
          "current version will be made available at the reference above or a successor location, and that " +
          "continued use of the Service after an update constitutes acceptance of the revised policy.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Acknowledgment shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles.`,
      },

      { type: "section", text: "Dispute Resolution" },
      {
        type: "paragraph",
        text:
          "The parties agree to first attempt to resolve any dispute arising from this Acknowledgment through " +
          "good-faith negotiation. If unresolved within 30 days, either party may pursue mediation or binding " +
          "arbitration before resorting to litigation.",
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "User", order: 2 }] },
    ],
  },
  {
    slug: "proprietary-information-and-inventions-agreement",
    title: "PROPRIETARY INFORMATION AND INVENTIONS AGREEMENT (PIIA)",
    signerLabels: ["Company", "Employee"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Company: ", blank: TEXT_BLANK },
      { type: "field", label: "Employee: ", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "Position: ", blank: TEXT_BLANK },
      { type: "field", label: "Start Date: ", blank: DATE_BLANK },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text:
          "In connection with the Employee's employment with the Company, this Agreement sets out the Employee's " +
          "obligations regarding the Company's proprietary information and the ownership of inventions and other " +
          "work product created in connection with that employment.",
      },

      { type: "section", text: "Definition of Proprietary Information" },
      {
        type: "paragraph",
        text:
          "\"Proprietary Information\" means non-public information belonging to the Company or disclosed to the " +
          "Company by others, including business plans, financial information, customer and supplier data, product " +
          "and technical designs, source code, algorithms, and other confidential business or technical information " +
          "the Employee learns or has access to during employment.",
      },

      { type: "section", text: "Confidentiality Obligations" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to use Proprietary Information only to perform their duties for the Company, to " +
          "hold it in confidence during and after employment, and not to disclose it to any third party without " +
          "the Company's prior written consent, except as required by law.",
      },

      { type: "section", text: "Assignment of Inventions" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to promptly disclose to the Company, and hereby assigns to the Company, all right, " +
          "title, and interest in any invention, discovery, design, work of authorship, or other work product that " +
          "the Employee conceives, develops, or reduces to practice, alone or with others, during the period of " +
          "employment, that (a) relates to the Company's actual or reasonably anticipated business, research, or " +
          "development, or (b) is created using the Company's equipment, facilities, time, or Proprietary " +
          "Information.",
      },

      { type: "section", text: "Prior Inventions" },
      {
        type: "paragraph",
        text:
          "Listed below are inventions the Employee made prior to employment that the Employee wishes to exclude " +
          "from this Agreement. If no inventions are listed, the Employee represents that there are none to " +
          "disclose.",
      },
      {
        type: "table",
        widths: [0.7, 0.3],
        headers: ["Title / Brief Description", "Approximate Date"],
        rows: [
          [TEXT_BLANK, DATE_BLANK],
          [TEXT_BLANK, DATE_BLANK],
          [TEXT_BLANK, DATE_BLANK],
        ],
      },

      { type: "section", text: "Duty to Disclose" },
      {
        type: "paragraph",
        text:
          "The Employee agrees to promptly and fully disclose to the Company any invention covered by this " +
          "Agreement, so that the Company may determine whether it wishes to claim rights under this Agreement.",
      },

      { type: "section", text: "Return of Materials" },
      {
        type: "paragraph",
        text:
          "Upon request or at the end of employment, the Employee agrees to return or destroy all materials " +
          "containing Proprietary Information, and all models, prototypes, and other embodiments of assigned " +
          "inventions, in the Employee's possession.",
      },

      { type: "section", text: "Important Notice Regarding Applicable Law" },
      {
        type: "paragraph",
        text:
          "This is a general-purpose template and is not a substitute for advice from a qualified attorney. The " +
          "scope of inventions and intellectual property that an employer may lawfully require an employee to " +
          "assign varies significantly by jurisdiction, and the laws of the state or country where the Employee " +
          "works (for example, statutes limiting assignment of inventions developed entirely on an employee's own " +
          "time, without use of the employer's resources, and unrelated to the employer's business) may narrow or " +
          "otherwise affect the scope of assignment described above. The parties should confirm the enforceability " +
          "of this Agreement in the relevant jurisdiction with qualified counsel before relying on it.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to its conflict-of-law principles, subject to the notice above regarding jurisdiction-specific limits on invention assignment.`,
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
      { type: "signatures", signers: [{ label: "Company", order: 1 }, { label: "Employee", order: 2 }] },
    ],
  },
  {
    slug: "short-form-mutual-nda",
    title: "SHORT-FORM MUTUAL NDA",
    signerLabels: ["Party A", "Party B"],
    blocks: [
      { type: "section", text: "Parties" },
      { type: "field", label: "Party A: ", blank: TEXT_BLANK },
      { type: "field", label: "Party B: ", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Purpose" },
      {
        type: "paragraph",
        text: `The parties wish to exchange confidential information for the purpose of ${TEXT_BLANK} (the "Purpose"), and each party may disclose confidential information to the other in connection with that Purpose.`,
      },

      { type: "section", text: "Confidential Information" },
      {
        type: "paragraph",
        text:
          "\"Confidential Information\" means any non-public information disclosed by one party to the other, in " +
          "any form, that is identified as confidential or that a reasonable person would understand to be " +
          "confidential given its nature and the circumstances of disclosure.",
      },

      { type: "section", text: "Obligations" },
      {
        type: "paragraph",
        text:
          "Each party agrees to keep the other party's Confidential Information confidential and to use it only " +
          "for the Purpose, and not to disclose it to any third party without the disclosing party's prior written " +
          "consent, except as required by law.",
      },

      { type: "section", text: "Term" },
      {
        type: "paragraph",
        text:
          "This Agreement, and each party's confidentiality obligations under it, remain in effect for 2 years " +
          "from the date of signing, unless earlier terminated by mutual written agreement of the parties.",
      },

      { type: "section", text: "Governing Law" },
      {
        type: "paragraph",
        text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}.`,
      },

      { type: "section", text: "Signatures" },
      { type: "signatures", signers: [{ label: "Party A", order: 1 }, { label: "Party B", order: 2 }] },
    ],
  },
  {
    slug: "reference-letter",
    title: "REFERENCE LETTER",
    signerLabels: ["Reference Provider"],
    blocks: [
      { type: "section", text: "Reference Provider" },
      { type: "field", label: "Reference Provider Name: ", blank: TEXT_BLANK },
      { type: "field", label: "Title / Organization: ", blank: TEXT_BLANK },
      { type: "field", label: "Contact Information: ", blank: TEXT_BLANK },

      { type: "section", text: "Person Being Referenced" },
      { type: "field", label: "Full Name: ", blank: TEXT_BLANK },

      { type: "section", text: "Relationship" },
      {
        type: "paragraph",
        text:
          "Describe your relationship to the person being referenced (for example: employer, supervisor, " +
          "colleague, landlord, client, or other capacity), and how long you have known them.",
      },
      { type: "field", label: "Relationship (e.g., employer, colleague, landlord): ", blank: TEXT_BLANK },
      { type: "field", label: "Known Since: ", blank: DATE_BLANK },
      { type: "field", label: "Known Until (or \"Present\"): ", blank: DATE_BLANK },

      { type: "section", text: "Recommendation" },
      {
        type: "paragraph",
        text:
          "Provide your assessment of the person named above, including relevant skills, character, conduct, and " +
          "any other observations that support this reference:",
      },
      { type: "field", label: "", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "", blank: TEXT_BLANK, gapBefore: 12 },
      { type: "field", label: "", blank: TEXT_BLANK, gapBefore: 12 },

      { type: "section", text: "Closing Statement" },
      {
        type: "paragraph",
        text:
          "The Reference Provider offers this reference in good faith, based on personal knowledge and experience, " +
          "and is willing to be contacted using the information above to answer further questions if needed.",
      },

      { type: "section", text: "Signature" },
      { type: "signatures", signers: [{ label: "Reference Provider", order: 1 }] },
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
