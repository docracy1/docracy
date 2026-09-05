import { sanitizeJsonStringNewlines } from "./aiJson";
import { slugify } from "./blogPosts";
import { pingIndexNow } from "./indexNow";
import { listWeeklyOfficial, publishOfficialTemplate } from "./marketplaceTemplates";
import { renderTemplatePdf, type TemplatePdfBlock } from "./templatePdf";
import { isLatamJobPhraseTemplate } from "./latamJobPhrasePriority";
import { ensureWeeklyTemplateInfra, shouldCatchUpWeeklyTemplates } from "./templateTopicQueue";
import type { Env } from "@docracy/shared";

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
/** How many full FreeTemplate-quality docs to publish each Monday. */
export const WEEKLY_TEMPLATE_BATCH = 10;

const RECURRING_CATEGORIES = [
  "Real Estate",
  "Will",
  "Power of Attorney",
  "Personal Property",
  "Non-Disclosure",
  "Employment",
  "Sale and Purchase",
  "Consulting",
  "Incorporation",
  "Funding",
  "Intellectual Property",
  "Equity",
  "Compliance Documents",
] as const;

interface TopicRow {
  id: string;
  slug: string;
  title: string;
  category: string;
  angle: string;
  status: string;
}

/** Same catalog shape as apps/web FreeTemplate — weekly rows must not be thinner than static ones. */
export interface DraftedTemplate {
  title: string;
  seoTitle: string;
  description: string;
  useCase: string;
  definition: string;
  keyClauses: string[];
  fillInFields: string[];
  legalSummary: string;
  chatgptPrompts: string[];
  signerLabels: string[];
  category: string;
  blocks: TemplatePdfBlock[];
  slug: string;
}

const SYSTEM_PROMPT = `
You author free e-signature document templates for Docracy (docracy.io), matching the quality of
the existing FREE_TEMPLATES catalog — NOT thin one-pagers.

Respond with ONLY a JSON object (no markdown fences):
{
  "title": "DOCUMENT TITLE IN TITLE CASE",
  "seoTitle": "Free <Name> Template",
  "description": "one SEO sentence, 140-160 chars (minimum 120 for search snippets)",
  "useCase": "2 sentences: when to use this",
  "definition": "1-2 sentence formal definition of what this document is",
  "keyClauses": ["clause paraphrase 1", "... 5 to 8 items"],
  "fillInFields": ["[Party A Name]", "... 6 to 12 bracket placeholders"],
  "legalSummary": "2-3 sentences: what signing establishes",
  "chatgptPrompts": ["prompt1", "prompt2", "prompt3"],
  "signerLabels": ["Role A", "Role B"],
  "blocks": [ ... ]
}

blocks[] uses the same PDF layout scheme as generateFreeTemplatePdfs.mjs:
- {"type":"section","text":"Parties"}
- {"type":"paragraph","text":"... full sentences, no markdown ..."}
- {"type":"field","label":"Employer: "}   // underscore blank is added automatically
- {"type":"signatures","signers":[{"label":"Employer","order":1},{"label":"Employee","order":2}]}

Hard requirements (reject-quality if missed — the cron will skip thin drafts):
- At least 6 "section" blocks with real clause headings (Parties, plus substantive sections)
- At least 10 "paragraph" blocks with useful legal/business prose (not filler)
- At least 6 "field" blocks for fill-in blanks (party names, dates, amounts, addresses, etc.)
- Exactly one trailing "signatures" block covering every signerLabel in order
- Paragraph text combined should be roughly 450–900 words
- Use [Bracket Placeholders] inside paragraphs where specifics belong
- Do NOT use **, *, #, or HTML anywhere
- Do NOT invent identity verification or claim this is attorney-drafted legal advice
- Plain US/general small-business English; include a short "Not legal advice" / governing-law style section near the end before signatures
- signerLabels: 1–3 short role names; every signatures.signers[].order must match 1..N
`.trim();

function requireDb(env: Env) {
  if (!env.DOCRACY_DB) throw new Error("D1 is not configured on this deployment");
  return env.DOCRACY_DB;
}

function isBlock(raw: unknown): raw is TemplatePdfBlock {
  if (!raw || typeof raw !== "object") return false;
  const b = raw as Record<string, unknown>;
  if (b.type === "section" || b.type === "paragraph") return typeof b.text === "string" && b.text.trim().length > 0;
  if (b.type === "field") return typeof b.label === "string" && b.label.trim().length > 0;
  if (b.type === "table") {
    return (
      Array.isArray(b.headers) &&
      Array.isArray(b.rows) &&
      Array.isArray(b.widths) &&
      (b.headers as unknown[]).every((h) => typeof h === "string")
    );
  }
  if (b.type === "signatures") {
    return (
      Array.isArray(b.signers) &&
      (b.signers as unknown[]).length >= 1 &&
      (b.signers as unknown[]).every((s) => {
        if (!s || typeof s !== "object") return false;
        const o = s as Record<string, unknown>;
        return typeof o.label === "string" && Number.isInteger(o.order) && (o.order as number) >= 1;
      })
    );
  }
  return false;
}

