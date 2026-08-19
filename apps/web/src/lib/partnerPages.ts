/** "Docracy for X" landing pages — built for backlink outreach to platforms whose users end up
 *  needing a signature (CRMs, help desks, LMSs, industry-specific tools, etc.).
 *
 *  Deliberately fewer, deeper pages than one-per-referrer-domain: a wall of near-identical pages
 *  that only swap a brand name reads as doorway/thin content to search engines and would likely
 *  hurt SEO rather than help it. Each entry instead covers one real, distinct audience and names
 *  every relevant referrer tool explicitly in `namedTools` (rendered in its own section) — so an
 *  outreach recipient still sees their own platform called out by name, without the page being a
 *  copy-paste template.
 *
 *  Positioning is deliberately NOT "no login / no subscription / cheap" — Docracy's real
 *  differentiators now (WhatsApp-native signing, a template marketplace, audit trails, team
 *  workflows) read as premium, not as a free toy. The account model is: senders sign up (so
 *  history, templates, and team features have somewhere to live); signers never need to. The free
 *  tier is mentioned as a detail, not the headline pitch. */
export interface PartnerPageContent {
  slug: string;
  seoTitle: string;
  seoDescription: string;
  heroHeadline: string;
  heroSubheadline: string;
  /** Referrer tools/platforms this page explicitly name-checks, shown in their own section. */
  namedTools: string[];
  painPoints: string[];
  whyDocracy: string;
  features: Array<{ title: string; body: string }>;
  /** Shown when Docracy genuinely isn't a fit for part of this audience's needs — same honesty
   *  convention as INDUSTRY_PAGES, especially important for regulated-adjacent audiences. */
  honestLimit?: string;
  relevantTemplates: string[];
  ctaLabel: string;
  ctaTo: string;
  /** Cross-links to existing pages that cover an overlapping audience more specifically. */
  relatedLinks: Array<{ label: string; to: string }>;
}

