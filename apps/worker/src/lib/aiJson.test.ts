import { describe, it, expect } from "vitest";
import { sanitizeJsonStringNewlines } from "./aiJson";

describe("sanitizeJsonStringNewlines", () => {
  it("escapes a literal newline inside a string value", () => {
    const input = '{"body": "line one\nline two"}';
    expect(JSON.parse(sanitizeJsonStringNewlines(input))).toEqual({ body: "line one\nline two" });
  });

  it("leaves formatting whitespace between tokens untouched", () => {
    const input = '{\n  "a": 1,\n  "b": 2\n}';
    expect(JSON.parse(sanitizeJsonStringNewlines(input))).toEqual({ a: 1, b: 2 });
  });

  it("does not double-escape an already-escaped newline", () => {
    const input = '{"body": "line one\\nline two"}';
    expect(JSON.parse(sanitizeJsonStringNewlines(input))).toEqual({ body: "line one\nline two" });
  });

  it("respects escaped quotes when tracking string boundaries", () => {
    const input = '{"body": "she said \\"hi\\"\nthen left"}';
    expect(JSON.parse(sanitizeJsonStringNewlines(input))).toEqual({ body: 'she said "hi"\nthen left' });
  });
});
