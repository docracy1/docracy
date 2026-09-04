import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  cookieConsentPending,
  hasAnalyticsConsent,
  loadClarity,
  loadGa,
  setCookieConsent,
} from "../lib/cookieConsent";
import { useT } from "../lib/i18n";

/** Paths where a bottom banner would interrupt signing / deep flows. */
function shouldHideBanner(pathname: string): boolean {
  return (
    pathname.startsWith("/sign/") ||
    pathname.startsWith("/embed/") ||
    pathname.startsWith("/status/") ||
    pathname.startsWith("/signed/") ||
    pathname.startsWith("/es/firmado/") ||
    pathname.startsWith("/income-proof/") ||
    pathname.startsWith("/es/constancia/") ||
    pathname.startsWith("/1099-season/") ||
    pathname.startsWith("/es/temporada-1099/") ||
    pathname.startsWith("/auth/")
  );
}

/**
 * Chasa-style bottom bar on the marketing/start experience: Privacy link + Decline / Accept.
 * Gates Microsoft Clarity (and any future analytics) until Accept.
 */
export default function CookieConsentBanner() {
  const t = useT();
  const { pathname } = useLocation();
  const [hidden, setHidden] = useState(() => !cookieConsentPending() || hasAnalyticsConsent());

  useEffect(() => {
    if (hasAnalyticsConsent()) {
      loadClarity();
      loadGa();
    }
  }, []);

  if (hidden || shouldHideBanner(pathname)) return null;

  return (
    <div className="cookie-consent-banner" role="dialog" aria-modal="true" aria-label={t("consent.aria")}>
      <div className="cookie-consent-inner">
        <p>
          {t("consent.body")}{" "}
          <Link to="/privacy">{t("consent.privacy")}</Link>
          {" · "}
          <Link to="/terms">{t("consent.terms")}</Link>.
        </p>
        <div className="cookie-consent-actions">
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-decline"
            onClick={() => {
              setCookieConsent("declined");
              setHidden(true);
            }}
          >
            {t("consent.decline")}
          </button>
          <button
            type="button"
            className="cookie-consent-btn cookie-consent-accept"
            onClick={() => {
              setCookieConsent("accepted");
              loadClarity();
              loadGa();
              setHidden(true);
            }}
          >
            {t("consent.accept")}
          </button>
        </div>
      </div>
    </div>
  );
}
