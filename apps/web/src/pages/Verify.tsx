import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { verifyDocumentHash, checkOtsStatus, apiUrl, type VerificationResult, type OtsStatusResult } from "../lib/api";
import { track } from "../lib/track";
import { NavIcon } from "../components/NavIcons";
import { useI18n, useT } from "../lib/i18n";

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

type OtsCheck =
  | { state: "idle" }
  | { state: "checking" }
  | { state: "done"; result: OtsStatusResult }
  | { state: "error" };

export default function Verify() {
  const t = useT();
  const { locale } = useI18n();
  usePageMeta(t("verify.seoTitle"), t("verify.seoDescription"), {
    canonicalPath: locale === "es" ? "/es/verificar" : "/verify",
    alternates: { en: "/verify", es: "/es/verificar" },
  });

  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [otsCheck, setOtsCheck] = useState<OtsCheck>({ state: "idle" });
  const [hashInput, setHashInput] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const runCheck = async (hash: string) => {
    setStatus({ state: "checking" });
    setOtsCheck({ state: "idle" });
    try {
      const result = await verifyDocumentHash(hash);
      track("verify_checked", { source: "verify_page" });
      setStatus({ state: "result", hash, result });
      if (result.found && result.hasOtsProof) {
        setOtsCheck({ state: "checking" });
        try {
          const otsResult = await checkOtsStatus(hash);
          setOtsCheck({ state: "done", result: otsResult });
        } catch {
          setOtsCheck({ state: "error" });
        }
      }
    } catch (err) {
      setStatus({ state: "error", message: err instanceof Error ? err.message : t("verify.genericError") });
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
      setStatus({ state: "error", message: t("verify.notPdf") });
      return;
    }
    setStatus({ state: "checking" });
    try {
      const hash = await sha256HexOfFile(file);
      await runCheck(hash);
    } catch {
      setStatus({ state: "error", message: t("verify.readFail") });
    }
  };

  const onHashSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = hashInput.trim();
    if (!HASH_RE.test(trimmed)) {
      setStatus({ state: "error", message: t("verify.badHash") });
      return;
    }
    runCheck(trimmed);
  };

  return (
    <div>
      <div className="verify-dark-hero">
        <div className="verify-dark-hero-inner">
          <h1>{t("verify.h1")}</h1>
          <p>{t("verify.sub")}</p>
          <ul className="verify-dark-trust-row">
            <li>
              <NavIcon name="badge" />
              {t("verify.trustRecords")}
            </li>
            <li>
              <NavIcon name="chainLink" />
              {t("verify.trustBitcoin")}
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
              <p className="verify-circle-title">{t("verify.dropTitle")}</p>
              <p className="verify-circle-sub">{t("verify.dropSub")}</p>
            </label>
          </div>
          <p className="verify-circle-caption">{t("verify.caption")}</p>

          <form className="verify-hash-form" onSubmit={onHashSubmit}>
            <input
              type="text"
              value={hashInput}
              onChange={(e) => setHashInput(e.target.value)}
              placeholder={t("verify.hashPh")}
            />
            <button type="submit">{t("verify.check")}</button>
          </form>

          {status.state === "checking" && (
            <p style={{ marginTop: 20, color: "rgba(255,255,255,0.7)" }}>{t("verify.checking")}</p>
          )}

          {status.state === "error" && (
            <div className="verify-reveal is-danger">
              <p className="verify-reveal-label">{t("verify.error")}</p>
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
                <>
                  {otsCheck.state === "checking" && (
                    <p>Checking the Bitcoin blockchain for an independent confirmation…</p>
                  )}
                  {otsCheck.state === "done" && otsCheck.result.confirmed && (
                    <p>
                      <strong>
                        ✓ Independently confirmed on the Bitcoin blockchain
                        {otsCheck.result.confirmedAt
                          ? ` on ${new Date(otsCheck.result.confirmedAt).toLocaleDateString()}`
                          : ""}
                        .
                      </strong>{" "}
                      Docracy just fetched the actual Bitcoin block from a public explorer and confirmed its Merkle
                      root matches this exact document's hash right now — so this holds even if Docracy itself
                      disappeared, via the free, public{" "}
                      <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer">
                        OpenTimestamps
                      </a>{" "}
                      protocol.{" "}
                      <a href={apiUrl(`/api/verify/${status.hash}/ots`)}>Download the raw proof (.ots)</a> to check it
                      yourself, with any tool, any time.
                    </p>
                  )}
                  {otsCheck.state === "done" && !otsCheck.result.confirmed && (
                    <p>
                      This hash is anchored to the Bitcoin blockchain via the free, public{" "}
                      <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer">
                        OpenTimestamps
                      </a>{" "}
                      protocol, but the submission hasn't been confirmed in a mined block yet — calendars batch
                      commits every few hours, so a proof from a recent signing is normal to see as still pending.{" "}
                      <a href={apiUrl(`/api/verify/${status.hash}/ots`)}>Download the proof (.ots)</a> and check back
                      at{" "}
                      <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer">
                        opentimestamps.org
                      </a>{" "}
                      later, or reload this page in a few hours.
                    </p>
                  )}
                  {otsCheck.state === "error" && (
                    <p>
                      This hash is anchored to the Bitcoin blockchain via the free, public{" "}
                      <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer">
                        OpenTimestamps
                      </a>{" "}
                      protocol, but Docracy couldn't reach a block explorer just now to confirm it live.{" "}
                      <a href={apiUrl(`/api/verify/${status.hash}/ots`)}>Download the proof (.ots)</a> and verify it
                      independently at{" "}
                      <a href="https://opentimestamps.org" target="_blank" rel="noopener noreferrer">
                        opentimestamps.org
                      </a>
                      .
                    </p>
                  )}
                </>
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
