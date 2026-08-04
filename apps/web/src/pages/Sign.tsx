import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import PdfViewer from "../components/PdfViewer";
import SignatureCaptureModal from "../components/SignatureCaptureModal";
import { apiUrl, declineSign, fetchSignView, submitSignature, unlockSign, uploadSignAttachment } from "../lib/api";
import { track } from "../lib/track";
import { useNoIndex } from "../lib/useNoIndex";
import type { SignPayload } from "../lib/api";
import type { StatusPayload } from "../lib/types";
import { useT } from "../lib/i18n";

function base64ToBytes(base64: string): Uint8Array {
  const binary = atob(base64);
  return Uint8Array.from(binary, (c) => c.charCodeAt(0));
}

/** Replaces the generic Docracy branding with the sending workspace's own logo and/or cosmetic
 *  name label, when they've set either — this is the one surface a signer who's never heard of
 *  Docracy actually looks at. */
function BrandLogo({ path, slug }: { path?: string | null; slug?: string | null }) {
  const t = useT();
  if (!path && !slug) return null;
  return (
    <div style={{ marginBottom: 16 }}>
      {path && <img src={apiUrl(path)} alt={t("sign.senderLogo")} style={{ maxHeight: 48, maxWidth: 220, display: "block" }} />}
      {slug && <div style={{ fontSize: 13, color: "var(--mute)", marginTop: path ? 4 : 0 }}>{slug}</div>}
    </div>
  );
}

function SignerStatusList({ status }: { status: StatusPayload }) {
  const t = useT();
  return (
    <div className="card">
      {status.signers
        .slice()
        .sort((a, b) => a.order - b.order)
        .map((s) => (
          <div key={s.order} style={{ padding: "8px 0", borderBottom: "1px solid var(--hairline)" }}>
            {s.status === "signed" ? (
              <span style={{ color: "var(--success)" }}>{t("sign.signedBy", { name: s.name })}</span>
            ) : s.status === "declined" ? (
              <span style={{ color: "var(--danger)" }}>{t("sign.declinedBy", { name: s.name })}</span>
            ) : (
              <span style={{ color: "var(--body)" }}>{t("sign.pending", { name: s.name })}</span>
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
  const t = useT();
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

  const signingField = useMemo(
    () => (payload?.fields ?? []).find((f) => f.id === signingFieldId) ?? null,
    [payload?.fields, signingFieldId]
  );
  const signingFieldKind: "signature" | "initials" =
    (signingField?.type ?? "signature") === "initials" ? "initials" : "signature";

  const onSaveSignature = (dataUrl: string) => {
    if (!signingFieldId) return;
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
        <h1>{t("sign.notAvailable")}</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!payload) {
    return (
      <div className="container">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (declined || finalStatus?.status === "voided") {
    const wasDecline = declined || finalStatus?.voidedBy === "decline";
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>{wasDecline ? t("sign.declinedTitle") : t("sign.cancelled")}</h1>
        <p>
          {wasDecline ? t("sign.declinedBody") : t("sign.cancelledBody")}
        </p>
        {finalStatus?.voidReason && (
          <p style={{ color: "var(--mute)", fontSize: 14 }}>{t("sign.reason", { reason: finalStatus.voidReason })}</p>
        )}
        {finalStatus && <SignerStatusList status={finalStatus} />}
      </div>
    );
  }

  if (done) {
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>{t("sign.signed")}</h1>
        <p>{t("sign.thanks")}</p>
        {finalStatus?.status === "completed" && token && (
          <a
            href={apiUrl(`/api/status/${token}/download`)}
            download
            className="btn-primary"
            style={{ display: "inline-block", textDecoration: "none", marginTop: 4, marginBottom: 20 }}
          >
            {t("sign.download")}
          </a>
        )}
        {/* The recipient never needed an account to get here — this is the moment they're most
         *  likely to become a sender themselves. Skipped entirely for white-labeled workspaces,
         *  who are paying specifically to keep their signers from seeing Docracy at all. Also
         *  skipped in embedMode so the iframe stays chrome-less. */}
        {!embedMode && !payload.brandLogoPath && (
          <div className="card" style={{ marginTop: 24, maxWidth: 420 }}>
            <p style={{ marginBottom: 12 }}>{t("sign.viral")}</p>
            <Link
              to="/prepare?ref=signer-completion"
              className="btn-primary"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("viral_cta_clicked", { source: "signer_done" })}
            >
              {t("sign.sendDoc")}
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
        <h1>{wasDecline ? t("sign.declinedDoc") : t("sign.cancelled")}</h1>
        <p>
          {wasDecline ? t("sign.declinedDocBody") : t("sign.cancelledBody")}
        </p>
        {payload.status.voidReason && (
          <p style={{ color: "var(--mute)", fontSize: 14 }}>
            {t("sign.reason", { reason: payload.status.voidReason })}
          </p>
        )}
        <SignerStatusList status={payload.status} />
      </div>
    );
  }

  if (!payload.onTurn) {
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>{t("sign.notYourTurn")}</h1>
        <p>{t("sign.notTurnBody")}</p>
        <SignerStatusList status={payload.status} />
      </div>
    );
  }

  if (payload.needsPin) {
    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>{t("sign.enterPin")}</h1>
        <p>{t("sign.pinBody")}</p>
        <div className="card" style={{ maxWidth: 320 }}>
          <input
            className="form-input"
            style={{ width: "100%", marginBottom: 8 }}
            placeholder={t("sign.pinPlaceholder")}
            aria-label={t("sign.pinPlaceholder")}
            inputMode="numeric"
            maxLength={8}
            value={pinInput}
            onChange={(e) => setPinInput(e.target.value.replace(/\D/g, ""))}
            onKeyDown={(e) => e.key === "Enter" && onUnlock()}
          />
          {pinError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{pinError}</p>}
          <button className="btn-primary" style={{ width: "100%" }} disabled={!pinInput.trim() || unlocking} onClick={onUnlock}>
            {unlocking ? t("sign.checking") : t("sign.continue")}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
      <h1>{t("sign.review")}</h1>
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
                            {(f.type ?? "signature") === "initials" ? t("sign.clickInitial") : t("sign.clickToSign")}
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
        <SignatureCaptureModal
          fieldKind={signingFieldKind}
          signerName={payload.signerName}
          onSave={onSaveSignature}
          onCancel={() => setSigningFieldId(null)}
        />
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
        <span>{t("sign.consent")}</span>
      </label>

      <div style={{ marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}>
        <button className="btn-primary" disabled={!canSubmit || submitting || declining} onClick={onSubmit}>
          {submitting ? t("sign.submitting") : t("sign.submit")}
        </button>
        <button className="btn-secondary" disabled={submitting || declining} onClick={onDecline}>
          {declining ? t("sign.declining") : t("sign.decline")}
        </button>
      </div>
    </div>
  );
}
