import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import FieldInputSheet from "../components/FieldInputSheet";
import PdfViewer from "../components/PdfViewer";
import SignatureCaptureModal from "../components/SignatureCaptureModal";
import SignerConversionPopup from "../components/SignerConversionPopup";
import { apiUrl, declineSign, fetchMe, fetchSignView, submitSignature, unlockSign, uploadSignAttachment } from "../lib/api";
import { track } from "../lib/track";
import { useNoIndex } from "../lib/useNoIndex";
import type { SignPayload } from "../lib/api";
import type { DocField, StatusPayload } from "../lib/types";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { signedPagePath } from "../lib/paidVault";

function fieldIsFilled(f: DocField, values: Record<string, string>): boolean {
  const type = f.type ?? "signature";
  if (type === "checkbox") {
    if (f.required === false) return values[f.id] === "true" || values[f.id] === "false";
    return values[f.id] === "true";
  }
  return Boolean(values[f.id]);
}

function fieldTypeLabelKey(f: DocField): string {
  const type = f.type ?? "signature";
  if (type === "initials") return "sign.fieldKind.initials";
  if (type === "text") return "sign.fieldKind.text";
  if (type === "date") return "sign.fieldKind.date";
  if (type === "checkbox") return "sign.fieldKind.checkbox";
  if (type === "dropdown") return "sign.fieldKind.dropdown";
  return "sign.fieldKind.signature";
}

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
  const { locale } = useI18n();
  const { token: paramToken } = useParams<{ token: string }>();
  const token = overrideToken ?? paramToken;
  const [payload, setPayload] = useState<SignPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [signingFieldId, setSigningFieldId] = useState<string | null>(null);
  /** Text/date/dropdown sheet (mobile guided mode — not signature/initials). */
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [highlightFieldId, setHighlightFieldId] = useState<string | null>(null);
  const [guidedMode, setGuidedMode] = useState(false);
  const [guidedStarted, setGuidedStarted] = useState(false);
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
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);
  const [conversionDismissed, setConversionDismissed] = useState(false);
  const [copiedSigned, setCopiedSigned] = useState(false);
  const postTargetOrigin = allowedOrigins?.[0] || "*";
  const pendingAdvanceRef = useRef(false);

  const postEmbed = (type: "ready" | "signed" | "declined" | "error", extra?: { docId?: string }) => {
    if (!embedMode || window.parent === window) return;
    window.parent.postMessage({ source: "docracy", type, ...extra }, postTargetOrigin);
  };

  useNoIndex();

  // Phones / coarse pointers: guided step-through (DocuSign Next / Dropbox Form View style).
  // Desktop keeps PDF-overlay editing; mobile must not rely on tiny inline inputs or drag.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px), (pointer: coarse)");
    const sync = () => setGuidedMode(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

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

  // Conversion popup only for anonymous signers on the public (non-embed, non-white-label) flow.
  useEffect(() => {
    if ((!done && payload?.status.status !== "completed") || embedMode || payload?.brandLogoPath) {
      setLoggedIn(null);
      return;
    }
    let cancelled = false;
    fetchMe()
      .then(({ account }) => {
        if (!cancelled) setLoggedIn(!!account);
      })
      .catch(() => {
        if (!cancelled) setLoggedIn(false);
      });
    return () => {
      cancelled = true;
    };
  }, [done, embedMode, payload?.brandLogoPath, payload?.status.status]);

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
    () => (payload?.fields ?? []).every((f) => fieldIsFilled(f, values)),
    [payload?.fields, values]
  );

  const fields = payload?.fields ?? [];
  const remainingFields = useMemo(
    () => fields.filter((f) => !fieldIsFilled(f, values)),
    [fields, values]
  );
  const remainingCount = remainingFields.length;

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
    () => fields.find((f) => f.id === signingFieldId) ?? null,
    [fields, signingFieldId]
  );
  const signingFieldKind: "signature" | "initials" =
    (signingField?.type ?? "signature") === "initials" ? "initials" : "signature";

  const editingField = useMemo(
    () => fields.find((f) => f.id === editingFieldId) ?? null,
    [fields, editingFieldId]
  );

  const scrollToField = (fieldId: string) => {
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-sign-field-id="${fieldId}"]`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const openField = (f: DocField) => {
    setGuidedStarted(true);
    setHighlightFieldId(f.id);
    scrollToField(f.id);
    const type = f.type ?? "signature";
    if (type === "signature" || type === "initials") {
      setEditingFieldId(null);
      setSigningFieldId(f.id);
      return;
    }
    if (type === "checkbox") {
      setSigningFieldId(null);
      setEditingFieldId(null);
      setValues((prev) => {
        const nextChecked = prev[f.id] === "true" ? "false" : "true";
        // Required checkboxes only advance when checked; optional always advance after toggle.
        const shouldAdvance =
          nextChecked === "true" || f.required === false;
        if (shouldAdvance) pendingAdvanceRef.current = true;
        return { ...prev, [f.id]: nextChecked };
      });
      return;
    }
    setSigningFieldId(null);
    setEditingFieldId(f.id);
  };

  const advanceToNextEmpty = (fromValues?: Record<string, string>) => {
    const vals = fromValues ?? values;
    const next = (payload?.fields ?? []).find((f) => !fieldIsFilled(f, vals));
    if (!next) {
      setHighlightFieldId(null);
      setSigningFieldId(null);
      setEditingFieldId(null);
      return;
    }
    openField(next);
  };

  const onGuidedPrimary = () => {
    if (allFilled) {
      document.getElementById("sign-consent")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (!guidedStarted) {
      const first = remainingFields[0];
      if (first) openField(first);
      return;
    }
    const current =
      (highlightFieldId && fields.find((f) => f.id === highlightFieldId)) ||
      remainingFields[0];
    if (!current) return;
    if (fieldIsFilled(current, values)) {
      advanceToNextEmpty();
      return;
    }
    openField(current);
  };

  // After checkbox toggle (or other deferred fill), advance when guided.
  useEffect(() => {
    if (!pendingAdvanceRef.current || !guidedMode) return;
    pendingAdvanceRef.current = false;
    const t = window.setTimeout(() => advanceToNextEmpty(), 120);
    return () => window.clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values, guidedMode]);

  const onSaveSignature = (dataUrl: string) => {
    if (!signingFieldId) return;
    const id = signingFieldId;
    const next = { ...values, [id]: dataUrl };
    setValues(next);
    setSigningFieldId(null);
    if (guidedMode) {
      window.setTimeout(() => advanceToNextEmpty(next), 80);
    }
  };

  const onSaveFieldValue = (value: string) => {
    if (!editingFieldId) return;
    const id = editingFieldId;
    const next = { ...values, [id]: value };
    setValues(next);
    setEditingFieldId(null);
    if (guidedMode) {
      window.setTimeout(() => advanceToNextEmpty(next), 80);
    }
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

  if (done || payload.status.status === "completed") {
    const showConversionPopup =
      !embedMode && !payload.brandLogoPath && loggedIn === false && !conversionDismissed;
    const showViralCard =
      !embedMode && !payload.brandLogoPath && (loggedIn === true || conversionDismissed);
    const payment = (finalStatus ?? payload.status).paymentRequest;
    const isFullySigned = (finalStatus ?? payload.status).status === "completed";

    return (
      <div className="container">
        <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
        <h1>{t("sign.signed")}</h1>
        <p>{t("sign.thanks")}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 4, marginBottom: 20 }}>
          {isFullySigned && token && (
            <a
              href={apiUrl(`/api/status/${token}/download`)}
              download
              className="btn-primary"
              style={{ display: "inline-block", textDecoration: "none" }}
            >
              {t("sign.download")}
            </a>
          )}
          {isFullySigned && payment && (
            <a
              href={payment.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("viral_cta_clicked", { source: "signer_pay" })}
            >
              {t("sign.payCta", { amount: payment.amount, currency: payment.currency })}
            </a>
          )}
          {isFullySigned && token && (
            <button
              type="button"
              className="btn-secondary"
              onClick={async () => {
                const url = `${window.location.origin}${signedPagePath(token, locale)}`;
                try {
                  await navigator.clipboard.writeText(url);
                  setCopiedSigned(true);
                  track("viral_cta_clicked", { source: "signer_copy_signed" });
                  window.setTimeout(() => setCopiedSigned(false), 2000);
                } catch {
                  /* clipboard blocked */
                }
              }}
            >
              {copiedSigned ? t("common.copied") : t("signed.copyLink")}
            </button>
          )}
        </div>
        {isFullySigned && payment && (
          <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>{t("sign.payHint")}</p>
        )}
        {/* The recipient never needed an account to get here — this is the moment they're most
         *  likely to become a sender themselves. Skipped entirely for white-labeled workspaces,
         *  who are paying specifically to keep their signers from seeing Docracy at all. Also
         *  skipped in embedMode so the iframe stays chrome-less. Logged-in signers get the soft
         *  viral card instead of the account-creation popup. */}
        {showViralCard && (
          <div className="card" style={{ marginTop: 24, maxWidth: 420, borderColor: "var(--primary)" }}>
            <p style={{ marginBottom: 12, fontWeight: 600 }}>{t("sign.viral")}</p>
            <Link
              to={`${localizePath("/prepare", locale)}?ref=signer-completion`}
              className="btn-primary"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => track("viral_cta_clicked", { source: "signer_done" })}
            >
              {t("sign.sendDoc")}
            </Link>
          </div>
        )}
        {showConversionPopup && (
          <SignerConversionPopup onDismiss={() => setConversionDismissed(true)} />
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
    <div className={`container${guidedMode ? " sign-page--guided" : ""}`}>
      <BrandLogo path={payload.brandLogoPath} slug={payload.brandWorkspaceSlug} />
      <h1>{t("sign.review")}</h1>
      {guidedMode && (
        <p className="sign-guided-intro">{t("sign.guidedIntro")}</p>
      )}
      {pdfBytes && (
        <PdfViewer
          pdfBytes={pdfBytes}
          renderPageOverlay={(page) => (
            <>
              {(payload.fields ?? [])
                .filter((f) => f.page === page.index)
                .map((f) => {
                  const type = f.type ?? "signature";
                  const filled = fieldIsFilled(f, values);
                  const highlighted = highlightFieldId === f.id;

                  const boxStyle: React.CSSProperties = {
                    position: "absolute",
                    left: `${f.xFrac * 100}%`,
                    top: `${f.yFrac * 100}%`,
                    width: `${f.wFrac * 100}%`,
                    height: `${f.hFrac * 100}%`,
                    outline: highlighted ? "3px solid var(--primary)" : undefined,
                    outlineOffset: 2,
                    zIndex: highlighted ? 3 : 1,
                  };

                  if (type === "checkbox") {
                    const checked = values[f.id] === "true";
                    return (
                      <div key={f.id} data-sign-field-id={f.id} style={boxStyle}>
                        <button
                          type="button"
                          aria-label={f.required === false ? t("sign.optionalCheckbox") : t("sign.requiredCheckbox")}
                          aria-pressed={checked}
                          onClick={() => {
                            if (guidedMode) openField(f);
                            else {
                              setValues((prev) => ({
                                ...prev,
                                [f.id]: prev[f.id] === "true" ? "false" : "true",
                              }));
                            }
                          }}
                          style={{
                            width: "100%",
                            height: "100%",
                            minHeight: guidedMode ? 36 : undefined,
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

                  if (type === "text" || type === "date" || type === "dropdown") {
                    if (guidedMode) {
                      return (
                        <div key={f.id} data-sign-field-id={f.id} style={boxStyle}>
                          <button
                            type="button"
                            className="sign-field-tap-target"
                            aria-label={t(fieldTypeLabelKey(f))}
                            onClick={() => openField(f)}
                          >
                            {filled ? (
                              <span className="sign-field-tap-value">{values[f.id]}</span>
                            ) : (
                              <span>{t(fieldTypeLabelKey(f))}</span>
                            )}
                          </button>
                        </div>
                      );
                    }
                    if (type === "dropdown") {
                      const opts = f.options ?? [];
                      return (
                        <div key={f.id} data-sign-field-id={f.id} style={boxStyle}>
                          <select
                            aria-label={t("sign.dropdownField")}
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
                            <option value="">{t("sign.choose")}</option>
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
                      <div key={f.id} data-sign-field-id={f.id} style={boxStyle}>
                        <input
                          type={type === "date" ? "date" : "text"}
                          aria-label={type === "date" ? t("sign.dateField") : t("sign.textField")}
                          value={values[f.id] ?? ""}
                          onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                          placeholder={type === "date" ? undefined : t("sign.typeHere")}
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
                    <div key={f.id} data-sign-field-id={f.id} style={boxStyle}>
                      <button
                        type="button"
                        onClick={() => (guidedMode ? openField(f) : setSigningFieldId(f.id))}
                        style={{
                          width: "100%",
                          height: "100%",
                          minHeight: guidedMode ? 40 : undefined,
                          border: values[f.id] ? "2px solid var(--success)" : "2px dashed var(--primary)",
                          borderRadius: "var(--r-sm)",
                          background: values[f.id] ? "var(--canvas)" : "var(--primary-soft)",
                          cursor: "pointer",
                          padding: 0,
                        }}
                      >
                        {values[f.id] ? (
                          <img src={values[f.id]} alt={t("sign.yourSignature")} style={{ maxWidth: "100%", maxHeight: "100%" }} />
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

      {editingField && (
        <FieldInputSheet
          field={editingField}
          initialValue={values[editingField.id] ?? ""}
          onSave={onSaveFieldValue}
          onCancel={() => setEditingFieldId(null)}
        />
      )}

      {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

      {payload.signerAttachments && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={{ fontSize: 15, marginTop: 0 }}>{t("sign.uploadAttachment")}</h2>
          <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>
            {t("sign.uploadAttachmentBody", {
              mb: Math.round(payload.signerAttachments.maxBytesPerFile / (1024 * 1024)),
            })}
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
          {uploadingAttachment && <p style={{ fontSize: 13 }}>{t("sign.uploading")}</p>}
        </div>
      )}

      <label
        id="sign-consent"
        style={{ display: "flex", gap: 8, alignItems: "flex-start", marginTop: 16, fontSize: 13 }}
      >
        <input
          type="checkbox"
          checked={consented}
          onChange={(e) => setConsented(e.target.checked)}
          style={{ marginTop: 2 }}
        />
        <span>{t("sign.consent")}</span>
      </label>

      <div
        className={guidedMode ? "sign-guided-actions" : undefined}
        style={guidedMode ? undefined : { marginTop: 16, display: "flex", flexWrap: "wrap", gap: 8 }}
      >
        {guidedMode ? (
          <>
            <div className="sign-guided-dock">
              <span className="sign-guided-progress">
                {allFilled
                  ? t("sign.guidedAllDone")
                  : t("sign.guidedRemaining", { count: remainingCount })}
              </span>
              <button type="button" className="btn-primary sign-guided-next" onClick={onGuidedPrimary}>
                {!guidedStarted
                  ? t("sign.guidedStart")
                  : allFilled
                    ? t("sign.guidedReview")
                    : t("sign.guidedNext")}
              </button>
            </div>
            <div className="sign-guided-submit-row">
              <button className="btn-primary" disabled={!canSubmit || submitting || declining} onClick={onSubmit}>
                {submitting ? t("sign.submitting") : t("sign.submit")}
              </button>
              <button className="btn-secondary" disabled={submitting || declining} onClick={onDecline}>
                {declining ? t("sign.declining") : t("sign.decline")}
              </button>
            </div>
          </>
        ) : (
          <>
            <button className="btn-primary" disabled={!canSubmit || submitting || declining} onClick={onSubmit}>
              {submitting ? t("sign.submitting") : t("sign.submit")}
            </button>
            <button className="btn-secondary" disabled={submitting || declining} onClick={onDecline}>
              {declining ? t("sign.declining") : t("sign.decline")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
