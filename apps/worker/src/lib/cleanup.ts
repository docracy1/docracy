import { listActiveDocIds, deleteDoc } from "./kv";
import type { DocState, Env } from "@docracy/shared";

/** Deletes every R2 object under a doc's prefix: original/working/final PDFs and any version snapshots. */
export async function deleteDocBlobs(env: Env, docId: string): Promise<void> {
  const prefix = `docs/${docId}/`;
  let cursor: string | undefined;
  do {
    const page = await env.DOCRACY_DOCS.list({ prefix, cursor });
    if (page.objects.length > 0) {
      await env.DOCRACY_DOCS.delete(page.objects.map((o) => o.key));
    }
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
}

/**
 * Deletes R2 blobs (and the KV entry) for every doc whose expiresAt has passed. Runs daily
 * alongside the reminder sweep — see index.ts. Without this, R2 PDFs would never be deleted:
 * R2 has no native TTL, and putDoc deliberately keeps the KV entry alive past expiresAt (see its
 * CLEANUP_GRACE_SECONDS comment) specifically so this sweep has time to run before KV drops it.
 */
export async function runExpiredDocCleanup(env: Env): Promise<void> {
  const docIds = await listActiveDocIds(env);
  for (const docId of docIds) {
    const raw = await env.DOCRACY_KV.get<DocState>(`doc:${docId}`, "json");
    if (!raw) continue;
    if (new Date(raw.expiresAt).getTime() > Date.now()) continue;
    await deleteDocBlobs(env, docId);
    await deleteDoc(env, docId);
  }
}
