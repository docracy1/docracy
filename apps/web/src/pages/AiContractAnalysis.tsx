import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO landing: "AI contract analysis" — honest framing of Docracy's paid-tier plain-English
 *  explainer and risk/clause highlighter. Bilingual (EN/ES). */
export default function AiContractAnalysis() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("aiContractAnalysis");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-ai-analysis`;
  const aiTo = localizePath("/ai", locale);
  const pricingTo = localizePath("/pricing", locale);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:ai-contract-analysis:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((n) => ({
      "@type": "Question",
      name: t(`aiAnalysis.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`aiAnalysis.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("aiAnalysis.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("aiAnalysis.heroTitle")}</h1>
          <p className="hero-sub">{t("aiAnalysis.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("aiAnalysis.ctaTry")}
            </Link>
            <Link to={pricingTo} className="hero-actions-secondary" onClick={() => onCta("hero_pricing")}>
              {t("aiAnalysis.ctaPricing")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: 40 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px", textAlign: "center" }}>{t("aiAnalysis.featuresTitle")}</h2>
        <p style={{ textAlign: "center", color: "var(--mute)", margin: "0 0 28px", maxWidth: 540, marginInline: "auto" }}>
          {t("aiAnalysis.featuresSub")}
        </p>
        <div className="core-features-grid">
          <div className="core-feature-card">
            <h3>{t("aiAnalysis.feat.explain.title")}</h3>
            <p>{t("aiAnalysis.feat.explain.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("aiAnalysis.feat.risk.title")}</h3>
            <p>{t("aiAnalysis.feat.risk.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("aiAnalysis.feat.detect.title")}</h3>
            <p>{t("aiAnalysis.feat.detect.body")}</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22 }}>{t("aiAnalysis.howTitle")}</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 10 }}>{t("aiAnalysis.how.1")}</li>
          <li style={{ marginBottom: 10 }}>{t("aiAnalysis.how.2")}</li>
          <li>{t("aiAnalysis.how.3")}</li>
        </ol>
        <p style={{ fontSize: 14 }}>
          <Link to={aiTo} onClick={() => onCta("full_ai_page")}>
            {t("aiAnalysis.aiPageLink")}
          </Link>
        </p>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("aiAnalysis.honestyTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("aiAnalysis.honestyBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("aiAnalysis.faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`aiAnalysis.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`aiAnalysis.faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("aiAnalysis.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("aiAnalysis.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
