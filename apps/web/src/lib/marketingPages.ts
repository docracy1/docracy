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
    relatedLinks: [
      { label: "Free vendor agreement template", to: "/free-templates/vendor-agreement" },
      { label: "See pricing", to: "/pricing" },
      { label: "For construction businesses", to: "/industry/construction" },
    ],
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
    relatedLinks: [
      { label: "Free remote work policy template", to: "/free-templates/remote-work-policy" },
      { label: "See pricing", to: "/pricing" },
      { label: "For small businesses", to: "/industry/small-business" },
    ],
  },
  {
    slug: "whatsapp-signing",
    seoTitle: "Sign Documents via WhatsApp | Docracy",
    seoDescription:
      "Send and sign documents over WhatsApp — phone-bound delivery with a required PIN, a step toward advanced electronic signatures. Free: 2/month. Paid: 10/month included.",
    heroHeadline: "Sign documents over WhatsApp, not just email.",
    heroSubheadline:
      "Deliver the signing link straight to a signer's WhatsApp — phone-bound, PIN-protected, and built toward the EU's Advanced Electronic Signature standard.",
    problem:
      "Email invites get lost in spam, forwarded to the wrong inbox, or just ignored. For a lot of signers — especially outside the US — WhatsApp is where they actually read messages.",
    solution:
      "Docracy can deliver the same secure signing link over WhatsApp instead of (or alongside) email, tied to the signer's own phone number and gated behind a required PIN.",
    features: [
      { title: "Phone-bound delivery", body: "The link only reaches the signer's own WhatsApp account — not a shared inbox." },
      { title: "Mandatory PIN", body: "A preparer-set PIN is required on every WhatsApp link — proof of more than just phone possession." },
      {
        title: "Delivery & read receipts",
        body: "Meta's delivery/read confirmations are recorded in the audit trail alongside the signed PDF's hash.",
      },
      { title: "Free to try", body: "Signed-up free accounts get 2 WhatsApp-signed invites per month." },
      {
        title: "10/month included on paid, then $0.50 each",
        body: "Paid accounts get 10 WhatsApp-signed invites per month included, with extra sends billed at $0.50 per signer. Unlimited on Enterprise.",
      },
    ],
    useCases: [
      "International clients who live in WhatsApp, not email",
      "Signers with unreliable email delivery",
      "Field teams and on-site contractors",
      "Personal agreements where a phone number is more reliable than an inbox",
    ],
    ctaLabel: "Try WhatsApp signing",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Advanced Electronic Signature (AES)", to: "/advanced-electronic-signature" },
      { label: "See pricing", to: "/pricing" },
      { label: "Trust & security", to: "/trust" },
    ],
  },
  {
    slug: "advanced-electronic-signature",
    seoTitle: "Advanced Electronic Signature (AES) via WhatsApp | Docracy",
    seoDescription:
      "Docracy's default signing is SES. Paid accounts can add WhatsApp-verified signing — phone-bound identity, a required PIN, and delivery/read receipts — designed to meet the EU eIDAS Advanced Electronic Signature standard.",
    heroHeadline: "Beyond a basic e-signature: Advanced Electronic Signature via WhatsApp.",
    heroSubheadline:
      "Paid accounts can require a WhatsApp-verified, PIN-protected signing link — designed to meet the EU eIDAS criteria for an Advanced Electronic Signature (AES).",
    problem:
      "A simple electronic signature (SES) — the industry default, including Docracy's free plan — proves what was signed and when, but not who physically signed. Anyone with the link can sign as the named party.",
    solution:
      "Docracy's WhatsApp-verified signing (paid accounts) binds the link to a specific phone number, requires a PIN unique to that signer, and records Meta's delivery/read receipts — evidence intended to meet the EU eIDAS AES bar: unique linkage, signatory identification, sole control, and tamper-evidence.",
    features: [
      {
        title: "Uniquely linked & identifying",
        body: "The signing link only reaches the phone number tied to that signer's own WhatsApp account.",
      },
      { title: "Sole control via a mandatory PIN", body: "A PIN set by the preparer is required before signing — phone possession alone isn't enough." },
      {
        title: "Tamper-evident by default",
        body: "Every document already carries a SHA-256 hash of the signed PDF at each step, independent of channel.",
      },
      { title: "Delivery & read evidence", body: "Meta's delivery/read receipts are stamped into the audit trail." },
      {
        title: "10 included per month, $0.50 per extra",
        body: "Bundled into every paid plan — 10 AES-track signers per month, then $0.50 each. Unlimited on Enterprise.",
      },
    ],
    useCases: [
      "Higher-stakes contracts that want more than SES",
      "Cross-border agreements under EU eIDAS",
      "Compliance-conscious teams not ready for a full QES/QTSP provider",
      "Client-facing agreements where identity assurance matters",
    ],
    ctaLabel: "See paid plans",
    ctaTo: "/pricing",
    relatedLinks: [
      { label: "Trust & security (SES vs AES disclosure)", to: "/trust" },
      { label: "Try WhatsApp signing", to: "/whatsapp-signing" },
    ],
  },
];

