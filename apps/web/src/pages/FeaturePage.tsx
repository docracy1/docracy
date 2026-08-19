import { Link, useLocation } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { getFeaturePageContent } from "../lib/marketingPages";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { BILINGUAL_FEATURE_BY_SLUG, cleanPath, seoAlternates } from "../lib/i18n/paths";
import { track } from "../lib/track";

/** Renders one of the FEATURE_PAGES entries — mounted at a distinct literal route per slug (see
 *  main.tsx), not a `:slug` param, so each gets its own static path for SEO/backlinks. */
export default function FeaturePage({ slug }: { slug: string }) {
  const { locale } = useI18n();
  const location = useLocation();
  const t = useT();
  const page = getFeaturePageContent(slug, locale);
  const bilingual = BILINGUAL_FEATURE_BY_SLUG[slug];

  usePageMeta(
    page?.seoTitle ?? "Docracy",
    page?.seoDescription ?? "",
    bilingual
      ? { canonicalPath: cleanPath(location.pathname), alternates: seoAlternates(bilingual) }
      : undefined
  );

  if (!page) return null;

  const ctaBase = localizePath(page.ctaTo, locale);
  const ctaTo = ctaBase.includes("?") ? `${ctaBase}&ref=seo-${page.slug}` : `${ctaBase}?ref=seo-${page.slug}`;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:${page.slug}:${placement}` });
  };

  const faqJsonLd = page.faqs
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      }
    : null;

  return (
    <div>
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <h1>{page.heroHeadline}</h1>
          <p>{page.heroSubheadline}</p>
          <div style={{ marginTop: 20 }}>
            <Link
              to={ctaTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {page.ctaLabel}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("feature.problem")}</h2>
        <p>{page.problem}</p>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("feature.solution")}</h2>
        <p>{page.solution}</p>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 8 }}>{t("feature.features")}</h2>
        <div className="core-features-grid">
          {page.features.map((f) => (
            <div key={f.title} className="core-feature-card">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 0 }}>{t("feature.useCases")}</h2>
        <ul style={{ paddingLeft: 20 }}>
          {page.useCases.map((u) => (
            <li key={u} style={{ marginBottom: 4 }}>
              {u}
            </li>
          ))}
        </ul>

        {page.faqs && page.faqs.length > 0 && (
          <>
            <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
            {page.faqs.map((faq, i) => (
              <details key={i} className="faq-item" style={{ marginTop: 12 }}>
                <summary style={{ fontWeight: 700, cursor: "pointer" }}>{faq.question}</summary>
                <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{faq.answer}</p>
              </details>
            ))}
          </>
        )}

        {page.relatedLinks.length > 0 && (
          <p style={{ marginTop: 24, fontSize: 14 }}>
            {page.relatedLinks.map((l, i) => (
              <span key={l.to}>
                {i > 0 && " · "}
                <Link to={localizePath(l.to, locale)}>{l.label}</Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("alt.footerCta")}</p>
        <Link
          to={ctaTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {page.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
