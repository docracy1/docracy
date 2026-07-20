import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export { pdfjsLib };

export async function loadPdf(bytes: Uint8Array) {
  const loadingTask = pdfjsLib.getDocument({
    // pdf.js transfers the underlying ArrayBuffer to its worker for zero-copy loading, which
    // detaches it on the main thread — `.slice()` hands over a throwaway copy so the caller's
    // own `bytes` stays readable afterward (callers like Prepare.tsx re-parse the same bytes with
    // pdf-lib for page editing, after this same array has already been rendered once).
    data: bytes.slice(),
    standardFontDataUrl: "/standard_fonts/",
    cMapUrl: "/cmaps/",
    cMapPacked: true,
  });
  return loadingTask.promise;
}
