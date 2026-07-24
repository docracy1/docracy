/** Real, sourced per-seat pricing for the standard commercial/team plan each vendor advertises on
 *  their own pricing page as of July 2026 — NOT Docracy's own feature-equivalent tier, since none
 *  of these vendors sell a flat-fee-per-workspace plan the way Docracy does. `minSeats` models a
 *  vendor-enforced minimum (e.g. DocuSign Business Pro requires 5 seats minimum) so a team-size
 *  calculation isn't understated for small teams. Shared by PricingCalculator.tsx (Landing page)
 *  and the blog's comparison posts so the numbers can't drift out of sync between the two. */
export interface Competitor {
  key: string;
  name: string;
  pricePerSeat: number;
  minSeats: number;
  billing: string;
  url: string;
}

export const COMPETITORS: Competitor[] = [
  { key: "eversign", name: "eversign (Xodo Sign) Professional", pricePerSeat: 16, minSeats: 1, billing: "billed annually", url: "https://eversign.com/pricing" },
  { key: "docusign", name: "DocuSign Business Pro", pricePerSeat: 40, minSeats: 5, billing: "billed annually, 5-seat minimum", url: "https://www.docusign.com/pricing" },
  { key: "pandadoc", name: "PandaDoc Business", pricePerSeat: 49, minSeats: 1, billing: "billed annually", url: "https://www.pandadoc.com/pricing/" },
  { key: "adobesign", name: "Adobe Acrobat Sign (Pro for Teams)", pricePerSeat: 23.99, minSeats: 1, billing: "annual commitment", url: "https://www.adobe.com/acrobat/business/pricing-plans.html" },
];

export const DOCRACY_PRICE = 7;

export function getCompetitor(key: string): Competitor | undefined {
  return COMPETITORS.find((c) => c.key === key);
}

export function formatUsd(n: number): string {
  return n % 1 === 0 ? `$${n}` : `$${n.toFixed(2)}`;
}
