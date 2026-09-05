import { useEffect, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { fetchMe, startCheckout, type Account } from "../lib/api";
import { PLAN_ROWS, PlanCell, type PlanValue } from "../lib/planRows";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { loginWithCheckout } from "../lib/latamCheckout";
import { useAutoCheckout } from "../lib/useAutoCheckout";
import { useSeoMeta } from "../lib/useSeoMeta";

type PlanId = "free" | "paid" | "enterprise";

function planValue(row: (typeof PLAN_ROWS)[number], plan: PlanId): PlanValue {
  if (plan === "free") return row.free;
  if (plan === "paid") return row.paid;
  return row.enterprise ?? row.paid;
}

export default function Pricing() {
  const t = useT();
  const { locale } = useI18n();
  useSeoMeta("pricing");
  const planRows = PLAN_ROWS.filter((row) => !row.esOnly || locale === "es");

  /** undefined = loading; null = logged out; Account = signed in. */
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [upgrading, setUpgrading] = useState(false);
  /** Mobile accordion: Paid open by default (best value). */
  const [openPlan, setOpenPlan] = useState<PlanId | null>("paid");

  useEffect(() => {
    fetchMe()
      .then(({ account: me }) => setAccount(me))
      .catch(() => setAccount(null));
  }, []);

  useAutoCheckout(account ?? null, "pricing:auto");

  const paidLogin = loginWithCheckout(localizePath("/pricing", locale), locale === "es" ? "latam-to-us" : "pricing");

  const onPaidCheckout = async () => {
    setUpgrading(true);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch {
      setUpgrading(false);
    }
  };

  const paidCta =
    account?.isPaid ? (
      <Link to={localizePath("/dashboard", locale)} className="btn-primary pricing-mobile-cta">
        {t("common.goDashboard")}
      </Link>
    ) : account ? (
      <button type="button" className="btn-primary pricing-mobile-cta" onClick={onPaidCheckout} disabled={upgrading}>
        {upgrading ? t("common.redirecting") : t("pricing.paid.ctaGet")}
      </button>
    ) : (
      <Link to={paidLogin} className="btn-primary pricing-mobile-cta">
        {t("pricing.paid.ctaGet")}
      </Link>
    );

  const showPaidDock = account !== undefined && !account?.isPaid;

  const mobilePlans: Array<{
    id: PlanId;
    nameKey: string;
    price: string;
    note: string;
    cta: ReactNode;
  }> = [
    {
      id: "free",
      nameKey: "pricing.free.name",
      price: "$0",
      note: t("pricing.free.note"),
      cta: (
        <Link to={localizePath("/prepare", locale)} className="btn-secondary pricing-mobile-cta">
          {t("pricing.free.cta")}
        </Link>
      ),
    },
    {
      id: "paid",
      nameKey: "pricing.paid.name",
      price: "$10",
      note: t("pricing.paid.note"),
      cta: paidCta,
    },
    {
      id: "enterprise",
      nameKey: "pricing.ent.name",
      price: t("pricing.ent.price"),
      note: "sales@docracy.io",
      cta: (
        <a href="mailto:sales@docracy.io" className="btn-secondary pricing-mobile-cta">
          {t("pricing.ent.cta")}
        </a>
      ),
    },
  ];

  return (
    <div className="pricing-page">
      <div className="container pricing-compare">
        <p className="pricing-intro">{t("pricing.intro")}</p>
        {/* Desktop: multi-column comparison table */}
        <div className="plan-table-scroll pricing-desktop-table">
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
              {planRows.map((row) => (
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

        {/* Mobile: accordion per plan — full feature text, no squeezed table */}
        <div className="pricing-mobile-compare" aria-label={t("pricing.compareTitle")}>
          <h1 className="pricing-mobile-title">{t("pricing.compareTitle")}</h1>
          <div className="pricing-mobile-plans">
            {mobilePlans.map((plan) => {
              const isOpen = openPlan === plan.id;
              const panelId = `pricing-mobile-panel-${plan.id}`;
              return (
                <section
                  key={plan.id}
                  className={`pricing-mobile-card${plan.id === "paid" ? " is-paid" : ""}${isOpen ? " is-open" : ""}`}
                >
                  <button
                    type="button"
                    className="pricing-mobile-card-toggle"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpenPlan(isOpen ? null : plan.id)}
                  >
                    <span className="pricing-mobile-card-head">
                      <span className="pricing-mobile-card-name">
                        {t(plan.nameKey)}
                        {plan.id === "paid" && (
                          <span className="plan-popular pricing-mobile-popular">{t("pricing.bestValue")}</span>
                        )}
                      </span>
                      <span className="pricing-mobile-card-price">
                        {plan.price}
                        <span className="pricing-mobile-card-note">{plan.note}</span>
                      </span>
                    </span>
                    <span className="pricing-mobile-card-chevron" aria-hidden="true" />
                  </button>
                  <div className="pricing-mobile-card-cta-wrap">{plan.cta}</div>
                  {isOpen && (
                    <div id={panelId} className="pricing-mobile-card-body">
                      <ul className="pricing-mobile-features">
                        {planRows.map((row) => {
                          const value = planValue(row, plan.id);
                          const included = value !== false;
                          return (
                            <li
                              key={row.labelKey}
                              className={`pricing-mobile-feature${included ? " is-included" : " is-excluded"}`}
                            >
                              <span className="pricing-mobile-feature-mark" aria-hidden="true">
                                {included ? (
                                  <svg width="16" height="16" viewBox="0 0 18 18">
                                    <circle cx="9" cy="9" r="9" fill="currentColor" />
                                    <path
                                      d="M5.2 9.2l2.4 2.4 5.2-5.2"
                                      fill="none"
                                      stroke="#fff"
                                      strokeWidth="1.8"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : (
                                  <span className="pricing-mobile-dash">—</span>
                                )}
                              </span>
                              <span className="pricing-mobile-feature-text">
                                {t(row.labelKey)}
                                {typeof value === "string" && (
                                  <span className="pricing-mobile-feature-value">{t(value)}</span>
                                )}
                              </span>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        </div>

        {/* Sticky prices — desktop only. Mobile uses accordion cards with inline CTAs;
            a fixed 3-row dock was crushing the feature list under cookie+chrome. */}
        {showPaidDock && (
          <div className="pricing-sticky-bar pricing-sticky-bar-desktop" aria-label={t("pricing.dockAria")}>
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
              {account ? (
                <button type="button" className="btn-primary pricing-sticky-cta" onClick={onPaidCheckout} disabled={upgrading}>
                  {upgrading ? t("common.redirecting") : t("pricing.paid.ctaGet")}
                </button>
              ) : (
                <Link to={paidLogin} className="btn-primary pricing-sticky-cta">
                  {t("pricing.paid.ctaGet")}
                </Link>
              )}
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
        <div style={{ marginBottom: 24 }}>
          <h2 style={{ fontSize: 18, marginBottom: 10 }}>{t("pricing.competitorLinksTitle")}</h2>
          <p style={{ fontSize: 14, lineHeight: 1.9 }}>
            <Link to={localizePath("/docusign-alternative", locale)}>{t("footer.vsDocusign")}</Link>
            {" · "}
            <Link to={localizePath("/eversign-alternative", locale)}>{t("footer.vsEversign")}</Link>
            {" · "}
            <Link to={localizePath("/hellosign-alternative", locale)}>{t("footer.vsHellosign")}</Link>
            {" · "}
            <Link to={localizePath("/pandadoc-alternative", locale)}>{t("footer.vsPandadoc")}</Link>
            {" · "}
            <Link to="/blog">{t("footer.allComparisons")}</Link>
          </p>
        </div>

        <p className="pricing-disclaimer">
          {t("pricing.disclaimer")}{" "}
          <Link to="/trust">{t("pricing.disclaimerTrust")}</Link>
          {" · "}
          <Link to={localizePath("/esign-ueta", locale)}>{t("footer.esignUeta")}</Link>
        </p>
      </div>
    </div>
  );
}
