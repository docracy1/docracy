import { useEffect, useRef, useState } from "react";
import { loadPdf } from "../lib/pdfjs";

export interface PageInfo {
  index: number;
  widthPx: number;
  heightPx: number;
}

interface PdfViewerProps {
  pdfBytes: Uint8Array;
  /** Upper bound on render scale — actual scale shrinks to fit the container on narrow screens. */
  maxScale?: number;
  /** Called once pages are known, so callers can size an overlay per page. */
  renderPageOverlay?: (page: PageInfo) => React.ReactNode;
  onPageClick?: (page: PageInfo, xFrac: number, yFrac: number) => void;
}

export default function PdfViewer({ pdfBytes, maxScale = 1.3, renderPageOverlay, onPageClick }: PdfViewerProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);

  // Track available width so pages scale down to fit on narrow (e.g. mobile) screens instead of
  // forcing horizontal scroll. Measured directly (not just via ResizeObserver) since some embedded
  // browser contexts never fire resize-observer callbacks at all.
  useEffect(() => {
    const measure = () => {
      if (!wrapperRef.current) return;
      const width = wrapperRef.current.clientWidth;
      setContainerWidth((prev) => (Math.abs(prev - width) > 10 ? width : prev));
    };
    measure();
    window.addEventListener("resize", measure);
    const observer = new ResizeObserver(measure);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => {
      window.removeEventListener("resize", measure);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    if (!containerWidth) return;
    let cancelled = false;
    let pdfRef: Awaited<ReturnType<typeof loadPdf>> | null = null;

    async function render() {
      const pdf = await loadPdf(pdfBytes);
      pdfRef = pdf;
      if (cancelled || !containerRef.current) return;
      containerRef.current.innerHTML = "";
      const infos: PageInfo[] = [];

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const naturalWidth = page.getViewport({ scale: 1 }).width;
        const fitScale = Math.min(maxScale, containerWidth / naturalWidth);
        const viewport = page.getViewport({ scale: fitScale });
        const canvas = document.createElement("canvas");
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        canvas.style.display = "block";
        canvas.style.marginBottom = "16px";
        canvas.dataset.pageIndex = String(i - 1);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport }).promise;
        if (cancelled) return;
        containerRef.current!.appendChild(canvas);
        infos.push({ index: i - 1, widthPx: viewport.width, heightPx: viewport.height });
      }
      setPages(infos);
    }

    render();
    // pdf.js spins up a dedicated Worker per loadPdf() call — without destroy(), navigating
    // between documents (or React re-mounting this component) leaks workers indefinitely.
    return () => {
      cancelled = true;
      pdfRef?.destroy();
    };
  }, [pdfBytes, containerWidth, maxScale]);

  return (
    <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <div ref={containerRef} />
      {pages.map((page) => (
        <div
          key={page.index}
          data-page-index={page.index}
          onClick={(e) => {
            if (!onPageClick) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const xFrac = (e.clientX - rect.left) / rect.width;
            const yFrac = (e.clientY - rect.top) / rect.height;
            onPageClick(page, xFrac, yFrac);
          }}
          style={{
            position: "absolute",
            left: 0,
            top: pages.slice(0, page.index).reduce((sum, p) => sum + p.heightPx + 16, 0),
            width: page.widthPx,
            height: page.heightPx,
            cursor: onPageClick ? "crosshair" : "default",
          }}
        >
          {renderPageOverlay?.(page)}
        </div>
      ))}
    </div>
  );
}
