import { Link } from "react-router-dom";
import { usePageMeta } from "../lib/usePageMeta";
import { track } from "../lib/track";

/** Guide-based migration page: DocuSign and eversign don't offer free/self-serve bulk-export
 *  APIs (confirmed by direct research — DocuSign's real API needs a production-enabled account,
 *  eversign's API is paid-only above a 2-envelope sandbox), so there's no honest way to build a
 *  one-click "connect your account" importer without asking users for credentials on another
 *  company's platform. This page instead walks through the manual export each platform already
 *  supports for free, then routes straight into Docracy's existing upload → auto-detect fields →
 *  send flow, which needs zero new backend work. */
export default function ImportGuide() {
  usePageMeta(
    "Switch to Docracy — Import Your DocuSign & eversign Documents",
    "Bring your existing DocuSign or eversign documents and templates over to Docracy. Step-by-step export instructions, no account-linking required.",
    { canonicalPath: "/import-from-docusign-eversign" }
  );

  const onCta = (placement: string) => {
    track("landingpage_cta_clicked", { source: `seo:import-guide:${placement}` });
  };

  return (
    <div>
      <div className="hero-band">
        <div className="hero-inner" style={{ maxWidth: 720 }}>
          <h1>Bring your DocuSign or eversign documents to Docracy</h1>
          <p>
            No account-linking, no handing over your DocuSign or eversign password. Export the PDFs
            you already have — Docracy takes it from there.
          </p>
          <div style={{ marginTop: 20 }}>
            <Link
              to="/prepare?ref=seo-import-guide"
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
        <p>
          Some tools promise a one-click import by asking for your DocuSign or eversign login. We don't
          do that, for two reasons: it would mean handling another company's password, which we treat as
          off-limits — and it wouldn't actually work for most people anyway. DocuSign's API only pulls
          real account data once your account has production API access enabled, which most users on a
          personal or small-business plan don't have. Eversign's API is free only for 2 test envelopes;
          real access starts on a paid API plan. Neither company makes a genuine self-serve bulk-export
          available to an average account.
        </p>
        <p>
          What both platforms <em>do</em> let you do for free, right now, from your own dashboard: download
          your own documents as PDFs, one at a time. That's the real, honest path — and it takes about the
          same amount of time as a "connect account" flow would anyway once you count the review step.
        </p>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 8 }}>Exporting from DocuSign</h2>
        <ol style={{ paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>Sign in to DocuSign and open <strong>Manage</strong>.</li>
          <li style={{ marginBottom: 6 }}>
            Open the completed envelope or reusable template you want to bring over.
          </li>
          <li style={{ marginBottom: 6 }}>
            Use the <strong>Download</strong> action — for a completed envelope this gives you the signed
            PDF; for a template, DocuSign exports a package containing the source document (the
            field/routing setup itself is DocuSign-specific and won't carry over, but the underlying PDF
            will).
          </li>
          <li>Repeat for each document or template you want to keep using.</li>
        </ol>

        <h2 style={{ fontSize: 22, marginTop: 32, marginBottom: 8 }}>Exporting from eversign</h2>
        <ol style={{ paddingLeft: 20 }}>
          <li style={{ marginBottom: 6 }}>
            Sign in to eversign and open <strong>Documents</strong> — check both the Completed and Drafts
            tabs depending on what you need.
          </li>
          <li style={{ marginBottom: 6 }}>Open the document and choose <strong>Download</strong>.</li>
          <li>Repeat for each document — eversign doesn't offer a bulk "download all" button either.</li>
        </ol>

        <h2 style={{ fontSize: 22, marginTop: 40, marginBottom: 8 }}>Once you have the PDF</h2>
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
              send — done in about the same time as the export step above.
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

        <p style={{ marginTop: 32, fontSize: 14 }}>
          <Link to="/docusign-alternative">Why teams switch from DocuSign →</Link>
          {" · "}
          <Link to="/eversign-alternative">Why teams switch from eversign →</Link>
          {" · "}
          <Link to="/free-templates">Browse free templates</Link>
        </p>
      </div>

      <div className="cta-band">
        <p style={{ marginTop: 0, marginBottom: 20 }}>
          Have your export ready? Upload it and see the auto-detected fields in under a minute.
        </p>
        <Link
          to="/prepare?ref=seo-import-guide"
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
