import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  fetchMe,
  fetchMyDocuments,
  fetchTokenStatus,
  regenerateApiToken,
  startCheckout,
  type Account,
  type DocumentSummary,
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
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [newConnectorUrl, setNewConnectorUrl] = useState<string | null>(null);

  useNoIndex();

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
      <h1>Dashboard</h1>
      <p>Signed in as {account.email}.</p>

      {!account.isPaid && (
        <div className="card">
          <h3 style={{ fontSize: 15 }}>Upgrade to paid</h3>
          <p>Unlimited signers, plus the MCP connector for your own documents.</p>
          {upgradeError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{upgradeError}</p>}
          <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
            {upgrading ? "Redirecting…" : "Upgrade"}
          </button>
        </div>
      )}

      {account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>MCP connector</h3>
          <p>Status: {hasToken ? "Active" : "None yet"}</p>
          {newConnectorUrl ? (
            <>
              <p style={{ marginBottom: 4 }}>
                Copy this URL into Claude (Settings → Connectors → Add custom connector). It won't be
                shown again — regenerate if you lose it.
              </p>
              <input className="form-input" readOnly value={newConnectorUrl} style={{ width: "100%" }} />
            </>
          ) : (
            <p style={{ marginBottom: 0 }}>
              {hasToken
                ? "Regenerating replaces your existing connector URL — anything using the old one will stop working."
                : "Generate a URL to connect this account to Claude."}
            </p>
          )}
          {regenerateError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{regenerateError}</p>}
          <button className="btn-secondary" onClick={onRegenerateToken} disabled={regenerating} style={{ marginTop: 8 }}>
            {regenerating ? "Generating…" : hasToken ? "Regenerate" : "Generate"}
          </button>
        </div>
      )}

      <div className="card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: 15 }}>Your documents</h3>
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
