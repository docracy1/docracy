import { Link } from "react-router-dom";
import { FREE_TEMPLATES } from "../lib/freeTemplates";
import { usePageMeta } from "../lib/usePageMeta";

export default function FreeTemplates() {
  usePageMeta(
    "Free Business Document Templates — NDA, Contractor Agreement, Offer Letter | Docracy",
    "Free, ready-to-sign templates for the most common business documents — mutual NDA, independent contractor " +
      "agreement, offer letter, remote work policy, and freelance service agreement. Fill in your details and send " +
      "for signature in minutes."
  );

  return (
    <div className="container">
      <h1>Free document templates</h1>
      <p style={{ maxWidth: 640, color: "var(--mute)" }}>
        Standard templates for the business documents people need most — pick one, fill in your details, and send it
        out for signature. No account required to get started.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16, marginTop: 24 }}>
        {FREE_TEMPLATES.map((t) => (
          <Link
            key={t.slug}
            to={`/free-templates/${t.slug}`}
            className="card"
            style={{ textDecoration: "none", color: "inherit", display: "block" }}
          >
            <h3 style={{ marginTop: 0, marginBottom: 8 }}>{t.name}</h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--mute)" }}>{t.description}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
