import { describe, it, expect, vi, afterEach } from "vitest";
import { stampHash, checkOtsProof } from "./opentimestamps";

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

// A real, historical `.ots` proof for a Bitcoin-confirmed timestamp — the exact example from
// @lacrypta/typescript-opentimestamps's own docs (verify.d.ts), already fully resolved (no
// pending calendar branches left), so upgrade() needs zero network calls and verify() only needs
// the two Bitcoin block-explorer fetches mocked below with the real block 428648 data.
const CONFIRMED_PROOF_B64 =
  "AE9wZW5UaW1lc3RhbXBzAABQcm9vZgC/ieLohOiSlAEIBcT2FqjlMQ0Z2TjP12mGTX9MzcLKi0ebEK+DVksJevnwEOdUv5OAan66poDve9ARS/QI8BC1c+iFDP2eY9HwQ/u2/CUOCPEEV8+lxPAIb7GsjU5OsOcI8SBlY7tDKoKayNbFTRqTMNIkBmTK2DON0F5j7sEqGKaNUAjwILqD3b4r1ncrRYS0bq7SNga3Et10ConpnpJ1cfd/ZKohCPEgGTyB5w5EcrUoEf54N84Sk7HTVCskTyf0QYKvgof8n04I8SDGxXaW/NObTZkkd4idBOaIKCn1/lVjBKKB3OJYt4ofBwjxrgEBAAAAAbWSygOOqpwbaYoEmwm+juiXK10OyinBmUYCe6kkissDAAAAAEhHMEQCIA+ZLV2+xu2xQ/dsFORTjgpQ1muuJ8aDz0KR5HUofsavAiAQuulEM5Cq29LiuLn3V77qJtP1w0X35rTYGz05Dt04GAH9////Ai6xQgAAAAAAIyEDOLJJDqqUlThCNzfNg0SYNdEGHcqI9P+spxgbysZ9IJWsAAAAAAAAAAAiaiDwBGeKBgAICPEgl3rDnYm7i4edSiw4/KSKBAyCY3k2cH/EUsnbE5C1FcgICPAgdCaLI+YUmX0Yx8Bj2Ngtfh21e1/ENGzEesLEbVQWjXEICPEgVgxFuFT4UHyL+s8mYv7yacIIp+XfXDFFy85BfsrMWV4ICPEgDbqHIbnNSsfC/MfhW6LLnykGv8V3whJ0fNNS1htdf9sICPEggRB6AQ1SfRi6qHS8mcGaOnol3+EQpMiYW/MPbD53uu0ICPAgyjzc1wk0mLPxgLOKl3MgflL8qZLC2x1mD9+hsylQDDkICPAgymxkZN0CztZMnIIkbM/GJsqnjZ5iTMEQE+O0u8CemJEICPAgHHrg/qwBj6Gb2EWaSulxs+bIFqhyVDF+Cp8OyUJbp2EICPEgkCY6c+QVqXXcB3Bnctu2IA7w0KIwBiGOZdSl2BEgZzAICPEgeVMBY7DZEiSUOGKL15GslAL6cH6zFMYjew75AnFiXIQICAAFiJYNc9cZAQPolBo=";

function proofBytes(): Uint8Array {
  return new Uint8Array(Buffer.from(CONFIRMED_PROOF_B64, "base64"));
}

// Real data for the block this proof attests to (height 428648) — a Merkle-root mismatch here
// would fail the library's own verifiers, so this has to be exact, not a stand-in.
const REAL_BLOCK_HASH = "000000000000000000ca478eb185560e1f1178746ee05e3d9bc9a31765f6f4a3";
const REAL_MERKLE_ROOT = "078cdde9c89f2e3c58c96b1658627fd9298c63c6618954ea24ac3b5a13fe18da";
const REAL_BLOCK_TIME = 1473227803;

function mockExplorerFetch() {
  vi.spyOn(global, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
    const url = String(input);
    if (url === "https://blockchain.info/rawblock/428648") {
      return new Response(JSON.stringify({ mrkl_root: REAL_MERKLE_ROOT, time: REAL_BLOCK_TIME }));
    }
    if (url === "https://blockstream.info/api/block-height/428648") {
      return new Response(REAL_BLOCK_HASH);
    }
    if (url === `https://blockstream.info/api/block/${REAL_BLOCK_HASH}`) {
      return new Response(JSON.stringify({ merkle_root: REAL_MERKLE_ROOT, timestamp: REAL_BLOCK_TIME }));
    }
    throw new Error(`unexpected fetch in test: ${url}`);
  });
}

describe("checkOtsProof", () => {
  it("confirms a real, Bitcoin-attested proof by checking it against the actual block", async () => {
    mockExplorerFetch();
    const result = await checkOtsProof(proofBytes());
    expect(result.confirmed).toBe(true);
    expect(result.confirmedAt).toBe(new Date(REAL_BLOCK_TIME * 1000).toISOString());
  });

  it("does not confirm when the block explorer's Merkle root doesn't match", async () => {
    vi.spyOn(global, "fetch").mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "https://blockchain.info/rawblock/428648") {
        return new Response(JSON.stringify({ mrkl_root: "0".repeat(64), time: REAL_BLOCK_TIME }));
      }
      if (url === "https://blockstream.info/api/block-height/428648") {
        return new Response(REAL_BLOCK_HASH);
      }
      return new Response(JSON.stringify({ merkle_root: "0".repeat(64), timestamp: REAL_BLOCK_TIME }));
    });
    const result = await checkOtsProof(proofBytes());
    expect(result.confirmed).toBe(false);
    expect(result.confirmedAt).toBeNull();
  });

  it("returns unconfirmed instead of throwing when the block explorers are unreachable", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const result = await checkOtsProof(proofBytes());
    expect(result).toEqual({ confirmed: false, confirmedAt: null });
  });

  it("returns unconfirmed instead of throwing on malformed proof bytes", async () => {
    const result = await checkOtsProof(new Uint8Array([1, 2, 3]));
    expect(result).toEqual({ confirmed: false, confirmedAt: null });
  });
});
