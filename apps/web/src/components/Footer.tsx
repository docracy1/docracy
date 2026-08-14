import { Link, useLocation } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";

export default function Footer() {
  const t = useT();
  const { locale } = useI18n();
  const location = useLocation();
  if (location.pathname.startsWith("/sign/")) return null;

  // On Spanish SEO surfaces, prefer bilingual alternative landings over EN-only blog posts
  // so crawlers and visitors stay on /es. Competitors without an ES URL still use the blog.
  const compareLinks =
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
          { label: t("footer.vsEversign"), to: "/eversign-alternative" },
          { label: t("footer.vsDocusign"), to: "/docusign-alternative" },
          { label: t("footer.vsHellosign"), to: "/hellosign-alternative" },
          { label: t("footer.vsPandadoc"), to: "/pandadoc-alternative" },
          { label: t("footer.vsAdobe"), to: "/adobe-sign-alternative" },
          { label: t("footer.importGuide"), to: "/import-from-docusign" },
          { label: t("footer.allComparisons"), to: "/blog" },
        ];

  const columns: Array<{
    heading: string;
    links: Array<{ label: string; to: string; external?: boolean; openSalesChat?: boolean }>;
  }> = [
    {
      heading: t("footer.product"),
      links: [
        { label: t("footer.startFree"), to: localizePath("/prepare", locale) },
        { label: t("footer.pricing"), to: localizePath("/pricing", locale) },
        { label: t("footer.templates"), to: localizePath("/free-templates", locale) },
        { label: t("footer.ai"), to: localizePath("/ai", locale) },
        { label: t("footer.aiAnalysis"), to: localizePath("/ai-contract-analysis", locale) },
        { label: t("footer.createSignature"), to: localizePath("/create-a-digital-signature", locale) },
        { label: t("footer.esignSoftware"), to: localizePath("/esignature-software", locale) },
        { label: t("footer.signPdf"), to: localizePath("/sign-pdf-online", locale) },
        { label: t("footer.secureSig"), to: localizePath("/secure-electronic-signature", locale) },
        { label: t("footer.freeSig"), to: localizePath("/free-electronic-signature", locale) },
        { label: t("footer.mcp"), to: localizePath("/mcp", locale) },
        { label: t("footer.industries"), to: "/industry/small-business" },
        { label: t("footer.docs"), to: localizePath("/docs", locale) },
        { label: t("footer.faq"), to: `${localizePath("/", locale)}#faq` },
      ],
    },
    {
      heading: t("footer.compare"),
      links: compareLinks,
    },
    {
      heading: t("footer.company"),
      links: [
        { label: t("footer.about"), to: "/about" },
        { label: t("footer.roadmap"), to: "/roadmap" },
        { label: t("footer.status"), to: "/uptime" },
        { label: t("footer.imprint"), to: "/imprint" },
        {
          label: t("footer.contactSales"),
          to: "mailto:sales@docracy.io?subject=Docracy%20inquiry",
          external: true,
          openSalesChat: true,
        },
        { label: t("footer.github"), to: "https://github.com/docracy1/docracy-templates", external: true },
      ],
    },
    {
      heading: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), to: "/privacy" },
        { label: t("footer.trust"), to: "/trust" },
        { label: t("footer.esignUeta"), to: localizePath("/esign-ueta", locale) },
        { label: t("footer.guide"), to: "/electronic-signature-guide" },
        { label: t("footer.dpa"), to: "/dpa" },
        { label: t("footer.terms"), to: "/terms" },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
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

        {columns.map((col) => (
          <div key={col.heading} className="site-footer-col">
            <h4>{col.heading}</h4>
            {col.links.map((link) =>
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
                  {...(link.to.startsWith("http")
                    ? { target: "_blank", rel: "noopener noreferrer" }
                    : {})}
                >
                  {link.label}
                </a>
              ) : (
                <Link key={link.label} to={link.to}>
                  {link.label}
                </Link>
              )
            )}
          </div>
        ))}
      </div>
      <div className="site-footer-bottom">
        <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
        <span className="site-footer-esign">
          {t("footer.esignLine")}{" "}
          <Link to={localizePath("/esign-ueta", locale)}>{t("footer.esignLineLink")}</Link>
        </span>
        <span className="site-footer-esign">
          {t("footer.legalReviewLead")}{" "}
          <a href="https://www.linkedin.com/in/dr-denisa-boeck-373424123/" target="_blank" rel="noopener noreferrer">
            Dr. Denisa Boeck
          </a>
          {t("footer.legalReviewTrail")}
        </span>
      </div>
    </footer>
  );
}
