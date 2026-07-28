import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SignerAttachmentsList } from "../components/SignerAttachmentsList";
import { apiUrl, fetchMe, fetchStatus, statusAttachmentDownloadUrl, voidDocument } from "../lib/api";
import { track } from "../lib/track";
import { useNoIndex } from "../lib/useNoIndex";
import type { StatusPayload } from "../lib/types";

export default function Status() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useNoIndex();

  useEffect(() => {
    if (!token) return;
    fetchStatus(token)
      .then(setStatus)
      .catch((err) => setError(err.message));
  }, [token]);

  useEffect(() => {
    fetchMe()
      .then(({ account }) => setLoggedIn(!!account))
      .catch(() => setLoggedIn(false));
  }, []);

  const onCancel = async () => {
    if (!token) return;
    const reason = window.prompt("Optional reason for cancelling (leave blank to skip):");
    if (reason === null) return;
    setVoiding(true);
    setVoidError(null);
    try {
      const result = await voidDocument(token, reason.trim() || undefined);
      setStatus(result.status);
    } catch (err) {
      setVoidError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setVoiding(false);
    }
  };

  if (error) {
    return (
      <div className="container">
        <h1>Not available</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container">
        <p>Loading…</p>
      </div>
    );
  }

  const headline =
    status.status === "completed"
      ? "Fully signed"
      : status.status === "voided"
        ? status.voidedBy === "decline"
          ? "Document declined"
          : "Document cancelled"
        : "Signing in progress";

  // White-label workspaces pay to hide Docracy marketing on status pages.
  const showConversion = loggedIn === false && !status.brandLogoPath && !status.brandWorkspaceSlug;

  return (
    <div className="container">
      {(status.brandLogoPath || status.brandWorkspaceSlug) && (
        <div style={{ marginBottom: 16 }}>
          {status.brandLogoPath && (
            <img
              src={apiUrl(status.brandLogoPath)}
              alt=""
              style={{ maxHeight: 48, maxWidth: 220, display: "block" }}
            />
          )}
          {status.brandWorkspaceSlug && (
            <div style={{ fontSize: 13, color: "var(--mute)", marginTop: status.brandLogoPath ? 4 : 0 }}>
              {status.brandWorkspaceSlug}
            </div>
          )}
        </div>
      )}
      <h1>{headline}</h1>
      {status.status === "voided" && status.voidReason && (
        <p style={{ color: "var(--mute)", fontSize: 14, marginTop: 0 }}>Reason: {status.voidReason}</p>
      )}
      <div className="card">
        {[...status.signers]
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <div key={s.order} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
              {s.status === "signed" ? (
                <span style={{ color: "var(--success)" }}>
                  Signed by: {s.name} ✓ ({new Date(s.signedAt!).toLocaleDateString()})
                </span>
              ) : s.status === "declined" ? (
                <span style={{ color: "var(--danger)" }}>
                  Declined: {s.name}
                  {s.declinedAt ? ` (${new Date(s.declinedAt).toLocaleDateString()})` : ""}
                </span>
              ) : (
                <span style={{ color: "var(--body)" }}>Pending: {s.name}</span>
              )}
            </div>
          ))}
        {(status.ccRecipients ?? []).map((cc, i) => (
          <div key={`cc-${i}`} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
            <span style={{ color: "var(--mute)" }}>
              Viewer: {cc.name ? `${cc.name} / ${cc.email}` : cc.email}
            </span>
          </div>
        ))}
        {token && status.signerAttachmentGroups && status.signerAttachmentGroups.length > 0 && (
          <SignerAttachmentsList
            groups={status.signerAttachmentGroups}
            buildDownloadUrl={(order, id) => statusAttachmentDownloadUrl(token, order, id)}
          />
        )}
        {status.status === "completed" && (
          <a
            href={apiUrl(`/api/status/${token}/download`)}
            download
            className="btn-primary"
            style={{ display: "inline-block", textDecoration: "none", marginTop: 16 }}
          >
            Download signed PDF
          </a>
        )}
        {status.status === "pending" && token && (
          <div style={{ marginTop: 16 }}>
            {voidError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{voidError}</p>}
            <button className="btn-secondary" disabled={voiding} onClick={onCancel}>
              {voiding ? "Cancelling…" : "Cancel document"}
            </button>
          </div>
        )}
      </div>

      {showConversion && status.status === "completed" && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>Keep every signed PDF in one place</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            Free accounts save document history. Paid unlocks templates, unlimited signers, and team seats —
            $10/month.
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link to="/login?ref=status-completed" className="btn-primary" style={{ textDecoration: "none" }}>
              Create a free account
            </Link>
            <Link
              to="/pricing?ref=status-completed"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
              onClick={() => track("upgrade_clicked", { source: "status_completed" })}
            >
              See paid plans
            </Link>
          </div>
        </div>
      )}

      {showConversion && status.status === "pending" && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>Don&apos;t lose this status link</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            Create a free account so every document you send lives in one dashboard — no password needed.
          </p>
          <Link to="/login?ref=status-pending" className="btn-primary" style={{ textDecoration: "none" }}>
            Create a free account
          </Link>
        </div>
      )}
    </div>
  );
}
