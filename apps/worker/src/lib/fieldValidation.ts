import type { DocField } from "@docracy/shared";

export const FIELD_TYPES = new Set(["signature", "initials", "text", "date", "checkbox", "dropdown"]);
export const MAX_DROPDOWN_OPTIONS = 20;

/** Shared by routes/documents.ts and routes/account.ts's cobro "have them sign it first" path —
 *  both accept client-supplied field placements and need the same real checks (a field can't sit
 *  outside the page, claim a nonexistent signer, or use an unrecognized type) rather than trusting
 *  the client. Mutates dropdown fields' `options` in place (trims/dedupes-by-filter), matching the
 *  original inline behavior this was extracted from. Returns an error message, or null if valid. */
export function validateFields(
  fields: DocField[] | undefined,
  signerCount: number,
  pageCount: number,
  signerNames?: string[]
): string | null {
  if (!fields?.every((f) => f.signerOrder >= 1 && f.signerOrder <= signerCount)) {
    return "A field is assigned to a signer that doesn't exist";
  }
  const isFrac = (n: unknown): n is number => typeof n === "number" && n >= 0 && n <= 1;
  const geometryOk = fields.every(
    (f) =>
      Number.isInteger(f.page) &&
      f.page >= 0 &&
      f.page < pageCount &&
      isFrac(f.xFrac) &&
      isFrac(f.yFrac) &&
      isFrac(f.wFrac) &&
      isFrac(f.hFrac) &&
      f.xFrac + f.wFrac <= 1 &&
      f.yFrac + f.hFrac <= 1
  );
  if (!geometryOk) {
    return "A field is positioned outside the document";
  }
  const typeOk = fields.every((f) => f.type === undefined || FIELD_TYPES.has(f.type));
  if (!typeOk) {
    return "A field has an unrecognized type";
  }
  for (const f of fields) {
    if (f.type === "dropdown") {
      const opts = (f.options ?? []).map((o) => o.trim()).filter(Boolean);
      if (opts.length < 2) {
        return "Dropdown fields need at least two options";
      }
      if (opts.length > MAX_DROPDOWN_OPTIONS) {
        return `Dropdown fields support at most ${MAX_DROPDOWN_OPTIONS} options`;
      }
      f.options = opts;
    }
  }
  const signerOrdersWithFields = new Set(fields.map((f) => f.signerOrder));
  for (let order = 1; order <= signerCount; order++) {
    if (!signerOrdersWithFields.has(order)) {
      const name = signerNames?.[order - 1];
      return `${name || "A signer"} doesn't have a field placed yet`;
    }
  }
  return null;
}
