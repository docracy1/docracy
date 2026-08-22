import { PDFDocument, StandardFonts, degrees, rgb, type PDFFont, type PDFPage, type PDFImage, type RGB } from "pdf-lib";
import qrcode from "qrcode-generator";
import type { DocField, DocState } from "@docracy/shared";
import { docracySealPngBytes } from "./docracySealPng";

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
 *  drawn as plain text; checkboxes draw a square + optional checkmark. A missing `type` means
 *  "signature" — see the doc comment on DocField. */
function isImageField(type: DocField["type"]): boolean {
  return type === undefined || type === "signature" || type === "initials";
}

function isCheckboxChecked(raw: string): boolean {
  return raw === "true" || raw === "1";
}

/**
 * Burns one signer's submitted values into the given PDF bytes and returns the new PDF bytes.
 * Signature/initials fields draw the submitted image with the signer's email and the signing
 * date automatically printed in a caption strip underneath, so nobody has to place a separate
 * date/text field just to record that. Text/date fields draw the submitted string directly, sized
 * to fit the box, with no caption (it would just repeat information already visible in the field).
 * Checkbox fields draw a square outline and a checkmark when checked.
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
    if (raw === undefined) continue;
    // Unchecked optional checkboxes still submit "false" — draw the empty box so the field is
    // visible on the PDF; only skip entirely when the value is missing from the submission.

    const page = pdfDoc.getPage(field.page);
    const { width: pageW, height: pageH } = page.getSize();
    const x = field.xFrac * pageW;
    const w = field.wFrac * pageW;
    const h = field.hFrac * pageH;
    // yFrac is measured from the top of the page; pdf-lib draws from the bottom.
    const yTop = field.yFrac * pageH;
    const y = pageH - yTop - h;

    if (field.type === "checkbox") {
      const size = Math.min(w, h);
      const inset = Math.max(size * 0.08, 0.5);
      page.drawRectangle({
        x: x + inset,
        y: y + inset,
        width: size - inset * 2,
        height: size - inset * 2,
        borderWidth: Math.max(size * 0.08, 0.75),
        borderColor: INK,
      });
      if (isCheckboxChecked(raw)) {
        const markSize = size * 0.7;
        page.drawText("X", {
          x: x + (size - markSize * 0.55) / 2,
          y: y + (size - markSize) / 2 + markSize * 0.1,
          size: markSize,
          font,
          color: INK,
        });
      }
    } else if (isImageField(field.type)) {
      if (!raw) continue;
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
      if (!raw) continue;
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
/** Matches the Docracy seal mark (#2F7ED8). */
const BRAND = rgb(47 / 255, 126 / 255, 216 / 255);
const FOOTER_INK = rgb(0.45, 0.45, 0.48);

/** Bottom safe zone for the per-page audit strip — keep clear of typical signature fields. */
const FOOTER_BOTTOM = 8;
const FOOTER_SEAL_SIZE = 12;
const FOOTER_FONT_SIZE = 6.5;

export interface PageFooterBrand {
  /** White-label workspace logo bytes (PNG/JPEG). When set, replaces the Docracy seal. */
  logoBytes?: Uint8Array | null;
  logoContentType?: string | null;
}

async function embedBrandImage(
  pdfDoc: PDFDocument,
  bytes: Uint8Array,
  contentType: string | null | undefined
): Promise<PDFImage | null> {
  const ct = (contentType ?? "").toLowerCase();
  try {
    if (ct.includes("jpeg") || ct.includes("jpg")) return await pdfDoc.embedJpg(bytes);
    if (ct.includes("png") || !ct) return await pdfDoc.embedPng(bytes);
    // WebP (and anything else) isn't embeddable via pdf-lib — skip the image.
    return null;
  } catch {
    return null;
  }
}

/**
 * Stamps a subtle audit footer on every page of the completed PDF.
 * Left: document id + completion timestamp. Right: "Secured by" + Docracy seal, or the
 * workspace's white-label logo when provided (no Docracy mark in that case).
 */
