import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMe, startCheckout, type Account } from "../lib/api";
import { localizePath, useI18n } from "../lib/i18n";
import { loginWithCheckout } from "../lib/latamCheckout";
import { useAutoCheckout } from "../lib/useAutoCheckout";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";
import { LATAM_COUNTRY_CORRIDORS } from "../lib/latamCountryCorridors";

const FAQ_COUNT = 8;

const PLAN_INCLUDES = [
  { titleKey: "latamUsPacket.include1.title", bodyKey: "latamUsPacket.include1.body" },
  { titleKey: "latamUsPacket.include2.title", bodyKey: "latamUsPacket.include2.body" },
  { titleKey: "latamUsPacket.include3.title", bodyKey: "latamUsPacket.include3.body" },
] as const;

const STEPS: Array<{ titleKey: string; bodyKey: string; to: string; ctaKey: string }> = [
  {
    titleKey: "latamUsPacket.step1.title",
    bodyKey: "latamUsPacket.step1.body",
    to: "/free-templates/offer-letter",
    ctaKey: "latamUsPacket.step1.cta",
  },
  {
    titleKey: "latamUsPacket.step2.title",
    bodyKey: "latamUsPacket.step2.body",
    to: "/free-templates/i-9-form",
    ctaKey: "latamUsPacket.step2.cta",
  },
  {
    titleKey: "latamUsPacket.step3.title",
    bodyKey: "latamUsPacket.step3.body",
    to: "/visa-supporting-documents",
    ctaKey: "latamUsPacket.step3.cta",
  },
  {
    titleKey: "latamUsPacket.step4.title",
    bodyKey: "latamUsPacket.step4.body",
    to: "/income-proof",
    ctaKey: "latamUsPacket.step4.cta",
  },
  {
    titleKey: "latamUsPacket.step5.title",
    bodyKey: "latamUsPacket.step5.body",
    to: "/packets/us-contractor",
    ctaKey: "latamUsPacket.step5.cta",
  },
];

