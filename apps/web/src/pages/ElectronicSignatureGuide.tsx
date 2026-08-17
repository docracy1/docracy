import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";

const FAQS = [
  {
    q: "Are electronic signatures legally binding?",
    a: "Generally, yes. In the United States, the ESIGN Act and UETA give electronic signatures the same legal standing as ink signatures for most business documents, provided the parties consented to sign electronically, intended to sign, and the record can be retained and reproduced. In the EU, eIDAS gives legal effect to electronic signatures at three tiers — SES, AES, and QES (see below) — with the appropriate tier depending on what the document requires. Some document types (wills, certain real estate transfers, court filings) are excluded or have extra requirements in many jurisdictions — check with counsel for anything high-stakes.",
  },
  {
    q: "What's the difference between SES, AES, and QES?",
    a: "These are the three tiers of electronic signature defined by the EU's eIDAS regulation (and used informally elsewhere too). A Simple Electronic Signature (SES) is any electronic indication of intent to sign — typing a name, clicking to agree, drawing a signature — with no built-in identity verification. An Advanced Electronic Signature (AES) must be uniquely linked to the signer, capable of identifying them, created under their sole control, and detectably tied to the signed data. A Qualified Electronic Signature (QES) is an AES created with a qualified signature-creation device and backed by a qualified certificate issued by a licensed Qualified Trust Service Provider (QTSP) — it's the highest tier and carries the strongest legal presumption.",
  },
  {
    q: "Does Docracy verify who is actually signing?",
    a: "Not by default. Anyone holding a Docracy signing link can sign as the name on it — the platform records what was signed and when, not a verified identity check on who physically clicked. Paid and Enterprise accounts can add a required PIN to a signing link, and can deliver that link over WhatsApp so it only reaches a phone number tied to that signer's own WhatsApp account (a feature rolling out as our WhatsApp Business integration goes live) — together those are designed to meet the EU eIDAS bar for an Advanced Electronic Signature (AES), but Docracy is not a Qualified Trust Service Provider and does not issue QES. Full detail on our exact posture is on the Trust & security page.",
  },
  {
    q: "Is Docracy GDPR compliant?",
    a: "We don't make a blanket \"GDPR-compliant\" claim — no vendor honestly can, since compliance depends on how a customer configures and uses a tool, not just the tool itself. What we do offer: a standard Art. 28 GDPR Data Processing Agreement for paid and account use, a published list of named subprocessors with their typical processing regions, and a short default retention window (9 days) for anonymous signing chains so documents don't linger longer than needed. See the DPA and the Trust & security page for the specifics.",
  },
  {
    q: "Does Docracy have SOC 2 or ISO 27001?",
    a: "Docracy (built and operated by RELACON GmbH) does not hold its own SOC 2 or ISO 27001 attestation today. The infrastructure Docracy runs on — Cloudflare Workers, Pages, KV, R2, and D1 — is covered by Cloudflare's own compliance program, which includes SOC 2 Type II and ISO 27001 reports. That's shared-responsibility infrastructure evidence, not a Docracy-issued certificate for the application layer. We publish our full security questionnaire answers on the Trust & security page instead of a report.",
  },
  {
    q: "Can I sign a document without creating an account?",
    a: "Yes — that's the default Docracy flow. Upload a document, add signers and fields, and send; each signer gets a link, signs in their browser, and everyone receives the completed, signed PDF plus a certificate of completion by email. No account, password, or credit card required for the free tier.",
  },
  {
    q: "How long does Docracy keep my documents?",
    a: "Anonymous signing chains (the free, no-signup flow) use a short retention window — 9 days after creation by default — after which the document and its signing state are deleted, or sooner once the chain completes and final copies are emailed out. Paid workspaces keep dashboard history and templates according to their plan until deleted or the account is closed.",
  },
  {
    q: "How much does electronic signing with Docracy cost?",
    a: "Free: $0, no account or card required, up to 2 signers per document. Paid: $10/month flat — not per seat — for unlimited signers, a team dashboard, reusable templates, bulk send, a 90-day signing window, embedded signing, webhooks, an MCP connector, AI drafting/review tools, white-labeling, PIN-protected links, and cloud storage connectors. Enterprise: custom pricing for invoice billing, annual contracts, SLA support, and SSO/multi-workspace setups. Full breakdown on the pricing page.",
  },
];

