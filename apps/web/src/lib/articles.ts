/** Generic SEO/educational articles — distinct from BLOG_POSTS (lib/blog.ts), which are
 *  structured specifically around a competitor comparison (intro/sections/verdict/competitorKey).
 *  These are plain informational posts grouped into topic clusters (NDA, Contract, Signing,
 *  Freelancer, Small Business, Comparison, ...) for internal linking and topical authority. Same
 *  static/prerendered/sitemap treatment as BLOG_POSTS — see scripts/prerender.mjs. */

export type ArticleBlock = { type: "p"; text: string } | { type: "list"; items: string[] };

export interface ArticlePost {
  slug: string;
  title: string;
  /** Meta description + index-page teaser. */
  description: string;
  /** ISO date the post was published — shown on the post and used for sitemap lastmod. */
  publishedDate: string;
  cluster: string;
  blocks: ArticleBlock[];
}

function p(text: string): ArticleBlock {
  return { type: "p", text };
}

function list(items: string[]): ArticleBlock {
  return { type: "list", items };
}

const PUBLISHED = "2026-07-26";

export const ARTICLES: ArticlePost[] = [
  // --- NDA cluster ---
  {
    slug: "what-is-an-nda",
    title: "What is an NDA and when do you need one?",
    description: "NDAs protect confidential information — what they are, the two main types, and when businesses actually need one.",
    publishedDate: PUBLISHED,
    cluster: "NDA",
    blocks: [
      p(
        "A Non-Disclosure Agreement (NDA) is a simple legal document that prevents someone from sharing confidential " +
          "information. Businesses use NDAs when working with clients, contractors, freelancers, or partners. The goal " +
          "is always the same: protect sensitive data."
      ),
      p("There are two main types:"),
      list(["One-way NDA: only one party shares confidential information.", "Mutual NDA: both parties share sensitive information."]),
      p("NDAs typically cover:"),
      list([
        "What information is confidential",
        "How it may be used",
        "How long confidentiality lasts",
        "What happens if someone breaks the agreement",
      ]),
      p("NDAs are common in:"),
      list(["Freelance projects", "Software development", "Partnerships", "Hiring processes", "Product launches"]),
      p(
        "Signing an NDA online is fast and legally valid. Tools like Docracy.io allow you to send NDAs without " +
          "accounts or complex workflows."
      ),
    ],
  },
  {
    slug: "one-way-vs-mutual-nda",
    title: "One-way vs mutual NDA: what's the difference?",
    description: "Both protect confidential information — but in different situations. Here's when to use each type.",
    publishedDate: PUBLISHED,
    cluster: "NDA",
    blocks: [
      p(
        "A one-way NDA protects information from one party. It's ideal when a business shares confidential data with " +
          "a freelancer or vendor."
      ),
      p(
        "A mutual NDA protects information from both sides. It's used when two companies collaborate, share code, or " +
          "exchange business plans."
      ),
      p("Choose a one-way NDA when:"),
      list(["You hire a freelancer", "You onboard a contractor", "You share internal documents"]),
      p("Choose a mutual NDA when:"),
      list(["You enter a partnership", "You negotiate a merger", "You exchange sensitive business plans"]),
      p("Both NDAs can be signed online in minutes."),
    ],
  },
  {
    slug: "how-to-sign-an-nda-online",
    title: "How to sign an NDA online in minutes",
    description: "The five-step flow for signing an NDA online, and why online signatures are legally binding.",
    publishedDate: PUBLISHED,
    cluster: "NDA",
    blocks: [
      p("Signing an NDA online is simple:"),
      list([
        "Upload your NDA or choose a template",
        "Add signature fields",
        "Send the document",
        "The recipient signs without creating an account",
        "Download the signed PDF",
      ]),
      p("Online signatures are legally binding in most countries under e-signature laws like ESIGN and eIDAS."),
    ],
  },
  {
    slug: "nda-for-freelancers",
    title: "Why freelancers should always use NDAs",
    description: "Freelancers handle sensitive client data every day — here's why an NDA protects both sides.",
    publishedDate: PUBLISHED,
    cluster: "NDA",
    blocks: [
      p(
        "Freelancers often work with sensitive information: client data, internal documents, product ideas. An NDA " +
          "protects both sides and sets clear expectations."
      ),
      p("Benefits:"),
      list([
        "Protects your client's data",
        "Shows professionalism",
        "Prevents misuse of your own work",
        "Builds trust early in the relationship",
      ]),
    ],
  },
  {
    slug: "nda-mistakes-to-avoid",
    title: "Common NDA mistakes and how to avoid them",
    description: "The most common NDA drafting mistakes — vague definitions, missing expiration dates, and more.",
    publishedDate: PUBLISHED,
    cluster: "NDA",
    blocks: [
      p("The most common NDA mistakes include:"),
      list([
        "Using vague definitions of confidential information",
        "Forgetting expiration dates",
        "Not specifying allowed uses",
        "Not including consequences for breaches",
        "Not signing the document properly",
      ]),
      p("A clear NDA prevents misunderstandings and legal issues."),
    ],
  },

  // --- Contract cluster ---
  {
    slug: "what-is-a-simple-contract",
    title: "What is a simple contract and why it matters",
    description: "A simple contract outlines expectations, responsibilities, and payment terms — clarity matters more than legal jargon.",
    publishedDate: PUBLISHED,
    cluster: "Contract",
    blocks: [
      p(
        "A simple contract outlines expectations, responsibilities, and payment terms. It doesn't need complex legal " +
          "language — clarity is more important."
      ),
    ],
  },
  {
    slug: "how-to-sign-a-contract-online",
    title: "How to sign a contract online without accounts",
    description: "Upload, add fields, send, sign, download — the fast, legally binding way to sign a contract online.",
    publishedDate: PUBLISHED,
    cluster: "Contract",
    blocks: [
      p(
        "Upload → add fields → send → sign → download. Online signatures are legally binding and faster than " +
          "traditional methods."
      ),
    ],
  },
  {
    slug: "client-contract-basics",
    title: "What every client contract should include",
    description: "The essential sections every client contract needs, from scope of work to termination rules.",
    publishedDate: PUBLISHED,
    cluster: "Contract",
    blocks: [
      p("A good client contract includes:"),
      list(["Scope of work", "Timeline", "Payment terms", "Responsibilities", "Confidentiality", "Termination rules"]),
    ],
  },
  {
    slug: "service-agreement-explained",
    title: "What is a service agreement?",
    description: "A service agreement defines what's delivered, how, when, and at what cost — protecting both sides.",
    publishedDate: PUBLISHED,
    cluster: "Contract",
    blocks: [
      p(
        "A service agreement defines what service is delivered, how, when, and at what cost. It protects both " +
          "provider and client."
      ),
    ],
  },
  {
    slug: "contract-templates-you-can-use-today",
    title: "Useful contract templates for everyday business",
    description: "The most popular ready-to-use contract templates for common business agreements.",
    publishedDate: PUBLISHED,
    cluster: "Contract",
    blocks: [
      p("Popular templates:"),
      list(["Client contract", "Service agreement", "Work order", "Rental agreement", "Vendor agreement"]),
    ],
  },

  // --- Signing cluster ---
  {
    slug: "how-online-signatures-work",
    title: "How online signatures work and why they're secure",
    description: "Online signatures use cryptographic methods to verify identity and integrity, recognized under ESIGN, UETA, and eIDAS.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p(
        "Online signatures use cryptographic methods to verify identity and integrity. They are legally recognized " +
          "under ESIGN, UETA, and eIDAS."
      ),
    ],
  },
  {
    slug: "are-online-signatures-legally-binding",
    title: "Are online signatures legally binding?",
    description: "Yes, in most countries — here's what makes an online signature legally binding.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p("Yes — in most countries. Requirements:"),
      list(["Intent to sign", "Consent to do business electronically", "Clear record of the signature", "Integrity of the document"]),
    ],
  },
  {
    slug: "how-to-send-a-document-for-signature",
    title: "How to send a document for signature in under a minute",
    description: "The simplest possible flow for sending a document out for signature: upload, add fields, send.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [p("Upload → add fields → send → done.")],
  },
  {
    slug: "best-tools-for-quick-signatures",
    title: "Best tools for quick signatures (simple alternatives)",
    description: "Signing tools differ in complexity — some are enterprise-grade, others are built for fast, frictionless signing.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p(
        "Tools differ in complexity. Some are enterprise-grade, others are simple. Docracy.io focuses on fast, " +
          "frictionless signing."
      ),
    ],
  },
  {
    slug: "why-simple-signing-tools-matter",
    title: "Why simple signing tools matter for small businesses",
    description: "Complex signing tools slow down workflows — simple tools increase completion rates and reduce onboarding friction.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p("Complex tools slow down workflows. Simple tools increase completion rates and reduce onboarding friction."),
    ],
  },

  // --- Freelancer cluster ---
  {
    slug: "essential-agreements-for-freelancers",
    title: "Essential agreements every freelancer should use",
    description: "The core documents every freelancer needs — from NDAs to payment agreements.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [
      p("Key documents:"),
      list(["NDA", "Client contract", "Scope of work", "Payment agreement", "Work order"]),
    ],
  },
  {
    slug: "how-freelancers-can-protect-their-work",
    title: "How freelancers protect their work with simple agreements",
    description: "NDAs, clear contracts, and defined deliverables — the basics of protecting freelance work.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [p("Use NDAs, clear contracts, and defined deliverables.")],
  },
  {
    slug: "simple-contracts-for-small-projects",
    title: "Simple contracts for small projects",
    description: "Even short freelance projects need a contract — clarity prevents disputes.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [p("Short projects still need contracts — clarity prevents disputes.")],
  },
  {
    slug: "how-to-onboard-new-clients-quickly",
    title: "How freelancers onboard clients quickly",
    description: "The simple sequence for onboarding a new freelance client fast: NDA, contract, invoice, work.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [p("Send NDA → send contract → send invoice → start work.")],
  },

  // --- Small Business cluster ---
  {
    slug: "agreements-every-small-business-needs",
    title: "Agreements every small business should have",
    description: "The essential agreement types every small business needs on hand, from vendor agreements to NDAs.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [
      p("Key agreements:"),
      list(["Vendor agreement", "Service agreement", "Employment contract", "NDA", "Rental agreement"]),
    ],
  },
  {
    slug: "how-to-streamline-client-onboarding",
    title: "How small businesses streamline client onboarding",
    description: "Templates, automated sending, and reminders — the simple recipe for faster client onboarding.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [p("Use templates → send documents → automate reminders.")],
  },
  {
    slug: "vendor-agreements-explained",
    title: "What is a vendor agreement?",
    description: "Vendor agreements define responsibilities, pricing, delivery terms, and confidentiality between a business and its suppliers.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [p("Defines responsibilities, pricing, delivery terms, and confidentiality.")],
  },
  {
    slug: "how-to-manage-recurring-documents",
    title: "How to manage recurring documents efficiently",
    description: "Reusable templates and automated reminders make recurring paperwork far less painful.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [p("Use reusable templates and automated reminders.")],
  },

  // --- Comparison cluster ---
  {
    slug: "best-alternatives-to-docusign",
    title: "Best alternatives to DocuSign for simple agreements",
    description: "DocuSign is built for enterprise-scale signing — here's what to look for in a simpler alternative.",
    publishedDate: PUBLISHED,
    cluster: "Comparison",
    blocks: [
      p(
        "Many tools are too complex for small businesses. Alternatives focus on speed, simplicity, and low friction."
      ),
    ],
  },
];

export function getArticle(slug: string): ArticlePost | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** Cluster display order — matches the order the topic list was originally planned in. Clusters
 *  with no published articles yet (Legal Basics, Product) simply won't appear on the index page. */
export const CLUSTER_ORDER = ["NDA", "Contract", "Signing", "Freelancer", "Small Business", "Comparison", "Legal Basics", "Product"];
