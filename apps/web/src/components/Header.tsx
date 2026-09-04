import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";
import { localizePath, useI18n, useT } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import NavMegaMenu from "./NavMegaMenu";
import NavListMenu, { type NavListEntry } from "./NavListMenu";
import { NavIcon } from "./NavIcons";
import { getOrderedAlternativePages, getOrderedImportGuidePages } from "../lib/marketingPages";

/** Real <a href> — never React Router <Link>, which treats mailto as an SPA path. */
const SALES_MAILTO = "mailto:sales@docracy.io?subject=Docracy%20inquiry";

/** Open the chat widget's sales form as a visible fallback when no mail client is configured. */
function openSalesChat() {
  window.dispatchEvent(new CustomEvent("docracy:open-chat", { detail: { intent: "sales" } }));
}

/** Real features only — mirrors Landing.tsx's CORE_FEATURES, not a wishlist. */
const FEATURE_ITEMS = [
  { to: "/prepare", icon: "send", titleKey: "nav.mega.feature.send.title", descKey: "nav.mega.feature.send.desc" },
  { to: "/whatsapp-signing", icon: "whatsapp", titleKey: "nav.mega.feature.whatsapp.title", descKey: "nav.mega.feature.whatsapp.desc" },
  { to: "/ai", icon: "sparkles", titleKey: "nav.mega.feature.ai.title", descKey: "nav.mega.feature.ai.desc" },
  { to: "/free-templates", icon: "duplicate", titleKey: "nav.mega.feature.templates.title", descKey: "nav.mega.feature.templates.desc" },
  { to: "/packets/us-contractor", icon: "briefcase", titleKey: "nav.mega.feature.packet.title", descKey: "nav.mega.feature.packet.desc" },
  { to: "/esign-ueta", icon: "scale", titleKey: "nav.mega.feature.esign.title", descKey: "nav.mega.feature.esign.desc" },
  { to: "/pricing", icon: "users", titleKey: "nav.mega.feature.team.title", descKey: "nav.mega.feature.team.desc" },
  { to: "/privacy", icon: "shield", titleKey: "nav.mega.feature.storage.title", descKey: "nav.mega.feature.storage.desc" },
  { to: "/docs", icon: "bolt", titleKey: "nav.mega.feature.workflows.title", descKey: "nav.mega.feature.workflows.desc" },
  { to: "/document-verification", icon: "badge", titleKey: "nav.mega.feature.verify.title", descKey: "nav.mega.feature.verify.desc" },
  { to: "/blockchain-timestamp", icon: "chainLink", titleKey: "nav.mega.feature.blockchain.title", descKey: "nav.mega.feature.blockchain.desc" },
] as const;

/** All competitor compare pages — derived from marketingPages so nav stays in sync. */
const COMPARE_PAGES = getOrderedAlternativePages();
const IMPORT_GUIDES = getOrderedImportGuidePages();

/** Each entry mirrors an IndustryPageContent in lib/marketingPages.ts. Legal/HR entries carry an
 *  explicit honestLimit disclaimer on their page (no QES/notarization/identity verification claim)
 *  the same way real-estate already does, so this isn't overselling into compliance-grade territory. */
const INDUSTRY_ITEMS = [
  { to: "/industry/freelancers", icon: "briefcase", titleKey: "nav.mega.industry.freelancers.title", descKey: "nav.mega.industry.freelancers.desc" },
  { to: "/industry/creative-agencies", icon: "megaphone", titleKey: "nav.mega.industry.creative.title", descKey: "nav.mega.industry.creative.desc" },
  { to: "/industry/real-estate", icon: "building", titleKey: "nav.mega.industry.realEstate.title", descKey: "nav.mega.industry.realEstate.desc" },
  { to: "/industry/construction", icon: "hammer", titleKey: "nav.mega.industry.construction.title", descKey: "nav.mega.industry.construction.desc" },
  { to: "/industry/small-business", icon: "store", titleKey: "nav.mega.industry.smallBusiness.title", descKey: "nav.mega.industry.smallBusiness.desc" },
  { to: "/industry/hr", icon: "users", titleKey: "nav.mega.industry.hr.title", descKey: "nav.mega.industry.hr.desc" },
  { to: "/industry/legal", icon: "scale", titleKey: "nav.mega.industry.legal.title", descKey: "nav.mega.industry.legal.desc" },
  { to: "/industry/sales", icon: "target", titleKey: "nav.mega.industry.sales.title", descKey: "nav.mega.industry.sales.desc" },
  { to: "/industry/recruiting", icon: "handshake", titleKey: "nav.mega.industry.recruiting.title", descKey: "nav.mega.industry.recruiting.desc" },
  { to: "/industry/consulting", icon: "lifering", titleKey: "nav.mega.industry.consulting.title", descKey: "nav.mega.industry.consulting.desc" },
] as const;

