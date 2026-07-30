import { useEffect } from "react";
import { Link } from "react-router-dom";
import { FREE_TEMPLATES, RECURRING_CATEGORIES } from "../lib/freeTemplates";
import { isSeoTemplateSlug, localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";

const CATEGORY_KEYS: Record<string, string> = {
  NDAs: "freeTemplates.cat.ndas",
  "Client Contracts": "freeTemplates.cat.clientContracts",
  "Work Orders": "freeTemplates.cat.workOrders",
  "Vendor Agreements": "freeTemplates.cat.vendorAgreements",
  "Rental & Lease Agreements": "freeTemplates.cat.rentalLease",
  "Onboarding Documents": "freeTemplates.cat.onboarding",
  "Payment Agreements": "freeTemplates.cat.payment",
  "Compliance Documents": "freeTemplates.cat.compliance",
};

function TemplateCard({
  name,
  description,
  to,
}: {
  name: string;
  description: string;
  to: string;
}) {
  return (
    <Link to={to} className="card" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
      <h3 style={{ marginTop: 0, marginBottom: 8, fontSize: 16 }}>{name}</h3>
      <p style={{ margin: 0, fontSize: 13, color: "var(--mute)" }}>{description}</p>
    </Link>
  );
}

export default function FreeTemplates() {
  const t = useT();
  const { locale } = useI18n();

  useSeoMeta("freeTemplates");

  const labelFor = (slug: string, name: string, description: string) => {
    if (locale === "es" && isSeoTemplateSlug(slug)) {
      return { name: t(`tpl.${slug}.name`), description: t(`tpl.${slug}.description`) };
    }
    return { name, description };
  };

  useEffect(() => {
    const modelContext = (navigator as unknown as { modelContext?: { provideContext: (ctx: unknown) => void } }).modelContext;
    if (!modelContext?.provideContext) return;
    try {
      modelContext.provideContext({
        tools: [
          {
            name: "find_free_template",
            description:
              'Search Docracy\'s free, ready-to-sign document templates by name or use case (e.g. "NDA", "contractor", "lease").',
            inputSchema: {
              type: "object",
              properties: {
                query: { type: "string", description: "A word or phrase to match against template names and descriptions." },
              },
              required: ["query"],
            },
            async execute({ query }: { query: string }) {
              const q = query.trim().toLowerCase();
              const matches = FREE_TEMPLATES.filter(
                (tpl) => tpl.name.toLowerCase().includes(q) || tpl.description.toLowerCase().includes(q)
              ).map((tpl) => ({
                name: tpl.name,
                description: tpl.description,
                url: `https://docracy.io${localizePath(`/free-templates/${tpl.slug}`, locale)}`,
              }));
              return { matches };
            },
          },
        ],
      });
    } catch {
      // Experimental, unstable API — never let an unexpected shape/behavior break the page.
    }
  }, [locale]);

  useEffect(() => {
    const presentCategories = RECURRING_CATEGORIES.filter((c) => FREE_TEMPLATES.some((tpl) => tpl.recurringCategory === c));
    for (const category of presentCategories) {
      track("template_category_viewed", { templateCategory: category });
    }
  }, []);

  return (
    <div className="container">
      <h1 style={{ fontSize: 20, fontWeight: 700, letterSpacing: "-0.01em" }}>{t("freeTemplates.heading")}</h1>
      <p style={{ maxWidth: 640, fontSize: 14, color: "var(--body)" }}>{t("freeTemplates.intro")}</p>

      <p style={{ maxWidth: 640, fontSize: 14, fontWeight: 700, margin: "16px 0 8px" }}>{t("freeTemplates.howItWorks")}</p>
      <ol style={{ maxWidth: 640, fontSize: 14, color: "var(--body)", margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
        <li>{t("freeTemplates.step1")}</li>
        <li>{t("freeTemplates.step2")}</li>
        <li>{t("freeTemplates.step3")}</li>
      </ol>

      <p style={{ maxWidth: 640, fontSize: 14, fontWeight: 700, margin: "16px 0 8px" }}>{t("freeTemplates.popularTitle")}</p>
      <ul style={{ maxWidth: 640, fontSize: 14, color: "var(--body)", margin: 0, paddingLeft: 20, lineHeight: 1.7 }}>
        <li>{t("freeTemplates.pop1")}</li>
        <li>{t("freeTemplates.pop2")}</li>
        <li>{t("freeTemplates.pop3")}</li>
        <li>{t("freeTemplates.pop4")}</li>
        <li>{t("freeTemplates.pop5")}</li>
        <li>{t("freeTemplates.pop6")}</li>
        <li>{t("freeTemplates.pop7")}</li>
        <li>{t("freeTemplates.pop8")}</li>
      </ul>

      <p style={{ maxWidth: 640, fontSize: 13, color: "var(--mute)", fontStyle: "italic", margin: "16px 0 28px" }}>
        {t("freeTemplates.tip")}
      </p>

      {RECURRING_CATEGORIES.map((category) => {
        const inCategory = FREE_TEMPLATES.filter((tpl) => tpl.recurringCategory === category);
        if (inCategory.length === 0) return null;
        const catKey = CATEGORY_KEYS[category];
        return (
          <div key={category} style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 19 }}>{catKey ? t(catKey) : category}</h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
              {inCategory.map((tpl) => {
                const labels = labelFor(tpl.slug, tpl.name, tpl.description);
                return (
                  <TemplateCard
                    key={tpl.slug}
                    name={labels.name}
                    description={labels.description}
                    to={localizePath(`/free-templates/${tpl.slug}`, locale)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      <div style={{ marginTop: 32 }}>
        <h2 style={{ fontSize: 19 }}>{t("freeTemplates.allTemplates")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
          {FREE_TEMPLATES.map((tpl) => {
            const labels = labelFor(tpl.slug, tpl.name, tpl.description);
            return (
              <TemplateCard
                key={tpl.slug}
                name={labels.name}
                description={labels.description}
                to={localizePath(`/free-templates/${tpl.slug}`, locale)}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}
