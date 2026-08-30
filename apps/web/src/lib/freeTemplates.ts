import type { DocField } from "./types";
import { LEGACY_BATCH_TEMPLATES } from "./freeTemplatesLegacyBatch";

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

  /** One-sentence formal definition of what this document is — distinct from `useCase`'s
   *  "when to use it" framing. Shown first, right under the title, so both search snippets and
   *  LLM answer engines get a clean definition to quote. Required on every new template. */
  definition?: string;
  /** The 3-6 clauses/sections this document's body actually covers, in plain language (not the
   *  legal section headings verbatim — a reader-facing paraphrase of each). Required on every
   *  new template. */
  keyClauses?: string[];
  /** Bracketed placeholders a user (or an LLM filling this in on their behalf) needs to
   *  personalize before sending, e.g. "[Party A Name]", "[Effective Date]". Required on every
   *  new template. */
  fillInFields?: string[];
  /** 2-3 sentence plain-language summary of what signing this document actually establishes —
   *  distinct from `keyClauses` (what's in it) and `definition` (what it is). Required on every
   *  new template. */
  legalSummary?: string;
  /** Ready-made prompts surfaced to a reader for pasting into an LLM assistant, e.g. "Generate a
   *  filled NDA using this template for a freelancer in Germany." 2-3 per template. Required on
   *  every new template. */
  chatgptPrompts?: string[];
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
    definition:
      "A mutual non-disclosure agreement (NDA) is a contract in which two or more parties each agree " +
      "to keep the other's confidential information private and use it only for an agreed purpose.",
    keyClauses: [
      "Definition of confidential information",
      "Obligations of both receiving parties",
      "Permitted use and exclusions from confidentiality",
      "Duration of confidentiality obligations",
      "Return or destruction of confidential materials",
      "Remedies for unauthorized disclosure",
    ],
    fillInFields: [
      "[Party A Name]",
      "[Party B Name]",
      "[Effective Date]",
      "[Purpose of Disclosure]",
      "[Confidentiality Term Length]",
      "[Governing State/Jurisdiction]",
      "[Signatory Titles]",
    ],
    legalSummary:
      "Signing a mutual NDA legally obligates each party to protect the other's designated " +
      "confidential information from disclosure to third parties and to use it only for the stated " +
      "business purpose. It typically remains in effect for a set period after signing, and breach can " +
      "expose sensitive information or create liability, damages, or grounds for injunctive relief.",
    chatgptPrompts: [
      "Generate a filled Mutual NDA using this template for two startups discussing a potential partnership.",
      "Explain what information this Mutual NDA does and doesn't cover before I share our product roadmap.",
      "Compare this Mutual NDA's confidentiality term to typical terms used in early-stage vendor discussions.",
    ],
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
    definition:
      "An independent contractor agreement is a contract that establishes the terms under which a " +
      "business engages a self-employed individual or company to perform specified work without " +
      "creating an employment relationship.",
    keyClauses: [
      "Scope of work and deliverables",
      "Payment terms and invoicing schedule",
      "Independent contractor status (not employee) disclaimer",
      "Ownership of work product and intellectual property",
      "Confidentiality obligations",
      "Termination conditions",
    ],
    fillInFields: [
      "[Company Name]",
      "[Contractor Name]",
      "[Description of Services]",
      "[Payment Rate/Amount]",
      "[Payment Schedule]",
      "[Start Date]",
      "[Term/End Date]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "This agreement legally establishes that the contractor is self-employed and responsible for " +
      "their own taxes and benefits, rather than an employee entitled to employer-provided " +
      "protections. It defines what work must be delivered, how and when payment is made, and " +
      "typically assigns ownership of the resulting work product to the hiring company once payment is " +
      "complete.",
    chatgptPrompts: [
      "Generate a filled Independent Contractor Agreement for a freelance software developer building a website.",
      "Explain the key risks in this Independent Contractor Agreement before I sign it as the contractor.",
      "Adjust this Independent Contractor Agreement's IP ownership clause for a contractor who wants to retain rights to reusable code.",
    ],
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
    definition:
      "An offer letter is a written document from an employer to a prospective employee that confirms " +
      "the job title, compensation, and terms being offered before formal employment begins.",
    keyClauses: [
      "Job title and reporting structure",
      "Compensation and benefits summary",
      "Start date and work location",
      "At-will employment statement",
      "Contingencies (background check, references)",
      "Acceptance deadline",
    ],
    fillInFields: [
      "[Candidate Name]",
      "[Job Title]",
      "[Start Date]",
      "[Salary/Compensation Amount]",
      "[Reporting Manager]",
      "[Work Location]",
      "[Offer Expiration Date]",
    ],
    legalSummary:
      "Signing an offer letter confirms the candidate's acceptance of the stated job title, pay, and " +
      "start date, and generally establishes an at-will employment relationship rather than a " +
      "fixed-term contract. It is usually not a comprehensive employment contract, so detailed " +
      "policies and benefits are often addressed in separate documents.",
    chatgptPrompts: [
      "Generate a filled Offer Letter for a full-time marketing coordinator role.",
      "Explain the difference between this Offer Letter and a full employment contract.",
      "Adapt this Offer Letter for a part-time remote position.",
    ],
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
    definition:
      "A remote work policy is a written document outlining an employer's expectations and rules for " +
      "employees who work outside a traditional office setting.",
    keyClauses: [
      "Eligibility and work hours expectations",
      "Availability and communication requirements",
      "Equipment and technology provisions",
      "Data security and confidentiality practices",
      "Workspace and safety expectations",
      "Acknowledgment of policy compliance",
    ],
    fillInFields: [
      "[Employee Name]",
      "[Company Name]",
      "[Effective Date]",
      "[Core Work Hours]",
      "[Approved Remote Work Location]",
      "[Equipment Provided]",
      "[Manager/Supervisor Name]",
    ],
    legalSummary:
      "Signing this policy creates a documented record that the employee has read and agreed to the " +
      "employer's expectations for remote work, including availability, security, and equipment use. " +
      "It does not itself create new employment terms, but a signed acknowledgment can support the " +
      "employer's ability to enforce these expectations and address violations.",
    chatgptPrompts: [
      "Generate a filled Remote Work Policy for a 20-person hybrid company.",
      "Suggest security clauses to add to this Remote Work Policy for employees handling customer data.",
      "Explain what obligations this Remote Work Policy creates for employees working from home.",
    ],
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
    definition:
      "A freelance service agreement is a contract between a client and an independent freelancer that " +
      "defines the scope of a project, payment terms, and ownership of the resulting deliverables.",
    keyClauses: [
      "Project scope and deliverables",
      "Payment terms and schedule",
      "Revision policy",
      "Ownership and transfer of final work",
      "Confidentiality",
      "Termination and kill fee provisions",
    ],
    fillInFields: [
      "[Client Name]",
      "[Freelancer Name]",
      "[Project Description]",
      "[Deliverables]",
      "[Fee Amount]",
      "[Payment Schedule]",
      "[Number of Revisions Included]",
      "[Project Deadline]",
    ],
    legalSummary:
      "This agreement legally defines what the freelancer must deliver, when, and for how much, and " +
      "typically specifies that ownership of the final work transfers to the client only upon full " +
      "payment. It also sets expectations around revisions and what happens if either party ends the " +
      "project before completion.",
    chatgptPrompts: [
      "Generate a filled Freelance Service Agreement for a logo design project.",
      "Explain how the revision limit in this Freelance Service Agreement protects the freelancer.",
      "Adapt this Freelance Service Agreement for an ongoing content writing engagement instead of a one-time project.",
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
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Non-Disclosure",
    definition:
      "A unilateral (one-way) non-disclosure agreement is a contract in which only one party discloses " +
      "confidential information and only the receiving party is bound to keep it confidential.",
    keyClauses: [
      "Definition of confidential information",
      "Receiving party's confidentiality obligations",
      "Permitted use and exclusions",
      "Duration of confidentiality",
      "Return or destruction of materials",
      "Remedies for breach",
    ],
    fillInFields: [
      "[Disclosing Party Name]",
      "[Receiving Party Name]",
      "[Effective Date]",
      "[Purpose of Disclosure]",
      "[Confidentiality Term Length]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "Signing a one-way NDA legally obligates only the receiving party to protect and limit the use " +
      "of information shared by the disclosing party. The disclosing party takes on no reciprocal " +
      "confidentiality duty, since the agreement assumes information flows in one direction only.",
    chatgptPrompts: [
      "Generate a filled One-Way NDA for sharing financial information with a potential investor.",
      "Explain why a One-Way NDA is more appropriate than a Mutual NDA for interviewing a job candidate.",
      "Review this One-Way NDA and flag any terms that seem one-sided against the receiving party.",
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
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Real Estate",
    definition:
      "A commercial lease agreement is a contract that grants a business tenant the right to occupy " +
      "and use a landlord's property for business purposes in exchange for rent.",
    keyClauses: [
      "Description of leased premises",
      "Rent amount and payment terms",
      "Lease term and renewal options",
      "Security deposit terms",
      "Maintenance and repair responsibilities",
      "Permitted use of premises",
    ],
    fillInFields: [
      "[Landlord Name]",
      "[Tenant Name]",
      "[Property Address]",
      "[Monthly Rent Amount]",
      "[Lease Start Date]",
      "[Lease End Date]",
      "[Security Deposit Amount]",
      "[Permitted Use of Space]",
    ],
    legalSummary:
      "This lease legally grants the tenant the right to occupy and use the specified commercial space " +
      "for the stated term in exchange for rent, while defining who is responsible for maintenance and " +
      "repairs. It also sets out the conditions under which the deposit is held or returned and how " +
      "the lease may end or renew.",
    chatgptPrompts: [
      "Generate a filled Simple Commercial Lease Agreement for a small retail storefront.",
      "Explain the maintenance responsibilities this Commercial Lease Agreement assigns to the tenant versus the landlord.",
      "Adapt this Commercial Lease Agreement for a shared co-working office space.",
    ],
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
    definition:
      "A non-compete and non-solicitation agreement is a contract that restricts a former employee or " +
      "contractor from competing with a business or soliciting its clients and staff for a defined " +
      "period after leaving.",
    keyClauses: [
      "Definition of restricted activities",
      "Geographic scope of restriction",
      "Duration of restriction period",
      "Non-solicitation of clients and employees",
      "Confidentiality carryover obligations",
      "Remedies for violation",
    ],
    fillInFields: [
      "[Company Name]",
      "[Employee/Contractor Name]",
      "[Effective Date]",
      "[Restriction Period Length]",
      "[Geographic Scope]",
      "[Definition of Competing Business]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "Signing this agreement legally restricts the departing individual from engaging in specified " +
      "competing activities or soliciting the company's clients and employees for the agreed time " +
      "period and area. Enforceability of such restrictions can vary significantly depending on their " +
      "scope, so the specific limits set in the document matter.",
    chatgptPrompts: [
      "Generate a filled Non-Compete / Non-Solicitation Agreement for a departing sales employee.",
      "Explain what a reasonable geographic scope and duration might look like for this Non-Compete Agreement.",
      "Review this Non-Solicitation clause and flag anything that might be overly broad.",
    ],
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
    definition:
      "A consulting agreement is a contract that establishes the terms under which an independent " +
      "advisor provides ongoing strategic guidance or expertise to a business.",
    keyClauses: [
      "Scope of advisory services",
      "Fee structure and payment terms",
      "Confidentiality obligations",
      "Ownership of recommendations and work product",
      "Term and renewal",
      "Termination conditions",
    ],
    fillInFields: [
      "[Company Name]",
      "[Consultant Name]",
      "[Description of Advisory Services]",
      "[Fee/Retainer Amount]",
      "[Payment Schedule]",
      "[Term Length]",
      "[Termination Notice Period]",
    ],
    legalSummary:
      "This agreement legally defines the scope of ongoing advice or guidance the consultant will " +
      "provide and the compensation owed in exchange, distinguishing the relationship from employment. " +
      "It typically also establishes that recommendations, reports, or other work product produced " +
      "under the engagement belong to the hiring company.",
    chatgptPrompts: [
      "Generate a filled Consulting Agreement for a part-time business strategy advisor.",
      "Explain how this Consulting Agreement differs from an Independent Contractor Agreement.",
      "Adapt this Consulting Agreement for a consultant being paid a monthly retainer instead of hourly fees.",
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
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Sale and Purchase",
    definition:
      "A vendor agreement is a contract that sets out the terms under which a supplier provides goods " +
      "or services to a business on an ongoing or recurring basis.",
    keyClauses: [
      "Description of goods or services supplied",
      "Pricing and payment terms",
      "Delivery schedule and logistics",
      "Quality standards and inspection rights",
      "Term and renewal",
      "Termination and remedies for non-performance",
    ],
    fillInFields: [
      "[Buyer/Company Name]",
      "[Vendor Name]",
      "[Description of Goods/Services]",
      "[Pricing Terms]",
      "[Delivery Schedule]",
      "[Payment Terms]",
      "[Term Length]",
      "[Quality Standards]",
    ],
    legalSummary:
      "This agreement legally obligates the vendor to supply the specified goods or services at agreed " +
      "pricing and quality standards, and obligates the buyer to pay according to the agreed terms. It " +
      "also sets out delivery expectations and what recourse either party has if goods are late, " +
      "defective, or payment is missed.",
    chatgptPrompts: [
      "Generate a filled Vendor Agreement for a business purchasing packaging supplies on a monthly basis.",
      "Explain the quality standards and inspection rights in this Vendor Agreement.",
      "Adapt this Vendor Agreement for a vendor providing a recurring service rather than physical goods.",
    ],
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
    definition:
      "A separation agreement is a contract signed when an employee's employment ends that documents " +
      "final compensation, severance, and each party's remaining obligations.",
    keyClauses: [
      "Final pay and unused benefits",
      "Severance terms (if any)",
      "Return of company property",
      "Release of claims",
      "Confidentiality and non-disparagement",
      "Post-employment obligations (e.g., continuing NDA)",
    ],
    fillInFields: [
      "[Company Name]",
      "[Employee Name]",
      "[Separation Date]",
      "[Final Pay Amount]",
      "[Severance Amount]",
      "[Benefits Continuation Details]",
      "[Company Property to be Returned]",
    ],
    legalSummary:
      "Signing this agreement legally documents the terms of an employee's departure, including any " +
      "final pay or severance owed, and often includes the employee's release of legal claims against " +
      "the employer in exchange for the agreed compensation. It also typically confirms ongoing " +
      "obligations that survive employment, such as confidentiality.",
    chatgptPrompts: [
      "Generate a filled Separation Agreement for an employee being laid off with two weeks of severance.",
      "Explain what a release of claims in this Separation Agreement means for the departing employee.",
      "Review this Separation Agreement and flag any terms an employee should negotiate before signing.",
    ],
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
    definition:
      "An equipment rental agreement is a document that sets out the terms under which one party rents " +
      "specified equipment to another for a defined period in exchange for payment.",
    keyClauses: [
      "Description of equipment",
      "Rental period and renewal terms",
      "Rental fee and payment schedule",
      "Security deposit",
      "Condition and maintenance responsibilities",
      "Liability for loss, theft, or damage",
    ],
    fillInFields: [
      "[Owner Name]",
      "[Renter Name]",
      "[Equipment Description]",
      "[Rental Start Date]",
      "[Rental End Date]",
      "[Rental Fee]",
      "[Security Deposit Amount]",
      "[Pickup/Return Location]",
    ],
    legalSummary:
      "Signing this agreement establishes the renter's right to use the specified equipment for the " +
      "agreed period in exchange for payment, and obligates the renter to return it in the agreed " +
      "condition. It also allocates responsibility for loss, theft, or damage during the rental term " +
      "and sets out how the deposit is handled.",
    chatgptPrompts: [
      "Fill out this Equipment Rental Agreement template for a one-week camera equipment rental.",
      "Review this Equipment Rental Agreement and flag any gaps in the damage and liability terms.",
      "Adjust this Equipment Rental Agreement for a recurring monthly rental instead of a one-time rental.",
    ],
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
    definition:
      "A partnership agreement is a contract between two or more people who agree to co-own and " +
      "operate a business together, setting out each partner's contributions, profit share, and " +
      "management responsibilities.",
    keyClauses: [
      "Capital contributions of each partner",
      "Profit and loss allocation",
      "Management roles and decision-making authority",
      "Admission or withdrawal of partners",
      "Dispute resolution process",
      "Dissolution and winding-up procedures",
    ],
    fillInFields: [
      "[Partner A Name]",
      "[Partner B Name]",
      "[Business Name]",
      "[Effective Date]",
      "[Capital Contribution Amount]",
      "[Profit Split Percentage]",
      "[Principal Business Address]",
    ],
    legalSummary:
      "Signing this agreement creates a formal business partnership and defines each partner's " +
      "ownership stake, financial contributions, and share of profits and losses. It also establishes " +
      "how decisions are made, how disputes are handled, and what happens if a partner leaves or the " +
      "partnership ends.",
    chatgptPrompts: [
      "Draft a Partnership Agreement for a two-person consulting business with a 60/40 profit split.",
      "Explain what happens under this Partnership Agreement if one partner wants to leave the business.",
      "Add a dispute resolution clause to this Partnership Agreement covering mediation before litigation.",
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
    fields: standardSignatureFields(2, 1),
    recurringCategory: "Sale and Purchase",
    definition:
      "A sales agreement is a contract documenting the sale of specific goods from a seller to a " +
      "buyer, including the price, delivery terms, and condition of the item at the time of sale.",
    keyClauses: [
      "Description of goods sold",
      "Purchase price and payment method",
      "Delivery date and method",
      "Condition of goods and any warranties",
      "Transfer of ownership or title",
      "Risk of loss allocation",
    ],
    fillInFields: [
      "[Seller Name]",
      "[Buyer Name]",
      "[Item Description]",
      "[Purchase Price]",
      "[Sale Date]",
      "[Delivery Date]",
      "[Delivery Location]",
      "[Payment Method]",
    ],
    legalSummary:
      "Signing this agreement transfers ownership of the described goods from the seller to the buyer " +
      "once the agreed price is paid, and records the condition the goods were sold in. It also fixes " +
      "who bears responsibility for the item during delivery and what remedies, if any, apply if the " +
      "goods don't match the agreed description.",
    chatgptPrompts: [
      "Fill in this Sales Agreement for selling a used forklift to a business buyer.",
      "Explain what warranty language, if any, this Sales Agreement includes for the buyer.",
      "Adapt this Sales Agreement for an installment payment plan instead of a lump-sum price.",
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
    fields: standardSignatureFields(2, 2),
    recurringCategory: "Consulting",
    definition:
      "A referral agreement is a contract in which one party agrees to refer prospective customers to " +
      "another party's business in exchange for a commission on resulting sales.",
    keyClauses: [
      "Definition of a qualified referral",
      "Commission rate and calculation method",
      "Payment timing and method",
      "Term and termination",
      "Confidentiality of business information",
      "Non-solicitation or exclusivity terms",
    ],
    fillInFields: [
      "[Referring Party Name]",
      "[Business Name]",
      "[Commission Percentage]",
      "[Effective Date]",
      "[Payment Schedule]",
      "[Qualifying Referral Criteria]",
      "[Term Length]",
    ],
    legalSummary:
      "Signing this agreement obligates the business to pay the referrer a commission for each " +
      "qualifying customer they bring in, as defined by the agreed criteria. It also sets the payment " +
      "timing, the duration of the arrangement, and any confidentiality or exclusivity restrictions " +
      "that apply to the referrer.",
    chatgptPrompts: [
      "Fill out this Referral Agreement for an affiliate earning a 15% commission on sales.",
      "Explain how the commission and qualified-referral definitions in this Referral Agreement work together.",
      "Adapt this Referral Agreement for a flat fee per referral instead of a percentage commission.",
    ],
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
    definition:
      "An employment agreement is a contract between an employer and an employee that formally " +
      "establishes the terms of employment, including job duties, compensation, and conditions for " +
      "ending the relationship.",
    keyClauses: [
      "Job title and duties",
      "Compensation and pay schedule",
      "Work schedule and location",
      "Benefits and paid time off",
      "Confidentiality and non-disclosure obligations",
      "Termination conditions and notice period",
    ],
    fillInFields: [
      "[Employer Name]",
      "[Employee Name]",
      "[Job Title]",
      "[Start Date]",
      "[Salary/Wage]",
      "[Work Schedule]",
      "[Reporting Manager]",
      "[Termination Notice Period]",
    ],
    legalSummary:
      "Signing this agreement formalizes the employment relationship, obligating the employer to pay " +
      "the agreed compensation and the employee to perform the described duties. It also sets out " +
      "confidentiality expectations and the conditions and notice required to end the employment.",
    chatgptPrompts: [
      "Fill out this Employment Agreement for a full-time marketing coordinator hire.",
      "Explain the confidentiality and termination clauses in this Employment Agreement in plain language.",
      "Adapt this Employment Agreement for a part-time remote position with no benefits.",
    ],
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
    definition:
      "A rental agreement is a contract that establishes the terms under which a property owner " +
      "permits another party to occupy or use property or an item in exchange for rent.",
    keyClauses: [
      "Description of rented property",
      "Rent amount and due date",
      "Security deposit terms",
      "Length of rental term",
      "Maintenance and repair responsibilities",
      "Conditions for renewal or termination",
    ],
    fillInFields: [
      "[Landlord/Owner Name]",
      "[Tenant/Renter Name]",
      "[Property Address or Item Description]",
      "[Rent Amount]",
      "[Security Deposit]",
      "[Lease Start Date]",
      "[Lease End Date]",
      "[Payment Due Date]",
    ],
    legalSummary:
      "Signing this agreement grants the tenant the right to occupy or use the property for the agreed " +
      "term in exchange for rent, while the owner retains ownership. It also defines who is " +
      "responsible for maintenance and damage, and the conditions under which the arrangement can be " +
      "renewed, ended, or the deposit withheld.",
    chatgptPrompts: [
      "Fill out this Rental Agreement for a month-to-month residential tenancy.",
      "Explain the deposit and damage terms in this Rental Agreement before I sign it.",
      "Adapt this Rental Agreement for renting out a storage unit instead of a residence.",
    ],
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
    definition:
      "An authorization form is a document in which one person grants another named individual " +
      "specific, limited authority to act on their behalf for a defined purpose and period.",
    keyClauses: [
      "Identification of the authorizing person and authorized individual",
      "Scope of authorized actions",
      "Effective date and expiration date",
      "Limitations on authority",
      "Revocation conditions",
    ],
    fillInFields: [
      "[Authorizing Party Name]",
      "[Authorized Individual Name]",
      "[Scope of Authority]",
      "[Effective Date]",
      "[Expiration Date]",
      "[Purpose of Authorization]",
      "[Identification Number, if applicable]",
    ],
    legalSummary:
      "Signing this form gives the named individual the legal ability to act on the authorizing " +
      "party's behalf for the specific purpose and time period described, without transferring broader " +
      "decision-making power. The authority ends automatically at expiration or earlier if revoked, " +
      "and does not extend beyond the scope stated in the form.",
    chatgptPrompts: [
      "Fill out this Authorization Form for a family member to pick up medical records on my behalf.",
      "Explain the scope of authority granted in this Authorization Form and any limits it should include.",
      "Adapt this Authorization Form for a one-time transaction instead of an ongoing authorization.",
    ],
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
    definition:
      "A purchase order is a formal, itemized order document a buyer sends to a seller specifying the " +
      "goods being purchased, their price, and the agreed delivery and payment terms.",
    keyClauses: [
      "Itemized list of goods or services",
      "Unit price and total cost",
      "Delivery date and shipping terms",
      "Payment terms and due date",
      "Order number and reference details",
      "Acceptance and cancellation terms",
    ],
    fillInFields: [
      "[Buyer Name]",
      "[Seller/Supplier Name]",
      "[Purchase Order Number]",
      "[Item Description]",
      "[Quantity]",
      "[Unit Price]",
      "[Total Amount]",
      "[Delivery Date]",
      "[Payment Terms]",
    ],
    legalSummary:
      "Signing this purchase order creates a binding commitment for the buyer to purchase the listed " +
      "items at the stated price and for the seller to deliver them on the agreed terms. It serves as " +
      "the official record of what was ordered, at what cost, and by when, which both parties can rely " +
      "on if a dispute arises.",
    chatgptPrompts: [
      "Fill out this Purchase Order for ordering office furniture from a supplier.",
      "Explain the key risks in this Purchase Order before I send it to a supplier.",
      "Adapt this Purchase Order for a recurring monthly supply order instead of a one-time purchase.",
    ],
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
    definition:
      "A work order is a document authorizing a service provider to perform a specific job, outlining " +
      "the scope of work, materials, estimated cost, and expected completion date.",
    keyClauses: [
      "Scope of work description",
      "Materials and labor included",
      "Estimated cost and payment terms",
      "Start and completion dates",
      "Change order process",
      "Acceptance of completed work",
    ],
    fillInFields: [
      "[Client Name]",
      "[Service Provider Name]",
      "[Work Order Number]",
      "[Scope of Work]",
      "[Materials Needed]",
      "[Estimated Cost]",
      "[Start Date]",
      "[Completion Date]",
    ],
    legalSummary:
      "Signing this work order authorizes the service provider to begin the described job and " +
      "establishes the agreed scope, cost, and timeline both parties are working to. It gives the " +
      "client a basis for evaluating whether the completed work matches what was agreed, and gives the " +
      "provider a documented authorization to bill for the work performed.",
    chatgptPrompts: [
      "Fill out this Work Order for a home renovation contractor job.",
      "Explain what should happen under this Work Order if the scope of work changes mid-project.",
      "Adapt this Work Order for a fixed-price job instead of an estimated cost.",
    ],
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
    definition:
      "A delivery confirmation is a signed record confirming that specified goods were delivered to " +
      "and received by the intended recipient, and noting their condition upon arrival.",
    keyClauses: [
      "Description of items delivered",
      "Delivery date and location",
      "Condition of goods upon receipt",
      "Recipient acknowledgment of receipt",
      "Notes on discrepancies or damage",
    ],
    fillInFields: [
      "[Sender/Shipper Name]",
      "[Recipient Name]",
      "[Item Description]",
      "[Delivery Date]",
      "[Delivery Address]",
      "[Quantity Delivered]",
      "[Condition Notes]",
    ],
    legalSummary:
      "Signing this confirmation creates evidence that the described goods were delivered and received " +
      "on the stated date and in the noted condition. It shifts the practical burden of proof in the " +
      "sender's favor, since the recipient's signature acknowledges receipt and can be relied on if a " +
      "later dispute arises over whether or how delivery occurred.",
    chatgptPrompts: [
      "Fill out this Delivery Confirmation for a bulk shipment received at a warehouse.",
      "Explain how this Delivery Confirmation could be used as evidence in a delivery dispute.",
      "Adapt this Delivery Confirmation for a personal handoff of an item instead of a commercial shipment.",
    ],
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
    definition:
      "A client contract is a contract between a service provider and a client that defines the scope " +
      "of work, timeline, payment terms, and confidentiality obligations for a specific engagement.",
    keyClauses: [
      "Scope of services",
      "Project timeline and milestones",
      "Payment terms and invoicing schedule",
      "Confidentiality obligations",
      "Ownership of deliverables",
      "Termination conditions",
    ],
    fillInFields: [
      "[Service Provider Name]",
      "[Client Name]",
      "[Scope of Services]",
      "[Project Start Date]",
      "[Project End Date/Milestones]",
      "[Total Fee]",
      "[Payment Schedule]",
      "[Deliverables]",
    ],
    legalSummary:
      "Signing this contract obligates the service provider to deliver the described services by the " +
      "agreed timeline and obligates the client to pay the agreed fee. It also sets out who owns the " +
      "resulting work product, what information must stay confidential, and the conditions under which " +
      "either party can end the engagement early.",
    chatgptPrompts: [
      "Fill out this Client Contract for a freelance web design project with milestone payments.",
      "Explain the confidentiality and deliverable-ownership clauses in this Client Contract.",
      "Adapt this Client Contract for an ongoing retainer instead of a one-time project.",
    ],
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
    definition:
      "A service agreement is a contract between a service provider and a client that sets out the " +
      "services to be performed, the payment terms, and the duration of an ongoing service " +
      "relationship.",
    keyClauses: [
      "Description of services provided",
      "Service schedule and frequency",
      "Fees and payment terms",
      "Term and renewal",
      "Termination and notice period",
      "Confidentiality and liability limits",
    ],
    fillInFields: [
      "[Service Provider Name]",
      "[Client Name]",
      "[Description of Services]",
      "[Service Start Date]",
      "[Fee Amount]",
      "[Payment Frequency]",
      "[Term Length]",
      "[Termination Notice Period]",
    ],
    legalSummary:
      "Signing a service agreement obligates the provider to deliver the described services on the " +
      "agreed schedule and obligates the client to pay the specified fees. It also establishes how " +
      "either party can end the arrangement and what happens if obligations aren't met, creating an " +
      "enforceable basis for both parties' expectations.",
    chatgptPrompts: [
      "Draft a filled Service Agreement for a monthly bookkeeping service between a freelancer and a small business client.",
      "Review this Service Agreement and flag any missing terms around payment or termination.",
      "Adapt this Service Agreement for a recurring social media management retainer.",
    ],
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
    definition:
      "A scope of work (SOW) is a document that itemizes the specific deliverables, timelines, and " +
      "fees for a defined project, along with what falls outside the project's boundaries.",
    keyClauses: [
      "Itemized list of deliverables",
      "Project timeline and due dates",
      "Fees and payment schedule",
      "Exclusions (what's out of scope)",
      "Acceptance criteria",
      "Change request process",
    ],
    fillInFields: [
      "[Client Name]",
      "[Contractor/Vendor Name]",
      "[Project Name]",
      "[Deliverable Description]",
      "[Due Date]",
      "[Fee per Deliverable]",
      "[Total Project Fee]",
      "[Out-of-Scope Items]",
    ],
    legalSummary:
      "Signing a scope of work commits the contractor to deliver the listed items by the stated dates " +
      "and commits the client to pay for them, while explicitly excluding anything not listed. It " +
      "functions as a reference point for resolving disputes about what was actually promised, whether " +
      "used alone or alongside a broader contract.",
    chatgptPrompts: [
      "Generate a filled Scope of Work for a fixed-fee website redesign project with three deliverables.",
      "Help me tighten the exclusions section of this Scope of Work so out-of-scope requests are clearly billable separately.",
      "Turn this project brief into a Scope of Work with due dates and payment milestones.",
    ],
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
    definition:
      "A supplier terms agreement is a contract that establishes the standard pricing, delivery, " +
      "payment, and quality conditions governing an ongoing purchasing relationship with a supplier.",
    keyClauses: [
      "Pricing and quotation terms",
      "Delivery schedule and shipping terms",
      "Payment terms and invoicing",
      "Quality standards and inspection rights",
      "Returns and rejected goods",
      "Term and termination",
    ],
    fillInFields: [
      "[Buyer Name]",
      "[Supplier Name]",
      "[Products/Goods Description]",
      "[Unit Price]",
      "[Delivery Timeline]",
      "[Payment Terms (e.g. Net 30)]",
      "[Quality/Inspection Standard]",
      "[Agreement Term]",
    ],
    legalSummary:
      "Signing supplier terms sets fixed rules for pricing, delivery, and payment that apply to every " +
      "order placed under the agreement, rather than renegotiating terms each time. It gives both the " +
      "buyer and supplier a consistent standard for what counts as acceptable delivery and quality, " +
      "and what happens if goods fall short.",
    chatgptPrompts: [
      "Draft filled Supplier Terms for a small retailer ordering inventory repeatedly from one manufacturer.",
      "Explain the risks in these Supplier Terms from the buyer's perspective before I sign as a purchaser.",
      "Adjust this Supplier Terms agreement to add a quality inspection and rejected-goods return process.",
    ],
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
    definition:
      "An employee onboarding agreement is a signed acknowledgment confirming that a new employee has " +
      "received the company handbook, workplace policies, and any assigned equipment or access " +
      "credentials on their start date.",
    keyClauses: [
      "Receipt of employee handbook",
      "Acknowledgment of key workplace policies",
      "Equipment and access credentials issued",
      "Confirmation of start date and role",
      "Employee signature and date",
    ],
    fillInFields: [
      "[Employee Name]",
      "[Job Title]",
      "[Start Date]",
      "[Department/Manager Name]",
      "[Equipment Issued]",
      "[Handbook Version/Date]",
      "[Access Credentials Provided]",
    ],
    legalSummary:
      "Signing this agreement creates a dated record that the employee received and had the " +
      "opportunity to review specific policies and materials, which can help the employer show that " +
      "expectations were communicated. It does not itself create employment terms like compensation or " +
      "duration — those are typically covered in a separate offer letter or employment contract.",
    chatgptPrompts: [
      "Generate a filled Employee Onboarding Agreement for a new full-time hire starting next Monday, including laptop and badge issuance.",
      "Adapt this Employee Onboarding Agreement for a remote employee who won't receive physical equipment.",
      "List the policies a small business should reference in this onboarding acknowledgment.",
    ],
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
    definition:
      "A contractor onboarding agreement is a signed acknowledgment confirming that a new independent " +
      "contractor has received necessary system access and reviewed relevant policies, while also " +
      "affirming their status as an independent contractor rather than an employee.",
    keyClauses: [
      "Confirmation of independent contractor status",
      "System and data access granted",
      "Confidentiality and policy acknowledgment",
      "Equipment or credentials issued",
      "Start date and engagement scope reference",
    ],
    fillInFields: [
      "[Contractor Name]",
      "[Company Name]",
      "[Engagement Start Date]",
      "[Scope/Project Reference]",
      "[System Access Granted]",
      "[Confidentiality Policy Reference]",
      "[Equipment or Credentials Issued]",
    ],
    legalSummary:
      "Signing this agreement documents that the contractor was given specific access and information " +
      "before starting work, and records both parties' acknowledgment that the relationship is an " +
      "independent contractor engagement rather than employment. It supports the underlying contractor " +
      "agreement but doesn't replace the terms governing payment, deliverables, or duration found " +
      "there.",
    chatgptPrompts: [
      "Generate a filled Contractor Onboarding Agreement for a freelance developer getting repository and Slack access.",
      "Explain what distinguishes this Contractor Onboarding Agreement from an employee onboarding document.",
      "Adapt this onboarding acknowledgment for a contractor who will only work remotely with no physical equipment.",
    ],
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
    definition:
      "A payment terms agreement is a simple contract that records an amount owed between two parties, " +
      "along with the due date and method of payment, without the broader terms of a full service or " +
      "sales contract.",
    keyClauses: [
      "Amount owed",
      "Due date",
      "Accepted payment method(s)",
      "Late payment consequences",
      "Acknowledgment of debt by both parties",
    ],
    fillInFields: [
      "[Payor Name]",
      "[Payee Name]",
      "[Amount Owed]",
      "[Due Date]",
      "[Payment Method]",
      "[Late Fee/Interest, if any]",
      "[Reason for Payment/Invoice Reference]",
    ],
    legalSummary:
      "Signing a payment terms agreement creates a documented acknowledgment that one party owes a " +
      "specific sum to another and agrees to pay it by a set date and method. It serves as evidence of " +
      "the debt and its terms, which can be useful if a dispute arises over whether or how much was " +
      "owed.",
    chatgptPrompts: [
      "Generate a filled Payment Terms Agreement for an outstanding invoice due in 30 days.",
      "Explain what happens if the payor misses the due date in this Payment Terms Agreement.",
      "Adapt this Payment Terms Agreement to include a late fee for payments received after the due date.",
    ],
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
    definition:
      "An installment agreement is a contract that divides an amount owed into a series of scheduled " +
      "payments over time, specifying the size and timing of each installment and the consequences of " +
      "a missed payment.",
    keyClauses: [
      "Total amount owed",
      "Installment schedule and amounts",
      "Payment method for each installment",
      "Late or missed payment consequences",
      "Acceleration clause (full balance due on default)",
      "Prepayment terms",
    ],
    fillInFields: [
      "[Debtor Name]",
      "[Creditor Name]",
      "[Total Amount Owed]",
      "[Number of Installments]",
      "[Installment Amount]",
      "[Payment Due Dates]",
      "[Late Fee/Interest Rate]",
      "[Default/Acceleration Terms]",
    ],
    legalSummary:
      "Signing an installment agreement obligates the debtor to pay off the total amount according to " +
      "the agreed schedule instead of in one lump sum, and sets out what happens — such as late fees " +
      "or the full balance becoming due — if a payment is missed. It gives both parties a clear, " +
      "enforceable timeline for repayment.",
    chatgptPrompts: [
      "Generate a filled Installment Agreement splitting a $3,000 debt into six monthly payments.",
      "Explain the risks of the acceleration clause in this Installment Agreement before I sign as the debtor.",
      "Adapt this Installment Agreement to add a late fee for any payment more than 5 days overdue.",
    ],
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
    definition:
      "A privacy acknowledgement is a signed statement confirming that an individual has received, " +
      "reviewed, and understood an organization's privacy policy governing how their personal " +
      "information is collected and used.",
    keyClauses: [
      "Reference to the applicable privacy policy",
      "Confirmation of receipt and review",
      "Types of data covered",
      "Consent to the described data practices",
      "Signature and date of acknowledgment",
    ],
    fillInFields: [
      "[Individual Name]",
      "[Organization Name]",
      "[Privacy Policy Title/Version]",
      "[Date Policy Was Provided]",
      "[Role (Employee/Contractor/Customer)]",
      "[Effective Date of Acknowledgment]",
    ],
    legalSummary:
      "Signing this acknowledgment creates dated evidence that the individual was given access to the " +
      "privacy policy and confirmed they read and understood it. It does not itself grant data rights " +
      "or set out data practices — those terms live in the referenced privacy policy — but it helps " +
      "the organization demonstrate that notice was properly given.",
    chatgptPrompts: [
      "Generate a filled Privacy Acknowledgement for a new customer confirming they reviewed our privacy policy.",
      "Explain what a Privacy Acknowledgement does and doesn't cover compared to the privacy policy itself.",
      "Adapt this Privacy Acknowledgement for a new contractor who will handle customer data.",
    ],
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
    definition:
      "A data processing agreement (DPA) is a contract that sets out the obligations of a data " +
      "processor handling personal data on behalf of a data controller, including how the data may be " +
      "used, protected, and returned or deleted.",
    keyClauses: [
      "Definitions of controller, processor, and personal data",
      "Scope and purpose of processing",
      "Data security measures",
      "Sub-processor authorization and obligations",
      "Data breach notification procedures",
      "Data return or deletion upon termination",
    ],
    fillInFields: [
      "[Data Controller Name]",
      "[Data Processor Name]",
      "[Description of Processing Activities]",
      "[Categories of Personal Data]",
      "[Categories of Data Subjects]",
      "[Security Measures Required]",
      "[Sub-processor Approval Process]",
      "[Breach Notification Timeframe]",
      "[Data Return/Deletion Deadline]",
    ],
    legalSummary:
      "Signing a data processing agreement obligates the processor to handle personal data only as " +
      "instructed by the controller, apply specified security measures, and notify the controller of " +
      "any data breach within an agreed timeframe. It also sets rules for using sub-processors and " +
      "requires the processor to return or delete the data once the relationship ends.",
    chatgptPrompts: [
      "Explain the key risks in this Data Processing Agreement before I sign as a vendor handling customer data.",
      "Generate a filled Data Processing Agreement between a SaaS provider (processor) and a business customer (controller).",
      "Review this Data Processing Agreement's breach notification clause and suggest a reasonable notification timeframe.",
    ],
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
    definition:
      "A promissory note is a written, signed promise by a borrower to repay a specified sum of money " +
      "to a lender, either on demand or by a set date, under stated interest and repayment terms.",
    keyClauses: [
      "Principal loan amount",
      "Interest rate",
      "Repayment schedule",
      "Maturity date",
      "Default and remedies",
      "Prepayment rights",
    ],
    fillInFields: [
      "[Borrower Name]",
      "[Lender Name]",
      "[Principal Loan Amount]",
      "[Interest Rate]",
      "[Repayment Schedule]",
      "[Maturity Date]",
      "[Late Payment/Default Terms]",
      "[Governing Payment Method]",
    ],
    legalSummary:
      "Signing a promissory note creates a binding, written promise that the borrower will repay the " +
      "stated principal plus any interest according to the agreed schedule. It gives the lender " +
      "documented evidence of the loan's terms and provides a basis for pursuing repayment if the " +
      "borrower defaults.",
    chatgptPrompts: [
      "Generate a filled Promissory Note using this template for a personal loan between friends.",
      "Explain how the interest rate and repayment schedule interact in this Promissory Note.",
      "Adapt this Promissory Note for a small business loan with monthly installment repayments.",
    ],
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
    definition:
      "An LLC operating agreement is a contract among the members of a limited liability company that " +
      "establishes ownership percentages, management structure, and how profits, losses, and decisions " +
      "are handled.",
    keyClauses: [
      "Member ownership percentages",
      "Capital contributions",
      "Management structure (member-managed or manager-managed)",
      "Profit and loss allocation",
      "Voting rights and decision-making process",
      "Transfer of membership interests and dissolution terms",
    ],
    fillInFields: [
      "[LLC Name]",
      "[Member Names]",
      "[Ownership Percentages]",
      "[Initial Capital Contributions]",
      "[Management Structure]",
      "[Profit/Loss Allocation Method]",
      "[Voting Threshold for Major Decisions]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing an LLC operating agreement establishes each member's ownership stake, their share of " +
      "profits and losses, and how the company will be managed and major decisions made. It governs " +
      "the internal relationship among members, including what happens if a member wants to leave or " +
      "the LLC is dissolved.",
    chatgptPrompts: [
      "Generate a filled LLC Operating Agreement for two co-founders with a 60/40 ownership split.",
      "Explain the difference between member-managed and manager-managed structures in this LLC Operating Agreement.",
      "Adapt this LLC Operating Agreement to add a buyout clause for a departing member.",
    ],
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
    definition:
      "A sublease agreement is a contract in which an existing tenant (the sublessor) leases some or " +
      "all of their rented premises to a new tenant (the subtenant) for part or all of the remaining " +
      "term of the original lease.",
    keyClauses: [
      "Reference to the original lease and landlord",
      "Landlord consent to the sublease",
      "Sublet premises and permitted use",
      "Sublease term and rent amount",
      "Security deposit and payment terms",
      "Original tenant's continuing liability to the landlord",
    ],
    fillInFields: [
      "[Sublessor (Original Tenant) Name]",
      "[Subtenant Name]",
      "[Property Address]",
      "[Original Lease Date]",
      "[Landlord Name]",
      "[Sublease Start Date]",
      "[Sublease End Date]",
      "[Monthly Rent Amount]",
      "[Security Deposit Amount]",
    ],
    legalSummary:
      "Signing a sublease agreement makes the subtenant responsible for paying rent and following the " +
      "rules of the original lease for the sublet premises, while the original tenant typically " +
      "remains legally responsible to the landlord for the full lease. It documents landlord consent " +
      "where required and sets out how rent, deposits, and property condition are handled between the " +
      "two tenants.",
    chatgptPrompts: [
      "Generate a filled Sublease Agreement using this template for renting out one bedroom in my apartment for 6 months.",
      "Explain what obligations I keep as the original tenant after subleasing my apartment.",
      "Adapt this Sublease Agreement for subletting a commercial office space.",
    ],
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
    definition:
      "A liability waiver is a document in which a participant releases an organization or individual " +
      "from legal responsibility for injury, loss, or damage that may result from a specified " +
      "activity.",
    keyClauses: [
      "Description of the activity and its inherent risks",
      "Assumption of risk statement",
      "Release and waiver of liability",
      "Indemnification of the organization",
      "Medical treatment authorization, if applicable",
      "Governing terms and severability",
    ],
    fillInFields: [
      "[Participant Name]",
      "[Organization/Event Name]",
      "[Activity Description]",
      "[Event Date]",
      "[Location]",
      "[Emergency Contact Name and Phone]",
      "[Participant Signature Date]",
    ],
    legalSummary:
      "Signing a liability waiver means the participant acknowledges the risks of the activity and " +
      "agrees not to sue the organization for injuries or losses that occur as a result of those " +
      "ordinary risks. It does not necessarily protect the organization from claims of gross " +
      "negligence or intentional misconduct, and how enforceable a waiver is can depend on how clearly " +
      "the risks and release language are presented.",
    chatgptPrompts: [
      "Generate a filled Liability Waiver using this template for a one-day rock climbing class.",
      "Explain what a liability waiver actually protects an event organizer from before I use one.",
      "Adapt this Liability Waiver for a youth sports camp with minor participants.",
    ],
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
    definition:
      "A roommate agreement is a contract between co-tenants sharing a residence that sets out how " +
      "rent and expenses are divided and establishes shared household rules, separate from any lease " +
      "with the landlord.",
    keyClauses: [
      "Rent and utility split",
      "Security deposit contribution and refund",
      "Shared spaces and house rules",
      "Guest policy",
      "Move-out and notice terms",
      "Dispute resolution among roommates",
    ],
    fillInFields: [
      "[Roommate 1 Name]",
      "[Roommate 2 Name]",
      "[Property Address]",
      "[Move-In Date]",
      "[Total Monthly Rent]",
      "[Each Roommate's Rent Share]",
      "[Utility Split Percentage]",
      "[Security Deposit Amount]",
    ],
    legalSummary:
      "Signing a roommate agreement creates a private arrangement among co-tenants for splitting rent, " +
      "utilities, and responsibilities, and for handling situations like a roommate moving out early. " +
      "It does not replace or modify the lease with the landlord, who is generally not a party to it.",
    chatgptPrompts: [
      "Generate a filled Roommate Agreement using this template for two roommates splitting rent 50/50.",
      "Explain what a roommate agreement covers that a lease with the landlord doesn't.",
      "Adapt this Roommate Agreement for three roommates with unequal room sizes and rent shares.",
    ],
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
    definition:
      "A cash receipt is a signed document acknowledging that a specific amount of cash was received " +
      "from one party by another, along with the date and purpose of the payment.",
    keyClauses: [
      "Payer and recipient identification",
      "Amount received and date",
      "Purpose of payment",
      "Payment method confirmation",
      "Remaining balance, if a partial payment",
      "Recipient's signature acknowledging receipt",
    ],
    fillInFields: [
      "[Payer Name]",
      "[Recipient/Payee Name]",
      "[Amount Received]",
      "[Date Received]",
      "[Purpose of Payment]",
      "[Remaining Balance, if any]",
      "[Recipient Signature]",
    ],
    legalSummary:
      "Signing a cash receipt creates a dated record that a specific payment was made and received, " +
      "which can serve as proof of payment if a dispute arises later. It does not by itself create new " +
      "obligations beyond confirming that the stated amount changed hands for the stated purpose.",
    chatgptPrompts: [
      "Generate a filled Cash Receipt using this template for a $500 cash rent payment.",
      "Explain why a cash receipt matters when buying a used item informally.",
      "Adapt this Cash Receipt for a partial payment toward a larger total amount owed.",
    ],
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
    definition:
      "A construction contract is an agreement between a property owner and a contractor that defines " +
      "the scope of work, schedule, payment terms, and workmanship warranty for a construction or " +
      "renovation project.",
    keyClauses: [
      "Scope of work and specifications",
      "Project schedule and milestones",
      "Payment schedule and change orders",
      "Responsibility for materials and permits",
      "Workmanship warranty",
      "Termination and dispute resolution",
    ],
    fillInFields: [
      "[Owner Name]",
      "[Contractor Name]",
      "[Project Address]",
      "[Scope of Work Description]",
      "[Start Date]",
      "[Completion Date]",
      "[Total Contract Price]",
      "[Payment Milestone Schedule]",
      "[Warranty Period]",
    ],
    legalSummary:
      "Signing a construction contract obligates the contractor to complete the described work by the " +
      "agreed schedule and standard, and obligates the owner to pay according to the agreed " +
      "milestones. It also defines how changes to the scope, delays, and defects in workmanship are " +
      "handled after the work is done.",
    chatgptPrompts: [
      "Generate a filled Construction Contract using this template for a small home renovation project.",
      "Explain what payment milestones I should include in a construction contract for a kitchen remodel.",
      "Adapt this Construction Contract for a contractor building a backyard deck.",
    ],
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
    definition:
      "A cease and desist letter is a formal written demand notifying a person or business that they " +
      "must stop specified conduct by a stated deadline or face further legal action.",
    keyClauses: [
      "Description of the offending conduct",
      "Legal basis for the demand",
      "Specific demand to stop the conduct",
      "Deadline for compliance",
      "Consequences of non-compliance",
      "Sender's contact information for response",
    ],
    fillInFields: [
      "[Sender Name]",
      "[Recipient Name]",
      "[Description of Conduct]",
      "[Date Conduct Began/Was Discovered]",
      "[Legal Basis (e.g., contract clause, trademark, harassment)]",
      "[Compliance Deadline]",
      "[Sender Signature Date]",
    ],
    legalSummary:
      "Sending a cease and desist letter creates a documented, dated record that a formal demand was " +
      "made to stop specific conduct, which can support later legal action if the conduct continues. " +
      "The letter itself does not create new legal rights or obligations — it puts the recipient on " +
      "notice of a claim that already exists.",
    chatgptPrompts: [
      "Generate a filled Cease and Desist Letter using this template for someone using my copyrighted photos without permission.",
      "Explain what typically happens after a cease and desist letter is sent and ignored.",
      "Adapt this Cease and Desist Letter for a neighbor dispute over repeated noise violations.",
    ],
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
    definition:
      "A letter of intent is a preliminary written document outlining the proposed terms of a " +
      "prospective transaction, such as a sale, partnership, or real estate deal, before a binding " +
      "definitive agreement is negotiated.",
    keyClauses: [
      "Overview of the proposed transaction",
      "Key proposed terms (price, structure, timeline)",
      "Confidentiality obligations",
      "Exclusivity or no-shop period",
      "Statement of non-binding intent, except specified sections",
      "Expiration date of the letter",
    ],
    fillInFields: [
      "[Party A Name]",
      "[Party B Name]",
      "[Description of Proposed Transaction]",
      "[Proposed Purchase Price/Terms]",
      "[Exclusivity Period]",
      "[Target Closing Date]",
      "[Letter Expiration Date]",
    ],
    legalSummary:
      "Signing a letter of intent records a shared understanding of proposed deal terms and typically " +
      "makes only specific sections, such as confidentiality and exclusivity, legally binding, while " +
      "the core transaction terms remain non-binding until a definitive agreement is signed. It " +
      "signals serious intent to negotiate but does not by itself obligate either party to complete " +
      "the deal.",
    chatgptPrompts: [
      "Generate a filled Letter of Intent using this template for the proposed sale of a small business.",
      "Explain which parts of a letter of intent are actually binding versus non-binding.",
      "Adapt this Letter of Intent for a commercial real estate purchase negotiation.",
    ],
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
    definition:
      "A bill of sale is a document recording the transfer of ownership of personal property, such as " +
      "a vehicle or piece of equipment, from a seller to a buyer for an agreed price.",
    keyClauses: [
      "Description and identification of the item sold",
      "Purchase price and payment terms",
      "As-is condition statement",
      "Seller's warranty of ownership free of liens",
      "Date and location of sale",
      "Signatures of buyer and seller",
    ],
    fillInFields: [
      "[Seller Name]",
      "[Buyer Name]",
      "[Item Description]",
      "[Vehicle Identification Number (VIN), if applicable]",
      "[Purchase Price]",
      "[Sale Date]",
      "[Odometer Reading, if applicable]",
    ],
    legalSummary:
      "Signing a bill of sale documents that ownership of the described item transferred from seller " +
      "to buyer for the stated price, with the seller confirming they have the right to sell it and, " +
      "typically, that it is sold as-is with no warranties. It serves as proof of the transaction, " +
      "price, and date if ownership or condition is later disputed.",
    chatgptPrompts: [
      "Generate a filled Bill of Sale using this template for a used car sale between two individuals.",
      "Explain what 'sold as-is' actually means for the buyer's rights after signing a bill of sale.",
      "Adapt this Bill of Sale for selling a piece of used equipment with no title.",
    ],
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
    definition:
      "A loan agreement is a contract between a lender and a borrower that sets out the principal " +
      "amount, interest rate, repayment schedule, collateral, and consequences of default for a loan.",
    keyClauses: [
      "Loan amount and interest rate",
      "Repayment schedule",
      "Collateral or security interest, if any",
      "Prepayment terms",
      "Default and remedies",
      "Notices and governing terms",
    ],
    fillInFields: [
      "[Lender Name]",
      "[Borrower Name]",
      "[Principal Loan Amount]",
      "[Interest Rate]",
      "[Repayment Schedule/Due Dates]",
      "[Collateral Description, if any]",
      "[Loan Start Date]",
      "[Maturity Date]",
    ],
    legalSummary:
      "Signing a loan agreement legally obligates the borrower to repay the principal plus any agreed " +
      "interest according to the set schedule, and gives the lender defined remedies, such as claiming " +
      "collateral, if the borrower defaults. It is more detailed than a simple promissory note, " +
      "spelling out both parties' rights around prepayment, default, and security for the loan.",
    chatgptPrompts: [
      "Generate a filled Loan Agreement using this template for a $10,000 personal loan between family members.",
      "Explain the difference between this Loan Agreement and a simple promissory note.",
      "Adapt this Loan Agreement to include a vehicle as collateral.",
    ],
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
    definition:
      "A power of attorney is a document in which one person, the principal, grants another person, " +
      "the agent or attorney-in-fact, authority to act on their behalf in specified financial, " +
      "property, or other matters.",
    keyClauses: [
      "Identification of principal and agent",
      "Scope of granted authority",
      "Durability provision for incapacity",
      "Effective date and duration",
      "Agent's accounting and compensation terms",
      "Revocation and witnessing/notarization requirements",
    ],
    fillInFields: [
      "[Principal Name]",
      "[Agent (Attorney-in-Fact) Name]",
      "[Scope of Authority Granted]",
      "[Effective Date]",
      "[Durability Election (durable or non-durable)]",
      "[Expiration or Termination Conditions]",
      "[Successor Agent Name, if any]",
    ],
    legalSummary:
      "Signing a power of attorney legally authorizes the named agent to act on the principal's behalf " +
      "within the scope described, which can range from a single transaction to broad financial " +
      "authority. Requirements for making a power of attorney valid, such as witnesses or " +
      "notarization, vary significantly by jurisdiction, so the specific formalities needed should be " +
      "confirmed separately before relying on the document.",
    chatgptPrompts: [
      "Explain what a power of attorney actually authorizes before I sign one.",
      "Generate a filled Power of Attorney using this template limited to managing my bank accounts while I travel.",
      "Explain the difference between a durable and non-durable power of attorney.",
    ],
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
    definition:
      "IRS Form W-9 is the official U.S. tax form a business uses to request a contractor, freelancer, " +
      "or vendor's taxpayer identification number and certification for tax reporting purposes.",
    keyClauses: [
      "Name and business name of the taxpayer",
      "Federal tax classification",
      "Exemption codes, if applicable",
      "Address",
      "Taxpayer identification number (SSN or EIN)",
      "Certification and signature",
    ],
    fillInFields: [
      "[Name]",
      "[Business Name, if different]",
      "[Federal Tax Classification]",
      "[Address]",
      "[Social Security Number or Employer Identification Number]",
      "[Signature Date]",
    ],
    legalSummary:
      "Signing a completed W-9 certifies to the requesting business that the taxpayer identification " +
      "number provided is correct and that the signer is not subject to backup withholding unless " +
      "indicated otherwise, so the business can accurately report payments made to them, such as on a " +
      "1099. It does not itself create a payment obligation — it only supplies the tax information " +
      "needed for reporting.",
    chatgptPrompts: [
      "Explain what information I need to have ready before filling out a W-9 form.",
      "Explain the difference between filling out a W-9 as an individual versus as an LLC.",
      "Generate a filled example W-9 using this template for a sole proprietor contractor.",
    ],
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
    definition:
      "Form I-9 is a U.S. federal form that employers must use to verify a new employee's identity and " +
      "legal authorization to work in the United States.",
    keyClauses: [
      "Section 1: employee information and attestation of citizenship or immigration status",
      "Section 2: employer review and physical or remote examination of identity/work-authorization documents",
      "List A, B, and C acceptable document categories",
      "Employer certification of document review and first day of employment",
      "Reverification section for employees with expiring work authorization",
      "Supplement B for rehire or reverification records",
    ],
    fillInFields: [
      "[Employee Full Name]",
      "[Date of Birth]",
      "[Social Security Number]",
      "[Citizenship/Immigration Status]",
      "[Alien Registration Number (if applicable)]",
      "[Document Title]",
      "[Document Number and Expiration Date]",
      "[Employer Business Name]",
      "[First Day of Employment]",
    ],
    legalSummary:
      "Completing and signing Form I-9 creates a required federal record showing that an employer " +
      "examined acceptable documents proving the employee's identity and authorization to work before " +
      "or shortly after hire. It does not itself grant work authorization; both the employee and " +
      "employer attest, under penalty of perjury, that the information and document review are " +
      "accurate and were completed properly.",
    chatgptPrompts: [
      "Explain what information and documents I need to complete Section 1 of this I-9 form as a new hire.",
      "What are the acceptable List A, B, and C documents for I-9 Section 2 verification?",
      "Explain the employer's responsibilities and deadlines when completing this I-9 form for a new hire.",
    ],
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
    definition:
      "A last will and testament is a legal document in which a person (the testator) directs how " +
      "their property should be distributed and who should care for their minor children after death.",
    keyClauses: [
      "Appointment of executor and alternate executor",
      "Guardian designation for minor children",
      "Specific bequests of property to named beneficiaries",
      "Residuary estate clause covering remaining property",
      "Revocation of any prior wills and codicils",
      "Witness attestation clause",
    ],
    fillInFields: [
      "[Testator Full Name]",
      "[Executor Name]",
      "[Alternate Executor Name]",
      "[Guardian Name for Minor Children]",
      "[Beneficiary Name(s)]",
      "[Specific Bequest Description]",
      "[Residuary Beneficiary]",
      "[Date of Execution]",
      "[Witness Names]",
    ],
    legalSummary:
      "Signing a last will and testament legally establishes how the signer's property should be " +
      "distributed after death and who is responsible for administering the estate and caring for " +
      "minor children, provided the document is executed according to the witnessing and formality " +
      "rules that apply where the signer lives. It has no effect until death and can generally be " +
      "revoked or changed at any time before then while the testator has legal capacity.",
    chatgptPrompts: [
      "Explain what sections I need to complete in this Last Will and Testament template.",
      "Help me think through who to name as executor and guardian in my will.",
      "What witnessing requirements should I check for my state before signing this will?",
    ],
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
    definition:
      "A Restricted Stock Purchase Agreement is a contract under which a company sells shares to a " +
      "purchaser subject to a vesting schedule and the company's right to repurchase unvested shares.",
    keyClauses: [
      "Purchase price and number of shares sold",
      "Vesting schedule and vesting commencement date",
      "Company's repurchase right over unvested shares",
      "Restrictions on transfer of the shares",
      "Representations on securities law compliance and tax election notice (e.g., an 83(b) election)",
      "Right of first refusal on future transfers",
    ],
    fillInFields: [
      "[Purchaser Name]",
      "[Company Name]",
      "[Number of Shares]",
      "[Purchase Price Per Share]",
      "[Total Purchase Price]",
      "[Vesting Commencement Date]",
      "[Vesting Schedule]",
      "[Repurchase Price]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement legally transfers ownership of the specified shares to the purchaser in " +
      "exchange for payment, while giving the company the right to buy back any unvested shares if the " +
      "purchaser's service ends before they fully vest. It also documents the terms a purchaser relies " +
      "on when deciding whether to file a tax election shortly after the purchase date.",
    chatgptPrompts: [
      "Explain the vesting schedule and repurchase right in this Restricted Stock Purchase Agreement.",
      "What should I check in this agreement before purchasing restricted shares from my company?",
      "Summarize the key obligations this agreement creates for both the company and the purchaser.",
    ],
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
    definition:
      "A Stock Option Grant Notice is a document that formally grants an individual the right to " +
      "purchase a specified number of company shares at a fixed exercise price, subject to vesting.",
    keyClauses: [
      "Number of shares subject to the option",
      "Exercise price per share",
      "Vesting schedule and vesting commencement date",
      "Option expiration and post-termination exercise period",
      "Option type (incentive stock option vs. nonqualified stock option)",
      "Reference to the underlying equity incentive plan and exercise method",
    ],
    fillInFields: [
      "[Optionee Name]",
      "[Company Name]",
      "[Number of Option Shares]",
      "[Exercise Price Per Share]",
      "[Grant Date]",
      "[Vesting Commencement Date]",
      "[Vesting Schedule]",
      "[Option Expiration Date]",
      "[Stock Plan Name]",
    ],
    legalSummary:
      "Signing this notice legally grants the recipient an option to purchase company shares at the " +
      "stated exercise price once vesting conditions are met, without requiring them to exercise it. " +
      "The company's obligation is to honor the stated terms as shares vest, and the option typically " +
      "expires or terminates on a fixed date or shortly after the recipient's service with the company " +
      "ends.",
    chatgptPrompts: [
      "Explain the exercise price, vesting schedule, and expiration terms in this Stock Option Grant Notice before I sign it.",
      "What's the difference between an incentive stock option and a nonqualified stock option in a grant notice like this?",
      "Help me understand what happens to my options if I leave the company, based on this grant notice.",
    ],
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
    definition:
      "A Parking Space Lease Agreement is a contract in which a property owner grants another party " +
      "the right to park a specified vehicle in a designated parking space in exchange for rent.",
    keyClauses: [
      "Description and location of the parking space",
      "Rent amount and payment schedule",
      "Lease term, renewal, and termination",
      "Authorized vehicle description",
      "Permitted use and access restrictions",
      "Liability for damage, loss, or unauthorized use",
    ],
    fillInFields: [
      "[Landlord Name]",
      "[Tenant Name]",
      "[Parking Space Number/Location]",
      "[Monthly Rent Amount]",
      "[Lease Start Date]",
      "[Lease End Date]",
      "[Vehicle Make/Model]",
      "[Vehicle License Plate Number]",
      "[Security Deposit Amount]",
    ],
    legalSummary:
      "Signing this agreement legally obligates the tenant to pay the agreed rent for the exclusive " +
      "right to park the specified vehicle in the designated space during the lease term, while the " +
      "landlord agrees to keep the space available accordingly. It also allocates responsibility " +
      "between the parties for damage, unauthorized use, or early termination.",
    chatgptPrompts: [
      "Explain what terms I should fill in for this Parking Space Lease Agreement.",
      "What should a landlord include in a parking space lease to limit liability for vehicle damage?",
      "Summarize the obligations this parking space lease creates for tenant and landlord.",
    ],
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
    definition:
      "A Month-to-Month Rental Agreement is a lease for a residential or commercial property that " +
      "automatically renews each month until either party ends it with proper notice.",
    keyClauses: [
      "Monthly rent amount and due date",
      "Notice period required to terminate the tenancy",
      "Security deposit terms and return conditions",
      "Utilities and maintenance responsibilities",
      "Rules on pets, guests, and permitted use of the property",
      "Process for rent increases or renewal notices",
    ],
    fillInFields: [
      "[Landlord Name]",
      "[Tenant Name]",
      "[Property Address]",
      "[Monthly Rent Amount]",
      "[Rent Due Date]",
      "[Security Deposit Amount]",
      "[Notice Period (Days)]",
      "[Move-In Date]",
      "[Utilities Included]",
    ],
    legalSummary:
      "Signing this agreement legally establishes an ongoing tenancy that continues month to month " +
      "until either the landlord or tenant gives the required notice to end it, rather than expiring " +
      "on a fixed date. It sets out each party's rent, deposit, and maintenance obligations for as " +
      "long as the tenancy continues.",
    chatgptPrompts: [
      "Explain what notice period I need to give to end this month-to-month rental agreement.",
      "What should I fill in for the security deposit and utilities sections of this rental agreement?",
      "Summarize the key differences between this month-to-month agreement and a fixed-term lease.",
    ],
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
    definition:
      "An Equipment Loan Agreement is a contract in which an owner lends a specific piece of equipment " +
      "to a borrower for a defined period, setting out the equipment's condition and liability for " +
      "loss or damage.",
    keyClauses: [
      "Description and condition of the equipment at the start of the loan",
      "Loan period and scheduled return date",
      "Permitted use of the equipment",
      "Liability for damage, loss, or theft while on loan",
      "Maintenance and repair responsibilities",
      "Required condition and process for return",
    ],
    fillInFields: [
      "[Lender Name]",
      "[Borrower Name]",
      "[Equipment Description]",
      "[Equipment Serial Number]",
      "[Loan Start Date]",
      "[Return Date]",
      "[Equipment Condition at Loan]",
      "[Replacement Value]",
      "[Late Return Fee]",
    ],
    legalSummary:
      "Signing this agreement legally obligates the borrower to return the equipment in the agreed " +
      "condition by the specified date and to cover the cost of damage, loss, or misuse while it is in " +
      "their possession. It also documents the equipment's condition at the start of the loan, which " +
      "helps resolve disputes over pre-existing wear when it is returned.",
    chatgptPrompts: [
      "Explain what details I need to document about the equipment's condition before lending it out.",
      "Help me fill in the liability and return terms for this Equipment Loan Agreement.",
      "What should I check in this agreement before borrowing equipment from someone?",
    ],
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
    definition:
      "An Employee Non-Disclosure Agreement is a one-way contract in which an employee agrees to keep " +
      "an employer's confidential business information secret during and after employment.",
    keyClauses: [
      "Definition of confidential information",
      "Employee's obligations to protect and not disclose information",
      "Exclusions from confidential information (e.g., publicly known information)",
      "Duration of confidentiality obligations after employment ends",
      "Return of company property and materials on termination",
      "Remedies available to the employer for breach",
    ],
    fillInFields: [
      "[Employer Name]",
      "[Employee Name]",
      "[Effective Date]",
      "[Job Title]",
      "[Definition of Confidential Information]",
      "[Duration of Obligation After Termination]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "Signing this agreement legally obligates the employee to keep the employer's specified " +
      "confidential information secret both during and after employment, and typically to return " +
      "company materials when employment ends. Unlike a mutual NDA, only the employee takes on " +
      "disclosure obligations here; the employer does not make reciprocal confidentiality promises.",
    chatgptPrompts: [
      "Explain what counts as confidential information under this Employee NDA.",
      "How long do my confidentiality obligations last after I leave the company, based on this agreement?",
      "Summarize what this Employee Non-Disclosure Agreement requires me to do and not do.",
    ],
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
    definition:
      "A Retainer Agreement is a contract in which a client pays a consultant or professional a " +
      "recurring fee in exchange for ongoing availability and services over a defined period.",
    keyClauses: [
      "Monthly retainer fee and payment schedule",
      "Scope of services included in the retainer",
      "Hours or deliverables covered versus work billed separately",
      "Term of the engagement and renewal terms",
      "Termination and notice requirements",
      "Confidentiality and ownership of work product",
    ],
    fillInFields: [
      "[Client Name]",
      "[Consultant Name]",
      "[Monthly Retainer Amount]",
      "[Scope of Services]",
      "[Effective Date]",
      "[Payment Due Date]",
      "[Term Length]",
      "[Notice Period to Terminate]",
      "[Hourly Rate for Excess Work]",
    ],
    legalSummary:
      "Signing this agreement legally obligates the client to pay the agreed recurring fee in exchange " +
      "for the consultant's ongoing availability and the specified scope of services, regardless of " +
      "exactly how much work occurs in a given period. It also sets out how either party can end the " +
      "arrangement and how fees already paid or owed at termination are handled.",
    chatgptPrompts: [
      "Generate a filled Retainer Agreement using this template for a monthly consulting arrangement.",
      "Explain what should be included in the scope of services section of this retainer agreement.",
      "What termination and notice terms should I negotiate in a consulting retainer agreement?",
    ],
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
    definition:
      "A Corporate Resolution is a written record documenting a formal decision or action approved by " +
      "a company's board of directors or shareholders.",
    keyClauses: [
      "Recital of the meeting or written consent authorizing the resolution",
      "Statement of the specific action or decision approved",
      "Effective date of the resolution",
      "Authorization of the individuals allowed to act on the company's behalf",
      "Certification by an officer or corporate secretary",
      "Signatures of directors",
    ],
    fillInFields: [
      "[Company Name]",
      "[Date of Resolution]",
      "[Type of Meeting/Written Consent]",
      "[Description of Action Approved]",
      "[Authorized Signatory Name(s)]",
      "[Director Name(s)]",
      "[Corporate Secretary Name]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this resolution legally documents that the company's directors formally approved the " +
      "specified action, giving the named individuals authority to carry it out on the company's " +
      "behalf, such as opening a bank account or signing a contract. It serves as the official " +
      "corporate record that the decision was made through proper internal governance.",
    chatgptPrompts: [
      "Explain what information I need to fill in to document a board decision using this Corporate Resolution.",
      "Help me draft the resolution language for approving a specific corporate action using this template.",
      "What details should a corporate resolution include to authorize a signatory on a bank account?",
    ],
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
    definition:
      "A Copyright Assignment Agreement is a contract that transfers all ownership rights in a " +
      "copyrighted work from its creator to another party.",
    keyClauses: [
      "Description and identification of the work being assigned",
      "Grant and transfer of all copyright ownership",
      "Payment or other consideration for the assignment",
      "Assignor's warranties of original authorship and ownership",
      "Waiver or treatment of moral rights, where applicable",
      "Effective date of the transfer",
    ],
    fillInFields: [
      "[Assignor Name]",
      "[Assignee Name]",
      "[Description of the Work]",
      "[Date of Creation]",
      "[Consideration/Payment Amount]",
      "[Effective Date of Assignment]",
      "[Registration Number (if applicable)]",
    ],
    legalSummary:
      "Signing this agreement legally transfers full ownership of the copyright in the specified work " +
      "from the creator to the receiving party, so the assignee gains the exclusive rights to use, " +
      "reproduce, and license the work going forward. The assignor typically gives up all ownership " +
      "claims to the work, retaining only whatever rights are expressly reserved in the agreement.",
    chatgptPrompts: [
      "Explain what happens to my rights in a work after I sign this Copyright Assignment Agreement.",
      "What details do I need to identify the work correctly in this copyright assignment?",
      "Summarize the difference between this Copyright Assignment Agreement and a licensing agreement.",
    ],
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
    definition:
      "A living will, also called an advance healthcare directive, is a written statement of a " +
      "person's own wishes about life-sustaining medical treatment and end-of-life care, intended to " +
      "guide physicians and family when that person can no longer communicate those decisions " +
      "directly.",
    keyClauses: [
      "Statement of intent and mental capacity",
      "Instructions on resuscitation (CPR/DNR)",
      "Instructions on artificial life support and ventilation",
      "Instructions on artificial nutrition and hydration",
      "Pain management and comfort care preferences",
      "Conditions under which the directive takes effect",
    ],
    fillInFields: [
      "[Principal's Full Name]",
      "[Principal's Date of Birth]",
      "[Effective Date]",
      "[Resuscitation Preference]",
      "[Artificial Nutrition/Hydration Preference]",
      "[Witness Name(s)]",
      "[Attending Physician Determination Clause]",
    ],
    legalSummary:
      "Signing a living will records a person's own instructions about the medical care they do or do " +
      "not want if they become unable to communicate, so that physicians and family have written " +
      "guidance instead of having to guess. It does not appoint anyone to make decisions on the " +
      "person's behalf, since that requires a separate healthcare power of attorney, and it only takes " +
      "effect under the specific medical conditions described in the document. Because many places " +
      "require particular witnessing or notarization before healthcare providers will honor it, the " +
      "underlying wishes should be documented in a way that satisfies the requirements where the " +
      "person lives.",
    chatgptPrompts: [
      "Explain what a living will / advance healthcare directive actually covers before I sign one.",
      "What is the difference between a living will and a medical power of attorney?",
      "Help me think through what to say about resuscitation and artificial nutrition in my advance directive.",
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
    definition:
      "A codicil to a will is a supplementary legal document that formally amends, adds to, or revokes " +
      "specific provisions of an existing will without requiring the entire will to be rewritten.",
    keyClauses: [
      "Reference to and identification of the original will being amended",
      "Statement of testamentary capacity and intent",
      "Specific provision(s) being changed, added, or revoked",
      "Confirmation that all other provisions of the original will remain in effect",
      "Execution and witnessing clause",
    ],
    fillInFields: [
      "[Testator's Full Name]",
      "[Date of Original Will]",
      "[Effective Date of Codicil]",
      "[Provision Number/Section Being Amended]",
      "[Revised Language or New Provision]",
      "[Executor Name]",
      "[Witness Name(s)]",
    ],
    legalSummary:
      "Signing a codicil legally changes one or more specific parts of an existing will while leaving " +
      "the rest of that will in force, avoiding the need to draft a full replacement. For the change " +
      "to be recognized, the codicil generally must be executed with the same formalities, such as " +
      "signing and witnessing, required for a valid will in the relevant place, and it should be " +
      "stored together with the original will. It creates no obligations on its own; it only takes " +
      "effect as part of the estate plan when the testator later passes away.",
    chatgptPrompts: [
      "Explain what a codicil to a will can and cannot change.",
      "When should I use a codicil instead of writing a brand-new will?",
      "Help me draft the language for a codicil that changes my named executor.",
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
    definition:
      "A simple will for a small estate is a legal document in which a person, the testator, states " +
      "how their modest assets should be distributed after death and names an executor to carry out " +
      "those wishes, without establishing trusts or detailed tax planning provisions.",
    keyClauses: [
      "Appointment of executor and alternate executor",
      "Revocation of prior wills and codicils",
      "Distribution of residuary estate to named beneficiaries",
      "Guardianship designation for minor children, if applicable",
      "Payment of debts, expenses, and taxes",
      "Execution and witnessing clause",
    ],
    fillInFields: [
      "[Testator's Full Name]",
      "[Executor Name]",
      "[Alternate Executor Name]",
      "[Beneficiary Name(s)]",
      "[Guardian Name for Minor Children]",
      "[Residuary Distribution Shares/Percentages]",
      "[Witness Name(s)]",
    ],
    legalSummary:
      "Signing this will legally states who should receive the testator's remaining property after " +
      "debts and expenses are paid, and names the person responsible for carrying that out as " +
      "executor. It is meant for straightforward situations with few assets and few beneficiaries, and " +
      "does not create any trusts or address complex tax planning. A will only becomes effective at " +
      "death and only if it is signed and witnessed in the manner required where the testator lives, " +
      "so those formalities must be completed for it to be honored.",
    chatgptPrompts: [
      "Explain what a simple will covers and when it's not enough for my situation.",
      "What's the difference between a simple will and one that uses trusts for estate planning?",
      "Help me think through who to name as executor and alternate executor in my will.",
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
    definition:
      "A durable power of attorney is a legal document in which a principal grants an agent authority " +
      "to manage the principal's financial and legal affairs, with that authority expressly continuing " +
      "even if the principal later becomes incapacitated.",
    keyClauses: [
      "Grant of authority and scope of powers, such as banking, property, and contracts",
      "Durability clause stating the power survives incapacity",
      "Effective date, either immediate or springing upon incapacity",
      "Agent's duties and standard of care",
      "Compensation and reimbursement of agent expenses",
      "Revocation and termination provisions",
    ],
    fillInFields: [
      "[Principal's Full Name]",
      "[Agent's Full Name]",
      "[Alternate/Successor Agent Name]",
      "[Effective Date]",
      "[Scope of Powers Granted]",
      "[Durability Statement]",
      "[Notary Acknowledgment Block]",
    ],
    legalSummary:
      "Signing a durable power of attorney legally authorizes the named agent to act on the " +
      "principal's behalf in financial and legal matters, and confirms that this authority continues " +
      "even if the principal becomes incapacitated. The agent generally owes the principal a duty to " +
      "act honestly and in the principal's best interest, and the principal can typically revoke the " +
      "authority at any time while competent to do so. Because durable powers of attorney often " +
      "require notarization and some institutions demand specific statutory wording, the formalities " +
      "that apply where the principal lives need to be satisfied for it to be accepted.",
    chatgptPrompts: [
      "Explain what a durable power of attorney lets my agent do that a regular power of attorney doesn't.",
      "What powers should I include or exclude when granting a durable power of attorney to a family member?",
      "Explain the difference between a durable and a limited power of attorney.",
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
    definition:
      "A limited power of attorney is a legal document in which a principal grants an agent authority " +
      "to act on their behalf for one specific, described transaction or task, with that authority " +
      "ending automatically once the matter is complete.",
    keyClauses: [
      "Grant of authority limited to a specific transaction or task",
      "Detailed description of the matter the agent may handle",
      "Effective date and expiration or completion event",
      "Limits on the agent's authority, stating what is excluded",
      "Revocation provisions",
      "Notary or witness acknowledgment",
    ],
    fillInFields: [
      "[Principal's Full Name]",
      "[Agent's Full Name]",
      "[Description of Specific Transaction/Task]",
      "[Effective Date]",
      "[Expiration Date or Completion Event]",
      "[Property/Account/Document Identifier]",
      "[Notary Acknowledgment Block]",
    ],
    legalSummary:
      "Signing a limited power of attorney legally authorizes the named agent to act for the principal " +
      "in one clearly defined matter only, such as completing a specific transaction, and that " +
      "authority ends once the described task is finished or the stated expiration is reached. Unlike " +
      "a durable power of attorney, it generally does not continue if the principal becomes " +
      "incapacitated unless the document specifically says so. Certain transactions, such as real " +
      "estate or vehicle title transfers, may require the document to be notarized before it will be " +
      "accepted, so those formalities should be confirmed for the specific transaction and location " +
      "involved.",
    chatgptPrompts: [
      "Explain what a limited power of attorney covers versus a general or durable one.",
      "Help me describe the scope of a limited power of attorney for a real estate closing.",
      "What should I watch out for when giving someone limited power of attorney for a single transaction?",
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
    definition:
      "A medical power of attorney, also called a healthcare proxy, is a legal document in which a " +
      "principal appoints a healthcare agent to make medical treatment decisions on the principal's " +
      "behalf if the principal becomes unable to make or communicate those decisions personally.",
    keyClauses: [
      "Appointment of healthcare agent and alternate agent",
      "Scope of medical decision-making authority granted",
      "Conditions triggering the agent's authority, such as an incapacity determination",
      "Guidance or limitations on treatment decisions",
      "Coordination with any living will or advance directive",
      "Witnessing and/or notarization clause",
    ],
    fillInFields: [
      "[Principal's Full Name]",
      "[Healthcare Agent Name]",
      "[Alternate Healthcare Agent Name]",
      "[Effective Date]",
      "[Scope of Medical Decisions Authorized]",
      "[Incapacity Determination Method]",
      "[Witness Name(s)]",
    ],
    legalSummary:
      "Signing a medical power of attorney legally authorizes the named healthcare agent to make " +
      "medical treatment decisions for the principal once the principal is unable to make or " +
      "communicate those decisions personally. Its authority is limited to healthcare matters and does " +
      "not extend to financial or legal affairs. Many places require specific witnessing, " +
      "notarization, or statutory forms for a healthcare proxy to be honored by medical providers, so " +
      "those requirements where the principal lives need to be confirmed and completed separately.",
    chatgptPrompts: [
      "Explain what a medical power of attorney lets my healthcare agent decide on my behalf.",
      "How does a medical power of attorney work together with a living will?",
      "What should I discuss with the person I'm naming as my healthcare agent before signing?",
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
    definition:
      "A convertible promissory note is a debt instrument documenting a loan from an investor to a " +
      "company that is designed to convert into equity at a future qualified financing round, or be " +
      "repaid with interest if no such round occurs before maturity.",
    keyClauses: [
      "Principal amount and interest rate",
      "Maturity date and repayment terms",
      "Conversion mechanics upon a qualified financing",
      "Valuation cap and/or conversion discount",
      "Events of default",
      "Representations and warranties of the company",
    ],
    fillInFields: [
      "[Investor Name]",
      "[Company Name]",
      "[Principal Loan Amount]",
      "[Interest Rate]",
      "[Maturity Date]",
      "[Valuation Cap]",
      "[Conversion Discount Percentage]",
      "[Qualified Financing Threshold Amount]",
    ],
    legalSummary:
      "Signing a convertible promissory note creates a legal debt obligation from the company to the " +
      "investor, with terms specifying that this debt is intended to convert into equity if a " +
      "qualifying financing round happens, typically at a discount to that round's price or subject to " +
      "a valuation cap. If no qualifying round occurs by the maturity date, the note generally becomes " +
      "repayable with interest as an ordinary loan. Because convertible notes touch securities law, " +
      "cap table dilution, and tax treatment that vary significantly, the specific terms should be " +
      "reviewed by qualified counsel before any funds are exchanged.",
    chatgptPrompts: [
      "Explain how a convertible promissory note converts into equity in plain language.",
      "What's the difference between a valuation cap and a conversion discount in a convertible note?",
      "Generate a filled convertible promissory note using this template between an angel investor and an early-stage startup.",
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
    definition:
      "A loan modification agreement is a contract between an existing lender and borrower that " +
      "formally changes the terms of an already-existing loan, such as its interest rate, repayment " +
      "period, or payment schedule, rather than replacing it with a new loan.",
    keyClauses: [
      "Identification of the original loan being modified",
      "Revised interest rate",
      "Revised repayment term and/or maturity date",
      "Revised payment schedule and amounts",
      "Confirmation that other original loan terms remain in effect",
      "Conditions and effective date of the modification",
    ],
    fillInFields: [
      "[Lender Name]",
      "[Borrower Name]",
      "[Original Loan Date]",
      "[Original Principal Amount]",
      "[Revised Interest Rate]",
      "[Revised Repayment Term]",
      "[Revised Payment Schedule/Amount]",
      "[Effective Date of Modification]",
    ],
    legalSummary:
      "Signing a loan modification agreement legally changes specific terms of an existing loan, such " +
      "as its interest rate or payment schedule, while the underlying loan and any related security " +
      "remain otherwise in effect except as expressly modified. It does not create a new loan " +
      "obligation but adjusts the terms of the one already in place between the same lender and " +
      "borrower. Because modifications can affect tax treatment and, for secured loans, lien priority, " +
      "the final terms should be reviewed by a lawyer or accountant before signing, especially for " +
      "larger or secured loans.",
    chatgptPrompts: [
      "Explain what typically changes in a loan modification agreement versus refinancing.",
      "Help me understand what to check before agreeing to a modified interest rate and repayment schedule.",
      "Generate a filled loan modification agreement using this template that extends a loan's repayment term.",
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
    definition:
      "A line of credit agreement is a contract establishing a revolving credit arrangement in which a " +
      "lender agrees to make funds available to a borrower up to a set credit limit, allowing the " +
      "borrower to draw, repay, and redraw funds over time while paying interest on the outstanding " +
      "balance.",
    keyClauses: [
      "Credit limit and revolving draw mechanics",
      "Interest rate and calculation method on outstanding balance",
      "Draw request and repayment procedures",
      "Fees, such as commitment, draw, or unused-line fees",
      "Events of default and remedies",
      "Term and termination or renewal of the credit line",
    ],
    fillInFields: [
      "[Lender Name]",
      "[Borrower Name]",
      "[Credit Limit Amount]",
      "[Interest Rate]",
      "[Draw Period]",
      "[Repayment Terms]",
      "[Effective Date]",
      "[Maturity/Termination Date]",
    ],
    legalSummary:
      "Signing a line of credit agreement legally obligates the lender to make funds available up to " +
      "the agreed credit limit and obligates the borrower to repay amounts drawn plus interest " +
      "according to the agreed schedule. Unlike a single lump-sum loan, funds can be drawn and repaid " +
      "repeatedly during the term, with interest generally charged only on the outstanding balance. " +
      "Because revolving credit arrangements can raise lending-license and interest-rate-limit issues " +
      "that vary by jurisdiction, the final terms should be reviewed by a lawyer before signing.",
    chatgptPrompts: [
      "Explain how a revolving line of credit differs from a term loan.",
      "What terms should I negotiate in a line of credit agreement between two small businesses?",
      "Generate a filled line of credit agreement using this template between two small businesses.",
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
    definition:
      "A simple investment agreement is a contract documenting a straightforward cash investment made " +
      "into a company in exchange for equity or another defined interest, including basic " +
      "representations by the investor and the company.",
    keyClauses: [
      "Investment amount and form of consideration, such as equity or interest granted",
      "Investor representations, such as accredited status and investment intent",
      "Company representations and warranties",
      "Closing conditions and delivery of securities",
      "Use of investment proceeds",
      "Governing terms and transfer restrictions",
    ],
    fillInFields: [
      "[Investor Name]",
      "[Company Name]",
      "[Investment Amount]",
      "[Type/Class of Equity or Interest Granted]",
      "[Number/Percentage of Shares or Units]",
      "[Closing Date]",
      "[Use of Proceeds]",
    ],
    legalSummary:
      "Signing a simple investment agreement legally documents the investor's cash contribution and " +
      "the company's obligation to issue the agreed equity or defined interest in exchange, along with " +
      "the representations each party is making about the transaction. It is intended for smaller or " +
      "early-stage investments where a full stock purchase agreement and its extensive disclosures are " +
      "not necessary. Because issuing equity in exchange for investment triggers securities-law " +
      "requirements that vary by jurisdiction and investor type, the final terms should be reviewed by " +
      "a lawyer and accountant before any money changes hands.",
    chatgptPrompts: [
      "Explain what a simple investment agreement covers compared to a full stock purchase agreement.",
      "What investor representations are typically included in a small, early-stage investment agreement?",
      "Generate a filled simple investment agreement using this template for a small cash investment into a startup.",
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
    definition:
      "A founder vesting agreement is a contract that subjects a founder's already-issued or " +
      "to-be-issued shares to a vesting schedule, typically including a cliff period, and grants the " +
      "company a right to repurchase any unvested shares if the founder departs before those shares " +
      "fully vest.",
    keyClauses: [
      "Vesting schedule and cliff period",
      "Company repurchase right over unvested shares",
      "Triggering events, such as termination, resignation, or cause",
      "Acceleration provisions, if any, such as upon an acquisition",
      "83(b) election acknowledgment",
      "Transfer restrictions on unvested shares",
    ],
    fillInFields: [
      "[Founder Name]",
      "[Company Name]",
      "[Total Number of Shares Subject to Vesting]",
      "[Vesting Commencement Date]",
      "[Cliff Period]",
      "[Vesting Schedule Duration]",
      "[Repurchase Price Per Share]",
      "[Acceleration Trigger Events]",
    ],
    legalSummary:
      "Signing a founder vesting agreement legally puts the founder's shares on a schedule under which " +
      "they are earned over time, and gives the company the right to buy back any unvested shares at " +
      "the stated price if the founder leaves before the vesting period completes. It is meant to " +
      "protect the company and co-founders' interests if someone departs early after receiving a full " +
      "grant of shares upfront. Vesting arrangements can carry significant tax consequences, including " +
      "a time-sensitive 83(b) election, and securities-law implications, so the final terms should be " +
      "reviewed by a lawyer or accountant before signing.",
    chatgptPrompts: [
      "Explain how founder vesting with a cliff works and why companies use it.",
      "What is an 83(b) election and why does the deadline matter for a founder vesting agreement?",
      "Help me think through a fair vesting schedule and cliff for a two-founder startup.",
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
    definition:
      "A stock transfer agreement is a contract documenting the sale or transfer of existing shares in " +
      "a company from one shareholder to another party.",
    keyClauses: [
      "Identification of the shares being transferred",
      "Purchase price and payment terms",
      "Seller's representations and warranties of clear ownership",
      "Company or board consent and waiver of transfer restrictions",
      "Right of first refusal waiver, if applicable",
      "Effective date of transfer and delivery of share certificates",
    ],
    fillInFields: [
      "[Seller Name]",
      "[Buyer Name]",
      "[Company Name]",
      "[Number of Shares]",
      "[Class of Stock]",
      "[Purchase Price]",
      "[Effective Date]",
      "[Certificate Number(s)]",
    ],
    legalSummary:
      "Signing this agreement transfers legal ownership of the specified shares from the seller to the " +
      "buyer in exchange for the agreed price, and records the seller's confirmation that the shares " +
      "are validly held and free of undisclosed claims. It does not override any separate transfer " +
      "restrictions, rights of first refusal, or consents required under the company's own governing " +
      "documents.",
    chatgptPrompts: [
      "Explain what representations a seller typically makes in a Stock Transfer Agreement.",
      "Walk me through how to fill out a Stock Transfer Agreement for a private company share sale.",
      "What company approvals or waivers should I check for before transferring my shares to another shareholder?",
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
    definition:
      "A buy-sell agreement (equity) is a contract among a company's owners that establishes what " +
      "happens to an owner's shares upon a triggering event such as death, disability, or a desired " +
      "sale, including how the shares will be valued and who has the right to purchase them.",
    keyClauses: [
      "Triggering events, such as death, disability, voluntary exit, or termination",
      "Right of first refusal for remaining owners or the company",
      "Valuation method for the shares",
      "Payment terms and funding, such as installments or insurance proceeds",
      "Restrictions on transfers to outside parties",
      "Dispute resolution procedure",
    ],
    fillInFields: [
      "[Company Name]",
      "[Shareholder 1 Name]",
      "[Shareholder 2 Name]",
      "[Number of Shares]",
      "[Valuation Method]",
      "[Purchase Price or Formula]",
      "[Triggering Event]",
      "[Payment Terms]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement obligates the parties to follow an agreed process for buying and selling " +
      "an owner's equity when a triggering event occurs, instead of negotiating terms from scratch " +
      "under pressure. It gives remaining owners, or the company itself, the right to purchase a " +
      "departing owner's shares at a pre-agreed valuation and sets the payment terms for that " +
      "purchase.",
    chatgptPrompts: [
      "Explain the difference between a cross-purchase and an entity-purchase buy-sell structure.",
      "Help me fill out a Buy-Sell Agreement for two co-founders with equal equity.",
      "What valuation methods are commonly used in a Buy-Sell Agreement, and which fits a small private company?",
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
    definition:
      "A bill of sale is a document that records the transfer of ownership of a specific item of " +
      "personal property from a seller to a buyer in exchange for payment.",
    keyClauses: [
      "Description and identification of the item, including make, model, or serial/VIN",
      "Purchase price and payment method",
      "As-is condition disclosure",
      "Seller's statement of ownership and clear title",
      "Date and location of the sale",
      "Signatures of buyer and seller",
    ],
    fillInFields: [
      "[Seller Name]",
      "[Buyer Name]",
      "[Item Description]",
      "[Make/Model]",
      "[Serial Number/VIN]",
      "[Purchase Price]",
      "[Payment Method]",
      "[Sale Date]",
    ],
    legalSummary:
      "Signing this document transfers ownership of the described item from the seller to the buyer " +
      "once payment is made, and creates a dated record of the price and condition at the time of " +
      "sale. It serves as proof of purchase but does not guarantee the item's condition beyond what " +
      "the document itself states.",
    chatgptPrompts: [
      "Generate a filled Personal Property Bill of Sale for selling a used couch.",
      "What details should I include when selling a used car to a private buyer with a Bill of Sale?",
      "Explain the difference between an 'as-is' sale and one with a warranty in a Bill of Sale.",
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
    definition:
      "A pet custody and care agreement is a private contract between two people who share ownership " +
      "or care of a pet, setting out a schedule for time with the pet, division of expenses, and each " +
      "person's care responsibilities.",
    keyClauses: [
      "Statement of pet ownership or shared ownership",
      "Custody or visitation schedule",
      "Division of veterinary and other pet-related expenses",
      "Decision-making authority for medical care",
      "Responsibilities for food, supplies, and daily care",
      "Procedure for relocation or handling disputes",
    ],
    fillInFields: [
      "[Pet's Name]",
      "[Pet's Breed/Species]",
      "[Party A Name]",
      "[Party B Name]",
      "[Custody Schedule]",
      "[Expense Split Percentage]",
      "[Veterinarian Name]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement creates a private contractual arrangement between the parties regarding " +
      "a shared pet's schedule, expenses, and care, giving each party grounds to enforce those terms " +
      "against the other as a matter of contract. It is not the same as a court-ordered child custody " +
      "arrangement — pets are generally treated as personal property, and most courts do not apply " +
      "custody or visitation standards to them, so enforcement typically relies on the contract itself " +
      "rather than a family court process.",
    chatgptPrompts: [
      "Adapt this Pet Custody and Care Agreement for two roommates splitting time with a dog.",
      "Help me draft a fair expense split clause for a shared cat's vet bills.",
      "Explain what happens if one person breaks a Pet Custody and Care Agreement.",
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
    definition:
      "A personal property storage agreement is a contract under which one person stores their " +
      "belongings at another person's private property for a set period, in exchange for an agreed " +
      "fee, if any, and defined terms of access and liability.",
    keyClauses: [
      "Description of the items being stored",
      "Storage location and duration",
      "Storage fee and payment schedule, if any",
      "Access terms and pickup/retrieval procedure",
      "Liability and insurance for loss or damage",
      "Terms for early termination or unclaimed property",
    ],
    fillInFields: [
      "[Property Owner/Storer Name]",
      "[Property Host Name]",
      "[Description of Stored Items]",
      "[Storage Location]",
      "[Storage Fee]",
      "[Start Date]",
      "[End Date]",
      "[Access Terms]",
    ],
    legalSummary:
      "Signing this agreement establishes who is responsible for the stored items, what fee (if any) " +
      "applies, and how long the arrangement lasts, giving both sides a reference point if a dispute " +
      "arises over access, damage, or payment. It does not create the same regulatory protections as a " +
      "commercial self-storage lease, since it covers an informal arrangement between individuals.",
    chatgptPrompts: [
      "Generate a filled Personal Property Storage Agreement for storing furniture at a friend's garage.",
      "What liability terms should I include if I'm storing someone else's belongings at my house?",
      "Explain what happens if stored items are damaged and there's no insurance clause in the agreement.",
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
    definition:
      "A property management agreement is a contract between a property owner and a property manager " +
      "that authorizes the manager to handle day-to-day operations of a rental property, such as " +
      "collecting rent, coordinating maintenance, and managing tenant relations, on the owner's " +
      "behalf.",
    keyClauses: [
      "Scope of management services, including leasing, rent collection, maintenance, and tenant communication",
      "Management fee and payment structure",
      "Owner's authorized spending limits for repairs",
      "Term of the agreement and renewal",
      "Termination rights and notice period",
      "Insurance and liability allocation",
    ],
    fillInFields: [
      "[Property Owner Name]",
      "[Property Manager/Company Name]",
      "[Property Address]",
      "[Management Fee/Percentage]",
      "[Repair Spending Limit]",
      "[Term Start Date]",
      "[Term End Date]",
      "[Notice Period for Termination]",
    ],
    legalSummary:
      "Signing this agreement authorizes the property manager to act on the owner's behalf within the " +
      "described scope, such as collecting rent and arranging maintenance, and establishes the fee the " +
      "owner pays for those services. It also defines each party's liability and the process for " +
      "ending the arrangement, but it does not itself create a lease between the owner and any tenant.",
    chatgptPrompts: [
      "Explain what a Property Management Agreement typically covers before I sign one as a landlord.",
      "Help me set an appropriate repair spending limit clause for a property manager handling a single-family rental.",
      "Adapt this Property Management Agreement for a landlord who owns multiple rental units.",
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
    definition:
      "A room rental agreement is a lease-style contract between a landlord or master tenant and an " +
      "individual renting a single room within a larger shared property, covering rent, shared spaces, " +
      "and house rules.",
    keyClauses: [
      "Rent amount, due date, and payment method",
      "Description of the rented room and shared common areas",
      "Security deposit terms",
      "House rules covering guests, noise, cleaning, and shared utilities",
      "Access and entry rights",
      "Term length and move-out/termination notice",
    ],
    fillInFields: [
      "[Landlord Name]",
      "[Tenant Name]",
      "[Property Address]",
      "[Room Description]",
      "[Monthly Rent]",
      "[Security Deposit]",
      "[Lease Start Date]",
      "[Lease End Date]",
      "[Notice Period]",
    ],
    legalSummary:
      "Signing this agreement gives the tenant the right to occupy the specified room and use the " +
      "shared common areas under the stated rules, in exchange for paying rent, and obligates the " +
      "landlord to honor those occupancy terms for the agreed period. It also sets out how the " +
      "security deposit and notice period work, though rules on deposits and notice periods can vary " +
      "depending on where the property is located.",
    chatgptPrompts: [
      "Generate a filled Room Rental Agreement using this template for a shared apartment.",
      "What house rules should I add to a Room Rental Agreement for renting a spare bedroom?",
      "Explain the difference between a Room Rental Agreement and a full lease.",
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
    definition:
      "A remote work equipment agreement is a contract between an employer and a remote employee that " +
      "documents which company equipment was issued, how it may be used, and each party's " +
      "responsibilities for its care, maintenance, and return.",
    keyClauses: [
      "Inventory and description of issued equipment",
      "Permitted use, such as business use only or limited personal use",
      "Employee's care and security obligations",
      "Liability for loss, theft, or damage",
      "Return-of-equipment procedure upon termination",
      "Company's right to inspect or retrieve equipment",
    ],
    fillInFields: [
      "[Employee Name]",
      "[Employer/Company Name]",
      "[Equipment Description]",
      "[Serial Number/Asset Tag]",
      "[Issue Date]",
      "[Estimated Equipment Value]",
      "[Return Deadline]",
      "[Employee's Remote Work Address]",
    ],
    legalSummary:
      "Signing this agreement confirms the employee received the listed equipment and agrees to use, " +
      "secure, and eventually return it under the stated conditions, and clarifies who bears " +
      "responsibility if the equipment is lost, damaged, or not returned. It does not change the " +
      "employee's underlying employment terms; it only governs the equipment itself.",
    chatgptPrompts: [
      "Generate a filled Remote Work Equipment Agreement for a new remote employee receiving a laptop and monitor.",
      "What liability language should I include if an employee damages company equipment at home?",
      "Explain what a Remote Work Equipment Agreement should cover when an employee is terminated.",
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
    definition:
      "A performance improvement plan acknowledgment is a signed document confirming that an employee " +
      "has received and reviewed a formal performance improvement plan, including its stated goals, " +
      "support measures, and review timeline.",
    keyClauses: [
      "Reference to the specific performance concerns identified",
      "Goals and measurable expectations for improvement",
      "Support or resources offered to the employee",
      "Review checkpoints and final evaluation date",
      "Statement that signing acknowledges receipt, not agreement with the content",
      "Consequences if the goals are not met",
    ],
    fillInFields: [
      "[Employee Name]",
      "[Manager/Supervisor Name]",
      "[Position/Title]",
      "[PIP Start Date]",
      "[Review Checkpoint Date(s)]",
      "[Final Evaluation Date]",
      "[Performance Goals Summary]",
    ],
    legalSummary:
      "Signing this document confirms that the employee received and reviewed the performance " +
      "improvement plan on the stated date, and typically only acknowledges that they were informed of " +
      "it rather than requiring agreement with its conclusions. It creates a dated record that can be " +
      "referenced later if the employment relationship changes based on how the improvement period " +
      "proceeds.",
    chatgptPrompts: [
      "Explain what a Performance Improvement Plan Acknowledgment does and doesn't mean for an employee.",
      "Help me write measurable goals to include in a performance improvement plan before presenting it.",
      "Generate a filled Performance Improvement Plan Acknowledgment for a 60-day review period.",
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
    definition:
      "A bylaws adoption resolution is a formal, director-signed record stating that a corporation's " +
      "board of directors has reviewed and adopted a specific set of bylaws as the company's governing " +
      "rules.",
    keyClauses: [
      "Statement that the board has reviewed the proposed bylaws",
      "Formal resolution language adopting the bylaws",
      "Reference to, or attachment of, the bylaws document being adopted",
      "Effective date of adoption",
      "Director signatures certifying the vote or written consent",
      "Instruction to file the resolution with corporate records",
    ],
    fillInFields: [
      "[Corporation Name]",
      "[State of Incorporation]",
      "[Adoption Date]",
      "[Director Name(s)]",
      "[Bylaws Document Title/Version]",
      "[Meeting Date or Written Consent Date]",
    ],
    legalSummary:
      "Signing this resolution formally establishes the attached bylaws as the corporation's internal " +
      "governing rules, covering matters such as board structure, officer roles, and meeting " +
      "procedures, from the adoption date forward. It creates a dated corporate record showing that " +
      "the board approved this specific version of the bylaws, which is often needed to demonstrate " +
      "proper corporate formalities.",
    chatgptPrompts: [
      "Explain what a Bylaws Adoption Resolution is and why a corporation needs one.",
      "Help me draft the resolution language adopting a new set of corporate bylaws.",
      "What's the difference between a Bylaws Adoption Resolution and a general corporate resolution?",
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
    definition:
      "An operating agreement amendment is a signed document that modifies one or more specific " +
      "provisions of an LLC's existing operating agreement while leaving the rest of the original " +
      "agreement in effect.",
    keyClauses: [
      "Identification of the original operating agreement being amended",
      "Specific provision(s) being changed and their new language",
      "Effective date of the amendment",
      "Statement that all other terms of the original agreement remain unchanged",
      "Member approval or consent required for the amendment",
      "Signatures of members or managers",
    ],
    fillInFields: [
      "[LLC Name]",
      "[Original Operating Agreement Date]",
      "[Amendment Effective Date]",
      "[Section(s) Being Amended]",
      "[New Provision Language]",
      "[Member Name(s)]",
      "[Ownership Percentage Changes, if any]",
    ],
    legalSummary:
      "Signing this amendment changes only the specific provisions it identifies in the LLC's " +
      "operating agreement, such as ownership percentages, management structure, or distribution " +
      "rules, while every other term of the original agreement continues to apply. It typically " +
      "requires the level of member consent specified in the original operating agreement, or " +
      "otherwise applicable, to take effect.",
    chatgptPrompts: [
      "Explain what changes typically require an Operating Agreement Amendment versus a full rewrite.",
      "Help me draft an amendment changing ownership percentages among LLC members.",
      "Generate a filled Operating Agreement Amendment for adding a new member to an LLC.",
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
    definition:
      "A buy-sell agreement is a contract among the owners of a business that sets out in advance how " +
      "an owner's interest will be transferred or bought out upon a triggering event such as death, " +
      "disability, divorce, bankruptcy, or voluntary exit.",
    keyClauses: [
      "Triggering events (death, disability, divorce, bankruptcy, voluntary exit)",
      "Right of first refusal for remaining owners",
      "Valuation method for the departing owner's interest",
      "Purchase price payment terms (lump sum vs. installments)",
      "Funding mechanism, such as life or disability insurance",
      "Restrictions on transferring ownership to outside parties",
    ],
    fillInFields: [
      "[Company Name]",
      "[State of Formation]",
      "[Owner 1 Name]",
      "[Owner 2 Name]",
      "[Ownership Percentage]",
      "[Triggering Event]",
      "[Valuation Method]",
      "[Purchase Price Payment Terms]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement legally commits the owners to a predetermined process for buying and " +
      "selling ownership interests when a triggering event occurs, instead of negotiating terms after " +
      "the fact. It generally gives existing owners or the company the first right to purchase a " +
      "departing owner's stake at an agreed valuation, which helps prevent an outside party, creditor, " +
      "or estranged spouse's estate from becoming an unwanted co-owner.",
    chatgptPrompts: [
      "Generate a filled LLC Buy-Sell Agreement using this template for a two-member LLC with a 50/50 ownership split.",
      "Explain the difference between the valuation methods commonly used in a buy-sell agreement so I can choose one for my company.",
      "Adapt this Buy-Sell Agreement for a corporation with three shareholders and a right of first refusal.",
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
    definition:
      "A code of conduct acknowledgment is a signed statement in which an employee confirms they " +
      "received, read, and agree to abide by their employer's code of conduct policy.",
    keyClauses: [
      "Confirmation of receipt of the code of conduct",
      "Employee's agreement to comply with stated standards",
      "Acknowledgment that violations may lead to disciplinary action",
      "Statement that the policy may be updated periodically",
      "Employee identification and date of acknowledgment",
    ],
    fillInFields: [
      "[Employee Name]",
      "[Employee Job Title]",
      "[Company Name]",
      "[Code of Conduct Version/Date]",
      "[Acknowledgment Date]",
      "[Manager/HR Representative Name]",
    ],
    legalSummary:
      "Signing this document creates a dated record that the employee was given the code of conduct " +
      "and agreed to follow it, which an employer can point to if disciplinary or termination " +
      "decisions are later questioned. It does not create obligations beyond what the underlying code " +
      "of conduct already states, but it makes the employee's awareness and agreement easier to " +
      "demonstrate.",
    chatgptPrompts: [
      "Generate a filled Code of Conduct Acknowledgment for a new employee starting at a small company.",
      "Explain what an employee is actually agreeing to when they sign a code of conduct acknowledgment.",
      "Adapt this Code of Conduct Acknowledgment for a remote-first team rolling out an updated policy.",
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
    definition:
      "A data breach notification acknowledgment is a document combining a formal notice describing a " +
      "data security incident with the recipient's signed confirmation that they received it.",
    keyClauses: [
      "Description of the data breach, including when it occurred and was discovered",
      "Categories of personal data or information affected",
      "Steps the company has taken or will take in response",
      "Recommended actions for the affected individual or partner",
      "Contact information for follow-up questions",
      "Signature confirming receipt of the notice",
    ],
    fillInFields: [
      "[Company Name]",
      "[Recipient Name]",
      "[Date of Breach]",
      "[Date of Discovery]",
      "[Description of Incident]",
      "[Types of Data Affected]",
      "[Remedial Steps Taken]",
      "[Contact Person/Department]",
      "[Acknowledgment Date]",
    ],
    legalSummary:
      "Signing this document confirms that the recipient received formal notice of a specific data " +
      "security incident and the details the company disclosed about it. It documents the timing and " +
      "content of the notification but does not itself waive or create any rights the recipient may " +
      "have as a result of the breach.",
    chatgptPrompts: [
      "Generate a filled Data Breach Notification Acknowledgment for a small business notifying a client about a compromised database.",
      "Help me write a clear, non-alarming description of a data breach to include in this notification template.",
      "Adapt this Data Breach Notification Acknowledgment for notifying an employee whose payroll information was exposed.",
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
    definition:
      "A whistleblower policy acknowledgment is a signed statement in which an employee confirms they " +
      "understand the company's procedures for reporting suspected wrongdoing and the protections " +
      "against retaliation for reporting in good faith.",
    keyClauses: [
      "Overview of what conduct can be reported",
      "Reporting channels and procedure",
      "Confidentiality of the reporting process",
      "Non-retaliation protections for good-faith reports",
      "Consequences for knowingly false reports",
      "Employee acknowledgment and signature",
    ],
    fillInFields: [
      "[Employee Name]",
      "[Employee Job Title]",
      "[Company Name]",
      "[Policy Version/Date]",
      "[Reporting Channel/Contact]",
      "[Acknowledgment Date]",
    ],
    legalSummary:
      "Signing this document creates a record that the employee was informed of how to report " +
      "suspected misconduct and that good-faith reports are protected from retaliation under the " +
      "company's policy. It supports the employer's ability to show the policy was properly " +
      "communicated, while the underlying whistleblower policy itself defines the actual reporting " +
      "rights and protections.",
    chatgptPrompts: [
      "Generate a filled Whistleblower Policy Acknowledgment for a new hire at a mid-sized company.",
      "Explain in plain language what protections this whistleblower acknowledgment gives an employee who reports misconduct.",
      "Adapt this Whistleblower Policy Acknowledgment for a company rolling out a new anonymous reporting hotline.",
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
    definition:
      "A trademark license agreement is a contract in which the owner of a trademark grants another " +
      "party permission to use the mark under specified conditions while retaining ownership of it.",
    keyClauses: [
      "Description of the licensed trademark(s)",
      "Scope of permitted use, including goods/services, territory, and exclusivity",
      "Quality control standards and approval rights",
      "License fees or royalty structure",
      "Term and termination conditions",
      "Protection of goodwill and acknowledgment of ownership",
    ],
    fillInFields: [
      "[Licensor Name]",
      "[Licensee Name]",
      "[Trademark Description/Registration Number]",
      "[Licensed Goods or Services]",
      "[Territory]",
      "[Royalty Rate or Fee]",
      "[Term Length]",
      "[Effective Date]",
      "[Quality Control Standards]",
    ],
    legalSummary:
      "Signing this agreement grants the licensee a limited right to use the licensor's trademark for " +
      "specific goods, services, or purposes, without transferring ownership of the mark itself. It " +
      "typically obligates the licensee to maintain quality standards set by the licensor and to stop " +
      "using the mark once the agreement ends or is terminated.",
    chatgptPrompts: [
      "Generate a filled Trademark License Agreement using this template for a merchandise licensing deal.",
      "Explain the key terms of this Trademark License Agreement before I sign it as a licensee.",
      "Adapt this Trademark License Agreement for a co-branding partnership between two small businesses.",
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
    definition:
      "A work made for hire agreement is a contract establishing that work created by a contractor for " +
      "a hiring party will be owned by the hiring party from the moment it is created, with a backup " +
      "assignment clause if work-for-hire status does not apply.",
    keyClauses: [
      "Description of the work or deliverables covered",
      "Work-made-for-hire designation",
      "Backup assignment of rights if work-for-hire status is unavailable",
      "Contractor's waiver of moral rights, where applicable",
      "Compensation for the work",
      "Warranties that the work is original and non-infringing",
    ],
    fillInFields: [
      "[Hiring Company Name]",
      "[Contractor Name]",
      "[Description of Work/Deliverables]",
      "[Project Start Date]",
      "[Compensation Amount]",
      "[Payment Schedule]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement establishes upfront that the hiring company, not the contractor, owns " +
      "the work created under the engagement as soon as it is made. If the work doesn't legally " +
      "qualify as a work made for hire, the agreement's backup clause assigns the contractor's rights " +
      "to the hiring company instead, so ownership does not depend on that classification alone.",
    chatgptPrompts: [
      "Generate a filled Work Made for Hire Agreement for a freelance illustrator creating artwork for a company.",
      "Explain the difference between a work made for hire agreement and a copyright assignment.",
      "Adapt this Work Made for Hire Agreement for a software developer building a custom app.",
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
    definition:
      "A patent assignment agreement is a contract that transfers ownership of a patent or pending " +
      "patent application, along with the rights to enforce and license it, from one party to another.",
    keyClauses: [
      "Identification of the patent or patent application being assigned",
      "Assignment of all right, title, and interest",
      "Assignor's warranties of ownership and authority to assign",
      "Assignment of rights to sue for past infringement",
      "Cooperation clause for recording the assignment with the patent office",
      "Consideration or payment terms",
    ],
    fillInFields: [
      "[Assignor Name]",
      "[Assignee Name]",
      "[Patent Title]",
      "[Patent Application/Patent Number]",
      "[Filing Date]",
      "[Purchase Price/Consideration]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement transfers ownership of the identified patent or patent application from " +
      "the assignor to the assignee, including the right to enforce, license, or sell it going " +
      "forward. It typically also requires the assignor to cooperate with any paperwork needed to " +
      "record the transfer with the relevant patent office.",
    chatgptPrompts: [
      "Generate a filled Patent Assignment Agreement using this template for the sale of a single issued patent.",
      "Explain what an inventor gives up by signing this Patent Assignment Agreement.",
      "Adapt this Patent Assignment Agreement for transferring a pending patent application to a startup.",
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
    definition:
      "An IP licensing agreement is a contract that grants one party permission to use another party's " +
      "intellectual property, such as software, content, or a proprietary process, under defined terms " +
      "and conditions.",
    keyClauses: [
      "Description of the licensed intellectual property",
      "Scope of the license, including exclusivity, field of use, and territory",
      "License fees or royalty structure",
      "Term and renewal or termination conditions",
      "Ownership and reservation of rights not granted",
      "Warranties and limitations of liability",
    ],
    fillInFields: [
      "[Licensor Name]",
      "[Licensee Name]",
      "[Description of Licensed IP]",
      "[Scope of Use]",
      "[Territory]",
      "[License Fee/Royalty]",
      "[Term Length]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement gives the licensee permission to use the specified intellectual property " +
      "within the agreed scope, without transferring ownership of it. The licensor keeps all rights " +
      "not expressly granted, and the licensee's use is limited to what the agreement allows for as " +
      "long as the license remains in effect.",
    chatgptPrompts: [
      "Generate a filled IP Licensing Agreement using this template for licensing a proprietary software tool.",
      "Explain the key terms of this IP Licensing Agreement before I sign it as a licensee.",
      "Adapt this IP Licensing Agreement for licensing written content to a publisher.",
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
    definition:
      "A vendor non-disclosure agreement is a one-way confidentiality contract in which a company " +
      "shares protected information with a vendor or supplier who agrees not to disclose or misuse it.",
    keyClauses: [
      "Definition of confidential information",
      "Permitted use of the information for evaluating or performing the vendor relationship",
      "Exclusions from confidentiality, such as public or independently developed information",
      "Duration of confidentiality obligations",
      "Return or destruction of confidential materials",
      "Remedies for unauthorized disclosure",
    ],
    fillInFields: [
      "[Disclosing Company Name]",
      "[Vendor/Supplier Name]",
      "[Effective Date]",
      "[Purpose of Disclosure]",
      "[Confidentiality Period]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "Signing this agreement legally obligates the vendor to keep the disclosing company's shared " +
      "information confidential and to use it only for the stated purpose, such as evaluating or " +
      "fulfilling a supply arrangement. It generally does not require the company to keep the vendor's " +
      "own information confidential, since the obligations run in one direction only.",
    chatgptPrompts: [
      "Generate a filled Vendor Non-Disclosure Agreement using this template for sharing product specs with a potential supplier.",
      "Explain what information this Vendor NDA protects before I share pricing details with a vendor.",
      "Adapt this Vendor Non-Disclosure Agreement for a procurement process involving multiple bidding suppliers.",
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
    definition:
      "A multi-party non-disclosure agreement is a confidentiality contract binding three or more " +
      "parties to protect each other's confidential information under the same mutual obligations.",
    keyClauses: [
      "Definition of confidential information",
      "Mutual obligations owed by each party to all others",
      "Permitted use and disclosure restrictions",
      "Exclusions from confidentiality",
      "Duration of confidentiality obligations",
      "Handling of information if a party exits the arrangement",
    ],
    fillInFields: [
      "[Party A Name]",
      "[Party B Name]",
      "[Party C Name]",
      "[Purpose of Disclosure]",
      "[Effective Date]",
      "[Confidentiality Period]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "Signing this agreement legally binds every listed party to keep the others' confidential " +
      "information private and to use it only for the stated joint purpose, such as a collaboration or " +
      "joint venture. Because the obligations are mutual, each signer is both protected and restricted " +
      "in the same way, regardless of how many parties are involved.",
    chatgptPrompts: [
      "Generate a filled Multi-Party Non-Disclosure Agreement using this template for three companies exploring a joint venture.",
      "Explain how the obligations in this Multi-Party NDA differ from a standard two-party NDA.",
      "Adapt this Multi-Party Non-Disclosure Agreement for a group of collaborators on a joint research project.",
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
    definition:
      "A web design services agreement is a contract between a designer or agency and a client that " +
      "defines the design deliverables, revision process, payment terms, and ownership transfer for a " +
      "website design project.",
    keyClauses: [
      "Scope of design deliverables, such as mockups, wireframes, and assets",
      "Number of revision rounds included",
      "Project timeline and milestones",
      "Payment schedule and fees",
      "Ownership and IP transfer upon full payment",
      "Exclusions such as hosting, domain registration, and development or coding",
    ],
    fillInFields: [
      "[Designer/Agency Name]",
      "[Client Name]",
      "[Project Description]",
      "[Number of Revision Rounds]",
      "[Project Timeline]",
      "[Total Fee]",
      "[Payment Schedule]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement obligates the designer to deliver the agreed design work within the " +
      "defined scope and revision limits, and obligates the client to pay according to the agreed " +
      "schedule. Ownership of the final design assets typically transfers to the client only once " +
      "payment is complete, and the agreement makes clear that hosting, domain registration, and " +
      "development are not included unless stated separately.",
    chatgptPrompts: [
      "Generate a filled Web Design Services Agreement using this template for a small business website project.",
      "Explain what happens to ownership of the design files if I stop paying partway through this Web Design Services Agreement.",
      "Adapt this Web Design Services Agreement for a freelance designer offering a fixed two-round revision package.",
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
    definition:
      "A web development agreement is a contract between a client and a developer or agency that " +
      "defines the scope, deliverables, and terms for building and deploying a website or web " +
      "application.",
    keyClauses: [
      "Project scope and deliverables",
      "Technology stack and hosting requirements",
      "Payment schedule and milestones",
      "Testing and client acceptance process",
      "Post-launch support and maintenance window",
      "Source code and IP ownership upon final payment",
    ],
    fillInFields: [
      "[Developer/Agency Name]",
      "[Client Name]",
      "[Project Start Date]",
      "[Launch Date]",
      "[Technology Stack]",
      "[Total Project Fee]",
      "[Payment Milestones]",
      "[Support Period Length]",
      "[Acceptance Testing Period]",
    ],
    legalSummary:
      "Signing this agreement obligates the developer to build and deliver the website according to " +
      "the agreed specifications and obligates the client to pay per the agreed schedule. It also " +
      "determines who owns the source code and underlying intellectual property once work is complete, " +
      "and may set a defined window in which the developer must fix defects at no extra charge.",
    chatgptPrompts: [
      "Generate a filled Web Development Agreement using this template for a five-page marketing website with a 6-week timeline.",
      "Explain who owns the source code under this Web Development Agreement before and after final payment.",
      "Adapt this Web Development Agreement for a fixed-scope e-commerce site with a 30-day post-launch support window.",
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
    definition:
      "A wedding photography contract is an agreement between a couple and a photographer that sets " +
      "the terms for photographing a wedding, including coverage, deliverables, and payment.",
    keyClauses: [
      "Event date, time, and venue details",
      "Hours of coverage and photographer roles",
      "Deliverables (edited photos, albums, digital files, timeline)",
      "Retainer/deposit and payment schedule",
      "Cancellation and rescheduling terms",
      "Portfolio and promotional use consent for the images",
    ],
    fillInFields: [
      "[Photographer Name]",
      "[Client Names]",
      "[Wedding Date]",
      "[Venue Name/Address]",
      "[Coverage Start Time]",
      "[Coverage End Time]",
      "[Retainer Amount]",
      "[Total Fee]",
      "[Delivery Timeline]",
    ],
    legalSummary:
      "Signing this contract commits the photographer to provide the agreed coverage and deliverables " +
      "on the specified date and commits the couple to pay the agreed fees, including any " +
      "non-refundable retainer. It also fixes what happens if either party cancels or reschedules, and " +
      "clarifies whether the photographer may use the resulting images for portfolio or promotional " +
      "purposes.",
    chatgptPrompts: [
      "Generate a filled Wedding Photography Contract using this template for a full-day booking with a second shooter.",
      "Explain what happens to my retainer if I need to reschedule under this Wedding Photography Contract.",
      "Adapt this Wedding Photography Contract for an elopement package with only 4 hours of coverage.",
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
    definition:
      "A photography services agreement is a contract between a photographer and a client that defines " +
      "the terms of a photo session and the usage rights granted over the resulting images.",
    keyClauses: [
      "Session details (date, location, subject matter)",
      "Fee and payment terms",
      "Usage rights granted to the client",
      "Photographer's retained and portfolio rights",
      "Image delivery format and timeline",
      "Copyright ownership of the images",
    ],
    fillInFields: [
      "[Photographer Name]",
      "[Client Name]",
      "[Session Date]",
      "[Session Location]",
      "[Session Fee]",
      "[Number of Final Images]",
      "[Usage Rights Granted]",
      "[Delivery Deadline]",
    ],
    legalSummary:
      "Signing this agreement commits the photographer to deliver the agreed images and grants the " +
      "client a defined license to use them for the specified purposes, while the photographer " +
      "typically retains copyright and may keep the right to display the images in a portfolio. It " +
      "also fixes payment obligations and delivery timing between the parties.",
    chatgptPrompts: [
      "Generate a filled Photography Services Agreement using this template for a commercial product photo shoot.",
      "Explain what usage rights this Photography Services Agreement actually grants the client versus the photographer.",
      "Adapt this Photography Services Agreement for a one-hour portrait session with personal, non-commercial use only.",
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
    definition:
      "A model release form is a signed document in which a person being photographed or filmed grants " +
      "a photographer or videographer permission to use their image or likeness for specified " +
      "purposes.",
    keyClauses: [
      "Grant of rights to use the model's image or likeness",
      "Permitted use scope (commercial, editorial, portfolio, social media)",
      "Compensation, if any",
      "Duration and territory of the grant",
      "Waiver of rights to inspect or approve final use",
      "Parent or guardian consent for minors",
    ],
    fillInFields: [
      "[Photographer/Company Name]",
      "[Model Name]",
      "[Shoot Date]",
      "[Shoot Location]",
      "[Permitted Use(s)]",
      "[Compensation Amount, if any]",
      "[Parent/Guardian Name (if minor)]",
    ],
    legalSummary:
      "Signing this form grants the photographer or company the right to use the model's image or " +
      "likeness for the purposes described, and waives the model's right to further compensation or " +
      "approval beyond what is stated, within the scope granted. It does not transfer any other " +
      "personal rights the model may hold and applies only to the specific images or footage covered.",
    chatgptPrompts: [
      "Explain what a Model Release actually grants before I ask someone to sign one.",
      "Generate a filled Model Release Form using this template for a commercial ad campaign shoot.",
      "Adapt this Model Release Form to include a minor with parent/guardian consent.",
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
    definition:
      "A website terms of service acknowledgment is a short document in which a user confirms, in " +
      "writing, that they have read and agreed to a website's published terms of service.",
    keyClauses: [
      "Reference to and incorporation of the underlying Terms of Service",
      "Statement that the user has read and understood the terms",
      "Effective date of acceptance",
      "User identification details",
      "Signature and date confirming agreement",
    ],
    fillInFields: [
      "[Company/Website Name]",
      "[User Name]",
      "[Terms of Service Version/Date]",
      "[Terms of Service URL]",
      "[Acknowledgment Date]",
      "[User Email]",
    ],
    legalSummary:
      "Signing this acknowledgment creates a dated record that a specific user affirmatively agreed to " +
      "the referenced Terms of Service at that point in time, which can help demonstrate that the user " +
      "had notice of and accepted those terms. It does not itself create the underlying obligations, " +
      "since those come from the separately published Terms of Service being acknowledged.",
    chatgptPrompts: [
      "Generate a filled Website Terms of Service Acknowledgment using this template for a new SaaS user.",
      "Explain the difference between this acknowledgment document and the actual Terms of Service it references.",
      "Adapt this Website Terms of Service Acknowledgment for a mobile app instead of a website.",
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
    definition:
      "An acceptable use policy acknowledgment is a short document in which a user confirms, in " +
      "writing, that they have read and will comply with a service's acceptable use policy.",
    keyClauses: [
      "Reference to and incorporation of the underlying Acceptable Use Policy",
      "Statement that the user has read and understood the rules",
      "Consequences of noncompliance, such as suspension of access",
      "Effective date of acknowledgment",
      "Signature and date confirming agreement",
    ],
    fillInFields: [
      "[Company/Service Name]",
      "[User Name]",
      "[Acceptable Use Policy Version/Date]",
      "[Acceptable Use Policy URL]",
      "[Acknowledgment Date]",
      "[Account/Username]",
    ],
    legalSummary:
      "Signing this acknowledgment creates a dated record that a user was notified of and agreed to " +
      "comply with the referenced Acceptable Use Policy before or during their use of the service. It " +
      "supports the provider's ability to enforce that policy, including restricting or terminating " +
      "access for violations, but the substantive rules still live in the separately published policy.",
    chatgptPrompts: [
      "Generate a filled Acceptable Use Policy Acknowledgment using this template for a new platform user.",
      "Explain what signing this Acceptable Use Policy Acknowledgment actually commits a user to.",
      "Adapt this Acceptable Use Policy Acknowledgment for an API access program instead of general website use.",
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
    definition:
      "A Proprietary Information and Inventions Agreement (PIIA) is an employment-related contract in " +
      "which an employee agrees to keep company information confidential and to assign to the company " +
      "the rights to inventions created during their employment.",
    keyClauses: [
      "Confidentiality obligations for proprietary and company information",
      "Assignment of work-related inventions to the company",
      "Prior inventions carve-out and disclosure schedule",
      "Duty to disclose inventions made during employment",
      "Return of company property and materials upon termination",
      "Survival of obligations after employment ends",
    ],
    fillInFields: [
      "[Company Name]",
      "[Employee Name]",
      "[Employment Start Date]",
      "[Employee Job Title]",
      "[Prior Inventions List/Exhibit]",
      "[Effective Date]",
      "[State/Jurisdiction of Employment]",
    ],
    legalSummary:
      "Signing this agreement obligates the employee to keep the company's confidential information " +
      "secret both during and after employment, and assigns to the company ownership of inventions and " +
      "work product the employee creates within the scope of employment, other than inventions " +
      "properly disclosed as pre-existing. The confidentiality obligations typically survive " +
      "termination of employment.",
    chatgptPrompts: [
      "Generate a filled Proprietary Information and Inventions Agreement using this template for a new software engineer hire.",
      "Explain what a PIIA actually assigns to the company versus what an employee keeps.",
      "Adapt this PIIA to include a specific prior inventions disclosure schedule for the employee.",
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
    definition:
      "A short-form mutual NDA is a condensed non-disclosure agreement in which two parties each agree " +
      "to keep information the other shares confidential, without the extended terms of a full-length " +
      "agreement.",
    keyClauses: [
      "Definition of confidential information",
      "Mutual obligation to keep information confidential",
      "Permitted use and exclusions, such as publicly known information",
      "Duration of confidentiality obligations",
      "Return or destruction of confidential materials",
    ],
    fillInFields: [
      "[Party A Name]",
      "[Party B Name]",
      "[Effective Date]",
      "[Purpose of Discussion]",
      "[Confidentiality Term Length]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "Signing this NDA obligates both parties to keep information shared during their discussions " +
      "confidential and to use it only for the stated purpose, for the agreed period of time. It " +
      "creates mutual, reciprocal obligations rather than a one-way restriction, though it leaves out " +
      "the more detailed carve-outs and remedies found in a full-length mutual NDA.",
    chatgptPrompts: [
      "Generate a filled Short-Form Mutual NDA using this template for an early-stage partnership discussion.",
      "Explain the difference between this Short-Form Mutual NDA and a full mutual NDA.",
      "Adapt this Short-Form Mutual NDA for a one-time vendor evaluation call.",
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
    definition:
      "A reference letter is a signed statement from a former employer, landlord, or colleague that " +
      "describes their relationship with an individual and offers an assessment of that person's " +
      "character, work, or performance.",
    keyClauses: [
      "Description of the relationship between the writer and the subject",
      "Duration of time the writer has known the subject",
      "Specific examples supporting the recommendation",
      "Overall assessment and recommendation statement",
      "Writer's contact information for follow-up",
      "Signature and date",
    ],
    fillInFields: [
      "[Reference Writer Name]",
      "[Writer Title/Role]",
      "[Subject Name]",
      "[Relationship to Subject]",
      "[Duration Known]",
      "[Writer Contact Information]",
      "[Date of Letter]",
    ],
    legalSummary:
      "Signing this letter creates a dated, attributable statement of the writer's honest opinion " +
      "about the subject, which the subject can share with third parties such as prospective employers " +
      "or landlords. It does not create any ongoing legal obligation between the writer and the " +
      "subject, but the writer may be responsible for the accuracy of the statements made in it.",
    chatgptPrompts: [
      "Generate a filled Reference Letter using this template for a former employee applying to a new job.",
      "Explain what I should and shouldn't include when writing a Reference Letter for a former tenant.",
      "Adapt this Reference Letter for a colleague reference instead of an employer reference.",
    ],
  },
);

FREE_TEMPLATES.push(
  {
    slug: "request-for-proposal",
    name: "Request for Proposal (RFP)",
    seoTitle: "Free Request for Proposal (RFP) Template",
    description:
      "A structured document a business issues to solicit competing proposals from vendors for a defined " +
      "project, service, or purchase.",
    useCase:
      "Use this when you need to solicit bids from multiple vendors for a project — a website build, a " +
      "marketing campaign, a construction job, a software implementation — and want every bidder responding " +
      "to the same scope, timeline, and evaluation criteria so their proposals can be compared fairly.",
    signerLabels: ["Issuing Organization"],
    definition:
      "A Request for Proposal (RFP) is a formal solicitation document an organization issues to invite " +
      "qualified vendors to submit competing proposals describing how they would perform a defined scope of " +
      "work, along with pricing and timeline.",
    keyClauses: [
      "Project background and objectives",
      "Scope of work and deliverables",
      "Proposal submission requirements and format",
      "Evaluation criteria and selection process",
      "Key dates and submission deadline",
      "Terms governing the RFP process itself",
    ],
    fillInFields: [
      "[Issuing Organization Name]",
      "[Project Title]",
      "[Project Background/Objectives]",
      "[Scope of Work Summary]",
      "[Proposal Due Date]",
      "[Anticipated Project Start Date]",
      "[Contact Name and Email]",
      "[Budget Range (optional)]",
    ],
    legalSummary:
      "Signing an RFP authenticates it as an official solicitation from the issuing organization, but the RFP " +
      "itself is not a binding contract — it invites offers rather than accepting one. The actual contractual " +
      "obligations only arise later, once the organization selects a vendor and both sides sign a separate " +
      "agreement.",
    chatgptPrompts: [
      "Generate a filled Request for Proposal using this template for a company sourcing a new website build.",
      "Review this RFP's scope of work section and suggest evaluation criteria I'm missing.",
      "Adapt this Request for Proposal for a construction project instead of a software project.",
    ],
    pdfPath: "/free-templates/request-for-proposal.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.3710106209150327, yFrac: 0.1833333333333334, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.27871212121212136, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "byod-policy",
    name: "BYOD Policy",
    seoTitle: "Free Bring Your Own Device (BYOD) Policy Template",
    description:
      "An employer's policy — plus a signed employee acknowledgment — governing personal phones, laptops, and " +
      "tablets used for work.",
    useCase:
      "Use this when employees use their own phones, laptops, or tablets to access company email, files, or " +
      "systems, and you need documented security requirements, usage limits, and an acknowledgment on file " +
      "before granting that access.",
    signerLabels: ["Employer", "Employee"],
    recurringCategory: "Employment",
    definition:
      "A Bring Your Own Device (BYOD) Policy is an employer's written policy, acknowledged in writing by the " +
      "employee, that sets the security requirements, permitted uses, and company rights that apply when an " +
      "employee uses a personally owned device to access work systems or data.",
    keyClauses: [
      "Approved device types and eligibility",
      "Minimum security requirements (passcodes, encryption, updates)",
      "Company access to and monitoring of work-related data on the device",
      "Reimbursement for business-related use",
      "Acceptable use and prohibited activities",
      "Data removal and device requirements upon termination",
    ],
    fillInFields: [
      "[Employer Name]",
      "[Employee Name]",
      "[Effective Date]",
      "[Approved Device Types]",
      "[Minimum Security Requirements]",
      "[Reimbursement Amount/Policy]",
      "[Data Removal Procedure Upon Termination]",
    ],
    legalSummary:
      "Signing this policy puts the employee on notice of the security and use requirements attached to using " +
      "a personal device for work, and confirms their agreement to the company's right to remove company data " +
      "from that device. It does not transfer ownership of the device itself, but it does establish grounds " +
      "for restricting access if the employee doesn't comply.",
    chatgptPrompts: [
      "Generate a filled BYOD Policy using this template for a 15-person remote company.",
      "Explain what security requirements are reasonable to require in a BYOD Policy for personal phones.",
      "Adapt this BYOD Policy to also cover employee-owned laptops, not just phones.",
    ],
    pdfPath: "/free-templates/byod-policy.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.27814624183006537, yFrac: 0.14166666666666672, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.2370454545454547, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.2823366013071895, yFrac: 0.3073484848484849, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.4027272727272728, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "contributor-license-agreement",
    name: "Individual Contributor License Agreement (CLA)",
    seoTitle: "Free Individual Contributor License Agreement (CLA) Template",
    description:
      "An individual open-source contributor licenses their code contributions to a project or company under " +
      "defined copyright and patent terms.",
    useCase:
      "Use this when an individual contributes code, documentation, or other work to your open-source project " +
      "or codebase, and you need clear, written confirmation of what rights the project receives to use, " +
      "modify, and redistribute that contribution.",
    signerLabels: ["Project/Company", "Contributor"],
    recurringCategory: "Intellectual Property",
    definition:
      "An Individual Contributor License Agreement (CLA) is an agreement in which an individual grants a " +
      "project or company a license to use, modify, and redistribute their contributed work, and confirms " +
      "they have the right to make that grant.",
    keyClauses: [
      "Definition of \"contribution\"",
      "Grant of copyright license to the project",
      "Grant of patent license covering the contribution",
      "Contributor's representations of originality and authority to contribute",
      "Disclaimer of warranty on the contributed work",
      "Governing law",
    ],
    fillInFields: [
      "[Project/Company Name]",
      "[Contributor Name]",
      "[Contributor Email or Username]",
      "[Project Name/Repository]",
      "[Effective Date]",
      "[Governing State/Jurisdiction]",
    ],
    legalSummary:
      "Signing this CLA grants the named project or company a license to use and redistribute the " +
      "contributor's submitted work and confirms the contributor had the right to make that contribution. " +
      "Copyright and patent assignments carry real legal and tax complexity that varies by jurisdiction and " +
      "by what's actually being contributed, so any project relying on this at scale should have it reviewed " +
      "by a lawyer rather than treating this template as a complete answer.",
    chatgptPrompts: [
      "Generate a filled Individual Contributor License Agreement using this template for a new open-source contributor.",
      "Explain in plain language what rights this CLA gives the project over my code contribution.",
      "Compare this CLA's patent license grant to what a typical open-source project might require.",
    ],
    pdfPath: "/free-templates/contributor-license-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.34355718954248365, yFrac: 0.6734848484848489, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.7688636363636367, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.29257761437908497, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "late-payment-demand-letter",
    name: "Late Payment Demand Letter",
    seoTitle: "Free Late Payment Demand Letter Template",
    description:
      "A firm, professional letter demanding payment of a specific overdue invoice before pursuing more " +
      "aggressive collection action.",
    useCase:
      "Use this when a client or customer's invoice is significantly overdue, you've already sent normal " +
      "reminders, and you need a formal, dated demand for payment on record before considering collections, " +
      "late fees, or legal action.",
    signerLabels: ["Sender"],
    definition:
      "A Late Payment Demand Letter is a formal written notice from a business or freelancer to a client " +
      "demanding payment of a specific overdue invoice by a stated deadline, and describing the consequences " +
      "of continued non-payment.",
    keyClauses: [
      "Reference to the specific overdue invoice and amount",
      "Number of days the payment is past due",
      "Firm demand for payment by a new deadline",
      "Consequences of continued non-payment (late fees, interest, collections, legal action)",
      "Offer to discuss a payment arrangement",
      "Sender's contact information",
    ],
    fillInFields: [
      "[Sender/Business Name]",
      "[Recipient/Client Name]",
      "[Invoice Number]",
      "[Invoice Date]",
      "[Amount Due]",
      "[Original Payment Due Date]",
      "[Days Overdue]",
      "[New Payment Deadline]",
    ],
    legalSummary:
      "Signing and sending this letter creates a dated, written record that formal demand for payment was " +
      "made, which can matter later if the sender pursues late fees, collections, or legal action. It does " +
      "not by itself change the underlying contract or invoice terms, and any late fees or interest charged " +
      "must already be authorized by the original agreement or applicable law.",
    chatgptPrompts: [
      "Generate a filled Late Payment Demand Letter using this template for a freelance invoice that's 45 days overdue.",
      "Make this Late Payment Demand Letter firmer without sounding threatening or unprofessional.",
      "Explain what I should do if the client still doesn't pay after this demand letter.",
    ],
    pdfPath: "/free-templates/late-payment-demand-letter.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2603137254901961, yFrac: 0.4785353535353538, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.5739141414141418, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "advisor-equity-agreement",
    name: "Advisor Equity Agreement",
    seoTitle: "Free Advisor Equity Agreement Template",
    description:
      "A startup grants a small equity stake to an advisor in exchange for defined advisory services over a " +
      "vesting period.",
    useCase:
      "Use this when a startup wants to bring on an advisor — for expertise, introductions, or guidance — and " +
      "compensate them with equity that vests over time instead of, or in addition to, cash.",
    signerLabels: ["Company", "Advisor"],
    recurringCategory: "Equity",
    definition:
      "An Advisor Equity Agreement is a contract in which a company grants an individual advisor the right to " +
      "a defined equity stake, subject to a vesting schedule, in exchange for ongoing advisory services over " +
      "a set term.",
    keyClauses: [
      "Description of advisory services to be provided",
      "Equity grant amount and type",
      "Vesting schedule and cliff period",
      "Confidentiality obligations",
      "Assignment of IP created as part of the advisory work",
      "Term, termination, and treatment of unvested equity",
      "Advisor's independent contractor status",
    ],
    fillInFields: [
      "[Company Name]",
      "[Advisor Name]",
      "[Effective Date]",
      "[Advisory Services Description]",
      "[Equity Amount/Percentage]",
      "[Vesting Period]",
      "[Cliff Period]",
      "[Termination Notice Period]",
    ],
    legalSummary:
      "Signing this agreement obligates the advisor to provide the described services and, in exchange, gives " +
      "them a contractual right to the granted equity as it vests — not immediate outright ownership. Equity " +
      "grants carry real tax consequences (including for the company's cap table and the advisor's personal " +
      "tax situation) and interact with corporate formation documents in ways that vary by entity type and " +
      "jurisdiction, so this template is a starting point, not a substitute for review by a lawyer and " +
      "accountant before signing.",
    chatgptPrompts: [
      "Generate a filled Advisor Equity Agreement using this template for a startup advisor granted 0.25% equity.",
      "Explain the difference between a cliff period and a vesting schedule in this Advisor Equity Agreement.",
      "What questions should I ask a lawyer before signing this Advisor Equity Agreement as the advisor?",
    ],
    pdfPath: "/free-templates/advisor-equity-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 2, xFrac: 0.2798562091503268, yFrac: 0.06060606060606061, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 2, xFrac: 0.15376960784313726, yFrac: 0.1559848484848486, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 2, xFrac: 0.26238071895424836, yFrac: 0.22628787878787882, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 2, xFrac: 0.15376960784313726, yFrac: 0.3216666666666668, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  {
    slug: "hackathon-participation-agreement",
    name: "Hackathon Participation & IP Agreement",
    seoTitle: "Free Hackathon Participation & IP Agreement Template",
    description:
      "Event organizers use this to define code/IP ownership, a liability waiver, and a code-of-conduct " +
      "acknowledgment for hackathon participants.",
    useCase:
      "Use this when organizing a hackathon and you need participants to agree upfront on who owns the code " +
      "and other work product built during the event, to accept a liability waiver for participating, and to " +
      "acknowledge the event's code of conduct.",
    signerLabels: ["Organizer", "Participant"],
    recurringCategory: "Intellectual Property",
    definition:
      "A Hackathon Participation & IP Agreement is a contract between event organizers and a participant that " +
      "sets the ownership of work created during the event, waives certain liability for participating, and " +
      "records the participant's acknowledgment of the event's code of conduct.",
    keyClauses: [
      "Ownership of code and other IP created during the event",
      "License granted to organizer for demo, judging, and promotional use",
      "Liability waiver and assumption of risk",
      "Code of conduct acknowledgment",
      "Eligibility requirements and grounds for disqualification",
      "Media and publicity release",
    ],
    fillInFields: [
      "[Event Name]",
      "[Organizer Name]",
      "[Participant Name]",
      "[Event Dates]",
      "[Team Name (if applicable)]",
      "[Code of Conduct Reference]",
      "[Effective Date]",
    ],
    legalSummary:
      "Signing this agreement confirms the participant's acceptance of the stated IP ownership terms, the " +
      "liability waiver for participating in the event, and the event's code of conduct. It does not by " +
      "itself resolve IP disputes between team members on a multi-person team — those are typically addressed " +
      "separately in a team agreement.",
    chatgptPrompts: [
      "Generate a filled Hackathon Participation & IP Agreement using this template for a weekend hackathon.",
      "Explain what IP ownership terms are typical for hackathon participants versus the organizing company.",
      "Adapt this Hackathon Participation & IP Agreement for a hackathon where teams keep their own IP.",
    ],
    pdfPath: "/free-templates/hackathon-participation-agreement.pdf",
    fields: [
      { id: "ft0", signerOrder: 1, page: 1, xFrac: 0.2819419934640523, yFrac: 0.5770202020202023, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft1", signerOrder: 1, page: 1, xFrac: 0.15376960784313726, yFrac: 0.6723989898989902, wFrac: 0.16, hFrac: 0.04, type: "date" },
      { id: "ft2", signerOrder: 2, page: 1, xFrac: 0.28850000000000003, yFrac: 0.7427020202020205, wFrac: 0.26, hFrac: 0.07, type: "signature" },
      { id: "ft3", signerOrder: 2, page: 1, xFrac: 0.15376960784313726, yFrac: 0.8380808080808083, wFrac: 0.16, hFrac: 0.04, type: "date" },
    ],
  },
  ...LEGACY_BATCH_TEMPLATES,
);

export function getFreeTemplate(slug: string): FreeTemplate | undefined {
  return FREE_TEMPLATES.find((t) => t.slug === slug);
}
