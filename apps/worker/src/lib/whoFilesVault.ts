import type { Env } from "@docracy/shared";

export const WHO_FILES_VAULT_PREFIX = "who-files:";

/** Same row ids as apps/web/src/lib/whoFilesWhere.ts — duplicated (YAGNI, no shared package). */
export const WHO_FILES_VAULT_ROW_IDS = [
  "offer",
  "i9",
  "everify",
  "visa",
  "ceac",
  "cita",
  "ead",
  "uscis",
  "uscisAccount",
  "i94",
  "address",
  "ssn",
  "itin",
  "phone",
  "w9",
  "apostille",
  "acta",
  "poa",
  "child",
  "lease",
  "constancia",
  "cobro",
] as const;

const ROW_ID_SET = new Set<string>(WHO_FILES_VAULT_ROW_IDS);
const COUNTRY_SLUG_RE = /^[a-z][a-z0-9-]{1,32}-to-us$/;

export interface WhoFilesVault {
  done: string[];
  countrySlug: string;
  updatedAt: string;
}

export function whoFilesVaultKey(workspaceId: string): string {
  return `${WHO_FILES_VAULT_PREFIX}${workspaceId}`;
}

export function parseWhoFilesVault(input: unknown): { done: string[]; countrySlug: string } | null {
  if (!input || typeof input !== "object") return null;
  const body = input as { done?: unknown; countrySlug?: unknown };
  if (!Array.isArray(body.done)) return null;
  const done = [...new Set(body.done.filter((id): id is string => typeof id === "string" && ROW_ID_SET.has(id)))];
  const rawCountry = typeof body.countrySlug === "string" ? body.countrySlug.trim() : "";
  const countrySlug = rawCountry === "" || COUNTRY_SLUG_RE.test(rawCountry) ? rawCountry : "";
  return { done, countrySlug };
}

export async function getWhoFilesVault(env: Env, workspaceId: string): Promise<WhoFilesVault | null> {
  return env.DOCRACY_KV.get<WhoFilesVault>(whoFilesVaultKey(workspaceId), "json");
}

export async function putWhoFilesVault(
  env: Env,
  workspaceId: string,
  input: { done: string[]; countrySlug: string }
): Promise<WhoFilesVault> {
  const vault: WhoFilesVault = {
    done: input.done,
    countrySlug: input.countrySlug,
    updatedAt: new Date().toISOString(),
  };
  await env.DOCRACY_KV.put(whoFilesVaultKey(workspaceId), JSON.stringify(vault));
  return vault;
}
