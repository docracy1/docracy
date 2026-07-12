import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer style={{ borderTop: "1px solid var(--hairline)", marginTop: 64, padding: "24px 0" }}>
      <div
        className="container"
        style={{ padding: "0 24px", display: "flex", gap: 16, fontSize: 13, color: "var(--mute)" }}
      >
        <span>© {new Date().getFullYear()} Docracy</span>
        <Link to="/privacy">Privacy</Link>
        <Link to="/terms">Terms</Link>
      </div>
    </footer>
  );
}
