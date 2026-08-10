import { useEffect, useRef, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import PricingCalculator from "../components/PricingCalculator";
import FirstDocumentPrompt from "../components/FirstDocumentPrompt";
import HowItWorksModal from "../components/HowItWorksModal";
import IntegrationsBand from "../components/IntegrationsBand";
import ProductFlowDemo from "../components/ProductFlowDemo";
import TurnstileWidget, { turnstileRequired } from "../components/TurnstileWidget";
import DetectMockup from "../components/DetectMockup";
import { requestMagicLink } from "../lib/api";
import { track } from "../lib/track";
import { FREE_TEMPLATES } from "../lib/freeTemplates";
import { HOW_IT_WORKS_VIDEO } from "../lib/howItWorksVideo";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Minimalist monochrome line icons (hand-drawn, Heroicons-outline style) for the feature-card
 *  grid below — kept inline rather than pulling in an icon library for five one-off glyphs. */
function FeatureIcon({
  name,
}: {
  name: "bolt" | "workflow" | "shield" | "users" | "duplicate" | "send" | "pen" | "sparkles" | "single";
}) {
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
    case "send":
      return (
        <svg {...common}>
          <path d="M3 11l18-8-8 18-2-8-8-2z" />
        </svg>
      );
    case "pen":
      return (
        <svg {...common}>
          <path d="M15 4l5 5-9.5 9.5H6v-4.5L15 4z" />
          <path d="M4 20c2-1.2 4-1.2 6 0" />
        </svg>
      );
    case "sparkles":
      return (
        <svg {...common}>
          <path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3z" />
          <path d="M19 15l0.7 2.3L22 18l-2.3 0.7L19 21l-0.7-2.3L16 18l2.3-0.7L19 15z" />
        </svg>
      );
    case "single":
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="1.5" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
  }
}

const CORE_FEATURES: Array<{
  icon: "bolt" | "workflow" | "shield" | "users" | "duplicate" | "send" | "pen" | "sparkles" | "single";
  titleKey: string;
  bodyKey: string;
  to: string;
  linkKey: string;
}> = [
  { icon: "send", titleKey: "landing.feat1.title", bodyKey: "landing.feat1.body", to: "/prepare", linkKey: "landing.feat1.link" },
  { icon: "pen", titleKey: "landing.feat2.title", bodyKey: "landing.feat2.body", to: "/docs", linkKey: "landing.feat2.link" },
  { icon: "sparkles", titleKey: "landing.feat3.title", bodyKey: "landing.feat3.body", to: "/ai", linkKey: "landing.feat3.link" },
  { icon: "duplicate", titleKey: "landing.feat4.title", bodyKey: "landing.feat4.body", to: "/free-templates", linkKey: "landing.feat4.link" },
  { icon: "users", titleKey: "landing.feat5.title", bodyKey: "landing.feat5.body", to: "/pricing", linkKey: "landing.feat5.link" },
  { icon: "single", titleKey: "landing.feat6.title", bodyKey: "landing.feat6.body", to: "/prepare", linkKey: "landing.feat6.link" },
  { icon: "shield", titleKey: "landing.feat7.title", bodyKey: "landing.feat7.body", to: "/privacy", linkKey: "landing.feat7.link" },
  { icon: "bolt", titleKey: "landing.feat8.title", bodyKey: "landing.feat8.body", to: "/docs", linkKey: "landing.feat8.link" },
];

const FAQ_KEYS: Array<{ qKey: string; aKey: string }> = [
  { qKey: "landing.faq1.q", aKey: "landing.faq1.a" },
  { qKey: "landing.faq2.q", aKey: "landing.faq2.a" },
  { qKey: "landing.faq3.q", aKey: "landing.faq3.a" },
  { qKey: "landing.faq4.q", aKey: "landing.faq4.a" },
  { qKey: "landing.faq5.q", aKey: "landing.faq5.a" },
];

