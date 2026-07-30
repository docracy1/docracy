import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { ALTERNATIVE_PAGES } from "../lib/marketingPages";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { cleanPath, seoAlternates } from "../lib/i18n/paths";
import { useLocation } from "react-router-dom";
import { track } from "../lib/track";

export default function AlternativePage({ slug }: { slug: string }) {
  const page = ALTERNATIVE_PAGES.find((p) => p.slug === slug);
  const t = useT();
  const { locale } = useI18n();
  const location = useLocation();
  const isDocusign = slug === "docusign-alternative";
  const isDocusignEs = isDocusign && locale === "es";

  const docusignAlternates = seoAlternates("docusignAlternative");
  usePageMeta(
    isDocusign ? t("seo.docusign.title") : page?.seoTitle ?? "Docracy",
    isDocusign ? t("seo.docusign.description") : page?.seoDescription ?? "",
    isDocusign
      ? { canonicalPath: cleanPath(location.pathname), alternates: docusignAlternates }
      : undefined
  );

  if (!page) return null;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:${page.slug}:${placement}` });
  };

  const heroHeadline = isDocusignEs ? t("alt.docusign.heroHeadline") : page.heroHeadline;
  const heroSubheadline = isDocusignEs ? t("alt.docusign.heroSubheadline") : page.heroSubheadline;
  const problem = isDocusignEs ? t("alt.docusign.problem") : page.problem;
  const solution = isDocusignEs ? t("alt.docusign.solution") : page.solution;
  const comparison = isDocusignEs
    ? [t("alt.docusign.c1"), t("alt.docusign.c2"), t("alt.docusign.c3"), t("alt.docusign.c4"), t("alt.docusign.c5")]
    : page.comparison;
  const ctaLabel = isDocusignEs ? t("alt.docusign.ctaLabel") : page.ctaLabel;
  const compareLabel = isDocusignEs ? t("alt.docusign.compareLabel") : page.compareLabel;
  const ctaTo = localizePath(page.ctaTo, locale);
  const pricingTo = localizePath("/pricing?ref=seo-price", locale);

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <h1>{heroHeadline}</h1>
          <p>{heroSubheadline}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <Link
              to={ctaTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {ctaLabel}
            </Link>
            <Link
              to={pricingTo}
              className="btn-secondary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero_pricing")}
            >
              {t("alt.seePricing")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("alt.problem")}</h2>
        <p>{problem}</p>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("alt.solution")}</h2>
        <p>{solution}</p>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 8 }}>{t("alt.compare")}</h2>
        <ul style={{ paddingLeft: 20 }}>
          {comparison.map((c) => (
            <li key={c} style={{ marginBottom: 6 }}>
              {c}
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 24 }}>
          <Link to={`/blog/${page.compareBlogSlug}`}>{compareLabel} →</Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{t("alt.footerCta")}</p>
        <Link
          to={ctaTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}
