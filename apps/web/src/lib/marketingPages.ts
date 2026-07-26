// Data for the batch of narrow-intent landing/explainer pages requested for SEO — kept in one
// place (like freeTemplates.ts) rather than inline in each page component, since prerender.mjs
// needs the same title/description strings without importing React.

export interface FeaturePageContent {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  problem: string;
  solution: string;
  features: Array<{ title: string; body: string }>;
  useCases: string[];
  ctaLabel: string;
  ctaTo: string;
  relatedLinks: Array<{ label: string; to: string }>;
}

export const FEATURE_PAGES: FeaturePageContent[] = [
  {
    slug: "simple-agreements",
    seoTitle: "Simple Agreements — Fast Online Signing | Docracy",
    seoDescription: "Sign simple agreements in minutes with Docracy.io. No subscriptions, no complexity, no account required.",
    heroHeadline: "Sign simple agreements in minutes.",
    heroSubheadline:
      "Built for quick, low-stakes documents — no subscriptions, no complexity, no setup. Perfect for NDAs, client contracts, onboarding docs, and one-off deals.",
    problem:
      "Most e-signature tools are built for enterprise workflows. If you only need to send a few simple agreements, they slow you down with accounts, onboarding, and bloated features.",
    solution:
      "Docracy.io gives you a clean, lightweight signing flow designed for fast, simple documents. Upload → send → sign → done.",
    features: [
      { title: "Simple document sending", body: "Upload and send agreements instantly." },
      { title: "Clean signing experience", body: "Recipients sign without accounts or friction." },
      { title: "AI-assisted field placement", body: "Signature fields placed automatically — on a paid account." },
      { title: "One-off agreements", body: "Perfect for quick, personal documents — free, no account needed." },
      { title: "Secure storage", body: "Encrypted, safe, and fully traceable." },
    ],
    useCases: ["NDAs for freelancers", "Client contracts", "HR onboarding documents", "Vendor agreements", "Simple personal deals"],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "nda-signing",
    seoTitle: "NDA Signing Online — Fast & Simple | Docracy",
    seoDescription: "Sign NDAs online in minutes. Free NDA template, no subscriptions, no account required.",
    heroHeadline: "Sign NDAs fast — without subscriptions or complexity.",
    heroSubheadline: "Perfect for freelancers, consultants, agencies, and small teams.",
    problem: "Traditional e-signature tools make NDA signing slow: accounts, onboarding, templates hidden behind paywalls.",
    solution: "Docracy.io lets you send and sign NDAs instantly — clean flow, no friction.",
    features: [
      { title: "Free NDA template", body: "Start from a ready-made mutual or one-way NDA — no paywall." },
      { title: "AI field placement", body: "Signature and date fields placed automatically — on a paid account." },
      { title: "No account required for recipients", body: "Signers open the link and sign — nothing to install or register." },
      { title: "Secure audit trail", body: "Every NDA gets a timestamped record of who signed and when." },
      {
        title: "Reusable NDA templates for recurring clients",
        body: "Save your NDA once and reuse it for every new client — on a paid account.",
      },
    ],
    useCases: [
      "Freelancers sending NDAs before projects",
      "Agencies onboarding new clients",
      "Teams sharing confidential documents",
      "One-off NDAs for quick deals",
    ],
    ctaLabel: "Send NDA now",
    ctaTo: "/prepare?freeTemplate=mutual-nda",
    relatedLinks: [
      { label: "Free mutual NDA template", to: "/free-templates/mutual-nda" },
      { label: "Free one-way NDA template", to: "/free-templates/unilateral-nda" },
      { label: "What is an NDA?", to: "/what-is-an-nda" },
    ],
  },
  {
    slug: "client-contracts",
    seoTitle: "Client Contract Signing — Fast & Simple | Docracy",
    seoDescription: "Send client contracts without friction. Clean signing flow, no accounts required.",
    heroHeadline: "Send client contracts without friction.",
    heroSubheadline: "Clients sign instantly — no accounts, no confusing flows.",
    problem: "Clients hate creating accounts just to sign a simple contract. This slows down deals and hurts conversion.",
    solution: "Docracy.io gives clients a clean, instant signing experience.",
    features: [
      { title: "Simple contract sending", body: "Upload your contract and send it for signature in seconds." },
      { title: "AI field placement", body: "Signature and date fields placed automatically — on a paid account." },
      {
        title: "Reusable client contract templates",
        body: "Save your standard contract once and reuse it for every new client — on a paid account.",
      },
      { title: "Secure storage", body: "Encrypted, safe, and fully traceable." },
      { title: "Fast signing flow", body: "Clients sign from any device — no software or account needed." },
    ],
    useCases: ["Freelancers", "Consultants", "Agencies", "Small teams", "One-off client agreements"],
    ctaLabel: "Send your next contract",
    ctaTo: "/prepare?freeTemplate=freelance-service-agreement",
    relatedLinks: [
      { label: "Free freelance service agreement template", to: "/free-templates/freelance-service-agreement" },
      { label: "Free consulting agreement template", to: "/free-templates/consulting-agreement" },
    ],
  },
  {
    slug: "onboarding-documents",
    seoTitle: "Onboarding Documents — Fast Online Signing | Docracy",
    seoDescription: "Sign onboarding documents quickly with Docracy.io. Clean HR workflows, reusable templates, no complexity.",
    heroHeadline: "Sign onboarding documents fast — without enterprise complexity.",
    heroSubheadline: "Perfect for HR teams, small businesses, and contractors.",
    problem:
      "Onboarding documents often get stuck in slow workflows: email attachments, missing signatures, confusing tools, and manual follow-ups.",
    solution:
      "Docracy.io gives HR teams a clean, fast signing flow for onboarding documents — no accounts, no friction, no bloated features.",
    features: [
      { title: "Simple onboarding document sending", body: "Upload offer letters, policies, or agreements and send them in seconds." },
      { title: "AI-assisted field placement", body: "Signature and date fields placed automatically — on a paid account." },
      {
        title: "Reusable onboarding templates",
        body: "Save your standard onboarding paperwork once and reuse it for every new hire — on a paid account.",
      },
      { title: "Secure audit trail", body: "Every document gets a timestamped record of who signed and when." },
      { title: "Team access for HR workflows", body: "Invite HR teammates to share templates under one paid workspace." },
    ],
    useCases: ["New hire agreements", "Policy acknowledgements", "Compliance forms", "Contractor onboarding", "Internal approvals"],
    ctaLabel: "Send onboarding documents",
    ctaTo: "/prepare?freeTemplate=offer-letter",
    relatedLinks: [
      { label: "Free offer letter template", to: "/free-templates/offer-letter" },
      { label: "Free remote work policy template", to: "/free-templates/remote-work-policy" },
    ],
  },
  {
    slug: "vendor-agreements",
    seoTitle: "Vendor Agreements — Simple Online Signing | Docracy",
    seoDescription: "Sign vendor agreements fast with Docracy.io. Clean workflows, templates, and secure storage.",
    heroHeadline: "Manage vendor agreements without complexity.",
    heroSubheadline: "Fast workflows for suppliers, service providers, and partners.",
    problem:
      "Vendor agreements often require signatures from multiple parties — traditional tools slow this down with accounts and heavy workflows.",
    solution: "Docracy.io makes vendor agreement signing simple and fast.",
    features: [
      { title: "Vendor agreement templates", body: "Start from a ready-made vendor agreement template — free to use." },
      { title: "AI field placement", body: "Signature and date fields placed automatically — on a paid account." },
      { title: "Multi-party signing", body: "Add every signer and choose sequential or all-at-once signing order." },
      { title: "Secure storage", body: "Encrypted, safe, and fully traceable." },
      { title: "Clean signing flow", body: "Every party signs from any device — no software or account needed." },
    ],
    useCases: ["Supplier contracts", "Service agreements", "Partnership agreements", "Renewal documents", "One-off vendor deals"],
    ctaLabel: "Send vendor agreement",
    ctaTo: "/prepare?freeTemplate=vendor-agreement",
    relatedLinks: [{ label: "Free vendor agreement template", to: "/free-templates/vendor-agreement" }],
  },
  {
    slug: "compliance-documentation",
    seoTitle: "Compliance Documentation — Fast & Traceable | Docracy",
    seoDescription: "Collect compliance signatures with Docracy.io. Clean workflows, secure audit trails, no complexity.",
    heroHeadline: "Collect compliance signatures with a clean, traceable workflow.",
    heroSubheadline: "Perfect for HR, operations, and small teams.",
    problem: "Compliance documents require clear audit trails — but most tools are too heavy for small teams.",
    solution: "Docracy.io provides fast signing with full traceability.",
    features: [
      { title: "Policy acknowledgment signing", body: "Send policies and collect signed acknowledgements in minutes." },
      {
        title: "Compliance form templates",
        body: "Save a compliance form once and reuse it for every employee or contractor — on a paid account.",
      },
      { title: "Secure audit trail", body: "Every signature gets a timestamped, traceable record." },
      { title: "No account required for recipients", body: "Signers open the link and sign — nothing to install or register." },
      { title: "Team access", body: "Invite teammates to share templates under one paid workspace." },
    ],
    useCases: ["HR compliance", "Safety policies", "Mandatory acknowledgements", "Internal documentation", "Contractor compliance"],
    ctaLabel: "Send compliance document",
    ctaTo: "/prepare",
    relatedLinks: [{ label: "Free remote work policy template", to: "/free-templates/remote-work-policy" }],
  },
];

