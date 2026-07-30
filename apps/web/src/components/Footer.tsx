import { Link, useLocation } from "react-router-dom";
import { useT } from "../lib/i18n";

export default function Footer() {
  const t = useT();
  const location = useLocation();
  if (location.pathname.startsWith("/sign/")) return null;

  const columns: Array<{ heading: string; links: Array<{ label: string; to: string; external?: boolean }> }> = [
    {
      heading: t("footer.product"),
      links: [
        { label: t("footer.startFree"), to: "/prepare" },
        { label: t("footer.pricing"), to: "/pricing" },
        { label: t("footer.templates"), to: "/free-templates" },
        { label: t("footer.mcp"), to: "/mcp" },
        { label: t("footer.docs"), to: "/docs" },
        { label: t("footer.faq"), to: "/#faq" },
      ],
    },
    {
      heading: t("footer.compare"),
      links: [
        { label: t("footer.vsEversign"), to: "/blog/docracy-vs-eversign" },
        { label: t("footer.vsDocusign"), to: "/blog/docracy-vs-docusign" },
        { label: t("footer.vsPandadoc"), to: "/blog/docracy-vs-pandadoc" },
        { label: t("footer.vsAdobe"), to: "/blog/docracy-vs-adobe-acrobat-sign" },
        { label: t("footer.allComparisons"), to: "/blog" },
      ],
    },
    {
      heading: t("footer.company"),
      links: [
        { label: t("footer.about"), to: "/about" },
        { label: t("footer.status"), to: "/uptime" },
        { label: t("footer.imprint"), to: "/imprint" },
        { label: t("footer.contactSales"), to: "mailto:sales@docracy.io", external: true },
        { label: t("footer.github"), to: "https://github.com/docracy1/docracy-templates", external: true },
      ],
    },
    {
      heading: t("footer.legal"),
      links: [
        { label: t("footer.privacy"), to: "/privacy" },
        { label: t("footer.trust"), to: "/trust" },
        { label: t("footer.dpa"), to: "/dpa" },
        { label: t("footer.terms"), to: "/terms" },
      ],
    },
  ];

  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <img src="/docracy-wordmark.png" alt="Docracy" loading="lazy" style={{ height: 32, width: "auto" }} />
          <p>{t("footer.tagline")}</p>
        </div>

        {columns.map((col) => (
          <div key={col.heading} className="site-footer-col">
            <h4>{col.heading}</h4>
            {col.links.map((link) =>
              link.external ? (
                <a key={link.label} href={link.to} target="_blank" rel="noopener noreferrer">
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
      <div className="site-footer-bottom">{t("footer.copyright", { year: new Date().getFullYear() })}</div>
    </footer>
  );
}
