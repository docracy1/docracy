import { signPayerToken } from "@docracy/shared";
import type { Env, Locale } from "@docracy/shared";

export function payerPageUrl(appUrl: string, token: string, locale: Locale): string {
  const path = locale === "es" ? `/es/temporada-1099/${token}` : `/1099-season/${token}`;
  return `${appUrl.replace(/\/$/, "")}${path}`;
}

export async function mintPayerShare(
  env: Env,
  workspaceId: string,
  year: number,
  locale: Locale
): Promise<{ shareToken: string; shareUrl: string }> {
  const shareToken = await signPayerToken(workspaceId, year, env.TOKEN_SECRET);
  return { shareToken, shareUrl: payerPageUrl(env.PUBLIC_APP_URL, shareToken, locale) };
}
