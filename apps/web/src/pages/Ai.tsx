import { Link } from "react-router-dom";
import DetectMockup from "../components/DetectMockup";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";
import { PUBLIC_APP_URL } from "../lib/site";

const FEATURE_IDS = ["detect", "explain", "risk", "generate", "templates", "mcp"] as const;

/** SEO landing for Docracy AI tools — auto-detect, explainer, risk, generator, templates, MCP. */
export default function Ai() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("ai");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-ai`;
  const pricingTo = localizePath("/pricing", locale);
  const mcpTo = localizePath("/mcp", locale);
  const analysisTo = localizePath("/ai-contract-analysis", locale);
  const templatesTo = localizePath("/free-templates", locale);
  const developersTo = localizePath("/developers", locale);
  const integrationsTo = localizePath("/integrations/ai-assistants", locale);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:ai:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5].map((n) => ({
      "@type": "Question",
      name: t(`ai.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`ai.faq.a${n}`) },
    })),
  };

  const softwareJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Docracy AI Auto-Detect",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: {
      "@type": "Offer",
      price: "10.00",
      priceCurrency: "USD",
      description: t("ai.schemaOffer"),
    },
    description: t("seo.ai.description"),
    url: `${PUBLIC_APP_URL}/ai`,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("ai.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("ai.heroTitle")}</h1>
          <p className="hero-sub">{t("ai.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("ai.ctaTry")}
            </Link>
            <Link to={pricingTo} className="hero-actions-secondary" onClick={() => onCta("hero_pricing")}>
              {t("ai.ctaPricing")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: 48, paddingBottom: 24 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px", textAlign: "center" }}>{t("ai.featuresTitle")}</h2>
        <p style={{ textAlign: "center", color: "var(--mute)", margin: "0 0 28px", maxWidth: 540, marginInline: "auto" }}>
          {t("ai.featuresSub")}
        </p>
        <div className="core-features-grid">
          {FEATURE_IDS.map((id) => (
            <div key={id} className="core-feature-card">
              <h3>{t(`ai.feat.${id}.title`)}</h3>
              <p>{t(`ai.feat.${id}.body`)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="spotlight-band" style={{ marginTop: 8 }}>
        <div className="spotlight-inner">
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("ai.howTitle")}</h2>
          <div className="spotlight-split">
            <ol style={{ paddingLeft: 20, margin: "12px 0 0", lineHeight: 1.55 }}>
              <li style={{ marginBottom: 10 }}>{t("ai.how.1")}</li>
              <li style={{ marginBottom: 10 }}>{t("ai.how.2")}</li>
              <li style={{ marginBottom: 10 }}>{t("ai.how.3")}</li>
              <li>{t("ai.how.4")}</li>
            </ol>
            <div className="doc-mockup-glow">
              <div className="doc-mockup-card">
                <DetectMockup />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("ai.faqTitle")}</h2>
        {[1, 2, 3, 4, 5].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`ai.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`ai.faq.a${n}`)}</p>
          </details>
        ))}
        <p style={{ marginTop: 28, fontSize: 14 }}>
          {t("ai.mcpLinkLead")}{" "}
          <Link to={mcpTo}>{t("ai.mcpLink")}</Link>
        </p>
        <p style={{ fontSize: 14 }}>
          <Link to={analysisTo}>{t("ai.analysisPageLink")}</Link>
        </p>
        <p style={{ fontSize: 14 }}>
          <Link to={templatesTo}>{t("ai.templatesLink")}</Link>
        </p>
        <p style={{ fontSize: 14 }}>
          <Link to={developersTo}>{t("ai.developersLink")}</Link>
        </p>
        <p style={{ fontSize: 14 }}>
          <Link to={integrationsTo}>{t("ai.integrationsLink")}</Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("ai.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("ai.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
