import { useMemo } from "react";
import { Link } from "react-router-dom";
import { localizePath, useI18n } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";

const FAQ_COUNT = 5;

const STEPS: Array<{ titleKey: string; bodyKey: string; to: string; ctaKey: string }> = [
  {
    titleKey: "latamUsPacket.step1.title",
    bodyKey: "latamUsPacket.step1.body",
    to: "/free-templates/offer-letter",
    ctaKey: "latamUsPacket.step1.cta",
  },
  {
    titleKey: "latamUsPacket.step2.title",
    bodyKey: "latamUsPacket.step2.body",
    to: "/free-templates/i-9-form",
    ctaKey: "latamUsPacket.step2.cta",
  },
  {
    titleKey: "latamUsPacket.step3.title",
    bodyKey: "latamUsPacket.step3.body",
    to: "/visa-supporting-documents",
    ctaKey: "latamUsPacket.step3.cta",
  },
  {
    titleKey: "latamUsPacket.step4.title",
    bodyKey: "latamUsPacket.step4.body",
    to: "/income-proof",
    ctaKey: "latamUsPacket.step4.cta",
  },
  {
    titleKey: "latamUsPacket.step5.title",
    bodyKey: "latamUsPacket.step5.body",
    to: "/packets/us-contractor",
    ctaKey: "latamUsPacket.step5.cta",
  },
];

const TEMPLATES: Array<{ slug: string; nameKey: string }> = [
  { slug: "offer-letter", nameKey: "tpl.offer-letter.name" },
  { slug: "employment-agreement", nameKey: "tpl.employment-agreement.name" },
  { slug: "i-9-form", nameKey: "tpl.i-9-form.name" },
  { slug: "power-of-attorney", nameKey: "latamUsPacket.tpl.poa" },
  { slug: "reference-letter", nameKey: "latamUsPacket.tpl.reference" },
  { slug: "child-travel-consent", nameKey: "latamUsPacket.tpl.childTravel" },
  { slug: "w-9-form", nameKey: "tpl.w-9-form.name" },
];

/**
 * LATAM → US landing: sign offer + official I-9, visa supporting templates we already ship,
 * constancia / cobro, then W-9 if they are a US person. We do not file petitions or run E-Verify.
 */
export default function LatamUsPacket() {
  const { t, locale } = useI18n();
  const canonicalPath = locale === "es" ? "/es/kit-llegar-eeuu" : "/packets/latam-to-us";

  usePageMeta(t("latamUsPacket.seoTitle"), t("latamUsPacket.seoDescription"), {
    canonicalPath,
    alternates: { en: "/packets/latam-to-us", es: "/es/kit-llegar-eeuu" },
    xDefault: "es",
  });

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
        "@type": "Question",
        name: t(`latamUsPacket.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`latamUsPacket.faq.${i + 1}.a`) },
      })),
    }),
    [t]
  );
  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("latamUsPacket.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t("latamUsPacket.howToName"), t("latamUsPacket.seoDescription"), [
        t("latamUsPacket.howTo1"),
        t("latamUsPacket.howTo2"),
        t("latamUsPacket.howTo3"),
        t("latamUsPacket.howTo4"),
        t("latamUsPacket.howTo5"),
      ]),
    [t]
  );

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p
            className="hero-kicker"
            style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}
          >
            {t("latamUsPacket.kicker")}
          </p>
          <h1>{t("latamUsPacket.heroTitle")}</h1>
          <p>{t("latamUsPacket.heroSub")}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <Link
              to={localizePath("/free-templates/i-9-form", locale)}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("landingpage_cta_clicked", { source: "seo:latam-to-us:hero" })}
            >
              {t("latamUsPacket.ctaPrimary")}
            </Link>
            <Link
              to={localizePath("/visa-supporting-documents", locale)}
              className="btn-secondary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("landingpage_cta_clicked", { source: "seo:latam-to-us:visa" })}
            >
              {t("latamUsPacket.ctaSecondary")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("latamUsPacket.stepsTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.stepsSub")}</p>
        <ol className="packet-steps">
          {STEPS.map((step, i) => (
            <li key={step.to} className="card packet-step">
              <p className="packet-step-num">{t("packet.stepN", { n: i + 1 })}</p>
              <h3 style={{ marginTop: 0 }}>{t(step.titleKey)}</h3>
              <p style={{ fontSize: 14, color: "var(--mute)" }}>{t(step.bodyKey)}</p>
              <Link
                to={localizePath(step.to, locale)}
                className="btn-secondary"
                style={{ textDecoration: "none", display: "inline-block" }}
                onClick={() => track("landingpage_cta_clicked", { source: `seo:latam-to-us:step${i + 1}` })}
              >
                {t(step.ctaKey)}
              </Link>
            </li>
          ))}
        </ol>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("latamUsPacket.templatesTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.templatesSub")}</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          {TEMPLATES.map((tpl) => (
            <li key={tpl.slug}>
              <Link to={localizePath(`/free-templates/${tpl.slug}`, locale)}>{t(tpl.nameKey)}</Link>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 8, fontSize: 14, color: "var(--mute)" }}>{t("latamUsPacket.hireHint")}</p>
        <p>
          <Link to={localizePath("/i-9", locale)}>{t("footer.i9")}</Link>
          {" · "}
          <Link to={localizePath("/visa-supporting-documents", locale)}>{t("footer.visaDocs")}</Link>
          {" · "}
          <Link to={localizePath("/cobro", locale)}>{t("footer.cobro")}</Link>
          {" · "}
          <Link to={localizePath("/packets/latam-contractor", locale)}>{t("footer.latamPacket")}</Link>
        </p>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
        {Array.from({ length: FAQ_COUNT }, (_, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`latamUsPacket.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`latamUsPacket.faq.${i + 1}.a`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
