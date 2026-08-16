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
  /** Which "recurring" category (if any) this template belongs to — see RECURRING_CATEGORIES.
   *  Absent for templates outside the recurring-template curation; not every free template needs
   *  to be in a recurring category. */
  recurringCategory?: string;
  /** Shown in the "Featured templates" strip at the top of /free-templates — the small set of
   *  templates people search/use most (mirrors the shape of competitor template libraries). */
  featured?: boolean;
}

/** Display order for the Template Library's "Recurring templates" section (Dashboard.tsx's
 *  Quick Actions and the in-editor template picker use the same list). */
export const RECURRING_CATEGORIES = [
  "Real Estate",
  "Will",
  "Power of Attorney",
  "Personal Property",
  "Non-Disclosure",
  "Employment",
  "Sale and Purchase",
  "Consulting",
  "Incorporation",
  "Funding",
  "Intellectual Property",
  "Equity",
  "Compliance Documents",
];

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
    seoTitle: "Free Mutual NDA Template",
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
    featured: true,
    recurringCategory: "Non-Disclosure",
  },
  {
    slug: "independent-contractor-agreement",
    name: "Independent Contractor Agreement",
    seoTitle: "Free Independent Contractor Template (1099)",
    description:
      "Defines scope, pay, and IP ownership for a company hiring an independent contractor (1099 worker) — not " +
      "an employee.",
    useCase:
      "Use this when you're bringing on a contractor for ongoing or project-based work and need to spell out that " +
      "they're not an employee, who owns the resulting work product, and how they get paid.",
    signerLabels: ["Company", "Contractor"],
    pdfPath: "/free-templates/independent-contractor-agreement.pdf",
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Consulting",
  },
  {
    slug: "offer-letter",
    name: "Offer Letter",
    seoTitle: "Free Employment Offer Letter Template",
    description: "A straightforward job offer letter covering title, pay, start date, and at-will employment terms.",
    useCase:
      "Use this when you've decided on a candidate and need a clean, professional letter confirming the role, " +
      "compensation, and start date before they officially accept.",
    signerLabels: ["Candidate", "Company Representative"],
    pdfPath: "/free-templates/offer-letter.pdf",
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Employment",
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
    recurringCategory: "Employment",
  },
  {
    slug: "freelance-service-agreement",
    name: "Freelance Service Agreement",
    seoTitle: "Free Freelance Contract Template",
    description:
      "A freelance contract covering scope, fees, revisions, and ownership for a client hiring a freelancer on a " +
      "project basis.",
    useCase:
      "Use this when a client is hiring you (or you're hiring a freelancer) for a defined project — design, writing, " +
      "development — and need clear terms on deliverables, payment, and who owns the final work.",
    signerLabels: ["Client", "Freelancer"],
    pdfPath: "/free-templates/freelance-service-agreement.pdf",
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Consulting",
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
    recurringCategory: "Non-Disclosure",
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
    recurringCategory: "Real Estate",
  },
  {
    slug: "non-compete-non-solicitation-agreement",
    name: "Non-Compete / Non-Solicitation Agreement",
    seoTitle: "Free Non-Compete Agreement Template",
    description: "Restricts a departing employee or contractor from competing or poaching clients/staff for a set period.",
    useCase:
      "Use this when someone with access to your clients, staff, or trade secrets is leaving or being engaged, " +
      "and you want a written limit on them competing with you or poaching your people afterward.",
    signerLabels: ["Company", "Individual"],
    pdfPath: "/free-templates/non-compete-non-solicitation-agreement.pdf",
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Employment",
  },
  {
    slug: "consulting-agreement",
    name: "Consulting Agreement",
    seoTitle: "Free Consulting Agreement Template",
    description:
      "Terms for an ongoing advisory/consultant relationship — fees, confidentiality, and ownership of recommendations.",
    useCase:
      "Use this when you're bringing on (or acting as) an advisor for ongoing strategic guidance, rather than a " +
      "one-off deliverable — distinct from a project-based contractor engagement.",
    signerLabels: ["Client", "Consultant"],
    pdfPath: "/free-templates/consulting-agreement.pdf",
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Consulting",
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
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "separation-agreement",
    name: "Separation Agreement",
    seoTitle: "Free Employee Separation Agreement Template",
    description:
      "Covers final pay, severance, return of property, and release terms when an employee leaves — sometimes " +
      "called a severance agreement.",
    useCase:
      "Use this when an employee's time with your company is ending and you want a clear, signed record of final " +
      "pay, any severance, and each side's remaining obligations.",
    signerLabels: ["Company Representative", "Employee"],
    pdfPath: "/free-templates/separation-agreement.pdf",
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Employment",
  },
  {
    slug: "equipment-rental-agreement",
    name: "Equipment Rental Agreement",
    seoTitle: "Free Equipment Rental Agreement Template",
    description:
      "Covers rental fee, deposit, and responsibility for loss or damage when lending, renting, or leasing equipment.",
    useCase:
      "Use this when you're lending or renting out equipment — tools, AV gear, machinery — and want clear terms " +
      "on the rental period, deposit, and who's on the hook if something breaks.",
    signerLabels: ["Owner", "Renter"],
    pdfPath: "/free-templates/equipment-rental-agreement.pdf",
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Personal Property",
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
    recurringCategory: "Incorporation",
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
    recurringCategory: "Sale and Purchase",
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
    recurringCategory: "Consulting",
  },
];

