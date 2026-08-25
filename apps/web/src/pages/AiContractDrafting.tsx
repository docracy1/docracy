import SeoFunnelPage from "../components/SeoFunnelPage";

const FEATURES = ["templates", "generate", "review", "sign"] as const;

export default function AiContractDrafting() {
  return (
    <SeoFunnelPage
      seoPage="aiContractDrafting"
      seoCatalogKey="aiContractDrafting"
      i18nPrefix="aiDrafting"
      trackSource="ai-contract-drafting"
      primaryCtaTo="/prepare"
      primaryCtaQuery="?ref=seo-ai-drafting"
      secondaryCtaTo="/free-templates"
      featureIds={FEATURES}
      relatedLinks={[
        { to: "/ai", labelKey: "aiDrafting.linkAi" },
        { to: "/ai-contract-analysis", labelKey: "aiDrafting.linkAnalysis" },
        { to: "/mcp", labelKey: "aiDrafting.linkMcp" },
        { to: "/developers", labelKey: "aiDrafting.linkDevelopers" },
      ]}
    />
  );
}
