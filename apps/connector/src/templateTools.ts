import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

const API_BASE = "https://api.docracy.io";
const APP_BASE = "https://docracy.io";

/** Curated free-library slugs agents can open without a Marketplace DB row. */
const FREE_LIBRARY: Array<{ slug: string; name: string; category: string; description: string }> = [
  {
    slug: "mutual-nda",
    name: "Mutual NDA",
    category: "nda",
    description: "Standard mutual non-disclosure for two parties exploring a deal.",
  },
  {
    slug: "independent-contractor-agreement",
    name: "Independent Contractor Agreement",
    category: "contractor",
    description: "Scope, pay, and IP for hiring a 1099 contractor.",
  },
  {
    slug: "freelance-service-agreement",
    name: "Freelance Service Agreement",
    category: "freelance",
    description: "Project-based client ↔ freelancer terms.",
  },
  {
    slug: "offer-letter",
    name: "Offer Letter",
    category: "hr",
    description: "Job offer covering title, pay, start date, and at-will employment.",
  },
  {
    slug: "remote-work-policy",
    name: "Remote Work Policy",
    category: "hr",
    description: "Remote / hybrid work expectations acknowledgment.",
  },
];

type MarketplaceSummary = {
  slug: string;
  title: string;
  category?: string | null;
  description?: string | null;
  origin?: string | null;
};

async function fetchMarketplaceList(query?: string): Promise<MarketplaceSummary[]> {
  try {
    const res = await fetch(`${API_BASE}/api/marketplace`);
    if (!res.ok) return [];
    const data = (await res.json()) as { templates?: MarketplaceSummary[] };
    const list = data.templates ?? [];
    const q = (query ?? "").trim().toLowerCase();
    if (!q) return list.slice(0, 30);
    return list
      .filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.slug?.toLowerCase().includes(q) ||
          (t.category ?? "").toLowerCase().includes(q) ||
          (t.description ?? "").toLowerCase().includes(q)
      )
      .slice(0, 30);
  } catch {
    return [];
  }
}

