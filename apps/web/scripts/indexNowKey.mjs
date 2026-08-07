// Shared between prerender.mjs (writes the key file every build) and submitIndexNow.mjs (pings
// search engines with it after a real deploy) so the two halves can never drift out of sync.
// Rotate by changing this string and letting the next build write the new key file — IndexNow
// just needs *a* key that resolves at keyLocation, not a permanently fixed one.
export const INDEXNOW_KEY = "docracy-indexnow-20260728";
