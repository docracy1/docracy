import * as asn1js from "asn1js";
import * as pkijs from "pkijs";

// pkijs's setEngine() auto-detection branches on `typeof window`, which doesn't reliably resolve
// inside a Workers isolate — set it explicitly once at module load rather than trust auto-detect.
// The cast works around a structural typing clash: @cloudflare/workers-types' SubtleCrypto adds a
// Workers-only `timingSafeEqual` method that pkijs's own (DOM-lib-authored) CryptoEngine type
// doesn't declare, even though the real runtime object satisfies pkijs's actual usage.
pkijs.setEngine("newEngine", new pkijs.CryptoEngine({ name: "newEngine", crypto: crypto as unknown as Crypto }) as unknown as pkijs.ICryptoEngine);

const SHA256_OID = "2.16.840.1.101.3.4.2.1";
const TSA_URL = "https://freetsa.org/tsr";
const TSA_TIMEOUT_MS = 8000;

export interface TimestampResult {
  genTime: string;
  tokenBase64: string;
}

function toBase64(bytes: ArrayBuffer): string {
  let binary = "";
  for (const b of new Uint8Array(bytes)) binary += String.fromCharCode(b);
  return btoa(binary);
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return bytes;
}

/**
 * Requests an RFC 3161 trusted timestamp over a document's SHA-256 hash from FreeTSA, a free
 * public Time-Stamp Authority — this proves the hash existed at a specific time, attested by a
 * third party, independent of Docracy's own server clock. Best-effort: returns null (never
 * throws) on any network error, timeout, or malformed/rejected response, since a slow or down TSA
 * must never block a signer from completing a document — this is an enhancement to the
 * completion certificate, not a dependency of the core signing flow.
 */
export async function requestTimestamp(sha256Hex: string): Promise<TimestampResult | null> {
  try {
    const hashBytes = hexToBytes(sha256Hex);
    const nonceBytes = pkijs.getRandomValues(new Uint8Array(16));

    const messageImprint = new pkijs.MessageImprint({
      hashAlgorithm: new pkijs.AlgorithmIdentifier({ algorithmId: SHA256_OID }),
      hashedMessage: new asn1js.OctetString({ valueHex: hashBytes.buffer as ArrayBuffer }),
    });

    const tspReq = new pkijs.TimeStampReq({
      version: 1,
      messageImprint,
      certReq: true,
      nonce: new asn1js.Integer({ valueHex: nonceBytes.buffer as ArrayBuffer }),
    });

    const reqDer = tspReq.toSchema().toBER(false);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TSA_TIMEOUT_MS);
    let respDer: ArrayBuffer;
    try {
      const res = await fetch(TSA_URL, {
        method: "POST",
        headers: { "Content-Type": "application/timestamp-query" },
        body: reqDer,
        signal: controller.signal,
      });
      if (!res.ok) return null;
      respDer = await res.arrayBuffer();
    } finally {
      clearTimeout(timeout);
    }

    const asn1 = asn1js.fromBER(respDer);
    if (asn1.offset === -1) return null;
    const tspResp = new pkijs.TimeStampResp({ schema: asn1.result });

    // 0 = granted, 1 = grantedWithMods — both mean a usable token is present; anything else is a
    // rejection (badAlg, badRequest, etc.).
    if (tspResp.status.status > 1 || !tspResp.timeStampToken) return null;

    const tokenDer = tspResp.timeStampToken.toSchema().toBER(false);

    const signedData = new pkijs.SignedData({ schema: tspResp.timeStampToken.content });
    const eContent = signedData.encapContentInfo.eContent;
    if (!eContent) return null;
    // .getValue() (not .valueBlock.valueHexView) — the latter is empty once eContent has been
    // round-tripped through fromBER, since a re-parsed OCTET STRING may store its content as
    // constructed sub-blocks rather than a flat buffer; getValue() concatenates them correctly.
    const tstInfoAsn1 = asn1js.fromBER(eContent.getValue());
    if (tstInfoAsn1.offset === -1) return null;
    const tstInfo = new pkijs.TSTInfo({ schema: tstInfoAsn1.result });

    // Reject if the TSA somehow timestamped a different hash than the one we sent — a mismatch
    // here would mean trusting a token that doesn't actually attest to this document.
    const returnedHash = new Uint8Array(tstInfo.messageImprint.hashedMessage.valueBlock.valueHexView);
    if (returnedHash.length !== hashBytes.length || !returnedHash.every((b, i) => b === hashBytes[i])) {
      return null;
    }

    return { genTime: tstInfo.genTime.toISOString(), tokenBase64: toBase64(tokenDer) };
  } catch {
    return null;
  }
}
