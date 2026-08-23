import { submit, write } from "@lacrypta/typescript-opentimestamps";

// Passed explicitly rather than relying on the library's own `defaultCalendarUrls` (its .d.ts
// declares one, but it isn't actually re-exported from the package's runtime entry point) — these
// are the same four free, public calendars that default would have used: Alice/Bob (OpenTimestamps
// project), Finney (Eternity Wall), and Catallaxy.
const CALENDAR_URLS = [
  "https://alice.btc.calendar.opentimestamps.org",
  "https://bob.btc.calendar.opentimestamps.org",
  "https://finney.calendar.eternitywall.com",
  "https://btc.calendar.catallaxy.com",
].map((u) => new URL(u));

/** Anchors a document's SHA-256 hash to the Bitcoin blockchain via the free, public OpenTimestamps
 *  calendar network — no wallet, no gas fees, no cost to us or the signer. The result is a
 *  standard `.ots` proof file, independently verifiable by anyone via the public
 *  opentimestamps.org tool or `ots` CLI, without needing to trust Docracy at all. A
 *  freshly-submitted proof starts "pending": calendars only batch-commit to Bitcoin every so
 *  often, so a verifier won't see a confirmed block for a few hours — that's inherent to the
 *  protocol, not a bug here.
 *
 *  Never throws — submit() itself already collects per-calendar errors instead of throwing, and
 *  this catches anything else (a network exception, a malformed hash) so a calendar outage can
 *  never affect document completion, which calls this as a best-effort background step. */
export async function stampHash(hashHex: string): Promise<Uint8Array | null> {
  try {
    const { timestamp, errors } = await submit("sha256", hexToBytes(hashHex), undefined, CALENDAR_URLS);
    if (errors.length > 0) {
      console.error(
        "OpenTimestamps: some calendars failed (non-fatal):",
        errors.map((e) => e.message)
      );
    }
    // submit() never throws on calendar failures (see its own docs) — it always resolves with
    // *some* Timestamp, even an empty one with zero Merkle attestations if every calendar failed.
    // That's nothing an outside verifier could ever check, so it's not worth storing at all.
    if (errors.length >= CALENDAR_URLS.length) return null;
    return write(timestamp);
  } catch (err) {
    console.error("OpenTimestamps stamping failed (non-fatal):", err);
    return null;
  }
}

function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  return bytes;
}
