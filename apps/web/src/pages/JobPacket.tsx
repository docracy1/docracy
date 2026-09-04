import { Link } from "react-router-dom";
import { useMemo } from "react";
import { usePageMeta } from "../lib/usePageMeta";
import { getFreeTemplate } from "../lib/freeTemplates";
import {
  JOB_PACKETS,
  jobPacketBlankPreparePath,
  jobPacketCobroPath,
  jobPacketPath,
  jobPacketPreparePath,
  jobPacketSentSlugs,
  type JobPacketId,
  type JobPacketDef,
} from "../lib/jobPackets";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { track } from "../lib/track";
import { breadcrumbJsonLd, howToJsonLd } from "../lib/productSeo";

const FAQ_COUNT = 4;

export default function JobPacket({ packetId }: { packetId: JobPacketId }) {
  const t = useT();
  const { locale } = useI18n();
  const def = JOB_PACKETS[packetId];
  const p = def.i18nPrefix;
  const sent = new Set(jobPacketSentSlugs(packetId));
  const firstUnsent = def.steps.find((step) => !sent.has(step.slug)) ?? def.steps[0];
  const startTo =
    firstUnsent.kind === "cobro"
      ? jobPacketCobroPath(packetId, locale)
      : firstUnsent.kind === "prepare"
        ? jobPacketBlankPreparePath(packetId, locale)
        : jobPacketPreparePath(packetId, firstUnsent.slug, locale);

  const canonicalPath = jobPacketPath(packetId, locale);
  usePageMeta(t(`${p}.seoTitle`), t(`${p}.seoDescription`), {
    canonicalPath,
    alternates: { en: def.enPath, es: def.esPath },
    xDefault: (def as JobPacketDef).xDefault,
  });

  const faqJsonLd = useMemo(
    () => ({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: Array.from({ length: FAQ_COUNT }, (_, i) => ({
        "@type": "Question",
        name: t(`${p}.faq.${i + 1}.q`),
        acceptedAnswer: { "@type": "Answer", text: t(`${p}.faq.${i + 1}.a`) },
      })),
    }),
    [t, p]
  );

  const crumbs = useMemo(
    () =>
      breadcrumbJsonLd([
        { name: "Docracy", path: locale === "es" ? "/es" : "/" },
        { name: t(`${p}.heroTitle`), path: canonicalPath },
      ]),
    [locale, t, canonicalPath, p]
  );
  const howTo = useMemo(
    () =>
      howToJsonLd(t(`${p}.howToName`), t(`${p}.seoDescription`), [
        t(`${p}.howTo1`),
        t(`${p}.howTo2`),
        t(`${p}.howTo3`),
        t(`${p}.howTo4`),
      ]),
    [t, p]
  );

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
            {t(`${p}.kicker`)}
          </p>
          <h1>{t(`${p}.heroTitle`)}</h1>
          <p>{t(`${p}.heroSub`)}</p>
          <div style={{ marginTop: 20 }}>
            <Link
              to={startTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("landingpage_cta_clicked", { source: `seo:${packetId}:hero` })}
            >
              {t(`${p}.ctaStart`)}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t(`${p}.stepsTitle`)}</h2>
        <p style={{ color: "var(--mute)" }}>{t(`${p}.stepsSub`)}</p>
        <ol className="packet-steps">
          {def.steps.map((step) => {
            const done = sent.has(step.slug);
            if (step.kind === "cobro") {
              return (
                <li key={step.slug} className={`card packet-step${done ? " is-done" : ""}`}>
                  <p className="packet-step-num">
                    {t("packet.stepN", { n: step.step })}
                    {done ? ` · ${t("packet.sent")}` : ""}
                  </p>
                  <h3 style={{ marginTop: 0 }}>{t(`${p}.cobroStepTitle`)}</h3>
                  <p style={{ fontSize: 14, color: "var(--mute)" }}>{t(`${p}.cobroStepBody`)}</p>
                  <Link
                    to={jobPacketCobroPath(packetId, locale)}
                    className="btn-secondary"
                    style={{ textDecoration: "none", display: "inline-block" }}
                    onClick={() => track("landingpage_cta_clicked", { source: `seo:${packetId}:cobro` })}
                  >
                    {done ? t("packet.sendAgain") : t(`${p}.cobroCta`)}
                  </Link>
                </li>
              );
            }
            if (step.kind === "prepare") {
              return (
                <li key={step.slug} className={`card packet-step${done ? " is-done" : ""}`}>
                  <p className="packet-step-num">
                    {t("packet.stepN", { n: step.step })}
                    {done ? ` · ${t("packet.sent")}` : ""}
                  </p>
                  <h3 style={{ marginTop: 0 }}>{t(`${p}.prepareStepTitle`)}</h3>
                  <p style={{ fontSize: 14, color: "var(--mute)" }}>{t(`${p}.prepareStepBody`)}</p>
                  <Link
                    to={jobPacketBlankPreparePath(packetId, locale)}
                    className="btn-secondary"
                    style={{ textDecoration: "none", display: "inline-block" }}
                    onClick={() => track("landingpage_cta_clicked", { source: `seo:${packetId}:prepare` })}
                  >
                    {done ? t("packet.sendAgain") : t(`${p}.prepareCta`)}
                  </Link>
                </li>
              );
            }
            const tpl = getFreeTemplate(step.slug);
            const name = locale === "es" ? t(`${p}.tpl.${step.slug}.name`) : tpl?.name ?? step.slug;
            const desc = locale === "es" ? t(`${p}.tpl.${step.slug}.description`) : tpl?.description ?? "";
            return (
              <li key={step.slug} className={`card packet-step${done ? " is-done" : ""}`}>
                <p className="packet-step-num">
                  {t("packet.stepN", { n: step.step })}
                  {done ? ` · ${t("packet.sent")}` : ""}
                </p>
                <h3 style={{ marginTop: 0 }}>{name}</h3>
                <p style={{ fontSize: 14, color: "var(--mute)" }}>{desc}</p>
                <Link
                  to={jobPacketPreparePath(packetId, step.slug, locale)}
                  className="btn-secondary"
                  style={{ textDecoration: "none", display: "inline-block" }}
                  onClick={() => track("landingpage_cta_clicked", { source: `seo:${packetId}:${step.slug}` })}
                >
                  {done ? t("packet.sendAgain") : t("packet.sendThis")}
                </Link>
              </li>
            );
          })}
        </ol>

        <p style={{ marginTop: 8, fontSize: 14, color: "var(--mute)" }}>{t(`${p}.hint`)}</p>

        <h2 style={{ fontSize: 19, marginTop: 36 }}>{t("tpl.detail.faqTitle")}</h2>
        {Array.from({ length: FAQ_COUNT }, (_, i) => (
          <details key={i} className="faq-item" style={{ marginTop: 12 }}>
            <summary style={{ fontWeight: 700, cursor: "pointer" }}>{t(`${p}.faq.${i + 1}.q`)}</summary>
            <p style={{ margin: "8px 0 0", color: "var(--body)" }}>{t(`${p}.faq.${i + 1}.a`)}</p>
          </details>
        ))}

        <p style={{ marginTop: 24, fontSize: 14 }}>
          <Link to={localizePath("/dashboard", locale)}>{t("nav.dashboard")}</Link>
          {" · "}
          <Link to={localizePath("/cobro", locale)}>{t("footer.cobro")}</Link>
          {" · "}
          <Link to={localizePath("/pricing", locale)}>{t("footer.pricing")}</Link>
        </p>
      </div>
    </div>
  );
}
