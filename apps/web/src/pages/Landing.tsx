import { Link } from "react-router-dom";
import FeedbackForm from "../components/FeedbackForm";

function Icon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  upload: "M12 3v12 M7 8l5-5 5 5 M4 15v3a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-3",
  send: "M22 2 11 13 M22 2 15 22 11 13 2 9 22 2",
  order: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z M8 12l3 3 5-6",
  shield: "M12 3 19 6v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3Z M9 12l2 2 4-4",
};

const STEPS = [
  { icon: ICONS.upload, title: "Upload", body: "Drop in a PDF and place a signature field for each signer." },
  { icon: ICONS.send, title: "Send", body: "Docracy emails the first signer a link. No account needed on either end." },
  { icon: ICONS.order, title: "Sign, in order", body: "Each signer gets their turn automatically once the one before them is done." },
];

const PLAN_ROWS: Array<{ label: string; free: boolean | string; paid: boolean | string }> = [
  { label: "Signers per document", free: "Up to 2", paid: "Unlimited" },
  { label: "Sequential or all-at-once signing", free: true, paid: true },
  { label: "PIN-protected signing links", free: true, paid: true },
  { label: "Text, date, and initials fields", free: true, paid: true },
  { label: "Audit trail + completion certificate", free: true, paid: true },
  { label: "Dashboard with document history", free: false, paid: true },
  { label: "Reusable templates", free: false, paid: true },
  { label: "Webhooks for your own systems", free: false, paid: true },
  { label: "MCP connector (Claude, ChatGPT, Grok, Perplexity)", free: false, paid: true },
];

function PlanCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <>{value}</>;
  return value ? <span className="plan-check">✓</span> : <span className="plan-dash">—</span>;
}

export default function Landing() {
  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner">
          <div className="hero-eyebrow">Free · No signup · Sequential e-signatures</div>
          <h1>Sign it. Send it. It disappears.</h1>
          <p>
            Upload a PDF, add signers in order, and each one gets their turn automatically. No accounts,
            no dashboard — the document is gone once the chain is done.
          </p>
          <Link to="/prepare" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
            Start a signing chain
          </Link>
          <p style={{ fontSize: 13, color: "var(--hero-body)", marginTop: 14, marginBottom: 0, opacity: 0.85 }}>
            Free for chains of up to 2 signers.
          </p>
        </div>
      </div>

      <div className="container">
        <div className="feature-grid" style={{ marginTop: 8 }}>
          {STEPS.map((step) => (
            <div key={step.title} className="feature-card">
              <div className="icon-badge">
                <Icon path={step.icon} />
              </div>
              <h3 style={{ fontSize: 16, marginBottom: 6 }}>{step.title}</h3>
              <p style={{ margin: 0, fontSize: 14 }}>{step.body}</p>
            </div>
          ))}
        </div>

        <div className="feature-card" style={{ marginTop: 24 }}>
          <div className="icon-badge">
            <Icon path={ICONS.shield} />
          </div>
          <h3 style={{ fontSize: 16, marginBottom: 6 }}>Every signature is backed by an audit trail</h3>
          <p style={{ marginBottom: 0, fontSize: 14 }}>
            Each signer explicitly confirms their consent before signing. Docracy records the IP address,
            timestamp, and a cryptographic hash of the document at every step, and generates a certificate of
            completion once everyone's signed.
          </p>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20 }}>Free vs. paid</h2>
          <p>
            Everything above works on the free plan. A paid account adds a dashboard, reusable templates,
            webhooks, and an MCP connector for AI assistants — plus unlimited signers per document.
          </p>
          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="plan-table-scroll">
              <table className="plan-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Free</th>
                    <th className="plan-col-paid">Paid</th>
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div style={{ display: "flex", gap: 12, marginTop: 16, flexWrap: "wrap" }}>
            <Link to="/prepare" className="btn-secondary" style={{ textDecoration: "none" }}>
              Start free
            </Link>
            <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>
              Sign in to upgrade
            </Link>
          </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <h2 style={{ fontSize: 20 }}>How this compares to DocuSign or HelloSign</h2>
          <p style={{ marginBottom: 0 }}>
            DocuSign and HelloSign are built for identity-verified, enterprise-grade signing — accounts,
            dashboards, and compliance certifications included, usually for a monthly fee. Docracy is built
            for the opposite case: quick, low-stakes agreements — freelance gigs, roommate agreements,
            informal contracts — where nobody wants to create an account just to sign one PDF. Free, no
            signup, and the document disappears once everyone's signed.
          </p>
        </div>

        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 32 }}>
          Docracy doesn't verify identity — anyone with the link can sign as the name on it. The audit trail
          proves what was signed and when, not who actually signed it. For contracts that need
          identity-verified signatures, use a compliance-grade e-signature service instead.
        </p>

        <FeedbackForm />
      </div>
    </div>
  );
}
