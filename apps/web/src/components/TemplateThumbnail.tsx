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
 *  look before the visitor commits to /prepare.
 *
 *  Rendering is deferred until the tile scrolls near the viewport: pdf.js spins up a dedicated
 *  Worker per document, and the Marketplace grid has 90+ of these — mounting them all eagerly fired
 *  90+ concurrent Worker threads (and worker-script fetches) on page load, which was enough load to
 *  hang or stutter the page, especially on mobile. Deferring to IntersectionObserver caps how many
 *  are ever in flight at once to roughly what's actually on screen. */
export default function TemplateThumbnail({ pdfPath, width = 160 }: { pdfPath: string; width?: number }) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [visible, setVisible] = useState(false);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    const el = wrapperRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
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
  }, [visible, pdfPath, width]);

  if (status === "error") return null;

  return (
    <div
      ref={wrapperRef}
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