export async function stampPageFooters(
  pdfBytes: Uint8Array,
  opts: { docId: string; completedAt: string; brand?: PageFooterBrand | null }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const leftText = `ID ${opts.docId}  ·  ${new Date(opts.completedAt).toLocaleString()}`;

  const customBytes = opts.brand?.logoBytes ?? null;
  let rightImage: PDFImage | null = null;
  let useDocracySeal = true;

  if (customBytes && customBytes.byteLength > 0) {
    useDocracySeal = false;
    rightImage = await embedBrandImage(pdfDoc, customBytes, opts.brand?.logoContentType);
  }
  if (useDocracySeal) {
    rightImage = await pdfDoc.embedPng(docracySealPngBytes());
  }

  for (const page of pdfDoc.getPages()) {
    const { width: pageW } = page.getSize();
    const marginX = Math.min(36, pageW * 0.06);
    const textY = FOOTER_BOTTOM + (FOOTER_SEAL_SIZE - FOOTER_FONT_SIZE) / 2;

    page.drawText(leftText, {
      x: marginX,
      y: textY,
      size: FOOTER_FONT_SIZE,
      font,
      color: FOOTER_INK,
      maxWidth: pageW * 0.55,
    });

    if (!rightImage && !useDocracySeal) {
      // White-label logo present but not embeddable (e.g. WebP) — omit right brand rather than
      // falling back to Docracy, which would defeat white-label.
      continue;
    }
    if (!rightImage) continue;

    const scaled = rightImage.scaleToFit(FOOTER_SEAL_SIZE * 2.2, FOOTER_SEAL_SIZE);
    const label = "Secured by";
    const labelWidth = font.widthOfTextAtSize(label, FOOTER_FONT_SIZE);
    const gap = 3;
    const blockWidth = labelWidth + gap + scaled.width;
    const blockX = pageW - marginX - blockWidth;

    page.drawText(label, {
      x: blockX,
      y: textY,
      size: FOOTER_FONT_SIZE,
      font,
      color: FOOTER_INK,
    });
    page.drawImage(rightImage, {
      x: blockX + labelWidth + gap,
      y: FOOTER_BOTTOM,
      width: scaled.width,
      height: scaled.height,
    });
  }

  return pdfDoc.save();
}

/**
 * Draw uppercase text along a circular arc (outward-facing), centered on the top or bottom.
 * Used for honest law/level seals on the completion certificate — not QES/AES/PDF/A marks.
 */
function drawArcText(
  page: PDFPage,
  text: string,
  cx: number,
  cy: number,
  radius: number,
  font: PDFFont,
  size: number,
  color: RGB,
  position: "top" | "bottom"
) {
  const chars = [...text.toUpperCase()];
  if (chars.length === 0) return;
  const widths = chars.map((ch) => font.widthOfTextAtSize(ch, size));
  const tracking = size * 0.06;
  const total = widths.reduce((s, w) => s + w, 0) + tracking * (chars.length - 1);
  const span = total / radius;

  if (position === "top") {
    let angle = Math.PI / 2 + span / 2;
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i]!;
      const mid = angle - w / (2 * radius);
      const x = cx + radius * Math.cos(mid);
      const y = cy + radius * Math.sin(mid);
      const tangent = mid - Math.PI / 2;
      page.drawText(chars[i]!, {
        x: x - (w / 2) * Math.cos(tangent),
        y: y - (w / 2) * Math.sin(tangent),
        size,
        font,
        color,
        rotate: degrees((mid * 180) / Math.PI - 90),
      });
      angle -= (w + (i < chars.length - 1 ? tracking : 0)) / radius;
    }
  } else {
    let angle = -Math.PI / 2 - span / 2;
    for (let i = 0; i < chars.length; i++) {
      const w = widths[i]!;
      const mid = angle + w / (2 * radius);
      const x = cx + radius * Math.cos(mid);
      const y = cy + radius * Math.sin(mid);
      const tangent = mid + Math.PI / 2;
      page.drawText(chars[i]!, {
        x: x - (w / 2) * Math.cos(tangent),
        y: y - (w / 2) * Math.sin(tangent),
        size,
        font,
        color,
        rotate: degrees((mid * 180) / Math.PI + 90),
      });
      angle += (w + (i < chars.length - 1 ? tracking : 0)) / radius;
    }
  }
}

