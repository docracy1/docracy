/**
 * Paid archive length: later of 13 calendar months or April 15 of the next calendar year.
 * Keep in sync with apps/worker/src/lib/paidVault.ts (YAGNI — duplicated on purpose).
 */

const MS_PER_DAY = 86_400_000;

/** Must match worker PAID_TTL_MAX_DAYS_FALLBACK / wrangler DOC_TTL_MAX_DAYS. */
export const PAID_TTL_MAX_DAYS = 500;

export function addUtcMonths(from: Date, months: number): Date {
  const year = from.getUTCFullYear();
  const monthIndex = from.getUTCMonth() + months;
  const targetYear = year + Math.floor(monthIndex / 12);
  const targetMonth = ((monthIndex % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(targetYear, targetMonth + 1, 0)).getUTCDate();
  const day = Math.min(from.getUTCDate(), lastDay);
  return new Date(
    Date.UTC(
      targetYear,
      targetMonth,
      day,
      from.getUTCHours(),
      from.getUTCMinutes(),
      from.getUTCSeconds(),
      from.getUTCMilliseconds()
    )
  );
}

export function nextTaxDeadline(from: Date): Date {
  return new Date(Date.UTC(from.getUTCFullYear() + 1, 3, 15));
}

export function paidVaultExpiresAt(from: Date = new Date()): Date {
  const thirteenMonths = addUtcMonths(from, 13);
  const taxDeadline = nextTaxDeadline(from);
  return thirteenMonths.getTime() >= taxDeadline.getTime() ? thirteenMonths : taxDeadline;
}

export function paidVaultDays(from: Date = new Date()): number {
  const later = paidVaultExpiresAt(from);
  return Math.max(1, Math.ceil((later.getTime() - from.getTime()) / MS_PER_DAY));
}

export function signedPagePath(token: string, locale: "en" | "es"): string {
  return locale === "es" ? `/es/firmado/${token}` : `/signed/${token}`;
}
