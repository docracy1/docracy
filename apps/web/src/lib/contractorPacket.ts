/** One US contractor onboarding kit — existing free templates, no extra vendor cost. */

export const US_CONTRACTOR_PACKET_SLUG = "us-contractor";

export const US_CONTRACTOR_PACKET_TEMPLATES = [
  { slug: "mutual-nda", step: 1 },
  { slug: "w-9-form", step: 2 },
  { slug: "independent-contractor-agreement", step: 3 },
] as const;

export type ContractorPacketTemplateSlug = (typeof US_CONTRACTOR_PACKET_TEMPLATES)[number]["slug"];

const STORAGE_KEY = "docracy_packet_us-contractor";

function readSent(): string[] {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function markPacketTemplateSent(slug: string): void {
  const next = [...new Set([...readSent(), slug])];
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function packetSentSlugs(): string[] {
  return readSent();
}

export function nextPacketTemplate(justSent?: string): ContractorPacketTemplateSlug | null {
  const sent = new Set(readSent());
  if (justSent) sent.add(justSent);
  const next = US_CONTRACTOR_PACKET_TEMPLATES.find((t) => !sent.has(t.slug));
  return next?.slug ?? null;
}

export function packetPreparePath(slug: ContractorPacketTemplateSlug, locale: "en" | "es"): string {
  const prepare = locale === "es" ? "/es/preparar" : "/prepare";
  return `${prepare}?freeTemplate=${slug}&packet=${US_CONTRACTOR_PACKET_SLUG}`;
}
