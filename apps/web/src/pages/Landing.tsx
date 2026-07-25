import { useEffect } from "react";
import { Link } from "react-router-dom";
import PricingCalculator from "../components/PricingCalculator";

/** Abstract illustration of the product (a document, either freshly signed or having its fields
 *  auto-detected) — deliberately not a literal app screenshot, which would need re-cropping every
 *  time the UI changes, and deliberately not a fabricated review score or client logo. */
function DocumentMockup({ variant }: { variant: "signed" | "detect" }) {
  return (
    <svg viewBox="0 0 380 285" width="100%" height="100%">
      <rect x="0.5" y="0.5" width="379" height="284" rx="16" fill="var(--canvas)" stroke="var(--hairline)" />
      <rect x="32" y="30" width="150" height="14" rx="4" fill="var(--body-strong)" opacity="0.65" />
      <rect x="32" y="60" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="78" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="96" width="230" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="124" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="142" width="316" height="8" rx="4" fill="var(--hairline)" />
      <rect x="32" y="160" width="170" height="8" rx="4" fill="var(--hairline)" />
      {variant === "detect" ? (
        <>
          <rect x="32" y="200" width="130" height="36" rx="6" fill="var(--primary-soft)" stroke="var(--primary)" strokeDasharray="5 4" strokeWidth="2" />
          <text x="97" y="222" textAnchor="middle" fontSize="11" fill="var(--primary)" fontFamily="inherit" fontWeight="700">
            Signature
          </text>
          <rect x="178" y="200" width="90" height="36" rx="6" fill="var(--primary-soft)" stroke="var(--primary)" strokeDasharray="5 4" strokeWidth="2" />
          <text x="223" y="222" textAnchor="middle" fontSize="11" fill="var(--primary)" fontFamily="inherit" fontWeight="700">
            Date
          </text>
          <circle cx="335" cy="40" r="18" fill="var(--primary-soft-strong)" />
          <path
            d="M335 30l2.6 7.8L345 40l-7.4 2.2L335 50l-2.6-7.8L325 40l7.4-2.2L335 30Z"
            fill="var(--primary)"
          />
        </>
      ) : (
        <>
          <path
            d="M38 226c18-26 36 9 55-8 19-17 28-22 50-13s38 22 58 4 42-26 65-4"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle cx="332" cy="218" r="18" fill="#e3f3e9" />
          <path d="M324 218l5.5 5.5 11-11" fill="none" stroke="var(--success)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
    </svg>
  );
}

/** Minimalist monochrome line icons (hand-drawn, Heroicons-outline style) for the feature-card
 *  grid below — kept inline rather than pulling in an icon library for five one-off glyphs. */
function FeatureIcon({ name }: { name: "bolt" | "workflow" | "shield" | "users" | "duplicate" }) {
  const common = {
    width: 24,
    height: 24,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "bolt":
      return (
        <svg {...common}>
          <path d="M12.5 2.5L4 14h6l-1 7.5L20 10h-6l-1.5-7.5z" />
        </svg>
      );
    case "workflow":
      return (
        <svg {...common}>
          <circle cx="5" cy="6" r="2.25" />
          <circle cx="12" cy="12" r="2.25" />
          <circle cx="19" cy="18" r="2.25" />
          <path d="M6.8 7.6L10.2 10.4M13.8 13.6L17.2 16.4" />
        </svg>
      );
    case "shield":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5.5c0 5-3.5 8-7 9.5-3.5-1.5-7-4.5-7-9.5V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "users":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
          <circle cx="17" cy="9" r="2.25" />
          <path d="M15.5 14.2c2.3.4 4 2.4 4 5.3" />
        </svg>
      );
    case "duplicate":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="13" rx="1.5" />
          <path d="M4 15V4.5A1.5 1.5 0 0 1 5.5 3H15" />
        </svg>
      );
  }
}

const CORE_FEATURES: Array<{
  icon: "bolt" | "workflow" | "shield" | "users" | "duplicate";
  title: string;
  body: string;
  to: string;
  linkLabel: string;
}> = [
  {
    icon: "bolt",
    title: "Fast e-signatures",
    body: "Sign documents in seconds with a clean, distraction-free interface. No complexity, no setup overhead — just reliable, fast signing for you and your clients.",
    to: "/prepare",
    linkLabel: "Start a signing chain",
  },
  {
    icon: "workflow",
    title: "Simple workflow setup",
    body: "Create document workflows in minutes. Add steps, assign recipients, and automate basic flows without technical knowledge. Ideal for small teams and growing businesses.",
    to: "/docs",
    linkLabel: "Read the docs",
  },
  {
    icon: "shield",
    title: "Secure document storage",
    body: "Store all documents in a compliant, encrypted environment. Every file is versioned, traceable, and protected — giving you full control and audit-ready transparency.",
    to: "/privacy",
    linkLabel: "Read our privacy policy",
  },
  {
    icon: "users",
    title: "Team collaboration",
    body: "Invite team members, share templates, and manage signing processes together. Keep everything organized and accessible in one place.",
    to: "/pricing",
    linkLabel: "See team plans",
  },
  {
    icon: "duplicate",
    title: "Templates for recurring documents",
    body: "Save time with reusable templates for NDAs, contracts, agreements, onboarding documents, and more. Create once, reuse forever.",
    to: "/free-templates",
    linkLabel: "Browse free templates",
  },
];

