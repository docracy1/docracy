import { useId, useState, type FormEvent } from "react";
import { importGoogleDoc } from "../lib/api";
import { useT } from "../lib/i18n";
import { NavIcon } from "./NavIcons";

const MAX_PDF_BYTES = 15 * 1024 * 1024;

type Variant = "hero" | "light";
type Size = "md" | "sm";

function isPdf(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}

/**
 * Shared glowing PDF upload circle (Landing / Prepare / FirstDocumentPrompt).
 * Match /verify: a true round circle with only the PDF CTA inside so every word stays readable.
 * Google Docs is a compact secondary strip *under* the circle — never crammed inside.
 */
export default function PdfUploadCircle({
  variant = "light",
  size = "md",
  onFile,
  showGoogleDocs = true,
  caption,
  title,
  subtitle,
  inputId,
}: {
  variant?: Variant;
  size?: Size;
  onFile: (file: File) => void | Promise<void>;
  showGoogleDocs?: boolean;
  /** Optional text under the circle (outside). */
  caption?: string;
  title?: string;
  subtitle?: string;
  inputId?: string;
}) {
  const t = useT();
  const autoId = useId();
  const fileInputId = inputId ?? `pdf-upload-${autoId}`;
  const [dragging, setDragging] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    if (!isPdf(file)) {
      setError(t("prepare.pdfOnly"));
      return;
    }
    if (file.size > MAX_PDF_BYTES) {
      setError(
        t("prepare.pdfTooBig", {
          max: MAX_PDF_BYTES / (1024 * 1024),
          size: (file.size / (1024 * 1024)).toFixed(1),
        })
      );
      return;
    }
    await onFile(file);
  };

  const onGoogleDocImport = async (e: FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = googleDocUrl.trim();
    if (!url) return;
    setError(null);
    setImporting(true);
    try {
      const blob = await importGoogleDoc(url);
      await onFile(new File([blob], "google-doc.pdf", { type: "application/pdf" }));
      setGoogleDocUrl("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("prepare.googleDocImportError"));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div
      className={`pdf-upload-circle-wrap pdf-upload-circle-${variant} pdf-upload-circle-size-${size}${
        showGoogleDocs ? " pdf-upload-circle-with-gdoc" : ""
      }`}
    >
      <input
        type="file"
        accept="application/pdf,.pdf"
        id={fileInputId}
        style={{ display: "none" }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          void handFile(file);
          e.target.value = "";
        }}
      />
      <label
        htmlFor={fileInputId}
        className={`pdf-upload-circle${dragging ? " is-dragging" : ""}`}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          void handFile(e.dataTransfer.files?.[0]);
        }}
      >
        <span className="pdf-upload-circle-icon" aria-hidden="true">
          <NavIcon name="uploadArrow" />
        </span>
        <span className="pdf-upload-circle-title">{title ?? t("hero.uploadCircleTitle")}</span>
        <span className="pdf-upload-circle-sub">{subtitle ?? t("hero.uploadCircleSub")}</span>
      </label>

      {caption && <p className="pdf-upload-circle-caption">{caption}</p>}

      {showGoogleDocs && (
        <div className="pdf-upload-circle-gdoc">
          <p className="pdf-upload-circle-or">{t("uploadCircle.orGoogle")}</p>
          <form className="pdf-upload-circle-gdoc-form" onSubmit={onGoogleDocImport}>
            <input
              type="url"
              value={googleDocUrl}
              onChange={(e) => setGoogleDocUrl(e.target.value)}
              placeholder={t("prepare.googleDocPlaceholder")}
              disabled={importing}
              aria-label={t("prepare.googleDocPlaceholder")}
            />
            <button type="submit" disabled={importing || !googleDocUrl.trim()}>
              {importing ? t("prepare.googleDocImporting") : t("prepare.googleDocImportBtn")}
            </button>
          </form>
          <p className="pdf-upload-circle-gdoc-hint">{t("uploadCircle.googleHint")}</p>
        </div>
      )}

      {error && (
        <p className="pdf-upload-circle-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
