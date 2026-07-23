import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { sanitizeJsonStringNewlines } from "./aiJson";
import type { DocField, Env } from "@docracy/shared";

const DEFAULT_MODEL = "@cf/meta/llama-3.1-8b-instruct-fp8";
const MAX_PROMPT_CHARS = 2000;
const MAX_BODY_CHARS = 8000;
const MAX_SIGNERS = 4;

const GENERATE_SYSTEM_PROMPT = `
You draft simple business agreements from a one-sentence description. Given the user's request,
respond with ONLY a JSON object — no prose, no markdown code fences, nothing before or after it —
shaped exactly like:
{"title": "short document title", "signerLabels": ["Role A", "Role B"], "body": "full contract text"}

Rules:
- signerLabels: the parties involved (e.g. ["Client", "Freelancer"] or ["Company", "Contractor"]) —
  2 to 4 short role names, in the order they'd naturally sign.
- body: the complete agreement text, in plain paragraphs separated by a blank line. Include
  sections for scope of work, payment terms, timeline/deadline, and a general
  confidentiality/termination clause, using whatever specifics (price, dates, scope) the user gave
  you. Where the user didn't specify something, use a reasonable standard default and don't call
  attention to having done so.
- Do not use markdown formatting (no #, *, or _) anywhere in the body — plain text only.
- This is a simple template for two ordinary business parties, not a substitute for legal advice on
  anything unusual, regulated, or high-stakes.
`.trim();

interface GeneratedContent {
  title: string;
  signerLabels: string[];
  body: string;
}

function parseGeneratedContent(raw: string): GeneratedContent | null {
  const match = raw.match(/\{[\s\S]*\}/);
  if (!match) return null;
  try {
    const parsed = JSON.parse(sanitizeJsonStringNewlines(match[0]));
    if (typeof parsed.title !== "string" || typeof parsed.body !== "string" || !Array.isArray(parsed.signerLabels)) {
      return null;
    }
    const signerLabels = parsed.signerLabels.filter((s: unknown): s is string => typeof s === "string" && s.trim().length > 0);
    if (signerLabels.length < 2) return null;
    const title = parsed.title.trim().slice(0, 150);
    const body = parsed.body.trim().slice(0, MAX_BODY_CHARS);
    if (!title || !body) return null;
    return { title, signerLabels: signerLabels.slice(0, MAX_SIGNERS).map((s: string) => s.trim().slice(0, 40)), body };
  } catch {
    return null;
  }
}

/** Turns a one-sentence natural-language description into structured contract content — title,
 *  signer roles, and full body text — or null (never throws) if the request wasn't specific
 *  enough for the model to produce something usable. */
export async function draftAgreementContent(env: Env, prompt: string): Promise<GeneratedContent | null> {
  try {
    const result = await env.AI.run((env.WORKERS_AI_MODEL || DEFAULT_MODEL) as keyof AiModels, {
      temperature: 0.4,
      max_tokens: 1200,
      messages: [
        { role: "system", content: GENERATE_SYSTEM_PROMPT },
        { role: "user", content: prompt.slice(0, MAX_PROMPT_CHARS) },
      ],
    });
    const raw = (result as { response?: string }).response?.trim();
    if (!raw) return null;
    return parseGeneratedContent(raw);
  } catch (err) {
    console.error("Workers AI contract generation failed:", err);
    return null;
  }
}

const PAGE_W = 612;
const PAGE_H = 792;
const MARGIN = 56;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM_MARGIN = 72;
const INK = rgb(0.1, 0.1, 0.12);
const MUTED = rgb(0.4, 0.4, 0.42);

// Matches FIELD_SIZE_BY_TYPE in Prepare.tsx (0.26/0.07 signature, 0.16/0.04 date), scaled to a
// fixed US Letter page, so a field placed here behaves identically to one placed anywhere else.
const SIG_W = 0.26 * PAGE_W;
const SIG_H = 0.07 * PAGE_H;
const DATE_W = 0.16 * PAGE_W;
const DATE_H = 0.04 * PAGE_H;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const test = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(test, size) <= maxWidth || !current) {
      current = test;
    } else {
      lines.push(current);
      current = word;
    }
  }
  if (current) lines.push(current);
  return lines;
}

