import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO/sales explainer for the Marketplace concept (official + community templates, review
 *  process, why it's free) — deliberately distinct from /free-templates, which is the actual
 *  browsing catalog, to avoid duplicate-content/keyword cannibalization between the two pages. */
export default function TemplateMarketplace() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("templateMarketplace");

  const browseTo = localizePath("/free-templates", locale);
  const submitTo = `${localizePath("/prepare", locale)}?ref=seo-template-marketplace`;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:template-marketplace:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5].map((n) => ({
      "@type": "Question",
      name: t(`templateMarketplace.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`templateMarketplace.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("templateMarketplace.eyebrow")}</p>
          <h1>{t("templateMarketplace.heroTitle")}</h1>
          <p className="hero-sub">{t("templateMarketplace.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              to={browseTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero_browse")}
            >
              {t("templateMarketplace.ctaBrowse")}
            </Link>
            <Link
              to={submitTo}
              className="btn-secondary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero_submit")}
            >
              {t("templateMarketplace.ctaSubmit")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("templateMarketplace.howTitle")}</h2>
        <div style={{ display: "grid", gap: 20, marginTop: 16 }}>
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("templateMarketplace.how1.title")}</h3>
            <p style={{ margin: 0 }}>{t("templateMarketplace.how1.body")}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("templateMarketplace.how2.title")}</h3>
            <p style={{ margin: 0 }}>{t("templateMarketplace.how2.body")}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("templateMarketplace.how3.title")}</h3>
            <p style={{ margin: 0 }}>{t("templateMarketplace.how3.body")}</p>
          </div>
        </div>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("templateMarketplace.reviewTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("templateMarketplace.reviewBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("templateMarketplace.mixTitle")}</h2>
        <div style={{ display: "grid", gap: 16, marginTop: 16, gridTemplateColumns: "1fr", maxWidth: 640 }}>
          <div className="card">
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--primary)",
                color: "var(--on-primary)",
                marginBottom: 8,
              }}
            >
              {t("freeTemplates.officialBadge")}
            </span>
            <h3 style={{ fontSize: 17, margin: "0 0 4px" }}>{t("templateMarketplace.mixOfficial.title")}</h3>
            <p style={{ margin: 0 }}>{t("templateMarketplace.mixOfficial.body")}</p>
          </div>
          <div className="card">
            <span
              style={{
                display: "inline-block",
                fontSize: 12,
                fontWeight: 700,
                padding: "2px 8px",
                borderRadius: 999,
                background: "var(--accent)",
                color: "var(--on-accent)",
                marginBottom: 8,
              }}
            >
              {t("freeTemplates.communityBadge")}
            </span>
            <h3 style={{ fontSize: 17, margin: "0 0 4px" }}>{t("templateMarketplace.mixCommunity.title")}</h3>
            <p style={{ margin: 0 }}>{t("templateMarketplace.mixCommunity.body")}</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("templateMarketplace.faqTitle")}</h2>
        {[1, 2, 3, 4, 5].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>
              {t(`templateMarketplace.faq.q${n}`)}
            </summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`templateMarketplace.faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("templateMarketplace.footerCta")}</p>
        <Link
          to={browseTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("templateMarketplace.ctaBrowse")}
        </Link>
      </div>
    </div>
  );
}
