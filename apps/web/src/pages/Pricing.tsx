import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMe, startCheckout, type Account } from "../lib/api";
import { PLAN_ROWS, PlanCell } from "../lib/planRows";
import { track } from "../lib/track";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";

export default function Pricing() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("pricing");

  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);

  useEffect(() => {
    fetchMe()
      .then(({ account: a }) => setAccount(a))
      .catch(() => setAccount(null));
  }, []);

  const onUpgrade = async () => {
    track("upgrade_clicked", { source: "pricing_page" });
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : t("common.error"));
      setUpgrading(false);
    }
  };

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
                  {t("pricing.paid.name")}
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

        <div className="pricing-sticky-bar" aria-label="Plan prices">
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
            <PaidCta account={account} upgrading={upgrading} upgradeError={upgradeError} onUpgrade={onUpgrade} />
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

function PaidCta({
  account,
  upgrading,
  upgradeError,
  onUpgrade,
}: {
  account: Account | null | undefined;
  upgrading: boolean;
  upgradeError: string | null;
  onUpgrade: () => void;
}) {
  const t = useT();

  if (account === undefined) {
    return (
      <button className="btn-primary pricing-sticky-cta" disabled>
        …
      </button>
    );
  }
  if (account?.isPaid) {
    return (
      <Link to="/dashboard" className="btn-primary pricing-sticky-cta">
        {t("pricing.goDashboard")}
      </Link>
    );
  }
  if (account) {
    return (
      <div className="pricing-sticky-cta-stack">
        <button className="btn-primary pricing-sticky-cta" onClick={onUpgrade} disabled={upgrading}>
          {upgrading ? t("pricing.paid.redirecting") : t("pricing.paid.ctaUpgrade")}
        </button>
        {upgradeError && <p className="pricing-sticky-error">{upgradeError}</p>}
      </div>
    );
  }
  return (
    <Link to="/login" className="btn-primary pricing-sticky-cta">
      {t("pricing.paid.ctaLogin")}
    </Link>
  );
}
