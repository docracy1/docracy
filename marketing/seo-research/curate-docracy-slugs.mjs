#!/usr/bin/env node
/**
 * Curate docracy.com document URL history into:
 *  1) legacy slug → canonical /free-templates/:slug redirects (no duplicate pages)
 *  2) genuinely-new document clusters for the legacy template batch
 *
 * Run: node marketing/seo-research/curate-docracy-slugs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "../..");

const urls = fs
  .readFileSync(path.join(__dirname, "docracy-original-documents.txt"), "utf8")
  .trim()
  .split("\n");

const freeTemplatesSrc = fs.readFileSync(
  path.join(ROOT, "apps/web/src/lib/freeTemplates.ts"),
  "utf8"
);
const existingSlugs = new Set([...freeTemplatesSrc.matchAll(/slug: "([^"]+)"/g)].map((m) => m[1]));

// Legacy batch slugs (generated separately) — treat as canonical targets once deployed.
let legacyBatchSlugs = new Set();
for (const batchFile of ["catalog.json", "catalog-batch2.json"]) {
  const batchPath = path.join(ROOT, "apps/web/scripts/legacyBatch", batchFile);
  if (fs.existsSync(batchPath)) {
    for (const t of JSON.parse(fs.readFileSync(batchPath, "utf8"))) legacyBatchSlugs.add(t.slug);
  }
}
const allCanonical = new Set([...existingSlugs, ...legacyBatchSlugs]);

const JUNK =
  /privacy-policy-tos|edgar\d|generic-privacy|^privacy-policy$|mobile-privacy-policy|website-privacy-policy|privacy-policy-for|terms-of-service-of-docracy|pubg|recipe|exam$|clenbuterol|jewellery|sunglasses|word-of-god|feast-of|phan-hoi|zagadki|aloo-paratha|didgeridoo|bortezomib|market-research-report|pass-trek|mgmt-520|sheepcrm|teamdrive|emojilete|lazy-dayz|elewatv|writing-services|affordable-executive|accountant-fl|voice-captioning|^about$|^822$|^contract$/i;

const LEGAL =
  /agreement|contract|nda|lease|will|waiver|license|release|letter|notice|form|deed|note|affidavit|memorandum|indemn|amendment|addendum|assignment|consent|resolution|partnership|employment|contractor|vendor|consult|services|photography|design|development|sublease|rental|loan|promissory|stock|equity|vesting|founder|advisor|trademark|patent|copyright|non-disclosure|non-compete|separation|offer|onboarding|retainer|invoice|receipt|bill-of-sale|power-of-attorney|codicil|settlement|internship|reseller|coaching|maintenance|subscription|msa|royalty|commission|internship|term-sheet|dissolution|lien|escrow|indemnification|arbitration|mediation|solicitation|guaranty|easement|deed|trust|guardian|custody|pet|construction|installment|purchase|sales|referral|scope|authorization|acknowledgment|acknowledgement|hackathon|contributor|convertible|management|storage|equipment|parking|remote|saas|sla|hosting|cloud|affiliate|sponsorship|endorsement|distribution|manufacturing|supply|joint-venture|mou|safe|shareholder|voting|forbearance|subordination|security|pledge|mortgage|novation|estoppel|option|development|bridge|scholarship|fellowship|research|clinical|therapy|counseling|waiver|membership|enrollment|camp|daycare|homestay|background|credit|demand|quit|eviction|deposit|addendum|disclosure|hoa|lien|punch|retainage|osha|harassment|onboarding|offboarding|dmca|open-source|white-label|food|catering|wedding|florist|videography|music|recording|publishing|ghostwriting|translation|nonprofit|volunteer|athletic|gym|fitness|yoga|martial|dance|lesson|homestay|probate|insurance|accident|neighbor|repair|renewal|holdover|screening|pet-addendum|lead-paint|mold|bedbug|airbnb|fmla|ada|workers-comp|pen-test|privacy-impact|data-subject|biometric|surveillance|payroll|direct-deposit|i9|h1b|visa|relocation|expatriate|misclassification|gig-worker|delivery|staffing|recruiting|wellness|relocation|tuition|invention|export-control|government|teaming|subcontract|clearance|classified|foia|litigation|deposition|mediation|arbitration|prenuptial|postnuptial|cohabitation|adoption|guardianship|conservatorship|trust|estate|homestead|quitclaim|gift-deed|rent-to-own|wholesale|syndication|1031|draw-request|certificate|zoning|easement|party-wall|hoa|condo|co-op|mortgage|forbearance|hardship|short-sale|deed-in-lieu|cash-for-keys|eviction|rent-control|habitability|retaliatory|security-deposit|late-rent|rent-abatement|tenant-improvement|signage|percentage-rent|cam-reconciliation|lease-abstract|surrender|holdover|janitorial|security-services|elevator|fire-alarm|sprinkler|roof|parking-lot|snow-removal|landscaping|waste|recycling|pest-control|energy-audit|solar|ev-charging|telecom|colocation|disaster-recovery|records-storage|shredding|cyber|forensics|crisis|executive-coaching|succession|key-man|deferred-comp|401k|hsa|bereavement|jury-duty|military-leave|osha|lockout|confined-space|hot-work|fall-protection|business-impact|risk-assessment|soc2|bug-bounty|vulnerability|backup|access-certification|privacy-impact|data-mapping|records-of-processing|cookie-consent|biometric|geolocation|monitoring|video-surveillance|drug-alcohol|workplace-violence|payroll-deduction|everify|immigration|global-mobility/i;

/** Hand-maintained semantic aliases from normalized legacy slug → canonical slug. */
const SEMANTIC_ALIASES = {
  "non-disclosure-agreement": "mutual-nda",
  "generic-nda": "mutual-nda",
  "generic-shortform-nda": "short-form-mutual-nda",
  "mutual-nondisclosure-agreement": "mutual-nda",
  "unilateral-nondisclosure-agreement": "unilateral-nda",
  "confidentiality-agreement": "mutual-nda",
  "independent-contractor-agreement": "independent-contractor-agreement",
  "independent-developer-or-contractor-agreement": "independent-contractor-agreement",
  "consulting-agreement": "consulting-agreement",
  "consultancy-contract": "consulting-agreement",
  "creative-services-agreement": "consulting-agreement",
  "portrait-photography-agreement": "photography-services-agreement",
  "contract-for-wedding-photography-services": "wedding-photography-contract",
  "model-release": "model-release-form",
  "roommate-agreement": "roommate-agreement",
  "power-of-attorney": "power-of-attorney",
  "operating-agreement-for-single-member-llc-manager-managed": "llc-operating-agreement",
  "llc-single-member-operating-agreement": "llc-operating-agreement",
  "residential-sublease-agreement": "sublease-agreement",
  "retainer-agreement": "retainer-agreement",
  "founders-agreement-template-with-vesting": "founder-vesting-agreement",
  "founders-agreement-template": "founder-vesting-agreement",
  "founder-collaboration-agreement": "partnership-agreement",
  "intellectual-property-agreement": "ip-licensing-agreement",
  "intellectual-property-agreement-template": "ip-licensing-agreement",
  "contract-of-works-for-web-design": "web-design-services-agreement",
  "statement-of-work-web-design": "scope-of-work",
  "standard-master-agreement-for-design-services": "web-design-services-agreement",
  "logo-design-contract-agreement": "web-design-services-agreement",
  "graphic-design-contract": "web-design-services-agreement",
  "short-form-design-contract": "web-design-services-agreement",
  "development-service-contract": "web-development-agreement",
  "generic-addendum-to-an-existing-contract": "scope-of-work",
  "sample-landlord-reference-letter-positive": "reference-letter",
  "contract-killer-3": "web-development-agreement",
  "work-for-hire-agreement": "work-made-for-hire-agreement",
  "assignment-of-copyright": "copyright-assignment-agreement",
  "confidential-information-and-invention-assignment-agreement": "proprietary-information-and-inventions-agreement",
  "employee-agreement": "employment-agreement",
  "residential-lease-agreement": "rental-agreement",
  "residential-rental-lease": "rental-agreement",
  "liability-release": "liability-waiver",
  "demand-letter": "late-payment-demand-letter",
  "collection-letter": "late-payment-demand-letter",
  "friendly-collection-letter": "late-payment-demand-letter",
};

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

