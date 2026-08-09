import { Link } from "react-router-dom";

import { useT } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";

export default function Privacy() {
  const t = useT();
  usePageMeta(
    "Privacy — Docracy",
    "How Docracy collects, uses, and retains personal data for anonymous and account-based document signing.",
    { canonicalPath: "/privacy" }
  );
  return (
    <div className="container" style={{ maxWidth: 720 }}>
      <h1>{t("privacy.title")}</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        This describes what Docracy's software actually does with your data today. It hasn't been reviewed
        by a lawyer — treat it as an accurate technical description, not a legal guarantee. Security and
        subprocessors: <Link to="/trust">Trust &amp; security</Link>. Account processing terms:{" "}
        <Link to="/dpa">DPA</Link>.
      </p>

      <h3>{t("privacy.collect")}</h3>
      <p>
        No accounts, no passwords for the free signing flow. When you prepare a document, we collect the name
        and email address of each signer (and, optionally, the preparer's email so they can bookmark a status
        link) — that's what's needed to send signing invitations and reminders. The PDF you upload is stored so
        signers can view and sign it. Paid workspaces also store account email, workspace settings, templates,
        contacts, and team membership.
      </p>

      <h3>{t("privacy.audit")}</h3>
      <p>
        When someone views, consents to, or signs a document, we record the IP address, browser user-agent,
        timestamp, and a cryptographic hash of the document at that point. This exists to give the signed
        document evidentiary weight — proof of what was signed and when — not to track anyone beyond that
        document's signing chain.
      </p>

      <h3>{t("privacy.retention")}</h3>
      <p>
        Anonymous documents and their associated data are automatically deleted 9 days after creation by default
        (or sooner, once everyone has signed and the final copy has been emailed out). Paid workspace history and
        templates remain until you delete them or close the account.
      </p>

      <h3>{t("privacy.analytics")}</h3>
      <p>
        We log anonymous, aggregate counts of page views and key actions (e.g. a document being created or
        completed) on our public pages — which page, and whether the visitor's browser/crawler user-agent
        matches a known AI crawler (like GPTBot or ClaudeBot) or looks like a regular browser. We don't store
        IP addresses, cookies, or any other identifier alongside this — it's not linked to you, and it isn't
        used for advertising or shared with any ad network.
      </p>

      <h3>{t("privacy.thirdParties")}</h3>
      <p>
        We use Cloudflare (hosting and related services), Resend (email), Stripe (paid billing), and optionally
        Google (sign-in / Drive), Dropbox, Microsoft, or Box when you connect them. The full subprocessor list
        is on <Link to="/trust">Trust &amp; security</Link>. We don't use advertising trackers, and we don't sell
        your data.
      </p>

      <h3>{t("privacy.contact")}</h3>
      <p>
        Questions about your data? Reach out at <a href="mailto:founder@docracy.io">founder@docracy.io</a>, or use
        the feedback form on the homepage.
      </p>
    </div>
  );
}
