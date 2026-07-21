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
  {
    slug: "unilateral-nda",
    name: "One-Way NDA",
    seoTitle: "Free One-Way (Unilateral) NDA Template",
    description: "A non-disclosure agreement for when only one party is sharing confidential information.",
    useCase:
      "Use this when you (or your company) are the one sharing confidential information — with a candidate, " +
      "vendor, or potential investor — and only the other side needs to be bound to confidentiality, not both of you.",
    signerLabels: ["Disclosing Party", "Receiving Party"],
    pdfPath: "/free-templates/unilateral-nda.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "simple-commercial-lease-agreement",
    name: "Simple Commercial Lease Agreement",
    seoTitle: "Free Simple Commercial Lease Agreement Template",
    description: "Covers rent, term, deposit, and maintenance responsibilities for a straightforward property lease.",
    useCase:
      "Use this when you're leasing out (or leasing) a small commercial space — an office, studio, or storefront — " +
      "and want clear terms on rent, deposit, and who's responsible for what.",
    signerLabels: ["Landlord", "Tenant"],
    pdfPath: "/free-templates/simple-commercial-lease-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "non-compete-non-solicitation-agreement",
    name: "Non-Compete / Non-Solicitation Agreement",
    seoTitle: "Free Non-Compete and Non-Solicitation Agreement Template",
    description: "Restricts a departing employee or contractor from competing or poaching clients/staff for a set period.",
    useCase:
      "Use this when someone with access to your clients, staff, or trade secrets is leaving or being engaged, " +
      "and you want a written limit on them competing with you or poaching your people afterward.",
    signerLabels: ["Company", "Individual"],
    pdfPath: "/free-templates/non-compete-non-solicitation-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "consulting-agreement",
    name: "Consulting Agreement",
    seoTitle: "Free Consulting Agreement Template",
    description: "Terms for an ongoing advisory relationship — fees, confidentiality, and ownership of recommendations.",
    useCase:
      "Use this when you're bringing on (or acting as) an advisor for ongoing strategic guidance, rather than a " +
      "one-off deliverable — distinct from a project-based contractor engagement.",
    signerLabels: ["Client", "Consultant"],
    pdfPath: "/free-templates/consulting-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "vendor-agreement",
    name: "Vendor Agreement",
    seoTitle: "Free Vendor / Supplier Agreement Template",
    description: "Sets pricing, delivery, and quality terms for buying goods or services from a supplier.",
    useCase:
      "Use this when you're formalizing a relationship with a supplier or vendor providing goods or services to " +
      "your business on an ongoing basis.",
    signerLabels: ["Company", "Vendor"],
    pdfPath: "/free-templates/vendor-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "separation-agreement",
    name: "Separation Agreement",
    seoTitle: "Free Employee Separation Agreement Template",
    description: "Covers final pay, severance, return of property, and release terms when an employee leaves.",
    useCase:
      "Use this when an employee's time with your company is ending and you want a clear, signed record of final " +
      "pay, any severance, and each side's remaining obligations.",
    signerLabels: ["Company Representative", "Employee"],
    pdfPath: "/free-templates/separation-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "equipment-rental-agreement",
    name: "Equipment Rental Agreement",
    seoTitle: "Free Equipment Rental Agreement Template",
    description: "Covers rental fee, deposit, and responsibility for loss or damage when lending or renting equipment.",
    useCase:
      "Use this when you're lending or renting out equipment — tools, AV gear, machinery — and want clear terms " +
      "on the rental period, deposit, and who's on the hook if something breaks.",
    signerLabels: ["Owner", "Renter"],
    pdfPath: "/free-templates/equipment-rental-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "partnership-agreement",
    name: "Partnership Agreement",
    seoTitle: "Free Partnership Agreement Template",
    description: "Defines contributions, profit sharing, and management terms for two people starting a business together.",
    useCase:
      "Use this when you and someone else are starting a business together and want to put contributions, " +
      "ownership split, and decision-making in writing from day one.",
    signerLabels: ["Partner A", "Partner B"],
    pdfPath: "/free-templates/partnership-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "sales-agreement",
    name: "Sales Agreement",
    seoTitle: "Free Sales / Purchase Agreement Template",
    description: "Covers price, delivery, and condition terms for a one-off sale of goods.",
    useCase:
      "Use this when you're buying or selling goods — equipment, inventory, a one-off asset — and want the price, " +
      "delivery, and condition terms documented rather than a handshake deal.",
    signerLabels: ["Seller", "Buyer"],
    pdfPath: "/free-templates/sales-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
  {
    slug: "referral-agreement",
    name: "Referral Agreement",
    seoTitle: "Free Referral / Affiliate Agreement Template",
    description: "Sets commission terms for someone referring paying customers to your business.",
    useCase:
      "Use this when someone — a partner, a friend, an affiliate — is going to refer customers your way and you " +
      "want clear, written terms on what counts as a qualified referral and how much they're paid.",
    signerLabels: ["Company", "Referrer"],
    pdfPath: "/free-templates/referral-agreement.pdf",
    fields: [
      { id: nextFieldId(), signerOrder: 1, page: 1, xFrac: 0.0915, yFrac: 0.1238, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: 2, page: 1, xFrac: 0.0915, yFrac: 0.4016, wFrac: 0.26, hFrac: 0.07, type: "signature" },
    ],
  },
];

export function getFreeTemplate(slug: string): FreeTemplate | undefined {
  return FREE_TEMPLATES.find((t) => t.slug === slug);
}
