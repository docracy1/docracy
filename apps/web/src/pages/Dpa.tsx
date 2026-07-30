import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

/**
 * Phase 0 DPA draft for RELACON GmbH as processor when customers use Docracy with an account.
 * Honest disclaimer matches Privacy.tsx — Enterprise can request a countersigned PDF via sales.
 */
export default function Dpa() {
  usePageMeta(
    "Data Processing Agreement — Docracy",
    "GDPR Art. 28 data processing terms between RELACON GmbH (Docracy) and customers who use paid or account features."
  );

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>Data Processing Agreement</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        Version 2026-07-29. This is our standard Art. 28 GDPR processing addendum for Docracy account /
        paid use. It has not been individually negotiated. For a countersigned PDF, email{" "}
        <a href="mailto:sales@docracy.io">sales@docracy.io</a>. See also <Link to="/trust">Trust</Link> and{" "}
        <Link to="/privacy">Privacy</Link>.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>1. Parties</h2>
      <p>
        <strong>Processor:</strong> RELACON GmbH, Elisabethstraße 15/5b, 1010 Vienna, Austria ("Docracy",
        "we", "us").
      </p>
      <p>
        <strong>Controller:</strong> the customer entity that creates a Docracy account or paid workspace and
        determines the purposes of processing personal data uploaded to or collected through that workspace
        ("Customer", "you").
      </p>
      <p>
        Anonymous, no-account signing chains where Docracy alone decides means of processing are described in{" "}
        <Link to="/privacy">Privacy</Link>; this DPA applies when you use account, team, template, connector,
        or paid features as Controller.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>2. Subject matter &amp; duration</h2>
      <p>
        We process personal data on your behalf to provide the Docracy e-signature and related workspace
        services for the term of your account, and until data is deleted per retention rules or your deletion
        request.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>3. Nature &amp; purpose of processing</h2>
      <p>Hosting PDFs and form field data; sending signing invitations and reminders; recording audit-trail
        events; storing workspace metadata (contacts, templates, team members); optional cloud upload when you
        connect a connector; billing via Stripe for paid plans.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>4. Types of personal data &amp; data subjects</h2>
      <ul>
        <li>
          <strong>Data:</strong> names, email addresses, optional phone/SMS fields, IP addresses, user-agents,
          signature images / typed names, document contents you upload, workspace branding assets.
        </li>
        <li>
          <strong>Subjects:</strong> your employees/contractors, signers and CC recipients you invite, and
          account admins.
        </li>
      </ul>
      <p>Do not upload special-category data or PHI unless we have expressly agreed in writing (we currently do not offer HIPAA).</p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>5. Processor obligations</h2>
      <ul>
        <li>Process data only on documented instructions from you (including configuration in the product).</li>
        <li>Ensure persons authorized to process data are under confidentiality obligations.</li>
        <li>
          Implement appropriate technical and organizational measures as described on{" "}
          <Link to="/trust">Trust &amp; security</Link>.
        </li>
        <li>Assist with data-subject requests, DPIAs, and breach notification where reasonably possible.</li>
        <li>Delete or return personal data after end of services, subject to legal retention and product TTL.</li>
        <li>Make available information necessary to demonstrate compliance with Art. 28.</li>
      </ul>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>6. Subprocessors</h2>
      <p>
        You authorize us to engage the subprocessors listed on <Link to="/trust">Trust &amp; security</Link>.
        We will post material changes to that list and give reasonable notice for objection where feasible. Cloud
        connectors you enable are engaged at your instruction.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>7. International transfers</h2>
      <p>
        Where personal data is transferred outside the EEA/UK/Switzerland, we rely on appropriate safeguards
        (e.g. EU Standard Contractual Clauses with subprocessors, or adequacy decisions) as offered by those
        providers. Details of hosting are summarized on the Trust page.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>8. Security incidents</h2>
      <p>
        We will notify you without undue delay after becoming aware of a personal-data breach affecting your
        workspace data, and provide information reasonably available to help you meet your own notification
        duties.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>9. Audits</h2>
      <p>
        You may request information and evidence of our security measures (including this Trust page and, when
        available, third-party reports). On-site audits are by mutual agreement, limited to once per year unless
        a material incident warrants more, and at your expense unless we are in material breach.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>10. Liability &amp; precedence</h2>
      <p>
        Liability under this DPA follows the limitations in our <Link to="/terms">Terms</Link>, except where
        mandatory data-protection law says otherwise. If this DPA conflicts with the Terms on data-protection
        matters, this DPA controls.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>11. Contact</h2>
      <p style={{ marginBottom: 0 }}>
        Privacy / DPA: <a href="mailto:founder@docracy.io">founder@docracy.io</a> · Countersignature requests:{" "}
        <a href="mailto:sales@docracy.io">sales@docracy.io</a>
      </p>
    </div>
  );
}
