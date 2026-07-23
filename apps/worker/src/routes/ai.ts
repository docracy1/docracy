import { Hono } from "hono";
import { requirePaidAccount, type AccountContext } from "../lib/auth";
import { explainContract, analyzeContractRisks } from "../lib/aiDocument";
import { draftAgreementContent, buildAgreementPdf } from "../lib/aiGenerate";
import { bytesToBase64 } from "../lib/base64";
import type { Env } from "@docracy/shared";

// Raw input cap before the AI helpers themselves truncate further for the model's context — this
// just rejects an obviously-abusive payload outright rather than silently truncating a 10MB blob.
const MAX_TEXT_LENGTH = 200_000;
const MAX_PROMPT_LENGTH = 2000;

type Variables = { account: AccountContext | null };
const ai = new Hono<{ Bindings: Env; Variables: Variables }>();

function readText(body: { text?: string }): string | null {
  const text = body.text?.trim() ?? "";
  return text.length > 0 && text.length <= MAX_TEXT_LENGTH ? text : null;
}

ai.post("/explain", requirePaidAccount, async (c) => {
  let body: { text?: string };
  try {
    body = await c.req.json<{ text?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const text = readText(body);
  if (!text) return c.json({ error: "No document text to explain" }, 400);

  const explanation = await explainContract(c.env, text);
  if (!explanation) {
    return c.json({ error: "Couldn't generate an explanation right now — try again in a moment." }, 502);
  }
  return c.json({ explanation });
});

ai.post("/risks", requirePaidAccount, async (c) => {
  let body: { text?: string };
  try {
    body = await c.req.json<{ text?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const text = readText(body);
  if (!text) return c.json({ error: "No document text to analyze" }, 400);

  const risks = await analyzeContractRisks(c.env, text);
  if (risks === null) {
    return c.json({ error: "Couldn't analyze this document right now — try again in a moment." }, 502);
  }
  return c.json({ risks });
});

ai.post("/generate", requirePaidAccount, async (c) => {
  let body: { prompt?: string };
  try {
    body = await c.req.json<{ prompt?: string }>();
  } catch {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const prompt = body.prompt?.trim() ?? "";
  if (!prompt) return c.json({ error: "Describe the agreement you want to generate" }, 400);
  if (prompt.length > MAX_PROMPT_LENGTH) {
    return c.json({ error: `Keep the description under ${MAX_PROMPT_LENGTH} characters` }, 400);
  }

  const content = await draftAgreementContent(c.env, prompt);
  if (!content) {
    return c.json(
      { error: "Couldn't generate a contract from that description — try adding more detail (project type, price, parties)." },
      502
    );
  }

  const { pdfBytes, fields } = await buildAgreementPdf(content.title, content.signerLabels, content.body);
  return c.json({
    title: content.title,
    signerLabels: content.signerLabels,
    fields,
    pdfBase64: bytesToBase64(pdfBytes),
  });
});

export default ai;
