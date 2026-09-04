import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createCobro, fetchMe, startCheckout, type Account } from "../lib/api";
import { markLatamPacketStepSent, LATAM_CONTRACTOR_PACKET_SLUG } from "../lib/latamContractorPacket";
import { isJobPacketId, jobPacketPath, markJobPacketStepSent } from "../lib/jobPackets";
import { localizePath, useI18n } from "../lib/i18n";
import { signedPagePath } from "../lib/paidVault";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";

const FAQ_COUNT = 5;
const CURRENCIES = ["USD", "MXN", "COP", "ARS", "CLP", "PEN", "BRL"] as const;

/**
 * Public SEO landing for WhatsApp cobro (pay + file, no signature), with the Paid send form
 * for logged-in paid accounts. Indexed copy never claims Docracy takes the money.
 */
export default function Cobro() {
  const { t, locale } = useI18n();
  const [searchParams] = useSearchParams();
  const packetSlug = searchParams.get("packet");
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [upgrading, setUpgrading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [recipientWhatsapp, setRecipientWhatsapp] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [url, setUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ docId: string; statusToken: string } | null>(null);

  usePageMeta(t("cobro.seoTitle"), t("cobro.seoDescription"), {
    canonicalPath: locale === "es" ? "/es/cobro" : "/cobro",
    alternates: { en: "/cobro", es: "/es/cobro" },
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
        name: t(`cobro.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`cobro.faq.${i + 1}.a`) },
      })),
    }),
    [t]
  );

  const canonicalPath = locale === "es" ? "/es/cobro" : "/cobro";
  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("cobro.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t("cobro.howToName"), t("cobro.seoDescription"), [
        t("cobro.howTo1"),
        t("cobro.howTo2"),
        t("cobro.howTo3"),
        t("cobro.howTo4"),
      ]),
    [t]
  );

  const onUpgrade = async () => {
    setUpgrading(true);
    try {
      const { url: checkout } = await startCheckout();
      window.location.href = checkout;
    } catch {
      setUpgrading(false);
    }
  };

  const onSubmit = async () => {
    if (!file || !account?.isPaid) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await createCobro(file, {
        title: title.trim(),
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        recipientWhatsapp: recipientWhatsapp.trim() || undefined,
        locale,
        paymentRequest: { amount: amount.trim(), currency, url: url.trim() },
      });
      if (packetSlug === LATAM_CONTRACTOR_PACKET_SLUG) {
        markLatamPacketStepSent("cobro");
      } else if (isJobPacketId(packetSlug)) {
        markJobPacketStepSent(packetSlug, "cobro");
      }
      setSent(result);
      track("landingpage_cta_clicked", { source: "cobro" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const loginTo = `/login?next=${encodeURIComponent(locale === "es" ? "/es/cobro" : "/cobro")}&ref=cobro`;
  const signedUrl = sent ? `${typeof window !== "undefined" ? window.location.origin : ""}${signedPagePath(sent.statusToken, locale)}` : "";

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-kicker" style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {t("cobro.kicker")}
          </p>
          <h1>{t("cobro.heroTitle")}</h1>
          <p>{t("cobro.heroSub")}</p>
          <div style={{ marginTop: 20 }}>
            {account?.isPaid ? (
              <a href="#send" className="btn-primary btn-lg" style={{ display: "inline-block", textDecoration: "none" }}>
                {t("cobro.ctaSend")}
              </a>
            ) : account ? (
              <button type="button" className="btn-primary btn-lg" onClick={onUpgrade} disabled={upgrading}>
                {upgrading ? t("common.redirecting") : t("cobro.ctaPaid")}
              </button>
            ) : (
              <Link
                to={loginTo}
                className="btn-primary btn-lg"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("landingpage_cta_clicked", { source: "seo:cobro:hero" })}
              >
                {t("cobro.ctaLogin")}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("cobro.problemTitle")}</h2>
        <p>{t("cobro.problem")}</p>
        <h2 style={{ fontSize: 22, marginTop: 32 }}>{t("cobro.solutionTitle")}</h2>
        <p>{t("cobro.solution")}</p>
        <ul>
          <li>{t("cobro.feat1")}</li>
          <li>{t("cobro.feat2")}</li>
          <li>{t("cobro.feat3")}</li>
          <li>{t("cobro.feat4")}</li>
        </ul>

        {account?.isPaid && (
          <div id="send" className="card" style={{ marginTop: 36 }}>
            <h2 style={{ fontSize: 20, marginTop: 0 }}>{t("cobro.formTitle")}</h2>
            {sent ? (
              <>
                <p>{t("cobro.sentBody")}</p>
                <p>
                  <Link to={signedPagePath(sent.statusToken, locale)}>{signedUrl}</Link>
                </p>
                {packetSlug === LATAM_CONTRACTOR_PACKET_SLUG && (
                  <p>
                    <Link to={localizePath("/packets/latam-contractor", locale)}>{t("latamPacket.backToKit")}</Link>
                  </p>
                )}
                {isJobPacketId(packetSlug) && (
                  <p>
                    <Link to={jobPacketPath(packetSlug, locale)}>{t("packet.backToKit")}</Link>
                  </p>
                )}
              </>
            ) : (
              <>
                <label style={{ display: "block", marginBottom: 10 }}>
                  {t("cobro.fileLabel")}
                  <input
                    type="file"
                    accept="application/pdf"
                    style={{ display: "block", marginTop: 6 }}
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <input className="form-input" placeholder={t("cobro.titlePh")} value={title} onChange={(e) => setTitle(e.target.value)} aria-label={t("cobro.titlePh")} />
                <input className="form-input" style={{ marginTop: 8 }} placeholder={t("cobro.namePh")} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} aria-label={t("cobro.namePh")} />
                <input className="form-input" style={{ marginTop: 8 }} type="email" placeholder={t("cobro.emailPh")} value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} aria-label={t("cobro.emailPh")} />
                <input className="form-input" style={{ marginTop: 8 }} placeholder={t("cobro.whatsappPh")} value={recipientWhatsapp} onChange={(e) => setRecipientWhatsapp(e.target.value)} aria-label={t("cobro.whatsappPh")} />
                <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                  <input className="form-input" style={{ flex: 1 }} inputMode="decimal" placeholder={t("prepare.payAmountPh")} value={amount} onChange={(e) => setAmount(e.target.value)} aria-label={t("prepare.payAmountAria")} />
                  <select className="form-input" style={{ width: 88 }} value={currency} onChange={(e) => setCurrency(e.target.value)} aria-label={t("prepare.payCurrencyAria")}>
                    {CURRENCIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <input className="form-input" style={{ marginTop: 8 }} type="url" placeholder={t("prepare.payUrlPh")} value={url} onChange={(e) => setUrl(e.target.value)} aria-label={t("prepare.payUrlAria")} />
                <p style={{ fontSize: 12, color: "var(--mute)" }}>{t("cobro.formHint")}</p>
                {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
                <button type="button" className="btn-primary" style={{ marginTop: 8 }} onClick={onSubmit} disabled={submitting || !file}>
                  {submitting ? t("common.sending") : t("cobro.submit")}
                </button>
              </>
            )}
          </div>
        )}

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
        {Array.from({ length: FAQ_COUNT }, (_, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`cobro.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`cobro.faq.${i + 1}.a`)}</p>
          </details>
        ))}

        <p style={{ marginTop: 24, fontSize: 14 }}>
          <Link to={localizePath("/1099-season", locale)}>{t("footer.taxYear")}</Link>
          {" · "}
          <Link to={localizePath("/income-proof", locale)}>{t("footer.constancia")}</Link>
          {" · "}
          <Link to={localizePath("/packets/latam-contractor", locale)}>{t("footer.latamPacket")}</Link>
          {" · "}
          <Link to="/whatsapp-signing">{t("footer.whatsappSigning")}</Link>
          {" · "}
          <Link to={localizePath("/pricing", locale)}>{t("footer.pricing")}</Link>
        </p>
      </div>
    </div>
  );
}
