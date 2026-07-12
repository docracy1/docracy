import { describe, it, expect } from "vitest";
import { sha256Hex } from "./hash";

describe("sha256Hex", () => {
  it("matches the known SHA-256 digest of an empty input", async () => {
    expect(await sha256Hex(new Uint8Array())).toBe(
      "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
    );
  });

  it("matches the known SHA-256 digest of 'abc'", async () => {
    expect(await sha256Hex(new TextEncoder().encode("abc"))).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad"
    );
  });

  it("produces different digests for different bytes", async () => {
    const a = await sha256Hex(new TextEncoder().encode("abc"));
    const b = await sha256Hex(new TextEncoder().encode("abd"));
    expect(a).not.toBe(b);
  });
});
