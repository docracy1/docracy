import { useState } from "react";
import { Link } from "react-router-dom";
import IntegrationsBand from "../components/IntegrationsBand";
import { useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";

const EXAMPLE_URL = "https://mcp.docracy.io/mcp?token=dk_YOUR_API_KEY";

const CLIENT_IDS = ["claude", "chatgpt", "grok", "perplexity"] as const;

export default function Mcp() {
  const t = useT();
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(EXAMPLE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useSeoMeta("mcp");

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="hero-eyebrow" style={{ color: "var(--primary)" }}>
        {t("mcp.eyebrow")}
      </div>
      <h1 style={{ fontSize: 36 }}>{t("mcp.title")}</h1>
      <p style={{ fontSize: 16, maxWidth: 620 }}>
        {t("mcp.intro1")}{" "}
        <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">
          MCP
        </a>
        {t("mcp.intro2")}
      </p>

      <IntegrationsBand learnMoreTo="/docs#automation" compact />

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>{t("mcp.freeToolTitle")}</h3>
        <p style={{ marginBottom: 0 }}>{t("mcp.freeToolBody")}</p>
      </div>

      <div className="card" style={{ marginTop: 16, background: "var(--primary-soft)", border: "1px solid var(--primary-soft-strong)" }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>{t("mcp.paidRequired")}</h3>
        <p style={{ marginBottom: 12 }}>{t("mcp.paidBody")}</p>
        <p style={{ marginBottom: 12, fontSize: 13.5 }}>{t("mcp.toolsIntro")}</p>
        <ul style={{ marginTop: 0, paddingLeft: 20, fontSize: 13.5, marginBottom: 16 }}>
          <li>{t("mcp.toolCheckStatus")}</li>
          <li>{t("mcp.toolFindDocuments")}</li>
        </ul>
        <Link to="/login" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          {t("mcp.signInCta")}
        </Link>
        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 12, marginBottom: 0 }}>
          {t("mcp.readOnlyNote")}
        </p>
      </div>

      <div className="accent-list" style={{ marginTop: 24 }}>
        {CLIENT_IDS.map((id) => {
          const sub = t(`mcp.client.${id}.sub`);
          return (
            <div key={id} className="accent-item">
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>
                {t(`mcp.client.${id}.name`)}{" "}
                {sub ? (
                  <span style={{ fontWeight: 400, color: "var(--mute)", fontSize: 13 }}>{sub}</span>
                ) : null}
              </h3>
              <p style={{ margin: "0 0 4px", fontSize: 13.5 }}>
                <strong>{t("mcp.setupLabel")}</strong> {t(`mcp.client.${id}.setup`)}
              </p>
              <p style={{ margin: 0, fontSize: 13.5 }}>
                <strong>{t("mcp.useLabel")}</strong> {t(`mcp.client.${id}.use`)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>{t("mcp.ideTitle")}</h3>
        <p style={{ marginBottom: 8 }}>{t("mcp.ideBody")}</p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="form-input"
            readOnly
            value={EXAMPLE_URL}
            onFocus={(e) => e.target.select()}
            style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }}
          />
          <button type="button" className="btn-secondary" onClick={onCopy} style={{ flexShrink: 0 }}>
            {copied ? t("common.copied") : t("common.copy")}
          </button>
        </div>
        <pre
          style={{
            background: "var(--canvas-soft)",
            border: "1px solid var(--hairline)",
            borderRadius: "var(--r-sm)",
            padding: 14,
            fontSize: 12.5,
            overflowX: "auto",
          }}
        >
{`{
  "mcpServers": {
    "docracy": {
      "url": "${EXAMPLE_URL}"
    }
  }
}`}
        </pre>
        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8, marginBottom: 0 }}>
          {t("mcp.ideNote")}
        </p>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16 }}>{t("mcp.zapierTitle")}</h3>
        <p style={{ marginBottom: 8 }}>{t("mcp.zapierBody")}</p>
        <a
          href="https://zapier.com/developer/public-invite/244127/19874ff8c2595eb7c85a5fe4bf48914a/"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={{ display: "inline-block" }}
        >
          {t("mcp.zapierLinkLabel")}
        </a>
      </div>

      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 40 }}>
        {t("mcp.disclaimer")}
      </p>
    </div>
  );
}
