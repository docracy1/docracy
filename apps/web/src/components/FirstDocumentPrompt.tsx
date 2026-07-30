import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useT } from "../lib/i18n";
import { track } from "../lib/track";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

/** Homepage conversion prompt — appears in 3 spots on Landing.tsx (directly under the hero,
 *  under the features section, and a mobile-only instance near the footer). Uploading a PDF here
 *  hands the file straight into Prepare.tsx via router state instead of dropping the visitor on
 *  another empty upload screen — see Prepare.tsx's mount effect that reads `location.state`.
 *  `source` distinguishes the 3 placements in the resulting landingpage_cta_clicked events, since
 *  they'd otherwise all look identical in the data. */
export default function FirstDocumentPrompt({ mobileOnly = false, source = "hero" }: { mobileOnly?: boolean; source?: string }) {
  const t = useT();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_PDF_BYTES) {
      setError(`PDF must be under ${MAX_PDF_BYTES / (1024 * 1024)}MB — this one is ${(f.size / (1024 * 1024)).toFixed(1)}MB.`);
      track("upload_failed", { errorCode: "pdf_too_large", source });
      e.target.value = "";
      return;
    }
    setModalOpen(false);
    setError(null);
    navigate("/prepare", { state: { uploadedFile: f } });
  };

  return (
    <div className={`first-document-prompt${mobileOnly ? " first-document-prompt-mobile" : ""}`}>
      <p>{t("firstDoc.prompt")} — it takes 30 seconds.</p>
      <button
        type="button"
        className="btn-primary btn-lg"
        onClick={() => {
          setModalOpen(true);
          track("landingpage_cta_clicked", { source });
        }}
      >
        {t("firstDoc.upload")}
      </button>

      {modalOpen && (
        <div className="upload-modal-backdrop" onClick={() => setModalOpen(false)}>
          <div className="upload-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="upload-modal-close" aria-label={t("common.close")} onClick={() => setModalOpen(false)}>
              ×
            </button>
            <h3 style={{ marginTop: 0 }}>{t("firstDoc.modalTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--mute)" }}>{t("firstDoc.modalSub")}</p>
            <input type="file" accept="application/pdf" aria-label={t("firstDoc.uploadPdf")} onChange={onFileChange} />
            <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>{t("prepare.maxSize")}</p>
            {error && <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
