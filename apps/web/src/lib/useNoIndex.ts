import { useEffect } from "react";

/**
 * Signing/status URLs carry the actual bearer token that grants access to a document — robots.txt
 * already tells well-behaved crawlers to skip them, but this is defense in depth in case a link
 * ever gets followed anyway (a browser extension, a link-preview bot, a misconfigured crawler).
 */
export function useNoIndex() {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.name = "robots";
    meta.content = "noindex, nofollow";
    document.head.appendChild(meta);
    return () => {
      document.head.removeChild(meta);
    };
  }, []);
}
