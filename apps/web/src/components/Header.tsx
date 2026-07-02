import { Link } from "react-router-dom";

export default function Header() {
  return (
    <header
      style={{
        borderBottom: "1px solid var(--hairline)",
        padding: "16px 24px",
      }}
    >
      <div className="container" style={{ padding: 0, display: "flex", alignItems: "center", gap: 8 }}>
        <Link to="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 8 }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
              fill="var(--primary)"
            />
            <path d="M15 2v5h5" fill="var(--canvas)" />
          </svg>
          <span style={{ fontSize: 20, fontWeight: 700, color: "var(--primary)" }}>docracy</span>
        </Link>
      </div>
    </header>
  );
}
