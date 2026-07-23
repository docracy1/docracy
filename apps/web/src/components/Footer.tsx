import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--hairline)", marginTop: 64, padding: "24px 0" }}>
      <div
        className="container"
        style={{ padding: "0 24px", display: "flex", gap: 16, fontSize: 13, color: "var(--mute)", flexWrap: "wrap" }}
      >
        <span>© {new Date().getFullYear()} Docracy</span>
        <Link to="/about">About</Link>
        <Link to="/pricing">Pricing</Link>
        <Link to="/docs">Docs</Link>
        <Link to="/free-templates">Free templates</Link>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
        <Link to="/imprint">Imprint</Link>
        <Link to="/uptime">Status</Link>
        <a href="https://github.com/docracy1/docracy-templates" target="_blank" rel="noreferrer">
          GitHub
        </a>
      </div>
    </footer>
  );
}
