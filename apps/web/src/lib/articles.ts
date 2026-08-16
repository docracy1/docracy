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
  | { type: "img"; src: string; alt: string; caption?: string }
  /** An embedded YouTube video (responsive 16:9 iframe). `youtubeId` is the video ID from the
   *  share URL (e.g. youtu.be/H8LlazgJyTA -> "H8LlazgJyTA"). */
  | { type: "video"; youtubeId: string; title: string }
  /** A standalone contextual link to another internal page (a feature/industry/explainer page,
   *  a template, etc.) — for linking a cluster article to the product page its topic matches,
   *  not for arbitrary external links. */
  | { type: "link"; text: string; to: string };

export interface ArticlePost {
  slug: string;
  title: string;
  /** Meta description + index-page teaser. */
  description: string;
  /** ISO date the post was published — shown on the post and used for sitemap lastmod. */
  publishedDate: string;
  cluster: string;
  blocks: ArticleBlock[];
  /** Overrides the sitewide default og:image/twitter:image for link previews (Facebook, X,
   *  Slack, etc.) — e.g. a post's embedded video's own thumbnail. Falls back to /og-image.png
   *  when omitted (see scripts/prerender.mjs withMeta()). */
  ogImage?: string;
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

function link(text: string, to: string): ArticleBlock {
  return { type: "link", text, to };
}

function img(src: string, alt: string, caption?: string): ArticleBlock {
  return { type: "img", src, alt, caption };
}

function video(youtubeId: string, title: string): ArticleBlock {
  return { type: "video", youtubeId, title };
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
      p(
        "You don't need a lawyer to send a reasonable NDA for most everyday situations — a freelancer signing before a " +
          "discovery call, two small businesses comparing notes on a potential partnership, a contractor getting a " +
          "look at internal pricing before a quote. What matters more than legal polish is that the document actually " +
          "gets signed before the sensitive conversation happens, not after."
      ),

      h2("The two types of NDA"),
      p(
        "NDAs come in two shapes, and picking the wrong one is a common early mistake:"
      ),
      list([
        "One-way NDA: only one party shares confidential information — typical when a business briefs a freelancer or vendor on internal details.",
        "Mutual NDA: both parties share sensitive information — typical when two companies explore a partnership, merger, or joint project.",
      ]),
      link("Read more: one-way vs. mutual NDA", "/blog/one-way-vs-mutual-nda"),

      h2("What a solid NDA actually covers"),
      p("Beyond the boilerplate, a well-written NDA answers four specific questions:"),
      list([
        "What information is confidential — vague language here (\"any information disclosed\") is the single most common weak point",
        "How the information may be used — for evaluating a deal, not for competing with it",
        "How long confidentiality lasts — most run 1–3 years for business information, longer for trade secrets",
        "What happens if someone breaks the agreement — even a plain statement that damages are hard to quantify can matter later",
      ]),

      h2("Where NDAs show up"),
      list(["Freelance projects", "Software development", "Partnerships", "Hiring processes", "Product launches"]),
      p(
        "A useful rule of thumb: if you'd be uncomfortable seeing the information you're about to share end up in a " +
          "competitor's hands, get the NDA signed first — not after the meeting, when it's already too late."
      ),

      h2("Signing an NDA online"),
      p(
        "Signing an NDA online is fast and legally valid in most jurisdictions under e-signature laws like ESIGN and " +
          "eIDAS. Tools like Docracy let you send an NDA without asking the other party to create an account first, " +
          "which matters most in exactly the situations NDAs come up in — a first call, a cold intro, a deal that " +
          "might not go anywhere. Nobody wants to sign up for software before they've even decided to work together."
      ),

      h2("Frequently asked questions"),
      h3("Is an NDA the same as a non-compete?"),
      p(
        "No. An NDA protects information — it stops someone from sharing or using what they learned. A non-compete " +
          "restricts where someone can work afterward. They're often signed together, but they do different jobs, and " +
          "many jurisdictions treat non-competes far more skeptically than NDAs."
      ),
      h3("Do NDAs expire?"),
      p(
        "Usually, yes — most NDAs specify a term for how long confidentiality obligations last, commonly one to three " +
          "years, though trade secrets are sometimes protected indefinitely. An NDA with no expiration date at all is " +
          "a red flag worth reading closely before signing."
      ),

      link("Send an NDA now — free mutual NDA template", "/nda-signing"),
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
          "a freelancer or vendor, and the flow of sensitive information really only runs in one direction."
      ),
      p(
        "A mutual NDA protects information from both sides. It's used when two companies collaborate, share code, or " +
          "exchange business plans — situations where each party has something to lose if the other one talks."
      ),

      h2("How to tell which one you need"),
      p(
        "Ask a simple question before you pick a template: after this conversation, will only one side know the " +
          "other's secrets, or will both? If a client is briefing a freelancer on internal pricing, that's one-way. " +
          "If two founders are comparing product roadmaps before a possible merger, that's mutual — even if one side " +
          "feels like they're sharing \"more.\""
      ),

      h2("Choose a one-way NDA when:"),
      list([
        "You hire a freelancer and need to share internal documents, client lists, or product plans with them",
        "You onboard a contractor who will see systems or data your business doesn't want exposed",
        "You're briefing a vendor before a project starts, and they have nothing comparably sensitive to protect",
      ]),

      h2("Choose a mutual NDA when:"),
      list([
        "You enter a partnership where both sides will share internal information to evaluate the deal",
        "You negotiate a merger or acquisition and due diligence runs both directions",
        "You exchange sensitive business plans, code, or financials with another company as equals",
      ]),

      h2("A mistake worth avoiding"),
      p(
        "Using a mutual NDA \"to be safe\" when only one side is actually sharing anything sensitive isn't wrong, " +
          "exactly, but it can create confusion later — the party with nothing to protect has no real incentive to " +
          "honor confidentiality obligations that don't apply to them in practice. When the relationship is genuinely " +
          "one-directional, a one-way NDA is simpler and clearer for everyone."
      ),

      h2("Frequently asked questions"),
      h3("Can a one-way NDA be converted to mutual later?"),
      p(
        "Yes — if a one-way relationship evolves into something more collaborative, it's normal to sign a new mutual " +
          "NDA rather than trying to retroactively amend the original one-way agreement."
      ),
      h3("Which one do most freelancers need?"),
      p(
        "Usually one-way, since a client is typically the one sharing sensitive information with the freelancer, not " +
          "the other way around. That said, if you're a freelancer sharing your own proprietary process or tooling, a " +
          "mutual version protects your side too."
      ),

