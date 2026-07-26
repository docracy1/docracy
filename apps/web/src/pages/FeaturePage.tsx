import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { FEATURE_PAGES } from "../lib/marketingPages";

/** Renders one of the FEATURE_PAGES entries — mounted at a distinct literal route per slug (see
 *  main.tsx), not a `:slug` param, so each gets its own static path for SEO/backlinks. */
export default function FeaturePage({ slug }: { slug: string }) {
  const page = FEATURE_PAGES.find((p) => p.slug === slug);
  if (!page) return null;

  usePageMeta(page.seoTitle, page.seoDescription);

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <h1>{page.heroHeadline}</h1>
          <p>{page.heroSubheadline}</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>The problem</h2>
        <p>{page.problem}</p>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>The Docracy way</h2>
        <p>{page.solution}</p>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 8 }}>Features</h2>
        <div className="core-features-grid">
          {page.features.map((f) => (
            <div key={f.title} className="core-feature-card">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 0 }}>Use cases</h2>
        <ul style={{ paddingLeft: 20 }}>
          {page.useCases.map((u) => (
            <li key={u} style={{ marginBottom: 4 }}>
              {u}
            </li>
          ))}
        </ul>

        {page.relatedLinks.length > 0 && (
          <p style={{ marginTop: 24, fontSize: 14 }}>
            {page.relatedLinks.map((l, i) => (
              <span key={l.to}>
                {i > 0 && " · "}
                <Link to={l.to}>{l.label}</Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>Free to start — no account needed to send or sign.</p>
        <Link to={page.ctaTo} className="btn-primary btn-lg" style={{ display: "inline-block", textDecoration: "none" }}>
          {page.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
