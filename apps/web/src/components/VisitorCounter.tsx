import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { apiUrl } from "../lib/api";
import { clientSkips, VisibleTimer } from "../lib/visitorCount";

/**
 * Cookieless visitor count (apps/worker/src/lib/visitorCount.ts): one small POST per address change, and when the page
 * is left (next address, tab hidden, page closed) the seconds it was visible. No cookie, nothing in localStorage; the
 * page-view id lives only in this effect. Runs regardless of the cookie banner because it sets nothing in the browser
 * and stores nothing personal. Bodies go as text/plain: a CORS-simple request, so sendBeacon works and there is no
 * preflight.
 */
export default function VisitorCounter() {
  const { pathname } = useLocation();

  useEffect(() => {
    let idPromise: Promise<number | null> = Promise.resolve(null);
    let timer: VisibleTimer | null = null;
    try {
      const nav = navigator as Navigator & { doNotTrack?: string | null; globalPrivacyControl?: boolean };
      const skip = clientSkips({
        path: pathname,
        host: window.location.hostname,
        cookie: document.cookie,
        doNotTrack: nav.doNotTrack,
        gpc: nav.globalPrivacyControl,
        webdriver: nav.webdriver,
      });
      if (skip) return;
      const params = new URLSearchParams(window.location.search);
      const body = JSON.stringify({
        path: pathname,
        referrer: document.referrer || "",
        utmSource: params.get("utm_source") ?? "",
        width: window.innerWidth,
      });
      timer = new VisibleTimer(Date.now(), document.visibilityState === "visible");
      idPromise = fetch(apiUrl("/api/analytics/visit"), {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        credentials: "include",
        keepalive: true,
        body,
      })
        .then((res) => (res.status === 200 ? res.json() : null))
        .then((data: { id?: unknown } | null) => (typeof data?.id === "number" ? data.id : null))
        .catch(() => null);
    } catch {
      // Counting is an extra; it must never break a page.
      return;
    }

    const report = () => {
      if (!timer) return;
      const seconds = timer.seconds(Date.now());
      void idPromise.then((id) => {
        if (id === null) return;
        try {
          const url = apiUrl("/api/analytics/visit/end");
          const payload = JSON.stringify({ id, seconds });
          if (navigator.sendBeacon?.(url, new Blob([payload], { type: "text/plain" }))) return;
          void fetch(url, { method: "POST", headers: { "Content-Type": "text/plain" }, credentials: "include", keepalive: true, body: payload }).catch(() => {});
        } catch {
          // Never break the page.
        }
      });
    };
    const onVisibility = () => {
      if (!timer) return;
      if (document.visibilityState === "visible") timer.show(Date.now());
      else {
        timer.hide(Date.now());
        // The tab may never come back (mobile browsers kill hidden tabs): report now; the worker keeps the larger value.
        report();
      }
    };
    const onPageHide = () => report();
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pagehide", onPageHide);
      report();
      timer = null;
    };
  }, [pathname]);

  return null;
}
