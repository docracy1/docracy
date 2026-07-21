import type { Env } from "@docracy/shared";

// BytePlus ModelArk (Doubao's international offering) — OpenAI-compatible chat completions.
// Doubao is used here specifically because its free daily quota (unlike Cloudflare Workers AI's
// shared pool or Qwen's one-time trial credit) resets every day, making it viable as an ongoing,
// no-cost first line of support rather than a trial that eventually runs out.
const DOUBAO_ENDPOINT = "https://ark.ap-southeast.bytepluses.com/api/v3/chat/completions";
const DOUBAO_TIMEOUT_MS = 8000;

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
  accounts (shared workspace with teammates), and white-label branding (your own logo instead of
  Docracy's on the signing page and emails).
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
 *  throwing) if the question needs a human — no API key configured, the model couldn't answer
 *  confidently, or the request failed for any reason. Callers should treat null as "email the
 *  founder," exactly like the RESEND_API_KEY-unset fallback in email.ts. */
export async function answerSupportQuestion(env: Env, question: string): Promise<string | null> {
  if (!env.DOUBAO_API_KEY) return null;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DOUBAO_TIMEOUT_MS);
  try {
    const res = await fetch(DOUBAO_ENDPOINT, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.DOUBAO_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: env.DOUBAO_MODEL || "seed-2-0-lite-260228",
        temperature: 0.2,
        max_tokens: 400,
        messages: [
          { role: "system", content: PRODUCT_KNOWLEDGE },
          { role: "user", content: question },
        ],
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      console.error(`Doubao request failed (${res.status}): ${await res.text()}`);
      return null;
    }

    const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer || answer === CANNOT_ANSWER) return null;
    return answer;
  } catch (err) {
    console.error("Doubao request failed:", err);
    return null;
  } finally {
    clearTimeout(timeout);
  }
}
