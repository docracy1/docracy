import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FREE_TEMPLATES, RECURRING_CATEGORIES } from "../lib/freeTemplates";
import { isSeoTemplateSlug, localizePath, useI18n, useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import { track } from "../lib/track";
import TemplateThumbnail from "../components/TemplateThumbnail";

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

// Anchor ids for the category-description grid's links to jump straight to that category's real
// template cards further down the page — same key suffix as CATEGORY_KEYS, just slug-cased.
const CATEGORY_ANCHORS: Record<string, string> = {
  NDAs: "cat-ndas",
  "Client Contracts": "cat-client-contracts",
  "Work Orders": "cat-work-orders",
  "Vendor Agreements": "cat-vendor-agreements",
  "Rental & Lease Agreements": "cat-rental-lease",
  "Onboarding Documents": "cat-onboarding",
  "Payment Agreements": "cat-payment",
  "Compliance Documents": "cat-compliance",
};

function TemplateCard({
  name,
  description,
  to,
  pdfPath,
  category,
}: {
  name: string;
  description: string;
  to: string;
  pdfPath: string;
  category?: string;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div className="template-card-wrap" onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)}>
      <Link to={to} className="template-tile" style={{ textDecoration: "none", color: "inherit" }}>
        <div className="template-tile-image">
          <TemplateThumbnail pdfPath={pdfPath} width={220} />
        </div>
        <div className="template-tile-body">
          {category && <span className="template-tile-tag">{category}</span>}
          <h3>{name}</h3>
        </div>
      </Link>

      {hovered && (
        <Link to={to} className="template-preview-popover" style={{ textDecoration: "none" }}>
          <div className="template-preview-thumb">
            <TemplateThumbnail pdfPath={pdfPath} width={260} />
          </div>
          <div className="template-preview-info">
            {category && <span className="template-preview-tag">{category}</span>}
            <h3>{name}</h3>
            <p>{description}</p>
            <span className="template-preview-meta">Free · No signup required</span>
            <span className="template-preview-cta">View template</span>
          </div>
        </Link>
      )}
    </div>
  );
}