// The 6 templates below (employment-agreement through delivery-confirmation) were generated by
// scripts/generateFreeTemplatePdfs.mjs, which implements the site's global PDF layout standard —
// re-run it and paste the printed field fractions here if that script's content/spacing changes.
FREE_TEMPLATES.push(
  {
    slug: "employment-agreement",
    name: "Employment Agreement",
    seoTitle: "Free Employment Agreement Template",
    description: "Covers position, pay, work schedule, confidentiality, and termination terms for a new hire.",
    useCase:
      "Use this when you're formally hiring an employee and need a signed record of their role, pay, schedule, " +
      "and the basic confidentiality and termination terms both sides are agreeing to.",
    signerLabels: ["Employer", "Employee"],
    pdfPath: "/free-templates/employment-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27814624183006537, yFrac: 0.7313131313131317, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8266919191919195, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2823366013071895, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Employment",
  },
  {
    slug: "rental-agreement",
    name: "Rental Agreement",
    seoTitle: "Free Rental Agreement Template",
    description: "Covers rent, deposit, term, and liability terms for renting out property or equipment.",
    useCase:
      "Use this when you're renting out (or renting) property or an item and want clear, signed terms on rent, " +
      "deposit, the rental period, and who's responsible for damage beyond normal wear.",
    signerLabels: ["Owner", "Renter"],
    pdfPath: "/free-templates/rental-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.25507107843137256, yFrac: 0.761616161616162, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8569949494949498, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2561233660130719, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Real Estate",
  },
  {
    slug: "authorization-form",
    name: "Authorization Form",
    seoTitle: "Free Authorization Form Template",
    description: "Grants a named individual specific, time-limited authority to act on someone else's behalf.",
    useCase:
      "Use this when you need to formally authorize someone — a family member, employee, or representative — to " +
      "act on your behalf for a defined purpose, with clear limits and an expiration date.",
    signerLabels: ["Authorizing Party", "Authorized Individual"],
    pdfPath: "/free-templates/authorization-form.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.34252369281045747, yFrac: 0.4237373737373739, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5191161616161618, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.4571290849673203, yFrac: 0.5894191919191921, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.68479797979798, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Power of Attorney",
  },
  {
    slug: "purchase-order",
    name: "Purchase Order",
    seoTitle: "Free Purchase Order Template",
    description: "An itemized order form covering items, pricing, delivery, and payment terms between buyer and seller.",
    useCase:
      "Use this when you're formally ordering goods from a supplier and want an itemized, signed record of what " +
      "was ordered, at what price, and on what delivery and payment terms.",
    signerLabels: ["Buyer", "Seller"],
    pdfPath: "/free-templates/purchase-order.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.248437908496732, yFrac: 0.5770202020202023, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6723989898989902, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.24776143790849672, yFrac: 0.7427020202020205, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8380808080808083, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "work-order",
    name: "Work Order",
    seoTitle: "Free Work Order Template",
    description: "Covers scope, materials, estimated cost, and completion date for a service job.",
    useCase:
      "Use this when a service provider is doing work for a client and you want a signed record of the scope, " +
      "estimated cost, and expected completion date before work begins.",
    signerLabels: ["Client", "Service Provider"],
    pdfPath: "/free-templates/work-order.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.24776143790849672, yFrac: 0.5566919191919194, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6520707070707075, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.33784477124183004, yFrac: 0.7223737373737377, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8177525252525255, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Consulting",
  },
  {
    slug: "delivery-confirmation",
    name: "Delivery Confirmation",
    seoTitle: "Free Delivery Confirmation Template",
    description: "A signed record that goods were delivered, received, and in what condition.",
    useCase:
      "Use this when you need proof that a delivery actually happened — for a shipment, handoff, or drop-off — " +
      "with both sides signing off on what was delivered and its condition.",
    signerLabels: ["Sender", "Recipient"],
    pdfPath: "/free-templates/delivery-confirmation.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2603137254901961, yFrac: 0.1275252525252525, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.2229040404040405, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.27805228758169936, yFrac: 0.29320707070707075, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.38858585858585865, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Sale and Purchase",
  }
);

