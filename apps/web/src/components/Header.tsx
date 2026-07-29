import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";

const NAV_LINKS = [
  { to: "/pricing", label: "Pricing" },
  { to: "/free-templates", label: "Free templates" },
  { to: "/mcp", label: "AI & MCP" },
  { to: "/docs", label: "Docs" },
  { to: "/blog", label: "Blog" },
];

export default function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // The nav links collapse into this menu below 480px (see .header-templates-link in
  // theme.css) — closing on every route change means a stale open menu never lingers after
  // the user taps a link and gets navigated away.
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  // Re-check on every route change, not just on first mount — Header lives outside <Routes> and
  // never remounts, so without this it never notices a login/logout that happened via client-side
  // navigate() (e.g. AuthVerify redirecting to /dashboard after consuming a magic link).
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

  // The signing page is the one place a document's actual RECIPIENT sees this app — often someone
  // with no Docracy account at all. Every bit of marketing chrome (nav links, sign-in/CTA, mobile
  // menu) is pure distraction there, so it's stripped down to just the logo, per the "no
  // distraction" requirement for that page specifically.
  const isSignRoute = location.pathname.startsWith("/sign/");
  // Everywhere else inside the actual product (as opposed to the marketing site around it), the
  // logo drops from the marketing site's 40px down to a quieter in-product size, and clicking it
  // goes back to the signed-in home (Dashboard) rather than out to the public landing page.
  const isInAppRoute = ["/dashboard", "/prepare", "/status"].some((p) => location.pathname.startsWith(p));
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const logoHeight = isSignRoute || isInAppRoute ? 24 : 40;
  const logoLinkTo = isInAppRoute ? "/dashboard" : "/";

  if (isSignRoute) {
    return (
      <header className="site-header site-header-minimal">
        <div className="container" style={{ padding: 0, display: "flex", alignItems: "center" }}>
          <Link to={logoLinkTo} style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: logoHeight, width: "auto" }} />
          </Link>
        </div>
      </header>
    );
  }

  // Dashboard has its own mobile bottom nav — keep the site header to logo + title so we don't
  // stack two competing nav systems (the bug that made the panel unusable on phones).
  if (isDashboardRoute) {
    return (
      <header className="site-header site-header-app">
        <div className="container" style={{ padding: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link to="/dashboard" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
            <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: logoHeight, width: "auto" }} />
          </Link>
          <span className="header-app-title">Dashboard</span>
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
          <Link to={signedIn ? "/dashboard" : "/login"} className="header-nav-link header-nav-link-strong">
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
          {signedIn && (
            <button onClick={onLogout} className="header-logout-btn">
              Log out
            </button>
          )}
          {!signedIn && (
            <Link to="/prepare" className="btn-primary btn-lg" style={{ textDecoration: "none" }}>
              Start free
            </Link>
          )}
          <button
            className="header-menu-toggle"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      {/* Slide-in mobile panel — Swipesign style */}
      {menuOpen && (
        <div className="header-mobile-backdrop" onClick={() => setMenuOpen(false)} aria-hidden="true" />
      )}
      <div className={`header-mobile-panel${menuOpen ? " is-open" : ""}`} aria-hidden={!menuOpen}>
        <button
          className="header-mobile-close"
          aria-label="Close menu"
          onClick={() => setMenuOpen(false)}
        >
          ✕
        </button>
        <nav className="header-mobile-nav">
          {NAV_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="header-mobile-nav-link">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="header-mobile-ctas">
          <Link to="/prepare" className="header-mobile-cta-primary" onClick={() => setMenuOpen(false)}>
            Start free
          </Link>
          <Link
            to={signedIn ? "/dashboard" : "/login"}
            className="header-mobile-cta-secondary"
            onClick={() => setMenuOpen(false)}
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
        </div>
      </div>
    </header>
  );
}
