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
        padding: "16px 24px",
      }}
    >
      <div className="container" style={{ padding: 0, display: "flex", alignItems: "center", gap: 16 }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: 28, width: "auto" }} />
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 16 }}>
          <Link to={signedIn ? "/dashboard" : "/login"} style={{ fontSize: 14, color: "var(--primary)", textDecoration: "none" }}>
            {signedIn ? "Dashboard" : "Sign in"}
          </Link>
          {signedIn && (
            <button
              onClick={onLogout}
              style={{
                background: "none",
                border: "none",
                padding: 0,
                fontSize: 14,
                color: "var(--mute)",
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              Log out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
