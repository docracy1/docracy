// Converts the same server-rendered body markup used for prerendered HTML pages (see
// _render-entry.tsx / prerender.mjs) into Markdown, for agents that request `Accept: text/markdown`
// (see functions/_middleware.ts). This is NOT a general-purpose HTML→Markdown library — it only
// needs to handle the specific tag set our own page components actually render (verified against
// About/Pricing/Docs/Imprint/Mcp/FreeTemplates*: a, br, code, div, h1-h3, input, li, p, pre, span,
// strong, table/thead/tbody/tr/th/td, ul), so a small hand-written converter is more reliable here
// than pulling in a DOM-dependent library that doesn't run in Cloudflare's edge runtime anyway.
const SITE = "https://docracy.io";

function decodeEntities(str) {
  return str
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&nbsp;|&#160;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

function absoluteUrl(href) {
  if (/^https?:\/\//.test(href) || href.startsWith("mailto:")) return href;
  if (href.startsWith("/")) return `${SITE}${href}`;
  return href;
}

function tableToMarkdown(tableHtml) {
  const extractCells = (rowHtml, cellTag) => {
    const re = new RegExp(`<${cellTag}[^>]*>([\\s\\S]*?)</${cellTag}>`, "g");
    const cells = [];
    let m;
    while ((m = re.exec(rowHtml))) {
      cells.push(m[1].trim().replace(/\s+/g, " ").replace(/\|/g, "\\|"));
    }
    return cells;
  };
  const extractRows = (sectionHtml, cellTag) => {
    const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/g;
    const rows = [];
    let m;
    while ((m = rowRe.exec(sectionHtml))) rows.push(extractCells(m[1], cellTag));
    return rows;
  };
  const headMatch = tableHtml.match(/<thead[^>]*>([\s\S]*?)<\/thead>/);
  const bodyMatch = tableHtml.match(/<tbody[^>]*>([\s\S]*?)<\/tbody>/);
  const headerRows = headMatch ? extractRows(headMatch[1], "th") : [];
  const bodyRows = bodyMatch ? extractRows(bodyMatch[1], "td") : [];
  if (headerRows.length === 0 && bodyRows.length === 0) return "";

  const header = headerRows[0] ?? bodyRows[0].map(() => "");
  const lines = [`| ${header.join(" | ")} |`, `| ${header.map(() => "---").join(" | ")} |`];
  for (const row of bodyRows) {
    while (row.length < header.length) row.push("");
    lines.push(`| ${row.join(" | ")} |`);
  }
  return `\n${lines.join("\n")}\n\n`;
}

export function htmlToMarkdown(bodyHtml) {
  let out = bodyHtml;

  // Read-only text inputs (e.g. the MCP connector URL field) have no text content of their own —
  // their meaningful content is the `value` attribute. Always its own block (leading + trailing
  // newline) since these render as a standalone field row, never inline prose.
  out = out.replace(/<input\b[^>]*\bvalue="([^"]*)"[^>]*\/?>/g, (_, v) => `\n\`${decodeEntities(v)}\`\n\n`);

  // Fenced code blocks, before anything else touches their contents.
  out = out.replace(/<pre\b[^>]*>([\s\S]*?)<\/pre>/g, (_, body) => `\n\`\`\`\n${body.trim()}\n\`\`\`\n\n`);

  // Images have no text content of their own (e.g. the header wordmark <img> inside an <a>) — swap
  // in the alt text before the surrounding <a> regex reads its "text" child below.
  out = out.replace(/<img\b[^>]*\balt="([^"]*)"[^>]*\/?>/g, (_, alt) => decodeEntities(alt));

  // Unwrap pure layout wrappers early (as a space, so words on either side don't run together)
  // so table cells and headings end up clean by the time they're extracted below.
  out = out.replace(/<\/?div[^>]*>/g, " ").replace(/<\/?span[^>]*>/g, " ");

  // Inline formatting.
  out = out.replace(/<a\b[^>]*\bhref="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g, (_, href, text) => `[${text.trim()}](${absoluteUrl(href)})`);
  out = out.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/g, (_, t) => `**${t.trim()}**`);
  out = out.replace(/<code[^>]*>([\s\S]*?)<\/code>/g, (_, t) => `\`${t.trim()}\``);

  // Tables (cell content above is already Markdown by this point).
  out = out.replace(/<table[^>]*>([\s\S]*?)<\/table>/g, (_, inner) => tableToMarkdown(inner));

  // Block-level elements.
  out = out.replace(/<h1[^>]*>([\s\S]*?)<\/h1>/g, (_, t) => `\n# ${t.trim()}\n\n`);
  out = out.replace(/<h2[^>]*>([\s\S]*?)<\/h2>/g, (_, t) => `\n## ${t.trim()}\n\n`);
  out = out.replace(/<h3[^>]*>([\s\S]*?)<\/h3>/g, (_, t) => `\n### ${t.trim()}\n\n`);
  out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/g, (_, t) => `- ${t.trim()}\n`);
  out = out.replace(/<p[^>]*>([\s\S]*?)<\/p>/g, (_, t) => `\n${t.trim()}\n\n`);
  out = out.replace(/<br\s*\/?>/g, "\n");

  // Anything left (header/footer/ul/thead/tbody/tr wrappers) is pure structure with no content of
  // its own left to lose — strip it, using a newline (not empty string) so words don't collide.
  out = out.replace(/<\/?(header|footer|ul|thead|tbody|tr)[^>]*>/g, "\n");
  out = out.replace(/<[^>]+>/g, "");

  out = decodeEntities(out);
  out = out.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return out + "\n";
}
