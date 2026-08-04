import { Link, useParams, useSearchParams } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { OUTREACH_PAGES } from "../lib/marketingPages";
import { track } from "../lib/track";

/** Dedicated landing page for cold-outreach clicks — a homepage pitches Docracy to someone who
 *  already wants e-signatures; an outreach lead just got a DM/email out of nowhere and needs a
 *  different opening: why they were contacted, what problem it solves for them, then a fast way
 *  to try it. Mounted at /outreach/:persona (see main.tsx) with persona keys matching the
 *  /go/dm-* short-link campaigns in ShortLinkRedirect.tsx. */
export default function OutreachLanding() {
  const { persona } = useParams<{ persona: string }>();
  const [searchParams] = useSearchParams();
  const page = OUTREACH_PAGES.find((p) => p.persona === persona) ?? OUTREACH_PAGES.find((p) => p.persona === "general")!;
  const freeTemplate = searchParams.get("freeTemplate") || page.freeTemplate;

  usePageMeta("Docracy — the document you were sent", "", { canonicalPath: `/outreach/${page.persona}` });

  const ctaTo = `/prepare?freeTemplate=${freeTemplate}&ref=outreach-landing-${page.persona}`;
  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `outreach:${page.persona}:${placement}` });
  };

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 640 }}>
          <div className="hero-eyebrow">{page.eyebrow}</div>
          <h1>{page.whyReachedOut}</h1>
          <div style={{ marginTop: 20 }}>
            <Link
              to={ctaTo}
              className="btn-primary btn-lg"
              style={{ display: "inline-block", textDecoration: "none" }}
              onClick={() => onCta("hero")}
            >
              {page.ctaLabel}
            </Link>
          </div>
          <p className="hero-cta-hint">No account needed — takes about 30 seconds.</p>
        </div>
      </div>

      <div className="container" style={{ maxWidth: 640 }}>
        <h2 style={{ fontSize: 20, marginTop: 40, marginBottom: 8 }}>What this solves for you</h2>
        <p>{page.problemSolved}</p>

        <h2 style={{ fontSize: 20, marginTop: 32, marginBottom: 8 }}>How it works</h2>
        <ol style={{ paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Open the sample document — it's already pre-filled with a matching template.</li>
          <li style={{ marginBottom: 6 }}>Edit it, add your own signer, or just try the signing flow as-is.</li>
          <li>No account, no card, no email confirmation before you can try it.</li>
        </ol>

        <p style={{ marginTop: 24, fontSize: 13.5 }}>
          Not what you were expecting, or not a fit? No hard feelings — <Link to="/">see the full product</Link> instead,
          or just close the tab.
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>{page.ctaLabel}</p>
        <Link
          to={ctaTo}
          className="btn-primary btn-lg"
          style={{ display: "inline-block", textDecoration: "none" }}
          onClick={() => onCta("footer")}
        >
          {page.ctaLabel}
        </Link>
      </div>
    </div>
  );
}
