import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { fetchMe, fetchTaxYear, startCheckout, type Account, type TaxYearDocument } from "../lib/api";
import { taxYearToCsv } from "../lib/taxYearCsv";
import { localizePath, useI18n } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";

const FAQ_COUNT = 5;

/**
 * Public SEO landing for the 1099 season locker, with the Paid CSV tool below the fold
 * for logged-in paid accounts. Crawlers never log in, so they index the marketing copy + FAQ.
 */
export default function TaxYear() {
  const { t, locale } = useI18n();
  const yearNow = new Date().getUTCFullYear();
  const [year, setYear] = useState(yearNow);
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [docs, setDocs] = useState<TaxYearDocument[] | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [copied, setCopied] = useState(false);

  usePageMeta(t("taxYear.seoTitle"), t("taxYear.seoDescription"), {
    canonicalPath: locale === "es" ? "/es/temporada-1099" : "/1099-season",
    alternates: { en: "/1099-season", es: "/es/temporada-1099" },
  });

  useEffect(() => {
    fetchMe()
      .then((res) => setAccount(res.account))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (!account?.isPaid) {
      setDocs(null);
      setShareUrl(null);
      return;
    }
    setError(null);
    fetchTaxYear(year, locale)
      .then((res) => {
        setDocs(res.documents);
        setShareUrl(res.shareUrl ?? null);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("common.error")));
  }, [account?.isPaid, year, locale, t]);

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
        "@type": "Question",
        name: t(`taxYear.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`taxYear.faq.${i + 1}.a`) },
      })),
    }),
    [t]
  );

  const canonicalPath = locale === "es" ? "/es/temporada-1099" : "/1099-season";
  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("taxYear.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t("taxYear.howToName"), t("taxYear.seoDescription"), [
        t("taxYear.howTo1"),
        t("taxYear.howTo2"),
        t("taxYear.howTo3"),
        t("taxYear.howTo4"),
      ]),
    [t]
  );

  const downloadCsv = () => {
    if (!docs) return;
    const blob = new Blob([taxYearToCsv(year, docs)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = locale === "es" ? `docracy-archivo-${year}.csv` : `docracy-1099-${year}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    track("viral_cta_clicked", { source: "tax_year_csv" });
  };

  const onCopyShare = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      track("viral_cta_clicked", { source: "payer_copy" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  const onUpgrade = async () => {
    setUpgrading(true);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch {
      setUpgrading(false);
    }
  };

  const loginTo = `/login?next=${encodeURIComponent(locale === "es" ? "/es/temporada-1099" : "/1099-season")}&ref=1099-season`;

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-kicker" style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {t("taxYear.kicker")}
          </p>
          <h1>{t("taxYear.heroTitle")}</h1>
          <p>{t("taxYear.heroSub")}</p>
          <div style={{ marginTop: 20 }}>
            {account?.isPaid ? (
              <a href="#locker" className="btn-primary btn-lg" style={{ display: "inline-block", textDecoration: "none" }}>
                {t("taxYear.ctaOpen")}
              </a>
            ) : account ? (
              <button type="button" className="btn-primary btn-lg" onClick={onUpgrade} disabled={upgrading}>
                {upgrading ? t("common.redirecting") : t("taxYear.ctaPaid")}
              </button>
            ) : (
              <Link
                to={loginTo}
                className="btn-primary btn-lg"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("landingpage_cta_clicked", { source: "seo:1099-season:hero" })}
              >
                {t("taxYear.ctaLogin")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("taxYear.problemTitle")}</h2>
        <p>{t("taxYear.problem")}</p>
        <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("taxYear.solutionTitle")}</h2>
        <p>{t("taxYear.solution")}</p>
        <ul>
          <li>{t("taxYear.feat1")}</li>
          <li>{t("taxYear.feat2")}</li>
          <li>{t("taxYear.feat3")}</li>
          <li>{t("taxYear.feat4")}</li>
        </ul>

        {account?.isPaid && (
          <div id="locker" className="card" style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 20, marginTop: 0 }}>{t("taxYear.lockerTitle", { year })}</h2>
            <p style={{ fontSize: 14, color: "var(--mute)" }}>{t("taxYear.lockerSub")}</p>
            <label style={{ display: "block", fontSize: 13, marginBottom: 12 }}>
              {t("taxYear.yearLabel")}{" "}
              <select className="form-input" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ marginLeft: 8 }}>
                {[yearNow, yearNow - 1, yearNow - 2, yearNow - 3].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
            {docs && (
              <>
                <p style={{ fontSize: 13 }}>{t("taxYear.count", { n: docs.length })}</p>
                <button type="button" className="btn-primary" onClick={downloadCsv} disabled={docs.length === 0}>
                  {t("taxYear.downloadCsv")}
                </button>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginLeft: 8 }}
                  onClick={onCopyShare}
                  disabled={!shareUrl}
                >
                  {copied ? t("common.copied") : t("taxYear.copyShare")}
                </button>
                <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 8 }}>{t("taxYear.shareHint")}</p>
                <div style={{ marginTop: 16 }}>
                  {docs.length === 0 ? (
                    <p style={{ color: "var(--mute)" }}>{t("taxYear.empty")}</p>
                  ) : (
                    docs.map((d) => (
                      <div key={d.docId} style={{ padding: "10px 0", borderBottom: "1px solid var(--hairline)" }}>
                        <Link to={`/status/${d.statusToken}`}>{d.title}</Link>
                        <div style={{ fontSize: 12, color: "var(--mute)" }}>
                          {d.completedAt.slice(0, 10)}
                          {d.amount ? ` · ${d.amount} ${d.currency}` : ""}
                          {d.kind === "cobro" ? ` · ${d.cobroPaidAt ? t("taxYear.paid") : t("taxYear.unpaid")}` : ""}
                          {d.counterparties.length > 0 ? ` · ${d.counterparties.map((c) => c.name).join(", ")}` : ""}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        )}

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
        {Array.from({ length: FAQ_COUNT }, (_, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`taxYear.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`taxYear.faq.${i + 1}.a`)}</p>
          </details>
        ))}

        <p style={{ marginTop: 24, fontSize: 14 }}>
          <Link to={localizePath("/cobro", locale)}>{t("footer.cobro")}</Link>
          {" · "}
          <Link to={localizePath("/income-proof", locale)}>{t("footer.constancia")}</Link>
          {" · "}
          <Link to={localizePath("/packets/latam-contractor", locale)}>{t("footer.latamPacket")}</Link>
          {" · "}
          <Link to={localizePath("/packets/us-contractor", locale)}>{t("footer.packet")}</Link>
          {" · "}
          <Link to={localizePath("/pricing", locale)}>{t("footer.pricing")}</Link>
        </p>
      </div>
    </div>
  );
}
