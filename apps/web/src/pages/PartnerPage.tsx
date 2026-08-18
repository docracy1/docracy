import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { PARTNER_PAGES } from "../lib/partnerPages";
import { getFreeTemplate } from "../lib/freeTemplates";
import { track } from "../lib/track";

/** One page per audience/integration segment (CRMs, help desks, staffing, healthcare, etc.) for
 *  backlink outreach — mirrors IndustryPage.tsx's structure (hero band, container sections, cta
 *  band, FAQ + schema) but adds an explicit "namedTools" callout so an outreach recipient sees
 *  their own platform named, and swaps "other industries" for `relatedLinks` since partner pages
 *  don't form one flat list the way industries do. */
export default function PartnerPage({ slug }: { slug: string }) {
  const page = PARTNER_PAGES.find((p) => p.slug === slug);

  usePageMeta(page?.seoTitle ?? "Docracy", page?.seoDescription ?? "", {
    canonicalPath: `/for/${slug}`,
  });

  if (!page) return null;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:partner-${page.slug}:${placement}` });
  };

  const templates = page.relevantTemplates
    .map((tplSlug) => getFreeTemplate(tplSlug))
    .filter((tpl): tpl is NonNullable<typeof tpl> => Boolean(tpl));

  const faqs = [
    {
      question: "Do the people I send documents to need a Docracy account?",
      answer:
        "No — only the sender needs an account, so document history, saved templates, and team access have somewhere to live. Whoever's signing opens a link and signs, no signup required.",
    },
    {
      question: "Which documents can I send?",
      answer: `Ready-made templates for this include ${templates.map((tpl) => tpl.name).join(", ")}. You can also upload your own PDF.`,
    },
    page.honestLimit
      ? { question: "What doesn't Docracy do here?", answer: page.honestLimit }
      : {
          question: "Are Docracy signatures legally binding?",
          answer:
            "Docracy's signing flow is designed to support the U.S. ESIGN Act and UETA, and EU eIDAS simple electronic signatures, for everyday business documents — see our Trust & security page for exactly what that does and doesn't cover.",
        },
  ];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
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
        {page.namedTools.length > 0 && (
          <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 32 }}>
            Built for teams using tools like {page.namedTools.join(", ")} — or anything similar.
          </p>
        )}

        <h2 style={{ fontSize: 22, marginTop: 24, marginBottom: 8 }}>Where this fits</h2>
        <ul style={{ paddingLeft: 20 }}>
          {page.painPoints.map((point) => (
            <li key={point} style={{ marginBottom: 6 }}>
              {point}
            </li>
          ))}
        </ul>

        <h2 style={{ fontSize: 22, marginTop: 32 }}>Why Docracy</h2>
        <p>{page.whyDocracy}</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: 16, marginTop: 20 }}>
          {page.features.map((f) => (
            <div key={f.title} className="core-feature-card">
              <h3>{f.title}</h3>
              <p>{f.body}</p>
            </div>
          ))}
        </div>

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

        {templates.length > 0 && (
          <>
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
          </>
        )}

        <h2 style={{ fontSize: 19, marginTop: 36 }}>Frequently asked questions</h2>
        {faqs.map((faq, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{faq.question}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{faq.answer}</p>
          </details>
        ))}

        <h2 style={{ fontSize: 18, marginTop: 36, marginBottom: 8 }}>See also</h2>
        <ul style={{ paddingLeft: 20, marginTop: 0 }}>
          {page.relatedLinks.map((rel) => (
            <li key={rel.to} style={{ marginBottom: 6 }}>
              <Link to={rel.to}>{rel.label}</Link>
            </li>
          ))}
          <li style={{ marginBottom: 6 }}>
            <Link to="/free-templates">Browse all free templates</Link>
          </li>
          <li style={{ marginBottom: 6 }}>
            <Link to="/pricing">See pricing</Link>
          </li>
        </ul>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>Ready to send your first document?</p>
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
