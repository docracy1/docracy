import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { getFreeTemplate } from "../lib/freeTemplates";
import { isSeoTemplateSlug, localizePath, templateAlternates, useI18n, useT } from "../lib/i18n";
import { cleanPath } from "../lib/i18n/paths";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { useLocation } from "react-router-dom";
import { apiUrl, fetchMarketplaceTemplate, type MarketplaceTemplateDetail } from "../lib/api";
import TemplateThumbnail from "../components/TemplateThumbnail";
import TrustSection from "../components/TrustSection";

/** The 4 optional LLM/ChatGPT-optimization sections (key clauses, fill-in fields, legal summary,
 *  suggested prompts) — shared between the static Docracy-authored branch and the community
 *  (Marketplace) branch below, since a template approved through admin review now carries the
 *  same fields (see the 0025 migration). Each section renders only when its field is present. */
function SeoTemplateSections({
  keyClauses,
  fillInFields,
  legalSummary,
  chatgptPrompts,
}: {
  keyClauses?: string[] | null;
  fillInFields?: string[] | null;
  legalSummary?: string | null;
  chatgptPrompts?: string[] | null;
}) {
  const t = useT();
  return (
    <>
      {!!keyClauses?.length && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t("tpl.detail.keyClausesTitle")}</h3>
          <ul style={{ margin: 0, paddingLeft: 20 }}>
            {keyClauses.map((clause, i) => (
              <li key={i}>{clause}</li>
            ))}
          </ul>
        </div>
      )}

      {!!fillInFields?.length && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t("tpl.detail.fillInTitle")}</h3>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {fillInFields.map((field, i) => (
              <code
                key={i}
                style={{
                  fontSize: 13,
                  padding: "4px 10px",
                  borderRadius: 6,
                  background: "var(--surface-2, rgba(127,127,127,0.12))",
                }}
              >
                {field}
              </code>
            ))}
          </div>
        </div>
      )}

      {legalSummary && (
        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t("tpl.detail.legalSummaryTitle")}</h3>
          <p style={{ margin: 0 }}>{legalSummary}</p>
        </div>
      )}

      {!!chatgptPrompts?.length && (
        <div style={{ marginTop: 32 }}>
          <h2 style={{ fontSize: 19 }}>{t("tpl.detail.promptsTitle")}</h2>
          <p style={{ fontSize: 13, color: "var(--mute)" }}>{t("tpl.detail.promptsIntro")}</p>
          {chatgptPrompts.map((prompt, i) => (
            <p
              key={i}
              style={{
                fontSize: 14,
                fontStyle: "italic",
                padding: "10px 14px",
                borderRadius: 8,
                background: "var(--surface-2, rgba(127,127,127,0.08))",
                marginTop: 8,
              }}
            >
              “{prompt}”
            </p>
          ))}
        </div>
      )}
    </>
  );
}

/** A community (Marketplace-submitted) template — fetched from the API rather than the static
 *  bundle. Deliberately its own, simpler render branch below: no attorney-review disclaimer (that
 *  claim is only true for Docracy's own templates) and no per-slug i18n-catalog FAQ copy (that
 *  only exists for the hand-authored static set). Templates approved through the Marketplace
 *  review queue can still carry the same SEO sections as a static one — see SeoTemplateSections. */
