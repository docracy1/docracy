import type { DocField } from "./types";

export interface FreeTemplate {
  slug: string;
  /** Short display name, e.g. sidebar/list contexts. */
  name: string;
  /** <title> for the landing page and its link text elsewhere. */
  seoTitle: string;
  /** One-sentence summary shown on the library index and used as the meta description. */
  description: string;
  /** Longer "when to use this" paragraph shown on the template's own page. */
  useCase: string;
  /** Human-readable labels for each signer slot, in order (e.g. ["Party A", "Party B"]). */
  signerLabels: string[];
  /** Static PDF served from /public — no auth, no D1 lookup, unlike the paid saved-templates feature. */
  pdfPath: string;
  /** Pre-placed signature fields, generated to match the static PDF's signature page exactly. */
  fields: DocField[];
}

let fieldIdCounter = 0;
const nextFieldId = () => `ft${fieldIdCounter++}`;

export const FREE_TEMPLATES: FreeTemplate[] = [
  {
    slug: "mutual-nda",
    name: "Mutual NDA",
    seoTitle: "Free Mutual NDA Template — Fill, Sign, and Send Online",
    description: "A standard mutual non-disclosure agreement for two parties exploring a business relationship.",
    useCase:
      "Use this when you and another company are about to share confidential information — pricing, product plans, " +
      "customer data — while evaluating a potential deal, partnership, or vendor relationship, and both sides need " +
      "protection, not just one.",
    signerLabels: ["Party A", "Party B"],
    pdfPath: "/free-templates/mutual-nda.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "independent-contractor-agreement",
    name: "Independent Contractor Agreement",
    seoTitle: "Free Independent Contractor Agreement Template",
    description: "Defines scope, pay, and IP ownership for a company hiring an independent contractor.",
    useCase:
      "Use this when you're bringing on a contractor for ongoing or project-based work and need to spell out that " +
      "they're not an employee, who owns the resulting work product, and how they get paid.",
    signerLabels: ["Company", "Contractor"],
    pdfPath: "/free-templates/independent-contractor-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "offer-letter",
    name: "Offer Letter",
    seoTitle: "Free Employment Offer Letter Template",
    description: "A straightforward offer letter covering title, pay, start date, and at-will employment terms.",
    useCase:
      "Use this when you've decided on a candidate and need a clean, professional letter confirming the role, " +
      "compensation, and start date before they officially accept.",
    signerLabels: ["Candidate", "Company Representative"],
    pdfPath: "/free-templates/offer-letter.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "remote-work-policy",
    name: "Remote Work Policy",
    seoTitle: "Free Remote Work Policy Acknowledgment Template",
    description: "A short policy covering hours, security, and workspace expectations for remote employees to sign.",
    useCase:
      "Use this when you have employees working remotely (full-time, hybrid, or occasional) and want a signed " +
      "record that they've read and agreed to your expectations around availability, security, and equipment.",
    signerLabels: ["Employee"],
    pdfPath: "/free-templates/remote-work-policy.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1743, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "freelance-service-agreement",
    name: "Freelance Service Agreement",
    seoTitle: "Free Freelance Service Agreement Template",
    description: "Covers scope, fees, revisions, and ownership for a client hiring a freelancer on a project basis.",
    useCase:
      "Use this when a client is hiring you (or you're hiring a freelancer) for a defined project — design, writing, " +
      "development — and need clear terms on deliverables, payment, and who owns the final work.",
    signerLabels: ["Client", "Freelancer"],
    pdfPath: "/free-templates/freelance-service-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
];

export function getFreeTemplate(slug: string): FreeTemplate | undefined {
  return FREE_TEMPLATES.find((t) => t.slug === slug);
}