export const PARTNER_PAGES: PartnerPageContent[] = [
  {
    slug: "builderprime",
    seoTitle: "Docracy for BuilderPrime — Sign Estimates & Contracts on the Spot",
    seoDescription:
      "Send BuilderPrime estimates and contracts for signature over WhatsApp or email — reusable templates, phone-bound PIN verification, and a full audit trail.",
    heroHeadline: "Get BuilderPrime estimates signed before you leave the job site.",
    heroSubheadline: "WhatsApp-native signing meets homeowners where they already are — on their phone, not in an inbox.",
    namedTools: ["BuilderPrime"],
    painPoints: [
      "Estimates and contracts get emailed, but homeowners are on-site with a contractor, not at a desk checking email",
      "A signed agreement needs to hold up later — verbal or half-signed paperwork doesn't",
      "Every job type (roofing, remodeling, HVAC) reuses the same contract structure with different numbers",
    ],
    whyDocracy:
      "Docracy sits next to BuilderPrime as the signing step: save your standard estimate or work-order template once, " +
      "then reuse it for every job. Send it by WhatsApp for an on-the-spot signature — phone-bound and PIN-protected " +
      "so it's clear who actually signed — or by email/SMS when that fits better. The homeowner never creates an account; " +
      "you keep every signed document and its audit trail under yours.",
    features: [
      { title: "Reusable job templates", body: "Save your standard work order or service agreement once, reuse it for every estimate." },
      { title: "WhatsApp delivery with a PIN", body: "Phone-bound, PIN-protected signing — a stronger signal than an emailed PDF that anyone could sign." },
      { title: "No account for homeowners", body: "They open a link, review, and sign — nothing to install or register." },
      { title: "Full audit trail", body: "Delivery, read, and signature timestamps recorded automatically — useful if a job ever gets disputed." },
    ],
    honestLimit: "Docracy isn't a CRM or job-scheduling tool — it's the signing step you hand off to from BuilderPrime, not a replacement for it.",
    relevantTemplates: ["work-order", "service-agreement"],
    ctaLabel: "Try free — send a sample work order",
    ctaTo: "/prepare?freeTemplate=work-order&ref=partner-builderprime",
    relatedLinks: [{ label: "Docracy for Facility & Property Management", to: "/for/facility-management" }],
  },
  {
    slug: "salesforce",
    seoTitle: "Docracy for Salesforce — A Fast Signing Step for Your Deals",
    seoDescription:
      "Close Salesforce opportunities faster with a WhatsApp-native signing step — reusable quote and agreement templates, no account required for the signer.",
    heroHeadline: "Your deal's in Salesforce. Get it signed without leaving the flow.",
    heroSubheadline: "A lightweight signing step for reps who close in Salesforce but still email a PDF somewhere else to finish the deal.",
    namedTools: ["Salesforce", "Salesforce Lightning"],
    painPoints: [
      "The opportunity is tracked in Salesforce, but the actual signature happens in a separate, disconnected tool",
      "Reps want to send a signing link the moment a quote is approved — from their phone, not just their desk",
      "Every rep re-creates the same quote/agreement structure instead of reusing one saved template",
    ],
    whyDocracy:
      "Docracy is the external signing step your Salesforce workflow hands off to: save your standard quote or " +
      "service agreement once as a reusable template, then send it for signature by email or WhatsApp the moment a " +
      "deal is ready to close. The prospect signs without creating an account; you keep the signed PDF and a full " +
      "delivery/read audit trail on your side.",
    features: [
      { title: "Reusable quote templates", body: "Save your standard agreement structure once, reuse it for every opportunity." },
      { title: "WhatsApp delivery", body: "Reach mobile-first prospects on the channel they actually check." },
      { title: "Sequential or parallel signing", body: "Route through your side and the customer's side in whatever order the deal needs." },
      { title: "Audit trail per document", body: "Every send, view, and signature timestamped — attach it back to the opportunity manually or via API." },
    ],
    honestLimit: "There's no installed Salesforce/AppExchange package today — this is an external signing step you link to from Salesforce, not an embedded app.",
    relevantTemplates: ["service-agreement", "sales-agreement"],
    ctaLabel: "Try free — send a sample agreement",
    ctaTo: "/prepare?freeTemplate=service-agreement&ref=partner-salesforce",
    relatedLinks: [{ label: "Docracy for CRM & Workflow Tools", to: "/for/crm-tools" }],
  },
  {
    slug: "crm-tools",
    seoTitle: "Docracy for CRM & Workflow Tools — Sign Without Leaving Your Process",
    seoDescription:
      "Add a fast, WhatsApp-native signing step to your CRM or workflow tool — amoCRM, Pipefy, Kartra, and more. Reusable templates, no account for signers.",
    heroHeadline: "Your CRM tracks the deal. Docracy handles the signature.",
    heroSubheadline: "A signing step that plugs into whatever workflow tool you already run — no CLM, no seat tax.",
    namedTools: ["amoCRM", "Pipefy", "Crosstrax", "Kartra", "FlowLogic", "SendSonar", "Harvest", "Invoicely", "ActivTrak"],
    painPoints: [
      "Your CRM or workflow tool tracks the deal, task, or funnel — but signing the actual agreement means switching tools",
      "Quotes, invoices, and vendor terms all reuse the same structure but get rebuilt from scratch each time",
      "Customers drop off when a simple approval turns into a full account signup",
    ],
    whyDocracy:
      "Docracy works as the signing step your CRM or workflow tool hands off to. Automate it with the Zapier " +
      "connector — \"when a deal reaches this stage, send the agreement\" — or send manually when you need to. " +
      "Save your quote, vendor, or purchase-order template once and reuse it across every deal; the person signing " +
      "never needs an account on your platform or Docracy's.",
    features: [
      { title: "Zapier connector", body: "Trigger a signing request automatically from a CRM stage change or workflow event." },
      { title: "Reusable templates", body: "One saved template per document type — quotes, vendor terms, purchase orders." },
      { title: "WhatsApp delivery", body: "Phone-bound, PIN-protected signing for customers who live on WhatsApp, not email." },
      { title: "Sequential signer chains", body: "Route an agreement through both sides of a deal in order." },
    ],
    relevantTemplates: ["vendor-agreement", "purchase-order", "service-agreement"],
    ctaLabel: "Try free — send a sample vendor agreement",
    ctaTo: "/prepare?freeTemplate=vendor-agreement&ref=partner-crm-tools",
    relatedLinks: [
      { label: "Docracy for Salesforce", to: "/for/salesforce" },
      { label: "Docracy for BuilderPrime", to: "/for/builderprime" },
    ],
  },
  {
    slug: "helpdesk-support",
    seoTitle: "Docracy for Help Desk & Support Teams — Sign in the Same Thread",
    seoDescription:
      "Send authorization forms and service agreements over SMS or WhatsApp, in the same thread your customer is already in — Freshdesk, Textline, Zipwhip, and more.",
    heroHeadline: "Don't send customers to a new tool to sign something.",
    heroSubheadline: "A signing link that drops straight into the SMS or WhatsApp thread your support team is already using.",
    namedTools: ["Freshdesk", "Textline", "TextRequest", "Zipwhip", "Sharpencx"],
    painPoints: [
      "Support and success teams handle account changes or authorizations over chat, SMS, or a ticket thread",
      "Asking a customer to \"create an account to sign this\" mid-conversation kills momentum",
      "Confirming who actually approved a change matters when it's disputed later",
    ],
    whyDocracy:
      "Docracy delivers a signing link on the same channel your team already uses — SMS via carrier gateway, or a " +
      "WhatsApp message with a phone-bound, PIN-protected link — so the customer signs without ever leaving the " +
      "conversation or creating an account. A saved authorization or service-agreement template means agents send " +
      "the same clean document every time, not a rebuilt PDF.",
    features: [
      { title: "SMS delivery", body: "Signing links sent via carrier email-to-SMS gateway — no separate SMS platform needed." },
      { title: "WhatsApp delivery with PIN", body: "Stronger than a plain link: phone-bound and PIN-verified." },
      { title: "Saved authorization templates", body: "One template per use case (account change, service terms) reused by the whole team." },
      { title: "Audit trail", body: "Every delivery, read, and signature timestamped — useful evidence if a change is disputed." },
    ],
    relevantTemplates: ["authorization-form", "service-agreement"],
    ctaLabel: "Try free — send a sample authorization form",
    ctaTo: "/prepare?freeTemplate=authorization-form&ref=partner-helpdesk-support",
    relatedLinks: [{ label: "Docracy for CRM & Workflow Tools", to: "/for/crm-tools" }],
  },
  {
    slug: "staffing-recruiting",
    seoTitle: "Docracy for Staffing & Recruiting — Offer Letters Candidates Actually Sign",
    seoDescription:
      "Send offer letters and onboarding paperwork over WhatsApp or email — reusable templates for staffing and recruiting teams. No account required for candidates.",
    heroHeadline: "Candidates you reach on WhatsApp shouldn't have to sign by email.",
    heroSubheadline: "Offer letters and onboarding paperwork, delivered on the channel your candidates actually check.",
    namedTools: ["BullhornStaffing", "Akken", "Nativeteams", "DisabilityCreditCanada", "Compani"],
    painPoints: [
      "Candidates are often reached and screened over phone or WhatsApp, then asked to sign an offer by email",
      "Onboarding paperwork gets rebuilt per role instead of reused from a saved template",
      "A staffing team needs proof of exactly when a candidate accepted, not just that a PDF exists somewhere",
    ],
    whyDocracy:
      "Docracy meets candidates on WhatsApp — phone-bound and PIN-protected, so it's clear the actual candidate " +
      "signed, not just whoever had the link. Save an offer letter or onboarding-agreement template once per role " +
      "type and reuse it for every hire; a full audit trail records exactly when it was delivered, opened, and signed.",
    features: [
      { title: "Offer letter & onboarding templates", body: "Save once per role type, reuse for every candidate." },
      { title: "WhatsApp-native signing", body: "Phone-bound, PIN-protected delivery — stronger than an emailed PDF." },
      { title: "Sequential signing", body: "Candidate signs, then HR countersigns, in order." },
      { title: "Delivery/read audit trail", body: "Proof of exactly when an offer was seen and accepted." },
    ],
    honestLimit: "Docracy isn't an ATS or HRIS — it complements your existing staffing platform for the signature step, not a replacement for it.",
    relevantTemplates: ["offer-letter", "employee-onboarding-agreement", "contractor-onboarding-agreement"],
    ctaLabel: "Try free — send a sample offer letter",
    ctaTo: "/prepare?freeTemplate=offer-letter&ref=partner-staffing-recruiting",
    relatedLinks: [{ label: "Docracy for Healthcare & Care Services", to: "/for/healthcare" }],
  },
  {
    slug: "sop-training",
    seoTitle: "Docracy for SOPs, Training & Online Courses — Signed Acknowledgments",
    seoDescription:
      "Add signed SOP and code-of-conduct acknowledgments to your training platform or LMS — Trainual, Moodle, EditRepublic, and more.",
    heroHeadline: "Every SOP or course completion should end with a signed acknowledgment.",
    heroSubheadline: "Drop a signing step into any training platform or LMS, with a real audit trail of who acknowledged what.",
    namedTools: ["Trainual", "EditRepublic", "Moodle", "University SharePoint"],
    painPoints: [
      "Training platforms and LMSs need signed SOP or code-of-conduct acknowledgments, not just a \"mark complete\" click",
      "Building e-signature into an LMS from scratch is its own project",
      "Proving a specific person acknowledged a specific policy version matters for compliance review",
    ],
    whyDocracy:
      "Docracy adds the missing signed step: save an SOP or code-of-conduct acknowledgment as a reusable template " +
      "once per course or policy, then send it to a student or trainee to sign in under a minute — no account " +
      "needed on their end. For a whole cohort, send it to everyone at once with parallel signing; a full audit " +
      "trail shows exactly who acknowledged what, and when.",
    features: [
      { title: "Acknowledgment templates", body: "Code-of-conduct and acceptable-use templates ready to reuse per course." },
      { title: "Parallel signing for cohorts", body: "Send the same document to an entire class or team at once." },
      { title: "No student account required", body: "They open a link and sign — nothing new to register for." },
      { title: "Exportable audit trail", body: "Who acknowledged, when — useful for compliance or accreditation review." },
    ],
    relevantTemplates: ["code-of-conduct-acknowledgment", "acceptable-use-policy-acknowledgment"],
    ctaLabel: "Try free — send a sample acknowledgment",
    ctaTo: "/prepare?freeTemplate=code-of-conduct-acknowledgment&ref=partner-sop-training",
    relatedLinks: [{ label: "Docracy for Enterprise IT & Security Teams", to: "/for/enterprise-it" }],
  },
  {
    slug: "productivity-tools",
    seoTitle: "Docracy for Notes, Docs & Design Tools — Turn Drafts Into Signed PDFs",
    seoDescription:
      "Turn an Evernote draft or Canva design brief into a signable PDF in one upload — no separate account for whoever's approving it.",
    heroHeadline: "Your draft is done. Getting it signed shouldn't be a separate project.",
    heroSubheadline: "Upload a finished document from wherever you drafted it, and get it signed in under a minute.",
    namedTools: ["Evernote", "Canva"],
    painPoints: [
      "Notes and design tools are where drafts live, but final approval always means leaving the tool",
      "A model release, design brief sign-off, or client approval needs a real signature, not just a comment thread",
      "Clients don't want to create an account just to approve one document",
    ],
    whyDocracy:
      "Docracy takes whatever PDF you export — a finished agreement drafted in Evernote, a design brief or model " +
      "release exported from Canva — and turns it into a signable document in one upload. The person approving it " +
      "signs from a link, no account required; you keep a timestamped record that they actually did.",
    features: [
      { title: "Any PDF, any source", body: "Upload directly — no integration required to get started." },
      { title: "Model release & approval templates", body: "Ready-made templates for design and creative sign-off." },
      { title: "WhatsApp delivery", body: "Fast client sign-off on mobile, phone-bound and PIN-protected." },
      { title: "No account for approvers", body: "They review and sign — nothing to install or register." },
    ],
    relevantTemplates: ["model-release-form", "web-design-services-agreement"],
    ctaLabel: "Try free — send a sample model release",
    ctaTo: "/prepare?freeTemplate=model-release-form&ref=partner-productivity-tools",
    relatedLinks: [{ label: "Docracy for Events & Local Service Businesses", to: "/for/local-services" }],
  },
  {
    slug: "moving-companies",
    seoTitle: "Docracy for Moving Companies — Sign Estimates the Day of the Move",
    seoDescription:
      "Get moving estimates signed by WhatsApp or SMS while the crew is on-site — reusable templates, phone-bound PIN verification, and a full audit trail.",
    heroHeadline: "Get the estimate signed before the truck leaves.",
    heroSubheadline: "WhatsApp and SMS-native signing for moving and relocation companies working on same-day timelines.",
    namedTools: ["SmartMoving"],
    painPoints: [
      "Moving estimates need to be signed the same day, often while the customer is mid-move and not at a computer",
      "Verbal agreements or a photo of a signed paper don't hold up as well as a real, timestamped record",
      "Every job reuses the same estimate structure but gets typed out fresh each time",
    ],
    whyDocracy:
      "Docracy sends the signed estimate straight to a customer's phone — over WhatsApp, phone-bound and " +
      "PIN-protected, or by SMS — while your crew is already on-site. Save your standard service-agreement " +
      "template once and reuse it for every move; a full audit trail protects both sides if the details of what " +
      "was agreed are ever disputed later.",
    features: [
      { title: "WhatsApp & SMS delivery", body: "Reach customers on the channel they're actually using, mid-move." },
      { title: "Reusable estimate template", body: "One saved template, reused for every job." },
      { title: "Phone-bound PIN verification", body: "Confirms who actually signed, not just who had the link." },
      { title: "Timestamped audit trail", body: "Protects both sides if the agreed terms are disputed later." },
    ],
    relevantTemplates: ["service-agreement", "personal-property-bill-of-sale"],
    ctaLabel: "Try free — send a sample estimate",
    ctaTo: "/prepare?freeTemplate=service-agreement&ref=partner-moving-companies",
    relatedLinks: [{ label: "Docracy for Delivery & Logistics Platforms", to: "/for/delivery-logistics" }],
  },
  {
    slug: "healthcare",
    seoTitle: "Docracy for Healthcare & Care Staffing — Fast Onboarding Paperwork",
    seoDescription:
      "Sign staffing agreements and onboarding paperwork for healthcare and care organizations — WhatsApp-native delivery, reusable templates. Not for clinical patient records.",
    heroHeadline: "Onboarding paperwork for healthcare staffing, without an enterprise compliance program.",
    heroSubheadline: "A fast signing step for staffing agreements and administrative paperwork — not a clinical records system.",
    namedTools: ["NHS Professionals", "NHSP"],
    painPoints: [
      "Healthcare and care-staffing organizations sign a high volume of onboarding and staffing paperwork",
      "Most e-signature tools built for this space are priced and scoped for full enterprise compliance programs",
      "Staff and contractors need a fast, mobile-friendly way to sign — many aren't at a desk",
    ],
    whyDocracy:
      "Docracy handles the administrative side: staffing agreements, onboarding paperwork, and authorization forms, " +
      "sent by email, SMS, or WhatsApp and signed without an account. Save a template once per role or engagement " +
      "type and reuse it across your staffing pool; a full audit trail records delivery, viewing, and signature.",
    features: [
      { title: "Onboarding templates", body: "Reusable staffing-agreement and onboarding templates." },
      { title: "Mobile-first signing", body: "WhatsApp and SMS delivery for staff who aren't at a desk." },
      { title: "No account for signers", body: "Staff and contractors sign from a link — nothing to register for." },
      { title: "Audit trail", body: "Delivery, read, and signature timestamps recorded automatically." },
    ],
    honestLimit:
      "Docracy is not HIPAA-certified, does not verify signer identity, and isn't built for clinical patient " +
      "records or protected health information — it's a fit for staffing, onboarding, and administrative " +
      "paperwork, not clinical consent forms.",
    relevantTemplates: ["employee-onboarding-agreement", "contractor-onboarding-agreement", "authorization-form"],
    ctaLabel: "Try free — send a sample onboarding agreement",
    ctaTo: "/prepare?freeTemplate=employee-onboarding-agreement&ref=partner-healthcare",
    relatedLinks: [{ label: "Docracy for Staffing & Recruiting", to: "/for/staffing-recruiting" }],
  },
  {
    slug: "facility-management",
    seoTitle: "Docracy for Facility & Property Management — One Vendor Template, Every Site",
    seoDescription:
      "Standardize vendor agreements and work orders across every site, and get them signed by contractors over WhatsApp — no portal to onboard them into.",
    heroHeadline: "One vendor agreement template. Every site. No portal to manage.",
    heroSubheadline: "Standardize vendor and work-order paperwork across sites, signed by contractors who never need an account.",
    namedTools: ["Dentco"],
    painPoints: [
      "Facility and property management teams juggle vendor agreements and work orders across many sites and contractors",
      "Each site or vendor often ends up with a slightly different version of the same agreement",
      "Onboarding every contractor into a portal just to get a signature is more friction than the job justifies",
    ],
    whyDocracy:
      "Docracy lets you standardize a vendor-agreement or work-order template once, then reuse it across every " +
      "site and contractor. Send it over WhatsApp or SMS for a fast on-site signature, phone-bound and " +
      "PIN-protected — no portal, no account for the contractor. Every site's paperwork lands in the same " +
      "structure, with its own audit trail.",
    features: [
      { title: "One template, every site", body: "Standardize vendor and work-order paperwork across your whole portfolio." },
      { title: "WhatsApp & SMS delivery", body: "On-site contractors sign from their phone — no portal required." },
      { title: "No contractor account", body: "They open a link, review, and sign." },
      { title: "Per-site audit trail", body: "Delivery and signature timestamps for every property, every vendor." },
    ],
    relevantTemplates: ["vendor-agreement", "work-order", "property-management-agreement"],
    ctaLabel: "Try free — send a sample vendor agreement",
    ctaTo: "/prepare?freeTemplate=vendor-agreement&ref=partner-facility-management",
    relatedLinks: [{ label: "Docracy for BuilderPrime", to: "/for/builderprime" }],
  },
  {
    slug: "delivery-logistics",
    seoTitle: "Docracy for Delivery & Logistics — Signed Confirmations at the Door",
    seoDescription:
      "Get delivery confirmations and courier agreements signed at the door or in the vehicle — no account required for couriers or recipients.",
    heroHeadline: "A signature at the door shouldn't require an account.",
    heroSubheadline: "Delivery confirmations and courier agreements, signed from a link — phone-bound and PIN-protected when it matters.",
    namedTools: ["Hungrypanda"],
    painPoints: [
      "Delivery and logistics platforms need signed confirmations completed at the door or in a moving vehicle",
      "A full account signup is friction a courier or recipient won't tolerate mid-delivery",
      "Vendor and courier agreements need to be standardized without slowing anyone down",
    ],
    whyDocracy:
      "Docracy's signers never need an account — a courier or recipient signs a delivery confirmation from a link " +
      "in seconds, phone-bound and PIN-protected if it's delivered over WhatsApp. Save a delivery-confirmation or " +
      "vendor-agreement template once and reuse it across your whole fleet.",
    features: [
      { title: "No account for couriers or recipients", body: "Sign from a link — nothing to install or register." },
      { title: "WhatsApp & SMS delivery", body: "Fast, mobile-first signing for delivery and courier workflows." },
      { title: "Reusable confirmation templates", body: "One template, reused across every delivery or vendor agreement." },
      { title: "Audit trail", body: "Timestamped proof of delivery and signature." },
    ],
    relevantTemplates: ["delivery-confirmation", "vendor-agreement"],
    ctaLabel: "Try free — send a sample delivery confirmation",
    ctaTo: "/prepare?freeTemplate=delivery-confirmation&ref=partner-delivery-logistics",
    relatedLinks: [{ label: "Docracy for Moving Companies", to: "/for/moving-companies" }],
  },
  {
    slug: "enterprise-it",
    seoTitle: "Docracy for Enterprise IT & Security Teams — Lightweight Acknowledgment Signing",
    seoDescription:
      "Get acceptable-use policies, code-of-conduct acknowledgments, and vendor NDAs signed across your org — a lightweight signing layer next to SharePoint or your intranet.",
    heroHeadline: "Policy acknowledgments across the org, without a CLM procurement project.",
    heroSubheadline: "A lightweight signing layer for acceptable-use policies, code-of-conduct sign-off, and vendor NDAs.",
    namedTools: ["Barracuda Networks", "Corporate SharePoint"],
    painPoints: [
      "IT and security teams need acceptable-use policies and code-of-conduct acknowledgments signed org-wide",
      "Full enterprise e-signature suites are their own procurement and rollout project",
      "Vendor NDAs need a real audit trail, not just an emailed PDF and an honor system",
    ],
    whyDocracy:
      "Docracy works as a lightweight signing layer next to whatever you already have on SharePoint or your " +
      "intranet: link out to Docracy for the signature step on an acceptable-use policy, code-of-conduct document, " +
      "or vendor NDA, then keep the signed PDF and a full delivery/read audit trail for security review. Send to " +
      "an entire team at once with parallel signing.",
    features: [
      { title: "Acknowledgment templates", body: "Acceptable-use and code-of-conduct templates ready to reuse." },
      { title: "Org-wide parallel signing", body: "Send the same policy to an entire team or department at once." },
      { title: "Vendor NDA workflow", body: "Sequential signing between your org and an external vendor." },
      { title: "Audit trail for security review", body: "Delivery, read, and signature timestamps, exportable as evidence." },
    ],
    honestLimit: "There's no embedded SharePoint app today — this is an external signing step you link to, not an installed package.",
    relevantTemplates: ["acceptable-use-policy-acknowledgment", "code-of-conduct-acknowledgment", "vendor-non-disclosure-agreement"],
    ctaLabel: "Try free — send a sample policy acknowledgment",
    ctaTo: "/prepare?freeTemplate=acceptable-use-policy-acknowledgment&ref=partner-enterprise-it",
    relatedLinks: [{ label: "Docracy for SOPs, Training & Online Courses", to: "/for/sop-training" }],
  },
  {
    slug: "local-services",
    seoTitle: "Docracy for Events & Local Service Businesses — Quotes Clients Actually Sign",
    seoDescription:
      "Send event vendor contracts, photography agreements, and local service quotes for a fast signature — reusable templates, no account required for clients.",
    heroHeadline: "A client who wants to say yes shouldn't have to create an account first.",
    heroSubheadline: "Event vendor contracts and local service quotes, signed in under a minute.",
    namedTools: [],
    painPoints: [
      "Event vendors — photographers, caterers, venues — and local service businesses send quotes clients want to approve fast",
      "Every booking reuses the same contract structure but gets rebuilt or re-typed each time",
      "Clients drop off between \"yes, let's do it\" and actually getting a contract signed",
    ],
    whyDocracy:
      "Docracy gives event vendors and local service businesses a saved template for their standard contract — a " +
      "photography agreement, model release, or service quote — sent for signature the moment a client says yes. " +
      "No account required on the client's side; WhatsApp delivery works well for clients you're already " +
      "texting with about the booking.",
    features: [
      { title: "Photography & event templates", body: "Ready-made contracts for common event and creative-services bookings." },
      { title: "WhatsApp delivery", body: "Send the contract in the same conversation you're already having with a client." },
      { title: "Reusable per booking type", body: "Save your standard terms once, reuse for every client." },
      { title: "No client account", body: "They review and sign from a link — nothing to register for." },
    ],
    relevantTemplates: ["wedding-photography-contract", "photography-services-agreement", "model-release-form"],
    ctaLabel: "Try free — send a sample contract",
    ctaTo: "/prepare?freeTemplate=photography-services-agreement&ref=partner-local-services",
    relatedLinks: [
      { label: "Docracy for Small Businesses", to: "/industry/small-business" },
      { label: "Docracy for Construction & Contractors", to: "/industry/construction" },
    ],
  },
  {
    slug: "germany-eu",
    seoTitle: "Docracy for the German & EU Market — eIDAS-Minded E-Signatures",
    seoDescription:
      "E-signatures built with EU eIDAS in mind — a simple electronic signature by default, and a WhatsApp-verified track designed to meet the Advanced Electronic Signature (AES) standard.",
    heroHeadline: "Digitale Unterschriften, gedacht für den EU-Markt.",
    heroSubheadline: "A default flow that supports eIDAS simple electronic signatures, and a WhatsApp-verified track designed toward Advanced Electronic Signature (AES).",
    namedTools: [],
    painPoints: [
      "Most e-signature tools German and EU businesses find are US-built, priced in dollars, and never mention eIDAS at all",
      "\"Is this legally valid in the EU?\" is a real question most vendors don't answer clearly",
      "Some agreements genuinely need more than a basic electronic signature can prove",
    ],
    whyDocracy:
      "Docracy's default signing flow is designed to support EU eIDAS simple electronic signatures for everyday " +
      "business documents. For agreements that need more, the WhatsApp-verified track binds the signing link to a " +
      "specific phone number, requires a PIN unique to that signer, and records delivery/read receipts — evidence " +
      "designed to meet the eIDAS criteria for an Advanced Electronic Signature (AES): unique linkage, signatory " +
      "identification, sole control, and tamper-evidence.",
    features: [
      { title: "eIDAS-minded by default", body: "The standard signing flow is built with EU simple electronic signature requirements in mind." },
      { title: "WhatsApp-verified AES track", body: "Phone-bound delivery, a required PIN, and a full delivery/read audit trail." },
      { title: "No account for signers", body: "Recipients across the EU sign from a link — nothing to register for." },
      { title: "Transparent trust page", body: "Cloudflare infrastructure, data handling, and exactly what is and isn't covered, documented publicly." },
    ],
    honestLimit:
      "Docracy is not a Qualified Trust Service Provider and doesn't issue Qualified Electronic Signatures (QES) — " +
      "for agreements that legally require a QES, you'll need a certified QTSP provider instead.",
    relevantTemplates: ["mutual-nda", "freelance-service-agreement", "consulting-agreement"],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=partner-germany-eu",
    relatedLinks: [
      { label: "Advanced Electronic Signature (AES) explained", to: "/advanced-electronic-signature" },
      { label: "Trust & security", to: "/trust" },
    ],
  },
  {
    slug: "aircall",
    seoTitle: "Docracy for Aircall — Send the Agreement Before the Call Goes Cold",
    seoDescription:
      "Turn an Aircall sales or support call into a signed agreement in minutes — WhatsApp-native signing, reusable templates, no account required for the signer.",
    heroHeadline: "You just hung up on Aircall. Get it signed while it's still fresh.",
    heroSubheadline: "A signing step for teams who close verbal agreement on the phone but lose momentum waiting for someone to draft the paperwork.",
    namedTools: ["Aircall"],
    painPoints: [
      "A prospect verbally agrees on the call, but the follow-up document doesn't go out until hours later — by then the moment's gone",
      "Support and success calls end in a verbal authorization (a plan change, a refund, a service addendum) that nobody captures in writing",
      "Reps take the same call over and over and rebuild the same agreement or authorization form each time instead of reusing one",
    ],
    whyDocracy:
      "Docracy is the signing step you trigger the moment an Aircall call wraps. Save your standard agreement or " +
      "authorization form once as a reusable template, then send it by WhatsApp or email straight after the call — " +
      "or automate it with Zapier so a call outcome (tagged, transferred to a stage, logged as won) fires off the " +
      "signing request on its own. The customer signs from their phone with no account to create; you keep a timestamped " +
      "audit trail of when it was delivered, opened, and signed.",
    features: [
      { title: "Send it before you hang up the next call", body: "Reusable templates mean the agreement is one click away, not a fresh draft every time." },
      { title: "Zapier automation", body: "Trigger a signing request from a call disposition or tag instead of doing it by hand." },
      { title: "WhatsApp delivery", body: "Phone-first customers who just talked to you on the phone sign on the same device, PIN-protected." },
      { title: "Audit trail per document", body: "Delivery, read, and signature timestamps — a paper trail for a verbal agreement that used to have none." },
    ],
    honestLimit: "There's no installed Aircall app or click-to-sign integration today — this is an external signing step you trigger after the call, via Zapier or a manual link, not something embedded in the Aircall dialer itself.",
    relevantTemplates: ["service-agreement", "authorization-form"],
    ctaLabel: "Try free — send a sample authorization form",
    ctaTo: "/prepare?freeTemplate=authorization-form&ref=partner-aircall",
    relatedLinks: [
      { label: "Docracy for Salesforce", to: "/for/salesforce" },
      { label: "Docracy for CRM & Workflow Tools", to: "/for/crm-tools" },
    ],
  },
  {
    slug: "amocrm",
    seoTitle: "Docracy for amoCRM — Sign the Deal Without Leaving the Pipeline",
    seoDescription:
      "Close amoCRM deals faster with a WhatsApp-native signing step built for phone-first customers — reusable templates, no account required to sign.",
    heroHeadline: "The deal card moved to 'won' in amoCRM. Now get it signed.",
    heroSubheadline: "A signing step for pipeline-driven sales teams whose customers live on WhatsApp, not email.",
    namedTools: ["amoCRM"],
    painPoints: [
      "A deal card reaches the final pipeline stage, but sending the contract means exporting to yet another tool",
      "Customers in amoCRM's core markets expect to be reached and to respond over WhatsApp, not a signature portal that emails a login link",
      "Sales teams rebuild the same sales agreement or invoice terms for every deal card instead of reusing one structure",
    ],
    whyDocracy:
      "Docracy is the signing step your amoCRM pipeline hands off to right as a deal card crosses into its closing " +
      "stage. Save your standard sales agreement or payment terms once as a reusable template, then send it over " +
      "WhatsApp — phone-bound and PIN-protected — or by email when that fits the customer better. Wire it to fire " +
      "automatically with Zapier when a deal hits a given stage, or send it manually from the deal. The customer " +
      "signs without registering anywhere; you keep the signed PDF and a full delivery/read/signature audit trail.",
    features: [
      { title: "Zapier stage triggers", body: "Send a signing request automatically the moment a deal card reaches your closing stage." },
      { title: "WhatsApp-native signing", body: "Reach customers on the channel amoCRM's own market already uses, PIN-protected for accountability." },
      { title: "Reusable deal templates", body: "One saved sales agreement or payment-terms template, reused across every pipeline." },
      { title: "Sequential or parallel signers", body: "Route through your side and the customer's side in whatever order the deal needs." },
    ],
    honestLimit: "There's no installed amoCRM widget or marketplace integration today — this is an external signing step linked from (or automated out of) amoCRM, not an embedded panel inside the deal card.",
    relevantTemplates: ["sales-agreement", "payment-terms-agreement"],
    ctaLabel: "Try free — send a sample sales agreement",
    ctaTo: "/prepare?freeTemplate=sales-agreement&ref=partner-amocrm",
    relatedLinks: [{ label: "Docracy for CRM & Workflow Tools", to: "/for/crm-tools" }],
  },
  {
    slug: "crosstrax",
    seoTitle: "Docracy for Crosstrax — Sign Engagement Letters Before the Case Starts",
    seoDescription:
      "Get investigation engagement letters and client authorization forms signed before work begins — WhatsApp-native signing, no account required for clients.",
    heroHeadline: "The case is open in Crosstrax. Get the engagement letter signed first.",
    heroSubheadline: "A signing step for investigation and background-screening firms who can't start billable work without a signed authorization on file.",
    namedTools: ["Crosstrax"],
    painPoints: [
      "Work can't ethically or legally start on a case until the client has signed an engagement letter and, often, a background-check authorization",
      "Clients are frequently remote or referred in urgently — waiting on a mailed or emailed signature delays intake",
      "Every case type (infidelity, background screening, corporate due diligence) needs its own consistent engagement and authorization paperwork, not a one-off draft",
    ],
    whyDocracy:
      "Docracy is the signing step you run before a case opens in Crosstrax. Save your standard engagement letter, " +
      "client intake agreement, and authorization form once as reusable templates, then send them the moment a new " +
      "case comes in — by WhatsApp for a fast, phone-bound signature or by email when that's more appropriate for " +
      "the client. Nothing is signed until you have consent on file, and the client never needs to create an account " +
      "to give it. Every document carries a timestamped audit trail of delivery, viewing, and signature.",
    features: [
      { title: "Engagement letter templates", body: "Save your standard intake agreement once per case type, reuse it for every new client." },
      { title: "Client authorization forms", body: "Get signed consent for background checks or investigative work before billable time starts." },
      { title: "WhatsApp delivery with a PIN", body: "Phone-bound signing for clients who need to authorize work quickly, wherever they are." },
      { title: "Audit trail on every document", body: "Delivery, read, and signature timestamps — a clear record that consent was obtained before work began." },
    ],
    honestLimit: "There's no installed Crosstrax app or case-management sync today — this is an external signing step you send before or alongside opening a case file, not a feature inside Crosstrax itself.",
    relevantTemplates: ["authorization-form", "consulting-agreement", "mutual-nda"],
    ctaLabel: "Try free — send a sample authorization form",
    ctaTo: "/prepare?freeTemplate=authorization-form&ref=partner-crosstrax",
    relatedLinks: [{ label: "Docracy for CRM & Workflow Tools", to: "/for/crm-tools" }],
  },
  {
    slug: "pipefy",
    seoTitle: "Docracy for Pipefy — Turn an Approval Phase Into a Real Signature",
    seoDescription:
      "When a Pipefy card hits its approval phase, send a real signature instead of a checkbox — reusable templates, no account required for the signer.",
    heroHeadline: "The card hit 'Approval' in Pipefy. Make it an actual signature.",
    heroSubheadline: "A signing step for ops, HR, and procurement pipes that need a binding signature, not just a checkbox field.",
    namedTools: ["Pipefy"],
    painPoints: [
      "A Pipefy approval phase gets marked done with a checkbox or an internal approve button — there's no signed document to point to later",
      "HR onboarding, procurement, and vendor-approval pipes all need a real signature at some phase, not just a status change",
      "The same purchase order, vendor agreement, or offer letter gets rebuilt by hand every time a card reaches that phase",
    ],
    whyDocracy:
      "Docracy is the signing step you attach to a Pipefy pipe's approval phase. Save your standard purchase order, " +
      "vendor agreement, or offer letter once as a reusable template, then trigger a real signing request via Zapier " +
      "when a card enters that phase — or send it manually from the card. The signer opens a link and signs without " +
      "creating an account on Pipefy or Docracy; the signed document and its audit trail move with the card as proof " +
      "the approval was real, not just a status flip.",
    features: [
      { title: "Zapier phase triggers", body: "Fire a signing request automatically when a card moves into your approval phase." },
      { title: "Reusable process templates", body: "One saved purchase order, vendor agreement, or offer letter, reused across every pipe." },
      { title: "A real signature, not a checkbox", body: "Binding, timestamped signatures replace an internal approve button with an actual audit trail." },
      { title: "Sequential approval chains", body: "Route a document through multiple approvers or both sides of a vendor deal in order." },
    ],
    honestLimit: "There's no installed Pipefy app or native connector field today — this is an external signing step triggered via Zapier or a manual link from the card, not a built-in Pipefy integration.",
    relevantTemplates: ["purchase-order", "vendor-agreement", "offer-letter"],
    ctaLabel: "Try free — send a sample purchase order",
    ctaTo: "/prepare?freeTemplate=purchase-order&ref=partner-pipefy",
    relatedLinks: [{ label: "Docracy for CRM & Workflow Tools", to: "/for/crm-tools" }],
  },
  {
    slug: "freshdesk",
    seoTitle: "Docracy for Freshdesk — Close the Ticket, Not Just Reply to It",
    seoDescription:
      "Send a refund waiver or authorization form for signature right from a Freshdesk reply — no customer portal account, no separate e-signature tool holding up your SLA clock.",
    heroHeadline: "The ticket's stuck on \"waiting for signature.\" Fix that from inside the reply.",
    heroSubheadline: "Drop a signing link straight into a Freshdesk ticket — the customer signs from their phone, no portal login required.",
    namedTools: ["Freshdesk"],
    painPoints: [
      "A refund waiver, account-change authorization, or service confirmation is the only thing keeping a ticket in \"Pending\" instead of \"Resolved\"",
      "Asking a customer mid-ticket to log into a portal or create a new account to sign something resets the conversation and risks breaching your SLA timer",
      "Agents rebuild the same authorization text into a canned response instead of sending one consistent, reusable document",
    ],
    whyDocracy:
      "Docracy gives Freshdesk agents a signing link they can paste straight into a ticket reply or canned response — " +
      "sent by email, SMS, or WhatsApp, with WhatsApp signing phone-bound and PIN-protected so it's clear the actual " +
      "customer signed. The customer never creates a portal account; they open the link from the ticket thread and " +
      "sign in under a minute, so the ticket can actually close. Save a refund-waiver or authorization template once " +
      "and every agent sends the same clean document. For teams on Freshdesk's Zapier integration, automate the " +
      "handoff entirely: when a ticket hits a certain status or tag, fire off the signing request automatically.",
    features: [
      { title: "Paste-into-reply signing links", body: "Send from a canned response or macro — no separate tool to open." },
      { title: "WhatsApp delivery with PIN", body: "Phone-bound, PIN-protected signing for customers who won't check email mid-ticket." },
      { title: "Zapier automation", body: "Trigger a signing request when a ticket reaches a given status or tag." },
      { title: "Audit trail tied to the resolution", body: "Timestamped delivery, read, and signature — evidence for what closed the ticket." },
    ],
    honestLimit: "There's no native Freshdesk marketplace app — this is an external signing step you link to from a ticket, not an installed integration.",
    relevantTemplates: ["authorization-form", "service-agreement"],
    ctaLabel: "Try free — send a sample authorization form",
    ctaTo: "/prepare?freeTemplate=authorization-form&ref=partner-freshdesk",
    relatedLinks: [{ label: "Docracy for Help Desk & Support Teams", to: "/for/helpdesk-support" }],
  },
  {
    slug: "bullhorn",
    seoTitle: "Docracy for Bullhorn — Lock In the Placement Before It Slips",
    seoDescription:
      "Get offer letters and contractor agreements signed by WhatsApp or SMS the moment a candidate accepts — before a competing agency's paperwork gets there first.",
    heroHeadline: "The candidate said yes. Now get it signed before another agency reaches them.",
    heroSubheadline: "Offer letters and contractor agreements sent to a candidate's phone, signed in minutes — fast enough to matter in a competitive placement.",
    namedTools: ["Bullhorn"],
    painPoints: [
      "A candidate can verbally accept a placement and still take a counter-offer from another agency while the paperwork is stuck in an email attachment",
      "Recruiters reach and screen candidates by phone and text, then switch to email for the one step that actually locks the deal in",
      "Every job order reuses the same offer-letter or contractor-agreement structure, but it gets retyped or reformatted for each submission",
    ],
    whyDocracy:
      "Docracy sends the offer letter or independent-contractor agreement straight to the candidate's phone — over " +
      "WhatsApp, phone-bound and PIN-protected, or by SMS — so signing happens in the same conversation the recruiter " +
      "is already having, not after a delay to check email. Save one template per job type or client and reuse it for " +
      "every submission; sequential signing routes the candidate's signature first, then the agency's countersignature, " +
      "in order. A timestamped audit trail backs up exactly when the candidate accepted, which matters when a " +
      "placement is contested.",
    features: [
      { title: "WhatsApp & SMS delivery", body: "Reach candidates on the channel recruiters already use to close them." },
      { title: "Reusable offer & contractor templates", body: "Save once per job type or client, reuse for every placement." },
      { title: "Sequential signing", body: "Candidate signs, then the agency countersigns, in order." },
      { title: "Timestamped acceptance record", body: "Proof of exactly when a candidate accepted — useful if a placement is disputed." },
    ],
    honestLimit: "There's no installed Bullhorn Marketplace app today — this is an external signing step you hand off to from Bullhorn, not an embedded integration.",
    relevantTemplates: ["offer-letter", "independent-contractor-agreement"],
    ctaLabel: "Try free — send a sample offer letter",
    ctaTo: "/prepare?freeTemplate=offer-letter&ref=partner-bullhorn",
    relatedLinks: [{ label: "Docracy for Staffing & Recruiting", to: "/for/staffing-recruiting" }],
  },
  {
    slug: "akken",
    seoTitle: "Docracy for AkkenCloud — Paperwork Signed Before the First Shift",
    seoDescription:
      "Get contractor agreements and onboarding paperwork signed on a worker's phone before their first shift — reusable templates for staffing agencies running on AkkenCloud.",
    heroHeadline: "The shift starts tomorrow. The paperwork can't still be pending.",
    heroSubheadline: "Contractor agreements and onboarding forms, signed on a worker's phone with enough time to spare before their first shift.",
    namedTools: ["Akken", "AkkenCloud"],
    painPoints: [
      "A worker can be assigned to a shift within days — sometimes hours — of being onboarded, leaving little room for paperwork delays",
      "Onboarding coordinators track a checklist of contractor agreements and authorization forms per worker, often rebuilt by hand for each classification",
      "Many temp and contract workers only have a phone, not a computer, to review and sign onboarding documents",
    ],
    whyDocracy:
      "Docracy sends onboarding paperwork directly to a worker's phone — over WhatsApp, phone-bound and " +
      "PIN-protected, or by SMS — so a coordinator can get a contractor agreement or authorization form signed the " +
      "same day it's needed, not after it sits unopened in an inbox. Save a separate template per worker " +
      "classification (W-2 temp vs. 1099 contractor) and reuse it for every assignment; sequential signing routes " +
      "the worker's signature first, then the coordinator's sign-off. A timestamped audit trail gives you proof the " +
      "paperwork was actually completed before the worker's first shift.",
    features: [
      { title: "Same-day mobile signing", body: "WhatsApp and SMS delivery for workers who may only have a phone." },
      { title: "Per-classification templates", body: "Separate reusable templates for W-2 temps and 1099 contractors." },
      { title: "Sequential sign-off", body: "Worker signs, then the coordinator countersigns, in order." },
      { title: "Pre-shift audit trail", body: "Timestamped proof paperwork was signed before the worker's start date." },
    ],
    honestLimit: "There's no native AkkenCloud integration — this is an external signing step you hand off to from Akken, not an installed package.",
    relevantTemplates: ["contractor-onboarding-agreement", "independent-contractor-agreement", "authorization-form"],
    ctaLabel: "Try free — send a sample contractor onboarding agreement",
    ctaTo: "/prepare?freeTemplate=contractor-onboarding-agreement&ref=partner-akken",
    relatedLinks: [{ label: "Docracy for Staffing & Recruiting", to: "/for/staffing-recruiting" }],
  },
  {
    slug: "trainual",
    seoTitle: "Docracy for Trainual — Signed Acknowledgments for SOPs & Policies",
    seoDescription:
      "Trainual tracks who finished a course; it doesn't collect a signature. Send the acknowledgment as a real signed document after the SOP is marked complete.",
    heroHeadline: "\"Marked complete\" in Trainual isn't a signature.",
    heroSubheadline: "When an SOP, safety policy, or code of conduct needs a real acknowledgment on file, hand that step to Docracy.",
    namedTools: ["Trainual"],
    painPoints: [
      "Trainual's completion tracking shows an employee viewed and clicked through a topic, not that they signed anything",
      "Some SOPs — safety procedures, confidentiality terms, disciplinary policies — need a dated signature for compliance or a personnel file, not just a completion percentage",
      "There's no built-in way to turn a finished Trainual course into a signed PDF a manager can attach to an employee record",
      "Small businesses running onboarding through Trainual often still chase down paper or emailed acknowledgment forms separately",
    ],
    whyDocracy:
      "Docracy isn't a Trainual integration — it's the signing step you hand off to once a course or SOP is marked complete. Save the " +
      "policy or SOP acknowledgment as a reusable template, then send the link to the new hire (or the whole onboarding cohort at " +
      "once) right after they finish the Trainual topic. They sign from the link with no account of their own, and you get a " +
      "timestamped record — sender, signer, and signature — to keep alongside the Trainual completion log.",
    features: [
      { title: "Acknowledgment templates", body: "Save a policy or SOP acknowledgment once, reuse it for every new hire." },
      { title: "Send right after completion", body: "Share the signing link as the last step once a Trainual topic is marked done." },
      { title: "No account for the signer", body: "New hires and existing staff just open a link and sign." },
      { title: "Timestamped audit trail", body: "A dated signature record to keep alongside the Trainual completion log." },
    ],
    honestLimit:
      "There's no native Trainual app, plugin, or API integration — this is a manual or Zapier-automated hand-off, not an embedded " +
      "signing step inside Trainual itself. Docracy also has no education- or training-specific features: no gradebook sync, no " +
      "LMS-style completion tracking, and no school or org SSO. It's a general-purpose e-signature tool that fits well after Trainual, " +
      "not a Trainual add-on.",
    relevantTemplates: ["employee-onboarding-agreement", "code-of-conduct-acknowledgment", "acceptable-use-policy-acknowledgment"],
    ctaLabel: "Try free — send a sample acknowledgment",
    ctaTo: "/prepare?freeTemplate=employee-onboarding-agreement&ref=partner-trainual",
    relatedLinks: [
      { label: "Docracy for SOPs, Training & Online Courses", to: "/for/sop-training" },
      { label: "Docracy for Enterprise IT & Security Teams", to: "/for/enterprise-it" },
    ],
  },
  {
    slug: "moodle",
    seoTitle: "Docracy for Moodle — Signed Statements for Courses & Cohorts",
    seoDescription:
      "Moodle can track quiz attempts and grades, but it has no e-signature. Collect a real signed academic integrity or lab safety statement per course.",
    heroHeadline: "Moodle can grade an assignment. It can't collect a signature.",
    heroSubheadline: "For academic integrity statements, lab safety waivers, or enrollment agreements tied to a course, add the signing step Moodle skips.",
    namedTools: ["Moodle"],
    painPoints: [
      "Moodle has no native e-signature — a \"tick this box to agree\" checkbox activity isn't a signed, attributable record",
      "Academic integrity statements, lab or field-trip safety waivers, and course enrollment agreements often need an actual signature, not a form submission logged in the gradebook",
      "Instructors managing this outside Moodle usually resort to printed forms or an emailed PDF with no consistent trail back to the course",
      "A cohort can be dozens or hundreds of students; collecting individual signed statements without a batch workflow is its own project",
    ],
    whyDocracy:
      "Docracy sits outside Moodle as the signing step you link to from the course page, not an installed Moodle plugin. Save the " +
      "integrity statement, safety waiver, or enrollment agreement as a reusable template once per course, then post the signing " +
      "link in the course itself or send it to the whole enrolled cohort at once with parallel signing. Each student signs with no " +
      "account required, and a timestamped audit trail shows exactly who signed which version and when — useful if a program or " +
      "accreditation review ever asks for evidence.",
    features: [
      { title: "One template per course", body: "Save the integrity statement or waiver once, reuse it every term." },
      { title: "Whole-cohort parallel signing", body: "Send to an entire class roster at once instead of chasing individuals." },
      { title: "No student account needed", body: "Students open a link and sign — nothing to register for in Moodle or Docracy." },
      { title: "Exportable audit trail", body: "A dated signature record per student, separate from the Moodle gradebook." },
    ],
    honestLimit:
      "Docracy has no Moodle plugin, block, or API integration — the signing link lives outside the course shell, shared manually or via " +
      "Zapier (for example, when a Moodle activity is marked complete). There are also no education-specific features: no FERPA-specific " +
      "claims, no gradebook integration, and no school or campus SSO. This is a general-purpose signing tool, not an LMS module.",
    relevantTemplates: ["code-of-conduct-acknowledgment", "liability-waiver", "acceptable-use-policy-acknowledgment"],
    ctaLabel: "Try free — send a sample statement",
    ctaTo: "/prepare?freeTemplate=liability-waiver&ref=partner-moodle",
    relatedLinks: [
      { label: "Docracy for SOPs, Training & Online Courses", to: "/for/sop-training" },
    ],
  },
  {
    slug: "online-courses",
    seoTitle: "Docracy for Online Course Creators — Signed Waivers & Agreements",
    seoDescription:
      "Cohort-based courses on EditRepublic and similar platforms rarely have built-in e-signature. Collect a signed waiver or code of conduct before day one.",
    heroHeadline: "Before a cohort starts, get it in writing.",
    heroSubheadline: "Course platforms like EditRepublic handle payment and content — not signed waivers, codes of conduct, or terms acknowledgments. Add that step separately.",
    namedTools: ["EditRepublic"],
    painPoints: [
      "Most course-hosting platforms collect payment and track lesson progress, but have no built-in way to collect a signed waiver or agreement",
      "Cohort-based courses with live coaching, group calls, or physical activity often need a liability waiver or code of conduct signed before day one, not buried in checkout terms",
      "\"I agree\" checkboxes at checkout don't produce the kind of individually attributable, timestamped record a dispute or refund request might call for",
      "Course creators running multiple cohorts need to re-send the same agreement to a new group each time without rebuilding it",
    ],
    whyDocracy:
      "Docracy isn't built into any course platform — it's the signing step a creator links to from the welcome email or first module, " +
      "separate from checkout. Save the waiver, code of conduct, or terms acknowledgment as a reusable template once, then send it to " +
      "each new cohort in one batch with parallel signing so everyone signs before the course starts. Students sign from a link with " +
      "no account needed, and a timestamped audit trail gives the creator a real record independent of whatever the course platform logs.",
    features: [
      { title: "Reusable per-cohort template", body: "Save the waiver or agreement once, re-send it to every new cohort." },
      { title: "Parallel signing before day one", body: "Send to the whole cohort at once and track who's signed so far." },
      { title: "No student account required", body: "Students sign from a link — no new login for your course platform or Docracy." },
      { title: "Independent audit trail", body: "A signed, timestamped record kept outside the course platform itself." },
    ],
    honestLimit:
      "There's no native app or installed integration with EditRepublic or any other course-hosting platform — this is a link shared " +
      "alongside the course, optionally automated with Zapier (for example, when a student enrolls or a module is marked complete). " +
      "Docracy also has no education-specific features: no FERPA-specific claims, no gradebook or completion sync, and no school or " +
      "platform SSO. It's a general-purpose signing tool that happens to fit well before a cohort starts.",
    relevantTemplates: ["liability-waiver", "code-of-conduct-acknowledgment", "website-terms-of-service-acknowledgment"],
    ctaLabel: "Try free — send a sample waiver",
    ctaTo: "/prepare?freeTemplate=liability-waiver&ref=partner-online-courses",
    relatedLinks: [
      { label: "Docracy for SOPs, Training & Online Courses", to: "/for/sop-training" },
      { label: "Docracy for Moodle", to: "/for/moodle" },
    ],
  },
  {
    slug: "evernote",
    seoTitle: "Docracy for Evernote — Turn a Drafted Proposal Into a Signed PDF",
    seoDescription:
      "Finish a proposal or scope of work in Evernote, export it as a PDF, and get it signed the same day — sequential signing, no account required for the client.",
    heroHeadline: "The proposal's finished in Evernote. Getting it signed is still a separate step.",
    heroSubheadline: "Export the note as a PDF and send it for signature in minutes — no new tool to learn, no account for the client.",
    namedTools: ["Evernote"],
    painPoints: [
      "A proposal or scope of work goes through several rounds of edits inside the same Evernote note, but finalizing it still means turning it into something a client can actually sign, not just read",
      "Evernote's Share Note link lets a client view the draft, but there's no signature, timestamp, or audit trail attached to that link",
      "Freelancers and consultants keep client work spread across notebooks and tags; every proposal still needs its own clean, signable PDF before it counts as accepted",
    ],
    whyDocracy:
      "Docracy picks up right where Evernote leaves off: export your finished proposal or scope-of-work note as a PDF, " +
      "upload it, and send it out for signature the same day. Save the structure once as a reusable template so the " +
      "next scope of work doesn't start from a blank note. The client signs from a link with no account to create, " +
      "and you keep a timestamped record of delivery, viewing, and signature on your side.",
    features: [
      { title: "Reusable SOW & proposal templates", body: "Save your standard structure once, reuse it for every new client." },
      { title: "Sequential signing", body: "You sign first, then the client — or route it however the engagement requires." },
      { title: "WhatsApp delivery", body: "Send the signing link somewhere a busy client will actually see it." },
      { title: "Audit trail per document", body: "Delivery, read, and signature timestamps — proof the note became a real agreement." },
    ],
    honestLimit: "There's no Evernote plugin or direct export — Docracy doesn't pull notes from Evernote automatically. You export the note as a PDF yourself (Evernote's own Export/Print as PDF option) and upload that file to Docracy.",
    relevantTemplates: ["scope-of-work", "freelance-service-agreement", "consulting-agreement"],
    ctaLabel: "Try free — send a sample scope of work",
    ctaTo: "/prepare?freeTemplate=scope-of-work&ref=partner-evernote",
    relatedLinks: [{ label: "Docracy for Notes, Docs & Design Tools", to: "/for/productivity-tools" }],
  },
  {
    slug: "canva",
    seoTitle: "Docracy for Canva — Get a Designed Proposal or Release Form Signed",
    seoDescription:
      "Export your Canva proposal, contract, or model release as a PDF and get it signed without losing the design — no account required for the signer.",
    heroHeadline: "The design's done in Canva. Signing it shouldn't flatten it into a plain form.",
    heroSubheadline: "Upload the PDF you exported from Canva as-is and get it signed while it still looks like your work.",
    namedTools: ["Canva"],
    painPoints: [
      "A proposal, one-page contract, or brand guideline built in Canva loses its polish the moment it has to be retyped into a generic signature tool",
      "Photographers and designers need a model or client to sign a release on location, from a phone, without redoing the document from scratch",
      "Canva has no built-in way to collect a signature that means anything legally — sharing a design link only confirms someone opened it, not that they agreed to it",
    ],
    whyDocracy:
      "Docracy takes the PDF you already exported from Canva and uploads it exactly as designed — brand colors, layout, " +
      "and all — instead of forcing you into a plain-text contract template. Save your standard proposal or release " +
      "form once as a reusable template, then send it for signature by WhatsApp when you're shooting on location or " +
      "closing a design engagement. The signer opens a link and signs, no account needed, and you keep a timestamped " +
      "audit trail of the whole exchange.",
    features: [
      { title: "Design stays intact", body: "Upload the exported PDF as-is — no reformatting into a generic contract." },
      { title: "Model release & proposal templates", body: "Ready-made templates for creative and photography sign-off." },
      { title: "WhatsApp delivery", body: "Get a release signed on-site, phone-bound and PIN-protected." },
      { title: "Audit trail per document", body: "Timestamped delivery, view, and signature record for every send." },
    ],
    honestLimit: "There's no Canva app or in-editor \"send to Docracy\" button — Docracy doesn't import designs from Canva directly. You use Canva's own Download as PDF option and upload that file to Docracy.",
    relevantTemplates: ["model-release-form", "photography-services-agreement", "web-design-services-agreement"],
    ctaLabel: "Try free — send a sample model release",
    ctaTo: "/prepare?freeTemplate=model-release-form&ref=partner-canva",
    relatedLinks: [{ label: "Docracy for Notes, Docs & Design Tools", to: "/for/productivity-tools" }],
  },
  {
    slug: "smartmoving",
    seoTitle: "Docracy for SmartMoving — Sign Change Orders Before the Crew Leaves",
    seoDescription:
      "Get SmartMoving estimates and day-of change orders signed on the truck — WhatsApp delivery, phone-bound PIN verification, and a reusable template for every job.",
    heroHeadline: "The SmartMoving estimate is set. Get the change order signed before the crew moves on.",
    heroSubheadline: "A fast signing step for the paperwork SmartMoving doesn't close out on its own — change orders, extra-item waivers, and bills of sale, signed on the customer's phone.",
    namedTools: ["SmartMoving"],
    painPoints: [
      "SmartMoving builds the estimate and schedules the crew, but the day almost never goes exactly as quoted — extra stairs, a long carry, an added stop — and that change in scope still needs a real signature",
      "Dispatchers are running several jobs at once and can't stop to build a new document by hand every time a job's scope changes mid-move",
      "High-value items left behind, storage add-ons, or partial-shipment handoffs need their own signed record, separate from the original SmartMoving quote",
    ],
    whyDocracy:
      "Docracy picks up where the SmartMoving estimate leaves off. When a job's scope changes on-site — an extra " +
      "stop, a long carry, additional packing materials — send a change order over WhatsApp for a phone-bound, " +
      "PIN-protected signature right in the driveway, no laptop required. Save a change-order or bill-of-sale " +
      "template once and reuse it across your whole crew roster; every signature comes with its own delivery and " +
      "read timestamp.",
    features: [
      { title: "Day-of change orders", body: "Turn a scope change into a signed document from a phone, without leaving the job." },
      { title: "WhatsApp delivery with a PIN", body: "Phone-bound, PIN-protected signing — stronger than hoping someone signs an emailed PDF later." },
      { title: "Reusable templates per job type", body: "Save a change order or bill-of-sale template once, reuse it for every crew." },
      { title: "Audit trail", body: "Delivery, read, and signature timestamps, useful if the final charges are disputed." },
    ],
    honestLimit: "There's no installed SmartMoving integration today — Docracy is the signing step you hand off to after the estimate is built in SmartMoving, not a feature embedded inside it.",
    relevantTemplates: ["service-agreement", "personal-property-bill-of-sale"],
    ctaLabel: "Try free — send a sample change order",
    ctaTo: "/prepare?freeTemplate=service-agreement&ref=partner-smartmoving",
    relatedLinks: [{ label: "Docracy for Moving Companies", to: "/for/moving-companies" }],
  },
  {
    slug: "nhsp",
    seoTitle: "Docracy for NHS Professionals — Bank Worker Paperwork Signed Between Shifts",
    seoDescription:
      "Get bank-staff authorization and compliance paperwork signed between shifts, not just during office hours — WhatsApp delivery, no account required for NHSP bank workers.",
    heroHeadline: "A bank shift starts at 6am. The paperwork shouldn't wait for office hours.",
    heroSubheadline: "Authorization forms and compliance sign-offs for NHS Professionals bank workers, signed from a phone between shifts.",
    namedTools: ["NHS Professionals", "NHSP"],
    painPoints: [
      "NHSP bank workers pick up shifts at short notice, often overnight or early morning, well outside the office hours when paperwork usually gets chased down",
      "Compliance sign-offs — mandatory training attestations, right-to-work confirmations, bank-terms updates — need a signature before a shift starts, not after it",
      "A bank worker moving between multiple trusts shouldn't need to create a new account or remember another login just to confirm one form",
    ],
    whyDocracy:
      "Docracy sends a bank worker's authorization or compliance form straight to their phone — over WhatsApp, " +
      "phone-bound and PIN-protected, or by SMS — so it can be signed between shifts, at any hour, without an " +
      "account. Save a bank-worker authorization or onboarding template once and reuse it across your whole " +
      "staff bank; a timestamped audit trail confirms exactly when each form went out and came back signed. This " +
      "is strictly for staffing and administrative paperwork, not clinical or patient-facing documents.",
    features: [
      { title: "Sign between shifts, any hour", body: "A link a bank worker can open and sign at 5am before a shift, not just during office hours." },
      { title: "No account for bank staff", body: "One less login for staff already juggling shifts across multiple trusts." },
      { title: "Reusable compliance templates", body: "Save an authorization or onboarding form once, reuse it for every bank worker." },
      { title: "Audit trail", body: "Timestamped proof of delivery, viewing, and signature for every form." },
    ],
    honestLimit: "Docracy has no native integration with NHS Professionals' staff bank platform, isn't HIPAA/NHS-DSPT certified, and isn't built for clinical or patient records — it's a fit for staffing and administrative paperwork only, sent alongside NHSP, not inside it.",
    relevantTemplates: ["authorization-form", "contractor-onboarding-agreement"],
    ctaLabel: "Try free — send a sample authorization form",
    ctaTo: "/prepare?freeTemplate=authorization-form&ref=partner-nhsp",
    relatedLinks: [{ label: "Docracy for Healthcare & Care Services", to: "/for/healthcare" }],
  },
  {
    slug: "dentco",
    seoTitle: "Docracy for Dentco — Work Orders Signed Off On-Site, Every Property",
    seoDescription:
      "Get work orders and service agreements signed by property managers across every site Dentco services — one reusable template, no portal for the client to log into.",
    heroHeadline: "The repair's done. Get the property manager's sign-off before you're back in the van.",
    heroSubheadline: "Work orders and service agreements for facility maintenance crews working across dozens of different properties and property managers.",
    namedTools: ["Dentco"],
    painPoints: [
      "A maintenance crew like Dentco's works across many different properties, each with its own property manager and its own way of confirming a job's done",
      "Getting sign-off on a completed work order shouldn't mean logging into a different client portal for every building",
      "A new client relationship starts with its own service agreement, but it usually gets retyped instead of reused from a standard template",
    ],
    whyDocracy:
      "Docracy lets a facility maintenance vendor standardize its work-order and service-agreement paperwork once, " +
      "then reuse it across every property and property manager. A technician finishing a job sends the work " +
      "order for signature over WhatsApp or SMS on the way out — phone-bound and PIN-protected, no portal or " +
      "account for the property manager to set up. New client relationships start from the same saved " +
      "service-agreement template every time.",
    features: [
      { title: "One template, every property", body: "Standardize work orders and service agreements across every site you service." },
      { title: "Sign-off from the van", body: "Send a completed work order for signature on the way to the next job." },
      { title: "No client portal", body: "Property managers sign from a link — nothing to log into." },
      { title: "Per-job audit trail", body: "Delivery and signature timestamps for every property, useful if a completed job is ever disputed." },
    ],
    honestLimit: "There's no installed integration with Dentco's own dispatch or work-order system — Docracy is the signing step you hand off to once a job's done, not a feature built into it.",
    relevantTemplates: ["work-order", "service-agreement"],
    ctaLabel: "Try free — send a sample work order",
    ctaTo: "/prepare?freeTemplate=work-order&ref=partner-dentco",
    relatedLinks: [{ label: "Docracy for Facility & Property Management", to: "/for/facility-management" }],
  },
  {
    slug: "hungrypanda",
    seoTitle: "Docracy for Hungrypanda — Onboard Riders & Restaurant Partners by Phone",
    seoDescription:
      "Get rider agreements and restaurant partnership terms signed before a first delivery or menu goes live — signed from a phone, no account required, any market.",
    heroHeadline: "Before a rider's first delivery or a restaurant's first order, get the agreement signed.",
    heroSubheadline: "Onboarding paperwork for delivery riders and restaurant partners, signed on a phone in whatever market you're launching in.",
    namedTools: ["Hungrypanda"],
    painPoints: [
      "New riders sign up to start delivering the same day, often from a phone with no printer or scanner nearby",
      "Restaurant partners need a signed partnership agreement before their menu goes live, and every new market adds its own paperwork variant",
      "A platform operating across multiple countries can't force every rider or restaurant into a full account signup just to accept terms",
    ],
    whyDocracy:
      "Docracy lets a rider or restaurant partner sign onboarding paperwork straight from a link — no account, no " +
      "download — over WhatsApp, phone-bound and PIN-protected, or by email. Save a courier-agreement or " +
      "restaurant-partnership template once per market and reuse it for every new sign-up; a full audit trail " +
      "confirms exactly when each rider or restaurant accepted their terms, which matters when onboarding moves " +
      "this fast.",
    features: [
      { title: "No account for riders or restaurants", body: "Sign from a link on a phone — nothing to install or register for." },
      { title: "WhatsApp-native delivery", body: "Reach riders and restaurant owners on the channel they already use to communicate." },
      { title: "Reusable templates per market", body: "Save a courier or partnership agreement once, adapt it per market, reuse it for every sign-up." },
      { title: "Audit trail", body: "Timestamped proof of exactly when a rider or restaurant accepted their terms." },
    ],
    honestLimit: "Docracy has no native app or installed integration inside Hungrypanda's rider or restaurant platform — it's the signing step you hand off to during onboarding, not a feature embedded in the app.",
    relevantTemplates: ["contractor-onboarding-agreement", "vendor-agreement", "authorization-form"],
    ctaLabel: "Try free — send a sample rider agreement",
    ctaTo: "/prepare?freeTemplate=contractor-onboarding-agreement&ref=partner-hungrypanda",
    relatedLinks: [{ label: "Docracy for Delivery & Logistics Platforms", to: "/for/delivery-logistics" }],
  },
  {
    slug: "barracuda",
    seoTitle: "Docracy for Barracuda Networks Admins — Sign Off Your Security Rollout",
    seoDescription:
      "Just deployed Barracuda Email Protection, Backup, or Security Awareness Training? Get every employee's acknowledgment signed and tracked, with a real audit trail.",
    heroHeadline: "You rolled out Barracuda. Now get everyone to sign off on it.",
    heroSubheadline: "A parallel-signing step for the acceptable-use policy or security-awareness acknowledgment that comes with a new security tool rollout.",
    namedTools: ["Barracuda Networks"],
    painPoints: [
      "A new Barracuda deployment — email gateway, backup, or security awareness training — usually comes with a policy update that compliance wants everyone to formally acknowledge",
      "Barracuda's own console tells you about mail flow and threats, not who has actually signed off on the policy behind the rollout",
      "Chasing the last few holdouts after an org-wide rollout by email thread and spreadsheet wastes days IT doesn't have",
    ],
    whyDocracy:
      "Docracy runs as the attestation step right after a Barracuda rollout: send the updated acceptable-use policy or " +
      "security-awareness acknowledgment to the whole org at once with parallel signing, and watch who's signed and who " +
      "hasn't in real time instead of guessing from an inbox. For staff who aren't glued to email — warehouse, field, or " +
      "shop-floor teams affected by a new backup or access policy — send the same acknowledgment over WhatsApp instead.",
    features: [
      { title: "Security acknowledgment templates", body: "Acceptable-use and code-of-conduct templates ready to send the moment a rollout finishes." },
      { title: "Org-wide parallel signing", body: "Send the same acknowledgment to an entire team or department at once." },
      { title: "Live signed/unsigned tracking", body: "See exactly who's acknowledged the new policy without chasing an email thread." },
      { title: "WhatsApp delivery for non-desk staff", body: "Reach employees who don't check email as part of their job." },
    ],
    honestLimit: "Docracy has no native Barracuda integration or console plugin — this is a standalone signing step you link to from your rollout communication, not something embedded in Barracuda itself.",
    relevantTemplates: ["acceptable-use-policy-acknowledgment", "code-of-conduct-acknowledgment"],
    ctaLabel: "Try free — send a sample policy acknowledgment",
    ctaTo: "/prepare?freeTemplate=acceptable-use-policy-acknowledgment&ref=partner-barracuda",
    relatedLinks: [{ label: "Docracy for Enterprise IT & Security Teams", to: "/for/enterprise-it" }],
  },
  {
    slug: "germany",
    seoTitle: "Docracy for German Businesses & Freiberufler — Sign Contracts Fast",
    seoDescription:
      "NDAs, freelance agreements, and consulting contracts signed the same day — built for German Freiberufler and GmbHs, without routing through enterprise procurement.",
    heroHeadline: "Most contracts in Germany don't need a wet signature. Yours doesn't either.",
    heroSubheadline: "A fast signing step for the NDAs, freelance agreements, and consulting contracts German businesses handle every week.",
    namedTools: [],
    painPoints: [
      "Freiberufler and small GmbHs need NDAs, freelance agreements, and service contracts signed quickly — not routed through an enterprise procurement process built for teams ten times their size",
      "Most everyday business contracts under German law need no particular form, or just Textform, but habit still means printing, signing by hand, and scanning \"to be safe\"",
      "International clients expect a signing link, not a scanned PDF mailed back and forth across time zones",
    ],
    whyDocracy:
      "For the contracts that make up most day-to-day business in Germany — NDAs, freelance agreements, consulting " +
      "contracts, service agreements — no particular form or just Textform is legally sufficient, and Docracy's " +
      "standard signing flow covers that. Save your standard contract once as a reusable template, send it by email " +
      "or WhatsApp, and the other side signs without creating an account. When a document calls for stronger " +
      "assurance, the WhatsApp-verified track binds the signing link to a phone number and requires a PIN.",
    features: [
      { title: "Templates for common contracts", body: "NDAs, freelance agreements, and consulting contracts ready to reuse." },
      { title: "No account for the other side", body: "Clients and contractors sign from a link — nothing to register for." },
      { title: "WhatsApp-verified track when it matters", body: "Phone-bound delivery and a required PIN for documents that need stronger assurance." },
      { title: "Full audit trail", body: "Delivery, read, and signature timestamps kept with the signed document." },
    ],
    honestLimit:
      "A handful of German contracts require strict written form (Schriftform, § 126 BGB), which under § 126a BGB can only be satisfied by a " +
      "Qualified Electronic Signature (QES) — examples include employment terminations, guarantees given by private individuals, residential " +
      "leases over a year, and consumer credit agreements. Docracy is not a Qualified Trust Service Provider and doesn't issue QES, so those " +
      "need a certified QTSP or a wet-ink signature. Real estate transfers require notarization regardless of signature method.",
    relevantTemplates: ["mutual-nda", "freelance-service-agreement", "consulting-agreement"],
    ctaLabel: "Try free — send a sample freelance agreement",
    ctaTo: "/prepare?freeTemplate=freelance-service-agreement&ref=partner-germany",
    relatedLinks: [{ label: "Docracy for the German & EU Market", to: "/for/germany-eu" }],
  },
  {
    slug: "digital-unterschreiben",
    seoTitle: "Digital Unterschreiben — How to Actually Sign a Document Online",
    seoDescription:
      "Skip the jargon: upload a PDF, send a link, and get it signed digitally today — no account needed for the other side, with an audit trail as proof.",
    heroHeadline: "Digital unterschreiben, without the detour through legal jargon first.",
    heroSubheadline: "Upload the document, send a link, and it's signed — the straightforward path to a digital signature in Germany.",
    namedTools: [],
    painPoints: [
      "Searching \"digital unterschreiben\" turns up a maze of SES, AES, and QES terminology before you've actually signed anything",
      "Most people signing an NDA, freelance contract, or service agreement just need it done today, not a compliance deep-dive",
      "The other party shouldn't have to create an account or install anything just to sign something back",
    ],
    whyDocracy:
      "Docracy keeps the actual task simple: upload a PDF as-is, place the signature field, and send it by email or " +
      "WhatsApp. The other side opens the link, reviews, and signs — no account required on either end. Every " +
      "document gets a delivery/read/signature audit trail as proof it was actually seen and signed, and for cases " +
      "that call for stronger assurance, a WhatsApp-verified track binds the signature to a specific phone number " +
      "with a required PIN.",
    features: [
      { title: "Upload and send in minutes", body: "No template design work required — use your own PDF as-is." },
      { title: "No account for the signer", body: "The other side opens a link, reviews, and signs — nothing to register for." },
      { title: "WhatsApp-verified track", body: "Phone-bound delivery and a required PIN when a document needs stronger assurance." },
      { title: "Audit trail as proof", body: "Delivery, read, and signature timestamps kept alongside the signed document." },
    ],
    honestLimit:
      "The standard signature is a Simple Electronic Signature with no identity verification — fine for most everyday agreements, but Docracy " +
      "is not a Qualified Trust Service Provider and doesn't issue a Qualified Electronic Signature (QES), which some specific German contracts " +
      "legally require instead.",
    relevantTemplates: ["mutual-nda", "service-agreement", "freelance-service-agreement"],
    ctaLabel: "Try free — send a sample NDA",
    ctaTo: "/prepare?freeTemplate=mutual-nda&ref=partner-digital-unterschreiben",
    relatedLinks: [
      { label: "Docracy for the German & EU Market", to: "/for/germany-eu" },
      { label: "Docracy for German Businesses & Freiberufler", to: "/for/germany" },
    ],
  },
];
