import { Link } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import type { SeoPage } from "../lib/i18n/paths";
import { SEO_EN_PATH } from "../lib/i18n/paths";
import { track } from "../lib/track";

type Props = {
  seoPage: SeoPage;
  /** i18n prefix, e.g. "developers" → developers.heroTitle */
  i18nPrefix: string;
  /** Analytics source slug */
  trackSource: string;
  /** Catalog key under seo.<key>.title / .description (usually matches useSeoMeta map) */
  seoCatalogKey: string;
  primaryCtaTo: string;
  primaryCtaQuery?: string;
  secondaryCtaTo?: string;
  featureIds: readonly string[];
  howCount?: number;
  faqCount?: number;
  relatedLinks?: Array<{ to: string; labelKey: string }>;
};

/** Shared SEO funnel layout (hero → features → how → FAQ → CTA). */
export default function SeoFunnelPage({
  seoPage,
  i18nPrefix: p,
  trackSource,
  seoCatalogKey,
  primaryCtaTo,
  primaryCtaQuery = "",
  secondaryCtaTo,
  featureIds,
  howCount = 4,
  faqCount = 4,
  relatedLinks = [],
}: Props) {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta(seoPage);

  const primaryTo = `${localizePath(primaryCtaTo, locale)}${primaryCtaQuery}`;
  const secondaryTo = secondaryCtaTo ? localizePath(secondaryCtaTo, locale) : null;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:${trackSource}:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: Array.from({ length: faqCount }, (_, i) => i + 1).map((n) => ({
      "@type": "Question",
      name: t(`${p}.faq.q${n}`),
      acceptedAnswer: { "@type": "Answer", text: t(`${p}.faq.a${n}`) },
    })),
  };

  const webPageJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: t(`seo.${seoCatalogKey}.title`),
    description: t(`seo.${seoCatalogKey}.description`),
    url: `https://docracy.io${SEO_EN_PATH[seoPage]}`,
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-eyebrow">{t(`${p}.eyebrow`)}</p>
          <h1 style={{ whiteSpace: "pre-line" }}>{t(`${p}.heroTitle`)}</h1>
          <p className="hero-sub">{t(`${p}.heroSub`)}</p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link to={primaryTo} className="btn-primary btn-lg" style={{ textDecoration: "none" }} onClick={() => onCta("hero")}>
              {t(`${p}.ctaPrimary`)}
            </Link>
            {secondaryTo && (
              <Link to={secondaryTo} className="hero-actions-secondary" onClick={() => onCta("hero_secondary")}>
                {t(`${p}.ctaSecondary`)}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: 48, paddingBottom: 24 }}>
        <h2 style={{ fontSize: 26, margin: "0 0 8px", textAlign: "center" }}>{t(`${p}.featuresTitle`)}</h2>
        <p style={{ textAlign: "center", color: "var(--mute)", margin: "0 0 28px", maxWidth: 560, marginInline: "auto" }}>
          {t(`${p}.featuresSub`)}
        </p>
        <div className="core-features-grid">
          {featureIds.map((id) => (
            <div key={id} className="core-feature-card">
              <h3>{t(`${p}.feat.${id}.title`)}</h3>
              <p>{t(`${p}.feat.${id}.body`)}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 22 }}>{t(`${p}.howTitle`)}</h2>
        <ol style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          {Array.from({ length: howCount }, (_, i) => i + 1).map((n) => (
            <li key={n} style={{ marginBottom: 10 }}>
              {t(`${p}.how.${n}`)}
            </li>
          ))}
        </ol>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 24, paddingBottom: 16 }}>
        <h2 style={{ fontSize: 22, marginTop: 0 }}>{t(`${p}.faqTitle`)}</h2>
        {Array.from({ length: faqCount }, (_, i) => i + 1).map((n) => (
          <details key={n} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`${p}.faq.q${n}`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`${p}.faq.a${n}`)}</p>
          </details>
        ))}
        {relatedLinks.length > 0 && (
          <ul style={{ marginTop: 28, paddingLeft: 18, fontSize: 14 }}>
            {relatedLinks.map((l) => (
              <li key={l.to} style={{ marginBottom: 8 }}>
                <Link to={localizePath(l.to, locale)}>{t(l.labelKey)}</Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t(`${p}.footerCta`)}</p>
        <Link
          to={primaryTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {t(`${p}.ctaPrimary`)}
        </Link>
      </div>
    </div>
  );
}
