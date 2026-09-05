import { LATAM_COUNTRY_CORRIDORS } from "./latamCountryCorridors";

/** English / Spanish playbook URLs. Spanish is x-default. */
export const WHO_FILES_WHERE_EN = "/who-files-where";
export const WHO_FILES_WHERE_ES = "/es/quien-sube-donde";

/** Official destinations the user opens. We never submit on these. */
export const OFFICIAL_DESTINATIONS = {
  uscisI9: "https://www.uscis.gov/i-9",
  eVerify: "https://www.e-verify.gov/",
  travelState: "https://travel.state.gov/content/travel/en/us-visas.html",
  ceac: "https://ceac.state.gov/genniv/",
  uscisHome: "https://www.uscis.gov/",
  uscisAccount: "https://myaccount.uscis.gov/",
  uscisAddress: "https://www.uscis.gov/addresschange",
  i94: "https://i94.cbp.dhs.gov/I94/#/home",
  ssn: "https://www.ssa.gov/ssnumber/",
  itin: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin",
  w7: "https://www.irs.gov/forms-pubs/about-form-w-7",
  w9: "https://www.irs.gov/forms-pubs/about-form-w-9",
  hcch: "https://www.hcch.net/en/instruments/conventions/authorities1/?cid=41",
} as const;

export type WhoFilesGroup = "employer" | "file" | "after" | "origin" | "money";

export const WHO_FILES_GROUPS: readonly WhoFilesGroup[] = [
  "employer",
  "file",
  "after",
  "origin",
  "money",
];

export type WhoFilesRow = {
  id: string;
  group: WhoFilesGroup;
  titleKey: string;
  bodyKey: string;
  weDontKey: string;
  officialHref?: string;
  officialKey?: string;
  docracyTo?: string;
  docracyCtaKey?: string;
};

/**
 * Who receives each file / who files it. Checkboxes are local-only.
 * Official hrefs are government hosts we already verified. No W-7 / W-8BEN templates.
 */
