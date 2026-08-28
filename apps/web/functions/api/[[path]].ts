// Proxies /api/* same-origin to the worker, so the browser sees the app origin on both ends instead
// of a cross-site request to the workers.dev host. Without this, the session cookie set on login
// is a third-party cookie from the browser's point of view and gets blocked by default in
// Chrome/Safari — the login "succeeds" server-side but the browser never keeps it.
import { resolveSiteEnv, type SiteBindings } from "./_site";

export const onRequest: PagesFunction<SiteBindings> = async (context) => {
  const { workerUrl } = resolveSiteEnv(context.env);
  const url = new URL(context.request.url);
  const target = `${workerUrl}${url.pathname}${url.search}`;
  return fetch(new Request(target, context.request));
};