// The 10 templates below were generated by scripts/generateFreeTemplatePdfs.mjs for the
// "Recurring Templates" curation — re-run it and paste the printed field fractions here if that
// script's content/spacing changes.
FREE_TEMPLATES.push(
  {
    slug: "client-contract",
    name: "Client Contract",
    seoTitle: "Free Client Contract Template",
    description: "Covers scope, timeline, payment terms, and confidentiality for a client engagement.",
    useCase:
      "Use this when you're taking on a new client and want a signed record of what you're delivering, by when, " +
      "and for how much.",
    signerLabels: ["Business", "Client"],
    pdfPath: "/free-templates/client-contract.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2759665032679739, yFrac: 0.618686868686869, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7140656565656568, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.24776143790849672, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Consulting",
  },
  {
    slug: "service-agreement",
    name: "Service Agreement",
    seoTitle: "Free Service Agreement Template",
    description: "Covers services provided, schedule, fees, and term for an ongoing service relationship.",
    useCase:
      "Use this when you're providing an ongoing service (not a one-off project) and want clear, signed terms on " +
      "what's delivered, how often, and what it costs.",
    signerLabels: ["Provider", "Client"],
    pdfPath: "/free-templates/service-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2694084967320261, yFrac: 0.618686868686869, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7140656565656568, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.24776143790849672, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Consulting",
  },
  {
    slug: "scope-of-work",
    name: "Scope of Work",
    seoTitle: "Free Scope of Work Template",
    description: "An itemized deliverables schedule with due dates and fees for a defined project.",
    useCase:
      "Use this alongside (or instead of) a full contract when you need a precise, signed list of deliverables, " +
      "due dates, and what's explicitly out of scope.",
    signerLabels: ["Client", "Contractor"],
    pdfPath: "/free-templates/scope-of-work.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.24776143790849672, yFrac: 0.5060606060606063, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6014393939393942, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.28725980392156863, yFrac: 0.6717424242424245, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7671212121212123, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Consulting",
  },
  {
    slug: "supplier-terms",
    name: "Supplier Terms",
    seoTitle: "Free Supplier Terms Template",
    description: "Covers pricing, delivery, payment, and quality terms for a supplier relationship.",
    useCase:
      "Use this when you're formalizing standard terms with a supplier you'll order from repeatedly, beyond a " +
      "single purchase order.",
    signerLabels: ["Buyer", "Supplier"],
    pdfPath: "/free-templates/supplier-terms.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.248437908496732, yFrac: 0.618686868686869, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7140656565656568, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26865686274509804, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "employee-onboarding-agreement",
    name: "Employee Onboarding Agreement",
    seoTitle: "Free Employee Onboarding Agreement Template",
    description: "Confirms a new employee has received the handbook, policies, and equipment on day one.",
    useCase:
      "Use this on a new employee's start date to get a signed record that they've received the handbook, " +
      "company policies, and any equipment or access credentials.",
    signerLabels: ["Employer", "Employee"],
    pdfPath: "/free-templates/employee-onboarding-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27814624183006537, yFrac: 0.4440656565656568, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5394444444444447, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2823366013071895, yFrac: 0.609747474747475, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7051262626262628, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Employment",
  },
  {
    slug: "contractor-onboarding-agreement",
    name: "Contractor Onboarding Agreement",
    seoTitle: "Free Contractor Onboarding Agreement Template",
    description: "Confirms a new contractor has received system access and reviewed relevant policies before starting.",
    useCase:
      "Use this when bringing on a new contractor to get a signed record that they've received the access and " +
      "policy information they need, and confirm their independent-contractor status.",
    signerLabels: ["Company", "Contractor"],
    pdfPath: "/free-templates/contractor-onboarding-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.5060606060606063, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6014393939393942, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.28725980392156863, yFrac: 0.6717424242424245, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7671212121212123, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Consulting",
  },
  {
    slug: "payment-terms-agreement",
    name: "Payment Terms Agreement",
    seoTitle: "Free Payment Terms Agreement Template",
    description: "A signed record of an amount owed, due date, and payment method between two parties.",
    useCase:
      "Use this when you need a simple, signed record of what's owed, by when, and how it'll be paid — without " +
      "a full contract.",
    signerLabels: ["Payer", "Payee"],
    pdfPath: "/free-templates/payment-terms-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.24712254901960784, yFrac: 0.2401515151515152, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.3355303030303032, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.251312908496732, yFrac: 0.4058333333333335, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5012121212121214, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "installment-agreement",
    name: "Installment Agreement",
    seoTitle: "Free Installment Agreement Template",
    description: "Splits an amount owed into a scheduled series of installments, with terms for missed payments.",
    useCase:
      "Use this when a debt or invoice will be paid off over several installments instead of all at once, and you " +
      "want the schedule and consequences of missed payments in writing.",
    signerLabels: ["Debtor", "Creditor"],
    pdfPath: "/free-templates/installment-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2561233660130719, yFrac: 0.3314393939393941, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.426818181818182, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.26655228758169935, yFrac: 0.4971212121212123, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5925000000000002, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "privacy-acknowledgement",
    name: "Privacy Acknowledgement",
    seoTitle: "Free Privacy Acknowledgement Template",
    description: "A signed confirmation that someone has received and understood your privacy policy.",
    useCase:
      "Use this when you need a signed record that someone has reviewed and consented to your privacy policy — " +
      "for a new hire, contractor, or customer.",
    signerLabels: ["Individual"],
    pdfPath: "/free-templates/privacy-acknowledgement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2791045751633987, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Compliance Documents",
  },
  {
    slug: "data-processing-agreement",
    name: "Data Processing Agreement",
    seoTitle: "Free Data Processing Agreement (DPA) Template",
    description: "Sets out a processor's obligations for handling personal data on a controller's behalf.",
    useCase:
      "Use this when a vendor will process personal data on your behalf (or you will on someone else's) and you " +
      "need a signed record of each side's data-protection obligations.",
    signerLabels: ["Data Controller", "Data Processor"],
    pdfPath: "/free-templates/data-processing-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.32608169934640524, yFrac: 0.618686868686869, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7140656565656568, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.32921977124183005, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Compliance Documents",
  }
);

