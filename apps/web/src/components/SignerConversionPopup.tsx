import { FormEvent, useEffect, useId, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "../lib/i18n";
import { track } from "../lib/track";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Post-sign conversion modal for anonymous signers — peak moment to turn a recipient into a
 * sender. Skipped by the parent for embed / white-label / logged-in sessions.
 */
export default function SignerConversionPopup({ onDismiss }: { onDismiss: () => void }) {
  const t = useT();
  const navigate = useNavigate();
  const titleId = useId();
  const emailId = useId();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [onDismiss]);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_RE.test(trimmed)) {
      setError(t("sign.conv.emailInvalid"));
      return;
    }
    setError(null);
    track("viral_cta_clicked", { source: "signer_conversion_popup" });
    const params = new URLSearchParams({
      email: trimmed,
      ref: "signer-completion",
      next: "/prepare",
      utm_medium: "signer",
      utm_campaign: "post-sign",
    });
    navigate(`/login?${params.toString()}`);
  };

  return (
    <div
      className="signer-conv-backdrop"
      role="presentation"
      onClick={onDismiss}
    >
      <div
        className="signer-conv-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="signer-conv-hero">
          <div className="signer-conv-hero-glow" aria-hidden />
          <img
            className="signer-conv-seal"
            src="/docracy-seal-icon.png"
            alt=""
            width={44}
            height={44}
          />
          <div className="signer-conv-check" aria-hidden>
            <svg viewBox="0 0 24 24" width="22" height="22" fill="none">
              <path
                d="M5 12.5 9.5 17 19 7.5"
                stroke="currentColor"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
          <p className="signer-conv-brand">{t("sign.conv.brand")}</p>
        </div>

        <div className="signer-conv-body">
          <h2 id={titleId} className="signer-conv-headline">
            {t("sign.conv.headline")}
          </h2>
          <p className="signer-conv-sub">{t("sign.conv.sub")}</p>
          <p className="signer-conv-copy">{t("sign.conv.body")}</p>

          <form className="signer-conv-form" onSubmit={onSubmit} noValidate>
            <label className="signer-conv-label" htmlFor={emailId}>
              {t("sign.conv.emailLabel")}
            </label>
            <input
              id={emailId}
              className="form-input signer-conv-input"
              type="email"
              autoComplete="email"
              inputMode="email"
              placeholder={t("sign.conv.emailPlaceholder")}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError(null);
              }}
              aria-invalid={error ? true : undefined}
            />
            {error && <p className="signer-conv-error">{error}</p>}
            <button type="submit" className="signer-conv-cta">
              {t("sign.conv.cta")}
            </button>
          </form>

          <button type="button" className="signer-conv-dismiss" onClick={onDismiss}>
            {t("sign.conv.dismiss")}
          </button>
        </div>
      </div>
    </div>
  );
}
