/** Cookie that carries first-touch attribution across a tracking-param 301. */
export const FIRST_TOUCH_COOKIE = "docracy_ft";

export function serializeFirstTouchCookie(source: string, medium: string, campaign: string): string {
  return encodeURIComponent(`${source}|${medium}|${campaign}`);
}

export function parseFirstTouchCookie(
  cookieValue: string
): { source: string; medium: string; campaign: string } | null {
  try {
    const decoded = decodeURIComponent(cookieValue);
    const [source, medium = "", campaign = ""] = decoded.split("|");
    if (!source) return null;
    return { source, medium, campaign };
  } catch {
    return null;
  }
}
