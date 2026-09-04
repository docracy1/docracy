import { Link, useLocation } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";

type FooterLink = {
  label: string;
  to: string;
  external?: boolean;
  openSalesChat?: boolean;
};

function FooterLinkList({ links }: { links: FooterLink[] }) {
  return (
    <>
      {links.map((link) =>
        link.external ? (
          <a
            key={link.label}
            href={link.to}
            onClick={
              link.openSalesChat
                ? () =>
                    window.dispatchEvent(
                      new CustomEvent("docracy:open-chat", { detail: { intent: "sales" } })
                    )
                : undefined
            }
            {...(link.to.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            {link.label}
          </a>
        ) : (
          <Link key={link.label} to={link.to}>
            {link.label}
          </Link>
        )
      )}
    </>
  );
}

function FooterCol({ heading, links }: { heading: string; links: FooterLink[] }) {
  return (
    <div className="site-footer-col">
      <h4>{heading}</h4>
      <FooterLinkList links={links} />
    </div>
  );
}

/**
 * Xodo-style fat footer: top row Brand + Product + Features + Industry + Developers + Connect;
 * bottom row Company + Legal + Compare aligned under the first three columns.
 */
export default function Footer() {
  const t = useT();
  const { locale } = useI18n();
  const location = useLocation();
  if (location.pathname.startsWith("/sign/")) return null;

  const compareLinks: FooterLink[] =
    locale === "es"
      ? [
          { label: t("footer.vsEversign"), to: "/es/alternativa-a-eversign" },
          { label: t("footer.vsDocusign"), to: "/es/alternativa-a-docusign" },
          { label: t("footer.vsHellosign"), to: "/es/alternativa-a-hellosign" },
          { label: t("footer.vsPandadoc"), to: "/es/alternativa-a-pandadoc" },
          { label: t("footer.vsAdobe"), to: "/es/alternativa-a-adobe-sign" },
          { label: t("footer.allComparisons"), to: "/blog" },
        ]
      : [
          // Footer stays lean — full list (20 compares + imports) lives in header Compare.
          { label: t("footer.vsDocusign"), to: "/docusign-alternative" },
          { label: t("footer.vsEversign"), to: "/eversign-alternative" },
          { label: t("footer.vsHellosign"), to: "/hellosign-alternative" },
          { label: t("footer.vsSignnow"), to: "/signnow-alternative" },
          { label: t("footer.hellosignVsSignnow"), to: "/hellosign-vs-signnow" },
          { label: t("footer.vsPandadoc"), to: "/pandadoc-alternative" },
          { label: t("footer.vsAdobe"), to: "/adobe-sign-alternative" },
          { label: t("footer.vsContractbook"), to: "/contractbook-alternative" },
          { label: t("footer.vsOnlinesignature"), to: "/onlinesignature-alternative" },
          { label: t("footer.allComparisons"), to: "/blog" },
        ];

  const productLinks: FooterLink[] = [
    { label: t("footer.startFree"), to: localizePath("/prepare", locale) },
    { label: t("footer.pricing"), to: localizePath("/pricing", locale) },
    { label: t("footer.templates"), to: localizePath("/free-templates", locale) },
    { label: t("footer.packet"), to: localizePath("/packets/us-contractor", locale) },
    { label: t("footer.latamPacket"), to: localizePath("/packets/latam-contractor", locale) },
    { label: t("footer.cobro"), to: localizePath("/cobro", locale) },
    { label: t("footer.taxYear"), to: localizePath("/1099-season", locale) },
    { label: t("footer.enterprise"), to: localizePath("/enterprise", locale) },
    { label: t("nav.blog"), to: "/blog" },
    { label: t("footer.docs"), to: localizePath("/docs", locale) },
    { label: t("footer.status"), to: "/uptime" },
    {
      label: t("footer.contactSales"),
      to: "mailto:sales@docracy.io?subject=Docracy%20inquiry",
      external: true,
      openSalesChat: true,
    },
  ];

  const featureLinks: FooterLink[] = [
    { label: t("footer.ai"), to: localizePath("/ai", locale) },
    { label: t("footer.aiAnalysis"), to: localizePath("/ai-contract-analysis", locale) },
    { label: t("footer.aiDrafting"), to: localizePath("/solutions/ai-contract-drafting", locale) },
    { label: t("footer.whatsappSigning"), to: "/whatsapp-signing" },
    { label: t("footer.signPdf"), to: localizePath("/sign-pdf-online", locale) },
    { label: t("footer.freeSig"), to: localizePath("/free-electronic-signature", locale) },
    { label: t("footer.verify"), to: localizePath("/verify", locale) },
  ];

  const industryLinks: FooterLink[] = [
    { label: t("footer.industryFreelancers"), to: "/industry/freelancers" },
    { label: t("footer.industryRealEstate"), to: "/industry/real-estate" },
    { label: t("footer.industryLegal"), to: "/industry/legal" },
    { label: t("footer.industryConstruction"), to: "/industry/construction" },
    { label: t("footer.industrySmallBusiness"), to: "/industry/small-business" },
    { label: t("footer.seeAllIndustries"), to: "/industry/small-business" },
  ];

  const developerLinks: FooterLink[] = [
    { label: t("footer.developers"), to: localizePath("/developers", locale) },
    { label: t("footer.mcp"), to: localizePath("/mcp", locale) },
    { label: t("footer.integrationsAi"), to: localizePath("/integrations/ai-assistants", locale) },
    { label: t("footer.apiDocs"), to: `${localizePath("/docs", locale)}#api` },
    { label: t("footer.github"), to: "https://github.com/docracy1/docracy-templates", external: true },
  ];

  const socialLinks: FooterLink[] = [
    { label: "X", to: "https://x.com/docracyHQ", external: true },
    { label: "LinkedIn", to: "https://www.linkedin.com/company/docracy-io", external: true },
    { label: "Facebook", to: "https://www.facebook.com/profile.php?id=61593490016379", external: true },
    { label: "GitHub", to: "https://github.com/docracy1/docracy-templates", external: true },
  ];

  const companyLinks: FooterLink[] = [
    { label: t("footer.about"), to: "/about" },
    { label: t("footer.roadmap"), to: "/roadmap" },
    { label: t("footer.imprint"), to: "/imprint" },
    { label: t("footer.trust"), to: "/trust" },
    {
      label: t("footer.contactSales"),
      to: "mailto:sales@docracy.io?subject=Docracy%20inquiry",
      external: true,
      openSalesChat: true,
    },
  ];

  const legalLinks: FooterLink[] = [
    { label: t("footer.privacy"), to: "/privacy" },
    { label: t("footer.terms"), to: "/terms" },
    { label: t("footer.dpa"), to: "/dpa" },
    { label: t("footer.esignUeta"), to: localizePath("/esign-ueta", locale) },
    { label: t("footer.guide"), to: "/electronic-signature-guide" },
    { label: t("footer.faq"), to: `${localizePath("/", locale)}#faq` },
  ];

  return (
    <footer className="site-footer">
      <div className="site-footer-grid">
        <div className="site-footer-brand">
          <img
            src="/docracy-wordmark.png"
            alt="Docracy"
            loading="lazy"
            width={165}
            height={64}
            style={{ height: 32, width: "auto" }}
          />
          <p>{t("footer.tagline")}</p>
        </div>

        <FooterCol heading={t("footer.product")} links={productLinks} />
        <FooterCol heading={t("footer.features")} links={featureLinks} />
        <FooterCol heading={t("footer.industry")} links={industryLinks} />
        <FooterCol heading={t("footer.developersHeading")} links={developerLinks} />

        <div className="site-footer-col site-footer-connect">
          <h4>{t("footer.connect")}</h4>
          <div className="site-footer-social">
            <FooterLinkList links={socialLinks} />
          </div>
        </div>

        <FooterCol heading={t("footer.company")} links={companyLinks} />
        <FooterCol heading={t("footer.legal")} links={legalLinks} />
        <FooterCol heading={t("footer.compare")} links={compareLinks} />
      </div>

      <div className="site-footer-bottom">
        <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        <span className="site-footer-esign">
          {t("footer.esignLine")}{" "}
          <Link to={localizePath("/esign-ueta", locale)}>{t("footer.esignLineLink")}</Link>
        </span>
      </div>
    </footer>
  );
}
