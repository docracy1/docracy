#!/usr/bin/env node
/**
 * Pick docracy.com URL clusters not yet covered; emit editorial briefs in
 * template_topic_queue angle format (parties, placeholders, clauses).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../../../..");

function loadSlugs() {
  const s = new Set();
  for (const f of [
    "apps/web/src/lib/freeTemplates.ts",
    "apps/web/src/lib/freeTemplatesLegacyBatch.ts",
  ]) {
    for (const m of fs.readFileSync(path.join(ROOT, f), "utf8").matchAll(/slug: "([^"]+)"/g)) s.add(m[1]);
  }
  if (fs.existsSync(path.join(__dirname, "catalog.json"))) {
    for (const t of JSON.parse(fs.readFileSync(path.join(__dirname, "catalog.json"), "utf8"))) s.add(t.slug);
  }
  const redirects = JSON.parse(
    fs.readFileSync(path.join(ROOT, "apps/web/src/lib/templateLegacyRedirects.json"), "utf8")
  );
  return { slugs: s, redirects };
}

const JUNK =
  /privacy-policy|privacy policy|-tos|edgar\d|generic-privacy|terms-of-service|about$|^[0-9]+$|pubg|recipe|exam$|clenbuterol|word-of-god|marketing-meeting|jewellery|sunglasses|phan-hoi|zagadki|aloo-paratha|didgeridoo|bortezomib|market-research|pass-trek|mgmt-520|sheepcrm|teamdrive|obs$|accountant-fl|voice-captioning|download-kompa|fm-radio|patch-com|okcupid|github-com|apple-com|accuweather|billboard|mylife|theatlantic|newgrounds|godtube|carsdirect|imageshack|beemp3|writing-services|miracle-product|captioning|open-schooling|benh-nhan|the-sacred|mma-praxis|ener1|icahn|ex-3-1-edgar|^contract$|bortezomib|clenbuterol|trivandrum|lancaster-tx|jalandhar|facebook|ketoboost|samsung|release-date|packaging-materials|flats-villas|niche-print|online-help-for|powered-by-|school-examination|boardgamegeek|cupboards$|job-board|massoterapia|reflexologia|chua-thoat|dong-y|gmc-template|vertex-engineering|architects-in-|plumbing-lancaster|solar-company|solar-power-|co-nen-|best-therapeutic|eerste-vriendelijke|rapidfast|builders-flats|wedding-card-printing|car-rental-software|new-samsung|easy-affordable|country-side-creations|inner-circle-investment-room|public$|https-|m-facebook|examination-board|bihar-school|intermediate-class|board-of-directors-of-the|1702-gmc|san-diego-solar|help-for-easy|software-and-mobile-app-for-car|for-country-side|for-sale-of-photogr|apartments-trivandrum|coaching-package$|intuitive-coaching-package|investment-room-agreement-public/i;

const LEGAL_DOC_SEGMENT =
  /(?:^|-)(agreement|contract|contracts|form|forms|letter|notice|notices|license|licence|release|nda|lease|will|waiver|deed|note|affidavit|memorandum|consent|acknowledgment|acknowledgement|addendum|amendment|assignment|resolution|authorization|disclosure|order|plan|schedule|receipt|designation|confirmation|checklist|worksheet|certificate|minutes|poa|inventory|ack|sow|msa|offer|grant|transfer|extension|revocation|nomination|directive|insertion|terms|policy|authorization|authorization|sublease|addenda|waiver|releases|licenses|leases|contracts|agreements)(?:-|$)/;

function isLegalDocumentSlug(slug) {
  return LEGAL_DOC_SEGMENT.test(slug);
}

const LEGAL =
  /agreement|contract|nda|lease|will|waiver|license|release|letter|notice|form|deed|note|affidavit|memorandum|indemn|amendment|addendum|assignment|consent|resolution|partnership|employment|contractor|vendor|consult|services|photography|design|development|sublease|rental|loan|promissory|stock|equity|vesting|founder|advisor|trademark|patent|copyright|separation|offer|onboarding|retainer|invoice|receipt|bill-of-sale|power-of-attorney|codicil|settlement|internship|reseller|coaching|maintenance|subscription|royalty|commission|term-sheet|dissolution|lien|escrow|guaranty|easement|trust|guardian|custody|pet|construction|installment|purchase|sales|referral|scope|authorization|acknowledgment|acknowledgement|hackathon|contributor|convertible|management|storage|equipment|parking|saas|hosting|cloud|affiliate|sponsorship|endorsement|distribution|manufacturing|supply|joint-venture|mou|safe|shareholder|voting|arbitration|mediation|solicitation|indemnification|hold-harmless|msa|sow|retainer|freelance|graphic|logo|web-design|web-development|animation|motion|branding|illustration|commission|wedding|event|band|artist|management|recording|producer|publishing|ghostwriting|translation|nonprofit|volunteer|fitness|training|massage|therapy|tutoring|cleaning|landscaping|catering|event-planning|dj|video|film|location|talent|influencer|marketing|seo|franchise|exclusivity|manufacturing|joint-venture|memorandum|investment|board|shareholder|escrow|earnest|severance|non-solicitation|invention|vehicle|storage|sublease|tenant|improvement|roofing|plumbing|hvac|architect|subcontractor|mechanic|lien|preliminary|solar|easement|fence|boat|aircraft|vehicle|venue|coworking|resignation|termination|demand|insurance|accident|settlement|hoa|move-in|move-out|deposit|pet-addendum|lead-paint|change-order|dmca|white-label|penetration|managed-it|data-sharing|return-to-work|furlough|commission|broker|real-estate|residential|commercial|apartment|vacation|short-term|rent-increase|eviction|guaranty|payment-plan|debt-settlement|trademark|domain|api|beta|evaluation|eula|business-associate|hipaa|medical|childcare|nanny|pet-sitting|affidavit|probate|guardianship|cohabitation|prenuptial|parenting|child-support|adoption|trust|estate|deed|quitclaim|rent-to-own|1031|bridge|scholarship|research|clinical|informed-consent|gym|camp|daycare|background|credit|travel-consent|small-claims|landlord|repair|lease-renewal|holdover|pay-or-quit|screening|addendum|disclosure|construction|waiver|punch|retainage|osha|harassment|onboarding|offboarding|litigation|expert|mediation|arbitration|settlement|release|indemnity|forbearance|subordination|security|pledge|mortgage|novation|side-letter|amendment|estoppel|option|development|draw|certificate|zoning|party-wall|condo|co-op|forbearance|hardship|short-sale|deed-in-lieu|cash-for-keys|janitorial|elevator|fire-alarm|sprinkler|energy|colocation|disaster|shredding|cyber|forensics|executive|succession|deferred|401k|fmla|ada|workers-comp|vendor-risk|soc2|bug-bounty|privacy-impact|data-subject|biometric|payroll|i9|h1b|relocation|staffing|recruiting|wellness|tuition|invention|export-control|government|teaming|clearance|classified|foia|deposition|prenuptial|postnuptial|conservatorship|homestead|wholesale|syndication|operating-agreement|llc|corporate|resolution|bylaws|cap-table|option|rsu|phantom|profit-interest|carried|management-fee|investor|accredited|registration-rights|co-sale|indemnification|cobra|performance|corrective|mentorship|apprenticeship|gig-worker|delivery|courier|warehouse|temp-staffing|executive-search|placement|candidate|job-fair|drug-test|occupational|relocation|signing-bonus|moonlighting|sanctions|fcpa|hubzone|subcontracting|task-order|contract-modification|property-disposal|security-clearance|litigation-hold|protective-order|expert-witness|interrogatories|parenting-plan|marital|special-needs|ABLE|disclaimer|homestead|community-property|transmutation|interspousal|gift-deed|beneficiary|life-estate|lease-option|lease-purchase|wraparound|assignment-of-real-estate|fix-and-flip|property-syndication|reit|draw-schedule|certificate-of-occupancy|title-commitment|environmental|conservation|utility-easement|drainage|view-easement|hoa-meeting|hoa-lien|condo-alteration|co-op|lender-questionnaire|payoff|mortgage-modification|loan-forbearance|just-cause|rent-control|habitability|retaliatory|wrongful|security-deposit|late-rent|rent-abatement|tenant-improvement|signage|percentage-rent|cam-reconciliation|lease-abstract|surrender|holdover|temporary-occupancy|license-agreement-office|service-agreement-building|waste-removal|recycling|compactor|grease-trap|window-cleaning|pressure-washing|facade|commissioning|retro-commissioning|power-purchase|solar-lease|ev-charging|telecom|antenna|fiber-optic|remote-hands|business-continuity|records-storage|document-destruction|offsite-backup|tabletop|breach-coach|crisis|public-relations|leadership|facilitation|dispute-board|family-business|key-man|split-dollar|supplemental|phantom-stock|employee-stock|profit-sharing|defined-benefit|cafeteria|health-reimbursement|hsa|bereavement|jury-duty|military-leave|lockout|confined-space|hot-work|fall-protection|business-impact|risk-assessment|red-team|responsible-disclosure|software-bill|supply-chain|secure-development|change-management|backup-policy|key-management|privileged-access|access-certification|user-provisioning|vendor-termination|data-deletion|subprocessor|data-mapping|records-of-processing|cookie-consent|facial-recognition|geolocation|video-surveillance|audio-recording|workplace-violence|active-shooter|everify|expatriate|tax-equalization|global-mobility|prevailing-wage|certified-payroll|misclassification|abc-test|contingency-recruiting|retained-search|reference-check|rehire|personnel-file|grievance|workplace-investigation|360-feedback|continuing-education|union-dues|collective-bargaining|labor-peace|project-labor|workforce-diversity|equal-pay|pay-transparency|platform-terms|last-mile|employer-branding|conference-attendance|speaking-engagement|outside-business|patent-assignment-employment|copyright-assignment-employment|open-source-policy|small-business-certification|mentor-protege|commercial-item|equitable-adjustment|claim-under-contract|notice-of-dispute|contract-closeout|government-furnished|foreign-travel|foreign-contact|insider-threat|classified-information|need-to-know|foia-request|privacy-act|subpoena-response|ediscovery|meet-and-confer|confidentiality-order|consulting-expert|testifying-expert|fact-witness|arbitration-demand|arbitration-answer|covenant-not-to-sue|confidential-settlement|mutual-non-disparagement|structured-settlement|installment-settlement|property-settlement|spousal-support|name-change|stepparent-adoption|guardianship-petition|conservatorship-petition|pour-over|beneficiary-designation|probate-notice|creditor-claim|small-estate|tenancy-by-entirety|quitclaim-deed-divorce|rent-to-own|1031-exchange|qualified-intermediary|reverse-1031|architects-certificate|contractors-application|as-built|demolition-permit|tree-removal|historic-preservation|landmark-designation|open-space|scenic-easement|party-wall|shared-boundary|hoa-architectural|variance-request|zoning-appeal|building-code|mechanic-lien-release|partial-lien|unconditional-lien|conditional-lien|notice-of-commencement|notice-of-completion|punch-list|retainage-release|performance-bond|bid-bond|construction-loan|sworn-owner|joint-check|design-build|design-assist|value-engineering|rfi-response|submittal|daily-construction|safety-plan|toolbox-talk|incident-report|near-miss|drug-free-workplace|anti-retaliation|equal-opportunity|dress-code|attendance-policy|conflict-of-interest|gift-policy|insider-trading|records-retention|it-acceptable|password-policy|clean-desk|travel-expense|mileage-reimbursement|per-diem|corporate-credit-card|fleet-vehicle|cell-phone-reimbursement|equipment-checkout|laptop-use|vpn-use|data-classification|phishing-awareness|security-incident|lost-device|vendor-onboarding|supplier-code|quality-assurance|calibration|extended-warranty|product-recall|customer-complaint|refund-policy|return-merchandise|shipping-and-delivery|freight-broker|carrier|warehouse|fulfillment|inventory-consignment|drop-shipping|letter-of-intent-acquisition|due-diligence|exclusivity-agreement-ma|earnout|non-compete-sale|seller-financing|business-transition|employee-retention|key-employee|reorganization|creditors-agreement|workout|reaffirmation|intercreditor|ucc-financing|collateral-assignment|note-assignment|assumption|delegation|third-party-beneficiary|waiver-and-amendment|consent-to-assignment|landlord-consent|tenant-estoppel|subordination-non-disturbance|memorandum-of-lease|option-to-purchase|right-of-first-offer|joint-development|profit-sharing-real-estate|hard-money|private-lending|family-loan|tuition-payment|fellowship|research-grant|sponsored-research|material-transfer|collaborative-research|clinical-study|investigator-agreement|site-agreement|patient-enrollment|caregiver|healthcare-proxy|do-not-resuscitate|release-of-medical|patient-financial|assignment-of-benefits|prior-authorization|appeal-letter-insurance|provider-enrollment|credentialing|telehealth|telemedicine|surgical-consent|anesthesia-consent|genetic-testing|mental-health-treatment|couples-therapy|ferpa|transcript-request|education-verification|professional-license|credit-application|commercial-credit|personal-financial|net-worth|meeting-minutes|board-meeting|shareholders-meeting|proxy-voting|written-consent|registered-agent|certificate-of-good-standing|dba-filing|name-change-resolution|merger-agreement|asset-sale|stock-purchase|membership-interest|llc-capital|llc-distribution|s-corp-election|83b-election|409a-valuation|option-exercise|rsu-award|fund-limited-partnership|investor-questionnaire|accredited-investor|form-d-filing|private-placement|portfolio-company|information-rights|major-investor|observer-rights|directors-and-officers|officer-indemnification|advancement-of-expenses|mutual-release|employment-release|age-discrimination|benefits-continuation|final-paycheck|unemployment-claims|corrective-action|goal-setting|self-assessment|training-acknowledgment|certification-renewal|license-renewal|professional-development|trade-apprenticeship|grievance-arbitration|independent-contractor-classification|gig-worker|delivery-driver|rideshare-driver|courier-services|warehouse-staffing|staffing-agency|recruiting-services|wellness-program|gym-reimbursement|commuter-benefits|relocation-assistance|tuition-reimbursement|student-loan-repayment|professional-membership|invention-disclosure|export-control|sanctions-compliance|anti-bribery|fcpa-compliance|government-contracting|teaming-agreement-government|subcontracting-plan|bpa-call|equitable-adjustment|certified-claim|final-invoice|excess-property|facility-clearance|personnel-security|derivative-classification|declassification|litigation-hold|document-retention|protective-order|expert-disclosure|deposition-subpoena|records-subpoena|request-for-production|request-for-admission|case-management|settlement-conference|stipulated-dismissal|confidential-settlement|parenting-plan|child-support|marital-settlement|adoption-consent|special-needs-trust|trust-amendment|trustee-resignation|beneficiary-receipt|disclaimer-of-interest|estate-tax-extension|creditor-claim-form|affidavit-of-small-estate|community-property|transmutation|interspousal-transfer|installment-land|land-installment|subject-to-acquisition|wholesale-real-estate|real-estate-joint-venture|fix-and-flip-partnership|property-syndication|real-estate-crowdfunding|reit-investment|tenant-notification|rent-roll|real-estate-pro-forma|cap-rate|1031-exchange-identification|construction-draw|architects-certificate-of-substantial|temporary-certificate|as-built-survey|survey-review|environmental-phase|zoning-compliance|utility-locator|conservation-easement|hoa-special-assessment|condo-questionnaire|co-op-board|co-op-proprietary|co-op-sublet|condo-purchase|estoppel-certificate|loan-payoff|mortgage-assumption|hardship-letter|short-sale-purchase|tenant-buyout|relocation-assistance-tenant|owner-move-in|substantial-remodel|ellis-act|rent-increase-petition|tenant-petition|noise-complaint|landlord-repair|move-in-inspection|utility-transfer|lease-non-renewal|holdover-tenant|pay-or-quit|cure-or-quit|unconditional-quit|tenant-screening|roommate-addendum|guest-policy|parking-addendum|storage-addendum|furnished-rental|smoke-free|marijuana-use|short-term-sublet|security-system|smart-lock|internet-service|trash-removal|hoa-rules|community-rules|pool-use|gym-access|clubhouse-rental|storage-locker|mailbox-rental|garage-rental|driveway-use|shared-driveway|fence-repair|tree-trimming|shared-well|septic-system|road-maintenance|mechanics-lien-notice|partial-lien-waiver|unconditional-lien-waiver|conditional-lien-waiver|retainage-release|sworn-statement-construction|subcontractor-payment|trust-fund-agreement|rfi-response-form|submittal-transmittal|osha-301|hazcom-training|lockout-tagout|confined-space-entry|hot-work-permit|excavation-permit|crane-lift-plan|scaffold-inspection|ppe-assessment|emergency-action-plan|fire-extinguisher|evacuation-drill|vendor-risk-assessment|pen-test-scope|vulnerability-assessment|incident-management|disaster-recovery-policy|access-certification|data-subject-access|data-subject-erasure|consent-withdrawal|biometric-data-consent|monitoring-consent|drug-alcohol-testing|emergency-contact-update|payroll-deduction|direct-deposit-authorization|work-authorization-extension|international-assignment|immigration-compliance/i;

function normalize(raw) {
  return raw
    .toLowerCase()
    .replace(/\.(pdf|doc|docx)$/, "")
    .replace(/-template-\d+$/, "")
    .replace(
      /-(january|february|march|april|may|june|july|august|september|october|november|december)(-\d{1,2})?(-\d{4})?$/i,
      ""
    )
    .replace(/-\d{4}-\d{2}-\d{2}$/, "")
    .replace(/-\d{1,2}-\d{4}$/, "")
    .replace(/-fillable.*$/, "")
    .replace(/ai$/i, "")
    .replace(/-positive(-\d+)?$/, "")
    .replace(/-sample$/, "")
    .replace(/-template$/, "")
    .replace(/-\d+$/, "")
    .replace(/--+/g, "-")
    .replace(/^sample-/, "")
    .replace(/^generic-/, "")
    .replace(/^standard-/, "")
    .replace(/^the-/, "")
    .replace(/^-|-$/g, "");
}

function slugify(norm) {
  let s = norm.replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").replace(/-+/g, "-");
  if (s.length > 55) s = s.slice(0, 55).replace(/-$/, "");
  return s;
}

function titleCase(slug) {
  return slug
    .split("-")
    .map((w) => (w.length <= 3 && !["nda", "llc", "poa", "sow", "msa", "safe", "api", "dmca", "hipaa", "i9", "w9"].includes(w) ? w.toUpperCase() : w.charAt(0).toUpperCase() + w.slice(1)))
    .join(" ")
    .replace(/\bNda\b/g, "NDA")
    .replace(/\bLlc\b/g, "LLC")
    .replace(/\bPoa\b/g, "POA")
    .replace(/\bSow\b/g, "SOW")
    .replace(/\bMsa\b/g, "MSA")
    .replace(/\bSafe\b/g, "SAFE")
    .replace(/\bApi\b/g, "API")
    .replace(/\bDmca\b/g, "DMCA")
    .replace(/\bHipaa\b/g, "HIPAA");
}

function inferCategory(norm, slug) {
  const s = `${norm} ${slug}`;
  if (/nda|non-disclosure|confidential|beta-tester|board-observer|exit-interview-confidential/.test(s)) return "Non-Disclosure";
  if (/will|testament|codicil|estate-inventory|funeral|beneficiary|guardian-nomination|pet-care|digital-asset-inventory|personal-property-memorandum/.test(s)) return "Will";
  if (/power-of-attorney|poa|travel-consent|tax-prep|banking-inquiry|revocation-of-poa|vehicle-title-poa|real-estate-closing-poa|medical-info-release/.test(s)) return "Power of Attorney";
  if (/lease|rental|landlord|tenant|sublease|roommate|move-out|move-in|eviction|deposit|hoa|condo|co-op|easement|property-management|real-estate|residential|commercial-lease|apartment|vacation-rent|short-term-stay|parking-space/.test(s)) return "Real Estate";
  if (/employment|employee|internship|offer-letter|handbook|probation|moonlighting|separation|commission-plan|background-check|remote-work|equipment-return|at-will|hr|workplace|fmla|ada|workers-comp|onboarding|offboarding|termination-letter|resignation|furlough/.test(s)) return "Employment";
  if (/stock|equity|option|vesting|83b|rsu|phantom|advisor-equity|shareholder|cap-table|safe|convertible|investment|funding|bridge-loan|term-sheet|angel|venture|capital-call|revenue-share|crowdfunding|grant-funds|investor/.test(s)) return "Funding";
  if (/llc|incorporation|corporate|bylaws|director|board-consent|secretary|dba|annual-meeting|authorized-signatory|founder-roles|membership-interest|shareholder-loan/.test(s)) return "Incorporation";
  if (/copyright|trademark|patent|ip-|intellectual|license-of-rights|sync|mechanical|music|open-source|dmca|software-eval|content-license|invention-disclosure|work-for-hire|assignment-of-copyright/.test(s)) return "Intellectual Property";
  if (/option-grant|equity-repurchase|vesting-acceleration|share-transfer|advisor-equity-grant/.test(s)) return "Equity";
  if (/compliance|privacy-policy-ack|acceptable-use|incident-response|vendor-security|records-retention|anti-bribery|conflict-of-interest|data-processing|hipaa|ferpa|osha|fcpa|sanctions/.test(s)) return "Compliance Documents";
  if (/bill-of-sale|purchase|sale|supply|goods|deposit-receipt|layaway|auction|return-merchandise|consignment|as-is-sale|purchase-order|wholesale|merchandise|vendor|reseller|distribution|manufacturing/.test(s)) return "Sale and Purchase";
  if (/equipment-rental|personal-loan|item-loan|storage-unit|gift-deed|vehicle-bill|found-property|personal-property|tool-rental|bike-loan/.test(s)) return "Personal Property";
  if (/construction|contractor|subcontractor|change-order|lien|waiver|punch-list|retainage|roofing|plumbing|hvac|architect|engineering|demolition|certificate-of-occupancy|mechanic|preliminary-notice|draw-request|site-specific|toolbox-talk/.test(s)) return "Consulting";
  if (/photography|web-design|web-development|graphic|logo|branding|creative|freelance|consulting|marketing|seo|animation|motion|illustration|design-services|video|film|wedding|event-photography|model-release|retainer|sow|agency|dj|band|artist-management|recording|producer|ghostwriting|translation|editing|coaching|training|massage|tutoring|cleaning|landscaping|catering|event-planning|personal-training|session-musician|voice-over|ui-ux|podcast|post-production|game-development|penetration|managed-it|hosting|saas|software-maintenance|technology-consulting|bookkeeping|fractional-cfo|executive-coaching|interior-design|home-staging|moving-services|lawn-care|food-truck|monitoring-agreement|web-support/.test(s)) return "Consulting";
  return "Consulting";
}

function inferSigners(category, title) {
  if (/letter|notice|acknowledgment|acknowledgement|reminder|checklist|worksheet|inventory|disclosure|authorization|consent|revocation|certificate|minutes|designation|nomination|memorandum|directive|confirmation|receipt|waiver|release form|release-form/.test(title.toLowerCase())) {
    if (/landlord|tenant|lease|rental|sublease|roommate|host|guest|property/.test(title.toLowerCase())) return ["Landlord", "Tenant"];
    if (/employ|intern|handbook|separation|commission|probation|moonlighting|equipment return/.test(title.toLowerCase())) return ["Employer", "Employee"];
    return ["Declarant", "Recipient"];
  }
  if (category === "Real Estate") return ["Landlord", "Tenant"];
  if (category === "Employment") return ["Employer", "Employee"];
  if (category === "Intellectual Property") return ["Licensor", "Licensee"];
  if (category === "Sale and Purchase") return ["Buyer", "Seller"];
  if (category === "Personal Property") return ["Owner", "Renter"];
  if (category === "Funding" || category === "Equity" || category === "Incorporation") return ["Company", "Investor"];
  if (category === "Non-Disclosure") return ["Disclosing Party", "Receiving Party"];
  if (category === "Will" || category === "Power of Attorney") return ["Principal", "Agent"];
  return ["Client", "Service Provider"];
}

/** Hand-authored angle in template_topic_queue format */
function angleFor(title, category, norm) {
  const signers = inferSigners(category, title);
  const [a, b] = signers;
  const placeholders = `[${a} Name], [${b} Name], [Effective Date], [Governing State/Jurisdiction]`;
  const base = title.toLowerCase();

  let clauses;
  if (category === "Consulting" && /photograph|photo|wedding|event/.test(norm)) {
    clauses = "session or event date, fee and deliverables, usage license scope, cancellation policy, liability limits, payment schedule";
  } else if (category === "Consulting" && /web|design|development|software|app|animation|graphic|logo|branding|ui-ux|game/.test(norm)) {
    clauses = "scope of work and milestones, client approvals, payment tied to deliverables, IP ownership on final payment, warranty window, change process";
  } else if (category === "Real Estate") {
    clauses = "parties and property address, term and rent or license fee, use restrictions, maintenance duties, default notice, governing law";
  } else if (category === "Employment") {
    clauses = "role or policy referenced, acknowledgment of receipt, at-will or term if applicable, employee obligations, employer policies may change, signatures";
  } else if (category === "Non-Disclosure") {
    clauses = "definition of confidential information, permitted use, exclusions, term and survival, return or destroy materials, remedies";
  } else if (category === "Intellectual Property") {
    clauses = "licensed or assigned work described, grant scope and territory, restrictions, fees or consideration, ownership and credit, termination";
  } else if (category === "Funding" || category === "Equity") {
    clauses = "parties and instrument referenced, economic or governance terms summarized, conditions to closing or grant, representations, plan or note controls, signatures";
  } else if (category === "Incorporation") {
    clauses = "company name and date, corporate action approved, authorized officers, recordkeeping, governing documents control, signatures";
  } else if (category === "Sale and Purchase") {
    clauses = "goods or services described, price and payment, delivery or pickup, risk of loss, returns or deposits, warranties disclaimer if as-is";
  } else if (category === "Will") {
    clauses = "declarant identification, purpose of memorandum or acknowledgment, non-binding disclaimer where applicable, instructions for family or executor, signatures";
  } else if (category === "Power of Attorney") {
    clauses = "principal and agent, limited scope and duration, no broader authority implied, revocation reference, signatures and date";
  } else if (category === "Compliance Documents") {
    clauses = "policy or program referenced, employee or vendor acknowledgment, reporting duties, no waiver of rights unless stated, effective date, signatures";
  } else if (category === "Personal Property") {
    clauses = "item or property described, loan or rental period, care standard, loss or damage responsibility, return or transfer, consideration";
  } else {
    clauses = "parties and purpose, scope of obligations, payment or consideration if any, term and termination, general provisions, signatures";
  }

  const context = norm.includes("contract-killer") ? " Based on a popular plain-language freelance web contract style." : "";
  return `2 signers: ${a}, ${b}. ${title} — ${base} document from the historical docracy.com ${category} library.${context} Placeholders: ${placeholders}. Clauses: ${clauses}.`;
}