// Subset of TESTIMONIALS with a real, recognizable company identity — shown as a compact logo
// strip right below the hero so trust signal is visible without scrolling. Personal names
// (Abaseh Mirvali) and ambiguous abbreviations ("AE") are left out of this strip since a bare
// name or two letters reads as noise in a logo row — they still appear in the full testimonials
// section below with their real quotes and context.
const TRUST_LOGOS: Array<{ name: string; logo: string | null; href: string }> = [
  { name: "DACH Advisory", logo: "/testimonials/dach-advisory.png", href: "https://dachadvisory.com" },
  { name: "culttech", logo: "/culttech-logo.png", href: "https://culttech.at" },
  { name: "hellocash", logo: "/testimonials/hellocash.png", href: "https://hellocash.at" },
  { name: "Volpini Verpackung GmbH", logo: null, href: "https://volpini.at" },
  { name: "AE Entsorgungssysteme", logo: "/testimonials/ae-entsorgungssysteme.png", href: "https://www.ae-entsorgung.eu" },
  { name: "Kapsch", logo: "/testimonials/kapsch.png", href: "https://www.kapsch.net" },
  { name: "AKG Smart Polymer", logo: "/testimonials/akg.png", href: "https://akg.at" },
];

const TESTIMONIALS: Array<{ quoteKey: string; name: string; titleKey: string; company: string | null; logo: string | null }> = [
  {
    quoteKey: "testimonial.1.quote",
    name: "DACH Advisory",
    titleKey: "testimonial.1.title",
    company: null,
    logo: "/testimonials/dach-advisory.png",
  },
  {
    quoteKey: "testimonial.2.quote",
    name: "Abaseh Mirvali",
    titleKey: "testimonial.2.title",
    company: null,
    logo: null,
  },
  {
    quoteKey: "testimonial.3.quote",
    name: "Marc Brandsma",
    titleKey: "testimonial.3.title",
    company: null,
    logo: "/culttech-logo.png",
  },
  {
    quoteKey: "testimonial.4.quote",
    name: "Laurenz Gröbner",
    titleKey: "testimonial.4.title",
    company: null,
    logo: "/testimonials/hellocash.png",
  },
  {
    quoteKey: "testimonial.5.quote",
    name: "Dietmar Grünstäudl",
    titleKey: "testimonial.5.title",
    company: null,
    logo: "/testimonials/ae-entsorgungssysteme.png",
  },
  {
    quoteKey: "testimonial.6.quote",
    name: "Otto Schweinzer",
    titleKey: "testimonial.6.title",
    company: null,
    logo: null,
  },
  {
    quoteKey: "testimonial.7.quote",
    name: "Johannes Sornig",
    titleKey: "testimonial.7.title",
    company: null,
    logo: "/testimonials/kapsch.png",
  },
  {
    quoteKey: "testimonial.8.quote",
    name: "Joachim Zimmel",
    titleKey: "testimonial.8.title",
    company: null,
    logo: "/testimonials/akg.png",
  },
];

const USE_CASE_KEYS: Array<{ titleKey: string; bodyKey: string; to: string }> = [
  { titleKey: "landing.uc1.title", bodyKey: "landing.uc1.body", to: "/client-contracts" },
  { titleKey: "landing.uc2.title", bodyKey: "landing.uc2.body", to: "/onboarding-documents" },
  { titleKey: "landing.uc3.title", bodyKey: "landing.uc3.body", to: "/simple-agreements" },
  { titleKey: "landing.uc4.title", bodyKey: "landing.uc4.body", to: "/vendor-agreements" },
  { titleKey: "landing.uc5.title", bodyKey: "landing.uc5.body", to: "/compliance-documentation" },
  { titleKey: "landing.uc6.title", bodyKey: "landing.uc6.body", to: "/nda-signing" },
];

const HOW_IT_WORKS_KEYS: Array<{ titleKey: string; bodyKey: string }> = [
  { titleKey: "how.s1.title", bodyKey: "how.s1.body" },
  { titleKey: "how.s2.title", bodyKey: "how.s2.body" },
  { titleKey: "how.s3.title", bodyKey: "how.s3.body" },
  { titleKey: "how.s4.title", bodyKey: "how.s4.body" },
];

// These 4 are shown here purely as a representative sample — same underlying FREE_TEMPLATES
// data /free-templates itself reads, so the count and list can't drift out of sync.
const FEATURED_TEMPLATE_SLUGS = ["mutual-nda", "independent-contractor-agreement", "offer-letter", "freelance-service-agreement"];
const FEATURED_TEMPLATES = FREE_TEMPLATES.filter((tmpl) => FEATURED_TEMPLATE_SLUGS.includes(tmpl.slug));

