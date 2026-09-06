import { useEffect, useId, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";
import { useT } from "../lib/i18n";

type Stage = "capture" | "loading" | "review" | "saving";

/** Longest side, in px, that scanning/cleanup ever operates on. Phone cameras commonly shoot
 *  4000px+ photos — processing (and holding in memory) several full-resolution canvases at once
 *  is what was crashing mobile Safari (silently — the tab just gets killed under memory
 *  pressure, no error, the page resets). 2000px is roughly 200-300 DPI for a letter/A4 page —
 *  plenty for reading or re-signing — while cutting memory/CPU by 4x+ on a typical photo. */
const MAX_DIMENSION = 2000;

interface ScannedPage {
  canvas: HTMLCanvasElement;
  detected: boolean;
  /** Object URL for cheap <img> preview — avoids re-encoding the canvas to base64 on every render. */
  previewUrl: string;
}

/** Lazily loads OpenCV.js exactly once and exposes it as the global `cv` jscanify expects —
 *  this is a multi-MB WASM payload, so it must never end up in the main bundle. */
let cvPromise: Promise<unknown> | null = null;
function loadCv(): Promise<unknown> {
  if (!cvPromise) {
    cvPromise = (async () => {
      const cvModule = (await import("@techstark/opencv-js")).default as any;
      let cv = cvModule;
      if (cv instanceof Promise) {
        cv = await cv;
      } else if (!cv.Mat) {
        await new Promise<void>((resolve) => {
          cv.onRuntimeInitialized = () => resolve();
        });
      }
      (window as unknown as { cv: unknown }).cv = cv;
      return cv;
    })();
  }
  return cvPromise;
}

let scannerPromise: Promise<InstanceType<typeof import("jscanify/client").default>> | null = null;
function loadScanner() {
  if (!scannerPromise) {
    scannerPromise = (async () => {
      await loadCv();
      const { default: Jscanify } = await import("jscanify/client");
      return new Jscanify();
    })();
  }
  return scannerPromise;
}

function loadImage(objectUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("image-load-failed"));
    img.src = objectUrl;
  });
}

/** Downscales to MAX_DIMENSION on the longest side before any further processing — the single
 *  biggest lever on memory use, since every later step (OpenCV contour/warp, contrast pass,
 *  JPEG encode) scales with this canvas's pixel count. */
function capResolution(img: HTMLImageElement): { source: HTMLCanvasElement | HTMLImageElement; width: number; height: number } {
  const { naturalWidth: w, naturalHeight: h } = img;
  const scale = Math.min(1, MAX_DIMENSION / Math.max(w, h));
  if (scale >= 1) return { source: img, width: w, height: h };
  const width = Math.round(w * scale);
  const height = Math.round(h * scale);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d")!.drawImage(img, 0, 0, width, height);
  return { source: canvas, width, height };
}

/** Cheap per-channel contrast stretch — runs after perspective correction so the page reads
 *  clearly regardless of the original phone photo's lighting. Skips a full OpenCV threshold
 *  pass (e.g. adaptive/OTSU binarization) since that can wash out color IDs and forms. */
function autoContrast(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  const imageData = ctx.getImageData(0, 0, width, height);
  const { data } = imageData;
  let min = 255;
  let max = 0;
  for (let i = 0; i < data.length; i += 4) {
    const v = (data[i] + data[i + 1] + data[i + 2]) / 3;
    if (v < min) min = v;
    if (v > max) max = v;
  }
  const range = max - min;
  if (range < 10) return; // already flat/contrasty — don't amplify noise
  const scale = 255 / range;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - min) * scale));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - min) * scale));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - min) * scale));
  }
  ctx.putImageData(imageData, 0, 0);
}

/** Blob-based, not toDataURL+fetch — a base64 round-trip needs the binary AND a ~33% larger
 *  string version of it in memory at once, which was another real chunk of the memory spike. */
function canvasToJpegBlob(canvas: HTMLCanvasElement, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("toBlob-failed"))), "image/jpeg", quality);
  });
}

export interface ScanCaptureProps {
  onDone: (file: File) => void | Promise<void>;
  onCancel: () => void;
}

/**
 * Phone-camera document scan: capture → downscale → auto-crop/deskew (jscanify + OpenCV.js,
 * lazy-loaded) → review → repeat for multi-page → bundled into a single PDF (pdf-lib) so it
 * flows through the same `onFile` pipeline as a regular PDF upload — no server/API changes needed.
 */
