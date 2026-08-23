import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { localizePath, useI18n, useT } from "../lib/i18n";
import { track } from "../lib/track";
import { importGoogleDoc } from "../lib/api";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

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
  const [error, setError] = useState<string | null>(null);
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [importingGoogleDoc, setImportingGoogleDoc] = useState(false);

  const onGoogleDocImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = googleDocUrl.trim();
    if (!url) return;
    setError(null);
    setImportingGoogleDoc(true);
    try {
      const blob = await importGoogleDoc(url);
      const f = new File([blob], "google-doc.pdf", { type: "application/pdf" });
      setModalOpen(false);
      navigate(localizePath("/prepare", locale), { state: { uploadedFile: f } });
    } catch (err) {
      setError(err instanceof Error ? err.message : t("prepare.googleDocImportError"));
    } finally {
      setImportingGoogleDoc(false);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_PDF_BYTES) {
      setError(
        t("prepare.pdfTooBig", {
          max: MAX_PDF_BYTES / (1024 * 1024),
          size: (f.size / (1024 * 1024)).toFixed(1),
        })
      );
      track("upload_failed", { errorCode: "pdf_too_large", source });
      e.target.value = "";
      return;
    }
    setModalOpen(false);
    setError(null);
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
          <div className="upload-modal-card" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="upload-modal-close" aria-label={t("common.close")} onClick={() => setModalOpen(false)}>
              ×
            </button>
            <h3 style={{ marginTop: 0 }}>{t("firstDoc.modalTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--mute)" }}>{t("firstDoc.modalSub")}</p>
            <input type="file" accept="application/pdf" aria-label={t("firstDoc.uploadPdf")} onChange={onFileChange} />
            <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>{t("prepare.maxSize")}</p>
            <form onSubmit={onGoogleDocImport} style={{ marginTop: 10, display: "flex", gap: 6 }}>
              <input
                type="text"
                value={googleDocUrl}
                onChange={(e) => setGoogleDocUrl(e.target.value)}
                placeholder={t("prepare.googleDocPlaceholder")}
                style={{ flex: 1, fontSize: 12.5 }}
                disabled={importingGoogleDoc}
              />
              <button type="submit" className="btn-secondary" disabled={importingGoogleDoc || !googleDocUrl.trim()}>
                {importingGoogleDoc ? t("prepare.googleDocImporting") : t("prepare.googleDocImportBtn")}
              </button>
            </form>
            {error && <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
