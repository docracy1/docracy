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
      { title: "Upload the contract you already use", body: "Already have a commission or consignment agreement you like? Upload the PDF as-is and place signature fields on it." },
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
      { title: "Upload the agreement you already use", body: "Have licensing language you trust? Upload the PDF as-is and add signature fields — no rebuilding it in a new editor." },
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
      { title: "Upload the agreement you already use", body: "Your own collaboration, split, or session contract works as-is — just add signature fields to the PDF." },
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
      { title: "Upload your own contract as-is", body: "Already have a template from a lawyer or a past client? Upload the PDF and place fields on it directly — no rebuilding it in someone else's editor." },
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
      { title: "Upload your own design contract", body: "If you already have a template you like, upload it as a PDF and place signature fields directly on it." },
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
      { title: "Upload your own MSA or SOW", body: "Already have a master service agreement or statement of work you reuse? Upload the PDF and place fields on it as-is." },
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
      { title: "Upload your own contract as-is", body: "Already have a contract you like? Upload the PDF and place fields on it directly — no rebuilding in a proprietary editor." },
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
      { title: "Upload your own agreement", body: "Keep using the contract language you've already refined — just upload the PDF and place fields." },
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
    solution: "Docracy.io's Google Drive connector lets you connect your Drive account once and then pick a file directly from Drive when preparing a document to sign — skipping the download-and-re-upload step entirely. If the file is a native Google Doc, it gets pulled in and readied as a signable PDF so you can place signature and date fields on it, the same as any uploaded document. This is a file picker and import, not a live, in-place editor for a shared Google Doc — but it removes the manual export step that slows everyone down. The Drive connector is a paid feature; you can always upload a PDF manually for free.",
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
    heroSubheadline: "No signup, no profile, no marketing list. Upload a PDF, sign it, and you're done — and the document doesn't sit on a server forever.",
    problem: "Most e-signature tools want an account before you can sign anything: an email, a password, a profile that gets used to market other products to you later. If you just need to sign one document once, that's a lot to hand over for something that should take thirty seconds.",
    solution: "Docracy.io lets you sign a one-off document without creating an account — on either end. You upload the PDF, place the signature fields, and send it; the person signing just opens the link and signs, no login required. We collect the minimum needed to make the signature valid, and documents are automatically deleted 9 days after the signing flow completes — they don't linger in storage indefinitely.",
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
    heroSubheadline: "No account setup, no product tour, no wizard. Upload your PDF, drop in the fields, and send it — most people are done in under a minute.",
    problem: "You don't want a signing platform. You want this one document signed, right now. But most e-signature tools put an account wall, a pricing page, and an onboarding checklist between you and the thing you actually came to do.",
    solution: "Docracy.io cuts straight to the task: upload your PDF as-is, place the signature and date fields, and send. There's no account required to send a one-off document, and the person signing just opens their email link and signs — no software, no login, no waiting around.",
    features: [
      { title: "Upload any PDF as-is", body: "No rebuilding your document in someone else's editor." },
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
    solution: "Docracy.io is a straightforward tool: upload your PDF, drop in a signature field (and a date field if you need one), and send it. The person signing opens the link in their browser and signs — no app, no account, no download.",
    features: [
      { title: "Upload any PDF", body: "Use the document you already have — no conversion or reformatting." },
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
    ctaLabel: "Just sign it",
    ctaTo: "/prepare",
    relatedLinks: [
      { label: "Browse free templates", to: "/free-templates" },
      { label: "See pricing", to: "/pricing" },
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
    slug: "docusign-alternative",
    seoTitle: "DocuSign Alternative — Simple Signing | Docracy",
    seoDescription: "A simple alternative to DocuSign for quick agreements. Fast, clean, no account required.",
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
    seoTitle: "HelloSign / Dropbox Sign Alternative | Docracy",
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
    seoTitle: "PandaDoc Alternative for Simple Agreements | Docracy",
    seoDescription:
      "Need signatures without PandaDoc’s proposal suite? Docracy is free for up to 2 signers — built for NDAs and client contracts, not sales proposals.",
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
    seoTitle: "Adobe Sign Alternative — Lightweight E-Sign | Docracy",
    seoDescription:
      "Adobe Acrobat Sign alternative for freelancers and small teams. Free for up to 2 signers, no account required. Paid $10/mo flat.",
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
    seoTitle: "Import DocuSign Documents to Docracy",
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
    seoTitle: "Import eversign Documents to Docracy",
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
    seoTitle: "Import HelloSign Documents to Docracy",
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
    seoTitle: "Import PandaDoc Documents to Docracy",
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
    seoTitle: "Import Adobe Sign Documents to Docracy",
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
      "What this is not: Docracy is not a practice-management or matter-management system, doesn't verify signer identity, and doesn't offer notarization or Qualified Electronic Signatures (QES) — see our Trust & security page for exactly what our audit trail does and doesn't prove. For notarized documents, QES-requiring matters, or filings with a court's own e-filing system, use the appropriate dedicated tool. This page is not legal advice about what signature type your specific matter requires.",
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
