import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { getFreeTemplate } from "../lib/freeTemplates";
import {
  packetPreparePath,
  packetSentSlugs,
  US_CONTRACTOR_PACKET_SLUG,
  US_CONTRACTOR_PACKET_TEMPLATES,
} from "../lib/contractorPacket";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { track } from "../lib/track";

/**
 * One US contractor onboarding kit: NDA + W-9 + independent contractor agreement.
 * Sends are still one PDF each (existing templates) — a wizard, not a new packet builder.
 */
export default function ContractorPacket() {
  const t = useT();
  const { locale } = useI18n();
  const sent = new Set(packetSentSlugs());
  const firstUnsent = US_CONTRACTOR_PACKET_TEMPLATES.find((step) => !sent.has(step.slug)) ?? US_CONTRACTOR_PACKET_TEMPLATES[0];

  usePageMeta(t("packet.seoTitle"), t("packet.seoDescription"), {
    canonicalPath: locale === "es" ? "/es/kit-contratista" : "/packets/us-contractor",
    alternates: { en: "/packets/us-contractor", es: "/es/kit-contratista" },
  });

  const startTo = packetPreparePath(firstUnsent.slug, locale);

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <p className="hero-kicker" style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {t("packet.kicker")}
          </p>
          <h1>{t("packet.heroTitle")}</h1>
          <p>{t("packet.heroSub")}</p>
          <div style={{ marginTop: 20 }}>
            <Link
              to={startTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("landingpage_cta_clicked", { source: `seo:${US_CONTRACTOR_PACKET_SLUG}:hero` })}
            >
              {t("packet.ctaStart")}
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("packet.stepsTitle")}</h2>
        <p style={{ color: "var(--mute)" }}>{t("packet.stepsSub")}</p>
        <ol className="packet-steps">
          {US_CONTRACTOR_PACKET_TEMPLATES.map((step) => {
            const tpl = getFreeTemplate(step.slug);
            const done = sent.has(step.slug);
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
                  to={packetPreparePath(step.slug, locale)}
                  className="btn-secondary"
                  style={{ textDecoration: "none", display: "inline-block" }}
                  onClick={() =>
                    track("landingpage_cta_clicked", { source: `seo:${US_CONTRACTOR_PACKET_SLUG}:${step.slug}` })
                  }
                >
                  {done ? t("packet.sendAgain") : t("packet.sendThis")}
                </Link>
              </li>
            );
          })}
        </ol>

        <h2 style={{ fontSize: 22, marginTop: 40 }}>{t("packet.payTitle")}</h2>
        <p>{t("packet.payBody")}</p>
        <p>
          <Link to={localizePath("/pricing", locale)}>{t("packet.keepLink")}</Link>
        </p>
      </div>
    </div>
  );
}
