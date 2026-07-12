import { Link } from "react-router-dom";
import FeedbackForm from "../components/FeedbackForm";

const STEPS = [
  { title: "1. Upload", body: "Drop in a PDF and place a signature field for each signer." },
  { title: "2. Send", body: "Docracy emails the first signer a link. No account needed on either end." },
  { title: "3. Sign, in order", body: "Each signer gets their turn automatically once the one before them is done." },
];

export default function Landing() {
  return (
    <div className="container">
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>Sign it. Send it. It disappears.</h1>
      <p>
        Docracy is a free, no-signup, sequential e-signature tool. Upload a PDF, add signers in order, and
        each one gets their turn automatically. No accounts, no dashboard — the document is gone once the
        chain is done.
      </p>
      <Link to="/prepare" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
        Start a signing chain
      </Link>
      <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 12, marginBottom: 0 }}>
        Free for chains of up to 2 signers.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: 24,
          marginTop: 56,
        }}
      >
        {STEPS.map((step) => (
          <div key={step.title}>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
              {step.title}
            </div>
            <p style={{ margin: 0 }}>{step.body}</p>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginTop: 56 }}>
        <h3 style={{ fontSize: 15 }}>Every signature is backed by an audit trail</h3>
        <p style={{ marginBottom: 0 }}>
          Each signer explicitly confirms their consent before signing. Docracy records the IP address,
          timestamp, and a cryptographic hash of the document at every step, and generates a certificate of
          completion once everyone's signed.
        </p>
      </div>

      <div style={{ marginTop: 56 }}>
        <h3 style={{ fontSize: 15 }}>How this compares to DocuSign or HelloSign</h3>
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
  );
}
