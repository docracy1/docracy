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

// Round 4: filling the two categories that had zero templates (Will, Equity) plus real gaps
// matching docracy.com's original document library (parking/month-to-month leases, equipment
// loans, corporate resolutions, copyright assignment). Appended via .push() per the "Newest
// templates" convention on /free-templates, which relies on array order to find the last 10.
FREE_TEMPLATES.push(
  {
    slug: "last-will-and-testament",
    name: "Last Will and Testament",
    seoTitle: "Free Last Will and Testament Template",
    description:
      "A simple last will and testament — names an executor, a guardian for minor children, and how property " +
      "should be distributed.",
    useCase:
      "Use this as a starting draft for a straightforward estate plan. Witness and notarization requirements " +
      "vary significantly by state — most states require at least two witnesses — so have an attorney licensed " +
      "in your state review the final document before it's executed.",
    signerLabels: ["Testator", "Witness"],
    pdfPath: "/free-templates/last-will-and-testament.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2664019607843137, yFrac: 0.5608585858585862, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.656237373737374, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.26655228758169935, yFrac: 0.7265404040404044, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8219191919191923, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Will",
  },
  {
    slug: "restricted-stock-purchase-agreement",
    name: "Restricted Stock Purchase Agreement",
    seoTitle: "Free Restricted Stock Purchase Agreement Template",
    description:
      "Sets the purchase price, vesting schedule, and company repurchase right for restricted shares sold to a " +
      "purchaser.",
    useCase:
      "Use this when a company is selling restricted shares — often to a founder or early employee — subject to " +
      "vesting, and needs a signed record of the price and repurchase terms.",
    signerLabels: ["Company", "Purchaser"],
    pdfPath: "/free-templates/restricted-stock-purchase-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.4440656565656568, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5394444444444447, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.28536192810457517, yFrac: 0.609747474747475, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7051262626262628, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Equity",
  },
  {
    slug: "stock-option-grant-notice",
    name: "Stock Option Grant Notice",
    seoTitle: "Free Stock Option Grant Notice Template",
    description: "Grants an option to purchase company shares, with exercise price, vesting, and expiration terms.",
    useCase:
      "Use this when granting an employee or early team member stock options and need a signed record of the " +
      "share count, exercise price, and vesting schedule.",
    signerLabels: ["Company", "Optionee"],
    pdfPath: "/free-templates/stock-option-grant-notice.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.3314393939393941, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.426818181818182, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.27598529411764705, yFrac: 0.4971212121212123, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5925000000000002, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Equity",
  },
  {
    slug: "parking-space-lease-agreement",
    name: "Parking Space Lease Agreement",
    seoTitle: "Free Parking Space Lease Agreement Template",
    description: "Covers rent, term, and vehicle details for leasing a single parking space.",
    useCase:
      "Use this when renting out a parking space separately from a residential or commercial lease and want " +
      "clear, signed terms on rent and which vehicle is authorized to use it.",
    signerLabels: ["Landlord", "Tenant"],
    pdfPath: "/free-templates/parking-space-lease-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27284722222222224, yFrac: 0.3527777777777779, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.4481565656565658, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2559730392156863, yFrac: 0.5184595959595961, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.613838383838384, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Real Estate",
  },
  {
    slug: "month-to-month-rental-agreement",
    name: "Month-to-Month Rental Agreement",
    seoTitle: "Free Month-to-Month Rental Agreement Template",
    description: "Covers rent, notice period, deposit, and utilities for an ongoing month-to-month tenancy.",
    useCase:
      "Use this for an open-ended rental with no fixed end date, where either side can end the tenancy with " +
      "proper notice instead of waiting out a fixed lease term.",
    signerLabels: ["Landlord", "Tenant"],
    pdfPath: "/free-templates/month-to-month-rental-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27284722222222224, yFrac: 0.4237373737373739, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5191161616161618, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2559730392156863, yFrac: 0.5894191919191921, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.68479797979798, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Real Estate",
  },
  {
    slug: "equipment-loan-agreement",
    name: "Equipment Loan Agreement",
    seoTitle: "Free Equipment Loan Agreement Template",
    description: "Covers loan period, condition, and liability for lending equipment to someone.",
    useCase:
      "Use this when lending a piece of equipment to someone for a set period and want a signed record of its " +
      "condition, the return date, and who's responsible if it's damaged or lost.",
    signerLabels: ["Lender", "Borrower"],
    pdfPath: "/free-templates/equipment-loan-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.25822794117647063, yFrac: 0.3111111111111112, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.4064898989898991, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.27547794117647056, yFrac: 0.47679292929292943, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5721717171717173, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Personal Property",
  },
  {
    slug: "employee-non-disclosure-agreement",
    name: "Employee Non-Disclosure Agreement",
    seoTitle: "Free Employee Non-Disclosure Agreement Template",
    description: "A one-way confidentiality agreement between an employer and an employee.",
    useCase:
      "Use this when hiring an employee who will have access to confidential business information and you need " +
      "a signed, dedicated confidentiality agreement separate from the main employment contract.",
    signerLabels: ["Employer", "Employee"],
    pdfPath: "/free-templates/employee-non-disclosure-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27814624183006537, yFrac: 0.3111111111111112, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.4064898989898991, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2823366013071895, yFrac: 0.47679292929292943, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5721717171717173, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Non-Disclosure",
  },
  {
    slug: "retainer-agreement",
    name: "Retainer Agreement",
    seoTitle: "Free Retainer Agreement Template",
    description: "Covers the monthly retainer fee, included scope, and terms for an ongoing consulting engagement.",
    useCase:
      "Use this when a client is paying a consultant a recurring monthly fee for ongoing availability, rather " +
      "than a one-off project fee.",
    signerLabels: ["Client", "Consultant"],
    pdfPath: "/free-templates/retainer-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.24776143790849672, yFrac: 0.3314393939393941, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.426818181818182, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2895522875816994, yFrac: 0.4971212121212123, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5925000000000002, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Consulting",
  },
  {
    slug: "corporate-resolution",
    name: "Corporate Resolution",
    seoTitle: "Free Corporate Resolution Template",
    description: "A director-signed record of formal company decisions, adopted at a meeting or by written consent.",
    useCase:
      "Use this to create a signed, dated record of a company decision — opening a bank account, approving a " +
      "contract, authorizing a signatory — that the company's directors formally adopted.",
    signerLabels: ["President", "Secretary"],
    pdfPath: "/free-templates/corporate-resolution.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2791045751633987, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2807017973856209, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Incorporation",
  },
  {
    slug: "copyright-assignment-agreement",
    name: "Copyright Assignment Agreement",
    seoTitle: "Free Copyright Assignment Agreement Template",
    description: "Transfers all copyright ownership of a specific work from its creator to another party.",
    useCase:
      "Use this when someone who created a work — writing, code, design, artwork — is transferring full " +
      "ownership of the copyright to a company or another person, in exchange for payment.",
    signerLabels: ["Assignor", "Assignee"],
    pdfPath: "/free-templates/copyright-assignment-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27282843137254903, yFrac: 0.19848484848484854, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.2938636363636365, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.27701879084967324, yFrac: 0.36416666666666675, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.45954545454545465, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
    recurringCategory: "Intellectual Property",
  }
);