function CommunityTemplateDetail({ slug }: { slug: string }) {
  const t = useT();
  const { locale } = useI18n();
  const [template, setTemplate] = useState<MarketplaceTemplateDetail | null | undefined>(undefined);

  useEffect(() => {
    fetchMarketplaceTemplate(slug)
      .then(setTemplate)
      .catch(() => setTemplate(null));
  }, [slug]);

  useEffect(() => {
    if (!template) return;
    track("template_opened", { templateId: slug, templateCategory: template.category ?? undefined });
    track("template_preview_opened", { templateId: slug, templateCategory: template.category ?? undefined });
  }, [template, slug]);

  const isWeeklyOfficial = template?.origin === "weekly";
  const seoTitle = template?.seoTitle || (template ? `${template.title}` : "");
  const pageTitle = template
    ? isWeeklyOfficial
      ? `${seoTitle} | Docracy`
      : `${template.title} | Docracy Marketplace`
    : t("tpl.detail.notFoundTitle");

  usePageMeta(pageTitle, template?.description ?? t("tpl.detail.notFoundDesc"), {
    canonicalPath: `/free-templates/${slug}`,
  });

  const indexTo = localizePath("/free-templates", locale);

  if (template === undefined) return null; // loading
  if (template === null) {
    return (
      <div className="container">
        <h1>{t("tpl.detail.notFound")}</h1>
        <p>
          <Link to={indexTo}>{t("tpl.detail.back")}</Link>
        </p>
      </div>
    );
  }

  const ctaTo = localizePath(`/prepare?marketplaceTemplate=${slug}&ref=seo-marketplace-${slug}`, locale);
  const name = template.title;
  const signers = Array.from({ length: template.signerCount }, (_, i) => `Signer ${i + 1}`).join(
    ` ${t("common.and")} `
  );

  // Monday-cron rows use the same FreeTemplate detail scheme (definition + useCase + FAQ +
  // official badge). Human community submits stay on the lighter Marketplace layout.
  if (isWeeklyOfficial) {
    const faqVars = { name, signers };
    const faqs = [1, 2, 3, 4].map((n) => ({
      question: t(`tpl.detail.faq${n}.q`, faqVars),
      answer: t(`tpl.detail.faq${n}.a`, faqVars),
    }));
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
      <div className="container" style={{ maxWidth: 720 }}>
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
        <p style={{ fontSize: 13 }}>
          <Link to={indexTo}>← {t("tpl.detail.backAll")}</Link>
        </p>
        <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
          <TemplateThumbnail pdfPath={apiUrl(`/api/marketplace/${slug}/pdf`)} width={280} />
          <div style={{ flex: 1, minWidth: 240 }}>
            <h1 style={{ marginTop: 0 }}>
              {name}{" "}
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  padding: "2px 8px",
                  borderRadius: 999,
                  color: "var(--on-primary)",
                  background: "var(--primary)",
                  verticalAlign: "middle",
                }}
              >
                {t("freeTemplates.officialBadge")}
              </span>
            </h1>
            <p style={{ color: "var(--mute)" }}>
              {template.definition ? `${template.definition} ` : ""}
              {template.useCase ?? ""}
            </p>
          </div>
        </div>

        <div className="card" style={{ marginTop: 16 }}>
          <h3 style={{ marginTop: 0 }}>{t("tpl.detail.includedTitle")}</h3>
          <p style={{ marginBottom: 8 }}>{t("tpl.detail.includedBody", { name: name.toLowerCase(), signers })}</p>
          <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 0 }}>{t("tpl.detail.disclaimer")}</p>
        </div>

        <SeoTemplateSections
          keyClauses={template.keyClauses}
          fillInFields={template.fillInFields}
          legalSummary={template.legalSummary}
        />

        <Link
          to={ctaTo}
          className="btn-primary"
          style={{ display: "inline-block", textDecoration: "none", marginTop: 20 }}
          onClick={() =>
            track("landingpage_cta_clicked", {
              source: `seo:weekly-template:${slug}`,
              templateId: slug,
              templateCategory: template.category ?? undefined,
            })
          }
        >
          {t("tpl.detail.cta")}
        </Link>
        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}>{t("tpl.detail.freeNote")}</p>

        <h2 style={{ fontSize: 19, marginTop: 32 }}>{t("tpl.detail.faqTitle")}</h2>
        {faqs.map((faq, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{faq.question}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{faq.answer}</p>
          </details>
        ))}

        <SeoTemplateSections chatgptPrompts={template.chatgptPrompts} />
        <TrustSection />
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <p style={{ fontSize: 13 }}>
        <Link to={indexTo}>← {t("tpl.detail.backAll")}</Link>
      </p>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <TemplateThumbnail pdfPath={apiUrl(`/api/marketplace/${slug}/pdf`)} width={280} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ marginTop: 0 }}>
            {template.title}{" "}
            <span
              style={{
                fontSize: 11,
                fontWeight: 600,
                padding: "2px 8px",
                borderRadius: 999,
                color: "var(--on-accent)",
                background: "var(--accent)",
                verticalAlign: "middle",
              }}
            >
              {t("freeTemplates.communityBadge")}
            </span>
          </h1>
          {template.category && <p style={{ color: "var(--mute)" }}>{template.category}</p>}
          <p style={{ fontSize: 12, color: "var(--danger)" }}>{t("freeTemplates.communityIntro")}</p>
        </div>
      </div>

      {template.description && (
        <div className="card" style={{ marginTop: 16 }}>
          <p style={{ margin: 0 }}>{template.description}</p>
        </div>
      )}

      <SeoTemplateSections
        keyClauses={template.keyClauses}
        fillInFields={template.fillInFields}
        legalSummary={template.legalSummary}
        chatgptPrompts={template.chatgptPrompts}
      />

      <Link
        to={ctaTo}
        className="btn-primary"
        style={{ display: "inline-block", textDecoration: "none", marginTop: 20 }}
        onClick={() =>
          track("landingpage_cta_clicked", {
            source: `seo:marketplace-template:${slug}`,
            templateId: slug,
            templateCategory: template.category ?? undefined,
          })
        }
      >
        {t("tpl.detail.cta")}
      </Link>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}>{t("tpl.detail.freeNote")}</p>
    </div>
  );
}

