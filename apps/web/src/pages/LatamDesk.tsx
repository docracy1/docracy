import { useMemo } from "react";
import { Link } from "react-router-dom";
import { localizePath, useI18n } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd } from "../lib/productSeo";
import { LATAM_COUNTRY_CORRIDORS } from "../lib/latamCountryCorridors";
import LatamSearchBox from "../components/LatamSearchBox";

/** Spanish-lead index of the LATAM packet — cobro, constancia, hire, RFC, comercio. No long SEO essay. */
const ITEMS: Array<{
  titleKey: string;
  bodyKey: string;
  to: string;
  linkKey: string;
  primary?: boolean;
}> = [
  { titleKey: "footer.latamSearch", bodyKey: "latamSearch.heroSub", to: "/latam-search", linkKey: "latamSearch.submit", primary: true },
  { titleKey: "landing.out1.title", bodyKey: "landing.out1.body", to: "/cobro#send", linkKey: "landing.out1.link", primary: true },
  { titleKey: "landing.out4.title", bodyKey: "landing.out4.body", to: "/income-proof", linkKey: "landing.out4.link" },
  { titleKey: "landing.out3.title", bodyKey: "landing.out3.body", to: "/packets/latam-contractor", linkKey: "landing.out3.link" },
  { titleKey: "landing.out6.title", bodyKey: "landing.out6.body", to: "/packets/collect", linkKey: "landing.out6.link" },
  { titleKey: "landing.out7.title", bodyKey: "landing.out7.body", to: "/packets/latam-to-us", linkKey: "landing.out7.link" },
  { titleKey: "footer.mexicoToUs", bodyKey: "dash.corridorMexico", to: "/mexico-to-us", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.colombiaToUs", bodyKey: "dash.corridorColombia", to: "/colombia-to-us", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.immigrantHousing", bodyKey: "dash.corridorHousing", to: "/immigrant-housing", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.afterArrival", bodyKey: "dash.corridorAfterArrival", to: "/after-arrival", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.whoFiles", bodyKey: "dash.corridorWhoFiles", to: "/who-files-where", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.itin", bodyKey: "dash.corridorItin", to: "/itin", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.acta", bodyKey: "dash.corridorActa", to: "/acta", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.cita", bodyKey: "dash.corridorCita", to: "/consular-appointment", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.eadTps", bodyKey: "dash.corridorEad", to: "/ead-tps", linkKey: "latamDesk.openKit" },
  { titleKey: "footer.phoneBank", bodyKey: "dash.corridorPhoneBank", to: "/phone-and-bank", linkKey: "latamDesk.openKit" },
  { titleKey: "dash.corridorTradeTitle", bodyKey: "dash.corridorTrade", to: "/packets/latam-trade", linkKey: "latamDesk.openKit" },
];

export default function LatamDesk() {
  const { t, locale } = useI18n();
  const canonicalPath = locale === "es" ? "/es/latam" : "/latam";

  usePageMeta(t("latamDesk.seoTitle"), t("latamDesk.seoDescription"), {
    canonicalPath,
    alternates: { en: "/latam", es: "/es/latam" },
    xDefault: "es",
  });

  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("latamDesk.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <div className="container latam-desk">
        <p className="latam-desk-kicker">{t("latamDesk.kicker")}</p>
        <h1 className="latam-desk-title">{t("latamDesk.heroTitle")}</h1>
        <p className="latam-desk-sub">{t("latamDesk.heroSub")}</p>
        <LatamSearchBox source="latam-desk" compact />
        <div className="latam-desk-grid">
          {ITEMS.map((item) => (
            <Link
              key={item.to}
              to={localizePath(item.to, locale)}
              className={`latam-desk-card${item.primary ? " is-primary" : ""}`}
              onClick={() => track("landingpage_cta_clicked", { source: `latam_desk:${item.to}` })}
            >
              <h2>{t(item.titleKey)}</h2>
              <p>{t(item.bodyKey)}</p>
              <span>{t(item.linkKey)} →</span>
            </Link>
          ))}
        </div>
        <h2 className="latam-desk-title" style={{ fontSize: 22, marginTop: 40 }}>{t("latamDesk.countriesTitle")}</h2>
        <p className="latam-desk-sub">{t("latamDesk.countriesSub")}</p>
        <div className="latam-desk-grid">
          {LATAM_COUNTRY_CORRIDORS.map((c) => (
            <Link
              key={c.slug}
              to={localizePath(c.enPath, locale)}
              className="latam-desk-card"
              onClick={() => track("landingpage_cta_clicked", { source: `latam_desk:${c.slug}` })}
            >
              <h2>{locale === "es" ? `${c.countryEs} → EE. UU.` : `${c.countryEn} → US`}</h2>
              <p>{locale === "es" ? c.apostilleLabelEs : c.apostilleLabelEn}</p>
              <span>{t("latamDesk.openCountry")} →</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
