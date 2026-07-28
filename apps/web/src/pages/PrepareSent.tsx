import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMe } from "../lib/api";
import { track } from "../lib/track";

/**
 * Peak conversion moment for anonymous senders: document just left, status link in hand.
 * Logged-in users already have an account — point them at the dashboard / next send.
 * Anonymous → create account (history) + soft paid nudge.
 */
export default function PrepareSent() {
  const { state } = useLocation() as {
    state: { docId: string; statusToken: string; signingMode?: "sequential" | "parallel" } | null;
  };
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    fetchMe()
      .then(({ account }) => setLoggedIn(!!account))
      .catch(() => setLoggedIn(false));
  }, []);

  if (!state) {
    return (
      <div className="container">
        <h1>Sent</h1>
        <p>Your document was created. Check your email for status updates.</p>
        <Link to="/" className="btn-secondary" style={{ textDecoration: "none" }}>
          Back home
        </Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>On its way</h1>
      <p>
        {state.signingMode === "parallel"
          ? "Every signer has been emailed their link — they can sign in any order."
          : "The first signer has been emailed their link. Everyone else in the chain will be notified in turn."}
      </p>
      <div className="card">
        <p style={{ marginBottom: 8 }}>Bookmark this link to check progress any time:</p>
        <Link to={`/status/${state.statusToken}`}>
          {window.location.origin}/status/{state.statusToken}
        </Link>
      </div>

      {loggedIn === false && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>Save this send to an account</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            Free accounts keep every document you send in one place — no password, just a magic link.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link to="/login?ref=prepare-sent" className="btn-primary" style={{ textDecoration: "none" }}>
              Create a free account
            </Link>
            <Link
              to="/pricing?ref=prepare-sent"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
              onClick={() => track("upgrade_clicked", { source: "prepare_sent_pricing" })}
            >
              See paid plans
            </Link>
          </div>
        </div>
      )}

      {loggedIn === true && (
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link to="/prepare" className="btn-primary" style={{ textDecoration: "none" }}>
            Send another
          </Link>
          <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: "none" }}>
            Go to dashboard
          </Link>
        </div>
      )}
    </div>
  );
}
