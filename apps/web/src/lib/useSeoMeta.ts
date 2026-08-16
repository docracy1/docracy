import { useLocation } from "react-router-dom";
import { useT } from "./i18n";
import { cleanPath, seoAlternates, type SeoPage } from "./i18n/paths";
import { usePageMeta } from "./usePageMeta";

const SEO_CATALOG_KEY: Record<SeoPage, string> = {
  home: "home",
  pricing: "pricing",
  freeTemplates: "freeTemplates",
  prepare: "prepare",
  docusignAlternative: "docusign",
  hellosignAlternative: "hellosign",
  adobeSignAlternative: "adobeSign",
  eversignAlternative: "eversign",
  pandadocAlternative: "pandadoc",
  ndaSigning: "ndaSigning",
  clientContracts: "clientContracts",
  docs: "docs",
  mcp: "mcp",
  ai: "ai",
  esignUeta: "esignUeta",
  createDigitalSignature: "createDigitalSignature",
  aiContractAnalysis: "aiContractAnalysis",
  esignatureSoftware: "esignatureSoftware",
  signPdfOnline: "signPdfOnline",
  secureElectronicSignature: "secureElectronicSignature",
  freeElectronicSignature: "freeElectronicSignature",
  docracyAlternative: "docracyAlternative",
};

/** Title + description from `seo.<page>.*` catalogs, with canonical + hreflang for bilingual SEO pages. */
export function useSeoMeta(page: SeoPage) {
  const t = useT();
  const location = useLocation();
  const alternates = seoAlternates(page);
  const key = SEO_CATALOG_KEY[page];

  usePageMeta(t(`seo.${key}.title`), t(`seo.${key}.description`), {
    canonicalPath: cleanPath(location.pathname),
    alternates,
  });
}
