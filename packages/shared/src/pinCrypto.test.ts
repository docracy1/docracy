import { describe, it, expect } from "vitest";
import { encryptPin, decryptPin } from "./pinCrypto";

const SECRET = "test-secret";

describe("encryptPin / decryptPin", () => {
  it("round-trips the original PIN", async () => {
    const encrypted = await encryptPin("4242", SECRET);
    expect(await decryptPin(encrypted, SECRET)).toBe("4242");
  });

  it("never contains the raw PIN in the encrypted output", async () => {
    const encrypted = await encryptPin("4242", SECRET);
    expect(encrypted).not.toContain("4242");
  });

  it("produces a different ciphertext each time (random IV) for the same PIN", async () => {
    const a = await encryptPin("4242", SECRET);
    const b = await encryptPin("4242", SECRET);
    expect(a).not.toBe(b);
  });

  it("fails to decrypt with the wrong secret", async () => {
    const encrypted = await encryptPin("4242", SECRET);
    expect(await decryptPin(encrypted, "wrong-secret")).toBeNull();
  });

  it("returns null instead of throwing on garbage input", async () => {
    await expect(decryptPin("not-a-real-ciphertext", SECRET)).resolves.toBeNull();
  });
});