// The 8 templates below fill gaps found by comparing against DocuSign's public template library
// (promissory note, LLC operating agreement, sublease, liability waiver, roommate agreement, cash
// receipt, construction contract, cease-and-desist letter) — generated by
// scripts/generateFreeTemplatePdfs.mjs; re-run it and paste the printed field fractions here if
// that script's content/spacing changes.
FREE_TEMPLATES.push(
  {
    slug: "promissory-note",
    name: "Promissory Note",
    seoTitle: "Free Promissory Note Template",
    description: "A borrower's written promise to repay a loan, covering principal, interest, and repayment schedule.",
    useCase:
      "Use this when you're lending or borrowing money between individuals or small businesses and want a signed, " +
      "dated record of the amount, interest, and repayment terms — without a bank or notary.",
    signerLabels: ["Borrower"],
    pdfPath: "/free-templates/promissory-note.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27547794117647056, yFrac: 0.3527777777777779, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.4481565656565658, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    featured: true,
    recurringCategory: "Funding",
  },
  {
    slug: "llc-operating-agreement",
    name: "LLC Operating Agreement",
    seoTitle: "Free LLC Operating Agreement Template",
    description: "Sets ownership percentages, management, and profit-sharing terms for an LLC's members.",
    useCase:
      "Use this when you're forming an LLC with one or more co-founders and need a signed record of who owns " +
      "what, how decisions get made, and how profits and losses are split.",
    signerLabels: ["Member A", "Member B"],
    pdfPath: "/free-templates/llc-operating-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2863954248366013, yFrac: 0.618686868686869, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7140656565656568, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2863954248366013, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    featured: true,
    recurringCategory: "Incorporation",
  },
  {
    slug: "sublease-agreement",
    name: "Sublease Agreement",
    seoTitle: "Free Sublease Agreement Template",
    description: "Covers rent, term, and landlord consent when a tenant subleases their unit to a subtenant.",
    useCase:
      "Use this when an existing tenant wants to sublet their space to someone else for part or all of the " +
      "remaining lease term, and both sides need clear, signed rent and responsibility terms.",
    signerLabels: ["Sublessor", "Subtenant"],
    pdfPath: "/free-templates/sublease-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2829003267973856, yFrac: 0.618686868686869, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7140656565656568, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2853995098039216, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Real Estate",
  },
  {
    slug: "liability-waiver",
    name: "Liability Waiver",
    seoTitle: "Free Liability Waiver Template",
    description: "A participant's signed release of claims against an organization for risks in an activity or event.",
    useCase:
      "Use this before someone takes part in an activity with inherent risk — a class, event, or rental — so you " +
      "have a signed record that they understood the risks and agreed to release you from liability.",
    signerLabels: ["Participant"],
    pdfPath: "/free-templates/liability-waiver.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.28850000000000003, yFrac: 0.4440656565656568, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5394444444444447, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Compliance Documents",
  },
  {
    slug: "roommate-agreement",
    name: "Roommate Agreement",
    seoTitle: "Free Roommate Agreement Template",
    description: "Splits rent and utilities and sets house rules between co-tenants sharing a home.",
    useCase:
      "Use this when you're moving in with a roommate and want a written, signed understanding of how rent and " +
      "bills are split, plus basic house rules — separate from any lease with the landlord.",
    signerLabels: ["Roommate A", "Roommate B"],
    pdfPath: "/free-templates/roommate-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.3093766339869281, yFrac: 0.5060606060606063, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6014393939393942, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.3093766339869281, yFrac: 0.6717424242424245, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7671212121212123, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Real Estate",
  },
  {
    slug: "cash-receipt",
    name: "Cash Receipt",
    seoTitle: "Free Cash Receipt Template",
    description: "A signed confirmation that a cash payment was received, for how much, and what it was for.",
    useCase:
      "Use this when you receive a cash payment — rent, a deposit, an informal sale — and want a signed, dated " +
      "record proving it happened.",
    signerLabels: ["Recipient"],
    pdfPath: "/free-templates/cash-receipt.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27805228758169936, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "construction-contract",
    name: "Construction Contract",
    seoTitle: "Free Construction Contract Template",
    description: "Covers scope, schedule, payment milestones, and warranty for a construction or renovation job.",
    useCase:
      "Use this when hiring (or working as) a contractor for a construction or renovation project and want a " +
      "signed record of the scope, timeline, payment schedule, and workmanship warranty.",
    signerLabels: ["Owner", "Contractor"],
    pdfPath: "/free-templates/construction-contract.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.25507107843137256, yFrac: 0.6693181818181821, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.76469696969697, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.28725980392156863, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Consulting",
  },
  {
    slug: "cease-and-desist-letter",
    name: "Cease and Desist Letter",
    seoTitle: "Free Cease and Desist Letter Template",
    description: "A formal demand that someone stop specific conduct, with a deadline to respond.",
    useCase:
      "Use this when you need to formally demand that someone stop conduct — harassment, infringement, breach of " +
      "an agreement — and want a signed, dated record that the demand was made.",
    signerLabels: ["Sender"],
    pdfPath: "/free-templates/cease-and-desist-letter.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2603137254901961, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Intellectual Property",
  }
);

