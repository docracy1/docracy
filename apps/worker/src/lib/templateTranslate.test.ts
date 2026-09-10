import { describe, expect, it, vi } from "vitest";
import { parseAndValidateTranslation, translateTemplateSummary } from "./templateTranslate";
import { makeMockEnv } from "../test/mockEnv";

const input = {
  title: "Mutual Non-Disclosure Agreement",
  legalSummary: "Signing means both parties agree to keep shared information secret and not misuse it.",
  keyClauses: ["Definition of confidential information", "Permitted uses", "Term and survival"],
};

function validJson(overrides: Record<string, unknown> = {}) {
  return JSON.stringify({
    legalSummaryEs: "Al firmar, ambas partes prometen guardar en secreto la información que se compartan.",
    keyClausesEs: ["Qué cuenta como información confidencial", "Para qué se puede usar", "Cuánto dura el secreto"],
    ...overrides,
  });
}

describe("parseAndValidateTranslation", () => {
  it("parses a well-formed response", () => {
    const result = parseAndValidateTranslation(validJson(), 3);
    expect(result).toEqual({
      legalSummaryEs: "Al firmar, ambas partes prometen guardar en secreto la información que se compartan.",
      keyClausesEs: ["Qué cuenta como información confidencial", "Para qué se puede usar", "Cuánto dura el secreto"],
    });
  });

  it("rejects when keyClausesEs count doesn't match the English source", () => {
    const result = parseAndValidateTranslation(validJson({ keyClausesEs: ["only one"] }), 3);
    expect(result).toBeNull();
  });

  it("rejects when legalSummaryEs is missing", () => {
    const result = parseAndValidateTranslation(validJson({ legalSummaryEs: "" }), 3);
    expect(result).toBeNull();
  });

  it("rejects unparseable text", () => {
    expect(parseAndValidateTranslation("not json at all", 3)).toBeNull();
  });

  it("tolerates literal newlines inside JSON string values", () => {
    const raw = `{"legalSummaryEs": "Línea uno.\nLínea dos.", "keyClausesEs": ["a", "b", "c"]}`;
    const result = parseAndValidateTranslation(raw, 3);
    expect(result?.legalSummaryEs).toBe("Línea uno.\nLínea dos.");
  });
});

describe("translateTemplateSummary", () => {
  it("returns the parsed translation on a valid AI response", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: validJson() });

    const result = await translateTemplateSummary(env, input);

    expect(result?.keyClausesEs).toHaveLength(3);
  });

  it("returns null when the AI response fails validation", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockResolvedValueOnce({ response: validJson({ keyClausesEs: ["too", "few"] }) });

    const result = await translateTemplateSummary(env, input);

    expect(result).toBeNull();
  });

  it("returns null without throwing when the AI call rejects", async () => {
    const { env } = makeMockEnv();
    vi.spyOn(env.AI, "run").mockRejectedValueOnce(new Error("neuron quota exceeded"));

    const result = await translateTemplateSummary(env, input);

    expect(result).toBeNull();
  });

  it("returns null when no AI binding is configured", async () => {
    const { env } = makeMockEnv();
    // @ts-expect-error simulating a deployment without the AI binding
    env.AI = undefined;

    const result = await translateTemplateSummary(env, input);

    expect(result).toBeNull();
  });
});
