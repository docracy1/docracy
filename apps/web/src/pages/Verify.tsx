import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { verifyDocumentHash, type VerificationResult } from "../lib/api";
import { track } from "../lib/track";

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
    "Verify a Signed Document | Docracy",
    "Confirm a PDF was really completed through Docracy's signing flow — upload the file or paste its SHA-256 hash. Your file never leaves your browser."
  );

  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [hashInput, setHashInput] = useState("");

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
    <div className="container" style={{ maxWidth: 640 }}>
      <h1>Verify a signed document</h1>
      <p style={{ color: "var(--mute)" }}>
        Confirm a PDF was really completed through Docracy's signing flow, and when. Upload the file below — it's
        hashed in your browser and never uploaded anywhere; only the resulting hash is sent to check against our
        records.
      </p>

      <div
        className="card"
        style={{ marginTop: 20, padding: 24, textAlign: "center", border: "2px dashed var(--hairline)" }}
      >
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
        <label htmlFor="verify-file-input" className="btn-primary" style={{ cursor: "pointer", display: "inline-block" }}>
          Upload a signed PDF
        </label>
        <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 10, marginBottom: 0 }}>
          Works with the signed document itself or its certificate of completion.
        </p>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
        <span style={{ fontSize: 12, color: "var(--mute)" }}>or paste a hash</span>
        <div style={{ flex: 1, height: 1, background: "var(--hairline)" }} />
      </div>

      <form onSubmit={onHashSubmit} style={{ display: "flex", gap: 8 }}>
        <input
          type="text"
          value={hashInput}
          onChange={(e) => setHashInput(e.target.value)}
          placeholder="SHA-256 hash from the certificate (64 hex characters)"
          style={{ flex: 1, fontFamily: "monospace", fontSize: 13 }}
        />
        <button type="submit" className="btn-secondary">
          Check
        </button>
      </form>

      {status.state === "checking" && (
        <p style={{ marginTop: 20, color: "var(--mute)" }}>Checking…</p>
      )}

      {status.state === "error" && (
        <div className="card" style={{ marginTop: 20, borderColor: "var(--danger)" }}>
          <p style={{ margin: 0, color: "var(--danger)" }}>{status.message}</p>
        </div>
      )}

      {status.state === "result" && status.result.found && (
        <div className="card" style={{ marginTop: 20, borderColor: "var(--success, #2e8b57)" }}>
          <p style={{ margin: 0, fontWeight: 700 }}>✓ Verified</p>
          <p style={{ margin: "8px 0 0" }}>
            A document with this exact content was completed through Docracy on{" "}
            {status.result.completedAt ? new Date(status.result.completedAt).toLocaleString() : "an unknown date"}, signed
            by {status.result.signerCount} {status.result.signerCount === 1 ? "signer" : "signers"}.
          </p>
        </div>
      )}

      {status.state === "result" && !status.result.found && (
        <div className="card" style={{ marginTop: 20 }}>
          <p style={{ margin: 0, fontWeight: 700 }}>No matching record found</p>
          <p style={{ margin: "8px 0 0", color: "var(--mute)" }}>
            This hash doesn't match any document completed through Docracy — or the file has been modified even
            slightly since it was signed, which changes its hash entirely. This doesn't necessarily mean the document
            is fraudulent; it may simply not have been signed here.
          </p>
        </div>
      )}

      <div className="card" style={{ marginTop: 32, padding: "16px 20px" }}>
        <h3 style={{ marginTop: 0, fontSize: 14 }}>What this does and doesn't prove</h3>
        <p style={{ fontSize: 13, color: "var(--mute)", marginBottom: 8 }}>
          A match confirms a document with these exact bytes was completed through Docracy's signing flow, and when —
          even one changed character produces a completely different hash, so this reliably detects tampering.
        </p>
        <p style={{ fontSize: 13, color: "var(--mute)", margin: 0 }}>
          It does not verify who physically signed — Docracy's default signature is a Simple Electronic Signature
          (SES), not identity-verified. See <Link to="/trust">Trust &amp; security</Link> for details.
        </p>
      </div>
    </div>
  );
}
