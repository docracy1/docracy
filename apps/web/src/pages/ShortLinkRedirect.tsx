import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { seedAttribution } from "../lib/attribution";

/**
 * Short shareable URLs for outreach / social / launches.
 * Prefer these over long UTM strings — attribution is seeded here, then we land on Prepare.
 *
 * Also mirrored in public/_redirects so cold hits get a 302 before the SPA boots.
 */
const SHORT_LINKS: Record<string, { to: string; source: string; campaign?: string }> = {
  try: { to: "/prepare?freeTemplate=mutual-nda", source: "try" },
  nda: { to: "/prepare?freeTemplate=mutual-nda", source: "nda" },
  price: { to: "/pricing", source: "price" },
  ph: { to: "/prepare?freeTemplate=mutual-nda", source: "producthunt", campaign: "launch" },
  hn: { to: "/prepare?freeTemplate=mutual-nda", source: "hackernews", campaign: "showhn" },
  li: { to: "/prepare?freeTemplate=mutual-nda", source: "linkedin" },
  x: { to: "/prepare?freeTemplate=mutual-nda", source: "x" },
  dm: { to: "/prepare?freeTemplate=mutual-nda", source: "outreach", campaign: "dm" },
  // One per directory listing, so each shows up as its own row in the admin "Tagged campaign
  // clicks" table instead of all merging into the generic /try bucket with no way to tell which
  // directory actually sent the click.
  si: { to: "/prepare?freeTemplate=mutual-nda", source: "startupinspire", campaign: "listing" },
  ti: { to: "/prepare?freeTemplate=mutual-nda", source: "techimply", campaign: "listing" },
  gl: { to: "/mcp", source: "glama", campaign: "listing" },
  sh: { to: "/prepare?freeTemplate=mutual-nda", source: "saashub", campaign: "listing" },
  at: { to: "/prepare?freeTemplate=mutual-nda", source: "alternativeto", campaign: "listing" },
};

export function ShortTryRedirect() {
  return <ShortRedirect entry={SHORT_LINKS.try} />;
}

export function ShortNdaRedirect() {
  return <ShortRedirect entry={SHORT_LINKS.nda} />;
}

export function ShortPriceRedirect() {
  return <ShortRedirect entry={SHORT_LINKS.price} />;
}

export function ShortGoRedirect() {
  const { campaign } = useParams<{ campaign: string }>();
  const entry = campaign ? SHORT_LINKS[campaign] : undefined;
  if (!entry) {
    return <ShortRedirect entry={{ to: "/prepare?freeTemplate=mutual-nda", source: "go", campaign: campaign ?? "" }} />;
  }
  return <ShortRedirect entry={entry} />;
}

function ShortRedirect({ entry }: { entry: { to: string; source: string; campaign?: string } }) {
  const navigate = useNavigate();
  useEffect(() => {
    seedAttribution(entry.source, entry.campaign ?? "", "shortlink");
    navigate(entry.to, { replace: true });
  }, [entry, navigate]);
  return (
    <div className="container">
      <p>Taking you to Docracy…</p>
    </div>
  );
}
