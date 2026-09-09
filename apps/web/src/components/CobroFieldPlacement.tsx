import { useRef, useState } from "react";
import PdfViewer, { type PageInfo } from "./PdfViewer";
import { useT } from "../lib/i18n";
import type { DocField, DocFieldType } from "../lib/types";

/** Only what Cobro's single-recipient flow ever needs — Prepare.tsx's full field editor supports
 *  six types and multiple signers, neither of which applies here (see freeTemplates.ts's
 *  SINGLE_SIGNER_FREE_TEMPLATES for why templates are filtered the same way). */
const FIELD_SIZE: Record<"signature" | "date", { w: number; h: number }> = {
  signature: { w: 0.26, h: 0.07 },
  date: { w: 0.16, h: 0.04 },
};

let fieldIdCounter = 0;

interface CobroFieldPlacementProps {
  pdfBytes: Uint8Array;
  fields: DocField[];
  onFieldsChange: (fields: DocField[]) => void;
}

/** Minimal signature+date field placement for Cobro's "have them sign it first" mode — a
 *  deliberately trimmed-down sibling of Prepare.tsx's field editor, not an extraction of it (that
 *  logic is inline in a 2600+ line component, not cleanly separable — see this session's plan).
 *  Single implicit signer (order 1), so there's no signer picker, just a type toggle. */
export default function CobroFieldPlacement({ pdfBytes, fields, onFieldsChange }: CobroFieldPlacementProps) {
  const t = useT();
  const [placingType, setPlacingType] = useState<"signature" | "date">("signature");
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
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

  const updateField = (id: string, patch: Partial<DocField>) =>
    onFieldsChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  const removeField = (id: string) => onFieldsChange(fields.filter((f) => f.id !== id));

  const placeFieldAt = (pageIndex: number, tapXFrac: number, tapYFrac: number) => {
    const size = FIELD_SIZE[placingType];
    const xFrac = Math.min(Math.max(tapXFrac - size.w / 2, 0), 1 - size.w);
    const yFrac = Math.min(Math.max(tapYFrac - size.h / 2, 0), 1 - size.h);
    const field: DocField = {
      id: `cf${fieldIdCounter++}`,
      signerOrder: 1,
      page: pageIndex,
      xFrac,
      yFrac,
      wFrac: size.w,
      hFrac: size.h,
      type: placingType as DocFieldType,
    };
    onFieldsChange([...fields, field]);
  };

  const onFieldPointerDown = (e: React.PointerEvent<HTMLDivElement>, field: DocField) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    const pageEl = target.offsetParent as HTMLElement | null;
    if (!pageEl) return;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      /* capture optional — window listeners still work */
    }
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

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;
      const drag = dragState.current;
      if (!drag) return;
      moveEvent.preventDefault();
      const liveRect = pageEl.getBoundingClientRect();
      const dxFrac = (moveEvent.clientX - drag.startClientX) / liveRect.width;
      const dyFrac = (moveEvent.clientY - drag.startClientY) / liveRect.height;
      const xFrac = Math.min(Math.max(drag.startXFrac + dxFrac, 0), 1 - drag.wFrac);
      const yFrac = Math.min(Math.max(drag.startYFrac + dyFrac, 0), 1 - drag.hFrac);
      updateField(drag.id, { xFrac, yFrac });
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;
      dragState.current = null;
      setDraggingFieldId(null);
      try {
        if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
      } catch {
        /* already released */
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  return (
    <div>
      <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
        <button
          type="button"
          className={placingType === "signature" ? "btn-primary" : "btn-secondary"}
          onClick={() => setPlacingType("signature")}
        >
          {t("cobro.fieldSignature")}
        </button>
        <button
          type="button"
          className={placingType === "date" ? "btn-primary" : "btn-secondary"}
          onClick={() => setPlacingType("date")}
        >
          {t("cobro.fieldDate")}
        </button>
      </div>
      <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>{t("cobro.fieldPlaceHint")}</p>
      <PdfViewer
        pdfBytes={pdfBytes}
        onPageClick={(page: PageInfo, xFrac, yFrac) => placeFieldAt(page.index, xFrac, yFrac)}
        renderPageOverlay={(page) => (
          <>
            {fields
              .filter((f) => f.page === page.index)
              .map((f) => {
                const isDragging = draggingFieldId === f.id;
                return (
                  <div
                    key={f.id}
                    onPointerDown={(e) => onFieldPointerDown(e, f)}
                    onClick={(e) => e.stopPropagation()}
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
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "2px 6px",
                      fontSize: 11,
                      color: "var(--primary)",
                      cursor: isDragging ? "grabbing" : "grab",
                      userSelect: "none",
                      touchAction: "none",
                    }}
                  >
                    <span>{f.type === "date" ? t("cobro.fieldDate") : t("cobro.fieldSignature")}</span>
                    <button
                      type="button"
                      aria-label={t("prepare.removeFieldAria")}
                      onPointerDown={(e) => e.stopPropagation()}
                      onClick={(e) => {
                        e.stopPropagation();
                        removeField(f.id);
                      }}
                      style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer" }}
                    >
                      ×
                    </button>
                  </div>
                );
              })}
          </>
        )}
      />
    </div>
  );
}
