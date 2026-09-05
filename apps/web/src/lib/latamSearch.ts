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
  /** Cobro / constancia / vault — e-sign is free; this is why they pay. */
  paid?: boolean;
};

export const LATAM_SEARCH_CHIPS = [
  { q: "I-9", labelKey: "latamSearch.chip.i9" },
  { q: "acta", labelKey: "latamSearch.chip.acta" },
  { q: "cita consular", labelKey: "latamSearch.chip.cita" },
  { q: "apostilla México", labelKey: "latamSearch.chip.apostilleMx" },
  { q: "I-94", labelKey: "latamSearch.chip.i94" },
  { q: "EAD", labelKey: "latamSearch.chip.ead" },
  { q: "chip", labelKey: "latamSearch.chip.chip" },
  { q: "constancia", labelKey: "latamSearch.chip.constancia" },
  { q: "cobro", labelKey: "latamSearch.chip.cobro" },
  { q: "ITIN", labelKey: "latamSearch.chip.itin" },
] as const;

const PLAYBOOK_ALIASES: Record<string, string[]> = {
  offer: ["oferta", "offer letter", "contrato de trabajo", "employment agreement", "carta oferta"],
  i9: ["i-9", "i9", "formulario i-9", "form i-9", "empleo primer dia", "seccion 1"],
  everify: ["e-verify", "everify", "e verify", "verificar empleo"],
  visa: ["visa", "i-129", "i-130", "i-485", "i-864", "peticion", "supporting documents", "documentos para visa"],
  ceac: ["ds-160", "ds160", "ceac", "formulario ds-160", "visa no inmigrante"],
  cita: [
    "cita",
    "cita consular",
    "consulado",
    "cas",
    "ais",
    "usvisa-info",
    "ustraveldocs",
    "entrevista visa",
    "appointment",
  ],
  ead: [
    "ead",
    "i-765",
    "i765",
    "permiso de trabajo",
    "work permit",
    "autorizacion de empleo",
    "tps",
    "i-821",
    "i821",
    "parole",
  ],
  uscis: ["uscis", "peticion uscis", "boundless", "citizenpath", "gestoria"],
  uscisAccount: ["cuenta uscis", "myaccount", "e-coa", "eco a"],
  i94: ["i-94", "i94", "admision", "cbp", "ya llegue", "despues de llegar"],
  address: ["cambio de domicilio", "address change", "ar-11", "ar11", "nueva direccion"],
  ssn: ["ssn", "seguro social", "social security", "ss-5", "ss5"],
  itin: ["itin", "w-7", "w7", "numero de impuesto", "tin sin ssn"],
  w9: ["w-9", "w9", "persona de ee uu", "us person"],
  apostille: ["apostilla", "apostille", "legalizacion", "hcch", "haya"],
  acta: [
    "acta",
    "acta de nacimiento",
    "acta nacimiento",
    "birth certificate",
    "acta de matrimonio",
    "antecedentes",
    "renapo",
    "registro civil",
    "miregistrocivil",
  ],
  phone: [
    "chip",
    "esim",
    "e-sim",
    "sim",
    "simcard",
    "airalo",
    "holafly",
    "numero usa",
    "banco",
    "abrir cuenta",
    "bank account",
    "itin banco",
  ],
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
    paid: true,
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
    paid: true,
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
    paid: true,
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
    paid: row.id === "cobro" || row.id === "constancia",
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

const JOB_NEEDLES: { id: string; needles: string[] }[] = [
  { id: "acta", needles: ["acta", "nacimiento", "matrimonio", "antecedentes", "renapo", "registro civil", "miregistrocivil"] },
  { id: "apostille", needles: ["apostilla", "apostille", "legalizacion", "hcch"] },
  { id: "cita", needles: ["cita", "consular", "ais", "cas", "ustraveldocs", "usvisa"] },
  { id: "ceac", needles: ["ds-160", "ds160", "ceac"] },
  { id: "ead", needles: ["ead", "i-765", "i765", "permiso", "tps", "i-821", "i821"] },
  { id: "phone", needles: ["chip", "esim", "e-sim", "simcard", "banco", "bank"] },
  { id: "i9", needles: ["i-9", "i9"] },
  { id: "i94", needles: ["i-94", "i94"] },
  { id: "itin", needles: ["itin", "w-7", "w7"] },
  { id: "visa", needles: ["visa", "i-129", "i-130", "i-485", "peticion"] },
  { id: "cobro", needles: ["cobro"] },
  { id: "constancia", needles: ["constancia"] },
];

const ORIGIN_JOBS = new Set(["acta", "apostille"]);
const FILE_JOBS = new Set(["cita", "ceac", "visa", "ead"]);
const DROP_OTHER_COUNTRIES = new Set(["apostille", "acta", "visa", "cita", "ceac", "ead", "i9", "i94", "itin", "phone"]);

function queryHasNeedle(q: string, tokens: string[], needle: string): boolean {
  const n = foldLatamQuery(needle);
  if (!n) return false;
  // Whole tokens only — "apostilla".includes("acta") must not count as an acta job.
  if (n.includes(" ")) return q.includes(n);
  return tokens.includes(n);
}

/** Origin country named in the query (México, Colombia, …). Ignores city aliases. */
export function countryFromLatamQuery(raw: string): string | null {
  const q = foldLatamQuery(raw);
  if (!q) return null;
  const tokens = q.split(" ").filter(Boolean);
  let best: { slug: string; len: number } | null = null;
  for (const c of LATAM_COUNTRY_CORRIDORS) {
    const needles = [
      foldLatamQuery(c.countryEn),
      foldLatamQuery(c.countryEs),
      foldLatamQuery(c.slug.replace(/-to-us$/, "").replace(/-/g, " ")),
    ];
    for (const n of new Set(needles)) {
      if (n.length < 4) continue;
      if (!queryHasNeedle(q, tokens, n)) continue;
      if (!best || n.length > best.len) best = { slug: c.slug, len: n.length };
    }
  }
  return best?.slug ?? null;
}

/** Playbook jobs named in the query (acta, cita, I-765, …). */
export function jobsFromLatamQuery(raw: string): string[] {
  const q = foldLatamQuery(raw);
  if (!q) return [];
  const tokens = q.split(" ").filter(Boolean);
  const found: string[] = [];
  for (const job of JOB_NEEDLES) {
    if (job.needles.some((n) => queryHasNeedle(q, tokens, n))) found.push(job.id);
  }
  return found;
}

export function searchLatamIndex(raw: string, limit = 8): LatamSearchEntry[] {
  const q = foldLatamQuery(raw);
  const index = latamSearchIndex();
  if (!q) {
    return index
      .filter(
        (e) =>
          e.id === "door-kit" ||
          e.id === "door-who" ||
          e.id === "playbook-i9" ||
          e.id === "playbook-i94" ||
          e.id === "playbook-acta"
      )
      .slice(0, limit);
  }

  const tokens = q.split(" ").filter(Boolean);
  const countrySlug = countryFromLatamQuery(q);
  const jobs = jobsFromLatamQuery(q);
  const originJob = jobs.some((j) => ORIGIN_JOBS.has(j));
  const fileJob = jobs.some((j) => FILE_JOBS.has(j));

  let scored = index
    .map((entry) => {
      const hay = foldLatamQuery([entry.id, ...entry.aliases].join(" "));
      let score = 0;
      if (hay.includes(q)) score += 12;
      for (const tok of tokens) {
        if (hay.includes(tok)) score += tok.length >= 3 ? 4 : 2;
        if (entry.aliases.some((a) => foldLatamQuery(a) === tok)) score += 8;
      }
      if (/brazil|brasil|cnj|e apostila/.test(hay + q) && /brazil|brasil/.test(q)) score = 0;

      if (countrySlug) {
        if (entry.id === `country-${countrySlug}`) score += originJob ? 24 : 10;
        else if (entry.kind === "country") score = 0;
      } else if (jobs.some((j) => DROP_OTHER_COUNTRIES.has(j)) && entry.kind === "country") {
        // "apostilla" / "visa" alone must not dump 18 country cards.
        score = 0;
      }

      if (originJob && (entry.id === "playbook-acta" || entry.id === "playbook-apostille")) score += 18;
      if (fileJob && (entry.id === "playbook-cita" || entry.id === "playbook-ceac" || entry.id === "playbook-ead")) {
        score += 20;
      }
      if (fileJob && entry.kind === "country") score -= 12;
      if (jobs.includes("i9") && entry.id === "playbook-i9") score += 16;
      if (jobs.includes("phone") && entry.id === "playbook-phone") score += 16;
      if (jobs.includes("itin") && entry.id === "playbook-itin") score += 12;

      return { entry, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));

  if (countrySlug && originJob) {
    const keep = new Set([`country-${countrySlug}`, "playbook-acta", "playbook-apostille", "door-who"]);
    scored = scored.filter((x) => keep.has(x.entry.id) || x.entry.kind === "honest-no");
  } else if (countrySlug && fileJob) {
    const keep = new Set([
      "playbook-cita",
      "playbook-ceac",
      "playbook-ead",
      "playbook-visa",
      "no-file-uscis",
      `country-${countrySlug}`,
    ]);
    scored = scored.filter((x) => keep.has(x.entry.id));
  }

  return scored.slice(0, countrySlug ? Math.min(limit, 4) : limit).map((x) => x.entry);
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