function tooSimilar(a, b) {
  if (a === b) return true;
  if (a.length >= 10 && b.length >= 10 && (a.includes(b) || b.includes(a))) return true;
  return false;
}

export function pickDocracyClusterSpecs(existingSlugs, redirects, limit) {
  const urls = fs
    .readFileSync(path.join(ROOT, "marketing/seo-research/docracy-original-documents.txt"), "utf8")
    .trim()
    .split("\n");
  const clusters = new Map();
  for (const url of urls) {
    const raw = url.split("/").pop();
    if (!raw || raw.length < 4 || JUNK.test(raw)) continue;
    const norm = normalize(raw);
    if (!norm || norm.length < 4 || JUNK.test(norm)) continue;
    if (!LEGAL.test(norm)) continue;
    clusters.set(norm, (clusters.get(norm) || 0) + 1);
  }

  const picked = [];
  const pickedSlugs = new Set(existingSlugs);
  const sorted = [...clusters.entries()].sort((a, b) => b[1] - a[1]);

  for (const [norm, hits] of sorted) {
    if (picked.length >= limit) break;
    const slug = slugify(norm);
    if (!slug || slug.length < 4) continue;
    if (!isLegalDocumentSlug(slug)) continue;
    if (JUNK.test(norm) || JUNK.test(slug)) continue;
    if (pickedSlugs.has(slug) || redirects[slug] || redirects[norm]) continue;
    let dup = false;
    for (const ex of pickedSlugs) {
      if (tooSimilar(slug, ex)) {
        dup = true;
        break;
      }
    }
    if (dup) continue;

    const title = titleCase(slug);
    const category = inferCategory(norm, slug);
    picked.push({
      slug,
      title,
      category,
      angle: angleFor(title, category, norm),
      source: "docracy-url-cluster",
      docracyHits: hits,
    });
    pickedSlugs.add(slug);
  }
  return picked;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const { slugs, redirects } = loadSlugs();
  const specs = pickDocracyClusterSpecs(slugs, redirects, 50);
  console.log(JSON.stringify(specs.slice(0, 5), null, 2));
  console.error("picked:", specs.length);
}
