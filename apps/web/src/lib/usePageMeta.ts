import { useEffect } from "react";

/** Sets document.title and the meta description for a single page, restoring the app's default
 *  (from index.html) on unmount — this is a client-rendered SPA with no per-route SSR, so this is
 *  the only way search engines and social previews see anything other than the shared homepage
 *  title/description on every route. */
export function usePageMeta(title: string, description: string) {
  useEffect(() => {
    const prevTitle = document.title;
    const meta = document.querySelector('meta[name="description"]');
    const prevDescription = meta?.getAttribute("content") ?? null;

    document.title = title;
    if (meta) meta.setAttribute("content", description);

    return () => {
      document.title = prevTitle;
      if (meta && prevDescription !== null) meta.setAttribute("content", prevDescription);
    };
  }, [title, description]);
}
