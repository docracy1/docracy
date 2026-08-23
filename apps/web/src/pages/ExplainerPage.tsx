import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { EXPLAINER_PAGES } from "../lib/marketingPages";
import { track } from "../lib/track";
import { useT } from "../lib/i18n";

export default function ExplainerPage({ slug }: { slug: string }) {
  const t = useT();
  const page = EXPLAINER_PAGES.find((p) => p.slug === slug);
  if (!page) return null;

  usePageMeta(page.seoTitle, page.seoDescription);

  const ctaTo = page.ctaTo.includes("?")
    ? `${page.ctaTo}&ref=seo-${page.slug}`
    : `${page.ctaTo}?ref=seo-${page.slug}`;

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
                <Link to={l.to}>{l.label}</Link>
              </span>
            ))}
          </p>
        )}
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>Free to start — no account needed to send or sign.</p>
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
