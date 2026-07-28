import { describe, it, expect } from "vitest";
import { parseToken, signToken, verifyToken } from "./token";

const SECRET = "test-secret";

describe("token", () => {
  it("round-trips a valid token", async () => {
    const token = await signToken("doc-1", 2, SECRET);
    const verified = await verifyToken(token, SECRET);
    expect(verified).toEqual({ docId: "doc-1", order: 2 });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signToken("doc-1", 2, SECRET);
    const verified = await verifyToken(token, "wrong-secret");
    expect(verified).toBeNull();
  });

  it("rejects a tampered order (queue-jumping attempt)", async () => {
    const token = await signToken("doc-1", 1, SECRET);
    const [docId, , sig] = token.split(".");
    const tampered = `${docId}.2.${sig}`;
    const verified = await verifyToken(tampered, SECRET);
    expect(verified).toBeNull();
  });

  it("rejects a tampered docId", async () => {
    const token = await signToken("doc-1", 1, SECRET);
    const [, order, sig] = token.split(".");
    const tampered = `doc-2.${order}.${sig}`;
    const verified = await verifyToken(tampered, SECRET);
    expect(verified).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyToken("not-a-token", SECRET)).toBeNull();
    expect(await verifyToken("a.b", SECRET)).toBeNull();
    expect(await verifyToken("", SECRET)).toBeNull();
    expect(parseToken("a.b")).toBeNull();
  });

  it("binds a linkNonce into the HMAC so rotating it invalidates old links", async () => {
    const token = await signToken("doc-1", 1, SECRET, "nonce-a");
    expect(await verifyToken(token, SECRET, "nonce-a")).toEqual({ docId: "doc-1", order: 1 });
    expect(await verifyToken(token, SECRET, "nonce-b")).toBeNull();
    expect(await verifyToken(token, SECRET)).toBeNull();
  });

  it("still verifies legacy tokens minted without a linkNonce", async () => {
    const token = await signToken("doc-1", 1, SECRET);
    expect(await verifyToken(token, SECRET)).toEqual({ docId: "doc-1", order: 1 });
    expect(await verifyToken(token, SECRET, "unexpected-nonce")).toBeNull();
  });

  it("parseToken extracts docId and order without verifying", () => {
    expect(parseToken("abc.3.sigpart")).toEqual({ docId: "abc", order: 3 });
  });
});