      p("Both NDAs can be signed online in minutes, with no account required for the person signing."),
      link("Free mutual NDA template", "/free-templates/mutual-nda"),
      link("Free one-way NDA template", "/free-templates/unilateral-nda"),
    ],
  },
  {
    slug: "how-to-sign-an-nda-online",
    title: "How to sign an NDA online in minutes",
    description: "The five-step flow for signing an NDA online, and why online signatures are legally binding.",
    publishedDate: PUBLISHED,
    cluster: "NDA",
    blocks: [
      p(
        "The whole point of an NDA is to protect a conversation that hasn't happened yet — which means it only works " +
          "if it gets signed before that conversation starts. Online signing exists to make that timing realistic: no " +
          "printer, no scanner, no \"I'll send it over once I'm back at my desk.\""
      ),

      h2("The five-step flow"),
      list([
        "Upload your NDA or choose a template — a mutual or one-way NDA covers most situations",
        "Add signature fields where each party needs to sign and date",
        "Send the document to the other party's email",
        "The recipient opens the link and signs without creating an account",
        "Download the signed PDF for your records once everyone's done",
      ]),
      p(
        "For a one-on-one NDA, this whole sequence usually takes a few minutes end to end — most of that is spent " +
          "reading the document, not fighting with the software."
      ),

      h2("Why the signature holds up"),
      p(
        "Online signatures are legally binding in most countries under e-signature laws like the U.S. ESIGN Act and " +
          "UETA, and the EU's eIDAS regulation. What actually makes a signature valid isn't the pixel-perfect look of " +
          "a signature graphic — it's clear intent to sign, consent to do business electronically, and a reliable " +
          "record of who signed and when. A basic e-signature tool captures all three."
      ),
      p(
        "One honest caveat: a standard e-signature (the kind most tools, including Docracy's free tier, provide by " +
          "default) proves what was signed and when — not that the person who clicked \"sign\" is definitely who they " +
          "claimed to be. For a routine NDA between people who already know each other, that's rarely an issue. For " +
          "higher-stakes situations, look for a tool that offers identity-verified or advanced electronic signatures."
      ),

      h2("Common mistakes when sending an NDA for signature"),
      list([
        "Sending the NDA after the sensitive conversation instead of before it",
        "Using the wrong type — one-way when it should be mutual, or vice versa",
        "Leaving the confidentiality term (how long it lasts) blank or vague",
        "Not keeping a copy of the signed, completed PDF somewhere you can find it later",
      ]),

      link("Send an NDA now — free mutual NDA template", "/nda-signing"),
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
        "Freelancers often work with sensitive information: client data, internal documents, product ideas, pricing " +
          "that hasn't gone public yet. An NDA protects both sides and sets clear expectations before that " +
          "information changes hands — not after something's already gone wrong."
      ),

      h2("Why the freelancer benefits too, not just the client"),
      p(
        "It's easy to think of an NDA as something a client imposes on a freelancer, but it cuts both ways. A signed " +
          "NDA is often the reason a client is willing to share the details a freelancer actually needs to do good " +
          "work — internal metrics, a real product roadmap, unreleased branding. Without it, clients tend to hold back " +
          "information, which usually means a worse first draft and more revision cycles."
      ),

      h2("Benefits of using an NDA as a freelancer"),
      list([
        "Protects your client's data — and shows you take that seriously before they have to ask",
        "Signals professionalism — asking for or accepting an NDA reads as someone who's done this before",
        "Prevents misuse of your own work — a mutual NDA can protect your process or tools, not just the client's",
        "Builds trust early in the relationship, before either side has proven anything to the other",
      ]),

      h2("What to actually check before signing"),
      p(
        "Not every NDA a client sends is reasonable. Before signing, check that the confidentiality term has a clear " +
          "end date, that the definition of \"confidential information\" isn't so broad it covers things you already " +
          "knew before the project, and that it doesn't quietly restrict you from working with other clients in the " +
          "same industry — that's a non-compete clause dressed up as an NDA, and it's worth pushing back on."
      ),

      h2("Frequently asked questions"),
      h3("Should I have my own NDA, or just sign the client's?"),
      p(
        "Both are normal. Many freelancers keep a standard one-way or mutual NDA ready to send to a new client before " +
          "the first real conversation, rather than waiting to be asked."
      ),
      h3("Does an NDA cost anything to send?"),
      p(
        "Not necessarily — a free mutual or one-way NDA template, sent through a free e-signature tool, costs nothing " +
          "beyond a few minutes to fill in the details."
      ),

      link("Docracy for freelancers", "/industry/freelancers"),
      link("Free mutual NDA template", "/free-templates/mutual-nda"),
    ],
  },
  {
    slug: "nda-mistakes-to-avoid",
    title: "Common NDA mistakes and how to avoid them",
    description: "The most common NDA drafting mistakes — vague definitions, missing expiration dates, and more.",
    publishedDate: PUBLISHED,
    cluster: "NDA",
    blocks: [
      p(
        "Most NDA problems don't show up when the document is signed — they show up months later, when someone " +
          "actually needs to rely on it and discovers it doesn't say what they thought it did. The good news is that " +
          "the same handful of mistakes account for most of the trouble."
      ),

      h2("The most common NDA mistakes"),
      list([
        "Using vague definitions of confidential information — \"any information disclosed\" is so broad it's hard to enforce",
        "Forgetting expiration dates — an NDA with no end date is harder to argue about later than one with a clear term",
        "Not specifying allowed uses — what exactly can the receiving party do with the information?",
        "Not including consequences for breaches — even a general statement about damages gives you more to stand on",
        "Not signing the document properly — an NDA discussed verbally or over email isn't the same as a signed agreement",
      ]),

      h2("Why vague definitions cause the most damage"),
      p(
        "\"Confidential information\" sounds clear until someone has to argue about it. Does it cover information the " +
          "other party already knew? Information that becomes public through no fault of theirs? A specific NDA lists " +
          "categories — client lists, source code, pricing, product plans — rather than relying on one broad phrase to " +
          "do all the work."
      ),

      h2("A mistake that's easy to miss: mismatched NDA type"),
      p(
        "Sending a one-way NDA when the relationship is actually mutual (or the reverse) isn't a fatal error, but it " +
          "creates confusion about who's actually protected. If both sides are sharing sensitive information, a " +
          "one-way NDA leaves one party's disclosures completely uncovered."
      ),

      h2("Frequently asked questions"),
      h3("Can a poorly written NDA still be enforced?"),
      p(
        "Sometimes, but vague language gives both sides more room to argue about what it actually means — which is " +
          "exactly the outcome an NDA is supposed to prevent. Specificity is what makes an NDA useful in practice."
      ),
      h3("What's the single fix that helps the most?"),
      p(
        "Put a real end date on the confidentiality term and list specific categories of protected information " +
          "instead of one catch-all sentence. Those two changes alone fix most of the vagueness that causes disputes."
      ),

      p("A clear, specific NDA prevents misunderstandings and legal issues far more reliably than a vague one."),
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
          "language — clarity is more important. Two paragraphs that say exactly what's being delivered, by when, and " +
          "for how much will hold up better in practice than three pages of dense legalese nobody reads closely."
      ),

      h2("What makes a contract \"simple\" without making it weak"),
      p(
        "Simple doesn't mean vague. A short contract can still cover every point that matters — it just says each " +
          "one in plain language instead of formal clauses. The goal is a document both sides can read once, " +
          "understand fully, and refer back to later without needing a lawyer to translate it."
      ),

      h2("What every simple contract should answer"),
      list([
        "What is being delivered, specifically enough that both sides would describe it the same way",
        "By when — a real date or milestone, not \"soon\"",
        "For how much, and on what payment schedule",
        "What happens if either side wants to end the agreement early",
      ]),

      h2("When a simple contract isn't enough"),
      p(
        "Short and clear works well for freelance projects, one-off sales, and small vendor deals. It's the wrong " +
          "tool for anything involving significant liability, intellectual property transfer, or regulatory " +
          "requirements — those situations usually benefit from a lawyer's review, even if the final document is " +
          "still fairly short."
      ),

      h2("Frequently asked questions"),
      h3("Does a simple contract need to be notarized?"),
      p(
        "No, in almost all cases. A signed contract between two parties is generally enforceable without notarization " +
          "— notarization matters for a specific, narrower set of document types, not everyday business agreements."
      ),
      h3("Can a simple contract be sent and signed the same day?"),
      p(
        "Yes — that's usually the point. A one-page contract with clear terms, sent for e-signature, can go from " +
          "draft to fully signed in minutes rather than the days a mailed or printed contract would take."
      ),

      link("Free contract templates", "/free-templates"),
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
        "Signing a contract used to mean print, sign, scan, email — or worse, mail. Online signing collapses that " +
          "into a single flow: upload → add fields → send → sign → download, and it's legally binding in most " +
          "countries without anyone creating an account."
      ),

      h2("The flow, step by step"),
      list([
        "Upload the contract as a PDF, or start from a template if you don't have one yet",
        "Add signature and date fields where each party needs to sign",
        "Send it — the other party gets a link by email",
        "They review and sign directly in the browser, no software install or account required",
        "Download the completed, signed PDF once everyone's done",
      ]),

      h2("Why this counts as a real signature"),
      p(
        "Under laws like the U.S. ESIGN Act and the EU's eIDAS regulation, what makes an electronic signature valid " +
          "is intent to sign, consent to sign electronically, and a reliable record of the transaction — not the " +
          "visual style of the signature itself. A typed name confirmed through a proper e-signature flow generally " +
          "carries the same legal weight as a signature on paper."
      ),
      p(
        "That said, a standard e-signature confirms what was signed and when — it doesn't verify the signer's " +
          "identity the way a notarized or identity-verified signature would. For everyday contracts between people " +
          "who already know each other, that distinction rarely matters in practice."
      ),

      h2("Where this saves the most time"),
      list([
        "Contracts that need to close the same day a deal is agreed on",
        "Multi-party contracts, where mailing a paper copy around would take a week by itself",
        "Recurring contracts with the same structure — a saved template skips the setup step entirely",
      ]),

      link("Sign a contract now", "/prepare"),
    ],
  },
  {
    slug: "client-contract-basics",
    title: "What every client contract should include",
    description: "The essential sections every client contract needs, from scope of work to termination rules.",
    publishedDate: PUBLISHED,
    cluster: "Contract",
    blocks: [
      p(
        "Most client disputes don't come from bad faith — they come from a contract that never actually pinned down " +
          "what \"done\" looks like. A good client contract closes that gap before work starts, so both sides are " +
          "arguing from the same document instead of two different memories of a kickoff call."
      ),

      h2("The essentials every client contract should include"),
      list(["Scope of work", "Timeline", "Payment terms", "Responsibilities", "Confidentiality", "Termination rules"]),

      h2("Scope of work: the section that prevents the most arguments"),
      p(
        "Scope creep is the single most common source of client friction, and it's almost always a scope problem, " +
          "not a client problem. Spell out specifically what's included — number of revisions, what counts as a " +
          "\"page\" or \"deliverable\", and what's explicitly out of scope. If it's not written down, assume it will " +
          "come up as a disagreement eventually."
      ),

      h2("Payment terms worth spelling out"),
      list([
        "When payment is due — on signing, on delivery, or on a milestone schedule",
        "What happens if payment is late — a grace period, then what",
        "Whether a deposit is refundable if the client cancels early",
      ]),

      h2("Frequently asked questions"),
      h3("Do I need a lawyer to write a client contract?"),
      p(
        "Not for most freelance or small-business work. A clear template covering scope, timeline, payment, and " +
          "termination handles the vast majority of situations — a lawyer's review makes more sense for large " +
          "contracts, IP-heavy work, or anything with real regulatory exposure."
      ),
      h3("What's the most commonly missing clause?"),
      p(
        "Termination rules. Most people write a contract assuming the project goes as planned and skip what happens " +
          "if either side wants to end it early — which is exactly when a contract is needed most."
      ),

      link("Free client contract template", "/free-templates/freelance-service-agreement"),
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
          "provider and client by turning a verbal understanding — \"I'll handle your social media\" — into " +
          "something specific enough that either side could point to it later and say exactly what was agreed."
      ),

      h2("What a service agreement typically covers"),
      list([
        "The service itself — described specifically enough to avoid two different interpretations",
        "Delivery method and schedule — ongoing retainer, project-based, or recurring",
        "Cost and payment terms — flat fee, hourly, or milestone-based",
        "Duration and renewal — a fixed term, or ongoing until either side cancels",
      ]),

      h2("Service agreement vs. a simple contract"),
      p(
        "The two overlap a lot, but a service agreement usually implies an ongoing or recurring relationship — a " +
          "monthly retainer, a subscription-style service — rather than a single one-off deliverable. If the work is " +
          "genuinely a single project with a clear end, a simpler one-off contract often fits better."
      ),

      h2("A clause worth including: what happens if the service changes"),
      p(
        "Services evolve — a client wants more hours, a provider changes their process. A short clause describing " +
          "how changes get agreed on (an email confirmation, a signed addendum) saves a lot of \"wait, when did we " +
          "agree to that?\" later."
      ),

      h2("Frequently asked questions"),
      h3("Can a service agreement auto-renew?"),
      p(
        "Yes, and many recurring service agreements do — just make sure the renewal terms and cancellation notice " +
          "period are stated clearly, so neither side is surprised by an automatic renewal they didn't expect."
      ),
      h3("Who usually drafts the service agreement?"),
      p(
        "Typically the provider, since they're describing their own service — but either side can propose one, and " +
          "starting from a clear template speeds this up regardless of who writes the first draft."
      ),

      link("Free service agreement template", "/free-templates/freelance-service-agreement"),
    ],
  },
  {
    slug: "contract-templates-you-can-use-today",
    title: "Useful contract templates for everyday business",
    description: "The most popular ready-to-use contract templates for common business agreements.",
    publishedDate: PUBLISHED,
    cluster: "Contract",
    blocks: [
      p(
        "Starting a contract from a blank page is where most delay actually comes from — not the negotiation, not " +
          "the signing, just staring at an empty document deciding what sections to include. A decent template " +
          "solves that problem: it's a starting point you edit down to fit the specific deal, not a final answer."
      ),

      h2("Popular templates worth keeping on hand"),
      list(["Client contract", "Service agreement", "Work order", "Rental agreement", "Vendor agreement"]),

      h2("How to actually use a template well"),
      p(
        "The mistake to avoid is sending a template unedited. Every template needs the specific details filled in — " +
          "names, dates, scope, payment amounts — and any section that doesn't apply to your situation should be cut " +
          "rather than left in as unused boilerplate. A contract with obviously irrelevant clauses reads as sloppy, " +
          "even if the core terms are fine."
      ),

      h2("When a template isn't enough"),
      p(
        "Templates work well for common, repeatable situations — a freelance project, a standard vendor relationship, " +
          "a short-term rental. For anything with unusual terms, significant liability, or a large dollar amount, " +
          "start from a template but have someone review the final version before it goes out."
      ),

      h2("Frequently asked questions"),
      h3("Are free contract templates legally valid?"),
      p(
        "Yes — a template is just a starting structure. What makes any contract enforceable is the same regardless of " +
          "where the wording came from: clear terms, mutual agreement, and a proper signature from both sides."
      ),
      h3("Can the same template be reused for every client?"),
      p(
        "Often, yes, with the specific details swapped in each time — which is exactly why saving a standard template " +
          "(available on a paid Docracy workspace) is useful for anyone sending the same type of agreement repeatedly."
      ),

      link("Browse free templates", "/free-templates"),
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
        "\"How does an online signature actually work?\" comes up a lot, usually right after someone signs something " +
          "for the first time and wonders whether typing or drawing their name on a screen really counts. Short " +
          "answer: yes, and the mechanism behind it is more solid than it looks."
      ),

      h2("What happens when you sign online"),
      list([
        "You review the document on screen — the same PDF the other party sees, not a summary of it",
        "You draw, type, or upload a signature, and confirm consent to sign electronically",
        "The platform records the signing event: timestamp, IP address, and often a cryptographic hash of the document",
        "That hash lets anyone later verify the document hasn't been altered since it was signed",
      ]),

      h2("The part that actually matters: document integrity"),
      p(
        "The signature graphic itself is almost incidental — a scrawled signature or a typed name both work equally " +
          "well legally. What makes an e-signature meaningful is the record around it: proof that a specific person " +
          "consented to sign a specific, unaltered document at a specific time. A SHA-256 hash of the signed PDF is a " +
          "common way to prove that document integrity later, since even a single changed character produces a " +
          "completely different hash."
      ),

      h2("Why they're legally recognized"),
      p(
        "Online signatures are legally recognized under laws like the U.S. ESIGN Act and UETA, and the EU's eIDAS " +
          "regulation. These laws generally treat an electronic signature as equivalent to a handwritten one, as long " +
          "as there's clear intent to sign and a reliable record of the transaction. Some document types — wills, " +
          "certain court filings, some real estate transfers — are still excluded in various jurisdictions, so it's " +
          "worth checking before relying on e-signature for anything unusual."
      ),

      h2("Frequently asked questions"),
      h3("Does an online signature need to look like a real signature?"),
      p(
        "No — a typed name, a drawn signature, or an uploaded image of a signature are all generally treated the same " +
          "way legally, as long as the signing process itself captures clear consent."
      ),
      h3("What's an audit trail, and why does it matter?"),
      p(
        "An audit trail is the record of who signed, when, and from where. It's what you'd point to if a signature's " +
          "validity were ever questioned — it's the evidence, not the signature graphic itself."
      ),

      link("Sign a document online", "/prepare"),
    ],
  },
  {
    slug: "are-online-signatures-legally-binding",
    title: "Are online signatures legally binding?",
    description: "Yes, in most countries — here's what makes an online signature legally binding.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p(
        "Yes — in most countries, an online signature carries the same legal weight as a handwritten one. The " +
          "hesitation people feel about this usually comes from how casual e-signing feels compared to signing on " +
          "paper, not from any actual gap in the law."
      ),

      h2("What actually makes an online signature valid"),
      list(["Intent to sign", "Consent to do business electronically", "Clear record of the signature", "Integrity of the document"]),
      p(
        "Notice what's not on that list: a notarized identity check, a specific signature style, or special software. " +
          "The legal bar is about the process, not the aesthetics — which is why a typed name confirmed through a " +
          "proper e-signature flow is just as valid as an elaborate cursive signature."
      ),

      h2("The laws behind this"),
      p(
        "In the U.S., the ESIGN Act (federal) and UETA (adopted by most states) establish that electronic signatures " +
          "can't be denied legal effect just because they're electronic. In the EU, eIDAS does similar work, and also " +
          "defines tiers above a basic signature — Advanced and Qualified Electronic Signatures — for situations that " +
          "need stronger identity assurance."
      ),

      h2("Where a basic e-signature isn't enough"),
      p(
        "A standard e-signature proves what was signed and when — it generally doesn't verify that the person who " +
          "clicked \"sign\" is who they claim to be. For a freelance contract or NDA between people who already know " +
          "each other, that's rarely a real issue. For anything requiring identity-verified or qualified signatures — " +
          "certain regulated contracts, some government filings — a basic e-signature tool isn't the right fit, and " +
          "no honest e-signature provider should claim otherwise."
      ),

      h2("Frequently asked questions"),
      h3("Can someone challenge an e-signature's validity later?"),
      p(
        "In principle, yes — the same way a handwritten signature can be disputed. What protects you is the record " +
          "around the signature: timestamp, IP address, and the document's integrity, which is why keeping the " +
          "completed signed PDF (not just the unsigned draft) matters."
      ),
      h3("Do both parties need to use the same signing tool?"),
      p(
        "No. Only the sender needs an e-signature platform — the person signing typically just needs a link and a " +
          "browser, with no account or software of their own required."
      ),
    ],
  },
  {
    slug: "how-to-send-a-document-for-signature",
    title: "How to send a document for signature quickly",
    description: "The simplest possible flow for sending a document out for signature: upload, add fields, send.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p(
        "Sending a document for signature shouldn't be the slow part of a deal. In practice, the whole process " +
          "reduces to three real steps: upload → add fields → send. Everything after that is on the recipient."
      ),

      h2("Step by step"),
      list([
        "Upload the PDF you need signed — a contract, an NDA, a form, whatever it is",
        "Add signature and date fields where each signer needs to interact with the document",
        "Enter the signer's name and email, and choose sequential or all-at-once order if there's more than one",
        "Send — the recipient gets a link by email and can sign from any device without creating an account",
      ]),

      h2("Sequential vs. parallel signing"),
      p(
        "For a two-party contract, order rarely matters — both people can sign whenever it's convenient for them. " +
          "For anything with an internal approval step (a manager needs to sign before the document goes to a " +
          "client, for instance), sequential signing enforces that order automatically instead of relying on someone " +
          "to send it along manually at the right time."
      ),

      h2("What slows this down in practice"),
      list([
        "Forgetting to add a field a signer actually needs, which bounces the document back for corrections",
        "Sending to the wrong email address — always worth double-checking before hitting send",
        "Not adding yourself as a viewer or CC, so you find out a document was signed only when someone else mentions it",
      ]),

      h2("Frequently asked questions"),
      h3("How fast can a document actually get signed?"),
      p(
        "For a short document with a motivated signer, it's realistic to go from sent to fully signed in a few " +
          "minutes — the bottleneck is almost always how quickly the recipient opens the email, not the signing " +
          "process itself."
      ),
      h3("Do I need the recipient's permission before sending?"),
      p(
        "No formal permission is required to send a document for signature — but for the signature to be legally " +
          "meaningful, the recipient does need to consent to sign electronically, which the signing flow itself " +
          "captures as part of the process."
      ),

      link("Send a document for signature", "/prepare"),
    ],
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
    title: "Best tools for quick signatures",
    description: "Signing tools differ in complexity — some are enterprise-grade, others are built for fast, frictionless signing.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p(
        "\"Best e-signature tool\" depends entirely on what you're actually trying to do. A sales team running " +
          "hundreds of contracts a month needs something very different from a freelancer sending a handful of " +
          "agreements. Tools differ in complexity, and matching the tool to the job matters more than picking " +
          "whichever one has the most features."
      ),

      h2("What actually makes a signing tool \"quick\""),
      list([
        "No account required for the person signing — an account wall is where a lot of quick deals stall out",
        "A short path from upload to sent — ideally a minute or two, not a multi-step wizard",
        "Templates for documents you send repeatedly, so you're not rebuilding the same field layout each time",
        "A signing experience that works cleanly on a phone, since a lot of signers open the link on mobile",
      ]),

      h2("Where enterprise tools add friction for small jobs"),
      p(
        "Tools built for large organizations — DocuSign, Adobe Sign, PandaDoc — tend to bundle e-signature with " +
          "approval workflows, CRM integrations, and per-seat licensing. Those features are genuinely valuable at " +
          "scale, but for a single freelancer or small team sending occasional agreements, they mostly show up as " +
          "extra steps and a bigger bill."
      ),

      h2("Where a lighter tool makes more sense"),
      p(
        "Docracy is built for the other end of that spectrum: quick, low-stakes agreements between two people who " +
          "just want it signed. The free tier needs no account for either side on a short signing chain, and the " +
          "paid tier is a flat monthly price rather than a per-seat charge — a better fit when you're sending a " +
          "dozen documents a month, not a thousand."
      ),

      h2("Frequently asked questions"),
      h3("Is a free e-signature tool as legally valid as a paid one?"),
      p(
        "Yes — legal validity comes from the signing process meeting e-signature law requirements (intent, consent, " +
          "a reliable record), not from the price of the software. Paid tiers typically add convenience features " +
          "like templates and team access, not extra legal weight."
      ),
      h3("When does it make sense to pay for a heavier platform?"),
      p(
        "Once you need things a lightweight tool doesn't offer — CRM integration, bulk sending, identity-verified " +
          "signing, or compliance certifications a regulated industry specifically requires."
      ),

      link("See how Docracy compares to DocuSign", "/blog/docracy-vs-docusign"),
    ],
  },
  {
    slug: "why-simple-signing-tools-matter",
    title: "Why simple signing tools matter for small business",
    description: "Complex signing tools slow down workflows — simple tools increase completion rates and reduce onboarding friction.",
    publishedDate: PUBLISHED,
    cluster: "Signing",
    blocks: [
      p(
        "Complex tools slow down workflows. Simple tools increase completion rates and reduce onboarding friction — " +
          "and for a small business, the gap between those two outcomes is bigger than it sounds."
      ),

      h2("Where complexity actually costs you"),
      p(
        "Every extra step between \"send this contract\" and \"it's signed\" is a place a deal can stall. Asking a " +
          "client or new hire to create an account before they can even see the document is a common one — some " +
          "percentage of people simply won't finish that step, especially if the document isn't something they were " +
          "expecting to spend time on."
      ),

      h2("What a small business actually needs from a signing tool"),
      list([
        "A signing link the recipient can open and complete without registering for anything",
        "A flow that works as well on a phone as a laptop, since many signers open the email away from a desk",
        "Pricing that doesn't punish a small team the way per-seat pricing does",
        "Just enough features — templates, reminders — without the enterprise features nobody on a small team will use",
      ]),

      h2("A concrete example"),
      p(
        "A landscaping business sending a work order for a new client doesn't need an approval workflow, a CRM " +
          "integration, or bulk-send tools. It needs the client to open a link, sign, and get to work. Adding steps " +
          "in between doesn't make the transaction more secure — it just makes it more likely the client puts it off, " +
          "or texts back asking for a simpler way to confirm."
      ),

      h2("Frequently asked questions"),
      h3("Does a simpler tool mean a less secure one?"),
      p(
        "Not necessarily. Security comes from how a document's integrity and signing record are handled behind the " +
          "scenes, not from how many steps the user has to click through. A simple front end can still sit on top of " +
          "a solid audit trail."
      ),
      h3("How much does signing friction actually affect completion rates?"),
      p(
        "It's hard to put a precise number on it without fabricating a statistic, but the general pattern holds " +
          "across most digital processes: every additional required step (especially account creation) loses some " +
          "share of people who would otherwise have finished."
      ),
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
      p(
        "Most freelance disputes trace back to a document that either didn't exist or didn't say enough. A handful " +
          "of agreements cover the vast majority of situations a freelancer runs into — none of them need to be " +
          "complicated, but each one is worth having ready before you need it, not after."
      ),

      h2("The core documents"),
      list(["NDA", "Client contract", "Scope of work", "Payment agreement", "Work order"]),

      h2("Why each one earns its place"),
      list([
        "NDA — protects whatever confidential information a client shares with you before the real work starts",
        "Client contract — sets the overall relationship: what's delivered, when, and for how much",
        "Scope of work — the specific breakdown of deliverables and revisions for a given project, useful even alongside a broader contract",
        "Payment agreement — payment schedule, late-payment terms, and what happens if a client wants to cancel mid-project",
        "Work order — a lightweight document for smaller, one-off jobs that don't need a full contract",
      ]),

      h2("A realistic starting point"),
      p(
        "You don't need all five signed for every project. A small one-off job might only need a work order. A " +
          "recurring client relationship benefits from a full client contract plus an NDA up front, with individual " +
          "scopes of work for each new project after that. The point isn't to use every document every time — it's " +
          "to have the right one ready when the situation calls for it."
      ),

      h2("Frequently asked questions"),
      h3("What's the single most important document to start with?"),
      p(
        "A client contract, since it's the one document almost every freelance relationship needs regardless of " +
          "industry or project size. NDAs and scopes of work are situational; a contract covering the basics is " +
          "needed almost every time."
      ),
      h3("Can these documents be reused across clients?"),
      p(
        "Yes — that's the point of a template. Fill in the specific details for each new client rather than " +
          "rewriting the agreement from scratch every time."
      ),

      link("Free templates for freelancers", "/free-templates"),
    ],
  },
  {
    slug: "how-freelancers-can-protect-their-work",
    title: "How freelancers protect their work with agreements",
    description: "NDAs, clear contracts, and defined deliverables — the basics of protecting freelance work.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [
      p(
        "\"Protecting your work\" as a freelancer usually isn't about stopping outright theft — it's about " +
          "preventing the slow erosion that happens when scope, ownership, and payment terms are never written down " +
          "clearly. Three tools handle most of it: NDAs, clear contracts, and defined deliverables."
      ),

      h2("NDAs: protecting information, not just work product"),
      p(
        "An NDA protects the information exchanged during a project — client data, internal plans, your own process " +
          "if it's proprietary. It's less about the final deliverable and more about everything that gets discussed " +
          "along the way."
      ),

      h2("Clear contracts: protecting the relationship"),
      p(
        "A contract is what protects you if a client disappears mid-project, disputes an invoice, or tries to expand " +
          "the scope without renegotiating payment. The specific clauses that matter most for a freelancer: payment " +
          "terms, what happens on late payment, and who owns the work if the project is cancelled halfway through."
      ),

      h2("Defined deliverables: protecting your time"),
      p(
        "Vague deliverables (\"a website,\" \"some marketing copy\") are how scope creep happens — not through bad " +
          "faith, but because neither side defined \"done\" the same way. Listing specific deliverables, revision " +
          "counts, and what's explicitly out of scope turns a fuzzy expectation into something you can point back to."
      ),

      h2("Frequently asked questions"),
      h3("Who owns the work until the final invoice is paid?"),
      p(
        "That depends entirely on what the contract says — which is exactly why it needs to be in the contract. A " +
          "common approach is retaining ownership of the deliverable until final payment clears, then transferring it."
      ),
      h3("Is a verbal agreement with a long-time client enough?"),
      p(
        "It can work fine for a while, right up until it doesn't — a change in scope, a dispute, or a client's own " +
          "internal turnover can suddenly make a written record matter a lot. A short written contract costs little " +
          "and removes that risk entirely."
      ),

      link("Free contract templates for freelancers", "/free-templates"),
    ],
  },
  {
    slug: "simple-contracts-for-small-projects",
    title: "Simple contracts for small projects",
    description: "Even short freelance projects need a contract — clarity prevents disputes.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [
      p(
        "\"It's a small job, we don't need paperwork\" is one of the more common ways freelance projects go sideways. " +
          "Short projects still need contracts — not a lengthy one, just clarity on what's being delivered and for " +
          "how much, since disputes over small jobs are just as real as disputes over big ones."
      ),

      h2("Why size doesn't change the need for a contract"),
      p(
        "A $300 logo design and a $30,000 website redesign carry the same basic risk: the client and the freelancer " +
          "might remember the agreement differently once work is underway. The contract's job isn't to match the " +
          "dollar amount of the project — it's to remove ambiguity about scope, price, and delivery, regardless of " +
          "scale."
      ),

      h2("What a simple contract for a small project needs"),
      list([
        "A specific description of the deliverable — not \"a logo,\" but the exact number of concepts and revisions",
        "The price and when it's due",
        "A rough delivery date",
        "What happens if the client wants changes beyond what was originally agreed",
      ]),

      h2("Keeping it proportional"),
      p(
        "A one-page contract, or even a work order, is usually enough for a small project — there's no need to pad it " +
          "out with clauses that only matter for larger, longer-running engagements. Proportional doesn't mean " +
          "incomplete; it means covering the same essentials, briefly."
      ),

      h2("Frequently asked questions"),
      h3("Is a written quote the same as a contract?"),
      p(
        "Not quite — a quote states a price, but a contract also covers what happens if things go differently than " +
          "planned (late payment, cancellation, revision limits). A short contract built from a quote closes that gap."
      ),
      h3("How long should a small-project contract take to put together?"),
      p(
        "With a template, a few minutes — filling in the project specifics is usually the only real work involved."
      ),

      link("Free work order template", "/free-templates"),
    ],
  },
  {
    slug: "how-to-onboard-new-clients-quickly",
    title: "How freelancers onboard clients quickly",
    description: "The simple sequence for onboarding a new freelance client fast: NDA, contract, invoice, work.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [
      p(
        "The gap between \"a client says yes\" and \"work actually starts\" is where a lot of freelance momentum " +
          "gets lost. A fast, repeatable onboarding sequence keeps that gap short: send NDA → send contract → send " +
          "invoice → start work."
      ),

      h2("The four-step sequence"),
      list([
        "Send an NDA — if the project involves any confidential information, get this signed before the real conversation happens",
        "Send the contract — scope, timeline, and payment terms, so both sides start from the same understanding",
        "Send the invoice or deposit request — get payment terms confirmed before work begins, not after",
        "Start work — once everything's signed and the deposit (if any) has cleared",
      ]),

      h2("Why order matters here"),
      p(
        "Doing these out of order is where onboarding usually breaks down — starting work before the contract is " +
          "signed, or sending an invoice before scope is actually agreed on. Each step depends on the one before it: " +
          "the contract references terms the NDA already covers, and the invoice reflects what the contract actually " +
          "promises."
      ),

      h2("Making it fast without cutting corners"),
      p(
        "Speed here comes from having reusable templates ready, not from skipping steps. An NDA and contract you've " +
          "already drafted once, with the specific client details swapped in each time, can go out within minutes of " +
          "a client saying yes — which matters, since momentum fades fast once a prospect starts waiting."
      ),

      h2("Frequently asked questions"),
      h3("Can the NDA and contract be combined into one document?"),
      p(
        "Sometimes, for very simple engagements — but keeping them separate is usually cleaner, especially if the " +
          "NDA needs to survive even if the contract itself ends or is renegotiated."
      ),
      h3("Should the deposit be required before or after the contract is signed?"),
      p(
        "After. A deposit tied to a signed contract is far easier to justify and collect than one requested before " +
          "either side has formally agreed to anything."
      ),

      link("Onboard new clients fast", "/client-contracts"),
    ],
  },

  // --- Small Business cluster ---
  {
    slug: "agreements-every-small-business-needs",
    title: "Agreements every small business should have",
    description: "The essential agreement types every small business needs on hand, from vendor agreements to NDAs.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [
      p(
        "Most small businesses don't need a legal department — they need five or six agreement types on hand, ready " +
          "to send the moment a supplier, employee, or partner situation calls for one. Scrambling to draft an " +
          "agreement from scratch when the need arises usually means the paperwork happens after the risk, not before."
      ),

      h2("Key agreements to keep ready"),
      list(["Vendor agreement", "Service agreement", "Employment contract", "NDA", "Rental agreement"]),

      h2("Why each one matters for a small business specifically"),
      list([
        "Vendor agreement — sets pricing, delivery terms, and what happens if a supplier misses a deadline",
        "Service agreement — defines what a provider (you, or someone you hire) actually delivers, and at what cost",
        "Employment contract — covers pay, role, and termination terms for anyone joining the team",
        "NDA — protects business information shared with contractors, partners, or prospective hires before they're onboarded",
        "Rental agreement — covers equipment, space, or property the business leases or leases out",
      ]),

      h2("A practical way to get started"),
      p(
        "Rather than drafting all five at once, keep a free template for each ready and fill it in the first time a " +
          "real situation calls for it. Save the completed version as your working template for next time — most " +
          "small businesses only need to write each agreement type once, then reuse the structure repeatedly."
      ),

      h2("Frequently asked questions"),
      h3("Do I need a lawyer to review all of these?"),
      p(
        "Not typically for standard versions of these agreements. A lawyer's review is worth the cost for anything " +
          "involving significant dollar amounts, unusual terms, or regulatory exposure — but a standard vendor " +
          "agreement or NDA rarely needs one."
      ),
      h3("Which agreement do most small businesses skip that they shouldn't?"),
      p(
        "The NDA, usually — it's easy to assume a conversation with a supplier or contractor is casual enough not to " +
          "need one, right up until sensitive pricing or plans get shared in that same conversation."
      ),

      link("Free templates for small businesses", "/free-templates"),
    ],
  },
  {
    slug: "how-to-streamline-client-onboarding",
    title: "How small businesses streamline client onboarding",
    description: "Templates, automated sending, and reminders — the simple recipe for faster client onboarding.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [
      p(
        "Client onboarding is where a lot of small-business time quietly disappears — not because any single step is " +
          "hard, but because each new client means redoing the same paperwork from scratch. A simple three-part " +
          "approach fixes most of that: templates → send documents → automate reminders."
      ),

      h2("Start with templates"),
      p(
        "Every recurring onboarding document — a contract, an NDA, a welcome packet — should exist as a reusable " +
          "template with the client-specific fields left blank, not as a document you rewrite each time. The one-time " +
          "cost of building a clean template pays for itself after the second or third client."
      ),

      h2("Send documents without adding friction"),
      p(
        "New clients are the least likely to want to create an account before they've even started working with you. " +
          "A signing flow that lets them open a link and sign directly, without registering, keeps that early " +
          "momentum intact instead of giving them a reason to put it off."
      ),

      h2("Automate the follow-up"),
      p(
        "The most common onboarding bottleneck isn't the document itself — it's the client who opened it and then " +
          "forgot to sign. Automated reminders handle that without anyone on your team needing to manually track who " +
          "still owes a signature."
      ),

      h2("Frequently asked questions"),
      h3("How much time does this actually save?"),
      p(
        "It scales with how many new clients you onboard — for a business bringing on a handful of clients a month, " +
          "the time saved on redrafting documents and chasing signatures adds up quickly compared to handling each " +
          "one manually."
      ),
      h3("Is this only useful for larger teams?"),
      p(
        "No — a solo operator onboarding a few clients a month benefits just as much, since the time saved per client " +
          "is the same regardless of team size."
      ),

      link("Streamline your onboarding", "/onboarding-documents"),
    ],
  },
  {
    slug: "vendor-agreements-explained",
    title: "What is a vendor agreement?",
    description: "Vendor agreements define responsibilities, pricing, delivery terms, and confidentiality between a business and its suppliers.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [
      p(
        "A vendor agreement is the document that turns \"we're working with this supplier\" into something specific " +
          "enough to point back to when a delivery is late, a price changes, or a dispute comes up. It defines " +
          "responsibilities, pricing, delivery terms, and confidentiality between a business and its suppliers."
      ),

      h2("What a vendor agreement typically covers"),
      list([
        "What's being supplied — goods, materials, or a recurring service",
        "Pricing and payment terms, including how price changes get handled over time",
        "Delivery terms — schedule, method, and what counts as a missed deadline",
        "Confidentiality — especially if the vendor sees internal pricing, specs, or customer information",
        "Termination — how either side can end the relationship, and on what notice",
      ]),

      h2("Vendor agreement vs. purchase order"),
      p(
        "A vendor agreement sets up the ongoing relationship — the general terms that apply across every order. A " +
          "purchase order covers a single transaction under that relationship. Businesses that place recurring orders " +
          "with the same supplier benefit from having both: the agreement once, then a lightweight PO for each order."
      ),

      h2("Where these agreements go wrong"),
      p(
        "The most common gap is delivery terms — what actually counts as \"late,\" and what happens if it is. Without " +
          "that written down, a missed delivery becomes a conversation about goodwill instead of a conversation about " +
          "what was agreed."
      ),

      h2("Frequently asked questions"),
      h3("Does a vendor agreement need to be renewed every year?"),
      p(
        "Not necessarily — it depends on the term you set. Some vendor agreements run indefinitely until either side " +
          "cancels; others are set for a fixed term with an option to renew. Either works, as long as it's stated " +
          "clearly."
      ),
      h3("Who typically drafts the vendor agreement?"),
      p(
        "Either side can, though it's common for the business receiving the goods or service to propose the terms, " +
          "since they're usually the one with more to lose from vague delivery or pricing language."
      ),

      link("Send a vendor agreement — free template", "/vendor-agreements"),
    ],
  },
  {
    slug: "how-to-manage-recurring-documents",
    title: "How to manage recurring documents efficiently",
    description: "Reusable templates and automated reminders make recurring paperwork far less painful.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [
      p(
        "Recurring documents — monthly vendor invoices, quarterly compliance acknowledgments, repeat client " +
          "contracts — have a way of becoming a bigger time sink than they should be, mostly because each one gets " +
          "treated as a fresh task instead of a repeat of the last one. Two things fix most of that: reusable " +
          "templates and automated reminders."
      ),

      h2("Why recurring paperwork gets harder than it needs to be"),
      p(
        "The pattern is familiar: someone finds last quarter's document, copies it, manually updates the dates and " +
          "names, and hopes they didn't miss a field. Multiply that by every recurring document a business sends, and " +
          "it adds up to a surprising amount of repeated manual work for something that's structurally identical " +
          "each time."
      ),

      h2("Reusable templates"),
      p(
        "A saved template with the standard fields already in place — and just the client, vendor, or date-specific " +
          "details left to fill in — turns a repeat document into a two-minute task instead of a rebuild-from-scratch " +
          "one. This is one of the clearer cases where paying for a workspace with template support earns back its " +
          "cost quickly if you're sending the same document type every month."
      ),

      h2("Automated reminders"),
      p(
        "The other recurring failure point is the human one: someone forgets to send the document on schedule, or a " +
          "signer forgets to complete it once it's out. Automated reminders handle the follow-up without anyone " +
          "needing to track a spreadsheet of who's overdue."
      ),

      h2("Frequently asked questions"),
      h3("What counts as a \"recurring document\"?"),
      p(
        "Anything sent on a regular schedule with mostly the same structure each time — monthly invoices, quarterly " +
          "compliance forms, renewal agreements, repeat vendor purchase orders."
      ),
      h3("Is it worth setting up a template for something sent only a few times a year?"),
      p(
        "Usually yes, if it's sent more than once — the setup cost is small, and it removes the risk of missing a " +
          "field or using an outdated version the next time it comes around."
      ),

      link("Save reusable templates", "/pricing"),
    ],
  },
  {
    slug: "ai-contract-management-small-business",
    title: "Do Small Businesses Need AI Agreement Management?",
    description:
      "A 2026 Deloitte/Docusign study found AI contract platforms drive big efficiency gains — but it studied enterprises with thousands of contracts a year. Here's what actually applies if you're small.",
    publishedDate: "2026-08-01",
    cluster: "Small Business",
    blocks: [
      p(
        "A new industry report made the rounds recently: Deloitte and Docusign's 2026 study, " +
          "\"Capitalizing on AI: How Automated Agreement Workflows Drive ROI,\" surveyed over 1,100 senior " +
          "leaders across six countries and found that companies using AI and automation in contract " +
          "management are seeing real, measurable returns. If you run a small business or work freelance, " +
          "the headline numbers are eye-catching — but the fine print matters more than the headline."
      ),
      h2("What the report actually found"),
      p(
        "The topline numbers are genuinely impressive: respondents reported an average 36% efficiency gain " +
          "and 36% cost avoidance from mitigated risk after adopting AI and workflow automation in their " +
          "contract processes, with organizations using \"agentic\" AI workflows and an end-to-end platform " +
          "seeing close to 30% higher ROI than those that didn't."
      ),
      h2("Who the report is actually about"),
      p(
        "Here's the part that gets lost in the headlines: the study's respondents were senior leaders at " +
          "companies with 125 to 5,000+ employees, $25M to $1B+ in annual revenue, and anywhere from 500 to " +
          "10,000+ contracts a year. Nearly two-thirds of them use four or more separate tools just to manage " +
          "the contract lifecycle. This is a report about enterprise procurement, legal, and sales teams " +
          "juggling thousands of agreements a year — not about a two-person consultancy sending out a handful " +
          "of client contracts a month."
      ),
      h2("What doesn't transfer to a small team"),
      p(
        "Most of what the report recommends assumes a scale that simply doesn't apply if you're small: " +
          "buying an end-to-end \"agreement management platform,\" standing up formal AI governance, appointing " +
          "a Chief AI Officer, or integrating a contract tool with a CRM, ERP, and HR system. None of that is " +
          "wrong for a 3,000-employee company with a dedicated legal team — it's just not the problem a " +
          "freelancer or a 5-person shop actually has."
      ),
      h2("What actually does transfer"),
      p(
        "Strip away the enterprise scale and the report's own list of where AI helps most reads like a " +
          "checklist any small business can use today, no platform purchase required: drafting agreements from " +
          "a template instead of a blank page, flagging non-standard or risky clauses before you send " +
          "something out, and cutting the back-and-forth of manually re-explaining the same terms every time. " +
          "Those are exactly the capabilities Docracy's free AI tools already cover — a plain-English contract " +
          "explainer, a clause and risk highlighter, and a prompt-to-agreement generator that drafts a first " +
          "version for you — built into the same free signing flow, with no separate platform, seat licenses, " +
          "or IT integration project required."
      ),
      h2("The honest takeaway"),
      p(
        "If you're running a small business, the lesson from a report like this isn't \"go buy an agreement " +
          "management platform.\" It's that the specific things AI is good at in contracts — drafting, review, " +
          "catching risky language — are useful at any scale. You just don't need enterprise software to get " +
          "them."
      ),
      p(
        "You can read the original 2026 Deloitte/Docusign report at " +
          "docusign.com/blog/capitalizing-on-AI-deloitte-2026."
      ),
    ],
  },

  // --- Comparison cluster ---
  {
    slug: "best-alternatives-to-docusign",
    title: "Best DocuSign alternatives for simple agreements",
    description: "DocuSign is built for enterprise-scale signing — here's what to look for in a simpler alternative.",
    publishedDate: PUBLISHED,
    cluster: "Comparison",
    blocks: [
      p(
        "DocuSign built its reputation on enterprise-scale, compliance-grade signing — deep integrations, identity " +
          "verification options, envelope-based bulk workflows. That's exactly right for a large organization with " +
          "regulatory requirements. It's a lot of tool for someone who just needs an NDA or a freelance contract " +
          "signed by tomorrow."
      ),

      h2("What to actually look for in a simpler alternative"),
      list([
        "No account required for the person signing — this alone rules out several \"lightweight\" tools that still gate signing behind a signup",
        "Pricing that doesn't scale per seat, if you're not managing a large team",
        "A short path from upload to sent, without a multi-step setup wizard",
        "Enough audit trail to prove what was signed and when, even without enterprise compliance features",
      ]),

      h2("Where DocuSign is genuinely still the right call"),
      p(
        "If your contracts legally require identity-verified or qualified electronic signatures, or you need deep " +
          "integration with Salesforce, SAP, or a similar enterprise stack, DocuSign's scale and compliance " +
          "certifications are earning their price. Simplicity isn't the right tradeoff for every situation."
      ),

      h2("Where a lighter tool fits better"),
      p(
        "For quick, low-stakes agreements — freelance contracts, NDAs, one-off vendor deals — most of DocuSign's " +
          "enterprise features go unused, while its per-seat pricing and account requirements add friction that has " +
          "nothing to do with getting a document signed. That's the specific gap tools like Docracy are built to " +
          "fill: free, no-account signing for a short chain of signers, with a flat monthly price if you outgrow the " +
          "free tier."
      ),

      h2("Frequently asked questions"),
      h3("Is a DocuSign alternative less legally valid?"),
      p(
        "No — legal validity comes from the signing process meeting e-signature law requirements, not from brand " +
          "recognition. A properly built lightweight tool produces a signature just as enforceable as DocuSign's."
      ),
      h3("What's the biggest tradeoff of switching to a simpler tool?"),
      p(
        "Fewer enterprise features — deep CRM integrations, advanced compliance certifications, bulk envelope " +
          "management. For a small business or freelancer, those are rarely missed; for a large regulated " +
          "organization, they usually are."
      ),

      link("See the full price comparison vs. DocuSign", "/blog/docracy-vs-docusign"),
      link("Try Docracy free", "/docusign-alternative"),
    ],
  },

  // --- Product cluster ---
  {
    slug: "whatsapp-signing-now-available",
    title: "WhatsApp signing is here — sign without an inbox",
    description:
      "Docracy can now deliver signing links over WhatsApp, phone-bound and PIN-protected, as a step toward Advanced Electronic Signature. Free: 2/month. Paid: 10/month, then $0.50 each.",
    publishedDate: "2026-08-08",
    cluster: "Product",
    blocks: [
      p(
        "Email is still the default way to send a signing link, but it isn't always the fastest way to actually " +
          "reach someone. A lot of signers — clients abroad, contractors in the field, anyone who checks WhatsApp " +
          "before they check email — are easier to reach on a phone number than an inbox. Docracy can now deliver " +
          "the same signing link over WhatsApp instead."
      ),
      h2("How it works"),
      list([
        "The preparer adds a signer's WhatsApp number when sending a document.",
        "Docracy delivers the signing link to that number via WhatsApp, alongside the usual email invite.",
        "A PIN set by the preparer is required before that signer can sign — proof of more than just having the phone in hand.",
        "Delivery and read receipts are recorded in the audit trail, next to the existing tamper-evident hash of the signed PDF.",
      ]),
      h2("Why the PIN matters"),
      p(
        "Phone-bound delivery plus a required PIN is deliberate, not incidental. Together they're designed to meet " +
          "the EU eIDAS criteria for an Advanced Electronic Signature (AES) — a signature uniquely linked to and " +
          "capable of identifying the signatory, created under their sole control, and detectably tied to the " +
          "signed data. It's a meaningful step up from a simple electronic signature (SES), which just proves what " +
          "was signed and when, not who physically signed it."
      ),
      link("Read the full breakdown of WhatsApp signing", "/whatsapp-signing"),
      link("How this relates to Advanced Electronic Signature (AES)", "/advanced-electronic-signature"),
      h2("What it costs"),
      p(
        "Free, signed-up accounts get 2 WhatsApp-signed invites per month. Paid accounts get 10 per month included, " +
          "with additional sends billed at $0.50 each. Enterprise accounts get unlimited WhatsApp signing. " +
          "Anonymous, no-signup sends aren't eligible — WhatsApp signing requires a free Docracy account."
      ),
      link("See pricing", "/pricing"),
    ],
  },
  {
    slug: "introducing-the-docracy-marketplace",
    title: "Introducing the Docracy Marketplace — free templates, shared by everyone",
    description:
      "A quick tour of the Docracy Marketplace: how to find a template, fill it in, and share your own with the community — free, no account needed.",
    publishedDate: "2026-08-16",
    cluster: "Product",
    ogImage: "https://img.youtube.com/vi/H8LlazgJyTA/maxresdefault.jpg",
    blocks: [
      p(
        "The Docracy Marketplace is a free library of document templates — NDAs, lease agreements, offer letters, " +
          "wills, and dozens more — some written and reviewed by Docracy, others submitted by the community. Anyone " +
          "can browse it, fill in a template, and send it for signature without creating an account. Here's a quick " +
          "walkthrough of how it works, start to finish."
      ),
      video("H8LlazgJyTA", "The Docracy Marketplace, explained"),
      h2("Finding a template"),
      p(
        "Templates are organized by category — Business, Real Estate, Employment, Personal, and more — so you can " +
          "browse instead of guessing what a document is called. Each template shows whether it's an official " +
          "Docracy template or a community submission before you open it."
      ),
      h2("Sharing your own"),
      p(
        "If you've already drafted something useful — a vendor agreement, a roommate contract, an onboarding " +
          "checklist — you can submit the blank version to the Marketplace directly from the editor. Nothing " +
          "publishes automatically: every submission is reviewed by a real person first, then goes live credited to " +
          "the community."
      ),
      link("Browse the Marketplace", "/free-templates"),
      link("Submit a template", "/submit-template"),
      h2("What it costs"),
      p("Nothing, in either direction. Using a template is free, and submitting one is free — no plan required for either."),
    ],
  },
];

export function getArticle(slug: string): ArticlePost | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

/** Cluster display order — matches the order the topic list was originally planned in. Clusters
 *  with no published articles yet (Legal Basics, Product) simply won't appear on the index page. */
export const CLUSTER_ORDER = ["NDA", "Contract", "Signing", "Freelancer", "Small Business", "Comparison", "Legal Basics", "Product"];