export interface AlternativePageContent {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  problem: string;
  solution: string;
  comparison: string[];
  ctaLabel: string;
  ctaTo: string;
  compareBlogSlug: string;
  compareLabel: string;
}

export const ALTERNATIVE_PAGES: AlternativePageContent[] = [
  {
    slug: "eversign-alternative",
    seoTitle: "Eversign Alternative — Simple & Fast | Docracy",
    seoDescription: "A lightweight alternative to Eversign for quick agreements. No subscriptions, no complexity.",
    heroHeadline: "A lightweight alternative to Eversign.",
    heroSubheadline: "Built for quick, low-stakes agreements — not enterprise workflows.",
    problem: "Eversign is powerful, but heavy. If you only need simple agreements, it's too slow and too complex.",
    solution: "Docracy.io focuses on speed, simplicity, and clean signing.",
    comparison: [
      "No subscriptions for simple agreements — up to 2 signers, completely free",
      "No account required for recipients",
      "Faster, distraction-free signing flow",
      "AI-assisted field placement (paid accounts)",
      "Perfect for NDAs, client contracts, and onboarding docs",
    ],
    ctaLabel: "Try Docracy.io free",
    ctaTo: "/prepare",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See the full price comparison vs. eversign",
  },
  {
    slug: "docusign-alternative",
    seoTitle: "DocuSign Alternative — Simple Signing | Docracy",
    seoDescription: "A simple alternative to DocuSign for quick agreements. Fast, clean, no account required.",
    heroHeadline: "DocuSign is too heavy for simple agreements.",
    heroSubheadline: "Docracy.io is built for fast, lightweight signing.",
    problem: "DocuSign is great for enterprise workflows — but overkill for NDAs, client contracts, and one-off agreements.",
    solution: "Docracy.io removes the friction and focuses on speed.",
    comparison: [
      "Faster signing — no accounts, no delays",
      "No account required for recipients",
      "No subscriptions for simple agreements — up to 2 signers, completely free",
      "AI-assisted field placement (paid accounts)",
      "Clean, distraction-free workflow",
    ],
    ctaLabel: "Start free",
    ctaTo: "/prepare",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See the full price comparison vs. DocuSign",
  },
];

