/**
 * Small LLMs reliably produce JSON-shaped output but frequently embed literal newlines inside
 * string values (e.g. a multi-paragraph "body" field) instead of the `\n` escape the JSON spec
 * requires — `JSON.parse` rejects raw control characters inside a string outright. This walks the
 * text once, tracking whether it's inside a quoted string (respecting `\"` escapes), and only
 * escapes newlines/carriage returns found there — formatting whitespace between tokens is left
 * untouched, since escaping it would itself produce invalid JSON.
 */
export function sanitizeJsonStringNewlines(raw: string): string {
  let result = "";
  let inString = false;
  let escapedNext = false;
  for (const ch of raw) {
    if (escapedNext) {
      result += ch;
      escapedNext = false;
      continue;
    }
    if (ch === "\\") {
      result += ch;
      escapedNext = true;
      continue;
    }
    if (ch === '"') {
      inString = !inString;
      result += ch;
      continue;
    }
    if (inString && (ch === "\n" || ch === "\r")) {
      result += ch === "\n" ? "\\n" : "\\r";
      continue;
    }
    result += ch;
  }
  return result;
}
