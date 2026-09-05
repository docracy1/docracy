import { LATAM_COUNTRY_CORRIDORS } from "./latamCountryCorridors";
import { OFFICIAL_DESTINATIONS, WHO_FILES_ROWS, WHO_FILES_WHERE_EN } from "./whoFilesWhere";

export const LATAM_SEARCH_EN = "/latam-search";
export const LATAM_SEARCH_ES = "/es/buscar";

export type LatamSearchKind = "playbook" | "country" | "door" | "honest-no";

export type LatamSearchEntry = {
  id: string;
  kind: LatamSearchKind;
  /** Accent-insensitive needles. Keep Spanish queries first — this is the ES front door. */
  aliases: string[];
  titleKey: string;
  blurbKey: string;
  weDontKey?: string;
  officialHref?: string;
  officialKey?: string;
  docracyTo: string;
};

export const LATAM_SEARCH_CHIPS = [
  { q: "I-9", labelKey: "latamSearch.chip.i9" },
  { q: "apostilla México", labelKey: "latamSearch.chip.apostilleMx" },
  { q: "I-94", labelKey: "latamSearch.chip.i94" },
  { q: "constancia", labelKey: "latamSearch.chip.constancia" },
  { q: "cobro", labelKey: "latamSearch.chip.cobro" },
  { q: "ITIN", labelKey: "latamSearch.chip.itin" },
  { q: "DS-160", labelKey: "latamSearch.chip.ceac" },
] as const;

const PLAYBOOK_ALIASES: Record<string, string[]> = {
  offer: ["oferta", "offer letter", "contrato de trabajo", "employment agreement", "carta oferta"],
  i9: ["i-9", "i9", "formulario i-9", "form i-9", "empleo primer dia", "seccion 1"],
  everify: ["e-verify", "everify", "e verify", "verificar empleo"],
  visa: ["visa", "i-129", "i-130", "i-485", "i-864", "peticion", "supporting documents", "documentos para visa"],
  ceac: ["ds-160", "ds160", "ceac", "formulario ds-160", "visa no inmigrante"],
  uscis: ["uscis", "peticion uscis", "boundless", "citizenpath", "gestoria"],
  uscisAccount: ["cuenta uscis", "myaccount", "e-coa", "eco a"],
  i94: ["i-94", "i94", "admision", "cbp", "ya llegue", "despues de llegar"],
  address: ["cambio de domicilio", "address change", "ar-11", "ar11", "nueva direccion"],
  ssn: ["ssn", "seguro social", "social security", "ss-5", "ss5"],
  itin: ["itin", "w-7", "w7", "numero de impuesto", "tin sin ssn"],
  w9: ["w-9", "w9", "persona de ee uu", "us person"],
  apostille: ["apostilla", "apostille", "legalizacion", "hcch", "haya"],
  poa: ["poder", "poder notarial", "power of attorney", "poa"],
  child: ["viaje menor", "child travel", "consentimiento menor", "custodia viaje"],
  lease: ["renta", "arrendamiento", "lease", "roomie", "roommate", "depa"],
  constancia: ["constancia", "prueba de ingresos", "income proof", "landlord", "arrendador"],
  cobro: ["cobro", "factura", "mercadopago", "paypal", "whatsapp cobro", "cobrar"],
};

const DOORS: LatamSearchEntry[] = [
  {
    id: "door-kit",
    kind: "door",
    aliases: ["kit", "plan inmigrante", "llegar eeuu", "immigrant plan", "paquete latam"],
    titleKey: "footer.latamUsPacket",
    blurbKey: "landing.out7.body",
    docracyTo: "/packets/latam-to-us",
  },
  {
    id: "door-who",
    kind: "door",
    aliases: ["quien sube", "who files", "checklist", "mapa", "a donde va"],
    titleKey: "footer.whoFiles",
    blurbKey: "dash.corridorWhoFiles",
    docracyTo: WHO_FILES_WHERE_EN,
  },
  {
    id: "door-after",
    kind: "door",
    aliases: ["despues de llegar", "after arrival", "ya llegue", "primera semana"],
    titleKey: "footer.afterArrival",
    blurbKey: "dash.corridorAfterArrival",
    docracyTo: "/after-arrival",
  },
  {
    id: "door-housing",
    kind: "door",
    aliases: ["vivienda", "housing", "houston", "miami", "renta eeuu"],
    titleKey: "footer.immigrantHousing",
    blurbKey: "dash.corridorHousing",
    docracyTo: "/immigrant-housing",
  },
];