/** SEO pillar page — long-form guide to e-signature law, EU/US compliance frameworks, security, and pricing.
 *  English-only (US-focused audience); deep dives on each subtopic already live on /esign-ueta, /trust, /dpa. */
export default function ElectronicSignatureGuide() {
  usePageMeta(
    "Electronic Signatures: The Complete Guide — Docracy",
    "A plain-English guide to electronic signatures: US ESIGN Act & UETA, EU eIDAS SES/AES/QES tiers, GDPR data protection, security architecture, SOC 2, and how e-signature pricing actually works.",
    { canonicalPath: "/electronic-signature-guide" }
  );

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:guide:${placement}` });
  };

  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQS.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 760 }}>
          <p className="hero-eyebrow">Complete guide</p>
          <h1 style={{ fontSize: "clamp(28px, 3.4vw, 42px)" }}>
            Electronic Signatures: The Complete Guide
          </h1>
          <p className="hero-sub">
            ESIGN Act &amp; UETA, EU eIDAS (SES / AES / QES), GDPR, security architecture, SOC 2, and
            pricing — explained in plain English, with links to the deep-dive page for each topic.
          </p>
          <div className="hero-actions" style={{ marginTop: 8 }}>
            <Link
              to="/prepare?ref=seo-guide"
              className="btn-primary btn-lg"
              style={{ textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              Sign a document free
            </Link>
            <Link to="/pricing" className="hero-actions-secondary" onClick={() => onCta("hero_pricing")}>
              See pricing
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32 }}>
        <p style={{ fontSize: 13, color: "var(--mute)" }}>
          Last updated 2026-08-12. This page is a plain-English overview, not legal advice — whether a
          given document and signing method is enforceable depends on the document type, industry rules,
          and jurisdiction involved.
        </p>

        <nav aria-label="Table of contents" style={{ border: "1px solid var(--hairline)", borderRadius: 10, padding: "16px 20px", margin: "20px 0 8px" }}>
          <p style={{ fontWeight: 700, margin: "0 0 8px", fontSize: 14 }}>On this page</p>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.8, fontSize: 14, columns: 2 }}>
            <li><a href="#what-is-an-electronic-signature">What is an electronic signature?</a></li>
            <li><a href="#esign-ueta-us">US law: ESIGN Act &amp; UETA</a></li>
            <li><a href="#eidas-eu">EU law: eIDAS (SES, AES, QES)</a></li>
            <li><a href="#gdpr">GDPR &amp; data protection</a></li>
            <li><a href="#security">Security architecture &amp; SOC 2</a></li>
            <li><a href="#choosing-a-tool">Choosing the right tool</a></li>
            <li><a href="#pricing">Docracy pricing</a></li>
            <li><a href="#templates">Attorney-reviewed templates</a></li>
            <li><a href="#faq">FAQ</a></li>
          </ul>
        </nav>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 24 }}>
        <h2 id="what-is-an-electronic-signature" style={{ fontSize: 22 }}>What is an electronic signature?</h2>
        <p>
          An electronic signature is any electronic sound, symbol, or process attached to a record that a
          person uses to sign it — a typed name, a drawn signature, a click on "I agree," or a
          cryptographically-verified action. Electronic signature law generally recognizes three tiers of
          strength, most clearly defined in the EU's eIDAS regulation but used informally worldwide:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>
            <strong>Simple Electronic Signature (SES)</strong> — any electronic indication of intent to
            sign, with no built-in identity verification. Most everyday business documents (NDAs, service
            agreements, offer letters, vendor contracts) are signed at this level.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Advanced Electronic Signature (AES)</strong> — uniquely linked to the signer, capable
            of identifying them, created under their sole control, and detectably tied to the signed data.
          </li>
          <li>
            <strong>Qualified Electronic Signature (QES)</strong> — an AES issued via a qualified
            certificate from a licensed Qualified Trust Service Provider (QTSP), the strongest legal tier
            under eIDAS.
          </li>
        </ul>
        <p>
          Which tier you need depends on the document and jurisdiction — a freelance contract usually
          needs nothing beyond SES; a small number of document types (certain real estate transfers,
          wills, court filings) require more, or aren't eligible for electronic signature at all in some
          jurisdictions. See our dedicated page on{" "}
          <Link to="/are-electronic-signatures-legal">whether electronic signatures are legally valid</Link>{" "}
          for the caveats. Ready to actually make one? See{" "}
          <Link to="/create-a-digital-signature">how to create a digital signature</Link>.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8 }}>
        <h2 id="esign-ueta-us" style={{ fontSize: 22 }}>US law: the ESIGN Act &amp; UETA</h2>
        <p>
          In the United States, two laws give electronic signatures legal effect: the federal{" "}
          <em>Electronic Signatures in Global and National Commerce Act</em> (ESIGN, 2000) and the{" "}
          <em>Uniform Electronic Transactions Act</em> (UETA), adopted by most states. Together they hold
          that an electronic signature or record can't be denied legal effect just because it's
          electronic, as long as:
        </p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>
            <strong>Consent</strong> — the parties agreed to do business electronically.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Intent</strong> — the signer took a deliberate action showing they meant to sign.
          </li>
          <li>
            <strong>Record integrity</strong> — the signed record can be retained and accurately
            reproduced later.
          </li>
        </ul>
        <p>
          Docracy's signing flow is built around exactly those three requirements: signers check a
          consent acknowledgment before signing, the signing action itself is logged as the intent event,
          and every document ships with a timestamped audit trail, a signed PDF, and a certificate of
          completion. For the full walkthrough — including how each requirement maps to a specific step in
          the product — see our dedicated{" "}
          <Link to="/esign-ueta" onClick={() => onCta("esign_ueta_deep_dive")}>
            ESIGN Act &amp; UETA guide
          </Link>
          .
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8 }}>
        <h2 id="eidas-eu" style={{ fontSize: 22 }}>EU law: eIDAS (SES, AES, QES)</h2>
        <p>
          The EU's eIDAS regulation is what defines the SES / AES / QES tiers described above, and gives
          each of them legal effect across EU member states. Docracy's free and paid tiers use the SES
          model by default — timestamped consent, intent, and a tamper-evident audit trail, without
          identity verification — which is consistent with eIDAS simple electronic signatures for most
          everyday business documents.
        </p>
        <p>
          For signers who need a stronger tier, Docracy offers WhatsApp-verified signing for paid and
          Enterprise accounts: a signer's link is delivered only to a phone number tied to their own
          WhatsApp account, with a required PIN before signing. That combination is designed to meet the
          eIDAS criteria for an{" "}
          <strong>Advanced Electronic Signature (AES)</strong>. It is <strong>not</strong> a Qualified
          Electronic Signature — Docracy is not a Qualified Trust Service Provider (QTSP), doesn't issue
          qualified certificates, and hasn't sought third-party AES certification. For agreements that
          specifically require QES, use a compliance-grade QTSP provider instead.
        </p>
        <p style={{ fontSize: 14 }}>
          More detail: <Link to="/whatsapp-signing" onClick={() => onCta("eidas_whatsapp")}>WhatsApp-verified signing</Link>
          {" · "}
          <Link to="/advanced-electronic-signature" onClick={() => onCta("eidas_aes")}>Advanced Electronic Signature (AES)</Link>
          {" · "}
          <Link to="/trust#what-docracy-is" onClick={() => onCta("eidas_trust")}>full trust &amp; security posture</Link>
        </p>
      </div>

      <div className="spotlight-band" style={{ marginTop: 24 }}>
        <div className="container" style={{ maxWidth: 720 }}>
          <h2 id="gdpr" style={{ fontSize: 22, marginTop: 0 }}>GDPR &amp; data protection</h2>
          <p>
            We don't make a blanket "GDPR-compliant" claim — that phrase means little without specifics,
            since compliance depends on how a customer configures and uses a tool as well as the tool
            itself. What Docracy does provide:
          </p>
          <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
            <li style={{ marginBottom: 8 }}>
              A standard <Link to="/dpa">Art. 28 Data Processing Agreement</Link> for paid and account use,
              available as a countersigned PDF on request.
            </li>
            <li style={{ marginBottom: 8 }}>
              A published, named list of subprocessors (Cloudflare, Resend, Stripe, and optional
              customer-initiated connectors like Google Drive, Dropbox, OneDrive, and Box) with their
              typical processing regions — see the full table on the{" "}
              <Link to="/trust">Trust &amp; security page</Link>.
            </li>
            <li>
              A short default retention window — <strong>9 days</strong> — for anonymous signing chains,
              so documents don't linger on our infrastructure longer than needed to complete signing and
              deliver final copies.
            </li>
          </ul>
          <p style={{ marginBottom: 0 }}>
            We will notify affected account holders without undue delay if we become aware of a
            personal-data breach affecting their workspace, consistent with GDPR Art. 33/34 where they
            apply.
          </p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32 }}>
        <h2 id="security" style={{ fontSize: 22 }}>Security architecture &amp; SOC 2</h2>
        <p>
          Every document view, consent, signature, and decline is timestamped with IP address,
          user-agent, and a cryptographic hash of the document content at that moment. Traffic runs over
          TLS; signing links are HMAC-signed tokens rather than guessable account passwords; document
          bytes and application state live on Cloudflare's platform (R2, KV, and D1), encrypted at rest by
          Cloudflare's own platform defaults. When a signing chain completes, every party receives the
          signed PDF plus a certificate of completion summarizing the full audit trail.
        </p>
        <p>
          <strong>On SOC 2 and ISO 27001</strong> specifically — these are independent audits that verify
          an organization's security controls over time. Cloudflare, the infrastructure Docracy runs on,
          maintains SOC 2 Type II and ISO 27001 reports covering the physical data centers, network edge,
          and platform controls we build on. Docracy (RELACON GmbH) does <strong>not</strong> hold its own
          SOC 2 or ISO 27001 attestation for the application layer today — we publish our full security
          questionnaire answers directly instead. Treat the Cloudflare reports as shared-responsibility
          infrastructure evidence, available under Cloudflare's own NDA/trust-portal process, not as a
          Docracy-issued certificate.
        </p>
        <p style={{ fontSize: 14 }}>
          Full breakdown — encryption, access control, retention, subprocessors, and a complete security
          questionnaire — on the <Link to="/trust" onClick={() => onCta("security_trust")}>Trust &amp; security page</Link>.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 860, paddingTop: 32 }}>
        <h2 id="choosing-a-tool" style={{ fontSize: 26, textAlign: "center", margin: "0 0 8px" }}>
          Choosing the right e-signature tool
        </h2>
        <p style={{ textAlign: "center", color: "var(--mute)", margin: "0 0 28px", maxWidth: 560, marginInline: "auto" }}>
          Not every business needs the same thing. A few factors worth weighing before you commit to a
          tool or a plan:
        </p>
        <div className="core-features-grid">
          <div className="core-feature-card">
            <h3>Pricing model</h3>
            <p style={{ fontSize: 13.5 }}>
              Per-seat pricing punishes teams as they grow. A flat monthly rate for unlimited signers and
              team members scales better for most small businesses.
            </p>
          </div>
          <div className="core-feature-card">
            <h3>Compliance tier needed</h3>
            <p style={{ fontSize: 13.5 }}>
              Most contracts only need SES. Don't pay for QES-grade identity verification if your
              documents don't require it — and don't settle for SES if they do.
            </p>
          </div>
          <div className="core-feature-card">
            <h3>Template library</h3>
            <p style={{ fontSize: 13.5 }}>
              A reviewed, ready-to-use template saves more time than any editor feature. Check whether
              templates are actually reviewed for legal clarity, not just pre-formatted.
            </p>
          </div>
          <div className="core-feature-card">
            <h3>No-signup friction</h3>
            <p style={{ fontSize: 13.5 }}>
              If you only send a handful of documents a year, a tool that requires an account just to try
              it adds friction you don't need.
            </p>
          </div>
        </div>
        <p style={{ textAlign: "center", marginTop: 24, fontSize: 14 }}>
          See how Docracy compares to specific providers:{" "}
          <Link to="/docusign-alternative" onClick={() => onCta("compare_docusign")}>DocuSign</Link>
          {" · "}
          <Link to="/eversign-alternative" onClick={() => onCta("compare_eversign")}>eversign</Link>
          {" · "}
          <Link to="/hellosign-alternative" onClick={() => onCta("compare_hellosign")}>HelloSign</Link>
          {" · "}
          <Link to="/pandadoc-alternative" onClick={() => onCta("compare_pandadoc")}>PandaDoc</Link>
          {" · "}
          <Link to="/adobe-sign-alternative" onClick={() => onCta("compare_adobesign")}>Adobe Sign</Link>
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 24 }}>
        <h2 id="pricing" style={{ fontSize: 22 }}>Docracy pricing</h2>
        <ul style={{ paddingLeft: 20, lineHeight: 1.6 }}>
          <li style={{ marginBottom: 8 }}>
            <strong>Free — $0.</strong> No account or card required, up to 2 signers per document.
          </li>
          <li style={{ marginBottom: 8 }}>
            <strong>Paid — $10/month flat</strong>, not per seat. Unlimited signers and team members, a
            dashboard, reusable templates, bulk send, a 90-day signing window, embedded signing, webhooks,
            an MCP connector, AI drafting/review tools, white-labeling, PIN-protected links, and cloud
            storage connectors.
          </li>
          <li>
            <strong>Enterprise — custom pricing.</strong> Everything in Paid plus invoice billing, annual
            contracts, SLA support, and SSO/multi-workspace setups.
          </li>
        </ul>
        <p style={{ fontSize: 14 }}>
          Full feature breakdown on the <Link to="/pricing" onClick={() => onCta("pricing_link")}>pricing page</Link>.
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 8 }}>
        <h2 id="templates" style={{ fontSize: 22 }}>Attorney-reviewed templates</h2>
        <a
          href="https://www.boeck.law/"
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: "inline-block", margin: "4px 0 14px" }}
        >
          <img src="/testimonials/boeck-law.png" alt="BOECK Attorneys at Law" style={{ height: 36, width: "auto", display: "block" }} />
        </a>
        <p>
          Every free template in our{" "}
          <Link to="/free-templates" onClick={() => onCta("templates_library")}>template library</Link>{" "}
          — NDAs, service agreements, contractor agreements, W-9 and I-9 forms, and more — has been
          reviewed by{" "}
          <a href="https://www.linkedin.com/in/dr-denisa-boeck-373424123/" target="_blank" rel="noopener noreferrer">
            Dr. Denisa Boeck
          </a>
          , attorney at BOECK Law (Liechtenstein Bar), for legal clarity and correctness. That review
          covers the template's own wording — it isn't tailored legal advice for your specific agreement,
          industry, or jurisdiction.
        </p>
        <p style={{ fontSize: 14 }}>
          Popular starting points:{" "}
          <Link to="/free-templates/mutual-nda">Mutual NDA</Link>
          {" · "}
          <Link to="/free-templates/independent-contractor-agreement">Independent contractor agreement</Link>
          {" · "}
          <Link to="/free-templates/w-9-form">W-9 form</Link>
          {" · "}
          <Link to="/free-templates/i-9-form">I-9 form</Link>
        </p>
        <p style={{ fontSize: 14 }}>
          By industry:{" "}
          <Link to="/industry/small-business">Small business</Link>
          {" · "}
          <Link to="/industry/freelancers">Freelancers</Link>
          {" · "}
          <Link to="/industry/real-estate">Real estate</Link>
          {" · "}
          <Link to="/industry/hr">HR</Link>
        </p>
      </div>

      <div className="container" style={{ maxWidth: 720, paddingTop: 32, paddingBottom: 16 }}>
        <h2 id="faq" style={{ fontSize: 22, marginTop: 0 }}>Frequently asked questions</h2>
        {FAQS.map((f) => (
          <details key={f.q} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{f.q}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{f.a}</p>
          </details>
        ))}
        <p style={{ marginTop: 28, fontSize: 14 }}>
          Related reading:{" "}
          <Link to="/what-is-an-nda">What is an NDA?</Link>
          {" · "}
          <Link to="/are-electronic-signatures-legal">Are electronic signatures legally valid?</Link>
          {" · "}
          <Link to="/esign-ueta">ESIGN Act &amp; UETA</Link>
          {" · "}
          <Link to="/trust">Trust &amp; security</Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>Ready to send your first document?</p>
        <Link
          to="/prepare?ref=seo-guide"
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          Sign a document free
        </Link>
      </div>
    </div>
  );
}