export function getNdaSigningPageEs(): FeaturePageContent {
  return {
    slug: "nda-signing",
    seoTitle: "Firma de NDA en línea — Rápida y simple | Docracy",
    seoDescription:
      "Firma NDAs en línea en minutos. Plantilla de NDA gratis, sin suscripciones ni cuenta requerida.",
    heroHeadline: "Firma NDAs rápido — sin suscripciones ni complejidad.",
    heroSubheadline: "Ideal para freelancers, consultores, agencias y equipos pequeños.",
    problem:
      "Las herramientas tradicionales de firma electrónica hacen lento el proceso de NDA: cuentas, onboarding y plantillas detrás de un muro de pago.",
    solution: "Docracy.io te permite enviar y firmar NDAs al instante — flujo limpio, sin fricción.",
    features: [
      { title: "Plantilla de NDA gratis", body: "Empieza con un NDA mutuo o unilateral listo para usar — sin muro de pago." },
      { title: "Colocación de campos con IA", body: "Campos de firma y fecha colocados automáticamente — en una cuenta de pago." },
      {
        title: "Sin cuenta para los destinatarios",
        body: "Los firmantes abren el enlace y firman — nada que instalar ni registrar.",
      },
      { title: "Registro de auditoría seguro", body: "Cada NDA obtiene un registro con marca de tiempo de quién firmó y cuándo." },
      {
        title: "Plantillas de NDA reutilizables para clientes recurrentes",
        body: "Guarda tu NDA una vez y reutilízalo para cada cliente nuevo — en una cuenta de pago.",
      },
    ],
    useCases: [
      "Freelancers que envían NDAs antes de proyectos",
      "Agencias que incorporan nuevos clientes",
      "Equipos que comparten documentos confidenciales",
      "NDAs puntuales para acuerdos rápidos",
    ],
    ctaLabel: "Enviar NDA ahora",
    ctaTo: "/prepare?freeTemplate=mutual-nda",
    relatedLinks: [
      { label: "Plantilla gratis de NDA mutuo", to: "/free-templates/mutual-nda" },
      { label: "Plantilla gratis de NDA unilateral", to: "/free-templates/unilateral-nda" },
      { label: "¿Qué es un NDA?", to: "/what-is-an-nda" },
    ],
  };
}

