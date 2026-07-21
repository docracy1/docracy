import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { loadPdf } from "./pdfjs";

const INK = rgb(0.1, 0.1, 0.12);

export async function getPageCount(pdfBytes: Uint8Array): Promise<number> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

/** Rebuilds the PDF with pages in `order` (0-based indices into the CURRENT pdfBytes). A shorter
 *  list omits pages (delete); any permutation reorders them — both in one pass, since pdf-lib has
 *  no in-place "move page" primitive. */
export async function reorderPages(pdfBytes: Uint8Array, order: number[]): Promise<Uint8Array> {
  const src = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const dst = await PDFDocument.create();
  const copied = await dst.copyPages(src, order);
  copied.forEach((p) => dst.addPage(p));
  return dst.save();
}

/** Burns a short line of text directly onto the page at prepare time — for fixing a typo or
 *  filling in missing info. Distinct from a signer field: applied once by the preparer, not tied
 *  to any signer's turn. Coordinates are top-left-origin fractions, matching DocField. */
export async function addTextAnnotation(
  pdfBytes: Uint8Array,
  pageIndex: number,
  xFrac: number,
  yFrac: number,
  text: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.getPage(pageIndex);
  const { width, height } = page.getSize();
  const size = 12;
  page.drawText(text, { x: xFrac * width, y: height - yFrac * height - size, size, font, color: INK });
  return doc.save();
}

export interface TextSpan {
  page: number;
  text: string;
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
}

/** Finds the existing text runs on one page via pdf.js's text layer (the same data its own
 *  selectable-text overlay is built from), converted into the app's top-left-origin fractions so
 *  they can be rendered/clicked the same way signer fields already are. Assumes an unrotated page
 *  and axis-aligned text — true for the overwhelming majority of real-world documents, and the
 *  only case worth supporting for a "click existing text to fix it" tool rather than a full PDF
 *  text-layout engine. Boxes are padded generously since this is an approximation (baseline/font
 *  metrics, not real glyph bounds) — better to whiteout slightly more than to clip a fix short. */
export async function getPageTextSpans(pdfBytes: Uint8Array, pageIndex: number): Promise<TextSpan[]> {
  const pdf = await loadPdf(pdfBytes);
  try {
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale: 1 });
    const { items } = await page.getTextContent();
    const spans: TextSpan[] = [];
    for (const item of items) {
      if (!("str" in item) || !item.str.trim()) continue;
      const [, , c, d, e, f] = item.transform;
      const fontSize = Math.max(Math.hypot(c, d), 1);
      const totalHeight = Math.max(item.height || fontSize, fontSize) * 1.3;
      const boxBottom = f - totalHeight * 0.25;
      const width = item.width * 1.05;
      if (width <= 0 || totalHeight <= 0) continue;
      spans.push({
        page: pageIndex,
        text: item.str,
        xFrac: e / viewport.width,
        yFrac: (viewport.height - (boxBottom + totalHeight)) / viewport.height,
        wFrac: width / viewport.width,
        hFrac: totalHeight / viewport.height,
      });
    }
    return spans;
  } finally {
    await pdf.destroy();
  }
}

/** Covers an existing text run with a solid white box and (optionally) draws replacement text in
 *  its place — a visual overwrite, not true removal. The original text still exists in the PDF's
 *  content stream underneath, unlike replacePageWithImage's rasterize-based redaction; use this
 *  for correcting content, and Redact when what actually matters is that the old text can't be
 *  recovered. Assumes a white (or near-white) page background. */
export async function replaceTextSpan(
  pdfBytes: Uint8Array,
  pageIndex: number,
  box: { xFrac: number; yFrac: number; wFrac: number; hFrac: number },
  newText: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const page = doc.getPage(pageIndex);
  const { width: pageW, height: pageH } = page.getSize();
  const x = box.xFrac * pageW;
  const w = box.wFrac * pageW;
  const h = box.hFrac * pageH;
  const yTop = box.yFrac * pageH;
  const y = pageH - yTop - h;

  page.drawRectangle({ x, y, width: w, height: h, color: rgb(1, 1, 1) });

  if (newText.trim()) {
    const textSize = Math.min(h * 0.65, 12);
    page.drawText(newText, { x: x + 1, y: y + (h - textSize) / 2, size: textSize, font, color: INK });
  }

  return doc.save();
}

/** Renders one page to a PNG, optionally with a solid black box baked directly into the pixels —
 *  used ahead of replacePageWithImage for redaction, since drawing a box on top of a page that
 *  still has live vector text underneath would leave that text selectable/extractable. Rasterizing
 *  first and then replacing the page's content entirely is what actually removes it. */
export async function rasterizePageAsPng(
  pdfBytes: Uint8Array,
  pageIndex: number,
  blackoutFrac?: { xFrac: number; yFrac: number; wFrac: number; hFrac: number },
  scale = 2.5
): Promise<Uint8Array> {
  const pdf = await loadPdf(pdfBytes);
  try {
    const page = await pdf.getPage(pageIndex + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    const ctx = canvas.getContext("2d")!;
    await page.render({ canvasContext: ctx, viewport }).promise;
    if (blackoutFrac) {
      ctx.fillStyle = "#000";
      ctx.fillRect(
        blackoutFrac.xFrac * canvas.width,
        blackoutFrac.yFrac * canvas.height,
        blackoutFrac.wFrac * canvas.width,
        blackoutFrac.hFrac * canvas.height
      );
    }
    const dataUrl = canvas.toDataURL("image/png");
    const base64 = dataUrl.split(",")[1] ?? "";
    const binary = atob(base64);
    return Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } finally {
    await pdf.destroy();
  }
}

/** Replaces one page's content with a full-bleed image, discarding its original vector content —
 *  true redaction rather than an overlay. Every other page keeps its original (searchable,
 *  selectable) vector content untouched. */
export async function replacePageWithImage(pdfBytes: Uint8Array, pageIndex: number, pngBytes: Uint8Array): Promise<Uint8Array> {
  const src = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const dst = await PDFDocument.create();
  const pageCount = src.getPageCount();
  const indices = Array.from({ length: pageCount }, (_, i) => i);
  const copied = await dst.copyPages(src, indices);
  const png = await dst.embedPng(pngBytes);

  for (let i = 0; i < pageCount; i++) {
    if (i === pageIndex) {
      const { width, height } = copied[i].getSize();
      const blank = dst.addPage([width, height]);
      blank.drawImage(png, { x: 0, y: 0, width, height });
    } else {
      dst.addPage(copied[i]);
    }
  }
  return dst.save();
}
