import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { IMPORT_GUIDE_PAGES } from "../lib/marketingPages";
import { track } from "../lib/track";

/** One dedicated import-guide page per competitor — mounted at a distinct literal route per
 *  slug (see main.tsx), not a `:slug` param, so each gets its own indexable URL. No "Connect
 *  your account" flow anywhere: none of the five platforms give a free, general-purpose bulk-
 *  export API a typical individual account can actually use (see IMPORT_GUIDE_PAGES.whyNoConnect
 *  per platform), so this walks through the manual export each one already supports for free. */
export default function ImportGuidePage({ slug }: { slug: string }) {
  const page = IMPORT_GUIDE_PAGES.find((p) => p.slug === slug);

  usePageMeta(page?.seoTitle ?? "Docracy", page?.seoDescription ?? "", {
    canonicalPath: `/import-from-${slug}`,
  });

  if (!page) return null;

  const ctaTo = `/prepare?ref=seo-import-${page.slug}`;
  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:import-${page.slug}:${placement}` });
  };

  const otherGuides = IMPORT_GUIDE_PAGES.filter((p) => p.slug !== page.slug);

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <h1>{page.heroHeadline}</h1>
          <p>{page.heroSubheadline}</p>
          <div style={{ marginTop: 20 }}>
            <Link
              to={ctaTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              Upload a document now
            </Link>
          </div>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 720 }}>
        <h2 style={{ fontSize: 22, marginTop: 40 }}>Why there's no "Connect your account" button</h2>
        <p>{page.whyNoConnect}</p>

        <h2 style={{ fontSize: 22, marginTop: 32, marginBottom: 8 }}>Exporting from {page.competitorName}</h2>
        <ol style={{ paddingLeft: 20 }}>
          {page.exportSteps.map((step, i) => (
            <li key={i} style={{ marginBottom: 6 }}>
              {step}
            </li>
          ))}
        </ol>
        <p style={{ fontSize: 14, color: "var(--mute)" }}>{page.templateNote}</p>

        <h2 style={{ fontSize: 22, marginTop: 32, marginBottom: 8 }}>Once you have the PDF</h2>
        <p>
          Upload it to Docracy the same way you'd upload any file. Our AI field detection scans the page
          and suggests where signature, date, and text fields probably go — usually faster than placing
          them by hand, especially on a form you already know well.
        </p>
        <div className="core-features-grid">
          <div className="core-feature-card">
            <h3>Just sending it once?</h3>
            <p>
              Free, no account needed. Upload the PDF, review the auto-detected fields, add signers, and
              send.
            </p>
          </div>
          <div className="core-feature-card">
            <h3>Reusing it as a template?</h3>
            <p>
              Save it as a Docracy template so you (or your team) can reuse the same field layout every
              time — a paid-plan feature ($10/mo flat, unlimited templates and signers).
            </p>
          </div>
        </div>

        <h2 style={{ fontSize: 22, marginTop: 32, marginBottom: 8 }}>Where your documents end up</h2>
        <p>
          Docracy isn't a long-term archive by design — completed documents and their audit trail are
          encrypted and automatically deleted after a short retention window (9 days by default), the same
          as everything else on the platform. If you're migrating documents over, you'll want them to land
          somewhere permanent, not just disappear again.
        </p>
        <p>
          A paid account ($10/mo) can connect Dropbox, OneDrive, Box, or Google Drive — once linked, every
          completed document auto-uploads there the moment everyone's signed, so it lives in your own
          storage going forward. Zapier and webhooks cover any other destination (a CRM, a shared drive, an
          internal tool) if none of those four fit.
        </p>
        <p style={{ fontSize: 14 }}>
          <Link to="/docs">See all connectors →</Link>
        </p>

        <p style={{ marginTop: 32, fontSize: 14 }}>
          <Link to={`/${page.alternativeSlug}`}>Why teams switch from {page.competitorName} →</Link>
        </p>
        <p style={{ marginTop: 8, fontSize: 14 }}>
          Importing from somewhere else?{" "}
          {otherGuides.map((g, i) => (
            <span key={g.slug}>
              {i > 0 && " · "}
              <Link to={`/import-from-${g.slug}`}>{g.competitorName}</Link>
            </span>
          ))}
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>
          Have your export ready? Upload it and see the auto-detected fields in under a minute.
        </p>
        <Link
          to={ctaTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          Upload a document now
        </Link>
      </div>
    </div>
  );
}
