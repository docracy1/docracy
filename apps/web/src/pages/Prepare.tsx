import { useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import PdfViewer from "../components/PdfViewer";
import { createDocument } from "../lib/api";
import type { DocField, SignerInput } from "../lib/types";

const FREE_TIER_MAX_SIGNERS = 2;
// Taller than a bare signature image to leave room for the auto-printed "email · date" caption.
const SIGNATURE_FIELD_SIZE = { w: 0.26, h: 0.07 };

let fieldIdCounter = 0;

export default function Prepare() {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [preparerSigns, setPreparerSigns] = useState(false);
  const [preparerEmail, setPreparerEmail] = useState("");
  const [signers, setSigners] = useState<SignerInput[]>([
    { order: 1, name: "", email: "" },
    { order: 2, name: "", email: "" },
  ]);
  const [fields, setFields] = useState<DocField[]>([]);
  const [placingSignerOrder, setPlacingSignerOrder] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [creatingDrag, setCreatingDrag] = useState<{ x: number; y: number; overPage: boolean } | null>(null);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
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
  const onCreateDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setCreatingDrag({ x: e.clientX, y: e.clientY, overPage: !!pageAt(e.clientX, e.clientY) });

    const onMove = (moveEvent: MouseEvent) => {
      setCreatingDrag({ x: moveEvent.clientX, y: moveEvent.clientY, overPage: !!pageAt(moveEvent.clientX, moveEvent.clientY) });
    };
    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      setCreatingDrag(null);

      const target = pageAt(upEvent.clientX, upEvent.clientY);
      if (!target) return; // dropped outside the document — cancel, don't place blind
      const size = SIGNATURE_FIELD_SIZE;
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

  const onSubmit = async () => {
    if (!file || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const { docId, statusToken } = await createDocument(
        file,
        preparerSigns,
        signers,
        fields,
        !preparerSigns && preparerEmail.trim() ? preparerEmail.trim() : undefined
      );
      navigate("/prepare/sent", { state: { docId, statusToken } });
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
          <p>Upload the PDF you want signed.</p>
          <input type="file" accept="application/pdf" onChange={onFileChange} />
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
                            borderRadius: 3,
                            background: isDragging ? "rgba(47,126,216,0.18)" : "rgba(47,126,216,0.08)",
                            boxShadow: isDragging ? "0 6px 16px rgba(0,0,0,0.18)" : "none",
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
                            <span>Sign here · {signerLabel(f.signerOrder)}</span>
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
                          <img
                            src="/docracy-wordmark.png"
                            alt=""
                            draggable={false}
                            style={{ height: "40%", width: "auto", marginTop: 2, opacity: 0.85 }}
                          />
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
                    style={{ width: "100%" }}
                    placeholder="Email"
                    type="email"
                    value={s.email}
                    onChange={(e) => updateSigner(s.order, { email: e.target.value })}
                  />
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
              {signers.length > FREE_TIER_MAX_SIGNERS && (
                <p style={{ fontSize: 12, marginTop: 8, color: "var(--body)" }}>
                  Free plan supports up to {FREE_TIER_MAX_SIGNERS} signers.{" "}
                  <Link to="/login">Sign in for unlimited signers</Link>.
                </p>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Place a signature</h3>
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
                  borderRadius: 6,
                  border: "1.5px dashed var(--primary)",
                  background: "rgba(47,126,216,0.06)",
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

            {signersWithoutFields.length > 0 && fields.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--danger)" }}>
                Still needs a signature field: {signersWithoutFields.map((s) => signerLabel(s.order)).join(", ")}
              </p>
            )}

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
            borderRadius: 6,
            border: `1.5px dashed ${creatingDrag.overPage ? "var(--success)" : "var(--primary)"}`,
            background: creatingDrag.overPage ? "rgba(16,185,129,0.12)" : "rgba(47,126,216,0.12)",
            color: creatingDrag.overPage ? "var(--success)" : "var(--primary)",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
          }}
        >
          {creatingDrag.overPage ? "Drop to place" : "Sign here · " + signerLabel(placingSignerOrder)}
        </div>
      )}
    </div>
  );
}
