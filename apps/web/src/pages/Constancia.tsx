import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMe,
  fetchConstancia,
  saveConstanciaProfile,
  startCheckout,
  type Account,
  type ConstanciaPacket,
} from "../lib/api";
import { localizePath, useI18n } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";

const FAQ_COUNT = 5;

/**
 * ES-lead SEO landing for the income-proof packet, with the Paid share tool below the fold.
 * Crawlers never log in, so they index the marketing copy + FAQ. x-default is Spanish.
 */
export default function Constancia() {
  const { t, locale } = useI18n();
  const yearNow = new Date().getUTCFullYear();
  const [year, setYear] = useState(yearNow);
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [packet, setPacket] = useState<ConstanciaPacket | null>(null);
  const [subjectName, setSubjectName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  const canonicalPath = locale === "es" ? "/es/constancia" : "/income-proof";

  usePageMeta(t("constancia.seoTitle"), t("constancia.seoDescription"), {
    canonicalPath,
    alternates: { en: "/income-proof", es: "/es/constancia" },
    xDefault: "es",
  });

  useEffect(() => {
    fetchMe()
      .then((res) => setAccount(res.account))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (!account?.isPaid) {
      setPacket(null);
      return;
    }
    setError(null);
    fetchConstancia(year, locale)
      .then((res) => {
        setPacket(res);
        setSubjectName(res.subjectName);
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("common.error")));
  }, [account?.isPaid, year, locale, t]);

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
        "@type": "Question",
        name: t(`constancia.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`constancia.faq.${i + 1}.a`) },
      })),
    }),
    [t]
  );

  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("constancia.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t("constancia.howToName"), t("constancia.seoDescription"), [
        t("constancia.howTo1"),
        t("constancia.howTo2"),
        t("constancia.howTo3"),
        t("constancia.howTo4"),
      ]),
    [t]
  );

  const onUpgrade = async () => {
    setUpgrading(true);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch {
      setUpgrading(false);
    }
  };

  const onSaveName = async () => {
    setSaving(true);
    setError(null);
    try {
      const res = await saveConstanciaProfile(subjectName);
      setSubjectName(res.subjectName);
      setPacket((prev) => (prev ? { ...prev, subjectName: res.subjectName } : prev));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSaving(false);
    }
  };

  const onCopy = async () => {
    if (!packet?.shareUrl || !packet.subjectName.trim()) return;
    try {
      await navigator.clipboard.writeText(packet.shareUrl);
      setCopied(true);
      track("viral_cta_clicked", { source: "constancia_copy" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked — the URL is still in the input */
    }
  };

  const loginTo = `/login?next=${encodeURIComponent(canonicalPath)}&ref=constancia`;
  const savedName = packet?.subjectName?.trim() ?? "";
  const canCopy = Boolean(packet?.shareUrl && savedName);

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
            {t("constancia.kicker")}
          </p>
          <h1>{t("constancia.heroTitle")}</h1>
          <p>{t("constancia.heroSub")}</p>
          <div style={{ marginTop: 20 }}>
            {account?.isPaid ? (
              <a href="#packet" className="btn-primary btn-lg" style={{ display: "inline-block", textDecoration: "none" }}>
                {t("constancia.ctaOpen")}
              </a>
            ) : account ? (
              <button type="button" className="btn-primary btn-lg" onClick={onUpgrade} disabled={upgrading}>
                {upgrading ? t("common.redirecting") : t("constancia.ctaPaid")}
              </button>
            ) : (
              <Link
                to={loginTo}
                className="btn-primary btn-lg"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("landingpage_cta_clicked", { source: "seo:constancia:hero" })}
              >
                {t("constancia.ctaLogin")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("constancia.problemTitle")}</h2>
        <p>{t("constancia.problem")}</p>
        <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("constancia.solutionTitle")}</h2>
        <p>{t("constancia.solution")}</p>
        <ul>
          <li>{t("constancia.feat1")}</li>
          <li>{t("constancia.feat2")}</li>
          <li>{t("constancia.feat3")}</li>
          <li>{t("constancia.feat4")}</li>
        </ul>

        {account?.isPaid && (
          <div id="packet" className="card" style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 20, marginTop: 0 }}>{t("constancia.toolTitle", { year })}</h2>
            <p style={{ fontSize: 14, color: "var(--mute)" }}>{t("constancia.toolSub")}</p>
            <label style={{ display: "block", fontSize: 13, marginBottom: 12 }}>
              {t("constancia.yearLabel")}{" "}
              <select className="form-input" value={year} onChange={(e) => setYear(Number(e.target.value))} style={{ marginLeft: 8 }}>
                {[yearNow, yearNow - 1, yearNow - 2, yearNow - 3].map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
            <label style={{ display: "block", fontSize: 13, marginBottom: 12 }}>
              {t("constancia.nameLabel")}
              <input
                className="form-input"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                maxLength={80}
                placeholder={t("constancia.namePlaceholder")}
                style={{ display: "block", marginTop: 6, width: "100%", maxWidth: 360 }}
              />
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 12 }}>
              <button type="button" className="btn-secondary" onClick={onSaveName} disabled={saving || !subjectName.trim()}>
                {saving ? t("common.saving") : t("constancia.saveName")}
              </button>
              <button type="button" className="btn-primary" onClick={onCopy} disabled={!canCopy}>
                {copied ? t("common.copied") : t("constancia.copyLink")}
              </button>
            </div>
            {!savedName && <p style={{ fontSize: 13, color: "var(--mute)" }}>{t("constancia.nameRequired")}</p>}
            {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
            {packet && (
              <>
                {packet.totals.length > 0 && (
                  <p style={{ fontSize: 14 }}>
                    {t("constancia.totalsLabel")}{" "}
                    {packet.totals.map((tot) => `${tot.amount} ${tot.currency}`).join(" · ")}
                  </p>
                )}
                <p style={{ fontSize: 13 }}>{t("constancia.count", { n: packet.documents.length })}</p>
                <div style={{ marginTop: 16 }}>
                  {packet.documents.length === 0 ? (
                    <p style={{ color: "var(--mute)" }}>{t("constancia.empty")}</p>
                  ) : (
                    packet.documents.map((d) => (
                      <div key={d.docId} style={{ padding: "10px 0", borderBottom: "1px solid var(--hairline)" }}>
                        <a href={d.signedPageUrl}>{d.title}</a>
                        <div style={{ fontSize: 12, color: "var(--mute)" }}>
                          {d.completedAt.slice(0, 10)}
                          {d.amount ? ` · ${d.amount} ${d.currency}` : ""}
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
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`constancia.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`constancia.faq.${i + 1}.a`)}</p>
          </details>
        ))}

        <p style={{ marginTop: 24, fontSize: 14 }}>
          <Link to={localizePath("/cobro", locale)}>{t("footer.cobro")}</Link>
          {" · "}
          <Link to={localizePath("/1099-season", locale)}>{t("footer.taxYear")}</Link>
          {" · "}
          <Link to={localizePath("/packets/latam-contractor", locale)}>{t("footer.latamPacket")}</Link>
          {" · "}
          <Link to={localizePath("/proof-of-income", locale)}>{t("footer.proofOfIncome")}</Link>
          {" · "}
          <Link to={localizePath("/pricing", locale)}>{t("footer.pricing")}</Link>
        </p>
      </div>
    </div>
  );
}
