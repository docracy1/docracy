import { useEffect } from "react";
import { track } from "./track";
import { PUBLIC_APP_URL } from "./site";

const SITE = PUBLIC_APP_URL;

export type PageMetaOptions = {
  /** Pathname used for canonical + og:url (e.g. "/es/precios"). */
  canonicalPath?: string;
  /** EN/ES pathnames for hreflang alternates on bilingual pages. */
  alternates?: { en: string; es: string };
};

function upsertLink(rel: string, attrs: Record<string, string>, identityKey: string, identityValue: string) {
  let el = document.head.querySelector<HTMLLinkElement>(`link[${identityKey}="${identityValue}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute(identityKey, identityValue);
    document.head.appendChild(el);
  }
  el.rel = rel;
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

function setMetaBySelector(selector: string, content: string) {
  const el = document.querySelector(selector);
  if (el) el.setAttribute("content", content);
}

/** Sets document.title, meta description, and optional canonical/hreflang/og for a route.
 *  Restores title + description on unmount. Client-only — prerender.mjs injects the same fields
 *  into static HTML because useEffect never runs during static rendering. */
export function usePageMeta(title: string, description: string, options: PageMetaOptions = {}) {
  const { canonicalPath, alternates } = options;

  useEffect(() => {
    // Confirms this hit actually ran a browser's JS engine — paired with the server-side
    // `page_view` the edge middleware writes for every request (bots included, by design, so AI
    // crawlers still get counted). Comparing the two counts per route/day is the same pattern
    // already used for landingpage_loaded vs. landingpage_cta_clicked; a route where this trails
    // page_view by a lot is either heavy non-JS bot traffic or a lot of JS-disabled visitors.
    track("page_view_js");

    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute("content") ?? null;

    document.title = title;
    if (meta) meta.setAttribute("content", description);
    setMetaBySelector('meta[property="og:title"]', title);
    setMetaBySelector('meta[property="og:description"]', description);
    setMetaBySelector('meta[name="twitter:title"]', title);
    setMetaBySelector('meta[name="twitter:description"]', description);

    const managed: HTMLLinkElement[] = [];

    if (canonicalPath) {
      const href = `${SITE}${canonicalPath === "/" ? "/" : canonicalPath}`;
      const canonical = upsertLink("canonical", { href }, "rel", "canonical");
      managed.push(canonical);
      setMetaBySelector('meta[property="og:url"]', href);
    }

    if (alternates) {
      const tags = [
        { hreflang: "en", href: `${SITE}${alternates.en === "/" ? "/" : alternates.en}` },
        { hreflang: "es", href: `${SITE}${alternates.es}` },
        { hreflang: "x-default", href: `${SITE}${alternates.en === "/" ? "/" : alternates.en}` },
      ];
      for (const tag of tags) {
        managed.push(upsertLink("alternate", { href: tag.href, hreflang: tag.hreflang }, "hreflang", tag.hreflang));
      }
    }

    return () => {
      document.title = prevTitle;
      if (meta && prevDescription !== null) meta.setAttribute("content", prevDescription);
      // Leave canonical/hreflang in place — the next page's effect will overwrite them.
      void managed;
    };
  }, [title, description, canonicalPath, alternates?.en, alternates?.es]);
}
