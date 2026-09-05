import { Link } from "react-router-dom";
import { COMPETITORS, DOCRACY_PRICE, formatUsd } from "../lib/competitors";
import { localizePath, useI18n, useT } from "../lib/i18n";

/** Maps alternative-page slug → competitors.ts key for a single-row price callout. */
export const ALTERNATIVE_COMPETITOR_KEY: Record<string, string> = {
  "docusign-alternative": "docusign",
  "hellosign-alternative": "docusign",
  "signnow-alternative": "docusign",
  "zoho-sign-alternative": "docusign",
  "onespan-alternative": "docusign",
  "pandadoc-alternative": "pandadoc",
  "contractbook-alternative": "pandadoc",
  "adobe-sign-alternative": "adobesign",
  "eversign-alternative": "eversign",
  "onlinesignature-alternative": "eversign",
  "docuseal-alternative": "eversign",
  "boldsign-alternative": "eversign",
};

const DEFAULT_TEAM = 5;

/** Compact price strip for SEO alternative pages — Docracy vs the named competitor at 5 seats. */
export default function PricingComparisonStrip({
  alternativeSlug,
  refTag,
}: {
  alternativeSlug: string;
  refTag?: string;
}) {
  const t = useT();
  const { locale } = useI18n();
  const key = ALTERNATIVE_COMPETITOR_KEY[alternativeSlug];
  if (!key) return null;
  const competitor = COMPETITORS.find((c) => c.key === key);
  if (!competitor) return null;

  const seats = Math.max(DEFAULT_TEAM, competitor.minSeats);
  const competitorTotal = seats * competitor.pricePerSeat;
  const savings = competitorTotal - DOCRACY_PRICE;
  const pricingTo = localizePath(refTag ? `/pricing?ref=${refTag}` : "/pricing", locale);

  return (
    <div
      className="card"
      style={{
        marginTop: 28,
        marginBottom: 8,
        borderColor: "var(--primary)",
        borderWidth: 2,
        display: "grid",
        gap: 12,
      }}
    >
      <div style={{ fontSize: 13, fontWeight: 700, color: "var(--primary)", letterSpacing: "0.03em" }}>
        {t("alt.priceStrip.title")}
      </div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 16, alignItems: "baseline", justifyContent: "space-between" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>Docracy</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {formatUsd(DOCRACY_PRICE)}
            <span style={{ fontSize: 14, fontWeight: 400, color: "var(--mute)" }}>{t("calc.perMonth")}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--mute)" }}>{t("calc.unlimitedMembers")}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{competitor.name}</div>
          <div style={{ fontSize: 26, fontWeight: 800 }}>
            {formatUsd(competitorTotal)}
            <span style={{ fontSize: 14, fontWeight: 400, color: "var(--mute)" }}>{t("calc.perMonth")}</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--mute)" }}>
            {t("calc.perUser", { price: formatUsd(competitor.pricePerSeat), seats, billing: t(competitor.billingKey) })}
          </div>
        </div>
      </div>
      <p style={{ margin: 0, fontSize: 13, color: "var(--body-strong)" }}>
        {t("alt.priceStrip.savings", { savings: formatUsd(savings), seats: String(seats) })}
      </p>
      <Link to={pricingTo} className="btn-secondary" style={{ textDecoration: "none", alignSelf: "flex-start" }}>
        {t("alt.seePricing")} →
      </Link>
    </div>
  );
}