/** Exported for unit tests — enforces FreeTemplate-parity richness. */
export function parseAndValidateDraft(raw: string, fallback: TopicRow): DraftedTemplate | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(sanitizeJsonStringNewlines(match[0])) as Record<string, unknown>;
    const title = typeof parsed.title === "string" ? parsed.title.trim().slice(0, 100) : "";
    const seoTitle =
      typeof parsed.seoTitle === "string"
        ? parsed.seoTitle.trim().slice(0, 120)
        : title
          ? `Free ${title.replace(/\bTemplate\b/i, "").trim()} Template`
          : "";
    const description = typeof parsed.description === "string" ? parsed.description.trim().slice(0, 200) : "";
    const useCase = typeof parsed.useCase === "string" ? parsed.useCase.trim().slice(0, 600) : "";
    const definition = typeof parsed.definition === "string" ? parsed.definition.trim().slice(0, 500) : "";
    const legalSummary = typeof parsed.legalSummary === "string" ? parsed.legalSummary.trim().slice(0, 800) : "";
    const keyClauses = Array.isArray(parsed.keyClauses)
      ? parsed.keyClauses.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim().slice(0, 120))
      : [];
    const fillInFields = Array.isArray(parsed.fillInFields)
      ? parsed.fillInFields.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim().slice(0, 80))
      : [];
    const chatgptPrompts = Array.isArray(parsed.chatgptPrompts)
      ? parsed.chatgptPrompts.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim().slice(0, 240))
      : [];
    const signerLabels = Array.isArray(parsed.signerLabels)
      ? parsed.signerLabels.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim().slice(0, 40))
      : [];
    const blocks = Array.isArray(parsed.blocks) ? parsed.blocks.filter(isBlock) : [];

    const category =
      typeof parsed.category === "string" && RECURRING_CATEGORIES.includes(parsed.category as (typeof RECURRING_CATEGORIES)[number])
        ? parsed.category
        : fallback.category;

    let slug = slugify(typeof parsed.slug === "string" ? parsed.slug : fallback.slug || title);
    if (!slug) slug = fallback.slug;

    if (!title || !seoTitle || !description || !useCase || !definition || !legalSummary) return null;
    const jobPhrase = isLatamJobPhraseTemplate(fallback.id);
    if (keyClauses.length < (jobPhrase ? 3 : 4) || fillInFields.length < (jobPhrase ? 3 : 4) || chatgptPrompts.length < 2) {
      return null;
    }
    if (signerLabels.length < 1 || signerLabels.length > 3) return null;

    const sections = blocks.filter((b) => b.type === "section");
    const paragraphs = blocks.filter((b) => b.type === "paragraph");
    const fields = blocks.filter((b) => b.type === "field");
    const sigBlocks = blocks.filter((b) => b.type === "signatures");
    const minSections = jobPhrase ? 3 : 5;
    const minParagraphs = jobPhrase ? 5 : 8;
    const minFields = jobPhrase ? 3 : 4;
    if (sections.length < minSections || paragraphs.length < minParagraphs || fields.length < minFields || sigBlocks.length !== 1) {
      return null;
    }

    const wordCount = paragraphs
      .map((b) => (b.type === "paragraph" ? b.text : ""))
      .join(" ")
      .split(/\s+/)
      .filter(Boolean).length;
    if (wordCount < (jobPhrase ? 200 : 350)) return null;

    const sig = sigBlocks[0];
    if (!sig || sig.type !== "signatures") return null;
    if (sig.signers.length !== signerLabels.length) return null;
    for (let i = 0; i < signerLabels.length; i++) {
      if (sig.signers[i]!.order !== i + 1) return null;
    }

    return {
      title,
      seoTitle,
      description,
      useCase,
      definition,
      keyClauses: keyClauses.slice(0, 10),
      fillInFields: fillInFields.slice(0, 16),
      legalSummary,
      chatgptPrompts: chatgptPrompts.slice(0, 4),
      signerLabels,
      category,
      blocks,
      slug: slug.slice(0, 80),
    };
  } catch {
    return null;
  }
}

