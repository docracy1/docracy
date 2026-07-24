import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 36 }} id={id}>
      <h2 style={{ fontSize: 20 }}>{title}</h2>
      {children}
    </div>
  );
}

export default function Docs() {
  usePageMeta(
    "Documentation — Docracy",
    "How Docracy's free signing flow, paid AI tools, templates, webhooks, and MCP/Zapier automation actually work."
  );

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 30 }}>Documentation</h1>
      <p style={{ color: "var(--mute)" }}>How everything in Docracy actually works, in one place.</p>

      <Section id="sending" title="Sending a document (free)">
        <p>
          Go to <Link to="/prepare">Prepare a document</Link>, upload a PDF, add signers in the order they
          should sign, and place a signature/date/text/initials field for each one. Free accounts support
          chains of up to 2 signers, no login required. Once you send it, the first signer gets an email
          with a link — no account needed on their end either. Each signer gets their turn automatically;
          the document (and all its data) is deleted 9 days after creation, or as soon as everyone's signed
          and the final copy has gone out by email — whichever comes first.
        </p>
      </Section>

      <Section id="templates-free" title="Free templates">
        <p>
          <Link to="/free-templates">15 ready-to-use templates</Link> — NDAs, offer letters, freelance
          agreements, leases, and more — with fields already placed. Pick one, fill in the bracketed
          details, and send it the same way as an uploaded PDF.
        </p>
      </Section>

      <Section id="paid" title="Paid account ($7/month)">
        <p>
          Signing in adds unlimited signers per document, a dashboard with document history, reusable
          saved templates, parallel (all-at-once) signing, PIN-protected signing links, team accounts
          (shared workspace with teammates), white-label branding (your own logo on emails/signing pages),
          and webhooks. See <Link to="/pricing">Pricing</Link> for the full comparison.
        </p>
      </Section>

      <Section id="ai" title="AI tools (paid)">
        <p style={{ marginBottom: 8 }}>Four AI features, available once signed in on a paid account:</p>
        <ul style={{ marginTop: 0 }}>
          <li>
            <strong>Auto-detect fields</strong> — upload a PDF and it places signature/date fields for you,
            instead of placing them by hand.
          </li>
          <li>
            <strong>Plain-English explainer</strong> — a 3-bullet summary of what each party is agreeing
            to, no legal jargon.
          </li>
          <li>
            <strong>Risk & clause highlighter</strong> — flags one-sided terms (long non-competes, vague
            payment terms, etc.) before you sign.
          </li>
          <li>
            <strong>Generate with AI</strong> — describe an agreement in a sentence on the Prepare page
            (e.g. "a simple web design contract for a $2,500 fixed-price project") and get a ready-to-sign
            PDF back, with fields already placed.
          </li>
        </ul>
      </Section>

      <Section id="mcp" title="Connect an AI assistant (MCP)">
        <p>
          Docracy runs an <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">MCP</a>{" "}
          server so Claude, ChatGPT, Grok, Perplexity, or an IDE agent like Cursor can check on a document
          or (on a paid account) search and send documents for you directly from a chat. There's a free,
          no-signup connector URL to try immediately. Full setup instructions: <Link to="/mcp">AI & MCP</Link>.
        </p>
      </Section>

      <Section id="automation" title="Zapier & webhooks">
        <p>
          On a paid account, the same API key that powers the MCP connector also works with{" "}
          <strong>Zapier</strong> — trigger a Zap on Document Created, Signer Signed, or Document
          Completed, or send a saved template out for signature as an action. <strong>Webhooks</strong>{" "}
          (configured from the Dashboard) let your own systems subscribe to those same three events
          directly, without Zapier in between.
        </p>
      </Section>

      <Section id="api" title="REST API reference">
        <p>
          Everything Zapier does above is also a plain REST API you can call directly with the same API
          key (Dashboard → "MCP connector &amp; API key") — useful if you want to integrate without Zapier
          in the middle.
        </p>
        <p>
          Base URL: <code>https://api.docracy.io</code>. Authenticate with{" "}
          <code>Authorization: Bearer &lt;your-api-key&gt;</code> (or a <code>?token=</code> query param).
          All responses are JSON.
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--hairline)" }}>
              <th style={{ padding: "6px 8px 6px 0" }}>Method &amp; path</th>
              <th style={{ padding: "6px 8px" }}>What it does</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>GET /api/zapier/auth-test</code>
              </td>
              <td style={{ padding: "6px 8px" }}>Verifies the API key. Returns <code>{`{ email, workspaceId }`}</code>.</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>GET /api/zapier/templates</code>
              </td>
              <td style={{ padding: "6px 8px" }}>
                Lists your saved templates: <code>{`[{ id, name }]`}</code>.
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>POST /api/zapier/documents</code>
              </td>
              <td style={{ padding: "6px 8px" }}>
                Sends a saved template for signature. Body: <code>{`{ templateId, signers: [{ name, email }] }`}</code> —
                the number of signers must match the template. Returns{" "}
                <code>{`{ docId, statusToken, statusUrl }`}</code>.
              </td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>POST /api/zapier/hooks/:event</code>
              </td>
              <td style={{ padding: "6px 8px" }}>
                Subscribes a URL to an event. <code>:event</code> is one of{" "}
                <code>document-created</code>, <code>signer-signed</code>, <code>document-completed</code>. Body:{" "}
                <code>{`{ target_url }`}</code>. Returns <code>{`{ id }`}</code>.
              </td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>DELETE /api/zapier/hooks/:id</code>
              </td>
              <td style={{ padding: "6px 8px" }}>Removes a webhook subscription created above.</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 10, marginBottom: 0 }}>
          This is the same surface Zapier itself calls — nothing here is Zapier-exclusive. Webhook
          deliveries are HMAC-signed the same way regardless of whether the subscription came from Zapier,
          the Dashboard, or this API directly.
        </p>
      </Section>

      <Section id="privacy" title="Privacy & identity">
        <p style={{ marginBottom: 0 }}>
          Docracy doesn't verify who's actually signing — anyone holding a document's link can sign as the
          name on it. The audit trail proves what was signed and when, not who a signer really is. See{" "}
          <Link to="/privacy">Privacy</Link> and <Link to="/terms">Terms</Link> for the full picture.
        </p>
      </Section>
    </div>
  );
}
