/**
 * Best-effort IndexNow ping after weekly content publish.
 * Key must match apps/web/scripts/indexNowKey.mjs (deploy writes the key file).
 */
import type { Env } from "@docracy/shared";
import { publicAppHost, publicAppUrl } from "./publicUrls";

const INDEXNOW_KEY = "docracy-indexnow-20260728";

export async function pingIndexNow(env: Pick<Env, "PUBLIC_APP_URL">, paths: string[]): Promise<void> {
  const site = publicAppUrl(env);
  const host = publicAppHost(env);
  const urlList = [...new Set(paths)]
    .map((p) => (p.startsWith("http") ? p : `${site}${p.startsWith("/") ? p : `/${p}`}`))
    .slice(0, 100);
  if (urlList.length === 0) return;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host,
        key: INDEXNOW_KEY,
        keyLocation: `${site}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    if (!res.ok) {
      console.error(`IndexNow ping failed: HTTP ${res.status}`);
    } else {
      console.log(`IndexNow: submitted ${urlList.length} URL(s) to ${host}`);
    }
  } catch (err) {
    console.error("IndexNow ping error:", err instanceof Error ? err.message : String(err));
  }
}