const AI_FEATURE_KEYS: Array<{ titleKey: string; bodyKey: string }> = [
  { titleKey: "landing.ai1.title", bodyKey: "landing.ai1.body" },
  { titleKey: "landing.ai2.title", bodyKey: "landing.ai2.body" },
  { titleKey: "landing.ai3.title", bodyKey: "landing.ai3.body" },
  { titleKey: "landing.ai4.title", bodyKey: "landing.ai4.body" },
];

export default function Landing() {
  const t = useT();
  const { locale } = useI18n();
  const [heroEmail, setHeroEmail] = useState("");
  const [heroEmailStarted, setHeroEmailStarted] = useState(false);
  const [heroSubmitting, setHeroSubmitting] = useState(false);
  const [heroSent, setHeroSent] = useState(false);
  const [heroError, setHeroError] = useState<string | null>(null);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [watchOpen, setWatchOpen] = useState(false);
  const heroEmailRef = useRef<HTMLInputElement>(null);
  useSeoMeta("home");
  const faqItems = FAQ_KEYS.map((item) => ({
    question: t(item.qKey),
    answer: t(item.aKey),
  }));
  // Freelance service agreement, not the mutual NDA — most freelancers/SMEs landing on the
  // homepage need to get a client agreement signed, not protect confidential info. NDA stays the
  // default only for outreach personas/short-links that are specifically about that use case.
  const prepareSampleTo = localizePath("/prepare?freeTemplate=freelance-service-agreement", locale);
  const templatesTo = localizePath("/free-templates", locale);
  const emailTrimmed = heroEmail.trim();
  // Match Login: mount Turnstile whenever the site key is set so a token is ready before submit.
  // Keep the button clickable with an empty field so we can show "Email is missing" instead of
  // silently routing to /prepare (the previous empty-submit path).
  const needsTurnstile = turnstileRequired();
  const heroNeedsTurnstileToken = !!emailTrimmed && needsTurnstile;

  useEffect(() => {
    if (window.location.hash === "#faq") {
      document.getElementById("faq")?.scrollIntoView();
    }
    if (window.location.hash === "#watch-how-it-works") {
      setWatchOpen(true);
    }
  }, []);

  useEffect(() => {
    const onHash = () => {
      if (window.location.hash === "#watch-how-it-works") setWatchOpen(true);
    };
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const closeWatch = () => {
    setWatchOpen(false);
    if (window.location.hash === "#watch-how-it-works") {
      history.replaceState(null, "", window.location.pathname + window.location.search);
    }
  };

  const focusHeroEmail = () => {
    heroEmailRef.current?.focus();
  };

  const onHeroStart = async (e: FormEvent) => {
    e.preventDefault();
    track("landingpage_cta_clicked", { source: "hero_email_start" });
    const email = heroEmail.trim();
    if (!email) {
      setHeroError(t("hero.emailMissing"));
      focusHeroEmail();
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setHeroError(t("hero.emailInvalid"));
      focusHeroEmail();
      return;
    }
    if (needsTurnstile && !turnstileToken) {
      setHeroError(t("hero.turnstileRequired"));
      return;
    }
    setHeroSubmitting(true);
    setHeroError(null);
    try {
      await requestMagicLink(email, turnstileToken ?? undefined, prepareSampleTo, locale);
      setHeroSent(true);
    } catch (err) {
      setHeroError(err instanceof Error ? err.message : t("common.error"));
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
    } finally {
      setHeroSubmitting(false);
    }
  };

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner hero-split">
          <div>
            <Link
              to="/whatsapp-signing"
              className="hero-new-badge"
              onClick={() => track("landingpage_cta_clicked", { source: "hero_whatsapp_badge" })}
            >
              <img src="/integrations/whatsapp.svg" alt="" width={16} height={16} />
              {t("hero.whatsappBadge")}
            </Link>
            <h1>{t("hero.title")}</h1>
            <p className="hero-sub">{t("hero.sub")}</p>
            <div className="hero-cta-row">
              {heroSent ? (
                <div className="hero-signup-sent" role="status">
                  <p className="hero-signup-sent-title">{t("hero.sentTitle")}</p>
                  <p className="hero-signup-sent-body">{t("hero.sentBody", { email: emailTrimmed })}</p>
                  <Link
                    to={prepareSampleTo}
                    className="hero-signup-sent-continue"
                    onClick={() => track("landingpage_cta_clicked", { source: "hero_continue_prepare" })}
                  >
                    {t("hero.continuePrepare")} →
                  </Link>
                </div>
              ) : (
                <form className="hero-signup-form" onSubmit={onHeroStart} noValidate>
                  <div className="hero-signup">
                    <input
                      ref={heroEmailRef}
                      className="hero-signup-input"
                      type="email"
                      name="email"
                      autoComplete="email"
                      placeholder={t("hero.emailPlaceholder")}
                      aria-label={t("hero.emailPlaceholder")}
                      aria-invalid={!!heroError}
                      aria-describedby={heroError ? "hero-signup-error" : undefined}
                      value={heroEmail}
                      onChange={(e) => {
                        setHeroEmail(e.target.value);
                        if (e.target.value.trim()) setHeroEmailStarted(true);
                        if (heroError) setHeroError(null);
                      }}
                      disabled={heroSubmitting}
                    />
                    <button
                      type="submit"
                      className="hero-signup-btn"
                      disabled={heroSubmitting || (heroNeedsTurnstileToken && !turnstileToken)}
                    >
                      {heroSubmitting ? t("common.sending") : `${t("hero.startFree")} →`}
                    </button>
                  </div>
                  {needsTurnstile && heroEmailStarted && (
                    <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey} />
                  )}
                  {heroError && (
                    <p id="hero-signup-error" className="hero-signup-error" role="alert">
                      {heroError}
                    </p>
                  )}
                </form>
              )}
              <button
                type="button"
                className="hero-watch-btn"
                id="watch-how-it-works"
                onClick={() => {
                  track("landingpage_cta_clicked", { source: "hero_watch_how" });
                  setWatchOpen(true);
                  if (window.location.hash !== "#watch-how-it-works") {
                    history.replaceState(null, "", "#watch-how-it-works");
                  }
                }}
              >
                <span className="hero-watch-icon" aria-hidden="true">
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" fill="rgba(255,255,255,0.18)" />
                    <path d="M10 8.5v7l6-3.5-6-3.5z" fill="#fff" />
                  </svg>
                </span>
                {t("hero.watchHow")}
              </button>
            </div>
            {!heroSent && <p className="hero-cta-hint">{t("hero.hint")}</p>}
            <p className="hero-secondary-link">
              <Link
                to={templatesTo}
                onClick={() => track("landingpage_cta_clicked", { source: "hero_browse_templates" })}
              >
                {t("hero.orTemplates")}
              </Link>
            </p>
          </div>
          <div className="doc-mockup-glow">
            <div className="doc-mockup-card">
              <ProductFlowDemo />
            </div>
          </div>
        </div>
      </div>

      <div className="trust-logos-band">
        <p className="trust-logos-label">{t("landing.trustedBy")}</p>
        <div className="trust-logos-row">
          {TRUST_LOGOS.map((item) => (
            <a
              key={item.name}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              className={item.logo ? "trust-logo-link" : "trust-logo-link trust-logo-link-text"}
              aria-label={item.name}
            >
              {item.logo ? (
                <img src={item.logo} alt={item.name} className="trust-logo-img" loading="lazy" />
              ) : (
                item.name
              )}
            </a>
          ))}
        </div>
      </div>

      <div className="audience-band" id="how-it-works">
        <div className="audience-inner">
          <h2 style={{ fontSize: 22, marginBottom: 0, textAlign: "center" }}>{t("how.title")}</h2>
          <div className="accent-grid">
            {HOW_IT_WORKS_KEYS.map((step, i) => (
              <div key={step.titleKey} className="accent-item">
                <h3 style={{ fontSize: 15, marginBottom: 3 }}>
                  <span style={{ color: "var(--primary)" }}>{i + 1}.</span> {t(step.titleKey)}
                </h3>
                <p style={{ margin: 0, fontSize: 13.5 }}>{t(step.bodyKey)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="core-features-band">
        <div className="core-features-inner">
          <h2 style={{ fontSize: 26, marginBottom: 8, textAlign: "center" }}>
            {t("landing.featuresTitle")}
          </h2>
          <p style={{ textAlign: "center", maxWidth: 560, margin: "0 auto" }}>
            {t("landing.featuresSub")}
          </p>
          <div className="core-features-grid">
            {CORE_FEATURES.map((f) => (
              <div key={f.titleKey} className="core-feature-card">
                <div className="core-feature-icon">
                  <FeatureIcon name={f.icon} />
                </div>
                <h3>{t(f.titleKey)}</h3>
                <p>{t(f.bodyKey)}</p>
                <Link to={localizePath(f.to, locale)} style={{ fontSize: 13, fontWeight: 600 }}>
                  {t(f.linkKey)} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* "Repeated under Feature #1" per spec — spliced directly between the first and second
          feature cards would break the 2-column CSS grid (a full-span item here forces every
          later card down a row, out of alignment), so this sits right after the features section
          that Feature #1 leads instead — same visual position, without wrecking the grid. */}
      <FirstDocumentPrompt source="features" />

      <IntegrationsBand learnMoreTo="/mcp" />

      <div className="spotlight-band">
        <div className="spotlight-inner">
          <h2 style={{ fontSize: 24, marginBottom: 6 }}>{t("landing.aiTitle")}</h2>
          <p style={{ marginTop: 0, marginBottom: 0, maxWidth: 640 }}>
            {t("landing.aiSub")}
          </p>

          <div className="spotlight-split">
            <div className="accent-list">
              {AI_FEATURE_KEYS.map((f) => (
                <div key={f.titleKey} className="accent-item">
                  <h3 style={{ fontSize: 15, marginBottom: 3 }}>{t(f.titleKey)}</h3>
                  <p style={{ margin: 0, fontSize: 13.5 }}>{t(f.bodyKey)}</p>
                </div>
              ))}
              <div className="accent-item is-mcp">
                <h3 style={{ fontSize: 15, marginBottom: 3 }}>{t("landing.aiMcp.title")}</h3>
                <p style={{ margin: 0, fontSize: 13.5 }}>
                  {t("landing.aiMcp.body")}
                </p>
              </div>
            </div>
            <div className="doc-mockup-glow">
              <div className="doc-mockup-card">
                <DetectMockup />
              </div>
            </div>
          </div>

          <div style={{ marginTop: 24 }}>
            <Link
              to="/login"
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("landingpage_cta_clicked", { source: "paid_plan_signin" })}
            >
              {t("landing.aiCta")}
            </Link>
          </div>
        </div>
      </div>

      <div className="audience-band">
        <div className="audience-inner">
          <h2 style={{ fontSize: 22, marginBottom: 0 }}>{t("landing.useCasesTitle")}</h2>
          <div className="accent-grid">
            {USE_CASE_KEYS.map((u) => (
              <Link key={u.titleKey} to={localizePath(u.to, locale)} className="accent-item" style={{ textDecoration: "none", color: "inherit" }}>
                <h3 style={{ fontSize: 15, marginBottom: 3 }}>{t(u.titleKey)}</h3>
                <p style={{ margin: 0, fontSize: 13.5 }}>{t(u.bodyKey)}</p>
              </Link>
            ))}
          </div>
        </div>
      </div>

      <div className="audience-band">
        <div className="audience-inner">
          <h2 style={{ fontSize: 22, marginBottom: 0 }}>{t("landing.templatesTitle")}</h2>
          <div className="accent-grid">
            {FEATURED_TEMPLATES.map((tmpl) => (
              <div key={tmpl.slug} className="accent-item">
                <h3 style={{ fontSize: 15, marginBottom: 3 }}>
                  {locale === "es" ? t(`tpl.${tmpl.slug}.name`) : tmpl.name}
                </h3>
                <p style={{ margin: 0, fontSize: 13.5 }}>
                  {locale === "es" ? t(`tpl.${tmpl.slug}.description`) : tmpl.description}
                </p>
                <Link to={localizePath(`/free-templates/${tmpl.slug}`, locale)} style={{ fontSize: 13, fontWeight: 600 }}>
                  {t("landing.templateUse")} →
                </Link>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20 }}>
            <Link to={templatesTo} style={{ fontSize: 13.5, fontWeight: 600 }}>
              {t("landing.templatesBrowse", { count: FREE_TEMPLATES.length })} →
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 960, padding: "48px 24px" }}>
        <h2 style={{ fontSize: 24, marginTop: 0, marginBottom: 24, textAlign: "center" }}>
          {t("landing.testimonialsTitle")}
        </h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
          {TESTIMONIALS.map((testimonial) => {
            const title = t(testimonial.titleKey);
            return (
            <div key={testimonial.name} className="card" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <p style={{ fontSize: 15, fontStyle: "italic", color: "var(--body-strong)", margin: 0, flex: 1, lineHeight: 1.5 }}>
                "{t(testimonial.quoteKey)}"
              </p>
              <div>
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 600, color: "var(--ink)" }}>{testimonial.name}</p>
                {(title || testimonial.company) && (
                  <p style={{ margin: 0, fontSize: 12.5, color: "var(--mute)" }}>
                    {title}
                    {title && testimonial.company ? ", " : ""}
                    {testimonial.company ?? ""}
                  </p>
                )}
              </div>
              {testimonial.logo && (
                <img
                  src={testimonial.logo}
                  alt={testimonial.company ?? testimonial.name}
                  loading="lazy"
                  style={{ height: 36, width: "auto", alignSelf: "flex-start", objectFit: "contain", borderRadius: "var(--r-sm)" }}
                />
              )}
            </div>
            );
          })}
        </div>
      </div>

      <div className="container" id="faq" style={{ maxWidth: 720, paddingTop: 8, paddingBottom: 8 }}>
        <h2 style={{ fontSize: 24, marginBottom: 16, textAlign: "center" }}>{t("landing.faqTitle")}</h2>
        {faqItems.map((item) => (
          <details key={item.question} className="faq-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
      <script
        type="application/ld+json"
        // Rendered inline so VideoObject / HowTo / FAQPage appear in prerendered homepage markup
        // alongside the visible how-it-works video and FAQ copy (rich-result eligibility).
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "VideoObject",
              name: t("seo.video.name"),
              description: t("seo.video.description"),
              thumbnailUrl: [HOW_IT_WORKS_VIDEO.posterUrl],
              uploadDate: HOW_IT_WORKS_VIDEO.uploadDate,
              duration: HOW_IT_WORKS_VIDEO.durationIso,
              contentUrl: HOW_IT_WORKS_VIDEO.contentUrl,
              embedUrl: HOW_IT_WORKS_VIDEO.embedUrl,
              encodingFormat: "video/webm",
              inLanguage: locale === "es" ? "es" : "en",
              publisher: {
                "@type": "Organization",
                name: "Docracy",
                url: "https://docracy.io",
                logo: {
                  "@type": "ImageObject",
                  url: "https://docracy.io/docracy-seal-icon.png",
                },
              },
            },
            {
              "@context": "https://schema.org",
              "@type": "HowTo",
              name: t("how.title"),
              description: t("seo.video.description"),
              totalTime: HOW_IT_WORKS_VIDEO.durationIso,
              step: HOW_IT_WORKS_KEYS.map((step, i) => ({
                "@type": "HowToStep",
                position: i + 1,
                name: t(step.titleKey),
                text: t(step.bodyKey),
              })),
            },
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: faqItems.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: { "@type": "Answer", text: item.answer },
              })),
            },
          ]),
        }}
      />

      <div className="container">
        <div style={{ marginTop: 40 }}>
          <PricingCalculator />
        </div>

        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 32 }}>
          {t("landing.disclaimer")}{" "}
          <Link to="/trust">{t("landing.disclaimerTrust")}</Link>
          {" · "}
          <Link to={localizePath("/esign-ueta", locale)}>{t("footer.esignUeta")}</Link>
        </p>
      </div>

      <FirstDocumentPrompt mobileOnly source="mobile_footer" />
      {watchOpen && <HowItWorksModal onClose={closeWatch} />}
    </div>
  );
}
