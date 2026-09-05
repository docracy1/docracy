import { localizePath } from "./i18n";
import type { Locale } from "./i18n/types";

const LATAM_LOGIN_REFS = new Set([
  "latam-to-us",
  "cobro",
  "constancia",
  "immigrant-housing",
  "after-arrival",
  "itin",
  "who-files-where",
  "latam-search",
]);

const LATAM_NEXT_RE =
  /kit-llegar-eeuu|latam-to-us|\/cobro|constancia|income-proof|mexico-a-eeuu|colombia-a-eeuu|despues-de-llegar|quien-sube-donde|who-files-where|\/buscar|latam-search|\/itin|arrendamiento-inmigrante|\/es\/precios/;

/** Login chrome for Spanish LATAM funnels — immigrant copy only when locale is es. */
export function isLatamLoginIntent(ref: string, next: string): boolean {
  if (LATAM_LOGIN_REFS.has(ref)) return true;
  return LATAM_NEXT_RE.test(next);
}

/** Magic-link return URL that auto-starts Stripe after login. */
export function loginWithCheckout(nextPath: string, ref: string): string {
  const sep = nextPath.includes("?") ? "&" : "?";
  const next = `${nextPath}${sep}checkout=1`;
  return `/login?next=${encodeURIComponent(next)}&ref=${encodeURIComponent(ref)}`;
}

export function pricingCheckoutPath(locale: Locale): string {
  return `${localizePath("/pricing", locale)}?checkout=1`;
}

export function pricingUpgradeHref(account: unknown, locale: Locale, ref: string): string {
  const next = pricingCheckoutPath(locale);
  if (account) return next;
  return `/login?ref=${encodeURIComponent(ref)}&next=${encodeURIComponent(next)}`;
}