const FAQ_ITEMS: Array<{ question: string; answer: string }> = [
  {
    question: "What is Docracy.io?",
    answer: "A simple, secure e-signature platform for small teams and growing businesses.",
  },
  {
    question: "How do e-signatures work?",
    answer: "Upload a document, assign recipients, and collect signatures in minutes.",
  },
  {
    question: "Is Docracy.io secure?",
    answer: "All documents are encrypted, versioned, and stored in a compliant environment.",
  },
  {
    question: "Can I use templates?",
    answer:
      "Yes, on a paid account — create templates for recurring documents like NDAs, contracts, and onboarding forms.",
  },
  {
    question: "Does Docracy.io support teams?",
    answer: "Yes, on a paid account — invite team members, share templates, and collaborate on workflows.",
  },
];

const TESTIMONIALS: Array<{ quote: string; name: string; title: string; company: string | null; logo: string | null }> = [
  {
    quote:
      "Docracy is a great product that I have tested and am using. It is easy to use, has good tools, is always up to date, and implements new features. Highly recommended.",
    name: "Markus Huber",
    title: "Managing Director",
    company: "viennacontemporary",
    logo: "/vienna-contemporary-logo.png",
  },
  {
    quote:
      "Docracy is a beautifully simple, privacy-first tool for signing documents without friction. Its no-signup flow and automatic document deletion make it especially valuable for artists, curators, and cultural professionals who need trust, speed, and discretion.",
    name: "Abaseh Mirvali",
    title: "Artist director, entrepreneur",
    company: null,
    logo: null,
  },
  {
    quote:
      "Docracy is a smart, frictionless e-signature tool: no signup, no clutter, just secure sequential signing with privacy built in. For culture and tech teams moving fast, it makes agreements simple, professional, and discreet.",
    name: "Marc Brandsma",
    title: "CEO of culttech, Investor",
    company: null,
    logo: "/culttech-logo.png",
  },
];

const AUDIENCES = [
  {
    title: "Freelancers & solo businesses",
    body: "Send a contract, offer letter, or NDA today — no software subscription for something you'll use twice a month.",
  },
  {
    title: "Small teams",
    body: "Add teammates, save reusable templates, and let AI place fields and draft agreements for you — on the paid plan.",
  },
  {
    title: "One-off agreements",
    body: "Splitting rent, selling something, settling a favor in writing — free, no account, gone once it's signed.",
  },
];

const AI_FEATURES = [
  { title: "Auto-detect fields", body: "Upload a PDF and it places signature, date, and initial fields for you." },
  { title: "Plain-English explainer", body: "A 3-bullet summary of what each party is agreeing to, no legal jargon." },
  { title: "Risk & clause highlighter", body: "Flags one-sided terms — long non-competes, vague payment terms, more." },
  { title: "Generate with AI", body: "Describe an agreement in a sentence, get a ready-to-sign PDF back." },
];

