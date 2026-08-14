import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO landing: "secure electronic signature" — narrative security pitch matching Trust.tsx's
 *  exact honest framing (encryption, audit trail, no Docracy-held SOC2). Links to /trust for the
 *  full compliance reference. Bilingual (EN/ES). */
export default function SecureElectronicSignature() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("secureElectronicSignature");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-secure-signature`;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:secure-signature:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((n) => ({
      "@type": "Question",
      name: t(`secureSig.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`secureSig.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("secureSig.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("secureSig.heroTitle")}</h1>
          <p className="hero-sub">{t("secureSig.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("secureSig.ctaTry")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: 40 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px", textAlign: "center" }}>{t("secureSig.pillarsTitle")}</h2>
        <p style={{ textAlign: "center", color: "var(--mute)", margin: "0 0 28px", maxWidth: 560, marginInline: "auto" }}>
          {t("secureSig.pillarsSub")}
        </p>
        <div className="core-features-grid">
          <div className="core-feature-card">
            <h3>{t("secureSig.pillar.encryption.title")}</h3>
            <p>{t("secureSig.pillar.encryption.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("secureSig.pillar.audit.title")}</h3>
            <p>{t("secureSig.pillar.audit.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("secureSig.pillar.links.title")}</h3>
            <p>{t("secureSig.pillar.links.body")}</p>
          </div>
          <div className="core-feature-card">
            <h3>{t("secureSig.pillar.retention.title")}</h3>
            <p>{t("secureSig.pillar.retention.body")}</p>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22 }}>{t("secureSig.honestyTitle")}</h2>
        <p>{t("secureSig.honestyBody1")}</p>
        <p>{t("secureSig.honestyBody2")}</p>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("secureSig.identityTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("secureSig.identityBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("secureSig.faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`secureSig.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`secureSig.faq.a${n}`)}</p>
          </details>
        ))}
        <p style={{ marginTop: 28, fontSize: 14 }}>
          <Link to="/trust" onClick={() => onCta("trust_link")}>{t("secureSig.trustLink")}</Link>
          {" · "}
          <Link to="/dpa" onClick={() => onCta("dpa_link")}>{t("secureSig.dpaLink")}</Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("secureSig.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("secureSig.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
