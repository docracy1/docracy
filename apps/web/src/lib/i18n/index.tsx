import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import en from "./en";
import es from "./es";
import {
  detectLocale,
  interpolate,
  LOCALES,
  LOCALE_LABELS,
  STORAGE_KEY,
  type Locale,
  type Messages,
} from "./types";

const catalogs: Record<Locale, Messages> = { en, es };

type I18nContextValue = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
  locales: Locale[];
  labels: typeof LOCALE_LABELS;
};

const I18nContext = createContext<I18nContextValue | null>(null);

export function LocaleProvider({
  children,
  initialLocale,
}: {
  children: ReactNode;
  /** When set (prerender / tests), skip browser detectLocale() so static HTML matches the URL. */
  initialLocale?: Locale;
}) {
  const [locale, setLocaleState] = useState<Locale>(() => initialLocale ?? detectLocale());

  useEffect(() => {
    document.documentElement.lang = locale;
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* ignore */
    }
  }, [locale]);

  const value = useMemo<I18nContextValue>(() => {
    const catalog = catalogs[locale] ?? en;
    return {
      locale,
      setLocale: setLocaleState,
      t: (key, vars) => interpolate(catalog[key] ?? en[key] ?? key, vars),
      locales: LOCALES,
      labels: LOCALE_LABELS,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used within LocaleProvider");
  return ctx;
}

export function useT() {
  return useI18n().t;
}

/** For class components / non-hook contexts — reads locale from storage/navigator. */
export function translate(key: string, vars?: Record<string, string | number>, locale?: Locale): string {
  const loc = locale ?? detectLocale();
  const catalog = catalogs[loc] ?? en;
  return interpolate(catalog[key] ?? en[key] ?? key, vars);
}

export type { Locale } from "./types";
export {
  alternatePath,
  cleanPath,
  EN_PATH_BY_ES,
  ES_PATH_BY_EN,
  localizePath,
  pathLocale,
  seoAlternates,
  SEO_EN_PATH,
  type SeoPage,
} from "./paths";
