import { Link } from "react-router-dom";

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
      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 32 }}>
        Docracy doesn't verify who's signing — anyone with the link can sign as the name on it. For
        contracts that need identity-verified, legally binding signatures, use a compliance-grade
        e-signature service instead.
      </p>
    </div>
  );
}
