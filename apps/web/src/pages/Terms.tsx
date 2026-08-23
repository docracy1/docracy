import { Link } from "react-router-dom";
import { useT } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";

export default function Terms() {
  const t = useT();
  usePageMeta(
    "Terms of Service — Docracy E-Signatures",
    "The terms of service governing use of Docracy's free and paid e-signature features.",
    { canonicalPath: "/terms" }
  );
  return (
    <div className="container">
      <h1>{t("terms.title")}</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        This describes how Docracy actually works today. It hasn't been reviewed by a lawyer — treat it as
        a plain description of the service, not a binding legal contract.
      </p>

      <h3>{t("terms.what")}</h3>
      <p>
        Docracy is a free tool for sequential e-signatures: upload a PDF, add signers in order, and each
        one gets their turn automatically. The free tier supports up to 2 signers per document.
      </p>

      <h3>{t("terms.noVerify")}</h3>
      <p>
        By default, Docracy does not verify who's signing — anyone holding a document's link can sign as
        the name on it. The audit trail records what was signed and when, not who a signer actually is.
        Paid and Enterprise accounts can add a stronger, WhatsApp-verified signature track designed to meet
        the EU eIDAS Advanced Electronic Signature (AES) bar (see <Link to="/trust">Trust &amp; security</Link>)
        — it's still not a Qualified Electronic Signature (QES). For anything that specifically requires a
        QES or a fully identity-verified signature, use a compliance-grade e-signature service instead.
      </p>

      <h3>{t("terms.noGuarantees")}</h3>
      <p>
        The service is provided as-is, with no uptime guarantee and no warranty. Documents are
        automatically deleted 9 days after creation — Docracy is not a place to store documents long-term.
      </p>

      <h3>{t("terms.acceptableUse")}</h3>
      <p>
        Don't use Docracy to send abusive, fraudulent, or unlawful content, or to send unsolicited
        documents to people who haven't agreed to receive them. We may remove documents that violate this
        without notice.
      </p>
    </div>
  );
}
