import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";
import TemplateThumbnail from "./TemplateThumbnail";

// Moved out of pages/FreeTemplates.tsx (1.11.2026): the landing page renders this card, and
// importing it from the page module pulled the whole template catalog into the eager bundle.
export function ProvenanceBadge({ kind }: { kind: "official" | "community" }) {
  const t = useT();
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 600,
        padding: "1px 7px",
        borderRadius: 999,
        color: kind === "official" ? "var(--on-primary)" : "var(--on-accent)",
        background: kind === "official" ? "var(--primary)" : "var(--accent)",
        marginLeft: 6,
      }}
    >
      {kind === "official" ? t("freeTemplates.officialBadge") : t("freeTemplates.communityBadge")}
    </span>
  );
}

export function TemplateCard({
  name,
  description,
  to,
  pdfPath,
  category,
  badge,
}: {
  name: string;
  description: string;
  to: string;
  pdfPath: string;
  category?: string;
  badge?: "official" | "community";
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="template-card-wrap" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link to={to} className="template-tile" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="template-tile-image">
          <TemplateThumbnail pdfPath={pdfPath} width={220} />
        </div>
        <div className="template-tile-body">
          {category && <span className="template-tile-tag">{category}</span>}
          <h3>
            {name}
            {badge && <ProvenanceBadge kind={badge} />}
          </h3>
        </div>
      </Link>

      {hovered && (
        <Link to={to} className="template-preview-popover" style={{ textDecoration: "none" }}>
          <div className="template-preview-thumb">
            <TemplateThumbnail pdfPath={pdfPath} width={260} />
          </div>
          <div className="template-preview-info">
            {category && <span className="template-preview-tag">{category}</span>}
            <h3>{name}</h3>
            <p>{description}</p>
            <span className="template-preview-meta">Free · No signup required</span>
            <span className="template-preview-cta">View template</span>
          </div>
        </Link>
      )}
    </div>
  );
}