const SEND_TO: Array<{
  titleKey: string;
  bodyKey: string;
  officialHref?: string;
  officialKey?: string;
  docracyTo?: string;
  docracyCtaKey?: string;
}> = [
  {
    titleKey: "latamUsPacket.send.offer.title",
    bodyKey: "latamUsPacket.send.offer.body",
    docracyTo: "/free-templates/offer-letter",
    docracyCtaKey: "latamUsPacket.send.offer.cta",
  },
  {
    titleKey: "latamUsPacket.send.i9.title",
    bodyKey: "latamUsPacket.send.i9.body",
    officialHref: "https://www.uscis.gov/i-9",
    officialKey: "latamUsPacket.send.i9.official",
    docracyTo: "/free-templates/i-9-form",
    docracyCtaKey: "latamUsPacket.send.i9.cta",
  },
  {
    titleKey: "latamUsPacket.send.visa.title",
    bodyKey: "latamUsPacket.send.visa.body",
    officialHref: "https://travel.state.gov/content/travel/en/us-visas.html",
    officialKey: "latamUsPacket.send.visa.official",
    docracyTo: "/visa-supporting-documents",
    docracyCtaKey: "latamUsPacket.send.visa.cta",
  },
  {
    titleKey: "latamUsPacket.send.ceac.title",
    bodyKey: "latamUsPacket.send.ceac.body",
    officialHref: "https://ceac.state.gov/genniv/",
    officialKey: "latamUsPacket.send.ceac.official",
  },
  {
    titleKey: "latamUsPacket.send.uscis.title",
    bodyKey: "latamUsPacket.send.uscis.body",
    officialHref: "https://www.uscis.gov/",
    officialKey: "latamUsPacket.send.uscis.official",
  },
  {
    titleKey: "latamUsPacket.send.constancia.title",
    bodyKey: "latamUsPacket.send.constancia.body",
    docracyTo: "/income-proof",
    docracyCtaKey: "latamUsPacket.send.constancia.cta",
  },
  {
    titleKey: "latamUsPacket.send.cobro.title",
    bodyKey: "latamUsPacket.send.cobro.body",
    docracyTo: "/cobro#send",
    docracyCtaKey: "latamUsPacket.send.cobro.cta",
  },
  {
    titleKey: "latamUsPacket.send.w9.title",
    bodyKey: "latamUsPacket.send.w9.body",
    officialHref: "https://www.irs.gov/forms-pubs/about-form-w-9",
    officialKey: "latamUsPacket.send.w9.official",
    docracyTo: "/free-templates/w-9-form",
    docracyCtaKey: "latamUsPacket.send.w9.cta",
  },
  {
    titleKey: "latamUsPacket.send.ssn.title",
    bodyKey: "latamUsPacket.send.ssn.body",
    officialHref: "https://www.ssa.gov/ssnumber/",
    officialKey: "latamUsPacket.send.ssn.official",
  },
  {
    titleKey: "latamUsPacket.send.i94.title",
    bodyKey: "latamUsPacket.send.i94.body",
    officialHref: "https://i94.cbp.dhs.gov/I94/#/home",
    officialKey: "latamUsPacket.send.i94.official",
    docracyTo: "/after-arrival",
    docracyCtaKey: "latamUsPacket.send.i94.cta",
  },
  {
    titleKey: "latamUsPacket.send.uscisAccount.title",
    bodyKey: "latamUsPacket.send.uscisAccount.body",
    officialHref: "https://myaccount.uscis.gov/",
    officialKey: "latamUsPacket.send.uscisAccount.official",
  },
  {
    titleKey: "latamUsPacket.send.address.title",
    bodyKey: "latamUsPacket.send.address.body",
    officialHref: "https://www.uscis.gov/addresschange",
    officialKey: "latamUsPacket.send.address.official",
    docracyTo: "/after-arrival",
    docracyCtaKey: "latamUsPacket.send.address.cta",
  },
  {
    titleKey: "latamUsPacket.send.itin.title",
    bodyKey: "latamUsPacket.send.itin.body",
    officialHref: "https://www.irs.gov/tin/itin/how-to-apply-for-an-itin",
    officialKey: "latamUsPacket.send.itin.official",
    docracyTo: "/itin",
    docracyCtaKey: "latamUsPacket.send.itin.cta",
  },
  {
    titleKey: "latamUsPacket.send.apostille.title",
    bodyKey: "latamUsPacket.send.apostille.body",
    officialHref: "https://www.hcch.net/en/instruments/conventions/authorities1/?cid=41",
    officialKey: "latamUsPacket.send.apostille.official",
  },
  {
    titleKey: "latamUsPacket.send.apostilleMx.title",
    bodyKey: "latamUsPacket.send.apostilleMx.body",
    officialHref: "https://www.gob.mx/sre/acciones-y-programas/apostilla-y-legalizacion-de-documentos",
    officialKey: "latamUsPacket.send.apostilleMx.official",
    docracyTo: "/mexico-to-us",
    docracyCtaKey: "latamUsPacket.send.apostilleMx.cta",
  },
  {
    titleKey: "latamUsPacket.send.apostilleCo.title",
    bodyKey: "latamUsPacket.send.apostilleCo.body",
    officialHref: "https://www.cancilleria.gov.co/tramites_servicios/apostilla_legalizacion",
    officialKey: "latamUsPacket.send.apostilleCo.official",
    docracyTo: "/colombia-to-us",
    docracyCtaKey: "latamUsPacket.send.apostilleCo.cta",
  },
  {
    titleKey: "latamUsPacket.send.lease.title",
    bodyKey: "latamUsPacket.send.lease.body",
    docracyTo: "/free-templates/simple-commercial-lease-agreement",
    docracyCtaKey: "latamUsPacket.send.lease.cta",
  },
  {
    titleKey: "latamUsPacket.send.poa.title",
    bodyKey: "latamUsPacket.send.poa.body",
    docracyTo: "/free-templates/power-of-attorney",
    docracyCtaKey: "latamUsPacket.send.poa.cta",
  },
  {
    titleKey: "latamUsPacket.send.child.title",
    bodyKey: "latamUsPacket.send.child.body",
    docracyTo: "/free-templates/child-travel-consent",
    docracyCtaKey: "latamUsPacket.send.child.cta",
  },
];

const TEMPLATES: Array<{ slug: string; nameKey: string }> = [
  { slug: "offer-letter", nameKey: "tpl.offer-letter.name" },
  { slug: "employment-agreement", nameKey: "tpl.employment-agreement.name" },
  { slug: "i-9-form", nameKey: "tpl.i-9-form.name" },
  { slug: "power-of-attorney", nameKey: "latamUsPacket.tpl.poa" },
  { slug: "reference-letter", nameKey: "latamUsPacket.tpl.reference" },
  { slug: "child-travel-consent", nameKey: "latamUsPacket.tpl.childTravel" },
  { slug: "simple-commercial-lease-agreement", nameKey: "latamUsPacket.tpl.lease" },
  { slug: "w-9-form", nameKey: "tpl.w-9-form.name" },
];

