import type { DocState, Env } from "@docracy/shared";

const keyFor = (docId: string) => `doc:${docId}`;

export async function getDoc(env: Env, docId: string): Promise<DocState | null> {
  return env.DOCRACY_KV.get<DocState>(keyFor(docId), "json");
}

export async function putDoc(env: Env, doc: DocState): Promise<void> {
  const ttlSeconds = Math.max(60, Math.floor((new Date(doc.expiresAt).getTime() - Date.now()) / 1000));
  await env.DOCRACY_KV.put(keyFor(doc.docId), JSON.stringify(doc), { expirationTtl: ttlSeconds });
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
