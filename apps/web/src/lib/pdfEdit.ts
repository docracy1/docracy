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
