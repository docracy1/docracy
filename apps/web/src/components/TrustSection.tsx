import { Link } from "react-router-dom";
import { TRUST_LOGOS } from "../pages/Landing";

/** Compact trust block for high-traffic blog posts and template pages, where a visitor lands
 *  cold (often from search) with no other exposure to Docracy — reused real trust signals
 *  (logos, one real testimonial, honestly-scoped claims) rather than inventing customer counts
 *  or compliance status the /trust page doesn't actually claim. See Trust.tsx: Docracy does not
 *  hold its own SOC 2/ISO 27001 attestation, so this deliberately doesn't say "SOC 2 in progress"
 *  — only that the infrastructure (Cloudflare) does. */
const REASONS: Array<{ title: string; body: string; to?: string }> = [
  { title: "Legally binding", body: "Built to support the U.S. ESIGN Act, UETA, and EU eIDAS." },
  { title: "No account required", body: "Signers open a link and sign — nothing to install or register." },
  { title: "Fast", body: "Upload, add fields, and send in under a minute." },
  { title: "Works on any device", body: "No app to install — sign from a phone, tablet, or desktop browser." },
  { title: "Secure by default", body: "Timestamped audit trail on every document; infrastructure runs on Cloudflare (SOC 2 Type II, ISO 27001)." },
  { title: "Independently verifiable", body: "Anyone with the finished document can confirm it was really signed here.", to: "/verify" },
  { title: "API & integrations", body: "Zapier and an MCP connector for Claude, ChatGPT, and other AI assistants." },
];

export default function TrustSection() {
  return (
    <div className="card" style={{ marginTop: 32, padding: "24px 20px" }}>
      <h2 style={{ fontSize: 18, marginTop: 0, marginBottom: 16 }}>Why teams trust Docracy</h2>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 16 }}>
        {REASONS.map((r) => (
          <div key={r.title}>
            <div style={{ fontWeight: 700, fontSize: 14, marginBottom: 2 }}>✓ {r.title}</div>
            <div style={{ fontSize: 13, color: "var(--mute)" }}>
              {r.body} {r.to && <Link to={r.to}>Verify a document →</Link>}
            </div>
          </div>
        ))}
      </div>

      <blockquote
        style={{
          margin: "20px 0 0",
          padding: "14px 16px",
          borderLeft: "3px solid var(--primary)",
          background: "var(--primary-soft)",
          borderRadius: "0 var(--r-sm) var(--r-sm) 0",
          fontSize: 14,
        }}
      >
        “Docracy is a great product that I have tested and am using. It is easy to use, has good tools, is always
        up to date, and implements new features. Highly recommended.”
        <div style={{ marginTop: 6, fontWeight: 700, fontSize: 13 }}>— DACH Advisory</div>
      </blockquote>

      <div
        style={{
          marginTop: 20,
          display: "flex",
          alignItems: "center",
          gap: 24,
          flexWrap: "wrap",
          opacity: 0.85,
        }}
      >
        {TRUST_LOGOS.slice(0, 6).map((logo) =>
          logo.logo ? (
            <a key={logo.name} href={logo.href} target="_blank" rel="noopener noreferrer" title={logo.name}>
              <img src={logo.logo} alt={logo.name} style={{ height: 28, width: "auto", maxWidth: 110, objectFit: "contain" }} />
            </a>
          ) : null
        )}
      </div>
    </div>
  );
}
