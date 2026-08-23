import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { verifyDocumentHash, apiUrl, type VerificationResult } from "../lib/api";
import { track } from "../lib/track";
import { NavIcon } from "../components/NavIcons";

const HASH_RE = /^[0-9a-f]{64}$/i;

async function sha256HexOfFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

type Status =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "result"; hash: string; result: VerificationResult }
  | { state: "error"; message: string };

export default function Verify() {
  usePageMeta(
    "Verify a Signed Document — Independently, via Blockchain | Docracy",
    "Confirm a PDF was really completed through Docracy's signing flow — and check it independently on the Bitcoin blockchain via OpenTimestamps, without needing to trust Docracy at all. Upload the file or paste its SHA-256 hash; it never leaves your browser."
  );

  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [hashInput, setHashInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const runCheck = async (hash: string) => {
    setStatus({ state: "checking" });
    try {
      const result = await verifyDocumentHash(hash);
      track("verify_checked", { source: "verify_page" });
      setStatus({ state: "result", hash, result });
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : "Something went wrong." });
    }
  };

  useEffect(() => {
    const fromQuery = searchParams.get("hash")?.trim().toLowerCase();
    if (fromQuery && HASH_RE.test(fromQuery)) {
      setHashInput(fromQuery);
      runCheck(fromQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFile = async (file: File) => {
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setStatus({ state: "error", message: "That doesn't look like a PDF file." });
      return;
    }
    setStatus({ state: "checking" });
    try {
      const hash = await sha256HexOfFile(file);
      await runCheck(hash);
    } catch {
      setStatus({ state: "error", message: "Couldn't read that file — please try again." });
    }
  };

  const onHashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hashInput.trim();
    if (!HASH_RE.test(trimmed)) {
      setStatus({ state: "error", message: "That's not a valid SHA-256 hash (expected 64 hex characters)." });
      return;
    }
    runCheck(trimmed);
  };

  return (
    <div>
      <div className="verify-dark-hero">
        <div className="verify-dark-hero-inner">
          <h1>Verify a signed document</h1>
          <p>
            Confirm a PDF was really completed through Docracy's signing flow, and when — then check it a second
            way, independently of Docracy, on the Bitcoin blockchain.
          </p>
          <ul className="verify-dark-trust-row">
            <li>
              <NavIcon name="badge" />
              Checked against Docracy's records
            </li>
            <li>
              <NavIcon name="chainLink" />
              Independently checkable on Bitcoin
            </li>
          </ul>

          <div className="verify-circle-wrap">
            <input
              type="file"
              accept="application/pdf,.pdf"
              id="verify-file-input"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onFile(file);
                e.target.value = "";
              }}
            />
            <label
              htmlFor="verify-file-input"
              className={`verify-circle${isDragging ? " is-dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                const file = e.dataTransfer.files?.[0];
                if (file) onFile(file);
              }}
            >
              <span className="verify-circle-icon">
                <NavIcon name="badge" />
              </span>
              <p className="verify-circle-title">Click or drag your PDF here</p>
              <p className="verify-circle-sub">Free, tamper-evident verification</p>
            </label>
          </div>
          <p className="verify-circle-caption">SHA-256 · computed in your browser · nothing ever uploaded</p>

          <form className="verify-hash-form" onSubmit={onHashSubmit}>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder="Or paste a SHA-256 hash"
            />
            <button type="submit">Check</button>
          </form>

          {status.state === "checking" && (
            <p style={{ marginTop: 20, color: "rgba(255,255,255,0.7)" }}>Checking…</p>
          )}

          {status.state === "error" && (
            <div className="verify-reveal is-danger">
              <p className="verify-reveal-label">Error</p>
              <p>{status.message}</p>
            </div>
          )}

          {status.state === "result" && status.result.found && (
            <div className="verify-reveal">
              <p className="verify-reveal-label">✓ Verified</p>
              <p>
                A document with this exact content was completed through Docracy on{" "}
                {status.result.completedAt ? new Date(status.result.completedAt).toLocaleString() : "an unknown date"}
                , signed by {status.result.signerCount} {status.result.signerCount === 1 ? "signer" : "signers"}.
              </p>
              {status.result.hasOtsProof ? (
                <p>
                  This hash is also anchored to the Bitcoin blockchain via the free, public{" "}
                  <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer">
                    OpenTimestamps
                  </a>{" "}
                  protocol — provable even if Docracy itself disappeared.{" "}
                  <a href={apiUrl(`/api/verify/${status.hash}/ots`)}>Download the proof (.ots)</a>, then verify it
                  independently at{" "}
                  <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer">
                    opentimestamps.org
                  </a>
                  . New proofs take a few hours to be confirmed on the blockchain — until then, opentimestamps.org
                  will show it as pending.
                </p>
              ) : (
                <p>
                  A blockchain timestamp proof for this document isn't available yet — it's submitted in the
                  background right after signing and can take a minute to appear. Check back shortly.
                </p>
              )}
            </div>
          )}

          {status.state === "result" && !status.result.found && (
            <div className="verify-reveal is-neutral">
              <p className="verify-reveal-label">No matching record found</p>
              <p>
                This hash doesn't match any document completed through Docracy — or the file has been modified
                even slightly since it was signed, which changes its hash entirely. This doesn't necessarily mean
                the document is fraudulent; it may simply not have been signed here.
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="container">
        <div className="card" style={{ marginTop: 32, marginBottom: 40, padding: "20px 24px", maxWidth: 560, marginLeft: "auto", marginRight: "auto" }}>
          <h3 style={{ marginTop: 0, fontSize: 14 }}>What this does and doesn't prove</h3>
          <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 8 }}>
            A match confirms a document with these exact bytes was completed through Docracy's signing flow, and
            when — even one changed character produces a completely different hash, so this reliably detects
            tampering.
          </p>
          <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 8 }}>
            It does not verify who physically signed — Docracy's default signature is a Simple Electronic Signature
            (SES), not identity-verified. See <Link to="/trust">Trust &amp; security</Link> for details.
          </p>
          <p style={{ fontSize: 13, color: "var(--mute)", margin: 0 }}>
            Every completed document's hash is also submitted to the free, public OpenTimestamps protocol, which
            anchors it to the Bitcoin blockchain — so this can be verified independently, without trusting Docracy's
            own records at all.
          </p>
        </div>
      </div>
    </div>
  );
}
