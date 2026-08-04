import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { INDUSTRY_PAGES } from "../lib/marketingPages";
import { getFreeTemplate } from "../lib/freeTemplates";
import { track } from "../lib/track";

/** One page per small-business "industry" (freelancers, agencies, real estate, construction,
 *  small business) — mirrors AlternativePage.tsx / ImportGuidePage.tsx's structure (hero band,
 *  container sections, cta band) but with content shaped around pain points + relevant free
 *  templates instead of a competitor comparison. Template names are looked up live from
 *  FREE_TEMPLATES so this can't drift out of sync with the template library. */
export default function IndustryPage({ slug }: { slug: string }) {
  const page = INDUSTRY_PAGES.find((p) => p.slug === slug);

  usePageMeta(page?.seoTitle ?? "Docracy", page?.seoDescription ?? "", {
    canonicalPath: `/industry/${slug}`,
  });

  if (!page) return null;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:industry-${page.slug}:${placement}` });
  };

  const templates = page.relevantTemplates
    .map((tplSlug) => getFreeTemplate(tplSlug))
    .filter((tpl): tpl is NonNullable<typeof tpl> => Boolean(tpl));

  const otherIndustries = INDUSTRY_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <h1>{page.heroHeadline}</h1>
          <p>{page.heroSubheadline}</p>
          <div style={{ marginTop: 20 }}>
            <Link
              to={page.ctaTo}
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
        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 8 }}>Who this is for</h2>
        <ul style={{ paddingLeft: 20 }}>
          {page.painPoints.map((point) => (
            <li key={point} style={{ marginBottom: 6 }}>
              {point}
            </li>
          ))}
        </ul>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>Why Docracy</h2>
        <p>{page.whyDocracy}</p>

        {page.honestLimit && (
          <div
            style={{
              marginTop: 24,
              padding: "14px 16px",
              border: "1px solid var(--hairline)",
              borderRadius: 8,
              background: "var(--surface-muted, rgba(127,127,127,0.06))",
            }}
          >
            <p style={{ margin: 0, fontSize: 14, color: "var(--mute)" }}>{page.honestLimit}</p>
          </div>
        )}

        <h2 style={{ fontSize: 22, marginTop: 36, marginBottom: 8 }}>Templates for this</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16 }}>
          {templates.map((tpl) => (
            <Link
              key={tpl.slug}
              to={`/free-templates/${tpl.slug}`}
              className="core-feature-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <h3>{tpl.name}</h3>
              <p>{tpl.description}</p>
            </Link>
          ))}
        </div>

        <h2 style={{ fontSize: 18, marginTop: 36, marginBottom: 8 }}>Other industries</h2>
        <ul style={{ paddingLeft: 20, marginTop: 0 }}>
          {otherIndustries.map((ind) => (
            <li key={ind.slug} style={{ marginBottom: 6 }}>
              <Link to={`/industry/${ind.slug}`}>{ind.heroHeadline}</Link>
            </li>
          ))}
          <li style={{ marginBottom: 6 }}>
            <Link to="/free-templates">Browse all free templates</Link>
          </li>
        </ul>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>Ready to send your first document? No account required.</p>
        <Link
          to={page.ctaTo}
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
