/** Upper bound for a <title>: Google shows about 60 characters before cutting. */
export const SEO_TITLE_MAX = 60;
/** Meta descriptions: 60 to 158 characters show in full on Google and Bing. */
export const SEO_DESCRIPTION_MIN = 120;
export const SEO_DESCRIPTION_MAX = 158;

/** Pad short SEO meta descriptions to Bing/Google-friendly length (120 to 158 chars). */
export function ensureMetaDescription(text: string, opts?: { min?: number; max?: number }): string {
  const min = opts?.min ?? SEO_DESCRIPTION_MIN;
  const max = opts?.max ?? SEO_DESCRIPTION_MAX;
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed.length >= min) {
    return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
  }
  const suffix = " Fill in and send for e-signature free on Docracy, no account required.";
  const base = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  const combined = base + suffix;
  return combined.length <= max ? combined : `${combined.slice(0, max - 1).trimEnd()}…`;
}

const CLAUSE_SEPARATORS = [": ", ", ", " · ", " | ", " ("];

/**
 * Brings a page title into the house style and under the length limit:
 * a dash before the brand becomes " | Docracy", every other dash used as a connector becomes a
 * colon, and a title over 60 characters first loses the brand suffix, then the last clause
 * (cut at a colon, comma or bracket), and as a last resort the last word.
 */
export function normalizeSeoTitle(title: string, max = SEO_TITLE_MAX): string {
  let t = title.replace(/\s+/g, " ").trim();
  t = t.replace(/\s+[—–]\s+Docracy$/, " | Docracy");
  t = t.replace(/\s+[—–]\s+/g, ": ");
  if (t.length <= max) return t;
  const bare = t.replace(/\s+\|\s+Docracy$/, "");
  if (bare.length <= max) return bare;
  const head = bare.slice(0, max + 1);
  let cut = -1;
  for (const sep of CLAUSE_SEPARATORS) {
    const i = head.lastIndexOf(sep);
    if (i > cut) cut = i;
  }
  if (cut >= Math.floor(max / 3)) return bare.slice(0, cut).trim();
  const space = head.lastIndexOf(" ");
  let words = (space > 0 ? bare.slice(0, space) : bare.slice(0, max)).trim();
  // A cut inside a clause should not end on a function word ("...Into a", "...de un").
  for (;;) {
    const m = /\s(\S+)$/.exec(words);
    if (!m || !TRAILING_STOPWORDS.has(m[1].toLowerCase())) break;
    words = words.slice(0, m.index).trim();
  }
  return words;
}

const TRAILING_STOPWORDS = new Set([
  "the", "a", "an", "of", "for", "to", "and", "&", "in", "on", "with", "or", "into", "by", "your", "no", "not",
  "de", "un", "una", "el", "la", "los", "las", "en", "y", "o", "para", "por", "con", "del", "al", "sin", "e",
]);
