import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO landing: "free electronic signature" — laser-focused on the free tier specifically
 *  (limits, what's included, when to upgrade), distinct from /pricing's full 3-tier comparison.
 *  Bilingual (EN/ES). */
export default function FreeElectronicSignature() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("freeElectronicSignature");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-free-signature`;
  const pricingTo = localizePath("/pricing", locale);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:free-signature:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((n) => ({
      "@type": "Question",
      name: t(`freeSig.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`freeSig.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("freeSig.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("freeSig.heroTitle")}</h1>
          <p className="hero-sub">{t("freeSig.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("freeSig.ctaTry")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("freeSig.includedTitle")}</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>{t("freeSig.included.1")}</li>
          <li style={{ marginBottom: 8 }}>{t("freeSig.included.2")}</li>
          <li style={{ marginBottom: 8 }}>{t("freeSig.included.3")}</li>
          <li>{t("freeSig.included.4")}</li>
        </ul>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22 }}>{t("freeSig.upgradeTitle")}</h2>
        <p>{t("freeSig.upgradeBody")}</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>{t("freeSig.upgrade.1")}</li>
          <li style={{ marginBottom: 8 }}>{t("freeSig.upgrade.2")}</li>
          <li>{t("freeSig.upgrade.3")}</li>
        </ul>
        <p style={{ fontSize: 14 }}>
          <Link to={pricingTo} onClick={() => onCta("pricing_link")}>{t("freeSig.pricingLink")}</Link>
        </p>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("freeSig.catchTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("freeSig.catchBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("freeSig.faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`freeSig.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`freeSig.faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("freeSig.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("freeSig.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
