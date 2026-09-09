import type { PaymentRequest } from "@docracy/shared";

export const PAYMENT_CURRENCIES = ["USD", "MXN", "COP", "ARS", "CLP", "PEN", "BRL"] as const;
export type PaymentCurrency = (typeof PAYMENT_CURRENCIES)[number];

const AMOUNT_RE = /^\d{1,8}(\.\d{1,2})?$/;
const MAX_URL_LENGTH = 500;

function isHttpsUrl(raw: string): boolean {
  if (raw.length > MAX_URL_LENGTH) return false;
  try {
    const u = new URL(raw);
    if (u.protocol !== "https:") return false;
    if (!u.hostname || u.hostname.includes(" ")) return false;
    if (u.username || u.password) return false;
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates an optional payment-request blob from create-document meta.
 * Missing/empty → undefined (feature off). Partial/invalid → error string.
 *
 * method "crypto" skips URL validation entirely — the caller (routes/account.ts) fills `url` in
 * afterward with a real NOWPayments invoice URL it generates from this same amount/currency, since
 * that requires an API call this pure-validation function shouldn't make itself.
 */
export function parsePaymentRequest(raw: unknown): { paymentRequest?: PaymentRequest; error?: string } {
  if (raw == null || raw === "") return {};
  if (typeof raw !== "object") return { error: "paymentRequest must be an object" };
  const rec = raw as Record<string, unknown>;
  const amount = typeof rec.amount === "string" ? rec.amount.trim() : "";
  const currency = typeof rec.currency === "string" ? rec.currency.trim().toUpperCase() : "";
  const url = typeof rec.url === "string" ? rec.url.trim() : "";
  const method: "link" | "crypto" = rec.method === "crypto" ? "crypto" : "link";
  if (!amount && !currency && !url && method === "link") return {};
  if (!amount || !AMOUNT_RE.test(amount)) {
    return { error: "Payment amount must be a number like 150 or 150.00" };
  }
  if (!(PAYMENT_CURRENCIES as readonly string[]).includes(currency)) {
    return { error: `Payment currency must be one of ${PAYMENT_CURRENCIES.join(", ")}` };
  }
  if (method === "crypto") {
    return { paymentRequest: { amount, currency, url: "", method: "crypto" } };
  }
  if (!isHttpsUrl(url)) {
    return { error: "Payment link must be an https URL you control (PayPal, Stripe, Mercado Pago, …)" };
  }
  return { paymentRequest: { amount, currency, url, method: "link" } };
}

export function formatPaymentLabel(req: PaymentRequest): string {
  return `${req.amount} ${req.currency}`;
}