/**
 * All-in-one LATAM → US immigrant packet. Playbook + official “where to send” links
 * are public. Using the package (send, keep, constancia, cobro) is Paid.
 * Chrome only surfaces this on Spanish.
 */
export default function LatamUsPacket() {
  const { t, locale } = useI18n();
  const canonicalPath = locale === "es" ? "/es/kit-llegar-eeuu" : "/packets/latam-to-us";
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [upgrading, setUpgrading] = useState(false);

  usePageMeta(t("latamUsPacket.seoTitle"), t("latamUsPacket.seoDescription"), {
    canonicalPath,
    alternates: { en: "/packets/latam-to-us", es: "/es/kit-llegar-eeuu" },
    xDefault: "es",
  });

  useEffect(() => {
    fetchMe()
      .then((res) => setAccount(res.account))
      .catch(() => setAccount(null));
  }, []);

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
        "@type": "Question",
        name: t(`latamUsPacket.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`latamUsPacket.faq.${i + 1}.a`) },
      })),
    }),
    [t]
  );
  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("latamUsPacket.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t("latamUsPacket.howToName"), t("latamUsPacket.seoDescription"), [
        t("latamUsPacket.howTo1"),
        t("latamUsPacket.howTo2"),
        t("latamUsPacket.howTo3"),
        t("latamUsPacket.howTo4"),
        t("latamUsPacket.howTo5"),
      ]),
    [t]
  );

  const loginTo = loginWithCheckout(canonicalPath, "latam-to-us");
  useAutoCheckout(account, "seo:latam-to-us:auto");

  const onUpgrade = async () => {
    track("upgrade_clicked", { source: "seo:latam-to-us" });
    setUpgrading(true);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch {
      setUpgrading(false);
    }
  };

  const packetCta = (to: string, label: string, source: string) => {
    if (account?.isPaid) {
      return (
        <Link
          to={localizePath(to, locale)}
          className="btn-secondary"
          style={{ textDecoration: "none", display: "inline-block" }}
          onClick={() => track("landingpage_cta_clicked", { source })}
        >
          {label}
        </Link>
      );
    }
    if (account) {
      return (
        <button type="button" className="btn-secondary" onClick={onUpgrade} disabled={upgrading}>
          {upgrading ? t("common.redirecting") : t("latamUsPacket.ctaPaid")}
        </button>
      );
    }
    return (
      <Link
        to={loginTo}
        className="btn-secondary"
        style={{ textDecoration: "none", display: "inline-block" }}
        onClick={() => track("landingpage_cta_clicked", { source })}
      >
        {t("latamUsPacket.ctaLogin")}
      </Link>
    );
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p
            className="hero-kicker"
            style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}
          >
            {t("latamUsPacket.kicker")}
          </p>
          <h1>{t("latamUsPacket.heroTitle")}</h1>
          <p>{t("latamUsPacket.heroSub")}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            {account?.isPaid ? (
              <>
                <Link
                  to={localizePath("/income-proof", locale)}
                  className="btn-primary btn-lg"
                  style={{ display: "inline-block", textDecoration: "none" }}
                  onClick={() => track("landingpage_cta_clicked", { source: "seo:latam-to-us:hero" })}
                >
                  {t("latamUsPacket.ctaOpen")}
                </Link>
                <Link
                  to={`${localizePath("/cobro", locale)}#send`}
                  className="btn-secondary btn-lg"
                  style={{ display: "inline-block", textDecoration: "none" }}
                  onClick={() => track("landingpage_cta_clicked", { source: "seo:latam-to-us:cobro" })}
                >
                  {t("latamUsPacket.ctaCobro")}
                </Link>
              </>
            ) : account ? (
              <button type="button" className="btn-primary btn-lg" onClick={onUpgrade} disabled={upgrading}>
                {upgrading ? t("common.redirecting") : t("latamUsPacket.ctaPaid")}
              </button>
            ) : (
              <Link
                to={loginTo}
                className="btn-primary btn-lg"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("landingpage_cta_clicked", { source: "seo:latam-to-us:hero" })}
              >
                {t("latamUsPacket.ctaLogin")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("latamUsPacket.includesTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.includesSub")}</p>
        <div className="dashboard-corridor-grid packet-includes">
          {PLAN_INCLUDES.map((item) => (
            <div key={item.titleKey} className="dashboard-corridor-card">
              <h3>{t(item.titleKey)}</h3>
              <p>{t(item.bodyKey)}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("latamUsPacket.paidTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.paidSub")}</p>
        <ul>
          <li>{t("latamUsPacket.paidItem1")}</li>
          <li>{t("latamUsPacket.paidItem2")}</li>
          <li>{t("latamUsPacket.paidItem3")}</li>
          <li>{t("latamUsPacket.paidItem4")}</li>
        </ul>
        <p style={{ fontSize: 14, color: "var(--mute)" }}>{t("latamUsPacket.freeHint")}</p>

        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("latamUsPacket.stepsTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.stepsSub")}</p>
        <ol className="packet-steps">
          {STEPS.map((step, i) => (
            <li key={step.to} className="card packet-step">
              <p className="packet-step-num">{t("packet.stepN", { n: i + 1 })}</p>
              <h3 style={{ marginTop: 0 }}>{t(step.titleKey)}</h3>
              <p style={{ fontSize: 14, color: "var(--mute)" }}>{t(step.bodyKey)}</p>
              {packetCta(step.to, t(step.ctaKey), `seo:latam-to-us:step${i + 1}`)}
            </li>
          ))}
        </ol>

        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("latamUsPacket.sendTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.sendSub")}</p>
        <ol className="packet-steps">
          {SEND_TO.map((row, i) => (
            <li key={row.titleKey} className="card packet-step">
              <p className="packet-step-num">{t("packet.stepN", { n: i + 1 })}</p>
              <h3 style={{ marginTop: 0 }}>{t(row.titleKey)}</h3>
              <p style={{ fontSize: 14, color: "var(--mute)" }}>{t(row.bodyKey)}</p>
              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
                {row.docracyTo && row.docracyCtaKey
                  ? packetCta(row.docracyTo, t(row.docracyCtaKey), `seo:latam-to-us:send${i + 1}`)
                  : null}
                {row.officialHref && row.officialKey ? (
                  <a href={row.officialHref} target="_blank" rel="noopener noreferrer">
                    {t(row.officialKey)}
                  </a>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("latamUsPacket.compareTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.compareSub")}</p>
        <p>
          <Link to={localizePath("/boundless-alternative", locale)}>{t("footer.vsBoundless")}</Link>
          {" · "}
          <Link to={localizePath("/citizenpath-alternative", locale)}>{t("footer.vsCitizenpath")}</Link>
          {" · "}
          <Link to={localizePath("/visa-service-alternative", locale)}>{t("footer.vsVisaService")}</Link>
          {" · "}
          <Link to={localizePath("/boundless-vs-citizenpath", locale)}>{t("footer.boundlessVsCitizenpath")}</Link>
        </p>

        <h2 id="paises" style={{ fontSize: 19, marginTop: 36 }}>{t("latamUsPacket.countryTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.countrySub")}</p>
        <p>
          {LATAM_COUNTRY_CORRIDORS.map((c, i) => (
            <span key={c.slug}>
              {i > 0 ? " · " : null}
              <Link to={localizePath(c.enPath, locale)}>
                {locale === "es" ? `${c.countryEs} → EE. UU.` : `${c.countryEn} → US`}
              </Link>
            </span>
          ))}
          {" · "}
          <Link to={localizePath("/immigrant-housing", locale)}>{t("footer.immigrantHousing")}</Link>
          {" · "}
          <Link to={localizePath("/after-arrival", locale)}>{t("footer.afterArrival")}</Link>
          {" · "}
          <Link to={localizePath("/itin", locale)}>{t("footer.itin")}</Link>
        </p>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("latamUsPacket.templatesTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamUsPacket.templatesSub")}</p>
        <ul style={{ paddingLeft: 20, lineHeight: 1.8 }}>
          {TEMPLATES.map((tpl) => (
            <li key={tpl.slug}>
              <Link to={localizePath(`/free-templates/${tpl.slug}`, locale)}>{t(tpl.nameKey)}</Link>
            </li>
          ))}
        </ul>

        <p style={{ marginTop: 8, fontSize: 14, color: "var(--mute)" }}>{t("latamUsPacket.hireHint")}</p>
        <p>
          <Link to={localizePath("/packets/latam-contractor", locale)}>{t("footer.latamPacket")}</Link>
        </p>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
        {Array.from({ length: FAQ_COUNT }, (_, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`latamUsPacket.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`latamUsPacket.faq.${i + 1}.a`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