function resolveCanonical(norm) {
  if (allCanonical.has(norm)) return norm;
  if (SEMANTIC_ALIASES[norm] && allCanonical.has(SEMANTIC_ALIASES[norm])) return SEMANTIC_ALIASES[norm];
  for (const [pat, target] of Object.entries(SEMANTIC_ALIASES)) {
    if ((norm.includes(pat) || pat.includes(norm)) && allCanonical.has(target)) return target;
  }
  for (const ex of allCanonical) {
    if (norm.length >= 8 && (norm.includes(ex) || ex.includes(norm))) return ex;
  }
  return null;
}

const clusters = new Map();
for (const url of urls) {
  const raw = url.split("/").pop();
  if (!raw || raw.length < 4 || JUNK.test(raw)) continue;
  const norm = normalize(raw);
  if (!norm || norm.length < 4 || JUNK.test(norm)) continue;
  if (!LEGAL.test(norm)) continue;
  clusters.set(norm, (clusters.get(norm) || 0) + 1);
}

const redirects = {};
const redirectSources = [];
for (const [norm, count] of clusters) {
  if (allCanonical.has(norm)) continue;
  const target = resolveCanonical(norm);
  if (!target || target === norm) continue;
  redirects[norm] = target;
  redirectSources.push({ legacy: norm, canonical: target, hits: count });
}

redirectSources.sort((a, b) => b.hits - a.hits);

const outDir = path.join(ROOT, "apps/web/src/lib");
fs.writeFileSync(
  path.join(outDir, "templateLegacyRedirects.json"),
  JSON.stringify(redirects, null, 2) + "\n"
);

const report = {
  processedUrls: urls.length,
  legalClusters: clusters.size,
  redirectCount: Object.keys(redirects).length,
  topRedirects: redirectSources.slice(0, 40),
  canonicalTemplateCount: allCanonical.size,
};
fs.writeFileSync(path.join(__dirname, "curation-report.json"), JSON.stringify(report, null, 2) + "\n");

console.log(JSON.stringify(report, null, 2));
