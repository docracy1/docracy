export default function Privacy() {
  return (
    <div className="container">
      <h1>Privacy</h1>
      <p style={{ fontSize: 13, color: "var(--mute)" }}>
        This describes what Docracy's software actually does with your data today. It hasn't been reviewed
        by a lawyer — treat it as an accurate technical description, not a legal guarantee.
      </p>

      <h3>What we collect</h3>
      <p>
        No accounts, no passwords. When you prepare a document, we collect the name and email address of
        each signer (and, optionally, the preparer's email so they can bookmark a status link) — that's
        what's needed to send signing invitations and reminders. The PDF you upload is stored so signers can
        view and sign it.
      </p>

      <h3>Audit trail</h3>
      <p>
        When someone views, consents to, or signs a document, we record the IP address, browser user-agent,
        timestamp, and a cryptographic hash of the document at that point. This exists to give the signed
        document evidentiary weight — proof of what was signed and when — not to track anyone beyond that
        document's signing chain.
      </p>

      <h3>Retention</h3>
      <p>
        Documents and their associated data are automatically deleted 9 days after creation (or sooner,
        once everyone has signed and the final copy has been emailed out). We don't keep a copy after that
        window closes.
      </p>

      <h3>Third parties</h3>
      <p>
        Signing invitations, reminders, and the final signed document are sent via Resend, our email
        delivery provider. We don't use analytics or advertising trackers, and we don't sell or share your
        data with anyone else.
      </p>

      <h3>Contact</h3>
      <p>
        Questions about your data? Reach out at <a href="mailto:founder@docracy.io">founder@docracy.io</a>, or use
        the feedback form on the homepage.
      </p>
    </div>
  );
}
