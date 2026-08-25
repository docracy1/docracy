import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { DocField } from "@docracy/shared";

/**
 * Port of apps/web/scripts/generateFreeTemplatePdfs.mjs's layout engine — same global PDF
 * standard as the static FREE_TEMPLATES catalog (margins, fonts, collapsing gaps, signature
 * blanks). Weekly-cron templates must use this so Marketplace PDFs match hand-authored ones.
 */

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

export const TEXT_BLANK = "_".repeat(28);
export const DATE_BLANK = "____ / ____ / ______";

const SIG_W = 0.26 * PAGE_W;
const SIG_H = 0.07 * PAGE_H;
const DATE_W = 0.16 * PAGE_W;
const DATE_H = 0.04 * PAGE_H;

export type TemplatePdfBlock =
  | { type: "section"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "field"; label: string; blank?: string; live?: "signature" | "date"; signerOrder?: number; gapBefore?: number }
  | { type: "table"; headers: string[]; rows: string[][]; widths: number[] }
  | { type: "signatures"; signers: Array<{ label: string; order: number }> };

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
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

/** Renders FreeTemplate-style blocks to a PDF + live DocField fractions (top-left origin). */
export async function renderTemplatePdf(
  title: string,
  blocks: TemplatePdfBlock[]
): Promise<{ pdfBytes: Uint8Array; fields: DocField[]; pageCount: number }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = CONTENT_TOP_Y;
  const fields: DocField[] = [];
  let fieldIdCounter = 0;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = CONTENT_TOP_Y;
  };
  const ensureSpace = (needed: number) => {
    if (y - needed < MARGIN_BOTTOM) newPage();
  };
  const drawText = (text: string, size: number, f: PDFFont, color = INK, x = MARGIN_LEFT) => {
    page.drawText(text, { x, y, size, font: f, color });
  };

  const titleWidth = bold.widthOfTextAtSize(title, TITLE_SIZE);
  drawText(title, TITLE_SIZE, bold, INK, MARGIN_LEFT + (CONTENT_W - titleWidth) / 2);
  y -= TITLE_SIZE * 1.4;

  let pendingGap = SECTION_GAP;
  const applyGap = (wanted: number) => {
    y -= Math.max(pendingGap, wanted);
    pendingGap = 0;
  };

  for (const block of blocks) {
    if (block.type === "section") {
      applyGap(SECTION_GAP);
      ensureSpace(SECTION_SIZE * 1.4);
      drawText(block.text, SECTION_SIZE, bold);
      y -= SECTION_SIZE * 1.4;
      pendingGap = 6;
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
      const blank = block.blank ?? (block.live === "date" ? DATE_BLANK : TEXT_BLANK);
      ensureSpace(BODY_SIZE * 1.4 + (block.live === "signature" ? SIG_H : block.live === "date" ? DATE_H : 0));
      const lineTopY = y;
      drawText(block.label + blank, BODY_SIZE, font);
      if (block.live && block.signerOrder) {
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
        y -= h;
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
      for (let i = 0; i < colWidths.length - 1; i++) colX.push(colX[i]! + colWidths[i]!);

      const drawRow = (cells: string[], f: PDFFont, color: typeof INK) => {
        cells.forEach((cell, i) => drawText(cell, TABLE_SIZE, f, color, colX[i]));
        y -= rowHeight;
        (page as PDFPage).drawLine({
          start: {
            x: MARGIN_LEFT,
            y: y + rowHeight - (rowHeight - TABLE_SIZE * 1.4) / 2 - TABLE_SIZE * 1.2,
          },
          end: {
            x: MARGIN_LEFT + CONTENT_W,
            y: y + rowHeight - (rowHeight - TABLE_SIZE * 1.4) / 2 - TABLE_SIZE * 1.2,
          },
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

  const pdfBytes = await doc.save();
  return { pdfBytes, fields, pageCount: doc.getPageCount() };
}