// Round 5: 32-template batch drafted via parallel agents, spanning Will/Power of Attorney,
// Funding/Equity, Personal Property/Real Estate/Employment, Incorporation/Compliance, and
// Intellectual Property/Non-Disclosure. pdfPath/fields added below after PDF generation.
FREE_TEMPLATES.push(
  {
    slug: "living-will-advance-directive",
    name: "Living Will / Advance Healthcare Directive",
    seoTitle: "Free Living Will / Advance Healthcare Directive Template",
    description:
      "Lets a person record their own wishes about life-sustaining treatment and end-of-life care in advance, " +
      "for physicians and family to follow if they can no longer communicate those wishes themselves.",
    useCase:
      "Use this when someone wants to put their own preferences about resuscitation, life support, artificial " +
      "nutrition, and pain management in writing before a medical crisis makes it impossible to ask them directly. " +
      "This document states the Principal's own directions rather than appointing anyone to decide on their " +
      "behalf — pair it with a Medical Power of Attorney if a decision-maker should also be named. Many states " +
      "require particular witnessing or notarization formalities before hospitals will honor a living will, so " +
      "confirm and complete those steps for the Principal's state before relying on it.",
    signerLabels: ["Principal", "Witness"],
    recurringCategory: "Will",
    pdfPath: "/free-templates/living-will-advance-directive.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27205800653594775, yFrac: 0.7175505050505054, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8129292929292933, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26655228758169935, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "codicil-to-will",
    name: "Codicil to Will",
    seoTitle: "Free Codicil to Will Template",
    description:
      "Formally amends one or more specific provisions of an existing, already-signed will without rewriting " +
      "the entire document.",
    useCase:
      "Use this when someone's existing will is otherwise still accurate but needs a small, defined change — " +
      "updating an executor, adjusting a specific gift, or removing an outdated provision — and a full new will " +
      "is not necessary. A codicil generally must be signed and witnessed with the same formalities required for " +
      "a will in the relevant state, so confirm and complete those requirements before relying on it, and keep " +
      "this document together with the original will it amends.",
    signerLabels: ["Testator", "Witness"],
    recurringCategory: "Will",
    pdfPath: "/free-templates/codicil-to-will.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2664019607843137, yFrac: 0.3314393939393941, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.426818181818182, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.26655228758169935, yFrac: 0.4971212121212123, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5925000000000002, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "simple-will-small-estate",
    name: "Simple Will for Small Estate",
    seoTitle: "Free Simple Will for Small Estate Template",
    description:
      "A streamlined will for straightforward, modest estates — naming an executor and residuary beneficiaries " +
      "without trusts or complex specific-bequest planning.",
    useCase:
      "Use this when someone's affairs are relatively simple — a modest estate, few or no specific items to " +
      "single out, and a small number of beneficiaries — and a shorter, plain-language will covers their needs " +
      "without the complexity of trust planning or detailed tax provisions. For larger or more complicated " +
      "estates, blended families, or significant tax planning needs, a more detailed will or estate plan drafted " +
      "with an attorney is usually appropriate instead. Wills must be signed and witnessed according to the " +
      "formalities of the state where the Testator lives, so confirm and complete those requirements before " +
      "relying on this document.",
    signerLabels: ["Testator", "Witness"],
    recurringCategory: "Will",
    pdfPath: "/free-templates/simple-will-small-estate.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2664019607843137, yFrac: 0.6023989898989902, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.697777777777778, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26655228758169935, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "durable-power-of-attorney",
    name: "Durable Power of Attorney",
    seoTitle: "Free Durable Power of Attorney Template",
    description:
      "Grants an agent broad, ongoing authority over the principal's financial and legal affairs that " +
      "explicitly continues even if the principal later becomes incapacitated.",
    useCase:
      "Use this when someone wants a trusted agent to be able to keep managing their banking, property, and " +
      "other financial affairs specifically if they become incapacitated — not just while they are able to " +
      "supervise the agent themselves. This differs from a general or limited power of attorney, which may lapse " +
      "on incapacity unless durability language like this is included. Durable powers of attorney often require " +
      "notarization, and some financial institutions require specific statutory language, so confirm the rules " +
      "that apply where the Principal lives before relying on this document.",
    signerLabels: ["Principal", "Agent"],
    recurringCategory: "Power of Attorney",
    pdfPath: "/free-templates/durable-power-of-attorney.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27205800653594775, yFrac: 0.7303030303030307, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8256818181818185, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2488325163398693, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "limited-power-of-attorney",
    name: "Limited Power of Attorney",
    seoTitle: "Free Limited Power of Attorney Template",
    description:
      "Grants an agent authority for one specific, described transaction or task only, ending automatically " +
      "once that matter is complete.",
    useCase:
      "Use this when someone needs help with a single defined matter — signing closing documents on a real " +
      "estate sale, picking up a title, handling one specific account — and does not want to hand over ongoing " +
      "or general authority. Unlike a durable power of attorney, this limited grant is not intended to survive " +
      "the Principal's incapacity unless stated otherwise. Some transactions (such as real estate or vehicle " +
      "title transfers) require the document to be notarized before it will be accepted, so confirm the " +
      "notarization rules that apply to the specific transaction and state before relying on it.",
    signerLabels: ["Principal", "Agent"],
    recurringCategory: "Power of Attorney",
    pdfPath: "/free-templates/limited-power-of-attorney.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27205800653594775, yFrac: 0.4340909090909093, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5294696969696973, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2488325163398693, yFrac: 0.5997727272727276, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6951515151515154, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "medical-power-of-attorney",
    name: "Medical Power of Attorney (Healthcare Proxy)",
    seoTitle: "Free Medical Power of Attorney Template",
    description:
      "Appoints a healthcare agent to make medical treatment decisions for the principal if the principal " +
      "becomes unable to make or communicate those decisions personally.",
    useCase:
      "Use this when someone wants to name a specific person to make healthcare decisions on their behalf if " +
      "they become incapacitated, rather than only stating their own treatment wishes as in a living will — the " +
      "two documents work well together, with the living will guiding the agent named here. This authority is " +
      "limited to healthcare decisions and does not cover financial or legal matters. Many states have specific " +
      "witnessing, notarization, or statutory-form requirements for healthcare proxies, so confirm and complete " +
      "the formalities that apply where the Principal lives before relying on this document.",
    signerLabels: ["Principal", "Agent"],
    recurringCategory: "Power of Attorney",
    pdfPath: "/free-templates/medical-power-of-attorney.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27205800653594775, yFrac: 0.6593434343434347, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7547222222222225, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2488325163398693, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "convertible-promissory-note",
    name: "Convertible Promissory Note",
    seoTitle: "Free Convertible Promissory Note Template",
    description:
      "Documents a loan from an investor to a company that converts into equity at a future qualified financing " +
      "round, or is repaid at maturity if no conversion occurs.",
    useCase:
      "Use this when an early-stage company is raising a bridge loan from an investor ahead of a priced equity " +
      "round, and the parties want the loan to convert into shares of that future round (typically at a discount " +
      "and/or subject to a valuation cap) rather than being repaid in cash. This is a starting draft only, not tax " +
      "or securities-law advice — convertible notes implicate securities law, cap table math, and tax treatment " +
      "that vary by jurisdiction and by round terms, so have a lawyer or accountant review the final terms before " +
      "any money changes hands or any note is signed.",
    signerLabels: ["Company", "Investor"],
    recurringCategory: "Funding",
    pdfPath: "/free-templates/convertible-promissory-note.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.2798562091503268, yFrac: 0.2401515151515152, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3355303030303032, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26572549019607844, yFrac: 0.4058333333333335, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.5012121212121214, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "loan-modification-agreement",
    name: "Loan Modification Agreement",
    seoTitle: "Free Loan Modification Agreement Template",
    description:
      "Amends the interest rate, term, or payment schedule of an existing loan between a lender and a borrower.",
    useCase:
      "Use this when a lender and borrower already have a loan in place and want to formally change its terms — " +
      "for example, lowering the interest rate, extending the repayment period, or resetting the payment " +
      "schedule — instead of writing a brand-new loan. This is a starting draft only, not tax or legal advice; " +
      "loan modifications can have tax and lien-priority consequences, so have a lawyer or accountant review the " +
      "final terms before signing, especially for larger or secured loans.",
    signerLabels: ["Lender", "Borrower"],
    recurringCategory: "Funding",
    pdfPath: "/free-templates/loan-modification-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.25822794117647063, yFrac: 0.683585858585859, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7789646464646468, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.27547794117647056, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "line-of-credit-agreement",
    name: "Line of Credit Agreement",
    seoTitle: "Free Line of Credit Agreement Template",
    description:
      "Sets up a revolving credit arrangement letting a borrower draw funds up to a set limit and repay over time, " +
      "with interest on the outstanding balance.",
    useCase:
      "Use this when a lender agrees to make funds available to a borrower on a revolving basis — up to a fixed " +
      "credit limit, with draws and repayments over time — rather than a single lump-sum loan. This is a starting " +
      "draft only, not legal or tax advice; revolving credit arrangements can raise lending-license and interest-" +
      "rate-limit issues that vary by jurisdiction, so have a lawyer review the final terms before signing.",
    signerLabels: ["Lender", "Borrower"],
    recurringCategory: "Funding",
    pdfPath: "/free-templates/line-of-credit-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.25822794117647063, yFrac: 0.7354797979797985, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8308585858585863, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.27547794117647056, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "simple-investment-agreement",
    name: "Investment Agreement (Simple)",
    seoTitle: "Free Simple Investment Agreement Template",
    description:
      "Documents a straightforward cash investment into a company in exchange for equity or a defined interest, " +
      "with basic investor representations.",
    useCase:
      "Use this for a simple, smaller, or early-stage investment where an investor is putting cash into a " +
      "company in exchange for equity or another defined interest, and a full stock purchase agreement would be " +
      "more than the transaction needs. This is a starting draft only, not tax or securities-law advice — issuing " +
      "equity in exchange for investment triggers securities-law requirements that vary by jurisdiction and " +
      "investor type, so have a lawyer and accountant review the final terms before any money changes hands.",
    signerLabels: ["Company", "Investor"],
    recurringCategory: "Funding",
    pdfPath: "/free-templates/simple-investment-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.5253787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6207575757575761, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.26572549019607844, yFrac: 0.6910606060606064, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7864393939393942, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "founder-vesting-agreement",
    name: "Founder Vesting Agreement",
    seoTitle: "Free Founder Vesting Agreement Template",
    description:
      "Puts a founder's existing shares on a vesting schedule, with a cliff and company repurchase right over " +
      "unvested shares if the founder leaves early.",
    useCase:
      "Use this when co-founders want to subject shares a founder already holds (or is being issued as a " +
      "founder) to a vesting schedule — often called reverse vesting — so that shares are earned over time and " +
      "the company can repurchase unvested shares if the founder departs early. This is a starting draft only, " +
      "not tax or securities-law advice; vesting arrangements can have significant tax consequences (including " +
      "possible 83(b) election deadlines) and securities-law implications, so have a lawyer or accountant review " +
      "the final terms before signing.",
    signerLabels: ["Company", "Founder"],
    recurringCategory: "Equity",
    pdfPath: "/free-templates/founder-vesting-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.5659090909090913, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6612878787878791, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.26914542483660125, yFrac: 0.7315909090909095, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8269696969696974, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "stock-transfer-agreement",
    name: "Stock Transfer Agreement",
    seoTitle: "Free Stock Transfer Agreement Template",
    description:
      "Documents one shareholder's sale or transfer of existing shares to another person, including any company " +
      "or board consent required for the transfer.",
    useCase:
      "Use this when an existing shareholder is selling or otherwise transferring their own shares to another " +
      "person or entity — a secondary transfer — rather than the company issuing new shares. This is a starting " +
      "draft only, not tax or securities-law advice; secondary transfers can be subject to the company's own " +
      "transfer restrictions, rights of first refusal, and securities-law limits, so have a lawyer or accountant " +
      "review the final terms before closing.",
    signerLabels: ["Transferor", "Transferee"],
    recurringCategory: "Equity",
    pdfPath: "/free-templates/stock-transfer-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2833888888888889, yFrac: 0.6380050505050509, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7333838383838387, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.28757924836601306, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "equity-buy-sell-agreement",
    name: "Buy-Sell Agreement (Equity)",
    seoTitle: "Free Equity Buy-Sell Agreement Template",
    description:
      "Sets out what happens to a shareholder's equity on death, disability, or exit, including a right of first " +
      "refusal and a method for valuing the shares.",
    useCase:
      "Use this when co-owners of a company want a signed agreement in advance governing what happens to a " +
      "shareholder's equity if they die, become disabled, or want to sell — including a right of first refusal " +
      "for the remaining owner and an agreed way to value the shares. This is a starting draft only, not tax or " +
      "legal advice; buy-sell arrangements interact with estate planning, insurance funding, and securities law " +
      "in ways that vary by jurisdiction, so have a lawyer and accountant review the final terms before signing.",
    signerLabels: ["Shareholder A", "Shareholder B"],
    recurringCategory: "Equity",
    pdfPath: "/free-templates/equity-buy-sell-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.319843137254902, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.319843137254902, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "personal-property-bill-of-sale",
    name: "Personal Property Bill of Sale",
    seoTitle: "Free Personal Property Bill of Sale Template",
    description: "Documents the sale of everyday personal items, like furniture, electronics, or a used vehicle, between two individuals.",
    useCase:
      "Use this when you're selling or buying a used item directly with another person, such as a car, appliance, or " +
      "piece of furniture, and want a signed record of the price, condition, and terms of the sale.",
    signerLabels: ["Seller", "Buyer"],
    recurringCategory: "Personal Property",
    pdfPath: "/free-templates/personal-property-bill-of-sale.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.24776143790849672, yFrac: 0.6073232323232326, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7027020202020204, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.248437908496732, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "pet-custody-care-agreement",
    name: "Pet Custody and Care Agreement",
    seoTitle: "Free Pet Custody and Care Agreement Template",
    description: "Sets out a custody schedule, expense split, and care responsibilities for a pet shared by two people.",
    useCase:
      "Use this when co-owners, former partners, or roommates need a clear, signed agreement on who cares for a " +
      "shared pet, on what schedule, and who covers which expenses.",
    signerLabels: ["Party A", "Party B"],
    recurringCategory: "Personal Property",
    pdfPath: "/free-templates/pet-custody-care-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.26134722222222223, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26134722222222223, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "personal-property-storage-agreement",
    name: "Personal Property Storage Agreement",
    seoTitle: "Free Personal Property Storage Agreement Template",
    description: "Covers what's being stored, for how long, any fee, and liability when one person stores belongings at another person's property.",
    useCase:
      "Use this when someone is keeping personal belongings at a friend's, family member's, or acquaintance's home " +
      "or property (not a commercial storage facility) and both sides want clear terms on duration, fees, and " +
      "responsibility for the items.",
    signerLabels: ["Owner", "Storage Provider"],
    recurringCategory: "Personal Property",
    pdfPath: "/free-templates/personal-property-storage-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.25507107843137256, yFrac: 0.6125000000000003, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7078787878787881, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.34025, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "property-management-agreement",
    name: "Property Management Agreement",
    seoTitle: "Free Property Management Agreement Template",
    description: "Sets out the terms under which a property manager collects rent, handles maintenance, and manages tenant relations on behalf of an owner.",
    useCase:
      "Use this when a property owner is hiring a property manager or management company to run day-to-day " +
      "operations of a rental property, rather than leasing space directly to a tenant.",
    signerLabels: ["Property Owner", "Property Manager"],
    recurringCategory: "Real Estate",
    pdfPath: "/free-templates/property-management-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.33205718954248364, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.3508668300653595, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "room-rental-agreement",
    name: "Room Rental Agreement",
    seoTitle: "Free Room Rental Agreement Template",
    description: "Covers rent, house rules, and access terms when a landlord rents out a single room within a larger property.",
    useCase:
      "Use this when you own or lease an entire property and want to rent out one room to a tenant, and need signed " +
      "terms covering rent, shared spaces, and house rules.",
    signerLabels: ["Landlord", "Tenant"],
    recurringCategory: "Real Estate",
    pdfPath: "/free-templates/room-rental-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.27284722222222224, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2559730392156863, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "remote-work-equipment-agreement",
    name: "Remote Work Equipment Agreement",
    seoTitle: "Free Remote Work Equipment Agreement Template",
    description: "Documents the condition, use, and return terms for company equipment issued to a remote employee.",
    useCase:
      "Use this when issuing a laptop, monitor, or other equipment to a remote employee and want a signed record of " +
      "what was provided, how it may be used, and each side's responsibility if it's lost or damaged.",
    signerLabels: ["Employer", "Employee"],
    recurringCategory: "Employment",
    pdfPath: "/free-templates/remote-work-equipment-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27814624183006537, yFrac: 0.6948232323232327, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7902020202020206, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2823366013071895, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "performance-improvement-plan-acknowledgment",
    name: "Performance Improvement Plan Acknowledgment",
    seoTitle: "Free Performance Improvement Plan Acknowledgment Template",
    description: "Confirms that an employee has received and reviewed a formal performance improvement plan, including goals and a review timeline.",
    useCase:
      "Use this after presenting an employee with a performance improvement plan, to create a signed record that " +
      "they received and reviewed the plan's goals, support, and timeline.",
    signerLabels: ["Employer", "Employee"],
    recurringCategory: "Employment",
    pdfPath: "/free-templates/performance-improvement-plan-acknowledgment.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27814624183006537, yFrac: 0.5608585858585862, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.656237373737374, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2823366013071895, yFrac: 0.7265404040404044, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8219191919191923, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "bylaws-adoption-resolution",
    name: "Bylaws Adoption Resolution",
    seoTitle: "Free Bylaws Adoption Resolution Template",
    description: "A director-signed resolution formally adopting a corporation's bylaws as its governing rules.",
    useCase:
      "Use this when a corporation's board wants a signed, dated record that a specific set of bylaws has been " +
      "reviewed and formally adopted as the company's internal governance rules — distinct from a general " +
      "corporate resolution used for one-off business decisions.",
    signerLabels: ["President", "Secretary"],
    recurringCategory: "Incorporation",
    pdfPath: "/free-templates/bylaws-adoption-resolution.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2791045751633987, yFrac: 0.4654040404040406, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5607828282828284, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2807017973856209, yFrac: 0.6310858585858587, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7264646464646466, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "operating-agreement-amendment",
    name: "Operating Agreement Amendment",
    seoTitle: "Free Operating Agreement Amendment Template",
    description: "A signed amendment modifying specific provisions of an existing LLC operating agreement.",
    useCase:
      "Use this when an LLC's members need to change one or more terms of their existing operating agreement — " +
      "such as ownership percentages, management structure, or distribution rules — while keeping every other " +
      "provision of the original agreement in force.",
    signerLabels: ["Member A", "Member B"],
    recurringCategory: "Incorporation",
    pdfPath: "/free-templates/operating-agreement-amendment.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2863954248366013, yFrac: 0.48573232323232346, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5811111111111114, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2863954248366013, yFrac: 0.6514141414141417, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7467929292929295, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "buy-sell-agreement",
    name: "LLC/Corporation Buy-Sell Agreement",
    seoTitle: "Free LLC/Corporation Buy-Sell Agreement Template",
    description: "A company-level agreement governing what happens to an owner's interest upon death, disability, divorce, or exit.",
    useCase:
      "Use this when the owners of an LLC or corporation want a signed plan for handling ownership transfers " +
      "triggered by a member's death, permanent disability, divorce, bankruptcy, or voluntary exit — including a " +
      "right of first refusal and an agreed method for valuing the departing owner's interest.",
    signerLabels: ["Member A", "Member B"],
    recurringCategory: "Incorporation",
    pdfPath: "/free-templates/buy-sell-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.2863954248366013, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2863954248366013, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "code-of-conduct-acknowledgment",
    name: "Code of Conduct Acknowledgment",
    seoTitle: "Free Code of Conduct Acknowledgment Template",
    description: "A signed record that an employee received, read, and agreed to follow the company's code of conduct.",
    useCase:
      "Use this when onboarding a new employee or rolling out an updated code of conduct, to create a signed, " +
      "dated record that the employee received the policy and agreed to comply with it.",
    signerLabels: ["Company", "Employee"],
    recurringCategory: "Compliance Documents",
    pdfPath: "/free-templates/code-of-conduct-acknowledgment.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.29078282828282837, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.38616161616161626, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2823366013071895, yFrac: 0.4564646464646466, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5518434343434345, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "data-breach-notification-acknowledgment",
    name: "Data Breach Notification Acknowledgment",
    seoTitle: "Free Data Breach Notification Acknowledgment Template",
    description: "A formal signed notice to an affected individual or partner describing a data breach and confirming receipt.",
    useCase:
      "Use this to formally notify an affected individual or business partner that a data security incident " +
      "occurred, describe what happened and what the company is doing about it, and obtain a signed " +
      "acknowledgment that the notice was received.",
    signerLabels: ["Company", "Recipient"],
    recurringCategory: "Compliance Documents",
    pdfPath: "/free-templates/data-breach-notification-acknowledgment.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.46287878787878806, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.558257575757576, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.27805228758169936, yFrac: 0.6285606060606063, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7239393939393941, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "whistleblower-policy-acknowledgment",
    name: "Whistleblower Policy Acknowledgment",
    seoTitle: "Free Whistleblower Policy Acknowledgment Template",
    description: "A signed record that an employee received and understands the company's whistleblower policy.",
    useCase:
      "Use this when onboarding a new employee or rolling out an updated whistleblower policy, to create a " +
      "signed, dated record that the employee understands how to report concerns and knows they are protected " +
      "from retaliation for reporting in good faith.",
    signerLabels: ["Company", "Employee"],
    recurringCategory: "Compliance Documents",
    pdfPath: "/free-templates/whistleblower-policy-acknowledgment.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.3731060606060608, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.46848484848484867, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2823366013071895, yFrac: 0.5387878787878789, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6341666666666669, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "trademark-license-agreement",
    name: "Trademark License Agreement",
    seoTitle: "Free Trademark License Agreement Template",
    description: "Grants another party permission to use a trademark, brand name, or logo under specific terms.",
    useCase:
      "Use this when a brand owner wants to let another business or individual use their trademark, name, or logo — " +
      "for merchandise, franchising, co-branding, or resale — while keeping control over how the mark is used and " +
      "protecting the underlying goodwill.",
    signerLabels: ["Licensor", "Licensee"],
    recurringCategory: "Intellectual Property",
    pdfPath: "/free-templates/trademark-license-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27074264705882356, yFrac: 0.6744949494949498, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7698737373737377, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2749330065359477, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "work-made-for-hire-agreement",
    name: "Work Made for Hire Agreement",
    seoTitle: "Free Work Made for Hire Agreement Template",
    description: "Confirms upfront that work a contractor creates for a company belongs to the company from the moment it is made.",
    useCase:
      "Use this before or during a freelance or contractor engagement to establish, in advance, that any work the " +
      "contractor creates as part of the project will belong to the hiring company as a work made for hire — with " +
      "a backup assignment clause in case work-for-hire status doesn't apply under law. This is different from a " +
      "copyright assignment, which transfers rights to a work that already exists.",
    signerLabels: ["Company", "Creator"],
    recurringCategory: "Intellectual Property",
    pdfPath: "/free-templates/work-made-for-hire-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.43750000000000017, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5328787878787881, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.26238071895424836, yFrac: 0.6031818181818184, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6985606060606062, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "patent-assignment-agreement",
    name: "Patent Assignment Agreement",
    seoTitle: "Free Patent Assignment Agreement Template",
    description: "Transfers ownership of a patent or patent application from an inventor or owner to another party.",
    useCase:
      "Use this when an inventor or current patent owner is selling or otherwise transferring full ownership of a " +
      "patent or pending patent application to a company or another individual, including the related rights to " +
      "enforce or license the patent going forward.",
    signerLabels: ["Assignor", "Assignee"],
    recurringCategory: "Intellectual Property",
    pdfPath: "/free-templates/patent-assignment-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27282843137254903, yFrac: 0.4440656565656568, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5394444444444447, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.27701879084967324, yFrac: 0.609747474747475, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7051262626262628, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "ip-licensing-agreement",
    name: "IP Licensing Agreement",
    seoTitle: "Free IP Licensing Agreement Template",
    description: "A general-purpose license for using intellectual property such as software, content, or a process owned by another party.",
    useCase:
      "Use this when licensing intellectual property that isn't specifically a trademark or a patent — for " +
      "example software, written or creative content, a proprietary process, or know-how — and the arrangement " +
      "needs a clear scope of use, fee structure, and term.",
    signerLabels: ["Licensor", "Licensee"],
    recurringCategory: "Intellectual Property",
    pdfPath: "/free-templates/ip-licensing-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.27074264705882356, yFrac: 0.5973484848484851, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.692727272727273, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.2749330065359477, yFrac: 0.7630303030303034, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8584090909090912, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "vendor-non-disclosure-agreement",
    name: "Vendor Non-Disclosure Agreement",
    seoTitle: "Free Vendor Non-Disclosure Agreement Template",
    description: "A one-way NDA for sharing confidential information with a vendor or supplier before or during a business relationship.",
    useCase:
      "Use this when a company needs to share specifications, pricing, business plans, or other confidential " +
      "information with a potential or existing vendor or supplier as part of a procurement process, and wants " +
      "that information protected.",
    signerLabels: ["Company", "Vendor"],
    recurringCategory: "Non-Disclosure",
    pdfPath: "/free-templates/vendor-non-disclosure-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.2798562091503268, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.25881045751633985, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "multi-party-non-disclosure-agreement",
    name: "Multi-Party Non-Disclosure Agreement",
    seoTitle: "Free Multi-Party Non-Disclosure Agreement Template",
    description: "A confidentiality agreement for three or more parties who each owe confidentiality obligations to one another.",
    useCase:
      "Use this when several companies or individuals — for example partners in a joint venture, collaborators " +
      "on a project, or parties to a multi-way negotiation — will each be sharing confidential information with " +
      "the others and all need to be bound by the same mutual confidentiality obligations.",
    signerLabels: ["Party A", "Party B"],
    recurringCategory: "Non-Disclosure",
    pdfPath: "/free-templates/multi-party-non-disclosure-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.26134722222222223, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26134722222222223, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
);

FREE_TEMPLATES.push(
  {
    slug: "web-design-services-agreement",
    name: "Web Design Services Agreement",
    seoTitle: "Free Web Design Services Agreement Template",
    description: "Covers design deliverables, revision rounds, ownership handoff on payment, and what's excluded (hosting, domain).",
    useCase:
      "Use this when a freelance or agency designer is building website mockups and design assets for a client, " +
      "separate from any development or ongoing hosting work.",
    signerLabels: ["Client", "Designer"],
    recurringCategory: "Consulting",
    pdfPath: "/free-templates/web-design-services-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.24776143790849672, yFrac: 0.3111111111111112, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.4064898989898991, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2749142156862745, yFrac: 0.47679292929292943, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.5721717171717173, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "web-development-agreement",
    name: "Web Development Agreement",
    seoTitle: "Free Web Development Agreement Template",
    description: "Covers scope, tech stack, testing/acceptance, post-launch support window, and source code ownership.",
    useCase:
      "Use this when a freelance or agency developer is building and deploying a website or web application for a " +
      "client, distinct from the design work itself.",
    signerLabels: ["Client", "Developer"],
    recurringCategory: "Consulting",
    pdfPath: "/free-templates/web-development-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.24776143790849672, yFrac: 0.3314393939393941, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.426818181818182, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.28432843137254904, yFrac: 0.4971212121212123, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.5925000000000002, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "wedding-photography-contract",
    name: "Wedding Photography Contract",
    seoTitle: "Free Wedding Photography Contract Template",
    description: "Covers event details, coverage hours, deliverables, retainer/cancellation terms, and portfolio-use consent.",
    useCase:
      "Use this when booking wedding photography services, to set clear expectations on coverage, delivery " +
      "timeline, and what happens if either side needs to reschedule.",
    signerLabels: ["Client", "Photographer"],
    recurringCategory: "Consulting",
    pdfPath: "/free-templates/wedding-photography-contract.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.24776143790849672, yFrac: 0.2604797979797981, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.35585858585858604, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.31320996732026146, yFrac: 0.42616161616161635, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.5215404040404042, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "photography-services-agreement",
    name: "Photography Services Agreement",
    seoTitle: "Free Photography Services Agreement Template",
    description: "Covers session details, usage rights granted to the client, and the photographer's portfolio rights.",
    useCase:
      "Use this for portrait, commercial, or product photography sessions where you need to spell out who can use " +
      "the final images and for what purposes.",
    signerLabels: ["Client", "Photographer"],
    recurringCategory: "Consulting",
    pdfPath: "/free-templates/photography-services-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.24776143790849672, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.31320996732026146, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "model-release-form",
    name: "Model Release Form",
    seoTitle: "Free Model Release Form Template",
    description: "Grants a photographer rights to use a model's likeness, with permitted-use scope and minor-consent option.",
    useCase:
      "Use this whenever a photographer or videographer needs written permission to use someone's image or " +
      "likeness — for commercial, editorial, portfolio, or social media use.",
    signerLabels: ["Photographer", "Model"],
    recurringCategory: "Intellectual Property",
    pdfPath: "/free-templates/model-release-form.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.31320996732026146, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.25089950980392156, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "website-terms-of-service-acknowledgment",
    name: "Website Terms of Service Acknowledgment",
    seoTitle: "Free Terms of Service Acknowledgment Template",
    description: "A short cover document where a user formally confirms they've read and agreed to your published Terms of Service.",
    useCase:
      "Use this when you want a signed, dated record that a specific user accepted your Terms of Service — this " +
      "doesn't replace your actual Terms of Service, which you publish separately.",
    signerLabels: ["Company", "User"],
    recurringCategory: "Compliance Documents",
    pdfPath: "/free-templates/website-terms-of-service-acknowledgment.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.5060606060606063, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6014393939393942, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.23939950980392155, yFrac: 0.6717424242424245, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7671212121212123, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "acceptable-use-policy-acknowledgment",
    name: "Acceptable Use Policy Acknowledgment",
    seoTitle: "Free Acceptable Use Policy Acknowledgment Template",
    description: "A short cover document where a user confirms they've read and will comply with your Acceptable Use Policy.",
    useCase:
      "Use this when you want a signed record that a user acknowledged the rules governing what they may and may " +
      "not do with your service, before granting or continuing access.",
    signerLabels: ["Company", "User"],
    recurringCategory: "Compliance Documents",
    pdfPath: "/free-templates/acceptable-use-policy-acknowledgment.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2798562091503268, yFrac: 0.5263888888888891, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6217676767676771, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.23939950980392155, yFrac: 0.6920707070707074, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7874494949494952, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "proprietary-information-and-inventions-agreement",
    name: "Proprietary Information and Inventions Agreement (PIIA)",
    seoTitle: "Free PIIA (Invention Assignment Agreement) Template",
    description: "Standard new-hire agreement assigning work-related inventions to the company, with a prior-inventions carve-out.",
    useCase:
      "Use this when onboarding a new employee at a startup or company, to establish confidentiality obligations " +
      "and assign ownership of inventions created during employment.",
    signerLabels: ["Company", "Employee"],
    recurringCategory: "Intellectual Property",
    pdfPath: "/free-templates/proprietary-information-and-inventions-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.2798562091503268, yFrac: 0.2604797979797981, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.35585858585858604, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2823366013071895, yFrac: 0.42616161616161635, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.5215404040404042, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "short-form-mutual-nda",
    name: "Short-Form Mutual NDA",
    seoTitle: "Free Short-Form Mutual NDA Template",
    description: "A lighter, faster one-pager NDA — just the essentials, for when a full mutual NDA is more than you need.",
    useCase:
      "Use this for a quick exploratory conversation or early-stage discussion where both sides need basic " +
      "confidentiality but don't want to negotiate a lengthy agreement.",
    signerLabels: ["Party A", "Party B"],
    recurringCategory: "Non-Disclosure",
    pdfPath: "/free-templates/short-form-mutual-nda.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.26134722222222223, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.26134722222222223, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "reference-letter",
    name: "Reference Letter",
    seoTitle: "Free Reference Letter Template",
    description: "A signed reference letter with fields for the relationship, duration known, and the recommendation itself.",
    useCase:
      "Use this to give a former employee, tenant, colleague, or contractor a signed, dated reference they can " +
      "share with whoever's asking.",
    signerLabels: ["Reference Provider"],
    recurringCategory: "Employment",
    pdfPath: "/free-templates/reference-letter.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.360750816993464, yFrac: 0.1275252525252525, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.2229040404040405, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
);

export function getFreeTemplate(slug: string): FreeTemplate | undefined {
  return FREE_TEMPLATES.find((t) => t.slug === slug);
}
