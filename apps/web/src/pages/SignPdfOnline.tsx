import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

/** SEO landing: "sign a PDF online" — distinct from /create-a-digital-signature by focusing on
 *  an EXISTING PDF that needs editing (redact, reorder, add text) before or while signing, using
 *  Docracy's actual PDF-editing tools. Bilingual (EN/ES). */
export default function SignPdfOnline() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("signPdfOnline");

  const prepareTo = `${localizePath("/prepare", locale)}?ref=seo-sign-pdf`;
  const createSigTo = localizePath("/create-a-digital-signature", locale);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:sign-pdf-online:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [1, 2, 3, 4].map((n) => ({
      "@type": "Question",
      name: t(`signPdf.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`signPdf.faq.a${n}`) },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t("signPdf.eyebrow")}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t("signPdf.heroTitle")}</h1>
          <p className="hero-sub">{t("signPdf.heroSub")}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to={prepareTo}
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {t("signPdf.ctaTry")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("signPdf.editTitle")}</h2>
        <p>{t("signPdf.editBody")}</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>{t("signPdf.edit.1")}</li>
          <li style={{ marginBottom: 8 }}>{t("signPdf.edit.2")}</li>
          <li style={{ marginBottom: 8 }}>{t("signPdf.edit.3")}</li>
          <li>{t("signPdf.edit.4")}</li>
        </ul>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 24 }}>
        <h2 style={{ fontSize: 22 }}>{t("signPdf.howTitle")}</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 10 }}>{t("signPdf.how.1")}</li>
          <li style={{ marginBottom: 10 }}>{t("signPdf.how.2")}</li>
          <li style={{ marginBottom: 10 }}>{t("signPdf.how.3")}</li>
          <li>{t("signPdf.how.4")}</li>
        </ol>
        <p style={{ fontSize: 14 }}>
          {t("signPdf.createSigLead")}{" "}
          <Link to={createSigTo} onClick={() => onCta("create_sig_link")}>{t("signPdf.createSigLink")}</Link>
        </p>
      </div>

      <div className="spotlight-band">
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("signPdf.noAccountTitle")}</h2>
          <p style={{ marginBottom: 0 }}>{t("signPdf.noAccountBody")}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 40, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t("signPdf.faqTitle")}</h2>
        {[1, 2, 3, 4].map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`signPdf.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`signPdf.faq.a${n}`)}</p>
          </details>
        ))}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("signPdf.footerCta")}</p>
        <Link
          to={prepareTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t("signPdf.ctaTry")}
        </Link>
      </div>
    </div>
  );
}
