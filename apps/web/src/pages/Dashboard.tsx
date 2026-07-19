import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  deleteTemplate,
  fetchMe,
  fetchMyDocuments,
  fetchTemplates,
  fetchTokenStatus,
  openBillingPortal,
  regenerateApiToken,
  startCheckout,
  type Account,
  type DocumentSummary,
  type TemplateSummary,
} from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";

export default function Dashboard() {
  const [account, setAccount] = useState<Account | null>(null);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);
  const [manageBillingError, setManageBillingError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [newConnectorUrl, setNewConnectorUrl] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [deletingTemplateId, setDeletingTemplateId] = useState<string | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  useNoIndex();

  const refreshTemplates = () => fetchTemplates().then((res) => setTemplates(res.templates));

  const onDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
    setTemplateError(null);
    try {
      await deleteTemplate(id);
      await refreshTemplates();
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingTemplateId(null);
    }
  };

  const onUpgrade = async () => {
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : "Something went wrong");
      setUpgrading(false);
    }
  };

  const onManageBilling = async () => {
    setManagingBilling(true);
    setManageBillingError(null);
    try {
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setManageBillingError(err instanceof Error ? err.message : "Something went wrong");
      setManagingBilling(false);
    }
  };

  const onRegenerateToken = async () => {
    setRegenerating(true);
    setRegenerateError(null);
    try {
      const { connectorUrl } = await regenerateApiToken();
      setNewConnectorUrl(connectorUrl);
      setHasToken(true);
    } catch (err) {
      setRegenerateError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRegenerating(false);
    }
  };

  const awaitingYouDocs = useMemo(() => documents.filter((d) => d.awaitingYou), [documents]);
  const waitingOnOthersCount = useMemo(
    () => documents.filter((d) => d.status === "pending" && !d.awaitingYou).length,
    [documents]
  );
  const completedThisMonthCount = useMemo(() => {
    const now = new Date();
    return documents.filter((d) => {
      if (d.status !== "completed" || !d.completedAt) return false;
      const completed = new Date(d.completedAt);
      return completed.getFullYear() === now.getFullYear() && completed.getMonth() === now.getMonth();
    }).length;
  }, [documents]);

  useEffect(() => {
    fetchMe()
      .then(async (res) => {
        setAccount(res.account);
        if (res.account) {
          const { documents } = await fetchMyDocuments();
          setDocuments(documents);
        }
        if (res.account?.isPaid) {
          const { hasToken } = await fetchTokenStatus();
          setHasToken(hasToken);
          const { templates } = await fetchTemplates();
          setTemplates(templates);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Something went wrong"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <p>Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>Not available</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container">
        <h1>Not signed in</h1>
        <p>You need to sign in to see your dashboard.</p>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>Welcome back</h1>
      <p>Here's what needs your attention today — signed in as {account.email}.</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
          gap: 12,
          marginTop: 16,
        }}
      >
        <div
          className="card"
          style={awaitingYouDocs.length > 0 ? { background: "rgba(47,126,216,0.08)", borderColor: "var(--primary)" } : undefined}
        >
          <div style={{ fontSize: 12, color: "var(--mute)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Awaiting your signature
          </div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{awaitingYouDocs.length}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--mute)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Waiting on others
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{waitingOnOthersCount}</div>
        </div>
        <div className="card">
          <div style={{ fontSize: 12, color: "var(--mute)", textTransform: "uppercase", letterSpacing: 0.4 }}>
            Completed this month
          </div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{completedThisMonthCount}</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15 }}>Awaiting your signature</h3>
        {awaitingYouDocs.length === 0 ? (
          <p style={{ marginBottom: 0 }}>You're all caught up — nothing is waiting on your signature right now.</p>
        ) : (
          awaitingYouDocs.map((doc) => (
            <div
              key={doc.docId}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid var(--hairline)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{doc.title}</span>
              <Link to={`/sign/${doc.signToken}`} className="btn-primary" style={{ textDecoration: "none", padding: "4px 10px", fontSize: 13 }}>
                Sign now
              </Link>
            </div>
          ))
        )}
      </div>

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15 }}>Start something new</h3>
        <Link to="/prepare" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
          + New document
        </Link>
      </div>

      {!account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Upgrade to paid</h3>
          <p>Unlimited signers, plus a connector so Claude, ChatGPT, Grok, or Perplexity can look up your documents.</p>
          {upgradeError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{upgradeError}</p>}
          <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
            {upgrading ? "Redirecting…" : "Upgrade"}
          </button>
        </div>
      )}

      {account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Subscription</h3>
          <p>Manage your payment method, invoices, or cancel your subscription.</p>
          {manageBillingError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{manageBillingError}</p>}
          <button className="btn-secondary" onClick={onManageBilling} disabled={managingBilling}>
            {managingBilling ? "Redirecting…" : "Manage subscription"}
          </button>
        </div>
      )}

      {account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>MCP connector</h3>
          <p>Status: {hasToken ? "Active" : "None yet"}</p>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            Works with Claude, ChatGPT, Grok, and Perplexity — anything that supports adding a custom MCP
            connector (each looks for this under Settings → Connectors, or Settings → Plugins on ChatGPT).
          </p>
          {newConnectorUrl ? (
            <>
              <p style={{ marginBottom: 4 }}>
                Paste this URL into your assistant's "Add custom connector" screen. It won't be shown again —
                regenerate if you lose it.
              </p>
              <input className="form-input" readOnly value={newConnectorUrl} style={{ width: "100%" }} />
            </>
          ) : (
            <p style={{ marginBottom: 0 }}>
              {hasToken
                ? "Regenerating replaces your existing connector URL — anything using the old one will stop working."
                : "Generate a URL to connect this account to Claude, ChatGPT, Grok, or Perplexity."}
            </p>
          )}
          {regenerateError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{regenerateError}</p>}
          <button className="btn-secondary" onClick={onRegenerateToken} disabled={regenerating} style={{ marginTop: 8 }}>
            {regenerating ? "Generating…" : hasToken ? "Regenerate" : "Generate"}
          </button>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--primary)" }}>
              What can I do with this, how do I set it up, and how do I use it?
            </summary>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>
                <strong>What it does:</strong> once connected, your assistant can look up the status of any
                Docracy signing link ("who's signed, who's still pending") and — since you're on the paid
                plan — search your own documents by title, signer name, email, or company. Nothing is ever
                changed or signed automatically; both tools are read-only.
              </p>

              <p style={{ marginBottom: 4 }}>
                <strong>Claude</strong> (claude.ai or the desktop app)
              </p>
              <p style={{ marginTop: 0 }}>
                Set up: Settings → Connectors → Add custom connector → paste your URL above.
                <br />
                Use it: click the "+" at the bottom-left of the chat box → Connectors → make sure Docracy is
                toggled on for that conversation. Then just ask naturally — e.g. "check the status of
                [link]" or "find my documents about the lease agreement."
              </p>

              <p style={{ marginBottom: 4 }}>
                <strong>ChatGPT</strong>
              </p>
              <p style={{ marginTop: 0 }}>
                Set up: Settings → Security and login → turn on Developer Mode. Then Settings → Connectors
                (or Plugins) → Add custom connector → paste your URL. Individual Plus/Pro accounts get
                read-only access, which is all these tools ever do anyway.
                <br />
                Use it: pick it from the Tools menu (the "+"/tools icon in the message box), or type
                "@Docracy" followed by your request — e.g. "@Docracy find my documents about the roommate
                agreement."
              </p>

              <p style={{ marginBottom: 4 }}>
                <strong>Grok</strong>
              </p>
              <p style={{ marginTop: 0 }}>
                Set up: available on Grok's paid tiers. Click the "+" in the chat box → Connectors → New
                Connector → Custom → paste your URL.
                <br />
                Use it: just ask your question normally once it's added — Grok calls the tool automatically
                when it's relevant.
              </p>

              <p style={{ marginBottom: 4 }}>
                <strong>Perplexity</strong>
              </p>
              <p style={{ marginBottom: 0, marginTop: 0 }}>
                Set up: requires a Pro or Max plan (the free plan can't add custom connectors). Settings →
                Connectors → Add custom connector → paste your URL, authentication "None" (the token's
                already built into the URL).
                <br />
                Use it: reference it directly in your question — mentioning "Docracy" or asking something
                clearly related to your documents is usually enough for it to reach for the tool.
              </p>
            </div>
          </details>
        </div>
      )}

      {account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Templates</h3>
          {templateError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{templateError}</p>}
          {templates.length === 0 ? (
            <p style={{ marginBottom: 0 }}>
              No templates yet — save one from the "Prepare a document" page once you've placed your signature
              fields.
            </p>
          ) : (
            templates.map((t) => (
              <div
                key={t.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--hairline)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>
                  {t.name}{" "}
                  <span style={{ fontSize: 12, color: "var(--mute)" }}>
                    ({t.signerCount} signer{t.signerCount === 1 ? "" : "s"}, {t.pageCount} page
                    {t.pageCount === 1 ? "" : "s"})
                  </span>
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <Link to={`/prepare?template=${t.id}`} className="btn-secondary" style={{ textDecoration: "none", padding: "4px 10px", fontSize: 13 }}>
                    Use
                  </Link>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: "4px 10px" }}
                    disabled={deletingTemplateId === t.id}
                    onClick={() => onDeleteTemplate(t.id)}
                  >
                    {deletingTemplateId === t.id ? "Deleting…" : "Delete"}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15 }}>All documents</h3>
        {documents.length === 0 ? (
          <p style={{ marginBottom: 0 }}>Nothing here yet.</p>
        ) : (
          documents.map((doc) => (
            <div
              key={doc.docId}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid var(--hairline)",
                display: "flex",
                justifyContent: "space-between",
              }}
            >
              <Link to={`/status/${doc.statusToken}`}>{doc.title}</Link>
              <span style={{ color: doc.status === "completed" ? "var(--success)" : "var(--body)" }}>
                {doc.status === "completed" ? "Signed" : "Pending"}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
