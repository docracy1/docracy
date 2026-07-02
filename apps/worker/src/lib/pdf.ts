import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { DocField } from "@docracy/shared";

export interface FieldValue {
  fieldId: string;
  /** data: URL (image/png) for signature fields, plain string for text/date fields */
  value: string;
}

/**
 * Burns one signer's submitted field values into the given PDF bytes and returns the new PDF bytes.
 * Coordinates are fractions of page width/height, origin top-left (matches how the browser places
 * fields over a rendered canvas), converted here to pdf-lib's bottom-left origin.
 */
export async function burnFields(
  pdfBytes: Uint8Array,
  fields: DocField[],
  values: FieldValue[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const valueById = new Map(values.map((v) => [v.fieldId, v.value]));

  for (const field of fields) {
    const raw = valueById.get(field.id);
    if (!raw) continue;

    const page = pdfDoc.getPage(field.page);
    const { width: pageW, height: pageH } = page.getSize();
    const x = field.xFrac * pageW;
    const w = field.wFrac * pageW;
    const h = field.hFrac * pageH;
    // yFrac is measured from the top of the page; pdf-lib draws from the bottom.
    const yTop = field.yFrac * pageH;
    const y = pageH - yTop - h;

    if (field.type === "signature") {
      const pngBytes = dataUrlToBytes(raw);
      const png = await pdfDoc.embedPng(pngBytes);
      const scaled = png.scaleToFit(w, h);
      page.drawImage(png, {
        x: x + (w - scaled.width) / 2,
        y: y + (h - scaled.height) / 2,
        width: scaled.width,
        height: scaled.height,
      });
    } else {
      const fontSize = Math.min(12, h * 0.7);
      page.drawText(raw, {
        x: x + 2,
        y: y + (h - fontSize) / 2,
        size: fontSize,
        font,
        color: rgb(0.07, 0.07, 0.09),
      });
    }
  }

  return pdfDoc.save();
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
