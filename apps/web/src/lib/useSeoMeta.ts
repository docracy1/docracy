import { useLocation } from "react-router-dom";
import { useT } from "./i18n";
import { cleanPath, seoAlternates, type SeoPage } from "./i18n/paths";
import { usePageMeta } from "./usePageMeta";

/** Title + description from `seo.<page>.*` catalogs, with canonical + hreflang for Phase 1 pages. */
export function useSeoMeta(page: SeoPage) {
  const t = useT();
  const location = useLocation();
  const alternates = seoAlternates(page);
  const key = page === "freeTemplates" ? "freeTemplates" : page === "docusignAlternative" ? "docusign" : page;

  usePageMeta(t(`seo.${key}.title`), t(`seo.${key}.description`), {
    canonicalPath: cleanPath(location.pathname),
    alternates,
  });
}
