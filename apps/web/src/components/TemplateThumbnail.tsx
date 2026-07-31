import { useEffect, useRef, useState } from "react";

/** Small cache so navigating between the library index and a template's own detail page (both of
 *  which render the same thumbnail) doesn't refetch/re-render identical bytes twice per visit. */
const pdfCache = new Map<string, Promise<Uint8Array>>();

function fetchPdfBytes(pdfPath: string): Promise<Uint8Array> {
  let cached = pdfCache.get(pdfPath);
  if (!cached) {
    cached = fetch(pdfPath)
      .then((res) => res.arrayBuffer())
      .then((buf) => new Uint8Array(buf));
    pdfCache.set(pdfPath, cached);
  }
  return cached;
}

/** Real, honest preview of a free template — renders the actual first page of the actual PDF
 *  (the same file /prepare loads), not a stock photo or a fabricated mockup. Card-grid callers use
 *  a small width; the template detail page uses a larger one for a genuine "here's what you get"
 *  look before the visitor commits to /prepare. */
export default function TemplateThumbnail({ pdfPath, width = 160 }: { pdfPath: string; width?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    let pdfRef: Awaited<ReturnType<typeof import("../lib/pdfjs")["loadPdf"]>> | null = null;
    setStatus("loading");

    async function render() {
      try {
        const [bytes, { loadPdf }] = await Promise.all([fetchPdfBytes(pdfPath), import("../lib/pdfjs")]);
        const pdf = await loadPdf(bytes);
        pdfRef = pdf;
        if (cancelled) return;
        const page = await pdf.getPage(1);
        const naturalWidth = page.getViewport({ scale: 1 }).width;
        const dpr = window.devicePixelRatio || 1;
        const scale = (width / naturalWidth) * dpr;
        const viewport = page.getViewport({ scale });
        const canvas = canvasRef.current;
        if (!canvas || cancelled) return;
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.width = `${width}px`;
        canvas.style.height = `${viewport.height / dpr}px`;
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (!cancelled) setStatus("ready");
      } catch {
        if (!cancelled) setStatus("error");
      }
    }

    render();
    return () => {
      cancelled = true;
      pdfRef?.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pdfPath, width]);

  if (status === "error") return null;

  return (
    <div
      style={{
        width,
        aspectRatio: "8.5 / 11",
        background: "var(--canvas-soft)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-sm)",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <canvas ref={canvasRef} style={{ display: status === "ready" ? "block" : "none" }} />
    </div>
  );
}
