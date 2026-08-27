/**
 * Best-effort IndexNow ping after weekly content publish.
 * Key must match apps/web/scripts/indexNowKey.mjs (deploy writes the key file).
 */
const INDEXNOW_KEY = "docracy-indexnow-20260728";
const SITE = "https://docracy.io";

export async function pingIndexNow(paths: string[]): Promise<void> {
  const urlList = [...new Set(paths)]
    .map((p) => (p.startsWith("http") ? p : `${SITE}${p.startsWith("/") ? p : `/${p}`}`))
    .slice(0, 100);
  if (urlList.length === 0) return;
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({
        host: "docracy.io",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`,
        urlList,
      }),
    });
    if (!res.ok) {
      console.error(`IndexNow ping failed: HTTP ${res.status}`);
    } else {
      console.log(`IndexNow: submitted ${urlList.length} URL(s)`);
    }
  } catch (err) {
    console.error("IndexNow ping error:", err instanceof Error ? err.message : String(err));
  }
}
