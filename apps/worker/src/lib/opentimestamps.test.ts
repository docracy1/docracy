import { describe, it, expect, vi, afterEach } from "vitest";
import { stampHash } from "./opentimestamps";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("stampHash", () => {
  it("returns null instead of throwing when every calendar is unreachable", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const result = await stampHash("a".repeat(64));
    expect(result).toBeNull();
  });

  it("returns null instead of throwing on a malformed hash", async () => {
    const result = await stampHash("not-a-hash");
    expect(result).toBeNull();
  });
});
