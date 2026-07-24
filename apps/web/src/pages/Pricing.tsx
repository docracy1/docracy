import { Link } from "react-router-dom";
import { PLAN_ROWS, PlanCell } from "../lib/planRows";
import { usePageMeta } from "../lib/usePageMeta";

export default function Pricing() {
  usePageMeta(
    "Pricing — Docracy",
    "Free for signing chains of up to 2 signers, no account required. Paid is $7/month and adds AI tools, an MCP connector, unlimited signers, templates, webhooks, and team accounts."
  );

  return (
    <div className="container">
      <h1 style={{ fontSize: 30 }}>Pricing</h1>
      <p style={{ maxWidth: 640 }}>
        Free for signing chains of up to 2 signers, no account required. A paid account is{" "}
        <strong>$7/month</strong> and adds unlimited signers, a dashboard, reusable templates, webhooks,
        team accounts, white-label branding, PIN-protected links, an MCP connector for AI assistants, and a
        full set of AI tools.
      </p>

      <div className="card" style={{ padding: 0, overflow: "hidden", marginTop: 24 }}>
        <div className="plan-table-scroll">
          <table className="plan-table">
            <thead>
              <tr>
                <th></th>
                <th>Free</th>
                <th className="plan-col-paid">Paid — $7/mo</th>
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

      <div style={{ display: "flex", gap: 12, marginTop: 20, flexWrap: "wrap" }}>
        <Link to="/prepare" className="btn-secondary" style={{ textDecoration: "none" }}>
          Start free
        </Link>
        <Link to="/login" className="btn-primary" style={{ textDecoration: "none" }}>
          Sign in to upgrade
        </Link>
        <a href="mailto:sales@docracy.io" className="btn-secondary" style={{ textDecoration: "none" }}>
          Contact sales
        </a>
      </div>

      <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 32 }}>
        Docracy doesn't verify identity — the audit trail proves what was signed and when, not who actually
        signed it. For contracts that need identity-verified signatures, use a compliance-grade e-signature
        service instead.
      </p>
    </div>
  );
}