/** Circular law/level seal — double ring, center acronym, optional top/bottom arc phrases. */
function drawCircularSeal(
  page: PDFPage,
  cx: number,
  cy: number,
  size: number,
  bold: PDFFont,
  center: string,
  topArc: string,
  bottomArc?: string
) {
  const r = size / 2;
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: r,
    yScale: r,
    borderWidth: 1.6,
    borderColor: BRAND,
  });
  page.drawEllipse({
    x: cx,
    y: cy,
    xScale: r - 3.5,
    yScale: r - 3.5,
    borderWidth: 0.8,
    borderColor: BRAND,
  });

  const arcSize = Math.max(3.6, size * 0.095);
  const arcRadius = r - 5.2;
  drawArcText(page, topArc, cx, cy, arcRadius, bold, arcSize, BRAND, "top");
  if (bottomArc) {
    drawArcText(page, bottomArc, cx, cy, arcRadius, bold, arcSize, BRAND, "bottom");
  }

  const textSize = center.length > 4 ? size * 0.2 : size * 0.26;
  const tw = bold.widthOfTextAtSize(center, textSize);
  page.drawText(center, {
    x: cx - tw / 2,
    y: cy - textSize * 0.35,
    size: textSize,
    font: bold,
    color: BRAND,
  });
}

/** Dashed rectangle border — used for the info box and per-signer cards, matching a common
 *  signature-certificate convention of setting the "record" sections visually apart from the
 *  document's normal content. pdf-lib has no native dash support on drawRectangle, so this draws
 *  four dashed edges as separate lines. */
function drawDashedRect(page: PDFPage, x: number, y: number, width: number, height: number, color: RGB) {
  const dashArray = [3, 2];
  const opts = { color, thickness: 0.75, dashArray };
  page.drawLine({ start: { x, y: y + height }, end: { x: x + width, y: y + height }, ...opts });
  page.drawLine({ start: { x, y }, end: { x: x + width, y }, ...opts });
  page.drawLine({ start: { x, y }, end: { x, y: y + height }, ...opts });
  page.drawLine({ start: { x: x + width, y }, end: { x: x + width, y: y + height }, ...opts });
}

/** Renders a QR code as filled squares (one per dark module) — pdf-lib has no image codec for
 *  QR/barcode formats, but a QR code is just a boolean matrix, so this is drawn directly rather
 *  than going through an image embed. Encodes a short verification string (doc ID, signer order,
 *  and a hash prefix) rather than a URL — Docracy has no public document-lookup page today, so a
 *  link would point nowhere; the encoded string is honest about being a manual cross-reference,
 *  not a "scan to verify" web flow. */
function drawQrCode(page: PDFPage, data: string, x: number, y: number, size: number, color: RGB) {
  const qr = qrcode(0, "M");
  qr.addData(data);
  qr.make();
  const moduleCount = qr.getModuleCount();
  const cell = size / moduleCount;
  for (let row = 0; row < moduleCount; row++) {
    for (let col = 0; col < moduleCount; col++) {
      if (!qr.isDark(row, col)) continue;
      page.drawRectangle({
        x: x + col * cell,
        y: y + size - (row + 1) * cell,
        width: cell,
        height: cell,
        color,
      });
    }
  }
}

/**
 * A standalone one-page PDF documenting who signed, from where, when, and a hash of the final
 * signed document — deliberately separate from the signed PDF itself (not appended to it), so
 * hashing the delivered document and hashing "what this certificate attests to" refer to the
 * same, unambiguous bytes. Bounded to one page: the free tier caps signers at 2, so the signer
 * list + event log always fits comfortably on US Letter.
 *
 * Honest seals only: Docracy brand + SES + US ESIGN + UETA. No PDF/A, LTV, QES, or AES seals.
 */
