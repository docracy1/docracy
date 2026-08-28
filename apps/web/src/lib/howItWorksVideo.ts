/** Shared landing “how it works” demo video assets (absolute URLs for schema / OG). */
export const HOW_IT_WORKS_VIDEO = {
  path: "/videos/how-it-works.webm",
  posterPath: "/videos/how-it-works-poster.jpg",
  /** ISO 8601 duration — keep in sync with apps/web/scripts/record-how-it-works.mjs */
  durationIso: "PT1M3S",
  /** When the current cut was published (schema.org uploadDate). */
  uploadDate: "2026-08-04",
  contentUrl: "https://docracy.io/videos/how-it-works.webm",
  posterUrl: "https://docracy.io/videos/how-it-works-poster.jpg",
  embedUrl: "https://docracy.io/how-it-works",
} as const;