const USE_CASE_ITEMS = [
  { to: "/client-contracts", titleKey: "landing.uc1.title" },
  { to: "/onboarding-documents", titleKey: "landing.uc2.title" },
  { to: "/simple-agreements", titleKey: "landing.uc3.title" },
  { to: "/vendor-agreements", titleKey: "landing.uc4.title" },
  { to: "/compliance-documentation", titleKey: "landing.uc5.title" },
  { to: "/nda-signing", titleKey: "landing.uc6.title" },
] as const;

export default function Header() {
  const t = useT();
  const { locale } = useI18n();
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const marketplaceTo = localizePath("/free-templates", locale);

  const featureItems = FEATURE_ITEMS.map((f) => ({
    to: localizePath(f.to, locale),
    icon: <NavIcon name={f.icon} />,
    title: t(f.titleKey),
    description: t(f.descKey),
  }));
  // EN-only competitor pages use English labels even when the UI locale is ES (no ES alt routes
  // for the expanded set). localizePath is a no-op for unknown EN paths.
  const compareItems = COMPARE_PAGES.map((c) => ({
    to: `/${c.slug}`,
    icon: <NavIcon name="scale" />,
    title: `vs ${c.competitorName}`,
    description: c.navDesc,
  }));
  const compareNavChildren = [
    ...COMPARE_PAGES.map((c) => ({ to: `/${c.slug}`, label: `vs ${c.competitorName}` })),
    { to: "/hellosign-vs-signnow", label: "HelloSign vs SignNow" },
    ...IMPORT_GUIDES.map((g) => ({
      to: `/import-from-${g.slug}`,
      label: `Import from ${g.competitorName}`,
    })),
  ];
  // LimeWire-style More: important points first; Industry / Use cases / Compare expand in place.
  const moreListEntries: NavListEntry[] = [
    {
      kind: "group",
      id: "industry",
      label: t("nav.industry"),
      children: INDUSTRY_ITEMS.map((i) => ({ to: localizePath(i.to, locale), label: t(i.titleKey) })),
    },
    { kind: "link", label: t("nav.pricing"), to: localizePath("/pricing", locale) },
    {
      kind: "group",
      id: "use-cases",
      label: t("nav.useCases"),
      children: USE_CASE_ITEMS.map((u) => ({ to: localizePath(u.to, locale), label: t(u.titleKey) })),
    },
    { kind: "link", label: t("nav.ai"), to: localizePath("/ai", locale) },
    {
      kind: "group",
      id: "compare",
      label: t("footer.compare"),
      children: compareNavChildren,
    },
    { kind: "link", label: t("footer.about"), to: localizePath("/about", locale) },
    { kind: "link", label: t("nav.docsApi"), to: localizePath("/docs", locale) },
    { kind: "link", label: t("nav.mega.resource.blog.title"), to: localizePath("/blog", locale) },
    { kind: "link", label: t("nav.mega.resource.contact.title"), to: SALES_MAILTO },
  ];
  // Titles-only lists for mobile accordion (no icons/descriptions).
  const featureMobile = FEATURE_ITEMS.map((f) => ({ to: localizePath(f.to, locale), title: t(f.titleKey) }));
  const industryMobile = INDUSTRY_ITEMS.map((i) => ({ to: localizePath(i.to, locale), title: t(i.titleKey) }));
  const useCaseMobile = USE_CASE_ITEMS.map((u) => ({ to: localizePath(u.to, locale), title: t(u.titleKey) }));
  const compareMobile = [
    ...COMPARE_PAGES.map((c) => ({ to: `/${c.slug}`, title: `vs ${c.competitorName}` })),
    ...IMPORT_GUIDES.map((g) => ({
      to: `/import-from-${g.slug}`,
      title: `Import from ${g.competitorName}`,
    })),
  ];

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
        <div className="header-left">
          {brand}
          <nav className="header-primary-nav" aria-label="Primary">
            <NavMegaMenu
              label={t("nav.features")}
              items={featureItems}
              panel={{
                title: t("footer.compare"),
                items: compareItems,
                footerLabel: t("footer.allComparisons"),
                footerTo: localizePath("/blog", locale),
              }}
            />
            <Link to={marketplaceTo} className="header-templates-link header-nav-link">
              {t("nav.templates")}
            </Link>
            <NavListMenu label={t("nav.more")} entries={moreListEntries} />
          </nav>
        </div>
        <div className="header-center">
          <Link
            to={localizePath("/whatsapp-signing", locale)}
            className="header-whatsapp-badge"
            title={t("hero.whatsappBadge")}
          >
            <img src="/integrations/whatsapp.svg" alt="" width={15} height={15} />
            <span className="header-whatsapp-badge-text">{t("hero.whatsappBadge")}</span>
          </Link>
        </div>
        <nav className="header-nav-right" aria-label="Account">
          <LanguageSwitcher className="lang-switcher-on-dark header-templates-link" />
          <div className="header-cta-group">
            <a
              href={SALES_MAILTO}
              className="header-nav-sales header-templates-link"
              title="sales@docracy.io"
              onClick={openSalesChat}
            >
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
              {featureMobile.map((f) => (
                <Link key={f.to} to={f.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                  {f.title}
                </Link>
              ))}
            </div>
          </details>
          <Link to={marketplaceTo} className="header-mobile-nav-link" onClick={() => setMenuOpen(false)}>
            {t("nav.templates")}
          </Link>
          <Link
            to={localizePath("/whatsapp-signing", locale)}
            className="header-mobile-nav-link"
            onClick={() => setMenuOpen(false)}
          >
            {t("hero.whatsappBadge")}
          </Link>
          <details className="header-mobile-accordion">
            <summary>{t("nav.more")}</summary>
            <div className="header-mobile-accordion-sublist">
              <details className="header-mobile-accordion header-mobile-accordion-nested">
                <summary>{t("nav.industry")}</summary>
                <div className="header-mobile-accordion-sublist">
                  {industryMobile.map((i) => (
                    <Link key={i.to} to={i.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                      {i.title}
                    </Link>
                  ))}
                </div>
              </details>
              <Link to={localizePath("/pricing", locale)} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                {t("nav.pricing")}
              </Link>
              <details className="header-mobile-accordion header-mobile-accordion-nested">
                <summary>{t("nav.useCases")}</summary>
                <div className="header-mobile-accordion-sublist">
                  {useCaseMobile.map((u) => (
                    <Link key={u.to} to={u.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                      {u.title}
                    </Link>
                  ))}
                </div>
              </details>
              <Link to={localizePath("/ai", locale)} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                {t("nav.ai")}
              </Link>
              <details className="header-mobile-accordion header-mobile-accordion-nested">
                <summary>{t("footer.compare")}</summary>
                <div className="header-mobile-accordion-sublist">
                  {compareMobile.map((c) => (
                    <Link key={c.to} to={c.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                      {c.title}
                    </Link>
                  ))}
                </div>
              </details>
              <Link to={localizePath("/about", locale)} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                {t("footer.about")}
              </Link>
              <Link to={localizePath("/docs", locale)} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                {t("nav.docsApi")}
              </Link>
              <Link to={localizePath("/blog", locale)} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                {t("nav.mega.resource.blog.title")}
              </Link>
              <a
                href={SALES_MAILTO}
                className="header-mobile-accordion-sublink"
                onClick={() => {
                  setMenuOpen(false);
                  openSalesChat();
                }}
              >
                {t("nav.mega.resource.contact.title")}
              </a>
            </div>
          </details>
        </nav>
        <div style={{ margin: "16px 0" }}>
          <LanguageSwitcher />
        </div>
        <div className="header-mobile-ctas">
          <a
            href={SALES_MAILTO}
            className="header-mobile-cta-secondary"
            onClick={() => {
              setMenuOpen(false);
              openSalesChat();
            }}
          >
            {t("nav.contactSales")}
          </a>
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
