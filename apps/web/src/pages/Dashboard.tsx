import { Component, useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  apiUrl,
  cancelTeamInvite,
  createWebhook,
  deleteBrandLogo,
  deleteTemplate,
  deleteWebhook,
  disconnectConnector,
  fetchBranding,
  fetchConnectors,
  fetchMe,
  fetchMyDocuments,
  fetchTeam,
  fetchTemplates,
  fetchTokenStatus,
  fetchWebhooks,
  getConnectorAuthorizeUrl,
  inviteTeammate,
  logout,
  openBillingPortal,
  regenerateApiToken,
  removeTeamMember,
  startCheckout,
  uploadBrandLogo,
  type Account,
  type CloudConnectionSummary,
  type CloudProvider,
  type DocumentSummary,
  type PendingInviteSummary,
  type TeamMemberSummary,
  type TemplateSummary,
  type WebhookEventType,
  type WebhookSummary,
} from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";
import { FREE_TEMPLATES } from "../lib/freeTemplates";

/** Isolates the profile-menu popup so a render error there (e.g. from unexpected account/team
 *  data shape) shows an inline message instead of silently freezing the whole dashboard — this
 *  subtree only ever mounts on the first click, so any bug in it would otherwise be invisible. */
class ProfileMenuBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state: { error: string | null } = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : String(error) };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="dashboard-profile-menu" style={{ color: "var(--danger)", fontSize: 12 }}>
          Menu error: {this.state.error}
        </div>
      );
    }
    return this.props.children;
  }
}

/** Minimalist monochrome line icons for the profile-menu items — same hand-drawn, Heroicons-
 *  outline-style approach as Landing.tsx's FeatureIcon, kept local since these four are specific
 *  to this one menu. */
