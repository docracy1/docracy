import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { SignerAttachmentsList } from "../components/SignerAttachmentsList";
import { apiUrl, fetchStatus, statusAttachmentDownloadUrl, voidDocument } from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";
import type { StatusPayload } from "../lib/types";

export default function Status() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);

  useNoIndex();

  useEffect(() => {
    if (!token) return;
    fetchStatus(token)
      .then(setStatus)
      .catch((err) => setError(err.message));
  }, [token]);

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
    </div>
  );
}
