import type { Env } from "@docracy/shared";

// Cloudflare Workers AI — free (10k neurons/day, resets daily), no external account or API key.
// A small quantized model is used deliberately: this is a short, fact-grounded FAQ answer, not a
// task that needs a large model, and smaller models burn far fewer neurons per request out of the
// shared daily allowance.
const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";

// Exact sentinel the model is instructed to return verbatim (and only that, nothing else) when it
// can't answer confidently from the knowledge below — checked for an exact match, not a substring,
// so a real answer that happens to mention "human" or "founder" is never mistaken for a punt.
const CANNOT_ANSWER = "CANNOT_ANSWER";

const PRODUCT_KNOWLEDGE = `
You are answering a support question submitted through the "Questions, bugs, feedback?" form on
Docracy (docracy.io), a free, no-signup e-signature tool. Answer ONLY using the facts below. If the
question needs information not covered here — a bug report, a specific document's status, account
details, refunds, or anything you're not confident about — respond with exactly the single word
${CANNOT_ANSWER} and nothing else. Never guess or invent details about Docracy that aren't listed.

FACTS ABOUT DOCRACY:
- Core flow: upload a PDF, place signature/initials/text/date fields for each signer, send. No
  account needed to send or sign — signers get an emailed link, no login required.
- Signing order: sequential (default, one signer at a time) or parallel (everyone can sign as soon
  as they're invited), preparer's choice per document.
- Free plan: up to 2 signers per document, sequential or parallel signing, all field types, an
  audit trail and completion certificate on every document. Documents and their data are deleted a
  few days after completion — this is deliberate, not a bug ("sign it, send it, it disappears").
- Paid plan: $7/month. Unlimited signers, PIN-protected signing links, a dashboard with document
  history, reusable templates, webhooks for your own systems, an MCP connector so AI assistants
  (Claude, ChatGPT, Grok, Perplexity) can create documents on your behalf, Zapier integration, team
  accounts (shared workspace with teammates), white-label branding (your own logo instead of
  Docracy's on the signing page and emails), and a set of AI tools (below).
- AI tools (paid plan only, in the "AI tools" card while preparing a document): auto-detect
  signature/date/initials fields on an uploaded PDF (scans for labels and blank lines and places
  fields automatically); "Explain in plain English" (a 3-bullet summary of what each party is
  agreeing to, plus a callout for anything unusual or one-sided); "Check for risky clauses" (flags
  things like unusually long non-competes, one-sided indemnity, vague payment terms); and "Generate
  with AI" (describe an agreement in one sentence — e.g. project, price, deadline — and get back a
  ready-to-sign PDF with a signature block already placed). All AI features are a best guess, not
  legal advice, and free/anonymous documents skip straight to a human instead of using AI at all.
- Free document templates: docracy.io/free-templates has ready-to-sign templates (NDA, independent
  contractor agreement, offer letter, remote work policy, freelance service agreement, and more) —
  free for anyone, no account needed, loads straight into the document editor with fields already
  placed.
- Document editing (in the "Edit document" panel while preparing): reorder or delete pages, redact
  (permanently blacks out a region, cannot be recovered), add text anywhere, or edit/delete text
  that's already in the uploaded PDF.
- Security and identity: signer identity is not independently verified (no ID checks) — Docracy is
  built for documents where that level of assurance isn't required. Every signature is recorded
  with an audit trail (IP, timestamp) and a downloadable completion certificate; an optional RFC
  3161 trusted timestamp is included.
- Support/contact: founder@docracy.io.
`.trim();

/** Tries to answer a support question using only known product facts, returning null (never
 *  throwing) if the question needs a human — the model couldn't answer confidently, or the
 *  request failed for any reason. Callers should treat null as "email the founder." */
export async function answerSupportQuestion(env: Env, question: string): Promise<string | null> {
  try {
    const result = await env.AI.run((env.WORKERS_AI_MODEL || DEFAULT_MODEL) as keyof AiModels, {
      temperature: 0.2,
      max_tokens: 400,
      messages: [
        { role: "system", content: PRODUCT_KNOWLEDGE },
        { role: "user", content: question },
      ],
    });

    const answer = (result as { response?: string }).response?.trim();
    if (!answer || answer === CANNOT_ANSWER) return null;
    return answer;
  } catch (err) {
    console.error("Workers AI request failed:", err);
    return null;
  }
}
