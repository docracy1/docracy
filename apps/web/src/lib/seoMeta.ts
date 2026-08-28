/** Pad short SEO meta descriptions to Bing/Google-friendly length (~120–160 chars). */
export function ensureMetaDescription(text: string, opts?: { min?: number; max?: number }): string {
  const min = opts?.min ?? 120;
  const max = opts?.max ?? 160;
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed.length >= min) {
    return trimmed.length <= max ? trimmed : `${trimmed.slice(0, max - 1).trimEnd()}…`;
  }
  const suffix = " Fill in and send for e-signature free on Docracy — no account required.";
  const base = trimmed.endsWith(".") ? trimmed : `${trimmed}.`;
  const combined = base + suffix;
  return combined.length <= max ? combined : `${combined.slice(0, max - 1).trimEnd()}…`;
}
