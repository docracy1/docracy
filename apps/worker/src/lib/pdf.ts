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

/** Signature and initials are drawn as an image (the signer's hand-drawn mark); text and date are
 *  drawn as plain text. A missing `type` means "signature" — see the doc comment on DocField. */
function isImageField(type: DocField["type"]): boolean {
  return type === undefined || type === "signature" || type === "initials";
}

/**
 * Burns one signer's submitted values into the given PDF bytes and returns the new PDF bytes.
 * Signature/initials fields draw the submitted image with the signer's email and the signing
 * date automatically printed in a caption strip underneath, so nobody has to place a separate
 * date/text field just to record that. Text/date fields draw the submitted string directly, sized
 * to fit the box, with no caption (it would just repeat information already visible in the field).
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

    if (isImageField(field.type)) {
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
    } else {
      // Text/date: size the font to fit the box height, cap it so a tall-but-narrow field doesn't
      // produce oversized text, and clip to the field's width by truncating (there's no PDF text
      // auto-wrap primitive worth the complexity here — fields are single-line by design).
      const textSize = Math.min(h * 0.6, 12);
      const maxChars = Math.max(Math.floor(w / (textSize * 0.55)), 1);
      const text = raw.length > maxChars ? `${raw.slice(0, maxChars - 1)}…` : raw;
      page.drawText(text, {
        x: x + 2,
        y: y + (h - textSize) / 2,
        size: textSize,
        font,
        color: INK,
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
