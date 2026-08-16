import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO landing for residual "docracy" brand-name search intent (the original Docracy.com was
 *  acquired by eversign in 2019 and discontinued). Deliberately explicit non-affiliation
 *  disclaimer — this must never read as claiming continuity with the original company. */
export default function DocracyAlternative() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("docracyAlternative");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-docracy-alt`;
  const templatesTo = localizePath("/free-templates", locale);
  const eversignAltTo = localizePath("/eversign-alternative", locale);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:docracy-alt:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5, 6].map((n) => ({
      "@type": "Question",
      name: t(`docracyAlt.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`docracyAlt.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("docracyAlt.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("docracyAlt.heroTitle")}</h1>
          <p className="hero-sub">{t("docracyAlt.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("docracyAlt.ctaTry")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("docracyAlt.historyTitle")}</h2>
        <p>{t("docracyAlt.historyBody")}</p>

        <h3 style={{ fontSize: 18, marginTop: 24 }}>{t("docracyAlt.timelineTitle")}</h3>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>{t("docracyAlt.timeline.1")}</li>
          <li style={{ marginBottom: 8 }}>{t("docracyAlt.timeline.2")}</li>
          <li style={{ marginBottom: 8 }}>{t("docracyAlt.timeline.3")}</li>
          <li style={{ marginBottom: 8 }}>{t("docracyAlt.timeline.4")}</li>
          <li>{t("docracyAlt.timeline.5")}</li>
        </ul>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("docracyAlt.disclaimerTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("docracyAlt.disclaimerBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22 }}>{t("docracyAlt.todayTitle")}</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>{t("docracyAlt.today.1")}</li>
          <li style={{ marginBottom: 8 }}>{t("docracyAlt.today.2")}</li>
          <li style={{ marginBottom: 8 }}>{t("docracyAlt.today.3")}</li>
          <li>{t("docracyAlt.today.4")}</li>
        </ul>
        <p style={{ fontSize: 14, marginTop: 20 }}>
          {t("docracyAlt.templatesLinkText")}{" "}
          <Link to={templatesTo} onClick={() => onCta("templates_link")}>
            {t("docracyAlt.templatesLinkCta")}
          </Link>
        </p>
        <p style={{ fontSize: 14 }}>
          {t("docracyAlt.eversignLinkText")}{" "}
          <Link to={eversignAltTo} onClick={() => onCta("eversign_link")}>
            {t("docracyAlt.eversignLinkCta")}
          </Link>
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("docracyAlt.faqTitle")}</h2>
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`docracyAlt.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`docracyAlt.faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("docracyAlt.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("docracyAlt.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
