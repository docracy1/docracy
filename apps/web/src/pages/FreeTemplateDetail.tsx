import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getFreeTemplate } from "../lib/freeTemplates";
import { isSeoTemplateSlug, localizePath, templateAlternates, useI18n, useT } from "../lib/i18n";
import { cleanPath } from "../lib/i18n/paths";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { useLocation } from "react-router-dom";
import TemplateThumbnail from "../components/TemplateThumbnail";

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
    return (
      <div className="container">
        <h1>{t("tpl.detail.notFound")}</h1>
        <p>
          <Link to={indexTo}>{t("tpl.detail.back")}</Link>
        </p>
      </div>
    );
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
          <p style={{ color: "var(--mute)" }}>{useCase}</p>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            ✓ {t("tpl.detail.legalReviewLead")}{" "}
            <a href="https://www.boeck.law/about" target="_blank" rel="noopener noreferrer">
              Dr. Denisa Boeck
            </a>
            {t("tpl.detail.legalReviewTrail")}
          </p>
        </div>
      </div>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>{t("tpl.detail.includedTitle")}</h3>
        <p style={{ marginBottom: 8 }}>{t("tpl.detail.includedBody", { name: name.toLowerCase(), signers })}</p>
        <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 0 }}>{t("tpl.detail.disclaimer")}</p>
      </div>

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
    </div>
  );
}
