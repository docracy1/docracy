import type { Locale } from "./types";

/** Phase 1–2 Spanish SEO surface — English path → Spanish path. */
export const ES_PATH_BY_EN: Record<string, string> = {
  "/": "/es",
  "/pricing": "/es/precios",
  "/free-templates": "/es/plantillas-gratis",
  "/prepare": "/es/preparar",
  "/docusign-alternative": "/es/alternativa-a-docusign",
  "/hellosign-alternative": "/es/alternativa-a-hellosign",
  "/adobe-sign-alternative": "/es/alternativa-a-adobe-sign",
  "/eversign-alternative": "/es/alternativa-a-eversign",
  "/pandadoc-alternative": "/es/alternativa-a-pandadoc",
  "/kita-alternative": "/es/alternativa-a-kita",
  "/alegra-alternative": "/es/alternativa-a-alegra",
  "/siigo-alternative": "/es/alternativa-a-siigo",
  "/boundless-alternative": "/es/alternativa-a-boundless",
  "/citizenpath-alternative": "/es/alternativa-a-citizenpath",
  "/visa-service-alternative": "/es/alternativa-a-gestoria-de-visa",
  "/boundless-vs-citizenpath": "/es/boundless-vs-citizenpath",
  "/kita-vs-alegra": "/es/kita-vs-alegra",
  "/kita-vs-siigo": "/es/kita-vs-siigo",
  "/alegra-vs-siigo": "/es/alegra-vs-siigo",
  "/nda-signing": "/es/firma-de-nda",
  "/client-contracts": "/es/contratos-con-clientes",
  "/docs": "/es/documentacion",
  "/mcp": "/es/mcp",
  "/ai": "/es/ia",
  "/esign-ueta": "/es/esign-ueta",
  "/create-a-digital-signature": "/es/crear-firma-digital",
  "/ai-contract-analysis": "/es/analisis-de-contratos-ia",
  "/esignature-software": "/es/software-de-firma-electronica",
  "/sign-pdf-online": "/es/firmar-pdf-en-linea",
  "/secure-electronic-signature": "/es/firma-electronica-segura",
  "/free-electronic-signature": "/es/firma-electronica-gratis",
  "/docracy-alternative": "/es/alternativa-a-docracy",
  "/template-marketplace": "/es/marketplace-de-plantillas",
  "/submit-template": "/es/enviar-plantilla",
  "/developers": "/es/desarrolladores",
  "/solutions/ai-contract-drafting": "/es/soluciones/redaccion-contratos-ia",
  "/enterprise": "/es/empresas",
  "/integrations/ai-assistants": "/es/integraciones/asistentes-ia",
  "/how-it-works": "/es/como-funciona",
  "/verify": "/es/verificar",
  "/packets/us-contractor": "/es/kit-contratista",
  "/packets/latam-contractor": "/es/kit-contratista-latam",
  "/packets/trades": "/es/kit-oficios",
  "/packets/latam-trade": "/es/kit-comercio",
  "/packets/collect": "/es/pide-documentos",
  "/1099-season": "/es/temporada-1099",
  "/cobro": "/es/cobro",
  "/latam": "/es/latam",
  "/1099-contractor-records": "/es/registros-1099",
  "/hire-contractor-abroad": "/es/contratar-en-el-extranjero",
  "/packets/latam-to-us": "/es/kit-llegar-eeuu",
  "/immigrant-documents": "/es/documentos-para-inmigrantes",
  "/move-to-us": "/es/llegar-a-estados-unidos",
  "/proof-of-income-us-rental": "/es/constancia-para-rentar",
  "/i-9": "/es/formulario-i-9",
  "/visa-supporting-documents": "/es/documentos-para-visa",
  "/income-proof": "/es/constancia",
  "/proof-of-income": "/es/prueba-de-ingresos",
  "/signed-work-order": "/es/orden-de-trabajo-firmada",
  "/contractor-payment-proof": "/es/comprobante-pago-contratistas",
  "/latam-export-documents": "/es/documentos-exportacion",
  "/request-w9": "/es/pedir-w9",
};

