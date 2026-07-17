import { describe, it, expect, vi, afterEach } from "vitest";
import * as asn1js from "asn1js";
import * as pkijs from "pkijs";
import { requestTimestamp } from "./timestamp";
import { sha256Hex } from "./hash";

const SHA256_OID = "2.16.840.1.101.3.4.2.1";

/** Builds a syntactically valid (but unsigned) TimeStampResp DER blob — enough to exercise
 *  requestTimestamp's parsing, since it only reads genTime/messageImprint/status, never verifies
 *  the CMS signature itself (FreeTSA's certificate chain would be needed for that, which is out
 *  of scope for what this app actually checks). */
async function buildMockTsaResponse(hashBytes: Uint8Array, genTime: Date, status = 0): Promise<ArrayBuffer> {
  const tstInfo = new pkijs.TSTInfo({
    version: 1,
    policy: "1.2.3.4",
    messageImprint: new pkijs.MessageImprint({
      hashAlgorithm: new pkijs.AlgorithmIdentifier({ algorithmId: SHA256_OID }),
      hashedMessage: new asn1js.OctetString({ valueHex: hashBytes.buffer as ArrayBuffer }),
    }),
    serialNumber: new asn1js.Integer({ value: 1 }),
    genTime,
  });
  const tstInfoDer = tstInfo.toSchema().toBER(false);

  const signedData = new pkijs.SignedData({
    encapContentInfo: new pkijs.EncapsulatedContentInfo({
      eContentType: "1.2.840.113549.1.9.16.1.4", // id-ct-TSTInfo
      eContent: new asn1js.OctetString({ valueHex: tstInfoDer }),
    }),
  });

  const timeStampToken = new pkijs.ContentInfo({
    contentType: pkijs.ContentInfo.SIGNED_DATA,
    content: signedData.toSchema(),
  });

  const tspResp = new pkijs.TimeStampResp({
    status: new pkijs.PKIStatusInfo({ status }),
    ...(status <= 1 ? { timeStampToken } : {}),
  });

  return tspResp.toSchema().toBER(false);
}

describe("requestTimestamp", () => {
  afterEach(() => vi.restoreAllMocks());

  it("returns the TSA's asserted genTime and a token for a granted request", async () => {
    const hashHex = await sha256Hex(new TextEncoder().encode("hello world"));
    const hashBytes = Uint8Array.from(hashHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const genTime = new Date("2026-07-13T12:00:00.000Z");
    const mockResp = await buildMockTsaResponse(hashBytes, genTime, 0);

    vi.spyOn(global, "fetch").mockResolvedValue(new Response(mockResp, { status: 200 }));

    const result = await requestTimestamp(hashHex);
    expect(result).not.toBeNull();
    expect(result!.genTime).toBe(genTime.toISOString());
    expect(result!.tokenBase64.length).toBeGreaterThan(0);
  });

  it("accepts a grantedWithMods (status 1) response", async () => {
    const hashHex = await sha256Hex(new TextEncoder().encode("doc-b"));
    const hashBytes = Uint8Array.from(hashHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const genTime = new Date("2026-01-01T00:00:00.000Z");
    const mockResp = await buildMockTsaResponse(hashBytes, genTime, 1);

    vi.spyOn(global, "fetch").mockResolvedValue(new Response(mockResp, { status: 200 }));

    const result = await requestTimestamp(hashHex);
    expect(result).not.toBeNull();
    expect(result!.genTime).toBe(genTime.toISOString());
  });

  it("returns null when the TSA rejects the request", async () => {
    const hashHex = await sha256Hex(new TextEncoder().encode("doc-c"));
    const hashBytes = Uint8Array.from(hashHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const mockResp = await buildMockTsaResponse(hashBytes, new Date(), 2); // rejection status

    vi.spyOn(global, "fetch").mockResolvedValue(new Response(mockResp, { status: 200 }));

    expect(await requestTimestamp(hashHex)).toBeNull();
  });

  it("returns null when the returned token attests a different hash than requested", async () => {
    const requestedHashHex = await sha256Hex(new TextEncoder().encode("real-document"));
    const wrongHashHex = await sha256Hex(new TextEncoder().encode("different-document"));
    const wrongHashBytes = Uint8Array.from(wrongHashHex.match(/.{2}/g)!.map((b) => parseInt(b, 16)));
    const mockResp = await buildMockTsaResponse(wrongHashBytes, new Date(), 0);

    vi.spyOn(global, "fetch").mockResolvedValue(new Response(mockResp, { status: 200 }));

    expect(await requestTimestamp(requestedHashHex)).toBeNull();
  });

  it("returns null (never throws) when the TSA is unreachable", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("network down"));
    const hashHex = await sha256Hex(new TextEncoder().encode("doc-d"));
    await expect(requestTimestamp(hashHex)).resolves.toBeNull();
  });

  it("returns null on a non-2xx HTTP response", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response("nope", { status: 503 }));
    const hashHex = await sha256Hex(new TextEncoder().encode("doc-e"));
    expect(await requestTimestamp(hashHex)).toBeNull();
  });

  it("returns null on malformed (non-DER) response bytes", async () => {
    vi.spyOn(global, "fetch").mockResolvedValue(new Response(new Uint8Array([1, 2, 3]), { status: 200 }));
    const hashHex = await sha256Hex(new TextEncoder().encode("doc-f"));
    expect(await requestTimestamp(hashHex)).toBeNull();
  });
});
