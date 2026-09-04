import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMe } from "../lib/api";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { savePendingClaim } from "../lib/pendingClaim";
import {
  nextPacketTemplate,
  packetPreparePath,
  US_CONTRACTOR_PACKET_SLUG,
} from "../lib/contractorPacket";
import { signedPagePath } from "../lib/paidVault";
import { track } from "../lib/track";

/**
 * Peak conversion moment for anonymous senders: document just left, status link in hand.
 * Logged-in users already have an account — point them at the dashboard / next send.
 * Anonymous → create account (claim this send into dashboard) + soft paid nudge + share loop.
 */
export default function PrepareSent() {
  const t = useT();
  const { locale } = useI18n();
  const { state } = useLocation() as {
    state: {
      docId: string;
      statusToken: string;
      claimToken?: string;
      signingMode?: "sequential" | "parallel";
      packetSlug?: string;
      sentTemplateSlug?: string;
    } | null;
  };
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [copied, setCopied] = useState<"status" | "share" | "signed" | null>(null);

  useEffect(() => {
    if (state?.docId && state.claimToken) {
      savePendingClaim(state.docId, state.claimToken);
    }
  }, [state?.docId, state?.claimToken]);

  useEffect(() => {
    fetchMe()
      .then(({ account }) => setLoggedIn(!!account))
      .catch(() => setLoggedIn(false));
  }, []);

  if (!state) {
    return (
      <div className="container">
        <h1>{t("sent.titleFallback")}</h1>
        <p>{t("sent.checkEmail")}</p>
        <Link to="/" className="btn-secondary" style={{ textDecoration: "none" }}>
          {t("common.backHome")}
        </Link>
      </div>
    );
  }

  const statusUrl = `${window.location.origin}/status/${state.statusToken}`;
  const signedUrl = `${window.location.origin}${signedPagePath(state.statusToken, locale)}`;
  const shareBlurb = t("sent.shareBlurb");
  // After signup, land on dashboard so the pending claim can redeem into history.
  const loginNext = encodeURIComponent("/dashboard");

  const copyText = async (kind: "status" | "share" | "signed", text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(kind);
      track("viral_cta_clicked", {
        source:
          kind === "status" ? "prepare_sent_copy_status" : kind === "signed" ? "prepare_sent_copy_signed" : "prepare_sent_share",
      });
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      // Clipboard blocked — fall back to selecting nothing; status URL is still visible as a link.
    }
  };

  return (
    <div className="container">
      <h1>{t("sent.title")}</h1>
      <p>{state.signingMode === "parallel" ? t("sent.parallel") : t("sent.sequential")}</p>
      <div className="card">
        <p style={{ marginBottom: 8 }}>{t("sent.bookmark")}</p>
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
      <div className="card" style={{ marginTop: 16 }}>
        <p style={{ marginBottom: 8 }}>{t("sent.signedPage")}</p>
        <Link to={signedPagePath(state.statusToken, locale)}>{signedUrl}</Link>
        <div style={{ marginTop: 12 }}>
          <button type="button" className="btn-secondary" onClick={() => copyText("signed", signedUrl)}>
            {copied === "signed" ? t("common.copied") : t("sent.copySigned")}
          </button>
        </div>
      </div>

      {state.packetSlug === US_CONTRACTOR_PACKET_SLUG &&
        (() => {
          const next = nextPacketTemplate(state.sentTemplateSlug);
          if (!next) {
            return (
              <div className="card" style={{ marginTop: 20 }}>
                <p style={{ marginBottom: 8, fontWeight: 600 }}>{t("packet.kitDone")}</p>
                <p style={{ fontSize: 14, color: "var(--mute)", marginBottom: 12 }}>{t("packet.kitDoneSub")}</p>
                <Link
                  to={localizePath("/packets/us-contractor", locale)}
                  className="btn-secondary"
                  style={{ textDecoration: "none" }}
                >
                  {t("packet.backToKit")}
                </Link>
              </div>
            );
          }
          return (
            <div className="card" style={{ marginTop: 20, borderColor: "var(--primary)" }}>
              <p style={{ marginBottom: 8, fontWeight: 600 }}>{t("packet.nextTitle")}</p>
              <p style={{ fontSize: 14, color: "var(--mute)", marginBottom: 12 }}>{t(`tpl.${next}.name`)}</p>
              <Link
                to={packetPreparePath(next, locale)}
                className="btn-primary"
                style={{ textDecoration: "none" }}
              >
                {t("packet.nextCta")}
              </Link>
            </div>
          );
        })()}

      {loggedIn === false && state.claimToken && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>{t("sent.saveAccount")}</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            {t("sent.saveAccountSub")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              to={`/login?ref=prepare-sent&next=${loginNext}`}
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              {t("status.createAccount")}
            </Link>
            <Link
              to={`${localizePath("/pricing", locale)}?ref=prepare-sent`}
              className="btn-secondary"
              style={{ textDecoration: "none" }}
              onClick={() => track("upgrade_clicked", { source: "prepare_sent_pricing" })}
            >
              {t("status.seePaidPlans")}
            </Link>
          </div>
        </div>
      )}

      {loggedIn === false && !state.claimToken && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ marginBottom: 8, fontWeight: 600 }}>{t("sent.saveAccount")}</p>
          <p style={{ marginBottom: 14, color: "var(--mute)", fontSize: 14 }}>
            {t("sent.saveAccountSubFuture")}
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <Link
              to={`/login?ref=prepare-sent&next=${loginNext}`}
              className="btn-primary"
              style={{ textDecoration: "none" }}
            >
              {t("status.createAccount")}
            </Link>
            <Link
              to={`${localizePath("/pricing", locale)}?ref=prepare-sent`}
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
          <Link to={localizePath("/prepare", locale)} className="btn-primary" style={{ textDecoration: "none" }}>
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
