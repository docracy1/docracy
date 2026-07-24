import { getCompetitor } from "./competitors";

export interface BlogPost {
  slug: string;
  title: string;
  /** Meta description + index-page teaser. */
  description: string;
  /** ISO date the post was published — shown on the post and used for sitemap lastmod. */
  publishedDate: string;
  /** Key into COMPETITORS (lib/competitors.ts) — lets the post pull the same sourced pricing
   *  numbers the Landing page calculator uses, so the two can't drift out of sync. */
  competitorKey: string;
  intro: string[];
  sections: Array<{ heading: string; body: string[] }>;
  verdict: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "docracy-vs-eversign",
    title: "Docracy vs eversign (Xodo Sign): which e-signature tool fits you?",
    description:
      "A straight comparison of Docracy and eversign (now Xodo Sign) on price, signup friction, and features — for quick agreements vs. small-business document workflows.",
    publishedDate: "2026-07-24",
    competitorKey: "eversign",
    intro: [
      "eversign — rebranded Xodo Sign — is a solid, affordably-priced e-signature tool built for small " +
        "businesses that sign a steady stream of documents. Docracy is built for something narrower: " +
        "getting a document signed right now, by people who don't want to create an account to do it.",
    ],
    sections: [
      {
        heading: "Signup and pricing",
        body: [
          "eversign requires an account for every plan, including its free tier (3 documents/month). " +
            "Its Professional plan runs $16/user/month billed annually — a per-seat price that grows with " +
            "your team.",
          "Docracy's free tier needs no account at all — paste in emails, place fields, send. A paid " +
            "workspace is a flat $7/month regardless of team size, since Docracy doesn't charge per seat.",
        ],
      },
      {
        heading: "Where eversign is ahead",
        body: [
          "eversign has a mature API/webhook plan, in-person signing, bulk sending, and custom branding " +
            "baked into its lower tiers — useful if you're running a real document pipeline, not just " +
            "occasional signing.",
        ],
      },
      {
        heading: "Where Docracy is ahead",
        body: [
          "No account required for the free chain-signing flow, unlimited team members on one flat paid " +
            "price, an MCP connector so Claude/ChatGPT/Grok/Perplexity can create and send documents " +
            "directly, and documents that disappear once everyone's signed rather than sitting in a " +
            "permanent archive.",
        ],
      },
    ],
    verdict:
      "If you're running recurring business document workflows and want a mature per-seat platform, " +
      "eversign is a reasonable pick. If you mostly need quick agreements signed without asking anyone to " +
      "make an account, Docracy is built for exactly that case.",
  },
  {
    slug: "docracy-vs-docusign",
    title: "Docracy vs DocuSign: for quick agreements, not enterprise contracts",
    description:
      "How Docracy compares to DocuSign eSignature on price, identity verification, and who each tool is actually built for.",
    publishedDate: "2026-07-24",
    competitorKey: "docusign",
    intro: [
      "DocuSign is the category's enterprise incumbent — built for identity-verified, compliance-grade " +
        "signing at scale. Docracy isn't trying to be that; it's built for the much more common case of a " +
        "quick, low-stakes agreement between two people who just want it signed.",
    ],
    sections: [
      {
        heading: "Pricing",
        body: [
          "DocuSign's Business Pro plan lists at $40/user/month billed annually, with a 5-seat minimum on " +
            "commercial plans — so a small team of 2 still pays for 5 seats.",
          "Docracy's paid plan is a flat $7/month per workspace, with unlimited team members and unlimited " +
            "signers — no seat minimum, no per-user math.",
        ],
      },
      {
        heading: "Where DocuSign is ahead",
        body: [
          "DocuSign supports identity-verified and qualified electronic signatures, deep enterprise " +
            "integrations (Salesforce, SAP, and dozens more), envelope-based bulk workflows, and compliance " +
            "certifications many regulated industries specifically require.",
        ],
      },
      {
        heading: "Where Docracy is ahead",
        body: [
          "Zero signup friction on the free tier, flat pricing that doesn't scale with headcount, an AI " +
            "toolset (contract explainer, risk highlighter, auto-detected fields, prompt-to-agreement) " +
            "built into the paid plan, and an MCP connector for AI assistants — none of which DocuSign " +
            "offers today.",
        ],
      },
    ],
    verdict:
      "Docracy doesn't verify identity — anyone with the link can sign as the name on it, and the audit " +
      "trail proves what was signed and when, not who actually signed it. If you need identity-verified or " +
      "qualified signatures for regulated contracts, DocuSign is the right tool. For freelance gigs, " +
      "roommate agreements, and informal contracts, that's overhead you don't need.",
  },
  {
    slug: "docracy-vs-pandadoc",
    title: "Docracy vs PandaDoc: e-signature vs. sales document platform",
    description:
      "PandaDoc is a proposal-and-CRM-centric document platform; Docracy is a lightweight, no-signup e-signature tool. Here's how the pricing and features actually compare.",
    publishedDate: "2026-07-24",
    competitorKey: "pandadoc",
    intro: [
      "PandaDoc is really a sales-document platform with e-signature built in — proposals, quotes, CRM " +
        "integrations, payment collection. Docracy doesn't try to compete there; it's a focused tool for " +
        "getting a document signed with as little friction as possible.",
    ],
    sections: [
      {
        heading: "Pricing",
        body: [
          "PandaDoc's Business plan is $49/user/month billed annually — priced per seat, aimed at sales " +
            "teams generating proposals at volume.",
          "Docracy is a flat $7/month per workspace, unlimited team members and signers included — a much " +
            "smaller bill for a team that just needs documents signed, not a sales-proposal engine.",
        ],
      },
      {
        heading: "Where PandaDoc is ahead",
        body: [
          "CRM integrations, a content library for reusable sales collateral, approval workflows, and " +
            "built-in payment collection — genuinely useful if e-signature is one piece of a bigger sales " +
            "motion.",
        ],
      },
      {
        heading: "Where Docracy is ahead",
        body: [
          "No account needed for the free tier, flat per-workspace pricing instead of per-seat, and an MCP " +
            "connector plus AI tools focused specifically on contract review and drafting rather than sales " +
            "proposals.",
        ],
      },
    ],
    verdict:
      "If e-signature is one part of a larger sales-proposal workflow, PandaDoc's CRM and content-library " +
      "features earn its per-seat price. If you just need agreements signed without the sales-platform " +
      "overhead, Docracy does that job for a flat $7/month.",
  },
  {
    slug: "docracy-vs-adobe-acrobat-sign",
    title: "Docracy vs Adobe Acrobat Sign: lightweight signing vs. full PDF suite",
    description:
      "Adobe Acrobat Sign bundles e-signature into Adobe's full PDF/creative ecosystem. Here's how it compares to Docracy's free, no-signup signing flow.",
    publishedDate: "2026-07-24",
    competitorKey: "adobesign",
    intro: [
      "Adobe Acrobat Sign is e-signature bundled into Adobe's broader Acrobat/PDF ecosystem — a natural " +
        "fit if your team already lives in Adobe tools. Docracy is a standalone, no-signup signing tool " +
        "with no PDF-editing suite attached.",
    ],
    sections: [
      {
        heading: "Pricing",
        body: [
          "Acrobat Pro for Teams runs $23.99/user/month, tied to an annual commitment and a 150-transaction " +
            "per-user yearly cap.",
          "Docracy's paid plan is a flat $7/month per workspace with unlimited signers and no annual " +
            "lock-in — cancel anytime.",
        ],
      },
      {
        heading: "Where Adobe is ahead",
        body: [
          "Full PDF editing and creation tools, deep integration with the rest of Adobe's suite, identity " +
            "verification options, and broad enterprise-procurement familiarity.",
        ],
      },
      {
        heading: "Where Docracy is ahead",
        body: [
          "No signup for the free tier, flat workspace pricing with no annual commitment or transaction cap, " +
            "and an AI toolset plus MCP connector aimed specifically at contract signing rather than general " +
            "PDF work.",
        ],
      },
    ],
    verdict:
      "If your team already pays for Adobe's PDF/creative tools, Acrobat Sign is a reasonable bundle. If " +
      "you just need documents signed without an annual commitment or a full PDF suite, Docracy is the " +
      "lighter, cheaper option.",
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

export { getCompetitor };
