export default function Terms() {
  return (
    <div className="container">
      <h1>Terms</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        This describes how Docracy actually works today. It hasn't been reviewed by a lawyer — treat it as
        a plain description of the service, not a binding legal contract.
      </p>

      <h3>What Docracy is</h3>
      <p>
        Docracy is a free tool for sequential e-signatures: upload a PDF, add signers in order, and each
        one gets their turn automatically. The free tier supports up to 2 signers per document.
      </p>

      <h3>No identity verification</h3>
      <p>
        Docracy does not verify who's signing — anyone holding a document's link can sign as the name on
        it. The audit trail records what was signed and when, not who a signer actually is. Don't use
        Docracy for anything that requires identity-verified, legally binding signatures — use a
        compliance-grade e-signature service for that instead.
      </p>

      <h3>No guarantees</h3>
      <p>
        The service is provided as-is, with no uptime guarantee and no warranty. Documents are
        automatically deleted 9 days after creation — Docracy is not a place to store documents long-term.
      </p>

      <h3>Acceptable use</h3>
      <p>
        Don't use Docracy to send abusive, fraudulent, or unlawful content, or to send unsolicited
        documents to people who haven't agreed to receive them. We may remove documents that violate this
        without notice.
      </p>
    </div>
  );
}
