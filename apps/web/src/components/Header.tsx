import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";
import { localizePath, useI18n, useT } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import NavMegaMenu from "./NavMegaMenu";
import { NavIcon } from "./NavIcons";

/** Real features only — mirrors Landing.tsx's CORE_FEATURES, not a wishlist. */
const FEATURE_ITEMS = [
  { to: "/prepare", icon: "send", title: "Simple document sending", description: "Upload a PDF and send it for signature in seconds." },
  { to: "/ai", icon: "sparkles", title: "AI Auto-Detect", description: "Automatically finds and places signature, date, and initial fields." },
  { to: "/free-templates", icon: "duplicate", title: "Reusable templates", description: "Save a field layout once, reuse it every time." },
  { to: "/pricing", icon: "users", title: "Team access", description: "Share documents and templates under one workspace." },
  { to: "/privacy", icon: "shield", title: "Secure storage", description: "Encrypted, with short automatic retention." },
  { to: "/docs", icon: "bolt", title: "Fast workflows", description: "Sequential or all-at-once signing, your choice." },
];

const COMPARE_ITEMS = [
  { to: "/docusign-alternative", icon: "scale", title: "vs DocuSign", description: "Lighter, no per-seat pricing." },
  { to: "/eversign-alternative", icon: "scale", title: "vs eversign", description: "Faster, simpler signing flow." },
  { to: "/pandadoc-alternative", icon: "scale", title: "vs PandaDoc", description: "No proposal suite you don't need." },
];

/** Solo entrepreneurs, freelancers, and SMEs — not enterprise verticals like a bigger competitor
 *  would list (no "Legal"/"Finance" compliance-grade categories Docracy doesn't actually serve). */
const INDUSTRY_ITEMS = [
  { to: "/industry/freelancers", icon: "briefcase", title: "Freelancers & Consultants", description: "Client agreements, NDAs, and invoices." },
  { to: "/industry/creative-agencies", icon: "megaphone", title: "Creative & Marketing Agencies", description: "Contractor onboarding and scopes of work." },
  { to: "/industry/real-estate", icon: "building", title: "Real Estate & Property", description: "Leases, subleases, and vendor agreements." },
  { to: "/industry/construction", icon: "hammer", title: "Construction & Trades", description: "Work orders, quotes, and liability waivers." },
  { to: "/industry/small-business", icon: "store", title: "Small Business & Local Services", description: "Vendor terms, onboarding, and client contracts." },
];

const RESOURCE_ITEMS = [
  { to: "/blog", icon: "book", title: "Blog", description: "Product updates and how-to guides." },
  { to: "/docs", icon: "lifering", title: "Documentation", description: "Every feature, API, and integration." },
  { to: "/about", icon: "info", title: "About", description: "Why Docracy exists and who runs it." },
  { to: "mailto:sales@docracy.io", icon: "mail", title: "Contact", description: "Questions before you sign up? Ask." },
];

