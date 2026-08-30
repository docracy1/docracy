/** PDF block builders for legacy batch templates — mirrors generateFreeTemplatePdfs.mjs layout standard. */

export const TEXT_BLANK = "_".repeat(28);
export const DATE_BLANK = "____ / ____ / ______";

/** @param {string} title @param {[string,string]} parties @param {string[]} sections */
export function serviceAgreementBlocks(title, parties, sections) {
  const [a, b] = parties;
  return [
    { type: "section", text: "Parties" },
    { type: "field", label: `${a}: `, blank: TEXT_BLANK },
    { type: "field", label: `${b}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "field", label: "Effective Date: ", blank: DATE_BLANK },
    ...sections.flatMap((heading, i) => [
      { type: "section", text: heading },
      {
        type: "paragraph",
        text:
          i === 0
            ? `The parties agree to the terms set forth in this ${title} regarding the services and obligations described below.`
            : `The parties acknowledge and agree to the ${heading.toLowerCase()} provisions as stated in this document and any referenced schedules.`,
      },
      { type: "field", label: "Details: ", blank: TEXT_BLANK },
    ]),
    { type: "section", text: "Governing Law" },
    {
      type: "paragraph",
      text: `This Agreement shall be governed by the laws of the State/Country of ${TEXT_BLANK}, without regard to conflict-of-law principles.`,
    },
    { type: "signatures", signers: [{ label: a, order: 1 }, { label: b, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function releaseFormBlocks(title, parties) {
  const [releasor, releasee] = parties;
  return [
    { type: "section", text: "Parties" },
    { type: "field", label: `${releasor}: `, blank: TEXT_BLANK },
    { type: "field", label: `${releasee}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "section", text: "Release" },
    {
      type: "paragraph",
      text: `In consideration of the mutual promises herein, ${releasor} hereby releases ${releasee} from claims arising from the matter described below, to the fullest extent permitted by law.`,
    },
    { type: "field", label: "Subject Matter / Event: ", blank: TEXT_BLANK },
    { type: "field", label: "Effective Date: ", blank: DATE_BLANK },
    { type: "section", text: "Representations" },
    {
      type: "paragraph",
      text: `${releasor} represents that this release is given voluntarily, with opportunity to consult counsel, and that ${releasor} has not assigned any claim being released.`,
    },
    { type: "section", text: "Governing Law" },
    {
      type: "paragraph",
      text: `This Release shall be governed by the laws of ${TEXT_BLANK}.`,
    },
    { type: "signatures", signers: [{ label: releasor, order: 1 }, { label: releasee, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function noticeLetterBlocks(title, parties) {
  const [sender, recipient] = parties;
  return [
    { type: "section", text: "Notice Details" },
    { type: "field", label: "Date: ", blank: DATE_BLANK },
    { type: "field", label: `${sender}: `, blank: TEXT_BLANK },
    { type: "field", label: `${recipient}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "field", label: "Property / Subject Address: ", blank: TEXT_BLANK },
    { type: "section", text: "Notice" },
    {
      type: "paragraph",
      text: `This document serves as formal written notice under the applicable agreement or law. The ${sender.toLowerCase()} provides the following statement:`,
    },
    { type: "field", label: "Notice Statement: ", blank: TEXT_BLANK },
    { type: "field", label: "Effective Date of Notice: ", blank: DATE_BLANK },
    { type: "section", text: "Contact Information" },
    { type: "field", label: "Forwarding Address / Contact: ", blank: TEXT_BLANK },
    { type: "signatures", signers: [{ label: sender, order: 1 }, { label: recipient, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function realEstateLeaseBlocks(title, parties) {
  const [landlord, tenant] = parties;
  return [
    { type: "section", text: "Parties and Premises" },
    { type: "field", label: `${landlord}: `, blank: TEXT_BLANK },
    { type: "field", label: `${tenant}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "field", label: "Premises Address: ", blank: TEXT_BLANK },
    { type: "section", text: "Term and Rent" },
    { type: "field", label: "Lease Start Date: ", blank: DATE_BLANK },
    { type: "field", label: "Lease End Date (if fixed): ", blank: DATE_BLANK },
    { type: "field", label: "Monthly Rent: ", blank: TEXT_BLANK },
    { type: "field", label: "Security Deposit: ", blank: TEXT_BLANK },
    { type: "section", text: "Use and Maintenance" },
    {
      type: "paragraph",
      text: "The tenant shall use the premises only for permitted residential or commercial purposes and maintain the premises in good condition, ordinary wear and tear excepted.",
    },
    { type: "section", text: "Default and Remedies" },
    {
      type: "paragraph",
      text: "If either party fails to perform material obligations, the non-defaulting party may pursue remedies available under this agreement and applicable law after any required notice and cure period.",
    },
    { type: "section", text: "Governing Law" },
    {
      type: "paragraph",
      text: `This lease shall be governed by the laws of ${TEXT_BLANK}.`,
    },
    { type: "signatures", signers: [{ label: landlord, order: 1 }, { label: tenant, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function businessPurchaseBlocks(title, parties) {
  const [buyer, seller] = parties;
  return [
    { type: "section", text: "Parties" },
    { type: "field", label: `${buyer}: `, blank: TEXT_BLANK },
    { type: "field", label: `${seller}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "section", text: "Assets / Business" },
    { type: "field", label: "Description of Assets or Business: ", blank: TEXT_BLANK },
    { type: "field", label: "Purchase Price: ", blank: TEXT_BLANK },
    { type: "field", label: "Closing Date: ", blank: DATE_BLANK },
    { type: "section", text: "Representations" },
    {
      type: "paragraph",
      text: "Seller represents it has good and marketable title to the assets, free of undisclosed liens, and authority to enter this transaction.",
    },
    { type: "section", text: "Conditions and Closing" },
    {
      type: "paragraph",
      text: "Closing is subject to payment of the purchase price and delivery of agreed documents. Risk of loss passes as stated in the closing checklist.",
    },
    { type: "section", text: "Governing Law" },
    {
      type: "paragraph",
      text: `This Agreement shall be governed by the laws of ${TEXT_BLANK}.`,
    },
    { type: "signatures", signers: [{ label: buyer, order: 1 }, { label: seller, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function ipLicenseBlocks(title, parties) {
  const [licensor, licensee] = parties;
  return [
    { type: "section", text: "Parties" },
    { type: "field", label: `${licensor}: `, blank: TEXT_BLANK },
    { type: "field", label: `${licensee}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "section", text: "Licensed Property" },
    { type: "field", label: "Description of IP / Content: ", blank: TEXT_BLANK },
    { type: "section", text: "Grant of License" },
    {
      type: "paragraph",
      text: "Licensor grants Licensee a non-exclusive, non-transferable license to use the licensed property solely for the permitted purpose and territory stated below.",
    },
    { type: "field", label: "Permitted Use: ", blank: TEXT_BLANK },
    { type: "field", label: "Term / Territory: ", blank: TEXT_BLANK },
    { type: "field", label: "License Fee / Royalty: ", blank: TEXT_BLANK },
    { type: "section", text: "Restrictions" },
    {
      type: "paragraph",
      text: "Licensee may not sublicense, reverse engineer, or use the licensed property outside the stated scope. Licensor retains all rights not expressly granted.",
    },
    { type: "section", text: "Governing Law" },
    {
      type: "paragraph",
      text: `This License shall be governed by the laws of ${TEXT_BLANK}.`,
    },
    { type: "signatures", signers: [{ label: licensor, order: 1 }, { label: licensee, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function employmentDocBlocks(title, parties) {
  const [employer, employee] = parties;
  return [
    { type: "section", text: "Parties" },
    { type: "field", label: `${employer}: `, blank: TEXT_BLANK },
    { type: "field", label: `${employee}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "field", label: "Position / Role: ", blank: TEXT_BLANK },
    { type: "field", label: "Start Date: ", blank: DATE_BLANK },
    { type: "section", text: "Terms" },
    {
      type: "paragraph",
      text: "The parties agree to the employment or internship terms described below, including compensation, duties, and applicable policies.",
    },
    { type: "field", label: "Compensation / Stipend: ", blank: TEXT_BLANK },
    { type: "field", label: "Work Schedule / Hours: ", blank: TEXT_BLANK },
    { type: "section", text: "Confidentiality and Policies" },
    {
      type: "paragraph",
      text: "Employee agrees to comply with employer policies and protect confidential information learned during the engagement.",
    },
    { type: "section", text: "Governing Law" },
    {
      type: "paragraph",
      text: `This document shall be governed by the laws of ${TEXT_BLANK}.`,
    },
    { type: "signatures", signers: [{ label: employer, order: 1 }, { label: employee, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function corporateGovernanceBlocks(title, parties) {
  const [company, party] = parties;
  return [
    { type: "section", text: "Company" },
    { type: "field", label: `${company}: `, blank: TEXT_BLANK },
    { type: "field", label: `${party}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "field", label: "Effective Date: ", blank: DATE_BLANK },
    { type: "section", text: "Resolution / Consent" },
    {
      type: "paragraph",
      text: "The undersigned approve and adopt the corporate action described below in accordance with the company's governing documents and applicable law.",
    },
    { type: "field", label: "Action / Matter Approved: ", blank: TEXT_BLANK },
    { type: "section", text: "Authorization" },
    {
      type: "paragraph",
      text: "Authorized officers are directed to execute documents and take actions necessary to effectuate the approved matter.",
    },
    { type: "section", text: "Governing Law" },
    {
      type: "paragraph",
      text: `This document shall be governed by the laws of ${TEXT_BLANK}.`,
    },
    { type: "signatures", signers: [{ label: company, order: 1 }, { label: party, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function constructionDocBlocks(title, parties) {
  const [owner, contractor] = parties;
  return [
    { type: "section", text: "Project Parties" },
    { type: "field", label: `${owner}: `, blank: TEXT_BLANK },
    { type: "field", label: `${contractor}: `, blank: TEXT_BLANK, gapBefore: 12 },
    { type: "field", label: "Project / Job Site Address: ", blank: TEXT_BLANK },
    { type: "section", text: "Scope and Price" },
    { type: "field", label: "Scope of Work: ", blank: TEXT_BLANK },
    { type: "field", label: "Contract Price: ", blank: TEXT_BLANK },
    { type: "field", label: "Completion Date: ", blank: DATE_BLANK },
    { type: "section", text: "Changes and Payment" },
    {
      type: "paragraph",
      text: "Changes to scope require written change order signed by both parties. Payment shall follow the schedule attached or described below.",
    },
    { type: "field", label: "Payment Schedule: ", blank: TEXT_BLANK },
    { type: "section", text: "Liens and Warranty" },
    {
      type: "paragraph",
      text: "Contractor shall comply with lien and notice requirements and provide the workmanship warranty period stated below.",
    },
    { type: "field", label: "Warranty Period: ", blank: TEXT_BLANK },
    { type: "signatures", signers: [{ label: owner, order: 1 }, { label: contractor, order: 2 }] },
  ];
}

/** @param {string} title @param {[string,string]} parties */
export function personalServicesBlocks(title, parties) {
  return serviceAgreementBlocks(title, parties, [
    "Services and Session Format",
    "Fees and Cancellation",
    "Confidentiality",
    "Limitations of Liability",
  ]);
}

/** @param {{ name: string, signerLabels: [string,string], archetype: string, keyClauses: string[] }} tpl */
export function blocksForTemplate(tpl) {
  const title = tpl.name.toUpperCase();
  const parties = tpl.signerLabels;
  const sections = tpl.keyClauses.slice(0, 4).map((c) => c.replace(/\([^)]*\)/g, "").slice(0, 48));
  switch (tpl.archetype) {
    case "releaseForm":
      return releaseFormBlocks(title, parties);
    case "noticeLetter":
      return noticeLetterBlocks(title, parties);
    case "realEstateLease":
      return realEstateLeaseBlocks(title, parties);
    case "businessPurchase":
      return businessPurchaseBlocks(title, parties);
    case "ipLicense":
      return ipLicenseBlocks(title, parties);
    case "employmentDoc":
      return employmentDocBlocks(title, parties);
    case "corporateGovernance":
      return corporateGovernanceBlocks(title, parties);
    case "constructionDoc":
      return constructionDocBlocks(title, parties);
    case "personalServices":
      return personalServicesBlocks(title, parties);
    case "serviceAgreement":
    default:
      return serviceAgreementBlocks(title, parties, sections.length ? sections : ["Scope of Services", "Payment", "Term and Termination"]);
  }
}
