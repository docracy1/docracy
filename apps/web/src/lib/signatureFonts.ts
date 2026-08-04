/** Handwritten-style fonts for typed signatures (loaded via Google Fonts in index.html). */
export interface SignatureFontStyle {
  id: string;
  /** CSS font-family name (must match the loaded webfont). */
  family: string;
  /** Relative size tweak — some scripts sit larger/smaller at the same px. */
  scale?: number;
}

export const SIGNATURE_FONT_STYLES: SignatureFontStyle[] = [
  { id: "dancing", family: "Dancing Script", scale: 1.05 },
  { id: "great-vibes", family: "Great Vibes", scale: 1.15 },
  { id: "allura", family: "Allura", scale: 1.2 },
  { id: "sacramento", family: "Sacramento", scale: 1.25 },
  { id: "alex-brush", family: "Alex Brush", scale: 1.15 },
  { id: "satisfy", family: "Satisfy", scale: 1.05 },
  { id: "homemade", family: "Homemade Apple", scale: 0.95 },
  { id: "marck", family: "Marck Script", scale: 1.05 },
];

export const DEFAULT_SIGNATURE_FONT_ID = SIGNATURE_FONT_STYLES[1]!.id;

export function signatureFontById(id: string): SignatureFontStyle {
  return SIGNATURE_FONT_STYLES.find((f) => f.id === id) ?? SIGNATURE_FONT_STYLES[0]!;
}

/** Google Fonts CSS URL covering every style in SIGNATURE_FONT_STYLES. */
export const SIGNATURE_FONTS_STYLESHEET =
  "https://fonts.googleapis.com/css2?" +
  [
    "family=Alex+Brush",
    "family=Allura",
    "family=Dancing+Script:wght@500;600;700",
    "family=Great+Vibes",
    "family=Homemade+Apple",
    "family=Marck+Script",
    "family=Sacramento",
    "family=Satisfy",
  ].join("&") +
  "&display=swap";

export function initialsFromName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0]!.slice(0, 2).toUpperCase();
  return parts
    .slice(0, 3)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

/**
 * Rasterize typed signature text to a white-backed PNG data URL (same wire format as draw).
 * Waits for the webfont so measureText/fillText use the real metrics.
 */
export async function renderTypedSignaturePng(
  text: string,
  fontId: string,
  opts?: { ink?: string; baseFontSize?: number }
): Promise<string> {
  const style = signatureFontById(fontId);
  const raw = text.trim();
  if (!raw) throw new Error("Empty signature text");

  const baseSize = opts?.baseFontSize ?? 72;
  const fontSize = Math.round(baseSize * (style.scale ?? 1));
  const fontCss = `${fontSize}px "${style.family}"`;

  try {
    await document.fonts.load(fontCss);
  } catch {
    // Fall through — canvas will use a fallback face if the webfont failed.
  }

  const measure = document.createElement("canvas").getContext("2d")!;
  measure.font = fontCss;
  const width = Math.max(1, measure.measureText(raw).width);
  const padX = Math.ceil(fontSize * 0.35);
  const padY = Math.ceil(fontSize * 0.45);

  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(width) + padX * 2;
  canvas.height = Math.ceil(fontSize * 1.35) + padY * 2;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = opts?.ink ?? "#1a2744";
  ctx.font = fontCss;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(raw, padX, canvas.height / 2);

  return canvas.toDataURL("image/png");
}
