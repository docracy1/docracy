import { Link } from "react-router-dom";
import { useMemo } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { getFreeTemplate } from "../lib/freeTemplates";
import {
  LATAM_CONTRACTOR_PACKET_SLUG,
  LATAM_CONTRACTOR_PACKET_STEPS,
  latamCobroPath,
  latamPacketPreparePath,
  latamPacketSentSlugs,
} from "../lib/latamContractorPacket";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";

const FAQ_COUNT = 4;

/**
 * US company ↔ LATAM contractor corridor: NDA + contractor agreement (free templates) then
 * Paid cobro. Honest: no W-8BEN in the catalog — we do not invent an IRS form.
 */
export default function LatamContractorPacket() {
  const t = useT();
  const { locale } = useI18n();
  const sent = new Set(latamPacketSentSlugs());
  const firstUnsent = LATAM_CONTRACTOR_PACKET_STEPS.find((step) => !sent.has(step.slug)) ?? LATAM_CONTRACTOR_PACKET_STEPS[0];
  const startTo =
    firstUnsent.kind === "cobro"
      ? latamCobroPath(locale)
      : latamPacketPreparePath(firstUnsent.slug as "mutual-nda" | "independent-contractor-agreement", locale);

  usePageMeta(t("latamPacket.seoTitle"), t("latamPacket.seoDescription"), {
    canonicalPath: locale === "es" ? "/es/kit-contratista-latam" : "/packets/latam-contractor",
    alternates: { en: "/packets/latam-contractor", es: "/es/kit-contratista-latam" },
  });

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
        "@type": "Question",
        name: t(`latamPacket.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`latamPacket.faq.${i + 1}.a`) },
      })),
    }),
    [t]
  );

  const canonicalPath = locale === "es" ? "/es/kit-contratista-latam" : "/packets/latam-contractor";
  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t("latamPacket.heroTitle"), path: canonicalPath },
      ]),
    [locale, t, canonicalPath]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t("latamPacket.howToName"), t("latamPacket.seoDescription"), [
        t("latamPacket.howTo1"),
        t("latamPacket.howTo2"),
        t("latamPacket.howTo3"),
        t("latamPacket.howTo4"),
      ]),
    [t]
  );

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howTo) }} />
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-kicker" style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {t("latamPacket.kicker")}
          </p>
          <h1>{t("latamPacket.heroTitle")}</h1>
          <p>{t("latamPacket.heroSub")}</p>
          <div style={{ marginTop: 20 }}>
            <Link
              to={startTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("landingpage_cta_clicked", { source: `seo:${LATAM_CONTRACTOR_PACKET_SLUG}:hero` })}
            >
              {t("latamPacket.ctaStart")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("latamPacket.stepsTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("latamPacket.stepsSub")}</p>
        <ol className="packet-steps">
          {LATAM_CONTRACTOR_PACKET_STEPS.map((step) => {
            const done = sent.has(step.slug);
            if (step.kind === "cobro") {
              return (
                <li key={step.slug} className={`card packet-step${done ? " is-done" : ""}`}>
                  <p className="packet-step-num">
                    {t("packet.stepN", { n: step.step })}
                    {done ? ` · ${t("packet.sent")}` : ""}
                  </p>
                  <h3 style={{ marginTop: 0 }}>{t("latamPacket.cobroStepTitle")}</h3>
                  <p style={{ fontSize: 14, color: "var(--mute)" }}>{t("latamPacket.cobroStepBody")}</p>
                  <Link
                    to={latamCobroPath(locale)}
                    className="btn-secondary"
                    style={{ textDecoration: "none", display: "inline-block" }}
                    onClick={() => track("landingpage_cta_clicked", { source: `seo:${LATAM_CONTRACTOR_PACKET_SLUG}:cobro` })}
                  >
                    {done ? t("packet.sendAgain") : t("latamPacket.cobroCta")}
                  </Link>
                </li>
              );
            }
            const tpl = getFreeTemplate(step.slug);
            const name = locale === "es" ? t(`tpl.${step.slug}.name`) : tpl?.name ?? step.slug;
            const desc = locale === "es" ? t(`tpl.${step.slug}.description`) : tpl?.description ?? "";
            return (
              <li key={step.slug} className={`card packet-step${done ? " is-done" : ""}`}>
                <p className="packet-step-num">
                  {t("packet.stepN", { n: step.step })}
                  {done ? ` · ${t("packet.sent")}` : ""}
                </p>
                <h3 style={{ marginTop: 0 }}>{name}</h3>
                <p style={{ fontSize: 14, color: "var(--mute)" }}>{desc}</p>
                <Link
                  to={latamPacketPreparePath(step.slug, locale)}
                  className="btn-secondary"
                  style={{ textDecoration: "none", display: "inline-block" }}
                  onClick={() =>
                    track("landingpage_cta_clicked", { source: `seo:${LATAM_CONTRACTOR_PACKET_SLUG}:${step.slug}` })
                  }
                >
                  {done ? t("packet.sendAgain") : t("packet.sendThis")}
                </Link>
              </li>
            );
          })}
        </ol>

        <p style={{ marginTop: 8, fontSize: 14, color: "var(--mute)" }}>{t("latamPacket.usKitHint")}</p>
        <p>
          <Link to={localizePath("/packets/us-contractor", locale)}>{t("footer.packet")}</Link>
        </p>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
        {Array.from({ length: FAQ_COUNT }, (_, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`latamPacket.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`latamPacket.faq.${i + 1}.a`)}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
