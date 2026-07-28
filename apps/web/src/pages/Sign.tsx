import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import SignatureCanvas from "react-signature-canvas";
import PdfViewer from "../components/PdfViewer";
import { apiUrl, declineSign, fetchSignView, submitSignature, unlockSign, uploadSignAttachment } from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";
import type { SignPayload } from "../lib/api";
import type { StatusPayload } from "../lib/types";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Replaces the generic Docracy branding with the sending workspace's own logo and/or cosmetic
 *  name label, when they've set either — this is the one surface a signer who's never heard of
 *  Docracy actually looks at. */
function BrandLogo({ path, slug }: { path?: string | null; slug?: string | null }) {
  if (!path && !slug) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      {path && <img src={apiUrl(path)} alt="Sender's logo" style={{ maxHeight: 48, maxWidth: 220, display: "block" }} />}
      {slug && <div style={{ fontSize: 13, color: "var(--mute)", marginTop: path ? 4 : 0 }}>{slug}</div>}
    </div>
  );
}

function SignerStatusList({ status }: { status: StatusPayload }) {
  return (
    <div className="card">
      {status.signers
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => (
          <div key={s.order} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
            {s.status === "signed" ? (
              <span style={{ color: "var(--success)" }}>Signed by: {s.name} ✓</span>
            ) : s.status === "declined" ? (
              <span style={{ color: "var(--danger)" }}>Declined: {s.name}</span>
            ) : (
              <span style={{ color: "var(--body)" }}>Pending: {s.name}</span>
            )}
          </div>
        ))}
    </div>
  );
}

export interface SignProps {
  /** When set (embed flow), used instead of the `:token` route param. */
  overrideToken?: string;
  /** Chrome-less iframe signing — posts lifecycle events to the parent frame. */
  embedMode?: boolean;
  allowedOrigins?: string[];
  returnUrl?: string;
}

