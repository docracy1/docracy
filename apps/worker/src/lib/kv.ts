import type { DocState, Env } from "@docracy/shared";

const keyFor = (docId: string) => `doc:${docId}`;

// KV's own expirationTtl is set well past expiresAt (see putDoc) so the key stays listable long
// enough for the daily cleanup sweep to find and delete the doc's R2 blobs (see cleanup.ts) —
// otherwise a key that KV purges early would leak its PDFs in R2 forever. That means a plain KV
// read can return a doc whose expiresAt has already passed, so every reader must go through this
// function rather than calling DOCRACY_KV.get directly, to keep "expired" exact and consistent.
export async function getDoc(env: Env, docId: string): Promise<DocState | null> {
  const doc = await env.DOCRACY_KV.get<DocState>(keyFor(docId), "json");
  if (doc && new Date(doc.expiresAt).getTime() <= Date.now()) return null;
  return doc;
}

const CLEANUP_GRACE_SECONDS = 3 * 24 * 60 * 60;

export async function putDoc(env: Env, doc: DocState): Promise<void> {
  const ttlSeconds = Math.max(
    60,
    Math.floor((new Date(doc.expiresAt).getTime() - Date.now()) / 1000) + CLEANUP_GRACE_SECONDS
  );
  await env.DOCRACY_KV.put(keyFor(doc.docId), JSON.stringify(doc), { expirationTtl: ttlSeconds });
}

export async function deleteDoc(env: Env, docId: string): Promise<void> {
  await env.DOCRACY_KV.delete(keyFor(docId));
}

export async function listActiveDocIds(env: Env): Promise<string[]> {
  const ids: string[] = [];
  let cursor: string | undefined;
  do {
    const page = await env.DOCRACY_KV.list({ prefix: "doc:", cursor });
    ids.push(...page.keys.map((k) => k.name.slice("doc:".length)));
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);
  return ids;
}

/** The signer whose turn it currently is: first pending signer whose predecessors have all signed. */
export function currentTurnOrder(doc: DocState): number | null {
  const sorted = [...doc.signers].sort((a, b) => a.order - b.order);
  for (const signer of sorted) {
    if (signer.status === "pending") return signer.order;
  }
  return null;
}

export function isSignerOnTurn(doc: DocState, order: number): boolean {
  return currentTurnOrder(doc) === order;
}