function MenuIcon({ name }: { name: "team" | "subscription" | "support" | "logout" }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.5,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "team":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
          <circle cx="17" cy="9" r="2.25" />
          <path d="M15.5 14.2c2.3.4 4 2.4 4 5.3" />
        </svg>
      );
    case "subscription":
      return (
        <svg {...common}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10h18" />
          <path d="M6.5 14.5h4" />
        </svg>
      );
    case "support":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M9.3 9.6a2.7 2.7 0 1 1 4.1 2.3c-.8.5-1.4 1-1.4 2.1" />
          <circle cx="12" cy="17" r="0.25" fill="currentColor" stroke="none" />
        </svg>
      );
    case "logout":
      return (
        <svg {...common}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="M16 17l5-5-5-5" />
          <path d="M21 12H9" />
        </svg>
      );
  }
}

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
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "templates" | "documents" | "tools">("dashboard");
  const [docsSubTab, setDocsSubTab] = useState<"all" | "awaiting" | "waiting" | "completed">("all");
  const [toolsSubTab, setToolsSubTab] = useState<
    "connector" | "webhooks" | "connectors" | "branding" | "team" | "subscription"
  >("connector");
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [connections, setConnections] = useState<CloudConnectionSummary[]>([]);
  const [connectorError, setConnectorError] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<CloudProvider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<CloudProvider | null>(null);
  const [connectorBanner, setConnectorBanner] = useState<"connected" | "error" | null>(null);
  const navigate = useNavigate();

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

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

  const refreshConnectors = () => fetchConnectors().then((res) => setConnections(res.connections));

  const onConnectProvider = async (provider: CloudProvider) => {
    setConnectingProvider(provider);
    setConnectorError(null);
    try {
      const { url } = await getConnectorAuthorizeUrl(provider);
      window.location.href = url;
    } catch (err) {
      setConnectorError(err instanceof Error ? err.message : "Something went wrong");
      setConnectingProvider(null);
    }
  };

  const onDisconnectProvider = async (provider: CloudProvider) => {
    setDisconnectingProvider(provider);
    setConnectorError(null);
    try {
      await disconnectConnector(provider);
      await refreshConnectors();
    } catch (err) {
      setConnectorError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setDisconnectingProvider(null);
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
      const { token, connectorUrl } = await regenerateApiToken();
      setNewConnectorUrl(connectorUrl);
      setNewApiKey(token);
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

  const waitingOnOthersDocs = useMemo(
    () => documents.filter((d) => d.status === "pending" && !d.awaitingYou),
    [documents]
  );
  const completedDocs = useMemo(() => documents.filter((d) => d.status === "completed"), [documents]);
  const visibleDocs = useMemo(() => {
    if (docsSubTab === "awaiting") return awaitingYouDocs;
    if (docsSubTab === "waiting") return waitingOnOthersDocs;
    if (docsSubTab === "completed") return completedDocs;
    return documents;
  }, [docsSubTab, awaitingYouDocs, waitingOnOthersDocs, completedDocs, documents]);

  const openDocuments = (subTab: typeof docsSubTab) => {
    setActiveTab("documents");
    setDocsSubTab(subTab);
    setDocumentsExpanded(true);
  };

  const openTools = (subTab: typeof toolsSubTab) => {
    setActiveTab("tools");
    setToolsSubTab(subTab);
    setToolsExpanded(true);
  };

  useEffect(() => {
    if (!profileMenuOpen) return;
    const onDocClick = () => setProfileMenuOpen(false);
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [profileMenuOpen]);

  // Reads the ?connector=connected|error param the OAuth callback redirects back with (a real
  // page navigation, not an in-app fetch), shows a one-time banner, then strips it from the URL.
  useEffect(() => {
    const value = new URLSearchParams(window.location.search).get("connector");
    if (value === "connected" || value === "error") {
      setConnectorBanner(value);
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

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
        if (res.account?.isEnterprise) {
          const { connections } = await fetchConnectors();
          setConnections(connections);
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

  const DOCS_SUBNAV: Array<{ key: typeof docsSubTab; label: string }> = [
    { key: "awaiting", label: "Awaiting your signature" },
    { key: "waiting", label: "Waiting on others" },
    { key: "completed", label: "Completed" },
  ];

  // Team and Subscription are deliberately absent here — they live only in the profile-menu
  // dropdown (anchored to the account row at the bottom of the sidebar), matching the SwipeSign
  // reference exactly. Listing them again in the general Tools accordion would duplicate them.
  const TOOLS_SUBNAV: Array<{ key: typeof toolsSubTab; label: string }> = [
    { key: "connector", label: "Connector & API key" },
    { key: "webhooks", label: "Webhooks" },
    ...(account.isEnterprise ? [{ key: "connectors" as const, label: "Connectors" }] : []),
    { key: "branding", label: "Branding" },
  ];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link to="/prepare" className="dashboard-nav-new">
          + New
        </Link>
        <button
          className={`dashboard-nav-item${activeTab === "dashboard" ? " active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          Dashboard
        </button>
        <button
          className={`dashboard-nav-item${activeTab === "templates" ? " active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          Templates
        </button>

        <div className="dashboard-nav-group">
          <button
            className={`dashboard-nav-item dashboard-nav-group-header${activeTab === "documents" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("documents");
              setDocumentsExpanded((o) => !o);
            }}
          >
            Documents
            <span className={`dashboard-nav-chevron${documentsExpanded ? " open" : ""}`}>⌄</span>
          </button>
          {documentsExpanded && (
            <div className="dashboard-nav-subitems">
              {DOCS_SUBNAV.map((item) => (
                <button
                  key={item.key}
                  className={`dashboard-nav-subitem${activeTab === "documents" && docsSubTab === item.key ? " active" : ""}`}
                  onClick={() => openDocuments(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {account.isPaid && (
          <div className="dashboard-nav-group">
            <button
              className={`dashboard-nav-item dashboard-nav-group-header${activeTab === "tools" ? " active" : ""}`}
              onClick={() => {
                setActiveTab("tools");
                setToolsExpanded((o) => !o);
              }}
            >
              Tools
              <span className={`dashboard-nav-chevron${toolsExpanded ? " open" : ""}`}>⌄</span>
            </button>
            {toolsExpanded && (
              <div className="dashboard-nav-subitems">
                {TOOLS_SUBNAV.map((item) => (
                  <button
                    key={item.key}
                    className={`dashboard-nav-subitem${activeTab === "tools" && toolsSubTab === item.key ? " active" : ""}`}
                    onClick={() => openTools(item.key)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="dashboard-profile">
          {profileMenuOpen && (
            <ProfileMenuBoundary>
            <div className="dashboard-profile-menu">
              {account.isPaid && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("tools");
                    setToolsSubTab("team");
                    setProfileMenuOpen(false);
                  }}
                >
                  <MenuIcon name="team" />
                  Team
                </button>
              )}
              {account.isPaid && isWorkspaceOwner && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveTab("tools");
                    setToolsSubTab("subscription");
                    setProfileMenuOpen(false);
                  }}
                >
                  <MenuIcon name="subscription" />
                  Subscription
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new Event("docracy:open-chat"));
                  setProfileMenuOpen(false);
                }}
              >
                <MenuIcon name="support" />
                Support
              </button>
              <div className="dashboard-profile-menu-divider" />
              <button
                className="dashboard-profile-menu-danger"
                onClick={(e) => {
                  e.stopPropagation();
                  onLogout();
                }}
              >
                <MenuIcon name="logout" />
                Log out
              </button>
            </div>
            </ProfileMenuBoundary>
          )}
          <button
            type="button"
            className="dashboard-sidebar-footer"
            onClick={() => setProfileMenuOpen((o) => !o)}
          >
            <div className="dashboard-avatar">{account.email.slice(0, 2).toUpperCase()}</div>
            <span style={{ fontSize: 13, color: "var(--body)", overflowWrap: "anywhere" }}>{account.email}</span>
          </button>
        </div>
      </aside>

      <div className="dashboard-content">
        {connectorBanner && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              borderColor: connectorBanner === "connected" ? "var(--primary)" : "var(--danger)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>
              {connectorBanner === "connected"
                ? "Connected — signed documents will now upload there automatically."
                : "Couldn't connect that provider. Please try again."}
            </span>
            <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} onClick={() => setConnectorBanner(null)}>
              Dismiss
            </button>
          </div>
        )}
        {activeTab === "dashboard" && (
          <>
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
                  team accounts, white-label branding, and a set of AI tools — auto-detect signature/date fields,
                  a plain-English explainer with risk highlighting, and a contract generator that turns a one-line
                  description into a signable PDF.
                </p>
                {upgradeError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{upgradeError}</p>}
                <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
                  {upgrading ? "Redirecting…" : "Upgrade"}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "templates" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>Free templates</h3>
            <p style={{ fontSize: 12, color: "var(--mute)" }}>
              Ready-to-use documents, no account needed — pick one to prefill its signature fields automatically.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: 8 }}>
              {FREE_TEMPLATES.map((t) => (
                <Link
                  key={t.slug}
                  to={`/prepare?freeTemplate=${t.slug}`}
                  className="btn-secondary"
                  style={{ textDecoration: "none", textAlign: "left", padding: "8px 10px", fontSize: 13 }}
                >
                  {t.name}
                </Link>
              ))}
            </div>
            <Link to="/free-templates" style={{ fontSize: 13, marginTop: 12, display: "inline-block" }}>
              Browse all free templates →
            </Link>
          </div>
        )}

        {activeTab === "templates" && !account.isPaid && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>Templates are a paid feature</h3>
            <p>Upgrade to save reusable templates from any document you've prepared.</p>
            <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
              {upgrading ? "Redirecting…" : "Upgrade — $7/month"}
            </button>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>
              {docsSubTab === "awaiting"
                ? "Awaiting your signature"
                : docsSubTab === "waiting"
                ? "Waiting on others"
                : docsSubTab === "completed"
                ? "Completed"
                : "All documents"}
            </h3>
            {visibleDocs.length === 0 ? (
              <p style={{ marginBottom: 0 }}>Nothing here yet.</p>
            ) : (
              visibleDocs.map((doc) => (
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
        )}

        {activeTab === "tools" && !account.isPaid && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>Tools are a paid feature</h3>
            <p>
              Upgrade for the MCP connector &amp; API key, webhooks, white-label branding, and team accounts.
            </p>
            <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
              {upgrading ? "Redirecting…" : "Upgrade — $7/month"}
            </button>
          </div>
        )}

        {activeTab === "tools" && account.isPaid && isWorkspaceOwner && toolsSubTab === "subscription" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>
              Subscription
              {account.isEnterprise && (
                <span
                  style={{
                    marginLeft: 8,
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--primary)",
                    background: "var(--primary-soft)",
                    borderRadius: 999,
                    padding: "2px 8px",
                    verticalAlign: "middle",
                  }}
                >
                  Enterprise
                </span>
              )}
            </h3>
            <p>Manage your payment method, invoices, or cancel your subscription.</p>
            {account.isEnterprise && account.enterpriseExpiresAt && (
              <p style={{ fontSize: 12, color: "var(--mute)" }}>
                Enterprise term active until{" "}
                {new Date(account.enterpriseExpiresAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                . Contact sales to renew before then.
              </p>
            )}
            {manageBillingError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{manageBillingError}</p>}
            <button className="btn-secondary" onClick={onManageBilling} disabled={managingBilling}>
              {managingBilling ? "Redirecting…" : "Manage subscription"}
            </button>

            {!account.isEnterprise && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>
                  Setting up a custom Enterprise deal with sales? Give them this workspace ID — they'll append it
                  as <code>client_reference_id</code> on the Payment Link before sending it to you.
                </p>
                <input className="form-input" readOnly value={account.id} style={{ width: "100%", fontSize: 12 }} />
              </div>
            )}
          </div>
        )}

        {activeTab === "tools" && account.isPaid && toolsSubTab === "connector" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>MCP connector &amp; API key</h3>
          <p>Status: {hasToken ? "Active" : "None yet"}</p>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            One key for everything: AI assistants (Claude, ChatGPT, Grok, Perplexity — anything that supports
            adding a custom MCP connector) and Zapier both use the same credential.
          </p>
          {newConnectorUrl && newApiKey ? (
            <>
              <p style={{ marginBottom: 4 }}>
                For an AI assistant, paste this full URL into its "Add custom connector" screen:
              </p>
              <input className="form-input" readOnly value={newConnectorUrl} style={{ width: "100%", marginBottom: 12 }} />
              <p style={{ marginBottom: 4 }}>For Zapier, paste just the API key into the "API Key" field when connecting:</p>
              <input className="form-input" readOnly value={newApiKey} style={{ width: "100%" }} />
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 4, marginBottom: 0 }}>
                Neither is shown again — regenerate if you lose them (regenerating replaces both at once).
              </p>
            </>
          ) : (
            <p style={{ marginBottom: 0 }}>
              {hasToken
                ? "Regenerating replaces your existing key/connector URL — anything using the old one will stop working."
                : "Generate a key to connect this account to an AI assistant or Zapier."}
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

              <p style={{ marginBottom: 4 }}>
                <strong>Zapier</strong>
              </p>
              <p style={{ marginBottom: 0, marginTop: 0 }}>
                What it does there: triggers on Document Created, Signer Signed, or Document Completed, and
                an action to send a saved template out for signature — so Docracy can plug into a Zap without
                either side needing a server. Unlike the assistants above, use just the <strong>API key</strong>{" "}
                (not the full connector URL) as Zapier's "API Key" field when connecting.
                <br />
                Set up: search for "Docracy" when adding a new app to a Zap, or ask whoever prepared this
                deployment for the integration link if it isn't public yet.
              </p>
            </div>
          </details>
        </div>
      )}

      {activeTab === "templates" && account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Templates</h3>
          {templateError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{templateError}</p>}
          {templates.length === 0 ? (
            <>
              <p style={{ marginBottom: 12 }}>
                No templates yet — upload a PDF, place a field for every signer, then use the "Save as template"
                button that appears in the sidebar.
              </p>
              <Link to="/prepare" className="btn-secondary" style={{ textDecoration: "none", display: "inline-block" }}>
                Prepare a document
              </Link>
            </>
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

      {activeTab === "tools" && account.isPaid && toolsSubTab === "webhooks" && (
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
                aria-label="Webhook URL"
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

      {activeTab === "tools" && account.isEnterprise && toolsSubTab === "connectors" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>Connectors</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            Connect your cloud storage and every signed document uploads there automatically once it's complete.
          </p>
          {connectorError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{connectorError}</p>}
          {(
            [
              { provider: "dropbox" as const, label: "Dropbox" },
              { provider: "onedrive" as const, label: "OneDrive" },
              { provider: "box" as const, label: "Box" },
            ]
          ).map(({ provider, label }) => {
            const connection = connections.find((c) => c.provider === provider);
            return (
              <div
                key={provider}
                style={{
                  padding: "10px 0",
                  borderBottom: "1px solid var(--hairline)",
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <span>
                  {label}
                  {connection && (
                    <span style={{ fontSize: 12, color: "var(--mute)" }}>
                      {" "}
                      — connected{connection.connectedEmail ? ` as ${connection.connectedEmail}` : ""}
                    </span>
                  )}
                </span>
                {connection ? (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: "4px 10px" }}
                    disabled={disconnectingProvider === provider}
                    onClick={() => onDisconnectProvider(provider)}
                  >
                    {disconnectingProvider === provider ? "Disconnecting…" : "Disconnect"}
                  </button>
                ) : (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: "4px 10px" }}
                    disabled={connectingProvider === provider}
                    onClick={() => onConnectProvider(provider)}
                  >
                    {connectingProvider === provider ? "Connecting…" : "Connect"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "tools" && account.isPaid && toolsSubTab === "branding" && (
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
                aria-label="Upload logo"
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

      {activeTab === "tools" && account.isPaid && toolsSubTab === "team" && (
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
                  aria-label="Teammate email"
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

      </div>
    </div>
  );
}
