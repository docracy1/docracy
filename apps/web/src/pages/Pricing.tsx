import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMe } from "../lib/api";
import { PLAN_ROWS, PlanCell } from "../lib/planRows";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";

export default function Pricing() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("pricing");

  /** null = logged out (show sticky dock); undefined = loading; Account = signed in (hide dock). */
  const [signedOut, setSignedOut] = useState<boolean | null>(null);

  useEffect(() => {
    fetchMe()
      .then(({ account }) => setSignedOut(!account))
      .catch(() => setSignedOut(true));
  }, []);

  return (
    <div className="pricing-page">
      <div className="container pricing-compare">
        <div className="plan-table-scroll">
          <table className="plan-table plan-table-pricing">
            <thead>
              <tr>
                <th scope="col" className="plan-feature-col" />
                <th scope="col">{t("pricing.free.name")}</th>
                <th scope="col" className="plan-col-paid">
                  <span className="plan-col-heading">{t("pricing.paid.name")}</span>
                  <span className="plan-popular">{t("pricing.bestValue")}</span>
                </th>
                <th scope="col">{t("pricing.ent.name")}</th>
              </tr>
            </thead>
            <tbody>
              {PLAN_ROWS.map((row) => (
                <tr key={row.labelKey}>
                  <td>{t(row.labelKey)}</td>
                  <td>
                    <PlanCell value={row.free} t={t} />
                  </td>
                  <td className="plan-col-paid">
                    <PlanCell value={row.paid} t={t} />
                  </td>
                  <td>
                    <PlanCell value={row.enterprise ?? row.paid} t={t} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Sticky prices for logged-out visitors only — signed-in users don't need the dock. */}
        {signedOut === true && (
          <div className="pricing-sticky-bar" aria-label={t("pricing.dockAria")}>
            <div className="pricing-sticky-spacer" aria-hidden="true" />
            <div className="pricing-sticky-col">
              <div className="pricing-sticky-name">{t("pricing.free.name")}</div>
              <div className="pricing-sticky-price">
                $0<span className="pricing-sticky-note">{t("pricing.free.note")}</span>
              </div>
              <Link to={localizePath("/prepare", locale)} className="btn-secondary pricing-sticky-cta">
                {t("pricing.free.cta")}
              </Link>
            </div>
            <div className="pricing-sticky-col is-paid">
              <div className="pricing-sticky-name">{t("pricing.paid.name")}</div>
              <div className="pricing-sticky-price">
                $10<span className="pricing-sticky-note">{t("pricing.paid.note")}</span>
              </div>
              <Link to="/login" className="btn-primary pricing-sticky-cta">
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
        )}
      </div>

      <section className="pricing-testimonial">
        <div className="container pricing-testimonial-inner">
          <img
            src="/testimonials/markus-huber.png"
            alt="Markus Huber"
            className="pricing-testimonial-photo"
            width={96}
            height={96}
          />
          <blockquote className="pricing-testimonial-quote">
            The price is great and I found it to be more intuitive than Docusign. I like the interface much
            better. This saves us huge amounts of time in getting contracts signed.
          </blockquote>
          <div className="pricing-testimonial-by">
            <strong>Markus Huber</strong>
          </div>
        </div>
      </section>

      <div className="container">
        <p className="pricing-disclaimer">{t("pricing.disclaimer")}</p>
      </div>
    </div>
  );
}
