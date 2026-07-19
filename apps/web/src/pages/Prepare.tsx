import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PdfViewer from "../components/PdfViewer";
import { createDocument, createTemplate, fetchMe, fetchTemplate, fetchTemplates } from "../lib/api";
import type { Account, TemplateSummary } from "../lib/api";
import { base64ToBytes } from "../lib/base64";
import type { DocField, DocFieldType, SignerInput } from "../lib/types";

const FREE_TIER_MAX_SIGNERS = 2;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

// Signature/initials are taller to leave room for the auto-printed "email · date" caption text/date
// fields don't get; text/date are narrower single-line boxes.
const FIELD_SIZE_BY_TYPE: Record<DocFieldType, { w: number; h: number }> = {
  signature: { w: 0.26, h: 0.07 },
  initials: { w: 0.1, h: 0.06 },
  text: { w: 0.22, h: 0.04 },
  date: { w: 0.16, h: 0.04 },
};

const FIELD_TYPE_LABEL: Record<DocFieldType, string> = {
  signature: "Sign here",
  initials: "Initial here",
  text: "Text",
  date: "Date",
};

let fieldIdCounter = 0;

export default function Prepare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [preparerSigns, setPreparerSigns] = useState(false);
  const [preparerEmail, setPreparerEmail] = useState("");
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [signingMode, setSigningMode] = useState<"sequential" | "parallel">("sequential");
  const [signers, setSigners] = useState<SignerInput[]>([
    { order: 1, name: "", email: "" },
    { order: 2, name: "", email: "" },
  ]);
  const [fields, setFields] = useState<DocField[]>([]);
  const [placingSignerOrder, setPlacingSignerOrder] = useState(1);
  const [placingFieldType, setPlacingFieldType] = useState<DocFieldType>("signature");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [creatingDrag, setCreatingDrag] = useState<{ x: number; y: number; overPage: boolean } | null>(null);

  const [account, setAccount] = useState<Account | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<TemplateSummary[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [showTemplateNameInput, setShowTemplateNameInput] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(null);
  const [templateSavedName, setTemplateSavedName] = useState<string | null>(null);

  // Only used to gate the (paid-only) template UI — anonymous/free usage of this page is
  // otherwise completely unaffected by this call.
  useEffect(() => {
    fetchMe()
      .then((res) => setAccount(res.account))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (account?.isPaid && !pdfBytes) {
      fetchTemplates()
        .then((res) => setAvailableTemplates(res.templates))
        .catch(() => setAvailableTemplates([]));
    }
  }, [account, pdfBytes]);

  useEffect(() => {
    if (!templateId) return;
    setLoadingTemplate(true);
    setTemplateLoadError(null);
    fetchTemplate(templateId)
      .then((tpl) => {
        const bytes = base64ToBytes(tpl.pdfBase64);
        setPdfBytes(bytes);
        setFields(tpl.fields);
        // Uint8Array's `.buffer` is typed ArrayBufferLike (could be a SharedArrayBuffer) which
        // BlobPart rejects — base64ToBytes's output is always backed by a plain ArrayBuffer.
        setFile(new File([bytes as unknown as BlobPart], `${tpl.name || "template"}.pdf`, { type: "application/pdf" }));
        setSigners(Array.from({ length: tpl.signerCount }, (_, i) => ({ order: i + 1, name: "", email: "" })));
      })
      .catch((err) => setTemplateLoadError(err instanceof Error ? err.message : "Couldn't load that template"))
      .finally(() => setLoadingTemplate(false));
  }, [templateId]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_PDF_BYTES) {
      setError(`PDF must be under ${MAX_PDF_BYTES / (1024 * 1024)}MB — this one is ${(f.size / (1024 * 1024)).toFixed(1)}MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
    setPdfBytes(new Uint8Array(await f.arrayBuffer()));
    setFields([]);
  };

  const updateSigner = (order: number, patch: Partial<SignerInput>) => {
    setSigners((prev) => prev.map((s) => (s.order === order ? { ...s, ...patch } : s)));
  };

  const addSigner = () => {
    setSigners((prev) => [...prev, { order: prev.length + 1, name: "", email: "" }]);
  };

  const removeSigner = (order: number) => {
    setSigners((prev) =>
      prev
        .filter((s) => s.order !== order)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
    setFields((prev) => prev.filter((f) => f.signerOrder !== order));
  };

  const togglePreparerSigns = (checked: boolean) => {
    setPreparerSigns(checked);
    if (checked && signers[0]) {
      updateSigner(signers[0].order, {});
    }
  };

  const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

  const updateField = (id: string, patch: Partial<DocField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  /** Finds the PDF page (if any) under a client-coordinate point, using the `data-page-index`
   *  marker PdfViewer puts on each page's overlay container. */
  const pageAt = (clientX: number, clientY: number): { index: number; rect: DOMRect } | null => {
    const el = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-page-index]");
    if (!el) return null;
    return { index: Number(el.dataset.pageIndex), rect: el.getBoundingClientRect() };
  };

  const dragState = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startXFrac: number;
    startYFrac: number;
    pageRect: DOMRect;
    wFrac: number;
    hFrac: number;
  } | null>(null);

  const onFieldDragStart = (e: React.MouseEvent<HTMLDivElement>, field: DocField) => {
    e.preventDefault();
    e.stopPropagation();
    const pageEl = e.currentTarget.offsetParent as HTMLElement;
    dragState.current = {
      id: field.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXFrac: field.xFrac,
      startYFrac: field.yFrac,
      pageRect: pageEl.getBoundingClientRect(),
      wFrac: field.wFrac,
      hFrac: field.hFrac,
    };
    setDraggingFieldId(field.id);

    const onMove = (moveEvent: MouseEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dxFrac = (moveEvent.clientX - drag.startClientX) / drag.pageRect.width;
      const dyFrac = (moveEvent.clientY - drag.startClientY) / drag.pageRect.height;
      const xFrac = Math.min(Math.max(drag.startXFrac + dxFrac, 0), 1 - drag.wFrac);
      const yFrac = Math.min(Math.max(drag.startYFrac + dyFrac, 0), 1 - drag.hFrac);
      updateField(drag.id, { xFrac, yFrac });
    };
    const onUp = () => {
      dragState.current = null;
      setDraggingFieldId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  /** Real drag-and-drop for creating a field: mousedown on the sidebar chip picks it up, a
   *  floating preview follows the cursor, and releasing over the document drops a new field at
   *  that exact spot — releasing anywhere else cancels instead of placing one blind. */
  const creatingDragActive = useRef(false);
  const onCreateDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Without this guard, a second mousedown before the first drag's mouseup (e.g. a duplicate
    // event from the input device, or React StrictMode double-invoking effects) stacks another
    // window-level mousemove/mouseup listener pair on top of the first. One real mouseup then
    // fires every accumulated onUp closure, each independently placing an identical field.
    if (creatingDragActive.current) return;
    creatingDragActive.current = true;
    setCreatingDrag({ x: e.clientX, y: e.clientY, overPage: !!pageAt(e.clientX, e.clientY) });

    const onMove = (moveEvent: MouseEvent) => {
      setCreatingDrag({ x: moveEvent.clientX, y: moveEvent.clientY, overPage: !!pageAt(moveEvent.clientX, moveEvent.clientY) });
    };
    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      creatingDragActive.current = false;
      setCreatingDrag(null);

      const target = pageAt(upEvent.clientX, upEvent.clientY);
      if (!target) return; // dropped outside the document — cancel, don't place blind
      const size = FIELD_SIZE_BY_TYPE[placingFieldType];
      const xFrac = Math.min(Math.max((upEvent.clientX - target.rect.left) / target.rect.width - size.w / 2, 0), 1 - size.w);
      const yFrac = Math.min(Math.max((upEvent.clientY - target.rect.top) / target.rect.height - size.h / 2, 0), 1 - size.h);
      const field: DocField = {
        id: `f${fieldIdCounter++}`,
        signerOrder: placingSignerOrder,
        page: target.index,
        xFrac,
        yFrac,
        wFrac: size.w,
        hFrac: size.h,
        type: placingFieldType,
      };
      setFields((prev) => [...prev, field]);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const signerLabel = (order: number) => {
    const s = signers.find((x) => x.order === order);
    return s?.name || `Signer ${order}`;
  };

  const signersWithoutFields = useMemo(
    () => signers.filter((s) => !fields.some((f) => f.signerOrder === s.order)),
    [signers, fields]
  );

  const canSubmit = useMemo(
    () => file && signers.every((s) => s.name.trim() && s.email.trim()) && signersWithoutFields.length === 0,
    [file, signers, signersWithoutFields]
  );

  const onSaveAsTemplate = async () => {
    if (!file || fields.length === 0 || !templateNameInput.trim() || signersWithoutFields.length > 0) return;
    setSavingTemplate(true);
    setTemplateSaveError(null);
    try {
      await createTemplate(file, templateNameInput.trim(), signers.length, fields);
      setTemplateSavedName(templateNameInput.trim());
      setShowTemplateNameInput(false);
      setTemplateNameInput("");
    } catch (err) {
      setTemplateSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingTemplate(false);
    }
  };

  const onSubmit = async () => {
    if (!file || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const effectiveSigningMode = signers.length > 1 ? signingMode : undefined;
      const { docId, statusToken } = await createDocument(file, preparerSigns, signers, fields, {
        preparerEmail: !preparerSigns && preparerEmail.trim() ? preparerEmail.trim() : undefined,
        customSubject: customSubject.trim() || undefined,
        customMessage: customMessage.trim() || undefined,
        signingMode: effectiveSigningMode,
      });
      navigate("/prepare/sent", { state: { docId, statusToken, signingMode: effectiveSigningMode } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Prepare a document</h1>

      {!pdfBytes && (
        <div className="card">
          {loadingTemplate && <p>Loading template…</p>}
          {templateLoadError && <p style={{ color: "var(--danger)" }}>{templateLoadError}</p>}
          {!loadingTemplate && (
            <>
              {account?.isPaid && availableTemplates.length > 0 && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--hairline)" }}>
                  <p style={{ marginTop: 0, marginBottom: 6, fontSize: 13, color: "var(--mute)" }}>
                    Start from a template
                  </p>
                  {availableTemplates.map((t) => (
                    <Link
                      key={t.id}
                      to={`/prepare?template=${t.id}`}
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      {t.name} ({t.signerCount} signer{t.signerCount === 1 ? "" : "s"})
                    </Link>
                  ))}
                </div>
              )}
              <p>Upload the PDF you want signed.</p>
              <input type="file" accept="application/pdf" onChange={onFileChange} />
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>Max file size: 15MB.</p>
              {error && <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>}
            </>
          )}
        </div>
      )}

      {pdfBytes && (
        <div className="prepare-grid">
          <div>
            <PdfViewer
              pdfBytes={pdfBytes}
              renderPageOverlay={(page) => (
                <>
                  {fields
                    .filter((f) => f.page === page.index)
                    .map((f) => {
                      const isDragging = draggingFieldId === f.id;
                      return (
                        <div
                          key={f.id}
                          onMouseDown={(e) => onFieldDragStart(e, f)}
                          style={{
                            position: "absolute",
                            left: `${f.xFrac * 100}%`,
                            top: `${f.yFrac * 100}%`,
                            width: `${f.wFrac * 100}%`,
                            height: `${f.hFrac * 100}%`,
                            border: "1.5px dashed var(--primary)",
                            borderRadius: "var(--r-sm)",
                            background: isDragging ? "var(--primary-soft-strong)" : "var(--primary-soft)",
                            boxShadow: isDragging ? "var(--shadow-md)" : "none",
                            transform: isDragging ? "scale(1.03)" : "scale(1)",
                            transition: isDragging ? "none" : "box-shadow 0.15s, transform 0.15s",
                            zIndex: isDragging ? 10 : 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "2px 6px",
                            fontSize: 11,
                            color: "var(--primary)",
                            cursor: isDragging ? "grabbing" : "grab",
                            userSelect: "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <span>
                              {FIELD_TYPE_LABEL[f.type ?? "signature"]} · {signerLabel(f.signerOrder)}
                            </span>
                            <button
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(f.id);
                              }}
                              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer" }}
                            >
                              ×
                            </button>
                          </div>
                          {(f.type ?? "signature") !== "text" && (f.type ?? "signature") !== "date" && (
                            <img
                              src="/docracy-wordmark.png"
                              alt=""
                              draggable={false}
                              style={{ height: "40%", width: "auto", marginTop: 2, opacity: 0.85 }}
                            />
                          )}
                        </div>
                      );
                    })}
                </>
              )}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Signers &amp; order</h3>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--body)" }}>
                <input type="checkbox" checked={preparerSigns} onChange={(e) => togglePreparerSigns(e.target.checked)} />
                I also need to sign this
              </label>
              {!preparerSigns && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    className="form-input"
                    style={{ width: "100%" }}
                    placeholder="Your email (optional) — to get the status link"
                    type="email"
                    value={preparerEmail}
                    onChange={(e) => setPreparerEmail(e.target.value)}
                  />
                  <p style={{ fontSize: 11, marginTop: 4, marginBottom: 0 }}>
                    There's no account, so this is the only way to recover the status link if you lose it.
                  </p>
                </div>
              )}
              {signers.map((s, i) => (
                <div key={s.order} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
                  <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>
                    {s.order}. {preparerSigns && i === 0 ? "You" : `Signer ${s.order}`}
                  </div>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder="Name"
                    value={s.name}
                    onChange={(e) => updateSigner(s.order, { name: e.target.value })}
                  />
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder="Email"
                    type="email"
                    value={s.email}
                    onChange={(e) => updateSigner(s.order, { email: e.target.value })}
                  />
                  {account?.isPaid && (
                    <input
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="PIN (optional) — 4-8 digits, extra protection for this link"
                      inputMode="numeric"
                      maxLength={8}
                      value={s.pin ?? ""}
                      onChange={(e) => updateSigner(s.order, { pin: e.target.value.replace(/\D/g, "") })}
                    />
                  )}
                  {signers.length > 1 && (
                    <button
                      className="btn-secondary"
                      style={{ marginTop: 6, fontSize: 12, padding: "4px 8px" }}
                      onClick={() => removeSigner(s.order)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button className="btn-secondary" onClick={addSigner} style={{ width: "100%" }}>
                + Add signer
              </button>
              {signers.length > 1 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                  <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 0, marginBottom: 6 }}>Signing order</p>
                  <select
                    className="form-input"
                    style={{ width: "100%" }}
                    value={signingMode}
                    onChange={(e) => setSigningMode(e.target.value as "sequential" | "parallel")}
                  >
                    <option value="sequential">Sequential (default) — one signer at a time, in order</option>
                    <option value="parallel">All at once — every signer can sign as soon as they're invited</option>
                  </select>
                </div>
              )}
              {signers.length > FREE_TIER_MAX_SIGNERS && (
                <p style={{ fontSize: 12, marginTop: 8, color: "var(--body)" }}>
                  Free plan supports up to {FREE_TIER_MAX_SIGNERS} signers.{" "}
                  <Link to="/login">Sign in for unlimited signers</Link>.
                </p>
              )}
              {!account?.isPaid && (
                <p style={{ fontSize: 12, marginTop: 8, color: "var(--body)" }}>
                  <Link to="/login">Sign in with a paid account</Link> to add a PIN to a signer's link.
                </p>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Add a field</h3>
              <select
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                value={placingFieldType}
                onChange={(e) => setPlacingFieldType(e.target.value as DocFieldType)}
              >
                <option value="signature">Signature</option>
                <option value="initials">Initials</option>
                <option value="text">Text</option>
                <option value="date">Date</option>
              </select>
              <select
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                value={placingSignerOrder}
                onChange={(e) => setPlacingSignerOrder(Number(e.target.value))}
              >
                {signers.map((s) => (
                  <option key={s.order} value={s.order}>
                    {signerLabel(s.order)}
                  </option>
                ))}
              </select>
              <div
                onMouseDown={onCreateDragStart}
                style={{
                  width: "100%",
                  textAlign: "center",
                  padding: "10px 12px",
                  borderRadius: "var(--r-sm)",
                  border: "1.5px dashed var(--primary)",
                  background: "var(--primary-soft)",
                  color: "var(--primary)",
                  fontWeight: 600,
                  fontSize: 14,
                  cursor: "grab",
                  userSelect: "none",
                }}
              >
                ⠿ Drag onto the document
              </div>
              <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                The signer's email and the date get stamped in automatically — no need for separate fields.
              </p>
            </div>

            {account?.isPaid && fields.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Save as template</h3>
                {templateSavedName ? (
                  <p style={{ marginBottom: 0 }}>Saved "{templateSavedName}" — find it on your Dashboard.</p>
                ) : showTemplateNameInput ? (
                  <>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginBottom: 8 }}
                      placeholder="Template name"
                      value={templateNameInput}
                      onChange={(e) => setTemplateNameInput(e.target.value)}
                    />
                    {templateSaveError && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>{templateSaveError}</p>
                    )}
                    {signersWithoutFields.length > 0 && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>
                        Every signer needs a field before this can be saved — still needs one:{" "}
                        {signersWithoutFields.map((s) => signerLabel(s.order)).join(", ")}
                      </p>
                    )}
                    <button
                      className="btn-secondary"
                      style={{ width: "100%" }}
                      disabled={savingTemplate || !templateNameInput.trim() || signersWithoutFields.length > 0}
                      onClick={onSaveAsTemplate}
                    >
                      {savingTemplate ? "Saving…" : "Save"}
                    </button>
                  </>
                ) : (
                  <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowTemplateNameInput(true)}>
                    Save as template
                  </button>
                )}
                <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                  Saves this PDF and field layout for reuse — signer names and emails aren't stored, just how many
                  signers there are and where their fields go.
                </p>
              </div>
            )}

            {signersWithoutFields.length > 0 && fields.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--danger)" }}>
                Still needs a field: {signersWithoutFields.map((s) => signerLabel(s.order)).join(", ")}
              </p>
            )}

            <div className="card">
              {showCustomMessage ? (
                <>
                  <h3 style={{ marginBottom: 12 }}>Customize the invite email</h3>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 8 }}
                    placeholder="Subject (optional)"
                    maxLength={150}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                  />
                  <textarea
                    className="form-textarea"
                    style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                    placeholder="Message to signers (optional) — replaces the default invite text"
                    maxLength={1000}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                </>
              ) : (
                <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowCustomMessage(true)}>
                  Customize the invite email
                </button>
              )}
            </div>

            {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

            <button className="btn-primary" disabled={!canSubmit || submitting} onClick={onSubmit}>
              {submitting ? "Sending…" : "Send for signing"}
            </button>
            <p style={{ fontSize: 11, color: "var(--mute)" }}>
              Signer identity isn't verified — only use this for documents where that's acceptable.
            </p>
          </div>
        </div>
      )}

      {creatingDrag && (
        <div
          style={{
            position: "fixed",
            left: creatingDrag.x,
            top: creatingDrag.y,
            transform: "translate(-50%, -50%)",
            width: 140,
            padding: "6px 10px",
            borderRadius: "var(--r-sm)",
            border: `1.5px dashed ${creatingDrag.overPage ? "var(--success)" : "var(--primary)"}`,
            background: creatingDrag.overPage ? "rgba(16,185,129,0.12)" : "var(--primary-soft-strong)",
            color: creatingDrag.overPage ? "var(--success)" : "var(--primary)",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
          }}
        >
          {creatingDrag.overPage ? "Drop to place" : `${FIELD_TYPE_LABEL[placingFieldType]} · ${signerLabel(placingSignerOrder)}`}
        </div>
      )}
    </div>
  );
}
