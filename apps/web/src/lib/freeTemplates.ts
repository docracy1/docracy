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

// Every free template's dedicated signature page uses the exact same layout regardless of body
// length — a signature+date line per signer, at fixed coordinates computed once when the PDFs
// were generated. Which page number that lands on DOES vary per template (most run two content
// pages before it; a couple of the shorter ones fit their body on a single page), so the caller
// always passes the actual signature-page index for that specific PDF.
const SIGNER_ROW_Y: Array<{ signature: number; date: number }> = [
  { signature: 0.267, date: 0.297 },
  { signature: 0.4302, date: 0.4602 },
];

function standardSignatureFields(signerCount: 1 | 2, signaturePage: number): DocField[] {
  const fields: DocField[] = [];
  for (let i = 0; i < signerCount; i++) {
    const row = SIGNER_ROW_Y[i];
    fields.push(
      { id: nextFieldId(), signerOrder: i + 1, page: signaturePage, xFrac: 0.1176, yFrac: row.signature, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: nextFieldId(), signerOrder: i + 1, page: signaturePage, xFrac: 0.4267, yFrac: row.date, wFrac: 0.16, hFrac: 0.04, type: "date" }
    );
  }
  return fields;
}

export const FREE_TEMPLATES: FreeTemplate[] = [
  {
    slug: "mutual-nda",
    name: "Mutual NDA",
    seoTitle: "Free Mutual NDA Template — Fill, Sign, and Send Online",
    description:
      "A standard mutual non-disclosure agreement (NDA) — also called a confidentiality agreement — for two " +
      "parties exploring a business relationship.",
    useCase:
      "Use this when you and another company are about to share confidential information — pricing, product plans, " +
      "customer data — while evaluating a potential deal, partnership, or vendor relationship, and both sides need " +
      "protection, not just one.",
    signerLabels: ["Party A", "Party B"],
    pdfPath: "/free-templates/mutual-nda.pdf",
    fields: standardSignatureFields(2, 2),
  },
  {
    slug: "independent-contractor-agreement",
    name: "Independent Contractor Agreement",
    seoTitle: "Free Independent Contractor Agreement Template (1099 Agreement)",
    description:
      "Defines scope, pay, and IP ownership for a company hiring an independent contractor (1099 worker) — not " +
      "an employee.",
    useCase:
      "Use this when you're bringing on a contractor for ongoing or project-based work and need to spell out that " +
      "they're not an employee, who owns the resulting work product, and how they get paid.",
    signerLabels: ["Company", "Contractor"],
    pdfPath: "/free-templates/independent-contractor-agreement.pdf",
    fields: standardSignatureFields(2, 2),
  },
  {
    slug: "offer-letter",
    name: "Offer Letter",
    seoTitle: "Free Employment Offer Letter Template (Job Offer Letter)",
    description: "A straightforward job offer letter covering title, pay, start date, and at-will employment terms.",
    useCase:
      "Use this when you've decided on a candidate and need a clean, professional letter confirming the role, " +
      "compensation, and start date before they officially accept.",
    signerLabels: ["Candidate", "Company Representative"],
    pdfPath: "/free-templates/offer-letter.pdf",
    fields: standardSignatureFields(2, 2),
  },
  {
    slug: "remote-work-policy",
    name: "Remote Work Policy",
    seoTitle: "Free Remote Work / Work-From-Home Policy Template",
    description:
      "A short work-from-home policy covering hours, security, and workspace expectations for remote employees to sign.",
    useCase:
      "Use this when you have employees working remotely (full-time, hybrid, or occasional) and want a signed " +
      "record that they've read and agreed to your expectations around availability, security, and equipment.",
    signerLabels: ["Employee"],
    pdfPath: "/free-templates/remote-work-policy.pdf",
    fields: standardSignatureFields(1, 2),
  },
  {
    slug: "freelance-service-agreement",
    name: "Freelance Service Agreement",
    seoTitle: "Free Freelance Contract Template (Freelance Service Agreement)",
    description:
      "A freelance contract covering scope, fees, revisions, and ownership for a client hiring a freelancer on a " +
      "project basis.",
    useCase:
      "Use this when a client is hiring you (or you're hiring a freelancer) for a defined project — design, writing, " +
      "development — and need clear terms on deliverables, payment, and who owns the final work.",
    signerLabels: ["Client", "Freelancer"],
    pdfPath: "/free-templates/freelance-service-agreement.pdf",
    fields: standardSignatureFields(2, 2),
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
    fields: standardSignatureFields(2, 2),
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
    fields: standardSignatureFields(2, 2),
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
    fields: standardSignatureFields(2, 2),
  },
  {
    slug: "consulting-agreement",
    name: "Consulting Agreement",
    seoTitle: "Free Consulting Agreement Template (Consultant Agreement)",
    description:
      "Terms for an ongoing advisory/consultant relationship — fees, confidentiality, and ownership of recommendations.",
    useCase:
      "Use this when you're bringing on (or acting as) an advisor for ongoing strategic guidance, rather than a " +
      "one-off deliverable — distinct from a project-based contractor engagement.",
    signerLabels: ["Client", "Consultant"],
    pdfPath: "/free-templates/consulting-agreement.pdf",
    fields: standardSignatureFields(2, 2),
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
    fields: standardSignatureFields(2, 2),
  },
  {
    slug: "separation-agreement",
    name: "Separation Agreement",
    seoTitle: "Free Employee Separation Agreement Template (Severance Agreement)",
    description:
      "Covers final pay, severance, return of property, and release terms when an employee leaves — sometimes " +
      "called a severance agreement.",
    useCase:
      "Use this when an employee's time with your company is ending and you want a clear, signed record of final " +
      "pay, any severance, and each side's remaining obligations.",
    signerLabels: ["Company Representative", "Employee"],
    pdfPath: "/free-templates/separation-agreement.pdf",
    fields: standardSignatureFields(2, 2),
  },
  {
    slug: "equipment-rental-agreement",
    name: "Equipment Rental Agreement",
    seoTitle: "Free Equipment Rental Agreement Template (Equipment Lease)",
    description:
      "Covers rental fee, deposit, and responsibility for loss or damage when lending, renting, or leasing equipment.",
    useCase:
      "Use this when you're lending or renting out equipment — tools, AV gear, machinery — and want clear terms " +
      "on the rental period, deposit, and who's on the hook if something breaks.",
    signerLabels: ["Owner", "Renter"],
    pdfPath: "/free-templates/equipment-rental-agreement.pdf",
    fields: standardSignatureFields(2, 2),
  },
  {
    slug: "partnership-agreement",
    name: "Partnership Agreement",
    seoTitle: "Free Business Partnership Agreement Template",
    description: "Defines contributions, profit sharing, and management terms for two people starting a business together.",
    useCase:
      "Use this when you and someone else are starting a business together and want to put contributions, " +
      "ownership split, and decision-making in writing from day one.",
    signerLabels: ["Partner A", "Partner B"],
    pdfPath: "/free-templates/partnership-agreement.pdf",
    fields: standardSignatureFields(2, 2),
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
    fields: standardSignatureFields(2, 1),
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
    fields: standardSignatureFields(2, 2),
  },
];

export function getFreeTemplate(slug: string): FreeTemplate | undefined {
  return FREE_TEMPLATES.find((t) => t.slug === slug);
}