export const EN_PATH_BY_ES: Record<string, string> = Object.fromEntries(
  Object.entries(ES_PATH_BY_EN).map(([en, es]) => [es, en])
);

/** Phase 3 — top templates with Spanish detail pages (same slug under /es/plantillas-gratis/). */
export const SEO_TEMPLATE_SLUGS = [
  "mutual-nda",
  "independent-contractor-agreement",
  "offer-letter",
  "freelance-service-agreement",
  "remote-work-policy",
  "employment-agreement",
  "consulting-agreement",
  "unilateral-nda",
  "vendor-agreement",
  "w-9-form",
  "i-9-form",
  "promissory-note",
  "letter-of-intent",
  "simple-commercial-lease-agreement",
  "separation-agreement",
  "sales-agreement",
] as const;

export type SeoTemplateSlug = (typeof SEO_TEMPLATE_SLUGS)[number];

export const EN_TEMPLATE_PREFIX = "/free-templates";
export const ES_TEMPLATE_PREFIX = "/es/plantillas-gratis";

export function isSeoTemplateSlug(slug: string): slug is SeoTemplateSlug {
  return (SEO_TEMPLATE_SLUGS as readonly string[]).includes(slug);
}

export type SeoPage =
  | "home"
  | "pricing"
  | "freeTemplates"
  | "prepare"
  | "docusignAlternative"
  | "hellosignAlternative"
  | "adobeSignAlternative"
  | "eversignAlternative"
  | "pandadocAlternative"
  | "kitaAlternative"
  | "alegraAlternative"
  | "siigoAlternative"
  | "boundlessAlternative"
  | "citizenpathAlternative"
  | "visaServiceAlternative"
  | "ndaSigning"
  | "clientContracts"
  | "docs"
  | "mcp"
  | "ai"
  | "esignUeta"
  | "createDigitalSignature"
  | "aiContractAnalysis"
  | "esignatureSoftware"
  | "signPdfOnline"
  | "secureElectronicSignature"
  | "freeElectronicSignature"
  | "docracyAlternative"
  | "templateMarketplace"
  | "submitTemplate"
  | "developers"
  | "aiContractDrafting"
  | "enterprise"
  | "integrationsAi";

export const SEO_EN_PATH: Record<SeoPage, string> = {
  home: "/",
  pricing: "/pricing",
  freeTemplates: "/free-templates",
  prepare: "/prepare",
  docusignAlternative: "/docusign-alternative",
  hellosignAlternative: "/hellosign-alternative",
  adobeSignAlternative: "/adobe-sign-alternative",
  eversignAlternative: "/eversign-alternative",
  pandadocAlternative: "/pandadoc-alternative",
  kitaAlternative: "/kita-alternative",
  alegraAlternative: "/alegra-alternative",
  siigoAlternative: "/siigo-alternative",
  boundlessAlternative: "/boundless-alternative",
  citizenpathAlternative: "/citizenpath-alternative",
  visaServiceAlternative: "/visa-service-alternative",
  ndaSigning: "/nda-signing",
  clientContracts: "/client-contracts",
  docs: "/docs",
  mcp: "/mcp",
  ai: "/ai",
  esignUeta: "/esign-ueta",
  createDigitalSignature: "/create-a-digital-signature",
  aiContractAnalysis: "/ai-contract-analysis",
  esignatureSoftware: "/esignature-software",
  signPdfOnline: "/sign-pdf-online",
  secureElectronicSignature: "/secure-electronic-signature",
  freeElectronicSignature: "/free-electronic-signature",
  docracyAlternative: "/docracy-alternative",
  templateMarketplace: "/template-marketplace",
  submitTemplate: "/submit-template",
  developers: "/developers",
  aiContractDrafting: "/solutions/ai-contract-drafting",
  enterprise: "/enterprise",
  integrationsAi: "/integrations/ai-assistants",
};