const HONEST_NOS: LatamSearchEntry[] = [
  {
    id: "no-cfdi",
    kind: "honest-no",
    aliases: ["cfdi", "pac", "timbrar", "factura electronica sat", "e.firma", "efirma"],
    titleKey: "latamSearch.no.cfdi.title",
    blurbKey: "latamSearch.no.cfdi.blurb",
    weDontKey: "whoFiles.weDont.cobro",
    docracyTo: "/cobro#send",
  },
  {
    id: "no-dian",
    kind: "honest-no",
    aliases: ["dian", "factura dian", "siigo factura", "nomina electronica"],
    titleKey: "latamSearch.no.dian.title",
    blurbKey: "latamSearch.no.dian.blurb",
    weDontKey: "whoFiles.weDont.cobro",
    docracyTo: "/siigo-alternative",
  },
  {
    id: "no-w8",
    kind: "honest-no",
    aliases: ["w-8ben", "w8ben", "w-8", "w8"],
    titleKey: "latamSearch.no.w8.title",
    blurbKey: "latamSearch.no.w8.blurb",
    weDontKey: "whoFiles.weDont.w9",
    officialHref: OFFICIAL_DESTINATIONS.w9,
    officialKey: "latamUsPacket.send.w9.official",
    docracyTo: "/packets/latam-contractor",
  },
  {
    id: "no-file-uscis",
    kind: "honest-no",
    aliases: ["tramitar visa", "presentar i-129", "file uscis", "abogado visa barato"],
    titleKey: "latamSearch.no.file.title",
    blurbKey: "latamSearch.no.file.blurb",
    weDontKey: "whoFiles.weDont.uscis",
    officialHref: OFFICIAL_DESTINATIONS.uscisAccount,
    officialKey: "latamUsPacket.send.uscisAccount.official",
    docracyTo: "/boundless-alternative",
  },
];

function playbookEntries(): LatamSearchEntry[] {
  return WHO_FILES_ROWS.map((row) => ({
    id: `playbook-${row.id}`,
    kind: "playbook" as const,
    aliases: PLAYBOOK_ALIASES[row.id] ?? [row.id],
    titleKey: row.titleKey,
    blurbKey: row.bodyKey,
    weDontKey: row.weDontKey,
    officialHref: row.officialHref,
    officialKey: row.officialKey,
    docracyTo: row.docracyTo ?? `${WHO_FILES_WHERE_EN}#who-files-${row.group}`,
  }));
}

function countryEntries(): LatamSearchEntry[] {
  return LATAM_COUNTRY_CORRIDORS.map((c) => ({
    id: `country-${c.slug}`,
    kind: "country" as const,
    aliases: [
      c.countryEn,
      c.countryEs,
      c.cityEn,
      c.cityEs,
      `apostilla ${c.countryEs}`,
      `apostille ${c.countryEn}`,
      `legalizacion ${c.countryEs}`,
      c.apostilleLabelEn,
      c.apostilleLabelEs,
      c.slug.replace(/-to-us$/, ""),
    ],
    titleKey: "latamSearch.countryFallback",
    blurbKey: "whoFiles.apostillePickHint",
    weDontKey: "whoFiles.weDont.apostille",
    officialHref: c.officialHref,
    docracyTo: c.enPath,
  }));
}

let cachedIndex: LatamSearchEntry[] | null = null;

export function latamSearchIndex(): LatamSearchEntry[] {
  if (!cachedIndex) {
    cachedIndex = [...playbookEntries(), ...countryEntries(), ...DOORS, ...HONEST_NOS];
  }
  return cachedIndex;
}

export function foldLatamQuery(q: string): string {
  return q
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function searchLatamIndex(raw: string, limit = 8): LatamSearchEntry[] {
  const q = foldLatamQuery(raw);
  const index = latamSearchIndex();
  if (!q) return index.filter((e) => e.kind === "door" || e.id === "playbook-i9" || e.id === "playbook-cobro").slice(0, limit);

  const tokens = q.split(" ").filter(Boolean);
  const scored = index
    .map((entry) => {
      const hay = foldLatamQuery([entry.id, ...entry.aliases].join(" "));
      let score = 0;
      if (hay.includes(q)) score += 12;
      for (const tok of tokens) {
        if (hay.includes(tok)) score += tok.length >= 3 ? 4 : 2;
        if (entry.aliases.some((a) => foldLatamQuery(a) === tok)) score += 8;
      }
      if (/brazil|brasil|cnj|e apostila/.test(hay + q) && /brazil|brasil/.test(q)) score = 0;
      return { entry, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));

  return scored.slice(0, limit).map((x) => x.entry);
}

export function countrySearchTitle(slug: string, locale: "en" | "es"): string | null {
  const c = LATAM_COUNTRY_CORRIDORS.find((row) => row.slug === slug);
  if (!c) return null;
  return locale === "es" ? `${c.countryEs} → EE. UU. · ${c.apostilleLabelEs}` : `${c.countryEn} → US · ${c.apostilleLabelEn}`;
}

export function countrySearchOfficialLabel(slug: string, locale: "en" | "es"): string | null {
  const c = LATAM_COUNTRY_CORRIDORS.find((row) => row.slug === slug);
  if (!c) return null;
  return locale === "es" ? c.apostilleLabelEs : c.apostilleLabelEn;
}
