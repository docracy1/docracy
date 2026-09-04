import { Link, useLocation } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { getFeaturePageContent } from "../lib/marketingPages";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { cleanPath, ES_PATH_BY_EN } from "../lib/i18n/paths";
import { track } from "../lib/track";
import { NavIcon } from "../components/NavIcons";
import { isoUploadDate } from "../lib/howItWorksVideo";

/** Renders one of the FEATURE_PAGES entries — mounted at a distinct literal route per slug (see
 *  main.tsx), not a `:slug` param, so each gets its own static path for SEO/backlinks. */
export default function FeaturePage({ slug }: { slug: string }) {
  const { locale } = useI18n();
  const location = useLocation();
  const t = useT();
  const page = getFeaturePageContent(slug, locale);
  const enPath = `/${slug}`;
  const esPath = ES_PATH_BY_EN[enPath];

  usePageMeta(page?.seoTitle ?? "Docracy", page?.seoDescription ?? "", {
    canonicalPath: esPath ? cleanPath(location.pathname) : enPath,
    ...(esPath ? { alternates: { en: enPath, es: esPath }, xDefault: page?.xDefault } : {}),
  });

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

  const youtubeTitle = page.youtubeTitle ?? page.heroHeadline;
  const videoJsonLd = page.youtubeId
    ? {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: youtubeTitle,
        description: page.seoDescription,
        thumbnailUrl: [`https://img.youtube.com/vi/${page.youtubeId}/maxresdefault.jpg`],
        uploadDate: isoUploadDate(page.youtubeUploadDate ?? "2026-08-08"),
        embedUrl: `https://www.youtube-nocookie.com/embed/${page.youtubeId}`,
        contentUrl: `https://www.youtube.com/watch?v=${page.youtubeId}`,
        publisher: {
          "@type": "Organization",
          name: "Docracy",
          url: "https://docracy.io",
          logo: {
            "@type": "ImageObject",
            url: "https://docracy.io/docracy-seal-icon.png",
          },
        },
      }
    : null;

  return (
    <div>
      {faqJsonLd && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />}
      {videoJsonLd && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(videoJsonLd) }} />
      )}
      {page.darkHero ? (
        <div className="verify-dark-hero verify-dark-hero-compact">
          <div className="verify-dark-hero-inner">
            <h1>{page.heroHeadline}</h1>
            <p>{page.heroSubheadline}</p>
            <ul className="verify-dark-trust-row">
              <li>
                <NavIcon name="badge" />
                Checked against Docracy's records
              </li>
              <li>
                <NavIcon name="chainLink" />
                Independently checkable on Bitcoin
              </li>
            </ul>
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
      ) : (
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
      )}

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("feature.problem")}</h2>
        <p>{page.problem}</p>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("feature.solution")}</h2>
        <p>{page.solution}</p>

        {page.youtubeId ? (
          <div style={{ position: "relative", paddingBottom: "56.25%", height: 0, margin: "28px 0 8px" }}>
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${page.youtubeId}`}
              title={youtubeTitle}
              loading="lazy"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: 0, borderRadius: 8 }}
            />
          </div>
        ) : null}

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