/** Catalog suffix under `seo.*` / `alt.*` for bilingual alternative pages. */
export const BILINGUAL_ALT_BY_SLUG: Record<string, { seoPage: SeoPage; catalogKey: string }> = {
  "docusign-alternative": { seoPage: "docusignAlternative", catalogKey: "docusign" },
  "hellosign-alternative": { seoPage: "hellosignAlternative", catalogKey: "hellosign" },
  "adobe-sign-alternative": { seoPage: "adobeSignAlternative", catalogKey: "adobeSign" },
  "eversign-alternative": { seoPage: "eversignAlternative", catalogKey: "eversign" },
  "pandadoc-alternative": { seoPage: "pandadocAlternative", catalogKey: "pandadoc" },
  "kita-alternative": { seoPage: "kitaAlternative", catalogKey: "kita" },
  "alegra-alternative": { seoPage: "alegraAlternative", catalogKey: "alegra" },
  "siigo-alternative": { seoPage: "siigoAlternative", catalogKey: "siigo" },
  "boundless-alternative": { seoPage: "boundlessAlternative", catalogKey: "boundless" },
  "citizenpath-alternative": { seoPage: "citizenpathAlternative", catalogKey: "citizenpath" },
  "visa-service-alternative": { seoPage: "visaServiceAlternative", catalogKey: "visaService" },
};

/** Feature landings with EN/ES URL pairs (content in marketingPages.ts). */
export const BILINGUAL_FEATURE_BY_SLUG: Record<string, SeoPage> = {
  "nda-signing": "ndaSigning",
  "client-contracts": "clientContracts",
};

