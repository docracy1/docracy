import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

const PROVIDE_IDS = ["consent", "email", "pin", "audit", "hash", "cert"] as const;

/** SEO landing: US ESIGN Act & UETA for Docracy SES e-signatures. Deep security detail lives on /trust. */
export default function EsignUeta() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("esignUeta");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-esign-ueta`;
  const pricingTo = localizePath("/pricing", locale);
  const trustTo = "/trust";

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:esign-ueta:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((n) => ({
      "@type": "Question",
      name: t(`esign.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`esign.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("esign.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("esign.heroTitle")}</h1>
          <p className="hero-sub">{t("esign.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("esign.ctaTry")}
            </Link>
            <Link to={pricingTo} className="hero-actions-secondary" onClick={() => onCta("hero_pricing")}>
              {t("esign.ctaPricing")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("esign.lawsTitle")}</h2>
        <p>{t("esign.lawsBody")}</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.55 }}>
          <li style={{ marginBottom: 8 }}>{t("esign.laws.1")}</li>
          <li style={{ marginBottom: 8 }}>{t("esign.laws.2")}</li>
          <li>{t("esign.laws.3")}</li>
        </ul>
        <p style={{ fontSize: 14 }}>
          <Link to="/ueta-electronic-signature">{t("esign.uetaDeepDiveLink")}</Link>
          {" · "}
          <Link to="/docracy-ueta-compliance">{t("esign.uetaComplianceLink")}</Link>
        </p>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: 24, paddingBottom: 24 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px", textAlign: "center" }}>{t("esign.provideTitle")}</h2>
        <p style={{ textAlign: "center", color: "var(--mute)", margin: "0 0 28px", maxWidth: 540, marginInline: "auto" }}>
          {t("esign.provideSub")}
        </p>
        <div className="core-features-grid">
          {PROVIDE_IDS.map((id) => (
            <div key={id} className="core-feature-card">
              <h3>{t(`esign.provide.${id}.title`)}</h3>
              <p>{t(`esign.provide.${id}.body`)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("esign.aesTitle")}</h2>
        <p>{t("esign.aesBody")}</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.55 }}>
          <li style={{ marginBottom: 8 }}>{t("esign.aes.1")}</li>
          <li style={{ marginBottom: 8 }}>{t("esign.aes.2")}</li>
          <li style={{ marginBottom: 8 }}>{t("esign.aes.3")}</li>
          <li>{t("esign.aes.4")}</li>
        </ul>
        <p style={{ fontSize: 13, color: "var(--mute)" }}>{t("esign.aesNote")}</p>
        <p style={{ fontSize: 14 }}>
          <Link to="/whatsapp-signing" onClick={() => onCta("aes_whatsapp")}>
            {t("esign.aesLinkWhatsapp")}
          </Link>
          {" · "}
          <Link to="/advanced-electronic-signature" onClick={() => onCta("aes_advanced")}>
            {t("esign.aesLinkAdvanced")}
          </Link>
        </p>
      </div>

      <div className="spotlight-band" style={{ marginTop: 8 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("esign.limitsTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("esign.limitsBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("esign.faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`esign.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`esign.faq.a${n}`)}</p>
          </details>
        ))}
        <p style={{ marginTop: 28, fontSize: 14 }}>
          {t("esign.trustLead")}{" "}
          <Link to={trustTo}>{t("esign.trustLink")}</Link>
          {" · "}
          <Link to={pricingTo}>{t("esign.pricingLink")}</Link>
          {" · "}
          <Link to={prepareTo} onClick={() => onCta("inline_prepare")}>
            {t("esign.prepareLink")}
          </Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("esign.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("esign.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
