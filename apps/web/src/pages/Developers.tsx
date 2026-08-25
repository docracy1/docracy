import SeoFunnelPage from "../components/SeoFunnelPage";

const FEATURES = ["templates", "mcp", "api", "zapier"] as const;

export default function Developers() {
  return (
    <SeoFunnelPage
      seoPage="developers"
      seoCatalogKey="developers"
      i18nPrefix="developers"
      trackSource="developers"
      primaryCtaTo="/docs"
      primaryCtaQuery="#api"
      secondaryCtaTo="/mcp"
      featureIds={FEATURES}
      relatedLinks={[
        { to: "/mcp", labelKey: "developers.linkMcp" },
        { to: "/ai", labelKey: "developers.linkAi" },
        { to: "/free-templates", labelKey: "developers.linkTemplates" },
        { to: "/integrations/ai-assistants", labelKey: "developers.linkIntegrations" },
      ]}
    />
  );
}
