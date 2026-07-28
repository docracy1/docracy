import { useState } from "react";
import { Link } from "react-router-dom";
import IntegrationsBand from "../components/IntegrationsBand";
import { usePageMeta } from "../lib/usePageMeta";

const EXAMPLE_URL = "https://mcp.docracy.io/mcp?token=dk_YOUR_API_KEY";

const CLIENTS = [
  {
    name: "Claude",
    sub: "(claude.ai or the desktop app)",
    setup:
      'Settings → Connectors → Add custom connector → paste your personal connector URL from the Dashboard (authentication "None" — the key is already in the URL).',
    use: 'Click the "+" at the bottom-left of the chat box → Connectors → make sure Docracy is toggled on for that conversation. Then just ask naturally — e.g. "find documents for Acme" or "check the status of [link]."',
  },
  {
    name: "ChatGPT",
    sub: "",
    setup:
      "Settings → Security and login → turn on Developer Mode. Then Settings → Connectors (or Plugins) → Add custom connector → paste your personal connector URL from the Dashboard.",
    use: 'Pick it from the Tools menu (the "+"/tools icon in the message box), or type "@Docracy" followed by your request.',
  },
  {
    name: "Grok",
    sub: "",
    setup:
      'Available on Grok\'s paid tiers. Click the "+" in the chat box → Connectors → New Connector → Custom → paste your personal connector URL from the Dashboard.',
    use: "Just ask your question normally once it's added — Grok calls the tool automatically when it's relevant.",
  },
  {
    name: "Perplexity",
    sub: "",
    setup:
      'Requires a Pro or Max plan. Settings → Connectors → Add custom connector → paste your personal connector URL from the Dashboard, authentication "None".',
    use: 'Reference it directly in your question — mentioning "Docracy" or asking something clearly related to your documents is usually enough.',
  },
];

export default function Mcp() {
  const [copied, setCopied] = useState(false);
  const onCopy = async () => {
    await navigator.clipboard.writeText(EXAMPLE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  usePageMeta(
    "Connect Docracy to Your AI Assistant — MCP Connector | Docracy",
    "Connect Docracy to Claude, ChatGPT, Grok, or Perplexity as an MCP connector on a paid account — " +
      "check signing status and search your documents from chat. Also automates with Zapier."
  );

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="hero-eyebrow" style={{ color: "var(--primary)" }}>
        For developers &amp; AI power users
      </div>
      <h1 style={{ fontSize: 36 }}>Connect Docracy to your AI assistant</h1>
      <p style={{ fontSize: 16, maxWidth: 620 }}>
        Docracy runs an <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">MCP</a> server —
        an open standard for giving an AI assistant tools it can call directly. On a paid account, add your personal
        connector URL to Claude, ChatGPT, Grok, or Perplexity and ask about your documents in plain English instead of
        opening a dashboard.
      </p>

      <IntegrationsBand learnMoreTo="/docs#automation" compact />

      <div className="card" style={{ marginTop: 24, background: "var(--primary-soft)", border: "1px solid var(--primary-soft-strong)" }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Paid account required</h3>
        <p style={{ marginBottom: 12 }}>
          The MCP connector uses your workspace API key. Sign in, upgrade if needed, then copy the personal connector
          URL from <strong>Dashboard → Connector &amp; API key</strong>. If the subscription ends, that key is revoked
          and the connector stops working.
        </p>
        <p style={{ marginBottom: 12, fontSize: 13.5 }}>
          Once connected, your assistant gets two read-only tools:
        </p>
        <ul style={{ marginTop: 0, paddingLeft: 20, fontSize: 13.5, marginBottom: 16 }}>
          <li>
            <strong>check_status</strong> — who's signed / who's still pending on a signing or status link.
          </li>
          <li>
            <strong>find_documents</strong> — search your own documents by title, signer name, email, or company.
          </li>
        </ul>
        <Link to="/login" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          Sign in to get your connector URL
        </Link>
        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 12, marginBottom: 0 }}>
          Nothing is ever signed or changed through MCP — every tool here is read-only. (PDF AI tools like
          auto-detect fields and contract explainer live in the web app, not in MCP.)
        </p>
      </div>

      <div className="accent-list" style={{ marginTop: 24 }}>
        {CLIENTS.map((c) => (
          <div key={c.name} className="accent-item">
            <h3 style={{ fontSize: 15, marginBottom: 4 }}>
              {c.name} {c.sub && <span style={{ fontWeight: 400, color: "var(--mute)", fontSize: 13 }}>{c.sub}</span>}
            </h3>
            <p style={{ margin: "0 0 4px", fontSize: 13.5 }}>
              <strong>Set up:</strong> {c.setup}
            </p>
            <p style={{ margin: 0, fontSize: 13.5 }}>
              <strong>Use it:</strong> {c.use}
            </p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Cursor, Claude Code, and other IDE/agent clients</h3>
        <p style={{ marginBottom: 8 }}>
          These connect via a JSON config file rather than a browser settings screen. Most MCP clients that
          support remote (HTTP) servers use a <code>mcpServers</code> block like this — add it to your client's MCP
          config file (e.g. Cursor's <code>.cursor/mcp.json</code>, Claude Code's <code>.mcp.json</code>), replacing
          the token with the one from your Dashboard:
        </p>
        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
          <input
            className="form-input"
            readOnly
            value={EXAMPLE_URL}
            onFocus={(e) => e.target.select()}
            style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }}
          />
          <button type="button" className="btn-secondary" onClick={onCopy} style={{ flexShrink: 0 }}>
            {copied ? "Copied!" : "Copy"}
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
          The exact key your client expects can vary (some want a <code>"type": "http"</code> field alongside{" "}
          <code>"url"</code>) — check your client's own MCP docs if this doesn't connect right away.
        </p>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ fontSize: 16 }}>Automate with Zapier</h3>
        <p style={{ marginBottom: 0 }}>
          Prefer a no-code automation instead of an AI assistant? The same paid account works with Zapier: trigger a
          Zap on <strong>Document Created</strong>, <strong>Signer Signed</strong>, or <strong>Document Completed</strong>,
          or send a saved template out for signature as an action. Search for "Docracy" when adding a new app to a
          Zap — same API key as above, used as the "API Key" field instead of the full connector URL.
        </p>
      </div>

      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 40 }}>
        Docracy doesn't verify identity — the audit trail proves what was signed and when, not who actually signed
        it. Nothing here changes that; every MCP tool is read-only.
      </p>
    </div>
  );
}