export default function FreeTemplates() {
  const t = useT();
  const { locale } = useI18n();
  const [query, setQuery] = useState("");
  // Defaults closed for real visitors (matches the reference's collapsed-by-default toggle), but
  // the panel below is always rendered in the DOM and only hidden with CSS `display`, not removed
  // via conditional rendering — so prerender.mjs's static HTML still contains the full category
  // descriptions for crawlers, even though a first-time visitor sees it collapsed.
  const [categoriesOpen, setCategoriesOpen] = useState(false);

  useSeoMeta("freeTemplates");

  const labelFor = (slug: string, name: string, description: string) => {
    if (locale === "es" && isSeoTemplateSlug(slug)) {
      return { name: t(`tpl.${slug}.name`), description: t(`tpl.${slug}.description`) };
    }
    return { name, description };
  };

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    return FREE_TEMPLATES.filter((tpl) => {
      const labels = labelFor(tpl.slug, tpl.name, tpl.description);
      return labels.name.toLowerCase().includes(q) || labels.description.toLowerCase().includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, locale]);

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
    <div>
      <div className="templates-utility-bar">
        <span className="templates-utility-label">{t("freeTemplates.utilityBarLabel")}</span>
        <button
          type="button"
          className="templates-categories-toggle"
          aria-expanded={categoriesOpen}
          onClick={() => setCategoriesOpen((v) => !v)}
        >
          {t("freeTemplates.categoriesToggle")}
          <span className={categoriesOpen ? "templates-chevron templates-chevron-up" : "templates-chevron"}>▾</span>
        </button>
      </div>

      <div className="templates-categories-dropdown" style={{ display: categoriesOpen ? "block" : "none" }}>
        <p style={{ maxWidth: 640, fontSize: 14, color: "var(--body)", margin: "0 0 20px" }}>
          {t("freeTemplates.categoriesIntro")}
        </p>
        <div className="templates-categories-grid">
          {RECURRING_CATEGORIES.map((category) => {
            const inCategory = FREE_TEMPLATES.filter((tpl) => tpl.recurringCategory === category);
            if (inCategory.length === 0) return null;
            const catKey = CATEGORY_KEYS[category];
            return (
              <a key={category} href={`#${CATEGORY_ANCHORS[category]}`} className="templates-category-item">
                <h3>{catKey ? t(catKey) : category}</h3>
                <p>{catKey ? t(`${catKey}.desc`) : ""}</p>
              </a>
            );
          })}
        </div>
      </div>

      <div className="hero-band templates-hero">
        <div className="templates-hero-inner">
          <h1>{t("freeTemplates.heroHeadline")}</h1>
          <p>{t("freeTemplates.heroSub")}</p>
          <div className="templates-search-wrap">
            <svg className="templates-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
              <path d="M21 21l-4.3-4.3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <input
              type="search"
              className="templates-search-input"
              placeholder={t("freeTemplates.searchPlaceholder")}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label={t("freeTemplates.searchPlaceholder")}
            />
          </div>
          <p className="templates-legal-review">
            {t("freeTemplates.legalReviewLead")}{" "}
            <a href="https://www.boeck.law/about" target="_blank" rel="noopener noreferrer">
              Dr. Denisa Boeck
            </a>
            {t("freeTemplates.legalReviewTrail")}
          </p>
        </div>
      </div>

      <div className="container">
        {searchResults ? (
          <div style={{ marginTop: 28 }}>
            {searchResults.length === 0 ? (
              <p style={{ maxWidth: 640, fontSize: 14, color: "var(--mute)" }}>
                {t("freeTemplates.noResults", { query })}
              </p>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {searchResults.map((tpl) => {
                  const labels = labelFor(tpl.slug, tpl.name, tpl.description);
                  const catKey = tpl.recurringCategory ? CATEGORY_KEYS[tpl.recurringCategory] : undefined;
                  return (
                    <TemplateCard
                      key={tpl.slug}
                      name={labels.name}
                      description={labels.description}
                      to={localizePath(`/free-templates/${tpl.slug}`, locale)}
                      pdfPath={tpl.pdfPath}
                      category={catKey ? t(catKey) : tpl.recurringCategory}
                    />
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ marginTop: 28 }}>
              <h2 style={{ fontSize: 19 }}>{t("freeTemplates.featuredTitle")}</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: 16 }}>
                {FREE_TEMPLATES.filter((tpl) => tpl.featured).map((tpl) => {
                  const labels = labelFor(tpl.slug, tpl.name, tpl.description);
                  const catKey = tpl.recurringCategory ? CATEGORY_KEYS[tpl.recurringCategory] : undefined;
                  return (
                    <TemplateCard
                      key={tpl.slug}
                      name={labels.name}
                      description={labels.description}
                      to={localizePath(`/free-templates/${tpl.slug}`, locale)}
                      pdfPath={tpl.pdfPath}
                      category={catKey ? t(catKey) : tpl.recurringCategory}
                    />
                  );
                })}
              </div>
            </div>

            {RECURRING_CATEGORIES.map((category) => {
              const inCategory = FREE_TEMPLATES.filter((tpl) => tpl.recurringCategory === category);
              if (inCategory.length === 0) return null;
              const catKey = CATEGORY_KEYS[category];
              return (
                <div key={category} id={CATEGORY_ANCHORS[category]} style={{ marginTop: 32, scrollMarginTop: 90 }}>
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
                          pdfPath={tpl.pdfPath}
                          category={catKey ? t(catKey) : category}
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
                  const catKey = tpl.recurringCategory ? CATEGORY_KEYS[tpl.recurringCategory] : undefined;
                  return (
                    <TemplateCard
                      key={tpl.slug}
                      name={labels.name}
                      description={labels.description}
                      to={localizePath(`/free-templates/${tpl.slug}`, locale)}
                      pdfPath={tpl.pdfPath}
                      category={catKey ? t(catKey) : tpl.recurringCategory}
                    />
                  );
                })}
              </div>
            </div>

            <div className="templates-faq">
              <h2 style={{ fontSize: 19 }}>{t("freeTemplates.faqTitle")}</h2>
              {(["faq1", "faq2", "faq3", "faq4", "faq5", "faq6"] as const).map((key) => (
                <details key={key} className="templates-faq-item">
                  <summary>{t(`freeTemplates.${key}.q`)}</summary>
                  <p>{t(`freeTemplates.${key}.a`)}</p>
                </details>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
