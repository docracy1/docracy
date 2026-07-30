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
  | "adobeSignAlternative";

export const SEO_EN_PATH: Record<SeoPage, string> = {
  home: "/",
  pricing: "/pricing",
  freeTemplates: "/free-templates",
  prepare: "/prepare",
  docusignAlternative: "/docusign-alternative",
  hellosignAlternative: "/hellosign-alternative",
  adobeSignAlternative: "/adobe-sign-alternative",
};

/** Catalog suffix under `seo.*` / `alt.*` for bilingual alternative pages. */
export const BILINGUAL_ALT_BY_SLUG: Record<string, { seoPage: SeoPage; catalogKey: string }> = {
  "docusign-alternative": { seoPage: "docusignAlternative", catalogKey: "docusign" },
  "hellosign-alternative": { seoPage: "hellosignAlternative", catalogKey: "hellosign" },
  "adobe-sign-alternative": { seoPage: "adobeSignAlternative", catalogKey: "adobeSign" },
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

/** Locale forced by a bilingual SEO URL, or null when the path is not in the map. */
export function pathLocale(pathname: string): Locale | null {
  const path = cleanPath(pathname);
  if (path === "/es" || path.startsWith(`${ES_TEMPLATE_PREFIX}/`) || EN_PATH_BY_ES[path]) return "es";
  if (path.startsWith(`${EN_TEMPLATE_PREFIX}/`) || Object.prototype.hasOwnProperty.call(ES_PATH_BY_EN, path)) return "en";
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

  const tmpl = templateSlugFromPath(path);
  if (tmpl) {
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
  const tmpl = templateSlugFromPath(path);
  if (tmpl) {
    // Only SEO templates get hreflang pairs; other slugs still switch prefix for UX.
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
