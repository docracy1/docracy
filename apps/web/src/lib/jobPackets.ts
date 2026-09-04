/** After-they-sign kits: existing free templates in order, then Paid cobro where it applies. */

export type JobPacketStepKind = "template" | "cobro" | "prepare";

export interface JobPacketStep {
  slug: string;
  kind: JobPacketStepKind;
  step: number;
}

export interface JobPacketDef {
  id: string;
  i18nPrefix: string;
  enPath: string;
  esPath: string;
  steps: readonly JobPacketStep[];
  xDefault?: "es";
}

export const JOB_PACKETS = {
  trades: {
    id: "trades",
    i18nPrefix: "tradesPacket",
    enPath: "/packets/trades",
    esPath: "/es/kit-oficios",
    steps: [
      { slug: "work-order", kind: "template", step: 1 },
      { slug: "change-order-agreement", kind: "template", step: 2 },
      { slug: "cobro", kind: "cobro", step: 3 },
    ],
  },
  "latam-trade": {
    id: "latam-trade",
    i18nPrefix: "latamTradePacket",
    enPath: "/packets/latam-trade",
    esPath: "/es/kit-comercio",
    xDefault: "es",
    steps: [
      { slug: "sales-agreement", kind: "template", step: 1 },
      { slug: "purchase-order", kind: "template", step: 2 },
      { slug: "cobro", kind: "cobro", step: 3 },
    ],
  },
  collect: {
    id: "collect",
    i18nPrefix: "collectPacket",
    enPath: "/packets/collect",
    esPath: "/es/pide-documentos",
    steps: [
      { slug: "w-9-form", kind: "template", step: 1 },
      { slug: "mutual-nda", kind: "template", step: 2 },
      { slug: "rfc-upload", kind: "prepare", step: 3 },
    ],
  },
} as const satisfies Record<string, JobPacketDef>;

export type JobPacketId = keyof typeof JOB_PACKETS;

const COBRO_PACKET_IDS = new Set<string>(["latam-contractor", "trades", "latam-trade"]);

export function isJobPacketId(slug: string | null | undefined): slug is JobPacketId {
  return !!slug && Object.prototype.hasOwnProperty.call(JOB_PACKETS, slug);
}

export function isCobroPacketId(slug: string | null | undefined): boolean {
  return !!slug && COBRO_PACKET_IDS.has(slug);
}

function storageKey(id: string): string {
  return `docracy_packet_${id}`;
}

function readSent(id: string): string[] {
  try {
    const raw = sessionStorage.getItem(storageKey(id));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? parsed.filter((s) => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function markJobPacketStepSent(id: string, slug: string): void {
  const next = [...new Set([...readSent(id), slug])];
  try {
    sessionStorage.setItem(storageKey(id), JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

export function jobPacketSentSlugs(id: string): string[] {
  return readSent(id);
}

export function nextJobPacketStep(id: JobPacketId, justSent?: string): JobPacketStep | null {
  const sent = new Set(readSent(id));
  if (justSent) sent.add(justSent);
  return JOB_PACKETS[id].steps.find((s) => !sent.has(s.slug)) ?? null;
}

export function jobPacketPreparePath(id: JobPacketId, templateSlug: string, locale: "en" | "es"): string {
  const prepare = locale === "es" ? "/es/preparar" : "/prepare";
  return `${prepare}?freeTemplate=${templateSlug}&packet=${id}`;
}

export function jobPacketBlankPreparePath(id: JobPacketId, locale: "en" | "es"): string {
  const prepare = locale === "es" ? "/es/preparar" : "/prepare";
  return `${prepare}?packet=${id}`;
}

export function jobPacketCobroPath(id: JobPacketId, locale: "en" | "es"): string {
  const cobro = locale === "es" ? "/es/cobro" : "/cobro";
  return `${cobro}?packet=${id}#send`;
}

export function jobPacketPath(id: JobPacketId, locale: "en" | "es"): string {
  const def = JOB_PACKETS[id];
  return locale === "es" ? def.esPath : def.enPath;
}