export const WHO_FILES_ROWS: readonly WhoFilesRow[] = [
  {
    id: "offer",
    group: "employer",
    titleKey: "latamUsPacket.send.offer.title",
    bodyKey: "latamUsPacket.send.offer.body",
    weDontKey: "whoFiles.weDont.offer",
    docracyTo: "/free-templates/offer-letter",
    docracyCtaKey: "latamUsPacket.send.offer.cta",
  },
  {
    id: "i9",
    group: "employer",
    titleKey: "latamUsPacket.send.i9.title",
    bodyKey: "latamUsPacket.send.i9.body",
    weDontKey: "whoFiles.weDont.i9",
    officialHref: OFFICIAL_DESTINATIONS.uscisI9,
    officialKey: "latamUsPacket.send.i9.official",
    docracyTo: "/free-templates/i-9-form",
    docracyCtaKey: "latamUsPacket.send.i9.cta",
  },
  {
    id: "everify",
    group: "employer",
    titleKey: "whoFiles.everify.title",
    bodyKey: "whoFiles.everify.body",
    weDontKey: "whoFiles.weDont.everify",
    officialHref: OFFICIAL_DESTINATIONS.eVerify,
    officialKey: "whoFiles.everify.official",
  },
  {
    id: "visa",
    group: "file",
    titleKey: "latamUsPacket.send.visa.title",
    bodyKey: "latamUsPacket.send.visa.body",
    weDontKey: "whoFiles.weDont.visa",
    officialHref: OFFICIAL_DESTINATIONS.travelState,
    officialKey: "latamUsPacket.send.visa.official",
    docracyTo: "/visa-supporting-documents",
    docracyCtaKey: "latamUsPacket.send.visa.cta",
  },
  {
    id: "ceac",
    group: "file",
    titleKey: "latamUsPacket.send.ceac.title",
    bodyKey: "latamUsPacket.send.ceac.body",
    weDontKey: "whoFiles.weDont.ceac",
    officialHref: OFFICIAL_DESTINATIONS.ceac,
    officialKey: "latamUsPacket.send.ceac.official",
  },
  {
    id: "uscis",
    group: "file",
    titleKey: "latamUsPacket.send.uscis.title",
    bodyKey: "latamUsPacket.send.uscis.body",
    weDontKey: "whoFiles.weDont.uscis",
    officialHref: OFFICIAL_DESTINATIONS.uscisHome,
    officialKey: "latamUsPacket.send.uscis.official",
  },
  {
    id: "uscisAccount",
    group: "file",
    titleKey: "latamUsPacket.send.uscisAccount.title",
    bodyKey: "latamUsPacket.send.uscisAccount.body",
    weDontKey: "whoFiles.weDont.uscisAccount",
    officialHref: OFFICIAL_DESTINATIONS.uscisAccount,
    officialKey: "latamUsPacket.send.uscisAccount.official",
  },
  {
    id: "i94",
    group: "after",
    titleKey: "latamUsPacket.send.i94.title",
    bodyKey: "latamUsPacket.send.i94.body",
    weDontKey: "whoFiles.weDont.i94",
    officialHref: OFFICIAL_DESTINATIONS.i94,
    officialKey: "latamUsPacket.send.i94.official",
    docracyTo: "/after-arrival",
    docracyCtaKey: "latamUsPacket.send.i94.cta",
  },
  {
    id: "address",
    group: "after",
    titleKey: "latamUsPacket.send.address.title",
    bodyKey: "latamUsPacket.send.address.body",
    weDontKey: "whoFiles.weDont.address",
    officialHref: OFFICIAL_DESTINATIONS.uscisAddress,
    officialKey: "latamUsPacket.send.address.official",
    docracyTo: "/after-arrival",
    docracyCtaKey: "latamUsPacket.send.address.cta",
  },
  {
    id: "ssn",
    group: "after",
    titleKey: "latamUsPacket.send.ssn.title",
    bodyKey: "latamUsPacket.send.ssn.body",
    weDontKey: "whoFiles.weDont.ssn",
    officialHref: OFFICIAL_DESTINATIONS.ssn,
    officialKey: "latamUsPacket.send.ssn.official",
  },
  {
    id: "itin",
    group: "after",
    titleKey: "latamUsPacket.send.itin.title",
    bodyKey: "latamUsPacket.send.itin.body",
    weDontKey: "whoFiles.weDont.itin",
    officialHref: OFFICIAL_DESTINATIONS.itin,
    officialKey: "latamUsPacket.send.itin.official",
    docracyTo: "/itin",
    docracyCtaKey: "latamUsPacket.send.itin.cta",
  },
  {
    id: "w9",
    group: "after",
    titleKey: "latamUsPacket.send.w9.title",
    bodyKey: "latamUsPacket.send.w9.body",
    weDontKey: "whoFiles.weDont.w9",
    officialHref: OFFICIAL_DESTINATIONS.w9,
    officialKey: "latamUsPacket.send.w9.official",
    docracyTo: "/free-templates/w-9-form",
    docracyCtaKey: "latamUsPacket.send.w9.cta",
  },
  {
    id: "apostille",
    group: "origin",
    titleKey: "latamUsPacket.send.apostille.title",
    bodyKey: "latamUsPacket.send.apostille.body",
    weDontKey: "whoFiles.weDont.apostille",
    officialHref: OFFICIAL_DESTINATIONS.hcch,
    officialKey: "latamUsPacket.send.apostille.official",
  },
  {
    id: "poa",
    group: "origin",
    titleKey: "latamUsPacket.send.poa.title",
    bodyKey: "latamUsPacket.send.poa.body",
    weDontKey: "whoFiles.weDont.poa",
    docracyTo: "/free-templates/power-of-attorney",
    docracyCtaKey: "latamUsPacket.send.poa.cta",
  },
  {
    id: "child",
    group: "origin",
    titleKey: "latamUsPacket.send.child.title",
    bodyKey: "latamUsPacket.send.child.body",
    weDontKey: "whoFiles.weDont.child",
    docracyTo: "/free-templates/child-travel-consent",
    docracyCtaKey: "latamUsPacket.send.child.cta",
  },
  {
    id: "lease",
    group: "origin",
    titleKey: "latamUsPacket.send.lease.title",
    bodyKey: "latamUsPacket.send.lease.body",
    weDontKey: "whoFiles.weDont.lease",
    docracyTo: "/free-templates/simple-commercial-lease-agreement",
    docracyCtaKey: "latamUsPacket.send.lease.cta",
  },
  {
    id: "constancia",
    group: "money",
    titleKey: "latamUsPacket.send.constancia.title",
    bodyKey: "latamUsPacket.send.constancia.body",
    weDontKey: "whoFiles.weDont.constancia",
    docracyTo: "/income-proof",
    docracyCtaKey: "latamUsPacket.send.constancia.cta",
  },
  {
    id: "cobro",
    group: "money",
    titleKey: "latamUsPacket.send.cobro.title",
    bodyKey: "latamUsPacket.send.cobro.body",
    weDontKey: "whoFiles.weDont.cobro",
    docracyTo: "/cobro#send",
    docracyCtaKey: "latamUsPacket.send.cobro.cta",
  },
];

export const WHO_FILES_STORAGE_KEY = "docracy_who_files_where";
export const WHO_FILES_COUNTRY_KEY = "docracy_who_files_country";

export function whoFilesRowsByGroup(group: WhoFilesGroup): WhoFilesRow[] {
  return WHO_FILES_ROWS.filter((row) => row.group === group);
}

export function officialHrefsInPlaybook(): string[] {
  return [
    ...WHO_FILES_ROWS.map((row) => row.officialHref).filter((href): href is string => Boolean(href)),
    ...LATAM_COUNTRY_CORRIDORS.map((c) => c.officialHref),
    OFFICIAL_DESTINATIONS.w7,
  ];
}