// The 4 templates below fill gaps found by comparing against DocuSign's public template gallery
// (letter of intent, bill of sale, loan agreement, power of attorney) — generated by
// scripts/generateFreeTemplatePdfs.mjs; re-run it and paste the printed field fractions here if
// that script's content/spacing changes.
FREE_TEMPLATES.push(
  {
    slug: "letter-of-intent",
    name: "Letter of Intent",
    seoTitle: "Free Letter of Intent (LOI) Template",
    description:
      "A non-binding letter outlining the proposed terms of a deal — price, structure, and timeline — before a " +
      "definitive agreement is signed.",
    useCase:
      "Use this when you and a counterparty have reached a preliminary understanding on a business sale, " +
      "partnership, real estate deal, or similar transaction and want to record the proposed terms in writing " +
      "before a definitive agreement is negotiated — with binding confidentiality and exclusivity built in.",
    signerLabels: ["Party A", "Party B"],
    pdfPath: "/free-templates/letter-of-intent.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.26134722222222223, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26134722222222223, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    featured: true,
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "bill-of-sale",
    name: "Bill of Sale",
    seoTitle: "Free Bill of Sale Template",
    description:
      "A simple record of a one-time sale of personal property — a vehicle, equipment, or other goods — from " +
      "seller to buyer, sold as-is.",
    useCase:
      "Use this when you're selling or buying an item outright — a car, equipment, furniture — and want a " +
      "signed, dated record confirming the price, that the seller owns it free and clear of any liens, and that " +
      "it's sold as-is.",
    signerLabels: ["Seller", "Buyer"],
    pdfPath: "/free-templates/bill-of-sale.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.24776143790849672, yFrac: 0.3731060606060608, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.46848484848484867, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.248437908496732, yFrac: 0.5387878787878789, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6341666666666669, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    featured: true,
    recurringCategory: "Sale and Purchase",
  },
  {
    slug: "loan-agreement",
    name: "Loan Agreement",
    seoTitle: "Free Loan Agreement Template",
    description:
      "A fuller bilateral loan contract covering principal, interest, repayment schedule, collateral, and " +
      "default terms.",
    useCase:
      "Use this when lending or borrowing a larger or more structured sum than a simple IOU covers, and both " +
      "sides want explicit terms on interest, collateral, what happens if payments are missed, and prepayment — " +
      "distinct from the single-page Promissory Note.",
    signerLabels: ["Lender", "Borrower"],
    pdfPath: "/free-templates/loan-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.25822794117647063, yFrac: 0.7313131313131317, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8266919191919195, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.27547794117647056, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Funding",
    featured: true,
  },
  {
    slug: "power-of-attorney",
    name: "Power of Attorney",
    seoTitle: "Free Power of Attorney Template",
    description:
      "Grants a named agent authority to act on your behalf, with a fillable scope-of-authority section and a " +
      "durability option.",
    useCase:
      "Use this when you need to authorize someone to act on your behalf — for financial, property, or other " +
      "matters you specify. Power of attorney rules vary by state, so review the notarization/witnessing note in " +
      "the document and confirm your state's requirements before relying on it.",
    signerLabels: ["Principal", "Agent (Attorney-in-Fact)"],
    pdfPath: "/free-templates/power-of-attorney.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.27205800653594775, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2488325163398693, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    featured: true,
    recurringCategory: "Power of Attorney",
  }
);

