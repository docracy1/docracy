import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

const FREE_URL = "https://mcp.docracy.io/mcp";

const CLIENTS = [
  {
    name: "Claude",
    sub: "(claude.ai or the desktop app)",
    setup: 'Settings → Connectors → Add custom connector → paste the URL above, authentication "None".',
    use: 'Click the "+" at the bottom-left of the chat box → Connectors → make sure Docracy is toggled on for that conversation. Then just ask naturally — e.g. "check the status of [link]."',
  },
  {
    name: "ChatGPT",
    sub: "",
    setup: "Settings → Security and login → turn on Developer Mode. Then Settings → Connectors (or Plugins) → Add custom connector → paste the URL above.",
    use: 'Pick it from the Tools menu (the "+"/tools icon in the message box), or type "@Docracy" followed by your request.',
  },
  {
    name: "Grok",
    sub: "",
    setup: 'Available on Grok\'s paid tiers. Click the "+" in the chat box → Connectors → New Connector → Custom → paste the URL above.',
    use: "Just ask your question normally once it's added — Grok calls the tool automatically when it's relevant.",
  },
  {
    name: "Perplexity",
    sub: "",
    setup: 'Requires a Pro or Max plan. Settings → Connectors → Add custom connector → paste the URL above, authentication "None".',
    use: 'Reference it directly in your question — mentioning "Docracy" or asking something clearly related to a signing link is usually enough.',
  },
];

export default function Mcp() {
  usePageMeta(
    "Connect Docracy to Your AI Assistant — MCP Connector | Docracy",
    "Connect Docracy to Claude, ChatGPT, Grok, or Perplexity as an MCP connector — free to try with no signup, " +
      "or upgrade for document search and the full AI toolset. Also automates with Zapier."
  );

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="hero-eyebrow" style={{ color: "var(--primary)" }}>
        For developers &amp; AI power users
      </div>
      <h1 style={{ fontSize: 36 }}>Connect Docracy to your AI assistant</h1>
      <p style={{ fontSize: 16, maxWidth: 620 }}>
        Docracy runs an <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">MCP</a> server —
        an open standard for giving an AI assistant tools it can call directly. Add it to Claude, ChatGPT, Grok, or
        Perplexity and ask about a signing link in plain English instead of opening a dashboard.
      </p>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Try it now — free, no signup</h3>
        <p style={{ marginBottom: 8 }}>
          This URL works immediately for anyone, no account needed. It gives your assistant one tool:{" "}
          <strong>check the status of a signing link</strong> — who's signed, who's still pending.
        </p>
        <input className="form-input" readOnly value={FREE_URL} style={{ width: "100%", fontFamily: "monospace", fontSize: 13 }} />
        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 8, marginBottom: 0 }}>
          Nothing is ever signed or changed through MCP — every tool here is read-only.
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

      <div className="card" style={{ marginTop: 32, background: "var(--primary-soft)", border: "1px solid var(--primary-soft-strong)" }}>
        <h3 style={{ marginTop: 0, fontSize: 16 }}>Upgrade for the rest of the toolset</h3>
        <p style={{ marginBottom: 12 }}>
          A paid account swaps that free URL for a personal one that adds:
        </p>
        <ul style={{ marginTop: 0, paddingLeft: 20, fontSize: 13.5 }}>
          <li>
            <strong>Search your own documents</strong> — by title, signer name, email, or company, right from the
            chat.
          </li>
          <li>
            <strong>Auto-detect signature &amp; date fields</strong> on any PDF you upload.
          </li>
          <li>
            <strong>Plain-English contract explainer</strong> — a 3-bullet summary of what each party is agreeing to.
          </li>
          <li>
            <strong>Risk &amp; clause highlighter</strong> — flags one-sided terms before you sign.
          </li>
          <li>
            <strong>Generate a contract with AI</strong> — describe an agreement in a sentence, get a ready-to-sign
            PDF back.
          </li>
        </ul>
        <Link to="/login" className="btn-primary" style={{ display: "inline-block", textDecoration: "none", marginTop: 4 }}>
          Sign in to get your connector URL
        </Link>
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
