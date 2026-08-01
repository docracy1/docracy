export type BlogTopic =
  | "nda"
  | "contract"
  | "signing"
  | "freelancer"
  | "smallBusiness"
  | "comparison"
  | "legalBasics"
  | "product"
  | "general";

const CLUSTER_TOPIC: Record<string, BlogTopic> = {
  NDA: "nda",
  Contract: "contract",
  Signing: "signing",
  Freelancer: "freelancer",
  "Small Business": "smallBusiness",
  Comparison: "comparison",
  "Legal Basics": "legalBasics",
  Product: "product",
};

export function topicForCluster(cluster?: string): BlogTopic {
  return (cluster && CLUSTER_TOPIC[cluster]) || "general";
}

/** Deterministic per-post gradient (blue/indigo family, matching the brand) — background for the
 *  icon below, not a substitute for it. */
export function gradientForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  const hue = 195 + (hash % 55);
  const hue2 = hue + 20 + (hash % 25);
  return `linear-gradient(135deg, hsl(${hue}, 70%, 42%), hsl(${hue2}, 75%, 22%))`;
}

/** A real, honest illustration of what the post is actually about, instead of a flat color
 *  swatch — no fabricated stock photos or invented author headshots (this app has neither), just
 *  a clean topic icon in the same hand-drawn style as Landing.tsx's FeatureIcon. `nda`/`contract`/
 *  `signing`/`product` reuse those exact paths verbatim for cross-page visual consistency. */
export function BlogHeroArt({ topic, size = 56 }: { topic: BlogTopic; size?: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "rgba(255,255,255,0.92)",
    strokeWidth: 1.4,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (topic) {
    case "nda":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5.5c0 5-3.5 8-7 9.5-3.5-1.5-7-4.5-7-9.5V6l7-3z" />
          <path d="M9 12l2 2 4-4" />
        </svg>
      );
    case "contract":
      return (
        <svg {...common}>
          <rect x="8" y="8" width="12" height="13" rx="1.5" />
          <path d="M4 15V4.5A1.5 1.5 0 0 1 5.5 3H15" />
        </svg>
      );
    case "signing":
      return (
        <svg {...common}>
          <path d="M15 4l5 5-9.5 9.5H6v-4.5L15 4z" />
          <path d="M4 20c2-1.2 4-1.2 6 0" />
        </svg>
      );
    case "freelancer":
      return (
        <svg {...common}>
          <rect x="4" y="4" width="16" height="11" rx="1.5" />
          <path d="M2 18.5h20l-1.2 1.8a1.5 1.5 0 0 1-1.25.7H4.45a1.5 1.5 0 0 1-1.25-.7L2 18.5z" />
        </svg>
      );
    case "smallBusiness":
      return (
        <svg {...common}>
          <path d="M3 9l1.5-5h15L21 9" />
          <path d="M4 9v12h16V9" />
          <path d="M9 21v-6h6v6" />
        </svg>
      );
    case "comparison":
      return (
        <svg {...common}>
          <rect x="3" y="5" width="8" height="14" rx="1.5" />
          <rect x="13" y="5" width="8" height="14" rx="1.5" />
          <path d="M12 6v12" strokeDasharray="2 2" />
        </svg>
      );
    case "legalBasics":
      return (
        <svg {...common}>
          <path d="M12 3v18" />
          <path d="M5 7h14" />
          <path d="M5 7l-2.5 5a2.5 2.5 0 0 0 5 0L5 7z" />
          <path d="M19 7l-2.5 5a2.5 2.5 0 0 0 5 0L19 7z" />
          <path d="M8 21h8" />
        </svg>
      );
    case "product":
      return (
        <svg {...common}>
          <path d="M12 3l1.4 4.6L18 9l-4.6 1.4L12 15l-1.4-4.6L6 9l4.6-1.4L12 3z" />
          <path d="M19 15l0.7 2.3L22 18l-2.3 0.7L19 21l-0.7-2.3L16 18l2.3-0.7L19 15z" />
        </svg>
      );
    case "general":
    default:
      return (
        <svg {...common}>
          <rect x="6" y="3" width="12" height="18" rx="1.5" />
          <path d="M9 8h6M9 12h6M9 16h3" />
        </svg>
      );
  }
}
