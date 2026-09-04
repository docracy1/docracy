import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { SignerAttachmentsList } from "../components/SignerAttachmentsList";
import { apiUrl, fetchMe, fetchStatus, statusAttachmentDownloadUrl, voidDocument } from "../lib/api";
import { hasPendingClaimForDoc } from "../lib/pendingClaim";
import { signedPagePath } from "../lib/paidVault";
import { track } from "../lib/track";
import { useI18n } from "../lib/i18n";
import { useNoIndex } from "../lib/useNoIndex";
import type { StatusPayload } from "../lib/types";

export default function Status() {
  const { t, locale } = useI18n();
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [voiding, setVoiding] = useState(false);
  const [voidError, setVoidError] = useState<string | null>(null);
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [copiedSigned, setCopiedSigned] = useState(false);

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
    const reason = window.prompt(t("status.cancelPrompt"));
    if (reason === null) return;
    setVoiding(true);
    setVoidError(null);
    try {
      const result = await voidDocument(token, reason.trim() || undefined);
      setStatus(result.status);
    } catch (err) {
      setVoidError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setVoiding(false);
    }
  };

  if (error) {
    return (
      <div className="container">
        <h1>{t("common.notAvailable")}</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="container">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  const headline =
    status.status === "completed"
      ? t("status.fullySigned")
      : status.status === "voided"
        ? status.voidedBy === "decline"
          ? t("sign.declinedDoc")
          : t("sign.cancelled")
        : t("status.inProgress");

  // White-label workspaces pay to hide Docracy marketing on status pages.
  // Claim CTA only when this browser created the anonymous send (pending claim matches).
  const canClaimThisDoc = hasPendingClaimForDoc(status.docId);
  const showConversion =
    loggedIn === false && !status.brandLogoPath && !status.brandWorkspaceSlug && canClaimThisDoc;
  const canVoid = status.canVoid !== false;

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
        <p style={{ color: "var(--mute)", fontSize: 14, marginTop: 0 }}>{t("sign.reason", { reason: status.voidReason })}</p>
      )}
      <div className="card">
        {[...status.signers]
          .sort((a, b) => a.order - b.order)
          .map((s) => (
            <div key={s.order} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
              {s.status === "signed" ? (
                <span style={{ color: "var(--success)" }}>
                  {t("sign.signedBy", { name: s.name })}
                  {s.signedAt ? ` (${new Date(s.signedAt).toLocaleDateString()})` : ""}
                </span>
              ) : s.status === "declined" ? (
                <span style={{ color: "var(--danger)" }}>
                  {t("sign.declinedBy", { name: s.name })}
                  {s.declinedAt ? ` (${new Date(s.declinedAt).toLocaleDateString()})` : ""}
                </span>
              ) : (
                <span style={{ color: "var(--body)" }}>{t("sign.pending", { name: s.name })}</span>
              )}
            </div>
          ))}
        {(status.ccRecipients ?? []).map((cc, i) => (
          <div key={`cc-${i}`} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
            <span style={{ color: "var(--mute)" }}>
              {t("status.viewer", { info: cc.name ? `${cc.name} / ${cc.email}` : cc.email })}
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
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
            <a
              href={apiUrl(`/api/status/${token}/download`)}
              download
              className="btn-primary"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              {t("status.download")}
            </a>
            {status.paymentRequest && !status.cobroPaidAt && (
              <a
                href={status.paymentRequest.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("viral_cta_clicked", { source: "status_pay" })}
              >
                {t("sign.payCta", {
                  amount: status.paymentRequest.amount,
                  currency: status.paymentRequest.currency,
                })}
              </a>
            )}
            {token && (
              <>
                <Link
                  to={signedPagePath(token, locale)}
                  className="btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  {t("status.openSignedPage")}
                </Link>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={async () => {
                    const url = `${window.location.origin}${signedPagePath(token, locale)}`;
                    try {
                      await navigator.clipboard.writeText(url);
                      setCopiedSigned(true);
                      track("viral_cta_clicked", { source: "status_copy_signed" });
                      window.setTimeout(() => setCopiedSigned(false), 2000);
                    } catch {
                      /* clipboard blocked */
                    }
                  }}
                >
                  {copiedSigned ? t("common.copied") : t("status.copySignedLink")}
                </button>
              </>
            )}
          </div>
        )}
        {status.status === "completed" && status.paymentRequest && status.cobroPaidAt && (
          <>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, marginTop: 12 }}>{t("signed.cobroPaid")}</p>
            <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 0, marginTop: 0 }}>{t("signed.cobroPaidHint")}</p>
          </>
        )}
        {status.status === "pending" && token && canVoid && (
          <div style={{ marginTop: 16 }}>
            {voidError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{voidError}</p>}
            <button className="btn-secondary" disabled={voiding} onClick={onCancel}>
              {voiding ? t("status.cancelling") : t("status.cancelDoc")}
            </button>
          </div>
        )}
      </div>

      {showConversion && status.status === "completed" && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>{t("status.keepPdfs")}</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            {t("status.keepPdfsSub")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              to={`/login?ref=status-completed&next=${encodeURIComponent("/dashboard")}`}
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              {t("status.createAccount")}
            </Link>
            <Link
              to="/pricing?ref=status-completed"
              className="btn-secondary"
              style={{ textDecoration: "none" }}
              onClick={() => track("upgrade_clicked", { source: "status_completed" })}
            >
              {t("status.seePaidPlans")}
            </Link>
          </div>
        </div>
      )}

      {showConversion && status.status === "pending" && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>{t("status.dontLoseLink")}</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            {t("status.dontLoseLinkSub")}
          </p>
          <Link
            to={`/login?ref=status-pending&next=${encodeURIComponent("/dashboard")}`}
            className="btn-primary"
            style={{ textDecoration: "none" }}
          >
            {t("status.createAccount")}
          </Link>
        </div>
      )}
    </div>
  );
}