export default function Landing() {
  // A plain `<a href="#faq">` would work for an in-page click, but the footer's FAQ link is a
  // react-router <Link> from other routes — client-side navigation to "/#faq" doesn't trigger the
  // browser's native same-document hash scroll, so this does it manually once Landing has mounted.
  useEffect(() => {
    if (window.location.hash === "#faq") {
      document.getElementById("faq")?.scrollIntoView();
    }
  }, []);

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner hero-split">
          <div>
            <div className="hero-eyebrow">Free · No signup · Sequential e-signatures</div>
            <h1>Simple, secure e-signatures for your business</h1>
            <p>
              Create, send, and sign documents in minutes — with a clean workflow and reliable compliance.
            </p>
            <ul className="hero-benefit-list">
              <li>Fast and frictionless document signing</li>
              <li>Simple workflow setup for teams</li>
              <li>Secure and compliant document storage</li>
            </ul>
          </div>
          <div className="doc-mockup-glow">
            <div className="doc-mockup-card">
              <DocumentMockup variant="signed" />
            </div>
          </div>
        </div>
      </div>

      <div className="core-features-band">
        <div className="core-features-inner">
          <h2 style={{ fontSize: 26, marginBottom: 8, textAlign: "center" }}>
            Everything you need for simple, secure document workflows
          </h2>
          <p style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            Docracy.io focuses on clarity, speed, and reliability — without unnecessary complexity.
          </p>
          <div className="core-features-grid">
            {CORE_FEATURES.map((f) => (
              <div key={f.title} className="core-feature-card">
                <div className="core-feature-icon">
                  <FeatureIcon name={f.icon} />
                </div>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <Link to={f.to} style={{ fontSize: 13, fontWeight: 600 }}>
                  {f.linkLabel} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="spotlight-band">
        <div className="spotlight-inner">
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>AI tools, and an MCP connector for your AI assistant</h2>
          <p style={{ marginTop: 0, marginBottom: 0, maxWidth: 640 }}>
            Beyond the free chain-signing flow above, a paid account adds AI that does the busywork and a
            connector so Claude, ChatGPT, Grok, or Perplexity can create and send documents for you directly
            from a chat.
          </p>

          <div className="spotlight-split">
            <div className="accent-list">
              {AI_FEATURES.map((f) => (
                <div key={f.title} className="accent-item">
                  <h3 style={{ fontSize: 15, marginBottom: 3 }}>{f.title}</h3>
                  <p style={{ margin: 0, fontSize: 13.5 }}>{f.body}</p>
                </div>
              ))}
              <div className="accent-item is-mcp">
                <h3 style={{ fontSize: 15, marginBottom: 3 }}>MCP connector</h3>
                <p style={{ margin: 0, fontSize: 13.5 }}>
                  Claude, ChatGPT, Grok, and Perplexity can create, send, and check the status of your
                  documents on your behalf — just ask.
                </p>
              </div>
            </div>
            <div className="doc-mockup-glow">
              <div className="doc-mockup-card">
                <DocumentMockup variant="detect" />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Link to="/login" className="btn-primary btn-lg" style={{ display: "inline-block", textDecoration: "none" }}>
              Sign in to try the paid plan
            </Link>
          </div>
        </div>
      </div>

      <div className="audience-band">
        <div className="audience-inner">
          <h2 style={{ fontSize: 22, marginBottom: 0 }}>Built for quick, low-stakes agreements</h2>
          <div className="accent-grid">
            {AUDIENCES.map((a) => (
              <div key={a.title} className="accent-item">
                <h3 style={{ fontSize: 15, marginBottom: 3 }}>{a.title}</h3>
                <p style={{ margin: 0, fontSize: 13.5 }}>{a.body}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 960, padding: "48px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.map((t) => (
            <div key={t.name} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 15, fontStyle: "italic", color: "var(--body-strong)", margin: 0, flex: 1, lineHeight: 1.5 }}>
                "{t.quote}"
              </p>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{t.name}</p>
                <p style={{ margin: 0, fontSize: 12.5, color: "var(--mute)" }}>
                  {t.title}
                  {t.company ? `, ${t.company}` : ""}
                </p>
              </div>
              {t.logo && (
                <img
                  src={t.logo}
                  alt={t.company ?? t.name}
                  loading="lazy"
                  style={{ height: 36, width: "auto", alignSelf: "flex-start", objectFit: "contain", borderRadius: "var(--r-sm)" }}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="container" id="faq" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, textAlign: "center" }}>Frequently asked questions</h2>
        {FAQ_ITEMS.map((item) => (
          <details key={item.question} className="faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        // Rendered inline (not just in index.html's static schemas) so it appears in the
        // prerendered homepage markup right alongside the questions it describes — search engines
        // match FAQPage rich-result eligibility against visible on-page text, not just the schema.
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_ITEMS.map((item) => ({
              "@type": "Question",
              name: item.question,
              acceptedAnswer: { "@type": "Answer", text: item.answer },
            })),
          }),
        }}
      />

      <div className="cta-band">
        <h2 style={{ fontSize: 22, marginBottom: 8 }}>Ready to send your first document?</h2>
        <p style={{ marginTop: 0, marginBottom: 20 }}>Free to start — no account needed to send or sign.</p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
          <Link to="/prepare" className="btn-primary btn-lg" style={{ display: "inline-block", textDecoration: "none" }}>
            Start a signing chain
          </Link>
          <Link to="/free-templates" className="btn-secondary btn-lg" style={{ display: "inline-block", textDecoration: "none" }}>
            Browse free templates
          </Link>
        </div>
      </div>

      <div className="container">
        <div style={{ marginTop: 40 }}>
          <PricingCalculator />
        </div>

        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 32 }}>
          Docracy doesn't verify identity — anyone with the link can sign as the name on it. The audit trail
          proves what was signed and when, not who actually signed it. For contracts that need
          identity-verified signatures, use a compliance-grade e-signature service instead.
        </p>
      </div>
    </div>
  );
}
