import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { ALTERNATIVE_PAGES } from "../lib/marketingPages";
import { track } from "../lib/track";

export default function AlternativePage({ slug }: { slug: string }) {
  const page = ALTERNATIVE_PAGES.find((p) => p.slug === slug);
  if (!page) return null;

  usePageMeta(page.seoTitle, page.seoDescription);

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:${page.slug}:${placement}` });
  };

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <h1>{page.heroHeadline}</h1>
          <p>{page.heroSubheadline}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            <Link
              to={page.ctaTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {page.ctaLabel}
            </Link>
            <Link
              to="/pricing?ref=seo-price"
              className="btn-secondary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero_pricing")}
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>The problem</h2>
        <p>{page.problem}</p>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>The Docracy way</h2>
        <p>{page.solution}</p>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 8 }}>How Docracy compares</h2>
        <ul style={{ paddingLeft: 20 }}>
          {page.comparison.map((c) => (
            <li key={c} style={{ marginBottom: 6 }}>
              {c}
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 24 }}>
          <Link to={`/blog/${page.compareBlogSlug}`}>{page.compareLabel} →</Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>Free to start — no account needed to send or sign.</p>
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