/** Normalize pathname: strip trailing slash except root. */
export function cleanPath(pathname: string): string {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

/** `/free-templates/:slug` or `/es/plantillas-gratis/:slug` → slug, or null. */
export function templateSlugFromPath(pathname: string): string | null {
  const path = cleanPath(pathname);
  for (const prefix of [EN_TEMPLATE_PREFIX, ES_TEMPLATE_PREFIX]) {
    if (path.startsWith(`${prefix}/`)) {
      const slug = path.slice(prefix.length + 1);
      if (slug && !slug.includes("/")) return slug;
    }
  }
  return null;
}

function enPathFromAny(path: string): string | null {
  const tmpl = templateSlugFromPath(path);
  if (tmpl) return `${EN_TEMPLATE_PREFIX}/${tmpl}`;
  return EN_PATH_BY_ES[path] ?? (Object.prototype.hasOwnProperty.call(ES_PATH_BY_EN, path) ? path : null);
}

function signedReceiptFromPath(path: string): { locale: Locale; token: string } | null {
  if (path.startsWith("/signed/")) {
    const token = path.slice("/signed/".length);
    return token ? { locale: "en", token } : null;
  }
  if (path.startsWith("/es/firmado/")) {
    const token = path.slice("/es/firmado/".length);
    return token ? { locale: "es", token } : null;
  }
  return null;
}

function signedReceiptPath(token: string, locale: Locale): string {
  return locale === "es" ? `/es/firmado/${token}` : `/signed/${token}`;
}

function constanciaShareFromPath(path: string): { locale: Locale; token: string } | null {
  if (path.startsWith("/income-proof/")) {
    const token = path.slice("/income-proof/".length);
    return token ? { locale: "en", token } : null;
  }
  if (path.startsWith("/es/constancia/")) {
    const token = path.slice("/es/constancia/".length);
    return token ? { locale: "es", token } : null;
  }
  return null;
}

export function constanciaSharePath(token: string, locale: Locale): string {
  return locale === "es" ? `/es/constancia/${token}` : `/income-proof/${token}`;
}

function payerShareFromPath(path: string): { locale: Locale; token: string } | null {
  if (path.startsWith("/1099-season/")) {
    const token = path.slice("/1099-season/".length);
    return token ? { locale: "en", token } : null;
  }
  if (path.startsWith("/es/temporada-1099/")) {
    const token = path.slice("/es/temporada-1099/".length);
    return token ? { locale: "es", token } : null;
  }
  return null;
}

export function payerSharePath(token: string, locale: Locale): string {
  return locale === "es" ? `/es/temporada-1099/${token}` : `/1099-season/${token}`;
}

/** Locale forced by a bilingual SEO URL, or null when the path is not in the map. */
export function pathLocale(pathname: string): Locale | null {
  const path = cleanPath(pathname);
  const signed = signedReceiptFromPath(path);
  if (signed) return signed.locale;
  const constancia = constanciaShareFromPath(path);
  if (constancia) return constancia.locale;
  const payer = payerShareFromPath(path);
  if (payer) return payer.locale;
  const tmpl = templateSlugFromPath(path);
  if (tmpl) {
    // Only SEO template pairs force locale from the URL; non-SEO /es/… URLs shouldn't exist.
    if (!isSeoTemplateSlug(tmpl)) return path.startsWith(ES_TEMPLATE_PREFIX) ? "es" : "en";
    return path.startsWith(ES_TEMPLATE_PREFIX) ? "es" : "en";
  }
  if (path === "/es" || EN_PATH_BY_ES[path]) return "es";
  if (Object.prototype.hasOwnProperty.call(ES_PATH_BY_EN, path)) return "en";
  return null;
}

/** Map an English (or already-localized) bilingual path into the given locale. Other paths pass through. */
export function localizePath(href: string, locale: Locale): string {
  const hashIdx = href.indexOf("#");
  const hash = hashIdx >= 0 ? href.slice(hashIdx) : "";
  const withoutHash = hashIdx >= 0 ? href.slice(0, hashIdx) : href;
  const qIdx = withoutHash.indexOf("?");
  const query = qIdx >= 0 ? withoutHash.slice(qIdx) : "";
  const rawPath = qIdx >= 0 ? withoutHash.slice(0, qIdx) : withoutHash;
  const path = cleanPath(rawPath);

  const signed = signedReceiptFromPath(path);
  if (signed) return `${signedReceiptPath(signed.token, locale)}${query}${hash}`;

  const constancia = constanciaShareFromPath(path);
  if (constancia) return `${constanciaSharePath(constancia.token, locale)}${query}${hash}`;

  const payer = payerShareFromPath(path);
  if (payer) return `${payerSharePath(payer.token, locale)}${query}${hash}`;

  const tmpl = templateSlugFromPath(path);
  if (tmpl) {
    // Non-SEO templates stay on English detail URLs to avoid thin EN-under-/es pages.
    if (!isSeoTemplateSlug(tmpl)) {
      return `${EN_TEMPLATE_PREFIX}/${tmpl}${query}${hash}`;
    }
    const base = locale === "es" ? ES_TEMPLATE_PREFIX : EN_TEMPLATE_PREFIX;
    return `${base}/${tmpl}${query}${hash}`;
  }

  const enPath = enPathFromAny(path);
  if (!enPath) return href;

  const localized = locale === "es" ? ES_PATH_BY_EN[enPath] : enPath;
  return `${localized}${query}${hash}`;
}

/** Alternate language URL for a bilingual path, or null if the path isn't bilingual. */
export function alternatePath(pathname: string, target: Locale): string | null {
  const path = cleanPath(pathname);
  const signed = signedReceiptFromPath(path);
  if (signed) return signedReceiptPath(signed.token, target);
  const constancia = constanciaShareFromPath(path);
  if (constancia) return constanciaSharePath(constancia.token, target);
  const payer = payerShareFromPath(path);
  if (payer) return payerSharePath(payer.token, target);
  const tmpl = templateSlugFromPath(path);
  if (tmpl) {
    if (!isSeoTemplateSlug(tmpl)) return null;
    const base = target === "es" ? ES_TEMPLATE_PREFIX : EN_TEMPLATE_PREFIX;
    return `${base}/${tmpl}`;
  }
  const enPath = enPathFromAny(path);
  if (!enPath) return null;
  return target === "es" ? ES_PATH_BY_EN[enPath] : enPath;
}

export function seoAlternates(page: SeoPage): { en: string; es: string } {
  const en = SEO_EN_PATH[page];
  return { en, es: ES_PATH_BY_EN[en] };
}

export function templateAlternates(slug: string): { en: string; es: string } {
  return {
    en: `${EN_TEMPLATE_PREFIX}/${slug}`,
    es: `${ES_TEMPLATE_PREFIX}/${slug}`,
  };
}