export default function ScanCapture({ onDone, onCancel }: ScanCaptureProps) {
  const t = useT();
  const autoId = useId();
  const inputId = `scan-capture-${autoId}`;
  const [stage, setStage] = useState<Stage>("capture");
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [pending, setPending] = useState<ScannedPage | null>(null);
  const [error, setError] = useState<string | null>(null);
  const objectUrlsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    const urls = objectUrlsRef.current;
    return () => {
      urls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const processFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setStage("loading");
    const objectUrl = URL.createObjectURL(file);
    try {
      const scanner = await loadScanner();
      const rawImg = await loadImage(objectUrl);
      const { source, width, height } = capResolution(rawImg);
      let canvas: HTMLCanvasElement;
      let detected = true;
      let extracted: HTMLCanvasElement | null = null;
      try {
        extracted = scanner.extractPaper(source, width, height);
      } catch {
        extracted = null;
      }
      if (extracted) {
        canvas = extracted;
      } else {
        detected = false;
        canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        canvas.getContext("2d")!.drawImage(source, 0, 0, width, height);
      }
      autoContrast(canvas);
      const previewBlob = await canvasToJpegBlob(canvas, 0.85);
      const previewUrl = URL.createObjectURL(previewBlob);
      objectUrlsRef.current.add(previewUrl);
      setPending({ canvas, detected, previewUrl });
      setStage("review");
    } catch {
      setError(t("scan.processError"));
      setStage("capture");
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  };

  const keepPage = () => {
    if (!pending) return;
    setPages((prev) => [...prev, pending]);
    setPending(null);
    setStage("capture");
  };

  const retake = () => {
    if (pending) {
      URL.revokeObjectURL(pending.previewUrl);
      objectUrlsRef.current.delete(pending.previewUrl);
    }
    setPending(null);
    setStage("capture");
  };

  const removePage = (index: number) => {
    setPages((prev) => {
      const removed = prev[index];
      if (removed) {
        URL.revokeObjectURL(removed.previewUrl);
        objectUrlsRef.current.delete(removed.previewUrl);
      }
      return prev.filter((_, i) => i !== index);
    });
  };

  const finish = async () => {
    if (pages.length === 0) return;
    setStage("saving");
    try {
      const pdfDoc = await PDFDocument.create();
      for (const page of pages) {
        const jpegBlob = await canvasToJpegBlob(page.canvas);
        const jpegBytes = new Uint8Array(await jpegBlob.arrayBuffer());
        const jpg = await pdfDoc.embedJpg(jpegBytes);
        const pdfPage = pdfDoc.addPage([page.canvas.width, page.canvas.height]);
        pdfPage.drawImage(jpg, { x: 0, y: 0, width: page.canvas.width, height: page.canvas.height });
      }
      const bytes = await pdfDoc.save();
      const file = new File([bytes as BlobPart], "scan.pdf", { type: "application/pdf" });
      await onDone(file);
    } catch {
      setError(t("scan.processError"));
      setStage("capture");
    }
  };

  return (
    <div className="sig-modal-backdrop" role="presentation" onClick={onCancel}>
      <div
        className="sig-modal card scan-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scan-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sig-modal-header">
          <h2 id="scan-modal-title">{t("scan.title")}</h2>
          <button type="button" className="sig-modal-close" onClick={onCancel} aria-label={t("common.cancel")}>
            ×
          </button>
        </div>

        {stage === "review" && pending ? (
          <div className="scan-review">
            <p className="scan-hint">{pending.detected ? t("scan.reviewHint") : t("scan.noEdgesHint")}</p>
            <div className="scan-review-canvas-wrap">
              <img alt="" src={pending.previewUrl} />
            </div>
            <div className="sign-modal-actions">
              <button className="btn-secondary" type="button" onClick={retake}>
                {t("scan.retake")}
              </button>
              <button className="btn-primary" type="button" onClick={keepPage}>
                {t("scan.keepPage")}
              </button>
            </div>
          </div>
        ) : (
          <div className="scan-capture-panel">
            <p className="scan-hint">{t("scan.captureHint")}</p>

            {pages.length > 0 && (
              <div className="scan-thumbs" role="list">
                {pages.map((page, i) => (
                  <div className="scan-thumb" role="listitem" key={i}>
                    <img alt="" src={page.previewUrl} />
                    <button
                      type="button"
                      className="scan-thumb-remove"
                      onClick={() => removePage(i)}
                      aria-label={t("common.cancel")}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <input
              type="file"
              accept="image/*"
              capture="environment"
              id={inputId}
              style={{ display: "none" }}
              disabled={stage === "loading"}
              onChange={(e) => {
                const file = e.target.files?.[0];
                void processFile(file);
                e.target.value = "";
              }}
            />
            <label htmlFor={inputId} className={`scan-capture-btn${stage === "loading" ? " is-busy" : ""}`}>
              {stage === "loading"
                ? t("scan.processing")
                : pages.length > 0
                  ? t("scan.captureAnother")
                  : t("scan.captureFirst")}
            </label>

            {pages.length > 0 && <p className="scan-page-count">{t("scan.pageCount", { count: pages.length })}</p>}

            {error && (
              <p className="sig-type-error" role="alert">
                {error}
              </p>
            )}

            <div className="sign-modal-actions">
              <button className="btn-secondary" type="button" onClick={onCancel}>
                {t("common.cancel")}
              </button>
              <button
                className="btn-primary"
                type="button"
                disabled={pages.length === 0 || stage === "saving"}
                onClick={() => void finish()}
              >
                {stage === "saving" ? t("common.loading") : t("scan.done")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
