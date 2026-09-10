import { sanitizeJsonStringNewlines } from "./aiJson";
import type { Env } from "@docracy/shared";

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

export interface TemplateTranslateInput {
  title: string;
  legalSummary: string;
  keyClauses: string[];
}

export interface TemplateTranslation {
  legalSummaryEs: string;
  keyClausesEs: string[];
}

const SYSTEM_PROMPT = `
You translate Docracy (docracy.io) free contract-template summaries into colloquial Latin American
Spanish for a reader who may have low literacy or no legal background — someone reading this aloud
to decide whether to sign, not a lawyer. Use tú-form, everyday words, short sentences. Do NOT
produce a formal/academic legal register — a village store owner or a rideshare driver should be
able to follow it read aloud. Never invent facts not present in the English source.

Respond with ONLY a JSON object (no markdown fences):
{
  "legalSummaryEs": "2-3 plain, spoken-style sentences in Spanish covering the same ground as the English legalSummary",
  "keyClausesEs": ["plain Spanish paraphrase of each English keyClause, same order, same count"]
}
`.trim();

/** Exported for unit tests. */
export function parseAndValidateTranslation(raw: string, expectedClauseCount: number): TemplateTranslation | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(sanitizeJsonStringNewlines(match[0])) as Record<string, unknown>;
    const legalSummaryEs = typeof parsed.legalSummaryEs === "string" ? parsed.legalSummaryEs.trim().slice(0, 800) : "";
    const keyClausesEs = Array.isArray(parsed.keyClausesEs)
      ? parsed.keyClausesEs.filter((x): x is string => typeof x === "string" && x.trim().length > 0).map((s) => s.trim().slice(0, 160))
      : [];
    if (!legalSummaryEs) return null;
    if (keyClausesEs.length !== expectedClauseCount) return null;
    return { legalSummaryEs, keyClausesEs };
  } catch {
    return null;
  }
}

/** Translates one template's `legalSummary`/`keyClauses` into colloquial Spanish, for the curated
 *  SEO_TEMPLATE_SLUGS backfill described in apps/web/src/lib/i18n/paths.ts. Returns null on any AI
 *  or validation failure — callers should keep the English fallback rather than publish a thin or
 *  malformed translation. */
export async function translateTemplateSummary(env: Env, input: TemplateTranslateInput): Promise<TemplateTranslation | null> {
  if (!env.AI) return null;
  try {
    const result = await env.AI.run((env.WORKERS_AI_MODEL || DEFAULT_MODEL) as keyof AiModels, {
      temperature: 0.3,
      max_tokens: 1536,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content:
            `Document title: ${input.title}\n` +
            `English legalSummary: ${input.legalSummary}\n` +
            `English keyClauses (translate every one, same order, same count of ${input.keyClauses.length}):\n` +
            input.keyClauses.map((c, i) => `${i + 1}. ${c}`).join("\n"),
        },
      ],
    });
    const raw = (result as { response?: string }).response?.trim();
    if (!raw) return null;
    return parseAndValidateTranslation(raw, input.keyClauses.length);
  } catch (err) {
    console.error("Template translate AI call failed:", err);
    return null;
  }
}
