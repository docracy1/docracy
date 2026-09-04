import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { apiUrl, fetchStatus } from "../lib/api";
import { localizePath, useI18n } from "../lib/i18n";
import { signedPagePath } from "../lib/paidVault";
import { track } from "../lib/track";
import { useNoIndex } from "../lib/useNoIndex";
import type { StatusPayload } from "../lib/types";

/**
 * Forwardable receipt: signed PDF + optional sender checkout. Lives as long as the document TTL
 * (9 days free, tax-year vault on Paid). Anyone with the HMAC token can open it — same trust
 * model as /status/:token, without void controls.
 */
export default function Signed() {
  const { t, locale } = useI18n();
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useNoIndex();

  useEffect(() => {
    if (!token) return;
    fetchStatus(token)
      .then(setStatus)
      .catch((err) => setError(err.message));
  }, [token]);

  const copyLink = async () => {
    if (!token) return;
    const url = `${window.location.origin}${signedPagePath(token, locale)}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      track("viral_cta_clicked", { source: "signed_page_copy" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the address bar is still the URL */
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

  const payment = status.paymentRequest;
  const isCobro = status.kind === "cobro" || status.signers.length === 0;
  const cobroPaid = Boolean(status.cobroPaidAt);
  const title = status.title?.trim() || (isCobro ? t("signed.cobroUntitled") : t("signed.untitled"));
  const expiresLabel = status.expiresAt
    ? new Date(status.expiresAt).toLocaleDateString(locale === "es" ? "es-MX" : "en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : null;

  if (status.status !== "completed") {
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
          </div>
        )}
        <h1>{t("signed.notDone")}</h1>
        <p style={{ color: "var(--mute)" }}>{t("signed.notDoneBody")}</p>
        {token && (
          <Link to={`/status/${token}`} className="btn-secondary" style={{ textDecoration: "none" }}>
            {t("signed.viewStatus")}
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className="container" style={{ maxWidth: 560 }}>
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
      <h1>{isCobro ? t("signed.cobroTitle") : t("signed.title")}</h1>
      <p style={{ fontSize: 18, fontWeight: 600, marginTop: 0 }}>{title}</p>
      {expiresLabel && (
        <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>
          {t("signed.availableUntil", { date: expiresLabel })}
        </p>
      )}
      <div className="card">
        {!isCobro &&
          [...status.signers]
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <div key={s.order} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
                <span style={{ color: "var(--success)" }}>
                  {t("sign.signedBy", { name: s.name })}
                  {s.signedAt ? ` (${new Date(s.signedAt).toLocaleDateString()})` : ""}
                </span>
              </div>
            ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 16 }}>
          {token && (
            <a
              href={apiUrl(`/api/status/${token}/download`)}
              download
              className="btn-primary"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              {t("signed.download")}
            </a>
          )}
          {payment && !cobroPaid && (
            <a
              href={payment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("viral_cta_clicked", { source: "signed_page_pay" })}
            >
              {t("sign.payCta", { amount: payment.amount, currency: payment.currency })}
            </a>
          )}
          <button type="button" className="btn-secondary" onClick={copyLink}>
            {copied ? t("common.copied") : t("signed.copyLink")}
          </button>
        </div>
        {payment && cobroPaid && (
          <>
            <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 4, marginTop: 12 }}>{t("signed.cobroPaid")}</p>
            <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 0, marginTop: 0 }}>{t("signed.cobroPaidHint")}</p>
          </>
        )}
        {payment && !cobroPaid && (
          <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 0, marginTop: 12 }}>{t("sign.payHint")}</p>
        )}
      </div>
      {!status.brandLogoPath && !status.brandWorkspaceSlug && (
        <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 24 }}>
          {t("signed.forwardHint")}{" "}
          <Link to={localizePath("/prepare", locale)}>{t("signed.sendYours")}</Link>
        </p>
      )}
    </div>
  );
}
