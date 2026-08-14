import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO landing: "e-signature software" buyer's-guide angle — what to look for, pricing models,
 *  and where Docracy fits. Distinct from /electronic-signature-guide (legal/compliance depth) by
 *  focusing on tool-selection criteria. Bilingual (EN/ES). */
export default function EsignatureSoftware() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("esignatureSoftware");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-esign-software`;
  const pricingTo = localizePath("/pricing", locale);
  const guideTo = localizePath("/electronic-signature-guide", locale);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:esign-software:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((n) => ({
      "@type": "Question",
      name: t(`esignSoftware.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`esignSoftware.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("esignSoftware.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("esignSoftware.heroTitle")}</h1>
          <p className="hero-sub">{t("esignSoftware.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("esignSoftware.ctaTry")}
            </Link>
            <Link to={pricingTo} className="hero-actions-secondary" onClick={() => onCta("hero_pricing")}>
              {t("esignSoftware.ctaPricing")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: 40 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px", textAlign: "center" }}>{t("esignSoftware.checklistTitle")}</h2>
        <p style={{ textAlign: "center", color: "var(--mute)", margin: "0 0 28px", maxWidth: 560, marginInline: "auto" }}>
          {t("esignSoftware.checklistSub")}
        </p>
        <div className="core-features-grid">
          <div className="core-feature-card">
            <h3>{t("esignSoftware.check.legal.title")}</h3>
            <p>{t("esignSoftware.check.legal.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("esignSoftware.check.audit.title")}</h3>
            <p>{t("esignSoftware.check.audit.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("esignSoftware.check.pricing.title")}</h3>
            <p>{t("esignSoftware.check.pricing.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("esignSoftware.check.friction.title")}</h3>
            <p>{t("esignSoftware.check.friction.body")}</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22 }}>{t("esignSoftware.pricingModelsTitle")}</h2>
        <p>{t("esignSoftware.pricingModelsBody1")}</p>
        <p>{t("esignSoftware.pricingModelsBody2")}</p>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("esignSoftware.fitTitle")}</h2>
          <p>{t("esignSoftware.fitBody1")}</p>
          <p style={{ marginBottom: 0 }}>{t("esignSoftware.fitBody2")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 8 }}>
        <p style={{ fontSize: 14 }}>
          {t("esignSoftware.compareLead")}{" "}
          <Link to="/docusign-alternative" onClick={() => onCta("compare_docusign")}>DocuSign</Link>
          {" · "}
          <Link to="/eversign-alternative" onClick={() => onCta("compare_eversign")}>eversign</Link>
          {" · "}
          <Link to="/hellosign-alternative" onClick={() => onCta("compare_hellosign")}>HelloSign</Link>
          {" · "}
          <Link to="/pandadoc-alternative" onClick={() => onCta("compare_pandadoc")}>PandaDoc</Link>
          {" · "}
          <Link to="/adobe-sign-alternative" onClick={() => onCta("compare_adobesign")}>Adobe Sign</Link>
        </p>
        <p style={{ fontSize: 14 }}>
          {t("esignSoftware.guideLead")}{" "}
          <Link to={guideTo} onClick={() => onCta("guide_link")}>{t("esignSoftware.guideLink")}</Link>
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 16, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("esignSoftware.faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`esignSoftware.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`esignSoftware.faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("esignSoftware.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("esignSoftware.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