/** Builds a fresh, standalone PDF for AI-generated agreement content — title, body paragraphs,
 *  then one signature+date block per party — and returns matching DocField entries positioned
 *  against whatever page the layout happened to land the block on, exactly like the field
 *  coordinates this app places anywhere else (top-left-origin fractions of that page's size). */
export async function buildAgreementPdf(
  title: string,
  signerLabels: string[],
  body: string
): Promise<{ pdfBytes: Uint8Array; fields: DocField[] }> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let page = doc.addPage([PAGE_W, PAGE_H]);
  let y = 740;

  const newPage = () => {
    page = doc.addPage([PAGE_W, PAGE_H]);
    y = 740;
  };
  const ensureSpace = (needed: number) => {
    if (y - needed < BOTTOM_MARGIN) newPage();
  };
  const drawLine = (text: string, size: number, f: PDFFont, color = INK, indent = 0) => {
    page.drawText(text, { x: MARGIN + indent, y, size, font: f, color });
    y -= size * 1.4;
  };

  drawLine(title, 18, bold);
  y -= 6;

  const paragraphs = body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  for (const paragraph of paragraphs) {
    const lines = wrapText(paragraph, font, 11, CONTENT_W);
    for (const line of lines) {
      ensureSpace(11 * 1.4);
      drawLine(line, 11, font);
    }
    y -= 11 * 0.7; // paragraph gap
  }

  y -= 14;
  ensureSpace(20);
  drawLine("Signatures", 13, bold);
  y -= 6;

  const fields: DocField[] = [];
  let fieldIdCounter = 0;

  for (let i = 0; i < signerLabels.length; i++) {
    ensureSpace(SIG_H + DATE_H + 60);
    const pageIndex = doc.getPages().indexOf(page);

    drawLine(signerLabels[i], 12, bold);
    y -= 4;

    // Both lines sit on the same row (bottom-aligned) even though the signature box is taller
    // than the date box — top-aligning them instead (equal box tops, different heights) puts the
    // shorter date line noticeably higher on the page than the signature line, which reads as
    // broken rather than as two fields on the same row.
    const sigBoxTopY = y;
    const lineY = sigBoxTopY - SIG_H;
    y = lineY;
    (page as PDFPage).drawLine({ start: { x: MARGIN, y: lineY }, end: { x: MARGIN + SIG_W, y: lineY }, thickness: 0.75, color: MUTED });
    page.drawText("Signature", { x: MARGIN, y: lineY - 12, size: 8, font, color: MUTED });
    fields.push({
      id: `gen${fieldIdCounter++}`,
      signerOrder: i + 1,
      page: pageIndex,
      xFrac: MARGIN / PAGE_W,
      yFrac: (PAGE_H - sigBoxTopY) / PAGE_H,
      wFrac: SIG_W / PAGE_W,
      hFrac: SIG_H / PAGE_H,
      type: "signature",
    });

    const dateX = MARGIN + SIG_W + 30;
    const dateBoxTopY = lineY + DATE_H;
    (page as PDFPage).drawLine({ start: { x: dateX, y: lineY }, end: { x: dateX + DATE_W, y: lineY }, thickness: 0.75, color: MUTED });
    page.drawText("Date", { x: dateX, y: lineY - 12, size: 8, font, color: MUTED });
    fields.push({
      id: `gen${fieldIdCounter++}`,
      signerOrder: i + 1,
      page: pageIndex,
      xFrac: dateX / PAGE_W,
      yFrac: (PAGE_H - dateBoxTopY) / PAGE_H,
      wFrac: DATE_W / PAGE_W,
      hFrac: DATE_H / PAGE_H,
      type: "date",
    });

    y -= 34;
  }

  page.drawText("Drafted with AI — review carefully before sending. Not legal advice.", {
    x: MARGIN,
    y: BOTTOM_MARGIN - 20,
    size: 8,
    font,
    color: MUTED,
  });

  return { pdfBytes: await doc.save(), fields };
}
