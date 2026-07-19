import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import PdfViewer from "../components/PdfViewer";
import { fetchSignView, submitSignature, unlockSign } from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";
import type { SignPayload } from "../lib/api";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

export default function Sign() {
  const { token } = useParams<{ token: string }>();
  const [payload, setPayload] = useState<SignPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [signingFieldId, setSigningFieldId] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [unlockToken, setUnlockToken] = useState<string | null>(() =>
    token ? sessionStorage.getItem(`sign-unlock:${token}`) : null
  );
  const [pinInput, setPinInput] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);

  useNoIndex();

  useEffect(() => {
    if (!token) return;
    fetchSignView(token, unlockToken ?? undefined)
      .then(setPayload)
      .catch((err) => setError(err.message));
  }, [token, unlockToken]);

  const onUnlock = async () => {
    if (!token || !pinInput.trim()) return;
    setUnlocking(true);
    setPinError(null);
    try {
      const { unlockToken: newToken } = await unlockSign(token, pinInput.trim());
      sessionStorage.setItem(`sign-unlock:${token}`, newToken);
      setUnlockToken(newToken);
    } catch (err) {
      setPinError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUnlocking(false);
    }
  };

  const pdfBytes = useMemo(
    () => (payload?.pdfBase64 ? base64ToBytes(payload.pdfBase64) : null),
    [payload?.pdfBase64]
  );

  const allFilled = useMemo(
    () => (payload?.fields ?? []).every((f) => Boolean(values[f.id])),
    [payload?.fields, values]
  );

  const hasUnsavedWork = Object.keys(values).length > 0 && !done;
  useEffect(() => {
    if (!hasUnsavedWork) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasUnsavedWork]);

  const onSaveSignature = () => {
    if (!sigPadRef.current || !signingFieldId) return;
    if (sigPadRef.current.isEmpty()) return;
    const trimmed = sigPadRef.current.getTrimmedCanvas();
    // Flatten onto a white background so the embedded PNG has no alpha/SMask —
    // some PDF renderers hang decoding pdf-lib-embedded PNGs that carry one.
    const flattened = document.createElement("canvas");
    flattened.width = trimmed.width;
    flattened.height = trimmed.height;
    const ctx = flattened.getContext("2d")!;
    ctx.fillStyle = "white";
    ctx.fillRect(0, 0, flattened.width, flattened.height);
    ctx.drawImage(trimmed, 0, 0);
    const dataUrl = flattened.toDataURL("image/png");
    setValues((prev) => ({ ...prev, [signingFieldId]: dataUrl }));
    setSigningFieldId(null);
  };

  const onSubmit = async () => {
    if (!token || !payload?.fields || !consented) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitSignature(
        token,
        payload.fields.map((f) => ({
          fieldId: f.id,
          // Stored as the raw yyyy-mm-dd from <input type="date"> — reformatted here, once, at
          // submission time, into what actually gets burned into the PDF and the wire payload.
          value: f.type === "date" && values[f.id] ? new Date(`${values[f.id]}T00:00:00`).toLocaleDateString() : values[f.id],
        })),
        consented,
        unlockToken ?? undefined
      );
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="container">
        <h1>Not available</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="container">
        <p>Loading…</p>
      </div>
    );
  }

  if (done) {
    return (
      <div className="container">
        <h1>Signed</h1>
        <p>Thanks — you're done. Everyone in the chain will be notified as the document moves forward.</p>
      </div>
    );
  }

  if (!payload.onTurn) {
    return (
      <div className="container">
        <h1>Not your turn yet</h1>
        <p>Someone earlier in the signing order hasn't signed yet. Here's where things stand:</p>
        <div className="card">
          {payload.status.signers
            .sort((a, b) => a.order - b.order)
            .map((s) => (
              <div key={s.order} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
                {s.status === "signed" ? (
                  <span style={{ color: "var(--success)" }}>Signed by: {s.name} ✓</span>
                ) : (
                  <span style={{ color: "var(--body)" }}>Pending: {s.name}</span>
                )}
              </div>
            ))}
        </div>
      </div>
    );
  }

  if (payload.needsPin) {
    return (
      <div className="container">
        <h1>Enter your PIN</h1>
        <p>This document has an extra PIN set on your signing link. Enter it to continue.</p>
        <div className="card" style={{ maxWidth: 320 }}>
          <input
            className="form-input"
            style={{ width: "100%", marginBottom: 8 }}
            placeholder="PIN"
            inputMode="numeric"
            maxLength={8}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && onUnlock()}
          />
          {pinError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{pinError}</p>}
          <button className="btn-primary" style={{ width: "100%" }} disabled={!pinInput.trim() || unlocking} onClick={onUnlock}>
            {unlocking ? "Checking…" : "Continue"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Review &amp; sign</h1>
      {pdfBytes && (
        <PdfViewer
          pdfBytes={pdfBytes}
          renderPageOverlay={(page) => (
            <>
              {(payload.fields ?? [])
                .filter((f) => f.page === page.index)
                .map((f) => {
                  const type = f.type ?? "signature";
                  const boxStyle: React.CSSProperties = {
                    position: "absolute",
                    left: `${f.xFrac * 100}%`,
                    top: `${f.yFrac * 100}%`,
                    width: `${f.wFrac * 100}%`,
                    height: `${f.hFrac * 100}%`,
                  };

                  if (type === "text" || type === "date") {
                    return (
                      <div key={f.id} style={boxStyle}>
                        <input
                          type={type === "date" ? "date" : "text"}
                          value={values[f.id] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder={type === "date" ? undefined : "Type here"}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: values[f.id] ? "2px solid var(--success)" : "2px dashed var(--primary)",
                            borderRadius: "var(--r-sm)",
                            background: "var(--canvas)",
                            padding: "0 6px",
                            fontSize: 12,
                            fontFamily: "inherit",
                            color: "var(--ink)",
                          }}
                        />
                      </div>
                    );
                  }

                  return (
                    <div key={f.id} style={boxStyle}>
                      <button
                        onClick={() => setSigningFieldId(f.id)}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: values[f.id] ? "2px solid var(--success)" : "2px dashed var(--primary)",
                          borderRadius: "var(--r-sm)",
                          background: values[f.id] ? "var(--canvas)" : "var(--primary-soft)",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {values[f.id] ? (
                          <img src={values[f.id]} alt="signature" style={{ maxWidth: "100%", maxHeight: "100%" }} />
                        ) : (
                          <span style={{ fontSize: 11, color: "var(--primary)", fontWeight: 600 }}>
                            {type === "initials" ? "Click to initial" : "Click to sign"}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
            </>
          )}
        />
      )}

      {signingFieldId && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div
            className="card"
            style={{ background: "var(--canvas)", boxShadow: "var(--shadow-lg)", maxWidth: "92vw" }}
          >
            <p>{payload.fields?.find((f) => f.id === signingFieldId)?.type === "initials" ? "Draw your initials" : "Draw your signature"}</p>
            <div style={{ background: "var(--canvas)", borderRadius: "var(--r-sm)", width: 360, maxWidth: "100%" }}>
              <SignatureCanvas
                ref={sigPadRef}
                penColor="black"
                canvasProps={{ width: 360, height: 150, style: { maxWidth: "100%", height: "auto", display: "block" } }}
              />
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button className="btn-secondary" onClick={() => sigPadRef.current?.clear()}>
                Clear
              </button>
              <button className="btn-primary" onClick={onSaveSignature}>
                Use this signature
              </button>
              <button className="btn-secondary" onClick={() => setSigningFieldId(null)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 16, fontSize: 13 }}>
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>
          I confirm that I'm the person this link was sent to, and that clicking "Complete signing" is my
          signature on this document.
        </span>
      </label>

      <div style={{ marginTop: 16 }}>
        <button className="btn-primary" disabled={!allFilled || !consented || submitting} onClick={onSubmit}>
          {submitting ? "Submitting…" : "Complete signing"}
        </button>
      </div>
    </div>
  );
}
