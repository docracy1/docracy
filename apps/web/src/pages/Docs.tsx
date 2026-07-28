import { Link } from "react-router-dom";
import { PLAN_ROWS, PlanCell } from "../lib/planRows";
import { usePageMeta } from "../lib/usePageMeta";
import { FREE_TEMPLATES } from "../lib/freeTemplates";

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
    "How Docracy's free signing flow, paid features (bulk send, embed, contacts, Dropbox/OneDrive/Box, AI), Enterprise options, templates, webhooks, and MCP/Zapier automation work."
  );

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 30 }}>Documentation</h1>
      <p style={{ color: "var(--mute)" }}>How everything in Docracy actually works, in one place.</p>

      <Section id="plans" title="Plans at a glance (Free / Paid / Enterprise)">
        <p style={{ marginBottom: 12 }}>
          Same feature matrix as <Link to="/pricing">Pricing</Link> — Free vs Paid ($10/mo) vs Enterprise.
          Dropbox, OneDrive, and Box auto-upload are included on <strong>Paid</strong>.
        </p>
        <div className="card" style={{ padding: 0 }}>
          <div className="plan-table-scroll">
            <table className="plan-table">
              <thead>
                <tr>
                  <th></th>
                  <th>Free</th>
                  <th className="plan-col-paid">Paid</th>
                  <th>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {PLAN_ROWS.map((row) => (
                  <tr key={row.label}>
                    <td>{row.label}</td>
                    <td>
                      <PlanCell value={row.free} />
                    </td>
                    <td className="plan-col-paid">
                      <PlanCell value={row.paid} />
                    </td>
                    <td>
                      <PlanCell value={row.enterprise ?? row.paid} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Section>

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
          <Link to="/free-templates">{FREE_TEMPLATES.length} ready-to-use templates</Link> — NDAs, offer letters, freelance
          agreements, leases, and more — with fields already placed. Pick one, fill in the bracketed
          details, and send it the same way as an uploaded PDF.
        </p>
      </Section>

      <Section id="paid" title="Paid account ($10/month)">
        <p>
          Signing in adds unlimited signers per document, a dashboard with document history, reusable
          saved templates, parallel (all-at-once) signing, PIN-protected signing links, team accounts
          (shared workspace with teammates), white-label branding (your own logo on emails/signing pages),
          webhooks, MCP/Zapier, AI tools, Dropbox/OneDrive/Box auto-upload, plus the workflow features
          below. See the table above or <Link to="/pricing">Pricing</Link>.
        </p>
      </Section>

      <Section id="cloud-connectors" title="Dropbox, OneDrive, and Box (paid)">
        <p>
          Connect cloud storage from Dashboard → Tools → <strong>Connectors</strong>. After a document
          finishes signing, Docracy uploads the final PDF automatically — no manual download step.
          Available on Paid and Enterprise.
        </p>
        <ul>
          <li>
            <strong>Dropbox</strong>
          </li>
          <li>
            <strong>OneDrive</strong> (Microsoft)
          </li>
          <li>
            <strong>Box</strong>
          </li>
        </ul>
      </Section>

      <Section id="bulk-send" title="Bulk send (paid)">
        <p>
          From the Dashboard (Templates → Bulk send, or <code>/bulk-send</code>), pick a saved template and
          send it to many recipient groups at once — one document per row. Paste a list of names/emails or
          fill the form; each row becomes its own signing chain with the same field layout. Optionally set
          a custom expiry (see below). Paid only.
        </p>
      </Section>

      <Section id="expiry" title="Custom document expiry (paid)">
        <p>
          Free documents always expire after 9 days (or sooner once everyone has signed and the final copy
          is emailed). On a paid account you can choose retention of <strong>1–90 days</strong> when
          preparing a document or bulk-sending from a template.
        </p>
      </Section>

      <Section id="embed" title="Embedded signing (paid)">
        <p>
          Host the signing UI inside your own product via an iframe. Create a short-lived embed session
          with <code>POST /api/embed/sessions</code> (cookie session or API key) — body includes{" "}
          <code>docId</code>, <code>signerOrder</code>, optional <code>allowedOrigins</code>,{" "}
          <code>returnUrl</code>, and <code>ttlSeconds</code>. The response gives an{" "}
          <code>embedUrl</code> to load at <code>/embed/sign/…</code>. Origins not on the allowlist are
          rejected. Read-only status for agents still goes through MCP; embedding is for your app&apos;s
          UI.
        </p>
      </Section>

      <Section id="contacts" title="Contacts &amp; signer reassignment (paid)">
        <p>
          Save contacts under Dashboard → Tools → <strong>Contacts</strong>. Their names and emails
          autocomplete on Prepare and when reassigning. For a pending document, reassign a signer to a
          new name/email from the Dashboard — the old link stops working and the new person gets the
          turn. You can also <strong>void</strong> a pending document from the Dashboard so the chain is
          cancelled.
        </p>
      </Section>

      <Section id="enterprise" title="Enterprise">
        <p>
          Enterprise includes everything in Paid, plus invoice/annual billing, premium (SLA-backed)
          support, volume discounts &amp; custom onboarding, and optional SSO or multi-workspace setup.
          Contact <a href="mailto:sales@docracy.io">sales@docracy.io</a> or upgrade from the Dashboard
          subscription tab.
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
          server so Claude, ChatGPT, Grok, Perplexity, or an IDE agent like Cursor can check signing status and
          search your documents from a chat. Requires a paid account — copy your personal connector URL from
          Dashboard → Connector &amp; API key. Full setup instructions: <Link to="/mcp">AI & MCP</Link>.
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
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>DELETE /api/zapier/hooks/:id</code>
              </td>
              <td style={{ padding: "6px 8px" }}>Removes a webhook subscription created above.</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>POST /api/embed/sessions</code>
              </td>
              <td style={{ padding: "6px 8px" }}>
                Creates an embedded-signing session (paid). Body:{" "}
                <code>{`{ docId, signerOrder, allowedOrigins?, returnUrl?, ttlSeconds? }`}</code>. Returns{" "}
                <code>{`{ embedToken, embedUrl, expiresAt }`}</code>. Also accepts the workspace API key.
              </td>
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
