/** jscanify ships no types for its browser build ("jscanify/client"), and expects a global
 *  `cv` (OpenCV.js) to already be loaded before any method is called. */
declare module "jscanify/client" {
  export default class Jscanify {
    constructor();
    findPaperContour(img: unknown): unknown;
    getCornerPoints(contour: unknown): {
      topLeftCorner?: { x: number; y: number };
      topRightCorner?: { x: number; y: number };
      bottomLeftCorner?: { x: number; y: number };
      bottomRightCorner?: { x: number; y: number };
    };
    highlightPaper(
      image: HTMLImageElement | HTMLCanvasElement,
      options?: { color?: string; thickness?: number }
    ): HTMLCanvasElement;
    extractPaper(
      image: HTMLImageElement | HTMLCanvasElement,
      resultWidth: number,
      resultHeight: number,
      cornerPoints?: unknown
    ): HTMLCanvasElement | null;
  }
}
