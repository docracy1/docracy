/** Cookie / analytics consent — localStorage key shared with public/clarity-loader.js */
export const COOKIE_CONSENT_KEY = "docracy_cookie_consent";

export type CookieConsent = "accepted" | "declined";

export function getCookieConsent(): CookieConsent | null {
  try {
    const v = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    /* private mode */
  }
  return null;
}

export function setCookieConsent(value: CookieConsent): void {
  try {
    localStorage.setItem(COOKIE_CONSENT_KEY, value);
  } catch {
    /* private mode */
  }
}

export function cookieConsentPending(): boolean {
  return getCookieConsent() === null;
}

export function hasAnalyticsConsent(): boolean {
  return getCookieConsent() === "accepted";
}

/** Load Clarity only after Accept (loader also self-gates on the same key). */
export function loadClarity(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector("script[data-docracy-clarity]")) return;
  const s = document.createElement("script");
  s.src = "/clarity-loader.js";
  s.defer = true;
  s.setAttribute("data-docracy-clarity", "1");
  document.body.appendChild(s);
}

/** Load Google Analytics only after Accept (loader also self-gates on the same key). */
export function loadGa(): void {
  if (typeof document === "undefined") return;
  if (document.querySelector("script[data-docracy-ga]")) return;
  const s = document.createElement("script");
  s.src = "/ga-loader.js";
  s.defer = true;
  s.setAttribute("data-docracy-ga", "1");
  document.body.appendChild(s);
}
