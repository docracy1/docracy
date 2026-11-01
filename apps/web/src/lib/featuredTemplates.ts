/**
 * The four templates the landing page shows, plus the catalog size, copied from lib/freeTemplates.ts.
 * The landing page is in the eager bundle; importing the catalog there pulled 1.5 MB of template
 * data (legacy batches included) into every first visit. scripts/featuredTemplates.test.mjs fails
 * when these entries or the count drift from the catalog.
 */
export type FeaturedTemplate = { slug: string; name: string; description: string; pdfPath: string };

export const FEATURED_TEMPLATES: FeaturedTemplate[] = [
  {
    slug: "mutual-nda",
    name: "Mutual NDA",
    description: "Sign an NDA online free with this mutual non-disclosure agreement template — fill in, send, and collect signatures with no account required for up to 2 signers.",
    pdfPath: "/free-templates/mutual-nda.pdf",
  },
  {
    slug: "independent-contractor-agreement",
    name: "Independent Contractor Agreement",
    description: "Defines scope, pay, and IP ownership for a company hiring an independent contractor (1099 worker) — not an employee.",
    pdfPath: "/free-templates/independent-contractor-agreement.pdf",
  },
  {
    slug: "offer-letter",
    name: "Offer Letter",
    description: "A straightforward job offer letter covering title, pay, start date, and at-will employment terms.",
    pdfPath: "/free-templates/offer-letter.pdf",
  },
  {
    slug: "freelance-service-agreement",
    name: "Freelance Service Agreement",
    description: "A freelance contract covering scope, fees, revisions, and ownership for a client hiring a freelancer on a project basis.",
    pdfPath: "/free-templates/freelance-service-agreement.pdf",
  },
];

/** FREE_TEMPLATES.length, checked by the test. */
export const FREE_TEMPLATE_COUNT = 642;
