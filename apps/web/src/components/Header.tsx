import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";
import { useT } from "../lib/i18n";
import LanguageSwitcher from "./LanguageSwitcher";

export default function Header() {
  const t = useT();
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const NAV_LINKS = [
    { to: "/pricing", label: t("nav.pricing") },
    { to: "/free-templates", label: t("nav.templates") },
    { to: "/mcp", label: t("nav.mcp") },
    { to: "/docs", label: t("nav.docs") },
    { to: "/blog", label: t("nav.blog") },
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
  const isInAppRoute = ["/dashboard", "/prepare", "/status"].some((p) => location.pathname.startsWith(p));
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const logoHeight = isSignRoute || isInAppRoute ? 24 : 40;
  const logoLinkTo = isInAppRoute ? "/dashboard" : "/";

  if (isSignRoute) {
    return (
      <header className="site-header site-header-minimal">
        <div className="container" style={{ padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to={logoLinkTo} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: logoHeight, width: "auto" }} />
          </Link>
          <LanguageSwitcher className="lang-switcher-on-dark" />
        </div>
      </header>
    );
  }

  if (isDashboardRoute) {
    return (
      <header className="site-header site-header-app">
        <div className="container" style={{ padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
          <Link to="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: logoHeight, width: "auto" }} />
          </Link>
          <span className="header-app-title">{t("nav.dashboard")}</span>
          <LanguageSwitcher className="lang-switcher-on-dark" />
        </div>
      </header>
    );
  }

  return (
    <header className="site-header">
      <div className="container" style={{ padding: 0, display: "flex", alignItems: "center", gap: 16 }}>
        <Link to={logoLinkTo} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: logoHeight, width: "auto" }} />
        </Link>
        <div className="header-nav-right">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="header-templates-link header-nav-link">
              {link.label}
            </Link>
          ))}
          <LanguageSwitcher className="lang-switcher-on-dark header-templates-link" />
          <Link to={signedIn ? "/dashboard" : "/login"} className="header-nav-link header-nav-link-strong">
            {signedIn ? t("nav.dashboard") : t("nav.signin")}
          </Link>
          {signedIn && (
            <button onClick={onLogout} className="header-logout-btn">
              {t("nav.logout")}
            </button>
          )}
          {!signedIn && (
            <Link to="/prepare" className="btn-primary btn-lg" style={{ textDecoration: "none" }}>
              {t("nav.startFree")}
            </Link>
          )}
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
        </div>
      </div>

      {menuOpen && (
        <div className="header-mobile-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <div className={`header-mobile-panel${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <button className="header-mobile-close" aria-label={t("nav.closeMenu")} onClick={() => setMenuOpen(false)}>
          ✕
        </button>
        <nav className="header-mobile-nav">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="header-mobile-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div style={{ margin: "16px 0" }}>
          <LanguageSwitcher />
        </div>
        <div className="header-mobile-ctas">
          <Link to="/prepare" className="header-mobile-cta-primary" onClick={() => setMenuOpen(false)}>
            {t("nav.startFree")}
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
