/** Generic SEO/educational articles — distinct from BLOG_POSTS (lib/blog.ts), which are
 *  structured specifically around a competitor comparison (intro/sections/verdict/competitorKey).
 *  These are plain informational posts grouped into topic clusters (NDA, Contract, Signing,
 *  Freelancer, Small Business, Comparison, ...) for internal linking and topical authority. Same
 *  static/prerendered/sitemap treatment as BLOG_POSTS — see scripts/prerender.mjs. */

export type ArticleBlock =
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "img"; src: string; alt: string; caption?: string };

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

function h2(text: string): ArticleBlock {
  return { type: "h2", text };
}

function h3(text: string): ArticleBlock {
  return { type: "h3", text };
}

function img(src: string, alt: string, caption?: string): ArticleBlock {
  return { type: "img", src, alt, caption };
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
    slug: "how-to-sign-a-w-9-form-online",
    title: "How to sign a W-9 form online",
    description:
      "Complete and e-sign a Form W-9 online: IRS electronic rules in plain English, what to fill in, step-by-step with Docracy screenshots, and how businesses collect W-9s from contractors.",
    publishedDate: "2026-07-29",
    cluster: "Signing",
    blocks: [
      p(
        "Yes — you can usually complete and sign a W-9 form online. The IRS does not host a client-onboarding portal for " +
          "W-9s. The requester (your client, platform, or finance team) collects the form, and you return a completed, " +
          "signed copy through their process."
      ),
      p(
        "This guide covers when electronic W-9 signing works, what the form asks for, how to sign a W-9 PDF with " +
          "Docracy (no account required), and how businesses collect W-9s from freelancers and vendors. It is about " +
          "the document workflow — not tax advice. If you are unsure which name, classification, or TIN to use, check " +
          "the IRS Form W-9 instructions or ask a qualified tax professional."
      ),

      h2("Can you sign a W-9 form online?"),
      p(
        "Yes, when the electronic process meets IRS requirements for electronic Form W-9 submissions. In requester " +
          "instructions, that typically means:"
      ),
      list([
        "Collecting the same information as the paper form",
        "Preserving access to a hard-copy (printable) version",
        "Documenting the user access that results in submission",
        "Capturing the payee’s electronic signature as the final submission step when a signature is required",
      ]),
      p(
        "In plain English: typing a name into a random file and emailing it is not the same as a controlled e-sign " +
          "workflow. A solid process confirms the right person completed the form, preserves the contents, captures " +
          "the signature step, and keeps a reliable record."
      ),
      p(
        "A completed W-9 includes a taxpayer identification number (SSN or EIN). Many businesses prefer an " +
          "e-signature link or secure upload over ordinary email for that reason."
      ),

      h2("What is a W-9 and who completes it?"),
      p(
        "Form W-9 (Request for Taxpayer Identification Number and Certification) lets a payee give the correct TIN " +
          "to a requester who needs it for tax reporting — for example payments to independent contractors, certain " +
          "real estate or debt transactions, and other reportable payments."
      ),
      list([
        "Requester: the business, client, platform, or institution that needs the information",
        "Payee: the person or entity that completes and (when required) signs the form",
      ]),
      p(
        "In common contractor onboarding, the business asks for a W-9, the freelancer or vendor completes it, returns " +
          "it to the business, and the business stores it for reporting. The contractor does not send that W-9 to the " +
          "IRS in this workflow — the requester keeps it."
      ),

      h2("What information goes on a W-9"),
      p("Most contractor W-9s include:"),
      list([
        "Name as shown on the income tax return",
        "Business name or disregarded entity name, if different",
        "Federal tax classification",
        "Address",
        "Taxpayer identification number (often an SSN for individuals, an EIN for many businesses)",
        "Signature and date when certification is required",
      ]),
      p(
        "Which TIN and classification to use depends on how you file. When in doubt, use the current IRS form and " +
          "instructions — not an outdated PDF from an old email thread."
      ),

      h2("When does a W-9 need a signature?"),
      p(
        "The Certification section commonly requires a signature because you are certifying that the TIN is correct " +
          "and that certain backup-withholding statements apply — under penalties of perjury. Some edge cases may not " +
          "require a signature, but most contractor and vendor collection workflows ask for a signed W-9."
      ),
      p(
        "If your client requires a signed W-9, complete the form carefully, sign it, and return it through the channel " +
          "they specify."
      ),

      h2("How to sign a W-9 form online with Docracy"),
      p(
        "If you have a blank W-9 PDF (from irs.gov or your requester) and need to fill, sign, and return it, Docracy " +
          "handles the upload → fields → sign → download flow without creating an account."
      ),
      img(
        "/blog/w9/01-landing-upload.png",
        "Docracy homepage with Drop PDF here upload area — start without signing up",
        "Start on Docracy.io — drop your W-9 PDF or click to upload. No account required."
      ),

      h2("1. Upload your W-9 PDF"),
      list([
        "Open docracy.io (or go straight to Prepare)",
        "Drop the W-9 PDF onto the upload area, or choose the file from your computer",
        "Use the current IRS Form W-9 when possible — confirm the revision date matches what the requester expects",
      ]),
      img(
        "/blog/w9/03-w9-uploaded.png",
        "Docracy Prepare screen showing an uploaded IRS Form W-9 PDF preview",
        "After upload, Docracy shows your W-9 preview next to the prepare sidebar."
      ),

      h2("2. Add yourself as the signer"),
      list([
        "In Signers & Viewers, add yourself (+ Myself) or fill Signer 1 with your legal name and email",
        "Optionally add the requester as a Viewer (CC) so they get a copy when it’s done — or plan to download and send the signed PDF through their portal",
        "Add your own email in the optional status field so you can recover the status link if you leave the tab",
      ]),
      img(
        "/blog/w9/04-add-signer.png",
        "Docracy prepare sidebar with signer name filled for a W-9 form",
        "Enter the payee name and email — the person whose TIN appears on the form."
      ),

      h2("3. Place fields and fill the form"),
      list([
        "Add text fields for name, business name (if any), address, and TIN where the PDF expects them",
        "Use checkbox fields for federal tax classification",
        "Place a signature field on the Certification line, and a date field if needed",
        "Read the Certification language before you sign — do not skip it",
      ]),
      p(
        "Paid workspaces can also use auto-detect to place signature and date fields faster; the free flow still lets " +
          "you place fields manually in seconds."
      ),

      h2("4. Sign electronically and download"),
      list([
        "Send the document (or complete the self-sign flow if you are the only signer)",
        "Open the signing link, review the filled W-9, draw or type your signature, and confirm consent",
        "Download the signed PDF (and certificate of completion when available)",
        "Return the file through the requester’s preferred channel — secure portal or e-sign CC when possible",
      ]),
      p(
        "Avoid sending an unprotected W-9 over ordinary email when a safer option exists. The form often includes an " +
          "SSN or EIN plus address and tax classification."
      ),

      h2("How businesses collect W-9s from contractors"),
      p(
        "On the requester side, a W-9 usually sits next to an independent contractor agreement, SOW, direct-deposit " +
          "form, or NDA. A clean digital process looks like:"
      ),
      list([
        "Send the blank (or pre-filled) W-9 for signature",
        "Contractor completes and signs",
        "You track status until it is returned",
        "Store the signed PDF with the vendor or contractor file",
      ]),
      p(
        "With Docracy, you can upload the IRS PDF, add the contractor as signer, CC finance if needed, and keep the " +
          "same short flow for each new vendor. One missing W-9 is annoying; ten missing W-9s during busy onboarding " +
          "weeks slow finance and ops. For recurring contractor packets, a paid workspace can save the field layout as " +
          "a template."
      ),

      h2("Common W-9 mistakes to avoid"),
      list([
        "Treating the IRS as the signing platform — the IRS publishes the form; your requester runs the collection workflow",
        "Sending TINs casually over email when a secure link or portal is available",
        "Assuming every business accepts the same return method — ask how they want the completed form back",
        "Skipping the Certification language before signing",
        "Confusing W-9 (collected from the payee) with Form 1099 (used later to report payments)",
        "Using stale or unofficial forms — verify against the current IRS Form W-9",
      ]),

      h2("Frequently asked questions"),
      h3("Can I sign a W-9 electronically?"),
      p(
        "Yes, when the electronic submission process meets IRS requirements for electronic Form W-9 — same " +
          "information as paper, preservable record, documented access, and an electronic signature step when required."
      ),
      h3("Who signs a W-9 form?"),
      p(
        "Usually the payee — the freelancer, independent contractor, vendor, or entity providing the TIN to the requester."
      ),
      h3("Do I send my W-9 to the IRS?"),
      p(
        "Not in the common requester workflow. You give the completed W-9 to the requester. They use it for their " +
          "tax reporting needs."
      ),
      h3("Is a typed signature enough?"),
      p(
        "A typed name alone is not the whole question. What matters is whether the overall electronic process meets " +
          "IRS electronic W-9 rules when those rules apply. A proper e-signature workflow is safer than treating any " +
          "typed name in any file as automatically valid."
      ),
      h3("Can a business collect W-9s with an e-signature tool?"),
      p(
        "Yes, if the workflow is set up properly and the business accepts that process. Docracy can send the PDF, " +
          "collect the signature, and let both sides download the completed form — free for short signing chains, " +
          "with templates and history on a paid plan."
      ),
      h3("What is the safest way to return a signed W-9?"),
      p(
        "Use the method the business requests: e-signature link, secure portal, or protected upload. Prefer those " +
          "over standard email when available."
      ),
      h3("What if I made a mistake on my W-9?"),
      p(
        "Ask the requester how they want corrections handled. Often they will ask you to complete and sign a new W-9. " +
          "Do not guess on classification, legal name, or TIN fields."
      ),

      h2("A simpler way to sign and return W-9 forms"),
      p(
        "A better W-9 process is about control: the contractor knows what to complete, the business knows what has " +
          "been returned, and sensitive TINs are not scattered across inbox threads. Upload the PDF on Docracy, place " +
          "fields, sign, and download — usually in a few minutes, with no signup required to send or sign."
      ),
    ],
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
