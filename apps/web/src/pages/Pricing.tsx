import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMe, startCheckout, type Account } from "../lib/api";
import { PLAN_ROWS, PlanCell } from "../lib/planRows";
import { usePageMeta } from "../lib/usePageMeta";

const TIERS: Array<{
  name: string;
  tagline: string;
  price: string;
  priceNote: string;
  features: string[];
  cta: { label: string; to: string; external?: boolean };
  highlight?: boolean;
}> = [
  {
    name: "Free",
    tagline: "For quick, one-off agreements",
    price: "$0",
    priceNote: "no account, no card",
    features: ["Up to 2 signers per document", "Sequential or all-at-once signing", "Audit trail + completion certificate"],
    cta: { label: "Start free", to: "/prepare" },
  },
  {
    name: "Paid",
    tagline: "For teams and growing businesses",
    price: "$10",
    priceNote: "/mo, flat — not per seat",
    features: [
      "Unlimited signers",
      "Unlimited team members",
      "Dashboard with document history",
      "Customer support",
      "Reusable templates",
      "Bulk send from a template",
      "Custom document expiry (up to 90 days)",
      "Embedded signing (iframe)",
      "Saved contacts + signer reassignment",
      "Webhooks for your own systems",
      "MCP connector (Claude, ChatGPT, Grok, Perplexity)",
      "AI auto-detect signature & date fields",
      "AI plain-English contract explainer",
      "AI risk & clause highlighter",
      "AI contract generator",
      "White-label branding",
      "PIN-protected signing links",
      "Dropbox, OneDrive, and Box connectors",
    ],
    // Placeholder — Paid CTA is rendered dynamically from session state below.
    cta: { label: "Sign in to upgrade", to: "/login" },
    highlight: true,
  },
  {
    name: "Enterprise",
    tagline: "For higher-volume, custom needs",
    price: "Custom",
    priceNote: "sales@docracy.io",
    features: [
      "Everything in Paid",
      "Invoice billing & annual contracts",
      "Premium customer support (SLA-backed)",
      "SSO or multi-workspace setup, scoped to your needs",
      "Volume discounts & custom onboarding",
    ],
    cta: { label: "Contact sales", to: "mailto:sales@docracy.io", external: true },
  },
];

