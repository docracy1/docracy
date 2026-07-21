import { Link, useParams } from "react-router-dom";
import { getFreeTemplate } from "../lib/freeTemplates";
import { usePageMeta } from "../lib/usePageMeta";

export default function FreeTemplateDetail() {
  const { slug } = useParams<{ slug: string }>();
  const template = slug ? getFreeTemplate(slug) : undefined;

  usePageMeta(
    template ? `${template.seoTitle} | Docracy` : "Template not found | Docracy",
    template?.description ?? "This template couldn't be found."
  );

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
        to={`/prepare?freeTemplate=${template.slug}`}
        className="btn-primary"
        style={{ display: "inline-block", textDecoration: "none", marginTop: 20 }}
      >
        Use this template
      </Link>
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8 }}>
        Free for up to 2 signers, no account required.
      </p>
    </div>
  );
}
