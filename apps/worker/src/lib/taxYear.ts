import { signedPageUrl } from "./whatsapp";
import { signToken } from "@docracy/shared";
import { getDoc } from "./kv";
import type { DocState, Env } from "@docracy/shared";

export interface TaxYearRow {
  docId: string;
  title: string;
  completedAt: string;
  expiresAt: string;
  statusToken: string;
  signedPageUrl: string;
  counterparties: Array<{ name: string; email: string }>;
  amount: string;
  currency: string;
  paymentUrl: string;
  kind: "cobro" | "sign";
  cobroPaidAt: string;
}

export function parseTaxYear(raw: string | undefined, now = new Date()): number | { error: string } {
  if (!raw || !raw.trim()) return now.getUTCFullYear();
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 2000 || n > 2100) {
    return { error: "year must be a calendar year like 2026" };
  }
  return n;
}

export function taxYearBounds(year: number): { start: string; end: string } {
  return {
    start: `${year}-01-01T00:00:00.000Z`,
    end: `${year + 1}-01-01T00:00:00.000Z`,
  };
}

export function counterpartiesFromDoc(doc: DocState): Array<{ name: string; email: string }> {
  if (doc.kind === "cobro" && doc.cobroRecipient) {
    return [{ name: doc.cobroRecipient.name, email: doc.cobroRecipient.email ?? "" }];
  }
  return [...doc.signers]
    .sort((a, b) => a.order - b.order)
    .map((s) => ({ name: s.name, email: s.email }));
}

export async function hydrateTaxYearRow(
  env: Env,
  row: { doc_id: string; title: string; completed_at: string; expires_at: string },
  locale: "en" | "es"
): Promise<TaxYearRow> {
  const statusToken = await signToken(row.doc_id, 0, env.TOKEN_SECRET);
  const pageUrl = signedPageUrl(env.PUBLIC_APP_URL, statusToken, locale);
  const doc = await getDoc(env, row.doc_id);
  const payment = doc?.paymentRequest;
  return {
    docId: row.doc_id,
    title: doc?.title?.trim() || row.title,
    completedAt: doc?.completedAt || row.completed_at,
    expiresAt: doc?.expiresAt || row.expires_at,
    statusToken,
    signedPageUrl: pageUrl,
    counterparties: doc ? counterpartiesFromDoc(doc) : [],
    amount: payment?.amount ?? "",
    currency: payment?.currency ?? "",
    paymentUrl: payment?.url ?? "",
    kind: doc?.kind === "cobro" ? "cobro" : "sign",
    cobroPaidAt: doc?.kind === "cobro" ? (doc.cobroPaidAt ?? "") : "",
  };
}

export function taxYearCsv(year: number, documents: TaxYearRow[]): string {
  const header = [
    "year",
    "completedAt",
    "title",
    "counterpartyNames",
    "counterpartyEmails",
    "amount",
    "currency",
    "paymentUrl",
    "cobroPaid",
    "cobroPaidAt",
    "expiresAt",
    "signedPageUrl",
  ];
  const lines = [header.join(",")];
  for (const d of documents) {
    lines.push(
      [
        String(year),
        csvCell(d.completedAt),
        csvCell(d.title),
        csvCell(d.counterparties.map((c) => c.name).join("; ")),
        csvCell(d.counterparties.map((c) => c.email).filter(Boolean).join("; ")),
        csvCell(d.amount),
        csvCell(d.currency),
        csvCell(d.paymentUrl),
        csvCell(d.kind === "cobro" ? (d.cobroPaidAt ? "paid" : "unpaid") : ""),
        csvCell(d.cobroPaidAt),
        csvCell(d.expiresAt),
        csvCell(d.signedPageUrl),
      ].join(",")
    );
  }
  return lines.join("\n") + "\n";
}

function csvCell(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}