// The 2 official government forms below are the real, current-revision IRS/USCIS PDFs (public
// domain U.S. government works, downloaded directly from irs.gov/uscis.gov) — not Docracy-authored
// content like every other template above. Field positions were measured from the actual PDF text
// layout via `pdftotext -bbox`, not estimated, since these need to land on the real printed
// signature lines of an official form. Re-download and re-measure if the IRS/USCIS ever revises
// either form (check the "Rev." / "Edition" date printed on the form itself).
FREE_TEMPLATES.push(
  {
    slug: "w-9-form",
    name: "W-9 Form",
    seoTitle: "Free W-9 Form — Sign the IRS Form Online",
    description:
      "The official IRS Form W-9 (Rev. March 2024) — collect a contractor or vendor's taxpayer ID before you pay them.",
    useCase:
      "Use this before you pay a contractor, freelancer, or vendor so you have their taxpayer identification " +
      "number on file for 1099 reporting. This is the real, current IRS form — not a Docracy-drafted substitute.",
    signerLabels: ["Taxpayer"],
    pdfPath: "/free-templates/w-9-form.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 0, xFrac: 0.19282, yFrac: 0.74395, wFrac: 0.43727, hFrac: 0.02, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 0, xFrac: 0.66179, yFrac: 0.74395, wFrac: 0.26146, hFrac: 0.02, type: "date" },
    ],
    recurringCategory: "Compliance Documents",
    featured: true,
  },
  {
    slug: "i-9-form",
    name: "I-9 Form",
    seoTitle: "Free I-9 Form — Sign the USCIS Eligibility Form",
    description:
      "The official USCIS Form I-9 (Edition 01/20/25) — verify a new hire's identity and authorization to work in the U.S.",
    useCase:
      "Use this on or before a new employee's first day to complete Section 1 (employee) and Section 2 " +
      "(employer review) of the required employment eligibility verification. This is the real, current USCIS " +
      "form — not a Docracy-drafted substitute.",
    signerLabels: ["Employee", "Employer or Authorized Representative"],
    pdfPath: "/free-templates/i-9-form.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 0, xFrac: 0.19281, yFrac: 0.45202, wFrac: 0.4085, hFrac: 0.018, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 0, xFrac: 0.75163, yFrac: 0.45202, wFrac: 0.17974, hFrac: 0.018, type: "date" },
      { id: "ft2", signerOrder: 2, page: 0, xFrac: 0.47386, yFrac: 0.875, wFrac: 0.31863, hFrac: 0.028, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 0, xFrac: 0.79248, yFrac: 0.875, wFrac: 0.14706, hFrac: 0.028, type: "date" },
    ],
    recurringCategory: "Employment",
    featured: true,
  }
);

export function getFreeTemplate(slug: string): FreeTemplate | undefined {
  return FREE_TEMPLATES.find((t) => t.slug === slug);
}
