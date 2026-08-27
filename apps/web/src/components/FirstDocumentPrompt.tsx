import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { track } from "../lib/track";
import PdfUploadCircle from "./PdfUploadCircle";

/** Homepage conversion prompt — after how-it-works, after features, and a mobile-only footer
 *  instance. Uploading a PDF hands the file into Prepare.tsx via router state (see Prepare mount
 *  effect). `source` distinguishes placements in landingpage_cta_clicked events. */
export default function FirstDocumentPrompt({ mobileOnly = false, source = "hero" }: { mobileOnly?: boolean; source?: string }) {
  const t = useT();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const [modalOpen, setModalOpen] = useState(false);

  const handFile = (f: File) => {
    setModalOpen(false);
    track("landingpage_cta_clicked", { source: `${source}_file` });
    navigate(localizePath("/prepare", locale), { state: { uploadedFile: f } });
  };

  return (
    <div className={`first-document-prompt${mobileOnly ? " first-document-prompt-mobile" : ""}`}>
      <p>{t("firstDoc.prompt")}</p>
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
          <div className="upload-modal-card upload-modal-card--circle" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="upload-modal-close" aria-label={t("common.close")} onClick={() => setModalOpen(false)}>
              ×
            </button>
            <h3 style={{ marginTop: 0, textAlign: "center" }}>{t("firstDoc.modalTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--mute)", textAlign: "center", marginBottom: 8 }}>{t("firstDoc.modalSub")}</p>
            <PdfUploadCircle variant="light" size="sm" inputId={`first-doc-file-${source}`} onFile={handFile} />
          </div>
        </div>
      )}
    </div>
  );
}
