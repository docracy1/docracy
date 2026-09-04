const SITE = "https://docracy.io";

function abs(path: string): string {
  return path === "/" ? `${SITE}/` : `${SITE}${path}`;
}

/** BreadcrumbList JSON-LD for public product / SEO landings. */
export function breadcrumbJsonLd(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: abs(item.path),
    })),
  };
}

/** HowTo JSON-LD — visible steps should match on-page copy. */
export function howToJsonLd(name: string, description: string, steps: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name,
    description,
    step: steps.map((text, i) => ({
      "@type": "HowToStep",
      position: i + 1,
      name: text,
      text,
    })),
  };
}
