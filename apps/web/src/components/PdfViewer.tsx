import { useEffect, useRef, useState } from "react";
import { useT } from "../lib/i18n";
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

const ZOOM_STEP = 0.1;
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 2.5;
/** Ignore pointer-ups that moved farther than this — treat as scroll/pan, not a place tap. */
const TAP_MOVE_PX = 14;

export default function PdfViewer({ pdfBytes, maxScale = 1.8, renderPageOverlay, onPageClick }: PdfViewerProps) {
  const t = useT();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [pages, setPages] = useState<PageInfo[]>([]);
  const [containerWidth, setContainerWidth] = useState(0);
  // 1 = "100%", the container-fit size — matches the reference's default zoom readout, not a
  // literal 1:1 pixel scale.
  const [zoom, setZoom] = useState(1);
  const tapStartRef = useRef<{ pointerId: number; x: number; y: number } | null>(null);

  // Track available width so pages scale down to fit on narrow (e.g. mobile) screens instead of
  // forcing horizontal scroll. Measured directly (not just via ResizeObserver) since some embedded
  // browser contexts never fire resize-observer callbacks at all.
  //
  // Debounced (not measured synchronously on every callback) as a defense against a resize-loop:
  // on browsers whose scrollbar takes up layout width (Windows, many Linux desktops — unlike
  // macOS's overlay scrollbars), zooming past 100% can make the page tall enough to need a
  // vertical scrollbar, which shrinks this element's width, which re-renders the PDF narrower,
  // which may no longer need a scrollbar, which grows the width back — flipping forever. The
  // scrollbar-gutter: stable rule in theme.css is the real fix (reserves that space permanently
  // so the scrollbar's presence never changes anything), but this debounce keeps any remaining
  // edge case (e.g. older Safari, which doesn't support scrollbar-gutter yet) to a slow settle
  // instead of a tight, visible flicker loop.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const measure = () => {
      if (!wrapperRef.current) return;
      const width = wrapperRef.current.clientWidth;
      setContainerWidth((prev) => (Math.abs(prev - width) > 10 ? width : prev));
    };
    const debouncedMeasure = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(measure, 150);
    };
    measure();
    window.addEventListener("resize", debouncedMeasure);
    const observer = new ResizeObserver(debouncedMeasure);
    if (wrapperRef.current) observer.observe(wrapperRef.current);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener("resize", debouncedMeasure);
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
      // Renders at devicePixelRatio× the display size so the bitmap is crisp on Retina/HiDPI
      // screens — canvas.width/height (the actual pixel buffer) is set from this, while
      // canvas.style.width/height (and every PageInfo/overlay measurement below) stays at the
      // plain CSS display size, so field-placement math (all fractional, see Prepare.tsx) never
      // sees the difference.
      const dpr = window.devicePixelRatio || 1;

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const naturalWidth = page.getViewport({ scale: 1 }).width;
        const fitScale = Math.min(maxScale, containerWidth / naturalWidth);
        const displayScale = fitScale * zoom;
        const displayViewport = page.getViewport({ scale: displayScale });
        const renderViewport = page.getViewport({ scale: displayScale * dpr });
        const canvas = document.createElement("canvas");
        canvas.width = renderViewport.width;
        canvas.height = renderViewport.height;
        canvas.style.width = `${displayViewport.width}px`;
        canvas.style.height = `${displayViewport.height}px`;
        canvas.style.display = "block";
        canvas.style.marginBottom = "16px";
        canvas.dataset.pageIndex = String(i - 1);
        const ctx = canvas.getContext("2d")!;
        await page.render({ canvasContext: ctx, viewport: renderViewport }).promise;
        if (cancelled) return;
        containerRef.current!.appendChild(canvas);
        infos.push({ index: i - 1, widthPx: displayViewport.width, heightPx: displayViewport.height });
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
  }, [pdfBytes, containerWidth, maxScale, zoom]);

  const commitPageTap = (page: PageInfo, clientX: number, clientY: number, target: HTMLElement) => {
    if (!onPageClick) return;
    const rect = target.getBoundingClientRect();
    const xFrac = (clientX - rect.left) / rect.width;
    const yFrac = (clientY - rect.top) / rect.height;
    onPageClick(page, xFrac, yFrac);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, width: "100%" }}>
      <div ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
        <div ref={containerRef} />
        {pages.map((page) => (
          <div
            key={page.index}
            data-page-index={page.index}
            onPointerDown={(e) => {
              if (!onPageClick) return;
              if (e.pointerType === "mouse" && e.button !== 0) return;
              // Don't preventDefault — parent must still scroll the PDF between place taps.
              tapStartRef.current = { pointerId: e.pointerId, x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              if (!onPageClick) return;
              const start = tapStartRef.current;
              tapStartRef.current = null;
              if (!start || start.pointerId !== e.pointerId) return;
              if (Math.hypot(e.clientX - start.x, e.clientY - start.y) > TAP_MOVE_PX) return;
              commitPageTap(page, e.clientX, e.clientY, e.currentTarget);
            }}
            onPointerCancel={() => {
              tapStartRef.current = null;
            }}
            style={{
              position: "absolute",
              left: 0,
              top: pages.slice(0, page.index).reduce((sum, p) => sum + p.heightPx + 16, 0),
              width: page.widthPx,
              height: page.heightPx,
              cursor: onPageClick ? "crosshair" : "default",
              // Auto keeps vertical pan for scrolling; place taps use the movement threshold above.
              touchAction: onPageClick ? "pan-y" : "auto",
            }}
          >
            {renderPageOverlay?.(page)}
          </div>
        ))}
      </div>

      {pages.length > 0 && (
        <div
          className="pdf-zoom-controls"
          style={{
            position: "sticky",
            bottom: 16,
            alignSelf: "center",
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "var(--canvas)",
            border: "1px solid var(--hairline)",
            borderRadius: 999,
            boxShadow: "var(--shadow-md)",
            padding: "6px 8px",
            zIndex: 5,
          }}
        >
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: "4px 10px", borderRadius: 999 }}
            onClick={() => setZoom((z) => Math.max(MIN_ZOOM, Math.round((z - ZOOM_STEP) * 100) / 100))}
            aria-label={t("pdf.zoomOut")}
          >
            −
          </button>
          <span style={{ fontSize: 13, color: "var(--mute)", minWidth: 44, textAlign: "center" }}>
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            className="btn-secondary"
            style={{ padding: "4px 10px", borderRadius: 999 }}
            onClick={() => setZoom((z) => Math.min(MAX_ZOOM, Math.round((z + ZOOM_STEP) * 100) / 100))}
            aria-label={t("pdf.zoomIn")}
          >
            +
          </button>
        </div>
      )}
    </div>
  );
}
