import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { DocField } from "@docracy/shared";

export interface FieldValue {
  fieldId: string;
  /** data: URL (image/png) of the drawn signature. */
  value: string;
}

/**
 * Burns one signer's submitted signatures into the given PDF bytes and returns the new PDF bytes.
 * Every field is a signature — the drawn image goes in the top of the box, with the signer's
 * email and the signing date automatically printed in a caption strip underneath, so nobody has
 * to place a separate date/text field for that.
 * Coordinates are fractions of page width/height, origin top-left (matches how the browser places
 * fields over a rendered canvas), converted here to pdf-lib's bottom-left origin.
 */
export async function burnFields(
  pdfBytes: Uint8Array,
  fields: DocField[],
  values: FieldValue[],
  signerEmail: string,
  signedAtIso: string
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes);
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const valueById = new Map(values.map((v) => [v.fieldId, v.value]));
  const caption = `${signerEmail} · ${new Date(signedAtIso).toLocaleDateString()}`;

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

    const captionSize = Math.min(7, h * 0.3);
    const captionHeight = captionSize + 2;
    const imageAreaHeight = Math.max(h - captionHeight, h * 0.5);

    const pngBytes = dataUrlToBytes(raw);
    const png = await pdfDoc.embedPng(pngBytes);
    const scaled = png.scaleToFit(w, imageAreaHeight);
    page.drawImage(png, {
      x: x + (w - scaled.width) / 2,
      y: y + captionHeight + (imageAreaHeight - scaled.height) / 2,
      width: scaled.width,
      height: scaled.height,
    });

    page.drawText(caption, {
      x,
      y: y + (captionHeight - captionSize) / 2,
      size: captionSize,
      font,
      color: rgb(0.35, 0.35, 0.38),
    });
  }

  return pdfDoc.save();
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}
