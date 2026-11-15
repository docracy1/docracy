/**
 * Pages outside Docracy's focus (owner 15.11.2026: "Docracy so umbauen"). Docracy is free e-signing for simple
 * agreements, with contract templates that lead into signing; general business documents belong to docstoc.
 * These pages stay online and crawlable (robots.txt keeps allowing them, so Google can read the noindex) but carry
 * `noindex, follow` and leave the sitemap. Reversible: a page that should rank again only needs to leave this list.
 *
 * Search Console 15.10.–13.11.2026: 59 clicks in total, almost all from the contract templates, the home page and
 * /whatsapp-signing; none of the pages below had a click except the ones kept on purpose (see KEEP).
 */

/** US immigration, Latin American money/crypto/accounting, notarial and tax-season topics. */
const OFF_EXACT = new Set<string>([
  // Immigration and moving to the US
  "/move-to-us", "/immigrant-documents", "/immigrant-housing", "/after-arrival", "/i-9", "/visa-supporting-documents",
  "/itin", "/acta", "/consular-appointment", "/ead-tps", "/phone-and-bank", "/proof-of-income-us-rental",
  "/international-lease-guarantor", "/income-proof", "/proof-of-income", "/who-files-where",
  // Latin America: money, crypto, export, accounting tools
  "/latam", "/latam-search", "/latam-export-documents", "/cobro", "/send-money-latam", "/convert-to-crypto",
  "/kita-alternative", "/alegra-alternative", "/siigo-alternative", "/boundless-alternative", "/citizenpath-alternative",
  "/visa-service-alternative",
  // Contractor tax season, scanning, timestamps
  "/1099-season", "/1099-contractor-records", "/contractor-payment-proof", "/hire-contractor-abroad", "/scan-document",
  "/blockchain-timestamp", "/document-verification", "/docracy-alternative",
  // Packets for the topics above
  "/packets/latam-to-us", "/packets/latam-contractor", "/packets/latam-trade",
  // Blog posts outside signing
  "/blog/how-to-form-an-llc", "/blog/trademark-basics-for-small-business", "/blog/what-is-a-patent",
  "/blog/software-licensing-types-explained", "/blog/can-i-use-that-image", "/blog/opentimestamps-bitcoin-proof-how-it-works",
  // Spanish counterparts
  "/es/alternativa-a-kita", "/es/alternativa-a-alegra", "/es/alternativa-a-siigo", "/es/alternativa-a-boundless",
  "/es/alternativa-a-citizenpath", "/es/alternativa-a-gestoria-de-visa", "/es/alternativa-a-docracy",
  "/es/registros-1099", "/es/temporada-1099", "/es/contratar-en-el-extranjero", "/es/prueba-de-ingresos",
  "/es/comprobante-pago-contratistas", "/es/documentos-exportacion", "/es/documentos-para-inmigrantes",
  "/es/llegar-a-estados-unidos", "/es/constancia-para-rentar", "/es/kit-llegar-eeuu", "/es/quien-sube-donde", "/es/buscar",
  "/es/formulario-i-9", "/es/documentos-para-visa", "/es/garante-internacional-arrendamiento", "/es/convertir-a-cripto",
  "/es/enviar-dinero-latam", "/es/escanear-documento", "/es/arrendamiento-inmigrante", "/es/despues-de-llegar", "/es/itin",
  "/es/acta", "/es/cita-consular", "/es/ead-tps", "/es/chip-y-banco", "/es/kit-contratista-latam", "/es/kit-comercio",
  "/es/cobro", "/es/latam", "/es/constancia", "/es/verificar",
]);

/** Comparisons between two other tools (not Docracy against a signing competitor). */
const THIRD_PARTY_PAIR = /^\/(?:es\/)?(?:pandadoc|docusign|hellosign|eversign|signnow|kita|alegra|siigo|boundless)-vs-[a-z-]+$/;

/** Pages that look off-topic by rule but are kept (signing topics, or real clicks). */
const KEEP = new Set<string>(["/verify"]);

export function isOffFocus(urlPath: string): boolean {
  const p = urlPath.length > 1 ? urlPath.replace(/\/$/, "") : urlPath;
  if (KEEP.has(p)) return false;
  if (OFF_EXACT.has(p)) return true;
  if (/^\/[a-z-]+-to-us$/.test(p) || /^\/es\/[a-z-]+-a-eeuu$/.test(p)) return true; // one page per country
  if (p.startsWith("/import-from-")) return true; // move-from pages for 21 tools
  if (p.startsWith("/for/")) return true; // landing pages for unrelated software (CRMs, delivery apps, Germany)
  if (THIRD_PARTY_PAIR.test(p)) return true;
  return false;
}

export const OFF_FOCUS_ROBOTS = '<meta name="robots" content="noindex, follow" />';

/** Header and footer links without the off-focus pages (hash and query ignored). */
export function onFocus<T extends { to: string }>(links: T[]): T[] {
  return links.filter((l) => !isOffFocus(l.to.split(/[?#]/)[0] ?? l.to));
}
