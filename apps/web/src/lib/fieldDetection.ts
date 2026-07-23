import { getPageTextSpans } from "./pdfEdit";
import type { TextSpan } from "./pdfEdit";
import type { DocField, DocFieldType } from "./types";

// Signature/initials get taller boxes to leave room for the auto-printed "email · date" caption
// text/date fields don't get — same convention as FIELD_SIZE_BY_TYPE in Prepare.tsx.
const FIELD_SIZE_BY_TYPE: Record<DocFieldType, { w: number; h: number }> = {
  signature: { w: 0.26, h: 0.07 },
  initials: { w: 0.1, h: 0.06 },
  text: { w: 0.22, h: 0.04 },
  date: { w: 0.16, h: 0.04 },
};

const SIGNATURE_RE = /\b(signature|sign(ed)?\s*here|authorized\s*signatory)\b/i;
const INITIALS_RE = /\binitial(s)?\b/i;
const DATE_RE = /\bdate\b/i;
const UNDERLINE_RE = /^[_\s]{3,}$/;
const VERTICAL_TOLERANCE = 0.012;

type Kind = DocFieldType;

function kindOf(text: string): Kind | null {
  const trimmed = text.trim();
  // Order matters: "Date of Signature" should read as a signature label, not a date one, so
  // signature/initials are checked first — a plain "Date:" line never mentions either word.
  if (SIGNATURE_RE.test(trimmed)) return "signature";
  if (INITIALS_RE.test(trimmed)) return "initials";
  if (DATE_RE.test(trimmed)) return "date";
  return null;
}

interface Candidate {
  page: number;
  xFrac: number;
  yFrac: number;
  wFrac: number;
  hFrac: number;
  kind: Kind;
}

/** Only treat a span as a "label" (rather than part of an ordinary sentence) when the keyword
 *  makes up most of its text — a short line like "Signature:" or "Date" qualifies; a paragraph
 *  that happens to mention "the signature above" doesn't. */
function looksLikeLabel(text: string): boolean {
  return text.trim().length <= 30;
}

/** Scans every page of a PDF for signature/initials/date blanks — either an explicit label
 *  ("Signature:", "Date", "Initial") or a lone underline run standing in for one — and returns
 *  best-guess field boxes for each, sorted top-to-bottom the same way this app's own free
 *  templates already order their fields. This is a heuristic to save manual placement time on a
 *  typical single-column contract layout, not a guaranteed-correct layout parser: it will miss
 *  unusual formats and occasionally guess the wrong kind, which is why every detected field
 *  remains a normal, freely movable/removable field afterward — same as one placed by hand. */
export async function detectFieldCandidates(pdfBytes: Uint8Array, totalPages: number): Promise<Candidate[]> {
  const spansByPage = await Promise.all(Array.from({ length: totalPages }, (_, i) => getPageTextSpans(pdfBytes, i)));
  const candidates: Candidate[] = [];

  for (let page = 0; page < spansByPage.length; page++) {
    const spans = spansByPage[page];
    const underlines = spans.filter((s) => UNDERLINE_RE.test(s.text));
    const labels = spans.filter((s) => looksLikeLabel(s.text) && kindOf(s.text));
    const usedUnderlines = new Set<TextSpan>();

    // Pair each label with the nearest underline run on roughly the same line (to its right —
    // "Signature: __________" — or the line directly below, the two layouts real contracts use
    // most). The underline's own box becomes the field, since that's where the blank actually is.
    for (const label of labels) {
      const kind = kindOf(label.text)!;
      const sameLine = underlines
        .filter((u) => !usedUnderlines.has(u) && Math.abs(u.yFrac - label.yFrac) < VERTICAL_TOLERANCE && u.xFrac >= label.xFrac)
        .sort((a, b) => a.xFrac - b.xFrac)[0];
      const lineBelow = underlines
        .filter((u) => !usedUnderlines.has(u) && u.yFrac > label.yFrac && u.yFrac - label.yFrac < 0.04)
        .sort((a, b) => a.yFrac - b.yFrac)[0];
      const target = sameLine ?? lineBelow;

      if (target) {
        usedUnderlines.add(target);
        candidates.push({
          page,
          xFrac: target.xFrac,
          yFrac: target.yFrac,
          wFrac: Math.max(target.wFrac, FIELD_SIZE_BY_TYPE[kind].w),
          hFrac: FIELD_SIZE_BY_TYPE[kind].h,
          kind,
        });
      } else {
        // No blank line found nearby — place the field just to the right of the label itself.
        candidates.push({
          page,
          xFrac: Math.min(label.xFrac + label.wFrac + 0.01, 1 - FIELD_SIZE_BY_TYPE[kind].w),
          yFrac: label.yFrac,
          wFrac: FIELD_SIZE_BY_TYPE[kind].w,
          hFrac: FIELD_SIZE_BY_TYPE[kind].h,
          kind,
        });
      }
    }

    // Any leftover underline with no nearby label at all defaults to a signature blank — by far
    // the most common unlabeled blank line in real contracts.
    for (const u of underlines) {
      if (usedUnderlines.has(u)) continue;
      candidates.push({
        page,
        xFrac: u.xFrac,
        yFrac: u.yFrac,
        wFrac: Math.max(u.wFrac, FIELD_SIZE_BY_TYPE.signature.w),
        hFrac: FIELD_SIZE_BY_TYPE.signature.h,
        kind: "signature",
      });
    }
  }

  return candidates.sort((a, b) => (a.page !== b.page ? a.page - b.page : a.yFrac - b.yFrac));
}

/** Splits detected candidates into `signerCount` contiguous top-to-bottom chunks, one per signer
 *  — matching the convention this app's own free templates already use for multi-party documents
 *  (Party A's block appears above Party B's). Good enough for the common case of a simple
 *  sequential contract; genuinely interleaved multi-party layouts will need manual correction. */
export function assignFieldsToSigners(candidates: Candidate[], signerCount: number, startId: number): DocField[] {
  if (candidates.length === 0 || signerCount === 0) return [];
  const perSigner = Math.ceil(candidates.length / signerCount);
  return candidates.map((c, i) => {
    const signerOrder = Math.min(Math.floor(i / perSigner) + 1, signerCount);
    return {
      id: `af${startId + i}`,
      signerOrder,
      page: c.page,
      xFrac: c.xFrac,
      yFrac: c.yFrac,
      wFrac: c.wFrac,
      hFrac: c.hFrac,
      type: c.kind,
    };
  });
}
