/** Maps a blog slug/topic to the most relevant competitor-alternative money page. */
export function blogAlternativePath(slug: string): string {
  const s = slug.toLowerCase();
  if (s.includes("hellosign") && s.includes("signnow")) return "/hellosign-vs-signnow";
  if (s.includes("pandadoc")) return "/pandadoc-alternative";
  if (s.includes("adobe")) return "/adobe-sign-alternative";
  if (s.includes("eversign") || s.includes("xodo")) return "/eversign-alternative";
  if (s.includes("signnow")) return "/signnow-alternative";
  if (s.includes("hellosign") || s.includes("dropbox-sign")) return "/hellosign-alternative";
  if (s.includes("docusign")) return "/docusign-alternative";
  if (s.includes("freelanc") || s.includes("contract") || s.includes("nda")) return "/nda-signing";
  return "/docusign-alternative";
}

/** Default free-template deep link for blog CTAs (W-9 posts upload blank PDF). */
export function blogTemplatePath(slug: string): string {
  if (slug.toLowerCase().includes("w-9")) return "/prepare?ref=blog-w9";
  return "/free-templates/mutual-nda";
}
