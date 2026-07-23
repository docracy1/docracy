import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { fetchMe, logout } from "../lib/api";

export default function Header() {
  const [signedIn, setSignedIn] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  return (
    <header
      style={{
        borderBottom: "1px solid var(--hairline)",
        padding: "18px 24px",
        position: "sticky",
        top: 0,
        background: "rgba(255,255,255,0.9)",
        backdropFilter: "blur(8px)",
        zIndex: 100,
      }}
    >
      <div className="container" style={{ padding: 0, display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: 40, width: "auto" }} />
        </Link>
        <div className="header-nav-right">
          <Link
            to="/pricing"
            className="header-templates-link"
            style={{ fontSize: 14, color: "var(--body)", textDecoration: "none" }}
          >
            Pricing
          </Link>
          <Link
            to="/free-templates"
            className="header-templates-link"
            style={{ fontSize: 14, color: "var(--body)", textDecoration: "none" }}
          >
            Free templates
          </Link>
          <Link
            to="/mcp"
            className="header-templates-link"
            style={{ fontSize: 14, color: "var(--body)", textDecoration: "none" }}
          >
            AI &amp; MCP
          </Link>
          <Link
            to="/docs"
            className="header-templates-link"
            style={{ fontSize: 14, color: "var(--body)", textDecoration: "none" }}
          >
            Docs
          </Link>
          <Link
            to={signedIn ? "/dashboard" : "/login"}
            style={{ fontSize: 14, fontWeight: 600, color: "var(--primary)", textDecoration: "none" }}
          >
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
          {signedIn && (
            <button onClick={onLogout} className="header-logout-btn">
              Log out
            </button>
          )}
          {!signedIn && (
            <Link to="/prepare" className="btn-primary" style={{ fontSize: 13, padding: "8px 16px", textDecoration: "none" }}>
              Start free
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
