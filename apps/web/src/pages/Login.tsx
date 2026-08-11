import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import TurnstileWidget, { turnstileRequired } from "../components/TurnstileWidget";
import { adminLogin, requestMagicLink } from "../lib/api";
import { useI18n } from "../lib/i18n";

export default function Login() {
  const { t, locale } = useI18n();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const nextParam = searchParams.get("next") ?? "";
  const utmMedium = searchParams.get("utm_medium") ?? "";
  const utmCampaign = searchParams.get("utm_campaign") ?? "";
  const oauthError = searchParams.get("error");
  const emailParam = searchParams.get("email") ?? "";

  const intent =
    ref === "prepare-sent" ||
    ref === "status-completed" ||
    ref === "status-pending" ||
    ref === "signer-completion"
      ? "save-doc"
      : utmMedium === "preparer-lead" ||
          utmCampaign === "preparer-done" ||
          utmMedium === "completion" ||
          utmMedium === "signer"
        ? "save-doc"
        : ref === "prepare-signer-cap" || ref === "prepare-cap" || ref === "prepare-cc-cap"
          ? "upgrade"
          : "default";

  const headline =
    intent === "save-doc" ? t("login.titleSave") : intent === "upgrade" ? t("login.titleUpgrade") : t("login.title");
  const subcopy =
    intent === "save-doc" ? t("login.subSave") : intent === "upgrade" ? t("login.subUpgrade") : t("login.sub");
  const ctaLabel = intent === "save-doc" ? t("login.ctaSave") : t("login.cta");

  const [email, setEmail] = useState(emailParam);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(oauthError);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);
  const [pendingSubmit, setPendingSubmit] = useState(false);

  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Password login is admin-only (ADMIN_EMAILS / rl@relacon.at). Hide the toggle unless that
  // address is typed — everyone else only sees magic-link + Google.
  const isAdminEmail = email.trim().toLowerCase() === "rl@relacon.at";

  useEffect(() => {
    if (!isAdminEmail) {
      setShowPasswordLogin(false);
      setPassword("");
      setPasswordError(null);
    }
  }, [isAdminEmail]);

  const submitLogin = async (targetEmail: string, token: string | null) => {
    setSubmitting(true);
    setError(null);
    try {
      await requestMagicLink(targetEmail, token ?? undefined, nextParam || undefined, locale);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
    } finally {
      setSubmitting(false);
      setPendingSubmit(false);
    }
  };

  // Turnstile mounts on page load but on a slow network may not have resolved by the time the
  // user submits — the button used to just stay disabled through that window, so the click had no
  // visible effect and a returning visitor would assume the form was broken. Queue the intent and
  // fire it the moment a token lands instead.
  useEffect(() => {
    if (pendingSubmit && turnstileToken) {
      submitLogin(email, turnstileToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [turnstileToken, pendingSubmit]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (turnstileRequired() && !turnstileToken) {
      setError(null);
      setPendingSubmit(true);
      return;
    }
    await submitLogin(email, turnstileToken);
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordSubmitting(true);
    setPasswordError(null);
    try {
      await adminLogin(email, password);
      window.location.href = "/dashboard";
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setPasswordSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="container">
        <h1>{t("login.sentTitle")}</h1>
        <p>{t("login.sentBody", { email })}</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{headline}</h1>
      <p>{subcopy}</p>

      {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}

      <a
        href={`/api/auth/google${nextParam ? `?next=${encodeURIComponent(nextParam)}` : ""}`}
        className="btn-secondary"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 10,
          textDecoration: "none",
          maxWidth: 360,
        }}
      >
        <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
          <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.5-.4-3.5z" />
          <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.1 19 13 24 13c3.1 0 5.8 1.1 8 3l5.7-5.7C34.2 6.1 29.4 4 24 4 16.1 4 9.2 8.5 6.3 14.7z" />
          <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.3 35.3 26.8 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.1 39.6 16 44 24 44z" />
          <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1.1 3.1-3.5 5.5-6.5 6.6l.1.1 6.2 5.2C36.9 41.4 44 36 44 24c0-1.3-.1-2.5-.4-3.5z" />
        </svg>
        {t("login.google")}
      </a>

      <div style={{ maxWidth: 360, margin: "16px 0", display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
        <span style={{ fontSize: 12, color: "var(--mute)" }}>{t("login.orEmail")}</span>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
      </div>

      <form onSubmit={onSubmit}>
        <input
          className="form-input"
          type="email"
          placeholder={t("login.placeholder")}
          aria-label={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          style={{ width: "100%", maxWidth: 360, marginBottom: 12, display: "block" }}
        />
        <TurnstileWidget onToken={setTurnstileToken} resetKey={turnstileResetKey} />
        <button className="btn-primary" type="submit" disabled={submitting || pendingSubmit}>
          {submitting ? t("common.sending") : pendingSubmit ? t("common.verifying") : ctaLabel}
        </button>
      </form>

      {isAdminEmail && (
        <>
          <button
            type="button"
            onClick={() => setShowPasswordLogin((v) => !v)}
            style={{
              background: "none",
              border: "none",
              padding: 0,
              marginTop: 16,
              fontSize: 13,
              color: "var(--mute)",
              textDecoration: "underline",
              cursor: "pointer",
              display: "block",
            }}
          >
            {showPasswordLogin ? t("login.passwordHide") : t("login.passwordToggle")}
          </button>

          {showPasswordLogin && (
            <form onSubmit={onPasswordSubmit} style={{ marginTop: 12 }}>
              <input
                className="form-input"
                type="password"
                placeholder={t("login.password")}
                aria-label={t("login.password")}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={{ width: "100%", maxWidth: 360, marginBottom: 12, display: "block" }}
              />
              {passwordError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{passwordError}</p>}
              <button className="btn-secondary" type="submit" disabled={passwordSubmitting}>
                {passwordSubmitting ? t("common.signingIn") : t("login.title")}
              </button>
            </form>
          )}
        </>
      )}
    </div>
  );
}
