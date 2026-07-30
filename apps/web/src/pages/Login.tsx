import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { adminLogin, requestMagicLink } from "../lib/api";
import { useT } from "../lib/i18n";

const TURNSTILE_SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;
const TURNSTILE_SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js";

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: Record<string, unknown>) => string;
      reset: (widgetId: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

let turnstileScriptPromise: Promise<void> | null = null;
function loadTurnstileScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (!turnstileScriptPromise) {
    turnstileScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = TURNSTILE_SCRIPT_SRC;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Failed to load Turnstile"));
      document.head.appendChild(script);
    });
  }
  return turnstileScriptPromise;
}

/** Renders nothing when VITE_TURNSTILE_SITE_KEY isn't set — matches the worker's
 *  TURNSTILE_SECRET_KEY graceful-degrade (lib/turnstile.ts), so login keeps working unchanged
 *  until both halves of the feature are configured together. `resetKey` re-solves the widget
 *  after a failed submit, since a Turnstile token is single-use. */
function TurnstileWidget({ onToken, resetKey }: { onToken: (token: string | null) => void; resetKey: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!TURNSTILE_SITE_KEY || !containerRef.current) return;
    let cancelled = false;
    loadTurnstileScript().then(() => {
      if (cancelled || !containerRef.current || !window.turnstile) return;
      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: TURNSTILE_SITE_KEY,
        callback: (token: string) => onToken(token),
        "expired-callback": () => onToken(null),
        "error-callback": () => onToken(null),
      });
    });
    return () => {
      cancelled = true;
      if (widgetIdRef.current && window.turnstile) window.turnstile.remove(widgetIdRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (resetKey > 0 && widgetIdRef.current && window.turnstile) window.turnstile.reset(widgetIdRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetKey]);

  if (!TURNSTILE_SITE_KEY) return null;
  return <div ref={containerRef} style={{ marginBottom: 12 }} />;
}

export default function Login() {
  const t = useT();
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref") ?? "";
  const nextParam = searchParams.get("next") ?? "";
  const utmMedium = searchParams.get("utm_medium") ?? "";
  const utmCampaign = searchParams.get("utm_campaign") ?? "";

  const intent =
    ref === "prepare-sent" || ref === "status-completed" || ref === "status-pending"
      ? "save-doc"
      : utmMedium === "preparer-lead" || utmCampaign === "preparer-done" || utmMedium === "completion"
        ? "save-doc"
        : ref === "prepare-signer-cap" || ref === "prepare-cap" || ref === "prepare-cc-cap"
          ? "upgrade"
          : "default";

  const headline =
    intent === "save-doc" ? t("login.titleSave") : intent === "upgrade" ? t("login.titleUpgrade") : t("login.title");
  const subcopy =
    intent === "save-doc" ? t("login.subSave") : intent === "upgrade" ? t("login.subUpgrade") : t("login.sub");
  const ctaLabel = intent === "save-doc" ? t("login.ctaSave") : t("login.cta");

  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const [showPasswordLogin, setShowPasswordLogin] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordSubmitting, setPasswordSubmitting] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await requestMagicLink(email, turnstileToken ?? undefined, nextParam || undefined);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
      setTurnstileToken(null);
      setTurnstileResetKey((k) => k + 1);
    } finally {
      setSubmitting(false);
    }
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
        {error && <p style={{ color: "var(--danger)", fontSize: 13 }}>{error}</p>}
        <button className="btn-primary" type="submit" disabled={submitting || (!!TURNSTILE_SITE_KEY && !turnstileToken)}>
          {submitting ? t("common.sending") : ctaLabel}
        </button>
      </form>

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
    </div>
  );
}
