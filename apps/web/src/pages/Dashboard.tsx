import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  apiUrl,
  cancelTeamInvite,
  createWebhook,
  deleteBrandLogo,
  deleteTemplate,
  deleteWebhook,
  fetchBranding,
  fetchMe,
  fetchMyDocuments,
  fetchTeam,
  fetchTemplates,
  fetchTokenStatus,
  fetchWebhooks,
  inviteTeammate,
  openBillingPortal,
  regenerateApiToken,
  removeTeamMember,
  startCheckout,
  uploadBrandLogo,
  type Account,
  type DocumentSummary,
  type PendingInviteSummary,
  type TeamMemberSummary,
  type TemplateSummary,
  type WebhookEventType,
  type WebhookSummary,
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
  const [webhooks, setWebhooks] = useState<WebhookSummary[]>([]);
  const [deletingWebhookId, setDeletingWebhookId] = useState<string | null>(null);
  const [webhookError, setWebhookError] = useState<string | null>(null);
  const [showAddWebhook, setShowAddWebhook] = useState(false);
  const [newWebhookUrl, setNewWebhookUrl] = useState("");
  const [newWebhookEvents, setNewWebhookEvents] = useState<WebhookEventType[]>([]);
  const [creatingWebhook, setCreatingWebhook] = useState(false);
  const [newWebhookSecret, setNewWebhookSecret] = useState<string | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMemberSummary[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInviteSummary[]>([]);
  const [teamError, setTeamError] = useState<string | null>(null);
  const [showInviteInput, setShowInviteInput] = useState(false);
  const [newInviteEmail, setNewInviteEmail] = useState("");
  const [invitingTeammate, setInvitingTeammate] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null);
  const [cancelingInviteId, setCancelingInviteId] = useState<string | null>(null);
  const [brandLogoPath, setBrandLogoPath] = useState<string | null>(null);
  const [brandingError, setBrandingError] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [deletingLogo, setDeletingLogo] = useState(false);

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

  const refreshWebhooks = () => fetchWebhooks().then((res) => setWebhooks(res.webhooks));

  const toggleNewWebhookEvent = (event: WebhookEventType) => {
    setNewWebhookEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  };

  const onCreateWebhook = async () => {
    if (!newWebhookUrl.trim() || newWebhookEvents.length === 0) return;
    setCreatingWebhook(true);
    setWebhookError(null);
    try {
      const { secret } = await createWebhook(newWebhookUrl.trim(), newWebhookEvents);
      setNewWebhookSecret(secret);
      setNewWebhookUrl("");
      setNewWebhookEvents([]);
      await refreshWebhooks();
    } catch (err) {
      setWebhookError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCreatingWebhook(false);
    }
  };

  const onDeleteWebhook = async (id: string) => {
    setDeletingWebhookId(id);
    setWebhookError(null);
    try {
      await deleteWebhook(id);
      await refreshWebhooks();
    } catch (err) {
      setWebhookError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingWebhookId(null);
    }
  };

  const refreshTeam = () => fetchTeam().then((res) => {
    setTeamMembers(res.members);
    setPendingInvites(res.pendingInvites);
  });

  const onInviteTeammate = async () => {
    if (!newInviteEmail.trim()) return;
    setInvitingTeammate(true);
    setTeamError(null);
    try {
      await inviteTeammate(newInviteEmail.trim());
      setNewInviteEmail("");
      setShowInviteInput(false);
      await refreshTeam();
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setInvitingTeammate(false);
    }
  };

  const onCancelInvite = async (id: string) => {
    setCancelingInviteId(id);
    setTeamError(null);
    try {
      await cancelTeamInvite(id);
      await refreshTeam();
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setCancelingInviteId(null);
    }
  };

  const onRemoveTeamMember = async (accountId: string) => {
    setRemovingMemberId(accountId);
    setTeamError(null);
    try {
      await removeTeamMember(accountId);
      await refreshTeam();
    } catch (err) {
      setTeamError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setRemovingMemberId(null);
    }
  };

  const onUploadLogo = async (file: File) => {
    setUploadingLogo(true);
    setBrandingError(null);
    try {
      const { logoPath } = await uploadBrandLogo(file);
      setBrandLogoPath(logoPath);
    } catch (err) {
      setBrandingError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setUploadingLogo(false);
    }
  };

  const onDeleteLogo = async () => {
    setDeletingLogo(true);
    setBrandingError(null);
    try {
      await deleteBrandLogo();
      setBrandLogoPath(null);
    } catch (err) {
      setBrandingError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDeletingLogo(false);
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

  const isWorkspaceOwner = useMemo(
    () => teamMembers.find((m) => m.role === "owner")?.accountId === account?.id,
    [teamMembers, account]
  );

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
          const { webhooks } = await fetchWebhooks();
          setWebhooks(webhooks);
          const { members, pendingInvites } = await fetchTeam();
          setTeamMembers(members);
          setPendingInvites(pendingInvites);
          const { logoPath } = await fetchBranding();
          setBrandLogoPath(logoPath);
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
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ overflowWrap: "anywhere" }}>{doc.title}</span>
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
          <h3 style={{ fontSize: 15 }}>Upgrade to paid — $7/month</h3>
          <p>
            Unlimited signers, a connector so Claude, ChatGPT, Grok, or Perplexity can look up your documents,
            team accounts, and white-label branding.
          </p>
          {upgradeError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{upgradeError}</p>}
          <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
            {upgrading ? "Redirecting…" : "Upgrade"}
          </button>
        </div>
      )}

      {account.isPaid && isWorkspaceOwner && (
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
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ overflowWrap: "anywhere" }}>
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

      {account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Webhooks</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            Get notified at a URL you control when a document is created, a signer signs, or a document
            completes.
          </p>
          {webhookError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{webhookError}</p>}
          {webhooks.length === 0 ? (
            <p style={{ marginBottom: 12 }}>No webhooks yet.</p>
          ) : (
            webhooks.map((w) => (
              <div
                key={w.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--hairline)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ overflowWrap: "anywhere" }}>
                  {w.url} <span style={{ fontSize: 12, color: "var(--mute)" }}>({w.events.join(", ")})</span>
                </span>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 13, padding: "4px 10px" }}
                  disabled={deletingWebhookId === w.id}
                  onClick={() => onDeleteWebhook(w.id)}
                >
                  {deletingWebhookId === w.id ? "Deleting…" : "Delete"}
                </button>
              </div>
            ))
          )}

          {newWebhookSecret && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <p style={{ marginBottom: 4 }}>
                Signing secret — copy it now, it won't be shown again:
              </p>
              <input className="form-input" readOnly value={newWebhookSecret} style={{ width: "100%" }} />
            </div>
          )}

          {showAddWebhook ? (
            <div style={{ marginTop: 12 }}>
              <input
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                placeholder="https://your-server.com/webhook"
                value={newWebhookUrl}
                onChange={(e) => setNewWebhookUrl(e.target.value)}
              />
              <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 13 }}>
                {(["document.created", "document.signer.signed", "document.completed"] as WebhookEventType[]).map(
                  (event) => (
                    <label key={event} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <input
                        type="checkbox"
                        checked={newWebhookEvents.includes(event)}
                        onChange={() => toggleNewWebhookEvent(event)}
                      />
                      {event}
                    </label>
                  )
                )}
              </div>
              <button
                className="btn-secondary"
                disabled={creatingWebhook || !newWebhookUrl.trim() || newWebhookEvents.length === 0}
                onClick={onCreateWebhook}
              >
                {creatingWebhook ? "Adding…" : "Add webhook"}
              </button>
            </div>
          ) : (
            <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowAddWebhook(true)}>
              + Add webhook
            </button>
          )}
        </div>
      )}

      {account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Branding</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            Replace the Docracy logo with your own on the signing page and invite emails your signers see.
          </p>
          {brandingError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{brandingError}</p>}
          {brandLogoPath ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <img
                src={apiUrl(brandLogoPath)}
                alt="Your logo"
                style={{ maxHeight: 48, maxWidth: 220, display: "block" }}
              />
              <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} disabled={deletingLogo} onClick={onDeleteLogo}>
                {deletingLogo ? "Removing…" : "Remove logo"}
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadLogo(file);
                  e.target.value = "";
                }}
              />
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>
                PNG, JPEG, or WebP, up to 2MB. {uploadingLogo && "Uploading…"}
              </p>
            </div>
          )}
        </div>
      )}

      {account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Team</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            Invite teammates to share this workspace — same documents, templates, and webhooks, one
            subscription.
          </p>
          {teamError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{teamError}</p>}
          {teamMembers.map((m) => (
            <div
              key={m.accountId}
              style={{
                padding: "8px 0",
                borderBottom: "1px solid var(--hairline)",
                display: "flex",
                flexWrap: "wrap",
                justifyContent: "space-between",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span style={{ overflowWrap: "anywhere" }}>
                {m.email} <span style={{ fontSize: 12, color: "var(--mute)" }}>({m.role})</span>
              </span>
              {isWorkspaceOwner && m.role === "member" && (
                <button
                  className="btn-secondary"
                  style={{ fontSize: 13, padding: "4px 10px" }}
                  disabled={removingMemberId === m.accountId}
                  onClick={() => onRemoveTeamMember(m.accountId)}
                >
                  {removingMemberId === m.accountId ? "Removing…" : "Remove"}
                </button>
              )}
            </div>
          ))}

          {isWorkspaceOwner &&
            pendingInvites.map((invite) => (
              <div
                key={invite.id}
                style={{
                  padding: "8px 0",
                  borderBottom: "1px solid var(--hairline)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span style={{ overflowWrap: "anywhere" }}>
                  {invite.email} <span style={{ fontSize: 12, color: "var(--mute)" }}>(invited, not yet joined)</span>
                </span>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 13, padding: "4px 10px" }}
                  disabled={cancelingInviteId === invite.id}
                  onClick={() => onCancelInvite(invite.id)}
                >
                  {cancelingInviteId === invite.id ? "Cancelling…" : "Cancel invite"}
                </button>
              </div>
            ))}

          {isWorkspaceOwner ? (
            showInviteInput ? (
              <div style={{ marginTop: 12 }}>
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8 }}
                  placeholder="teammate@example.com"
                  type="email"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                />
                <button
                  className="btn-secondary"
                  disabled={invitingTeammate || !newInviteEmail.trim()}
                  onClick={onInviteTeammate}
                >
                  {invitingTeammate ? "Inviting…" : "Send invite"}
                </button>
              </div>
            ) : (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowInviteInput(true)}>
                + Invite teammate
              </button>
            )
          ) : (
            <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 0, marginTop: 8 }}>
              Only the workspace owner can invite or remove teammates.
            </p>
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
                flexWrap: "wrap",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <Link to={`/status/${doc.statusToken}`} style={{ overflowWrap: "anywhere" }}>
                {doc.title}
              </Link>
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
