import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { getSeoLandingPage, SEO_LANDING_PAGES, SEO_FAQS } from "../lib/seoPages";
import { localizePath, useI18n } from "../lib/i18n";
import { track } from "../lib/track";
import NotFound from "../pages/NotFound";

export default function SeoLandingTemplate({ slug }: { slug: string }) {
  const page = getSeoLandingPage(slug);
  const { locale } = useI18n();

  usePageMeta(page?.seoTitle || "Docracy", page?.seoDescription || "", {
    canonicalPath: page ? `/${page.slug}` : undefined,
  });

  if (!page) return <NotFound />;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:${page.slug}:${placement}` });
  };

  const ctaTo = localizePath("/prepare", locale);
  const editorDemoTo = localizePath("/prepare?freeTemplate=mutual-nda", locale);
  const pricingTo = localizePath("/pricing", locale);
  const relatedPages = SEO_LANDING_PAGES.filter(
    (p) =>
      p.slug !== page.slug &&
      (p.primaryCompetitor === page.primaryCompetitor ||
        p.primaryCompetitor === page.secondaryCompetitor ||
        p.secondaryCompetitor === page.primaryCompetitor ||
        p.secondaryCompetitor === page.secondaryCompetitor)
  ).slice(0, 3);

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 800 }}>
          <h1>{page.heroHeadline}</h1>
          <p>{page.heroSubheadline}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20, justifyContent: "center" }}>
            <Link
              to={ctaTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero_start")}
            >
              Try Docracy free — no signup required
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800, marginTop: 40 }}>
        <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: "center" }}>
          How Docracy compares to {page.primaryCompetitor} and {page.secondaryCompetitor}
        </h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginBottom: 40 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}>
                <th style={{ padding: "12px 16px" }}>Feature</th>
                <th style={{ padding: "12px 16px", color: "var(--primary)", fontWeight: "bold" }}>Docracy</th>
                <th style={{ padding: "12px 16px" }}>{page.primaryCompetitor}</th>
                <th style={{ padding: "12px 16px" }}>{page.secondaryCompetitor}</th>
              </tr>
            </thead>
            <tbody>
              {page.comparisonRows.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "12px 16px", fontWeight: "bold" }}>{row.feature}</td>
                  <td style={{ padding: "12px 16px", backgroundColor: "var(--primary-subtle)", color: "var(--primary-dark)", fontWeight: "bold" }}>
                    {row.docracyValue}
                  </td>
                  <td style={{ padding: "12px 16px" }}>{row.competitorValue}</td>
                  <td style={{ padding: "12px 16px" }}>{row.secondCompetitorValue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div style={{
          backgroundColor: "var(--bg-subtle)",
          borderRadius: 8,
          padding: 32,
          textAlign: "center",
          marginBottom: 40
        }}>
          <h2 style={{ fontSize: 24, marginTop: 0 }}>Built by a founder for founders — no enterprise complexity.</h2>
          <p style={{ maxWidth: 600, margin: "16px auto", color: "var(--text-muted)" }}>
            We built Docracy because we were tired of tools that make you create an account just to sign an NDA, and charge per-seat for occasional paperwork.
          </p>
          <Link
            to={editorDemoTo}
            className="btn-secondary btn-lg"
            style={{ display: "inline-block", textDecoration: "none", marginTop: 12 }}
            onClick={() => onCta("founder_demo")}
          >
            Try a real agreement — no signup required
          </Link>
        </div>

        {relatedPages.length > 0 && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>More comparisons</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {relatedPages.map((p) => (
                <li key={p.slug}>
                  <Link to={localizePath(`/${p.slug}`, locale)}>
                    {p.primaryCompetitor} vs {p.secondaryCompetitor}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h2 style={{ fontSize: 24, marginBottom: 16 }}>Frequently asked questions</h2>
        <div style={{ marginBottom: 8 }}>
          {SEO_FAQS.map((faq, idx) => (
            <div key={idx} style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 17, marginBottom: 6 }}>{faq.question}</h3>
              <p style={{ color: "var(--text-muted)", margin: 0 }}>{faq.answer}</p>
            </div>
          ))}
        </div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: SEO_FAQS.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            }),
          }}
        />
      </div>

      <div className="cta-band">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>Simple, flat pricing</h2>
        <p style={{ fontSize: 18, marginBottom: 24, opacity: 0.9 }}>
          Free for up to 2 signers. $10/mo keeps signed files and lets you get paid after they sign. No per-seat pricing.
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to={ctaTo}
            className="btn-primary btn-lg"
            style={{ display: "inline-block", textDecoration: "none" }}
            onClick={() => onCta("footer_start")}
          >
            Create your free account
          </Link>
          <Link
            to={pricingTo}
            className="btn-secondary btn-lg"
            style={{ display: "inline-block", textDecoration: "none" }}
            onClick={() => onCta("footer_pricing")}
          >
            See full pricing
          </Link>
        </div>
      </div>
    </div>
  );
}
