/**
 * After a Cloudflare Pages deploy, open tabs still hold the previous JS entry that
 * points at retired `/assets/*-<hash>.js` chunks. Dynamic `import()` then fails with
 * "Failed to fetch dynamically imported module" and React shows the error boundary.
 *
 * One hard reload (sessionStorage-guarded) fetches the new HTML shell with current
 * hashes. A second failure in the same tab session falls through so we don't loop.
 */

const RELOAD_KEY = "docracy_stale_chunk_reload";

export function isStaleChunkError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error ?? "");
  const name = error instanceof Error ? error.name : "";
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /Loading chunk [\w-]+ failed/i.test(msg) ||
    name === "ChunkLoadError"
  );
}

/** Returns true if a reload was triggered. */
export function reloadOnceOnStaleChunk(error?: unknown): boolean {
  if (error !== undefined && !isStaleChunkError(error)) return false;
  try {
    if (sessionStorage.getItem(RELOAD_KEY) === "1") return false;
    sessionStorage.setItem(RELOAD_KEY, "1");
  } catch {
    // Private mode / blocked storage — still attempt one reload via URL nonce.
  }
  const url = new URL(window.location.href);
  // Bust any intermediary HTML cache that might still serve the old shell.
  url.searchParams.set("_r", String(Date.now()));
  window.location.replace(url.toString());
  return true;
}

/** Clear the guard after a successful boot so a later deploy can recover again. */
export function clearStaleChunkReloadGuard(): void {
  try {
    sessionStorage.removeItem(RELOAD_KEY);
    // Drop the cache-bust query if we just recovered via reload.
    const url = new URL(window.location.href);
    if (url.searchParams.has("_r")) {
      url.searchParams.delete("_r");
      window.history.replaceState(null, "", url.pathname + url.search + url.hash);
    }
  } catch {
    /* ignore */
  }
}
