import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { track } from "../lib/track";
import PdfUploadCircle from "./PdfUploadCircle";

/** Homepage conversion prompt — appears in 3 spots on Landing.tsx (directly under the hero,
 *  under the features section, and a mobile-only instance near the footer). Uploading a PDF here
 *  hands the file straight into Prepare.tsx via router state instead of dropping the visitor on
 *  another empty upload screen — see Prepare.tsx's mount effect that reads `location.state`.
 *  `source` distinguishes the 3 placements in the resulting landingpage_cta_clicked events, since
 *  they'd otherwise all look identical in the data. */
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