export function getClientContractsPageEs(): FeaturePageContent {
  return {
    slug: "client-contracts",
    seoTitle: "Firma de contratos con clientes — Rápida y simple | Docracy",
    seoDescription: "Envía contratos con clientes sin fricción. Flujo de firma limpio, sin cuentas requeridas.",
    heroHeadline: "Envía contratos con clientes sin fricción.",
    heroSubheadline: "Los clientes firman al instante — sin cuentas ni flujos confusos.",
    problem:
      "A los clientes no les gusta crear cuentas solo para firmar un contrato simple. Eso retrasa los acuerdos y perjudica la conversión.",
    solution: "Docracy.io ofrece a los clientes una experiencia de firma limpia e instantánea.",
    features: [
      { title: "Envío simple de contratos", body: "Sube tu contrato y envíalo a firma en segundos." },
      { title: "Colocación de campos con IA", body: "Campos de firma y fecha colocados automáticamente — en una cuenta de pago." },
      {
        title: "Plantillas de contrato reutilizables",
        body: "Guarda tu contrato estándar una vez y reutilízalo para cada cliente nuevo — en una cuenta de pago.",
      },
      { title: "Almacenamiento seguro", body: "Cifrado, seguro y totalmente trazable." },
      { title: "Flujo de firma rápido", body: "Los clientes firman desde cualquier dispositivo — sin software ni cuenta." },
    ],
    useCases: ["Freelancers", "Consultores", "Agencias", "Equipos pequeños", "Acuerdos puntuales con clientes"],
    ctaLabel: "Envía tu próximo contrato",
    ctaTo: "/prepare?freeTemplate=freelance-service-agreement",
    relatedLinks: [
      { label: "Plantilla gratis de acuerdo de servicios freelance", to: "/free-templates/freelance-service-agreement" },
      { label: "Plantilla gratis de acuerdo de consultoría", to: "/free-templates/consulting-agreement" },
    ],
  };
}

const ES_FEATURE_GETTERS: Record<string, () => FeaturePageContent> = {
  "nda-signing": getNdaSigningPageEs,
  "client-contracts": getClientContractsPageEs,
};