export default function Pricing() {
  usePageMeta(
    "Pricing — Docracy",
    "Free for signing chains of up to 2 signers, no account required. Paid is $10/month and adds AI tools, an MCP connector, bulk send, embedded signing, unlimited signers, templates, webhooks, and team accounts."
  );

  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then(({ account: a }) => setAccount(a))
      .catch(() => setAccount(null));
  }, []);

  const onUpgrade = async () => {
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Something went wrong");
      setUpgrading(false);
    }
  };

  return (
    <div className="container">
      <h1 style={{ fontSize: 30 }}>Pricing</h1>
      <p style={{ maxWidth: 640, marginBottom: 32 }}>
        Free for signing chains of up to 2 signers, no account required. A paid account is a flat{" "}
        <strong>$10/month per workspace</strong> — not per seat — and adds unlimited signers, a dashboard,
        reusable templates, bulk send, custom expiry, embedded signing, contacts, Dropbox/OneDrive/Box
        auto-upload, webhooks, team accounts, white-label branding, PIN-protected links, an MCP
        connector for AI assistants, and a full set of AI tools. <strong>Enterprise</strong> adds
        invoice billing, premium support, SSO/multi-workspace, and volume discounts.
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 20, marginBottom: 40 }}>
        {TIERS.map((tier) => (
          <div
            key={tier.name}
            className="card"
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 14,
              ...(tier.highlight ? { borderColor: "var(--primary)", borderWidth: 2, boxShadow: "var(--shadow-md)" } : {}),
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", color: tier.highlight ? "var(--primary)" : "var(--mute)" }}>
                {tier.name}
              </span>
              {tier.highlight && (
                <span style={{ fontSize: 11, fontWeight: 700, color: "var(--on-primary)", background: "var(--primary)", borderRadius: 999, padding: "2px 8px" }}>
                  Best value
                </span>
              )}
            </div>
            <p style={{ margin: 0, fontSize: 13.5, color: "var(--mute)" }}>{tier.tagline}</p>
            <div>
              <span style={{ fontSize: 34, fontWeight: 800, color: "var(--ink)" }}>{tier.price}</span>
              <div style={{ fontSize: 12.5, color: "var(--mute)" }}>{tier.priceNote}</div>
            </div>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 8, flex: 1 }}>
              {tier.features.map((f) => (
                <li key={f} style={{ fontSize: 13.5, color: "var(--body-strong)", paddingLeft: 20, position: "relative" }}>
                  <span style={{ position: "absolute", left: 0, color: "var(--success)", fontWeight: 700 }}>✓</span>
                  {f}
                </li>
              ))}
            </ul>
            {tier.name === "Paid" ? (
              <PaidCta account={account} upgrading={upgrading} upgradeError={upgradeError} onUpgrade={onUpgrade} />
            ) : tier.cta.external ? (
              <a href={tier.cta.to} className={tier.highlight ? "btn-primary" : "btn-secondary"} style={{ textAlign: "center", textDecoration: "none" }}>
                {tier.cta.label}
              </a>
            ) : (
              <Link to={tier.cta.to} className={tier.highlight ? "btn-primary" : "btn-secondary"} style={{ textAlign: "center", textDecoration: "none" }}>
                {tier.cta.label}
              </Link>
            )}
          </div>
        ))}
      </div>

      <h2 style={{ fontSize: 18, marginBottom: 12 }}>Full feature comparison</h2>
      {/* No overflow:hidden here — any ancestor with a non-visible overflow breaks the sticky
          thead below (see theme.css's .plan-table-scroll comment); the table's own corner cells
          are individually rounded instead to match the card's look. */}
      <div className="card" style={{ padding: 0 }}>
        <div className="plan-table-scroll">
          <table className="plan-table">
            <thead>
              <tr>
                <th></th>
                <th>Free</th>
                <th className="plan-col-paid">
                  Paid
                  <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>$10/month</div>
                </th>
                <th>
                  Enterprise
                  <div style={{ fontSize: 12, fontWeight: 400, marginTop: 2 }}>
                    Custom —{" "}
                    <a href="mailto:sales@docracy.io" style={{ color: "var(--primary)" }}>
                      sales@docracy.io
                    </a>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((row) => (
                <tr key={row.label}>
                  <td>{row.label}</td>
                  <td>
                    <PlanCell value={row.free} />
                  </td>
                  <td className="plan-col-paid">
                    <PlanCell value={row.paid} />
                  </td>
                  <td>
                    <PlanCell value={row.enterprise ?? row.paid} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 32 }}>
        Docracy doesn't verify identity — the audit trail proves what was signed and when, not who actually
        signed it. For contracts that need identity-verified signatures, use a compliance-grade e-signature
        service instead.
      </p>
    </div>
  );
}

function PaidCta({
  account,
  upgrading,
  upgradeError,
  onUpgrade,
}: {
  account: Account | null | undefined;
  upgrading: boolean;
  upgradeError: string | null;
  onUpgrade: () => void;
}) {
  if (account === undefined) {
    return (
      <button className="btn-primary" disabled style={{ textAlign: "center" }}>
        …
      </button>
    );
  }
  if (account?.isPaid) {
    return (
      <Link to="/dashboard" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
        Go to dashboard
      </Link>
    );
  }
  if (account) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
          {upgrading ? "Redirecting…" : "Upgrade — $10/month"}
        </button>
        {upgradeError && <p style={{ margin: 0, fontSize: 12.5, color: "var(--danger)" }}>{upgradeError}</p>}
      </div>
    );
  }
  return (
    <Link to="/login" className="btn-primary" style={{ textAlign: "center", textDecoration: "none" }}>
      Sign in to upgrade
    </Link>
  );
}
