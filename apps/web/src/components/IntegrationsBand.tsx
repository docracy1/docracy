import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";

/** Real integrations only — logos from Simple Icons (CC0) in /public/integrations/, plus
 *  OneDrive/OpenAI/Grok SVGs aligned with each vendor's brand colors. */
export const INTEGRATION_LOGOS = [
  { name: "Dropbox", file: "dropbox.svg", group: "storage" as const },
  { name: "OneDrive", file: "onedrive.svg", group: "storage" as const },
  { name: "Box", file: "box.svg", group: "storage" as const },
  { name: "Google Drive", file: "googledrive.svg", group: "storage" as const },
  { name: "WhatsApp", file: "whatsapp.svg", group: "messaging" as const },
  { name: "Zapier", file: "zapier.svg", group: "automation" as const },
  { name: "Claude", file: "claude.svg", group: "ai" as const },
  { name: "ChatGPT", file: "openai.svg", group: "ai" as const },
  { name: "Grok", file: "grok.svg", group: "ai" as const },
  { name: "Perplexity", file: "perplexity.svg", group: "ai" as const },
  { name: "Cursor", file: "cursor.svg", group: "ai" as const },
] as const;

type IntegrationsBandProps = {
  /** Where the primary CTA links — defaults to docs integrations overview. */
  learnMoreTo?: string;
  compact?: boolean;
};

export default function IntegrationsBand({ learnMoreTo = "/docs", compact = false }: IntegrationsBandProps) {
  const t = useT();
  return (
    <section className={`integrations-band${compact ? " integrations-band-compact" : ""}`} aria-labelledby="integrations-heading">
      <div className="integrations-inner">
        <h2 id="integrations-heading" style={{ fontSize: compact ? 22 : 26, marginBottom: 8, textAlign: "center" }}>
          {t("integrations.title")}
        </h2>
        <p style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 28px", color: "var(--mute)", fontSize: compact ? 14 : 15.5 }}>
          {t("integrations.sub")}
        </p>

        <div className="integrations-grid" role="list">
          {INTEGRATION_LOGOS.map((item) => (
            <div key={item.name} className="integrations-tile" role="listitem">
              <img src={`/integrations/${item.file}`} alt="" width={32} height={32} className="integrations-tile-logo" />
              <span className="integrations-tile-name">
                {item.name}
                {/* WhatsApp already delivers signing links (see /whatsapp-signing) — what it doesn't
                    do yet is auto-upload completed PDFs the way the storage connectors here do, so
                    showing it as ready-today without this note would overclaim. */}
                {item.name === "WhatsApp" && <span className="integrations-tile-soon"> ({t("integrations.comingSoon")})</span>}
              </span>
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--mute)", margin: "20px auto 0", maxWidth: 520 }}>
          {t("integrations.detail")}
        </p>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to={learnMoreTo} className="btn-primary btn-lg" style={{ textDecoration: "none", display: "inline-block" }}>
            {t("integrations.learnMore")}
          </Link>
        </div>
      </div>
    </section>
  );
}
