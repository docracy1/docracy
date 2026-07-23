import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";

/** Client-side catch-all for a genuinely unmatched URL. Cloudflare Pages' SPA fallback means this
 *  still responds with an HTTP 200 status (not a true 404) — there's no safe way to make that a
 *  real 404 without risking breaking legitimate dynamic app routes like /sign/:token and
 *  /status/:token, which also have no matching static asset and rely on the same fallback. This
 *  at least fixes the actual UX problem: a bad link no longer silently shows the full homepage. */
export default function NotFound() {
  usePageMeta("Page not found — Docracy", "This page doesn't exist.");

  return (
    <div className="container" style={{ textAlign: "center", padding: "80px 24px" }}>
      <h1 style={{ fontSize: 28 }}>Page not found</h1>
      <p style={{ color: "var(--mute)", marginBottom: 24 }}>
        There's nothing here — the link might be old, or mistyped.
      </p>
      <Link to="/" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
        Back to homepage
      </Link>
    </div>
  );
}
