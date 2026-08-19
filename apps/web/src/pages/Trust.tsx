import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

/** Phase 0 trust center — honest SES posture, infra inheritance, subprocessors, questionnaire answers. */
export default function Trust() {
  usePageMeta(
    "Trust & Security — Docracy E-Signature Platform",
    "How Docracy protects documents: encryption, retention, audit trails, ESIGN Act and UETA alignment for SES e-signatures, eIDAS SES and WhatsApp-verified AES for paid accounts, subprocessors, and Cloudflare infrastructure certifications."
  );

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>Trust &amp; security</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        Last updated 2026-08-04. This page describes how Docracy is built and operated today — not a
        substitute for a SOC 2 report or legal advice. For a marketing overview of ESIGN &amp; UETA see{" "}
        <Link to="/esign-ueta">ESIGN &amp; UETA</Link>. For privacy details see{" "}
        <Link to="/privacy">Privacy</Link>; for processing terms see the <Link to="/dpa">DPA</Link>.
      </p>

      <div style={{ marginTop: 32 }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 0.3, textTransform: "uppercase", color: "var(--primary)", marginBottom: 4 }}>
          🔒 Trust &amp; security, at a glance
        </p>
        <p style={{ fontSize: 20, fontWeight: 600, margin: "0 0 20px", maxWidth: 560 }}>
          Secure documents. Signatures aligned with US and EU e-signature law. Full visibility into every
          step.
        </p>
        <div className="core-features-grid" style={{ gap: 20, marginTop: 0 }}>
          <div className="core-feature-card">
            <h3 style={{ marginBottom: 8 }}>End-to-end security</h3>
            <p style={{ fontSize: 13.5 }}>
              TLS in transit; Cloudflare platform encryption at rest for documents and application data;
              HMAC-signed signing links that can't be guessed; production secrets never ship in the client
              bundle.
            </p>
          </div>
          <div className="core-feature-card">
            <h3 style={{ marginBottom: 8 }}>Legally-aligned signatures</h3>
            <p style={{ fontSize: 13.5 }}>
              SES workflows designed to support the US ESIGN Act &amp; UETA and EU eIDAS simple electronic
              signatures — with an optional WhatsApp-verified Advanced Electronic Signature (AES) track for
              paid accounts.
            </p>
          </div>
          <div className="core-feature-card">
            <h3 style={{ marginBottom: 8 }}>Full transparency &amp; control</h3>
            <p style={{ fontSize: 13.5 }}>
              Every view, consent, signature, and decline is timestamped with IP, user-agent, and a content
              hash. Each completed chain gets a signed PDF plus a certificate of completion.
            </p>
          </div>
          <div className="core-feature-card">
            <h3 style={{ marginBottom: 8 }}>Attorney-reviewed templates</h3>
            <p style={{ fontSize: 13.5 }}>
              Every free template in our library has been reviewed by a licensed attorney for legal clarity
              and correctness — <a href="#template-legal-review">details below</a>.
            </p>
          </div>
        </div>
      </div>

      <h2 id="what-docracy-is" style={{ fontSize: 19, marginTop: 40 }}>What Docracy is (and isn't)</h2>
      <p>
        Docracy provides <strong>simple electronic signatures (SES)</strong> with a timestamped audit trail
        and a certificate of completion. That model is designed to support everyday business documents under
        US and EU e-signature frameworks — see <a href="#esign-ueta">ESIGN &amp; UETA</a> below.
      </p>
      <p>
        By default, Docracy does <strong>not</strong> verify signer identity. Anyone with a signing link can
        sign as the name on it. The audit trail proves <em>what</em> was signed and <em>when</em>, not{" "}
        <em>who</em> physically signed.
      </p>
      <p>
        Signed-up accounts (free or paid) can additionally deliver a signer's link over{" "}
        <strong>WhatsApp</strong> instead of (or alongside) email. That link only reaches a phone number tied
        to that signer's own WhatsApp account, Meta's delivery/read receipts are recorded in the audit trail
        next to the existing tamper-evident PDF hash, and a PIN — set by the preparer and required, not
        optional, on every WhatsApp-delivered link — must be entered before signing, so possession of the
        phone alone isn't enough. Together, that combination is designed to meet the EU eIDAS criteria for an{" "}
        <strong>Advanced Electronic Signature (AES)</strong>: a signature uniquely linked to and capable of
        identifying the signatory, created under their sole control, and detectably tied to the signed data.
        It is <strong>not</strong> a Qualified Electronic Signature (QES) — we are not a Qualified Trust
        Service Provider (QTSP), don't issue qualified certificates, and haven't sought third-party AES
        certification. For contracts that require a QES or a fully identity-verified signature, use a
        compliance-grade provider.
      </p>

      <h2 id="esign-ueta" style={{ fontSize: 19, marginTop: 28 }}>
        ESIGN Act &amp; UETA (United States)
      </h2>
      <p>
        Docracy electronic signatures are <strong>designed to support</strong> the requirements of the U.S.{" "}
        <em>Electronic Signatures in Global and National Commerce Act</em> (ESIGN) and the{" "}
        <em>Uniform Electronic Transactions Act</em> (UETA) for SES-style electronic signatures. We use
        careful “aligned with / designed to support” language — not a certification or legal guarantee that
        every document type is enforceable in every jurisdiction.
      </p>
      <p>
        Under ESIGN and UETA, electronic signatures are generally given legal effect when the parties
        consent to do business electronically, intend to sign, and an associated record can be retained and
        accurately reproduced. Docracy’s signing flow is built around those practical requirements:
      </p>
      <ul>
        <li>
          <strong>Consent</strong> — signers must check an acknowledgment before completing the signature.
        </li>
        <li>
          <strong>Intent</strong> — clicking “Complete signing” (after applying signature fields) is the
          signing act recorded in the audit trail.
        </li>
        <li>
          <strong>Record integrity</strong> — per-event timestamps, IP, user-agent, and content hashes;
          parties receive a signed PDF plus a certificate of completion summarizing the trail.
        </li>
      </ul>
      <p>
        This is <strong>SES-level</strong> by default. Paid and Enterprise accounts can additionally turn on
        WhatsApp-verified signing — the AES-track option described in{" "}
        <a href="#what-docracy-is">What Docracy is (and isn't)</a> above — but Docracy still does not provide
        QES, identity verification, or QTSP services under any plan. Suitability for a given agreement
        depends on document type, industry rules, and jurisdiction — this page is not legal advice.
      </p>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        EU note: the free-tier SES model is consistent with eIDAS simple electronic signatures for many
        low-stakes business documents. WhatsApp-verified signing (paid/Enterprise) is designed to meet the
        higher eIDAS AES bar instead — see above — but we do not claim QES under eIDAS on any plan.
      </p>

      <h2 id="template-legal-review" style={{ fontSize: 19, marginTop: 28 }}>Template legal review</h2>
      <a
        href="https://www.boeck.law/"
        target="_blank"
        rel="noopener noreferrer"
        style={{ display: "inline-block", margin: "4px 0 14px" }}
      >
        <img src="/testimonials/boeck-law.png" alt="BOECK Attorneys at Law" style={{ height: 40, width: "auto", display: "block" }} />
      </a>
      <p>
        Every free template in our{" "}
        <Link to="/free-templates">template library</Link> has been reviewed by BOECK Law
        (Liechtenstein Bar), for legal clarity and correctness. That review
        covers the template's own wording — it is not tailored legal advice for your specific
        agreement, industry, or jurisdiction; for that, consult your own counsel.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Encryption &amp; transport</h2>
      <ul>
        <li>All traffic uses HTTPS / TLS in transit.</li>
        <li>
          Document bytes live in Cloudflare R2; application state in Cloudflare KV and (for paid index
          features) D1. Encryption at rest is provided by Cloudflare's platform defaults for those services.
        </li>
        <li>Signing links are HMAC-signed tokens; they are not guessable account passwords.</li>
      </ul>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Retention &amp; deletion</h2>
      <p>
        Anonymous signing chains use a short retention window (default <strong>9 days</strong> after
        creation; configurable up to a product maximum on paid plans). Documents and related signing state
        are deleted when the TTL expires — or sooner after the chain completes and final copies are emailed.
        Paid workspaces keep dashboard history and templates according to the account's plan until you delete
        them or close the account.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Audit trail &amp; completion certificate</h2>
      <p>
        For each significant event (view, consent, sign, decline), we record timestamp, IP address, user-agent,
        and a cryptographic hash of the document content at that point. When a chain completes, parties can
        download a signed PDF plus a certificate of completion that summarizes that trail.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Infrastructure certifications (Cloudflare)</h2>
      <p>
        Docracy runs on <strong>Cloudflare</strong> (Workers, Pages, KV, R2, D1, and related services). Physical
        data centers, network edge, and many platform controls are covered by Cloudflare's own compliance
        program, which includes reports such as <strong>SOC 2 Type II</strong> and <strong>ISO 27001</strong>.
        Customers evaluating Docracy should treat that as shared-responsibility infrastructure evidence —
        available from Cloudflare under their usual NDA / trust portal process — not as a Docracy-issued SOC
        2 or ISO certificate for the application layer.
      </p>
      <p>
        Docracy (RELACON GmbH) does not hold its own SOC 2 or ISO 27001 attestation. We publish this page and
        answer questionnaires directly.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Subprocessors</h2>
      <p>We use the following third parties to operate the service:</p>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            <tr>
              <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--hairline)" }}>
                Provider
              </th>
              <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--hairline)" }}>
                Purpose
              </th>
              <th style={{ textAlign: "left", padding: "8px 10px", borderBottom: "1px solid var(--hairline)" }}>
                Region (typical)
              </th>
            </tr>
          </thead>
          <tbody>
            {[
              ["Cloudflare, Inc.", "Hosting, CDN, compute, storage, bot protection, analytics", "Global edge; config may pin EU"],
              ["Resend, Inc.", "Transactional email (invite, reminder, completion)", "US / EU depending on Resend routing"],
              ["Stripe, Inc.", "Paid plan billing (card payments)", "US / global Stripe regions"],
              ["Google LLC", "Optional Google Drive upload (customer-initiated)", "Global"],
              ["Dropbox, Inc.", "Optional cloud connector (customer-initiated)", "Global"],
              ["Microsoft Corporation", "Optional OneDrive connector (customer-initiated)", "Global"],
              ["Box, Inc.", "Optional Box connector (customer-initiated)", "Global"],
            ].map(([name, purpose, region]) => (
              <tr key={name}>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--hairline)", verticalAlign: "top" }}>
                  {name}
                </td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--hairline)", verticalAlign: "top" }}>
                  {purpose}
                </td>
                <td style={{ padding: "8px 10px", borderBottom: "1px solid var(--hairline)", verticalAlign: "top" }}>
                  {region}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        Cloud connectors only run when a paid workspace connects them. We do not sell customer data or use
        advertising trackers.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Access control</h2>
      <ul>
        <li>Anonymous sends: access is link-based (HMAC tokens), no password accounts required to sign.</li>
        <li>Paid workspaces: magic-link sign-in; team roles on Solo+ / paid plans.</li>
        <li>Optional PIN protection on signing links (paid).</li>
        <li>Production secrets live in Cloudflare Workers secrets — not in the client bundle.</li>
      </ul>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Vulnerability testing</h2>
      <p>
        We do not publish a recurring third-party penetration-test letter. We welcome responsible
        disclosure to <a href="mailto:founder@docracy.io">founder@docracy.io</a>.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Security questionnaire (short answers)</h2>
      <dl className="trust-qa">
        <dt>Do you have SOC 2 / ISO 27001?</dt>
        <dd>
          Not yet for Docracy-as-a-product. Infrastructure is on Cloudflare, which maintains SOC 2 Type II and
          ISO 27001. Application-layer attestation is roadmap.
        </dd>
        <dt>Where is data stored?</dt>
        <dd>
          On Cloudflare's network (Workers/KV/R2/D1). Exact PoP routing is Cloudflare's; contact us if you need
          a written EU-processing preference for a paid workspace.
        </dd>
        <dt>Is data encrypted?</dt>
        <dd>Yes in transit (TLS). At rest via Cloudflare platform encryption for R2/KV/D1.</dd>
        <dt>How long do you keep documents?</dt>
        <dd>
          Anonymous chains: short TTL (default 9 days). Paid history/templates: until deleted or account closed.
        </dd>
        <dt>Do you support MFA?</dt>
        <dd>
          Sign-in is passwordless (email magic link). Signing links can use an optional PIN on paid
          plans. We do not offer TOTP MFA on workspace accounts yet.
        </dd>
        <dt>Do you process PHI / HIPAA?</dt>
        <dd>No. Docracy is not HIPAA-ready and we do not sign BAAs.</dd>
        <dt>Are signatures ESIGN / UETA compliant?</dt>
        <dd>
          Docracy SES workflows are designed to support the U.S. ESIGN Act and UETA for many everyday
          business documents (consent, intent to sign, retainable audit record). We do not verify identity
          and do not offer AES/QES. See{" "}
          <a href="#esign-ueta">ESIGN Act &amp; UETA</a> above — not a substitute for counsel on high-stakes
          or regulated agreements.
        </dd>
        <dt>Do you offer a DPA?</dt>
        <dd>
          Yes — see <Link to="/dpa">Data Processing Agreement</Link> for paid / account use. Email{" "}
          <a href="mailto:sales@docracy.io">sales@docracy.io</a> for a countersigned copy if your legal team
          requires one.
        </dd>
        <dt>Breach notification?</dt>
        <dd>
          We will notify affected account holders without undue delay if we become aware of a personal-data
          breach affecting their workspace, consistent with GDPR Art. 33/34 obligations where they apply.
        </dd>
      </dl>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>Contact</h2>
      <p style={{ marginBottom: 0 }}>
        Security or compliance questions: <a href="mailto:founder@docracy.io">founder@docracy.io</a> · Sales /{" "}
        Enterprise reviews: <a href="mailto:sales@docracy.io">sales@docracy.io</a> · Legal entity:{" "}
        <Link to="/imprint">Imprint</Link>
      </p>
    </div>
  );
}
