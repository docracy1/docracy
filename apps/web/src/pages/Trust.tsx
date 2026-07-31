import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

/** Phase 0 trust center — honest SES posture, infra inheritance, subprocessors, questionnaire answers. */
export default function Trust() {
  usePageMeta(
    "Trust & security — Docracy",
    "How Docracy protects documents: encryption, retention, audit trails, ESIGN/eIDAS SES alignment, subprocessors, and Cloudflare infrastructure certifications."
  );

  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>Trust &amp; security</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        Last updated 2026-07-29. This page describes how Docracy is built and operated today — not a
        substitute for a SOC 2 report or legal advice. For privacy details see{" "}
        <Link to="/privacy">Privacy</Link>; for processing terms see the <Link to="/dpa">DPA</Link>.
      </p>

      <h2 style={{ fontSize: 19, marginTop: 28 }}>What Docracy is (and isn't)</h2>
      <p>
        Docracy provides <strong>simple electronic signatures (SES)</strong> with a timestamped audit trail
        and a certificate of completion. That model aligns with the practical requirements of laws like the
        US ESIGN Act, UETA, and eIDAS for many low-stakes business documents.
      </p>
      <p>
        Docracy does <strong>not</strong> verify signer identity. Anyone with a signing link can sign as the
        name on it. The audit trail proves <em>what</em> was signed and <em>when</em>, not <em>who</em>{" "}
        physically signed. We do not offer advanced or qualified electronic signatures (AES/QES), identity
        verification, or Qualified Trust Service Provider (QTSP) services. For contracts that need
        identity-verified signatures, use a compliance-grade provider.
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
