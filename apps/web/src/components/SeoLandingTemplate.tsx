import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { getSeoLandingPage, resolveSeoLandingCopy, SEO_LANDING_PAGES, SEO_FAQS } from "../lib/seoPages";
import { localizePath, useI18n } from "../lib/i18n";
import { track } from "../lib/track";
import NotFound from "../pages/NotFound";

export default function SeoLandingTemplate({ slug }: { slug: string }) {
  const page = getSeoLandingPage(slug);
  const { locale, t } = useI18n();
  const copy = page ? resolveSeoLandingCopy(page, locale) : null;
  const latam = page?.lane === "latam";
  const immigrant = page?.lane === "immigrant";
  const bilingual = latam || immigrant;
  const canonicalPath = page
    ? bilingual && locale === "es"
      ? `/es/${page.slug}`
      : `/${page.slug}`
    : undefined;

  usePageMeta(copy?.seoTitle || "Docracy", copy?.seoDescription || "", {
    canonicalPath: canonicalPath ?? (page ? `/${page.slug}` : undefined),
    ...(bilingual && page
      ? { alternates: { en: `/${page.slug}`, es: `/es/${page.slug}` }, xDefault: "es" as const }
      : {}),
  });

  if (!page || !copy) return <NotFound />;

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:${page.slug}:${placement}` });
  };

  const ctaTo = localizePath(
    immigrant ? "/packets/latam-to-us" : latam ? "/cobro#send" : "/prepare",
    locale
  );
  const editorDemoTo = localizePath(
    immigrant ? "/packets/latam-to-us" : latam ? "/cobro#send" : "/prepare?freeTemplate=mutual-nda",
    locale
  );
  const pricingTo = localizePath("/pricing", locale);
  const faqs = copy.faqs ?? SEO_FAQS;
  const relatedPages = SEO_LANDING_PAGES.filter(
    (p) =>
      p.lane === page.lane &&
      p.slug !== page.slug &&
      (p.primaryCompetitor === page.primaryCompetitor ||
        p.primaryCompetitor === page.secondaryCompetitor ||
        p.secondaryCompetitor === page.primaryCompetitor ||
        p.secondaryCompetitor === page.secondaryCompetitor)
  ).slice(0, 3);

  const heroCta = immigrant
    ? t("seoVs.immigrantCta")
    : latam
      ? t("seoVs.latamCta")
      : t("seoVs.esignCta");
  const midTitle = immigrant
    ? t("seoVs.immigrantMidTitle", { a: page.primaryCompetitor, b: page.secondaryCompetitor })
    : latam
      ? t("seoVs.latamMidTitle", { a: page.primaryCompetitor, b: page.secondaryCompetitor })
      : t("seoVs.esignMidTitle", { a: page.primaryCompetitor, b: page.secondaryCompetitor });
  const midBody = immigrant
    ? t("seoVs.immigrantMidBody")
    : latam
      ? t("seoVs.latamMidBody")
      : t("seoVs.esignMidBody");
  const midCta = immigrant
    ? t("seoVs.immigrantMidCta")
    : latam
      ? t("seoVs.latamMidCta")
      : t("seoVs.esignMidCta");

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 800 }}>
          <h1>{copy.heroHeadline}</h1>
          <p>{copy.heroSubheadline}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20, justifyContent: "center" }}>
            <Link
              to={ctaTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero_start")}
            >
              {heroCta}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 800, marginTop: 40 }}>
        <h2 style={{ fontSize: 28, marginBottom: 24, textAlign: "center" }}>{midTitle}</h2>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", marginBottom: 40 }}>
            <thead>
              <tr style={{ borderBottom: "2px solid var(--border)", backgroundColor: "var(--bg-subtle)" }}>
                <th style={{ padding: "12px 16px" }}>{t("seoVs.feature")}</th>
                <th style={{ padding: "12px 16px", color: "var(--primary)", fontWeight: "bold" }}>Docracy</th>
                <th style={{ padding: "12px 16px" }}>{page.primaryCompetitor}</th>
                <th style={{ padding: "12px 16px" }}>{page.secondaryCompetitor}</th>
              </tr>
            </thead>
            <tbody>
              {copy.comparisonRows.map((row, idx) => (
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

        <div
          style={{
            backgroundColor: "var(--bg-subtle)",
            borderRadius: 8,
            padding: 32,
            textAlign: "center",
            marginBottom: 40,
          }}
        >
          <h2 style={{ fontSize: 24, marginTop: 0 }}>{midBody}</h2>
          <Link
            to={editorDemoTo}
            className="btn-secondary btn-lg"
            style={{ display: "inline-block", textDecoration: "none", marginTop: 12 }}
            onClick={() => onCta("founder_demo")}
          >
            {midCta}
          </Link>
        </div>

        {(relatedPages.length > 0 || immigrant) && (
          <div style={{ marginBottom: 40 }}>
            <h2 style={{ fontSize: 20, marginBottom: 12 }}>{t("seoVs.more")}</h2>
            <ul style={{ margin: 0, paddingLeft: 20, lineHeight: 1.9 }}>
              {relatedPages.map((p) => (
                <li key={p.slug}>
                  <Link to={localizePath(`/${p.slug}`, locale)}>
                    {p.primaryCompetitor} vs {p.secondaryCompetitor}
                  </Link>
                </li>
              ))}
              {immigrant ? (
                <>
                  <li>
                    <Link to={localizePath("/boundless-alternative", locale)}>{t("alt.related.boundless")}</Link>
                  </li>
                  <li>
                    <Link to={localizePath("/citizenpath-alternative", locale)}>{t("alt.related.citizenpath")}</Link>
                  </li>
                  <li>
                    <Link to={localizePath("/visa-service-alternative", locale)}>{t("alt.related.visaService")}</Link>
                  </li>
                  <li>
                    <Link to={localizePath("/packets/latam-to-us", locale)}>{t("footer.latamUsPacket")}</Link>
                  </li>
                </>
              ) : null}
            </ul>
          </div>
        )}

        <h2 style={{ fontSize: 24, marginBottom: 16 }}>{t("tpl.detail.faqTitle")}</h2>
        <div style={{ marginBottom: 8 }}>
          {faqs.map((faq, idx) => (
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
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            }),
          }}
        />
      </div>

      <div className="cta-band">
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>{t("seoVs.footerTitle")}</h2>
        <p style={{ fontSize: 18, marginBottom: 24, opacity: 0.9 }}>{t("seoVs.footerBody")}</p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
          <Link
            to={ctaTo}
            className="btn-primary btn-lg"
            style={{ display: "inline-block", textDecoration: "none" }}
            onClick={() => onCta("footer_start")}
          >
            {heroCta}
          </Link>
          <Link
            to={pricingTo}
            className="btn-secondary btn-lg"
            style={{ display: "inline-block", textDecoration: "none" }}
            onClick={() => onCta("footer_pricing")}
          >
            {t("alt.seePricing")}
          </Link>
        </div>
      </div>
    </div>
  );
}
