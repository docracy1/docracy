import { useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import PdfViewer from "../components/PdfViewer";
import { fetchSignView, submitSignature } from "../lib/api";
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
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const sigPadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    if (!token) return;
    fetchSignView(token)
      .then(setPayload)
      .catch((err) => setError(err.message));
  }, [token]);

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
    if (!token || !payload?.fields) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitSignature(
        token,
        payload.fields.map((f) => ({ fieldId: f.id, value: values[f.id] }))
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
                .map((f) => (
                  <div
                    key={f.id}
                    style={{
                      position: "absolute",
                      left: `${f.xFrac * 100}%`,
                      top: `${f.yFrac * 100}%`,
                      width: `${f.wFrac * 100}%`,
                      height: `${f.hFrac * 100}%`,
                    }}
                  >
                    {f.type === "signature" ? (
                      <button
                        onClick={() => setSigningFieldId(f.id)}
                        style={{
                          width: "100%",
                          height: "100%",
                          border: values[f.id] ? "2px solid #2f8f5b" : "2px dashed #3b6fd8",
                          borderRadius: 3,
                          background: values[f.id] ? "white" : "rgba(59,111,216,0.08)",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {values[f.id] ? (
                          <img src={values[f.id]} alt="signature" style={{ maxWidth: "100%", maxHeight: "100%" }} />
                        ) : (
                          <span style={{ fontSize: 11, color: "#3b6fd8", fontWeight: 600 }}>Click to sign</span>
                        )}
                      </button>
                    ) : (
                      <input
                        type={f.type === "date" ? "date" : "text"}
                        style={{
                          width: "100%",
                          height: "100%",
                          fontSize: 12,
                          border: "2px dashed #3b6fd8",
                          borderRadius: 3,
                          background: "rgba(59,111,216,0.08)",
                          color: "#111318",
                          padding: "0 4px",
                        }}
                        value={values[f.id] ?? ""}
                        onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                      />
                    )}
                  </div>
                ))}
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
            style={{ background: "var(--canvas)", boxShadow: "0 8px 24px rgba(0,0,0,0.2)", maxWidth: "92vw" }}
          >
            <p>Draw your signature</p>
            <div style={{ background: "white", borderRadius: 3, width: 360, maxWidth: "100%" }}>
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

      <div style={{ marginTop: 16 }}>
        <button className="btn-primary" disabled={!allFilled || submitting} onClick={onSubmit}>
          {submitting ? "Submitting…" : "Complete signing"}
        </button>
      </div>
    </div>
  );
}
