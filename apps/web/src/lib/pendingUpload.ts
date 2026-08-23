/** Hands a File off from the homepage hero's upload widget to /prepare across a client-side
 *  route change — a plain in-memory singleton is enough since React Router never unmounts the JS
 *  runtime for that navigation, and a File can't be serialized into a URL or sessionStorage
 *  without a wasteful base64 round-trip. Doesn't survive a hard refresh, which is fine: Prepare
 *  just falls back to its normal empty upload state in that rare case. */
let pendingFile: File | null = null;

export function setPendingUploadFile(file: File): void {
  pendingFile = file;
}

export function takePendingUploadFile(): File | null {
  const file = pendingFile;
  pendingFile = null;
  return file;
}
