import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { pathLocale } from "../lib/i18n/paths";

/** Keeps catalog locale in sync with Phase 1 bilingual URLs (`/es/...` ↔ English counterparts). */
export default function LocalePathSync() {
  const location = useLocation();
  const { locale, setLocale } = useI18n();

  useEffect(() => {
    const fromPath = pathLocale(location.pathname);
    if (fromPath && fromPath !== locale) setLocale(fromPath);
  }, [location.pathname, locale, setLocale]);

  return null;
}
