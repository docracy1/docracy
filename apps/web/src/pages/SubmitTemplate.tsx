import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO/social-share landing page for submitting a template to the Marketplace — built to be
 *  linked from LinkedIn/X/Facebook posts. "Browse templates" stays first/left in the CTA row
 *  (matching /template-marketplace's hero layout) since most visitors are still evaluating,
 *  with "Submit a template" as the secondary/right action. */
export default function SubmitTemplate() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("submitTemplate");

  const browseTo = localizePath("/free-templates", locale);
  const submitTo = `${localizePath("/prepare", locale)}?ref=seo-submit-template`;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:submit-template:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4, 5].map((n) => ({
      "@type": "Question",
      name: t(`submitTemplate.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`submitTemplate.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("submitTemplate.eyebrow")}</p>
          <h1>{t("submitTemplate.heroTitle")}</h1>
          <p className="hero-sub">{t("submitTemplate.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8, display: "flex", gap: 12, flexWrap: "wrap" }}>
            <Link
              to={browseTo}
              className="btn-secondary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero_browse")}
            >
              {t("submitTemplate.ctaBrowse")}
            </Link>
            <Link
              to={submitTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero_submit")}
            >
              {t("submitTemplate.ctaSubmit")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("submitTemplate.whyTitle")}</h2>
        <div style={{ display: "grid", gap: 20, marginTop: 16 }}>
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("submitTemplate.why1.title")}</h3>
            <p style={{ margin: 0 }}>{t("submitTemplate.why1.body")}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("submitTemplate.why2.title")}</h3>
            <p style={{ margin: 0 }}>{t("submitTemplate.why2.body")}</p>
          </div>
          <div>
            <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("submitTemplate.why3.title")}</h3>
            <p style={{ margin: 0 }}>{t("submitTemplate.why3.body")}</p>
          </div>
        </div>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("submitTemplate.howTitle")}</h2>
          <div style={{ display: "grid", gap: 20, marginTop: 16 }}>
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("submitTemplate.how1.title")}</h3>
              <p style={{ margin: 0 }}>{t("submitTemplate.how1.body")}</p>
            </div>
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("submitTemplate.how2.title")}</h3>
              <p style={{ margin: 0 }}>{t("submitTemplate.how2.body")}</p>
            </div>
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("submitTemplate.how3.title")}</h3>
              <p style={{ margin: 0 }}>{t("submitTemplate.how3.body")}</p>
            </div>
            <div>
              <h3 style={{ fontSize: 17, marginBottom: 4 }}>{t("submitTemplate.how4.title")}</h3>
              <p style={{ margin: 0 }}>{t("submitTemplate.how4.body")}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("submitTemplate.faqTitle")}</h2>
        {[1, 2, 3, 4, 5].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`submitTemplate.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`submitTemplate.faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("submitTemplate.footerCta")}</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            to={browseTo}
            className="btn-secondary btn-lg"
            style={{ display: "inline-block", textDecoration: "none" }}
            onClick={() => onCta("footer_browse")}
          >
            {t("submitTemplate.ctaBrowse")}
          </Link>
          <Link
            to={submitTo}
            className="btn-primary btn-lg"
            style={{ display: "inline-block", textDecoration: "none" }}
            onClick={() => onCta("footer_submit")}
          >
            {t("submitTemplate.ctaSubmit")}
          </Link>
        </div>
      </div>
    </div>
  );
}
