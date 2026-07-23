import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

export default function About() {
  usePageMeta(
    "About Docracy",
    "Why Docracy exists: free, no-signup e-signatures for quick, low-stakes agreements — built by RELACON GmbH."
  );

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>About Docracy</h1>

      <h3>Why this exists</h3>
      <p>
        Most e-signature tools are built for enterprise contracts — identity verification, compliance
        certifications, accounts for everyone involved. That's the right tool for a lot of contracts, and
        the wrong one for a freelance gig, a roommate agreement, or an NDA before a first call. Docracy is
        built for that second case: upload a PDF, add signers in order, and the document disappears once
        everyone's signed. No account needed to send or sign a chain of up to two people.
      </p>

      <h3>What it isn't</h3>
      <p>
        Docracy doesn't verify who's actually signing — the audit trail proves what was signed and when,
        not who a signer really is. For contracts that need identity-verified, legally binding signatures,
        use a compliance-grade e-signature service instead. See the <Link to="/terms">Terms</Link> for the
        full picture.
      </p>

      <h3>Who's behind it</h3>
      <p>
        Docracy is built and operated by RELACON GmbH, based in Vienna, Austria. See the{" "}
        <Link to="/imprint">Imprint</Link> for the legal details.
      </p>

      <h3>Get in touch</h3>
      <p style={{ marginBottom: 0 }}>
        Questions, feedback, or something broken? Reach out at{" "}
        <a href="mailto:founder@docracy.io">founder@docracy.io</a>, or use the feedback form on the{" "}
        <Link to="/">homepage</Link>.
      </p>
    </div>
  );
}
