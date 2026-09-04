/** US company hiring someone they pay abroad — existing free templates + Paid cobro. */

export const LATAM_CONTRACTOR_PACKET_SLUG = "latam-contractor";

export type LatamPacketStepKind = "template" | "cobro";

export const LATAM_CONTRACTOR_PACKET_STEPS = [
  { slug: "mutual-nda", kind: "template" as const, step: 1 },
  { slug: "independent-contractor-agreement", kind: "template" as const, step: 2 },
  { slug: "cobro", kind: "cobro" as const, step: 3 },
] as const;

export type LatamPacketTemplateSlug = (typeof LATAM_CONTRACTOR_PACKET_STEPS)[number]["slug"] &
  ("mutual-nda" | "independent-contractor-agreement");

const STORAGE_KEY = "docracy_packet_latam-contractor";

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

export function markLatamPacketStepSent(slug: string): void {
  const next = [...new Set([...readSent(), slug])];
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function latamPacketSentSlugs(): string[] {
  return readSent();
}

export function nextLatamPacketStep(justSent?: string): (typeof LATAM_CONTRACTOR_PACKET_STEPS)[number] | null {
  const sent = new Set(readSent());
  if (justSent) sent.add(justSent);
  return LATAM_CONTRACTOR_PACKET_STEPS.find((s) => !sent.has(s.slug)) ?? null;
}

export function latamPacketPreparePath(slug: LatamPacketTemplateSlug, locale: "en" | "es"): string {
  const prepare = locale === "es" ? "/es/preparar" : "/prepare";
  return `${prepare}?freeTemplate=${slug}&packet=${LATAM_CONTRACTOR_PACKET_SLUG}`;
}

export function latamCobroPath(locale: "en" | "es"): string {
  const cobro = locale === "es" ? "/es/cobro" : "/cobro";
  return `${cobro}?packet=${LATAM_CONTRACTOR_PACKET_SLUG}`;
}
