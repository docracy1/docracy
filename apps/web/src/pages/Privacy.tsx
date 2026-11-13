import { Link } from "react-router-dom";

import { useT } from "../lib/i18n";
import { usePageMeta } from "../lib/usePageMeta";

export default function Privacy() {
  const t = useT();
  usePageMeta(
    "Privacy Policy — How Docracy Handles Your Data",
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
      <p>
        To see how long visitors stay, we also run our own cookieless visitor count on the public pages. For each page
        view we store: the day and time, the page address (without query parameters), the kind of page, the website you
        came from (only its domain name, e.g. google.com, or a utm_source tag), the device class (mobile, tablet,
        desktop, from the window width), the country (from Cloudflare), whether the network is a data centre or a regular
        internet provider (one word, derived from the network number Cloudflare reports; the number itself is not
        stored), how many seconds the page was visible, and a visitor code. The visitor code is a one-way hash of the
        day, a secret value, your IP address and your browser's user-agent string, cut to 16 characters; it changes
        every day, so we can tell page views of the same day apart but cannot follow anyone across days or identify
        them. Your IP address itself is never stored. No cookie is set and nothing is written to your browser's
        storage for this, which is why it runs without a consent banner. Signing, status and other links that contain
        a personal token are never counted, nor are known bots, our own admins, or browsers that send Do Not Track or
        Global Privacy Control. The rows are kept for 180 days and then deleted automatically. Legal basis: our
        legitimate interest in understanding how the site is used (Art. 6(1)(f) GDPR).
      </p>
      <p>
        Google Analytics and Microsoft Clarity are only loaded if you click Accept in the cookie banner; if you
        decline or ignore it, they are not loaded.
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
