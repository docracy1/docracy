import { signConstanciaToken } from "@docracy/shared";
import type { Env, Locale } from "@docracy/shared";
import { hydrateTaxYearRow, taxYearBounds, type TaxYearRow } from "./taxYear";

export const CONSTANCIA_PROFILE_PREFIX = "constancia-profile:";
export const MAX_SUBJECT_NAME = 80;

export interface ConstanciaProfile {
  subjectName: string;
  updatedAt: string;
}

export interface ConstanciaPublicRow {
  title: string;
  completedAt: string;
  counterparties: Array<{ name: string }>;
  amount: string;
  currency: string;
  signedPageUrl: string;
  kind: "cobro" | "sign";
}

export interface ConstanciaTotal {
  currency: string;
  amount: string;
  count: number;
}

export function profileKey(workspaceId: string): string {
  return `${CONSTANCIA_PROFILE_PREFIX}${workspaceId}`;
}

export function normalizeSubjectName(raw: unknown): string | { error: string } {
  if (typeof raw !== "string") return { error: "A name is required" };
  const name = raw.trim().replace(/\s+/g, " ");
  if (!name) return { error: "A name is required" };
  if (name.length > MAX_SUBJECT_NAME) {
    return { error: `Name must be ${MAX_SUBJECT_NAME} characters or fewer` };
  }
  return name;
}

export async function getConstanciaProfile(env: Env, workspaceId: string): Promise<ConstanciaProfile | null> {
  return env.DOCRACY_KV.get<ConstanciaProfile>(profileKey(workspaceId), "json");
}

export async function putConstanciaProfile(
  env: Env,
  workspaceId: string,
  subjectName: string
): Promise<ConstanciaProfile> {
  const profile: ConstanciaProfile = { subjectName, updatedAt: new Date().toISOString() };
  await env.DOCRACY_KV.put(profileKey(workspaceId), JSON.stringify(profile));
  return profile;
}

export function constanciaPageUrl(appUrl: string, token: string, locale: Locale): string {
  const path = locale === "es" ? `/es/constancia/${token}` : `/income-proof/${token}`;
  return `${appUrl.replace(/\/$/, "")}${path}`;
}

export function toPublicConstanciaRow(row: TaxYearRow): ConstanciaPublicRow {
  return {
    title: row.title,
    completedAt: row.completedAt,
    counterparties: row.counterparties.map((c) => ({ name: c.name })),
    amount: row.amount,
    currency: row.currency,
    signedPageUrl: row.signedPageUrl,
    kind: row.kind,
  };
}

export function totalsByCurrency(documents: Array<{ amount: string; currency: string }>): ConstanciaTotal[] {
  const map = new Map<string, { sum: number; count: number; hadDecimal: boolean }>();
  for (const d of documents) {
    const currency = d.currency.trim().toUpperCase();
    if (!currency || !d.amount.trim()) continue;
    const n = Number(d.amount.replace(/,/g, ""));
    if (!Number.isFinite(n)) continue;
    const prev = map.get(currency) ?? { sum: 0, count: 0, hadDecimal: false };
    prev.sum += n;
    prev.count += 1;
    if (d.amount.includes(".")) prev.hadDecimal = true;
    map.set(currency, prev);
  }
  return [...map.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([currency, { sum, count, hadDecimal }]) => ({
      currency,
      amount: hadDecimal || !Number.isInteger(sum) ? sum.toFixed(2) : String(sum),
      count,
    }));
}

export async function listCompletedInYear(
  env: Env,
  workspaceId: string,
  year: number,
  locale: Locale
): Promise<TaxYearRow[]> {
  if (!env.DOCRACY_DB) return [];
  const { start, end } = taxYearBounds(year);
  const { results } = await env.DOCRACY_DB.prepare(
    `SELECT doc_id, title, completed_at, expires_at
     FROM documents
     WHERE account_id = ?
       AND status = 'completed'
       AND completed_at IS NOT NULL
       AND completed_at >= ?
       AND completed_at < ?
     ORDER BY completed_at ASC`
  )
    .bind(workspaceId, start, end)
    .all<{ doc_id: string; title: string; completed_at: string; expires_at: string }>();

  return Promise.all(results.map((r) => hydrateTaxYearRow(env, r, locale)));
}

export async function mintConstanciaShare(
  env: Env,
  workspaceId: string,
  year: number,
  locale: Locale
): Promise<{ shareToken: string; shareUrl: string }> {
  const shareToken = await signConstanciaToken(workspaceId, year, env.TOKEN_SECRET);
  return { shareToken, shareUrl: constanciaPageUrl(env.PUBLIC_APP_URL, shareToken, locale) };
}