export default function FreeTemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const template = slug ? getFreeTemplate(slug) : undefined;
  const t = useT();
  const { locale } = useI18n();
  const location = useLocation();

  const useEsCopy = Boolean(slug && isSeoTemplateSlug(slug) && locale === "es");
  const name = useEsCopy ? t(`tpl.${slug}.name`) : template?.name ?? "";
  const seoTitle = useEsCopy ? t(`tpl.${slug}.seoTitle`) : template?.seoTitle;
  const description = useEsCopy ? t(`tpl.${slug}.description`) : template?.description;
  const useCase = useEsCopy ? t(`tpl.${slug}.useCase`) : template?.useCase;

  usePageMeta(
    template ? `${seoTitle} | Docracy` : t("tpl.detail.notFoundTitle"),
    description ?? t("tpl.detail.notFoundDesc"),
    slug && isSeoTemplateSlug(slug)
      ? { canonicalPath: cleanPath(location.pathname), alternates: templateAlternates(slug) }
      : undefined
  );

  useEffect(() => {
    if (!template) return;
    track("template_opened", { templateId: template.slug, templateCategory: template.recurringCategory });
    track("template_preview_opened", { templateId: template.slug, templateCategory: template.recurringCategory });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.slug]);

  const indexTo = localizePath("/free-templates", locale);

  if (!template) {
    if (!slug) {
      return (
        <div className="container">
          <h1>{t("tpl.detail.notFound")}</h1>
          <p>
            <Link to={indexTo}>{t("tpl.detail.back")}</Link>
          </p>
        </div>
      );
    }
    // Not in the static, Docracy-authored set — try the community (Marketplace) API before
    // giving up and showing "not found".
    return <CommunityTemplateDetail slug={slug} />;
  }

  const signers = template.signerLabels.join(` ${t("common.and")} `);
  const ctaTo = localizePath(`/prepare?freeTemplate=${template.slug}&ref=seo-template-${template.slug}`, locale);

  const faqVars = { name, signers };
  const faqs = [1, 2, 3, 4].map((n) => ({
    question: t(`tpl.detail.faq${n}.q`, faqVars),
    answer: t(`tpl.detail.faq${n}.a`, faqVars),
  }));
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
    <div className="container" style={{ maxWidth: 720 }}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <p style={{ fontSize: 13 }}>
        <Link to={indexTo}>← {t("tpl.detail.backAll")}</Link>
      </p>
      <div style={{ display: "flex", gap: 20, alignItems: "flex-start", flexWrap: "wrap" }}>
        <TemplateThumbnail pdfPath={template.pdfPath} width={280} />
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ marginTop: 0 }}>{name}</h1>
          <p style={{ color: "var(--mute)" }}>
            {template.definition ? `${template.definition} ` : ""}
            {useCase}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t("tpl.detail.includedTitle")}</h3>
        <p style={{ marginBottom: 8 }}>{t("tpl.detail.includedBody", { name: name.toLowerCase(), signers })}</p>
        <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 0 }}>{t("tpl.detail.disclaimer")}</p>
      </div>

      <SeoTemplateSections
        keyClauses={template.keyClauses}
        fillInFields={template.fillInFields}
        legalSummary={template.legalSummary}
      />

      <Link
        to={ctaTo}
        className="btn-primary"
        style={{ display: "inline-block", textDecoration: "none", marginTop: 20 }}
        onClick={() =>
          track("landingpage_cta_clicked", {
            source: `seo:template:${template.slug}`,
            templateId: template.slug,
            templateCategory: template.recurringCategory,
          })
        }
      >
        {t("tpl.detail.cta")}
      </Link>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}>{t("tpl.detail.freeNote")}</p>

      <h2 style={{ fontSize: 19, marginTop: 32 }}>{t("tpl.detail.faqTitle")}</h2>
      {faqs.map((faq, i) => (
        <details key={i} className="faq-item" style={{ marginTop: 12 }}>
          <summary style={{ fontWeight: 700, cursor: "pointer" }}>{faq.question}</summary>
          <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{faq.answer}</p>
        </details>
      ))}

      <SeoTemplateSections chatgptPrompts={template.chatgptPrompts} />

      <TrustSection />

      <div style={{ marginTop: 24, textAlign: "center" }}>
        <Link
          to={ctaTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() =>
            track("landingpage_cta_clicked", {
              source: `seo:template:footer:${template.slug}`,
              templateId: template.slug,
              templateCategory: template.recurringCategory,
            })
          }
        >
          {t("tpl.detail.cta")}
        </Link>
        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}>{t("tpl.detail.freeNote")}</p>
      </div>
    </div>
  );
}
