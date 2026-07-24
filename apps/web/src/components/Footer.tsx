import { Link } from "react-router-dom";

const COLUMNS: Array<{ heading: string; links: Array<{ label: string; to: string; external?: boolean }> }> = [
  {
    heading: "Product",
    links: [
      { label: "Start free", to: "/prepare" },
      { label: "Pricing", to: "/pricing" },
      { label: "Free templates", to: "/free-templates" },
      { label: "AI & MCP", to: "/mcp" },
      { label: "Docs", to: "/docs" },
    ],
  },
  {
    heading: "Compare",
    links: [
      { label: "vs eversign", to: "/blog/docracy-vs-eversign" },
      { label: "vs DocuSign", to: "/blog/docracy-vs-docusign" },
      { label: "vs PandaDoc", to: "/blog/docracy-vs-pandadoc" },
      { label: "vs Adobe Acrobat Sign", to: "/blog/docracy-vs-adobe-acrobat-sign" },
      { label: "See all comparisons", to: "/blog" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "About", to: "/about" },
      { label: "Status", to: "/uptime" },
      { label: "Imprint", to: "/imprint" },
      { label: "Contact sales", to: "mailto:sales@docracy.io", external: true },
      { label: "GitHub", to: "https://github.com/docracy1/docracy-templates", external: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container site-footer-inner">
        <div className="site-footer-brand">
          <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: 32, width: "auto" }} />
          <p>Free, no-signup e-signatures that disappear once the chain is done.</p>
        </div>

        {COLUMNS.map((col) => (
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
      <div className="site-footer-bottom">© {new Date().getFullYear()} Docracy — a product of RELACON GmbH</div>
    </footer>
  );
}
