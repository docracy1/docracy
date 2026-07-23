import { sanitizeJsonStringNewlines } from "./aiJson";
import type { Env } from "@docracy/shared";

// Same model/convention as lib/support.ts — a small quantized model is plenty for a bounded
// summarization/classification task and stays well within the free daily neuron allowance.
const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

// Contracts run long; this keeps the prompt (and therefore neuron cost) bounded regardless of
// what gets pasted in. A few thousand words is more than enough context for a summary or risk
// scan — this isn't a use case that needs the model to see literally every word.
const MAX_DOCUMENT_CHARS = 12000;

function truncate(text: string): string {
  return text.length > MAX_DOCUMENT_CHARS ? `${text.slice(0, MAX_DOCUMENT_CHARS)}\n\n[document truncated]` : text;
}

const EXPLAIN_SYSTEM_PROMPT = `
You explain contracts in plain English for freelancers and small business owners who aren't
lawyers. Given the contract text below, respond with exactly:
- 3 bullet points summarizing what each party is agreeing to, in plain language, no legal jargon.
- One line starting with "Watch out for:" naming any unusual or one-sided terms (an unusually long
  non-compete, one-sided indemnity, vague or missing payment terms, automatic renewal, unlimited
  liability) — or "Nothing unusual stood out." if there's genuinely nothing notable.
Keep the whole response under 200 words. Only use what's actually in the text — never invent
clauses or numbers that aren't there. This is not legal advice.
`.trim();

/** Plain-English contract summary + a one-line risk callout, or null (never throws) if the model
 *  couldn't produce one for any reason. */
export async function explainContract(env: Env, documentText: string): Promise<string | null> {
  try {
    const result = await env.AI.run((env.WORKERS_AI_MODEL || DEFAULT_MODEL) as keyof AiModels, {
      temperature: 0.3,
      max_tokens: 500,
      messages: [
        { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
        { role: "user", content: truncate(documentText) },
      ],
    });
    const answer = (result as { response?: string }).response?.trim();
    return answer || null;
  } catch (err) {
    console.error("Workers AI contract explanation failed:", err);
    return null;
  }
}

export interface ContractRisk {
  issue: string;
  severity: "low" | "medium" | "high";
  detail: string;
}

const RISK_SYSTEM_PROMPT = `
You review contracts for a freelancer or small business owner, looking for unbalanced or unusual
terms. Specifically check for: a non-compete or non-solicitation clause longer than 12 months,
one-sided indemnification (only one party indemnifies the other), payment terms longer than 60
days or left undefined, automatic renewal without a notice period, unlimited liability with no
cap, an IP assignment clause broader than the work being paid for, or no termination clause at
all. Respond with ONLY a JSON array — no prose, no markdown code fences, nothing before or after
it. Each element must look exactly like:
{"issue": "short label", "severity": "low"|"medium"|"high", "detail": "one sentence, quoting or
paraphrasing the actual clause"}
If nothing notable is found, respond with exactly: []
`.trim();

/** Parses the model's JSON-array response defensively — small models sometimes wrap the array in
 *  a sentence or a markdown fence despite instructions not to, so this pulls out the first
 *  [...] block rather than trusting the response is already clean, then validates each entry's
 *  shape before trusting it. Returns null (not []) when nothing usable could be parsed, so the
 *  caller can tell "no risks found" apart from "the model's output couldn't be understood." */
function parseRiskList(raw: string): ContractRisk[] | null {
  const match = raw.match(/\[[\s\S]*\]/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(sanitizeJsonStringNewlines(match[0]));
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(
        (r): r is ContractRisk =>
          !!r &&
          typeof r.issue === "string" &&
          typeof r.detail === "string" &&
          (r.severity === "low" || r.severity === "medium" || r.severity === "high")
      )
      .slice(0, 12);
  } catch {
    return null;
  }
}

/** Structured list of risky/unbalanced clauses, or null (never throws) if the model's response
 *  couldn't be parsed into anything usable — the caller should show a "couldn't analyze this"
 *  message rather than treating null as "no risks found" (that's an empty array, not null). */
export async function analyzeContractRisks(env: Env, documentText: string): Promise<ContractRisk[] | null> {
  try {
    const result = await env.AI.run((env.WORKERS_AI_MODEL || DEFAULT_MODEL) as keyof AiModels, {
      temperature: 0.2,
      max_tokens: 700,
      messages: [
        { role: "system", content: RISK_SYSTEM_PROMPT },
        { role: "user", content: truncate(documentText) },
      ],
    });
    const raw = (result as { response?: string }).response?.trim();
    if (!raw) return null;
    return parseRiskList(raw);
  } catch (err) {
    console.error("Workers AI risk analysis failed:", err);
    return null;
  }
}