export interface ExplainerSection {
  heading: string;
  body?: string;
  list?: string[];
}

export interface ExplainerPageContent {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  sections: ExplainerSection[];
  ctaLabel: string;
  ctaTo: string;
  relatedLinks: Array<{ label: string; to: string }>;
}

export const EXPLAINER_PAGES: ExplainerPageContent[] = [
  {
    slug: "what-is-an-nda",
    seoTitle: "What Is an NDA? Simple Explanation | Docracy",
    seoDescription: "Learn what an NDA is and sign NDAs online in minutes with Docracy.io.",
    heroHeadline: "What is an NDA? A simple explanation.",
    heroSubheadline: "Understand NDAs and sign them online in minutes.",
    sections: [
      {
        heading: "What is an NDA?",
        body:
          "An NDA (Non-Disclosure Agreement) is a legal document used to protect confidential information. It defines what " +
          "information is confidential, how it can be used, and what happens if it's shared improperly.",
      },
      { heading: "Types of NDAs", list: ["Mutual NDA", "One-way NDA", "Contractor NDA", "Employee NDA"] },
      {
        heading: "Why NDAs matter",
        body: "NDAs protect business ideas, client information, internal processes, and sensitive data.",
      },
      {
        heading: "Sign NDAs online",
        body:
          "Docracy.io lets you send and sign NDAs fast — no subscriptions, no account required for recipients, no complexity.",
      },
    ],
    ctaLabel: "Sign NDA online",
    ctaTo: "/prepare?freeTemplate=mutual-nda",
    relatedLinks: [
      { label: "Free mutual NDA template", to: "/free-templates/mutual-nda" },
      { label: "Free one-way NDA template", to: "/free-templates/unilateral-nda" },
      { label: "More about NDA signing", to: "/nda-signing" },
    ],
  },
  {
    slug: "are-electronic-signatures-legal",
    seoTitle: "Are Electronic Signatures Legal? | Docracy",
    seoDescription: "Yes — electronic signatures are legal. Learn how they work and sign documents online with Docracy.io.",
    heroHeadline: "Are electronic signatures legal? Yes — here's how they work.",
    heroSubheadline: "A simple explanation for businesses and individuals.",
    sections: [
      {
        heading: "Are electronic signatures legal?",
        body:
          "Yes. Electronic signatures are legally recognized in most countries, including the EU, US, UK, Canada, and " +
          "Australia, under laws such as eIDAS (EU) and ESIGN/UETA (US).",
      },
      {
        heading: "What makes an e-signature valid",
        list: ["Clear intent to sign", "A secure record of the signature", "An audit trail", "Document integrity"],
      },
      {
        heading: "Where Docracy.io fits in",
        // Deliberately not the same "verified signing flow" framing floated for this page —
        // Docracy explicitly doesn't verify signer identity (see About.tsx/Docs.tsx/Terms.tsx),
        // so claiming a verified flow here would contradict what the rest of the site says and
        // overstate what a basic audit-trail e-signature actually proves.
        body:
          "Docracy records a full audit trail — who signed, when, and from where — and keeps the signed document's " +
          "integrity intact. What it doesn't do is verify signer identity: anyone with the link can sign as the name on " +
          "it. That makes it a great fit for low-stakes agreements, but not for contracts that legally require " +
          "identity-verified signatures — for those, use a qualified, compliance-grade e-signature provider instead.",
      },
    ],
    ctaLabel: "Sign documents online",
    ctaTo: "/prepare",
    relatedLinks: [{ label: "How Docracy's signing flow works", to: "/docs" }],
  },
];
