import { useMemo } from "react";
import { Link } from "react-router-dom";
import { localizePath, useI18n } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd } from "../lib/productSeo";

/** Spanish-lead index of the LATAM packet — cobro, constancia, hire, RFC, comercio. No long SEO essay. */
const ITEMS: Array<{
  titleKey: string;
  bodyKey: string;
  to: string;
  linkKey: string;
  primary?: boolean;
}> = [
  { titleKey: "landing.out1.title", bodyKey: "landing.out1.body", to: "/cobro#send", linkKey: "landing.out1.link", primary: true },
  { titleKey: "landing.out4.title", bodyKey: "landing.out4.body", to: "/income-proof", linkKey: "landing.out4.link" },
  { titleKey: "landing.out3.title", bodyKey: "landing.out3.body", to: "/packets/latam-contractor", linkKey: "landing.out3.link" },
  { titleKey: "landing.out6.title", bodyKey: "landing.out6.body", to: "/packets/collect", linkKey: "landing.out6.link" },
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
      </div>
    </div>
  );
}
