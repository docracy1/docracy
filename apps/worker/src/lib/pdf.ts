import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import type { DocField, DocState } from "@docracy/shared";

export interface FieldValue {
  fieldId: string;
  /** data: URL (image/png) of the drawn signature. */
  value: string;
}

export const MAX_SIGNATURE_IMAGE_BYTES = 2 * 1024 * 1024; // 2MB decoded, per field

/** Estimated decoded byte size of a base64 data: URL, without actually decoding it. */
export function decodedByteLength(dataUrl: string): number {
  const base64 = dataUrl.split(",")[1] ?? dataUrl;
  return Math.floor((base64.length * 3) / 4);
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
  // ignoreEncryption: many "protected" PDF exports (banks, government forms, Adobe's own
  // restrict-printing/copying option) set an /Encrypt dictionary with an empty user password —
  // every viewer opens them fine, but pdf-lib throws EncryptedPDFError by default.
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
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

const MUTED = rgb(0.4, 0.4, 0.42);
const INK = rgb(0.1, 0.1, 0.12);

/**
 * A standalone one-page PDF documenting who signed, from where, when, and a hash of the final
 * signed document — deliberately separate from the signed PDF itself (not appended to it), so
 * hashing the delivered document and hashing "what this certificate attests to" refer to the
 * same, unambiguous bytes. Bounded to one page: the free tier caps signers at 2, so the signer
 * list + event log always fits comfortably on US Letter.
 */
export async function generateCertificate(doc: DocState, finalPdfSha256: string): Promise<Uint8Array> {
  const cert = await PDFDocument.create();
  const page = cert.addPage([612, 792]); // US Letter, points
  const font = await cert.embedFont(StandardFonts.Helvetica);
  const bold = await cert.embedFont(StandardFonts.HelveticaBold);

  const left = 56;
  let y = 740;

  const write = (text: string, size: number, f: PDFFont, color = INK) => {
    page.drawText(text, { x: left, y, size, font: f, color });
    y -= size + 8;
  };

  write("Certificate of Completion", 20, bold);
  y -= 4;
  write(`Document ID: ${doc.docId}`, 10, font, MUTED);
  write(`Completed: ${doc.completedAt ? new Date(doc.completedAt).toLocaleString() : "-"}`, 10, font, MUTED);
  y -= 8;

  write("Signers", 13, bold);
  const events = doc.events ?? [];
  for (const signer of [...doc.signers].sort((a, b) => a.order - b.order)) {
    const signedEvent = events.find((e) => e.type === "signed" && e.signerOrder === signer.order);
    write(`${signer.order}. ${signer.name} <${signer.email}>`, 11, font);
    write(
      `   Signed ${signer.signedAt ? new Date(signer.signedAt).toLocaleString() : "-"} from IP ${signedEvent?.ip ?? "unknown"}`,
      9,
      font,
      MUTED
    );
  }
  y -= 8;

  write("Each signer explicitly confirmed their consent to sign electronically", 9, font, MUTED);
  write("before submitting a signature — see the event log below.", 9, font, MUTED);
  y -= 8;

  write("Integrity", 13, bold);
  write("SHA-256 of the final signed document:", 9, font, MUTED);
  write(finalPdfSha256, 9, font, INK);
  if (doc.timestampGenTime) {
    write("Trusted timestamp (RFC 3161, FreeTSA.org):", 9, font, MUTED);
    write(new Date(doc.timestampGenTime).toLocaleString(), 9, font, INK);
  }
  y -= 8;

  write("Event log", 13, bold);
  for (const e of events) {
    const who = e.signerOrder != null ? doc.signers.find((s) => s.order === e.signerOrder)?.name ?? `signer ${e.signerOrder}` : "system";
    const ipSuffix = e.ip ? ` from ${e.ip}` : "";
    write(`${new Date(e.timestamp).toLocaleString()} — ${e.type} (${who})${ipSuffix}`, 8, font, MUTED);
  }

  return cert.save();
}
