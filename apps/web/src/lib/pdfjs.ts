import * as pdfjsLib from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

export { pdfjsLib };

export async function loadPdf(bytes: Uint8Array) {
  const loadingTask = pdfjsLib.getDocument({
    data: bytes,
    standardFontDataUrl: "/standard_fonts/",
    cMapUrl: "/cmaps/",
    cMapPacked: true,
  });
  return loadingTask.promise;
}
