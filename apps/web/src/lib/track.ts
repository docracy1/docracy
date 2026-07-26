import { apiUrl } from "./api";

/** The client-fireable subset of the worker's FunnelEvent union — kept in sync with
 *  CLIENT_TRACKABLE_EVENTS in apps/worker/src/routes/analytics.ts (that allow-list is the one
 *  that actually matters; this is just so callers here get autocomplete/typo-checking). */
export type ClientTrackableEvent =
  | "document_upload_started"
  | "document_uploaded"
  | "fields_added"
  | "template_opened"
  | "template_used"
  | "template_category_viewed"
  | "template_preview_opened"
  | "template_started"
  | "template_abandoned"
  | "dashboard_loaded"
  | "landingpage_cta_clicked"
  | "blog_cta_clicked"
  | "upload_failed"
  | "field_error";

export interface TrackExtra {
  documentId?: string;
  templateId?: string;
  source?: string;
  templateCategory?: string;
  errorCode?: string;
}

/** Fire-and-forget client-side analytics event. `keepalive: true` is what makes this safe to call
 *  from a page-unload/route-change cleanup (e.g. template_abandoned) — a plain fetch there would
 *  otherwise routinely get cancelled mid-flight as the page navigates away. Never throws: a failed
 *  or blocked (ad-blocker, offline) analytics call must never surface as an error to the caller. */
export function track(event: ClientTrackableEvent, extra: TrackExtra = {}): void {
  try {
    fetch(apiUrl("/api/analytics/track"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      keepalive: true,
      body: JSON.stringify({ event, route: window.location.pathname, ...extra }),
    }).catch(() => {});
  } catch {
    // Same-origin/CSP oddities, ad blockers, etc. — analytics must never break the page.
  }
}
