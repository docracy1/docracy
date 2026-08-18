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
];
