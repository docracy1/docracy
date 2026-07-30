import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMe } from "../lib/api";
import { useT } from "../lib/i18n";
import { track } from "../lib/track";

/**
 * Peak conversion moment for anonymous senders: document just left, status link in hand.
 * Logged-in users already have an account — point them at the dashboard / next send.
 * Anonymous → create account (history) + soft paid nudge + share loop.
 */
export default function PrepareSent() {
  const t = useT();
  const { state } = useLocation() as {
    state: { docId: string; statusToken: string; signingMode?: "sequential" | "parallel" } | null;
  };
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<"status" | "share" | null>(null);

  useEffect(() => {
    fetchMe()
      .then(({ account }) => setLoggedIn(!!account))
      .catch(() => setLoggedIn(false));
  }, []);

  if (!state) {
    return (
      <div className="container">
        <h1>{t("sent.titleFallback")}</h1>
        <p>Your document was created. Check your email for status updates.</p>
        <Link to="/" className="btn-secondary" style={{ textDecoration: "none" }}>
          {t("common.backHome")}
        </Link>
      </div>
    );
  }

  const statusUrl = `${window.location.origin}/status/${state.statusToken}`;
  const shareBlurb = `I just sent a document for signature with Docracy (free, no signup). Try it: https://docracy.io/try`;

  const copyText = async (kind: "status" | "share", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      track("viral_cta_clicked", { source: kind === "status" ? "prepare_sent_copy_status" : "prepare_sent_share" });
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked — fall back to selecting nothing; status URL is still visible as a link.
    }
  };

  return (
    <div className="container">
      <h1>{t("sent.title")}</h1>
      <p>
        {state.signingMode === "parallel"
          ? "Every signer has been emailed their link — they can sign in any order."
          : "The first signer has been emailed their link. Everyone else in the chain will be notified in turn."}
      </p>
      <div className="card">
        <p style={{ marginBottom: 8 }}>Bookmark this link to check progress any time:</p>
        <Link to={`/status/${state.statusToken}`}>{statusUrl}</Link>
        <div style={{ marginTop: 12, display: "flex", flexWrap: "wrap", gap: 8 }}>
          <button type="button" className="btn-secondary" onClick={() => copyText("status", statusUrl)}>
            {copied === "status" ? t("common.copied") : t("sent.copyStatus")}
          </button>
          <button type="button" className="btn-secondary" onClick={() => copyText("share", shareBlurb)}>
            {copied === "share" ? t("common.copied") : t("sent.shareColleague")}
          </button>
        </div>
      </div>

      {loggedIn === false && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>Save this send to an account</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            Free accounts keep every document you send in one place — no password, just a magic link.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link to="/login?ref=prepare-sent" className="btn-primary" style={{ textDecoration: "none" }}>
              {t("status.createAccount")}
            </Link>
            <Link
              to="/pricing?ref=prepare-sent"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
              onClick={() => track("upgrade_clicked", { source: "prepare_sent_pricing" })}
            >
              {t("status.seePaidPlans")}
            </Link>
          </div>
        </div>
      )}

      {loggedIn === true && (
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 10 }}>
          <Link to="/prepare" className="btn-primary" style={{ textDecoration: "none" }}>
            {t("sent.sendAnother")}
          </Link>
          <Link to="/dashboard" className="btn-secondary" style={{ textDecoration: "none" }}>
            {t("common.goDashboard")}
          </Link>
        </div>
      )}
    </div>
  );
}
