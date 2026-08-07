import { describe, it, expect } from "vitest";
import { signUnsubscribeToken, verifyUnsubscribeToken } from "./marketingUnsubscribe";

const SECRET = "test-secret";

describe("marketingUnsubscribe", () => {
  it("round-trips an account-kind token", async () => {
    const token = await signUnsubscribeToken({ kind: "account", id: "acct-1" }, SECRET);
    expect(await verifyUnsubscribeToken(token, SECRET)).toEqual({ kind: "account", id: "acct-1" });
  });

  it("round-trips a lead-kind token", async () => {
    const token = await signUnsubscribeToken({ kind: "lead", id: "lead@example.com" }, SECRET);
    expect(await verifyUnsubscribeToken(token, SECRET)).toEqual({ kind: "lead", id: "lead@example.com" });
  });

  it("rejects a token signed with a different secret", async () => {
    const token = await signUnsubscribeToken({ kind: "account", id: "acct-1" }, SECRET);
    expect(await verifyUnsubscribeToken(token, "wrong-secret")).toBeNull();
  });

  it("rejects a tampered payload (id swap)", async () => {
    const token = await signUnsubscribeToken({ kind: "account", id: "acct-1" }, SECRET);
    const [, sig] = token.split(".");
    const forgedPayload = Buffer.from(JSON.stringify({ kind: "account", id: "acct-2" })).toString("base64url");
    const tampered = `${forgedPayload}.${sig}`;
    expect(await verifyUnsubscribeToken(tampered, SECRET)).toBeNull();
  });

  it("rejects malformed tokens", async () => {
    expect(await verifyUnsubscribeToken("not-a-token", SECRET)).toBeNull();
    expect(await verifyUnsubscribeToken("", SECRET)).toBeNull();
    expect(await verifyUnsubscribeToken("a.b.c", SECRET)).toBeNull();
  });

  it("rejects a well-signed but structurally invalid payload (bad kind)", async () => {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const encodedPayload = Buffer.from(JSON.stringify({ kind: "bogus", id: "x" })).toString("base64url");
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(encodedPayload));
    const sigBytes = new Uint8Array(sig);
    let binary = "";
    for (const b of sigBytes) binary += String.fromCharCode(b);
    const encodedSig = btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const token = `${encodedPayload}.${encodedSig}`;
    expect(await verifyUnsubscribeToken(token, SECRET)).toBeNull();
  });
});
