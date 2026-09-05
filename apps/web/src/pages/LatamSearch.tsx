import { useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import LatamSearchBox from "../components/LatamSearchBox";
import { localizePath, useI18n } from "../lib/i18n";
import { loginWithCheckout } from "../lib/latamCheckout";
import { LATAM_SEARCH_EN, LATAM_SEARCH_ES } from "../lib/latamSearch";
import { breadcrumbJsonLd } from "../lib/productSeo";
import { usePageMeta } from "../lib/usePageMeta";
import { WHO_FILES_WHERE_EN } from "../lib/whoFilesWhere";

/**
 * ES-first query box for LATAM jobs. Routes to official destinations + what we sign.
 * Not a lawyer, not USCIS, not an apostille office.
 */
export default function LatamSearch() {
  const { t, locale } = useI18n();
  const [params] = useSearchParams();
  const initialQuery = params.get("q") ?? "";
  const canonicalPath = locale === "es" ? LATAM_SEARCH_ES : LATAM_SEARCH_EN;

  usePageMeta(t("latamSearch.seoTitle"), t("latamSearch.seoDescription"), {
    canonicalPath,
    alternates: { en: LATAM_SEARCH_EN, es: LATAM_SEARCH_ES },
    xDefault: "es",
  });

  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("latamSearch.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );

  const searchJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: "Docracy",
      url: "https://docracy.io",
      potentialAction: {
        "@type": "SearchAction",
        target: `https://docracy.io${LATAM_SEARCH_ES}?q={search_term_string}`,
        "query-input": "required name=search_term_string",
      },
    }),
    []
  );

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(searchJsonLd) }} />
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p
            className="hero-kicker"
            style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}
          >
            {t("latamSearch.kicker")}
          </p>
          <h1>{t("latamSearch.heroTitle")}</h1>
          <p>{t("latamSearch.heroSub")}</p>
          <LatamSearchBox source="seo:latam-search" initialQuery={initialQuery} />
          <p style={{ marginTop: 16 }}>
            <Link
              to={loginWithCheckout(localizePath("/pricing", locale), "latam-search")}
              className="btn-primary"
              style={{ textDecoration: "none", display: "inline-block" }}
            >
              {t("pricing.paid.ctaGet")}
            </Link>
          </p>
        </div>
      </div>
      <div className="container" style={{ maxWidth: 720 }}>
        <p className="who-files-disclaimer">{t("latamSearch.disclaimer")}</p>
        <p style={{ marginTop: 24, fontSize: 14 }}>
          <Link to={localizePath(WHO_FILES_WHERE_EN, locale)}>{t("footer.whoFiles")}</Link>
          {" · "}
          <Link to={localizePath("/packets/latam-to-us", locale)}>{t("footer.latamUsPacket")}</Link>
          {" · "}
          <Link to={localizePath("/after-arrival", locale)}>{t("footer.afterArrival")}</Link>
          {" · "}
          <Link to={localizePath("/cobro", locale)}>{t("footer.cobro")}</Link>
        </p>
      </div>
    </div>
  );
}
