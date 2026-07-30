import type { Env, SignerAttachment } from "@docracy/shared";

export const DEFAULT_MAX_FILES = 3;
export const DEFAULT_MAX_BYTES = 5 * 1024 * 1024; // 5MB
/** Hard caps regardless of client-supplied create metadata. */
export const HARD_MAX_FILES = 10;
export const HARD_MAX_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_ATTACHMENT_FILENAME_LENGTH = 200;

const ALLOWED_MIME = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

/** Clamp client-supplied limits into safe server bounds. */
export function clampAttachmentLimits(cfg?: { maxFiles?: number; maxBytesPerFile?: number }) {
  const rawFiles = cfg?.maxFiles ?? DEFAULT_MAX_FILES;
  const rawBytes = cfg?.maxBytesPerFile ?? DEFAULT_MAX_BYTES;
  const maxFiles = Math.min(HARD_MAX_FILES, Math.max(1, Math.floor(Number(rawFiles) || DEFAULT_MAX_FILES)));
  const maxBytesPerFile = Math.min(
    HARD_MAX_BYTES,
    Math.max(1, Math.floor(Number(rawBytes) || DEFAULT_MAX_BYTES))
  );
  return { maxFiles, maxBytesPerFile };
}

export function attachmentLimits(doc: { signerAttachments?: { maxFiles?: number; maxBytesPerFile?: number } }) {
  return clampAttachmentLimits(doc.signerAttachments);
}

export function sanitizeFilename(name: string): string {
  const base = name.replace(/[^\w.\-() ]+/g, "_").trim() || "attachment";
  return base.slice(0, MAX_ATTACHMENT_FILENAME_LENGTH);
}

export function isAllowedAttachmentType(mime: string): boolean {
  return ALLOWED_MIME.has(mime);
}

export async function storeSignerAttachment(
  env: Env,
  docId: string,
  signerOrder: number,
  file: File
): Promise<SignerAttachment> {
  const id = crypto.randomUUID();
  const name = sanitizeFilename(file.name || "attachment");
  const r2Key = `docs/${docId}/attachments/${signerOrder}/${id}-${name}`;
  const bytes = new Uint8Array(await file.arrayBuffer());
  await env.DOCRACY_DOCS.put(r2Key, bytes, {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });
  return {
    id,
    name,
    r2Key,
    sizeBytes: bytes.byteLength,
    uploadedAt: new Date().toISOString(),
  };
}
