import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { EXPLAINER_PAGES } from "../lib/marketingPages";

export default function ExplainerPage({ slug }: { slug: string }) {
  const page = EXPLAINER_PAGES.find((p) => p.slug === slug);
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
        {page.sections.map((s) => (
          <div key={s.heading} style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 22 }}>{s.heading}</h2>
            {s.body && <p>{s.body}</p>}
            {s.list && (
              <ul style={{ paddingLeft: 20 }}>
                {s.list.map((item) => (
                  <li key={item} style={{ marginBottom: 4 }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}
          </div>
        ))}

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
