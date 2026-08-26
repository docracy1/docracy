import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";
import { localizePath, useI18n, useT } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";
import NavMegaMenu from "./NavMegaMenu";
import { NavIcon } from "./NavIcons";

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
  { to: "/esign-ueta", icon: "scale", titleKey: "nav.mega.feature.esign.title", descKey: "nav.mega.feature.esign.desc" },
  { to: "/pricing", icon: "users", titleKey: "nav.mega.feature.team.title", descKey: "nav.mega.feature.team.desc" },
  { to: "/privacy", icon: "shield", titleKey: "nav.mega.feature.storage.title", descKey: "nav.mega.feature.storage.desc" },
  { to: "/docs", icon: "bolt", titleKey: "nav.mega.feature.workflows.title", descKey: "nav.mega.feature.workflows.desc" },
  { to: "/document-verification", icon: "badge", titleKey: "nav.mega.feature.verify.title", descKey: "nav.mega.feature.verify.desc" },
  { to: "/blockchain-timestamp", icon: "chainLink", titleKey: "nav.mega.feature.blockchain.title", descKey: "nav.mega.feature.blockchain.desc" },
] as const;

const COMPARE_ITEMS = [
  { to: "/docusign-alternative", icon: "scale", titleKey: "footer.vsDocusign", descKey: "nav.mega.compare.docusign.desc" },
  { to: "/eversign-alternative", icon: "scale", titleKey: "footer.vsEversign", descKey: "nav.mega.compare.eversign.desc" },
  { to: "/pandadoc-alternative", icon: "scale", titleKey: "footer.vsPandadoc", descKey: "nav.mega.compare.pandadoc.desc" },
] as const;

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

const RESOURCE_ITEMS = [
  { to: "/blog", icon: "book", titleKey: "nav.mega.resource.blog.title", descKey: "nav.mega.resource.blog.desc" },
  { to: "/docs", icon: "lifering", titleKey: "nav.mega.resource.docs.title", descKey: "nav.mega.resource.docs.desc" },
  { to: "/about", icon: "info", titleKey: "nav.mega.resource.about.title", descKey: "nav.mega.resource.about.desc" },
  { to: SALES_MAILTO, icon: "mail", titleKey: "nav.mega.resource.contact.title", descKey: "nav.mega.resource.contact.desc" },
] as const;

/** Everything that isn't Features or Marketplace lives under one "More" menu — mirrors a minimal
 *  top-level nav (a couple of items + a single catch-all) rather than a long row of triggers. */
const MORE_PANEL_ITEMS = [
  { to: "/pricing", icon: "scale", titleKey: "nav.pricing", descKey: "nav.mega.more.pricing.desc" },
  { to: "/ai", icon: "sparkles", titleKey: "nav.ai", descKey: "nav.mega.more.ai.desc" },
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
  const compareItems = COMPARE_ITEMS.map((c) => ({
    to: localizePath(c.to, locale),
    icon: <NavIcon name={c.icon} />,
    title: t(c.titleKey),
    description: t(c.descKey),
  }));
  const industryItems = INDUSTRY_ITEMS.map((i) => ({
    to: localizePath(i.to, locale),
    icon: <NavIcon name={i.icon} />,
    title: t(i.titleKey),
    description: t(i.descKey),
  }));
  const resourceItems = RESOURCE_ITEMS.map((r) => ({
    to: r.to.startsWith("mailto:") ? r.to : localizePath(r.to, locale),
    icon: <NavIcon name={r.icon} />,
    title: t(r.titleKey),
    description: t(r.descKey),
  }));
  const morePanelItems = MORE_PANEL_ITEMS.map((m) => ({
    to: localizePath(m.to, locale),
    icon: <NavIcon name={m.icon} />,
    title: t(m.titleKey),
    description: t(m.descKey),
  }));
  // Titles-only lists for mobile accordion (no icons/descriptions).
  const featureMobile = FEATURE_ITEMS.map((f) => ({ to: localizePath(f.to, locale), title: t(f.titleKey) }));
  const industryMobile = INDUSTRY_ITEMS.map((i) => ({ to: localizePath(i.to, locale), title: t(i.titleKey) }));
  const resourceMobile = RESOURCE_ITEMS.map((r) => ({
    to: r.to.startsWith("mailto:") ? r.to : localizePath(r.to, locale),
    title: t(r.titleKey),
  }));
  const morePanelMobile = MORE_PANEL_ITEMS.map((m) => ({ to: localizePath(m.to, locale), title: t(m.titleKey) }));

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
            <NavMegaMenu
              label={t("nav.more")}
              items={industryItems}
              columns={2}
              panel={{
                title: t("nav.resources"),
                items: [...morePanelItems, ...resourceItems.filter((r) => !r.to.endsWith("/blog"))],
                footerLabel: t("nav.mega.resource.blog.title"),
                footerTo: localizePath("/blog", locale),
              }}
            />
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
              {industryMobile.map((i) => (
                <Link key={i.to} to={i.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                  {i.title}
                </Link>
              ))}
              {morePanelMobile.map((m) => (
                <Link key={m.to} to={m.to} className="header-mobile-accordion-sublink" onClick={() => setMenuOpen(false)}>
                  {m.title}
                </Link>
              ))}
              {resourceMobile.map((r) =>
                r.to.startsWith("mailto:") || r.to.startsWith("http") ? (
                  <a
                    key={r.to}
                    href={r.to}
                    className="header-mobile-accordion-sublink"
                    onClick={() => {
                      setMenuOpen(false);
                      if (r.to.startsWith("mailto:")) openSalesChat();
                    }}
                  >
                    {r.title}
                  </a>
                ) : (
                  <Link
                    key={r.to}
                    to={r.to}
                    className="header-mobile-accordion-sublink"
                    onClick={() => setMenuOpen(false)}
                  >
                    {r.title}
                  </Link>
                )
              )}
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
