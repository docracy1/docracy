import { describe, it, expect } from "vitest";
import { incrementTemplateUsage, getTemplateUsage, listTemplateUsage } from "./templateUsage";
import { makeMockEnv } from "../test/mockEnv";

describe("incrementTemplateUsage", () => {
  it("creates a row on first use and increments on repeat use", async () => {
    const { env } = makeMockEnv();
    expect(await incrementTemplateUsage(env, "ws-1", "mutual-nda")).toBe(1);
    expect(await incrementTemplateUsage(env, "ws-1", "mutual-nda")).toBe(2);
    expect(await incrementTemplateUsage(env, "ws-1", "mutual-nda")).toBe(3);
  });

  it("keeps separate counts per template and per workspace", async () => {
    const { env } = makeMockEnv();
    await incrementTemplateUsage(env, "ws-1", "mutual-nda");
    await incrementTemplateUsage(env, "ws-1", "work-order");
    await incrementTemplateUsage(env, "ws-2", "mutual-nda");

    expect(await getTemplateUsage(env, "ws-1", "mutual-nda")).toBe(1);
    expect(await getTemplateUsage(env, "ws-1", "work-order")).toBe(1);
    expect(await getTemplateUsage(env, "ws-2", "mutual-nda")).toBe(1);
  });

  it("returns 0 for a template never used", async () => {
    const { env } = makeMockEnv();
    expect(await getTemplateUsage(env, "ws-1", "never-used")).toBe(0);
  });
});

describe("listTemplateUsage", () => {
  it("lists every template a workspace has used, most-used first", async () => {
    const { env } = makeMockEnv();
    await incrementTemplateUsage(env, "ws-1", "mutual-nda");
    await incrementTemplateUsage(env, "ws-1", "work-order");
    await incrementTemplateUsage(env, "ws-1", "work-order");
    await incrementTemplateUsage(env, "ws-1", "work-order");

    const usage = await listTemplateUsage(env, "ws-1");
    expect(usage.map((u) => u.templateId)).toEqual(["work-order", "mutual-nda"]);
    expect(usage[0].completedCount).toBe(3);
    expect(usage[1].completedCount).toBe(1);
  });

  it("returns an empty list for a workspace with no usage", async () => {
    const { env } = makeMockEnv();
    expect(await listTemplateUsage(env, "ws-1")).toEqual([]);
  });
});
