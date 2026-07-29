import { useEffect } from "react";
import { Link, useParams } from "react-router-dom";
import { getFreeTemplate } from "../lib/freeTemplates";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";

export default function FreeTemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const template = slug ? getFreeTemplate(slug) : undefined;

  usePageMeta(
    template ? `${template.seoTitle} | Docracy` : "Template not found | Docracy",
    template?.description ?? "This template couldn't be found."
  );

  // Fires both names from the spec's two overlapping funnels — Activation's "template_opened"
  // and the Template funnel's "template_preview_opened" both describe this exact same moment
  // (landing on a free template's own page), just from two different funnel viewpoints.
  useEffect(() => {
    if (!template) return;
    track("template_opened", { templateId: template.slug, templateCategory: template.recurringCategory });
    track("template_preview_opened", { templateId: template.slug, templateCategory: template.recurringCategory });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template?.slug]);

  if (!template) {
    return (
      <div className="container">
        <h1>Template not found</h1>
        <p>
          <Link to="/free-templates">Back to all free templates</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <p style={{ fontSize: 13 }}>
        <Link to="/free-templates">← All free templates</Link>
      </p>
      <h1>{template.name}</h1>
      <p style={{ color: "var(--mute)" }}>{template.useCase}</p>

      <div className="card" style={{ marginTop: 16 }}>
        <h3 style={{ marginTop: 0 }}>What's included</h3>
        <p style={{ marginBottom: 8 }}>
          A ready-to-use {template.name.toLowerCase()} with signature fields already placed for{" "}
          {template.signerLabels.join(" and ")}. Fill in the bracketed details (like [Company Name] or [Date]) using
          Docracy's built-in text editor, then send it out for signature.
        </p>
        <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 0 }}>
          This is a general template for informational purposes only and does not constitute legal advice. Consult a
          qualified attorney to review it for your specific situation and jurisdiction before use.
        </p>
      </div>

      <Link
        to={`/prepare?freeTemplate=${template.slug}&ref=seo-template-${template.slug}`}
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
        Use this template
      </Link>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}>
        Free for up to 2 signers, no account required.
      </p>
    </div>
  );
}
