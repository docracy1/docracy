import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { fetchMe } from "../lib/api";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { track } from "../lib/track";

/** Product / auth flows where a pricing dock would get in the way. */
function shouldHideDock(pathname: string): boolean {
  if (pathname.startsWith("/sign/") || pathname.startsWith("/status/") || pathname.startsWith("/embed/")) {
    return true;
  }
  const prefixes = [
    "/prepare",
    "/es/preparar",
    "/dashboard",
    "/login",
    "/auth",
    "/bulk-send",
    "/admin",
    "/team",
    "/pricing",
    "/es/precios",
    "/free-templates",
    "/es/plantillas-gratis",
  ];
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/**
 * Chasa-style fixed mobile plan rows — always visible on marketing pages while logged out.
 * Hidden when signed in, on desktop, and on product/auth/pricing routes (pricing has its own bar).
 */
export default function MobilePricingBar() {
  const t = useT();
  const { locale } = useI18n();
  const location = useLocation();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchMe()
      .then(({ account }) => {
        if (!cancelled) setSignedIn(!!account);
      })
      .catch(() => {
        if (!cancelled) setSignedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [location.pathname]);

  if (signedIn) return null;
  if (shouldHideDock(location.pathname)) return null;

  const prepareTo = localizePath("/prepare", locale);

  return (
    <div className="mobile-pricing-dock" aria-label={t("pricing.dockAria")}>
      <div className="pricing-sticky-bar mobile-pricing-dock-bar">
        <div className="pricing-sticky-col">
          <div className="pricing-sticky-name">{t("pricing.free.name")}</div>
          <div className="pricing-sticky-price">
            $0<span className="pricing-sticky-note">{t("pricing.free.note")}</span>
          </div>
          <Link
            to={prepareTo}
            className="btn-secondary pricing-sticky-cta"
            onClick={() => track("landingpage_cta_clicked", { source: "mobile_pricing_free" })}
          >
            {t("pricing.free.cta")}
          </Link>
        </div>
        <div className="pricing-sticky-col is-paid">
          <div className="pricing-sticky-name">{t("pricing.paid.name")}</div>
          <div className="pricing-sticky-price">
            $10<span className="pricing-sticky-note">{t("pricing.paid.note")}</span>
          </div>
          <Link
            to="/login"
            className="btn-primary pricing-sticky-cta"
            onClick={() => track("landingpage_cta_clicked", { source: "mobile_pricing_paid" })}
          >
            {t("pricing.paid.ctaGet")}
          </Link>
        </div>
        <div className="pricing-sticky-col">
          <div className="pricing-sticky-name">{t("pricing.ent.name")}</div>
          <div className="pricing-sticky-price">
            {t("pricing.ent.price")}
            <span className="pricing-sticky-note">sales@docracy.io</span>
          </div>
          <a href="mailto:sales@docracy.io" className="btn-secondary pricing-sticky-cta">
            {t("pricing.ent.cta")}
          </a>
        </div>
      </div>
    </div>
  );
}
