import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO landing: "create a digital signature" — clarifies digital-vs-electronic-signature
 *  terminology, then walks through Docracy's actual SES signing flow. Bilingual (EN/ES). */
export default function CreateDigitalSignature() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("createDigitalSignature");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-create-signature`;
  const guideTo = localizePath("/electronic-signature-guide", locale);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:create-signature:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((n) => ({
      "@type": "Question",
      name: t(`createSig.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`createSig.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("createSig.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("createSig.heroTitle")}</h1>
          <p className="hero-sub">{t("createSig.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("createSig.ctaTry")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("createSig.termsTitle")}</h2>
        <p>{t("createSig.termsBody1")}</p>
        <p>{t("createSig.termsBody2")}</p>
        <p style={{ fontSize: 14 }}>
          {t("createSig.termsLinkLead")}{" "}
          <Link to={guideTo} onClick={() => onCta("terms_guide")}>
            {t("createSig.termsLink")}
          </Link>
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 24 }}>
        <h2 style={{ fontSize: 22 }}>{t("createSig.howTitle")}</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 10 }}>{t("createSig.how.1")}</li>
          <li style={{ marginBottom: 10 }}>{t("createSig.how.2")}</li>
          <li style={{ marginBottom: 10 }}>{t("createSig.how.3")}</li>
          <li>{t("createSig.how.4")}</li>
        </ol>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("createSig.trustTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("createSig.trustBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("createSig.faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`createSig.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`createSig.faq.a${n}`)}</p>
          </details>
        ))}
        <p style={{ marginTop: 28, fontSize: 14 }}>
          <Link to={guideTo}>{t("createSig.guideLink")}</Link>
          {" · "}
          <Link to="/trust">{t("createSig.trustLink")}</Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("createSig.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("createSig.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