/** Locale-aware feature page content — ES routes use Spanish copy. */
export function getFeaturePageContent(slug: string, locale: "en" | "es"): FeaturePageContent | undefined {
  if (locale === "es" && ES_FEATURE_GETTERS[slug]) return ES_FEATURE_GETTERS[slug]();
  return FEATURE_PAGES.find((p) => p.slug === slug);
}

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
      "WhatsApp signing links — Eversign doesn't offer this; Docracy includes 2 free/month",
      "Perfect for NDAs, client contracts, and onboarding docs",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-eversign-alternative",
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
      "WhatsApp signing links — DocuSign doesn't offer this; Docracy includes 2 free/month",
      "Clean, distraction-free workflow",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-docusign-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See the full price comparison vs. DocuSign",
  },
  {
    slug: "hellosign-alternative",
    seoTitle: "HelloSign / Dropbox Sign Alternative — Free & Simple | Docracy",
    seoDescription:
      "Looking for a HelloSign or Dropbox Sign alternative for NDAs and client contracts? Free for up to 2 signers, no account required. Paid $10/mo flat.",
    heroHeadline: "A simpler alternative to HelloSign / Dropbox Sign.",
    heroSubheadline: "For freelancers and small teams who just need agreements signed — not another seat tax.",
    problem:
      "HelloSign (now Dropbox Sign) is cleaner than DocuSign, but free tiers cap you quickly and paid plans still price like a seat product for light NDA and contract volume.",
    solution:
      "Docracy is built for that light volume: free up to 2 signers with no account for anyone, then a flat $10/mo when you need templates, more signers, or a team.",
    comparison: [
      "Free for up to 2 signers — no account for sender or signer",
      "No per-seat pricing on paid — $10/month flat",
      "Sample mutual NDA ready in ~30 seconds",
      "Sequential or parallel signing",
      "WhatsApp signing links — HelloSign doesn't offer this; Docracy includes 2 free/month",
      "Honest limit: not for ID-verified enterprise workflows",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-hellosign-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy prices vs seat-based e-sign tools",
  },
  {
    slug: "pandadoc-alternative",
    seoTitle: "PandaDoc Alternative for Simple Agreements | Docracy",
    seoDescription:
      "Need signatures without PandaDoc’s proposal suite? Docracy is free for up to 2 signers — built for NDAs and client contracts, not sales proposals.",
    heroHeadline: "PandaDoc is overkill if you only need a signature.",
    heroSubheadline: "Docracy skips proposals and CPQ — just send the PDF and get it signed.",
    problem:
      "PandaDoc shines for quotes and proposals. If your job is “please sign this NDA / contractor agreement,” you’re paying for a sales stack you don’t use.",
    solution:
      "Docracy is a lightweight signing path: upload or start from a free template, place fields, send. Free for 2 signers; paid is $10/mo when you outgrow that.",
    comparison: [
      "No proposal editor required for simple agreements",
      "Free ≤2 signers, no accounts",
      "Flat $10/mo paid — not per seat",
      "Templates for NDAs, contractor docs, client contracts",
      "WhatsApp signing links — PandaDoc doesn't offer this; Docracy includes 2 free/month",
      "Skip if you need full proposal + payments in one tool",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-pandadoc-alternative",
    compareBlogSlug: "docracy-vs-pandadoc",
    compareLabel: "See the full price comparison vs. PandaDoc",
  },
  {
    slug: "adobe-sign-alternative",
    seoTitle: "Adobe Sign Alternative — Lightweight E-Sign | Docracy",
    seoDescription:
      "Adobe Acrobat Sign alternative for freelancers and small teams. Free for up to 2 signers, no account required. Paid $10/mo flat.",
    heroHeadline: "Adobe Sign without the Acrobat baggage.",
    heroSubheadline: "When you need a signature — not another Adobe seat in the stack.",
    problem:
      "Adobe Acrobat Sign makes sense inside Acrobat workflows. For occasional NDAs and client agreements, it’s heavy and priced for teams living in Adobe every day.",
    solution:
      "Docracy is a focused signing product: free for simple two-party docs, flat $10/mo when you need more — no Creative Cloud required.",
    comparison: [
      "No Adobe account for signers",
      "Free for up to 2 signers",
      "$10/mo flat when you need templates / more signers / team",
      "Works from any browser on phone or desktop",
      "WhatsApp signing links — Adobe Sign doesn't offer this; Docracy includes 2 free/month",
      "Not a full Acrobat replacement — deliberately lighter",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-adobe-sign-alternative",
    compareBlogSlug: "docracy-vs-adobe-acrobat-sign",
    compareLabel: "See the full price comparison vs. Adobe Sign",
  },
];

/** One page per competitor: no "connect your account" button anywhere — confirmed via direct
 *  research that none of these five offer a free, self-serve, general-purpose bulk-export API a
 *  typical individual account actually has access to (see whyNoConnect per platform for the
 *  specific gate). Each page instead walks through that platform's real, existing manual
 *  per-document download, then routes into Docracy's upload flow (AI field detection does the
 *  rest — zero new backend work). */
export interface ImportGuideContent {
  slug: string;
  competitorName: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  whyNoConnect: string;
  exportSteps: string[];
  templateNote: string;
  alternativeSlug: string;
}

export const IMPORT_GUIDE_PAGES: ImportGuideContent[] = [
  {
    slug: "docusign",
    competitorName: "DocuSign",
    seoTitle: "Import Your DocuSign Documents to Docracy — Step-by-Step Guide",
    seoDescription:
      "Bring your existing DocuSign documents and templates over to Docracy. No account-linking, no password sharing — just the export steps DocuSign already gives you for free.",
    heroHeadline: "Bring your DocuSign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your DocuSign password. Export the PDFs you already have.",
    whyNoConnect:
      "DocuSign's API only gets real access to your account once production API access is enabled on it — something most personal and small-business plans don't have by default. We also don't ask for your DocuSign password to \"connect your account\"; that's off-limits here regardless.",
    exportSteps: [
      "Sign in to DocuSign and open Manage.",
      "Open the completed envelope or reusable template you want to bring over.",
      "Choose Download — for a completed envelope this gives you the signed PDF; for a template, DocuSign exports a package containing the source document.",
      "Repeat for each document or template you want to keep using.",
    ],
    templateNote:
      "Templates export as a DocuSign-specific package — the underlying PDF comes with it, but the field and routing setup is proprietary and won't transfer directly.",
    alternativeSlug: "docusign-alternative",
  },
  {
    slug: "eversign",
    competitorName: "eversign",
    seoTitle: "Import Your eversign Documents to Docracy — Step-by-Step Guide",
    seoDescription:
      "Bring your existing eversign documents over to Docracy. No account-linking required — just the free per-document export eversign already offers.",
    heroHeadline: "Bring your eversign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your eversign password. Export the PDFs you already have.",
    whyNoConnect:
      "eversign's API is free only for 2 test envelopes — real production access starts on a paid API plan, which most individual accounts don't carry. We also won't ask for your eversign password to link accounts.",
    exportSteps: [
      "Sign in to eversign and open Documents.",
      "Check both the Completed and Drafts tabs, depending on what you need.",
      "Open the document and choose Download.",
      "Repeat for each document — eversign doesn't offer a bulk \"download all\" button either.",
    ],
    templateNote:
      "No portable export path for templates — they live in eversign's own system, though the underlying source document downloads as a normal PDF.",
    alternativeSlug: "eversign-alternative",
  },
  {
    slug: "hellosign",
    competitorName: "HelloSign (Dropbox Sign)",
    seoTitle: "Import Your HelloSign / Dropbox Sign Documents to Docracy",
    seoDescription:
      "Bring your existing HelloSign (Dropbox Sign) documents over to Docracy. No account-linking — just the free per-document export already built into Dropbox Sign.",
    heroHeadline: "Bring your HelloSign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your Dropbox Sign password. Export the PDFs you already have.",
    whyNoConnect:
      "Dropbox Sign's free API mode only produces watermarked, non-binding test documents — it can't pull your real signed files. Real production API access sits on separate paid API tiers, priced above the consumer plans most people are on.",
    exportSteps: [
      "Sign in at sign.dropbox.com.",
      "Open a completed signature request.",
      "Choose Download, Download PDF, or Download Signed ZIP.",
      "Repeat for each document — one-click bulk export needs the Team Sync admin feature, not available on individual plans.",
    ],
    templateNote:
      "Templates are stored in Dropbox Sign's own template system with no documented one-click export — the source PDF or Word file is standard, but the reusable field layout is proprietary.",
    alternativeSlug: "hellosign-alternative",
  },
  {
    slug: "pandadoc",
    competitorName: "PandaDoc",
    seoTitle: "Import Your PandaDoc Documents to Docracy — Step-by-Step Guide",
    seoDescription:
      "Bring your existing PandaDoc documents and templates over to Docracy. No account-linking required — PandaDoc's own DocX export makes this the easiest of the five to migrate from.",
    heroHeadline: "Bring your PandaDoc documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your PandaDoc password. Export the files you already have.",
    whyNoConnect:
      "PandaDoc's free API sandbox is real but capped at 60 documents a year — production use beyond that needs a paid API Developer plan most free-plan accounts don't carry.",
    exportSteps: [
      "Sign in to PandaDoc and open Documents.",
      "Open the completed document.",
      "Download it as a PDF, or use DocX Export for a native Word file.",
      "Repeat for each document — bulk download is a Business/Enterprise-only feature.",
    ],
    templateNote:
      "Best portability of the five: PandaDoc's DocX Export turns a template into a native Word file that opens anywhere, not just PandaDoc.",
    alternativeSlug: "pandadoc-alternative",
  },
  {
    slug: "adobe-sign",
    competitorName: "Adobe Acrobat Sign",
    seoTitle: "Import Your Adobe Acrobat Sign Documents to Docracy",
    seoDescription:
      "Bring your existing Adobe Acrobat Sign agreements over to Docracy. No account-linking — just the manual per-document download Adobe already provides.",
    heroHeadline: "Bring your Adobe Sign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your Adobe password. Export the PDFs you already have.",
    whyNoConnect:
      "Adobe reserves real production API access for enterprise and developer accounts behind a custom quote — there's no self-serve paid tier at all for individual accounts, which makes this the most closed of the five platforms here.",
    exportSteps: [
      "Sign in to Adobe Acrobat Sign and open Manage.",
      "Open the completed agreement.",
      "Choose Download PDF.",
      "Repeat for each document — true bulk download is an Enterprise-only tool obtained by contacting Adobe support.",
    ],
    templateNote:
      "A reusable form-field layer can transfer to a new document, but field data alone exports as CSV, not a full portable template — closer to full lock-in than the other four.",
    alternativeSlug: "adobe-sign-alternative",
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
    relatedLinks: [
      { label: "ESIGN Act & UETA (US)", to: "/esign-ueta" },
      { label: "Trust & security", to: "/trust" },
      { label: "How Docracy's signing flow works", to: "/docs" },
    ],
  },
];

/** Dedicated landing pages for cold outreach — the homepage pitches Docracy to someone who
 *  already knows they want e-signatures; an outreach lead just got a DM/email out of nowhere and
 *  needs a different opening: why they were contacted, what problem it solves for THEM
 *  specifically, then a fast way to try it. Persona keys match the /go/dm-* short-link campaigns
 *  in ShortLinkRedirect.tsx, so each cold-email persona lands on copy written for them, not the
 *  general-audience homepage. */
export interface OutreachPageContent {
  persona: string;
  freeTemplate: string;
  eyebrow: string;
  whyReachedOut: string;
  problemSolved: string;
  ctaLabel: string;
}

export const OUTREACH_PAGES: OutreachPageContent[] = [
  {
    persona: "freelancer",
    freeTemplate: "freelance-service-agreement",
    eyebrow: "Why you're getting this",
    whyReachedOut:
      "You send client agreements as part of freelance or contract work — that's the one thing this is actually useful for, so I reached out directly instead of running an ad at everyone.",
    problemSolved:
      "Client NDAs and service agreements without the DocuSign tax — no per-seat pricing, and your client doesn't need to create an account just to sign.",
    ctaLabel: "Try it now — send a sample service agreement",
  },
  {
    persona: "agency",
    freeTemplate: "contractor-onboarding-agreement",
    eyebrow: "Why you're getting this",
    whyReachedOut:
      "Agencies and studios bringing contractors on project-by-project hit the same paperwork loop over and over — that's specifically what this solves, which is why you're hearing from me rather than a general ad.",
    problemSolved:
      "Contractor onboarding and NDAs without buying a DocuSign seat for someone who's only with you for one project.",
    ctaLabel: "Try it now — send a sample onboarding agreement",
  },
  {
    persona: "peopleops",
    freeTemplate: "offer-letter",
    eyebrow: "Why you're getting this",
    whyReachedOut:
      "You're likely sending offer letters and contractor NDAs regularly for a growing team — that's the exact use case this is built for, so this isn't a cold blast to everyone.",
    problemSolved:
      "Offer letters and onboarding documents without per-seat pricing eating into a lean people-ops budget.",
    ctaLabel: "Try it now — send a sample offer letter",
  },
  {
    persona: "founder",
    freeTemplate: "independent-contractor-agreement",
    eyebrow: "Why you're getting this",
    whyReachedOut:
      "Founders hiring their first contractors hit this exact paperwork moment — needing a signature without adding another SaaS seat to a lean stack — which is why this landed in your inbox specifically.",
    problemSolved: "Contractor agreements and client NDAs without a new subscription just to get one document signed.",
    ctaLabel: "Try it now — send a sample contractor agreement",
  },
  {
    persona: "general",
    freeTemplate: "mutual-nda",
    eyebrow: "Why you're getting this",
    whyReachedOut:
      "You clicked through from an outreach message, which usually means you're already sending agreements that need a signature — this is built for exactly that.",
    problemSolved: "Get a document signed without an account, a subscription, or per-seat pricing.",
    ctaLabel: "Try it now — send a sample NDA",
  },
];

/** One page per small-business "industry" — deliberately not modeled on enterprise mega-menus
 *  (e.g. a competitor's Real Estate / Legal / Finance / Construction / Technology split, which
 *  assumes brokerages, law firms, and IT departments as the buyer). Docracy's actual audience is
 *  solo entrepreneurs, freelancers, and small/medium businesses, so each industry here is scoped
 *  to the low-stakes paperwork that audience actually sends — never framed as fit for regulated,
 *  compliance-grade, or identity-verified signing (see Trust.tsx / About.tsx for why: Docracy's
 *  audit trail proves what was signed and when, not who physically signed it). `honestLimit` is
 *  only set where a naive reading of the industry name (real estate closings, for instance) could
 *  otherwise oversell what Docracy actually does. */
export interface IndustryPageContent {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  painPoints: string[];
  whyDocracy: string;
  relevantTemplates: string[];
  /** Only set when the industry name alone could otherwise imply a regulated/compliance use case
   *  Docracy doesn't support — states the honest scope limit up front, same tone as Trust.tsx. */
  honestLimit?: string;
  ctaLabel: string;
  ctaTo: string;
}

export const INDUSTRY_PAGES: IndustryPageContent[] = [
  {
    slug: "freelancers",
    seoTitle: "E-Signatures for Freelancers & Consultants | Docracy",
    seoDescription:
      "Free e-signing for freelancers and consultants — client agreements, NDAs, and payment terms. No account required, no subscriptions for simple two-party deals.",
    heroHeadline: "E-signatures built for freelancers and consultants.",
    heroSubheadline:
      "Send client agreements, NDAs, and payment terms in minutes — free for you and your client, no account required.",
    painPoints: [
      "A client wants a signed agreement before you start work, but you don't have budget for a $30–$75/month e-sign subscription to send a handful of documents a month.",
      "A prospect wants an NDA signed before a discovery call — asking them to create an account first kills the momentum.",
      "Payment terms need a real signature, not just an email that says \"sounds good.\"",
      "Most e-sign tools price per seat or per envelope — brutal math for a solo operator sending a dozen documents a month, not a thousand.",
    ],
    whyDocracy:
      "Docracy is free for signing chains of up to two people — you and your client — with no account required on either side. Start from a free freelance service agreement, NDA, or payment-terms template, fill in your details, and send. It's built for exactly this: one person sending a handful of agreements a month, not a sales team on a seat license.",
    relevantTemplates: [
      "freelance-service-agreement",
      "independent-contractor-agreement",
      "mutual-nda",
      "unilateral-nda",
      "consulting-agreement",
      "payment-terms-agreement",
    ],
    ctaLabel: "Send your first client agreement",
    ctaTo: "/prepare?ref=seo-industry-freelancers",
  },
  {
    slug: "creative-agencies",
    seoTitle: "E-Signatures for Creative & Marketing Agencies | Docracy",
    seoDescription:
      "Free e-signing for creative and marketing agencies — contractor onboarding, scope of work, and client contracts. No account required, no per-seat pricing.",
    heroHeadline: "E-signatures built for creative and marketing agencies.",
    heroSubheadline:
      "Onboard freelance talent and send client contracts fast — free for two-party signing, no per-seat pricing.",
    painPoints: [
      "Bringing on a freelance designer, writer, or developer project-by-project means fresh onboarding paperwork every time — most e-sign tools charge as if each one were a full-time hire.",
      "Client contracts and scope-of-work docs need to go out fast when a pitch turns into a signed deal, not sit in a queue behind procurement-approved software.",
      "Scope shifts mid-project constantly — a change order needs a real signature, not a Slack thumbs-up.",
      "Agencies juggle many small, one-off signing chains (one contractor, one client) rather than a few huge contracts — most e-sign pricing doesn't fit that shape.",
    ],
    whyDocracy:
      "Docracy handles two-party signing — agency and client, or agency and freelance talent — for free, with no account needed by whoever's signing. Start from a contractor onboarding agreement, scope of work, or client contract, fill in the project details, and send. A flat $10/month (not per seat) adds reusable templates and unlimited signers once you outgrow the free tier.",
    relevantTemplates: ["contractor-onboarding-agreement", "scope-of-work", "client-contract", "service-agreement"],
    ctaLabel: "Send a scope of work",
    ctaTo: "/prepare?ref=seo-industry-creative-agencies",
  },
  {
    slug: "real-estate",
    seoTitle: "E-Signatures for Small Landlords & Property Managers | Docracy",
    seoDescription:
      "Free e-signing for leases, subleases, roommate agreements, and vendor paperwork. Built for small landlords and independent property managers — not closings.",
    heroHeadline: "E-signatures for small landlords and property managers.",
    heroSubheadline:
      "Leases, subleases, roommate agreements, and vendor paperwork — signed in minutes, free for two parties.",
    painPoints: [
      "A small landlord or independent property manager needs a lease or sublease signed fast, without enterprise real-estate software built for brokerages.",
      "A repair job needs a signed vendor agreement with a contractor before work starts, not a verbal okay.",
      "A new roommate move-in needs a clear, signed understanding of rent splits and house rules, separate from the actual lease.",
      "Most e-sign tools aimed at \"real estate\" are priced and built for high-volume brokers, not someone managing one or two properties on the side.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — landlord and tenant, sublessor and subtenant, or property manager and vendor — with no account required to sign. Start from a lease, sublease, roommate agreement, or vendor agreement template, fill in the specifics, and send.",
    honestLimit:
      "What this is not: Docracy doesn't handle real estate closings, title transfer, or anything that legally requires notarization or identity-verified signing. The audit trail proves what was signed and when — not who physically signed it — which is fine for day-to-day landlord paperwork, but the wrong tool for a property sale or any document your state requires a notary for. For those, use a title company or a compliance-grade, identity-verified signing service instead.",
    relevantTemplates: [
      "simple-commercial-lease-agreement",
      "sublease-agreement",
      "rental-agreement",
      "roommate-agreement",
      "vendor-agreement",
    ],
    ctaLabel: "Send a lease or vendor agreement",
    ctaTo: "/prepare?ref=seo-industry-real-estate",
  },
  {
    slug: "construction",
    seoTitle: "E-Signatures for Construction & Trades | Docracy",
    seoDescription:
      "Free e-signing for contractors — work orders, quotes, subcontractor onboarding, and liability waivers. No account required, sign from the job site.",
    heroHeadline: "E-signatures built for contractors and trades.",
    heroSubheadline:
      "Work orders, quotes, subcontractor onboarding, and liability waivers — signed from the job site, free for two parties.",
    painPoints: [
      "A contractor needs to send a work order or quote fast, before the customer calls someone else.",
      "Bringing on a subcontractor for a single job means onboarding paperwork every time — enterprise e-sign pricing doesn't make sense for one subcontractor on one job.",
      "Liability waivers need to be signed before someone steps on a job site, not filed away after the fact.",
      "Change orders come up mid-job constantly — a scope, materials, or cost change needs a signed record, not a handshake.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and your customer, or you and a subcontractor — with no account required for either side. Start from a work order, construction contract, or liability waiver template, fill in the job details, and send from the truck or the job site.",
    relevantTemplates: ["construction-contract", "work-order", "contractor-onboarding-agreement", "liability-waiver", "purchase-order"],
    ctaLabel: "Send a work order",
    ctaTo: "/prepare?ref=seo-industry-construction",
  },
  {
    slug: "small-business",
    seoTitle: "E-Signatures for Small Business & Local Services | Docracy",
    seoDescription:
      "Free e-signing for small businesses — vendor agreements, employee onboarding, bills of sale, and cash receipts. No account required, no subscriptions.",
    heroHeadline: "E-signatures built for small business and local services.",
    heroSubheadline:
      "Vendor agreements, onboarding, bills of sale, and receipts — signed in minutes, free for two parties.",
    painPoints: [
      "A vendor or supplier agreement needs a signature before the first order ships, not after.",
      "New hires need onboarding paperwork signed on day one, without paying for HR software built for much bigger teams.",
      "A one-time sale of equipment or inventory needs a real bill of sale, not just a text confirming the price.",
      "A cash payment needs a signed receipt on the spot, for your own records and your accountant's.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and a vendor, employee, or customer — with no account required for whoever's signing. Start from a vendor agreement, employee onboarding agreement, bill of sale, or cash receipt template, fill in the details, and send from the counter or the back office.",
    relevantTemplates: ["vendor-agreement", "employee-onboarding-agreement", "client-contract", "bill-of-sale", "cash-receipt", "sales-agreement"],
    ctaLabel: "Send a vendor agreement",
    ctaTo: "/prepare?ref=seo-industry-small-business",
  },
];
