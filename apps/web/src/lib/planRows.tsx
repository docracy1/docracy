/** Shared between Landing.tsx's inline comparison table and the standalone /pricing page — single
 *  source of truth so the two never drift out of sync. `enterprise` is optional and, where
 *  omitted, falls back to whatever `paid` has (Enterprise is a superset of Paid, not a separate
 *  feature set) — see Pricing.tsx's `row.enterprise ?? row.paid`. Landing.tsx's table only ever
 *  reads `free`/`paid`, so adding this field doesn't affect it. */
export const PLAN_ROWS: Array<{ label: string; free: boolean | string; paid: boolean | string; enterprise?: boolean | string }> = [
  { label: "Signers per document", free: "Up to 2", paid: "Unlimited" },
  { label: "Sequential or all-at-once signing", free: true, paid: true },
  { label: "PIN-protected signing links", free: false, paid: true },
  { label: "Text, date, and initials fields", free: true, paid: true },
  { label: "Audit trail + completion certificate", free: true, paid: true },
  { label: "Dashboard with document history", free: false, paid: true },
  { label: "Reusable templates", free: false, paid: true },
  { label: "Webhooks for your own systems", free: false, paid: true },
  { label: "MCP connector (Claude, ChatGPT, Grok, Perplexity)", free: false, paid: true },
  { label: "Team accounts (shared workspace)", free: false, paid: true },
  { label: "White-label branding (your own logo)", free: false, paid: true },
  { label: "AI auto-detect signature & date fields", free: false, paid: true },
  { label: "AI plain-English contract explainer", free: false, paid: true },
  { label: "AI risk & clause highlighter", free: false, paid: true },
  { label: "AI contract generator (describe it, get a signable PDF)", free: false, paid: true },
  { label: "Volume discounts & custom onboarding", free: false, paid: false, enterprise: true },
];

export function PlanCell({ value }: { value: boolean | string }) {
  if (typeof value === "string") return <>{value}</>;
  return value ? (
    <span className="plan-check" aria-label="Included">
      ✓
    </span>
  ) : (
    <span className="plan-dash" aria-label="Not included">
      —
    </span>
  );
}
