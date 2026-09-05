import { countryFeaturePage, generatedCountryPages, GENERATED_COUNTRY_CORRIDORS } from "./latamCountryCorridors";

export { GENERATED_COUNTRY_CORRIDORS, LATAM_COUNTRY_CORRIDORS } from "./latamCountryCorridors";

// Data for the batch of narrow-intent landing/explainer pages requested for SEO — kept in one
// place (like freeTemplates.ts) rather than inline in each page component, since prerender.mjs
// needs the same title/description strings without importing React.

export interface FeaturePageContent {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  /** Opt into the dark, moody hero treatment used on the actual tool page this feature links to
   *  (see `.verify-dark-hero` in theme.css and Verify.tsx) instead of the shared light gradient
   *  `.hero-band` every other FeaturePage uses. Only for pages whose CTA leads to a page that
   *  already established that visual identity — not a general-purpose style knob. */
  darkHero?: boolean;
  problem: string;
  solution: string;
  features: Array<{ title: string; body: string }>;
  useCases: string[];
  /** Optional — pages without it just skip the FAQ section. */
  faqs?: Array<{ question: string; answer: string }>;
  ctaLabel: string;
  ctaTo: string;
  relatedLinks: Array<{ label: string; to: string }>;
  /** Optional YouTube video ID (youtube-nocookie embed + VideoObject JSON-LD). */
  youtubeId?: string;
  /** Accessible iframe / VideoObject title; defaults to heroHeadline when omitted. */
  youtubeTitle?: string;
  /** Required with youtubeId — VideoObject uploadDate (YYYY-MM-DD or ISO DateTime). */
  youtubeUploadDate?: string;
  /** When set, hreflang x-default points at this locale (constancia keyword pages are ES-lead). */
  xDefault?: "en" | "es";
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
    seoTitle: "Sign NDA Online Free — No Account Required | Docracy",
    seoDescription:
      "Sign an NDA online free for up to 2 signers — no account required for sender or signer. Mutual NDA template ready in minutes; flat $10/mo when you need more.",
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
    faqs: [
      {
        question: "Do recipients need an account to sign an NDA?",
        answer:
          "No. They open the link from email (or WhatsApp on a paid plan) and sign — nothing to install or register.",
      },
      {
        question: "Is there a free NDA template?",
        answer:
          "Yes. Start from Docracy's mutual or one-way NDA templates with fields already placed, then send for signature.",
      },
      {
        question: "Are Docracy NDAs legally valid e-signatures?",
        answer:
          "Docracy produces simple electronic signatures (SES) with a timestamped audit trail, designed to support ESIGN/UETA. It does not verify signer identity — see /trust for the honest disclosure.",
      },
    ],
  },
  {
    slug: "client-contracts",
    seoTitle: "Client Contract Signing — Fast & Simple | Docracy",
    seoDescription: "Send client contracts without friction. Clean signing flow, no accounts required.",
    heroHeadline: "Send client contracts without friction.",
    heroSubheadline: "Clients sign instantly — no accounts, no confusing flows.",
    problem:
      "Clients hate creating accounts just to sign a simple contract. This slows down deals and hurts conversion — " +
      "the moment a prospect has to register for software before they can even read what they're agreeing to, some " +
      "share of them will simply put it off. That delay is often the difference between a deal that closes today " +
      "and one that quietly stalls.",
    solution:
      "Docracy.io gives clients a clean, instant signing experience: no account, no download, just a link they can " +
      "open and sign from a phone or laptop. You keep the parts that matter — a real signature, a timestamped audit " +
      "trail, a completed PDF you can store — without asking the client to do anything more than review and sign.",
    features: [
      { title: "Simple contract sending", body: "Upload your contract and send it for signature in seconds." },
      { title: "AI field placement", body: "Signature and date fields placed automatically — on a paid account." },
      {
        title: "Reusable client contract templates",
        body: "Save your standard contract once and reuse it for every new client — on a paid account.",
      },
      {
        title: "Secure storage",
        body: "Documents are encrypted in transit and at rest, with a timestamped audit trail of who signed and when.",
      },
      { title: "Fast signing flow", body: "Clients sign from any device — no software or account needed." },
      {
        title: "Sequential or all-at-once signing",
        body: "For contracts with more than one signer, choose whether they sign in order or all at once.",
      },
    ],
    useCases: [
      "Freelancers sending a service agreement before work starts",
      "Consultants closing a new engagement",
      "Agencies getting a scope of work signed off quickly",
      "Small teams that don't want per-seat e-signature pricing",
      "One-off client agreements that don't justify a full contract-management platform",
    ],
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
      "Vendor agreements often require signatures from multiple parties — traditional tools slow this down with " +
      "accounts and heavy workflows. A supplier who has to register for your e-signature platform before signing a " +
      "simple pricing agreement is a supplier who's more likely to ask you to just email a PDF back and forth instead.",
    solution:
      "Docracy.io makes vendor agreement signing simple and fast: start from a ready-made template, add every party " +
      "that needs to sign, and send. No one on the vendor's side needs an account, and you still get a clean, " +
      "timestamped record of the final signed agreement for your files.",
    features: [
      { title: "Vendor agreement templates", body: "Start from a ready-made vendor agreement template — free to use." },
      { title: "AI field placement", body: "Signature and date fields placed automatically — on a paid account." },
      { title: "Multi-party signing", body: "Add every signer and choose sequential or all-at-once signing order." },
      {
        title: "Secure storage",
        body: "Documents are encrypted in transit and at rest, with a timestamped audit trail of who signed and when.",
      },
      { title: "Clean signing flow", body: "Every party signs from any device — no software or account needed." },
      {
        title: "Reusable for recurring suppliers",
        body: "Save a vendor agreement once and reuse it for every renewal or new supplier — on a paid account.",
      },
    ],
    useCases: [
      "Supplier contracts covering pricing and delivery terms",
      "Service agreements with ongoing vendors",
      "Partnership agreements between two businesses",
      "Renewal documents for recurring vendor relationships",
      "One-off vendor deals that don't need a full procurement process",
    ],
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
    problem:
      "Compliance documents require clear audit trails — but most tools built for that are too heavy for small " +
      "teams, bundling policy management, approval chains, and per-seat licensing that a five-person team doesn't " +
      "need just to prove a policy was read and acknowledged.",
    solution:
      "Docracy.io provides fast signing with full traceability: send the policy, collect a signed acknowledgment, " +
      "and keep a timestamped record of who signed and when — without the compliance-suite overhead built for much " +
      "larger organizations.",
    features: [
      { title: "Policy acknowledgment signing", body: "Send policies and collect signed acknowledgements in minutes." },
      {
        title: "Compliance form templates",
        body: "Save a compliance form once and reuse it for every employee or contractor — on a paid account.",
      },
      {
        title: "Secure audit trail",
        body: "Every signature gets a timestamped, traceable record of who signed, when, and from where.",
      },
      { title: "No account required for recipients", body: "Signers open the link and sign — nothing to install or register." },
      { title: "Team access", body: "Invite teammates to share templates under one paid workspace." },
      {
        title: "Honest scope",
        body:
          "This covers acknowledgment signing with a solid audit trail — it isn't a substitute for SOC 2 or ISO " +
          "27001 certification, or a full compliance-management platform.",
      },
    ],
    useCases: [
      "HR compliance acknowledgments",
      "Safety policy sign-off for staff and contractors",
      "Mandatory acknowledgements tied to a policy update",
      "Internal documentation that needs a signed record",
      "Contractor compliance forms before work begins",
    ],
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
      "Send and sign documents over WhatsApp — phone-bound delivery with a required PIN, a step toward advanced electronic signatures. Free: 1/month. Paid: 10/month included.",
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
      { title: "Free to try", body: "Signed-up free accounts get 1 WhatsApp-signed invite per month." },
      {
        title: "10/month included on paid, then $0.50 each",
        body: "Paid accounts get 10 WhatsApp-signed invites per month included, with extra sends billed at $0.50 per signer. Enterprise gets 50/month fair-use.",
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
      { label: "Get paid on WhatsApp (cobro)", to: "/cobro" },
      { label: "Advanced Electronic Signature (AES)", to: "/advanced-electronic-signature" },
      { label: "See pricing", to: "/pricing" },
    ],
    youtubeId: "LvnzCbPBRqY",
    youtubeTitle: "Sign documents via WhatsApp — Docracy demo",
    youtubeUploadDate: "2026-08-08",
    faqs: [
      {
        question: "How does WhatsApp signing work?",
        answer:
          "You set a PIN and the signer's phone number. Docracy delivers the signing link to their WhatsApp. They enter the PIN, then sign — phone-bound delivery with an audit trail.",
      },
      {
        question: "Is WhatsApp signing free?",
        answer:
          "Signed-up free accounts get 1 WhatsApp-signed invite per month. Paid plans include 10/month, then $0.50 each. Enterprise gets 50/month fair-use.",
      },
      {
        question: "Is this an Advanced Electronic Signature (AES)?",
        answer:
          "WhatsApp-verified, PIN-protected signing is designed toward the EU eIDAS AES criteria (unique linkage, identification, sole control, tamper-evidence). Default email signing remains SES. See /advanced-electronic-signature and /trust.",
      },
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
        body: "Bundled into every paid plan — 10 AES-track signers per month, then $0.50 each. Enterprise gets 50/month fair-use.",
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
  {
    slug: "artist-contracts",
    seoTitle: "Artist Contracts — Sign Online Free | Docracy",
    seoDescription: "Free contract templates and e-signatures for commissions, consignment, and licensing. No account required for your client to sign.",
    heroHeadline: "Contracts built for how artists actually work.",
    heroSubheadline: "Commission agreements, gallery consignment terms, and licensing deals — signed in minutes, not weeks.",
    problem: "Most contract tools are built for law firms and sales teams, not for an illustrator locking in a commission or a painter agreeing to consignment terms with a gallery. So the agreement gets skipped, handled over email, or reduced to a verbal understanding — and when a client disappears mid-project or a gallery's terms turn out different from what was discussed, there's nothing signed to point to.",
    solution: "Docracy.io lets you send a real, signed agreement without asking your client, gallery, or collector to create an account. Use one of your own contracts or start from a free template, add signature fields, and send a link — they open it and sign, no friction, no delay.",
    features: [
      { title: "Free for you and your client", body: "Documents with up to 2 signers are free forever — no subscription needed for a simple commission or consignment agreement." },
      { title: "No account required for the other side", body: "Your client, gallery contact, or collector just opens the link and signs — nothing to install or register." },
      { title: "Upload the contract you already use", body: "Already have a commission or consignment agreement you like? Upload it as-is (PDF or Google Doc) and place signature fields on it." },
      { title: "Reusable templates for repeat clients", body: "Save your standard commission agreement once and reuse it for every new client — on a paid account." },
      { title: "Secure, timestamped audit trail", body: "Every signed contract gets a record of who signed and when — useful if payment terms or scope are ever disputed." },
    ],
    useCases: [
      "Illustrators sending commission agreements before starting new work",
      "Painters formalizing consignment terms with a gallery before a show",
      "Artists licensing a piece for print, merchandise, or reproduction",
      "Muralists documenting project scope and payment schedule",
      "Studio assistants signing work-for-hire agreements",
    ],
    faqs: [
      { question: "Is Docracy really free for artists?", answer: "Yes — documents with up to 2 signers are free forever, which covers most single-client commission or consignment agreements. A flat $10/month unlocks reusable templates and covers agreements with more signers." },
      { question: "Does my client need to create an account to sign?", answer: "No. They open the link you send and sign directly — no account, no app to install." },
      { question: "Can I use my own commission or consignment contract?", answer: "Yes — upload the PDF (or paste a Google Docs link) you already use and place signature fields on it, instead of starting from a template." },
      { question: "How do I prove a client actually agreed to the terms?", answer: "Every signed contract includes a timestamped audit trail recording when it was sent, opened, and signed — useful if payment terms or scope are ever disputed later." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "IP Licensing Agreement", to: "/free-templates/ip-licensing-agreement" },
      { label: "Copyright Assignment Agreement", to: "/free-templates/copyright-assignment-agreement" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "creative-licensing",
    seoTitle: "Creative Licensing Agreements — Sign Online Free | Docracy",
    seoDescription: "License your art, photos, or creative work with a free, no-signup e-signature. Clear usage rights, signed fast.",
    heroHeadline: "License your work without giving away more than you meant to.",
    heroSubheadline: "Art, photo, and creative licensing agreements — signed online, free, no account required.",
    problem: "Someone always wants to use your work — a brand wants an image for a campaign, a publisher wants to run your illustration, a buyer wants print rights. These conversations usually happen fast, over email or DM, and the actual terms of what's being licensed — exclusive or not, one-time or ongoing, print or digital — never get pinned down in writing. Then the image shows up somewhere you didn't agree to, and there's nothing signed to point back to.",
    solution: "Docracy.io lets you send a proper licensing agreement in minutes and get it signed the same day. Start from a free template or upload your own licensing language, and the person on the other end signs without creating an account — so you get a clear, timestamped record of exactly what rights were granted.",
    features: [
      { title: "Free for straightforward licensing deals", body: "Up to 2 signers is free forever — no subscription needed to license a single piece or image." },
      { title: "No account needed for the licensee", body: "They open the emailed link and sign directly — no signup wall to talk them out of it." },
      { title: "Upload the agreement you already use", body: "Have licensing language you trust? Upload it as-is (PDF or Google Doc) and add signature fields — no rebuilding it in a new editor." },
      { title: "AI-assisted field placement", body: "Drop in a longer licensing contract and let Docracy find where signatures and dates belong — on a paid account." },
      { title: "Timestamped audit trail", body: "A permanent record of what usage rights were granted and when — useful if a licensee oversteps the agreement." },
    ],
    useCases: [
      "Photographers licensing images for editorial or commercial use",
      "Illustrators licensing artwork for merchandise or print runs",
      "Artists granting one-time reproduction rights for a magazine feature",
      "Musicians licensing a track for sync in video or advertising",
      "Print and stock sellers formalizing usage terms with buyers",
    ],
    faqs: [
      { question: "Is this legally binding?", answer: "Yes — Docracy's signing flow is designed to support the U.S. ESIGN Act and UETA for everyday licensing agreements. See the Trust & security page for full detail." },
      { question: "Do I need an account to license a single piece?", answer: "No signup is required to send a document with up to 2 signers, which covers most one-off licensing deals." },
      { question: "Can I use my own licensing agreement instead of a template?", answer: "Yes — upload your own PDF (or a Google Doc) and add signature fields, or start from a free template in the Marketplace." },
      { question: "What if the licensee doesn't respect the terms later?", answer: "The timestamped audit trail records exactly what was signed and when, giving you a clear record of the rights actually granted if a dispute comes up." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "IP Licensing Agreement", to: "/free-templates/ip-licensing-agreement" },
      { label: "Model Release Form", to: "/free-templates/model-release-form" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "music-collaboration-contracts",
    seoTitle: "Music Collaboration Agreements — Sign Online Free | Docracy",
    seoDescription: "Sign collaboration, split, and session agreements with co-writers and musicians. Free e-signatures, no account required.",
    heroHeadline: "Get collaboration terms in writing before the track drops.",
    heroSubheadline: "Agreements between co-writers, producers, and session musicians — signed free, no account required.",
    problem: "Splits, songwriting credits, and session terms usually get worked out in the studio, over text, or not at all — because stopping mid-session to sort out paperwork feels like the wrong move when everyone's focused on the track. Then the song does well, or a collaborator drops out, and nobody agreed in writing on who owns what or who gets paid what, which turns a creative win into a mess.",
    solution: "Docracy.io lets you get a collaboration or session agreement signed without slowing anyone down. Send a link, everyone signs from their phone — no accounts, no app downloads — so the terms are settled before the track is even mixed.",
    features: [
      { title: "Free for you and your collaborator", body: "Up to 2 signers is free forever — a flat $10/month covers full bands or bigger sessions." },
      { title: "No account needed for co-writers or session players", body: "They open the emailed link on any device and sign — nothing to install or register." },
      { title: "Upload the agreement you already use", body: "Your own collaboration, split, or session contract works as-is (PDF or Google Doc) — just add signature fields to it." },
      { title: "Ordered signing for full bands", body: "Route an agreement to every band member or collaborator in sequence, so it's not signed out of order or left half-done." },
      { title: "Send signing links over WhatsApp", body: "Useful for touring musicians and session players — get a signature without a back-and-forth email thread." },
    ],
    useCases: [
      "Co-writers formalizing songwriting splits before releasing a track",
      "Producers documenting collaboration terms with an artist",
      "Bands collecting every member's signature on a project agreement",
      "Session musicians signing a one-off agreement before a recording date",
      "Independent artists assigning rights to a collaborator or engineer",
    ],
    faqs: [
      { question: "Do all band members need a Docracy account to sign?", answer: "No — each collaborator opens the signing link and signs on their own device, no account required." },
      { question: "Can I get everyone in the band to sign in order?", answer: "Yes — sequential signing routes the document to each collaborator one at a time, so it's not signed out of order." },
      { question: "Is it free for a two-person collaboration?", answer: "Yes, documents with up to 2 signers are free forever. A full band or larger session costs a flat $10/month, never per seat." },
      { question: "Can I send the agreement over WhatsApp?", answer: "Yes — WhatsApp delivery is available and works well for touring musicians and session players who may not check email." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "Copyright Assignment Agreement", to: "/free-templates/copyright-assignment-agreement" },
      { label: "Mutual NDA", to: "/free-templates/mutual-nda" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "freelancer-contracts",
    seoTitle: "Freelancer Contracts — Sign Online Free | Docracy",
    seoDescription: "Send and sign freelancer contracts online in minutes. Free scope-of-work and service agreement templates, no account required for clients to sign.",
    heroHeadline: "Get contracts signed before the client changes their mind.",
    heroSubheadline: "Free e-signatures for freelancers — scope of work, payment terms, and client agreements, no account needed on either end.",
    problem: "You send a proposal, the client says yes, and then the deal sits in limbo for three days while they figure out how to open a PDF editor or create yet another account just to sign one page. By the time the contract comes back, the kickoff date has slipped, or worse, they've gone quiet entirely.",
    solution: "Docracy.io lets you upload the agreement you already have — or start from a free scope-of-work or service agreement template — drop in signature fields, and send a link. Your client opens it, signs, done. No account, no app download, no \"create a password to continue.\"",
    features: [
      { title: "Free contract templates", body: "Freelance Service Agreement, Scope of Work, and Independent Contractor Agreement templates ready to fill in — no paywall on the basics." },
      { title: "Upload your own contract as-is", body: "Already have a template from a lawyer or a past client? Upload it (PDF or Google Doc) and place fields on it directly — no rebuilding it in someone else's editor." },
      { title: "No account required for clients", body: "They get a link by email, review the terms, and sign. That's the whole flow." },
      { title: "Timestamped audit trail", body: "Every signed contract comes with a record of who signed, when, and from where — useful if a payment dispute ever comes up." },
      { title: "Reusable templates for repeat clients", body: "Save your standard agreement once and send it again for the next gig without rebuilding it — on a paid account." },
    ],
    useCases: [
      "New client agreement before starting a project",
      "Locking in scope and payment terms after a scope-creep conversation",
      "Independent contractor agreement for a longer engagement",
      "Retainer agreement with a recurring client",
      "Quick NDA before a discovery call, contract right after",
    ],
    faqs: [
      { question: "How fast can a client actually sign?", answer: "Usually under a minute — they open the emailed link, review the terms, and sign. No account or software install required." },
      { question: "Can I reuse the same contract for every new client?", answer: "Yes — save your standard agreement as a reusable template (on a paid account) and send it again without rebuilding it each time." },
      { question: "Do I have to use Docracy's templates?", answer: "No — upload the contract you already use as a PDF (or paste a Google Docs link) and place signature fields on it directly." },
      { question: "What proof do I have that the client agreed to the terms?", answer: "Every contract includes a timestamped audit trail showing exactly when it was sent, opened, and signed." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Freelance Service Agreement template", to: "/free-templates/freelance-service-agreement" },
      { label: "Scope of Work template", to: "/free-templates/scope-of-work" },
    ],
  },
  {
    slug: "web-design-contract",
    seoTitle: "Web Design Contracts — Sign Online Free | Docracy",
    seoDescription: "Sign web and graphic design contracts online in minutes. Free web design services agreement template, no subscriptions, no account needed for clients.",
    heroHeadline: "Lock in the design contract before revision round four begins.",
    heroSubheadline: "Free e-signatures for designers — client agreements, revision limits, and payment milestones, no account required to sign.",
    problem: "Design work lives and dies by what's written down: how many revision rounds are included, when the deposit is due, who owns the files when it's over. Without a signed agreement, \"just one more tweak\" turns into a fourth redesign, and getting paid for the difference becomes an awkward conversation instead of a clause you can point to.",
    solution: "Docracy.io gives you a free Web Design Services Agreement template to start from, or you can upload your own. Fill in the scope, deliverables, and payment schedule, place signature fields, and send it — your client signs from the email link with no account, no software to install, no delay before you can start.",
    features: [
      { title: "Free Web Design Services Agreement", body: "Covers scope, revisions, deliverables, and payment terms — ready to customize, no paywall." },
      { title: "Upload your own design contract", body: "If you already have a template you like, upload it as a PDF (or Google Doc) and place signature fields directly on it." },
      { title: "No account required for clients", body: "Clients open the link, review the terms, and sign — nothing to download or register for." },
      { title: "Sequential signing for multi-party projects", body: "Route the contract to the client first, then a project lead or subcontractor, in the order it needs to happen." },
      { title: "Reusable templates for every new client", body: "Save your standard design agreement once and reuse it for each new project — on a paid account." },
    ],
    useCases: [
      "New client agreement before a website design project kicks off",
      "Defining revision limits and scope before mockups start",
      "Payment milestone sign-off (deposit, midpoint, final delivery)",
      "IP and file-ownership handoff once final payment clears",
      "NDA before sharing early concepts or brand strategy",
    ],
    faqs: [
      { question: "Can I limit scope creep with a signed contract?", answer: "Yes — the free Web Design Services Agreement template covers revision limits and deliverables, so both sides have something to point back to." },
      { question: "Does the client need an account to sign?", answer: "No — they open the link and sign, nothing to register for." },
      { question: "Can I route the contract to a subcontractor too?", answer: "Yes — sequential signing lets you route a contract through the client first, then a project lead or subcontractor, in order." },
      { question: "Is it free to use for a single client?", answer: "Yes, documents with up to 2 signers are free forever." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/free-templates/web-design-services-agreement",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Web Design Services Agreement template", to: "/free-templates/web-design-services-agreement" },
      { label: "Mutual NDA template", to: "/free-templates/mutual-nda" },
    ],
  },
  {
    slug: "developer-contracts",
    seoTitle: "Developer Contracts — Sign Online Free | Docracy",
    seoDescription: "Sign software development and contractor agreements online in minutes. Free web development agreement template, no account required for clients to sign.",
    heroHeadline: "Ship the contract as fast as you ship code.",
    heroSubheadline: "Free e-signatures for developers — dev agreements, IP assignment, and contractor terms, no account needed on either end.",
    problem: "You've scoped the API integration, agreed on the rate, and the client is ready to go — but the contract is stuck because they need to \"set up an account\" with whatever e-signature tool you used, or you're manually tracking a PDF through three rounds of email attachments. Meanwhile the IP assignment clause that protects your right to reuse boilerplate code across projects still isn't signed.",
    solution: "Docracy.io skips the account setup entirely. Start from a free Web Development Agreement or Independent Contractor Agreement template, or upload the contract you already use, add signature fields, and send a link. Your client signs from their inbox — no account, no install. It's free for agreements with up to two signers, so most solo dev contracts cost nothing.",
    features: [
      { title: "Free developer contract templates", body: "Web Development Agreement and Independent Contractor Agreement templates covering scope, IP assignment, and payment terms." },
      { title: "Upload your own MSA or SOW", body: "Already have a master service agreement or statement of work you reuse? Upload it as a PDF (or paste a Google Docs link) and place fields on it as-is." },
      { title: "No account required for clients", body: "They open the emailed link, read the terms, and sign — no signup flow to abandon." },
      { title: "Reusable templates for every engagement", body: "Save your standard contract once and send it again for the next client or sprint — on a paid account." },
      { title: "Automate the paperwork with MCP or Zapier", body: "If you're already scripting your workflow, connect Docracy via MCP or Zapier to trigger contract sends from your own tools — on a paid account." },
    ],
    useCases: [
      "New contractor agreement before starting a build",
      "IP assignment sign-off when final payment clears",
      "Statement of work for a scoped feature or sprint",
      "NDA before a technical discovery call or code review",
      "Retainer agreement for ongoing maintenance work",
    ],
    faqs: [
      { question: "Can I get a contract signed before an API integration project starts?", answer: "Yes — start from the free Web Development Agreement or Independent Contractor Agreement template, or upload your own, and send it the same day." },
      { question: "Is it free for a solo developer with one client?", answer: "Yes — documents with up to 2 signers are free forever." },
      { question: "Can I automate sending contracts from my own tools?", answer: "On a paid account, yes — connect Docracy via MCP or Zapier to trigger contract sends from your existing workflow." },
      { question: "Does the client need to create an account to sign?", answer: "No — they open the emailed link and sign, no signup required." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/free-templates/web-development-agreement",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Web Development Agreement template", to: "/free-templates/web-development-agreement" },
      { label: "Independent Contractor Agreement template", to: "/free-templates/independent-contractor-agreement" },
    ],
  },
  {
    slug: "llc-legal-templates",
    seoTitle: "LLC Legal Document Templates & Signing | Docracy",
    seoDescription: "Free LLC operating agreement template and instant online signing. No account needed for signers, no subscription required.",
    heroHeadline: "Get your LLC documents signed — free, fast, no account needed.",
    heroSubheadline: "For new LLC owners, multi-member LLCs, and small business partners who just need paperwork done.",
    problem: "You formed your LLC — now you need an operating agreement, and every member needs to actually sign it. Formation services charge extra for signing tools, and generic e-signature platforms want you to create an account, pick a plan, and learn a new interface just to get two people's signatures on one document. Worth noting: Docracy doesn't file anything with your Secretary of State or replace legal advice — it's not a formation service. What it does is get the documents you already have signed properly, fast.",
    solution: "Docracy.io gives you a free LLC operating agreement template to start from, or lets you upload the one your accountant or formation service already gave you. Add signature fields, send it to your members, and they sign directly from an email link — no account, no download, no confusion. It's free for up to two signers, so most single- or two-member LLCs never pay a cent.",
    features: [
      { title: "Free LLC Operating Agreement template", body: "Start from a ready-made template in the Docracy Marketplace instead of starting from a blank page." },
      { title: "Upload your own operating agreement", body: "Already have a PDF from your lawyer or formation service? Upload it as-is and add signature fields — no rebuilding it in a proprietary editor." },
      { title: "No account required for members", body: "Each LLC member opens the emailed link and signs directly — nothing to install or register." },
      { title: "Sequential signing for multi-member LLCs", body: "Set a signing order so members sign one after another when that matters to you." },
      { title: "Secure, timestamped audit trail", body: "Every signed operating agreement gets a permanent record of who signed and when." },
    ],
    useCases: [
      "Single-member LLCs formalizing an operating agreement",
      "Multi-member LLCs getting every partner's signature on file",
      "Adding a new member and updating the operating agreement",
      "Signing a corporate resolution alongside your operating agreement",
      "Small business partners who formed an LLC without a lawyer",
    ],
    faqs: [
      { question: "Does Docracy file my LLC with the state?", answer: "No — Docracy isn't a formation service and doesn't file with any Secretary of State. It only handles getting your operating agreement and related documents signed." },
      { question: "Is the LLC Operating Agreement template really free?", answer: "Yes — it's available in the Marketplace, and sending it for signature is free for up to 2 signers." },
      { question: "Can multiple LLC members sign in a specific order?", answer: "Yes — sequential signing lets members sign one after another when that matters." },
      { question: "Can I upload the operating agreement my lawyer already drafted?", answer: "Yes — upload it as a PDF (or paste a Google Docs link) and add signature fields, no need to rebuild it in Docracy's editor." },
    ],
    ctaLabel: "Sign your LLC documents free",
    ctaTo: "/free-templates/llc-operating-agreement",
    relatedLinks: [
      { label: "LLC Operating Agreement template", to: "/free-templates/llc-operating-agreement" },
      { label: "Corporate Resolution template", to: "/free-templates/corporate-resolution" },
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "startup-legal-templates",
    seoTitle: "Startup Legal Document Templates & Signing | Docracy",
    seoDescription: "Free legal templates for early-stage startups — founder agreements, contractor agreements, PIIAs — and instant online signing. No account required.",
    heroHeadline: "The paperwork every early-stage startup needs — signed in minutes.",
    heroSubheadline: "For founders juggling incorporation, first hires, and funding basics without a legal team.",
    problem: "In the first few months of a startup, legal paperwork piles up fast — a founder agreement, contractor agreements for your first freelancers, a PIIA to protect your IP, maybe a corporate resolution after incorporating. Most founders don't have a lawyer on retainer yet, and the e-signature tools built for enterprise sales teams are overkill: expensive plans, seat limits, and accounts required for everyone who needs to sign. To be clear, Docracy doesn't incorporate your company or give legal advice — you'll still need a formation service or lawyer for that. What it handles is turning the documents you already have into signed, dated, legally binding agreements.",
    solution: "Docracy.io covers the signing step for every stage of getting a startup off the ground. Pull a founder agreement, contractor agreement, or PIIA from the free template Marketplace, or upload documents your lawyer already drafted. Send them out and your co-founders, contractors, or new hires sign from an email link — no account required on their end. It's free for documents with up to two signers, and $10/month flat (not per seat) once your team and paperwork grow.",
    features: [
      { title: "Free startup document templates", body: "Founder agreements, contractor agreements, and PIIAs are ready to use in the Marketplace — no paywall to get started." },
      { title: "Upload documents from your lawyer or formation service", body: "Keep using whatever counsel drafted — Docracy just handles getting it signed." },
      { title: "No account needed for co-founders, hires, or contractors", body: "Anyone you send a document to can sign immediately from the link — nothing to set up." },
      { title: "Reusable templates for repeat paperwork", body: "Save your standard contractor agreement or PIIA once and reuse it for every new hire, on a paid account." },
      { title: "Flat $10/month, not per signer", body: "As your team grows past two signers, pricing stays flat instead of charging per seat like most e-signature tools." },
    ],
    useCases: [
      "Getting a founder agreement signed before splitting equity",
      "Signing PIIAs with new engineers and remote contractors",
      "Independent contractor agreements for early freelance hires",
      "Corporate resolutions after incorporating",
      "Getting signatures from advisors and early investors on basic paperwork",
    ],
    faqs: [
      { question: "Does Docracy replace a lawyer or incorporation service?", answer: "No — Docracy doesn't incorporate your company or give legal advice. It handles turning documents you already have (or pull from the Marketplace) into signed, dated agreements." },
      { question: "Is it free for a two-person founding team?", answer: "Yes — documents with up to 2 signers are free forever. Once your team grows, it's a flat $10/month, never per seat." },
      { question: "Can contractors and new hires sign without creating an account?", answer: "Yes — anyone you send a document to can sign immediately from the link, no account required." },
      { question: "Can I reuse the same PIIA or contractor agreement for every new hire?", answer: "Yes — save it once as a reusable template on a paid account and send it again for each new person." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Founder Vesting Agreement template", to: "/free-templates/founder-vesting-agreement" },
      { label: "Proprietary Information and Inventions Agreement", to: "/free-templates/proprietary-information-and-inventions-agreement" },
      { label: "Independent Contractor Agreement template", to: "/free-templates/independent-contractor-agreement" },
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "founder-agreement",
    seoTitle: "Founder Agreement Template & Signing | Docracy",
    seoDescription: "Free founder agreement and vesting template. Sign it with your co-founders online in minutes — no account required.",
    heroHeadline: "Get your founder agreement signed before things get messy.",
    heroSubheadline: "Equity, vesting, roles, and decision-making — settled early, in writing, by everyone.",
    problem: "Most co-founder conflicts trace back to the same root cause: nothing was written down at the start. Who owns what percentage, what happens if someone leaves after six months, who has final say on hiring or spending — these conversations feel awkward to have early, so they get skipped, and by the time they matter it's much harder to agree. Even founders who do talk it through often let the actual agreement sit as an unsigned Google Doc for months.",
    solution: "Docracy.io makes it easy to turn that conversation into a signed agreement the same week you have it. Start from the free Founder Vesting Agreement template, fill in your equity split and vesting schedule, and send it to every co-founder. Each person signs from an email link on their own time — no account required, no chasing people to install software. Set a signing order if you want founders to sign one after another, and once everyone's signed, you've got a timestamped record everyone can point back to.",
    features: [
      { title: "Free Founder Vesting Agreement template", body: "Covers equity split, vesting schedule, and cliff terms — ready to fill in and send." },
      { title: "No account needed for co-founders", body: "Every co-founder signs directly from their email, even if they've never used Docracy before." },
      { title: "Sequential signing order", body: "Have founders sign in a defined order when the agreement calls for it, instead of all at once." },
      { title: "Pair it with a PIIA", body: "Send a Proprietary Information and Inventions Agreement alongside your founder agreement to cover IP assignment too." },
      { title: "Secure, timestamped audit trail", body: "Every signature is logged with who signed and when, so there's a clear record if questions come up later." },
    ],
    useCases: [
      "Two or more co-founders formalizing an equity split",
      "Adding vesting schedules before a founder's role changes",
      "Revisiting a founder agreement after adding a new co-founder",
      "Documenting roles and decision-making authority in writing",
      "Getting a founder agreement signed before pitching investors",
    ],
    faqs: [
      { question: "Can co-founders sign in a specific order?", answer: "Yes — sequential signing lets founders sign one after another when the agreement calls for it." },
      { question: "Is it free to get a founder agreement signed?", answer: "Yes — documents with up to 2 signers are free forever, which covers most two-founder agreements." },
      { question: "Do co-founders need a Docracy account to sign?", answer: "No — each founder signs from their email link, even if they've never used Docracy before." },
      { question: "Can I also get a PIIA signed alongside the founder agreement?", answer: "Yes — send a Proprietary Information and Inventions Agreement alongside it to also cover IP assignment." },
    ],
    ctaLabel: "Sign your founder agreement free",
    ctaTo: "/free-templates/founder-vesting-agreement",
    relatedLinks: [
      { label: "Founder Vesting Agreement template", to: "/free-templates/founder-vesting-agreement" },
      { label: "Proprietary Information and Inventions Agreement", to: "/free-templates/proprietary-information-and-inventions-agreement" },
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "seo-agency-contract",
    seoTitle: "SEO Agency Contract Signing Online | Docracy",
    seoDescription: "Send and sign SEO agency contracts and retainer agreements online. Free templates, no account required for clients, no subscriptions.",
    heroHeadline: "Get your SEO contract signed before the client's excitement wears off.",
    heroSubheadline: "Built for SEO agencies and freelance SEOs who need scope, deliverables, and retainer terms locked in fast.",
    problem: "You close a new SEO client on a call, promise to send the paperwork over \"today,\" and then the deal stalls: a bloated proposal tool that makes the client create an account, a Word doc that gets edited into three conflicting versions, or a PDF that sits unsigned in an inbox while scope stays undefined. By the time it's signed, the client has half-forgotten what they agreed to pay for — and any ambiguity around deliverables, reporting cadence, or retainer length becomes your problem the moment work starts.",
    solution: "Docracy.io lets you upload the SEO contract or retainer agreement you already use, drop in signature and date fields, and send a link — your client signs from their inbox with no account, no software, and no delay. Start from a free retainer or consulting agreement template if you don't have your own yet, and keep the same document on file as a timestamped, signed record for every client.",
    features: [
      { title: "Free retainer and consulting templates", body: "Start from a ready-made retainer or consulting agreement instead of writing scope language from scratch." },
      { title: "Upload your own contract as-is", body: "Already have a contract you like? Upload it as a PDF (or paste a Google Docs link) and place fields on it directly — no rebuilding in a proprietary editor." },
      { title: "No account required for clients", body: "Clients open the emailed link and sign immediately — nothing to install, register, or configure." },
      { title: "Reusable templates for recurring onboarding", body: "Save your standard SEO contract once and reuse it for every new client you sign — on a paid account." },
      { title: "Secure, timestamped audit trail", body: "Every signed contract keeps a record of who signed and when, in case scope ever gets disputed." },
    ],
    useCases: [
      "Locking in a new SEO retainer before kickoff work begins",
      "Formalizing scope and pricing for a one-off technical audit",
      "Getting sign-off on a deliverables list before the first monthly report",
      "Onboarding several new clients on the same contract template",
      "Adding a signed scope-change addendum when a project grows mid-retainer",
    ],
    faqs: [
      { question: "Can I use the SEO contract I already have?", answer: "Yes — upload it as a PDF (or paste a Google Docs link) and place signature fields on it directly, no need to rebuild it." },
      { question: "Is it free for onboarding a new client?", answer: "Yes — documents with up to 2 signers are free forever." },
      { question: "Can I reuse the same contract for every new client?", answer: "Yes — save your standard SEO contract once as a reusable template (on a paid account) and reuse it for every client you sign." },
      { question: "Does the client need an account to sign?", answer: "No — they open the emailed link and sign, no software or signup required." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/free-templates/retainer-agreement",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Consulting Agreement template", to: "/free-templates/consulting-agreement" },
      { label: "Service Agreement template", to: "/free-templates/service-agreement" },
    ],
  },
  {
    slug: "marketing-service-agreement",
    seoTitle: "Marketing Service Agreement Signing Online | Docracy",
    seoDescription: "Sign marketing service agreements online in minutes. Free templates for freelancers and agencies, no account required, no subscriptions.",
    heroHeadline: "Sign marketing service agreements without the back-and-forth.",
    heroSubheadline: "For freelance marketers and small agencies running ads, content, social, and email campaigns for clients.",
    problem: "Marketing work moves fast, but paperwork doesn't: a client verbally agrees to a campaign, work starts on a handshake, and the actual signed agreement — the one that spells out deliverables, timelines, and who owns the ad account — never quite gets finalized. Chasing it down later, after the relationship has already gone sideways over an unclear scope or a missed payment, is the worst time to be asking for a signature.",
    solution: "Docracy.io gives you a free service agreement template to send the moment a client says yes, or lets you upload the agreement you already use. Your client signs from a link with no account needed, so there's no excuse for the paperwork to lag behind the work. Save your go-to agreement as a reusable template on a paid account so every new client engagement starts the same clean way.",
    features: [
      { title: "Free service agreement template", body: "Cover scope, deliverables, and payment terms without drafting from a blank page." },
      { title: "Upload your own agreement", body: "Keep using the contract language you've already refined — just upload it as a PDF (or paste a Google Docs link) and place fields." },
      { title: "No account required for clients", body: "Clients sign directly from the emailed link, whether it's their first project with you or their fifth." },
      { title: "Reusable templates for repeat clients", body: "Save your standard agreement and send it again for every new campaign or retainer — on a paid account." },
      { title: "Secure, timestamped audit trail", body: "Every agreement keeps a record of who signed and when, so scope disputes have a paper trail." },
    ],
    useCases: [
      "Kicking off a paid social or search ads campaign with signed scope",
      "Landing a monthly content or email marketing retainer",
      "Documenting deliverables for a website or brand marketing project",
      "Getting a co-marketing or referral partnership agreement signed",
      "Formalizing a short-term marketing consulting engagement",
    ],
    faqs: [
      { question: "How fast can a client sign after they say yes?", answer: "Right away — send the free service agreement template or your own contract, and the client signs from the link with no account needed." },
      { question: "Can I reuse the agreement for every new campaign?", answer: "Yes — save it once as a reusable template on a paid account and send it again for the next engagement." },
      { question: "Is it free for a single-client agreement?", answer: "Yes, documents with up to 2 signers are free forever." },
      { question: "What if scope gets disputed later?", answer: "Every agreement includes a timestamped audit trail of who signed and when, which helps if the agreed scope is ever questioned." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/free-templates/service-agreement",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Consulting Agreement template", to: "/free-templates/consulting-agreement" },
      { label: "Retainer Agreement template", to: "/free-templates/retainer-agreement" },
    ],
  },
  {
    slug: "education-forms",
    seoTitle: "School & University Forms — E-Sign Online | Docracy",
    seoDescription: "Get permission slips, waivers, and enrollment forms signed online. Free for small forms, no account required for parents or students.",
    heroHeadline: "Get school forms signed without the backpack full of paper.",
    heroSubheadline: "A simple way for schools, universities, and learning programs to send forms that actually come back signed.",
    problem: "Permission slips get lost in backpacks, waivers get photocopied and re-photocopied, and enrollment paperwork gets chased over email attachments that half of parents can't open on a phone. Most e-signature tools are built and priced for sales teams closing six-figure deals, not for a school office that needs forty parents to sign the same field-trip waiver by Friday.",
    solution: "Docracy.io isn't built specifically for education — it's a straightforward, general-purpose e-signing tool that happens to work well for exactly this kind of paperwork. Upload the form you already use as a PDF, place signature fields, and send it out. Parents, students, or staff sign from a link with no account to create, and documents with up to two signers are free, which covers most single-signer or parent-plus-witness forms without any cost to the school.",
    features: [
      { title: "Free for simple forms", body: "Documents with up to two signers, like a parent-signed permission slip, are free — no subscription needed." },
      { title: "Upload the form you already use", body: "Keep your existing permission slip, waiver, or enrollment PDF exactly as it is — just add signature fields." },
      { title: "No account needed to sign", body: "Parents and students open the emailed link and sign — nothing to download or register for." },
      { title: "Secure, timestamped audit trail", body: "Every signed form keeps a record of who signed and when, useful for keeping files in order." },
      { title: "Flat pricing if you need more", body: "Larger forms with more signers, saved templates, or multiple staff accounts run a flat $10/month — never per seat." },
    ],
    useCases: [
      "Getting a field trip permission slip signed by parents",
      "Collecting liability waivers before a sports tryout or PE activity",
      "Sending enrollment paperwork to incoming families",
      "Getting a photo or media consent release signed",
      "Circulating a volunteer waiver ahead of a school event",
    ],
    faqs: [
      { question: "Does Docracy have education-specific features?", answer: "No — it's a general-purpose e-signing tool, not a dedicated EdTech product. It has no FERPA-specific certification, LMS integration, or school SSO." },
      { question: "Is it free for a school to send a permission slip?", answer: "Yes — documents with up to 2 signers, like a parent-signed permission slip, are free." },
      { question: "Do parents need to create an account to sign?", answer: "No — they open the emailed link and sign, nothing to install or register for." },
      { question: "What if a school needs to send forms to many parents at once?", answer: "Larger forms with more signers, saved templates, or multiple staff accounts run a flat $10/month, never per seat." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/free-templates/authorization-form",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Liability Waiver template", to: "/free-templates/liability-waiver" },
      { label: "Authorization Form template", to: "/free-templates/authorization-form" },
    ],
  },
  {
    slug: "student-agreements",
    seoTitle: "Student & Enrollment Agreements — E-Sign Online | Docracy",
    seoDescription: "Sign enrollment agreements, code-of-conduct acknowledgments, and tuition agreements online. No account required for students, no per-seat pricing.",
    heroHeadline: "Get enrollment and student agreements signed every term, without the paper chase.",
    heroSubheadline: "For schools and programs that need the same agreements signed by a new group of students, over and over.",
    problem: "Every new term brings the same pile of paperwork: enrollment agreements, code-of-conduct acknowledgments, tuition payment plans. Doing it on paper means printing, collecting, and filing hundreds of nearly identical documents by hand, while most digital e-signature platforms charge per user or per seat — a pricing model that makes no sense when you're signing up dozens or hundreds of students a year, not dozens of sales reps.",
    solution: "Docracy.io is a general e-signing tool, not an education-specific platform, but its pricing and workflow happen to fit this exact use case well. Documents with up to two signers — a student and a school representative, for example — are free. If you're processing higher volumes, a flat $10/month covers more signers, reusable templates, and multiple staff seats, with no per-student fee. Students sign from an emailed link with no account required, and you can save your standard agreement as a template to reuse every enrollment cycle.",
    features: [
      { title: "Free for two-signer agreements", body: "A student-and-institution agreement is free to send and sign, no subscription required." },
      { title: "Reusable templates each term", body: "Save your enrollment agreement or code-of-conduct form once and reuse it for every new student — on a paid account." },
      { title: "Sequential signing order", body: "Route an agreement to the student first, then an advisor or administrator, in a set order." },
      { title: "No account required for students", body: "Students sign directly from the link — no registration, no app to install." },
      { title: "Flat pricing, not per seat", body: "Handling higher volumes costs a flat $10/month for more signers, templates, and staff seats — never priced per student." },
    ],
    useCases: [
      "New students signing an enrollment agreement each semester",
      "Getting a code-of-conduct acknowledgment on file before classes start",
      "Collecting signed tuition payment plan agreements",
      "Housing or dormitory agreement sign-off",
      "An internship or practicum agreement between student, school, and host organization",
    ],
    faqs: [
      { question: "Is Docracy built specifically for schools?", answer: "No — it's a general e-signing tool whose pricing and workflow happen to fit this well, not an education-specific platform." },
      { question: "Is it free for a single student agreement?", answer: "Yes — a student-and-institution agreement with up to 2 signers is free to send and sign." },
      { question: "Can I reuse the same enrollment agreement every term?", answer: "Yes — save it once as a template on a paid account and reuse it for every new student." },
      { question: "Do students need to create an account to sign?", answer: "No — they sign directly from the link, no registration required." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Authorization Form template", to: "/free-templates/authorization-form" },
      { label: "Liability Waiver template", to: "/free-templates/liability-waiver" },
    ],
  },
  {
    slug: "import-google-doc",
    seoTitle: "Import a Google Doc to Sign Online | Docracy",
    seoDescription: "Connect Google Drive and pick a file to sign directly — no downloading and re-uploading. Free to sign, Drive connector on a paid account.",
    heroHeadline: "Sign a document straight from Google Drive — no download, no re-upload.",
    heroSubheadline: "For anyone who drafts contracts and forms in Google Docs and just needs them signed.",
    problem: "The document lives in Google Drive because that's where you write everything, but the moment it needs a signature, the workflow breaks: download it as a PDF, find the file in your downloads folder, upload it to a separate signing tool, and hope you grabbed the latest version and not one from three edits ago. It's a small tax, but it's one you pay on every single contract, proposal, or form you send out.",
    solution: "Docracy.io's Google Drive connector lets you connect your Drive account once and then pick a file directly from Drive when preparing a document to sign — skipping the download-and-re-upload step entirely. If the file is a native Google Doc, it gets pulled in and readied as a signable PDF so you can place signature and date fields on it, the same as any uploaded document. This is a file picker and import, not a live, in-place editor for a shared Google Doc — but it removes the manual export step that slows everyone down. The Drive connector (browsing your Drive without leaving Docracy) is a paid feature; on the free plan, you can paste the share link of any Google Doc set to \"Anyone with the link can view\" directly on the Prepare page, and it's converted automatically at no cost.",
    features: [
      { title: "Pick files directly from Drive", body: "Connect your Google Drive account and choose a file to sign without downloading it first — on a paid account." },
      { title: "Works alongside other cloud connectors", body: "The same connector setup also supports Dropbox, OneDrive, and Box, if your files are spread across more than one place." },
      { title: "Native Google Docs get converted automatically", body: "A file picked from Drive is readied as a signable PDF so fields can be placed on it — no manual export required." },
      { title: "AI-assisted field placement", body: "Once the document is in, signature and date fields can be placed automatically — on a paid account." },
      { title: "No account required for signers", body: "However the document gets in, the person you send it to signs from a link with nothing to install or register." },
    ],
    useCases: [
      "Sending a proposal drafted in Google Docs for signature without exporting it first",
      "Signing a contract that's stored in a shared Drive folder with your team",
      "Getting a quickly drafted agreement signed the same day it's written",
      "Pulling a saved agreement template out of Drive to send to a new client",
      "Cutting the download-then-upload step once your team is sending several documents a week",
    ],
    faqs: [
      { question: "Does this edit my Google Doc live inside Docracy?", answer: "No — it's a file picker/import: you connect Google Drive and pick a file, which is readied as a signable PDF. It's not a live, in-place editor for a shared Google Doc." },
      {
        question: "Is the Google Drive connector free?",
        answer:
          "The Drive picker itself (browsing your connected Drive without leaving Docracy) is a paid feature. But you don't need it just to sign a Google Doc for free — paste its share link on the Prepare page instead, as long as it's shared as \"Anyone with the link can view,\" and it converts automatically at no cost.",
      },
      { question: "Does the signer need a Google account?", answer: "No — however the document gets into Docracy, the person you send it to signs from a link with nothing to install or register." },
      { question: "Can I use Dropbox, OneDrive, or Box instead?", answer: "Yes — the same connector setup also supports Dropbox, OneDrive, and Box." },
    ],
    ctaLabel: "Start free — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Consulting Agreement template", to: "/free-templates/consulting-agreement" },
    ],
  },
  {
    slug: "anonymous-signing",
    seoTitle: "Sign Documents Without an Account | Docracy",
    seoDescription: "Sign a PDF without creating an account or building a profile. No signup, minimal data collected, documents auto-delete after 9 days.",
    heroHeadline: "Sign a document without creating an account.",
    heroSubheadline: "No signup, no profile, no marketing list. Upload a PDF or Google Doc, sign it, and you're done — and the document doesn't sit on a server forever.",
    problem: "Most e-signature tools want an account before you can sign anything: an email, a password, a profile that gets used to market other products to you later. If you just need to sign one document once, that's a lot to hand over for something that should take thirty seconds.",
    solution: "Docracy.io lets you sign a one-off document without creating an account — on either end. You upload a PDF (or paste a Google Docs link), place the signature fields, and send it; the person signing just opens the link and signs, no login required. We collect the minimum needed to make the signature valid, and documents are automatically deleted 9 days after the signing flow completes — they don't linger in storage indefinitely.",
    features: [
      { title: "No account required", body: "Sign or send a one-off document without registering for anything." },
      { title: "Minimal data collected", body: "Just what's needed to send the document and record a valid signature — no profile-building." },
      { title: "Documents auto-delete after 9 days", body: "Once signing completes, files and data are removed from storage on a 9-day retention window." },
      { title: "Simple e-signature, not identity verification", body: "This is basic e-signature: we don't verify who's on the other end of the link. A timestamp and IP are still recorded on the audit trail so the signature holds up if it's ever questioned." },
      { title: "No marketing emails", body: "You won't get added to a mailing list for using Docracy once." },
    ],
    useCases: [
      "Signing a lease or roommate agreement without a Google or Microsoft login",
      "A one-off NDA for a short freelance gig",
      "Countersigning a private sale agreement with a stranger",
      "Signing a permission or consent form you don't want tied to a permanent account",
      "A quick agreement you don't want showing up in some vendor's CRM later",
    ],
    faqs: [
      { question: "Does Docracy verify who actually signed?", answer: "No — this is basic e-signature without identity verification. A timestamp and IP address are still recorded in the audit trail, so the signature holds up if it's ever questioned, but it isn't identity-verified." },
      { question: "How long is my document stored?", answer: "Documents and their data are automatically deleted 9 days after the signing flow completes." },
      { question: "Do I need to create an account to sign a one-off document?", answer: "No — sign or send a one-off document without registering for anything." },
      { question: "Will I be added to a mailing list?", answer: "No — using Docracy once for a document doesn't add you to any marketing list." },
    ],
    ctaLabel: "Sign a document now — no account required",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
      { label: "Read our trust & security page", to: "/trust" },
    ],
  },
  {
    slug: "quick-sign",
    seoTitle: "Quick Sign — Get a Document Signed in Minutes | Docracy",
    seoDescription: "The fastest way to get a document signed online. Upload a PDF, add fields, send — no account, no onboarding, no wasted time.",
    heroHeadline: "Have a document. Get it signed. That's it.",
    heroSubheadline: "No account setup, no product tour, no wizard. Upload your PDF (or paste a Google Docs link), drop in the fields, and send it — most people are done in under a minute.",
    problem: "You don't want a signing platform. You want this one document signed, right now. But most e-signature tools put an account wall, a pricing page, and an onboarding checklist between you and the thing you actually came to do.",
    solution: "Docracy.io cuts straight to the task: upload your PDF as-is (or paste a Google Docs link), place the signature and date fields, and send. There's no account required to send a one-off document, and the person signing just opens their email link and signs — no software, no login, no waiting around.",
    features: [
      { title: "Upload any PDF as-is", body: "No rebuilding your document in someone else's editor. Have a Google Doc instead? Paste the link — it converts automatically." },
      { title: "No account needed", body: "Send a one-off document and skip signup entirely." },
      { title: "AI-assisted field placement", body: "Signature and date fields placed automatically — on a paid account." },
      { title: "Signers open and sign instantly", body: "They click the emailed link and sign — nothing to install or register." },
      { title: "Timestamped audit trail", body: "A record of who signed and when, generated automatically." },
    ],
    useCases: [
      "Signing a quote before a client changes their mind",
      "A delivery or pickup authorization needed right now",
      "Countersigning a deposit receipt on the spot",
      "Getting a permission form back minutes before a deadline",
      "Closing out a same-day vendor agreement",
    ],
    faqs: [
      { question: "How long does it actually take to sign something?", answer: "Most people are done in under a minute — upload a PDF (or paste a Google Docs link), place fields, and send. The recipient just opens the link and signs." },
      { question: "Do I need an account to send a one-off document?", answer: "No — sending a single document doesn't require signing up." },
      { question: "Can the fields be placed automatically?", answer: "Yes — on a paid account, AI-assisted field placement finds where signatures and dates belong." },
      { question: "Is there a record of when it was signed?", answer: "Yes — every signed document includes an automatically generated, timestamped audit trail." },
    ],
    ctaLabel: "Sign your document in under a minute",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "upload-and-sign",
    seoTitle: "Upload a PDF and Get It Signed | Docracy",
    seoDescription: "Free online tool to upload a PDF, add signature fields, and get it signed. No account, no software to install.",
    heroHeadline: "Upload a PDF. Get it signed.",
    heroSubheadline: "A free tool that does exactly what it sounds like — no account, no software, nothing to learn.",
    problem: "You have a PDF that needs a signature and you don't want to install anything, create a login, or figure out a new piece of software just to do it.",
    solution: "Docracy.io is a straightforward tool: upload your PDF, drop in a signature field (and a date field if you need one), and send it. The person signing opens the link in their browser and signs — no app, no account, no download. Have a Google Doc instead of a PDF? Paste its share link and it converts automatically, free.",
    features: [
      { title: "Upload any PDF", body: "Use the document you already have — no conversion or reformatting. Or paste a Google Docs link and it's converted for you." },
      { title: "Drag-and-drop fields", body: "Place signature and date fields directly on the page." },
      { title: "Send a signing link", body: "The recipient signs from any browser, on any device." },
      { title: "Automatic audit trail", body: "Every signed document comes with a timestamped record." },
      { title: "Free to use", body: "No cost for documents with up to 2 signers — no account required to send." },
    ],
    useCases: [
      "Sign a rental application",
      "Get a school permission form signed",
      "Approve a freelance invoice",
      "Countersign a quote or estimate",
      "Have a roommate co-sign a lease",
    ],
    faqs: [
      { question: "Can I upload any PDF?", answer: "Yes — use the document you already have, no conversion or reformatting needed. You can also paste a Google Docs link instead, and it's converted automatically at no cost." },
      { question: "Is it really free?", answer: "Yes — there's no cost for documents with up to 2 signers, and no account required to send." },
      { question: "Does the signer need to install anything?", answer: "No — they sign from any browser, on any device, directly from the link." },
      { question: "Is there proof the document was signed?", answer: "Yes — every signed document comes with a timestamped audit trail." },
    ],
    ctaLabel: "Upload your PDF now",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "simple-signing",
    seoTitle: "Simple E-Signing Tool — No Platform to Learn | Docracy",
    seoDescription: "The simplest way to sign a document online. No dashboard, no setup, no tutorial — just sign and done.",
    heroHeadline: "The simplest way to sign something online.",
    heroSubheadline: "No dashboard, no settings, no tutorial. Open it, sign it, done.",
    problem: "Plenty of e-signing tools call themselves a \"platform\" — with a dashboard, a workflow builder, and a settings menu — when all you actually need is to sign one document.",
    solution: "Docracy.io skips the platform. There's a page to upload your document, a page to sign it, and that's the whole tool. No account required to send a one-off document, nothing to configure, nothing to learn first.",
    features: [
      { title: "One task, done simply", body: "Upload, sign, send — there's nothing else to figure out." },
      { title: "No dashboard", body: "You won't land on a homepage full of menus you don't need." },
      { title: "Works in your browser", body: "No app to install, on desktop or mobile." },
      { title: "Free for simple documents", body: "No cost for documents with up to 2 signers." },
      { title: "Your own PDF, unchanged", body: "Upload the document you already have — no rebuilding it in an editor." },
    ],
    useCases: [
      "Sign a one-page waiver",
      "Sign a simple lease or sublease",
      "Get a permission slip signed",
      "Sign a quick one-off contract",
      "Countersign a quote or agreement",
    ],
    faqs: [
      { question: "Is there a dashboard or settings I need to configure first?", answer: "No — there's a page to upload your document and a page to sign it. That's the whole tool." },
      { question: "Does it work on mobile?", answer: "Yes — it works in any browser, on desktop or mobile, with no app to install." },
      { question: "Is it free for a simple document?", answer: "Yes — no cost for documents with up to 2 signers." },
      { question: "Will uploading my PDF change its formatting?", answer: "No — your document is uploaded and used as-is, with no rebuilding in an editor." },
    ],
    ctaLabel: "Just sign it",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "document-verification",
    seoTitle: "Verify a Signed Document Is Authentic | Docracy",
    seoDescription:
      "Free tool to confirm a PDF was really completed through Docracy's signing flow and hasn't been altered since — no account needed, file never leaves your browser.",
    heroHeadline: "Prove a signed document is the real thing.",
    heroSubheadline:
      "Anyone with a finished PDF — not just the sender or signers — can confirm it was actually completed through Docracy, free, with no account.",
    darkHero: true,
    problem:
      "Once a signed PDF leaves the platform it was created on, there's usually no way for anyone else to check it's genuine. A recipient, auditor, or counterparty just has to trust that no one edited a date, a dollar figure, or a signature afterward.",
    solution:
      "Every document Docracy completes gets a SHA-256 fingerprint of its exact final bytes, kept on record indefinitely. Upload the file (it's fingerprinted in your own browser and never uploaded) or paste the hash from its certificate, and Docracy tells you instantly whether it matches an untouched, genuinely-completed record.",
    features: [
      { title: "Free, for anyone", body: "No account or paid plan required — the sender, a signer, or any third party can check a document." },
      { title: "File never leaves your browser", body: "The PDF is fingerprinted locally with SHA-256; only the resulting hash is sent to Docracy's servers." },
      { title: "Detects any tampering", body: "Changing even one character — a date, a number, a signature — produces a completely different hash, so a match means the file is untouched." },
      { title: "Built into every certificate", body: "Each certificate of completion includes a QR code that links straight to this check for that exact document." },
      { title: "Outlives the source document", body: "Verification records are kept indefinitely, even after the original document itself is deleted at the end of its retention window." },
    ],
    useCases: [
      "A landlord double-checking a lease before relying on it in a dispute",
      "An auditor confirming a vendor contract hasn't been altered since signing",
      "A counterparty verifying a countersigned NDA received by email",
      "Anyone confirming a Docracy certificate of completion is genuine",
    ],
    faqs: [
      {
        question: "Does verification prove who signed the document?",
        answer:
          "No. It confirms the document's exact content was completed through Docracy's signing flow, and when — not the signer's identity. Docracy's default signature is a Simple Electronic Signature (SES), which isn't identity-verified.",
      },
      { question: "Do I need an account to verify a document?", answer: "No. Verification is free and open to anyone with the completed file or its SHA-256 hash — no login required." },
      {
        question: "What does it mean if a document shows no matching record?",
        answer:
          "It means that exact file doesn't match anything completed through Docracy. That doesn't necessarily mean it's fraudulent — it may simply have been created or signed elsewhere, or edited even slightly since it was completed.",
      },
      {
        question: "Is my document uploaded to Docracy's servers when I verify it?",
        answer: "No. The file is fingerprinted (SHA-256) directly in your browser; only that fingerprint, not the document itself, is sent to check against Docracy's records.",
      },
    ],
    ctaLabel: "Verify a document",
    ctaTo: "/verify",
    relatedLinks: [
      { label: "Blockchain timestamp", to: "/blockchain-timestamp" },
      { label: "Trust & security", to: "/trust" },
      { label: "See pricing", to: "/pricing" },
    ],
  },
  {
    slug: "blockchain-timestamp",
    seoTitle: "Free Blockchain Document Timestamping | Docracy",
    seoDescription:
      "Every document signed on Docracy is also anchored to the Bitcoin blockchain via the free, public OpenTimestamps protocol — provable even if Docracy disappears. No wallet, no fees, no extra step.",
    heroHeadline: "Every signed document, timestamped to the Bitcoin blockchain. Free.",
    heroSubheadline:
      "Docracy anchors a fingerprint of every completed document to Bitcoin via the free, public OpenTimestamps protocol — proof that survives even if Docracy itself goes away.",
    problem:
      "A signature platform's own database is the one thing every proof ultimately depends on. If that company disappears, gets hacked, or simply changes its story, there's no way for an outside party to check anything independently.",
    solution:
      "Docracy submits every completed document's SHA-256 hash to the OpenTimestamps calendar network at no cost — free, public servers that batch everyone's hashes together and commit the result to the Bitcoin blockchain. The resulting proof file can be checked by anyone, with any standard OpenTimestamps tool, independent of Docracy staying online or honest.",
    features: [
      { title: "Free, on every document", body: "No paid plan, no wallet, no gas fees — this runs automatically the moment a document is completed." },
      { title: "Independent of Docracy", body: "Checked against the Bitcoin blockchain itself, not our database — it still works even if Docracy disappears." },
      { title: "Open, standard format", body: "A .ots proof file, readable by any OpenTimestamps-compatible tool — not a proprietary format only we can check." },
      { title: "Detects any tampering", body: "The anchored hash is tied to the document's exact bytes — change one character and it no longer matches." },
      { title: "No extra step", body: "Nothing to turn on — it happens automatically in the background the moment a document completes." },
    ],
    useCases: [
      "High-stakes agreements where you want proof that outlives any one company",
      "Cross-border contracts where a counterparty won't just take your word for it",
      "Compliance teams that need evidence outside a single vendor's own systems",
      "Anyone who wants to double-check a completed document years later",
    ],
    faqs: [
      { question: "Does this cost anything?", answer: "No. OpenTimestamps is a free, public protocol — submitting a hash costs nothing, and there's no wallet or cryptocurrency required on your end." },
      {
        question: "How is this different from Docracy's own verification page?",
        answer:
          "Docracy's /verify tool checks a hash against Docracy's own records. This blockchain anchor is a second, independent proof that doesn't rely on Docracy at all — checkable with any standard OpenTimestamps tool even if Docracy is gone.",
      },
      {
        question: "How long until the proof is confirmed?",
        answer:
          "A freshly-submitted proof is \"pending\" until the calendar network's next batch commits to Bitcoin, which typically takes a few hours. It's still a valid receipt in the meantime — just not yet independently confirmable on-chain.",
      },
      { question: "Do I have to do anything to get this?", answer: "No — it happens automatically for every document completed on Docracy, free or paid." },
    ],
    ctaLabel: "Verify a document",
    ctaTo: "/verify",
    relatedLinks: [
      { label: "Document verification", to: "/document-verification" },
      { label: "Trust & security", to: "/trust" },
    ],
  },
  {
    slug: "whatsapp-invoice",
    seoTitle: "Send an Invoice on WhatsApp — PayPal & Mercado Pago | Docracy",
    seoDescription:
      "WhatsApp invoice with your own PayPal, Stripe, or Mercado Pago link. No signature required. Docracy never takes the money. Paid $10/mo.",
    heroHeadline: "Send the invoice on WhatsApp. Get paid on your checkout.",
    heroSubheadline:
      "Attach the PDF, paste PayPal.me or Mercado Pago, and text the pay page. No extra signature. Not a payment processor.",
    problem:
      "Email invoices sit unopened. For LATAM clients and many US contractors, WhatsApp is the inbox that actually gets read — but most e-sign tools still refuse to send anything but a signature request.",
    solution:
      "Docracy cobro is pay + file: the recipient opens a page with your PDF and your https checkout. Optional 30-day ping. Signing stays a separate, free product.",
    features: [
      { title: "No signature required", body: "The file is available immediately. If you need a signature, send a normal document instead." },
      { title: "Your checkout", body: "PayPal.me, Stripe Payment Link, Mercado Pago — Docracy never collects the funds." },
      { title: "WhatsApp + email", body: "Uses the live signing_invite template. Counts against monthly WhatsApp quota." },
      { title: "30-day reminder", body: "Automatic ping until the archive date, plus send-again from your account." },
    ],
    useCases: [
      "Freelancers collecting on closed work in Mexico, Colombia, or Argentina",
      "US studios paying LATAM contractors over Mercado Pago",
      "Follow-up invoices after the contract is already signed",
    ],
    faqs: [
      {
        question: "Is this Stripe Connect or a Docracy fee on the payment?",
        answer: "No. You paste a checkout URL you already own. Paid is $10/month for the product, not a cut of the invoice.",
      },
      {
        question: "Do they have to sign the invoice?",
        answer: "No. Open /cobro (Spanish: /es/cobro). For a signature + pay button, use Prepare on a paid account instead.",
      },
      {
        question: "Can I send a WhatsApp invoice to Mexico or Colombia?",
        answer:
          "Yes. Paste a Mercado Pago, PayPal.me, or Stripe Payment Link. Amount labels include MXN, COP, ARS, CLP, PEN, BRL, and USD.",
      },
      {
        question: "Is this the same as WhatsApp signing?",
        answer:
          "No. WhatsApp signing (/whatsapp-signing) is a PIN-protected signature invite. Cobro is pay + file with no signer chain.",
      },
      {
        question: "Will Docracy remind them if they don't pay?",
        answer: "Yes — about every 30 days until the archive date, plus a manual send-again. Each WhatsApp ping uses quota.",
      },
    ],
    ctaLabel: "Send a WhatsApp cobro",
    ctaTo: "/cobro",
    relatedLinks: [
      { label: "WhatsApp signing (with PIN)", to: "/whatsapp-signing" },
      { label: "1099 season locker", to: "/1099-season" },
      { label: "LATAM contractor kit", to: "/packets/latam-contractor" },
      { label: "Income proof packet", to: "/income-proof" },
    ],
  },
  {
    slug: "1099-contractor-records",
    seoTitle: "1099 Contractor Records — W-9 Archive & CPA Spreadsheet | Docracy",
    seoDescription:
      "Keep signed W-9s and contractor agreements until 1099 season. Download a CPA CSV of completed files. Not IRS e-file. Paid $10/month.",
    heroHeadline: "Contractor records that still exist in January.",
    heroSubheadline:
      "Every completed Docracy file from the calendar year, plus a spreadsheet for your CPA. We do not file 1099-NEC or read TINs off the PDF.",
    problem:
      "Free e-sign tools delete the W-9 after a week. Come 1099 time you have a name in the bank feed and no file.",
    solution:
      "Paid keeps PDFs until the next April 15 or 13 months. The 1099 season locker lists that year and exports CSV: titles, counterparties, amounts you typed, signed-page URLs.",
    features: [
      { title: "Calendar-year list", body: "All completed docs, not only ones titled W-9." },
      { title: "CPA CSV", body: "Honest columns — no fake TIN extraction." },
      { title: "Tax-year vault", body: "Same Paid archive that already keeps the PDFs." },
      { title: "Includes cobro", body: "Pay-only WhatsApp sends count in the same year." },
    ],
    useCases: [
      "US companies collecting W-9s from 1099 contractors",
      "Studios that pay both US and LATAM contractors",
      "Anyone whose CPA asked for a list, not a ZIP of Gmail PDFs",
    ],
    faqs: [
      {
        question: "Will Docracy e-file my 1099s?",
        answer: "No. This is an archive and a CSV. You or your CPA still file with the IRS.",
      },
      {
        question: "Where is the locker?",
        answer: "https://docracy.io/1099-season — Spanish: /es/temporada-1099. Paid accounts see the download; everyone else sees this explainer.",
      },
      {
        question: "Do you extract Social Security numbers from the W-9?",
        answer: "No. We never OCR taxpayer IDs. Keep the signed W-9 PDF in the vault and hand that file to your CPA.",
      },
      {
        question: "Does this include invoices I sent on WhatsApp without a signature?",
        answer: "Yes. Completed cobro (pay + file) counts in the same calendar year as signed contracts.",
      },
      {
        question: "Is the 1099 locker free?",
        answer: "No. Free signing deletes PDFs after 9 days. Paid ($10/month) keeps files through tax season and unlocks the CSV.",
      },
    ],
    ctaLabel: "Open the 1099 season locker",
    ctaTo: "/1099-season",
    relatedLinks: [
      { label: "US contractor kit (W-9)", to: "/packets/us-contractor" },
      { label: "Free W-9 template", to: "/free-templates/w-9-form" },
      { label: "Income proof packet", to: "/income-proof" },
    ],
  },
  {
    slug: "hire-contractor-abroad",
    seoTitle: "Hire a Contractor Abroad — NDA, Agreement & WhatsApp Pay | Docracy",
    seoDescription:
      "Paper a LATAM or overseas contractor: free NDA and independent contractor agreement, then get paid on WhatsApp. Not a W-8BEN. EN + Spanish.",
    heroHeadline: "Hire abroad without inventing a W-8BEN.",
    heroSubheadline:
      "Mutual NDA and contractor agreement are free templates. Then Paid cobro sends your Mercado Pago or PayPal link on WhatsApp. US persons still need the IRS W-9 kit.",
    problem:
      "US kits assume a W-9. Overseas contractors are not US persons. Fake W-8BEN PDFs are how companies get in trouble.",
    solution:
      "Docracy's LATAM corridor is honest: NDA, contractor agreement, then cobro. No invented IRS form. Spanish URLs included.",
    features: [
      { title: "Free NDA + agreement", body: "Existing marketplace templates, one PDF at a time." },
      { title: "WhatsApp cobro", body: "Paid: file + your checkout, no extra signature." },
      { title: "Spanish surface", body: "/es/kit-contratista-latam and /es/cobro." },
      { title: "US kit still exists", body: "W-9 path stays at /packets/us-contractor." },
    ],
    useCases: [
      "US startups hiring engineers in Mexico or Colombia",
      "Agencies paying LATAM designers over Mercado Pago",
      "Anyone who was about to Google a free W-8BEN and sign it blindly",
    ],
    faqs: [
      {
        question: "Is this tax or immigration advice?",
        answer: "No. It is a document wizard. Ask a CPA about withholding and a W-8BEN.",
      },
      {
        question: "Where do I start?",
        answer: "https://docracy.io/packets/latam-contractor — Spanish: /es/kit-contratista-latam.",
      },
      {
        question: "Do you have a W-8BEN template?",
        answer:
          "No. We do not invent IRS forms. This kit is NDA + contractor agreement + your checkout. US persons use the W-9 kit instead.",
      },
      {
        question: "Can I hire a contractor in Mexico or Colombia?",
        answer:
          "Yes — send the NDA and agreement in English or Spanish, then cobro with Mercado Pago or PayPal. Not employment or visa advice.",
      },
      {
        question: "Is the whole kit free?",
        answer: "NDA and agreement signing are free. WhatsApp cobro / payment links are Paid ($10/month).",
      },
    ],
    ctaLabel: "Open the LATAM contractor kit",
    ctaTo: "/packets/latam-contractor",
    relatedLinks: [
      { label: "US contractor kit (W-9)", to: "/packets/us-contractor" },
      { label: "WhatsApp cobro", to: "/cobro" },
      { label: "1099 season locker", to: "/1099-season" },
      { label: "Income proof packet", to: "/income-proof" },
    ],
  },
  {
    slug: "proof-of-income",
    xDefault: "es",
    seoTitle: "Proof of Income Without Pay Stubs — Freelancer Packet | Docracy",
    seoDescription:
      "Need proof of income without pay stubs? Share a dated packet of signed contracts and cobros. Not a W-2, bank letter, or certified income letter. Paid $10/month.",
    heroHeadline: "Proof of income when you don't have pay stubs.",
    heroSubheadline:
      "Landlords, banks, and CPAs ask for a letter. PayPal and Mercado Pago don't print one. Docracy packs the year you already signed and collected into a shareable URL.",
    problem:
      "If you earn through PayPal, Mercado Pago, or cobro, you don't get a W-2 or a stub. Screenshots of the app don't survive a rental application. A Word 'carta de ingresos' you wrote yourself looks like you wrote it yourself.",
    solution:
      "The constancia packet is not a new document type. It is the completed files already in your Paid vault — titles, dates, names you typed, amounts you typed — on one noindex URL. Spanish is the lead language: /es/constancia. English: /income-proof.",
    features: [
      {
        title: "A URL a stranger can open",
        body: "Year, your display name, each completed file, amounts you entered. Not a ZIP of PDFs in a chat.",
      },
      {
        title: "Names, not emails",
        body: "The public page shows counterparties by name only. Your login email never appears.",
      },
      {
        title: "Honest about what it is not",
        body: "Not a W-2, not a bank letter, not an employer certificate, not SAT or IRS e-file.",
      },
      {
        title: "Built from cobro + signed contracts",
        body: "WhatsApp cobros and signed agreements from the same calendar year sit in one list.",
      },
    ],
    useCases: [
      "Freelancers in Mexico or Colombia renting an apartment",
      "LATAM immigrants applying for a US lease without a W-2",
      "Contractors who need a CPA packet without a W-2",
      "Anyone paid on PayPal or Mercado Pago who is asked for 'prueba de ingresos'",
    ],
    faqs: [
      {
        question: "Is this a certified proof-of-income letter?",
        answer:
          "No. It is a dated index of documents you already completed on Docracy. A landlord or bank may still ask for a bank statement. We do not stamp, notarize, or verify identity.",
      },
      {
        question: "Do you read my PayPal or Mercado Pago account?",
        answer:
          "No. Totals are the amounts you typed when you sent cobro or attached a payment link. We do not connect to a bank.",
      },
      {
        question: "Where do I open the packet?",
        answer:
          "https://docracy.io/es/constancia — English: /income-proof. Keyword page you are on: /proof-of-income (Spanish: /es/prueba-de-ingresos).",
      },
      {
        question: "Will Google index the shared link?",
        answer: "No. Packet URLs are noindex. The marketing pages are indexable so people can find the product.",
      },
      {
        question: "Is this free?",
        answer:
          "Signing stays free. The packet needs the Paid vault so files still exist when someone asks. $10/month.",
      },
    ],
    ctaLabel: "Open the income proof packet",
    ctaTo: "/income-proof",
    relatedLinks: [
      { label: "Constancia / income proof tool", to: "/income-proof" },
      { label: "WhatsApp cobro", to: "/cobro" },
      { label: "1099 season locker", to: "/1099-season" },
      { label: "LATAM contractor kit", to: "/packets/latam-contractor" },
      { label: "Constancia for a US rental", to: "/proof-of-income-us-rental" },
      { label: "Immigrant kit", to: "/packets/latam-to-us" },
    ],
  },
  {
    slug: "signed-work-order",
    seoTitle: "Signed Work Order & Change Order Online | Docracy",
    seoDescription:
      "Get a work order and change order signed free, then collect a deposit on your PayPal or Square link. For electricians, HVAC, and trades. Not Jobber. Not a lien waiver.",
    heroHeadline: "Get the work order signed before you buy the materials.",
    heroSubheadline:
      "Free sequential e-sign for the estimate and the change order. Paid cobro sends your own checkout on WhatsApp. We do not run your calendar and we do not invent a mechanic's lien form.",
    problem:
      "The customer said yes on the phone. Jobber wants a subscription to send the estimate. Excel does not get a signature. You buy materials, then they ghost.",
    solution:
      "Docracy's trades packet is three real sends: work order, change order, then cobro with the Square/PayPal/Venmo URL you already have. Signing is free for two people. Cobro is the $10/month plan — not a cut of the job.",
    features: [
      { title: "Work order first", body: "Scope, estimated cost, dates — signed before you start." },
      { title: "Change order when it moves", body: "A second PDF so extras are not a handshake." },
      { title: "Your checkout", body: "Cobro pastes PayPal, Square, or Venmo. Docracy never takes the deposit." },
      { title: "Honest about liens", body: "No fake state-specific waiver. Ask a construction lawyer for that." },
    ],
    useCases: [
      "Electricians collecting a deposit after the estimate is accepted",
      "HVAC change orders mid-job",
      "Landscapers who invoice on WhatsApp",
    ],
    faqs: [
      {
        question: "Is this a replacement for Jobber?",
        answer: "No. Keep Jobber for scheduling. Docracy signs the PDF and sends your payment link.",
      },
      {
        question: "Where is the kit?",
        answer: "https://docracy.io/packets/trades — Spanish: /es/kit-oficios. Keyword page you are on: /signed-work-order.",
      },
      {
        question: "Do you file a mechanic's lien?",
        answer: "No. We do not ship a valid state waiver or file liens.",
      },
      {
        question: "Can I send the invoice on WhatsApp without another signature?",
        answer: "Yes on Paid. That is cobro — the last step of this packet.",
      },
    ],
    ctaLabel: "Open the trades job packet",
    ctaTo: "/packets/trades",
    relatedLinks: [
      { label: "Trades kit", to: "/packets/trades" },
      { label: "WhatsApp cobro", to: "/cobro" },
      { label: "Request a W-9", to: "/packets/collect" },
    ],
  },
  {
    slug: "contractor-payment-proof",
    seoTitle: "Prove You Paid Contractors — CPA Packet | Docracy",
    seoDescription:
      "Share a year of signed W-9s, contracts, and cobros with your CPA. HMAC URL, names not emails. Not IRS e-file. No TIN OCR. Paid $10/month.",
    heroHeadline: "Prove you paid them — without emailing a ZIP of PDFs.",
    heroSubheadline:
      "The 1099 locker already lists the year. Copy a link your CPA can open. Titles, names, amounts you typed. We do not file 1099-NEC and we never read Social Security numbers off the page.",
    problem:
      "January arrives. The CPA wants a list. Gmail search for W-9 returns nothing because free e-sign deleted the file in nine days.",
    solution:
      "Paid keeps the PDFs. The locker exports CSV and now mints a shareable HMAC page — the inverse of a freelancer constancia. Public page is noindex. Your login email never appears.",
    features: [
      { title: "CPA URL", body: "Same year list as the locker, stripped of emails and payment URLs." },
      { title: "CSV still there", body: "Download for the spreadsheet people." },
      { title: "Includes cobro", body: "WhatsApp pay-only sends count in the same calendar year." },
      { title: "No TIN OCR", body: "Hand the signed W-9 PDF to the CPA. We do not extract SSNs." },
    ],
    useCases: [
      "US studios paying 1099 contractors",
      "Agencies that also cobro LATAM designers",
      "Anyone whose CPA asked for proof of payment, not a filed 1099",
    ],
    faqs: [
      {
        question: "Will Docracy e-file my 1099s?",
        answer: "No. Archive + CSV + a shareable index. You or your CPA still file.",
      },
      {
        question: "Where do I copy the link?",
        answer: "https://docracy.io/1099-season — Spanish: /es/temporada-1099. Paid accounts see Copy CPA link.",
      },
      {
        question: "Is this the same as the freelancer constancia?",
        answer: "Opposite direction. Constancia is 'I earned this.' This page is 'I paid them.'",
      },
      {
        question: "Do you extract taxpayer IDs?",
        answer: "No.",
      },
    ],
    ctaLabel: "Open the 1099 locker",
    ctaTo: "/1099-season",
    relatedLinks: [
      { label: "1099 season locker", to: "/1099-season" },
      { label: "Request a W-9", to: "/packets/collect" },
      { label: "Income proof (they earned)", to: "/income-proof" },
    ],
  },
  {
    slug: "latam-export-documents",
    xDefault: "es",
    seoTitle: "LatAm Export Documents to Sign — Not Customs Software | Docracy",
    seoDescription:
      "Sign a sales agreement and purchase order for intra-LatAm trade, then cobro. Not a packing list filer, not a certificate of origin, not aduana. Spanish lead.",
    heroHeadline: "The commercial packet. Not the pedimento.",
    heroSubheadline:
      "Nearshoring still needs a signed sale and a purchase order. Docracy signs those PDFs. We do not auto-fill customs forms, quote freight, or invent a certificado de origen.",
    problem:
      "Intra-LatAm trade is a stack of PDFs plus a broker. SaaS that promises to 'digitize aduana' is a different company — and a liability if the form is wrong.",
    solution:
      "The kit is honest: sales agreement, purchase order, then Paid cobro with Mercado Pago. Spanish URL /es/kit-comercio is x-default. Hire a customs broker for the filing.",
    features: [
      { title: "Two templates you actually sign", body: "Existing sales agreement and purchase order." },
      { title: "Then cobro", body: "Your checkout. Not a payment processor." },
      { title: "Spanish lead", body: "/es/kit-comercio and /es/documentos-exportacion." },
      { title: "What we will not ship", body: "No packing-list generator, no origin certificate, no freight API." },
    ],
    useCases: [
      "A Mexican seller shipping to Colombia with a broker on the side",
      "US buyers who need the commercial docs signed before the container moves",
      "Anyone who Googled certificado de origen and almost downloaded a fake PDF",
    ],
    faqs: [
      {
        question: "Is this customs middleware?",
        answer: "No. We do not file with aduana or compare freight rates.",
      },
      {
        question: "Where is the kit?",
        answer: "https://docracy.io/es/kit-comercio — English: /packets/latam-trade. This keyword page: /es/documentos-exportacion.",
      },
      {
        question: "Do you have a certificate of origin?",
        answer: "No. Preferential origin documents are official. We do not invent one.",
      },
      {
        question: "Can I get paid after they sign?",
        answer: "Yes on Paid cobro with Mercado Pago or PayPal.",
      },
    ],
    ctaLabel: "Open the commercial kit",
    ctaTo: "/packets/latam-trade",
    relatedLinks: [
      { label: "LATAM commercial kit", to: "/packets/latam-trade" },
      { label: "LATAM contractor kit", to: "/packets/latam-contractor" },
      { label: "WhatsApp cobro", to: "/cobro" },
    ],
  },
  {
    slug: "request-w9",
    seoTitle: "Send Me Your W-9 or NDA | Docracy",
    seoDescription:
      "Collect a W-9 or mutual NDA by sending the template. For RFC / Constancia de Situación Fiscal they upload their PDF. No SAT form. No TIN OCR. Free to sign.",
    heroHeadline: "Send me your W-9. Or your NDA. Or the RFC PDF you already have.",
    heroSubheadline:
      "You stay the sender so the completed file lands in your vault. IRS W-9 and mutual NDA are free templates. We do not publish an RFC or W-8BEN.",
    problem:
      "Agencies DM 'send me your W-9' and get a photo in WhatsApp. Free e-sign deletes it before tax season. Fake RFC generators are how people get in trouble with SAT.",
    solution:
      "The collect kit is three sends: W-9, NDA, then their existing RFC/CSF PDF. Paid keeps the files and unlocks the 1099 locker share for your CPA.",
    features: [
      { title: "You send, they sign", body: "Not an anonymous drop-box. The file is yours to archive." },
      { title: "Real IRS W-9", body: "Existing template. We never OCR the TIN." },
      { title: "RFC is their PDF", body: "Upload what SAT already issued. We do not invent the form." },
      { title: "Then the locker", body: "Share the year with a CPA from /1099-season." },
    ],
    useCases: [
      "US companies onboarding 1099 contractors",
      "Agencies collecting NDAs before a pitch",
      "Paying someone in Mexico who has a Constancia de Situación Fiscal, not a W-9",
    ],
    faqs: [
      {
        question: "Is this a magic link they fill without me creating a send?",
        answer: "No. You send each document. That is how it appears in your Paid vault.",
      },
      {
        question: "Where do I start?",
        answer: "https://docracy.io/packets/collect — Spanish: /es/pide-documentos.",
      },
      {
        question: "Do you have a W-8BEN or RFC form?",
        answer: "No. We do not invent IRS or SAT forms.",
      },
      {
        question: "Will you read Social Security numbers?",
        answer: "No TIN OCR.",
      },
    ],
    ctaLabel: "Open the request kit",
    ctaTo: "/packets/collect",
    relatedLinks: [
      { label: "Collect kit", to: "/packets/collect" },
      { label: "US contractor kit", to: "/packets/us-contractor" },
      { label: "CPA payment proof", to: "/contractor-payment-proof" },
    ],
  },
  {
    slug: "immigrant-documents",
    xDefault: "es",
    seoTitle: "Immigrant Documents — I-9, Visa Packet & Constancia | Docracy",
    seoDescription:
      "LATAM immigrant paperwork: official USCIS I-9, visa supporting docs, offer letter, constancia for a landlord. We don't file petitions or run E-Verify. Spanish first.",
    heroHeadline: "Immigrant paperwork. Sign the I-9. Sign the visa packet.",
    heroSubheadline:
      "The official I-9 is in the catalog. Visa supporting docs we already ship. Constancia a US landlord can open. We don't file with USCIS — we sign the files they asked you for.",
    problem:
      "You landed. The employer sends an offer and an I-9. A visa lawyer wants supporting PDFs. The landlord wants proof of income. Visa consultants don't sign those contracts.",
    solution:
      "Docracy is the immigrant docs product: free SES signing of the official I-9 and the supporting templates we already have, Paid cobro + constancia. Honest limit: no E-Verify, no document inspection, no I-129 / DS-160 we invent.",
    features: [
      { title: "Official I-9", body: "USCIS Form I-9. Employee + employer signature. Not E-Verify." },
      { title: "Visa supporting packet", body: "Offer, employment, POA, reference, child travel. Not the petition." },
      { title: "Constancia a stranger can open", body: "Dated index of contracts and cobros. Not a W-2." },
      { title: "W-9 kit if you are a US person", body: "We do not ship a fake W-8BEN." },
    ],
    useCases: [
      "Someone who just moved from Mexico or Colombia to Houston or Miami",
      "New hires who need I-9 signed the first week",
      "People gathering supporting docs a visa or consulate asked for",
      "Freelancers applying for a US apartment without pay stubs",
    ],
    faqs: [
      {
        question: "Can you do I-9?",
        answer:
          "Yes. We sign the official USCIS Form I-9. We do not inspect List A/B/C documents and we do not run E-Verify. Anyone with the link can sign as the name on it. See /trust.",
      },
      {
        question: "Do you file visas?",
        answer:
          "No. We sign the supporting packet. Start at /visa-supporting-documents (Spanish: /es/documentos-para-visa).",
      },
      {
        question: "Where do I start in Spanish?",
        answer: "https://docracy.io/es/documentos-para-inmigrantes — kit: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Open the immigrant kit",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Immigrant kit", to: "/packets/latam-to-us" },
      { label: "Sign I-9", to: "/i-9" },
      { label: "Visa supporting docs", to: "/visa-supporting-documents" },
      { label: "Constancia for a US rental", to: "/proof-of-income-us-rental" },
      { label: "I-9 template", to: "/free-templates/i-9-form" },
    ],
  },
  {
    slug: "move-to-us",
    xDefault: "es",
    seoTitle: "I Moved to the US — Sign I-9 & Prove Income | Docracy",
    seoDescription:
      "Just arrived from LATAM? Sign the official I-9, the offer, visa supporting docs, and a constancia for a US landlord. We don't file the petition. Spanish first.",
    heroHeadline: "You just got here. They want an I-9, a signature, and proof of income.",
    heroSubheadline:
      "The first week is PDFs: I-9, offer letter, visa supporting docs, lease application. One product. Spanish first.",
    problem:
      "Search results are visa agencies and SAT constancia generators. Neither signs a US I-9 or builds a packet a Miami landlord will open.",
    solution:
      "Start the immigrant kit: official I-9, offer, visa supporting templates we already ship, cobro if you still invoice, constancia for the rental, W-9 only if you are a US person.",
    features: [
      { title: "Official I-9", body: "Free. Employee + employer. Not E-Verify." },
      { title: "Offer letter template", body: "They can also just send you a link to sign." },
      { title: "Visa supporting docs", body: "POA, reference, child travel — not I-129 or DS-160." },
      { title: "Constancia for the lease", body: "Not a SAT constancia de situación fiscal." },
    ],
    useCases: [
      "First 90 days after landing",
      "New job that sent an I-9 the first week",
      "Roommate or lease application without a W-2",
    ],
    faqs: [
      {
        question: "Do you process a visa?",
        answer:
          "No. We sign the supporting packet. Open /visa-supporting-documents. Hire a lawyer if you need the petition filed.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/llegar-a-estados-unidos — kit: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Open the arrive-in-the-US kit",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Immigrant documents", to: "/immigrant-documents" },
      { label: "Sign I-9", to: "/i-9" },
      { label: "Visa supporting docs", to: "/visa-supporting-documents" },
      { label: "Constancia to rent", to: "/proof-of-income-us-rental" },
    ],
  },
  {
    slug: "proof-of-income-us-rental",
    xDefault: "es",
    seoTitle: "Proof of Income for a US Apartment — No Pay Stub | Docracy",
    seoDescription:
      "Constancia for a US rental application: signed contracts and cobros on one URL. For LATAM immigrants without a W-2. Not a bank letter. Spanish first.",
    heroHeadline: "Proof of income for a US apartment when you don't have a stub.",
    heroSubheadline:
      "Landlords in Houston, Miami, NYC ask for a letter. Immigrants paid on Mercado Pago or PayPal don't get one. Pack the year into a URL.",
    problem:
      "The application portal wants a W-2 or pay stubs. You have WhatsApp invoices and a signed contractor agreement. A Word 'carta de ingresos' looks homemade because it is.",
    solution:
      "The constancia is the files already in your Paid vault — titles, dates, names, amounts you typed. Spanish tool: /es/constancia. This page is the rental keyword. Not a SAT CSF.",
    features: [
      { title: "One link for the landlord", body: "They don't need a Docracy account." },
      { title: "Currencies labeled", body: "MXN, USD, COP — whatever you typed on cobro." },
      { title: "Honest cover", body: "Not a W-2. Say that in the application notes." },
      { title: "Same product as /es/constancia", body: "This page exists so search can find the rental use." },
    ],
    useCases: [
      "LATAM immigrants applying for a US lease",
      "Freelancers without pay stubs in any US city",
      "Someone who still invoices clients back home",
    ],
    faqs: [
      {
        question: "Will every landlord accept this?",
        answer: "No. Some want a bank statement. Send both. We do not notarize.",
      },
      {
        question: "Is this the SAT constancia?",
        answer: "No. That collision is why we write it on the page. Ours is an index of Docracy files.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/constancia-para-rentar — tool: /es/constancia.",
      },
    ],
    ctaLabel: "Open the constancia",
    ctaTo: "/income-proof",
    relatedLinks: [
      { label: "Constancia tool", to: "/income-proof" },
      { label: "Immigrant kit", to: "/packets/latam-to-us" },
      { label: "Immigrant documents", to: "/immigrant-documents" },
      { label: "Proof of income (generic)", to: "/proof-of-income" },
    ],
  },
  {
    slug: "i-9",
    xDefault: "es",
    seoTitle: "Sign Form I-9 Online — Official USCIS PDF | Docracy",
    seoDescription:
      "Sign the official USCIS Form I-9 (Edition 01/20/25). Employee + employer fields. Free for 2 signers. Not E-Verify. We don't inspect List A/B/C documents.",
    heroHeadline: "Sign the I-9. We don't inspect the documents.",
    heroSubheadline:
      "The official USCIS Form I-9 is already in the catalog. Employee signs Section 1. Employer signs Section 2. Free for two parties. Spanish: /es/formulario-i-9.",
    problem:
      "A new hire's first day needs an I-9. Most e-sign tools hide the form or pretend signing equals work authorization. It doesn't.",
    solution:
      "Start from the official USCIS PDF. Place the two signatures we already mapped. Honest limit: we do not examine List A/B/C documents, we do not run E-Verify, and SES means anyone with the link can sign as the name on it. See /trust.",
    features: [
      { title: "Official USCIS form", body: "Edition 01/20/25. Not a Docracy-drafted substitute." },
      { title: "Two signers, free", body: "Employee and employer or authorized representative." },
      { title: "No account for the hire", body: "They open the link and sign." },
      { title: "Honest I-9 limit", body: "Document inspection and E-Verify stay with the employer." },
    ],
    useCases: [
      "US employers onboarding someone who just arrived from LATAM",
      "Staffing / recruiting sending I-9 the same day as the offer",
      "Immigrants who were emailed an I-9 to sign",
    ],
    faqs: [
      {
        question: "Does signing I-9 on Docracy authorize someone to work?",
        answer:
          "No. The form records attestations. The employer still reviews identity and work-authorization documents. We do not run E-Verify.",
      },
      {
        question: "Is this the real USCIS form?",
        answer: "Yes. Open /free-templates/i-9-form (Spanish: /es/plantillas-gratis/i-9-form).",
      },
      {
        question: "Do you verify identity?",
        answer: "No. SES: anyone with the signing link can sign as the name on it. Details on /trust.",
      },
    ],
    ctaLabel: "Open the I-9 template",
    ctaTo: "/free-templates/i-9-form",
    relatedLinks: [
      { label: "I-9 template", to: "/free-templates/i-9-form" },
      { label: "Immigrant kit", to: "/packets/latam-to-us" },
      { label: "Visa supporting docs", to: "/visa-supporting-documents" },
      { label: "Offer letter", to: "/free-templates/offer-letter" },
    ],
  },
  {
    slug: "visa-supporting-documents",
    xDefault: "es",
    seoTitle: "Visa Supporting Documents to Sign | Docracy",
    seoDescription:
      "Sign the packet a visa or consulate asks for: offer letter, employment agreement, I-9, power of attorney, reference letter, child travel consent. We don't file I-129 or DS-160.",
    heroHeadline: "We don't file the visa. We sign the supporting packet.",
    heroSubheadline:
      "Offer letter, employment agreement, official I-9, power of attorney, reference letter, child travel consent, lease. Templates we already have. Spanish: /es/documentos-para-visa.",
    problem:
      "A visa filing needs supporting PDFs signed this week. Lawyers file the petition. E-sign tools pretend they are USCIS. We are neither.",
    solution:
      "Send the templates we already ship. We do not invent I-129, DS-160, or I-864 and we do not talk to USCIS. If you need the petition filed, hire that service and come here for the signatures around it.",
    features: [
      { title: "Offer + employment", body: "The letter and agreement a consulate often asks to see." },
      { title: "Official I-9", body: "When the job is in the US. Not E-Verify." },
      { title: "POA, reference, child travel", body: "Family and authorization docs already in the catalog." },
      { title: "Lease / roommate", body: "Housing paperwork that shows up in the same packet." },
    ],
    useCases: [
      "Gathering supporting docs a lawyer or consulate listed",
      "Employer sending an offer letter for a visa file",
      "Parents signing child travel consent next to other immigration paperwork",
    ],
    faqs: [
      {
        question: "Will you file my visa?",
        answer: "No. We sign supporting documents. We do not file I-129, DS-160, I-864, or any USCIS petition.",
      },
      {
        question: "Which templates?",
        answer:
          "Offer letter, employment agreement, I-9, W-9 (US persons), power of attorney, reference letter, child travel consent, commercial lease / roommate. Thin legacy invitation-letter slugs are not this product.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/documentos-para-visa — kit: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Open the immigrant kit",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Immigrant kit", to: "/packets/latam-to-us" },
      { label: "Sign I-9", to: "/i-9" },
      { label: "Offer letter", to: "/free-templates/offer-letter" },
      { label: "Power of attorney", to: "/free-templates/power-of-attorney" },
      { label: "Child travel consent", to: "/free-templates/child-travel-consent" },
    ],
  },
  {
    slug: "mexico-to-us",
    xDefault: "es",
    seoTitle: "Mexico to the US — I-9, Apostille Links, Constancia | Docracy",
    seoDescription:
      "From Mexico to the US: sign official I-9, offer, POA; official SRE apostille link; constancia for a US lease. $10/mo plan. We don't apostille or file USCIS.",
    heroHeadline: "Mexico → United States. We sign the packet. SRE apostilles it.",
    heroSubheadline:
      "Same Paid plan as the immigrant kit: I-9, offer, visa extras, constancia, cobro. Plus the official SRE apostille link. We do not apostille documents and we do not file I-129 or DS-160.",
    problem:
      "Search is gestorías, Boundless, and SAT constancia generators. None of them sign a US I-9 and then tell you the SRE page for apostille.",
    solution:
      "Unlock the $10 plan. Sign I-9 and supporting PDFs here. We save them so you can reopen them. Apostille is gob.mx/SRE — not us. Cobro still takes your Mercado Pago.",
    features: [
      { title: "Official I-9 + offer", body: "USCIS form. Employer keeps the I-9. We don't run E-Verify." },
      { title: "SRE apostille (official)", body: "Link only. We do not stamp or courier apostilles." },
      { title: "Constancia for Houston / Miami", body: "Not a SAT CSF. Paid vault URL." },
      { title: "Cobro in MXN", body: "You label the amount. Stripe still bills Docracy Paid in USD $10." },
    ],
    useCases: [
      "First job week after landing from Mexico",
      "POA for family still in Mexico — sign here, apostille at SRE",
      "Lease application without a W-2",
    ],
    faqs: [
      {
        question: "Do you apostille Mexican documents?",
        answer:
          "No. Apostille and legalization are SRE: https://www.gob.mx/sre/acciones-y-programas/apostilla-y-legalizacion-de-documentos. We can sign the POA first.",
      },
      {
        question: "Is this Boundless?",
        answer: "No. They file USCIS cases. We sign extras and keep the vault. Compare /boundless-alternative.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/mexico-a-eeuu — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Unlock the immigrant plan — $10/month",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Immigrant plan", to: "/packets/latam-to-us" },
      { label: "SRE apostille (official)", to: "https://www.gob.mx/sre/acciones-y-programas/apostilla-y-legalizacion-de-documentos" },
      { label: "Colombia → US", to: "/colombia-to-us" },
      { label: "Lease / constancia", to: "/immigrant-housing" },
      { label: "Sign I-9", to: "/i-9" },
    ],
  },
  {
    slug: "colombia-to-us",
    xDefault: "es",
    seoTitle: "Colombia to the US — I-9, Cancillería Apostille, Constancia | Docracy",
    seoDescription:
      "From Colombia to the US: sign official I-9 and visa extras; official Cancillería apostille link; constancia for a US lease. $10/mo. We don't apostille or file.",
    heroHeadline: "Colombia → United States. We sign the packet. Cancillería apostilles it.",
    heroSubheadline:
      "Same $10 plan: I-9, offer, POA, constancia, cobro. Official Cancillería apostille link. We do not submit to DIAN, USCIS, or CEAC.",
    problem:
      "Siigo and gestorías own the search. You need a signed I-9 and a place that says who apostilles a Colombian birth certificate — not a DIAN invoice.",
    solution:
      "Sign supporting PDFs on Docracy. Paid keeps them. Apostille is Cancillería. Cobro can be COP on your Nequi or Mercado Pago — that money never hits us.",
    features: [
      { title: "Official I-9", body: "Employer retains it. Not E-Verify." },
      { title: "Cancillería apostille (official)", body: "https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion — we don't file it." },
      { title: "Constancia for a US landlord", body: "Not a DIAN invoice and not a W-2." },
      { title: "Cobro in COP", body: "Your checkout. Paid is still USD $10 on Stripe." },
    ],
    useCases: [
      "First US job after arriving from Colombia",
      "POA for someone in Bogotá — sign here, apostille at Cancillería",
      "Still invoicing Colombian clients on WhatsApp",
    ],
    faqs: [
      {
        question: "Do you apostille Colombian documents?",
        answer:
          "No. That is Cancillería: https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion. We sign the supporting PDF first.",
      },
      {
        question: "Is this Siigo?",
        answer: "No. Siigo is DIAN billing. Compare /siigo-alternative. This page is the immigrant packet.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/colombia-a-eeuu — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Unlock the immigrant plan — $10/month",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Immigrant plan", to: "/packets/latam-to-us" },
      { label: "Cancillería apostille (official)", to: "https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion" },
      { label: "Mexico → US", to: "/mexico-to-us" },
      { label: "Lease / constancia", to: "/immigrant-housing" },
      { label: "Siigo alternative", to: "/siigo-alternative" },
    ],
  },
  {
    slug: "immigrant-housing",
    xDefault: "es",
    seoTitle: "US Lease for LATAM Immigrants — Sign + Constancia | Docracy",
    seoDescription:
      "Sign a lease or roommate agreement and share a constancia URL when a US landlord asks for income proof. Not a W-2. $10/mo vault. Spanish first.",
    heroHeadline: "The lease wants a signature and proof of income. You have neither on paper.",
    heroSubheadline:
      "Sign the lease or roommate template. Share a Paid constancia URL. Houston / Miami / NYC landlords. Not a SAT CSF. Not a bank letter.",
    problem:
      "The portal wants a W-2 and a wet-ink lease. You have Mercado Pago, a signed offer, and a roommate who also just arrived.",
    solution:
      "Sign the housing PDF here. Attach the constancia from the same $10 plan. Some landlords still want a bank statement — say that honestly.",
    features: [
      { title: "Lease / roommate templates", body: "Already in the catalog. Two signers free." },
      { title: "Constancia URL", body: "Index of contracts and cobros you already completed. Paid." },
      { title: "Same immigrant plan", body: "I-9 and visa extras stay in the same vault." },
      { title: "Honest limit", body: "We do not notarize and we do not guarantee the landlord accepts it." },
    ],
    useCases: [
      "Roommate agreement the first month",
      "Commercial or simple lease the landlord emailed",
      "Income proof without pay stubs",
    ],
    faqs: [
      {
        question: "Is this a SAT constancia?",
        answer: "No. Ours is a Docracy index. The SAT CSF is a different document.",
      },
      {
        question: "Will every landlord accept it?",
        answer: "No. Send a bank statement too if you have one. We do not notarize.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/arrendamiento-inmigrante — tool: /es/constancia. Plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Open the immigrant plan",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Constancia", to: "/income-proof" },
      { label: "Constancia for a US rental", to: "/proof-of-income-us-rental" },
      { label: "Lease template", to: "/free-templates/simple-commercial-lease-agreement" },
      { label: "Roommate agreement", to: "/free-templates/roommate-agreement" },
    ],
  },
  {
    slug: "after-arrival",
    xDefault: "es",
    seoTitle: "After You Arrive in the US — I-94, USCIS Account, ITIN | Docracy",
    seoDescription:
      "After landing: retrieve I-94 on CBP, open a USCIS account, report a new address, apply for an ITIN on IRS.gov. We sign the extras. We don't file AR-11 or W-7.",
    heroHeadline: "You landed. The next forms are not ours to file.",
    heroSubheadline:
      "I-94 is CBP. Address change and the online account are USCIS. ITIN is the IRS. Same $10 plan saves the PDFs you sign here. Spanish first.",
    problem:
      "Search mixes Boundless, ‘free I-94 PDF’, and SAT constancia generators. None of them send you to CBP, USCIS, and IRS and then keep the offer and I-9 you already signed.",
    solution:
      "Use the official portals yourself. Unlock Paid so the I-9, offer, POA, and constancia stay reopenable. We do not retrieve I-94, we do not file AR-11, and we do not submit W-7.",
    features: [
      { title: "I-94 (CBP)", body: "Retrieve it on i94.cbp.dhs.gov. We don't host the record." },
      { title: "USCIS online account", body: "myaccount.uscis.gov — E-COA lives there. Not us." },
      { title: "Change of address", body: "uscis.gov/addresschange. Usually within 10 days. Not a Docracy form." },
      { title: "ITIN if you have no SSN", body: "IRS W-7. We don't invent that form and we don't mail Austin." },
    ],
    useCases: [
      "First week after a visa stamp — I-94 for the employer",
      "Moved apartments — USCIS wants the new address",
      "Need a TIN for a 1040-NR and you are not eligible for an SSN",
    ],
    faqs: [
      {
        question: "Do you retrieve my I-94?",
        answer: "No. CBP: https://i94.cbp.dhs.gov/I94/#/home",
      },
      {
        question: "Do you file AR-11?",
        answer: "No. https://www.uscis.gov/addresschange — usually through a USCIS online account.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/despues-de-llegar — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Unlock the immigrant plan — $10/month",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "I-94 (CBP official)", to: "https://i94.cbp.dhs.gov/I94/#/home" },
      { label: "USCIS account", to: "https://myaccount.uscis.gov/" },
      { label: "Change of address", to: "https://www.uscis.gov/addresschange" },
      { label: "Apply for an ITIN (IRS)", to: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin" },
      { label: "Immigrant plan", to: "/packets/latam-to-us" },
    ],
  },
  {
    slug: "itin",
    xDefault: "es",
    seoTitle: "ITIN vs SSN vs W-9 — Official IRS W-7 Link | Docracy",
    seoDescription:
      "ITIN is an IRS number when you cannot get an SSN. Official W-7 is on IRS.gov. We sign W-9 only for US persons. We do not file W-7 or invent that form.",
    heroHeadline: "ITIN is the IRS. SSN is SSA. W-9 is only for US persons.",
    heroSubheadline:
      "If you are not eligible for a Social Security number, the IRS issues an ITIN on Form W-7. We link the official page. We do not prepare or mail W-7.",
    problem:
      "Landlords and payers ask for a TIN. People download a random W-7 and think e-sign equals an ITIN. It doesn't.",
    solution:
      "Apply on IRS.gov (mail or a Taxpayer Assistance Center / CAA). If you are a US person, sign the official W-9 here. If you need an SSN, that is ssa.gov — not us.",
    features: [
      { title: "Official IRS how-to", body: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin" },
      { title: "W-7 stays on IRS.gov", body: "About Form W-7: https://www.irs.gov/forms-pubs/about-form-w-7 — we don't ship a substitute." },
      { title: "W-9 only if you are a US person", body: "Official IRS W-9 is in the catalog. We still don't ship W-8BEN." },
      { title: "SSN is a different office", body: "ssa.gov/ssnumber. We don't file SS-5." },
    ],
    useCases: [
      "1040-NR and you cannot get an SSN",
      "Payer asked for a TIN and you are not a US person",
      "Renew an expired ITIN — still W-7 on IRS.gov",
    ],
    faqs: [
      {
        question: "Do you file W-7?",
        answer: "No. https://www.irs.gov/tin/itin/how-to-apply-for-an-itin",
      },
      {
        question: "Is an ITIN work authorization?",
        answer: "No. Neither is signing an I-9 here. We don't run E-Verify.",
      },
      {
        question: "Spanish URL?",
        answer: "https://docracy.io/es/itin — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Open the immigrant plan",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "How to apply for an ITIN (IRS)", to: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin" },
      { label: "About Form W-7 (IRS)", to: "https://www.irs.gov/forms-pubs/about-form-w-7" },
      { label: "SSN (SSA)", to: "https://www.ssa.gov/ssnumber/" },
      { label: "W-9 template", to: "/free-templates/w-9-form" },
      { label: "After arrival", to: "/after-arrival" },
    ],
  },
  ...generatedCountryPages("en") as FeaturePageContent[],
];

export function getNdaSigningPageEs(): FeaturePageContent {
  return {
    slug: "nda-signing",
    seoTitle: "Firma un NDA en línea gratis — Sin cuenta | Docracy",
    seoDescription:
      "Firma un NDA en línea gratis hasta 2 firmantes — sin cuenta. Plantilla de NDA mutuo lista en minutos; $10/mes fijo cuando necesites más.",
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
    faqs: [
      {
        question: "¿Los destinatarios necesitan una cuenta para firmar un NDA?",
        answer:
          "No. Abren el enlace del correo (o WhatsApp en un plan de pago) y firman — nada que instalar ni registrar.",
      },
      {
        question: "¿Hay una plantilla de NDA gratis?",
        answer:
          "Sí. Empieza con las plantillas de NDA mutuo o unilateral de Docracy, con campos ya colocados, y envíala a firmar.",
      },
      {
        question: "¿Las firmas de NDA en Docracy son válidas?",
        answer:
          "Docracy produce firmas electrónicas simples (SES) con registro de auditoría. No verifica la identidad del firmante — ver /trust.",
      },
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

export function getWhatsappInvoicePageEs(): FeaturePageContent {
  return {
    slug: "whatsapp-invoice",
    seoTitle: "Enviar factura por WhatsApp — PayPal y Mercado Pago | Docracy",
    seoDescription:
      "Factura por WhatsApp con tu enlace de PayPal, Stripe o Mercado Pago. Sin firma. Docracy nunca cobra el dinero. Plan de $10/mes.",
    heroHeadline: "Envía la factura por WhatsApp. Cobra en tu checkout.",
    heroSubheadline:
      "Adjunta el PDF, pega PayPal.me o Mercado Pago y manda la página de cobro. Sin firma extra. No somos un procesador de pagos.",
    problem:
      "Las facturas por correo se quedan sin abrir. En LATAM y con muchos contratistas de EE. UU., WhatsApp es la bandeja que sí se lee — pero la mayoría de las herramientas de firma solo envían una solicitud de firma.",
    solution:
      "El cobro de Docracy es archivo + pago: el destinatario abre una página con tu PDF y tu checkout https. Aviso opcional cada 30 días. Firmar sigue siendo un producto aparte y gratis.",
    features: [
      { title: "Sin firma", body: "El archivo está disponible de inmediato. Si necesitas firma, envía un documento normal." },
      { title: "Tu checkout", body: "PayPal.me, Stripe Payment Link, Mercado Pago — Docracy nunca cobra los fondos." },
      { title: "WhatsApp + correo", body: "Usa la plantilla viva signing_invite. Cuenta contra la cuota mensual de WhatsApp." },
      { title: "Recordatorio a 30 días", body: "Aviso automático hasta la fecha de archivo, más reenvío desde tu cuenta." },
    ],
    useCases: [
      "Freelancers cobrando trabajo cerrado en México, Colombia o Argentina",
      "Estudios de EE. UU. que pagan contratistas LATAM por Mercado Pago",
      "Facturas de seguimiento cuando el contrato ya está firmado",
    ],
    faqs: [
      {
        question: "¿Esto es Stripe Connect o una comisión de Docracy?",
        answer: "No. Pegas una URL de checkout que ya tienes. El plan de pago son $10/mes por el producto, no un recorte de la factura.",
      },
      {
        question: "¿Tienen que firmar la factura?",
        answer: "No. Abre /es/cobro. Si necesitas firma + botón de pago, usa Preparar en una cuenta de pago.",
      },
      {
        question: "¿Puedo enviar una factura por WhatsApp a México o Colombia?",
        answer: "Sí. Pega Mercado Pago, PayPal.me o un Stripe Payment Link. Las etiquetas incluyen MXN, COP, ARS, CLP, PEN, BRL y USD.",
      },
      {
        question: "¿Es lo mismo que firmar por WhatsApp?",
        answer:
          "No. Firmar por WhatsApp (/whatsapp-signing) es una invitación con PIN. El cobro es archivo + pago, sin cadena de firmantes.",
      },
      {
        question: "¿Docracy les recuerda si no pagan?",
        answer: "Sí — cada ~30 días hasta la fecha de archivo, más un reenvío manual. Cada ping de WhatsApp usa cuota.",
      },
    ],
    ctaLabel: "Enviar un cobro por WhatsApp",
    ctaTo: "/cobro",
    relatedLinks: [
      { label: "Firmar por WhatsApp (con PIN)", to: "/whatsapp-signing" },
      { label: "Casillero temporada 1099", to: "/1099-season" },
      { label: "Kit contratista LATAM", to: "/packets/latam-contractor" },
      { label: "Constancia de ingresos", to: "/income-proof" },
    ],
  };
}

export function getContractorRecordsPageEs(): FeaturePageContent {
  return {
    slug: "1099-contractor-records",
    seoTitle: "Registros 1099 de contratistas — archivo W-9 y CSV | Docracy",
    seoDescription:
      "Conserva W-9s firmados y acuerdos de contratista hasta la temporada 1099. Descarga un CSV para tu contador. No es presentación ante el IRS. $10/mes.",
    heroHeadline: "Registros de contratista que siguen existiendo en enero.",
    heroSubheadline:
      "Cada archivo de Docracy completado en el año calendario, más una hoja para tu contador. No presentamos el 1099-NEC ni leemos TIN del PDF.",
    problem:
      "Las herramientas de firma gratis borran el W-9 a la semana. En temporada 1099 tienes un nombre en el banco y ningún archivo.",
    solution:
      "El plan de pago conserva los PDF hasta el próximo 15 de abril o 13 meses. El casillero 1099 lista ese año y exporta CSV: títulos, contrapartes, montos que escribiste, URLs de la página firmada.",
    features: [
      { title: "Lista del año calendario", body: "Todos los documentos completados, no solo los titulados W-9." },
      { title: "CSV para el contador", body: "Columnas honestas — sin extracción falsa de TIN." },
      { title: "Bóveda fiscal", body: "El mismo archivo de pago que ya conserva los PDF." },
      { title: "Incluye cobro", body: "Los envíos de pago por WhatsApp cuentan en el mismo año." },
    ],
    useCases: [
      "Empresas de EE. UU. que recogen W-9s de contratistas 1099",
      "Estudios que pagan contratistas en EE. UU. y LATAM",
      "Quien tiene un contador que pide una lista, no un ZIP de Gmail",
    ],
    faqs: [
      {
        question: "¿Docracy presenta mis 1099 ante el IRS?",
        answer: "No. Esto es un archivo y un CSV. Tú o tu contador siguen presentando.",
      },
      {
        question: "¿Dónde está el casillero?",
        answer: "https://docracy.io/es/temporada-1099 — inglés: /1099-season. Las cuentas de pago ven la descarga; el resto ve esta explicación.",
      },
      {
        question: "¿Extraen el número de Seguro Social del W-9?",
        answer: "No. Nunca leemos TIN con OCR. Conserva el W-9 firmado en la bóveda y entrega ese PDF a tu contador.",
      },
      {
        question: "¿Incluye facturas que envié por WhatsApp sin firma?",
        answer: "Sí. El cobro completado (archivo + pago) cuenta en el mismo año calendario que los contratos firmados.",
      },
      {
        question: "¿El casillero 1099 es gratis?",
        answer: "No. La firma gratis borra los PDF a los 9 días. El plan de $10/mes conserva los archivos hasta la temporada fiscal y desbloquea el CSV.",
      },
    ],
    ctaLabel: "Abrir el casillero temporada 1099",
    ctaTo: "/1099-season",
    relatedLinks: [
      { label: "Kit de contratista en EE. UU. (W-9)", to: "/packets/us-contractor" },
      { label: "Plantilla gratis de W-9", to: "/free-templates/w-9-form" },
      { label: "Constancia de ingresos", to: "/income-proof" },
    ],
  };
}

export function getHireAbroadPageEs(): FeaturePageContent {
  return {
    slug: "hire-contractor-abroad",
    seoTitle: "Contratar en el extranjero — NDA, acuerdo y cobro por WhatsApp | Docracy",
    seoDescription:
      "Documenta un contratista en LATAM o el extranjero: NDA y acuerdo gratis, luego cobra por WhatsApp. No es un W-8BEN. EN + español.",
    heroHeadline: "Contrata en el extranjero sin inventar un W-8BEN.",
    heroSubheadline:
      "El NDA mutuo y el acuerdo de contratista son plantillas gratis. Luego el cobro de pago envía tu Mercado Pago o PayPal por WhatsApp. Las personas de EE. UU. siguen el kit W-9 del IRS.",
    problem:
      "Los kits de EE. UU. asumen un W-9. Los contratistas en el extranjero no son personas de EE. UU. Un PDF falso de W-8BEN es cómo las empresas se meten en problemas.",
    solution:
      "El corredor LATAM de Docracy es honesto: NDA, acuerdo de contratista y luego cobro. Sin formulario inventado del IRS. URLs en español incluidas.",
    features: [
      { title: "NDA + acuerdo gratis", body: "Plantillas existentes del marketplace, un PDF a la vez." },
      { title: "Cobro por WhatsApp", body: "Pago: archivo + tu checkout, sin firma extra." },
      { title: "Superficie en español", body: "/es/kit-contratista-latam y /es/cobro." },
      { title: "El kit de EE. UU. sigue existiendo", body: "La ruta W-9 está en /es/kit-contratista." },
    ],
    useCases: [
      "Startups de EE. UU. que contratan ingenieros en México o Colombia",
      "Agencias que pagan diseñadores LATAM por Mercado Pago",
      "Quien iba a googlear un W-8BEN gratis y firmarlo a ciegas",
    ],
    faqs: [
      {
        question: "¿Esto es asesoría fiscal o migratoria?",
        answer: "No. Es un asistente de documentos. Pregunta a un contador sobre retención y el W-8BEN.",
      },
      {
        question: "¿Por dónde empiezo?",
        answer: "https://docracy.io/es/kit-contratista-latam — inglés: /packets/latam-contractor.",
      },
      {
        question: "¿Tienen plantilla de W-8BEN?",
        answer:
          "No. No inventamos formularios del IRS. Este kit es NDA + acuerdo + tu checkout. Personas de EE. UU. usan el kit W-9.",
      },
      {
        question: "¿Puedo contratar un freelancer en México o Colombia?",
        answer:
          "Sí — envía el NDA y el acuerdo en inglés o español, luego cobro con Mercado Pago o PayPal. No es asesoría laboral ni de visas.",
      },
      {
        question: "¿El kit entero es gratis?",
        answer: "Firmar el NDA y el acuerdo es gratis. El cobro por WhatsApp / enlaces de pago es el plan de $10/mes.",
      },
    ],
    ctaLabel: "Abrir el kit contratista LATAM",
    ctaTo: "/packets/latam-contractor",
    relatedLinks: [
      { label: "Kit de contratista en EE. UU. (W-9)", to: "/packets/us-contractor" },
      { label: "Cobro por WhatsApp", to: "/cobro" },
      { label: "Casillero temporada 1099", to: "/1099-season" },
      { label: "Constancia de ingresos", to: "/income-proof" },
    ],
  };
}

export function getProofOfIncomePageEs(): FeaturePageContent {
  return {
    slug: "proof-of-income",
    xDefault: "es",
    seoTitle: "Prueba de ingresos sin recibos de nómina | Docracy",
    seoDescription:
      "¿Te piden prueba de ingresos y no tienes recibos de nómina? Comparte un paquete con contratos y cobros. No es una carta certificada ni un W-2. Plan de $10/mes.",
    heroHeadline: "Prueba de ingresos cuando no hay recibos de nómina.",
    heroSubheadline:
      "El arrendador, el banco o el contador piden una carta. PayPal y Mercado Pago no la imprimen. Docracy junta el año que ya firmaste y cobraste en una URL que puedes compartir.",
    problem:
      "Si cobras por PayPal, Mercado Pago o cobro, no te dan W-2 ni stub. Una captura de la app no pasa una solicitud de renta. Una 'carta de ingresos' que escribiste tú se ve exactamente así.",
    solution:
      "La constancia no es un tipo de documento nuevo. Son los archivos completados que ya están en tu bóveda de pago — títulos, fechas, nombres y montos que tú escribiste — en un enlace noindex. El español es el idioma principal: /es/constancia. Inglés: /income-proof.",
    features: [
      {
        title: "Una URL que puede abrir un desconocido",
        body: "Año, tu nombre como quieres que aparezca, cada archivo completado, montos que anotaste. No un ZIP en el chat.",
      },
      {
        title: "Nombres, no correos",
        body: "La página pública muestra contrapartes solo por nombre. Tu correo de cuenta no aparece.",
      },
      {
        title: "Honesta sobre lo que no es",
        body: "No es un W-2, no es una carta del banco, no es un certificado de empleador, no es declaración ante el SAT ni el IRS.",
      },
      {
        title: "Sale de cobros y contratos firmados",
        body: "Los cobros por WhatsApp y los acuerdos firmados del mismo año calendario van en una sola lista.",
      },
    ],
    useCases: [
      "Freelancers en México o Colombia que rentan un departamento",
      "Inmigrantes de LATAM que piden un depa en EE. UU. sin W-2",
      "Contratistas que necesitan un paquete para el contador sin W-2",
      "Quien cobra por PayPal o Mercado Pago y le piden prueba de ingresos",
    ],
    faqs: [
      {
        question: "¿Esto es una carta certificada de ingresos?",
        answer:
          "No. Es un índice con fecha de documentos que ya completaste en Docracy. Un arrendador o un banco aún puede pedir un estado de cuenta. No sellamos, no notariamos ni verificamos identidad.",
      },
      {
        question: "¿Leen mi cuenta de PayPal o Mercado Pago?",
        answer:
          "No. Los totales son los montos que tú escribiste al enviar un cobro o pegar un enlace de pago. No nos conectamos a ningún banco.",
      },
      {
        question: "¿Dónde abro el paquete?",
        answer:
          "https://docracy.io/es/constancia — inglés: /income-proof. Esta página de búsqueda es /es/prueba-de-ingresos.",
      },
      {
        question: "¿Google indexa el enlace compartido?",
        answer: "No. Las URLs del paquete son noindex. Las páginas de marketing sí se indexan para que te encuentren.",
      },
      {
        question: "¿Es gratis?",
        answer:
          "Firmar sigue gratis. El paquete necesita la bóveda de pago para que los archivos existan cuando te los pidan. $10/mes.",
      },
    ],
    ctaLabel: "Abrir la constancia de ingresos",
    ctaTo: "/income-proof",
    relatedLinks: [
      { label: "Herramienta de constancia", to: "/income-proof" },
      { label: "Cobro por WhatsApp", to: "/cobro" },
      { label: "Casillero temporada 1099", to: "/1099-season" },
      { label: "Kit contratista LATAM", to: "/packets/latam-contractor" },
      { label: "Constancia para rentar en EE. UU.", to: "/proof-of-income-us-rental" },
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
    ],
  };
}

export function getSignedWorkOrderPageEs(): FeaturePageContent {
  return {
    slug: "signed-work-order",
    seoTitle: "Orden de trabajo y change order firmados | Docracy",
    seoDescription:
      "Firma la orden de trabajo y el change order gratis, luego cobra con tu PayPal o Square. Para electricistas, HVAC y oficios. No es Jobber. No es un waiver de gravamen.",
    heroHeadline: "Firma la orden de trabajo antes de comprar los materiales.",
    heroSubheadline:
      "Firma secuencial gratis para el presupuesto y el change order. El cobro de pago envía tu propio checkout por WhatsApp. No llevamos tu calendario ni inventamos un formulario de gravamen.",
    problem:
      "El cliente dijo que sí por teléfono. Jobber pide una suscripción para enviar el presupuesto. Excel no obtiene una firma. Compras materiales y luego desaparecen.",
    solution:
      "El kit de oficios de Docracy son tres envíos reales: orden de trabajo, change order y luego cobro con la URL de Square/PayPal/Venmo que ya tienes. Firmar es gratis para dos personas. El cobro es el plan de $10/mes — no un recorte del trabajo.",
    features: [
      { title: "Orden de trabajo primero", body: "Alcance, costo estimado, fechas — firmado antes de empezar." },
      { title: "Change order cuando se mueve", body: "Un segundo PDF para que los extras no sean un apretón de manos." },
      { title: "Tu checkout", body: "El cobro pega PayPal, Square o Venmo. Docracy nunca cobra el depósito." },
      { title: "Honesto sobre gravámenes", body: "No hay un waiver falso por estado. Pregunta a un abogado de construcción." },
    ],
    useCases: [
      "Electricistas que cobran un anticipo después de aceptar el presupuesto",
      "Change orders de HVAC a mitad de obra",
      "Jardineros que facturan por WhatsApp",
    ],
    faqs: [
      {
        question: "¿Esto reemplaza a Jobber?",
        answer: "No. Quédate con Jobber para el calendario. Docracy firma el PDF y envía tu enlace de pago.",
      },
      {
        question: "¿Dónde está el kit?",
        answer: "https://docracy.io/es/kit-oficios — inglés: /packets/trades. Esta página de búsqueda: /es/orden-de-trabajo-firmada.",
      },
      {
        question: "¿Presentan un mechanic’s lien?",
        answer: "No. No enviamos un waiver estatal válido ni presentamos gravámenes.",
      },
      {
        question: "¿Puedo mandar la factura por WhatsApp sin otra firma?",
        answer: "Sí en el plan de pago. Eso es cobro — el último paso de este kit.",
      },
    ],
    ctaLabel: "Abrir el kit de oficios",
    ctaTo: "/packets/trades",
    relatedLinks: [
      { label: "Kit oficios", to: "/packets/trades" },
      { label: "Cobro por WhatsApp", to: "/cobro" },
      { label: "Pedir un W-9", to: "/packets/collect" },
    ],
  };
}

export function getContractorPaymentProofPageEs(): FeaturePageContent {
  return {
    slug: "contractor-payment-proof",
    seoTitle: "Comprobante de pago a contratistas — paquete CPA | Docracy",
    seoDescription:
      "Comparte un año de W-9s, contratos y cobros firmados con tu contador. URL HMAC, nombres no correos. No es e-file del IRS. Sin OCR de TIN. Plan de $10/mes.",
    heroHeadline: "Prueba que les pagaste — sin mandar un ZIP de PDFs.",
    heroSubheadline:
      "El casillero 1099 ya lista el año. Copia un enlace que tu CPA puede abrir. Títulos, nombres, montos que escribiste. No presentamos 1099-NEC y nunca leemos números de seguro social de la página.",
    problem:
      "Llega enero. El contador quiere una lista. Buscar W-9 en Gmail no da nada porque la firma gratis borró el archivo a los nueve días.",
    solution:
      "El plan de pago conserva los PDFs. El casillero exporta CSV y ahora genera una página HMAC para compartir — lo inverso de una constancia de freelancer. La página pública es noindex. Tu correo de login nunca aparece.",
    features: [
      { title: "URL para el CPA", body: "La misma lista del año que el casillero, sin correos ni URLs de pago." },
      { title: "CSV sigue ahí", body: "Descarga para quien vive en la hoja de cálculo." },
      { title: "Incluye cobro", body: "Los envíos de cobro por WhatsApp cuentan en el mismo año calendario." },
      { title: "Sin OCR de TIN", body: "Entrega el PDF del W-9 firmado al CPA. No extraemos SSN." },
    ],
    useCases: [
      "Estudios en EE. UU. que pagan contratistas 1099",
      "Agencias que también cobran a diseñadores en LATAM",
      "Quien el CPA pidió prueba de pago, no un 1099 presentado",
    ],
    faqs: [
      {
        question: "¿Docracy presenta mis 1099 ante el IRS?",
        answer: "No. Archivo + CSV + un índice para compartir. Tú o tu CPA siguen presentando.",
      },
      {
        question: "¿Dónde copio el enlace?",
        answer: "https://docracy.io/es/temporada-1099 — inglés: /1099-season. Las cuentas de pago ven Copiar enlace CPA.",
      },
      {
        question: "¿Es lo mismo que la constancia del freelancer?",
        answer: "Dirección opuesta. La constancia es «yo cobré esto». Esta página es «yo les pagué».",
      },
      {
        question: "¿Extraen identificaciones fiscales?",
        answer: "No.",
      },
    ],
    ctaLabel: "Abrir el casillero 1099",
    ctaTo: "/1099-season",
    relatedLinks: [
      { label: "Casillero temporada 1099", to: "/1099-season" },
      { label: "Pedir un W-9", to: "/packets/collect" },
      { label: "Constancia (ellos cobraron)", to: "/income-proof" },
    ],
  };
}

export function getLatamExportDocumentsPageEs(): FeaturePageContent {
  return {
    slug: "latam-export-documents",
    xDefault: "es",
    seoTitle: "Documentos comerciales LATAM — no software de aduana | Docracy",
    seoDescription:
      "Firma un contrato de compraventa y una orden de compra para comercio intra-LATAM, luego cobro. No es packing list, no es certificado de origen, no es aduana. Español primero.",
    heroHeadline: "El paquete comercial. No el pedimento.",
    heroSubheadline:
      "El nearshoring sigue necesitando una venta firmada y una orden de compra. Docracy firma esos PDFs. No llenamos formularios de aduana, no cotizamos flete ni inventamos un certificado de origen.",
    problem:
      "El comercio intra-LATAM es una pila de PDFs más un agente. El SaaS que promete «digitalizar aduana» es otra empresa — y un riesgo si el formulario está mal.",
    solution:
      "El kit es honesto: contrato de compraventa, orden de compra y luego cobro de pago con Mercado Pago. La URL en español /es/kit-comercio es x-default. Contrata un agente aduanal para la presentación.",
    features: [
      { title: "Dos plantillas que sí firmas", body: "Contrato de compraventa y orden de compra que ya existen." },
      { title: "Luego cobro", body: "Tu checkout. No un procesador de pagos." },
      { title: "Español primero", body: "/es/kit-comercio y /es/documentos-exportacion." },
      { title: "Lo que no vamos a enviar", body: "No hay generador de packing list, ni certificado de origen, ni API de flete." },
    ],
    useCases: [
      "Un vendedor en México que envía a Colombia con un agente al lado",
      "Compradores en EE. UU. que necesitan los papeles comerciales firmados antes del contenedor",
      "Quien buscó certificado de origen y casi descargó un PDF falso",
    ],
    faqs: [
      {
        question: "¿Esto es middleware de aduanas?",
        answer: "No. No presentamos ante aduana ni comparamos fletes.",
      },
      {
        question: "¿Dónde está el kit?",
        answer: "https://docracy.io/es/kit-comercio — inglés: /packets/latam-trade. Esta página: /es/documentos-exportacion.",
      },
      {
        question: "¿Tienen certificado de origen?",
        answer: "No. Los documentos de origen preferencial son oficiales. No inventamos uno.",
      },
      {
        question: "¿Puedo cobrar después de que firmen?",
        answer: "Sí, cobro de pago con Mercado Pago o PayPal.",
      },
    ],
    ctaLabel: "Abrir el kit comercial",
    ctaTo: "/packets/latam-trade",
    relatedLinks: [
      { label: "Kit comercial LATAM", to: "/packets/latam-trade" },
      { label: "Kit contratista LATAM", to: "/packets/latam-contractor" },
      { label: "Cobro por WhatsApp", to: "/cobro" },
    ],
  };
}

export function getRequestW9PageEs(): FeaturePageContent {
  return {
    slug: "request-w9",
    seoTitle: "Pídeme tu W-9 o NDA | Docracy",
    seoDescription:
      "Reúne un W-9 o NDA mutuo enviando la plantilla. Para RFC / Constancia de Situación Fiscal suben su PDF. No hay formulario del SAT. Sin OCR de TIN. Firmar es gratis.",
    heroHeadline: "Pídeme tu W-9. O tu NDA. O el PDF de RFC que ya tienes.",
    heroSubheadline:
      "Tú sigues siendo quien envía para que el archivo completado caiga en tu bóveda. El W-9 del IRS y el NDA mutuo son plantillas gratis. No publicamos un RFC ni un W-8BEN.",
    problem:
      "Las agencias mandan «pásame tu W-9» y reciben una foto por WhatsApp. La firma gratis borra el archivo antes de la temporada fiscal. Los generadores falsos de RFC son cómo la gente se mete en problemas con el SAT.",
    solution:
      "El kit de solicitud son tres envíos: W-9, NDA y luego su PDF de RFC/CSF. El plan de pago conserva los archivos y desbloquea el casillero 1099 para tu CPA.",
    features: [
      { title: "Tú envías, ellos firman", body: "No es un buzón anónimo. El archivo es tuyo para archivar." },
      { title: "W-9 real del IRS", body: "Plantilla existente. Nunca leemos el TIN con OCR." },
      { title: "El RFC es su PDF", body: "Suben lo que el SAT ya emitió. No inventamos el formulario." },
      { title: "Luego el casillero", body: "Comparte el año con un CPA desde /es/temporada-1099." },
    ],
    useCases: [
      "Empresas en EE. UU. que incorporan contratistas 1099",
      "Agencias que piden NDA antes de un pitch",
      "Pagar a alguien en México que tiene Constancia de Situación Fiscal, no un W-9",
    ],
    faqs: [
      {
        question: "¿Es un enlace mágico que llenan sin que yo cree un envío?",
        answer: "No. Tú envías cada documento. Así aparece en tu bóveda de pago.",
      },
      {
        question: "¿Por dónde empiezo?",
        answer: "https://docracy.io/es/pide-documentos — inglés: /packets/collect.",
      },
      {
        question: "¿Tienen un W-8BEN o un formulario RFC?",
        answer: "No. No inventamos formularios del IRS ni del SAT.",
      },
      {
        question: "¿Van a leer números de seguro social?",
        answer: "Sin OCR de TIN.",
      },
    ],
    ctaLabel: "Abrir el kit de solicitud",
    ctaTo: "/packets/collect",
    relatedLinks: [
      { label: "Kit de solicitud", to: "/packets/collect" },
      { label: "Kit contratista EE. UU.", to: "/packets/us-contractor" },
      { label: "Comprobante de pago CPA", to: "/contractor-payment-proof" },
    ],
  };
}

export function getImmigrantDocumentsPageEs(): FeaturePageContent {
  return {
    slug: "immigrant-documents",
    xDefault: "es",
    seoTitle: "Documentos para inmigrantes — I-9, visa y constancia | Docracy",
    seoDescription:
      "Papelería para inmigrantes de LATAM: I-9 oficial de USCIS, documentos de apoyo para visa, oferta, constancia para el arrendador. No tramitamos la petición ni E-Verify.",
    heroHeadline: "Documentos para inmigrantes. Firma el I-9. Firma el paquete de visa.",
    heroSubheadline:
      "El I-9 oficial está en el catálogo. Documentos de apoyo para visa que ya tenemos. Constancia que un arrendador puede abrir. No presentamos ante USCIS — firmamos lo que te pidieron.",
    problem:
      "Llegaste. El empleador manda oferta e I-9. El abogado de visa pide PDFs de apoyo. El arrendador pide prueba de ingresos. Las gestorías no firman esos contratos.",
    solution:
      "Docracy es el producto de documentos: firma SES gratis del I-9 oficial y de las plantillas de apoyo, cobro y constancia de pago. Límite honesto: no E-Verify, no inspección de documentos, no I-129 / DS-160 inventados.",
    features: [
      { title: "I-9 oficial", body: "Formulario I-9 de USCIS. Firma de empleado y empleador. No es E-Verify." },
      { title: "Paquete de apoyo para visa", body: "Oferta, empleo, poder, referencia, viaje de menor. No la petición." },
      { title: "Constancia que puede abrir un desconocido", body: "Índice con fecha de contratos y cobros. No es un W-2." },
      { title: "Kit W-9 si eres persona de EE. UU.", body: "No publicamos un W-8BEN falso." },
    ],
    useCases: [
      "Quien acaba de mudarse de México o Colombia a Houston o Miami",
      "Nuevos empleados que tienen que firmar el I-9 la primera semana",
      "Quien junta documentos de apoyo que pidió una visa o un consulado",
      "Freelancers que piden un depa en EE. UU. sin recibos de nómina",
    ],
    faqs: [
      {
        question: "¿Pueden hacer el I-9?",
        answer:
          "Sí. Firmamos el Formulario I-9 oficial de USCIS. No inspeccionamos documentos de las Listas A/B/C y no corremos E-Verify. Quien tiene el enlace puede firmar con el nombre indicado. Ver /trust.",
      },
      {
        question: "¿Tramitan la visa?",
        answer:
          "No. Firmamos el paquete de apoyo. Empieza en /es/documentos-para-visa (inglés: /visa-supporting-documents).",
      },
      {
        question: "¿Dónde empiezo?",
        answer: "https://docracy.io/es/documentos-para-inmigrantes — kit: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Abrir el kit de inmigrante",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
      { label: "Firmar I-9", to: "/i-9" },
      { label: "Documentos para visa", to: "/visa-supporting-documents" },
      { label: "Constancia para rentar en EE. UU.", to: "/proof-of-income-us-rental" },
      { label: "Plantilla I-9", to: "/free-templates/i-9-form" },
    ],
  };
}

export function getMoveToUsPageEs(): FeaturePageContent {
  return {
    slug: "move-to-us",
    xDefault: "es",
    seoTitle: "Llegar a Estados Unidos — firma el I-9 y prueba ingresos | Docracy",
    seoDescription:
      "¿Acabas de llegar de LATAM? Firma el I-9 oficial, la oferta, documentos de apoyo para visa y una constancia para el arrendador. No tramitamos la petición.",
    heroHeadline: "Acabas de llegar. Te piden I-9, firma y prueba de ingresos.",
    heroSubheadline:
      "La primera semana son PDFs: I-9, oferta, documentos de visa, solicitud de depa. Un solo producto. Español primero.",
    problem:
      "Google te tira gestorías de visa y generadores de constancia SAT. Ninguno firma un I-9 ni arma un paquete que un arrendador en Miami abra.",
    solution:
      "Empieza el kit: I-9 oficial, oferta, plantillas de apoyo para visa que ya tenemos, cobro si sigues facturando, constancia para rentar, W-9 solo si eres persona de EE. UU.",
    features: [
      { title: "I-9 oficial", body: "Gratis. Empleado + empleador. No es E-Verify." },
      { title: "Plantilla de oferta", body: "También pueden mandarte solo el enlace para firmar." },
      { title: "Documentos de apoyo para visa", body: "Poder, referencia, viaje de menor — no I-129 ni DS-160." },
      { title: "Constancia para el depa", body: "No es la constancia de situación fiscal del SAT." },
    ],
    useCases: [
      "Los primeros 90 días después de aterrizar",
      "Un trabajo nuevo que mandó el I-9 la primera semana",
      "Solicitud de depa o roomie sin W-2",
    ],
    faqs: [
      {
        question: "¿Tramitan la visa?",
        answer:
          "No. Firmamos el paquete de apoyo. Abre /es/documentos-para-visa. Si hay que presentar la petición, contrata ese servicio.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/llegar-a-estados-unidos — kit: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Abrir el kit de llegada",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Documentos para inmigrantes", to: "/immigrant-documents" },
      { label: "Firmar I-9", to: "/i-9" },
      { label: "Documentos para visa", to: "/visa-supporting-documents" },
      { label: "Constancia para rentar", to: "/proof-of-income-us-rental" },
    ],
  };
}

export function getUsRentalIncomeProofPageEs(): FeaturePageContent {
  return {
    slug: "proof-of-income-us-rental",
    xDefault: "es",
    seoTitle: "Constancia de ingresos para rentar en EE. UU. | Docracy",
    seoDescription:
      "Constancia para una solicitud de depa en Estados Unidos: contratos y cobros en una URL. Para inmigrantes de LATAM sin W-2. No es carta bancaria. Español primero.",
    heroHeadline: "Constancia de ingresos para rentar en EE. UU. cuando no hay stub.",
    heroSubheadline:
      "El arrendador en Houston, Miami o NYC pide una carta. Quien cobra por Mercado Pago o PayPal no la tiene. Junta el año en una URL.",
    problem:
      "El portal pide W-2 o recibos de nómina. Tú tienes facturas por WhatsApp y un acuerdo firmado. Una 'carta de ingresos' en Word se ve casera porque lo es.",
    solution:
      "La constancia son los archivos que ya están en tu bóveda de pago — títulos, fechas, nombres, montos que escribiste. Herramienta: /es/constancia. Esta página es la búsqueda de renta. No es la CSF del SAT.",
    features: [
      { title: "Un enlace para el arrendador", body: "No necesita cuenta en Docracy." },
      { title: "Monedas etiquetadas", body: "MXN, USD, COP — lo que anotaste en el cobro." },
      { title: "Portada honesta", body: "No es un W-2. Dilo en las notas de la solicitud." },
      { title: "El mismo producto que /es/constancia", body: "Esta página existe para que te encuentren al buscar renta." },
    ],
    useCases: [
      "Inmigrantes de LATAM que piden un depa en EE. UU.",
      "Freelancers sin recibos de nómina en cualquier ciudad de EE. UU.",
      "Quien sigue facturando a clientes en su país",
    ],
    faqs: [
      {
        question: "¿Todo arrendador la acepta?",
        answer: "No. Algunos piden estado de cuenta. Manda las dos. No notariamos.",
      },
      {
        question: "¿Es la constancia del SAT?",
        answer: "No. Por eso lo escribimos en la página. La nuestra es un índice de archivos de Docracy.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/constancia-para-rentar — herramienta: /es/constancia.",
      },
    ],
    ctaLabel: "Abrir la constancia",
    ctaTo: "/income-proof",
    relatedLinks: [
      { label: "Herramienta de constancia", to: "/income-proof" },
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
      { label: "Documentos para inmigrantes", to: "/immigrant-documents" },
      { label: "Prueba de ingresos (genérica)", to: "/proof-of-income" },
    ],
  };
}

export function getI9PageEs(): FeaturePageContent {
  return {
    slug: "i-9",
    xDefault: "es",
    seoTitle: "Firmar el formulario I-9 en línea — PDF oficial de USCIS | Docracy",
    seoDescription:
      "Firma el Formulario I-9 oficial de USCIS (edición 01/20/25). Campos de empleado y empleador. Gratis para 2 firmantes. No es E-Verify. No inspeccionamos documentos.",
    heroHeadline: "Firma el I-9. No inspeccionamos los documentos.",
    heroSubheadline:
      "El Formulario I-9 oficial de USCIS ya está en el catálogo. El empleado firma la Sección 1. El empleador la Sección 2. Gratis para dos partes. /es/formulario-i-9.",
    problem:
      "El primer día de un empleado nuevo pide un I-9. La mayoría de las firmas esconden el formulario o pretenden que firmar = autorización para trabajar. No es así.",
    solution:
      "Empieza con el PDF oficial de USCIS. Las dos firmas ya están mapeadas. Límite honesto: no examinamos documentos de las Listas A/B/C, no corremos E-Verify, y SES significa que quien tiene el enlace puede firmar con el nombre indicado. Ver /trust.",
    features: [
      { title: "Formulario oficial de USCIS", body: "Edición 01/20/25. No es un sustituto de Docracy." },
      { title: "Dos firmantes, gratis", body: "Empleado y empleador o representante autorizado." },
      { title: "Sin cuenta para el empleado", body: "Abre el enlace y firma." },
      { title: "Límite honesto del I-9", body: "La inspección de documentos y E-Verify quedan con el empleador." },
    ],
    useCases: [
      "Empleadores en EE. UU. que incorporan a alguien que acaba de llegar de LATAM",
      "Reclutamiento que manda el I-9 el mismo día que la oferta",
      "Inmigrantes a quienes les enviaron un I-9 para firmar",
    ],
    faqs: [
      {
        question: "¿Firmar el I-9 en Docracy autoriza a trabajar?",
        answer:
          "No. El formulario registra las declaraciones. El empleador sigue revisando documentos de identidad y autorización. No corremos E-Verify.",
      },
      {
        question: "¿Es el formulario real de USCIS?",
        answer: "Sí. Abre /es/plantillas-gratis/i-9-form (inglés: /free-templates/i-9-form).",
      },
      {
        question: "¿Verifican identidad?",
        answer: "No. SES: quien tiene el enlace puede firmar con el nombre indicado. Detalles en /trust.",
      },
    ],
    ctaLabel: "Abrir la plantilla I-9",
    ctaTo: "/free-templates/i-9-form",
    relatedLinks: [
      { label: "Plantilla I-9", to: "/free-templates/i-9-form" },
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
      { label: "Documentos para visa", to: "/visa-supporting-documents" },
      { label: "Carta de oferta", to: "/free-templates/offer-letter" },
    ],
  };
}

export function getVisaSupportingDocumentsPageEs(): FeaturePageContent {
  return {
    slug: "visa-supporting-documents",
    xDefault: "es",
    seoTitle: "Documentos de apoyo para visa — para firmar | Docracy",
    seoDescription:
      "Firma el paquete que pide una visa o un consulado: oferta, contrato de empleo, I-9, poder notarial, carta de referencia, viaje de menor. No presentamos I-129 ni DS-160.",
    heroHeadline: "No tramitamos la visa. Firmamos el paquete de apoyo.",
    heroSubheadline:
      "Oferta, contrato de empleo, I-9 oficial, poder notarial, carta de referencia, consentimiento de viaje de menor, arrendamiento. Plantillas que ya tenemos. /es/documentos-para-visa.",
    problem:
      "Un expediente de visa pide PDFs firmados esta semana. El abogado presenta la petición. Las firmas pretenden ser USCIS. Nosotros no somos ni lo uno ni lo otro.",
    solution:
      "Envía las plantillas que ya publicamos. No inventamos I-129, DS-160 ni I-864 y no hablamos con USCIS. Si hay que presentar la petición, contrata ese servicio y ven aquí por las firmas de alrededor.",
    features: [
      { title: "Oferta + empleo", body: "La carta y el contrato que un consulado suele pedir." },
      { title: "I-9 oficial", body: "Cuando el trabajo es en EE. UU. No es E-Verify." },
      { title: "Poder, referencia, viaje de menor", body: "Documentos de familia y autorización que ya están en el catálogo." },
      { title: "Arrendamiento / roomie", body: "Papeles de vivienda que aparecen en el mismo paquete." },
    ],
    useCases: [
      "Juntar documentos de apoyo que listó un abogado o un consulado",
      "Empleador que envía una oferta para un expediente de visa",
      "Padres que firman consentimiento de viaje junto a otros papeles",
    ],
    faqs: [
      {
        question: "¿Van a tramitar mi visa?",
        answer: "No. Firmamos documentos de apoyo. No presentamos I-129, DS-160, I-864 ni ninguna petición ante USCIS.",
      },
      {
        question: "¿Cuáles plantillas?",
        answer:
          "Oferta, contrato de empleo, I-9, W-9 (personas de EE. UU.), poder notarial, carta de referencia, consentimiento de viaje de menor, arrendamiento / roomie. Las slugs viejas de 'invitation letter' no son este producto.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/documentos-para-visa — kit: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Abrir el kit de inmigrante",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
      { label: "Firmar I-9", to: "/i-9" },
      { label: "Carta de oferta", to: "/free-templates/offer-letter" },
      { label: "Poder notarial", to: "/free-templates/power-of-attorney" },
      { label: "Viaje de menor", to: "/free-templates/child-travel-consent" },
    ],
  };
}

export function getMexicoToUsPageEs(): FeaturePageContent {
  return {
    slug: "mexico-to-us",
    xDefault: "es",
    seoTitle: "De México a EE. UU. — I-9, apostilla SRE, constancia | Docracy",
    seoDescription:
      "De México a EE. UU.: firma I-9 oficial, oferta y poder; link oficial de apostilla SRE; constancia para rentar. Plan $10/mes. No apostillamos ni tramitamos USCIS.",
    heroHeadline: "México → Estados Unidos. Nosotros firmamos el paquete. SRE apostilla.",
    heroSubheadline:
      "El mismo plan: I-9, oferta, extras de visa, constancia, cobro. Más el link oficial de apostilla SRE. No apostillamos y no presentamos I-129 ni DS-160.",
    problem:
      "Google tira gestorías, Boundless y generadores de constancia SAT. Ninguno firma un I-9 y te manda a la página de SRE para la apostilla.",
    solution:
      "Desbloquea el plan de $10. Firma I-9 y los PDF de apoyo aquí. Los guardamos para que los reabras. La apostilla es gob.mx/SRE — no nosotros. El cobro sigue con tu Mercado Pago.",
    features: [
      { title: "I-9 oficial + oferta", body: "Formulario USCIS. El empleador conserva el I-9. No corremos E-Verify." },
      { title: "Apostilla SRE (oficial)", body: "Solo el link. No timbramos ni enviamos apostillas." },
      { title: "Constancia para Houston / Miami", body: "No es la CSF del SAT. URL del vault de pago." },
      { title: "Cobro en MXN", body: "Tú etiquetas el monto. Stripe cobra el plan en USD $10." },
    ],
    useCases: [
      "Primera semana de trabajo al llegar de México",
      "Poder para familia que sigue en México — fírmalo aquí, apostilla en SRE",
      "Solicitud de depa sin W-2",
    ],
    faqs: [
      {
        question: "¿Apostillan documentos mexicanos?",
        answer:
          "No. Apostilla y legalización son SRE: https://www.gob.mx/sre/acciones-y-programas/apostilla-y-legalizacion-de-documentos. El poder lo puedes firmar aquí primero.",
      },
      {
        question: "¿Esto es Boundless?",
        answer: "No. Ellos presentan casos ante USCIS. Nosotros firmamos extras y guardamos el vault. Compara /es/alternativa-a-boundless.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/mexico-a-eeuu — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Desbloquear el plan inmigrante — $10/mes",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
      { label: "Apostilla SRE (oficial)", to: "https://www.gob.mx/sre/acciones-y-programas/apostilla-y-legalizacion-de-documentos" },
      { label: "Colombia → EE. UU.", to: "/colombia-to-us" },
      { label: "Arrendamiento / constancia", to: "/immigrant-housing" },
      { label: "Firmar I-9", to: "/i-9" },
    ],
  };
}

export function getColombiaToUsPageEs(): FeaturePageContent {
  return {
    slug: "colombia-to-us",
    xDefault: "es",
    seoTitle: "De Colombia a EE. UU. — I-9, apostilla Cancillería, constancia | Docracy",
    seoDescription:
      "De Colombia a EE. UU.: firma I-9 y extras de visa; link oficial de apostilla de Cancillería; constancia para rentar. $10/mes. No apostillamos ni tramitamos.",
    heroHeadline: "Colombia → Estados Unidos. Nosotros firmamos el paquete. Cancillería apostilla.",
    heroSubheadline:
      "El mismo plan de $10: I-9, oferta, poder, constancia, cobro. Link oficial de apostilla de Cancillería. No enviamos nada a DIAN, USCIS ni CEAC.",
    problem:
      "Siigo y las gestorías se quedan con la búsqueda. Tú necesitas un I-9 firmado y quién apostilla un acta colombiana — no una factura DIAN.",
    solution:
      "Firma los PDF de apoyo en Docracy. El plan los guarda. La apostilla es Cancillería. El cobro puede ir en COP por Nequi o Mercado Pago — ese dinero no nos llega.",
    features: [
      { title: "I-9 oficial", body: "El empleador lo retiene. No es E-Verify." },
      { title: "Apostilla Cancillería (oficial)", body: "https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion — no la presentamos." },
      { title: "Constancia para el arrendador", body: "No es factura DIAN ni W-2." },
      { title: "Cobro en COP", body: "Tu checkout. El plan sigue en USD $10 en Stripe." },
    ],
    useCases: [
      "Primer trabajo en EE. UU. al llegar de Colombia",
      "Poder para alguien en Bogotá — fírmalo aquí, apostilla en Cancillería",
      "Sigues facturando clientes en Colombia por WhatsApp",
    ],
    faqs: [
      {
        question: "¿Apostillan documentos colombianos?",
        answer:
          "No. Eso es Cancillería: https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion. Firmamos el PDF de apoyo primero.",
      },
      {
        question: "¿Esto es Siigo?",
        answer: "No. Siigo es facturación DIAN. Compara /es/alternativa-a-siigo. Esta página es el paquete inmigrante.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/colombia-a-eeuu — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Desbloquear el plan inmigrante — $10/mes",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
      { label: "Apostilla Cancillería (oficial)", to: "https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion" },
      { label: "México → EE. UU.", to: "/mexico-to-us" },
      { label: "Arrendamiento / constancia", to: "/immigrant-housing" },
      { label: "Alternativa a Siigo", to: "/siigo-alternative" },
    ],
  };
}

export function getImmigrantHousingPageEs(): FeaturePageContent {
  return {
    slug: "immigrant-housing",
    xDefault: "es",
    seoTitle: "Arrendamiento en EE. UU. para inmigrantes LATAM — firma + constancia | Docracy",
    seoDescription:
      "Firma un arrendamiento o acuerdo de roomie y comparte una constancia cuando el arrendador pide ingresos. No es W-2. Vault de $10/mes. Español primero.",
    heroHeadline: "El depa pide firma y prueba de ingresos. En papel no tienes ninguna.",
    heroSubheadline:
      "Firma el arrendamiento o el acuerdo de roomie. Comparte la URL de la constancia del plan. Houston / Miami / NYC. No es la CSF del SAT. No es carta bancaria.",
    problem:
      "El portal pide W-2 y firma manuscrita. Tú tienes Mercado Pago, una oferta firmada y un roomie que también acaba de llegar.",
    solution:
      "Firma el PDF de vivienda aquí. Adjunta la constancia del mismo plan de $10. Algunos arrendadores igual piden estado de cuenta — dilo con honestidad.",
    features: [
      { title: "Plantillas de arrendamiento / roomie", body: "Ya están en el catálogo. Dos firmantes gratis." },
      { title: "URL de constancia", body: "Índice de contratos y cobros que ya completaste. Plan de pago." },
      { title: "El mismo plan inmigrante", body: "I-9 y extras de visa quedan en el mismo vault." },
      { title: "Límite honesto", body: "No notariamos y no garantizamos que el arrendador lo acepte." },
    ],
    useCases: [
      "Acuerdo de roomie el primer mes",
      "Arrendamiento que te mandó el landlord",
      "Prueba de ingresos sin stubs",
    ],
    faqs: [
      {
        question: "¿Esto es la constancia del SAT?",
        answer: "No. La nuestra es un índice de Docracy. La CSF del SAT es otro documento.",
      },
      {
        question: "¿Todo arrendador la acepta?",
        answer: "No. Manda también un estado de cuenta si lo tienes. No notariamos.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/arrendamiento-inmigrante — herramienta: /es/constancia. Plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Abrir el plan inmigrante",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Constancia", to: "/income-proof" },
      { label: "Constancia para rentar", to: "/proof-of-income-us-rental" },
      { label: "Plantilla de arrendamiento", to: "/free-templates/simple-commercial-lease-agreement" },
      { label: "Acuerdo de roomie", to: "/free-templates/roommate-agreement" },
    ],
  };
}

export function getAfterArrivalPageEs(): FeaturePageContent {
  return {
    slug: "after-arrival",
    xDefault: "es",
    seoTitle: "Después de llegar a EE. UU. — I-94, cuenta USCIS, ITIN | Docracy",
    seoDescription:
      "Ya llegaste: saca el I-94 en CBP, abre cuenta USCIS, avisa el domicilio, pide ITIN en IRS.gov. Firmamos los extras. No presentamos AR-11 ni W-7.",
    heroHeadline: "Ya llegaste. Los siguientes formularios no los presentamos nosotros.",
    heroSubheadline:
      "El I-94 es CBP. El domicilio y la cuenta son USCIS. El ITIN es el IRS. El mismo plan de $10 guarda los PDF que firmas aquí. Español primero.",
    problem:
      "Google mezcla Boundless, ‘I-94 PDF gratis’ y generadores de constancia SAT. Ninguno te manda a CBP, USCIS e IRS y además guarda la oferta y el I-9 que ya firmaste.",
    solution:
      "Usa los portales oficiales tú. Desbloquea el plan para reabrir I-9, oferta, poder y constancia. No bajamos el I-94, no presentamos AR-11 y no enviamos el W-7.",
    features: [
      { title: "I-94 (CBP)", body: "Lo sacas en i94.cbp.dhs.gov. No hospedamos el registro." },
      { title: "Cuenta USCIS", body: "myaccount.uscis.gov — ahí está el E-COA. No somos nosotros." },
      { title: "Cambio de domicilio", body: "uscis.gov/addresschange. Suele ser en 10 días. No es un formulario de Docracy." },
      { title: "ITIN si no tienes SSN", body: "W-7 del IRS. No inventamos ese formulario y no mandamos nada a Austin." },
    ],
    useCases: [
      "Primera semana con visa — I-94 para el empleador",
      "Te mudaste — USCIS quiere la dirección nueva",
      "Necesitas TIN para un 1040-NR y no calificas para SSN",
    ],
    faqs: [
      {
        question: "¿Bajan mi I-94?",
        answer: "No. CBP: https://i94.cbp.dhs.gov/I94/#/home",
      },
      {
        question: "¿Presentan el AR-11?",
        answer: "No. https://www.uscis.gov/addresschange — casi siempre desde la cuenta USCIS.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/despues-de-llegar — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Desbloquear el plan inmigrante — $10/mes",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "I-94 (CBP oficial)", to: "https://i94.cbp.dhs.gov/I94/#/home" },
      { label: "Cuenta USCIS", to: "https://myaccount.uscis.gov/" },
      { label: "Cambio de domicilio", to: "https://www.uscis.gov/addresschange" },
      { label: "Pedir un ITIN (IRS)", to: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin" },
      { label: "Plan inmigrante", to: "/packets/latam-to-us" },
    ],
  };
}

export function getItinPageEs(): FeaturePageContent {
  return {
    slug: "itin",
    xDefault: "es",
    seoTitle: "ITIN vs SSN vs W-9 — link oficial del W-7 | Docracy",
    seoDescription:
      "El ITIN lo da el IRS si no puedes sacar SSN. El W-7 oficial está en IRS.gov. Firmamos W-9 solo si eres persona de EE. UU. No presentamos W-7 ni inventamos ese formulario.",
    heroHeadline: "El ITIN es el IRS. El SSN es SSA. El W-9 solo si eres persona de EE. UU.",
    heroSubheadline:
      "Si no calificas para Seguro Social, el IRS emite un ITIN con el W-7. Enlazamos la página oficial. No preparamos ni enviamos el W-7.",
    problem:
      "El arrendador o el pagador pide un TIN. La gente baja un W-7 cualquiera y cree que firmarlo en línea es un ITIN. No lo es.",
    solution:
      "Pídelo en IRS.gov (correo o TAC / CAA). Si eres persona de EE. UU., firma el W-9 oficial aquí. Si necesitas SSN, eso es ssa.gov — no nosotros.",
    features: [
      { title: "Cómo pedir el ITIN (IRS)", body: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin" },
      { title: "El W-7 se queda en IRS.gov", body: "https://www.irs.gov/forms-pubs/about-form-w-7 — no enviamos un sustituto." },
      { title: "W-9 solo si eres persona de EE. UU.", body: "El W-9 oficial está en el catálogo. Seguimos sin W-8BEN." },
      { title: "El SSN es otra oficina", body: "ssa.gov/ssnumber. No presentamos el SS-5." },
    ],
    useCases: [
      "1040-NR y no puedes sacar SSN",
      "El pagador pidió TIN y no eres persona de EE. UU.",
      "Renovar un ITIN vencido — sigue siendo el W-7 en IRS.gov",
    ],
    faqs: [
      {
        question: "¿Presentan el W-7?",
        answer: "No. https://www.irs.gov/tin/itin/how-to-apply-for-an-itin",
      },
      {
        question: "¿El ITIN autoriza a trabajar?",
        answer: "No. Firmar un I-9 aquí tampoco. No corremos E-Verify.",
      },
      {
        question: "¿URL en español?",
        answer: "https://docracy.io/es/itin — plan: /es/kit-llegar-eeuu.",
      },
    ],
    ctaLabel: "Abrir el plan inmigrante",
    ctaTo: "/packets/latam-to-us",
    relatedLinks: [
      { label: "Cómo pedir un ITIN (IRS)", to: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin" },
      { label: "Sobre el Formulario W-7 (IRS)", to: "https://www.irs.gov/forms-pubs/about-form-w-7" },
      { label: "SSN (SSA)", to: "https://www.ssa.gov/ssnumber/" },
      { label: "Plantilla W-9", to: "/free-templates/w-9-form" },
      { label: "Después de llegar", to: "/after-arrival" },
    ],
  };
}

const ES_FEATURE_GETTERS: Record<string, () => FeaturePageContent> = {
  "nda-signing": getNdaSigningPageEs,
  "client-contracts": getClientContractsPageEs,
  "whatsapp-invoice": getWhatsappInvoicePageEs,
  "1099-contractor-records": getContractorRecordsPageEs,
  "hire-contractor-abroad": getHireAbroadPageEs,
  "proof-of-income": getProofOfIncomePageEs,
  "signed-work-order": getSignedWorkOrderPageEs,
  "contractor-payment-proof": getContractorPaymentProofPageEs,
  "latam-export-documents": getLatamExportDocumentsPageEs,
  "request-w9": getRequestW9PageEs,
  "immigrant-documents": getImmigrantDocumentsPageEs,
  "move-to-us": getMoveToUsPageEs,
  "proof-of-income-us-rental": getUsRentalIncomeProofPageEs,
  "i-9": getI9PageEs,
  "visa-supporting-documents": getVisaSupportingDocumentsPageEs,
  "mexico-to-us": getMexicoToUsPageEs,
  "colombia-to-us": getColombiaToUsPageEs,
  "immigrant-housing": getImmigrantHousingPageEs,
  "after-arrival": getAfterArrivalPageEs,
  "itin": getItinPageEs,
  ...Object.fromEntries(
    GENERATED_COUNTRY_CORRIDORS.map((c) => [c.slug, () => countryFeaturePage(c, "es") as FeaturePageContent])
  ),
};

/** Locale-aware feature page content — ES routes use Spanish copy. */
export function getFeaturePageContent(slug: string, locale: "en" | "es"): FeaturePageContent | undefined {
  if (locale === "es" && ES_FEATURE_GETTERS[slug]) return ES_FEATURE_GETTERS[slug]();
  return FEATURE_PAGES.find((p) => p.slug === slug);
}

export interface AlternativePageContent {
  slug: string;
  /** Short product name for Compare nav ("DocuSign", "OnlineSignature.com"). */
  competitorName: string;
  /** One-line mega-menu blurb. */
  navDesc: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  problem: string;
  solution: string;
  comparison: string[];
  ctaLabel: string;
  ctaTo: string;
  compareBlogSlug?: string;
  /** Internal path instead of a blog post (LATAM compares). */
  compareTo?: string;
  compareLabel: string;
  /** Optional FAQ — emits FAQPage JSON-LD + visible details when present. */
  faqs?: Array<{ question: string; answer: string }>;
  faqsEs?: Array<{ question: string; answer: string }>;
  /** LATAM compares lead in Spanish (x-default = es). */
  xDefault?: "es";
  /** Immigrant-corridor compares — header/footer only promote these when locale is es. */
  audience?: "immigrant";
}

/** Default FAQs for competitor alternative pages (GEO / rich results). */
export function defaultAlternativeFaqs(competitorName: string): Array<{ question: string; answer: string }> {
  return [
    {
      question: `Why switch from ${competitorName} to Docracy?`,
      answer:
        "Docracy is free for up to 2 signers with no account required for recipients, and a flat $10/mo paid plan instead of per-seat pricing. Upload any PDF as-is — no proprietary template rebuild.",
    },
    {
      question: "Do signers need an account?",
      answer: "No. They open the link and sign — no login, no app download.",
    },
    {
      question: `Can I import PDFs I already use in ${competitorName}?`,
      answer: `Yes. Export the PDF from ${competitorName}, upload it to Docracy, and place (or auto-detect) signature fields. See the /import-from-* guides for step-by-step export tips.`,
    },
  ];
}

export const ALTERNATIVE_PAGES: AlternativePageContent[] = [
  {
    slug: "eversign-alternative",
    competitorName: "eversign",
    navDesc: "Faster, simpler signing flow.",
    seoTitle: "Eversign Alternative — Free, No Account | Docracy",
    seoDescription:
      "Free Eversign / Xodo Sign alternative for NDAs and client contracts. No account for signers, free for up to 2 signers — flat $10/mo paid, not per-seat.",
    heroHeadline: "A lightweight alternative to Eversign.",
    heroSubheadline: "Built for quick, low-stakes agreements — not enterprise workflows.",
    problem:
      "Eversign (now rebranded Xodo Sign) is a genuinely solid tool, but it requires an account on every plan, " +
      "including the free tier, and its Professional plan prices per user — a cost that grows with your team even " +
      "if your actual signing volume doesn't.",
    solution:
      "Docracy.io focuses on speed, simplicity, and clean signing: a free tier with no account required for a short " +
      "signing chain, and a flat per-workspace price on paid plans instead of a per-seat one.",
    comparison: [
      "No subscriptions for simple agreements — up to 2 signers, completely free",
      "No account required for recipients",
      "Faster, distraction-free signing flow",
      "AI-assisted field placement (paid accounts)",
      "WhatsApp signing links — Eversign doesn't offer this; Docracy includes 1 free/month",
      "Perfect for NDAs, client contracts, and onboarding docs",
      "Flat $10/month paid plan regardless of team size — not per user",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-eversign-alternative",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See the full price comparison vs. eversign",
  },
  {
    slug: "onlinesignature-alternative",
    competitorName: "OnlineSignature",
    navDesc: "No account funnel into Xodo Sign.",
    seoTitle: "OnlineSignature.com Alternative — Free, No Account | Docracy",
    seoDescription:
      "OnlineSignature.com still routes you into a Xodo Sign / Eversign account to actually send or track a document. Docracy is free for up to 2 signers, no account, ever.",
    heroHeadline: "OnlineSignature.com still wants you to create an account. Docracy doesn't.",
    heroSubheadline: "It's a free front door to Xodo Sign (formerly Eversign) — the moment you want to send or track a document, you're signing up for an account.",
    problem:
      "OnlineSignature.com markets itself as a free way to sign PDFs, Word docs, and images, but it's actually a " +
      "landing page for Xodo Sign (the product formerly known as Eversign). Basic signing works without much " +
      "friction, but sending a document, tracking its status, or getting notified when someone signs all push you " +
      "into creating a full Xodo Sign account — the exact step someone looking for a genuinely free, no-signup " +
      "signing tool was trying to avoid.",
    solution:
      "Docracy.io skips that entirely: documents with up to 2 signers are free forever, with no account required " +
      "for either the sender or the signer, not just for a one-time basic signature. You only need an account if " +
      "you want saved templates, team features, or more than 2 signers on a single document — and even then, " +
      "it's a flat $10/month, not a seat-based Xodo Sign plan.",
    comparison: [
      "No account required to send, track, or sign — not just for a one-off basic signature",
      "Free for up to 2 signers, permanently — not a trial funnel into a paid Xodo Sign account",
      "AI-assisted field placement (paid accounts)",
      "WhatsApp signing links — 1 free per month, then flat pricing, no equivalent on OnlineSignature/Xodo Sign",
      "Sequential or parallel signing built in, without a plan upgrade",
      "Flat $10/month if you outgrow the free tier — not per-seat",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-onlinesignature-alternative",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See the full price comparison vs. Xodo Sign / Eversign (OnlineSignature's parent product)",
  },
  {
    slug: "docusign-alternative",
    competitorName: "DocuSign",
    navDesc: "Lighter, no per-seat pricing.",
    seoTitle: "Free DocuSign Alternative (2026) — No Account, $10/mo Flat | Docracy",
    seoDescription:
      "DocuSign alternative without per-seat pricing or a 5-seat minimum. Free for up to 2 signers, no account required — flat $10/mo when you need more.",
    heroHeadline: "DocuSign is too heavy for simple agreements.",
    heroSubheadline: "Docracy.io is built for fast, lightweight signing.",
    problem:
      "DocuSign is great for enterprise workflows — identity verification, deep integrations, compliance " +
      "certifications — but that's overkill for NDAs, client contracts, and one-off agreements. Its commercial " +
      "plans also carry a per-seat minimum, so a two-person team can end up paying for licenses it doesn't use.",
    solution:
      "Docracy.io removes the friction and focuses on speed: no account required to send or sign a short chain of " +
      "documents, and flat per-workspace pricing on the paid plan instead of a per-seat one with a minimum.",
    comparison: [
      "Faster signing — no accounts, no delays",
      "No account required for recipients",
      "No subscriptions for simple agreements — up to 2 signers, completely free",
      "AI-assisted field placement (paid accounts)",
      "WhatsApp signing links — DocuSign doesn't offer this; Docracy includes 1 free/month",
      "Clean, distraction-free workflow",
      "No 5-seat minimum — Docracy's paid plan covers unlimited team members at one flat price",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-docusign-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See the full price comparison vs. DocuSign",
  },
  {
    slug: "hellosign-alternative",
    competitorName: "HelloSign / Dropbox Sign",
    navDesc: "Free for light NDA volume.",
    seoTitle: "HelloSign Alternative — Free for 2 Signers, No Account | Docracy",
    seoDescription:
      "HelloSign / Dropbox Sign alternative for NDAs and client contracts. Free for up to 2 signers, no account required — flat $10/mo paid, not per-seat.",
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
      "WhatsApp signing links — HelloSign doesn't offer this; Docracy includes 1 free/month",
      "Honest limit: not for ID-verified enterprise workflows",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-hellosign-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy prices vs seat-based e-sign tools",
  },
  {
    slug: "pandadoc-alternative",
    competitorName: "PandaDoc",
    navDesc: "No proposal suite you don't need.",
    seoTitle: "PandaDoc Alternative — Sign NDAs Without the Proposal Suite | Docracy",
    seoDescription:
      "PandaDoc alternative for NDAs and client contracts only — no CPQ or proposal builder. Free for up to 2 signers, no account required — flat $10/mo paid.",
    heroHeadline: "PandaDoc is overkill if you only need a signature.",
    heroSubheadline: "Docracy skips proposals and CPQ — just send the PDF and get it signed.",
    problem:
      "PandaDoc shines for quotes and proposals — CRM integrations, a content library, built-in payment collection. " +
      "If your job is “please sign this NDA / contractor agreement,” you’re paying for a sales stack you don’t use, " +
      "priced per seat on top of it.",
    solution:
      "Docracy is a lightweight signing path: upload or start from a free template, place fields, send. Free for 2 " +
      "signers with no account required on either side; paid is a flat $10/mo per workspace when you outgrow that, " +
      "with no per-seat math.",
    comparison: [
      "No proposal editor required for simple agreements",
      "Free ≤2 signers, no accounts",
      "Flat $10/mo paid — not per seat",
      "Templates for NDAs, contractor docs, client contracts",
      "WhatsApp signing links — PandaDoc doesn't offer this; Docracy includes 1 free/month",
      "Skip if you need full proposal + payments in one tool",
      "An MCP connector so AI assistants can create and send documents directly — PandaDoc has no equivalent",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-pandadoc-alternative",
    compareBlogSlug: "docracy-vs-pandadoc",
    compareLabel: "See the full price comparison vs. PandaDoc",
  },
  {
    slug: "adobe-sign-alternative",
    competitorName: "Adobe Acrobat Sign",
    navDesc: "Sign without an Adobe seat.",
    seoTitle: "Adobe Sign Alternative — Free, No Creative Cloud | Docracy",
    seoDescription:
      "Adobe Sign alternative without a Creative Cloud seat or annual lock-in. Free for up to 2 signers, no account required — flat $10/mo paid.",
    heroHeadline: "Adobe Sign without the Acrobat baggage.",
    heroSubheadline: "When you need a signature — not another Adobe seat in the stack.",
    problem:
      "Adobe Acrobat Sign makes sense inside Acrobat workflows — deep PDF editing, Creative Cloud integration, " +
      "identity verification options. For occasional NDAs and client agreements, it’s heavy and priced for teams " +
      "living in Adobe every day, with an annual commitment and a per-user transaction cap on top.",
    solution:
      "Docracy is a focused signing product: free for simple two-party docs with no account required, flat $10/mo " +
      "when you need more — no Creative Cloud subscription, annual lock-in, or transaction cap required.",
    comparison: [
      "No Adobe account for signers",
      "Free for up to 2 signers",
      "$10/mo flat when you need templates / more signers / team",
      "Works from any browser on phone or desktop",
      "WhatsApp signing links — Adobe Sign doesn't offer this; Docracy includes 1 free/month",
      "Not a full Acrobat replacement — deliberately lighter",
      "No annual commitment or per-user transaction cap",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-adobe-sign-alternative",
    compareBlogSlug: "docracy-vs-adobe-acrobat-sign",
    compareLabel: "See the full price comparison vs. Adobe Sign",
  },
  {
    slug: "contractbook-alternative",
    competitorName: "Contractbook",
    navDesc: "Signature without full CLM.",
    seoTitle: "Contractbook Alternative — Sign Without the Full CLM | Docracy",
    seoDescription:
      "Need a document signed, not a full contract lifecycle platform? Docracy is a focused, WhatsApp-native signing tool with reusable templates and a full audit trail.",
    heroHeadline: "Contractbook is a contract platform. Sometimes you just need a signature.",
    heroSubheadline: "Docracy is the focused signing step — reusable templates, WhatsApp delivery, a real audit trail.",
    problem:
      "Contractbook bundles contract lifecycle management into every plan — workspaces, automations, integrations, " +
      "a full contract repository. That's genuinely useful if you're managing a contract portfolio, but it's a lot " +
      "of platform to adopt (and pay for, by contract volume) when the actual job in front of you is getting one " +
      "document signed.",
    solution:
      "Docracy focuses on that one step: upload or start from a reusable template, place fields, send. Signers " +
      "never need an account, delivery can go by email, SMS, or a phone-bound, PIN-protected WhatsApp message, and " +
      "every step lands in an audit trail — without adopting a contract-management platform to get there.",
    comparison: [
      "No CLM to learn — upload and sign in under a minute",
      "WhatsApp-native signing (phone-bound, PIN-protected, delivery/read receipts) — Contractbook has no equivalent",
      "Signers never need an account, on any plan",
      "Reusable templates, plus a marketplace of community-submitted ones",
      "Flat $10/month on paid plans — not contract-volume-based pricing",
      "Honest limit: no contract repository, lifecycle automation, or clause library — for full CLM, Contractbook is the more complete tool",
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-contractbook-alternative",
    compareBlogSlug: "docracy-vs-pandadoc",
    compareLabel: "See how Docracy compares to full-featured contract platforms",
  },
  {
    slug: "signnow-alternative",
    competitorName: "SignNow",
    navDesc: "Skip airSlate seat tiers for simple docs.",
    seoTitle: "SignNow Alternative (2026) — Free, No airSlate Seat Tax | Docracy",
    seoDescription:
      "SignNow alternative without airSlate plan tiers. Free for up to 2 signers, no account required — flat $10/mo paid for templates and teams.",
    heroHeadline: "SignNow is solid. It still wants an account and a plan.",
    heroSubheadline: "Docracy is built for quick agreements — free for two signers, no signup required.",
    problem:
      "SignNow (airSlate) is a capable e-sign product, but free and entry plans still push accounts, feature gates, and upgrade paths that feel heavy when the job is an NDA or a client contract.",
    solution:
      "Docracy keeps the path short: upload or start from a free template, place fields, send. Up to 2 signers are free forever with no account for anyone; paid is a flat $10/mo workspace when you need more.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — SignNow doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-signnow-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy prices vs seat-based e-sign tools",
  },
  {
    slug: "zoho-sign-alternative",
    competitorName: "Zoho Sign",
    navDesc: "Sign without living in Zoho CRM.",
    seoTitle: "Zoho Sign Alternative — Simple Signing Outside Zoho | Docracy",
    seoDescription: "Need signatures without the Zoho suite? Docracy is free for up to 2 signers with no account required — flat $10/mo when you grow.",
    heroHeadline: "Zoho Sign makes sense inside Zoho. Outside it, maybe not.",
    heroSubheadline: "Docracy is a focused signing tool — not another Zoho app to adopt.",
    problem:
      "Zoho Sign is strongest when you already live in Zoho CRM/Books. For freelancers and small teams who only need a PDF signed, the Zoho account model and suite pricing are extra surface area.",
    solution:
      "Docracy is signing-only: free ≤2 signers, no accounts, WhatsApp delivery, flat $10/mo paid — without requiring a Zoho org.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — Zoho Sign doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows",
            "No Zoho org required for senders or signers"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-zoho-sign-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy prices vs suite-tied e-sign tools",
  },
  {
    slug: "onespan-alternative",
    competitorName: "OneSpan Sign",
    navDesc: "Lightweight path vs enterprise OneSpan.",
    seoTitle: "OneSpan Sign Alternative — Lightweight E-Sign | Docracy",
    seoDescription: "OneSpan Sign is built for regulated enterprise workflows. Docracy is the free, no-account path for everyday NDAs and client agreements.",
    heroHeadline: "OneSpan Sign is enterprise-grade. Most NDAs are not.",
    heroSubheadline: "Docracy is for the everyday agreement — not a digital banking compliance stack.",
    problem:
      "OneSpan Sign targets highly regulated industries with identity, compliance, and enterprise procurement. That depth is expensive and heavy for freelancers and small teams sending simple contracts.",
    solution:
      "Docracy stays SES-honest and fast: free for two-party docs, no account required, flat paid workspace pricing when you outgrow free.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — OneSpan Sign doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-onespan-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy compares to enterprise e-sign pricing",
  },
  {
    slug: "docuseal-alternative",
    competitorName: "DocuSeal",
    navDesc: "Hosted simplicity vs self-host setup.",
    seoTitle: "DocuSeal Alternative — Hosted E-Sign Without Self-Hosting | Docracy",
    seoDescription: "Like DocuSeal’s openness but don’t want to self-host? Docracy is a free hosted path for up to 2 signers — no account, no server to run.",
    heroHeadline: "DocuSeal is open-source. Docracy is zero-ops.",
    heroSubheadline: "Get documents signed without standing up infrastructure.",
    problem:
      "DocuSeal is excellent if you want to self-host an open-source signing stack. If you just need a signature this afternoon, deploying and maintaining DocuSeal is the wrong kind of work.",
    solution:
      "Docracy is hosted and immediate: upload, send, done — free for ≤2 signers, no account, with WhatsApp delivery and a short retention window by design.",
    comparison: [
            "No server, Docker, or admin console to run",
            "Free for up to 2 signers with no account",
            "WhatsApp signing links — 1 free/month on Docracy",
            "Flat $10/mo when you need templates / more signers / team",
            "Honest limit: not a self-hosted / open-source product — DocuSeal wins if you need that"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-docuseal-alternative",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See how Docracy compares to other lightweight e-sign tools",
  },
  {
    slug: "boldsign-alternative",
    competitorName: "BoldSign",
    navDesc: "Simpler path than Syncfusion BoldSign.",
    seoTitle: "BoldSign Alternative — Free Simple E-Sign | Docracy",
    seoDescription: "BoldSign alternative for freelancers and small teams. Free for up to 2 signers, no account required. Paid $10/mo flat.",
    heroHeadline: "A lighter alternative to BoldSign.",
    heroSubheadline: "Built for quick agreements — not developer-centric plan shopping.",
    problem:
      "BoldSign (Syncfusion) is a capable cloud e-sign product, but plan limits and account requirements still get in the way when you only need a short signing chain.",
    solution:
      "Docracy removes the account step for everyday docs: free ≤2 signers, flat $10/mo paid, WhatsApp delivery included.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — BoldSign doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-boldsign-alternative",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See how Docracy compares to other cloud e-sign tools",
  },
  {
    slug: "signrequest-alternative",
    competitorName: "SignRequest",
    navDesc: "Free two-signer path vs SignRequest plans.",
    seoTitle: "SignRequest Alternative — Free No-Account E-Sign | Docracy",
    seoDescription: "SignRequest alternative with a permanently free two-signer tier and no account required. Flat $10/mo when you need more.",
    heroHeadline: "SignRequest is friendly. Docracy is freer for short chains.",
    heroSubheadline: "No account for sender or signer on documents with up to two people.",
    problem:
      "SignRequest is approachable, but free/light plans still center on accounts and upgrade prompts once you leave the smallest volume.",
    solution:
      "Docracy keeps ≤2 signers free forever with no accounts, then a single flat paid workspace price.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — SignRequest doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-signrequest-alternative",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See how Docracy prices vs SignRequest-style tools",
  },
  {
    slug: "yousign-alternative",
    competitorName: "Yousign",
    navDesc: "Simple SES path vs EU Yousign tiers.",
    seoTitle: "Yousign Alternative — Simple E-Sign | Docracy",
    seoDescription: "Looking past Yousign for everyday agreements? Docracy is free for up to 2 signers, no account required — honest SES, not QES theater.",
    heroHeadline: "Yousign is strong in Europe. Docracy stays simple.",
    heroSubheadline: "When you need a signature — not a full EU e-sign product ladder.",
    problem:
      "Yousign offers polished EU e-sign tiers (including higher assurance options). For many freelancer and SMB NDAs, that ladder is more product than the job requires.",
    solution:
      "Docracy is deliberately SES-focused and fast: free two-party docs, no accounts, WhatsApp delivery, flat $10/mo paid.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — Yousign doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows",
            "Honest SES positioning — we do not pretend to be QES"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-yousign-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy compares to European e-sign tools",
  },
  {
    slug: "nitro-sign-alternative",
    competitorName: "Nitro Sign",
    navDesc: "Sign without a Nitro PDF suite seat.",
    seoTitle: "Nitro Sign Alternative — Lightweight E-Sign | Docracy",
    seoDescription: "Nitro Sign alternative without buying into the Nitro PDF suite. Free for up to 2 signers, no account required.",
    heroHeadline: "Nitro Sign sits inside a PDF suite. Docracy is signing-only.",
    heroSubheadline: "Get the agreement signed without another productivity suite seat.",
    problem:
      "Nitro Sign is tied to Nitro’s broader PDF productivity story. If you only need signatures, suite packaging and seat pricing are noise.",
    solution:
      "Docracy is a focused signing product: free ≤2 signers, no accounts, flat paid workspace pricing.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — Nitro Sign doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-nitro-sign-alternative",
    compareBlogSlug: "docracy-vs-adobe-acrobat-sign",
    compareLabel: "See how Docracy compares to PDF-suite e-sign add-ons",
  },
  {
    slug: "dochub-alternative",
    competitorName: "DocHub",
    navDesc: "No Google-account friction for signers.",
    seoTitle: "DocHub Alternative — Sign Without Google Lock-In | Docracy",
    seoDescription: "DocHub alternative for simple agreements. Free for up to 2 signers, no account required for senders or signers.",
    heroHeadline: "DocHub is convenient in Google. Signers still feel the account gravity.",
    heroSubheadline: "Docracy keeps recipients account-free for short signing chains.",
    problem:
      "DocHub works well for Google-centric editing and signing, but account and plan limits show up quickly for recurring client contracts outside that bubble.",
    solution:
      "Docracy skips Google-account assumptions: email/SMS/WhatsApp delivery, no account for ≤2-signer docs, flat $10/mo paid.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — DocHub doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-dochub-alternative",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See how Docracy compares to DocHub-style tools",
  },
  {
    slug: "signeasy-alternative",
    competitorName: "SignEasy",
    navDesc: "Mobile-friendly without SignEasy plans.",
    seoTitle: "SignEasy Alternative — Free Mobile-Friendly E-Sign | Docracy",
    seoDescription: "SignEasy alternative that works on phone browsers without pushing another subscription. Free for up to 2 signers.",
    heroHeadline: "SignEasy is mobile-first. Docracy is account-light.",
    heroSubheadline: "Sign from any phone browser — no app store trip required for recipients.",
    problem:
      "SignEasy markets mobile convenience, but plans and accounts still gate everyday freelancer volume.",
    solution:
      "Docracy is browser-native for senders and signers: free ≤2 signers, WhatsApp links, flat paid pricing.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — SignEasy doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-signeasy-alternative",
    compareBlogSlug: "docracy-vs-eversign",
    compareLabel: "See how Docracy compares to mobile e-sign apps",
  },
  {
    slug: "blueink-alternative",
    competitorName: "Blueink",
    navDesc: "Simpler than Blueink for light volume.",
    seoTitle: "Blueink Alternative — Free Simple E-Sign | Docracy",
    seoDescription: "Blueink alternative for NDAs and client contracts. Free for up to 2 signers, no account required. Paid $10/mo flat.",
    heroHeadline: "A simpler alternative to Blueink.",
    heroSubheadline: "For teams who need signatures collected — not another mid-market e-sign stack.",
    problem:
      "Blueink targets growing teams with feature-rich e-sign. For light NDA and contractor volume, that mid-market packaging is more than you need.",
    solution:
      "Docracy covers the light path: free two-party docs, no accounts, WhatsApp delivery, flat $10/mo paid.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — Blueink doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-blueink-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy prices vs mid-market e-sign tools",
  },
  {
    slug: "box-sign-alternative",
    competitorName: "Box Sign",
    navDesc: "Sign without living in Box storage.",
    seoTitle: "Box Sign Alternative — E-Sign Outside Box | Docracy",
    seoDescription: "Need signatures without a Box enterprise content cloud? Docracy is free for up to 2 signers with no account required.",
    heroHeadline: "Box Sign assumes you live in Box. Many agreements don’t.",
    heroSubheadline: "Docracy is signing without adopting an enterprise content platform.",
    problem:
      "Box Sign is natural if your files already live in Box. If they don’t, buying into Box for e-sign alone is a heavy detour.",
    solution:
      "Upload a PDF to Docracy and send — free ≤2 signers, no Box seats, WhatsApp optional delivery.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — Box Sign doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows",
            "No Box storage plan required"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-box-sign-alternative",
    compareBlogSlug: "docracy-vs-docusign",
    compareLabel: "See how Docracy compares to content-cloud e-sign add-ons",
  },
  {
    slug: "getaccept-alternative",
    competitorName: "GetAccept",
    navDesc: "Signatures without sales-room theater.",
    seoTitle: "GetAccept Alternative — Sign Without the Sales Room | Docracy",
    seoDescription: "GetAccept alternative when you need a signature, not a digital sales room. Free for up to 2 signers, no account required.",
    heroHeadline: "GetAccept is a sales platform. Sometimes you just need a signature.",
    heroSubheadline: "Docracy skips the digital sales room — upload, send, done.",
    problem:
      "GetAccept bundles e-sign into buyer engagement / sales-room workflows. Useful for complex deals; overkill for an NDA or contractor agreement.",
    solution:
      "Docracy is the signing step only: free ≤2 signers, no accounts, flat $10/mo paid, WhatsApp delivery.",
    comparison: [
            "Free for up to 2 signers — no account for sender or signer",
            "Flat $10/month paid plan — not per seat",
            "WhatsApp signing links — GetAccept doesn't offer this; Docracy includes 1 free/month",
            "AI-assisted field placement on paid accounts",
            "Sequential or parallel signing built in",
            "Honest limit: not for ID-verified enterprise / QES workflows",
            "No sales-room or content engagement suite required"
    ],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=seo-getaccept-alternative",
    compareBlogSlug: "docracy-vs-pandadoc",
    compareLabel: "See how Docracy compares to sales-room e-sign tools",
  },
  {
    slug: "kita-alternative",
    competitorName: "Kita",
    xDefault: "es",
    navDesc: "WhatsApp cobro without becoming a PAC.",
    seoTitle: "Kita Alternative — WhatsApp Pay + File, No CFDI | Docracy",
    seoDescription:
      "Kita alternative if you need the PDF and your Mercado Pago link on WhatsApp — not a stamped CFDI. $10/mo, 0% of the payment. Signing stays free.",
    heroHeadline: "Kita stamps the invoice. Docracy sends the file and your checkout.",
    heroSubheadline:
      "Paste Mercado Pago or PayPal, attach the PDF, text the pay page. We never take the money and we do not timbrar CFDI.",
    problem:
      "Kita is a strong Mexico product: WhatsApp in, Mercado Pago charge, CFDI 4.0 out. That is the wrong stack if you already have a checkout and you need a signed contract plus a page the client can pay — not a PAC, CSD, or timbre balance.",
    solution:
      "Docracy cobro is file + your https checkout. Signing stays a separate free product. Paid ($10/month) keeps the PDF through tax season and unlocks WhatsApp cobro, constancia, and the accountant CSV. We are not Kita and we do not claim SAT invoicing.",
    comparison: [
      "0% of the payment — you paste Mercado Pago, PayPal.me, or Stripe",
      "No CFDI, no PAC, no CSD — honest limit, written on the page",
      "Optional signature first (free ≤2), then cobro without a second sign",
      "Tax-year vault + CSV for your accountant; constancia you can forward",
      "Currencies labeled USD, MXN, COP, ARS, CLP, PEN, BRL",
      "WhatsApp uses the live invite — not a new Meta template",
      "Kita is better if you need autofactura CFDI after every charge",
    ],
    ctaLabel: "Send a cobro — file + Mercado Pago",
    ctaTo: "/cobro#send",
    compareTo: "/kita-vs-alegra",
    compareLabel: "Kita vs Alegra vs Docracy",
    faqs: [
      {
        question: "Is Docracy a Kita alternative for CFDI?",
        answer:
          "No. Kita stamps CFDI 4.0 through a PAC. Docracy never does that. Use Kita (or Alegra) when the client needs a SAT invoice. Use Docracy when they need a signed PDF and a pay link you already own.",
      },
      {
        question: "Do you take a cut like a payment app?",
        answer: "No. Paid is $10/month. Mercado Pago or PayPal still charge their own processor fees — that is not us.",
      },
      {
        question: "Can I sign and then collect?",
        answer: "Yes. Send the contract from Prepare (free up to two signers). After it is signed, send cobro with the same checkout you already use.",
      },
    ],
    faqsEs: [
      {
        question: "¿Docracy es alternativa a Kita para CFDI?",
        answer:
          "No. Kita timbra CFDI 4.0 con un PAC. Docracy nunca hace eso. Usa Kita (o Alegra) cuando el cliente necesita factura SAT. Usa Docracy cuando necesita un PDF firmado y un link de cobro que ya tienes.",
      },
      {
        question: "¿Se llevan un porcentaje como una app de pagos?",
        answer: "No. El plan son $10/mes. Mercado Pago o PayPal cobran su comisión — eso no somos nosotros.",
      },
      {
        question: "¿Puedo firmar y luego cobrar?",
        answer:
          "Sí. Envía el contrato desde Preparar (gratis hasta dos firmantes). Cuando esté firmado, manda el cobro con el mismo checkout.",
      },
    ],
  },
  {
    slug: "alegra-alternative",
    competitorName: "Alegra",
    xDefault: "es",
    navDesc: "Sign and get paid — not a full ledger.",
    seoTitle: "Alegra Alternative — Sign & WhatsApp Cobro, Not Books | Docracy",
    seoDescription:
      "Alegra alternative when you need a signature and your Mercado Pago link — not PAC invoicing or a full ledger. Free signing ≤2. Paid $10/mo, 0% cut.",
    heroHeadline: "Alegra keeps the books. Docracy gets the contract signed and the file paid.",
    heroSubheadline:
      "WhatsApp cobro with your checkout. No CFDI timbre. Not a replacement for your accountant.",
    problem:
      "Alegra is accounting plus authorized e-invoicing, with a WhatsApp bot that issues CFDI. Freelancers who only need “sign this, then pay this link” should not buy a ledger and a timbre pack.",
    solution:
      "Docracy is the signing step and the pay+file page. Paste Mercado Pago. Keep PDFs until tax season on Paid. Constancia is a shareable index — not a SAT constancia de situación fiscal.",
    comparison: [
      "Free sequential e-sign for up to two people, no account for signers",
      "Cobro: PDF + your Mercado Pago / PayPal page, no extra signature",
      "Not a PAC — we do not stamp CFDI or replace Alegra books",
      "$10/mo, 0% of collections",
      "Income-proof packet and accountant CSV from files you already sent",
      "Alegra is better when you need official invoices and a chart of accounts",
    ],
    ctaLabel: "Send cobro or start a free signature",
    ctaTo: "/cobro#send",
    compareTo: "/alegra-vs-siigo",
    compareLabel: "Alegra vs Siigo vs Docracy",
    faqs: [
      {
        question: "Will Docracy replace Alegra for SAT invoices?",
        answer: "No. Alegra (as a PAC) stamps CFDI. We attach the PDF you already have and send your checkout.",
      },
      {
        question: "Is this Stripe Connect?",
        answer: "No. You paste a checkout URL you already own.",
      },
    ],
    faqsEs: [
      {
        question: "¿Docracy reemplaza a Alegra para facturas SAT?",
        answer: "No. Alegra (como PAC) timbra CFDI. Nosotros adjuntamos el PDF que ya tienes y mandamos tu checkout.",
      },
      {
        question: "¿Esto es Stripe Connect?",
        answer: "No. Pegas una URL de checkout que ya tienes.",
      },
    ],
  },
  {
    slug: "siigo-alternative",
    competitorName: "Siigo",
    xDefault: "es",
    navDesc: "WhatsApp pay page — not DIAN billing.",
    seoTitle: "Siigo Alternative — WhatsApp Cobro, Not DIAN Billing | Docracy",
    seoDescription:
      "Siigo alternative when you need a signed PDF and your pay link on WhatsApp — not a DIAN electronic invoice. $10/mo, 0% of the payment.",
    heroHeadline: "Siigo files the invoice with DIAN. Docracy sends the file and your checkout.",
    heroSubheadline:
      "For US↔Colombia contractors who already have Nequi, Mercado Pago, or PayPal — not a replacement for Siigo’s books.",
    problem:
      "Siigo is built for Colombian electronic invoicing at scale, including WhatsApp issuance. That is compliance software. A designer in Bogotá collecting from a US studio usually needs a contract, a PDF, and a pay link — not a DIAN document.",
    solution:
      "Docracy: free NDA + contractor agreement, then Paid cobro on WhatsApp with your checkout. We do not submit to DIAN.",
    comparison: [
      "No DIAN stamp — we will not pretend otherwise",
      "File + your checkout on WhatsApp, 30-day reminder, mark paid",
      "Signing free for two people; Paid keeps the archive",
      "Spanish /es front door into cobro and constancia",
      "Siigo is better if you must issue DIAN-authorized invoices",
    ],
    ctaLabel: "Send a cobro on WhatsApp",
    ctaTo: "/cobro#send",
    compareTo: "/kita-vs-siigo",
    compareLabel: "Kita vs Siigo vs Docracy",
    faqs: [
      {
        question: "Does Docracy issue a factura electrónica DIAN?",
        answer: "No. Siigo does. We host the PDF you attach and the pay page.",
      },
    ],
    faqsEs: [
      {
        question: "¿Docracy emite factura electrónica DIAN?",
        answer: "No. Eso lo hace Siigo. Nosotros hospedamos el PDF que adjuntas y la página de cobro.",
      },
    ],
  },
  {
    slug: "boundless-alternative",
    competitorName: "Boundless",
    xDefault: "es",
    audience: "immigrant",
    navDesc: "Sign the visa packet — they file the petition.",
    seoTitle: "Boundless Alternative (2026) — Sign Visa Docs, $10/mo | Docracy",
    seoDescription:
      "Boundless files USCIS petitions (see their site for price). Docracy is the $10/mo supporting packet: official I-9, offer, POA, constancia. We don't file.",
    heroHeadline: "Boundless files your case. Docracy signs the packet around it.",
    heroSubheadline:
      "They prepare and file USCIS forms — see their site for price. We sign I-9, offer, visa extras, give you the official send-to links, and save every PDF so you can reopen it. $10/month. We do not file I-129 or DS-160.",
    problem:
      "Boundless is the right buy if you need someone to prepare and file a petition. That is hundreds to thousands — check their pricing; we will not invent a number. It is the wrong buy if you already have a lawyer, an employer who files, or you only need the extras signed: I-9, offer letter, POA, reference, constancia for a Houston lease.",
    solution:
      "Unlock the one Paid plan ($10/month). Sign the official I-9 and the supporting templates. We save every PDF so you can reopen it. Official send-to links stay on the plan page. Share a constancia URL. Send cobro if you still invoice. If you still need Boundless to file, keep them — attach our signed PDFs.",
    comparison: [
      "$10/month for the all-in-one supporting plan. Boundless FAQ (11 Jun 2026): marriage green card $699 / $1,349 Premium; K-1 $1,379 / $2,549; B-1/B-2 $195 + $185 State fee. Government fees extra.",
      "Official I-9 + offer, POA, reference, lease — we save every PDF so you can reopen it. We don't file the petition.",
      "Official send-to links: employer keeps I-9; lawyer/consulate gets the rest; you file DS-160 on CEAC",
      "They bill in USD. Paid is also USD $10 on Stripe. Cobro amounts you label MXN/COP/USD — that money never hits us.",
      "Boundless is better if you need them to prepare and file. We are the $10 extras around that filing.",
    ],
    ctaLabel: "Unlock the all-in-one plan — $10/month",
    ctaTo: "/packets/latam-to-us",
    compareTo: "/boundless-vs-citizenpath",
    compareLabel: "Boundless vs CitizenPath vs Docracy",
    faqs: [
      {
        question: "Is Docracy a Boundless alternative for filing?",
        answer:
          "No. Boundless prepares and files USCIS petitions. We sign the supporting packet (I-9, offer, POA, reference, lease), save it so you can reopen it, and tell you where to send each file. Use Boundless if you need them to file. Use Docracy if you already have a filer or only need the extras signed.",
      },
      {
        question: "What does Boundless charge?",
        answer:
          "Their FAQ dated 11 June 2026 lists flat service fees: marriage green card $699 Essential / $1,349 Premium; K-1 $1,379 / $2,549; visitor B-1/B-2 $195 plus the $185 State fee; naturalization from $699; EB-1A $8,000–$8,500. USCIS/State fees are extra. If their services page differs, trust that page. We charge $10/month for the supporting packet — not a case fee.",
      },
      {
        question: "Can I use both?",
        answer:
          "Yes. Let Boundless (or your attorney) file. Sign the extras here and attach the PDFs. The immigrant kit maps who receives each file.",
      },
      {
        question: "What currency does Boundless charge?",
        answer:
          "USD. Their checkout marks priceCurrency USD. A Mexican or Colombian card still pays in dollars — your bank converts and may add a foreign-transaction fee. USCIS fees are also USD; Form G-1450 needs a U.S.-issued card. Docracy Paid is USD $10 on Stripe. Cobro amounts you label (MXN, COP, USD) go to your Mercado Pago or PayPal, not us.",
      },
    ],
    faqsEs: [
      {
        question: "¿Docracy es alternativa a Boundless para presentar?",
        answer:
          "No. Boundless prepara y presenta peticiones ante USCIS. Nosotros firmamos el paquete de apoyo (I-9, oferta, poder, referencia, arrendamiento), lo guardamos para que lo reabras y te decimos a dónde va cada archivo. Usa Boundless si necesitas que presenten. Usa Docracy si ya tienes quien presente o solo necesitas firmar los extras.",
      },
      {
        question: "¿Cuánto cobra Boundless?",
        answer:
          "Su FAQ del 11 de junio de 2026 lista cuotas fijas: green card por matrimonio $699 Essential / $1,349 Premium; K-1 $1,379 / $2,549; visitante B-1/B-2 $195 más $185 de State; naturalización desde $699; EB-1A $8,000–$8,500. Las cuotas de USCIS/State van aparte. Si su página de servicios dice otra cosa, esa manda. Nosotros cobramos $10/mes por el paquete de apoyo — no una cuota de caso.",
      },
      {
        question: "¿Puedo usar los dos?",
        answer:
          "Sí. Que Boundless (o tu abogado) presente. Firma los extras aquí y adjunta los PDF. El kit inmigrante mapa quién recibe cada archivo.",
      },
      {
        question: "¿En qué moneda cobra Boundless?",
        answer:
          "USD. Su checkout marca priceCurrency USD. Una tarjeta de México o Colombia igual paga en dólares — el banco convierte y puede cobrar comisión internacional. USCIS también cobra en USD; el G-1450 pide tarjeta emitida en EE. UU. El plan de Docracy es USD $10 en Stripe. Los montos de cobro (MXN, COP, USD) van a tu Mercado Pago o PayPal, no a nosotros.",
      },
    ],
  },
  {
    slug: "citizenpath-alternative",
    competitorName: "CitizenPath",
    xDefault: "es",
    audience: "immigrant",
    navDesc: "Supporting docs — not DIY USCIS forms.",
    seoTitle: "CitizenPath Alternative (2026) — Supporting Docs, Not USCIS Forms | Docracy",
    seoDescription:
      "CitizenPath prepares DIY USCIS forms. Docracy signs the extras they ask you to attach — I-9, offer, POA — $10/mo. We don't prepare I-129.",
    heroHeadline: "CitizenPath prepares the petition PDF. Docracy signs what they told you to attach.",
    heroSubheadline:
      "DIY USCIS form software is a different job. We sign I-9, offer, and supporting letters, give you the official links, and save every PDF — $10/month. We don't prepare I-129, I-130, or I-485.",
    problem:
      "CitizenPath is built to walk you through USCIS forms and let you file. Useful if you want cheaper DIY than a full-service shop. Useless if what you actually need is the signed extras: I-9 for the employer, an offer letter, a POA, a constancia a Miami landlord will open.",
    solution:
      "Keep CitizenPath (or a lawyer) for the petition PDF. Unlock the one Docracy plan for the supporting packet, official send-to links, and a vault you can reopen. We do not replace their form software and we do not file.",
    comparison: [
      "$10/month vs CitizenPath packages they publish: from $79–$99; I-130 / I-129F $149; I-485 packet $279; N-400 $199. USCIS fees extra.",
      "We sign official I-9 and supporting extras they ask you to attach — and we save them so you can reopen later",
      "We do not prepare or file I-129 / I-130 / I-485 / DS-160",
      "They bill in USD. Paid is USD $10. Cobro you label in MXN/COP/USD — Docracy never takes that payment.",
      "CitizenPath is better when you need DIY USCIS forms. Use both if they asked for signed extras.",
    ],
    ctaLabel: "Unlock the all-in-one plan — $10/month",
    ctaTo: "/packets/latam-to-us",
    compareTo: "/boundless-vs-citizenpath",
    compareLabel: "Boundless vs CitizenPath vs Docracy",
    faqs: [
      {
        question: "What does CitizenPath charge?",
        answer:
          "They publish per-package prices: from $79–$99, I-130 $149, K-1 (I-129F) $149, adjustment of status packet $279, naturalization (N-400) $199. USCIS filing fees are separate (I-485 is $1,440 for most adults). We are $10/month for signed extras — we don't prepare those forms.",
      },
      {
        question: "Will Docracy prepare my I-129 or I-485?",
        answer: "No. That is CitizenPath (or an attorney). We sign the supporting PDFs they told you to attach.",
      },
      {
        question: "Do you file DS-160?",
        answer: "No. DS-160 is CEAC (State Department). We link the official site on the immigrant kit. Sign supporting letters here, then upload where CEAC says.",
      },
      {
        question: "What currency does CitizenPath charge?",
        answer:
          "USD, same as Boundless. USCIS filing fees are USD. Docracy Paid is USD $10. The cobro you send a client can be labeled MXN or COP because that checkout is yours.",
      },
    ],
    faqsEs: [
      {
        question: "¿Cuánto cobra CitizenPath?",
        answer:
          "Publican por paquete: desde $79–$99, I-130 $149, K-1 (I-129F) $149, ajuste de estatus $279, naturalización (N-400) $199. Las cuotas de USCIS van aparte (I-485 son $1,440 para la mayoría de adultos). Nosotros $10/mes por los extras firmados — no preparamos esos formularios.",
      },
      {
        question: "¿Docracy prepara mi I-129 o I-485?",
        answer: "No. Eso es CitizenPath (o un abogado). Firmamos los PDF de apoyo que te pidieron adjuntar.",
      },
      {
        question: "¿Presentan el DS-160?",
        answer:
          "No. El DS-160 es CEAC (Departamento de Estado). Enlazamos el sitio oficial en el kit inmigrante. Firma las cartas aquí y súbelas donde CEAC lo pida.",
      },
      {
        question: "¿En qué moneda cobra CitizenPath?",
        answer:
          "USD, igual que Boundless. Las cuotas de USCIS son USD. El plan de Docracy es USD $10. El cobro que mandas al cliente lo puedes etiquetar en MXN o COP porque ese checkout es tuyo.",
      },
    ],
  },
  {
    slug: "visa-service-alternative",
    competitorName: "Gestoría de visa",
    xDefault: "es",
    audience: "immigrant",
    navDesc: "Signed packet — they present the trámite.",
    seoTitle: "Visa Service / Gestoría Alternative — $10 Packet, Not a Filing | Docracy",
    seoDescription:
      "Gestoría de visa alternative: one $10/mo plan — I-9, offer, official links, and every PDF saved. We don't file the petition. Spanish-first: /es/kit-llegar-eeuu.",
    heroHeadline: "A gestoría presents the case. Docracy is the signed packet you hand them.",
    heroSubheadline:
      "Tramitadores file. We sign I-9, offer, POA, reference, give you the official links, and save every PDF so you can reopen it — $10/month. Not a substitute for the trámite.",
    problem:
      "A gestoría de visa or tramitador is the right hire if you need someone to assemble and present the petition. They charge per case — often hundreds to thousands. It is the wrong hire if you already have that person (or an employer/lawyer) and you only need the extras signed and a place that says where each file goes.",
    solution:
      "One Paid plan is the all-in-one package: what to do, official send-to links, I-9 and templates we already ship, constancia, cobro — and we save every file. Give the signed PDFs to your gestoría. We do not present at USCIS or the consulate.",
    comparison: [
      "$10/month for the signed extras. MX gestorías we checked publish ~$900–$3,800 MXN for DS-160 / tourist help, plus the $185 USD State fee. Not one company — check theirs.",
      "Official I-9 + offer, employment, POA, reference, child travel, lease",
      "Map of who receives each file (employer, USCIS retain, CEAC, landlord) — we don't upload for you",
      "Gestoría honorarios: usually MXN (COP in Colombia). State MRV $185 USD. Our Paid plan is USD $10; cobro labels are yours.",
      "Hire a gestoría when you need them to file. Use Docracy when you need the packet signed.",
    ],
    ctaLabel: "Unlock the all-in-one plan — $10/month",
    ctaTo: "/packets/latam-to-us",
    compareTo: "/boundless-vs-citizenpath",
    compareLabel: "Boundless vs CitizenPath vs Docracy",
    faqs: [
      {
        question: "What do gestorías charge?",
        answer:
          "There is no one price. Mexican shops we checked publish about $900–$3,800 MXN for DS-160 / tourist-visa help (CitaYa $2,000, Visas de Coyoacán $1,200, Super Visas Express $3,800). They bill honorarios in MXN; the $185 State MRV is USD (your bank converts). Colombia shops quote in COP. Boundless and CitizenPath bill their software in USD. Docracy Paid is USD $10; cobro labels are yours.",
      },
      {
        question: "¿Docracy sustituye a una gestoría de visa?",
        answer:
          "No. Una gestoría o tramitador presenta. Nosotros firmamos el paquete de apoyo y te decimos a quién mandarlo. Si necesitas que alguien presente, contrátalos. Si ya los tienes, usa esto.",
      },
      {
        question: "Do you submit to the consulate?",
        answer: "No. Official links on the immigrant kit open CEAC and travel.state.gov. You (or your gestoría) upload.",
      },
    ],
    faqsEs: [
      {
        question: "¿Cuánto cobra una gestoría?",
        answer:
          "No hay un solo precio. En México, gestoras que revisamos publican unos $900–$3,800 MXN por ayuda con DS-160 / visa de turista (CitaYa $2,000, Visas de Coyoacán $1,200, Super Visas Express $3,800). Los honorarios van en MXN; los $185 de State son USD (el banco convierte). En Colombia cotizan en COP. Boundless y CitizenPath cobran su software en USD. El plan de Docracy es USD $10; las etiquetas de cobro son tuyas.",
      },
      {
        question: "¿Docracy sustituye a una gestoría de visa?",
        answer:
          "No. Una gestoría o tramitador presenta. Nosotros firmamos el paquete de apoyo y te decimos a quién mandarlo. Si necesitas que alguien presente, contrátalos. Si ya los tienes, usa esto.",
      },
      {
        question: "¿Envían al consulado?",
        answer: "No. Los links oficiales del kit abren CEAC y travel.state.gov. Tú (o tu gestoría) subes.",
      },
    ],
  },
];

/** One page per competitor: no "connect your account" button anywhere — confirmed via direct
 *  research that none of these platforms offer a free, self-serve, general-purpose bulk-export API a
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
  /** Longer intro under the hero — what this guide covers and who it's for. */
  intro: string;
  whyNoConnect: string;
  exportSteps: string[];
  templateNote: string;
  /** What actually comes with you as a PDF vs what stays locked in the old tool. */
  whatTransfers: string[];
  /** Practical tips unique to this platform. */
  tips: string[];
  alternativeSlug: string;
}

export const IMPORT_GUIDE_PAGES: ImportGuideContent[] = [
  {
    slug: "docusign",
    competitorName: "DocuSign",
    seoTitle: "Import DocuSign Documents to Docracy — Free Export Guide",
    seoDescription:
      "Step-by-step guide to export DocuSign envelopes and templates as PDFs and upload them to Docracy. No account linking, no password sharing — AI field detection places signatures for you.",
    heroHeadline: "Bring your DocuSign documents to Docracy",
    heroSubheadline:
      "No account-linking, no handing over your DocuSign password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving DocuSign don't need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already signed (or the templates they reuse) available in a lighter tool. This guide covers the free, built-in DocuSign download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "DocuSign's API only gets real access to your account once production API access is enabled on it — something most personal and small-business plans don't have by default. We also don't ask for your DocuSign password to \"connect your account\"; that's off-limits here regardless. So there's no one-click import button — and there shouldn't be.",
    exportSteps: [
      "Sign in to DocuSign and open Manage (or the Documents / Templates view on your plan).",
      "Open the completed envelope or reusable template you want to bring over.",
      "Choose Download — for a completed envelope this gives you the signed PDF (often with a certificate of completion attached); for a template, DocuSign exports a package containing the source document.",
      "Save the PDF somewhere you can find it (Downloads, Drive, Dropbox).",
      "Repeat for each document or template you want to keep using — DocuSign does not give individual accounts a free bulk \"download everything\" button.",
    ],
    templateNote:
      "Templates export as a DocuSign-specific package — the underlying PDF comes with it, but the field and routing setup is proprietary and won't transfer directly. You'll re-place fields in Docracy (AI Auto-Detect usually gets you most of the way).",
    whatTransfers: [
      "The signed PDF of completed envelopes — including the visual signature appearance DocuSign burned into the file.",
      "The source PDF (or Word-derived PDF) from a reusable template package.",
      "Does not transfer: DocuSign tabs/fields, recipient routing order, identity verification settings, or the DocuSign Certificate of Completion as a live Docracy audit trail (keep the PDF if you need that certificate).",
    ],
    tips: [
      "Start with templates you reuse monthly (NDAs, offer letters) — one upload + AI field detection turns them into a Docracy template on a paid plan.",
      "If an envelope has multiple documents, download each PDF you still need rather than assuming a single ZIP covers everything on every plan.",
      "Completed DocuSign files are fine to re-upload for a new round of signatures; treat them as the source PDF, not a live DocuSign envelope.",
    ],
    alternativeSlug: "docusign-alternative",
  },
  {
    slug: "eversign",
    competitorName: "eversign (Xodo Sign)",
    seoTitle: "Import eversign / Xodo Sign Documents to Docracy",
    seoDescription:
      "Export eversign (now Xodo Sign) documents as PDFs and bring them into Docracy. No account linking — free per-document download, then AI field detection on upload.",
    heroHeadline: "Bring your eversign / Xodo Sign documents to Docracy",
    heroSubheadline:
      "No account-linking, no handing over your eversign password. Export the PDFs you already have from eversign or Xodo Sign.",
    intro:
      "eversign rebranded as Xodo Sign, but the product people still search for as \"eversign\" is the same signing workspace. If you're moving off a free or light eversign/Xodo plan because of account requirements or per-user pricing, this is the manual export path — then Docracy's upload + AI field detection for the next send.",
    whyNoConnect:
      "eversign / Xodo Sign's API is free only for a tiny number of test envelopes — real production access starts on a paid API plan, which most individual accounts don't carry. We also won't ask for your password to link accounts.",
    exportSteps: [
      "Sign in to eversign or Xodo Sign and open Documents.",
      "Check both the Completed and Drafts (or In Progress) tabs, depending on what you need.",
      "Open the document and choose Download / Download PDF.",
      "Save the file, then repeat for each document — there is no free bulk \"download all\" for typical individual accounts.",
    ],
    templateNote:
      "No portable export path for templates — they live in eversign/Xodo's own system. The underlying source document usually downloads as a normal PDF; field placement does not.",
    whatTransfers: [
      "Completed document PDFs with signatures flattened into the file.",
      "Draft/source PDFs you can re-upload and re-field in Docracy.",
      "Does not transfer: eversign/Xodo templates, signer order automation, or in-app audit metadata as a live Docracy trail.",
    ],
    tips: [
      "If you mainly used OnlineSignature.com, you're already in the Xodo Sign / eversign world — export from that signing account, then continue here or see the OnlineSignature import guide.",
      "Reusable NDAs: download the cleanest unsigned source PDF if you have it, not only the last signed copy.",
      "After upload in Docracy, run AI Auto-Detect once and save as a template on paid if you'll send it often.",
    ],
    alternativeSlug: "eversign-alternative",
  },
  {
    slug: "hellosign",
    competitorName: "HelloSign (Dropbox Sign)",
    seoTitle: "Import HelloSign / Dropbox Sign Documents to Docracy",
    seoDescription:
      "Export HelloSign (Dropbox Sign) signature requests as PDFs and upload them to Docracy. No account linking — free per-document download with clear steps.",
    heroHeadline: "Bring your HelloSign / Dropbox Sign documents to Docracy",
    heroSubheadline:
      "No account-linking, no handing over your Dropbox Sign password. Export the PDFs you already have.",
    intro:
      "HelloSign is now Dropbox Sign. The UI moved to sign.dropbox.com, but the job is the same: get your signed PDFs (and the source files behind templates) out without buying an API plan. This guide is the free download path, then how Docracy continues the signing workflow.",
    whyNoConnect:
      "Dropbox Sign's free API mode only produces watermarked, non-binding test documents — it can't pull your real signed files. Real production API access sits on separate paid API tiers, priced above the consumer plans most people are on. We won't ask for your Dropbox password either.",
    exportSteps: [
      "Sign in at sign.dropbox.com (or the Dropbox Sign app you already use).",
      "Open a completed signature request from your Documents / Activity list.",
      "Choose Download, Download PDF, or Download Signed ZIP.",
      "If you need the original template source, open the template and download the underlying PDF or Word file when the UI offers it.",
      "Repeat for each document — one-click bulk export needs Team Sync / admin features, not available on typical individual plans.",
    ],
    templateNote:
      "Templates are stored in Dropbox Sign's own template system with no documented one-click \"export template with fields\" for individuals — the source PDF or Word file is standard, but the reusable field layout is proprietary.",
    whatTransfers: [
      "Signed PDFs and signed ZIPs of completed requests.",
      "Source PDF/Word files when you download them from a template or draft.",
      "Does not transfer: Dropbox Sign template field layers, signer roles, or SMS/identity add-ons as live Docracy settings.",
    ],
    tips: [
      "Prefer Download PDF when you only need the final signed file; use Signed ZIP if you also want attachments Dropbox Sign bundled.",
      "For recurring NDAs, keep an unsigned master PDF in Drive/Dropbox and upload that to Docracy as your template source.",
      "WhatsApp signing is available on Docracy after you migrate — Dropbox Sign has no equivalent WhatsApp delivery path.",
    ],
    alternativeSlug: "hellosign-alternative",
  },
  {
    slug: "pandadoc",
    competitorName: "PandaDoc",
    seoTitle: "Import PandaDoc Documents to Docracy — PDF & DocX Export",
    seoDescription:
      "Export PandaDoc documents and templates (PDF or DocX) and bring them into Docracy. Easiest of the major tools to migrate — no account linking required.",
    heroHeadline: "Bring your PandaDoc documents to Docracy",
    heroSubheadline:
      "No account-linking, no handing over your PandaDoc password. Export PDFs or Word files you already have — PandaDoc's DocX export is the most portable of the major tools.",
    intro:
      "PandaDoc mixes proposals, CPQ-ish content blocks, and e-sign. If you only need the signed agreement (or a reusable contract PDF) in a simpler signer tool, export from PandaDoc first. DocX Export is unusually helpful: you get a real Word file, not only a locked PDF package.",
    whyNoConnect:
      "PandaDoc's free API sandbox is real but capped at a low annual document count — production use beyond that needs a paid API Developer plan most free-plan accounts don't carry. We won't ask for your PandaDoc password to \"connect\" anything.",
    exportSteps: [
      "Sign in to PandaDoc and open Documents (or Templates).",
      "Open the completed document or the template you want to reuse.",
      "Download as PDF for a finished signed copy, or use DocX Export when you want an editable Word file.",
      "Save the file locally or to your Drive.",
      "Repeat for each document — bulk download is a Business/Enterprise-only feature on typical plans.",
    ],
    templateNote:
      "Best portability of the major tools: PandaDoc's DocX Export turns a template into a native Word file that opens anywhere. Convert to PDF before upload if you prefer Docracy's PDF-first flow, or print-to-PDF from Word.",
    whatTransfers: [
      "Completed document PDFs with signatures.",
      "DocX exports of templates/content you can edit outside PandaDoc.",
      "Does not transfer: PandaDoc content library blocks, pricing tables as live editable PandaDoc objects, CRM-synced fields, or approval workflows.",
    ],
    tips: [
      "Use DocX Export for templates you'll rewrite; use PDF for archives of already-signed deals.",
      "Strip proposal-only pages before you upload if you only need the signature section in Docracy.",
      "After upload, AI Auto-Detect works best on clean contract layouts — dense proposal designs may need a few manual field tweaks.",
    ],
    alternativeSlug: "pandadoc-alternative",
  },
  {
    slug: "adobe-sign",
    competitorName: "Adobe Acrobat Sign",
    seoTitle: "Import Adobe Acrobat Sign Documents to Docracy",
    seoDescription:
      "Export Adobe Acrobat Sign agreements as PDFs and upload them to Docracy. No account linking — manual per-document download with clear limits explained.",
    heroHeadline: "Bring your Adobe Sign documents to Docracy",
    heroSubheadline:
      "No account-linking, no handing over your Adobe password. Export the PDFs you already have from Acrobat Sign.",
    intro:
      "Adobe Acrobat Sign is deeply tied to Adobe's document ecosystem and enterprise sales motion. Individuals and small teams often just need the signed PDF out — not an API integration. This guide is that download path, plus what you should expect when you re-field the document in Docracy.",
    whyNoConnect:
      "Adobe reserves real production API access for enterprise and developer accounts behind a custom quote — there's no self-serve paid tier for typical individual accounts, which makes this the most closed of the major platforms here. We also won't ask for your Adobe ID password.",
    exportSteps: [
      "Sign in to Adobe Acrobat Sign and open Manage (or Documents).",
      "Open the completed agreement.",
      "Choose Download PDF (or Download combined PDF if multiple files were sent).",
      "Optionally download the audit report PDF if Adobe offers it on your plan — keep it with your records.",
      "Repeat for each document — true bulk download is an Enterprise-oriented tool (often via support or admin features).",
    ],
    templateNote:
      "A reusable form-field layer can transfer to a new Adobe document inside Adobe, but field data alone exports as CSV, not a full portable template — closer to lock-in than PandaDoc or a plain PDF workflow.",
    whatTransfers: [
      "Signed agreement PDFs.",
      "Audit report PDFs when your plan exposes them (store those yourself; they are not imported as a live Docracy trail).",
      "Does not transfer: Acrobat Sign form-field templates as editable Docracy fields, Adobe Sign workflows, or Acrobat DC cloud settings.",
    ],
    tips: [
      "If you only have the signed PDF, that's enough — upload to Docracy and place fields for a new signing round.",
      "Keep Adobe's audit PDF alongside important contracts in your own Drive/Dropbox; Docracy's retention window is short by design.",
      "Enterprise Adobe libraries rarely export cleanly — prefer the concrete agreements you still send.",
    ],
    alternativeSlug: "adobe-sign-alternative",
  },
  {
    slug: "contractbook",
    competitorName: "Contractbook",
    seoTitle: "Import Contractbook Documents to Docracy",
    seoDescription:
      "Export contracts from Contractbook as PDFs and bring them into Docracy for simple signing. No account linking — for when you need a signature, not a full CLM workspace.",
    heroHeadline: "Bring your Contractbook documents to Docracy",
    heroSubheadline:
      "No account-linking, no handing over your Contractbook password. Export the PDFs you need to keep signing outside a full CLM suite.",
    intro:
      "Contractbook is a contract lifecycle platform (workspaces, repository, automations). If your actual job is getting one agreement signed without living in CLM, export the PDF and continue in Docracy — free for up to two signers, no account required for short chains.",
    whyNoConnect:
      "Contractbook is built around its own workspace and repository model, not a free public bulk-export API for individual \"download everything to another e-sign tool\" migrations. We won't ask for your Contractbook password to connect accounts. Use the product's normal document download / PDF export for each contract you still need.",
    exportSteps: [
      "Sign in to Contractbook and open the contract or document you want to keep.",
      "Use Download / Export PDF (wording varies by workspace view) to save a PDF copy.",
      "If the contract is still a draft with an attached source file, download that source as well when available.",
      "Repeat for each contract you plan to re-send or archive outside Contractbook.",
    ],
    templateNote:
      "CLM metadata, clause libraries, and Contractbook automations do not travel with a PDF. You get the document file; you rebuild signing fields in Docracy.",
    whatTransfers: [
      "PDF exports of contracts you download.",
      "Any source files Contractbook lets you download alongside the contract.",
      "Does not transfer: Contractbook repository structure, clause library, approval automations, or workspace permissions.",
    ],
    tips: [
      "Honest split: keep Contractbook if you need full CLM; use Docracy when the remaining job is signature collection.",
      "WhatsApp signing and no-account signers are the usual reason teams move a signing step to Docracy.",
      "After upload, save high-frequency contracts as Docracy templates on paid ($10/mo flat).",
    ],
    alternativeSlug: "contractbook-alternative",
  },
  {
    slug: "onlinesignature",
    competitorName: "OnlineSignature.com",
    seoTitle: "Import from OnlineSignature.com to Docracy",
    seoDescription:
      "OnlineSignature.com routes into Xodo Sign / eversign. Export your PDFs from that signing account and upload them to Docracy — free for up to 2 signers, no account required.",
    heroHeadline: "Bring OnlineSignature.com documents to Docracy",
    heroSubheadline:
      "OnlineSignature.com is a front door to Xodo Sign (formerly eversign). Export from that signing account, then upload to Docracy — no password sharing with us.",
    intro:
      "If you started on OnlineSignature.com, the documents that matter usually live in the Xodo Sign / eversign account it funnels into once you send or track anything. This guide explains that relationship and the free PDF download path, then how Docracy takes over without requiring an account for short signing chains.",
    whyNoConnect:
      "There is no separate OnlineSignature \"connect your Docracy account\" API — and we wouldn't ask for those passwords anyway. OnlineSignature.com is not an independent document store with a free bulk migration API; export happens in the Xodo Sign / eversign product behind it, under the same API/paid gates as eversign.",
    exportSteps: [
      "Sign in to the Xodo Sign / eversign account you use with OnlineSignature.com (often the same login you were pushed into when sending or tracking).",
      "Open Documents and find completed or draft files you still need.",
      "Download each document as a PDF.",
      "Upload the PDF to Docracy and continue with AI field detection + signers.",
    ],
    templateNote:
      "Same limits as eversign/Xodo: templates stay in their system; you get the PDF, then rebuild fields in Docracy.",
    whatTransfers: [
      "PDFs you download from the underlying Xodo Sign / eversign account.",
      "Does not transfer: OnlineSignature.com landing-page settings, Xodo templates, or account-based tracking history.",
    ],
    tips: [
      "If you only ever \"signed a PDF\" once on the marketing site and never created a full account, you may only have local downloads — upload those directly to Docracy.",
      "See also the eversign / Xodo Sign import guide for the same export UI with more product-specific notes.",
      "Docracy stays free for up to 2 signers with no account — the usual reason people leave the OnlineSignature → Xodo funnel.",
    ],
    alternativeSlug: "onlinesignature-alternative",
  },
  {
    slug: "signnow",
    competitorName: "SignNow",
    seoTitle: "Import SignNow Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export SignNow documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your SignNow documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your SignNow password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving SignNow do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "SignNow does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your SignNow password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to SignNow and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "SignNow templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important SignNow audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "signnow-alternative",
  },
  {
    slug: "zoho-sign",
    competitorName: "Zoho Sign",
    seoTitle: "Import Zoho Sign Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export Zoho Sign documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your Zoho Sign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your Zoho Sign password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving Zoho Sign do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "Zoho Sign does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your Zoho Sign password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to Zoho Sign and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "Zoho Sign templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important Zoho Sign audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "zoho-sign-alternative",
  },
  {
    slug: "onespan",
    competitorName: "OneSpan Sign",
    seoTitle: "Import OneSpan Sign Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export OneSpan Sign documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your OneSpan Sign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your OneSpan Sign password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving OneSpan Sign do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "OneSpan Sign does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your OneSpan Sign password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to OneSpan Sign and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "OneSpan Sign templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important OneSpan Sign audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "onespan-alternative",
  },
  {
    slug: "docuseal",
    competitorName: "DocuSeal",
    seoTitle: "Import DocuSeal Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export DocuSeal documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your DocuSeal documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your DocuSeal password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving DocuSeal do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "DocuSeal does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your DocuSeal password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to DocuSeal and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "DocuSeal templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important DocuSeal audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "docuseal-alternative",
  },
  {
    slug: "boldsign",
    competitorName: "BoldSign",
    seoTitle: "Import BoldSign Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export BoldSign documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your BoldSign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your BoldSign password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving BoldSign do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "BoldSign does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your BoldSign password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to BoldSign and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "BoldSign templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important BoldSign audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "boldsign-alternative",
  },
  {
    slug: "signrequest",
    competitorName: "SignRequest",
    seoTitle: "Import SignRequest Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export SignRequest documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your SignRequest documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your SignRequest password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving SignRequest do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "SignRequest does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your SignRequest password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to SignRequest and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "SignRequest templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important SignRequest audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "signrequest-alternative",
  },
  {
    slug: "yousign",
    competitorName: "Yousign",
    seoTitle: "Import Yousign Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export Yousign documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your Yousign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your Yousign password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving Yousign do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "Yousign does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your Yousign password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to Yousign and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "Yousign templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important Yousign audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "yousign-alternative",
  },
  {
    slug: "nitro-sign",
    competitorName: "Nitro Sign",
    seoTitle: "Import Nitro Sign Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export Nitro Sign documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your Nitro Sign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your Nitro Sign password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving Nitro Sign do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "Nitro Sign does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your Nitro Sign password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to Nitro Sign and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "Nitro Sign templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important Nitro Sign audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "nitro-sign-alternative",
  },
  {
    slug: "dochub",
    competitorName: "DocHub",
    seoTitle: "Import DocHub Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export DocHub documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your DocHub documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your DocHub password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving DocHub do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "DocHub does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your DocHub password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to DocHub and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "DocHub templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important DocHub audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "dochub-alternative",
  },
  {
    slug: "signeasy",
    competitorName: "SignEasy",
    seoTitle: "Import SignEasy Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export SignEasy documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your SignEasy documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your SignEasy password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving SignEasy do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "SignEasy does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your SignEasy password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to SignEasy and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "SignEasy templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important SignEasy audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "signeasy-alternative",
  },
  {
    slug: "blueink",
    competitorName: "Blueink",
    seoTitle: "Import Blueink Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export Blueink documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your Blueink documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your Blueink password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving Blueink do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "Blueink does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your Blueink password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to Blueink and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "Blueink templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important Blueink audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "blueink-alternative",
  },
  {
    slug: "box-sign",
    competitorName: "Box Sign",
    seoTitle: "Import Box Sign Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export Box Sign documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your Box Sign documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your Box Sign password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving Box Sign do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "Box Sign does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your Box Sign password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to Box Sign and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "Box Sign templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important Box Sign audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "box-sign-alternative",
  },
  {
    slug: "getaccept",
    competitorName: "GetAccept",
    seoTitle: "Import GetAccept Documents to Docracy — Free Export Guide",
    seoDescription: "Step-by-step guide to export GetAccept documents as PDFs and upload them to Docracy. No account linking — AI field detection places signatures for you.",
    heroHeadline: "Bring your GetAccept documents to Docracy",
    heroSubheadline: "No account-linking, no handing over your GetAccept password. Export the PDFs you already have, then re-send or turn them into Docracy templates.",
    intro:
      "Most people leaving GetAccept do not need an enterprise migration project — they need the NDAs, offer letters, and client agreements they already use available in a lighter tool. This guide covers the free, built-in download path, what actually transfers, and how Docracy picks up once you have the PDF.",
    whyNoConnect:
      "GetAccept does not offer a free, self-serve, general-purpose bulk-export API that a typical individual account can use to one-click migrate into another e-sign tool. We also will not ask for your GetAccept password to “connect your account.” Use the product’s normal per-document PDF download, then upload to Docracy.",
    exportSteps: [
            "Sign in to GetAccept and open Documents (or Manage / Agreements — wording varies).",
            "Open the completed document or the template source you want to keep.",
            "Choose Download / Download PDF (or Export).",
            "Save the PDF locally or to Drive/Dropbox.",
            "Repeat for each document — most individual plans do not offer a free bulk “download everything” button."
    ],
    templateNote:
      "GetAccept templates (when they exist) usually export the underlying PDF, not a portable field/routing package. Re-place fields in Docracy — AI Auto-Detect typically gets most of the way.",
    whatTransfers: [
            "Signed PDFs you download (signatures flattened into the file).",
            "Source/draft PDFs when the product lets you download them.",
            "Does not transfer: proprietary field layers, recipient routing automation, or in-app audit metadata as a live Docracy trail."
    ],
    tips: [
            "Start with templates you reuse monthly — one upload + AI field detection turns them into a Docracy template on paid.",
            "Keep important GetAccept audit PDFs in your own Drive if the product offers them; Docracy’s retention window is short by design.",
            "After upload, run AI Auto-Detect once, then tweak any missed fields before sending."
    ],
    alternativeSlug: "getaccept-alternative",
  }
];

/** Preferred Compare-nav order — majors first; Contractbook + OnlineSignature included whenever
 *  they have pages (required whenever import guides exist). Unknown slugs append alphabetically. */
const COMPARE_NAV_ORDER = [
  "boundless-alternative",
  "citizenpath-alternative",
  "visa-service-alternative",
  "kita-alternative",
  "alegra-alternative",
  "siigo-alternative",
  "docusign-alternative",
  "eversign-alternative",
  "hellosign-alternative",
  "pandadoc-alternative",
  "adobe-sign-alternative",
  "contractbook-alternative",
  "onlinesignature-alternative",
  "signnow-alternative",
  "zoho-sign-alternative",
  "onespan-alternative",
  "docuseal-alternative",
  "boldsign-alternative",
  "signrequest-alternative",
  "yousign-alternative",
  "nitro-sign-alternative",
  "dochub-alternative",
  "signeasy-alternative",
  "blueink-alternative",
  "box-sign-alternative",
  "getaccept-alternative",
] as const;

/** Alternatives in Compare-nav order (all competitor landing pages). */
export function getOrderedAlternativePages(): AlternativePageContent[] {
  const bySlug = new Map(ALTERNATIVE_PAGES.map((p) => [p.slug, p]));
  const ordered: AlternativePageContent[] = [];
  for (const slug of COMPARE_NAV_ORDER) {
    const page = bySlug.get(slug);
    if (page) {
      ordered.push(page);
      bySlug.delete(slug);
    }
  }
  const rest = [...bySlug.values()].sort((a, b) => a.competitorName.localeCompare(b.competitorName));
  return ordered.concat(rest);
}

/** Import guides aligned to Compare-nav order (one per alternative). */
export function getOrderedImportGuidePages(): ImportGuideContent[] {
  const byAlt = new Map(IMPORT_GUIDE_PAGES.map((p) => [p.alternativeSlug, p]));
  const ordered: ImportGuideContent[] = [];
  for (const page of getOrderedAlternativePages()) {
    const guide = byAlt.get(page.slug);
    if (guide) {
      ordered.push(guide);
      byAlt.delete(page.slug);
    }
  }
  return ordered.concat([...byAlt.values()]);
}


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
  /** Optional — pages without it just skip the FAQ section. */
  faqs?: Array<{ question: string; answer: string }>;
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
          "An NDA (Non-Disclosure Agreement) is a legal document used to protect confidential information. It defines " +
          "what information is confidential, how it can be used, and what happens if it's shared improperly. Most " +
          "NDAs are short — a page or two — because the goal is clarity, not legal complexity.",
      },
      {
        heading: "Types of NDAs",
        list: ["Mutual NDA — both sides share confidential information", "One-way NDA — only one side does", "Contractor NDA", "Employee NDA"],
      },
      {
        heading: "What a good NDA actually includes",
        list: [
          "A specific definition of what counts as confidential",
          "How long the confidentiality obligation lasts",
          "What the receiving party is allowed to do with the information",
          "What happens if the agreement is broken",
        ],
      },
      {
        heading: "Why NDAs matter",
        body:
          "NDAs protect business ideas, client information, internal processes, and sensitive data. The value isn't " +
          "just legal — signing one before a sensitive conversation also sets a clear expectation for both sides " +
          "about what's being shared and why.",
      },
      {
        heading: "When you don't strictly need one",
        body:
          "Not every conversation needs an NDA. Casual discussions with no real sensitive detail, or information " +
          "that's already public, usually don't require one. NDAs earn their keep specifically when real confidential " +
          "information — pricing, source code, unreleased plans — is about to change hands.",
      },
      {
        heading: "Sign NDAs online",
        body:
          "Docracy.io lets you send and sign NDAs fast — no subscriptions, no account required for recipients, no " +
          "complexity. A mutual or one-way NDA template covers most situations; fill in the specifics and send.",
      },
    ],
    ctaLabel: "Sign NDA online",
    ctaTo: "/prepare?freeTemplate=mutual-nda",
    relatedLinks: [
      { label: "Free mutual NDA template", to: "/free-templates/mutual-nda" },
      { label: "Free one-way NDA template", to: "/free-templates/unilateral-nda" },
      { label: "More about NDA signing", to: "/nda-signing" },
      { label: "One-way vs. mutual NDA", to: "/blog/one-way-vs-mutual-nda" },
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
        // By default Docracy doesn't verify signer identity (see About.tsx/Docs.tsx/Terms.tsx) —
        // but paid/Enterprise accounts can add WhatsApp-verified AES-track signing (see Trust.tsx),
        // so this body must say "by default" and mention that option rather than stating a flat,
        // unqualified "doesn't verify identity" as if there were no upgrade path at all.
        body:
          "Docracy records a full audit trail — who signed, when, and from where — and keeps the signed document's " +
          "integrity intact. By default it doesn't verify signer identity: anyone with the link can sign as the name " +
          "on it. Paid and Enterprise accounts can add a stronger, WhatsApp-verified signature track designed to meet " +
          "the EU eIDAS Advanced Electronic Signature (AES) bar. Either way, it's not a Qualified Electronic Signature " +
          "(QES) — for contracts that legally require one, use a qualified, compliance-grade e-signature provider instead.",
      },
    ],
    ctaLabel: "Sign documents online",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "ESIGN Act & UETA (US)", to: "/esign-ueta" },
      { label: "Why a simple signature is enough under UETA", to: "/ueta-electronic-signature" },
      { label: "Trust & security", to: "/trust" },
      { label: "How Docracy's signing flow works", to: "/docs" },
    ],
  },
  {
    // UETA is a distinct, state-adopted law, not just "the other half of ESIGN" — every other
    // ESIGN/UETA mention on the site (esign-ueta, electronic-signature-guide, Trust.tsx) bundles
    // the two together and never argues UETA's own attribution/retention sections on their own
    // terms. This page exists specifically to make that argument that nothing else on the site
    // makes, not to restate the consent/intent/record summary those pages already cover.
    slug: "ueta-electronic-signature",
    seoTitle: "Is a Simple Electronic Signature Legal Under UETA? | Docracy",
    seoDescription:
      "UETA doesn't require identity verification, biometrics, or special software — just intent to sign, attribution, and a retrievable record. Here's why a simple electronic signature already clears that bar.",
    heroHeadline: "Is a simple electronic signature legal under UETA? Yes — here's why.",
    heroSubheadline:
      "UETA sets a lower, technology-neutral bar than most people assume. A basic e-signature with a tamper-evident audit trail already meets it.",
    sections: [
      {
        heading: "UETA is state law, not federal law",
        body:
          "Unlike the ESIGN Act — a federal law — the Uniform Electronic Transactions Act is a model law each US state " +
          "adopts on its own. Every state except New York has adopted some version of UETA; New York instead uses its " +
          "own Electronic Signatures and Records Act (ESRA), which sets a broadly similar bar. If a specific state's " +
          "law governs your agreement, that state's UETA (or New York's ESRA) is usually what actually applies — not " +
          "the federal ESIGN Act.",
      },
      {
        heading: "What UETA requires: attribution (Section 9)",
        body:
          "UETA §9 says an electronic signature is legally attributable to a person if it was \"the act of the " +
          "person\" — and that can be shown by any surrounding circumstances, including how a security procedure " +
          "was used. It doesn't require biometrics, a certified identity check, or cryptographic signing. A " +
          "timestamped audit trail — who clicked, from what IP, at what time, in response to a link sent to a " +
          "specific email — is exactly the kind of circumstantial evidence UETA §9 contemplates.",
      },
      {
        heading: "What UETA requires: record retention (Section 12)",
        body:
          "UETA §12 treats an electronic record as satisfying any legal retention requirement if it accurately " +
          "reflects the information and remains accessible for later reference. A tamper-evident PDF — hashed so " +
          "any edit after signing is immediately detectable — plus a certificate of completion satisfies this " +
          "without needing a specialized records-management system.",
      },
      {
        heading: "What UETA does not require",
        list: [
          "Identity verification of the signer",
          "A specific signature technology or vendor",
          "Biometric or cryptographic certificates",
          "A notary or witness",
        ],
      },
      {
        heading: "Where a simple signature isn't enough",
        body:
          "UETA has carve-outs: wills, codicils, testamentary trusts, and certain family-law and court documents are " +
          "typically excluded from electronic execution entirely, regardless of signature strength. For anything " +
          "outside UETA's scope, or where a counterparty specifically requires notarization or a Qualified " +
          "Electronic Signature, use the appropriate dedicated process instead.",
      },
    ],
    faqs: [
      {
        question: "Does UETA require identity verification?",
        answer:
          "No. UETA's attribution standard (§9) can be satisfied by circumstantial evidence like an audit trail — it doesn't mandate biometric or government-ID verification.",
      },
      {
        question: "Is UETA the same as the ESIGN Act?",
        answer:
          "No — ESIGN is federal law, while UETA is a model law each state adopts on its own (New York uses its own ESRA instead). They're similar in substance but are legally distinct statutes.",
      },
      {
        question: "Does a simple electronic signature satisfy UETA for a business contract?",
        answer:
          "In the states that have adopted UETA, yes, for the everyday business agreements UETA covers. Wills, certain court filings, and a handful of other document types are excluded by UETA itself, regardless of signature type.",
      },
      {
        question: "Do I need special software to comply with UETA?",
        answer:
          "No. UETA is technology-neutral — it doesn't mandate a specific signature vendor or method, only that there's clear intent to sign, attribution, and a retrievable record.",
      },
    ],
    ctaLabel: "Sign a document under UETA",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "How Docracy meets UETA's requirements", to: "/docracy-ueta-compliance" },
      { label: "ESIGN Act & UETA overview", to: "/esign-ueta" },
      { label: "Trust & security", to: "/trust" },
    ],
  },
  {
    slug: "docracy-ueta-compliance",
    seoTitle: "How Docracy Meets UETA's Requirements | Docracy",
    seoDescription:
      "A section-by-section look at how Docracy's signing flow — consent, audit trail, tamper-evident hashing, and retention — maps to UETA's actual legal requirements.",
    heroHeadline: "How Docracy meets UETA's requirements, section by section.",
    heroSubheadline:
      "Not a marketing claim — an actual walkthrough of which part of Docracy's signing flow satisfies which part of UETA.",
    sections: [
      {
        heading: "Consent to sign electronically (UETA §5)",
        body:
          "UETA requires that parties agree to conduct the transaction electronically. Docracy makes signers " +
          "explicitly acknowledge and consent before they can sign — this isn't implied just by opening the link.",
      },
      {
        heading: "Intent to sign (UETA §2, §7)",
        body:
          "UETA requires a clear signing action, not passive agreement. Signers actively draw or type their " +
          "signature and submit it — a deliberate act, not a default or pre-filled state.",
      },
      {
        heading: "Attribution (UETA §9)",
        body:
          "Docracy's audit trail records the signer's email, IP address, and timestamp for every action in the " +
          "chain, plus — optionally — a PIN the preparer sets that the signer must enter. Together, that's the kind " +
          "of circumstantial record UETA §9 treats as sufficient to attribute a signature to a specific person.",
      },
      {
        heading: "Record integrity and retention (UETA §12)",
        body:
          "Every completed document gets a SHA-256 hash — change even one character afterward and the hash no " +
          "longer matches, so tampering is immediately detectable. That hash is also anchored to the Bitcoin " +
          "blockchain for free via the OpenTimestamps protocol, and a certificate of completion is generated " +
          "alongside the signed PDF, so the record stays both accurate and independently verifiable.",
      },
      {
        heading: "What this doesn't cover",
        body:
          "UETA doesn't require identity verification, and neither does Docracy's default signature (a Simple " +
          "Electronic Signature). If a document needs stronger signer-identity assurance, paid accounts can add a " +
          "WhatsApp-verified signature track designed to meet the EU eIDAS Advanced Electronic Signature (AES) bar " +
          "— see Trust & security for exactly what that does and doesn't prove. Docracy is not a Qualified Trust " +
          "Service Provider and doesn't issue Qualified Electronic Signatures (QES).",
      },
    ],
    faqs: [
      {
        question: "Does Docracy verify who's actually signing?",
        answer:
          "Not by default — Docracy's Simple Electronic Signature proves what was signed and when, not who physically signed. Paid accounts can add WhatsApp-verified signing for stronger identity assurance.",
      },
      {
        question: "Is Docracy's audit trail enough to satisfy UETA's attribution requirement?",
        answer:
          "For the everyday business documents UETA covers, the audit trail (email, IP, timestamp, optional PIN) is the kind of circumstantial evidence UETA §9 treats as sufficient — though this isn't a substitute for your own legal advice on a specific document.",
      },
      {
        question: "What happens to my document after everyone signs?",
        answer:
          "Docracy generates a hash-verified, tamper-evident PDF and certificate of completion, deletes the working copy after a short retention window (free tier: 9 days), and keeps a hash-based verification record indefinitely so the document can still be checked long after it's gone.",
      },
      {
        question: "Does this apply in New York?",
        answer:
          "New York hasn't adopted UETA — it uses its own Electronic Signatures and Records Act (ESRA), which sets a broadly similar bar. This page isn't legal advice about which law applies to your specific document.",
      },
    ],
    ctaLabel: "Sign a document",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Why a simple signature is enough under UETA", to: "/ueta-electronic-signature" },
      { label: "ESIGN Act & UETA overview", to: "/esign-ueta" },
      { label: "Trust & security", to: "/trust" },
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
      "Docracy is free for signing chains of up to two people — you and your client — with no account required on either side. Start from a free freelance service agreement, NDA, or payment-terms template, fill in your details, and send. It's built for exactly this: one person sending a handful of agreements a month, not a sales team on a seat license. After the work is done, Paid cobro sends the invoice on WhatsApp with your PayPal or Mercado Pago link — no extra signature, and Docracy never takes the money.",
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
    seoTitle: "E-Signatures for Real Estate — Landlords & Property Managers",
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
  {
    slug: "hr",
    seoTitle: "E-Signatures for HR & People Teams | Docracy",
    seoDescription:
      "Free e-signing for offer letters, employment agreements, onboarding paperwork, and separation agreements. No account required for the candidate or employee to sign.",
    heroHeadline: "E-signatures built for HR and people teams.",
    heroSubheadline:
      "Offer letters, onboarding paperwork, and separation agreements — signed in minutes, free for you and the candidate or employee.",
    painPoints: [
      "An offer needs to go out and come back signed the same day, before a candidate takes a competing offer.",
      "Onboarding paperwork piles up on day one — policy acknowledgments, non-competes, remote work agreements — and chasing signatures by email is slow.",
      "A separation agreement needs a clean, timestamped signature on the way out, not a verbal handshake.",
      "Most HR e-sign tools are priced and bundled as part of a full HRIS suite — overkill for a small team just trying to get paperwork signed.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and the candidate or employee — with no account required for them to sign. Start from an offer letter, employment agreement, onboarding paperwork, or separation agreement template, fill in the specifics, and send.",
    honestLimit:
      "What this is not: Docracy doesn't verify a signer's identity or replace the in-person I-9 document inspection U.S. federal law requires for new hires — our I-9 template is a fillable form, not a substitute for that physical check. For background checks, benefits enrollment, or payroll integration, you'll still need dedicated HR software; Docracy just handles the signature.",
    relevantTemplates: [
      "offer-letter",
      "employment-agreement",
      "employee-onboarding-agreement",
      "remote-work-policy",
      "non-compete-non-solicitation-agreement",
      "separation-agreement",
    ],
    ctaLabel: "Send an offer letter",
    ctaTo: "/prepare?ref=seo-industry-hr",
  },
  {
    slug: "legal",
    seoTitle: "E-Signatures for Legal — Attorneys & Law Firms | Docracy",
    seoDescription:
      "Free e-signing for NDAs, letters of intent, powers of attorney, and cease-and-desist letters. Built for solo attorneys and small firms sending everyday documents.",
    heroHeadline: "E-signatures for solo attorneys and small law firms.",
    heroSubheadline:
      "NDAs, letters of intent, powers of attorney, and demand letters — signed in minutes, free for you and your client or counterparty.",
    painPoints: [
      "A client needs to sign an engagement-adjacent document — an NDA, a letter of intent — before the substantive work starts.",
      "Sending a cease-and-desist or demand letter for signature acknowledgment shouldn't require the recipient to create an account.",
      "A power of attorney or similar document needs a clean, timestamped record of when it was signed.",
      "Per-seat legal-tech pricing doesn't make sense for a solo practice or small firm sending a modest volume of documents.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and your client or the other side — with no account required for them to sign. Start from an NDA, letter of intent, power of attorney, or cease-and-desist template, fill in the specifics, and send.",
    honestLimit:
      "What this is not: Docracy is not a practice-management or matter-management system, doesn't verify signer identity by default (paid/Enterprise accounts can add a WhatsApp-verified AES-track signature — see Trust & security), and doesn't offer notarization or Qualified Electronic Signatures (QES). For notarized documents, QES-requiring matters, or filings with a court's own e-filing system, use the appropriate dedicated tool. This page is not legal advice about what signature type your specific matter requires.",
    relevantTemplates: [
      "mutual-nda",
      "unilateral-nda",
      "letter-of-intent",
      "power-of-attorney",
      "cease-and-desist-letter",
      "llc-operating-agreement",
    ],
    ctaLabel: "Send an NDA",
    ctaTo: "/prepare?ref=seo-industry-legal",
  },
  {
    slug: "sales",
    seoTitle: "E-Signatures for Sales Teams & Account Executives | Docracy",
    seoDescription:
      "Free e-signing for sales agreements, purchase orders, and referral agreements. Close deals without waiting on procurement to approve new software.",
    heroHeadline: "E-signatures built for sales teams and account executives.",
    heroSubheadline:
      "Sales agreements, purchase orders, and referral deals — signed the moment a prospect says yes, free for two parties.",
    painPoints: [
      "A prospect is ready to sign right now, but the CRM's e-sign add-on is locked behind a plan the team hasn't bought yet.",
      "A purchase order needs a real signature before it goes to fulfillment, not just a confirmation email.",
      "Referral and partner agreements pile up as one-off documents that don't fit neatly into a CPQ or contract-management tool.",
      "Per-envelope or per-seat e-sign pricing adds friction to closing smaller deals fast.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and the buyer — with no account required for them to sign. Start from a sales agreement, purchase order, or referral agreement template, fill in the deal terms, and send while the prospect is still on the call.",
    relevantTemplates: ["sales-agreement", "purchase-order", "referral-agreement", "installment-agreement", "bill-of-sale"],
    ctaLabel: "Send a sales agreement",
    ctaTo: "/prepare?ref=seo-industry-sales",
  },
  {
    slug: "recruiting",
    seoTitle: "E-Signatures for Recruiting — Staffing Agencies | Docracy",
    seoDescription:
      "Free e-signing for offer letters, contractor agreements, and non-compete acknowledgments. Built for recruiters and staffing agencies placing candidates fast.",
    heroHeadline: "E-signatures built for recruiters and staffing agencies.",
    heroSubheadline:
      "Offer letters and contractor placements — signed the same day a candidate accepts, free for two parties.",
    painPoints: [
      "A candidate accepts verbally and the offer letter needs to go out and come back signed before they change their mind or another agency reaches them.",
      "Placing a contractor means fresh onboarding paperwork for every assignment — enterprise ATS e-sign add-ons price that per placement.",
      "Non-compete or non-solicitation acknowledgments need a clean, timestamped signature, separate from the offer letter itself.",
      "A staffing agency juggles many small, one-off signing chains rather than a handful of huge contracts — most e-sign pricing doesn't fit that shape.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and the candidate or contractor — with no account required for them to sign. Start from an offer letter, independent contractor agreement, or non-compete template, fill in the placement details, and send.",
    honestLimit:
      "What this is not: Docracy doesn't run background checks, verify a candidate's identity, or replace the in-person I-9 document inspection U.S. federal law requires for employees — it only handles the signature on the paperwork.",
    relevantTemplates: [
      "offer-letter",
      "independent-contractor-agreement",
      "contractor-onboarding-agreement",
      "non-compete-non-solicitation-agreement",
      "i-9-form",
    ],
    ctaLabel: "Send an offer letter",
    ctaTo: "/prepare?ref=seo-industry-recruiting",
  },
  {
    slug: "consulting",
    seoTitle: "E-Signatures for Consulting Firms | Docracy",
    seoDescription:
      "Free e-signing for consulting agreements, statements of work, and client contracts. No account required, no per-seat pricing for two-party engagements.",
    heroHeadline: "E-signatures built for consulting firms.",
    heroSubheadline:
      "Consulting agreements, scopes of work, and client contracts — signed before the engagement starts, free for two parties.",
    painPoints: [
      "A new engagement needs a signed consulting agreement or statement of work before billable work starts, not after.",
      "Scope changes mid-engagement need a signed change order, not an email thread everyone interprets differently.",
      "Bringing on a subcontracted specialist for one engagement means onboarding paperwork that most e-sign pricing treats like a full seat.",
      "Payment terms need a real signature, especially for milestone- or retainer-based billing.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and your client, or you and a subcontracted consultant — with no account required for whoever's signing. Start from a consulting agreement, scope of work, client contract, or payment-terms template, fill in the engagement details, and send.",
    relevantTemplates: [
      "consulting-agreement",
      "scope-of-work",
      "client-contract",
      "service-agreement",
      "payment-terms-agreement",
    ],
    ctaLabel: "Send a consulting agreement",
    ctaTo: "/prepare?ref=seo-industry-consulting",
  },
  {
    slug: "developers",
    seoTitle: "E-Signatures for Software Developers & Engineers | Docracy",
    seoDescription:
      "Free e-signing for developer contracts, NDAs, and non-competes. No account required for the client or employer to sign — built for freelance and contract engineers.",
    heroHeadline: "E-signatures built for freelance developers and engineers.",
    heroSubheadline:
      "Contractor agreements, NDAs, and non-competes — signed before you see the repo or they see your code, free for two parties.",
    painPoints: [
      "A client wants an NDA signed before you get access to their codebase or product roadmap, and asking them to make an account first stalls the whole thing.",
      "A contract engagement needs a signed independent contractor agreement before the first sprint starts, not after invoice time.",
      "A former employer or client wants a non-compete or non-solicitation acknowledgment on file, separate from the main contract.",
      "Per-seat e-sign pricing makes no sense for one developer sending a handful of contracts a month between gigs.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and the client or employer — with no account required for whoever's signing. Start from an independent contractor agreement, NDA, or non-compete template, fill in the engagement details, and send before you touch their codebase.",
    honestLimit:
      "What this is not: Docracy doesn't have a dedicated IP-assignment template yet — for now, the confidentiality templates below cover access and disclosure, not code ownership transfer. If your contract needs explicit IP-assignment language, add it to the document before sending, or use a lawyer-drafted one.",
    relevantTemplates: ["independent-contractor-agreement", "freelance-service-agreement", "mutual-nda", "non-compete-non-solicitation-agreement"],
    ctaLabel: "Send a contractor agreement",
    ctaTo: "/prepare?ref=seo-industry-developers",
  },
  {
    slug: "startups",
    seoTitle: "E-Signatures for Startup Founders | Docracy",
    seoDescription:
      "Free e-signing for co-founder agreements, LLC formation, promissory notes, and NDAs before a pitch. No account required, no per-seat pricing for a two-person startup.",
    heroHeadline: "E-signatures built for startup founders.",
    heroSubheadline:
      "Formation paperwork, co-founder terms, early loans, and NDAs before a pitch — signed in minutes, free for two parties.",
    painPoints: [
      "Two co-founders agree on how the company will be run, but it isn't real until it's signed and dated, not just discussed over coffee.",
      "An advisor or early investor wants an NDA signed before you walk them through the deck.",
      "A friends-and-family loan needs a real promissory note, not a Venmo note that says \"loan.\"",
      "Formation paperwork for an LLC or partnership needs a signed record between co-founders before you open a bank account.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and a co-founder, advisor, or early lender — with no account required for whoever's signing. Start from an LLC operating agreement, partnership agreement, promissory note, or NDA template, fill in the terms, and send.",
    honestLimit:
      "What this is not: Docracy doesn't have a dedicated equity/cap-table or SAFE template yet, and this isn't legal advice on how to structure your formation or your first raise. For anything with real equity or investment terms, have a lawyer review the document before it's the final version you send.",
    relevantTemplates: ["llc-operating-agreement", "partnership-agreement", "promissory-note", "mutual-nda", "letter-of-intent"],
    ctaLabel: "Send a founder agreement",
    ctaTo: "/prepare?ref=seo-industry-startups",
  },
  {
    slug: "photographers",
    seoTitle: "E-Signatures for Photographers & Videographers | Docracy",
    seoDescription:
      "Free e-signing for shoot agreements, payment terms, and liability waivers. No account required for the client to sign — built for solo photographers and small studios.",
    heroHeadline: "E-signatures built for photographers and videographers.",
    heroSubheadline:
      "Shoot agreements, payment terms, and liability waivers — signed before the shoot, free for you and your client.",
    painPoints: [
      "A client books a shoot and needs to sign off on deliverables, usage terms, and payment before you show up with a camera.",
      "A deposit or milestone payment needs a real signature, not just a paid invoice with no terms attached.",
      "A shoot at a venue or with props or equipment often needs a signed liability waiver on file, just in case.",
      "Most e-sign tools are priced for teams — overkill for one photographer booking a few clients a month.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and your client — with no account required for them to sign. Start from a service agreement, client contract, payment-terms template, or liability waiver, fill in the shoot details, and send.",
    honestLimit:
      "What this is not: Docracy doesn't have a dedicated model-release template yet — the service and client-contract templates below cover the booking and payment side, not image-usage/model-release language. Add that separately if your shoot needs it.",
    relevantTemplates: ["service-agreement", "client-contract", "payment-terms-agreement", "liability-waiver"],
    ctaLabel: "Send a shoot agreement",
    ctaTo: "/prepare?ref=seo-industry-photographers",
  },
  {
    slug: "personal",
    seoTitle: "E-Signatures for Personal & Everyday Agreements | Docracy",
    seoDescription:
      "Free e-signing for roommate agreements, personal loans, and power of attorney — for individuals, not businesses. No account required for the other person to sign.",
    heroHeadline: "E-signatures for personal, everyday agreements.",
    heroSubheadline:
      "Roommate agreements, loans between people who know each other, and power of attorney — signed in minutes, free for both of you.",
    painPoints: [
      "A new roommate move-in needs a clear, signed understanding of rent splits and house rules, not an assumption everyone remembers the same way.",
      "Lending money to a friend or family member goes smoother with a real, signed record of the terms, not just a text message.",
      "A family member needs power of attorney set up, with a clean, timestamped signature from everyone involved.",
      "Letting someone borrow or use something of real value works better with a signed liability waiver, especially anything with risk involved.",
    ],
    whyDocracy:
      "Docracy is free for two-party signing — you and the other person — with no account required for them to sign. Start from a roommate agreement, personal loan agreement, power of attorney, or liability waiver template, fill in the details, and send.",
    honestLimit:
      "What this is not: Docracy doesn't verify anyone's identity or offer notarization — for a power of attorney or any document your state requires to be notarized, this covers the signature and audit trail, not the notarization step itself. Check your state's requirements before relying on it alone.",
    relevantTemplates: ["roommate-agreement", "loan-agreement", "power-of-attorney", "liability-waiver", "authorization-form"],
    ctaLabel: "Send a roommate agreement",
    ctaTo: "/prepare?ref=seo-industry-personal",
  },
];
