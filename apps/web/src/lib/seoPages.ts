export interface SeoComparisonRow {
  feature: string;
  docracyValue: string;
  competitorValue: string;
  secondCompetitorValue?: string;
}

export interface SeoLandingPageContent {
  slug: string;
  pageType: "vs-competitor";
  primaryCompetitor: string;
  secondaryCompetitor: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  comparisonRows: SeoComparisonRow[];
}

const COMPETITORS = ["PandaDoc", "DocuSign", "HelloSign", "Eversign"];

// Deliberately no invented per-competitor pricing figures — those go stale and we'd be
// guessing. Rows describe the well-known per-seat/enterprise-onboarding pattern both
// tools share, contrasted with Docracy's flat/free model, which we do control and can
// state precisely — honest, but leaning into the comparisons that favor Docracy.
const COMPARISON_ROWS: SeoComparisonRow[] = [
  {
    feature: "Pricing model",
    docracyValue: "Free for up to 2 signers, forever. Flat $10/mo for unlimited — never per-seat.",
    competitorValue: "Per-seat, per-month — cost climbs as your team grows",
    secondCompetitorValue: "Per-seat, per-month — cost climbs as your team grows",
  },
  {
    feature: "Account required to sign",
    docracyValue: "No — signers open the emailed link and sign, no login",
    competitorValue: "Often required for signers too, depending on plan",
    secondCompetitorValue: "Often required for signers too, depending on plan",
  },
  {
    feature: "Time to send your first document",
    docracyValue: "Under a minute: upload a PDF, place fields, send",
    competitorValue: "Account signup and workspace setup before your first send",
    secondCompetitorValue: "Account signup and workspace setup before your first send",
  },
  {
    feature: "Best fit",
    docracyValue: "Any team, any size — no minimum seats, no sales call",
    competitorValue: "Best value at team scale; solo/occasional use pays for unused enterprise tooling",
    secondCompetitorValue: "Best value at team scale; solo/occasional use pays for unused enterprise tooling",
  },
  {
    feature: "Template import",
    docracyValue: "Drop in any existing PDF as-is, no reformatting",
    competitorValue: "Templates typically tied to their own document builder",
    secondCompetitorValue: "Templates typically tied to their own document builder",
  },
  {
    feature: "WhatsApp signing",
    docracyValue: "Yes — phone-bound, PIN-protected links. Free: 1/month. Paid: 10/month, then $0.50 each. Enterprise: 50/month fair-use",
    competitorValue: "Not offered",
    secondCompetitorValue: "Not offered",
  },
];

export const SEO_FAQS: { question: string; answer: string }[] = [
  {
    question: "Do I need to create an account to sign a document with Docracy?",
    answer:
      "No. Signers just open the link from their email and sign — no account, no app download, no password.",
  },
  {
    question: "Is Docracy really free?",
    answer:
      "Yes, for documents with up to 2 signers. Need more signers, templates, or team seats? That's a flat $10/month — no per-seat pricing, ever.",
  },
  {
    question: "Can I import my existing PDF contracts?",
    answer:
      "Yes. Drop in any PDF as-is and place signature fields directly on it — no rebuilding it in a proprietary template editor first.",
  },
];

function slugifyCompetitor(name: string): string {
  return name.toLowerCase();
}

/** Canonical A-vs-B pages only (one direction per pair). Reverse URLs 301 via public/_redirects. */
export const SEO_LANDING_PAGES: SeoLandingPageContent[] = [];

/** Reverse slug → canonical slug for redirects / docs. */
export const SEO_VS_REDIRECTS: Array<{ from: string; to: string }> = [];

for (let i = 0; i < COMPETITORS.length; i++) {
  for (let j = i + 1; j < COMPETITORS.length; j++) {
    const comp1 = COMPETITORS[i];
    const comp2 = COMPETITORS[j];
    const canonicalSlug = `${slugifyCompetitor(comp1)}-vs-${slugifyCompetitor(comp2)}`;
    const reverseSlug = `${slugifyCompetitor(comp2)}-vs-${slugifyCompetitor(comp1)}`;

    SEO_LANDING_PAGES.push({
      slug: canonicalSlug,
      pageType: "vs-competitor",
      primaryCompetitor: comp1,
      secondaryCompetitor: comp2,
      seoTitle: `${comp1} vs ${comp2}: which is right for you? | Docracy`,
      seoDescription: `Comparing ${comp1} and ${comp2}? See how they stack up, and how Docracy's flat pricing and no-signup signing compares to both.`,
      heroHeadline: `${comp1} vs ${comp2}`,
      heroSubheadline: `Both are solid e-signature tools built around per-seat pricing. Here's how they compare, and a simpler flat-rate option to consider.`,
      comparisonRows: COMPARISON_ROWS,
    });

    SEO_VS_REDIRECTS.push({ from: `/${reverseSlug}`, to: `/${canonicalSlug}` });
  }
}

export function getSeoLandingPage(slug: string): SeoLandingPageContent | undefined {
  return SEO_LANDING_PAGES.find((p) => p.slug === slug);
}