export default function Header() {
  const t = useT();
  const { locale } = useI18n();
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const NAV_AFTER_PRICING = [
    { to: localizePath("/free-templates", locale), label: t("nav.templates") },
    { to: localizePath("/ai", locale), label: t("nav.ai") },
  ];
  const pricingTo = localizePath("/pricing", locale);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    fetchMe()
      .then(({ account }) => setSignedIn(!!account))
      .catch(() => setSignedIn(false));
  }, [location.pathname]);

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      setSignedIn(false);
      navigate("/");
    }
  };

  const isSignRoute = location.pathname.startsWith("/sign/");
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  // Always the real homepage — was "/dashboard" while logged in, which just reloaded the page
  // you were already on instead of taking you back to the marketing site.
  const logoLinkTo = localizePath("/", locale);
  const prepareTo = localizePath("/prepare", locale);

  const brand = (
    <Link to={logoLinkTo} className="header-brand" aria-label="Docracy">
      <img src="/docracy-seal-icon.png" alt="" className="header-brand-mark" width={28} height={28} />
      <span className="header-brand-name">Docracy</span>
    </Link>
  );

  if (isSignRoute) {
    return (
      <header className="site-header site-header-minimal">
        <div className="container header-bar">
          {brand}
          <LanguageSwitcher className="lang-switcher-on-dark" />
        </div>
      </header>
    );
  }

  if (isDashboardRoute) {
    return (
      <header className="site-header site-header-app">
        <div className="container header-bar">
          {brand}
          <span className="header-app-title">{t("nav.dashboard")}</span>
          <LanguageSwitcher className="lang-switcher-on-dark" />
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div className="container header-bar">
        {brand}
        <nav className="header-nav-right" aria-label="Primary">
          <NavMegaMenu
            label={t("nav.features")}
            items={FEATURE_ITEMS.map((f) => ({ ...f, icon: <NavIcon name={f.icon} /> }))}
            panel={{
              title: "Compare",
              items: COMPARE_ITEMS.map((c) => ({ ...c, icon: <NavIcon name={c.icon} /> })),
              footerLabel: "See all comparisons",
              footerTo: "/blog",
            }}
          />
          <NavMegaMenu
            label={t("nav.industry")}
            items={INDUSTRY_ITEMS.map((i) => ({ ...i, icon: <NavIcon name={i.icon} /> }))}
            columns={2}
          />
          <Link to={pricingTo} className="header-templates-link header-nav-link">
            {t("nav.pricing")}
          </Link>
          <NavMegaMenu
            label={t("nav.resources")}
            items={RESOURCE_ITEMS.map((r) => ({ ...r, icon: <NavIcon name={r.icon} /> }))}
            columns={2}
          />
          {NAV_AFTER_PRICING.map((link) => (
            <Link key={link.to} to={link.to} className="header-templates-link header-nav-link">
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher className="lang-switcher-on-dark header-templates-link" />
          <div className="header-cta-group">
            <a href="mailto:sales@docracy.io" className="header-nav-sales header-templates-link">
              {t("nav.contactSales")}
            </a>
            {!signedIn ? (
              <>
                <Link to={prepareTo} className="header-try-btn header-startfree-btn">
                  {t("nav.tryFree")}
                </Link>
                <Link to="/login" className="header-login-btn">
                  {t("nav.signin")}
                </Link>
              </>
            ) : (
              <>
                <Link to="/dashboard" className="header-try-btn header-startfree-btn">
                  {t("nav.dashboard")}
                </Link>
                <button type="button" onClick={onLogout} className="header-login-btn">
                  {t("nav.logout")}
                </button>
              </>
            )}
          </div>
          <button
            className="header-menu-toggle"
            aria-label={menuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </nav>
      </div>

      {menuOpen && (
        <div className="header-mobile-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <div className={`header-mobile-panel${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="header-mobile-close" aria-label={t("nav.closeMenu")} onClick={() => setMenuOpen(false)}>
          ✕
        </button>
        <nav className="header-mobile-nav">
          <details className="header-mobile-accordion">
            <summary>{t("nav.features")}</summary>
            <div className="header-mobile-accordion-sublist">
              {FEATURE_ITEMS.map((f) => (
                <Link key={f.to} to={f.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                  {f.title}
                </Link>
              ))}
            </div>
          </details>
          <details className="header-mobile-accordion">
            <summary>{t("nav.industry")}</summary>
            <div className="header-mobile-accordion-sublist">
              {INDUSTRY_ITEMS.map((i) => (
                <Link key={i.to} to={i.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                  {i.title}
                </Link>
              ))}
            </div>
          </details>
          <Link to={pricingTo} className="header-mobile-nav-link" onClick={() => setMenuOpen(false)}>
            {t("nav.pricing")}
          </Link>
          <details className="header-mobile-accordion">
            <summary>{t("nav.resources")}</summary>
            <div className="header-mobile-accordion-sublist">
              {RESOURCE_ITEMS.map((r) => (
                <Link key={r.to} to={r.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                  {r.title}
                </Link>
              ))}
            </div>
          </details>
          {NAV_AFTER_PRICING.map((link) => (
            <Link key={link.to} to={link.to} className="header-mobile-nav-link" onClick={() => setMenuOpen(false)}>
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ margin: "16px 0" }}>
          <LanguageSwitcher />
        </div>
        <div className="header-mobile-ctas">
          <Link to={prepareTo} className="header-mobile-cta-primary" onClick={() => setMenuOpen(false)}>
            {t("nav.tryFree")}
          </Link>
          <Link
            to={signedIn ? "/dashboard" : "/login"}
            className="header-mobile-cta-secondary"
            onClick={() => setMenuOpen(false)}
          >
            {signedIn ? t("nav.dashboard") : t("nav.signin")}
          </Link>
        </div>
      </div>
    </header>
  );
}
