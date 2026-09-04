/**
 * Paid archive length: later of 13 calendar months or April 15 of the next calendar year.
 * Keep in sync with apps/web/src/lib/paidVault.ts (YAGNI — duplicated on purpose).
 *
 * That covers W-9 / 1099 season (hired in January, still there next tax deadline) and a 13-month
 * floor so a December send is not deleted in April. Not IRS-retention years; not unlimited storage.
 */

const MS_PER_DAY = 86_400_000;

/** Env fallback / API clamp. Must be ≥ the longest vault (~Jan 1 → Apr 15 next year, ~470 days). */
export const PAID_TTL_MAX_DAYS_FALLBACK = 500;

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

/** April 15 of calendarYear(from) + 1, UTC midnight. */
export function nextTaxDeadline(from: Date): Date {
  return new Date(Date.UTC(from.getUTCFullYear() + 1, 3, 15));
}

export function paidVaultExpiresAt(from: Date = new Date()): Date {
  const thirteenMonths = addUtcMonths(from, 13);
  const taxDeadline = nextTaxDeadline(from);
  return thirteenMonths.getTime() >= taxDeadline.getTime() ? thirteenMonths : taxDeadline;
}

/** Whole days from `from` until the vault expiry (at least 1). */
export function paidVaultDays(from: Date = new Date()): number {
  const later = paidVaultExpiresAt(from);
  return Math.max(1, Math.ceil((later.getTime() - from.getTime()) / MS_PER_DAY));
}
