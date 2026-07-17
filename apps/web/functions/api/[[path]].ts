// Proxies /api/* same-origin to the worker, so the browser sees docracy.pages.dev on both ends
// instead of a cross-site request to docracy-worker.rl-d77.workers.dev. Without this, the session
// cookie set on login is a third-party cookie from the browser's point of view and gets blocked
// by default in Chrome/Safari — the login "succeeds" server-side but the browser never keeps it.
const WORKER_URL = "https://docracy-worker.rl-d77.workers.dev";

export const onRequest: PagesFunction = async (context) => {
  const url = new URL(context.request.url);
  const target = `${WORKER_URL}${url.pathname}${url.search}`;
  return fetch(new Request(target, context.request));
};
