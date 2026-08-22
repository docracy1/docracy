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
          "is always the same: protect sensitive data before it's shared, not after it's already out."
      ),
      p(
        "You don't need a lawyer to send a reasonable NDA for most everyday situations — a freelancer signing before a " +
          "discovery call, two small businesses comparing notes on a potential partnership, a contractor getting a " +
          "look at internal pricing before a quote. What matters more than legal polish is that the document actually " +
          "gets signed before the sensitive conversation happens, not after."
      ),

      h2("The two types of NDA"),
      p("NDAs come in two shapes, and picking the wrong one is a common early mistake:"),
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

      h2("A concrete example"),
      p(
        "Say a startup founder wants to brief a freelance product designer on an unreleased feature before deciding " +
          "whether to bring them onto the project. The founder isn't sharing source code or financials — just a " +
          "roadmap document and a few early screens. A tightly scoped one-way NDA for that situation would name the " +
          "founder's company as the disclosing party, list \"unreleased product designs and roadmap materials\" as the " +
          "protected information instead of a vague catch-all, set a one-year confidentiality term, and explicitly " +
          "exclude information the designer already knew or that becomes public through no fault of theirs."
      ),
      p(
        "Notice what that example doesn't do: it doesn't try to cover every possible category of information " +
          "\"just in case,\" and it doesn't leave the term open-ended. Specific and time-bound is what actually holds " +
          "up when someone has to point back to the document months later."
      ),

      h2("Where NDAs show up"),
      list(["Freelance projects", "Software development", "Partnerships", "Hiring processes", "Product launches"]),
      p(
        "A useful rule of thumb: if you'd be uncomfortable seeing the information you're about to share end up in a " +
          "competitor's hands, get the NDA signed first — not after the meeting, when it's already too late."
      ),

      h2("When you probably don't need one"),
      p(
        "Not every conversation needs an NDA, and sending one reflexively can create friction where none is " +
          "warranted. A 15-minute intro call to see if there's mutual interest in working together, a conversation " +
          "limited to information that's already public, or an exchange of ideas so generic that a dozen other people " +
          "could have come up with the same thing — none of these need a signed agreement first. Save the NDA for the " +
          "moment actual specifics are about to change hands: a real roadmap, real numbers, real client names."
      ),

      h2("Signing an NDA online"),
      p(
        "Signing an NDA online is fast and legally valid in most jurisdictions under e-signature laws like ESIGN and " +
          "eIDAS. Docracy lets you send an NDA without asking the other party to create an account first, which " +
          "matters most in exactly the situations NDAs come up in — a first call, a cold intro, a deal that might not " +
          "go anywhere. Nobody wants to sign up for software before they've even decided to work together."
      ),
      p(
        "Sending a document with two or fewer signers is free — most one-way and mutual NDAs only ever need the two " +
          "parties, so this covers the typical case without a subscription. Every signed document also comes with a " +
          "timestamped audit trail showing when it was delivered, opened, and signed, plus a SHA-256 hash of the final " +
          "PDF so you can prove later that the file hasn't been altered."
      ),
      link("See the full step-by-step flow", "/blog/how-to-sign-an-nda-online"),

      h2("NDAs compared to other documents"),
      p(
        "An NDA is often confused with two other things it isn't. It's not the same as a non-compete: an NDA " +
          "restricts what someone can say, a non-compete restricts where they can work afterward. They're sometimes " +
          "signed together, but they do different jobs, and many jurisdictions treat non-competes far more " +
          "skeptically than NDAs. An NDA is also not the same as a confidentiality clause buried inside a larger " +
          "contract — that can work fine, but a standalone NDA is easier to reference on its own and easier to get " +
          "signed before the rest of a deal is finalized."
      ),

      h2("Frequently asked questions"),
      h3("Do NDAs expire?"),
      p(
        "Usually, yes — most NDAs specify a term for how long confidentiality obligations last, commonly one to three " +
          "years, though trade secrets are sometimes protected indefinitely. An NDA with no expiration date at all is " +
          "a red flag worth reading closely before signing."
      ),
      h3("One-way or mutual — which one do I need?"),
      p(
        "It depends on which direction the sensitive information flows. If only one side is disclosing anything, a " +
          "one-way NDA is simpler and clearer. If both sides are sharing information they'd rather not see repeated " +
          "elsewhere, a mutual NDA protects both of you under the same terms."
      ),
      link("Full breakdown: one-way vs mutual NDA", "/blog/one-way-vs-mutual-nda"),
      h3("Can I just use a free template, or do I need a lawyer?"),
      p(
        "For most everyday situations, a free template is enough — Docracy's Marketplace has more than 97 free " +
          "templates, including one-way and mutual NDAs, that cover the common cases without any drafting. A lawyer " +
          "is worth involving when the stakes are unusually high: large trade secrets, cross-border deals, or " +
          "anything where the definition of \"confidential\" needs to hold up under real scrutiny."
      ),
      h3("What's the most common reason an NDA fails to protect someone?"),
      p(
        "Vague drafting, not bad luck — a definition of confidential information so broad it's unenforceable, or a " +
          "missing expiration date that makes the whole agreement harder to argue about later."
      ),
      link("Common NDA mistakes to avoid", "/blog/nda-mistakes-to-avoid"),

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
      p(
        "Both types rest on the same legal foundation — a promise not to disclose or misuse specific information for " +
          "a defined period. If you want the fundamentals of what an NDA actually is and what it needs to cover " +
          "before picking a type, that's worth reading first."
      ),
      link("Background: what is an NDA and when do you need one?", "/blog/what-is-an-nda"),

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

      h2("Side by side"),
      list([
        "Direction of disclosure — one-way flows one direction only; mutual flows both ways under matching obligations",
        "Typical relationship — one-way: client and contractor, buyer and vendor; mutual: partners, co-founders, an acquirer and a target",
        "What's actually covered — a one-way NDA only protects the discloser's information, so anything the other party shares back is unprotected",
        "Drafting complexity — a mutual NDA needs symmetric obligations for both sides, which is why some templates default to mutual even when the relationship isn't",
      ]),

      h2("A mistake worth avoiding"),
      p(
        "Using a mutual NDA \"to be safe\" when only one side is actually sharing anything sensitive isn't wrong, " +
          "exactly, but it can create confusion later — the party with nothing to protect has no real incentive to " +
          "honor confidentiality obligations that don't apply to them in practice. When the relationship is genuinely " +
          "one-directional, a one-way NDA is simpler and clearer for everyone."
      ),

      h2("What happens if you use the wrong type"),
      p(
        "The more expensive mistake runs the other way: sending a one-way NDA when the relationship is actually " +
          "mutual. If both sides end up sharing sensitive information but only one direction was ever documented, " +
          "whatever the \"protected\" party discloses back is sitting outside the agreement entirely — there's simply " +
          "no clause covering it. That gap usually isn't noticed until it matters, which is the worst time to find out."
      ),
      link("More mistakes to watch for when sending an NDA", "/blog/nda-mistakes-to-avoid"),

      h2("When more than two parties are involved"),
      p(
        "Mutual NDAs aren't always just two companies — a three-way joint venture, or an acquisition where a target " +
          "company's founders sign alongside the buyer, both still need matching obligations for everyone involved. " +
          "In those cases, whether the document is one-way or mutual, it helps to control the order signatures " +
          "happen in. Docracy supports sequential signing, where each party is notified only after the one before " +
          "them finishes, and parallel signing, where everyone gets the document at once — useful when a mutual NDA " +
          "needs, say, both founders to sign before the buyer countersigns."
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
      link("Full guide: why freelancers should always use NDAs", "/blog/nda-for-freelancers"),
      h3("Does a mutual NDA cost more to send than a one-way one?"),
      p(
        "Not on Docracy — sending a document to two or fewer signers is free regardless of which type it is, and " +
          "free templates exist for both one-way and mutual NDAs. Pricing depends on signer count, never on the type " +
          "of agreement."
      ),
      h3("Is one type more enforceable in court than the other?"),
      p(
        "No — enforceability comes down to how specifically the agreement is drafted (clear definitions, a real " +
          "term, defined consequences), not to whether it's structured as one-way or mutual. A vague mutual NDA is " +
          "just as weak as a vague one-way NDA."
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

      h2("Sequential vs parallel signing for multi-signer NDAs"),
      p(
        "Most NDAs are two-party, but sometimes you need three or more signatures — a company, a contractor, and a " +
          "subcontractor all bound by the same confidentiality terms, for example. Docracy supports both sequential " +
          "signing, where each signer is notified in turn only after the person before them finishes, and parallel " +
          "signing, where everyone receives the document at once and can sign in any order. Sequential makes sense " +
          "when the order genuinely matters — say, your company needs to countersign last. Parallel is faster when " +
          "order doesn't matter and the priority is just getting everyone signed quickly."
      ),

      h2("Why the signature holds up"),
      p(
        "Online signatures are legally binding in most countries under e-signature laws like the U.S. ESIGN Act and " +
          "UETA, and the EU's eIDAS regulation. What actually makes a signature valid isn't the pixel-perfect look of " +
          "a signature graphic — it's clear intent to sign, consent to do business electronically, and a reliable " +
          "record of who signed and when. A basic e-signature tool captures all three."
      ),
      p(
        "One honest caveat: a Simple Electronic Signature (SES) — the default on Docracy, and on most e-signature " +
          "tools — proves what was signed and when, not that the person who clicked \"sign\" is definitely who they " +
          "claimed to be. Docracy isn't a Qualified Trust Service Provider and doesn't issue Qualified Electronic " +
          "Signatures (QES). For a routine NDA between people who already know each other, an SES is rarely an issue. " +
          "For higher-stakes situations, phone-bound signing (below) gets closer to an Advanced Electronic Signature."
      ),

      h2("What gets recorded automatically"),
      p(
        "Every signed document gets a timestamped audit trail — delivery, read receipt, and the signature event " +
          "itself — with no extra setup on your part. Docracy also generates a SHA-256 hash of the final signed PDF. " +
          "If a single byte of that file changes after signing, the hash won't match anymore, which gives you a way " +
          "to verify the document's integrity independent of Docracy itself, not just a promise that nothing changed."
      ),

      h2("Signing an NDA over WhatsApp"),
      p(
        "For situations where phone-bound signing matters — a signer without easy computer access, or a signature " +
          "you want tied more tightly to a specific device — Docracy supports signing over WhatsApp. It's " +
          "PIN-protected and bound to the signer's phone, designed to meet the eIDAS Advanced Electronic Signature " +
          "(AES) bar rather than the Simple Electronic Signature that's the default elsewhere on the platform. It " +
          "requires the sender to have a free Docracy account — WhatsApp signing isn't available on fully anonymous, " +
          "no-signup sends. Free accounts get one WhatsApp signature a month, paid plans get ten a month and then " +
          "$0.50 per additional signature, and enterprise plans get fifty a month under fair use."
      ),
      link("Read the full breakdown of WhatsApp signing", "/whatsapp-signing"),
      link("How this relates to Advanced Electronic Signature (AES)", "/advanced-electronic-signature"),

      h2("Common mistakes when sending an NDA for signature"),
      list([
        "Sending the NDA after the sensitive conversation instead of before it",
        "Using the wrong type — one-way when it should be mutual, or vice versa",
        "Leaving the confidentiality term (how long it lasts) blank or vague",
        "Not keeping a copy of the signed, completed PDF somewhere you can find it later",
        "Rebuilding the same NDA from scratch every time — if you send the same NDA repeatedly, a saved template (a paid feature) keeps the same fields and signer order ready to go",
      ]),

      h2("Frequently asked questions"),
      h3("Do I need to create an account to sign an NDA someone sent me?"),
      p(
        "No — anyone signing a document through Docracy's standard flow signs without creating an account. Only the " +
          "sender needs one, and even then only to unlock extras like saved templates or WhatsApp signing."
      ),
      h3("Is a typed or drawn signature actually legally binding?"),
      p(
        "Yes. Under ESIGN, UETA, and eIDAS, what makes a signature valid is clear intent to sign and a reliable " +
          "record of the act — not how polished the signature graphic looks."
      ),
      h3("What if I need more than two people to sign?"),
      p(
        "Sending a document to two or fewer signers is free. Beyond that, Docracy charges a flat $10 a month — not " +
          "per additional signer — so a three- or four-party NDA doesn't cost more per signature added."
      ),
      h3("Can I upload my own NDA instead of using a template?"),
      p(
        "Yes — upload any PDF as-is and place signature fields wherever you need them. Auto-detect field placement, " +
          "which is pattern-based rather than literal AI, can speed this up by suggesting likely signature and date " +
          "locations for you to confirm."
      ),

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

      h2("Which type of NDA fits a freelance relationship"),
      p(
        "Most freelance NDAs are one-way, since the client is usually the one disclosing anything sensitive. A " +
          "mutual NDA makes more sense when a freelancer brings their own proprietary process, dataset, or tooling " +
          "into the relationship and wants that protected too — that's the deciding question, not which side sent " +
          "the document first."
      ),
      link("One-way vs mutual: how to tell which one you need", "/blog/one-way-vs-mutual-nda"),

      h2("A quick example"),
      p(
        "Say a freelance data analyst is about to see a client's unreleased financial dashboard before quoting a " +
          "project. A one-way NDA naming the client as the disclosing party, listing \"financial data, dashboards, " +
          "and internal reporting\" as the confidential information, and running for two years protects the client " +
          "fully — without restricting anything about how the analyst applies their own general methodology on the " +
          "next project."
      ),

      h2("What to actually check before signing"),
      p(
        "Not every NDA a client sends is reasonable. Before signing, check that the confidentiality term has a clear " +
          "end date, that the definition of \"confidential information\" isn't so broad it covers things you already " +
          "knew before the project, and that it doesn't quietly restrict you from working with other clients in the " +
          "same industry — that's a non-compete clause dressed up as an NDA, and it's worth pushing back on."
      ),

      h2("Sending your own NDA as a freelancer"),
      p(
        "Many freelancers keep a standard NDA ready to send before the first real conversation, rather than waiting " +
          "to be asked. Upload your own PDF, or start from a free template on Docracy's Marketplace, add signature " +
          "fields for both parties, and send it — the client doesn't need to create an account to sign. If you work " +
          "with the same handful of repeat clients, saving that NDA as a reusable template (a paid feature) means the " +
          "fields and signer order are already set up the next time, instead of rebuilding it from scratch."
      ),

      h2("Staying organized across multiple clients"),
      p(
        "Once you're sending NDAs to more than one client, the paperwork matters as much as the wording. Every " +
          "signed document comes with its own timestamped audit trail — when it was delivered, opened, and signed — " +
          "and a SHA-256 hash of the final PDF, so if a dispute ever comes up months later, you have a record " +
          "independent of anyone's memory of the conversation."
      ),

      h2("When an NDA probably isn't necessary"),
      p(
        "Not every client interaction needs one. A short unpaid discovery call, a favor for a friend, or a project " +
          "limited to information that's already public doesn't call for a signed agreement first. Reflexively " +
          "sending an NDA before any conversation, even a low-stakes one, can read as distrustful rather than " +
          "professional — save it for the point where real specifics are actually about to change hands."
      ),

      h2("Frequently asked questions"),
      h3("Should I have my own NDA, or just sign the client's?"),
      p(
        "Both are normal. Many freelancers keep a standard one-way or mutual NDA ready to send to a new client before " +
          "the first real conversation, rather than waiting to be asked."
      ),
      h3("Does an NDA cost anything to send?"),
      p(
        "Not necessarily — sending a document to two or fewer signers (you and the client) is free on Docracy. A " +
          "subscription only kicks in beyond that, at a flat $10 a month rather than a per-signer charge."
      ),
      h3("What if a client refuses to sign an NDA I send?"),
      p(
        "Some pushback is normal, especially if the NDA feels heavier than the situation calls for — a mutual NDA " +
          "for a relationship that's really one-way, for instance, or vague terms neither side wants to commit to. " +
          "Try offering a shorter, more specific one-way version before assuming refusal is a red flag."
      ),
      link("Common NDA mistakes to avoid", "/blog/nda-mistakes-to-avoid"),
      h3("Can I sign an NDA from my phone if I'm between jobs or on site?"),
      p(
        "Yes — standard signing works from any device with a browser, no app or account required. For a more " +
          "phone-bound signing method, WhatsApp signing is also available when the sender has a free Docracy account."
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
          "one-way NDA leaves one party's disclosures completely uncovered. If you're not sure which type actually " +
          "fits your situation, it's worth checking before you send anything — the fix is free and takes two minutes; " +
          "sending the wrong document and redoing it later is the expensive version of the same mistake."
      ),
      link("One-way vs mutual NDA: how to tell which one you need", "/blog/one-way-vs-mutual-nda"),

      h2("A real example of what goes wrong"),
      p(
        "Two companies sign an NDA before discussing a potential acquisition. The NDA defines confidential " +
          "information as \"trade secrets,\" full stop — no mention of financials, customer lists, or product plans " +
          "that end up on the table during due diligence. Months later, one side's product roadmap turns up almost " +
          "verbatim in a competitor's pitch deck. Because \"trade secrets\" was never written to include product " +
          "roadmaps, the injured party has a much weaker case than they would with a specific list. The NDA " +
          "technically existed the whole time; it just never covered what actually got shared."
      ),

      h2("Mistakes on the signer's side, not just the drafter's"),
      p(
        "Not every mistake belongs to whoever wrote the NDA — plenty belong to whoever signed it without reading " +
          "closely. Skimming past the confidentiality term's end date, the actual scope of what's covered, or a " +
          "non-compete-style restriction hiding inside the definition of confidential information is especially " +
          "common for freelancers and contractors who get sent NDAs rather than write them."
      ),
      link("What freelancers should check before signing an NDA", "/blog/nda-for-freelancers"),

      h2("Process mistakes that have nothing to do with the wording"),
      p(
        "Some NDA disputes aren't about the contract language at all — they're about proving what actually happened " +
          "after signing. \"I never received that NDA\" or \"that's not the version I signed\" are common arguments " +
          "that have nothing to do with how the confidentiality clause was drafted. A timestamped audit trail " +
          "recording delivery, read, and signature events closes off the first kind of dispute; a SHA-256 hash " +
          "generated for the final signed PDF closes off the second, since even a single changed byte in the file " +
          "produces a different hash."
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
      h3("Do I need a lawyer to fix these mistakes?"),
      p(
        "Not usually — most of these are fixable by being specific rather than clever: name real categories of " +
          "information, set a real end date, and pick the correct one-way or mutual type. A lawyer earns their fee on " +
          "genuinely high-stakes deals, not on catching these basics."
      ),
      h3("How do I know if an NDA someone sent me has these problems?"),
      p(
        "Run it against the list above: is confidential information defined by specific categories or one broad " +
          "phrase, is there a real expiration date, does it say what you're allowed to do with the information, and " +
          "is it the right type (one-way or mutual) for how the information is actually flowing? If it fails more " +
          "than one of those, it's worth a closer read before signing."
      ),

      p("A clear, specific NDA prevents misunderstandings and legal issues far more reliably than a vague one."),
      link("Send an NDA now — free mutual NDA template", "/nda-signing"),
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
          "for how much will hold up better in practice than three pages of dense legalese nobody reads closely. The " +
          "word \"simple\" describes the writing, not the stakes — a one-page agreement between two freelancers can be " +
          "just as legally binding as a fifty-page vendor contract, provided it captures the same core elements: who " +
          "is agreeing to what, and what happens if either side falls short."
      ),
      h2("What makes a contract \"simple\" without making it weak"),
      p(
        "Simple doesn't mean vague. A short contract can still cover every point that matters — it just says each " +
          "one in plain language instead of formal clauses. A contract earns the word \"simple\" by cutting language, " +
          "not content: every clause a formal contract covers — scope, timeline, payment, remedies — still needs to " +
          "show up somewhere in a short contract; it just gets stated as a plain sentence instead of a numbered " +
          "clause with cross-references. The test is whether a person with no legal training could read it once and " +
          "explain it back correctly."
      ),
      h2("The four elements that make any agreement a contract"),
      p(
        "Regardless of length, an agreement becomes an enforceable contract when four things are present: an offer " +
          "(one side proposes specific terms), acceptance (the other side agrees to those same terms), consideration " +
          "(something of value changes hands — usually money for work, but it can be a trade of services), and " +
          "mutual intent to be bound (both sides actually mean for the agreement to be enforceable, not just a " +
          "casual conversation). A simple contract doesn't skip any of these — it just states them directly instead " +
          "of dressing them up in formal language."
      ),
      p(
        "For example, \"I'll design your logo for $400, delivered within two weeks, with two rounds of revisions " +
          "included\" contains an offer, and once the other side replies \"agreed,\" it has acceptance and " +
          "consideration too. That's already a contract, even before it's put into a formatted document — putting it " +
          "in writing and signing it just makes it easier to prove and reference later."
      ),
      h2("What every simple contract should answer"),
      list([
        "What is being delivered, specifically enough that both sides would describe it the same way",
        "By when — a real date or milestone, not \"soon\"",
        "For how much, and on what payment schedule",
        "Who is responsible for providing anything the other side needs to do the work, like files, access, or approvals",
        "What happens if either side wants to end the agreement early",
      ]),
      h2("Common formats a simple contract can take"),
      p("A simple contract doesn't have to look like a formal legal document to count as one. Common formats include:"),
      list([
        "A one-page letter agreement, written as plain prose rather than numbered clauses",
        "A signed quote or estimate that both sides agree becomes binding once accepted",
        "An email exchange where one side proposes terms and the other confirms them in writing",
        "A purchase order referencing agreed pricing and delivery terms",
        "A short template filled in with the specific deal's details",
      ]),
      p(
        "None of these requires the word \"Agreement\" in the title or a wall of \"whereas\" clauses to be enforceable " +
          "— what matters is that the terms are clear and both sides agreed to them."
      ),
      h2("When a simple contract isn't enough"),
      p(
        "Short and clear works well for freelance projects, one-off sales, and small vendor deals. It's the wrong " +
          "tool for anything involving significant liability, intellectual property transfer, or regulatory " +
          "requirements. A contract assigning ownership of a patent, a deal worth six figures, or an agreement " +
          "touching a licensed or regulated activity — healthcare, financial services, real estate transfers — is " +
          "exactly the kind of situation where \"simple\" stops being an asset and starts being a risk. Pay a lawyer " +
          "for an hour of review even if the resulting document is still only two pages."
      ),
      h2("A short example, start to finish"),
      p(
        "Say a freelance writer agrees to write eight blog posts for a small business at $150 each, delivered two " +
          "per week over a month, payment due within 15 days of each delivery. Written as a simple contract, that's " +
          "one paragraph: what's being delivered (eight 800-word blog posts on agreed topics), the schedule (two per " +
          "week for four weeks), the price ($150 per post, $1,200 total), and the payment terms (net 15 per " +
          "delivery). Add a sentence on what happens if either side wants to stop early — say, the client pays for " +
          "posts already delivered and either side can end the arrangement with a week's notice — and the contract " +
          "answers every question likely to come up over the four weeks of work."
      ),
      h2("Frequently asked questions"),
      h3("Does a simple contract need to be notarized?"),
      p(
        "No, in almost all cases. A signed contract between two parties is generally enforceable without " +
          "notarization — notarization matters for a specific, narrower set of document types, not everyday business " +
          "agreements."
      ),
      h3("Can a simple contract be sent and signed the same day?"),
      p(
        "Yes — that's usually the point. A one-page contract with clear terms, sent for e-signature, can go from " +
          "draft to fully signed in minutes rather than the days a mailed or printed contract would take."
      ),
      h3("Is a text message or email exchange a legally valid contract?"),
      p(
        "Often yes, if it clearly shows an offer and an acceptance — courts have enforced agreements made entirely " +
          "over email or text. The risk isn't legal validity, it's proof: a scattered thread is harder to point to " +
          "later than a single signed document, which is why it's worth consolidating agreed terms into one document " +
          "even after they're settled informally."
      ),
      h3("What's the difference between a contract and an agreement?"),
      p(
        "In everyday use, none — the words are used interchangeably. Legally, \"agreement\" is sometimes used more " +
          "loosely for an understanding that may or may not be enforceable, while \"contract\" implies all four " +
          "elements above are present. In practice, if it's written down, both sides signed it, and something of " +
          "value is exchanged, it will be treated as a contract regardless of what it's titled."
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
        "Signing a contract used to mean print, sign, scan, email — or worse, mail it and wait. Online signing " +
          "collapses that into a single flow: upload, add fields, send, sign, download — and it's legally binding in " +
          "most countries without either side creating an account. The mechanics are simple enough to learn in one " +
          "read-through, but a few decisions along the way, like sequential versus parallel signing, make a real " +
          "difference once more than two people are involved."
      ),
      h2("The flow, step by step"),
      list([
        "Upload the contract as a PDF, or start from a template if you don't have one yet",
        "Add signature and date fields where each party needs to sign",
        "Send it — the other party gets a link by email",
        "They review and sign directly in the browser, no software install or account required",
        "Download the completed, signed PDF once everyone's done",
      ]),
      h2("Sequential vs. parallel signing: which one you actually want"),
      p(
        "Every multi-signer contract has to decide, at least implicitly, whether signers go one at a time or all at " +
          "once. Sequential (ordered) signing sends the document to the first signer, and the second signer doesn't " +
          "get access — or even a notification — until the first one has finished. Parallel signing sends the same " +
          "link to everyone at the same time, and whoever signs first, signs first, with no waiting on anyone else."
      ),
      list([
        "Use sequential signing when terms should be reviewed and approved in a specific order — an employee signs first, then a manager countersigns, or a vendor accepts terms before a client's finance team signs off on payment",
        "Use sequential signing when a later signer's obligations depend on an earlier one actually agreeing — there's no point asking a guarantor to co-sign before the primary party has committed",
        "Use parallel signing when multiple independent parties are agreeing to the same terms with no dependency between them, like three co-founders signing an operating agreement",
        "Use parallel signing whenever speed matters more than sequencing — by definition it's the faster of the two, since nobody is waiting on anybody else",
      ]),
      h2("What happens on the sender's side"),
      p(
        "The person preparing the contract uploads it as a PDF exactly as it already exists — no reformatting " +
          "needed. From there, fields get placed on the document marking where each signer needs to sign, initial, " +
          "or fill in a date. On paid plans, field placement can be auto-detected from patterns in the document, " +
          "like signature lines or \"Date:\" labels, to speed this up — though it's pattern-matching rather than true " +
          "document understanding, so it's worth a quick check rather than blind trust on anything unusually " +
          "formatted. Manual field placement always works regardless of plan and takes maybe another minute for a " +
          "typical one- or two-page contract. Once fields are placed and assigned to the right signer, and the " +
          "signing order is set if it matters, the sender clicks send."
      ),
      h2("What happens on the signer's side"),
      p(
        "The signer gets an email with a link — no account, no password, no software to install. Opening the link " +
          "shows the document directly in the browser, with the fields needing attention highlighted. They review the " +
          "terms, type or draw a signature, check a box confirming they intend to sign electronically, and submit. " +
          "That's the entire experience from their end, and it typically takes under two minutes for a " +
          "straightforward contract. If the document is set up for sequential signing and it isn't their turn yet, " +
          "they simply won't have anything to click until the prior signer finishes."
      ),
      h2("Signing from a phone"),
      p(
        "Because the whole flow runs in a browser, there's no meaningful difference between signing on a laptop and " +
          "signing on a phone — the same link opens the same document, and a signature can be drawn with a finger " +
          "instead of a mouse. This matters more than it sounds: a lot of real-world signers are looking at the " +
          "email between meetings, not sitting at a desk, and a contract is far more likely to get signed the same " +
          "day if it doesn't require finding a computer first."
      ),
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
      h2("What the audit trail actually captures"),
      p(
        "Every step gets logged automatically: when the document was delivered, when it was opened, and when it was " +
          "signed, each with a timestamp. The completed PDF also gets a SHA-256 hash recorded against it, so any " +
          "later alteration to the file would produce a different hash and be detectable — useful if a signed " +
          "contract's authenticity is ever questioned. What this doesn't do is verify identity the way a notarized " +
          "signature or a government-ID check would: it records the IP address and timestamp of whoever clicked the " +
          "link, not a verified legal identity. For contracts between people who already know each other, that's " +
          "rarely an issue; for a scenario involving strangers or high-value transactions, it's worth knowing the " +
          "limitation going in."
      ),
      h2("Where this saves the most time"),
      list([
        "Contracts that need to close the same day a deal is agreed on",
        "Multi-party contracts, where mailing a paper copy around would take a week by itself",
        "Recurring contracts with the same structure — a saved template skips the setup step entirely",
        "Contracts with two or fewer signers, which cost nothing to send",
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
      p(
        "A useful habit: describe scope in countable units wherever possible — three homepage design concepts, up to " +
          "two rounds of revisions per concept, five total pages of copywriting — rather than open-ended language " +
          "like \"ongoing support\" or \"as needed.\" Open-ended language reads generously to the client and vaguely " +
          "to the provider, right up until the tenth request for \"just one more small tweak\" arrives with no clause " +
          "to point to."
      ),
      h2("Responsibilities: what the client owes, not just the provider"),
      p(
        "Contracts tend to describe the provider's obligations in detail and leave the client's side as an " +
          "afterthought, but a large share of delays trace back to the client, not the provider — a late round of " +
          "feedback, brand assets that never arrived, a stakeholder sign-off that took three weeks instead of three " +
          "days. Spell out what the client needs to supply and by when: access credentials, content or assets, " +
          "feedback within a stated number of business days, and a single point of contact authorized to approve " +
          "changes. If a deadline depends on the client meeting theirs, say so explicitly — most contracts don't, " +
          "which is exactly why timelines slip without anyone technically breaking the agreement."
      ),
      h2("Payment terms worth spelling out"),
      list([
        "When payment is due — on signing, on delivery, or on a milestone schedule",
        "What happens if payment is late — commonly a 7–14 day grace period before a late fee or pause in work applies",
        "Whether a deposit is refundable if the client cancels early — for example, a 50% deposit due at signing, refundable only if the provider hasn't yet started work",
      ]),
      h2("Confidentiality and who owns the final work"),
      p(
        "Two questions come up in almost every client relationship and belong in the contract rather than left to " +
          "assumption: what happens to confidential information either side shares, and who owns the deliverable " +
          "once it's finished. A simple confidentiality clause — neither side shares the other's non-public " +
          "information, during the engagement or after — covers most everyday cases. Ownership is usually " +
          "straightforward too: many client contracts transfer full ownership of the deliverable to the client once " +
          "final payment clears, meaning the provider can't reuse chunks of it elsewhere without permission, and the " +
          "client can't use it before paying in full. Anything more complex than that, like licensing part of the " +
          "work back to the provider or joint ownership, is worth a lawyer's eyes rather than guessing at contract " +
          "language."
      ),
      h2("Termination rules, and what a fair kill fee looks like"),
      p(
        "Most people write a contract assuming the project goes as planned and skip what happens if either side " +
          "wants to end it early — which is exactly when a contract is needed most. A workable termination clause " +
          "states a notice period (commonly one to two weeks), what the client owes for work already completed if " +
          "they cancel, and what the provider owes back if they're the one stepping away, usually a refund of any " +
          "deposit for work not yet delivered. A specific figure here, such as \"client pays for all work completed " +
          "through the termination date, plus 20% of remaining scope as a kill fee,\" prevents the argument from " +
          "happening in the first place."
      ),
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
      h3("How many revision rounds should a client contract include?"),
      p(
        "There's no universal number, but two rounds is a common default for creative and content work — enough to " +
          "make meaningful changes without inviting unlimited iteration. Whatever number is chosen, define what " +
          "happens after it's used up; additional rounds billed at an hourly rate is the most common approach."
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
          "genuinely a single project with a clear end, a simpler one-off contract often fits better, since it " +
          "doesn't need renewal or cancellation language at all."
      ),
      h2("Retainer vs. subscription vs. project: what's actually different"),
      p(
        "The term \"service agreement\" covers three fairly different arrangements, and mixing them up in the " +
          "contract language is a common source of confusion. A retainer is a pre-paid block of time or availability " +
          "— a client pays, say, $2,000 a month for up to 20 hours of work, with unused hours either rolling over or " +
          "expiring depending on what the agreement says. A subscription is a flat recurring fee for access to a " +
          "defined service or output regardless of exact hours worked — a monthly fee for ongoing website " +
          "maintenance, where the provider handles whatever comes up rather than tracking hours against a cap. A " +
          "project-based engagement, by contrast, is a single deliverable with a defined end, even if it's billed in " +
          "installments. Retainers and subscriptions are the two forms a service agreement is really built for; a " +
          "one-off project is usually better served by a simpler contract."
      ),
      h2("Structuring a monthly retainer well"),
      p(
        "A retainer agreement earns its keep by answering three questions clearly: how many hours or how much " +
          "output is included each month, what happens to hours that go unused (rolling over for a limited window is " +
          "common; expiring at month's end is simpler to administer), and what the rate is for work beyond the " +
          "included amount. Leaving any of these vague is what turns a retainer into a recurring argument — the " +
          "client assumes unused hours roll over indefinitely, the provider assumes they don't, and neither finds " +
          "out until month three."
      ),
      h2("Renewal and cancellation terms"),
      p(
        "Recurring service agreements commonly auto-renew — a monthly agreement rolls into the next month " +
          "automatically unless either side cancels. That's a convenience, not a trap, as long as the notice period " +
          "is stated clearly: 30 days' written notice before the next renewal is a common default, long enough that " +
          "a client isn't billed for a month they didn't intend to keep. State the notice period as a specific number " +
          "of days rather than \"reasonable notice,\" and specify how notice is given — an email to a stated address " +
          "is usually sufficient and simplest to prove later."
      ),
      h2("A clause worth including: what happens if the service changes"),
      p(
        "Services evolve — a client wants more hours, a provider changes their process. A short clause describing " +
          "how changes get agreed on, such as an email confirmation or a signed addendum, saves a lot of \"wait, " +
          "when did we agree to that?\" later."
      ),
      h2("Frequently asked questions"),
      h3("Should a retainer have a minimum commitment period?"),
      p(
        "Many do — a three-month minimum is common, giving both sides enough runway to see if the relationship " +
          "works before either can walk away. It's not required, but a retainer with no minimum term is functionally " +
          "month-to-month, which is worth deciding on purpose rather than by default."
      ),
      h3("Who usually drafts the service agreement?"),
      p(
        "Typically the provider, since they're describing their own service — but either side can propose one, and " +
          "starting from a clear template speeds this up regardless of who writes the first draft."
      ),
      link("Free service agreement template", "/free-templates/service-agreement"),
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
      h2("The templates worth keeping on hand"),
      p(
        "Rather than one generic \"contract template,\" it helps to have a small set built for specific situations, " +
          "so the starting document already matches the shape of the deal:"
      ),
      list(["Freelance service agreement", "Scope of work", "Vendor agreement", "Service agreement", "Work order"]),
      h2("A quick tour: what each template is actually for"),
      h3("Freelance service agreement"),
      p(
        "Built for a single provider doing project or ongoing work for a client — covers scope, payment, and basic " +
          "ownership terms in one document. This is usually the right starting point for freelance and small " +
          "consulting engagements."
      ),
      link("Freelance service agreement template", "/free-templates/freelance-service-agreement"),
      h3("Scope of work"),
      p(
        "A companion document rather than a standalone contract in most cases — it itemizes deliverables, " +
          "milestones, and timeline for one specific project or phase, often referenced by a broader agreement that " +
          "covers payment and legal terms once."
      ),
      link("Scope of work template", "/free-templates/scope-of-work"),
      h3("Vendor agreement"),
      p(
        "For buying goods or services from an outside vendor — covers delivery terms, pricing, and what happens if " +
          "a shipment or service falls short of what was promised."
      ),
      link("Vendor agreement template", "/free-templates/vendor-agreement"),
      h3("Service agreement"),
      p(
        "Built for a broader or ongoing service relationship — a retainer or subscription-style arrangement rather " +
          "than a single deliverable. Covers renewal and cancellation terms that a one-off project template doesn't " +
          "need."
      ),
      link("Service agreement template", "/free-templates/service-agreement"),
      h3("Work order"),
      p(
        "A short document for a specific job or task under an existing agreement — common in recurring vendor " +
          "relationships where a master agreement is signed once, and each new job just needs its own work order " +
          "referencing it."
      ),
      link("Work order template", "/free-templates/work-order"),
      h2("How to actually use a template well"),
      p(
        "The mistake to avoid is sending a template unedited. Every template needs the specific details filled in — " +
          "names, dates, scope, payment amounts — and any section that doesn't apply to your situation should be cut " +
          "rather than left in as unused boilerplate. A contract with obviously irrelevant clauses reads as sloppy, " +
          "even if the core terms are fine. The most common editing mistakes are avoidable with one careful " +
          "read-through before sending:"
      ),
      list([
        "Leaving placeholder text like [CLIENT NAME] or [$AMOUNT] in the final version — proofread the whole document, not just the first page",
        "Copying a template's payment schedule without changing it to match this specific deal",
        "Leaving in clauses that don't apply — a template written for hourly work still reads that way if switched to a flat fee without editing the payment section",
        "Forgetting to update the signer list and signing order for the actual parties involved",
        "Reusing an old copy that was already edited for a previous client, instead of starting again from the clean template",
      ]),
      h2("When a template isn't enough"),
      p(
        "Templates work well for common, repeatable situations — a freelance project, a standard vendor " +
          "relationship, a recurring work order. For anything with unusual terms, significant liability, or a large " +
          "dollar amount, start from a template but have someone review the final version before it goes out."
      ),
      h2("Saving a template for repeat use"),
      p(
        "Anyone sending a similar agreement repeatedly — the same freelance service agreement to each new client, " +
          "the same work order to a recurring vendor — benefits from saving a customized version as a reusable " +
          "template, available on a paid Docracy workspace. Rather than starting from the public template and " +
          "re-editing the same fields every time, a saved template keeps the boilerplate fixed and only prompts for " +
          "what changes: names, dates, and amounts."
      ),
      h2("Frequently asked questions"),
      h3("Are free contract templates legally valid?"),
      p(
        "Yes — a template is just a starting structure. What makes any contract enforceable is the same regardless " +
          "of where the wording came from: clear terms, mutual agreement, and a proper signature from both sides."
      ),
      h3("Can the same template be reused for every client?"),
      p(
        "Often, yes, with the specific details swapped in each time — which is exactly why saving a standard " +
          "template, available on a paid Docracy workspace, is useful for anyone sending the same type of agreement " +
          "repeatedly rather than re-editing a fresh copy every time."
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
          "answer: yes — and the mechanism behind it has more going on than the signature graphic you see on screen. " +
          "This is a look at what actually happens, step by step, from the moment a document is uploaded to the " +
          "moment it's locked as signed."
      ),
      h2("Anatomy of a signing session"),
      list([
        "The sender uploads a document and places signature, date, and text fields on it",
        "The recipient opens a unique link and views the exact same PDF the sender uploaded — not a converted copy or a summary",
        "The recipient fills in the fields and confirms consent to sign electronically, usually via an explicit checkbox or button, not an implied action",
        "At the moment of signing, the platform generates a cryptographic hash of the final document and timestamps the event",
        "Every step along the way — delivery, opening, viewing, signing — is written to an audit trail attached to that document",
      ]),
      h2("The signature graphic is almost incidental"),
      p(
        "A drawn signature, a typed name, and an uploaded image of a signature are all treated the same way by the " +
          "underlying system — none of them is what makes the signature secure. What actually matters is the record " +
          "built around the act of signing: proof that a specific person, at a specific time, consented to a " +
          "specific and unaltered document. That proof is what an audit trail and a cryptographic hash exist to " +
          "provide."
      ),
      h2("How the hash actually works"),
      p(
        "A SHA-256 hash takes the entire signed PDF — every byte of it — and reduces it to a fixed-length string of " +
          "characters. The same input always produces the same hash, but changing even one character in the " +
          "document (a date, a dollar figure, a single word) produces a completely different, unrelated-looking " +
          "hash. That's what makes it useful: instead of comparing two PDFs page by page to see if anything changed, " +
          "you compare two short strings. If they match, the document is provably identical to the one that was " +
          "signed. If they don't, something changed."
      ),
      p(
        "This is also why the hash has to be generated from the final signed PDF, not the draft that went out for " +
          "signature. A printed-and-rescanned copy of a signed document won't reproduce the original hash either — " +
          "scanning re-encodes the file at the byte level, even though the visible content looks the same. The " +
          "original digital file, not a printout of it, is what anyone would need to verify integrity later."
      ),
      h2("What's actually inside an audit trail"),
      list([
        "Each signer's name, email address (or phone number, for WhatsApp-delivered signing), and the IP address recorded at each action",
        "Timestamps for delivery, when the document was opened, when it was viewed, and when it was signed",
        "The exact consent language shown to the signer and confirmation that they agreed to it",
        "The hash of the completed document, generated at the moment signing finished",
      ]),
      p(
        "This is the record that would actually get pulled up if a signature's validity were ever questioned — not " +
          "the squiggle on the page. A typed name backed by a complete audit trail is stronger evidence than an " +
          "elaborate handwritten signature with no record behind it at all."
      ),
      h2("Sequential signing is enforced mechanically, not just requested"),
      p(
        "When a document is set to sequential order, the second signer's fields aren't just labeled \"sign after " +
          "person one\" — the platform withholds full access until the prior signer's completion event has actually " +
          "been logged. That's a structural difference from, say, emailing a PDF around and asking people to sign in " +
          "order: nothing stops someone from signing out of turn in an email chain, but a sequential digital " +
          "workflow can actually prevent it."
      ),
      h2("WhatsApp signing: a tighter identity link"),
      p(
        "A standard email-link signature ties a signing event to an email address and an IP address — enough for " +
          "most everyday agreements, but not a strong identity check on its own. Docracy's WhatsApp signing option " +
          "is phone-bound and PIN-protected, which links the signing event to something harder to spoof than an " +
          "inbox: a specific phone number confirmed with a one-time PIN. That's a meaningfully different technical " +
          "mechanism, not just a different delivery channel, and it's part of why it's designed to meet a higher " +
          "assurance bar than a basic email signature."
      ),
      h2("Why the law treats this as valid"),
      p(
        "Laws like the U.S. ESIGN Act, UETA, and the EU's eIDAS regulation generally treat a properly captured " +
          "electronic signature as legally equivalent to a handwritten one — the mechanism described above (consent, " +
          "a reliable record, document integrity) is exactly what those laws are checking for. The legal side of " +
          "this — including where a basic e-signature isn't enough — is its own topic; see "
      ),
      link("are online signatures legally binding", "/blog/are-online-signatures-legally-binding"),
      p("for the tiers of assurance and jurisdiction-specific detail."),
      h2("Frequently asked questions"),
      h3("Does an online signature need to look like a real signature?"),
      p(
        "No — a typed name, a drawn signature, or an uploaded image of a signature are all generally treated the " +
          "same way legally, as long as the signing process itself captures clear consent."
      ),
      h3("What's an audit trail, and why does it matter?"),
      p(
        "An audit trail is the record of who signed, when, and from where. It's what you'd point to if a " +
          "signature's validity were ever questioned — it's the evidence, not the signature graphic itself."
      ),
      h3("If I print and rescan a signed document, is it still verifiable?"),
      p(
        "Not against the original hash. Printing and scanning re-encodes the file, so the rescanned copy won't " +
          "match the hash generated at signing time even though it looks identical. Keep the original signed PDF " +
          "file itself, not a scanned printout of it, as the record that matters."
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
          "paper, not from any actual gap in the law. But \"legally binding\" isn't a single on/off switch — there " +
          "are real tiers of assurance underneath it, and knowing which one a given document actually needs is the " +
          "more useful question."
      ),
      h2("What actually makes an online signature valid"),
      list(["Intent to sign", "Consent to do business electronically", "Clear record of the signature", "Integrity of the document"]),
      p(
        "Notice what's not on that list: a notarized identity check, a specific signature style, or special " +
          "software. The legal bar is about the process, not the aesthetics — which is why a typed name confirmed " +
          "through a proper e-signature flow is just as valid as an elaborate cursive signature."
      ),
      h2("The laws behind this"),
      p(
        "In the U.S., the ESIGN Act (federal) and UETA (adopted by most states) establish that electronic " +
          "signatures can't be denied legal effect just because they're electronic. In the EU, eIDAS does similar " +
          "work. Outside the US and EU, most major economies have adopted broadly similar functional-equivalence " +
          "principles — the UK's Electronic Communications Act, Canada's provincial electronic commerce acts, and " +
          "Australia's Electronic Transactions Act all follow the same general logic that an electronic signature " +
          "isn't automatically weaker than a handwritten one. The specifics vary by jurisdiction and document type, " +
          "so cross-border agreements are worth a quick check if anything about the deal is unusual."
      ),
      h2("Three tiers of electronic signature"),
      p(
        "eIDAS is explicit about this in a way that's useful even outside the EU, because it names three distinct " +
          "levels of assurance that map onto how most e-signature tools actually work:"
      ),
      list([
        "Simple Electronic Signature (SES) — the default for most e-signature tools, including Docracy. It captures intent, consent, and a record, but doesn't verify the signer's real-world identity beyond an email address or phone number.",
        "Advanced Electronic Signature (AES) — uniquely linked to the signer, created using a method the signer can keep under their own control, and linked to the document so later changes are detectable. Docracy's WhatsApp signing — phone-bound and PIN-protected — is built specifically to meet this bar, since a confirmed phone number with a one-time PIN is a tighter identity link than an email address alone.",
        "Qualified Electronic Signature (QES) — everything AES requires, plus a qualified certificate issued by a licensed Qualified Trust Service Provider (QTSP) and a qualified signature creation device. Docracy is not a QTSP and doesn't issue QES signatures — no honest e-signature provider outside that regulated category should claim otherwise.",
      ]),
      h2("Where a basic e-signature isn't enough"),
      p(
        "A standard SES proves what was signed and when — it generally doesn't verify that the person who clicked " +
          "\"sign\" is who they claim to be beyond an email address. For a freelance contract or NDA between people " +
          "who already know each other, that's rarely a real issue. For situations that specifically require " +
          "identity-verified or qualified signatures — some regulated financial contracts, certain government " +
          "filings, some EU public-sector procurement, wills, and various real estate transfers depending on " +
          "jurisdiction — a basic e-signature tool isn't the right fit, and stepping up to AES (or, where genuinely " +
          "required, a QTSP-issued QES) matters more than which e-signature brand is used."
      ),
      h2("What actually gets scrutinized if a signature is challenged"),
      p(
        "If a signature's validity is ever disputed, what typically gets examined isn't the signature image at all " +
          "— it's whether intent was clearly captured, whether there's a reliable record tying a specific person to " +
          "a specific action, and whether the final document's integrity can be independently verified. That's a " +
          "technical question as much as a legal one; see "
      ),
      link("how online signatures work", "/blog/how-online-signatures-work"),
      p("for how the audit trail and document hash that back up a signature are actually built."),
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
      h3("Is a Simple Electronic Signature still valid in the EU, or does everything need to be Advanced or Qualified?"),
      p(
        "SES is still fully valid under eIDAS — the regulation specifically protects electronic signatures from " +
          "being denied legal effect solely for being \"simple\" or electronic. What changes at the AES and QES " +
          "tiers isn't validity so much as evidentiary strength and, for QES, a specific legal requirement in " +
          "certain regulated contexts."
      ),
      link("Learn about advanced electronic signatures", "/advanced-electronic-signature"),
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
          "reduces to three real steps: upload → add fields → send. Everything after that is on the recipient. " +
          "What's worth spending time on instead is getting the workflow right for how many people actually need to " +
          "sign, and in what order — that's where most of the avoidable delay actually lives."
      ),
      h2("Step by step"),
      list([
        "Upload the PDF you need signed — a contract, an NDA, a form, whatever it is",
        "Add signature and date fields where each signer needs to interact with the document",
        "Enter the signer's name and email, and choose sequential or all-at-once order if there's more than one",
        "Send — the recipient gets a link by email (or WhatsApp) and can sign from any device without creating an account",
      ]),
      h2("Sequential vs. parallel signing"),
      p(
        "For a two-party contract, order rarely matters — both people can sign whenever it's convenient for them, " +
          "so parallel (send-to-all-at-once) is usually the right default. For anything with an internal approval " +
          "step — a manager needs to sign before the document goes to a client, or a co-founder needs to sign " +
          "before an investor does — sequential signing enforces that order automatically instead of relying on " +
          "someone to notice and forward it along at the right moment."
      ),
      h2("Mixed order with three or more signers"),
      p(
        "Once there are three or more signers, the order often isn't purely one or the other. A common pattern: two " +
          "internal parties sign in parallel (they don't need to wait on each other), and then a final external " +
          "party signs only after both internal signatures are complete. Setting this up just means grouping the " +
          "signers correctly rather than defaulting everyone into one long sequential chain, which can needlessly " +
          "slow down the parts that didn't actually need to wait."
      ),
      h2("Practical tips for multi-signer documents"),
      list([
        "Label fields clearly by signer role (e.g. \"Contractor signature\" vs. \"Client signature\") so no one accidentally fills in a field meant for someone else",
        "In a sequential chain, one unresponsive signer holds up everyone after them — a reminder, or switching that signer to parallel if the order genuinely doesn't matter, keeps things moving",
        "Add yourself as a viewer or CC so you find out when a document is opened and signed, rather than hearing about it secondhand",
      ]),
      h2("Signing from a phone"),
      p(
        "A large share of recipients open a signing link from their phone, not a laptop, often straight from an " +
          "email or text notification. That means the fields need to be sized and positioned so they're easy to tap " +
          "without pinching and zooming, and the whole flow needs to work in a plain mobile browser — no app to " +
          "install first. For signers who are more likely to check WhatsApp than an inbox, sending the signing link " +
          "there instead is a real alternative delivery channel, not just a convenience — it's phone-bound and " +
          "PIN-protected, which also raises the identity assurance behind the signature."
      ),
      h2("Templates for documents you send repeatedly"),
      p(
        "If the same kind of document goes out often — the same freelance contract to every new client, the same " +
          "lease to every new tenant, the same work order format — a saved template keeps the field layout from " +
          "having to be rebuilt each time. Auto-detect field placement can also speed up setup on a new document by " +
          "recognizing common patterns like \"Signature:\" or \"Date:\" in the text — it's a helpful shortcut for " +
          "typical contracts, not a substitute for checking the fields landed in the right place."
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
          "minutes — the bottleneck is almost always how quickly the recipient opens the message, not the signing " +
          "process itself."
      ),
      h3("Do I need the recipient's permission before sending?"),
      p(
        "No formal permission is required to send a document for signature — but for the signature to be legally " +
          "meaningful, the recipient does need to consent to sign electronically, which the signing flow itself " +
          "captures as part of the process."
      ),
      h3("Can I change the document after it's been sent?"),
      p(
        "Not without restarting the process. Once a document is out for signature, the file itself is locked from " +
          "further edits — that's a deliberate constraint, not a missing feature, since it's what keeps the " +
          "eventual signed record trustworthy."
      ),
      link("Send a document for signature", "/prepare"),
      link("Browse free templates", "/free-templates"),
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
      h2("A checklist before you pick a tool"),
      list([
        "Does the signer need to create an account, or just open a link?",
        "Is pricing per-seat, flat-rate, or per-document — and does that match how many people on your side actually need to send documents?",
        "Can you upload any PDF as-is, or does the tool force you into its own document builder?",
        "Does it support more than one signer, with real control over sequential vs. parallel order?",
        "Is there an actual audit trail and a tamper-evident final document, or just a signature image with no record behind it?",
        "Is there a delivery option besides email for signers who are slow to check their inbox?",
      ]),
      h2("Where enterprise tools add friction for small jobs"),
      p(
        "Tools built for large organizations — DocuSign, Adobe Sign, PandaDoc — tend to bundle e-signature with " +
          "approval workflows, CRM integrations, and per-seat licensing. Those features are genuinely valuable at " +
          "scale, but for a single freelancer or small team sending occasional agreements, they mostly show up as " +
          "extra steps and a bigger bill."
      ),
      h2("Matching the tool to the scenario"),
      list([
        "A freelancer sending a one-off contract to a new client: a free tier with no account required for either side and a two-signer limit fits this almost exactly.",
        "A small agency sending the same proposal every week: worth paying for saved templates and auto-detect field placement, since a flat monthly fee for that convenience still comes in well under most per-seat enterprise plans.",
        "A sales team of eight running dozens of contracts a month with multiple internal approvers and a CRM to keep in sync: this is genuinely where DocuSign- or PandaDoc-class tools, with per-seat licensing and integrations, earn their price.",
        "A landlord or contractor whose signers don't reliably check email: a WhatsApp-based signing link — phone-bound and PIN-protected — reaches people who'd otherwise let an email link sit unopened for days.",
      ]),
      h2("The \"AI-powered\" claim worth double-checking"),
      p(
        "Several tools, including lightweight ones, market their field-placement feature as \"AI-powered.\" In " +
          "practice this is usually pattern matching against common phrases in the document's text layer — " +
          "recognizing something that looks like \"Signature:\" or \"Date:\" and dropping a field near it. That's a " +
          "genuinely useful shortcut for typical contracts, but it's closer to auto-detect than to a system that " +
          "understands the document. Worth checking the fields it places before sending, especially on anything " +
          "unusually formatted."
      ),
      h2("Where a lighter tool makes more sense"),
      p(
        "Docracy is built for the lighter end of that spectrum: quick, low-stakes agreements between two people who " +
          "just want it signed. The free tier needs no account for either side on documents with up to two signers, " +
          "and the paid tier is a flat $10-a-month price rather than a per-seat charge — a better fit when you're " +
          "sending a dozen documents a month, not a thousand."
      ),
      h2("Frequently asked questions"),
      h3("Is a free e-signature tool as legally valid as a paid one?"),
      p(
        "Yes — legal validity comes from the signing process meeting e-signature law requirements (intent, " +
          "consent, a reliable record), not from the price of the software. Paid tiers typically add convenience " +
          "features like templates and team access, not extra legal weight."
      ),
      h3("Does a lightweight tool support more than two signers?"),
      p(
        "Usually yes, just not for free. Most lightweight tools, including Docracy, move from a free tier to a " +
          "flat, low monthly fee once you go beyond two signers, rather than charging per additional seat the way " +
          "enterprise platforms do."
      ),
      h3("When does it make sense to pay for a heavier platform?"),
      p(
        "Once you need things a lightweight tool doesn't offer — CRM integration, bulk sending, identity-verified " +
          "signing, or compliance certifications a regulated industry specifically requires."
      ),
      link("See how Docracy compares to DocuSign", "/blog/docracy-vs-docusign"),
      link("Looking for a DocuSign alternative?", "/docusign-alternative"),
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
          "and for a small business, the gap between those two outcomes is bigger than it sounds. It shows up not " +
          "as a dramatic failure but as a slow leak: contracts that take three days to close instead of three " +
          "minutes, work orders that sit unsigned in an inbox, deals that quietly stall because signing felt like " +
          "one more chore."
      ),
      h2("Where complexity actually costs you"),
      p(
        "Every extra step between \"send this contract\" and \"it's signed\" is a place a deal can stall. Asking a " +
          "client or new hire to create an account before they can even see the document is a common one — some " +
          "percentage of people simply won't finish that step, especially if the document isn't something they " +
          "were expecting to spend time on."
      ),
      h2("What a small business actually needs from a signing tool"),
      list([
        "A signing link the recipient can open and complete without registering for anything",
        "A flow that works as well on a phone as a laptop, since many signers open the email away from a desk",
        "Pricing that doesn't punish a small team the way per-seat pricing does",
        "Just enough features — templates, reminders — without the enterprise features nobody on a small team will use",
      ]),
      h2("Three before-and-after scenarios"),
      p(
        "A freelance graphic designer used to send contracts as an email attachment. Clients would print it, sign " +
          "it, scan it back, or — more often — just reply \"sounds good\" with no signature at all, leaving no real " +
          "record if a scope disagreement came up later. Now the contract goes out as a signing link; most clients " +
          "complete it from their phone in under two minutes, and there's a timestamped record either way."
      ),
      p(
        "A small property management company used to require tenants to print, sign, and scan or drop off move-in " +
          "paperwork, which routinely caused delays right around move-in day when nobody has spare time for printer " +
          "trouble. Now the lease and move-in checklist go out digitally in advance, the tenant signs before " +
          "arrival, and sequential signing makes sure the property manager countersigns after — no separate " +
          "follow-up step required."
      ),
      p(
        "A solo contractor issuing a change order used to rely on a verbal agreement or a text message saying " +
          "\"ok, go ahead\" — a weak record if a dispute over scope or payment came up later. A one-page change " +
          "order sent for signature now takes less time than the phone call it replaced, and leaves a timestamped, " +
          "tamper-evident record instead of a text thread that's easy to lose track of."
      ),
      h2("A concrete example"),
      p(
        "A landscaping business sending a work order for a new client doesn't need an approval workflow, a CRM " +
          "integration, or bulk-send tools. It needs the client to open a link, sign, and get to work. Adding steps " +
          "in between doesn't make the transaction more secure — it just makes it more likely the client puts it " +
          "off, or texts back asking for a simpler way to confirm."
      ),
      h2("What friction actually costs a small team"),
      p(
        "A small business's signers are often people signing something for the first time that month, not a " +
          "procurement team that signs contracts all day — so every extra click or required account is a real " +
          "chance for them to set it aside and forget. And on the sending side, time spent chasing down a signature " +
          "that should have taken two minutes is time not spent on the actual job. It's hard to attach a precise " +
          "number to this without fabricating a statistic, but the general pattern is consistent: added friction, " +
          "especially a required account, loses some share of the people who would otherwise have finished."
      ),
      h2("Pricing is part of the friction story too"),
      p(
        "The friction isn't only on the signer's side. A per-seat price on the sending side means every teammate " +
          "who needs to send a document becomes a line-item decision about who \"needs a seat.\" A flat monthly " +
          "price removes that friction internally — anyone on a two-person team can send documents without a " +
          "budgeting conversation first. And since most small-business documents genuinely are two-party agreements " +
          "— a client and a freelancer, a landlord and a tenant, a contractor and a customer — a free tier scoped to " +
          "two signers matches how the majority of these documents actually get used, rather than forcing a paid " +
          "plan on day one."
      ),
      h2("Frequently asked questions"),
      h3("Does a simpler tool mean a less secure one?"),
      p(
        "Not necessarily. Security comes from how a document's integrity and signing record are handled behind the " +
          "scenes, not from how many steps the user has to click through. A simple front end can still sit on top " +
          "of a solid audit trail."
      ),
      h3("How much does signing friction actually affect completion rates?"),
      p(
        "It's hard to put a precise number on it without fabricating a statistic, but the general pattern holds " +
          "across most digital processes: every additional required step (especially account creation) loses some " +
          "share of people who would otherwise have finished."
      ),
      h3("Do I need every teammate to have a paid seat to send documents?"),
      p(
        "No — pricing here is flat per account per month rather than per user, so adding people to your team " +
          "doesn't multiply the cost the way it does with per-seat platforms."
      ),
      link("Send your first document for free", "/prepare"),
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
      h2("Going one level deeper on each"),
      p(
        "This post is deliberately a checklist rather than a deep dive — the goal is to get the full picture in one " +
          "place. Three areas are worth more detail than fits here, so they're covered separately."
      ),
      h3("Making sure the work stays yours"),
      p(
        "A signed contract doesn't automatically settle who owns the deliverable, when ownership transfers, or what " +
          "happens if a client disappears before final payment. That's a bigger topic than a checklist item can " +
          "cover."
      ),
      link("How freelancers protect their work", "/blog/how-freelancers-can-protect-their-work"),
      h3("Matching the paperwork to the job"),
      p(
        "A $250 one-off doesn't need the same contract as a $20,000 engagement, but it does need something. If " +
          "you're not sure how much contract a small project actually warrants, there's a decision framework for " +
          "that."
      ),
      link("Simple contracts for small projects", "/blog/simple-contracts-for-small-projects"),
      h3("Getting from a yes to a start date"),
      p(
        "Having the right documents doesn't help much if they take days to assemble every time a client says yes. " +
          "The sequence and the automation that keeps that gap short are covered in detail elsewhere."
      ),
      link("How to onboard new clients quickly", "/blog/how-to-onboard-new-clients-quickly"),
      h2("A realistic starting point"),
      p("You don't need all five signed for every project. What you actually use tends to track the shape of the work:"),
      list([
        "A one-off under a few hundred dollars — usually just a work order",
        "A single project in the low thousands — a client contract with a scope of work attached",
        "A recurring client relationship — an NDA and client contract up front, then a fresh scope of work for each new phase of work",
        "Anything involving a client's confidential data, unreleased product, or financials — an NDA before the first real conversation, regardless of project size",
      ]),
      p(
        "The point isn't to use every document every time — it's to have the right one ready when the situation " +
          "calls for it, so reaching for it doesn't cost you the momentum of a client who just said yes."
      ),
      h2("What skipping one actually costs"),
      p(
        "The failure mode isn't usually dramatic. It's a client who assumes three rounds of revisions were included " +
          "when you assumed one, a deliverable that sits unpaid for six weeks because no due date was ever attached " +
          "to the invoice, or a project that quietly doubles in scope because nobody wrote down what was originally " +
          "promised. None of these need a lawyer to prevent — they need a document that states the specifics before " +
          "work starts, so there's something to point back to if memories start to diverge."
      ),
      h2("Why this doesn't have to take long"),
      p(
        "Every one of these documents can be built once as a template and reused with the specifics swapped in for " +
          "each new client — that's most of what separates a five-minute onboarding step from a half-day one. " +
          "Because a freelancer-client agreement almost always has exactly two signers, it also falls under " +
          "Docracy's free tier by default; reusable saved templates are part of the paid plan, and every document " +
          "— NDA, contract, invoice — carries the same timestamped audit trail showing when it was sent, opened, " +
          "and signed."
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
      h3("Do I need a lawyer to put these together?"),
      p(
        "Not for most freelance work. A template covering the standard terms — scope, payment, ownership, " +
          "cancellation — handles the majority of situations. It's worth a lawyer's time for unusually large " +
          "contracts, or ones with terms you don't understand, but not for a routine project agreement."
      ),
      h3("What if a client refuses to sign an NDA?"),
      p(
        "It happens, especially with clients who are used to being the one drafting paperwork rather than signing " +
          "someone else's. If the information at stake is genuinely sensitive, it's reasonable to hold firm; if " +
          "it's a standard project with nothing particularly confidential involved, it may not be worth the " +
          "friction — that's a judgment call specific to the project, not a rule."
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
          "clearly. Three tools handle most of it: NDAs, clear contracts, and defined deliverables. But the part " +
          "that actually matters most in a dispute is narrower than all three: exactly when ownership of the work " +
          "changes hands, and what happens if it doesn't go as planned."
      ),
      h2("NDAs: protecting information, not just work product"),
      p(
        "An NDA protects the information exchanged during a project — client data, internal plans, your own " +
          "process if it's proprietary. It's less about the final deliverable and more about everything that gets " +
          "discussed along the way, including information a client might share during a discovery call before any " +
          "contract exists at all."
      ),
      h2("Clear contracts: protecting the relationship"),
      p(
        "A contract is what protects you if a client disappears mid-project, disputes an invoice, or tries to " +
          "expand the scope without renegotiating payment. The specific clauses that matter most for a freelancer: " +
          "payment terms, what happens on late payment, and who owns the work if the project is cancelled halfway " +
          "through."
      ),
      h2("Defined deliverables: protecting your time"),
      p(
        "Vague deliverables (\"a website,\" \"some marketing copy\") are how scope creep happens — not through bad " +
          "faith, but because neither side defined \"done\" the same way. Listing specific deliverables, revision " +
          "counts, and what's explicitly out of scope turns a fuzzy expectation into something you can point back " +
          "to."
      ),
      h2("Work-for-hire vs. a license: two different ownership models"),
      p(
        "Most client contracts use a work-for-hire structure: once the client pays in full, they own the " +
          "deliverable outright, and you keep nothing but the right to show it in a portfolio (if the contract says " +
          "so — otherwise not even that). The alternative is a license: you retain ownership of the underlying work " +
          "and grant the client rights to use it, which matters if you're building on reusable components — a code " +
          "library, a design system, a set of illustration assets — across multiple clients. Neither model is " +
          "automatically better; the mismatch happens when a freelancer assumes a license and the contract actually " +
          "says work-for-hire, or vice versa. That's a sentence worth reading carefully before signing, not " +
          "assuming."
      ),
      h2("Ownership timing: the clause that actually does the protecting"),
      p(
        "The riskiest gap in a freelance contract isn't whether the client eventually owns the work — it's when. " +
          "If a contract transfers ownership on delivery rather than on payment, you've handed over the asset " +
          "before you have any leverage left to collect on it. A contract that instead states ownership transfers " +
          "only upon receipt of full and final payment keeps that leverage intact: the client can review and use " +
          "drafts during the engagement, but the finished, licensed asset doesn't become theirs until the invoice " +
          "clears. In practice this reads as something like: \"Full ownership of the deliverables transfers to " +
          "Client only upon receipt of full and final payment; until then, all work product remains the exclusive " +
          "property of Freelancer.\" It's a small sentence that does a lot of the actual protecting."
      ),
      h2("Kill fees: getting paid for a project that ends early"),
      p(
        "A kill fee is a pre-agreed payment owed if a client cancels a project after work has started but before " +
          "it's finished. It exists because a freelancer who accepted a project typically turned down other work to " +
          "take it — cancellation shouldn't mean walking away with nothing for time already invested and " +
          "opportunity already forgone. A common structure scales with progress: no fee if cancelled before work " +
          "begins, a flat percentage of the total project fee (commonly somewhere in the 25–50% range) if cancelled " +
          "after work is underway, and full payment for any deliverables already completed and delivered. Whatever " +
          "the specific numbers, the point is to write them down before the project starts — negotiating a kill fee " +
          "after a client has already decided to cancel is a much harder conversation than agreeing to one in " +
          "advance."
      ),
      h2("When a client goes dark mid-project"),
      p(
        "This is one of the more common ways \"protecting your work\" actually comes up in practice: a client pays " +
          "a deposit, work begins, and then communication simply stops — no cancellation, no dispute, just silence. " +
          "Without a contract, it's unclear whether you're obligated to keep working, whether you can invoice for " +
          "partial work, or whether you can walk away and keep the deposit. A contract that includes an abandonment " +
          "clause — for example, treating a client as having terminated the engagement after a defined period of " +
          "non-response, commonly 15–30 days — resolves this cleanly: you retain the deposit, you're released from " +
          "any further deliverable obligations, and any partial work product stays yours until outstanding balances " +
          "are settled."
      ),
      h2("What this looks like in a real dispute"),
      p(
        "If a client later claims a deliverable was never finished, or disputes that they owe a cancellation fee, " +
          "the contract is the only neutral record of what was agreed. This is also where a timestamped audit trail " +
          "earns its keep — a record showing exactly when the contract was sent, when the client opened it, and " +
          "when they signed it removes any ambiguity about whether the terms were actually agreed to, not just " +
          "emailed and ignored."
      ),
      h2("Frequently asked questions"),
      h3("Who owns the work until the final invoice is paid?"),
      p(
        "That depends entirely on what the contract says — which is exactly why it needs to be in the contract. A " +
          "common approach is retaining ownership of the deliverable until final payment clears, then transferring " +
          "it."
      ),
      h3("Is a verbal agreement with a long-time client enough?"),
      p(
        "It can work fine for a while, right up until it doesn't — a change in scope, a dispute, or a client's own " +
          "internal turnover can suddenly make a written record matter a lot. A short written contract costs little " +
          "and removes that risk entirely."
      ),
      h3("Is a kill fee standard, or will it scare off clients?"),
      p(
        "It's common enough in freelance and consulting work that most experienced clients won't blink at it. " +
          "Framing it as compensation for time already committed, rather than a penalty, usually keeps the " +
          "conversation straightforward."
      ),
      h3("Can I reuse code or design elements from a work-for-hire project on future projects?"),
      p(
        "Only if the contract says so, or unless the reused element is a general-purpose tool or component you " +
          "built independently of the specific project rather than something created for that client. When in " +
          "doubt, keep proprietary building blocks under a license rather than a full work-for-hire assignment."
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
        "\"It's a small job, we don't need paperwork\" is one of the more common ways freelance projects go " +
          "sideways. Short projects still need contracts — not a lengthy one, just clarity on what's being " +
          "delivered and for how much, since disputes over small jobs are just as real as disputes over big ones."
      ),
      h2("Why size doesn't change the need for a contract"),
      p(
        "A $300 logo design and a $30,000 website redesign carry the same basic risk: the client and the " +
          "freelancer might remember the agreement differently once work is underway. The contract's job isn't to " +
          "match the dollar amount of the project — it's to remove ambiguity about scope, price, and delivery, " +
          "regardless of scale."
      ),
      h2("What a simple contract for a small project needs"),
      list([
        "A specific description of the deliverable — not \"a logo,\" but the exact number of concepts and revisions",
        "The price and when it's due",
        "A rough delivery date",
        "What happens if the client wants changes beyond what was originally agreed",
      ]),
      h2("The same principle, three different small jobs"),
      p("The specifics shift with the type of work, even when the contract stays just as short."),
      h3("A one-off design job"),
      p(
        "A $400 logo project needs a defined number of initial concepts (commonly two or three), a set number of " +
          "revision rounds, and a clause stating that file formats beyond the standard set (say, an editable source " +
          "file rather than just a PNG) count as an add-on rather than being assumed included. Design disputes on " +
          "small jobs are rarely about the design itself — they're almost always about an open-ended \"just a few " +
          "tweaks\" that turns into a fifth and sixth round."
      ),
      h3("A short writing engagement"),
      p(
        "A freelance writer delivering a set of blog posts or web copy benefits from a contract that specifies " +
          "word count per piece, the number of pieces, and one clear revision pass per piece rather than " +
          "\"revisions until satisfied.\" It's also worth stating upfront whether research and interviews are " +
          "included in the price or billed separately — a common source of scope disagreement on content work that " +
          "otherwise looks simple."
      ),
      h3("A one-off consulting call or audit"),
      p(
        "Paid consulting — a single strategy session, a technical audit, a one-time review — often gets skipped " +
          "entirely because it feels too small to formalize. But a one-page agreement stating the deliverable (a " +
          "written report, a recorded call, a set of recommendations), the time commitment, and the payment terms " +
          "prevents the awkward situation where a client expects unlimited email follow-up after what was billed as " +
          "a single session."
      ),
      h2("How simple is too simple? A quick framework"),
      p("Not every small project needs the same amount of paperwork. A few questions usually settle how much structure is warranted:"),
      list([
        "Is this a one-time job, or the first of a recurring relationship? Recurring relationships are worth a fuller contract even if the first project is tiny, since it sets the template for everything after.",
        "Does the project involve any information the client would consider confidential? If yes, add an NDA regardless of project size or price.",
        "Is there meaningful intellectual property at stake — custom code, an original design, a proprietary process? If yes, ownership timing deserves its own clear sentence, not just an assumption.",
        "Is the total value low enough that a dispute wouldn't be worth pursuing formally anyway? If so, a work order covering deliverable, price, and date is genuinely sufficient — there's no need to add clauses that only matter at a larger scale.",
      ]),
      p(
        "A useful rule of thumb: if you'd be upset but not surprised to lose the full project fee, a work order is " +
          "proportional. If losing it would actually hurt, or if the relationship is likely to continue, it's worth " +
          "the extra few minutes to use a fuller contract with clearer payment and cancellation terms."
      ),
      h2("Keeping it proportional"),
      p(
        "A one-page contract, or even a work order, is usually enough for a small project — there's no need to pad " +
          "it out with clauses that only matter for larger, longer-running engagements. Proportional doesn't mean " +
          "incomplete; it means covering the same essentials, briefly."
      ),
      h2("Frequently asked questions"),
      h3("Is a written quote the same as a contract?"),
      p(
        "Not quite — a quote states a price, but a contract also covers what happens if things go differently than " +
          "planned (late payment, cancellation, revision limits). A short contract built from a quote closes that " +
          "gap."
      ),
      h3("How long should a small-project contract take to put together?"),
      p("With a template, a few minutes — filling in the project specifics is usually the only real work involved."),
      h3("Should a $200 job and a $2,000 job use the same template?"),
      p(
        "They can use the same base template, but the $2,000 job is usually worth a slightly fuller version — a " +
          "defined payment schedule (deposit plus balance rather than one lump sum) and a cancellation clause tend " +
          "to earn their place once the amount at risk gets meaningfully larger."
      ),
      link("Free work order template", "/free-templates/work-order"),
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
          "signed, or sending an invoice before scope is actually agreed on. Each step depends on the one before " +
          "it: the contract references terms the NDA already covers, and the invoice reflects what the contract " +
          "actually promises."
      ),
      h2("What to automate before you need it"),
      p(
        "Speed here doesn't come from rushing through each step — it comes from removing the parts that don't need " +
          "a human decision each time. A few things are worth setting up once so they're not rebuilt for every new " +
          "client:"
      ),
      list([
        "A saved contract and NDA template with your standard terms already filled in, leaving only client name, project details, and price to update",
        "A fixed signer order — NDA first, contract second — so the sequence enforces itself instead of relying on you to remember it",
        "A standard payment schedule (for example, 50% deposit, 50% on delivery) that's the default unless a specific project calls for something else",
        "A short intake form or questionnaire sent alongside the contract, so project details you'd otherwise chase down over email arrive upfront instead",
      ]),
      p(
        "None of this requires anything exotic — Docracy's field auto-detect can place standard signature and date " +
          "fields on an uploaded contract automatically, and a saved template means the next new client only " +
          "requires filling in what's actually different about that engagement."
      ),
      h2("What belongs in an onboarding packet"),
      p(
        "A strong onboarding packet is less about the number of documents and more about giving a new client " +
          "everything they need in one pass, rather than in five separate follow-up emails. A reasonably complete " +
          "packet includes: the NDA (if applicable), the signed contract, an attached scope of work spelling out " +
          "deliverables and revision limits, the invoice or deposit request, and a short kickoff note covering how " +
          "you communicate (email, a project tool, response-time expectations) and what the client needs to " +
          "provide before work can start (assets, access, feedback deadlines). Sending all of this together, rather " +
          "than trickling it out, is what actually makes onboarding feel fast from the client's side — even if the " +
          "underlying documents took you five minutes to prepare from a template."
      ),
      h2("Timing benchmarks worth aiming for"),
      p(
        "There's no universal standard, but a few rough benchmarks separate onboarding that feels fast from " +
          "onboarding that lets a prospect's interest cool off: an NDA out within the same conversation or within " +
          "an hour of a client asking for one; a contract out within 24 hours of scope being agreed, ideally the " +
          "same day; an invoice or deposit request sent the moment the contract is signed, not after a follow-up " +
          "email; and work starting as soon as the deposit clears — which, depending on payment method, can be " +
          "instant or take a few business days, so it's worth stating that expectation upfront rather than leaving " +
          "the client guessing."
      ),
      h2("Making it fast without cutting corners"),
      p(
        "Speed here comes from having reusable templates ready, not from skipping steps. An NDA and contract " +
          "you've already drafted once, with the specific client details swapped in each time, can go out within " +
          "minutes of a client saying yes — which matters, since momentum fades fast once a prospect starts " +
          "waiting."
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
      h3("How fast is realistically achievable for a first-time client?"),
      p(
        "With templates ready, same-day onboarding — NDA, contract, and invoice all out within a few hours of a " +
          "client agreeing to move forward — is a reasonable target. What usually slows it down isn't the " +
          "paperwork itself, it's waiting on the client to review and sign, which a clear, short document makes " +
          "easier to do quickly."
      ),
      h3("What if a client wants to start before anything is signed?"),
      p(
        "It's worth resisting, even for a trusted-feeling new client — this is precisely the scenario contracts " +
          "exist for. A same-day contract turnaround removes most of the client's reason to ask, since there's " +
          "little practical delay being avoided by skipping it."
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
        "Most small businesses don't need a legal department — they need five or six agreement types on hand, " +
          "ready to send the moment a supplier, employee, or partner situation calls for one. Scrambling to draft " +
          "an agreement from scratch when the need arises usually means the paperwork happens after the risk, not " +
          "before, which is exactly backwards from how it should work."
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
      h2("How to tell which one you need right now"),
      p(
        "A quick way to sort it out: if money is going to change hands before any work has started, you need a " +
          "vendor or service agreement in place first — not a verbal understanding you'll formalize later. If " +
          "someone is joining the business in any ongoing capacity, even part-time, that's an employment contract, " +
          "regardless of how informal the arrangement feels at first. If a conversation is about to involve " +
          "pricing, a customer list, a product roadmap, or anything else you wouldn't want repeated outside the " +
          "room, that's the moment for an NDA — before the conversation, not after it's already happened."
      ),
      h2("What it costs to skip one"),
      p(
        "The pattern shows up the same way across small businesses. A supplier raises prices mid-order and there's " +
          "nothing written down about notice periods, so the increase either gets absorbed or turns into a " +
          "standoff. A contractor who helped set up an internal process leaves and starts consulting for a direct " +
          "competitor, and there was never an NDA to point to. A new hire disputes their termination terms because " +
          "pay and role were only ever discussed verbally. None of these are dramatic legal failures — they're the " +
          "ordinary cost of not having the right one-page document ready when the moment called for it."
      ),
      h2("A practical way to get started"),
      p(
        "Rather than drafting all five at once, keep a free template for each ready and fill it in the first time " +
          "a real situation calls for it. Save the completed version as your working template for next time — most " +
          "small businesses only need to write each agreement type once, then reuse the structure repeatedly. " +
          "Documents with two or fewer signers stay free to send; a flat $10 a month covers everything beyond " +
          "that, with no per-signer pricing to track. Signers never need to create an account to open and sign, " +
          "which matters most for the first document you ever send someone — it's the one most likely to stall if " +
          "there's friction."
      ),
      h2("When an agreement needs more than two signatures"),
      p(
        "Some of these aren't strictly two-party. A rental agreement might need a co-signer; an employment " +
          "contract might need sign-off from both the new hire and a manager before it's final. For those, an " +
          "ordered signing sequence makes sure each person only sees the document after the person before them has " +
          "signed, and a timestamped audit trail records exactly when it was delivered, opened, and signed by each " +
          "party — useful if a termination or delivery dispute ever needs a paper trail to settle it."
      ),
      h2("Go deeper on the ones you'll use most"),
      p(
        "This page is meant as the starting checklist — for the agreements small businesses touch most often, a " +
          "closer look at how to actually run them pays off. If client-facing work is where most of your paperwork " +
          "happens, see how to structure the whole onboarding sequence. If suppliers are the bigger source of " +
          "friction, the vendor agreement deep dive covers price-change clauses and delivery disputes directly. " +
          "And if you're sending the same document on a repeating schedule — invoices, renewals, compliance forms " +
          "— the recurring documents guide covers how to template and version them properly."
      ),
      link("How to streamline client onboarding", "/onboarding-documents"),
      link("Vendor agreements explained", "/vendor-agreements"),
      h2("Frequently asked questions"),
      h3("Do I need a lawyer to review all of these?"),
      p(
        "Not typically for standard versions of these agreements. A lawyer's review is worth the cost for anything " +
          "involving significant dollar amounts, unusual terms, or regulatory exposure — but a standard vendor " +
          "agreement or NDA rarely needs one."
      ),
      h3("Which agreement do most small businesses skip that they shouldn't?"),
      p(
        "The NDA, usually — it's easy to assume a conversation with a supplier or contractor is casual enough not " +
          "to need one, right up until sensitive pricing or plans get shared in that same conversation."
      ),
      h3("What if an agreement needs to be signed by more than two people?"),
      p(
        "That's still supported — you can route it through an ordered signing sequence so each party signs in " +
          "turn, or send it to everyone at once if the order doesn't matter. It only stops being free once a " +
          "document has more than two signers."
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
        "Client onboarding is where a lot of small-business time quietly disappears — not because any single step " +
          "is hard, but because each new client means redoing the same paperwork from scratch, then chasing down " +
          "whoever forgot to open it. The fix isn't more effort, it's a fixed sequence: a templated packet, sent in " +
          "a specific order, with reminders handled automatically instead of tracked in someone's head."
      ),
      h2("Start with templates"),
      p(
        "Every recurring onboarding document — a contract, an NDA, a welcome packet — should exist as a reusable " +
          "template with the client-specific fields left blank, not as a document you rewrite each time. The " +
          "one-time cost of building a clean template pays for itself after the second or third client, and it " +
          "removes the version drift that creeps in when someone copies last month's file and forgets to update a " +
          "clause."
      ),
      h2("What actually belongs in a welcome packet"),
      p(
        "A welcome packet isn't one document — it's a small bundle that answers, in order, what the client is " +
          "agreeing to, what you need from them, and what happens next. A tight version usually includes: the " +
          "service agreement itself, a short intake questionnaire (project scope, key contacts, preferred " +
          "communication), a payment authorization or invoicing schedule, and — if the engagement involves " +
          "sensitive information before real work starts — an NDA. A cover note that plainly states what to expect " +
          "next (\"you'll get a kickoff call invite within one business day of signing\") does more to prevent " +
          "confusion than any amount of extra legal language."
      ),
      h2("Timing the sequence"),
      p(
        "The order and speed of onboarding matters as much as the content. A packet sent same-day, while the " +
          "client is still in the headspace of having just said yes, gets signed faster than one that arrives two " +
          "days later after their attention has moved on. A workable rhythm: send the full packet within hours of " +
          "a verbal or email commitment; if it's not opened within 48 hours, an automated reminder goes out rather " +
          "than a person having to remember to nudge; once signed, a short internal step (countersignature, kickoff " +
          "scheduling) follows immediately so the client doesn't feel like the process stalled the moment they held " +
          "up their end."
      ),
      h2("Sequential signing keeps the order intact"),
      p(
        "Not every onboarding document should be signed by everyone at once. A service agreement often makes more " +
          "sense sent to the client first, with your own countersignature added only after their signature is in " +
          "— so you're never bound to terms before the client has committed to them. An ordered signing sequence " +
          "handles this automatically: the next signer only receives the document once the previous one has " +
          "completed their part, rather than everyone getting it simultaneously and hoping the order sorts itself " +
          "out. For documents that genuinely don't depend on order — say, an intake form multiple stakeholders on " +
          "the client's side need to sign — sending in parallel instead avoids adding delay for no reason."
      ),
      h2("Reducing back-and-forth"),
      p(
        "A surprising share of onboarding friction isn't about the document's content — it's not knowing whether " +
          "the client has even looked at it. A timestamped audit trail showing when a document was delivered, " +
          "opened, and signed answers that without a phone call or a \"just checking in\" email. And because the " +
          "client never has to create an account to open and sign, there's one less step between them agreeing to " +
          "work with you and actually being onboarded — the signing link works the same whether it's their first " +
          "time or their fifth."
      ),
      h2("Automate the follow-up"),
      p(
        "The most common onboarding bottleneck isn't the document itself — it's the client who opened it and then " +
          "forgot to sign. Automated reminders handle that without anyone on your team needing to manually track " +
          "who still owes a signature, which matters most in the exact weeks when you're onboarding several " +
          "clients at once and can't afford to keep a mental list."
      ),
      h2("Frequently asked questions"),
      h3("How much time does this actually save?"),
      p(
        "It scales with how many new clients you onboard — for a business bringing on a handful of clients a " +
          "month, the time saved on redrafting documents and chasing signatures adds up quickly compared to " +
          "handling each one manually."
      ),
      h3("Is this only useful for larger teams?"),
      p(
        "No — a solo operator onboarding a few clients a month benefits just as much, since the time saved per " +
          "client is the same regardless of team size. Onboarding packets with two or fewer signers (you and the " +
          "client) stay free to send."
      ),
      h3("What if the client's side needs more than one person to sign?"),
      p(
        "That's supported either way — route it as an ordered sequence if it matters who signs first, or send it " +
          "to everyone on the client's side at once if it doesn't. Either approach avoids one person's delay " +
          "silently blocking the rest."
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
        "A vendor agreement is the document that turns \"we're working with this supplier\" into something " +
          "specific enough to point back to when a delivery is late, a price changes, or a dispute comes up. It " +
          "defines responsibilities, pricing, delivery terms, and confidentiality between a business and its " +
          "suppliers — and its value shows up less on the day it's signed than months later, when something " +
          "inevitably goes sideways."
      ),
      h2("What a vendor agreement typically covers"),
      list([
        "What's being supplied — goods, materials, or a recurring service",
        "Pricing and payment terms, including how price changes get handled over time",
        "Delivery terms — schedule, method, and what counts as a missed deadline",
        "Confidentiality — especially if the vendor sees internal pricing, specs, or customer information",
        "Termination — how either side can end the relationship, and on what notice",
      ]),
      h2("Price-change clauses: the part most agreements leave vague"),
      p(
        "Supplier costs move. A vendor agreement that doesn't say how price increases get communicated leaves that " +
          "entirely to whoever brings it up first — usually the vendor, usually without much notice. A workable " +
          "clause is specific on three things: how much notice is required before a price change takes effect (30 " +
          "days is common for routine supplies), whether increases are capped to a percentage or tied to a stated " +
          "index, and what a business's options are if it doesn't want to accept the new price — cancel the next " +
          "order, renegotiate, or exit the agreement outright. A bakery buying flour on a standing agreement, for " +
          "example, might cap any single price increase at 8% with 30 days' written notice, and reserve the right " +
          "to walk away from the agreement entirely if two increases land within the same year."
      ),
      h2("Handling delivery disputes before they happen"),
      p(
        "Delivery terms only do their job if they define \"late\" in a way that isn't up for debate later. That " +
          "means stating the expected delivery window, what grace period (if any) applies before a delay counts as " +
          "a breach, and what remedy follows — a credit toward the next order, a right to source the same " +
          "materials elsewhere for that cycle, or, after repeated misses, a right to terminate. Without those " +
          "specifics written down, a missed delivery becomes a conversation about goodwill instead of a " +
          "conversation about what was agreed, and goodwill conversations rarely end in anyone getting made whole."
      ),
      h2("Vendor agreement vs. purchase order — a concrete example"),
      p(
        "A vendor agreement sets up the ongoing relationship — the general terms that apply across every order. A " +
          "purchase order covers a single transaction under that relationship. Take that same bakery: the vendor " +
          "agreement with its flour supplier is signed once and sets the price per 50-pound bag, the delivery " +
          "schedule, and the price-change terms above. Each week, the bakery sends a short purchase order " +
          "referencing that agreement and specifying just the quantity for that week's delivery. Businesses that " +
          "place recurring orders with the same supplier benefit from having both: the agreement once, then a " +
          "lightweight PO for each order, rather than renegotiating terms every single time product changes hands."
      ),
      h2("Where these agreements go wrong"),
      p(
        "The most common gap is delivery terms — what actually counts as \"late,\" and what happens if it is. " +
          "Without that written down, a missed delivery becomes a conversation about goodwill instead of a " +
          "conversation about what was agreed. The second most common gap is confidentiality: a vendor that sees " +
          "cost structure, customer volumes, or specs during the course of supplying you has effectively been " +
          "given business intelligence, whether or not that was the intent — a confidentiality clause is what " +
          "makes that exposure something you agreed to knowingly rather than something that just happened."
      ),
      h2("Getting it signed without slowing down the relationship"),
      p(
        "Vendor agreements often need sign-off from more than one person — a procurement contact on your side, an " +
          "owner or manager, and a representative from the vendor. Routing it as an ordered signing sequence means " +
          "it moves through approvals in the right order automatically, and a timestamped audit trail records " +
          "exactly when each party received, opened, and signed it — which becomes the reference point if a " +
          "delivery or pricing dispute ever needs to be settled by what was actually agreed to, not what someone " +
          "remembers agreeing to."
      ),
      h2("Frequently asked questions"),
      h3("Does a vendor agreement need to be renewed every year?"),
      p(
        "Not necessarily — it depends on the term you set. Some vendor agreements run indefinitely until either " +
          "side cancels; others are set for a fixed term with an option to renew. Either works, as long as it's " +
          "stated clearly."
      ),
      h3("Who typically drafts the vendor agreement?"),
      p(
        "Either side can, though it's common for the business receiving the goods or service to propose the terms, " +
          "since they're usually the one with more to lose from vague delivery or pricing language."
      ),
      h3("What if the vendor won't agree to a price-change notice period?"),
      p(
        "That's worth treating as information in itself — a supplier unwilling to commit to any notice period on " +
          "pricing is telling you how that relationship is likely to go. It doesn't have to be a dealbreaker, but " +
          "it's worth building in a shorter agreement term so you're not locked into an open-ended relationship on " +
          "those terms."
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
          "contracts, annual renewals — have a way of becoming a bigger time sink than they should be, mostly " +
          "because each one gets treated as a fresh task instead of a repeat of the last one. Fixing that isn't " +
          "about working faster on any single document — it's about building a small operational system around the " +
          "fact that these documents repeat on a schedule."
      ),
      h2("Why recurring paperwork gets harder than it needs to be"),
      p(
        "The pattern is familiar: someone finds last quarter's document, copies it, manually updates the dates and " +
          "names, and hopes they didn't miss a field. Multiply that by every recurring document a business sends, " +
          "and it adds up to a surprising amount of repeated manual work for something that's structurally " +
          "identical each time. Worse, the copy-and-edit approach is exactly how outdated pricing, stale clauses, " +
          "or last cycle's names end up carried forward into a document that's supposed to be current."
      ),
      h2("What to template first"),
      p(
        "Not all recurring documents deserve equal attention up front — prioritize by how often they go out and " +
          "how much damage an error causes. Compliance acknowledgments and regulatory forms go first, since a " +
          "wrong or missing field there can carry real consequences and they usually don't change between cycles. " +
          "Renewal agreements and recurring service contracts go next — anything with pricing or term-length is " +
          "exactly where an out-of-date template does the most harm. Recurring invoices are usually lowest priority " +
          "to formalize as a signed template, since they're often generated by accounting software already, but " +
          "they still benefit from a standard structure if they require a signature or acknowledgment."
      ),
      h2("Setting a review cadence"),
      p(
        "A template that's never reviewed after it's built eventually goes stale — pricing changes, a clause " +
          "becomes outdated, a regulation shifts. The fix is a fixed review schedule rather than reviewing only " +
          "when something goes wrong: compliance-related templates are worth checking quarterly against current " +
          "requirements, while contract and pricing templates can usually go on an annual review unless something " +
          "specific changes sooner. Assigning one person as the owner of each template — even in a two-person " +
          "business — avoids the more common failure, which is nobody being responsible for noticing it's out of " +
          "date."
      ),
      h2("Avoiding version-control mistakes"),
      p(
        "The single most damaging version-control mistake is sending a client or vendor an outdated copy of a " +
          "template that's since been updated — old pricing, a superseded clause, terms that no longer match what " +
          "the rest of the business is operating under. This almost always happens because a template exists in " +
          "more than one place: a copy saved to someone's laptop, another attached to an old email thread, a third " +
          "in a shared drive that didn't get the latest edit. Keeping exactly one canonical saved template that " +
          "everyone sends from, rather than local copies people keep \"for convenience,\" removes the ambiguity " +
          "about which version is current. When a dispute does come up about which terms applied to a given cycle, " +
          "a timestamped audit trail showing exactly when that specific document was sent, opened, and signed " +
          "settles it — it records what was actually agreed to at that moment, not what the current template " +
          "happens to say today."
      ),
      h2("Reusable templates"),
      p(
        "A saved template with the standard fields already in place — and just the client, vendor, or " +
          "date-specific details left to fill in — turns a repeat document into a two-minute task instead of a " +
          "rebuild-from-scratch one. This is one of the clearer cases where paying for a workspace with template " +
          "support earns back its cost quickly if you're sending the same document type every month, since the " +
          "setup cost is paid once and the savings repeat every cycle after."
      ),
      h2("Automated reminders"),
      p(
        "The other recurring failure point is the human one: someone forgets to send the document on schedule, or " +
          "a signer forgets to complete it once it's out. Automated reminders handle the follow-up without anyone " +
          "needing to track a spreadsheet of who's overdue, which matters most for compliance documents where a " +
          "missed deadline isn't just an inconvenience."
      ),
      h2("Frequently asked questions"),
      h3("What counts as a \"recurring document\"?"),
      p(
        "Anything sent on a regular schedule with mostly the same structure each time — monthly invoices, " +
          "quarterly compliance forms, renewal agreements, repeat vendor purchase orders."
      ),
      h3("Is it worth setting up a template for something sent only a few times a year?"),
      p(
        "Usually yes, if it's sent more than once — the setup cost is small, and it removes the risk of missing a " +
          "field or using an outdated version the next time it comes around."
      ),
      h3("How do I keep compliance-related recurring documents organized specifically?"),
      p(
        "The same principles apply, but the review cadence should be tighter given the stakes — check compliance " +
          "templates against current requirements at least quarterly, and keep the audit trail as your record of " +
          "what was actually acknowledged and when."
      ),
      link("Compliance documentation", "/compliance-documentation"),
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
      h2("What this looks like on an actual document"),
      p(
        "The enterprise version of \"AI contract review\" usually means a dedicated legal-ops team running " +
          "clause libraries and risk-scoring dashboards across thousands of agreements a year. The small-business " +
          "version is smaller in scope but solves the same underlying problem: before sending a contract, " +
          "understanding what it actually says. A freelancer about to sign a client's own contract (rather than " +
          "one they drafted themselves) can run it through a plain-English explainer to see what each clause " +
          "means in practice, then use a risk highlighter to flag anything unusual — an indemnification clause " +
          "that's broader than typical, a payment term buried three paragraphs in, an auto-renewal with a short " +
          "cancellation window. None of that requires a platform purchase or a procurement process; it's the " +
          "same free tools available on any document already in Docracy's editor."
      ),
      h2("Where AI-assisted contract tools actually fall short"),
      p(
        "It's worth being honest about the limits, since overselling this would be its own kind of dishonesty. A " +
          "clause explainer or risk highlighter is pattern-based analysis — genuinely useful for catching " +
          "unusual language or summarizing what a clause does, but it isn't legal advice and it won't catch every " +
          "issue a lawyer would, especially anything that depends on the specific jurisdiction, industry " +
          "regulation, or the surrounding business relationship. For a routine freelance contract or NDA, that " +
          "level of review is proportionate to the stakes. For a contract with real money or real liability on " +
          "the line, AI-assisted review is a helpful first pass, not a substitute for a lawyer's actual review."
      ),
      h2("A worked example: reviewing an inbound contract in minutes"),
      p(
        "Say a client sends a freelancer their own service agreement to sign, rather than the freelancer's usual " +
          "template. Instead of reading three pages of unfamiliar legal language cold, the freelancer uploads it " +
          "to Docracy, runs the plain-English explainer to get a section-by-section summary, and checks the risk " +
          "highlighter for anything that stands out — say, a clause requiring the freelancer to indemnify the " +
          "client for any third-party claim \"regardless of cause,\" which is broader than the mutual, " +
          "negligence-based indemnification language freelance contracts typically use. That's a concrete, " +
          "actionable flag to raise before signing — not the AI making a legal judgment call, but doing the " +
          "unglamorous work of surfacing the sentence worth a second look."
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
      h2("Frequently asked questions"),
      h3("Does Docracy's AI actually draft contracts, or just review them?"),
      p(
        "Both, within the same free toolset — a prompt-to-agreement generator drafts a first version of common " +
          "documents from a plain description, while the explainer and risk highlighter work on documents you've " +
          "already uploaded, whether you wrote them or a client sent them to you."
      ),
      h3("Is this the same thing enterprise \"agentic AI\" contract platforms do?"),
      p(
        "Not really — those platforms typically automate multi-step approval workflows across a large contract " +
          "volume (routing, escalation, renewal tracking across thousands of agreements). Docracy's AI tools solve " +
          "a narrower, more immediate problem: understanding and drafting a single document quickly, which is " +
          "usually the actual bottleneck for a freelancer or small team."
      ),
      h3("Do I need a paid plan to use the AI tools?"),
      p(
        "No — the explainer, risk highlighter, and prompt-to-agreement generator are free to use regardless of " +
          "plan, on documents with two or fewer signers. They're tools for understanding and drafting a document, " +
          "separate from paid features like saved templates or WhatsApp signing."
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
          "enterprise features go unused, while its per-seat pricing and account requirements add friction that " +
          "has nothing to do with getting a document signed. That's the specific gap tools like Docracy are built " +
          "to fill: free, no-account signing for a short chain of signers, with a flat monthly price if you outgrow " +
          "the free tier."
      ),
      h2("How the pricing models actually differ"),
      p(
        "Most enterprise e-signature platforms price by seat: every person on your team who might ever need to " +
          "send a document counts toward the bill, whether they send one contract a year or fifty a week. That " +
          "model makes sense when you're licensing a company-wide rollout. It makes much less sense for a solo " +
          "consultant or a five-person shop sending the occasional agreement. Docracy's pricing is built around " +
          "signer count instead of seats: documents with up to two signers are free, and going beyond that is a " +
          "flat $10 a month — not $10 per person, and not a tiered jump every time you add a user."
      ),
      h2("What \"simple\" agreements look like in practice"),
      p(
        "The agreements that don't need enterprise tooling tend to share a shape: two or three parties, signed " +
          "once, done. An NDA between a founder and a contractor. A month-to-month lease between a landlord and a " +
          "tenant. An offer letter between a company and a new hire. A one-page vendor agreement. None of these " +
          "need bulk envelope sending, CRM sync, or identity-verified signatures — they need a document that goes " +
          "out fast, gets signed without a login wall, and leaves a clear record that it happened."
      ),
      h2("Sequential vs. parallel signing"),
      p(
        "One place lighter tools sometimes fall short is ordering: if a document needs to be signed by one party " +
          "before it's even shown to the next — say, a manager approving before it goes to HR — that requires " +
          "sequential signing, not just a link blasted to everyone at once. Docracy supports both sequential and " +
          "parallel multi-signer workflows, so switching to a simpler tool doesn't mean giving up control over " +
          "signing order when it actually matters."
      ),
      h2("A pre-switch checklist"),
      list([
        "Can the person signing do it without creating an account?",
        "Is there a real audit trail — delivery, read, and signature timestamps — not just a \"signed\" flag?",
        "Is the final signed file tamper-evident, ideally with a verifiable hash?",
        "Can you upload a PDF you already have, as-is, instead of rebuilding it in a proprietary editor?",
        "Does pricing stay flat if you occasionally need more than two signers, instead of jumping per seat?",
      ]),
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
      h3("Can a lightweight tool still handle multiple signers in order?"),
      p(
        "It depends on the tool, but it's worth checking before you switch. Docracy, for example, supports both " +
          "sequential signing (one signer at a time, in a set order) and parallel signing (everyone signs whenever " +
          "they get to it), so ordering requirements don't force you back to a heavier platform."
      ),
      h3("Do I need identity verification for my agreements?"),
      p(
        "Most everyday agreements don't. A simple electronic signature (SES) — which proves what was signed and " +
          "when — is the legal default and is sufficient for the vast majority of NDAs, freelance contracts, and " +
          "leases. Identity-verified or qualified electronic signatures are a separate, higher legal tier reserved " +
          "for specific regulated cases, and no lightweight tool, including Docracy, should be mistaken for a " +
          "Qualified Trust Service Provider issuing those."
      ),
      h3("What if I occasionally need more than two signers?"),
      p(
        "That's exactly the case flat pricing is meant to cover. Docracy's free tier handles documents with up to " +
          "two signers; anything beyond that is $10 a month total, not per additional signer or per seat, so an " +
          "occasional larger agreement doesn't change your cost structure the way per-seat pricing would."
      ),
      h3("Will switching disrupt documents I've already sent with DocuSign?"),
      p(
        "No. Documents already signed and stored in DocuSign remain valid and accessible wherever they live today. " +
          "Switching tools only affects agreements you send going forward — there's no need to migrate historical " +
          "signatures."
      ),
      link("See the full price comparison vs. DocuSign", "/blog/docracy-vs-docusign"),
      link("Try Docracy free", "/docusign-alternative"),
    ],
  },

  // --- Product cluster ---
  {
    slug: "whatsapp-signing-now-available",
    title: "WhatsApp signing is here — sign without an inbox",
    description: "Docracy can now deliver signing links over WhatsApp, phone-bound and PIN-protected, as a step toward Advanced Electronic Signature. Free: 1/month. Paid: 10/month, then $0.50 each.",
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
      h2("Where this actually helps"),
      list([
        "A client based overseas who reads WhatsApp throughout the day but only opens email once a week",
        "A contractor or field technician between job sites, without regular access to a laptop or a desktop inbox",
        "A gig worker signing an agreement between jobs, on a phone, with no time to hunt through email",
        "A real estate agent who needs a walk-in signer to complete paperwork the same day, not after they get home to a computer",
        "Someone helping an older relative or a less tech-comfortable signer who already knows how to open WhatsApp but finds email confusing",
      ]),
      h2("Before WhatsApp signing"),
      p(
        "Without a direct channel like this, the workaround was manual: send the email invite as usual, then " +
          "separately message the signer on WhatsApp asking them to go check their inbox, and hope they do it " +
          "before the message gets buried. On the day a signature was actually needed, that often meant a second " +
          "or third nudge on WhatsApp just repeating the same request. The signing itself still depended entirely " +
          "on the signer opening an email client. WhatsApp signing removes that dependency — the link travels " +
          "through the channel the signer is already checking, instead of asking them to switch apps to find it."
      ),
      h2("What the signer sees"),
      p(
        "From the signer's side, the flow stays simple: a WhatsApp message arrives with the signing link, they " +
          "open it and review the document as they would from an email invite, and before they can complete the " +
          "signature they're prompted for the PIN the preparer set. Once the PIN is entered, signing proceeds " +
          "exactly like any other Docracy document — no app to install, no account for the signer to create."
      ),
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
        "Free, signed-up accounts get 1 WhatsApp-signed invite per month. Paid accounts get 10 per month included, " +
          "with additional sends billed at $0.50 each. Enterprise accounts get 50 per month on a fair-use basis. " +
          "Anonymous, no-signup sends aren't eligible — WhatsApp signing requires a free Docracy account."
      ),
      link("See pricing", "/pricing"),
      h2("A few common questions"),
      h3("Does this replace the email invite?"),
      p(
        "No. The email invite still goes out as usual — WhatsApp delivery is an additional channel for that same " +
          "signer, not a replacement for it."
      ),
      h3("Does every signer on a document need to use WhatsApp?"),
      p(
        "No. You can mix delivery methods on the same document — one signer by email, another by WhatsApp — " +
          "depending on how each person is easiest to reach."
      ),
      h3("Is a WhatsApp-signed document \"more legal\" than a regular one?"),
      p(
        "It's more precisely evidenced, not more legal in some general sense. A WhatsApp signature is designed to " +
          "meet the higher AES bar under eIDAS by tying the signature to a specific phone number and a PIN, which " +
          "strengthens the evidence of who signed. It's still a simple electronic signature by default everywhere " +
          "else on Docracy, and Docracy doesn't issue qualified electronic signatures (QES) through this or any " +
          "other channel."
      ),
    ],
  },
  {
    slug: "introducing-the-docracy-marketplace",
    title: "Introducing the Template Marketplace",
    description: "A quick tour of the Docracy Marketplace: how to find a template, fill it in, and share your own with the community — free, no account needed.",
    publishedDate: "2026-08-16",
    cluster: "Product",
    ogImage: "https://img.youtube.com/vi/H8LlazgJyTA/maxresdefault.jpg",
    blocks: [
      p(
        "The Docracy Marketplace is a free library of document templates — NDAs, lease agreements, offer letters, " +
          "wills, and dozens more — some written and reviewed by Docracy, others submitted by the community. " +
          "Anyone can browse it, fill in a template, and send it for signature without creating an account. Here's " +
          "a quick walkthrough of how it works, start to finish."
      ),
      video("H8LlazgJyTA", "The Docracy Marketplace, explained"),
      h2("Why we built a marketplace"),
      p(
        "Most agreements aren't unique. An NDA between a founder and a contractor follows the same basic structure " +
          "whether it's drafted in San Francisco or Singapore. A residential lease covers the same handful of " +
          "terms regardless of which landlord is sending it. Rather than have everyone start from a blank page — " +
          "or a blank Word doc copied from wherever they found it last — the Marketplace collects templates for " +
          "the documents people need again and again, so the starting point is already a reasonably complete draft " +
          "instead of an empty page."
      ),
      h2("Finding a template"),
      p(
        "Templates are organized by category — Business, Real Estate, Employment, Personal, and more — so you can " +
          "browse instead of guessing what a document is called. Each template shows whether it's an official " +
          "Docracy template or a community submission before you open it."
      ),
      p(
        "In practice that means Business covers things like vendor agreements and service contracts, Real Estate " +
          "covers leases and related disclosures, Employment covers offer letters and onboarding paperwork, and " +
          "Personal covers documents like wills and everyday agreements between individuals. If you're not sure " +
          "what a document is called, browsing by category is usually faster than guessing at search terms."
      ),
      h2("Using a template end-to-end"),
      p(
        "Once you pick a template, the flow is the same as sending any Docracy document: fill in the specifics — " +
          "names, dates, terms — add your signers, choose whether they sign in a set order or all at once, and " +
          "send. Because it's a template, most of the structure is already there; you're filling in blanks rather " +
          "than drafting from scratch. And as the intro above notes, none of this — browsing, filling in, or " +
          "sending — requires either party to create an account."
      ),
      h2("Sharing your own"),
      p(
        "If you've already drafted something useful — a vendor agreement, a roommate contract, an onboarding " +
          "checklist — you can submit the blank version to the Marketplace directly from the editor. Nothing " +
          "publishes automatically: every submission is reviewed by a real person first, then goes live credited " +
          "to the community."
      ),
      h2("Official vs. community templates"),
      p(
        "Official templates are the baseline Docracy has written and reviewed directly, covering the most commonly " +
          "requested document types. Community templates come from people and businesses who hit the same " +
          "paperwork problem, solved it, and decided to share the result rather than keep it to themselves. Both " +
          "go through the same human review before publishing — the difference is authorship, not a difference in " +
          "whether someone checked it."
      ),
      link("Browse the Marketplace", "/free-templates"),
      link("Submit a template", "/submit-template"),
      h2("What it costs"),
      p("Nothing, in either direction. Using a template is free, and submitting one is free — no plan required for either."),
      h2("A couple of things worth knowing"),
      h3("Is using a template different from uploading my own PDF?"),
      p(
        "No — once you've selected a template, it behaves like any other document on Docracy: the same field " +
          "placement, the same choice between sequential or parallel signers, and the same audit trail and " +
          "tamper-evident hash on the finished file. A template just saves you the step of starting from a blank " +
          "page."
      ),
      h3("What happens after I submit a template?"),
      p(
        "It goes into a review queue rather than publishing right away. Once a member of the Docracy team checks " +
          "it over, it goes live in the Marketplace, credited to whoever submitted it."
      ),
    ],
  },
  {
    slug: "10-new-free-templates",
    title: "10 new free templates: web design & photography",
    description: "10 new free templates just landed on the Docracy Marketplace — web design and development agreements, photography contracts, a model release, an invention assignment agreement, and more.",
    publishedDate: "2026-08-16",
    cluster: "Product",
    blocks: [
      p("The Marketplace just grew by 10 templates, bringing the total to 97 — all free, all reviewed, no account needed to use them. Here's what's new:"),
      h2("For freelancers and creatives"),
      list([
        "Web Design Services Agreement — scope, revision rounds, and ownership handoff on final payment",
        "Web Development Agreement — tech stack, testing/acceptance, and a post-launch support window",
        "Wedding Photography Contract — coverage hours, deliverables, retainer terms, and cancellation policy",
        "Photography Services Agreement — usage rights for portrait, commercial, or product sessions",
        "Model Release Form — grants a photographer rights to use someone's likeness, with a minor-consent option",
      ]),
      p(
        "These five cover the paperwork that tends to get skipped when a freelance project moves fast — a wedding " +
          "photographer booking a date six months out, a designer starting a website revamp on a rough scope, a " +
          "product shoot that needs a model release signed before anyone picks up a camera. Having a ready " +
          "structure for scope, revisions, and rights up front means fewer disputes later about what was actually " +
          "agreed to."
      ),
      h2("For businesses"),
      list([
        "Website Terms of Service Acknowledgment — a signed record that a user accepted your published Terms",
        "Acceptable Use Policy Acknowledgment — same idea, for what users may and may not do with your service",
        "Proprietary Information and Inventions Agreement (PIIA) — the standard new-hire invention-assignment agreement",
        "Short-Form Mutual NDA — a lighter, faster one-pager for when a full NDA is more than you need",
        "Reference Letter — a signed reference for a former employee, tenant, or colleague",
      ]),
      p(
        "This second group is less about creative work and more about routine business housekeeping: proving a " +
          "user actually agreed to your Terms rather than just having them posted on a page, getting a PIIA signed " +
          "on someone's first day instead of chasing it down weeks later, or reaching for a short-form NDA when a " +
          "full multi-page version is overkill for a first conversation with a prospective vendor."
      ),
      link("Browse all templates on the Marketplace", "/free-templates"),
      h2("Why these ten"),
      p(
        "Templates get added based on the gaps people keep running into — the documents that come up often enough " +
          "to be worth a ready structure, but specific enough that a generic contract template doesn't quite fit. " +
          "Web design and development agreements, for instance, need their own language around revision rounds and " +
          "post-launch support that a generic services agreement doesn't cover. A model release needs a " +
          "minor-consent path that most photography contracts skip entirely."
      ),
      h2("How a template turns into a signed document"),
      p(
        "The process is the same regardless of which of the 10 you pick: open it from the Marketplace, fill in the " +
          "specific names, dates, and terms for your situation, choose your signers, and send. Signers can be set " +
          "up sequentially — useful for something like a PIIA that needs the employee to sign before HR " +
          "countersigns — or in parallel if order doesn't matter. As with every template in the Marketplace, none " +
          "of this requires either side to create an account."
      ),
      h2("Have one to add?"),
      p(
        "If you've already drafted something useful, you can submit the blank version to the Marketplace directly " +
          "from the editor — free, reviewed by a real person before it goes live."
      ),
      link("Submit a template", "/submit-template"),
      h3("Do I need an account to use one of these?"),
      p(
        "No — using any of these templates to send a document for signature doesn't require an account on either " +
          "side. An account only comes into play for extras like WhatsApp delivery or saving your own reusable " +
          "templates, which sit on Docracy's paid or free-signup tiers rather than being required just to sign."
      ),
      h3("Will more templates keep getting added?"),
      p(
        "Yes — the Marketplace grows through both official additions and community submissions, and every one of " +
          "them goes through the same human review before it's published."
      ),
    ],
  },
  {
    slug: "how-to-form-an-llc",
    title: "How to form an LLC: the basics",
    description: "What an LLC actually protects, the general formation steps most states share, and why an operating agreement matters even for a single owner.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [
      p(
        "A limited liability company (LLC) is the structure most small businesses reach for when they outgrow " +
          "operating as a sole proprietor or informal partnership. The appeal is straightforward: it separates the " +
          "business from the person running it, at least on paper, without the extra paperwork and formality a " +
          "corporation requires. That said, the exact steps, fees, and forms to form one vary significantly by " +
          "state — this is a general overview of how the process works, not a substitute for checking your own " +
          "state's specific requirements."
      ),
      h2("What an LLC actually does for you"),
      p(
        "Two things make an LLC worth the paperwork. First, liability protection: in most cases, if the business " +
          "gets sued or can't pay a debt, the owner's personal assets — their house, personal bank account, car — " +
          "are shielded from that liability. The business's debts stay the business's debts. Second, pass-through " +
          "taxation: by default, an LLC doesn't pay corporate income tax itself. Profit and loss pass through to " +
          "the owner's personal tax return, avoiding the double taxation a traditional corporation can face. Both " +
          "of these are defaults, not guarantees — they depend on actually treating the LLC as a separate entity, " +
          "which is a theme worth returning to below."
      ),
      h2("The general formation steps"),
      p(
        "Every state's process differs in the details, but most follow the same rough sequence:"
      ),
      list([
        "Choose a state to form in — usually the state where the business actually operates, since forming elsewhere " +
          "(a popular move for Delaware or Wyoming) often just adds a second state's paperwork and fees if you're " +
          "doing business somewhere else",
        "Pick a business name and check availability — most states require the name to be distinguishable from " +
          "existing registered businesses and to include an LLC designator like \"LLC\" or \"Limited Liability Company\"",
        "File Articles of Organization (sometimes called a Certificate of Formation) with the state — this is the " +
          "document that actually creates the LLC, typically filed with the Secretary of State's office along with " +
          "a filing fee that ranges widely by state",
        "Get an Employer Identification Number (EIN) from the IRS — free, done directly through the IRS website, " +
          "and needed to open a business bank account or hire employees even if the LLC has no employees yet",
        "Draft an operating agreement — not always legally required, but the document that actually governs how " +
          "the business runs internally (more on why this matters below)",
        "Handle any required business licenses or permits — these depend on the industry and location, not the " +
          "LLC filing itself, and are easy to overlook because they're not part of the state formation paperwork",
      ]),
      p(
        "Most states also require an ongoing step after formation — an annual report, a franchise tax, or a " +
          "renewal fee — to keep the LLC in good standing. Skipping this is a common way an LLC quietly lapses " +
          "without the owner realizing it until a lender or client asks for proof of good standing."
      ),
      h2("Single-member vs. multi-member LLCs"),
      p(
        "An LLC with one owner is a single-member LLC; one with two or more owners is a multi-member LLC. The " +
          "formation paperwork is nearly identical either way, but the internal agreement looks different. A " +
          "multi-member LLC needs to spell out how ownership percentages, profit splits, voting rights, and " +
          "exit scenarios work between the owners — without that, state default rules fill the gap, and those " +
          "defaults are rarely what a specific group of owners would have chosen for themselves."
      ),
      p(
        "A single-member LLC skips the ownership-split questions, but that doesn't make the operating agreement " +
          "optional in practice. This is the part that surprises a lot of first-time owners."
      ),
      h2("Why a single-member LLC still needs an operating agreement"),
      p(
        "The liability protection an LLC provides isn't automatic just because the state approved the filing. " +
          "Courts have \"pierced the corporate veil\" — the legal term for disregarding an LLC's liability shield " +
          "and holding the owner personally responsible — in cases where a single-member LLC never documented any " +
          "real separation between the business and the owner's personal finances. Commingled bank accounts, " +
          "personal expenses paid directly from the business account, and no written record of how the business " +
          "is actually supposed to operate all make it easier for a court to conclude the LLC was never treated " +
          "as a separate entity in the first place — which undermines the entire point of forming one."
      ),
      p(
        "An operating agreement doesn't fix commingled bank accounts by itself, but it's a documented record that " +
          "the owner set up formal rules for the business — how funds are handled, how the owner is compensated " +
          "for their work, what happens if the business is sold or dissolved. Combined with actually keeping " +
          "business and personal finances separate day to day, it's one of the more concrete things a single " +
          "owner can point to if the LLC's separateness is ever challenged."
      ),
      link("Free LLC operating agreement template", "/free-templates/llc-operating-agreement"),
      h2("What formation doesn't cover"),
      p(
        "Filing Articles of Organization creates the LLC on paper, but it doesn't open a business bank account, " +
          "get a resale certificate, register for state sales tax, or secure whatever industry-specific license " +
          "the business needs to legally operate. It's easy to treat the state filing as the finish line and " +
          "then discover months later that a required local permit was never applied for. Checking with the " +
          "specific state and local government where the business operates is the only reliable way to get the " +
          "full list — it genuinely varies too much to generalize."
      ),
      h2("Frequently asked questions"),
      h3("Do I need a lawyer to form an LLC?"),
      p(
        "Not for a straightforward single-owner or small-partner LLC in most states — many owners file directly " +
          "through their Secretary of State's website. It's worth a lawyer's or accountant's time when ownership " +
          "is complex, the business is raising outside investment, or the tax situation isn't simple pass-through."
      ),
      h3("How long does it take to form an LLC?"),
      p(
        "It varies by state, from same-day online approval to several weeks for a mailed filing. Some states also " +
          "offer expedited processing for an extra fee if the timeline matters."
      ),
      h3("Can I convert a sole proprietorship into an LLC later?"),
      p(
        "Yes — this is a common path. Many businesses start as a sole proprietorship, then form an LLC once there's " +
          "real revenue, a partner joining, or a specific liability concern worth addressing. There's no requirement " +
          "to get the structure right on day one."
      ),
      h3("Does forming an LLC protect me from every kind of liability?"),
      p(
        "No. It generally protects personal assets from business debts and most lawsuits against the business, but " +
          "it doesn't shield an owner from their own negligence, fraud, or a personally guaranteed loan. It also " +
          "won't help if the business and personal finances were never actually kept separate."
      ),
      link("Browse all free templates", "/free-templates"),
    ],
  },
  {
    slug: "why-nobody-reads-your-terms-of-service",
    title: "Why nobody reads your Terms of Service (and what to do about it)",
    description: "Almost no one reads a Terms of Service before clicking accept — why it's still enforceable, and what actually matters most inside one.",
    publishedDate: PUBLISHED,
    cluster: "Small Business",
    blocks: [
      p(
        "Nearly everyone who signs up for an online product clicks past the Terms of Service without reading a " +
          "word of it. This isn't a secret, and it isn't unique to any one company — it's just how people use the " +
          "internet. The natural next question for anyone running a small SaaS product or online business is: if " +
          "nobody reads it, does it even matter what's in there?"
      ),
      h2("Unread doesn't mean unenforceable"),
      p(
        "A Terms of Service someone never read can still bind them, under the general legal concept of " +
          "\"clickwrap\" agreements — where a user actively clicks \"I agree\" (or an equivalent action) before " +
          "using a service. Courts have generally enforced these, on the theory that the user had a reasonable " +
          "opportunity to read the terms and chose to proceed regardless. This is different from \"browsewrap,\" " +
          "where terms are simply linked somewhere on a site with no explicit acceptance step — courts have been " +
          "considerably more skeptical of browsewrap enforceability, since there's no clear moment where the user " +
          "did anything indicating they agreed to anything."
      ),
      p(
        "Enforceability specifics vary by jurisdiction and by how a particular court has ruled on a particular " +
          "presentation, so this isn't a guarantee that any clickwrap flow is automatically bulletproof. But the " +
          "general pattern holds broadly: a clear, affirmative acceptance step matters more for enforceability " +
          "than whether the user actually read the text underneath it."
      ),
      h2("What actually needs to hold up in a small business ToS"),
      p(
        "Given that almost nobody reads the full document, the handful of clauses that actually get tested — in a " +
          "dispute, a refund request, or an outage — deserve more attention than the rest combined:"
      ),
      list([
        "Limitation of liability — what the business is and isn't responsible for if something goes wrong, and a " +
          "cap on damages if the worst case happens",
        "What happens if the service goes down — whether there's any credit, refund, or guarantee tied to " +
          "uptime, and what counts as the business's responsibility versus a third-party outage outside its control",
        "How disputes get resolved — whether disagreements go to arbitration, small claims, or standard litigation, " +
          "and where (which matters a lot if the business and the customer are in different states or countries)",
        "How the terms themselves can change — most services reserve the right to update their ToS, but how much " +
          "notice users get, and whether continued use counts as acceptance of the new version, varies a lot " +
          "between services and matters if a court ever asks whether a change was properly communicated",
      ]),
      p(
        "Everything else — a friendly intro paragraph, a restatement of what the product does, boilerplate " +
          "definitions — is filler that doesn't do much work in an actual dispute. It's fine to include for " +
          "clarity, but it's not where the legal weight sits."
      ),
      h2("Plain language matters more than it sounds like it should"),
      p(
        "There's a temptation to write a ToS in dense legal language on the theory that it sounds more official " +
          "or more protective. In practice, courts examining clickwrap enforceability have sometimes scrutinized " +
          "not just whether a user clicked \"agree,\" but whether the terms were presented in a way a reasonable " +
          "person could actually notice and understand — tiny font, a link buried at the bottom of an unrelated " +
          "page, or terms that contradict what the product's marketing plainly claims can all work against a " +
          "business trying to rely on those terms later. A ToS that's genuinely readable — short sentences, plain " +
          "words, headers that describe what each section covers — isn't just friendlier to users. It's also " +
          "harder to argue was hidden or deceptive if it's ever challenged."
      ),
      h2("What belongs in a ToS vs. a Privacy Policy"),
      p(
        "Small businesses frequently combine these into one document, or write one and assume it covers both " +
          "purposes. They answer different questions and often need to be treated separately:"
      ),
      list([
        "Terms of Service — the rules for using the product itself: what's allowed, what's prohibited, payment " +
          "terms, liability limits, termination rights, and how disputes are handled. It's a contract governing " +
          "the relationship between the business and the user.",
        "Privacy Policy — what personal data the business collects, why, how it's stored, who it's shared with, " +
          "and what rights a user has over their own data. In many jurisdictions this is a legal disclosure " +
          "requirement, not just good practice, separate from any contractual terms about product usage.",
      ]),
      p(
        "A user disputing a refund is a Terms of Service question. A user asking what happens to their email " +
          "address after they delete their account is a Privacy Policy question. Keeping the two documents " +
          "distinct — even if they're linked from the same signup page — makes it clearer which rules apply to " +
          "which kind of issue, for the business and the user alike."
      ),
      h2("Getting terms actually agreed to"),
      p(
        "However carefully a ToS is written, it still needs a clean record that a specific version was presented " +
          "and accepted by a specific user at a specific time — especially if terms change later and a dispute " +
          "hinges on which version applied. A signed acknowledgment tied to a timestamp and an audit trail gives a " +
          "business something concrete to point back to, rather than relying on a checkbox log buried in a " +
          "database that's hard to explain outside an engineering team."
      ),
      h2("Frequently asked questions"),
      h3("Can I just copy another company's Terms of Service?"),
      p(
        "It's a common shortcut, but a copied ToS often includes clauses that don't apply to your actual product " +
          "or business model, and won't reflect your specific liability concerns, refund policy, or dispute " +
          "process. It's a reasonable starting point for structure, not a substitute for terms written for your " +
          "own situation."
      ),
      h3("How often should a Terms of Service be updated?"),
      p(
        "Whenever the underlying product, pricing, or policies materially change — there's no fixed schedule. " +
          "What matters more than frequency is having a clear process for notifying users of changes and recording " +
          "when each version took effect."
      ),
      h3("Does a ToS need to be reviewed by a lawyer?"),
      p(
        "For a low-stakes product with minimal liability exposure, a carefully written general-purpose template " +
          "can be a reasonable starting point. It's worth paying for legal review once real money, sensitive data, " +
          "or meaningful liability risk is involved — the cost of a bad limitation-of-liability clause tends to " +
          "far exceed the cost of having it checked."
      ),
      h3("Is a clickwrap agreement always enforceable?"),
      p(
        "Not automatically — enforceability depends on the terms being reasonably presented and the acceptance " +
          "step being clear and unavoidable, and it can still vary by jurisdiction and by the specific facts of a " +
          "case. It's a meaningfully stronger position than browsewrap, but \"always enforceable\" overstates it."
      ),
      link("Browse all free templates", "/free-templates"),
    ],
  },
  {
    slug: "how-freelancers-get-paid-on-time",
    title: "How freelancers get paid on time (without burning the relationship)",
    description: "Practical steps for setting payment terms that stick, following up on late invoices, and deciding when a late fee — or a firmer letter — is the right move.",
    publishedDate: PUBLISHED,
    cluster: "Freelancer",
    blocks: [
      p(
        "Getting paid late is close to a universal freelance experience, but a surprising amount of it is " +
          "preventable — not through legal threats, but through payment terms that are specific from the start and " +
          "a follow-up process that doesn't rely on hoping the client remembers on their own. None of this is legal " +
          "advice; it's a practical playbook for the everyday version of the problem, where a client is just slow " +
          "rather than acting in bad faith."
      ),
      h2("Set terms that actually get followed"),
      p(
        "Vague payment terms are the single biggest reason invoices go late. \"Payment due upon completion\" leaves " +
          "room for a client to decide, in good faith, that \"completion\" means something different than you " +
          "meant. Specific terms leave much less room for that kind of drift:"
      ),
      list([
        "A deposit before work starts — even 25-50% up front filters out clients who were never going to pay " +
          "reliably, and it means an unpaid balance is never the full project value",
        "Net-15 vs. net-30 — pick one and put the exact number of days on every invoice; \"net-30\" written down " +
          "is enforceable in a way \"pay me soon\" never is",
        "Milestone billing for larger projects — splitting a big project into paid phases (kickoff, midpoint, " +
          "delivery) means a slow-paying client only ever holds up a fraction of the total, not the whole " +
          "engagement",
      ]),
      p(
        "The best time to set these terms is before the project starts, in writing, as part of the contract or " +
          "proposal — not as a line added to the first invoice after the client has already started treating " +
          "\"whenever\" as the deadline."
      ),
      h2("What to actually do when an invoice goes past due"),
      p(
        "Most late payments aren't a client refusing to pay — they're a client who deprioritized an invoice that " +
          "isn't urgent to them the way it is to you. A predictable escalation sequence handles the common case " +
          "without jumping straight to confrontation:"
      ),
      list([
        "Day 1-3 past due — a friendly, low-friction reminder: \"just following up on invoice #___, wanted to " +
          "make sure it didn't get buried.\" Assume good faith; most invoices at this stage get paid within a day " +
          "or two of the nudge",
        "Around day 15 — a firmer follow-up that restates the original due date and the amount, and asks directly " +
          "for a specific payment date rather than a vague acknowledgment. This is also the point to mention any " +
          "late fee that applies, if the contract includes one",
        "Beyond that — if the second follow-up gets silence or repeated non-answers, a formal written demand is " +
          "the right next step: a clear, dated letter stating the amount owed, the original terms, and a specific " +
          "deadline before further action",
      ]),
      link("Free late payment demand letter template", "/free-templates/late-payment-demand-letter"),
      h2("Late fees: worth including or not"),
      p(
        "A stated late fee — commonly something like 1.5% per month on the overdue balance — is worth putting in " +
          "the contract up front, even for freelancers who never expect to actually enforce it. Its real value " +
          "isn't the extra money; it's that it turns an awkward, personal guilt-trip conversation (\"can you " +
          "please just pay me\") into a neutral reference to a term the client already agreed to (\"per section 4, " +
          "a late fee applies after 30 days\"). That's a meaningfully easier conversation to have, and a meaningfully " +
          "easier one for the client to receive without feeling singled out."
      ),
      p(
        "The fee only works if it's written into the agreement before the project starts — adding one " +
          "retroactively to an already-overdue invoice tends to read as punitive and rarely gets paid without a " +
          "fight."
      ),
      h2("When to cut a client loose instead of chasing them"),
      p(
        "Not every unpaid invoice is worth the effort of collecting. Chasing a small balance — the time spent " +
          "drafting follow-ups, the mental overhead of an open dispute, the strain on a relationship you might " +
          "still want for future work — can cost more than the invoice is worth, especially for a client who's " +
          "shown a pattern of being slow every single time. A reasonable line: if a client has needed the full " +
          "escalation sequence more than once, or the amount owed is small relative to the time it would take to " +
          "formally pursue it, it's often more valuable to write it off, stop taking new work from that client, " +
          "and put the energy into clients who pay on the terms they agreed to."
      ),
      p(
        "This isn't about giving up on getting paid fairly — it's about recognizing that collections have a cost " +
          "too, and a freelancer's time is the resource actually in short supply."
      ),
      h2("Preventing the problem earlier"),
      p(
        "Payment terms are only one piece of protecting freelance work overall — scope creep, ownership of " +
          "deliverables, and what happens if a client disappears mid-project all interact with how and when you " +
          "get paid. Getting the broader agreement right upfront tends to prevent more payment disputes than any " +
          "follow-up sequence can fix after the fact."
      ),
      link("How freelancers protect their work", "/blog/how-freelancers-can-protect-their-work"),
      h2("Frequently asked questions"),
      h3("Is a late fee actually enforceable?"),
      p(
        "Generally, if it's a reasonable rate and it was clearly stated in the agreement both parties signed " +
          "before the work began. A fee sprung on a client after the fact, with no prior written agreement, is on " +
          "much shakier ground and is more likely to just create a fight than to get paid."
      ),
      h3("Should I stop working for a client while an invoice is overdue?"),
      p(
        "For an ongoing relationship, many freelancers pause new work once an invoice passes a certain point " +
          "(commonly 30 days) rather than continuing to add unpaid work on top of unpaid work. It's a judgment " +
          "call based on the relationship and how much is already outstanding, not a universal rule."
      ),
      h3("What if the client disputes the invoice instead of just ignoring it?"),
      p(
        "That's a different situation than slow payment — it means there's a disagreement about the work itself, " +
          "not just the timing of paying for it. That's usually worth resolving directly and specifically (what " +
          "exactly is disputed, and against what part of the original agreement) before escalating to a formal " +
          "demand, since a demand letter answers \"you owe this and haven't paid,\" not \"we disagree about what's " +
          "owed.\""
      ),
      h3("How much should a deposit be?"),
      p(
        "There's no fixed rule, but 25-50% of the total project value up front is common for project-based " +
          "freelance work. Smaller deposits are typical for short, low-risk engagements; larger ones make sense " +
          "for bigger projects or first-time clients with no payment history."
      ),
      link("Browse all free templates", "/free-templates"),
    ],
  },
  {
    slug: "trademark-basics-for-small-business",
    title: "Trademark basics every small business should know",
    description:
      "What a trademark actually protects, ™ vs. ®, and how to think about registration for a small business.",
    publishedDate: PUBLISHED,
    cluster: "Intellectual Property",
    blocks: [
      p(
        "A trademark is one of the most misunderstood pieces of small-business paperwork. People confuse it with " +
          "copyright, assume registering a business name automatically covers it, or wait until a competitor is " +
          "already using a confusingly similar name before thinking about it at all. None of that is unusual — " +
          "trademark law solves a narrow, specific problem, and it's easy to mix it up with the other kinds of " +
          "protection a growing business collects along the way."
      ),
      h2("What a trademark actually protects"),
      p(
        "A trademark protects a brand identifier — a name, logo, slogan, or sometimes a distinctive sound or color " +
          "scheme — that customers use to tell your goods or services apart from a competitor's. The point isn't " +
          "to protect the idea behind a product or the creative work itself; it's to protect the signal that tells " +
          "a buyer where a product came from. That's a narrower job than people expect, and it's worth separating " +
          "from two things it commonly gets confused with."
      ),
      h3("Trademark vs. copyright"),
      p(
        "Copyright protects a specific creative work — the text of a brochure, the code in an app, the design of " +
          "a logo as a piece of artwork. A trademark protects the use of that logo, name, or slogan as a source " +
          "identifier in commerce. The same logo can carry both: copyright in the artwork itself, and a trademark " +
          "in how it's used to identify your business. They're granted differently, expire differently, and " +
          "protect different things, even when they're sitting on top of the same piece of art."
      ),
      h3("Trademark vs. business name registration"),
      p(
        "Registering an LLC or a \"doing business as\" name with a state or county tells the government your " +
          "business exists under that name for tax and legal purposes. It does not give you any exclusive right " +
          "to stop someone else from using a similar name to sell similar goods or services, even in the same " +
          "state. A trademark is a completely separate layer, and a fair number of small businesses never realize " +
          "the gap exists until a dispute forces the issue."
      ),
      h2("™ vs. ®: what the symbols actually mean"),
      p(
        "The ™ symbol can be used by anyone, anytime, on any name or logo they're using to identify their goods or " +
          "services — no registration, application, or government approval required. It's a public claim that " +
          "you're using this mark as a brand identifier, and it can help put others on notice even without formal " +
          "registration. The ® symbol is different: it can only be used once a trademark is actually registered " +
          "with the relevant national authority — in the US, that's the United States Patent and Trademark Office " +
          "(USPTO). Using ® before registration is completed isn't just premature, it can undermine the strength " +
          "of the application and create problems down the line."
      ),
      list([
        "™ — usable immediately, no registration required, signals a claim to the mark",
        "℠ — the service-mark equivalent of ™, used for services rather than physical goods",
        "® — usable only after formal registration is granted, signals a legally registered mark",
      ]),
      h2("A plain-language look at US federal registration"),
      p(
        "Registering a trademark with the USPTO is a formal process with several distinct stages. This isn't a " +
          "step-by-step legal guide — the details vary by mark, industry, and circumstances, and an attorney or " +
          "the USPTO's own resources are the right place for anything specific to a real application — but the " +
          "shape of the process is useful to understand before deciding whether it's worth pursuing."
      ),
      list([
        "Search — checking existing federal and state registrations, plus common-law use, for anything confusingly similar",
        "Filing basis — registering based on a mark already in use in commerce, or an intent to use it soon",
        "Examination — a USPTO attorney reviews the application for conflicts and compliance with trademark rules",
        "Publication — the mark is published for a window during which others can formally oppose the registration",
        "Registration — if nothing derails the process, the mark is registered and the ® symbol becomes available",
      ]),
      p(
        "The whole process commonly takes many months to over a year, and costs vary based on how the application " +
          "is filed and whether an attorney is involved. None of that means it's not worth doing — it means it's " +
          "worth planning for as a deliberate step rather than something to squeeze in the week before a product " +
          "launch."
      ),
      h2("Why a trademark search matters before you commit to a name"),
      p(
        "The single most avoidable trademark problem is picking a name, printing it on signage, building a " +
          "website around it, and only then discovering someone else already has rights to something confusingly " +
          "similar in your industry. A basic search — checking the USPTO's database, common web searches, and " +
          "existing businesses in your space — before finalizing a name doesn't guarantee safety, but it catches " +
          "the obvious conflicts before they turn into a rebrand. Rebrands are expensive in ways that go well " +
          "beyond legal fees: new signage, new domain, lost search rankings, and confused existing customers."
      ),
      h2("Should a small business actually register, or is ™ enough?"),
      p(
        "For a lot of very small or purely local businesses, using ™ consistently and simply operating under a " +
          "distinctive name is a reasonable starting point — it costs nothing and still signals a claim to the " +
          "mark. Formal registration starts to make more sense once a business is expanding beyond a single " +
          "location, selling online to a national audience, building a brand it plans to license or franchise, or " +
          "operating in a competitive space where a similar name showing up would cause real customer confusion. " +
          "Registration also gives you standing to act faster and more decisively if someone else starts using a " +
          "similar mark later — which is often the actual trigger that pushes a growing business to finally file."
      ),
      p(
        "Once a trademark is registered — or even while it's just being used informally — licensing it to a " +
          "partner, franchisee, or affiliated business is its own agreement, separate from the registration " +
          "itself."
      ),
      link("Free trademark license agreement template", "/free-templates/trademark-license-agreement"),
      h2("Frequently asked questions"),
      h3("Do I need a lawyer to register a trademark?"),
      p(
        "It's not strictly required — an applicant can file directly with the USPTO — but the examination process " +
          "involves legal judgment calls that trip up a lot of first-time filers. Many small businesses use an " +
          "attorney for the filing itself while handling the earlier search and name-selection process on their " +
          "own."
      ),
      h3("Can I use ™ on a name I haven't registered yet?"),
      p(
        "Yes. ™ doesn't require any registration or government filing — it's a public claim that you're using a " +
          "mark to identify your goods or services. It's the ® symbol that's restricted to marks that have " +
          "actually completed federal registration."
      ),
      h3("What happens if someone else is already using a similar name?"),
      p(
        "It depends on who used it first, in what geographic area, and for what kind of goods or services — this " +
          "is exactly the kind of question a proper trademark search and, often, an attorney's judgment are " +
          "designed to answer before you commit to a name rather than after."
      ),
      h3("Does trademark registration ever expire?"),
      p(
        "US federal registrations require periodic maintenance filings and proof of continued use to stay active " +
          "— they don't last forever automatically. As long as those maintenance requirements are met and the " +
          "mark stays in use, registration can be renewed indefinitely."
      ),
    ],
  },
  {
    slug: "what-is-a-patent",
    title: "What is a patent, and does your business need one?",
    description:
      "What patents protect, what they don't, realistic cost and timeline, and when a small business should consider one.",
    publishedDate: PUBLISHED,
    cluster: "Intellectual Property",
    blocks: [
      p(
        "Patents get treated as the default answer to \"how do I protect my idea,\" but they're a narrower, " +
          "slower, and more expensive tool than most small businesses and freelancers actually need. Understanding " +
          "what a patent covers — and what it doesn't — makes it much easier to tell whether pursuing one is worth " +
          "the time and cost, or whether a faster and cheaper form of protection fits the situation better."
      ),
      h2("What a patent actually protects"),
      p(
        "A patent protects a novel, useful, and non-obvious invention — something new that didn't already exist in " +
          "that form, that does something functionally useful, and that wouldn't have been an obvious next step to " +
          "someone skilled in the relevant field. In exchange for publicly disclosing exactly how the invention " +
          "works, the patent holder gets the exclusive right to make, use, or sell it for a limited period."
      ),
      h3("Utility patents vs. design patents"),
      p(
        "A utility patent covers how something works — its function, mechanism, or process. A design patent covers " +
          "how something looks — its ornamental appearance, separate from how it functions. A single physical " +
          "product can sometimes qualify for both: a utility patent on a novel mechanism inside it, and a design " +
          "patent on its distinctive shape. The two are examined differently and protect genuinely different " +
          "things, even when they apply to the same object."
      ),
      h2("What a patent does not protect"),
      p(
        "This is where a lot of confusion happens, and it's worth being direct about it in general terms — the " +
          "specifics always depend on the jurisdiction and the particular invention, and this isn't legal advice " +
          "for any specific idea."
      ),
      list([
        "An idea by itself, with no concrete, workable implementation behind it",
        "A software algorithm described only in the abstract, disconnected from a specific technical implementation",
        "A business method alone, unless it's tied to a genuinely novel technical implementation rather than just a new way of doing something people already do",
        "Something that's already publicly known, used, or described before the application is filed",
      ]),
      p(
        "The common thread is that patents protect a specific, disclosed way of solving a technical problem — not " +
          "the underlying goal, the market opportunity, or a general concept that other people could implement " +
          "differently to reach the same result."
      ),
      h2("The realistic cost and timeline"),
      p(
        "Patents are genuinely expensive and slow compared to almost every other form of business paperwork. Costs " +
          "commonly run from roughly $5,000 to $15,000 or more by the time attorney fees, filing fees, and " +
          "examination responses are all accounted for, and that range climbs fast for anything mechanically or " +
          "technically complex. Timelines of one to three years from filing to grant are common, and it's not rare " +
          "for the process to take longer. Both numbers vary enormously by country, technology area, and how " +
          "contested the application turns out to be — treat these as a rough sense of scale, not a quote."
      ),
      h2("When a patent is actually worth it — and when it isn't"),
      p(
        "A patent tends to make sense when an invention is genuinely novel at a technical level, when it's central " +
          "enough to the business that exclusivity materially changes the competitive picture, and when the " +
          "business can absorb the cost and multi-year timeline without that being the thing standing between it " +
          "and revenue. It makes much less sense for most early-stage small businesses and freelancers, where speed " +
          "to market and iteration matter more than a legal monopoly that might not be granted for years."
      ),
      h3("Trade secret protection as the practical alternative"),
      p(
        "Keeping an invention or process confidential — a trade secret — costs nothing to establish beyond good " +
          "internal practices, protects indefinitely as long as secrecy is maintained, and doesn't require public " +
          "disclosure the way a patent application does. The tradeoff is that trade secret protection only works " +
          "against people who obtain the information improperly — it does nothing to stop someone who " +
          "independently invents the same thing or reverse-engineers it from a publicly sold product. Choosing " +
          "between a patent and a trade secret often comes down to whether the invention is easy to reverse-engineer " +
          "once it's out in the world."
      ),
      h3("Moving fast as an alternative to formal protection"),
      p(
        "For a lot of small businesses, the realistic competitive advantage isn't a legal monopoly at all — it's " +
          "execution speed, brand, and customer relationships built before a competitor can catch up. That's not a " +
          "legal protection in the formal sense, but it's often the more relevant strategy for a business that " +
          "can't justify a multi-year, five-figure patent process for its current stage."
      ),
      p(
        "When a patent — or a pending application — does exist, transferring or assigning rights to it, whether " +
          "to a co-founder, employer, or acquirer, is its own agreement, separate from the patent filing itself."
      ),
      link("Free patent assignment agreement template", "/free-templates/patent-assignment-agreement"),
      h2("Frequently asked questions"),
      h3("Can I patent a business idea?"),
      p(
        "Not on its own. A business idea or method generally needs to be tied to a novel, non-obvious technical " +
          "implementation to be eligible — the underlying business concept by itself typically isn't patentable, " +
          "regardless of how original it feels."
      ),
      h3("Is it cheaper to file a patent application myself?"),
      p(
        "Filing fees alone are much lower than total costs, but most of the expense and value in a patent " +
          "application comes from how it's drafted and how the examination process is navigated — work that " +
          "generally benefits from a patent attorney's experience, especially for anything technically nontrivial."
      ),
      h3("What's the difference between a provisional and a full patent application?"),
      p(
        "A provisional application is a lower-cost, faster way to establish an early filing date and secure " +
          "roughly a year to develop the invention further before filing the full, examined application. It's not " +
          "itself examined or granted — it's a placeholder that buys time."
      ),
      h3("Does a patent protect me internationally?"),
      p(
        "No single patent covers the whole world. Patents are granted on a country-by-country (or regional) basis, " +
          "so international protection means separate filings or applications in each market that matters to the " +
          "business, which adds meaningfully to both cost and complexity."
      ),
    ],
  },
  {
    slug: "software-licensing-types-explained",
    title: "Software licensing types, explained simply",
    description:
      "Proprietary, open-source, SaaS, and white-label licensing — the major categories and where businesses get them wrong.",
    publishedDate: PUBLISHED,
    cluster: "Intellectual Property",
    blocks: [
      p(
        "\"Software license\" covers a wide range of very different arrangements, from a one-time purchase of " +
          "shrink-wrapped software to a subscription that only grants access for as long as payments continue. " +
          "Picking the wrong category — or not realizing which category a piece of code you're using actually " +
          "falls into — is one of the more common ways small businesses create legal exposure without meaning to."
      ),
      h2("Proprietary and commercial licenses"),
      p(
        "A proprietary license is the traditional model: the software owner keeps all rights and grants the " +
          "customer a limited, defined right to use the software under specific conditions — a certain number of " +
          "seats, a particular installation, a time period, or a specific use case. The customer never owns the " +
          "underlying code and typically can't modify, redistribute, or reverse-engineer it. Most commercial " +
          "desktop software, enterprise tools, and custom-built business software fall into this category."
      ),
      h2("Open-source licenses: permissive vs. copyleft"),
      p(
        "Open-source licenses grant much broader rights — to view, modify, and often redistribute the source code " +
          "— but they come in meaningfully different flavors, and the difference matters a lot more than most " +
          "people assume when they're just trying to ship a product."
      ),
      list([
        "Permissive licenses (like MIT or Apache-style licenses) — generally allow the code to be used, modified, and incorporated into proprietary products with minimal obligations, often just preserving a copyright notice",
        "Copyleft licenses (like GPL-style licenses) — generally require that products built using the licensed code, or that incorporate it in certain ways, also be released under the same or a compatible open license",
      ]),
      p(
        "Both categories include real variation within them, and the exact obligations of any specific license " +
          "depend on its precise terms — this is a general orientation, not a substitute for reading the actual " +
          "license text of a component before shipping it."
      ),
      h2("SaaS and subscription licensing"),
      p(
        "When a business sells access to software as a service, customers typically aren't licensing the software " +
          "itself at all — they're licensing ongoing access to a hosted service for as long as they keep paying. " +
          "There's usually no copy of the software changing hands, no installation, and no residual rights once a " +
          "subscription lapses. This distinction matters for how a SaaS agreement should actually be written: " +
          "terms around uptime, data handling, and what happens to a customer's data after cancellation matter more " +
          "here than the kind of usage restrictions that dominate a traditional software license."
      ),
      h2("White-label and reseller licensing"),
      p(
        "White-label licensing lets another business rebrand and resell software as if it were their own product, " +
          "usually for a fee, a revenue share, or both. A reseller license is closely related but typically keeps " +
          "the original branding intact — the reseller is distributing the product, not relabeling it. Both " +
          "arrangements need clear terms about who owns the underlying code, what support obligations exist, how " +
          "revenue is split, and what happens to the reseller's or white-label partner's customers if the " +
          "underlying agreement ends."
      ),
      h2("Why picking the wrong license type causes real problems"),
      p(
        "The most common and most expensive mistake is incorporating a copyleft-licensed open-source component " +
          "into a proprietary product without realizing what that license actually requires. Depending on the " +
          "specific license and how the component is integrated, that can create an obligation to release parts of " +
          "an otherwise proprietary codebase under the same open license — a consequence that's often discovered " +
          "only during due diligence for a funding round or acquisition, at which point unwinding it is far more " +
          "disruptive than checking license terms up front would have been."
      ),
      p(
        "A second common problem is a mismatch between the license type and how customers actually use the " +
          "product — for example, licensing terms written for a single-installation desktop tool being applied " +
          "unchanged to a multi-tenant SaaS product, leaving gaps around data ownership, uptime, and account " +
          "termination that a traditional software license was never designed to address. The fix in both cases " +
          "is the same: match the license type to what's actually being distributed and how it's actually being " +
          "used, rather than defaulting to whatever template is easiest to find."
      ),
      p(
        "Choosing the right structure matters whether you're licensing your own software to a customer, licensing " +
          "someone else's technology into your product, or setting up a white-label arrangement with a partner."
      ),
      link("Free IP licensing agreement template", "/free-templates/ip-licensing-agreement"),
      p(
        "Software built around a genuinely novel technical mechanism sometimes raises the separate question of " +
          "whether that mechanism itself is patentable, which is a different kind of protection from any license."
      ),
      link("What is a patent, and does your business need one?", "/blog/what-is-a-patent"),
      h2("Frequently asked questions"),
      h3("Can I use open-source code in a commercial product?"),
      p(
        "Often yes, but it depends entirely on the specific license attached to that component. Permissive " +
          "licenses generally make this straightforward; copyleft licenses can impose real obligations on the " +
          "rest of the product, so it's worth checking before code from an unfamiliar license ends up shipped."
      ),
      h3("What's the real difference between a license and selling software outright?"),
      p(
        "Selling software outright transfers ownership of the code itself. A license, even a broad or permanent " +
          "one, grants a defined right to use the software while the underlying ownership stays with the " +
          "licensor — the two look similar day-to-day but behave very differently if a dispute ever arises."
      ),
      h3("Do I need a different license for each customer?"),
      p(
        "Not usually — most businesses use one license template with variables (seats, term, price, use case) " +
          "filled in per customer, rather than drafting a new agreement from scratch for each deal."
      ),
      h3("What happens to a customer's license if my company is acquired?"),
      p(
        "That depends on the assignment terms written into the original license agreement — well-drafted licenses " +
          "address this directly, which is exactly why relying on a solid template rather than an ad hoc agreement " +
          "matters."
      ),
    ],
  },
  {
    slug: "can-i-use-that-image",
    title: "Can I use that image? A freelancer's guide to licensing",
    description:
      "Royalty-free vs. rights-managed stock, what Creative Commons actually allows, and a practical checklist before using an image.",
    publishedDate: PUBLISHED,
    cluster: "Intellectual Property",
    blocks: [
      p(
        "\"I found it on Google\" is not a license. It's the single most common misunderstanding behind accidental " +
          "copyright problems for freelancers and small businesses, and it's an easy one to fix once the actual " +
          "categories of image licensing are clear."
      ),
      h2("Royalty-free vs. rights-managed stock"),
      p(
        "Royalty-free doesn't mean free — it means you pay once for a license that then covers broad, ongoing use " +
          "within the terms of that license, rather than paying royalties every time the image is used. Most " +
          "stock photo subscriptions and single-image purchases work this way. Rights-managed licensing is " +
          "narrower and usually more expensive: it grants rights for a specific use, duration, geography, or " +
          "print run, and using the same image beyond those specific terms — a bigger print run, a different " +
          "market, a longer campaign — can require a new license or an additional fee."
      ),
      h2("What a Creative Commons license actually permits"),
      p(
        "Creative Commons isn't a single license — it's a family of licenses, and they grant meaningfully " +
          "different rights depending on which variant is attached to a given image. Some allow commercial use " +
          "outright; others restrict use to non-commercial purposes only. Some require only attribution; others " +
          "require that anything built using the image be shared under the same license. The common mistake is " +
          "treating \"Creative Commons\" as shorthand for \"free to use however I want\" — the specific variant " +
          "attached to an individual image is what actually determines what's allowed, and it needs to be checked " +
          "for that image specifically, not assumed from having seen a Creative Commons badge somewhere before."
      ),
      h3("Attribution requirements"),
      p(
        "Many open licenses, including several Creative Commons variants, require crediting the original creator " +
          "in a specific way — often the creator's name, the source, and a link to the license itself. Skipping " +
          "attribution isn't a minor formality under these licenses; it's typically a condition of the license, " +
          "and using the image without meeting it can mean the use falls outside the license altogether."
      ),
      h2("The real risk of using an unlicensed image commercially"),
      p(
        "Using an image without a valid license — including one found through a general search with no license " +
          "information attached at all — carries real, practical consequences, not just theoretical risk. Image " +
          "owners and the agencies that represent them increasingly use automated tools to scan the web for " +
          "unlicensed use of their catalogs, and the two most common outcomes are a takedown notice demanding the " +
          "image be removed, or an invoice-style demand letter from an image-monitoring or licensing-enforcement " +
          "service seeking payment for the unauthorized use — sometimes for amounts well beyond what a proper " +
          "license would have cost in the first place. These demands can arrive months or years after the image " +
          "was first used, once it's been indexed and matched against a rights database."
      ),
      h2("A practical checklist before using any image commercially"),
      list([
        "Confirm exactly where the image came from and what license, if any, is actually attached to it",
        "If it's stock, confirm whether the license is royalty-free or rights-managed, and whether your intended use fits within its terms",
        "If it's Creative Commons, check the specific variant attached to that image — not just the general reputation of Creative Commons",
        "Note any attribution requirements and follow them exactly, including where and how the credit needs to appear",
        "Keep a record of the license or purchase — a screenshot, receipt, or saved license page — in case the use is ever questioned later",
        "When in doubt, default to a source with unambiguous commercial licensing rather than gambling on an image with no visible license information",
      ]),
      p(
        "None of this is a substitute for legal advice about a specific image or a specific demand letter that's " +
          "already landed — it's a practical way to avoid the situation in the first place, which is far cheaper " +
          "than resolving it after the fact."
      ),
      p(
        "The same care about where a visual asset comes from applies to a business's own brand assets — a logo or " +
          "wordmark can carry both copyright in the artwork and separate trademark rights in how it's used to " +
          "identify the business."
      ),
      link("Trademark basics every small business should know", "/blog/trademark-basics-for-small-business"),
      h2("Frequently asked questions"),
      h3("Is an image free to use if there's no copyright notice on it?"),
      p(
        "No. Copyright generally applies automatically to original creative work the moment it's created, whether " +
          "or not a notice is attached. The absence of a visible copyright symbol says nothing about whether the " +
          "image is actually free to use."
      ),
      h3("Can I use a stock image I paid for in any project I want?"),
      p(
        "Only within the terms of the specific license purchased. Even royalty-free licenses commonly restrict " +
          "certain uses — reselling the image standalone, using it in a way that implies endorsement, or exceeding " +
          "a print or distribution cap on some plans — so it's worth checking the license terms for anything " +
          "beyond routine use."
      ),
      h3("What should I do if I get a demand letter for an image I already used?"),
      p(
        "Don't ignore it, but don't assume the first letter received is the final word on the amount owed either. " +
          "These situations are common enough that it's worth a brief consultation with an attorney familiar with " +
          "copyright demand letters before responding or paying, since the appropriate response varies a lot by " +
          "the specifics of the claim."
      ),
      h3("Does crediting the photographer protect me even without a license?"),
      p(
        "Generally no. Attribution is often a condition of a specific license, not a substitute for having one. " +
          "Crediting a creator without any underlying license or permission doesn't generally make otherwise " +
          "unauthorized use of an image lawful."
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