async function fetchMarketplaceDetail(slug: string): Promise<Record<string, unknown> | null> {
  try {
    const res = await fetch(`${API_BASE}/api/marketplace/${encodeURIComponent(slug)}`);
    if (!res.ok) return null;
    return (await res.json()) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function freePrepareUrl(slug: string) {
  return `${APP_BASE}/prepare?freeTemplate=${encodeURIComponent(slug)}`;
}

function marketplacePrepareUrl(slug: string) {
  return `${APP_BASE}/prepare?marketplaceTemplate=${encodeURIComponent(slug)}`;
}

function libraryPageUrl(slug: string) {
  return `${APP_BASE}/free-templates/${encodeURIComponent(slug)}`;
}

/**
 * Public template tools — no account required. Agents browse Docracy’s open template catalog
 * and get prepare links / drafting hints. Does not send or sign documents.
 */
export function registerTemplateTools(server: McpServer) {
  server.registerTool(
    "list_templates",
    {
      title: "List Docracy legal templates",
      description:
        "List free and Marketplace legal templates from Docracy (NDAs, contractor agreements, offer letters, etc.). Optional text filter. Returns slugs and prepare URLs — does not create or send documents.",
      inputSchema: {
        query: z
          .string()
          .optional()
          .describe("Optional filter (e.g. nda, freelancer, offer letter). Omit to list popular templates."),
      },
    },
    async ({ query }) => {
      const q = (query ?? "").trim().toLowerCase();
      const free = FREE_LIBRARY.filter(
        (t) =>
          !q ||
          t.slug.includes(q) ||
          t.name.toLowerCase().includes(q) ||
          t.category.includes(q) ||
          t.description.toLowerCase().includes(q)
      ).map((t) => ({
        source: "free_library",
        slug: t.slug,
        title: t.name,
        category: t.category,
        description: t.description,
        pageUrl: libraryPageUrl(t.slug),
        prepareUrl: freePrepareUrl(t.slug),
      }));

      const market = (await fetchMarketplaceList(query)).map((t) => ({
        source: "marketplace",
        slug: t.slug,
        title: t.title,
        category: t.category ?? null,
        description: t.description ?? null,
        pageUrl: `${APP_BASE}/free-templates?highlight=${encodeURIComponent(t.slug)}`,
        prepareUrl: marketplacePrepareUrl(t.slug),
      }));

      const lines = [
        `Found ${free.length} free-library + ${market.length} marketplace template(s).`,
        "Use get_template or draft_from_template with a slug. Humans complete signing on docracy.io — this tool never sends documents.",
        "",
        ...free.map((t) => `[free] ${t.title} (${t.slug}) — ${t.prepareUrl}`),
        ...market.map((t) => `[marketplace] ${t.title} (${t.slug}) — ${t.prepareUrl}`),
      ];
      return { content: [{ type: "text", text: lines.join("\n") }] };
    }
  );

  server.registerTool(
    "get_template",
    {
      title: "Get a Docracy template",
      description:
        "Fetch metadata for one Docracy template by slug (title, description, key clauses / drafting hints when available) plus the prepare URL to open it for e-signature.",
      inputSchema: {
        slug: z.string().describe("Template slug, e.g. mutual-nda or a Marketplace slug from list_templates."),
      },
    },
    async ({ slug }) => {
      const trimmed = slug.trim();
      const free = FREE_LIBRARY.find((t) => t.slug === trimmed);
      if (free) {
        const text = [
          `Title: ${free.name}`,
          `Source: free_library`,
          `Category: ${free.category}`,
          `Description: ${free.description}`,
          `Page: ${libraryPageUrl(free.slug)}`,
          `Prepare (signable): ${freePrepareUrl(free.slug)}`,
          `PDF: ${APP_BASE}/free-templates/${free.slug}.pdf (when published as static asset)`,
          "",
          "Tip: For richer SEO fields (definition, keyClauses, chatgptPrompts), open the template page or use a Marketplace slug.",
        ].join("\n");
        return { content: [{ type: "text", text }] };
      }

      const detail = await fetchMarketplaceDetail(trimmed);
      if (!detail) {
        return {
          content: [
            {
              type: "text",
              text: `No template found for slug "${trimmed}". Try list_templates or browse ${APP_BASE}/free-templates.`,
            },
          ],
        };
      }

      const title = String(detail.title ?? trimmed);
      const keyClauses = Array.isArray(detail.keyClauses) ? (detail.keyClauses as string[]) : [];
      const prompts = Array.isArray(detail.chatgptPrompts) ? (detail.chatgptPrompts as string[]) : [];
      const text = [
        `Title: ${title}`,
        `Source: marketplace`,
        `Category: ${detail.category ?? "—"}`,
        `Description: ${detail.description ?? "—"}`,
        detail.definition ? `Definition: ${detail.definition}` : null,
        detail.useCase ? `Use case: ${detail.useCase}` : null,
        keyClauses.length ? `Key clauses:\n- ${keyClauses.join("\n- ")}` : null,
        prompts.length ? `Drafting prompts:\n- ${prompts.join("\n- ")}` : null,
        `Prepare (signable): ${marketplacePrepareUrl(trimmed)}`,
        `PDF API: ${API_BASE}/api/marketplace/${encodeURIComponent(trimmed)}/pdf`,
        "",
        "This metadata is for drafting assistance. Signing still happens when a human opens the prepare URL on Docracy.",
      ]
        .filter(Boolean)
        .join("\n");
      return { content: [{ type: "text", text }] };
    }
  );

  server.registerTool(
    "draft_from_template",
    {
      title: "Draft from a Docracy template",
      description:
        "Start an agentic drafting workflow from a trusted Docracy template. Returns the prepare URL (fields already placed where applicable), library page, and drafting hints. Does NOT auto-send for signature — the human reviews and sends on docracy.io. Optional notes are echoed as a drafting brief for the assistant.",
      inputSchema: {
        slug: z.string().describe("Template slug from list_templates (e.g. mutual-nda)."),
        notes: z
          .string()
          .optional()
          .describe("Optional deal context the assistant should apply when customizing the draft (parties, fee, dates)."),
      },
    },
    async ({ slug, notes }) => {
      const trimmed = slug.trim();
      const free = FREE_LIBRARY.find((t) => t.slug === trimmed);
      const detail = free ? null : await fetchMarketplaceDetail(trimmed);

      if (!free && !detail) {
        return {
          content: [
            {
              type: "text",
              text: `Unknown slug "${trimmed}". Call list_templates first, or browse ${APP_BASE}/free-templates.`,
            },
          ],
        };
      }

      const title = free?.name ?? String(detail?.title ?? trimmed);
      const prepareUrl = free ? freePrepareUrl(trimmed) : marketplacePrepareUrl(trimmed);
      const pageUrl = free ? libraryPageUrl(trimmed) : `${APP_BASE}/free-templates`;
      const prompts = Array.isArray(detail?.chatgptPrompts) ? (detail!.chatgptPrompts as string[]) : [];
      const keyClauses = Array.isArray(detail?.keyClauses) ? (detail!.keyClauses as string[]) : [];

      const text = [
        `## Draft from Docracy template: ${title}`,
        `Prepare / sign URL (open in browser): ${prepareUrl}`,
        `Template page: ${pageUrl}`,
        "",
        "### Assistant instructions",
        "1. Use this template as the trusted baseline (open-legal / community-standard style).",
        "2. Customize party names, dates, fees, and jurisdiction from the user's notes — do not invent compliance certifications Docracy does not provide.",
        "3. When the draft is ready for signature, send the human to the Prepare URL above (or /prepare with their PDF).",
        "4. Docracy SES e-signatures support ESIGN/UETA-style workflows; no identity verification (AES/QES).",
        notes?.trim() ? `\n### User notes\n${notes.trim()}` : null,
        keyClauses.length ? `\n### Key clauses to preserve\n- ${keyClauses.join("\n- ")}` : null,
        prompts.length ? `\n### Suggested drafting prompts\n- ${prompts.join("\n- ")}` : null,
        "",
        "Related product pages: AI tools https://docracy.io/ai · MCP https://docracy.io/mcp · Developers https://docracy.io/developers",
      ]
        .filter(Boolean)
        .join("\n");

      return { content: [{ type: "text", text }] };
    }
  );
}
