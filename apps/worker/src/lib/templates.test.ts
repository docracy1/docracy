import { describe, it, expect } from "vitest";
import { createTemplate, listTemplates, getTemplate, deleteTemplate } from "./templates";
import { makeMockEnv, makeValidPdfBytes } from "../test/mockEnv";
import type { DocField } from "@docracy/shared";

const fields: DocField[] = [{ id: "f1", signerOrder: 1, page: 0, xFrac: 0.1, yFrac: 0.1, wFrac: 0.2, hFrac: 0.05 }];

describe("templates lib", () => {
  it("creates a template and retrieves it with matching fields and PDF bytes", async () => {
    const { env } = makeMockEnv();
    const pdfBytes = await makeValidPdfBytes();

    const { templateId } = await createTemplate(env, "acct-1", pdfBytes, "My Lease", 1, 1, fields);
    expect(templateId).toBeTruthy();

    const result = await getTemplate(env, "acct-1", templateId);
    expect(result).not.toBeNull();
    expect(result!.summary).toMatchObject({ id: templateId, name: "My Lease", signerCount: 1, pageCount: 1 });
    expect(result!.fields).toEqual(fields);
    expect(result!.pdfBytes).toEqual(pdfBytes);
  });

  it("lists templates newest first", async () => {
    const { env } = makeMockEnv();
    const pdfBytes = await makeValidPdfBytes();

    const { templateId: first } = await createTemplate(env, "acct-1", pdfBytes, "First", 1, 1, fields);
    const { templateId: second } = await createTemplate(env, "acct-1", pdfBytes, "Second", 1, 1, fields);

    const list = await listTemplates(env, "acct-1");
    expect(list.map((t) => t.id)).toEqual([second, first]);
  });

  it("does not let one account see or fetch another account's template", async () => {
    const { env } = makeMockEnv();
    const pdfBytes = await makeValidPdfBytes();
    const { templateId } = await createTemplate(env, "acct-1", pdfBytes, "Owned by acct-1", 1, 1, fields);

    expect(await listTemplates(env, "acct-2")).toEqual([]);
    expect(await getTemplate(env, "acct-2", templateId)).toBeNull();
  });

  it("deletes a template (D1 row and R2 blob) and reports success only for the owning account", async () => {
    const { env, r2 } = makeMockEnv();
    const pdfBytes = await makeValidPdfBytes();
    const { templateId } = await createTemplate(env, "acct-1", pdfBytes, "To Delete", 1, 1, fields);

    expect(await deleteTemplate(env, "acct-2", templateId)).toBe(false);
    expect(await getTemplate(env, "acct-1", templateId)).not.toBeNull();

    expect(await deleteTemplate(env, "acct-1", templateId)).toBe(true);
    expect(await getTemplate(env, "acct-1", templateId)).toBeNull();
    expect(await r2.get(`templates/${templateId}/original.pdf`)).toBeNull();
  });

  it("reports deleting a nonexistent template as unsuccessful", async () => {
    const { env } = makeMockEnv();
    expect(await deleteTemplate(env, "acct-1", "no-such-template")).toBe(false);
  });
});
