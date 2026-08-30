/**
 * Expand a docracy.com-style editorial brief (template_topic_queue "angle" format)
 * into a full FreeTemplate catalog entry. No AI — deterministic expansion from
 * hand-authored brief fields.
 */

const ARCHETYPE_BY_CATEGORY = {
  "Real Estate": "realEstateLease",
  "Will": "noticeLetter",
  "Power of Attorney": "noticeLetter",
  "Personal Property": "businessPurchase",
  "Non-Disclosure": "serviceAgreement",
  Employment: "employmentDoc",
  "Sale and Purchase": "businessPurchase",
  Consulting: "serviceAgreement",
  Incorporation: "corporateGovernance",
  Funding: "corporateGovernance",
  "Intellectual Property": "ipLicense",
  Equity: "corporateGovernance",
  "Compliance Documents": "serviceAgreement",
};

/** @param {string} angle */
function parseAngle(angle) {
  const signersMatch = angle.match(/^(\d)[–-]?(\d)?\s*signers?:\s*([^.]+)\./i);
  let signerLabels = ["Party A", "Party B"];
  if (signersMatch) {
    signerLabels = signersMatch[3]
      .split(/,|\band\b/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 2);
    if (signerLabels.length === 1) signerLabels.push("Counterparty");
    if (signerLabels.length === 0) signerLabels = ["Party A", "Party B"];
  }

  const placeholdersMatch = angle.match(/Placeholders?(?::| for)\s*([^.]+)\./i);
  let fillInFields = ["[Party A Name]", "[Party B Name]", "[Effective Date]", "[Governing State/Jurisdiction]"];
  if (placeholdersMatch) {
    const raw = placeholdersMatch[1];
    fillInFields = [...raw.matchAll(/\[([^\]]+)\]/g)].map((m) => `[${m[1]}]`);
    if (!fillInFields.length) {
      fillInFields = raw
        .split(/,|\band\b/)
        .map((s) => s.trim())
        .filter(Boolean)
        .map((s) => (s.startsWith("[") ? s : `[${s}]`));
    }
  }
  if (fillInFields.length < 4) {
    fillInFields.push("[Effective Date]", "[Governing State/Jurisdiction]");
  }

  const clausesMatch = angle.match(/Clauses?:\s*([^.]+(?:\.[^P]|[^.])*)\./i);
  let keyClauses = [];
  if (clausesMatch) {
    keyClauses = clausesMatch[1]
      .split(/,\s*(?=[a-z])/i)
      .map((c) => c.trim().replace(/\.$/, ""))
      .filter((c) => c.length > 3);
  }
  if (keyClauses.length < 4) {
    keyClauses = [
      "Identification of parties and effective date",
      "Scope and purpose of the document",
      "Obligations of each party",
      "Term, termination, or completion",
      "Governing law and entire agreement",
    ];
  }

  const body = angle.replace(/^(\d)[–-]?(\d)?\s*signers?:\s*[^.]+\.\s*/i, "").trim();
  return { signerLabels: signerLabels.slice(0, 2), fillInFields: [...new Set(fillInFields)].slice(0, 8), keyClauses: keyClauses.slice(0, 6), body };
}

/**
 * @param {{ slug: string, title: string, category: string, angle: string, source?: string, docracyHits?: number }} spec
 */
export function expandSpec(spec) {
  const { slug, title, category, angle } = spec;
  const parsed = parseAngle(angle);
  const archetype = ARCHETYPE_BY_CATEGORY[category] || "serviceAgreement";
  const name = title;
  const seoTitle = `Free ${title} Template`;

  const description = (() => {
    const first = parsed.body.split(/(?<=\.)\s+/)[0] || parsed.body;
    const d = first.length > 40 ? first : `${title} for ${category.toLowerCase()} — parties, scope, and signatures ready for free e-signature.`;
    return d.length > 160 ? d.slice(0, 157) + "…" : d;
  })();

  const useCase = (() => {
    const intro = `Use this ${title.toLowerCase()} when you need the same kind of document that appeared in the historical docracy.com ${category} library.`;
    return `${intro} ${parsed.body}`.slice(0, 520);
  })();

  const definition = `A ${title.toLowerCase()} is a written ${category.toLowerCase()} document in which the parties set out ${parsed.keyClauses.slice(0, 2).join(" and ").toLowerCase()} before signing. It follows the docracy.com pattern of short, practical templates rather than a full treatise.`;

  const legalSummary = `Executing this document creates a signed record of the terms both parties accepted, including ${parsed.keyClauses.slice(0, 4).join(", ").toLowerCase()}. It helps establish expectations and a paper trail but does not replace advice from a qualified attorney in your jurisdiction.`;

  const chatgptPrompts = [
    `Fill this ${title} template for my situation using the placeholders in the document.`,
    `Explain the key clauses in this ${title} before I send it for signature.`,
    `Adapt this ${title} for a ${category.toLowerCase()} use case with different payment or term details.`,
  ];

  return {
    slug,
    name,
    seoTitle,
    description: description.length > 20 ? description : `${title} — free template for e-signature, following the docracy.com ${category} category.`,
    useCase: useCase.slice(0, 500),
    definition: definition.slice(0, 400),
    keyClauses: parsed.keyClauses,
    fillInFields: parsed.fillInFields,
    legalSummary: legalSummary.slice(0, 450),
    chatgptPrompts,
    signerLabels: parsed.signerLabels,
    recurringCategory: category,
    archetype,
    source: spec.source || "docracy-editorial",
    docracyHits: spec.docracyHits || 0,
  };
}
