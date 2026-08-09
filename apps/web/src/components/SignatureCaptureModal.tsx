import { useEffect, useRef, useState } from "react";
import SignatureCanvas from "react-signature-canvas";
import { useT } from "../lib/i18n";
import {
  DEFAULT_SIGNATURE_FONT_ID,
  SIGNATURE_FONTS_STYLESHEET,
  SIGNATURE_FONT_STYLES,
  initialsFromName,
  renderTypedSignaturePng,
  signatureFontById,
} from "../lib/signatureFonts";

/** Loads the signature-font stylesheet the first time this modal opens, instead of shipping it
 *  render-blocking in index.html for every page that never shows a signature picker. */
function useSignatureFontsStylesheet() {
  useEffect(() => {
    if (document.querySelector(`link[href="${SIGNATURE_FONTS_STYLESHEET}"]`)) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = SIGNATURE_FONTS_STYLESHEET;
    document.head.appendChild(link);
  }, []);
}

export type SignatureCaptureMode = "type" | "draw";

export interface SignatureCaptureModalProps {
  /** "signature" or "initials" — drives copy and default typed text. */
  fieldKind: "signature" | "initials";
  /** Prefill for typed tab (signer name from the document). */
  signerName?: string;
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
}

function flattenCanvas(source: HTMLCanvasElement): string {
  const flattened = document.createElement("canvas");
  flattened.width = source.width;
  flattened.height = source.height;
  const ctx = flattened.getContext("2d")!;
  ctx.fillStyle = "white";
  ctx.fillRect(0, 0, flattened.width, flattened.height);
  ctx.drawImage(source, 0, 0);
  return flattened.toDataURL("image/png");
}

export default function SignatureCaptureModal({
  fieldKind,
  signerName = "",
  onSave,
  onCancel,
}: SignatureCaptureModalProps) {
  const t = useT();
  useSignatureFontsStylesheet();
  const isInitials = fieldKind === "initials";
  const [mode, setMode] = useState<SignatureCaptureMode>("type");
  const [typedText, setTypedText] = useState(() =>
    isInitials ? initialsFromName(signerName) || "" : signerName.trim()
  );
  const [fontId, setFontId] = useState(DEFAULT_SIGNATURE_FONT_ID);
  const [saving, setSaving] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);
  const sigPadRef = useRef<SignatureCanvas>(null);

  useEffect(() => {
    // Re-sync default text if the modal opens for a different field kind/name.
    setTypedText(isInitials ? initialsFromName(signerName) || "" : signerName.trim());
    setFontId(DEFAULT_SIGNATURE_FONT_ID);
    setMode("type");
    setTypeError(null);
  }, [isInitials, signerName]);

  const selectedFont = signatureFontById(fontId);
  const previewText = typedText.trim() || (isInitials ? "AB" : "Your Name");
  const canSaveType = typedText.trim().length > 0;

  const onSaveDraw = () => {
    if (!sigPadRef.current || sigPadRef.current.isEmpty()) return;
    const trimmed = sigPadRef.current.getTrimmedCanvas();
    onSave(flattenCanvas(trimmed));
  };

  const onSaveType = async () => {
    if (!canSaveType || saving) return;
    setSaving(true);
    setTypeError(null);
    try {
      const dataUrl = await renderTypedSignaturePng(typedText, fontId, {
        baseFontSize: isInitials ? 88 : 72,
      });
      onSave(dataUrl);
    } catch {
      setTypeError(t("sign.typeFailed"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="sig-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="sig-modal card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="sig-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sig-modal-header">
          <h2 id="sig-modal-title">{isInitials ? t("sign.addInitials") : t("sign.addSignature")}</h2>
          <button type="button" className="sig-modal-close" onClick={onCancel} aria-label={t("common.cancel")}>
            ×
          </button>
        </div>

        <div className="sig-modal-tabs" role="tablist">
          <button
            type="button"
            role="tab"
            aria-selected={mode === "type"}
            className={mode === "type" ? "is-active" : undefined}
            onClick={() => setMode("type")}
          >
            {t("sign.typeTab")}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === "draw"}
            className={mode === "draw" ? "is-active" : undefined}
            onClick={() => setMode("draw")}
          >
            {t("sign.drawTab")}
          </button>
        </div>

        {mode === "type" ? (
          <div className="sig-type-panel">
            <div
              className="sig-type-preview"
              style={{ fontFamily: `"${selectedFont.family}", cursive` }}
              aria-hidden
            >
              {previewText}
            </div>
            <input
              className="sig-type-input"
              type="text"
              value={typedText}
              onChange={(e) => setTypedText(e.target.value)}
              placeholder={isInitials ? t("sign.typeInitialsPlaceholder") : t("sign.typeNamePlaceholder")}
              aria-label={isInitials ? t("sign.typeInitialsPlaceholder") : t("sign.typeNamePlaceholder")}
              autoFocus
              maxLength={isInitials ? 8 : 80}
            />
            <div className="sig-style-gallery" role="listbox" aria-label={t("sign.chooseStyle")}>
              {SIGNATURE_FONT_STYLES.map((style) => {
                const active = style.id === fontId;
                return (
                  <button
                    key={style.id}
                    type="button"
                    role="option"
                    aria-selected={active}
                    className={`sig-style-option${active ? " is-active" : ""}`}
                    style={{ fontFamily: `"${style.family}", cursive` }}
                    onClick={() => setFontId(style.id)}
                  >
                    {previewText}
                  </button>
                );
              })}
            </div>
            {typeError && <p className="sig-type-error">{typeError}</p>}
            <div className="sign-modal-actions">
              <button className="btn-secondary" type="button" onClick={onCancel}>
                {t("common.cancel")}
              </button>
              <button
                className="btn-primary"
                type="button"
                disabled={!canSaveType || saving}
                onClick={() => void onSaveType()}
              >
                {saving ? t("common.loading") : t("sign.useSig")}
              </button>
            </div>
          </div>
        ) : (
          <div className="sig-draw-panel">
            <p className="sig-draw-hint">{isInitials ? t("sign.drawInitials") : t("sign.draw")}</p>
            <div className="sig-draw-canvas-wrap">
              <SignatureCanvas
                ref={sigPadRef}
                penColor="black"
                canvasProps={{
                  width: 420,
                  height: 160,
                  className: "sig-draw-canvas",
                }}
              />
            </div>
            <div className="sign-modal-actions">
              <button className="btn-secondary" type="button" onClick={() => sigPadRef.current?.clear()}>
                {t("sign.clear")}
              </button>
              <button className="btn-primary" type="button" onClick={onSaveDraw}>
                {t("sign.saveSig")}
              </button>
              <button className="btn-secondary" type="button" onClick={onCancel}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
