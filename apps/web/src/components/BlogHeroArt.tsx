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

/** Real screenshots of Docracy's own product, one per topic — captured directly from the running
 *  app (see scripts/ — apps/web/public/blog/*-shot.png), not stock photos or fabricated people.
 *  Genuinely honest "here's what this actually looks like" imagery instead of an abstract icon. */
const TOPIC_IMAGE: Record<BlogTopic, string> = {
  nda: "/blog/nda-shot.png",
  contract: "/blog/contract-shot.png",
  signing: "/blog/signing-shot.png",
  freelancer: "/blog/freelancer-shot.png",
  smallBusiness: "/blog/smallbusiness-shot.png",
  comparison: "/blog/comparison-shot.png",
  legalBasics: "/blog/legal-shot.png",
  product: "/blog/product-shot.png",
  general: "/blog/general-shot.png",
};

const TOPIC_ALT: Record<BlogTopic, string> = {
  nda: "A mutual NDA template loaded in Docracy's document editor",
  contract: "An independent contractor agreement loaded in Docracy's document editor",
  signing: "Placing a signature field onto a document in Docracy",
  freelancer: "A free freelance service agreement template in Docracy's template library",
  smallBusiness: "Docracy's free template library",
  comparison: "Docracy's pricing plans compared side by side",
  legalBasics: "Docracy's Trust & Security page",
  product: "Docracy's AI tools panel for contract review",
  general: "Docracy's documentation",
};

export function BlogHeroArt({ topic }: { topic: BlogTopic }) {
  return (
    <img
      src={TOPIC_IMAGE[topic]}
      alt={TOPIC_ALT[topic]}
      loading="lazy"
      style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "top", display: "block" }}
    />
  );
}
