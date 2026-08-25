import SeoFunnelPage from "../components/SeoFunnelPage";

const FEATURES = ["templates", "status", "clients", "limits"] as const;

/** Integration landing for AI assistants (Claude, ChatGPT, Gemini-class agents via MCP). */
export default function IntegrationsAiAssistants() {
  return (
    <SeoFunnelPage
      seoPage="integrationsAi"
      seoCatalogKey="integrationsAi"
      i18nPrefix="integrationsAi"
      trackSource="integrations-ai"
      primaryCtaTo="/mcp"
      secondaryCtaTo="/developers"
      featureIds={FEATURES}
      relatedLinks={[
        { to: "/ai", labelKey: "integrationsAi.linkAi" },
        { to: "/solutions/ai-contract-drafting", labelKey: "integrationsAi.linkDrafting" },
        { to: "/enterprise", labelKey: "integrationsAi.linkEnterprise" },
        { to: "/docs", labelKey: "integrationsAi.linkDocs" },
      ]}
    />
  );
}