export async function generateCertificate(doc: DocState, finalPdfSha256: string): Promise<Uint8Array> {
  const cert = await PDFDocument.create();
  const page = cert.addPage([612, 792]); // US Letter, points
  const font = await cert.embedFont(StandardFonts.Helvetica);
  const italic = await cert.embedFont(StandardFonts.HelveticaOblique);
  const bold = await cert.embedFont(StandardFonts.HelveticaBold);
  const seal = await cert.embedPng(docracySealPngBytes());
  const sealScaled = seal.scaleToFit(28, 28);

  const left = 56;
  const right = 556;
  const contentWidth = right - left;
  const events = doc.events ?? [];
  const signers = [...doc.signers].sort((a, b) => a.order - b.order);

  // --- Header: brand mark + title + subtitle ---
  let y = 736;
  page.drawImage(seal, { x: left, y: y - sealScaled.height + 6, width: sealScaled.width, height: sealScaled.height });
  page.drawText("DOCRACY", { x: left + sealScaled.width + 10, y: y - 16, size: 12, font: bold, color: BRAND });

  y -= 40;
  page.drawText("Signature Certificate", { x: left, y, size: 24, font: bold, color: INK });
  y -= 20;
  page.drawText("Technical record of this document's electronic signatures", { x: left, y, size: 11, font, color: MUTED });
  y -= 26;

  // --- Info box: what was signed, by/for whom, when ---
  const infoBoxTop = y;
  const infoBoxHeight = 74;
  drawDashedRect(page, left, infoBoxTop - infoBoxHeight, contentWidth, infoBoxHeight, BRAND);
  const col2X = left + contentWidth / 2 + 12;
  const labelSize = 8.5;
  const valueSize = 9;

  const infoField = (x: number, labelY: number, label: string, value: string) => {
    page.drawText(label, { x, y: labelY, size: labelSize, font: bold, color: INK });
    page.drawText(value, { x, y: labelY - 12, size: valueSize, font, color: MUTED });
  };
  const row1Y = infoBoxTop - 20;
  const row2Y = infoBoxTop - 50;
  infoField(left + 12, row1Y, "Certificate for document:", doc.title ?? `Document ${doc.docId}`);
  infoField(col2X, row1Y, "Created by:", doc.preparerEmail ?? "Anonymous sender (no account)");
  infoField(left + 12, row2Y, "Created on:", doc.completedAt ? new Date(doc.completedAt).toLocaleString() : "-");
  infoField(
    col2X,
    row2Y,
    "Delivered to:",
    signers.length === 1 ? signers[0]!.email : `${signers.length} signers — see below`
  );

  y = infoBoxTop - infoBoxHeight - 20;
  page.drawText(
    "This document was signed through Docracy's Simple Electronic Signature (SES) flow, aligned with the",
    { x: left, y, size: 8, font: italic, color: MUTED }
  );
  y -= 10;
  page.drawText(
    "U.S. ESIGN Act, UETA, and EU eIDAS — not identity-verified, and not a Qualified Electronic Signature.",
    { x: left, y, size: 8, font: italic, color: MUTED }
  );
  y -= 18;

  // --- Seal row: Docracy brand + SES + ESIGN + UETA (no PDF/A, LTV, QES, or AES) ---
  // Must stay >= ~50: the UETA seal's two-line arc text ("Uniform Electronic" / "Transactions
  // Act") collides with the center label at smaller radii — confirmed by rendering a real sample.
  const badgeSize = 52;
  const sealGap = 16;
  const brandBadgeSize = 38;
  const rowWidth = brandBadgeSize + sealGap + badgeSize * 3 + sealGap * 2;
  const rowLeft = left + Math.max(0, (contentWidth - rowWidth) / 2);
  const badgeCy = y - badgeSize / 2;

  const brandRowScaled = seal.scaleToFit(brandBadgeSize, brandBadgeSize);
  const brandCx = rowLeft + brandBadgeSize / 2;
  page.drawImage(seal, {
    x: brandCx - brandRowScaled.width / 2,
    y: badgeCy - brandRowScaled.height / 2,
    width: brandRowScaled.width,
    height: brandRowScaled.height,
  });

  const lawSeals: { center: string; top: string; bottom?: string }[] = [
    { center: "SES", top: "Simple Electronic", bottom: "Signature" },
    { center: "ESIGN", top: "US ESIGN Act" },
    { center: "UETA", top: "Uniform Electronic", bottom: "Transactions Act" },
  ];
  lawSeals.forEach((spec, i) => {
    const cx = rowLeft + brandBadgeSize + sealGap + badgeSize / 2 + i * (badgeSize + sealGap);
    drawCircularSeal(page, cx, badgeCy, badgeSize, bold, spec.center, spec.top, spec.bottom);
  });

  const captionY = badgeCy - badgeSize / 2 - 11;
  const captionSize = 6.5;
  const captions = ["Signed with Docracy", "eIDAS SES", "US ESIGN Act", "US UETA"];
  const centers = [
    brandCx,
    ...lawSeals.map((_, i) => rowLeft + brandBadgeSize + sealGap + badgeSize / 2 + i * (badgeSize + sealGap)),
  ];
  captions.forEach((label, i) => {
    const tw = font.widthOfTextAtSize(label, captionSize);
    page.drawText(label, { x: centers[i]! - tw / 2, y: captionY, size: captionSize, font, color: MUTED });
  });

  y = captionY - 20;
  page.drawText("Aligns with eIDAS SES and US ESIGN & UETA for many business documents.", {
    x: left,
    y,
    size: 8,
    font,
    color: MUTED,
  });
  y -= 10;
  page.drawText("No identity verification · Not AES/QES · Not PDF/A or PAdES-LTV", {
    x: left,
    y,
    size: 8,
    font,
    color: MUTED,
  });
  y -= 22;

  // --- Signer cards: one dashed-border card per signer, 2 per row ---
  page.drawText("Signers", { x: left, y, size: 13, font: bold, color: INK });
  y -= 18;

  const cardGap = 16;
  const cardWidth = (contentWidth - cardGap) / 2;
  const cardHeight = 92;
  const qrSize = 34;

  signers.forEach((signer, i) => {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const cardX = left + col * (cardWidth + cardGap);
    const cardTop = y - row * (cardHeight + cardGap);
    const cardY = cardTop - cardHeight;
    drawDashedRect(page, cardX, cardY, cardWidth, cardHeight, BRAND);

    const pad = 10;
    let cy = cardTop - pad - 10;
    page.drawText(`${signer.name}`, { x: cardX + pad, y: cy, size: 11, font: bold, color: INK });
    cy -= 13;
    page.drawText(signer.email, { x: cardX + pad, y: cy, size: 8, font, color: MUTED });
    cy -= 14;

    const cardSeal = seal.scaleToFit(18, 18);
    page.drawImage(seal, {
      x: cardX + cardWidth - pad - cardSeal.width,
      y: cardTop - pad - cardSeal.height + 4,
      width: cardSeal.width,
      height: cardSeal.height,
    });

    page.drawText("Simple Electronic Signature", { x: cardX + pad, y: cy, size: 8.5, font: bold, color: BRAND });
    cy -= 11;
    const signedEvent = events.find((e) => e.type === "signed" && e.signerOrder === signer.order);
    page.drawText(`Signer ID: ${doc.docId}-s${signer.order}`, { x: cardX + pad, y: cy, size: 7.5, font, color: MUTED });
    cy -= 10;
    page.drawText(
      `Signed: ${signer.signedAt ? new Date(signer.signedAt).toLocaleString() : "-"}${signedEvent?.ip ? ` · IP ${signedEvent.ip}` : ""}`,
      { x: cardX + pad, y: cy, size: 7.5, font, color: MUTED }
    );

    // Verification string is a manual cross-reference (doc + signer + hash prefix) — Docracy has
    // no public "scan to verify" lookup page today, so this deliberately isn't a URL.
    drawQrCode(
      page,
      `docracy:${doc.docId}:s${signer.order}:${finalPdfSha256.slice(0, 16)}`,
      cardX + cardWidth - pad - qrSize,
      cardY + pad,
      qrSize,
      INK
    );
    page.drawText("Hash ref", { x: cardX + cardWidth - pad - qrSize, y: cardY + pad - 8, size: 6, font, color: MUTED });
  });

  const cardRows = Math.ceil(signers.length / 2);
  y -= cardRows * (cardHeight + cardGap) + 4;

  // --- Footer: legal language + integrity hash + company info ---
  page.drawLine({ start: { x: left, y }, end: { x: right, y }, thickness: 0.5, color: rgb(0.85, 0.85, 0.87) });
  y -= 16;

  page.drawText("Finalizing this document locks it — the signed PDF's contents cannot change without", {
    x: left,
    y,
    size: 8.5,
    font: bold,
    color: INK,
  });
  y -= 11;
  page.drawText("invalidating the hash below, which is how any later tampering would be detected.", {
    x: left,
    y,
    size: 8.5,
    font: bold,
    color: INK,
  });
  y -= 16;

  const legalLines = [
    "Each signer confirmed their consent to sign electronically and the accuracy of the information used",
    "to sign, per the event log Docracy retains for this document. Processed under Docracy's Terms of",
    "Service (docracy.io/terms) and Privacy Policy (docracy.io/privacy). This signature is a Simple",
    "Electronic Signature aligned with the US ESIGN Act, UETA, and EU eIDAS — Docracy is not a Qualified",
    "Trust Service Provider and does not issue Qualified or Advanced Electronic Signatures. Documents are",
    "retained only for a limited period; see docracy.io/trust for the current retention window.",
  ];
  for (const line of legalLines) {
    page.drawText(line, { x: left, y, size: 7.5, font, color: MUTED });
    y -= 10;
  }
  if (doc.timestampGenTime) {
    page.drawText(`Trusted timestamp (RFC 3161, FreeTSA.org): ${new Date(doc.timestampGenTime).toLocaleString()}`, {
      x: left,
      y,
      size: 7.5,
      font,
      color: MUTED,
    });
    y -= 10;
  }
  y -= 6;

  // Company info (left) + integrity hash (right) — footer split matches the sidebar convention on
  // most signature-certificate templates: who operates this, and the technical proof, side by side.
  const footerTop = y;
  page.drawText("A service by docracy.io — free, no-signup electronic signatures", {
    x: left,
    y: footerTop,
    size: 7.5,
    font: bold,
    color: INK,
  });
  page.drawText("RELACON GmbH", { x: left, y: footerTop - 11, size: 7.5, font, color: MUTED });
  page.drawText("Elisabethstraße 15/5b, 1010 Vienna, Austria", { x: left, y: footerTop - 21, size: 7.5, font, color: MUTED });
  page.drawText("founder@docracy.io", { x: left, y: footerTop - 31, size: 7.5, font, color: MUTED });

  page.drawText(`Document ID: ${doc.docId}`, { x: col2X, y: footerTop, size: 7.5, font: bold, color: INK });
  page.drawText("SHA-256 of the final signed document:", { x: col2X, y: footerTop - 11, size: 7.5, font, color: MUTED });
  page.drawText(finalPdfSha256, { x: col2X, y: footerTop - 21, size: 7, font, color: INK });

  return cert.save();
}

/**
 * Concatenates PDFs into one, in order — used only to give a signer a single combined attachment
 * (signed document + certificate) in the completion email. The certificate is still generated and
 * hashed as a separate document beforehand (see generateCertificate's own doc comment on why), and
 * still stored separately in R2; this merge happens only at the point of email delivery, purely for
 * the recipient's convenience.
 */
export async function mergePdfs(pdfs: Uint8Array[]): Promise<Uint8Array> {
  const merged = await PDFDocument.create();
  for (const bytes of pdfs) {
    const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
    const pages = await merged.copyPages(doc, doc.getPageIndices());
    pages.forEach((page) => merged.addPage(page));
  }
  return merged.save();
}