export default function Sign({
  overrideToken,
  embedMode = false,
  allowedOrigins,
  returnUrl,
}: SignProps = {}) {
  const { token: paramToken } = useParams<{ token: string }>();
  const token = overrideToken ?? paramToken;
  const [payload, setPayload] = useState<SignPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [signingFieldId, setSigningFieldId] = useState<string | null>(null);
  const [consented, setConsented] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [declining, setDeclining] = useState(false);
  const [done, setDone] = useState(false);
  const [declined, setDeclined] = useState(false);
  const [finalStatus, setFinalStatus] = useState<StatusPayload | null>(null);
  const [unlockToken, setUnlockToken] = useState<string | null>(() =>
    token ? sessionStorage.getItem(`sign-unlock:${token}`) : null
  );
  const [pinInput, setPinInput] = useState("");
  const [unlocking, setUnlocking] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);
  const postTargetOrigin = allowedOrigins?.[0] || "*";

  const postEmbed = (type: "ready" | "signed" | "declined" | "error", extra?: { docId?: string }) => {
    if (!embedMode || window.parent === window) return;
    window.parent.postMessage({ source: "docracy", type, ...extra }, postTargetOrigin);
  };

  useNoIndex();

  useEffect(() => {
    if (!token) return;
    fetchSignView(token, unlockToken ?? undefined)
      .then((data) => {
        setPayload(data);
        postEmbed("ready", { docId: data.docId });
      })
      .catch((err) => {
        setError(err.message);
        postEmbed("error", {});
      });
    // postEmbed intentionally omitted — only re-fetch when token/unlock changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, unlockToken]);

  useEffect(() => {
    if (!payload?.fields) return;
    setValues((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const f of payload.fields!) {
        if ((f.type ?? "signature") === "checkbox" && f.required === false && next[f.id] === undefined) {
          next[f.id] = "false";
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [payload?.fields]);

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
    () =>
      (payload?.fields ?? []).every((f) => {
        const type = f.type ?? "signature";
        if (type === "checkbox") {
          if (f.required === false) return values[f.id] === "true" || values[f.id] === "false";
          return values[f.id] === "true";
        }
        if (type === "dropdown") return Boolean(values[f.id]);
        return Boolean(values[f.id]);
      }),
    [payload?.fields, values]
  );

  const attachmentsOk = useMemo(() => {
    if (!payload?.signerAttachments) return true;
    return (payload.signerAttachments.uploaded?.length ?? 0) > 0;
  }, [payload?.signerAttachments]);

  const canSubmit = allFilled && attachmentsOk && consented;

  const hasUnsavedWork = Object.keys(values).length > 0 && !done && !declined;
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

  const maybeRedirectReturnUrl = () => {
    if (!embedMode || !returnUrl) return;
    try {
      if (window.top) window.top.location.href = returnUrl;
    } catch {
      window.location.href = returnUrl;
    }
  };

  const onUploadAttachment = async (file: File) => {
    if (!token) return;
    setUploadingAttachment(true);
    setAttachmentError(null);
    try {
      const result = await uploadSignAttachment(token, file, unlockToken ?? undefined);
      setPayload((prev) =>
        prev?.signerAttachments
          ? {
              ...prev,
              signerAttachments: {
                ...prev.signerAttachments,
                uploaded: [...prev.signerAttachments.uploaded, result.attachment],
              },
            }
          : prev
      );
    } catch (err) {
      setAttachmentError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingAttachment(false);
    }
  };

  const onSubmit = async () => {
    if (!token || !payload?.fields || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const result = await submitSignature(
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
      setFinalStatus(result.status);
      setDone(true);
      postEmbed("signed", { docId: payload.docId ?? result.status.docId });
      maybeRedirectReturnUrl();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      postEmbed("error", { docId: payload.docId });
    } finally {
      setSubmitting(false);
    }
  };

  const onDecline = async () => {
    if (!token) return;
    const reason = window.prompt("Optional reason for declining (leave blank to skip):") ?? undefined;
    if (reason === undefined) return;
    setDeclining(true);
    setError(null);
    try {
      const result = await declineSign(token, reason.trim() || undefined, unlockToken ?? undefined);
      setFinalStatus(result.status);
      setDeclined(true);
      postEmbed("declined", { docId: payload?.docId ?? result.status.docId });
      maybeRedirectReturnUrl();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
      postEmbed("error", { docId: payload?.docId });
    } finally {
      setDeclining(false);
    }
  };

  if (error && !payload) {
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

  if (declined || finalStatus?.status === "voided") {
    const wasDecline = declined || finalStatus?.voidedBy === "decline";
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>{wasDecline ? "Declined" : "Document cancelled"}</h1>
        <p>
          {wasDecline
            ? "You've declined to sign. The sender and other parties have been notified."
            : "This document has been cancelled and is no longer available for signing."}
        </p>
        {finalStatus?.voidReason && (
          <p style={{ color: "var(--mute)", fontSize: 14 }}>Reason: {finalStatus.voidReason}</p>
        )}
        {finalStatus && <SignerStatusList status={finalStatus} />}
      </div>
    );
  }

  if (done) {
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>Signed</h1>
        <p>Thanks — you're done. Everyone in the chain will be notified as the document moves forward.</p>
        {finalStatus?.status === "completed" && token && (
          <a
            href={apiUrl(`/api/status/${token}/download`)}
            download
            className="btn-primary"
            style={{ display: "inline-block", textDecoration: "none", marginTop: 4, marginBottom: 20 }}
          >
            Download signed PDF
          </a>
        )}
        {/* The recipient never needed an account to get here — this is the moment they're most
         *  likely to become a sender themselves. Skipped entirely for white-labeled workspaces,
         *  who are paying specifically to keep their signers from seeing Docracy at all. Also
         *  skipped in embedMode so the iframe stays chrome-less. */}
        {!embedMode && !payload.brandLogoPath && (
          <div className="card" style={{ marginTop: 24, maxWidth: 420 }}>
            <p style={{ marginBottom: 12 }}>Created with Docracy — send your own documents for free.</p>
            <Link to="/prepare" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
              Send a document
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (payload.status.status === "voided") {
    const wasDecline = payload.status.voidedBy === "decline";
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>{wasDecline ? "Document declined" : "Document cancelled"}</h1>
        <p>
          {wasDecline
            ? "A signer declined this document, so it's no longer available for signing."
            : "This document has been cancelled and is no longer available for signing."}
        </p>
        {payload.status.voidReason && (
          <p style={{ color: "var(--mute)", fontSize: 14 }}>Reason: {payload.status.voidReason}</p>
        )}
        <SignerStatusList status={payload.status} />
      </div>
    );
  }

  if (!payload.onTurn) {
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>Not your turn yet</h1>
        <p>Someone earlier in the signing order hasn't signed yet. Here's where things stand:</p>
        <SignerStatusList status={payload.status} />
      </div>
    );
  }

  if (payload.needsPin) {
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>Enter your PIN</h1>
        <p>This document has an extra PIN set on your signing link. Enter it to continue.</p>
        <div className="card" style={{ maxWidth: 320 }}>
          <input
            className="form-input"
            style={{ width: "100%", marginBottom: 8 }}
            placeholder="PIN"
            aria-label="PIN"
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
      <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
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

                  if (type === "checkbox") {
                    const checked = values[f.id] === "true";
                    return (
                      <div key={f.id} style={boxStyle}>
                        <button
                          type="button"
                          aria-label={f.required === false ? "Optional checkbox" : "Required checkbox"}
                          aria-pressed={checked}
                          onClick={() =>
                            setValues((prev) => ({
                              ...prev,
                              [f.id]: prev[f.id] === "true" ? "false" : "true",
                            }))
                          }
                          style={{
                            width: "100%",
                            height: "100%",
                            border: checked ? "2px solid var(--success)" : "2px dashed var(--primary)",
                            borderRadius: "var(--r-sm)",
                            background: checked ? "var(--canvas)" : "var(--primary-soft)",
                            cursor: "pointer",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: Math.max(12, Math.min(f.wFrac, f.hFrac) * 400),
                            fontWeight: 700,
                            color: "var(--primary)",
                            lineHeight: 1,
                          }}
                        >
                          {checked ? "✓" : ""}
                        </button>
                      </div>
                    );
                  }

                  if (type === "text" || type === "date") {
                    return (
                      <div key={f.id} style={boxStyle}>
                        <input
                          type={type === "date" ? "date" : "text"}
                          aria-label={type === "date" ? "Date" : "Text field"}
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

                  if (type === "dropdown") {
                    const opts = f.options ?? [];
                    return (
                      <div key={f.id} style={boxStyle}>
                        <select
                          aria-label="Dropdown field"
                          value={values[f.id] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          style={{
                            width: "100%",
                            height: "100%",
                            border: values[f.id] ? "2px solid var(--success)" : "2px dashed var(--primary)",
                            borderRadius: "var(--r-sm)",
                            background: "var(--canvas)",
                            padding: "0 4px",
                            fontSize: 11,
                            fontFamily: "inherit",
                            color: "var(--ink)",
                          }}
                        >
                          <option value="">Choose…</option>
                          {opts.map((o) => (
                            <option key={o} value={o}>
                              {o}
                            </option>
                          ))}
                        </select>
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
                          <img src={values[f.id]} alt="Your signature" style={{ maxWidth: "100%", maxHeight: "100%" }} />
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
            <div className="sign-modal-actions">
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

      {payload.signerAttachments && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>Upload attachment</h2>
          <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>
            Upload at least one file (PDF or image, up to{" "}
            {Math.round(payload.signerAttachments.maxBytesPerFile / (1024 * 1024))}MB each) before signing.
          </p>
          {(payload.signerAttachments.uploaded ?? []).map((a) => (
            <p key={a.id} style={{ fontSize: 13, margin: "4px 0" }}>
              ✓ {a.name} ({Math.round(a.sizeBytes / 1024)} KB)
            </p>
          ))}
          {(payload.signerAttachments.uploaded?.length ?? 0) < payload.signerAttachments.maxFiles && (
            <input
              type="file"
              accept=".pdf,image/*"
              disabled={uploadingAttachment}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void onUploadAttachment(file);
                e.target.value = "";
              }}
            />
          )}
          {attachmentError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{attachmentError}</p>}
          {uploadingAttachment && <p style={{ fontSize: 13 }}>Uploading…</p>}
        </div>
      )}

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

      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button className="btn-primary" disabled={!canSubmit || submitting || declining} onClick={onSubmit}>
          {submitting ? "Submitting…" : "Complete signing"}
        </button>
        <button className="btn-secondary" disabled={submitting || declining} onClick={onDecline}>
          {declining ? "Declining…" : "Decline"}
        </button>
      </div>
    </div>
  );
}
