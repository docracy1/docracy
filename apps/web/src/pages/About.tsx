import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";

export default function About() {
  const t = useT();
  usePageMeta(
    "About Docracy — Free, No-Signup E-Signatures",
    "Why Docracy exists: free, no-signup e-signatures for quick, low-stakes agreements — built by RELACON GmbH."
  );

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>{t("about.title")}</h1>

      <h3>{t("about.why")}</h3>
      <p>
        Most e-signature tools are built for enterprise contracts — identity verification, compliance
        certifications, accounts for everyone involved. That's the right tool for a lot of contracts, and
        the wrong one for a freelance gig, a roommate agreement, or an NDA before a first call. Docracy is
        built for that second case: upload a PDF, add signers in order, and the document disappears once
        everyone's signed. No account needed to send or sign a chain of up to two people.
      </p>

      <h3>{t("about.whatNot")}</h3>
      <p>
        Docracy doesn't verify who's actually signing — the audit trail proves what was signed and when,
        not who a signer really is. For contracts that need identity-verified, legally binding signatures,
        use a compliance-grade e-signature service instead. See <Link to="/trust">Trust &amp; security</Link>{" "}
        and the <Link to="/terms">Terms</Link> for the full picture.
      </p>

      <h3>{t("about.who")}</h3>
      <p>
        Docracy is built and operated by RELACON GmbH, based in Vienna, Austria. See the{" "}
        <Link to="/imprint">Imprint</Link> for the legal details.
      </p>

      <h3>{t("about.contact")}</h3>
      <p style={{ marginBottom: 0 }}>
        Questions, feedback, or something broken? Reach out at{" "}
        <a href="mailto:founder@docracy.io">founder@docracy.io</a>, or use the feedback form on the{" "}
        <Link to="/">homepage</Link>.
      </p>
    </div>
  );
}
