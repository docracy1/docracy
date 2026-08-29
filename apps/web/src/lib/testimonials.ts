/** Homepage testimonial cards — shared by Landing.tsx and Review JSON-LD. */
export interface TestimonialEntry {
  quoteKey: string;
  name: string;
  titleKey: string;
  company: string | null;
  logo: string | null;
  avatar?: string;
}

export const TESTIMONIALS: TestimonialEntry[] = [
  {
    quoteKey: "testimonial.1.quote",
    name: "DACH Advisory",
    titleKey: "testimonial.1.title",
    company: null,
    logo: "/testimonials/dach-advisory.png",
  },
  {
    quoteKey: "testimonial.2.quote",
    name: "Abaseh Mirvali",
    titleKey: "testimonial.2.title",
    company: null,
    logo: null,
  },
  {
    quoteKey: "testimonial.3.quote",
    name: "Marc Brandsma",
    titleKey: "testimonial.3.title",
    company: null,
    logo: "/culttech-logo.png",
  },
  {
    quoteKey: "testimonial.4.quote",
    name: "Laurenz Gröbner",
    titleKey: "testimonial.4.title",
    company: null,
    logo: "/testimonials/hellocash.png",
  },
  {
    quoteKey: "testimonial.5.quote",
    name: "Dietmar Grünstäudl",
    titleKey: "testimonial.5.title",
    company: null,
    logo: "/testimonials/ae-entsorgungssysteme.png",
  },
  {
    quoteKey: "testimonial.6.quote",
    name: "Otto Schweinzer",
    titleKey: "testimonial.6.title",
    company: null,
    logo: "/testimonials/volpini.png",
  },
  {
    quoteKey: "testimonial.7.quote",
    name: "Johannes Sornig",
    titleKey: "testimonial.7.title",
    company: null,
    logo: "/testimonials/kapsch.png",
  },
  {
    quoteKey: "testimonial.8.quote",
    name: "Joachim Zimmel",
    titleKey: "testimonial.8.title",
    company: null,
    logo: "/testimonials/akg.png",
  },
  {
    quoteKey: "testimonial.9.quote",
    name: "Herbert Utz",
    titleKey: "testimonial.9.title",
    company: null,
    logo: "/testimonials/faun-austria.png",
  },
  {
    quoteKey: "testimonial.11.quote",
    name: "Stephan Orasch",
    titleKey: "testimonial.11.title",
    company: null,
    logo: "/testimonials/grohmann-hienert-zierhut.jpg",
  },
  {
    quoteKey: "testimonial.12.quote",
    name: "Bettina Authried",
    titleKey: "testimonial.12.title",
    company: null,
    logo: null,
  },
];

/** Review + AggregateRating JSON-LD — quotes must match visible homepage cards. */
export function testimonialsJsonLd(quoteFor: (key: string) => string, titleFor: (key: string) => string) {
  const reviews = TESTIMONIALS.map((entry) => ({
    "@type": "Review",
    author: { "@type": "Person", name: entry.name },
    reviewBody: quoteFor(entry.quoteKey),
    name: titleFor(entry.titleKey) || entry.name,
    reviewRating: { "@type": "Rating", ratingValue: 5, bestRating: 5 },
  }));
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Docracy",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: 5,
      reviewCount: reviews.length,
      bestRating: 5,
    },
    review: reviews,
  };
}
