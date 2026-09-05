import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import {
  createCobro,
  fetchCobroPrefs,
  fetchContacts,
  fetchMe,
  startCheckout,
  type Account,
  type ContactSummary,
} from "../lib/api";
import { markLatamPacketStepSent, LATAM_CONTRACTOR_PACKET_SLUG } from "../lib/latamContractorPacket";
import { isJobPacketId, jobPacketPath, markJobPacketStepSent } from "../lib/jobPackets";
import { clearCobroDraft, readCobroDraft, writeCobroDraft } from "../lib/cobroDraft";
import { localizePath, useI18n } from "../lib/i18n";
import { signedPagePath } from "../lib/paidVault";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";

const FAQ_COUNT = 6;
const CURRENCIES = ["USD", "MXN", "COP", "ARS", "CLP", "PEN", "BRL"] as const;

/**
 * Public SEO landing for WhatsApp cobro (pay + file, no signature). The send form is always
 * fillable (logged out / Free / Paid); POST still requires Paid. Indexed copy never claims
 * Docracy takes the money. Dashboard "Send cobro" and #send / ?send=1 skip the marketing hero.
 */
export default function Cobro() {
  const { t, locale } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const packetSlug = searchParams.get("packet");
  const wantSend = location.hash === "#send" || searchParams.get("send") === "1";
  const draft = useMemo(() => readCobroDraft(), []);
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [upgrading, setUpgrading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(draft.title);
  const [recipientName, setRecipientName] = useState(draft.recipientName);
  const [recipientEmail, setRecipientEmail] = useState(draft.recipientEmail);
  const [recipientWhatsapp, setRecipientWhatsapp] = useState(draft.recipientWhatsapp);
  const [amount, setAmount] = useState(draft.amount);
  const [currency, setCurrency] = useState(draft.currency || "USD");
  const [url, setUrl] = useState(draft.url);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState<{ docId: string; statusToken: string } | null>(null);

  usePageMeta(t("cobro.seoTitle"), t("cobro.seoDescription"), {
    canonicalPath: locale === "es" ? "/es/cobro" : "/cobro",
    alternates: { en: "/cobro", es: "/es/cobro" },
  });

  useEffect(() => {
    fetchMe()
      .then((res) => {
        setAccount(res.account);
        if (!res.account) return;
        fetchCobroPrefs()
          .then(({ prefs }) => {
            if (!prefs) return;
            setUrl((prev) => prev || prefs.url);
            setCurrency((prev) => (prev && prev !== "USD" ? prev : prefs.currency || prev));
          })
          .catch(() => {});
        if (res.account.isPaid) {
          fetchContacts()
            .then((c) => setContacts(c.contacts))
            .catch(() => setContacts([]));
        }
      })
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    writeCobroDraft({
      title,
      recipientName,
      recipientEmail,
      recipientWhatsapp,
      amount,
      currency,
      url,
    });
  }, [title, recipientName, recipientEmail, recipientWhatsapp, amount, currency, url]);

  useEffect(() => {
    if (!wantSend) return;
    window.scrollTo(0, 0);
  }, [wantSend]);

  const formFirst = wantSend || account?.isPaid === true;

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

  const cobroPath = locale === "es" ? "/es/cobro" : "/cobro";
  const loginTo = `/login?next=${encodeURIComponent(`${cobroPath}?send=1`)}&ref=cobro`;

  const onSubmit = async () => {
    writeCobroDraft({
      title,
      recipientName,
      recipientEmail,
      recipientWhatsapp,
      amount,
      currency,
      url,
    });
    if (!account) {
      navigate(loginTo);
      return;
    }
    if (!account.isPaid) {
      setUpgrading(true);
      try {
        const { url: checkout } = await startCheckout();
        window.location.href = checkout;
      } catch {
        setUpgrading(false);
      }
      return;
    }
    if (!file) return;
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
      clearCobroDraft();
      setSent(result);
      track("landingpage_cta_clicked", { source: "cobro" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };
  const signedUrl = sent ? `${typeof window !== "undefined" ? window.location.origin : ""}${signedPagePath(sent.statusToken, locale)}` : "";

  const sendForm = (
    <>
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
          {contacts.length > 0 && (
            <select
              className="form-input"
              style={{ marginBottom: 10 }}
              defaultValue=""
              aria-label={t("cobro.pickContact")}
              onChange={(e) => {
                const picked = contacts.find((c) => c.id === e.target.value);
                if (!picked) return;
                setRecipientName(picked.name);
                setRecipientEmail(picked.email);
              }}
            >
              <option value="">{t("cobro.pickContact")}</option>
              {contacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                  {c.email ? ` · ${c.email}` : ""}
                </option>
              ))}
            </select>
          )}
          <div className="cobro-form-row">
            <input className="form-input" placeholder={t("cobro.titlePh")} value={title} onChange={(e) => setTitle(e.target.value)} aria-label={t("cobro.titlePh")} />
            <input className="form-input" placeholder={t("cobro.namePh")} value={recipientName} onChange={(e) => setRecipientName(e.target.value)} aria-label={t("cobro.namePh")} />
            <input className="form-input" type="email" placeholder={t("cobro.emailPh")} value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} aria-label={t("cobro.emailPh")} />
          </div>
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
          <input className="form-input" style={{ marginTop: 8 }} type="url" placeholder={t("cobro.payUrlPh")} value={url} onChange={(e) => setUrl(e.target.value)} aria-label={t("prepare.payUrlAria")} />
          <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 0 }}>{t("cobro.prefsHint")}</p>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>{t("cobro.formHint")}</p>
          {error && <p style={{ color: "var(--danger)" }}>{error}</p>}
          <button
            type="button"
            className="btn-primary"
            style={{ marginTop: 8 }}
            onClick={onSubmit}
            disabled={submitting || upgrading || (Boolean(account?.isPaid) && !file)}
          >
            {submitting || upgrading
              ? account?.isPaid
                ? t("common.sending")
                : t("common.redirecting")
              : !account
                ? t("cobro.submitLogin")
                : account.isPaid
                  ? t("cobro.submit")
                  : t("cobro.submitUpgrade")}
          </button>
        </>
      )}
    </>
  );

  const sendCard = (
    <div id="send" className="card" style={{ marginTop: formFirst ? 0 : 36 }}>
      <h2 style={{ fontSize: 20, marginTop: 0 }}>{t("cobro.formTitle")}</h2>
      {sendForm}
    </div>
  );

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      {!formFirst && (
        <div className="hero-band">
          <div className="hero-inner" style={{ maxWidth: 720 }}>
            <p className="hero-kicker" style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}>
              {t("cobro.kicker")}
            </p>
            <h1>{t("cobro.heroTitle")}</h1>
            <p>{t("cobro.heroSub")}</p>
            <div style={{ marginTop: 20 }}>
              <a
                href="#send"
                className="btn-primary btn-lg"
                style={{ display: "inline-block", textDecoration: "none" }}
                onClick={() => track("landingpage_cta_clicked", { source: "seo:cobro:hero" })}
              >
                {t("cobro.ctaSend")}
              </a>
            </div>
          </div>
        </div>
      )}

      <div className="container" style={{ maxWidth: 720, paddingTop: formFirst ? 28 : undefined }}>
        {formFirst && sendCard}

        {!formFirst && (
          <>
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
            {sendCard}
          </>
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
