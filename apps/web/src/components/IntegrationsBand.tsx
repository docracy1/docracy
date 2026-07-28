import { Link } from "react-router-dom";

/** Real integrations only — logos from Simple Icons (CC0) in /public/integrations/, plus
 *  OneDrive/OpenAI/Grok SVGs aligned with each vendor's brand colors. */
export const INTEGRATION_LOGOS = [
  { name: "Dropbox", file: "dropbox.svg", group: "storage" as const, href: "https://www.dropbox.com/", color: "#0061ff" },
  {
    name: "OneDrive",
    file: "onedrive.svg",
    group: "storage" as const,
    href: "https://www.microsoft.com/microsoft-365/onedrive/online-cloud-storage",
    color: "#0078d4",
  },
  { name: "Box", file: "box.svg", group: "storage" as const, href: "https://www.box.com/", color: "#0061d5" },
  { name: "Zapier", file: "zapier.svg", group: "automation" as const, href: "https://zapier.com/", color: "#ff4f00" },
  { name: "Claude", file: "claude.svg", group: "ai" as const, href: "https://claude.ai/", color: "#cc785c" },
  { name: "ChatGPT", file: "openai.svg", group: "ai" as const, href: "https://chatgpt.com/", color: "#412991" },
  { name: "Grok", file: "grok.svg", group: "ai" as const, href: "https://grok.com/", color: "#111111" },
  { name: "Perplexity", file: "perplexity.svg", group: "ai" as const, href: "https://www.perplexity.ai/", color: "#20b8a5" },
  { name: "Cursor", file: "cursor.svg", group: "ai" as const, href: "https://cursor.com/", color: "#111111" },
] as const;

type IntegrationsBandProps = {
  /** Where the primary CTA links — defaults to docs integrations overview. */
  learnMoreTo?: string;
  compact?: boolean;
};

export default function IntegrationsBand({ learnMoreTo = "/docs", compact = false }: IntegrationsBandProps) {
  return (
    <section className={`integrations-band${compact ? " integrations-band-compact" : ""}`} aria-labelledby="integrations-heading">
      <div className="integrations-inner">
        <h2 id="integrations-heading" style={{ fontSize: compact ? 22 : 26, marginBottom: 8, textAlign: "center" }}>
          Connect Docracy with the tools you already use
        </h2>
        <p style={{ textAlign: "center", maxWidth: 560, margin: "0 auto 28px", color: "var(--mute)", fontSize: compact ? 14 : 15.5 }}>
          Plug into the platforms you already use — cloud storage, automation, and AI assistants. Paid accounts unlock
          native connectors; everything listed here is real today.
        </p>

        <div className="integrations-grid" role="list">
          {INTEGRATION_LOGOS.map((item) => (
            <a
              key={item.name}
              className="integrations-tile"
              role="listitem"
              href={item.href}
              target="_blank"
              rel="noreferrer"
              aria-label={`Open ${item.name}`}
              style={{ ["--integration-brand" as string]: item.color }}
            >
              <img src={`/integrations/${item.file}`} alt="" width={32} height={32} className="integrations-tile-logo" />
              <span className="integrations-tile-name">{item.name}</span>
            </a>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 12.5, color: "var(--mute)", margin: "20px auto 0", maxWidth: 520 }}>
          Dropbox, OneDrive, and Box auto-upload signed PDFs. Zapier and webhooks automate your stack. MCP connects Claude,
          ChatGPT, Grok, Perplexity, and Cursor to your documents.
        </p>

        <div style={{ textAlign: "center", marginTop: 24 }}>
          <Link to={learnMoreTo} className="btn-primary btn-lg" style={{ textDecoration: "none", display: "inline-block" }}>
            Learn more →
          </Link>
        </div>
      </div>
    </section>
  );
}
