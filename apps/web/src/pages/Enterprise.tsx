import SeoFunnelPage from "../components/SeoFunnelPage";

const FEATURES = ["workspace", "governance", "mcp", "support"] as const;

export default function Enterprise() {
  return (
    <SeoFunnelPage
      seoPage="enterprise"
      seoCatalogKey="enterprise"
      i18nPrefix="enterprise"
      trackSource="enterprise"
      primaryCtaTo="/pricing"
      secondaryCtaTo="/trust"
      featureIds={FEATURES}
      relatedLinks={[
        { to: "/dpa", labelKey: "enterprise.linkDpa" },
        { to: "/mcp", labelKey: "enterprise.linkMcp" },
        { to: "/docs", labelKey: "enterprise.linkDocs" },
        { to: "/integrations/ai-assistants", labelKey: "enterprise.linkIntegrations" },
      ]}
    />
  );
}
