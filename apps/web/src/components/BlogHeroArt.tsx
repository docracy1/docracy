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

/** Deterministic per-post gradient (blue/indigo family, matching the brand) — shown as the hero's
 *  own background so there's no flash of white while the real screenshot below loads in. */
export function gradientForSlug(slug: string): string {
  let hash = 0;
  for (let i = 0; i < slug.length; i++) hash = (hash * 31 + slug.charCodeAt(i)) >>> 0;
  const hue = 195 + (hash % 55);
  const hue2 = hue + 20 + (hash % 25);
  return `linear-gradient(135deg, hsl(${hue}, 70%, 42%), hsl(${hue2}, 75%, 22%))`;
}

function hashString(s: string): number {
  let hash = 0;
  for (let i = 0; i < s.length; i++) hash = (hash * 31 + s.charCodeAt(i)) >>> 0;
  return hash;
}

/** Real screenshots of Docracy's own product — several per topic, captured directly from the
 *  running app (see apps/web/public/blog/*-shot.png) — not stock photos or fabricated people.
 *  Multiple variants per topic so posts sharing a topic don't all show the identical image. */
const TOPIC_IMAGES: Record<BlogTopic, string[]> = {
  nda: ["/blog/nda-shot.png", "/blog/nda2-shot.png", "/blog/nda3-shot.png"],
  contract: ["/blog/contract-shot.png", "/blog/contract2-shot.png", "/blog/contract3-shot.png"],
  signing: ["/blog/signing-shot.png", "/blog/signing2-shot.png", "/blog/signing3-shot.png"],
  freelancer: ["/blog/freelancer-shot.png", "/blog/freelancer2-shot.png", "/blog/freelancer3-shot.png"],
  smallBusiness: ["/blog/smallbusiness-shot.png", "/blog/smallbiz2-shot.png", "/blog/product-shot.png"],
  comparison: ["/blog/comparison-shot.png"],
  legalBasics: ["/blog/legal-shot.png"],
  product: ["/blog/product-shot.png"],
  general: ["/blog/general-shot.png"],
};

const TOPIC_ALT: Record<BlogTopic, string> = {
  nda: "A mutual NDA template loaded in Docracy's document editor",
  contract: "A contract template loaded in Docracy's document editor",
  signing: "Placing or completing a signature field on a document in Docracy",
  freelancer: "A free freelance-relevant template in Docracy's template library",
  smallBusiness: "Docracy's free template library",
  comparison: "Docracy's pricing plans compared side by side",
  legalBasics: "Docracy's Trust & Security page",
  product: "Docracy's AI tools panel for contract review",
  general: "Docracy's documentation",
};

/** One specific screenshot of that competitor's own comparison page — used for the 5 hand-written
 *  BLOG_POSTS competitor articles (lib/blog.ts), which each already have their own real /x-alternative
 *  marketing page to show, rather than a topic-rotated generic image. */
const COMPETITOR_IMAGE: Record<string, string> = {
  eversign: "/blog/eversign-shot.png",
  docusign: "/blog/docusign-shot.png",
  pandadoc: "/blog/pandadoc-shot.png",
  adobesign: "/blog/adobesign-shot.png",
  hellosign: "/blog/hellosign-shot.png",
};

export function imageForCompetitor(competitorKey: string): string {
  return COMPETITOR_IMAGE[competitorKey] ?? TOPIC_IMAGES.comparison[0];
}

/** Picks a real screenshot for a topic — deterministic per slug (so the index page and the post's
 *  own detail page always agree), and spread across that topic's available variants so five NDA
 *  posts don't all show the exact same picture. */
export function imageForSlug(slug: string, topic: BlogTopic): string {
  const variants = TOPIC_IMAGES[topic];
  return variants[hashString(slug) % variants.length];
}

export function BlogHeroArt({ slug, topic }: { slug: string; topic: BlogTopic }) {
  return (
    <img
      src={imageForSlug(slug, topic)}
      alt={TOPIC_ALT[topic]}
      loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
    />
  );
}

export function CompetitorHeroArt({ competitorKey }: { competitorKey: string }) {
  return (
    <img
      src={imageForCompetitor(competitorKey)}
      alt={`Docracy's comparison page for ${competitorKey}`}
      loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
    />
  );
}
