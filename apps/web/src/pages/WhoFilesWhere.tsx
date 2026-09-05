import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import WhoFilesWhereChecklist from "../components/WhoFilesWhereChecklist";
import LatamSearchBox from "../components/LatamSearchBox";
import { fetchMe, startCheckout, type Account } from "../lib/api";
import { localizePath, useI18n } from "../lib/i18n";
import { loginWithCheckout } from "../lib/latamCheckout";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";
import { track } from "../lib/track";
import { useAutoCheckout } from "../lib/useAutoCheckout";
import { usePageMeta } from "../lib/usePageMeta";
import { WHO_FILES_WHERE_EN, WHO_FILES_WHERE_ES } from "../lib/whoFilesWhere";

const FAQ_COUNT = 6;

/**
 * Playbook: who uploads / files each PDF. They still file. We sign and keep.
 * Spanish is x-default; immigrant chrome stays off the EN homepage.
 */
export default function WhoFilesWhere() {
  const { t, locale } = useI18n();
  const canonicalPath = locale === "es" ? WHO_FILES_WHERE_ES : WHO_FILES_WHERE_EN;
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [upgrading, setUpgrading] = useState(false);

  usePageMeta(t("whoFiles.seoTitle"), t("whoFiles.seoDescription"), {
    canonicalPath,
    alternates: { en: WHO_FILES_WHERE_EN, es: WHO_FILES_WHERE_ES },
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
        name: t(`whoFiles.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`whoFiles.faq.${i + 1}.a`) },
      })),
    }),
    [t]
  );
  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("whoFiles.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t("whoFiles.howToName"), t("whoFiles.seoDescription"), [
        t("whoFiles.howTo1"),
        t("whoFiles.howTo2"),
        t("whoFiles.howTo3"),
        t("whoFiles.howTo4"),
      ]),
    [t]
  );

  const loginTo = loginWithCheckout(canonicalPath, "who-files-where");
  useAutoCheckout(account, "seo:who-files-where:auto");

  const onUpgrade = async () => {
    track("upgrade_clicked", { source: "seo:who-files-where" });
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
          {upgrading ? t("common.redirecting") : t("whoFiles.ctaPaid")}
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
        {t("whoFiles.ctaLogin")}
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
            {t("whoFiles.kicker")}
          </p>
          <h1>{t("whoFiles.heroTitle")}</h1>
          <p>{t("whoFiles.heroSub")}</p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 20 }}>
            {account?.isPaid ? (
              <Link
                to={localizePath("/packets/latam-to-us", locale)}
                className="btn-primary btn-lg"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("landingpage_cta_clicked", { source: "seo:who-files-where:hero" })}
              >
                {t("whoFiles.ctaOpen")}
              </Link>
            ) : account ? (
              <button type="button" className="btn-primary btn-lg" onClick={onUpgrade} disabled={upgrading}>
                {upgrading ? t("common.redirecting") : t("whoFiles.ctaPaid")}
              </button>
            ) : (
              <Link
                to={loginTo}
                className="btn-primary btn-lg"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("landingpage_cta_clicked", { source: "seo:who-files-where:hero" })}
              >
                {t("whoFiles.ctaLogin")}
              </Link>
            )}
            <Link
              to={localizePath("/packets/latam-to-us", locale)}
              className="btn-secondary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              {t("footer.latamUsPacket")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <p className="who-files-disclaimer">{t("whoFiles.disclaimer")}</p>
        <LatamSearchBox source="who-files-where" compact />
        <WhoFilesWhereChecklist renderAction={packetCta} sourcePrefix="seo:who-files-where" />

        <p style={{ marginTop: 28, fontSize: 14 }}>
          <Link to={localizePath("/packets/latam-to-us", locale)}>{t("footer.latamUsPacket")}</Link>
          {" · "}
          <Link to={localizePath("/after-arrival", locale)}>{t("footer.afterArrival")}</Link>
          {" · "}
          <Link to={localizePath("/itin", locale)}>{t("footer.itin")}</Link>
          {" · "}
          <Link to={localizePath("/i-9", locale)}>{t("footer.i9")}</Link>
        </p>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
        {Array.from({ length: FAQ_COUNT }, (_, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`whoFiles.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`whoFiles.faq.${i + 1}.a`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
