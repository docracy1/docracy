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