async function draftFromTopic(env: Env, topic: TopicRow): Promise<DraftedTemplate | null> {
  try {
    const result = await env.AI.run((env.WORKERS_AI_MODEL || DEFAULT_MODEL) as keyof AiModels, {
      temperature: 0.35,
      max_tokens: 4096,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Draft the full FreeTemplate-quality document for this queue item.\n` +
            `Title: ${topic.title}\n` +
            `Preferred slug: ${topic.slug}\n` +
            `Category (docracy.com taxonomy): ${topic.category}\n` +
            `Brief:\n${topic.angle}\n` +
            `Remember: multi-section PDF blocks + full SEO fields (definition, keyClauses, fillInFields, legalSummary, chatgptPrompts, useCase, seoTitle). Not thin.`,
        },
      ],
    });
    const raw = (result as { response?: string }).response?.trim();
    if (!raw) return null;
    return parseAndValidateDraft(raw, topic);
  } catch (err) {
    console.error("Weekly template AI draft failed:", err);
    return null;
  }
}

async function nextQueuedTopics(env: Env, limit: number): Promise<TopicRow[]> {
  const db = requireDb(env);
  const { results } = await db
    .prepare(
      `SELECT id, slug, title, category, angle, status FROM template_topic_queue
       WHERE status = 'queued' ORDER BY sort_order ASC, created_at ASC LIMIT ?`
    )
    .bind(limit)
    .all<TopicRow>();
  return results;
}

async function markTopicPublished(env: Env, topicId: string, templateId: string): Promise<void> {
  const db = requireDb(env);
  await db
    .prepare(
      `UPDATE template_topic_queue SET status = 'published', published_template_id = ?, published_at = ? WHERE id = ?`
    )
    .bind(templateId, new Date().toISOString(), topicId)
    .run();
}

async function markTopicSkipped(env: Env, topicId: string): Promise<void> {
  const db = requireDb(env);
  await db
    .prepare(`UPDATE template_topic_queue SET status = 'skipped', published_at = ? WHERE id = ?`)
    .bind(new Date().toISOString(), topicId)
    .run();
}

/**
 * Monday job: publish up to WEEKLY_TEMPLATE_BATCH FreeTemplate-quality Marketplace templates
 * (origin=weekly) from template_topic_queue, using the same PDF layout + SEO catalog scheme as
 * apps/web/src/lib/freeTemplates.ts.
 */
export async function runWeeklyTemplatePublish(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) {
    console.log("Weekly templates: skipped (no D1)");
    return;
  }
  if (!env.AI) {
    console.log("Weekly templates: skipped (no Workers AI)");
    return;
  }

  await ensureWeeklyTemplateInfra(env);

  const topics = await nextQueuedTopics(env, WEEKLY_TEMPLATE_BATCH);
  if (topics.length === 0) {
    console.log("Weekly templates: no queued topics left");
    return;
  }

  let published = 0;
  const publishedPaths: string[] = [];
  for (const topic of topics) {
    const draft = await draftFromTopic(env, topic);
    if (!draft) {
      console.error(`Weekly templates: thin/invalid AI draft for ${topic.slug} — skipping`);
      await markTopicSkipped(env, topic.id);
      continue;
    }

    let pdf;
    try {
      pdf = await renderTemplatePdf(draft.title.toUpperCase(), draft.blocks);
    } catch (err) {
      console.error(`Weekly templates: PDF render failed for ${topic.slug}:`, err);
      await markTopicSkipped(env, topic.id);
      continue;
    }

    // Every signer must have a signature field (same rule as marketplace submit).
    const signerOrders = new Set(pdf.fields.filter((f) => f.type === "signature").map((f) => f.signerOrder));
    if (signerOrders.size !== draft.signerLabels.length) {
      console.error(`Weekly templates: missing signature fields for ${topic.slug}`);
      await markTopicSkipped(env, topic.id);
      continue;
    }

    const created = await publishOfficialTemplate(env, {
      slugHint: draft.slug || topic.slug,
      title: draft.title,
      seoTitle: draft.seoTitle,
      category: draft.category || topic.category,
      description: draft.description,
      useCase: draft.useCase,
      signerCount: draft.signerLabels.length,
      pageCount: pdf.pageCount,
      fields: pdf.fields,
      pdfBytes: pdf.pdfBytes,
      definition: draft.definition,
      keyClauses: draft.keyClauses,
      fillInFields: draft.fillInFields,
      legalSummary: draft.legalSummary,
      chatgptPrompts: draft.chatgptPrompts,
    });
    if (!created.ok) {
      console.error(`Weekly templates: publish failed for ${topic.slug}: ${created.error}`);
      await markTopicSkipped(env, topic.id);
      continue;
    }

    await markTopicPublished(env, topic.id, created.id);
    published += 1;
    publishedPaths.push(`/free-templates/${created.slug}`);
    console.log(`Weekly templates: published ${created.slug} from topic ${topic.id}`);
  }

  if (publishedPaths.length > 0) {
    await pingIndexNow(publishedPaths);
  }
  console.log(`Weekly templates: published ${published}/${topics.length} this run`);
}

/**
 * Hourly backfill: if no origin=weekly Marketplace rows exist yet (migrations never applied,
 * Monday cron missed, or AI skipped the first batch), create the queue and publish one batch.
 * No-op once at least one weekly template is live.
 */
export async function runWeeklyTemplateCatchUpIfEmpty(env: Env): Promise<void> {
  if (!env.DOCRACY_DB) return;
  await ensureWeeklyTemplateInfra(env);
  const existing = await listWeeklyOfficial(env, 1);
  if (!shouldCatchUpWeeklyTemplates(existing.length)) {
    console.log("Weekly templates: catch-up skipped (weekly list already populated)");
    return;
  }
  console.log("Weekly templates: weekly list empty — running publish catch-up");
  await runWeeklyTemplatePublish(env);
}
