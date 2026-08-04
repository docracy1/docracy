import { Component, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useT } from "../lib/i18n";
import {
  apiUrl,
  cancelTeamInvite,
  createContact,
  createEmbedSession,
  createWebhook,
  accountAttachmentDownloadUrl,
  fetchDocumentAttachments,
  deleteBrandLogo,
  deleteContact,
  deleteTemplate,
  deleteWebhook,
  deleteWorkspaceSlug,
  disconnectConnector,
  fetchBranding,
  fetchConnectors,
  fetchContacts,
  fetchMe,
  fetchMyDocuments,
  fetchStatus,
  fetchTeam,
  fetchTemplates,
  fetchTemplateUsage,
  fetchTokenStatus,
  fetchWebhooks,
  fetchWorkspaceSlug,
  getConnectorAuthorizeUrl,
  inviteTeammate,
  logout,
  openBillingPortal,
  reassignSigner,
  regenerateApiToken,
  removeTeamMember,
  setWorkspaceSlug,
  startCheckout,
  uploadBrandLogo,
  voidAccountDocument,
  claimDocument,
  type Account,
  type CloudConnectionSummary,
  type CloudProvider,
  type ContactSummary,
  type DocumentSummary,
  type PendingInviteSummary,
  type TeamMemberSummary,
  type TemplateSummary,
  type TemplateUsageEntry,
  type WebhookEventType,
  type WebhookSummary,
} from "../lib/api";
import { useNoIndex } from "../lib/useNoIndex";
import { FREE_TEMPLATES } from "../lib/freeTemplates";
import { clearPendingClaim, readPendingClaim } from "../lib/pendingClaim";
import { SignerAttachmentsList } from "../components/SignerAttachmentsList";
import { track } from "../lib/track";
import type { StatusSigner } from "../lib/types";

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

function NavIcon({
  name,
  size = 18,
}: {
  name:
    | "new"
    | "dashboard"
    | "templates"
    | "documents"
    | "contacts"
    | "tools"
    | "awaiting"
    | "waiting"
    | "completed"
    | "connector"
    | "webhooks"
    | "connectors"
    | "branding";
  size?: number;
}) {
  const common = {
    className: "dashboard-nav-icon",
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true as const,
  };
  switch (name) {
    case "new":
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case "dashboard":
      return (
        <svg {...common}>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </svg>
      );
    case "templates":
      return (
        <svg {...common}>
          <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" />
          <path d="M14 3.5V8h4" />
          <path d="M8.5 13h7M8.5 16.5h5" />
        </svg>
      );
    case "documents":
      return (
        <svg {...common}>
          <path d="M7 3.5h7l4 4V20a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 20V5A1.5 1.5 0 0 1 7 3.5z" />
          <path d="M14 3.5V8h4" />
        </svg>
      );
    case "contacts":
      return (
        <svg {...common}>
          <circle cx="9" cy="8" r="3" />
          <path d="M3.5 19.5c0-3 2.5-5.5 5.5-5.5s5.5 2.5 5.5 5.5" />
          <circle cx="17" cy="9" r="2.25" />
          <path d="M15.5 14.2c2.3.4 4 2.4 4 5.3" />
        </svg>
      );
    case "tools":
      return (
        <svg {...common}>
          <path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3.5 17.5l3 3 5.8-5.8a4 4 0 0 0 5.4-5.4l-2.5 2.5-2.5-2.5 2.5-2.5z" />
        </svg>
      );
    case "awaiting":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.25" />
          <path d="M12 8v4.5l3 1.8" />
        </svg>
      );
    case "waiting":
      return (
        <svg {...common}>
          <path d="M4 12h3l2-5 3 10 2-5h6" />
        </svg>
      );
    case "completed":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8.25" />
          <path d="M8.5 12.2l2.3 2.3 4.7-4.8" />
        </svg>
      );
    case "connector":
      return (
        <svg {...common}>
          <path d="M10 13a5 5 0 0 0 7.07 0l1.41-1.41a5 5 0 0 0-7.07-7.07L10 5.93" />
          <path d="M14 11a5 5 0 0 0-7.07 0L5.52 12.41a5 5 0 0 0 7.07 7.07L14 18.07" />
        </svg>
      );
    case "webhooks":
      return (
        <svg {...common}>
          <path d="M8 7h11l-2.5 3L19 13H8a3 3 0 1 1 0-6z" />
          <path d="M8 17a3 3 0 1 0 0-6" />
        </svg>
      );
    case "connectors":
      return (
        <svg {...common}>
          <path d="M7 7h4v4H7zM13 13h4v4h-4z" />
          <path d="M11 9h2M13 11v2" />
        </svg>
      );
    case "branding":
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3.25" />
          <path d="M12 3.5v2.2M12 18.3v2.2M3.5 12h2.2M18.3 12h2.2M6.1 6.1l1.6 1.6M16.3 16.3l1.6 1.6M17.9 6.1l-1.6 1.6M7.7 16.3l-1.6 1.6" />
        </svg>
      );
  }
}

function BottomNavIcon({ name }: { name: "dashboard" | "contacts" | "documents" | "more" }) {
  if (name === "more") {
    return (
      <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" aria-hidden>
        <path d="M4 7h16M4 12h16M4 17h16" />
      </svg>
    );
  }
  return <NavIcon name={name === "documents" ? "documents" : name} size={22} />;
}

/** Minimalist monochrome line icons for the profile-menu items — same hand-drawn, Heroicons-
 *  outline-style approach as Landing.tsx's FeatureIcon, kept local since these four are specific
 *  to this one menu. */
function MenuIcon({ name }: { name: "team" | "subscription" | "support" | "logout" | "admin" }) {
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
    case "admin":
      return (
        <svg {...common}>
          <path d="M12 3l7 3v5c0 4.5-3 8-7 10-4-2-7-5.5-7-10V6l7-3z" />
          <path d="M9.5 12l1.8 1.8L14.5 10" />
        </svg>
      );
  }
}

export default function Dashboard() {
  const t = useT();
  const [account, setAccount] = useState<Account | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [documents, setDocuments] = useState<DocumentSummary[]>([]);
  const [hasToken, setHasToken] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);
  const [upgradeError, setUpgradeError] = useState<string | null>(null);
  const [upgradingEnterprise, setUpgradingEnterprise] = useState(false);
  const [upgradeEnterpriseError, setUpgradeEnterpriseError] = useState<string | null>(null);
  const [managingBilling, setManagingBilling] = useState(false);
  const [manageBillingError, setManageBillingError] = useState<string | null>(null);
  const [regenerating, setRegenerating] = useState(false);
  const [regenerateError, setRegenerateError] = useState<string | null>(null);
  const [newConnectorUrl, setNewConnectorUrl] = useState<string | null>(null);
  const [newApiKey, setNewApiKey] = useState<string | null>(null);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templateUsage, setTemplateUsage] = useState<TemplateUsageEntry[]>([]);
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
  const [workspaceSlug, setWorkspaceSlugState] = useState<string | null>(null);
  const [slugInput, setSlugInput] = useState("");
  const [slugError, setSlugError] = useState<string | null>(null);
  const [savingSlug, setSavingSlug] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "templates" | "documents" | "tools" | "contacts">(
    "dashboard"
  );
  const [docsSubTab, setDocsSubTab] = useState<"all" | "awaiting" | "waiting" | "completed">("all");
  const [toolsSubTab, setToolsSubTab] = useState<
    "connector" | "webhooks" | "connectors" | "branding" | "team" | "subscription"
  >("connector");
  const [documentsExpanded, setDocumentsExpanded] = useState(false);
  const [toolsExpanded, setToolsExpanded] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [moreSheetOpen, setMoreSheetOpen] = useState(false);
  const [connections, setConnections] = useState<CloudConnectionSummary[]>([]);
  const [connectorError, setConnectorError] = useState<string | null>(null);
  const [connectingProvider, setConnectingProvider] = useState<CloudProvider | null>(null);
  const [disconnectingProvider, setDisconnectingProvider] = useState<CloudProvider | null>(null);
  const [connectorBanner, setConnectorBanner] = useState<"connected" | "error" | null>(null);
  const [claimBanner, setClaimBanner] = useState<string | null>(null);
  const [docActionError, setDocActionError] = useState<string | null>(null);
  const [voidingDocId, setVoidingDocId] = useState<string | null>(null);
  const [reassignDoc, setReassignDoc] = useState<DocumentSummary | null>(null);
  const [reassignSigners, setReassignSigners] = useState<StatusSigner[]>([]);
  const [reassignOrder, setReassignOrder] = useState<number | null>(null);
  const [reassignName, setReassignName] = useState("");
  const [reassignEmail, setReassignEmail] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);
  const [reassignSaving, setReassignSaving] = useState(false);
  const [reassignError, setReassignError] = useState<string | null>(null);
  const [embedDoc, setEmbedDoc] = useState<DocumentSummary | null>(null);
  const [embedSigners, setEmbedSigners] = useState<StatusSigner[]>([]);
  const [embedOrder, setEmbedOrder] = useState<number | null>(null);
  const [embedOrigins, setEmbedOrigins] = useState("");
  const [embedReturnUrl, setEmbedReturnUrl] = useState("");
  const [embedLoading, setEmbedLoading] = useState(false);
  const [embedCreating, setEmbedCreating] = useState(false);
  const [embedError, setEmbedError] = useState<string | null>(null);
  const [embedResult, setEmbedResult] = useState<{ embedUrl: string; expiresAt: string } | null>(null);
  const [attachmentsDoc, setAttachmentsDoc] = useState<DocumentSummary | null>(null);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [attachmentsError, setAttachmentsError] = useState<string | null>(null);
  const [attachmentGroups, setAttachmentGroups] = useState<
    Array<{ order: number; name: string; attachments: Array<{ id: string; name: string; sizeBytes: number }> }>
  >([]);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [contactError, setContactError] = useState<string | null>(null);
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactEmail, setNewContactEmail] = useState("");
  const [creatingContact, setCreatingContact] = useState(false);
  const [deletingContactId, setDeletingContactId] = useState<string | null>(null);
  const navigate = useNavigate();
  const profileRef = useRef<HTMLDivElement>(null);

  const onLogout = async () => {
    try {
      await logout();
    } finally {
      navigate("/");
    }
  };

  useNoIndex();

  const refreshTemplates = () => fetchTemplates().then((res) => setTemplates(res.templates));

  const refreshDocuments = () => fetchMyDocuments().then((res) => setDocuments(res.documents));

  const refreshContacts = () => fetchContacts().then((res) => setContacts(res.contacts));

  const onVoidDocument = async (doc: DocumentSummary) => {
    const reason = window.prompt(t("dash.voidPrompt"));
    if (reason === null) return;
    setVoidingDocId(doc.docId);
    setDocActionError(null);
    try {
      await voidAccountDocument(doc.docId, reason.trim() || undefined);
      await refreshDocuments();
    } catch (err) {
      setDocActionError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setVoidingDocId(null);
    }
  };

  const openReassign = async (doc: DocumentSummary) => {
    setReassignDoc(doc);
    setReassignOrder(null);
    setReassignName("");
    setReassignEmail("");
    setReassignError(null);
    setReassignLoading(true);
    try {
      const status = await fetchStatus(doc.statusToken);
      const pending = status.signers.filter((s) => s.status === "pending");
      setReassignSigners(pending);
      if (pending.length === 1) {
        setReassignOrder(pending[0].order);
        setReassignName(pending[0].name);
      }
    } catch (err) {
      setReassignError(err instanceof Error ? err.message : t("common.error"));
      setReassignSigners([]);
    } finally {
      setReassignLoading(false);
    }
  };

  const openEmbed = async (doc: DocumentSummary) => {
    setEmbedDoc(doc);
    setEmbedOrder(null);
    setEmbedOrigins(typeof window !== "undefined" ? window.location.origin : "");
    setEmbedReturnUrl("");
    setEmbedError(null);
    setEmbedResult(null);
    setEmbedLoading(true);
    try {
      const status = await fetchStatus(doc.statusToken);
      const pending = status.signers.filter((s) => s.status === "pending");
      setEmbedSigners(pending);
      if (pending.length === 1) setEmbedOrder(pending[0].order);
    } catch (err) {
      setEmbedError(err instanceof Error ? err.message : t("common.error"));
      setEmbedSigners([]);
    } finally {
      setEmbedLoading(false);
    }
  };

  const onCreateEmbed = async () => {
    if (!embedDoc || embedOrder == null) return;
    const origins = embedOrigins
      .split(/[\n,]+/)
      .map((o) => o.trim())
      .filter(Boolean);
    if (origins.length === 0) {
      setEmbedError(t("dash.embedOriginError"));
      return;
    }
    setEmbedCreating(true);
    setEmbedError(null);
    try {
      const result = await createEmbedSession({
        docId: embedDoc.docId,
        signerOrder: embedOrder,
        allowedOrigins: origins,
        returnUrl: embedReturnUrl.trim() || undefined,
      });
      setEmbedResult({ embedUrl: result.embedUrl, expiresAt: result.expiresAt });
    } catch (err) {
      setEmbedError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setEmbedCreating(false);
    }
  };

  const openAttachments = async (doc: DocumentSummary) => {
    setAttachmentsDoc(doc);
    setAttachmentsLoading(true);
    setAttachmentsError(null);
    setAttachmentGroups([]);
    try {
      const { signers } = await fetchDocumentAttachments(doc.docId);
      setAttachmentGroups(signers);
    } catch (err) {
      setAttachmentsError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setAttachmentsLoading(false);
    }
  };

  const onReassign = async () => {
    if (!reassignDoc || reassignOrder == null || !reassignName.trim() || !reassignEmail.trim()) return;
    setReassignSaving(true);
    setReassignError(null);
    try {
      await reassignSigner(reassignDoc.docId, reassignOrder, {
        name: reassignName.trim(),
        email: reassignEmail.trim(),
        saveContact: true,
      });
      setReassignDoc(null);
      await refreshDocuments();
    } catch (err) {
      setReassignError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setReassignSaving(false);
    }
  };

  const onCreateContact = async () => {
    if (!newContactName.trim() || !newContactEmail.trim()) return;
    setCreatingContact(true);
    setContactError(null);
    try {
      await createContact({ name: newContactName.trim(), email: newContactEmail.trim() });
      setNewContactName("");
      setNewContactEmail("");
      setShowAddContact(false);
      await refreshContacts();
    } catch (err) {
      setContactError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setCreatingContact(false);
    }
  };

  const onDeleteContact = async (id: string) => {
    setDeletingContactId(id);
    setContactError(null);
    try {
      await deleteContact(id);
      await refreshContacts();
    } catch (err) {
      setContactError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setDeletingContactId(null);
    }
  };

  const onDeleteTemplate = async (id: string) => {
    setDeletingTemplateId(id);
    setTemplateError(null);
    try {
      await deleteTemplate(id);
      await refreshTemplates();
    } catch (err) {
      setTemplateError(err instanceof Error ? err.message : t("common.error"));
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
      setWebhookError(err instanceof Error ? err.message : t("common.error"));
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
      setWebhookError(err instanceof Error ? err.message : t("common.error"));
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
      setConnectorError(err instanceof Error ? err.message : t("common.error"));
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
      setConnectorError(err instanceof Error ? err.message : t("common.error"));
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
      setTeamError(err instanceof Error ? err.message : t("common.error"));
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
      setTeamError(err instanceof Error ? err.message : t("common.error"));
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
      setTeamError(err instanceof Error ? err.message : t("common.error"));
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
      setBrandingError(err instanceof Error ? err.message : t("common.error"));
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
      setBrandingError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setDeletingLogo(false);
    }
  };

  const onSaveSlug = async () => {
    if (!slugInput.trim()) return;
    setSavingSlug(true);
    setSlugError(null);
    try {
      const { slug } = await setWorkspaceSlug(slugInput.trim());
      setWorkspaceSlugState(slug);
      setSlugInput("");
    } catch (err) {
      setSlugError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSavingSlug(false);
    }
  };

  const onClearSlug = async () => {
    setSavingSlug(true);
    setSlugError(null);
    try {
      await deleteWorkspaceSlug();
      setWorkspaceSlugState(null);
    } catch (err) {
      setSlugError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSavingSlug(false);
    }
  };

  const onUpgrade = async () => {
    track("upgrade_clicked", { source: "dashboard" });
    setUpgrading(true);
    setUpgradeError(null);
    try {
      const { url } = await startCheckout();
      window.location.href = url;
    } catch (err) {
      setUpgradeError(err instanceof Error ? err.message : t("common.error"));
      setUpgrading(false);
    }
  };

  const onUpgradeEnterprise = async () => {
    track("upgrade_clicked", { source: "dashboard_enterprise" });
    setUpgradingEnterprise(true);
    setUpgradeEnterpriseError(null);
    try {
      const { url } = await startCheckout("enterprise");
      window.location.href = url;
    } catch (err) {
      setUpgradeEnterpriseError(err instanceof Error ? err.message : t("common.error"));
      setUpgradingEnterprise(false);
    }
  };

  const onManageBilling = async () => {
    setManagingBilling(true);
    setManageBillingError(null);
    try {
      const { url } = await openBillingPortal();
      window.location.href = url;
    } catch (err) {
      setManageBillingError(err instanceof Error ? err.message : t("common.error"));
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
      setRegenerateError(err instanceof Error ? err.message : t("common.error"));
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

  // "Recurring Templates" Quick Actions — top 3 templates (saved or free) this workspace keeps
  // sending, each resolved back to a display name + a one-click "send again" link. templateId is
  // either a saved-template id (in `templates`) or a free-template slug (in FREE_TEMPLATES); a
  // usage row whose id matches neither (e.g. a template deleted since) is simply skipped.
  const recurringQuickActions = useMemo(() => {
    return templateUsage
      .filter((u) => u.isRecurring)
      .slice(0, 3)
      .flatMap((usage) => {
        const saved = templates.find((t) => t.id === usage.templateId);
        if (saved) return [{ templateId: usage.templateId, name: saved.name, href: `/prepare?template=${saved.id}`, usage }];
        const free = FREE_TEMPLATES.find((t) => t.slug === usage.templateId);
        if (free) return [{ templateId: usage.templateId, name: free.name, href: `/prepare?freeTemplate=${free.slug}`, usage }];
        return [];
      });
  }, [templateUsage, templates]);
  const topRecurringUsage = recurringQuickActions[0]?.usage;
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
    const onDocClick = (e: MouseEvent) => {
      if (profileRef.current && profileRef.current.contains(e.target as Node)) return;
      setProfileMenuOpen(false);
    };
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
        setIsAdmin(res.isAdmin);
        if (res.account) {
          track("dashboard_loaded");
          const pending = readPendingClaim();
          if (pending?.claimToken) {
            try {
              const claimed = await claimDocument(pending.claimToken);
              clearPendingClaim();
              setClaimBanner(claimed.title?.trim() || "Untitled document");
            } catch {
              // Expired / already claimed / network — drop local token so we don't retry forever.
              clearPendingClaim();
            }
          }
          const { documents } = await fetchMyDocuments();
          setDocuments(documents);
        }
        if (res.account?.isPaid) {
          const { hasToken } = await fetchTokenStatus();
          setHasToken(hasToken);
          const { templates } = await fetchTemplates();
          setTemplates(templates);
          const { usage } = await fetchTemplateUsage();
          setTemplateUsage(usage);
          const { webhooks } = await fetchWebhooks();
          setWebhooks(webhooks);
          const { contacts } = await fetchContacts();
          setContacts(contacts);
          const { members, pendingInvites } = await fetchTeam();
          setTeamMembers(members);
          setPendingInvites(pendingInvites);
          const { logoPath } = await fetchBranding();
          setBrandLogoPath(logoPath);
          const { slug } = await fetchWorkspaceSlug();
          setWorkspaceSlugState(slug);
        }
        if (res.account?.isPaid) {
          const { connections } = await fetchConnectors();
          setConnections(connections);
        }
      })
      .catch((err) => setError(err instanceof Error ? err.message : t("common.error")))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="container">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <h1>{t("common.notAvailable")}</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="container">
        <h1>{t("dash.notSignedIn")}</h1>
        <p>{t("dash.notSignedInSub")}</p>
      </div>
    );
  }

  const DOCS_SUBNAV: Array<{
    key: typeof docsSubTab;
    label: string;
    icon: "awaiting" | "waiting" | "completed";
  }> = [
    { key: "awaiting", label: t("dash.awaitingYou"), icon: "awaiting" },
    { key: "waiting", label: t("dash.waitingOthers"), icon: "waiting" },
    { key: "completed", label: t("dash.completed"), icon: "completed" },
  ];

  // Team and Subscription are deliberately absent here — they live only in the profile-menu
  // dropdown (anchored to the account row at the bottom of the sidebar), matching the SwipeSign
  // reference exactly. Listing them again in the general Tools accordion would duplicate them.
  // Contacts is top-level (like Chasa Clients), not nested under Tools.
  const TOOLS_SUBNAV: Array<{
    key: typeof toolsSubTab;
    label: string;
    icon: "connector" | "webhooks" | "connectors" | "branding";
  }> = [
    { key: "connector", label: t("dash.connector"), icon: "connector" },
    { key: "webhooks", label: t("dash.webhooks"), icon: "webhooks" },
    ...(account.isPaid ? [{ key: "connectors" as const, label: t("dash.connectors"), icon: "connectors" as const }] : []),
    { key: "branding", label: t("dash.branding"), icon: "branding" },
  ];

  return (
    <div className="dashboard-shell">
      <aside className="dashboard-sidebar">
        <Link to="/prepare" className="dashboard-nav-new">
          <NavIcon name="new" />
          <span>{t("dash.new")}</span>
        </Link>
        <button
          className={`dashboard-nav-item${activeTab === "dashboard" ? " active" : ""}`}
          onClick={() => setActiveTab("dashboard")}
        >
          <NavIcon name="dashboard" />
          <span>{t("dash.dashboard")}</span>
        </button>
        <button
          className={`dashboard-nav-item${activeTab === "templates" ? " active" : ""}`}
          onClick={() => setActiveTab("templates")}
        >
          <NavIcon name="templates" />
          <span>{t("dash.templates")}</span>
        </button>
        {account.isPaid && (
          <button
            className={`dashboard-nav-item${activeTab === "contacts" ? " active" : ""}`}
            onClick={() => setActiveTab("contacts")}
          >
            <NavIcon name="contacts" />
            <span>{t("dash.contacts")}</span>
          </button>
        )}

        <div className="dashboard-nav-group">
          <button
            className={`dashboard-nav-item dashboard-nav-group-header${activeTab === "documents" ? " active" : ""}`}
            onClick={() => {
              setActiveTab("documents");
              setDocumentsExpanded((o) => !o);
            }}
          >
            <span className="dashboard-nav-item-main">
              <NavIcon name="documents" />
              <span>{t("dash.documents")}</span>
            </span>
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
                  <NavIcon name={item.icon} size={16} />
                  <span>{item.label}</span>
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
              <span className="dashboard-nav-item-main">
                <NavIcon name="tools" />
                <span>{t("dash.tools")}</span>
              </span>
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
                    <NavIcon name={item.icon} size={16} />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="dashboard-profile" ref={profileRef}>
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
                  {t("dash.team")}
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
                  {t("dash.subscription")}
                </button>
              )}
              {isAdmin && (
                <Link to="/admin/analytics" onClick={() => setProfileMenuOpen(false)}>
                  <MenuIcon name="admin" />
                  {t("dash.admin")}
                </Link>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(new Event("docracy:open-chat"));
                  setProfileMenuOpen(false);
                }}
              >
                <MenuIcon name="support" />
                {t("dash.support")}
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
                {t("nav.logout")}
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
        {account.paymentFailedAt && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              borderColor: "var(--danger)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <span style={{ color: "var(--danger)" }}>
{t("dash.paymentFailed")}
            </span>
            {isWorkspaceOwner && (
              <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} onClick={onManageBilling}>
                {t("dash.updatePayment")}
              </button>
            )}
          </div>
        )}
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
                ? t("dash.connectorConnected")
                : t("dash.connectorFailed")}
            </span>
            <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} onClick={() => setConnectorBanner(null)}>
              Dismiss
            </button>
          </div>
        )}
        {claimBanner && (
          <div
            className="card"
            style={{
              marginBottom: 16,
              borderColor: "var(--primary)",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 12,
            }}
          >
            <span>{t("dash.claimSuccess", { title: claimBanner })}</span>
            <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} onClick={() => setClaimBanner(null)}>
              {t("common.dismiss")}
            </button>
          </div>
        )}
        {activeTab === "dashboard" && (
          <>
            <h1 className="dashboard-welcome-title">{t("dash.welcome")}</h1>
            <p className="dashboard-welcome-sub">{t("dash.welcomeSub")}</p>

            <div className="dashboard-metrics">
              <div
                className={`dashboard-metric-card card${awaitingYouDocs.length > 0 ? " dashboard-metric-card-alert" : ""}`}
              >
                <div className="dashboard-metric-label">{t("dash.awaitingYou")}</div>
                <div className="dashboard-metric-value dashboard-metric-value-primary">{awaitingYouDocs.length}</div>
              </div>
              <div className="dashboard-metric-card card">
                <div className="dashboard-metric-label">{t("dash.waitingOthers")}</div>
                <div className="dashboard-metric-value">{waitingOnOthersCount}</div>
              </div>
              <div className="dashboard-metric-card card">
                <div className="dashboard-metric-label">{t("dash.completedMonth")}</div>
                <div className="dashboard-metric-value">{completedThisMonthCount}</div>
              </div>
            </div>

            <div className="card" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 15 }}>{t("dash.awaitingYou")}</h3>
              {documents.length === 0 ? (
                <div className="dashboard-first-run">
                  <p style={{ marginBottom: 8 }}>
                    <strong>{t("dash.firstRunTitle")}</strong>
                  </p>
                  <p style={{ fontSize: 13.5, color: "var(--mute)", marginTop: 0 }}>{t("dash.firstRunSub")}</p>
                  <ol style={{ margin: "0 0 16px", paddingLeft: 18, fontSize: 14, lineHeight: 1.55 }}>
                    <li>{t("dash.firstRunStep1")}</li>
                    <li>{t("dash.firstRunStep2")}</li>
                    <li>{t("dash.firstRunStep3")}</li>
                  </ol>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
                    <Link
                      to="/prepare?freeTemplate=mutual-nda&ref=dashboard-first-run"
                      className="btn-primary"
                      style={{ textDecoration: "none" }}
                    >
                      {t("dash.firstRunCta")}
                    </Link>
                    <Link to="/prepare?ref=dashboard-first-run" className="btn-secondary" style={{ textDecoration: "none" }}>
                      {t("dash.firstRunUpload")}
                    </Link>
                  </div>
                </div>
              ) : awaitingYouDocs.length === 0 ? (
                <p className="dashboard-caught-up" style={{ marginBottom: 0 }}>
                  <span className="dashboard-caught-up-icon" aria-hidden="true">✓</span>
                  <span>
                    <strong>{t("dash.caughtUp")}</strong> {t("dash.caughtUpSub")}
                  </span>
                </p>
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
                      {t("dash.signNow")}
                    </Link>
                  </div>
                ))
              )}
            </div>

            <div className="card dashboard-start-new" style={{ marginTop: 24 }}>
              <h3 style={{ fontSize: 15 }}>{t("dash.startNew")}</h3>
              <Link to="/prepare" className="btn-primary" style={{ display: "inline-block", textDecoration: "none" }}>
                {t("dash.newDocBtn")}
              </Link>
            </div>

            {recurringQuickActions.length > 0 && (
              <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 15 }}>{t("dash.quickActions")}</h3>
                <p style={{ fontSize: 12, color: "var(--mute)", marginTop: -4 }}>
                  {t("dash.quickActionsSub")}
                </p>
                {recurringQuickActions.map((qa) => (
                  <div
                    key={qa.templateId}
                    style={{
                      display: "flex",
                      flexWrap: "wrap",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      padding: "8px 0",
                      borderBottom: "1px solid var(--hairline)",
                    }}
                  >
                    <span>
                      {qa.name}{" "}
                      <span style={{ fontSize: 12, color: "var(--mute)" }}>
                        — sent {qa.usage.completedCount} time{qa.usage.completedCount === 1 ? "" : "s"}
                      </span>
                    </span>
                    <Link to={qa.href} className="btn-secondary" style={{ textDecoration: "none", padding: "4px 10px", fontSize: 13 }}>
                      Send again
                    </Link>
                  </div>
                ))}
                {topRecurringUsage?.suggestSaving && !templates.some((t) => t.id === topRecurringUsage.templateId) && (
                  <p style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
                    💡 You've sent this {topRecurringUsage.completedCount} times — consider saving it as a reusable
                    template from the Templates tab so you don't have to re-place fields each time.
                  </p>
                )}
                {topRecurringUsage?.teamUpsell && !account.isEnterprise && (
                  <p style={{ fontSize: 13, marginTop: 12, marginBottom: 0 }}>
                    👥 This is clearly part of your regular workflow — an Enterprise team plan lets your whole team
                    share templates like this one instead of everyone recreating them.
                  </p>
                )}
              </div>
            )}

            {!account.isPaid && (
              <div className="card" style={{ marginTop: 24 }}>
                <h3 style={{ fontSize: 15 }}>{t("dash.upgradeTitle")}</h3>
                <p>
                  Unlimited signers, a connector so Claude, ChatGPT, Grok, or Perplexity can look up your documents,
                  team accounts, white-label branding, and a set of AI tools — auto-detect signature/date fields,
                  a plain-English explainer with risk highlighting, and a contract generator that turns a one-line
                  description into a signable PDF.
                </p>
                {upgradeError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{upgradeError}</p>}
                <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
                  {upgrading ? t("common.redirecting") : t("common.upgrade")}
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === "templates" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>{t("dash.freeTemplates")}</h3>
            <p style={{ fontSize: 12, color: "var(--mute)" }}>
              {t("dash.freeTemplatesSub")}
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
              {t("dash.browseFreeTemplates")}
            </Link>
          </div>
        )}

        {activeTab === "templates" && !account.isPaid && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>{t("dash.templatesPaid")}</h3>
            <p>{t("dash.templatesPaidSub")}</p>
            <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
              {upgrading ? t("common.redirecting") : t("pricing.paid.ctaUpgrade")}
            </button>
          </div>
        )}

        {activeTab === "documents" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>
              {docsSubTab === "awaiting"
                ? t("dash.awaitingYou")
                : docsSubTab === "waiting"
                ? t("dash.waitingOthers")
                : docsSubTab === "completed"
                ? t("dash.completed")
                : t("dash.allDocs")}
            </h3>
            {docActionError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{docActionError}</p>}
            {visibleDocs.length === 0 ? (
              <div>
                <p style={{ marginBottom: 12 }}>{t("dash.emptyDocs")}</p>
                <Link to="/prepare?ref=dashboard-empty-docs" className="btn-primary" style={{ textDecoration: "none" }}>
                  {t("dash.emptyDocsCta")}
                </Link>
              </div>
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
                    alignItems: "center",
                  }}
                >
                  <Link to={`/status/${doc.statusToken}`} style={{ overflowWrap: "anywhere" }}>
                    {doc.title}
                  </Link>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
                    <span
                      style={{
                        color:
                          doc.status === "completed"
                            ? "var(--success)"
                            : doc.status === "voided"
                              ? "var(--danger)"
                              : "var(--body)",
                      }}
                    >
                      {doc.status === "completed" ? t("dash.statusSigned") : doc.status === "voided" ? t("dash.statusVoided") : t("dash.statusPending")}
                    </span>
                    {account.isPaid && doc.status !== "voided" && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: "4px 8px" }}
                        onClick={() => openAttachments(doc)}
                      >
                        Files
                      </button>
                    )}
                    {doc.status === "pending" && account.isPaid && (
                      <>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: "4px 8px" }}
                          disabled={voidingDocId === doc.docId}
                          onClick={() => onVoidDocument(doc)}
                        >
                          {voidingDocId === doc.docId ? t("dash.voiding") : t("dash.void")}
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: "4px 8px" }}
                          onClick={() => openReassign(doc)}
                        >
                          Reassign
                        </button>
                        <button
                          className="btn-secondary"
                          style={{ fontSize: 12, padding: "4px 8px" }}
                          onClick={() => openEmbed(doc)}
                        >
                          Embed
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === "tools" && !account.isPaid && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>{t("dash.toolsPaid")}</h3>
            <p>
              {t("dash.toolsPaidSub")}
            </p>
            <button className="btn-primary" onClick={onUpgrade} disabled={upgrading}>
              {upgrading ? t("common.redirecting") : t("pricing.paid.ctaUpgrade")}
            </button>
          </div>
        )}

        {activeTab === "tools" && account.isPaid && isWorkspaceOwner && toolsSubTab === "subscription" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>
              {t("dash.subscription")}
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
                  {t("dash.enterprise")}
                </span>
              )}
            </h3>
            <p>{t("dash.subscriptionManage")}</p>
            {manageBillingError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{manageBillingError}</p>}
            <button className="btn-secondary" onClick={onManageBilling} disabled={managingBilling}>
              {managingBilling ? t("common.redirecting") : t("common.manageSubscription")}
            </button>

            {!account.isEnterprise && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                <p style={{ fontSize: 13, marginBottom: 4 }}>
                  <strong>{t("dash.enterpriseUpsellTitle")}</strong>
                </p>
                <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 8 }}>
                  {t("dash.enterpriseUpsellBody")}
                </p>
                {upgradeEnterpriseError && (
                  <p style={{ color: "var(--danger)", fontSize: 13 }}>{upgradeEnterpriseError}</p>
                )}
                <button className="btn-secondary" onClick={onUpgradeEnterprise} disabled={upgradingEnterprise}>
                  {upgradingEnterprise ? t("common.redirecting") : t("dash.upgradeEnterprise")}
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === "tools" && account.isPaid && toolsSubTab === "connector" && (
          <div className="card" style={{ marginTop: 24 }}>
            <h3 style={{ fontSize: 15 }}>{t("dash.mcpTitle")}</h3>
          <p>{t("dash.mcpStatus", { status: hasToken ? t("dash.mcpStatusActive") : t("dash.mcpStatusNone") })}</p>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            {t("dash.mcpIntro")}
          </p>
          {newConnectorUrl && newApiKey ? (
            <>
              <p style={{ marginBottom: 4 }}>
                {t("dash.mcpPasteUrl")}
              </p>
              <input className="form-input" readOnly value={newConnectorUrl} style={{ width: "100%", marginBottom: 12 }} />
              <p style={{ marginBottom: 4 }}>{t("dash.mcpPasteKey")}</p>
              <input className="form-input" readOnly value={newApiKey} style={{ width: "100%" }} />
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 4, marginBottom: 0 }}>
                {t("dash.mcpShownOnce")}
              </p>
            </>
          ) : (
            <p style={{ marginBottom: 0 }}>
              {hasToken
                ? t("dash.mcpRegenWarn")
                : t("dash.mcpGenerateHint")}
            </p>
          )}
          {regenerateError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{regenerateError}</p>}
          <button className="btn-secondary" onClick={onRegenerateToken} disabled={regenerating} style={{ marginTop: 8 }}>
            {regenerating ? t("common.generating") : hasToken ? t("common.regenerate") : t("common.generate")}
          </button>

          <details style={{ marginTop: 16 }}>
            <summary style={{ cursor: "pointer", fontSize: 13, color: "var(--primary)" }}>
              {t("dash.mcpFaqSummary")}
            </summary>
            <div style={{ marginTop: 12, fontSize: 13, color: "var(--body)", lineHeight: 1.6 }}>
              <p style={{ marginTop: 0 }}>{t("dash.mcpFaqBody")}</p>
              <Link to="/mcp">{t("dash.mcpFaqLink")}</Link>
            </div>
          </details>
        </div>
      )}

      {activeTab === "templates" && account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontSize: 15, margin: 0 }}>{t("dash.templates")}</h3>
            {templates.length > 0 && (
              <Link to="/bulk-send" className="btn-secondary" style={{ textDecoration: "none", padding: "4px 10px", fontSize: 13 }}>
                {t("dash.bulkSend")}
              </Link>
            )}
          </div>
          {templateError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{templateError}</p>}
          {templates.length === 0 ? (
            <>
              <p style={{ marginBottom: 12 }}>
                {t("dash.noTemplatesYet")}
              </p>
              <Link to="/prepare" className="btn-secondary" style={{ textDecoration: "none", display: "inline-block" }}>
                {t("dash.prepareDoc")}
              </Link>
            </>
          ) : (
            templates.map((tpl) => (
              <div
                key={tpl.id}
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
                  {tpl.name}{" "}
                  <span style={{ fontSize: 12, color: "var(--mute)" }}>
                    {t("dash.templateMeta", {
                      signers: tpl.signerCount,
                      sPlural: tpl.signerCount === 1 ? "" : "s",
                      pages: tpl.pageCount,
                      pPlural: tpl.pageCount === 1 ? "" : "s",
                    })}
                  </span>
                </span>
                <span style={{ display: "flex", gap: 8 }}>
                  <Link to={`/prepare?template=${tpl.id}`} className="btn-secondary" style={{ textDecoration: "none", padding: "4px 10px", fontSize: 13 }}>
                    {t("common.use")}
                  </Link>
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: "4px 10px" }}
                    disabled={deletingTemplateId === tpl.id}
                    onClick={() => onDeleteTemplate(tpl.id)}
                  >
                    {deletingTemplateId === tpl.id ? t("common.deleting") : t("common.delete")}
                  </button>
                </span>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "tools" && account.isPaid && toolsSubTab === "webhooks" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>{t("dash.webhooks")}</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            {t("dash.webhooksSub")}
          </p>
          {webhookError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{webhookError}</p>}
          {webhooks.length === 0 ? (
            <p style={{ marginBottom: 12 }}>{t("dash.noWebhooks")}</p>
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
                  {deletingWebhookId === w.id ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            ))
          )}

          {newWebhookSecret && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <p style={{ marginBottom: 4 }}>
                {t("dash.webhookSecret")}
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
                aria-label={t("dash.webhookUrlAria")}
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
                {creatingWebhook ? t("common.adding") : t("dash.addWebhook")}
              </button>
            </div>
          ) : (
            <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowAddWebhook(true)}>
              {t("dash.addWebhookPlus")}
            </button>
          )}
        </div>
      )}

      {activeTab === "contacts" && account.isPaid && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>{t("dash.contacts")}</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            {t("dash.contactsSub")}
          </p>
          {contactError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{contactError}</p>}
          {contacts.length === 0 ? (
            <p style={{ marginBottom: 12 }}>{t("dash.noContacts")}</p>
          ) : (
            contacts.map((c) => (
              <div
                key={c.id}
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
                  {c.name}{" "}
                  <span style={{ fontSize: 12, color: "var(--mute)" }}>
                    ({c.email}
                    {c.company ? ` · ${c.company}` : ""})
                  </span>
                </span>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 13, padding: "4px 10px" }}
                  disabled={deletingContactId === c.id}
                  onClick={() => onDeleteContact(c.id)}
                >
                  {deletingContactId === c.id ? t("common.deleting") : t("common.delete")}
                </button>
              </div>
            ))
          )}

          {showAddContact ? (
            <div style={{ marginTop: 12 }}>
              <input
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                placeholder={t("dash.namePlaceholder")}
                aria-label={t("dash.contactNameAria")}
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
              />
              <input
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                placeholder={t("dash.emailPlaceholder")}
                aria-label={t("dash.contactEmailAria")}
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
              />
              <button
                className="btn-secondary"
                disabled={creatingContact || !newContactName.trim() || !newContactEmail.trim()}
                onClick={onCreateContact}
              >
                {creatingContact ? t("common.adding") : t("dash.addContact")}
              </button>
            </div>
          ) : (
            <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowAddContact(true)}>
              {t("dash.addContactPlus")}
            </button>
          )}
        </div>
      )}

      {activeTab === "tools" && account.isPaid && toolsSubTab === "connectors" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>{t("dash.connectors")}</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            {t("dash.connectorsSub")}
          </p>
          {connectorError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{connectorError}</p>}
          {(
            [
              { provider: "dropbox" as const, label: "Dropbox", logo: (
                <svg width="20" height="20" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#0061FF" d="M10 2.5L0 9.167l10 6.666 10-6.666zM30 2.5l-10 6.667 10 6.666 10-6.666zM0 22.5l10 6.667 10-6.667-10-6.666zM30 15.834l-10 6.666 10 6.667 10-6.667zM10 30.834l10 6.666 10-6.666-10-6.667z"/>
                </svg>
              )},
              { provider: "onedrive" as const, label: "OneDrive", logo: (
                <svg width="22" height="16" viewBox="0 0 22 16" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#0364B8" d="M13.18 5.77l-.01-.04A5.5 5.5 0 002.5 8a.5.5 0 00.01.08A4 4 0 004.5 16H18a4 4 0 001.41-7.74 5.5 5.5 0 00-6.23-2.49z"/>
                </svg>
              )},
              { provider: "box" as const, label: "Box", logo: (
                <svg width="34" height="14" viewBox="0 0 34 14" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <text x="0" y="12" fontFamily="Arial Black, sans-serif" fontWeight="900" fontSize="14" fill="#0061D5">Box</text>
                </svg>
              )},
              { provider: "google" as const, label: "Google Drive", logo: (
                <svg width="22" height="20" viewBox="0 0 87.3 78" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path fill="#0066DA" d="M6.6 66.85l3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3L27.45 53.5H0c0 1.55.4 3.1 1.2 4.5z"/>
                  <path fill="#00AC47" d="M43.65 25L29.9 1.2C28.55 2 27.4 3.1 26.6 4.5L1.2 48.5C.4 49.9 0 51.45 0 53h27.45z"/>
                  <path fill="#EA4335" d="M73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l8.55-14.8c.8-1.4 1.2-2.95 1.2-4.5H59.85z"/>
                  <path fill="#00832D" d="M43.65 25L58.25 0H39.05c-1.6 0-3.15.45-4.5 1.2z"/>
                  <path fill="#2684FC" d="M27.45 53.5 13.75 76.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2L59.85 53.5z"/>
                  <path fill="#FFBA00" d="M59.85 53.5H87.3c0-1.55-.4-3.1-1.2-4.5L72.9 26.2c-.8-1.4-1.95-2.5-3.3-3.3L43.65 25z"/>
                </svg>
              )},
            ]
          ).map(({ provider, label, logo }) => {
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
                <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: 28, height: 28, flexShrink: 0 }}>
                    {logo}
                  </span>
                  <span>
                    {label}
                    {connection && (
                      <span style={{ fontSize: 12, color: "var(--mute)" }}>
                        {connection.connectedEmail
                          ? t("dash.connectedAs", { email: connection.connectedEmail })
                          : t("dash.connected")}
                      </span>
                    )}
                  </span>
                </span>
                {connection ? (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: "4px 10px" }}
                    disabled={disconnectingProvider === provider}
                    onClick={() => onDisconnectProvider(provider)}
                  >
                    {disconnectingProvider === provider ? t("common.disconnecting") : t("common.disconnect")}
                  </button>
                ) : (
                  <button
                    className="btn-secondary"
                    style={{ fontSize: 13, padding: "4px 10px" }}
                    disabled={connectingProvider === provider}
                    onClick={() => onConnectProvider(provider)}
                  >
                    {connectingProvider === provider ? t("common.connecting") : t("common.connect")}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {activeTab === "tools" && account.isPaid && toolsSubTab === "branding" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>{t("dash.branding")}</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            {t("dash.brandingSub")}
          </p>
          {brandingError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{brandingError}</p>}
          {brandLogoPath ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
              <img
                src={apiUrl(brandLogoPath)}
                alt={t("dash.yourLogo")}
                style={{ maxHeight: 48, maxWidth: 220, display: "block" }}
              />
              <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} disabled={deletingLogo} onClick={onDeleteLogo}>
                {deletingLogo ? t("common.removing") : t("dash.removeLogo")}
              </button>
            </div>
          ) : (
            <div>
              <input
                type="file"
                aria-label={t("dash.uploadLogoAria")}
                accept="image/png,image/jpeg,image/webp"
                disabled={uploadingLogo}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onUploadLogo(file);
                  e.target.value = "";
                }}
              />
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>
                {t("dash.logoHint")} {uploadingLogo && t("common.uploading")}
              </p>
            </div>
          )}

          <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
            <p style={{ fontSize: 13, marginBottom: 4 }}>
              <strong>{t("dash.workspaceName")}</strong>
            </p>
            <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 0 }}>
              {t("dash.workspaceNameSub")}
            </p>
            {slugError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{slugError}</p>}
            {workspaceSlug ? (
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ fontSize: 14 }}>{workspaceSlug}</span>
                <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} disabled={savingSlug} onClick={onClearSlug}>
                  {savingSlug ? t("common.removing") : t("common.remove")}
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <input
                  className="form-input"
                  style={{ maxWidth: 220 }}
                  placeholder="e.g. AcmeInc"
                  aria-label={t("dash.workspaceNameAria")}
                  value={slugInput}
                  onChange={(e) => setSlugInput(e.target.value)}
                  disabled={savingSlug}
                />
                <button className="btn-secondary" style={{ fontSize: 13, padding: "4px 10px" }} disabled={savingSlug || !slugInput.trim()} onClick={onSaveSlug}>
                  {savingSlug ? t("common.saving") : t("common.save")}
                </button>
              </div>
            )}
            <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>
              {t("dash.workspaceNameRules")}
            </p>
          </div>
        </div>
      )}

      {activeTab === "tools" && account.isPaid && toolsSubTab === "team" && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15 }}>{t("dash.team")}</h3>
          <p style={{ fontSize: 12, color: "var(--mute)" }}>
            {t("dash.teamSub")}
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
                  {removingMemberId === m.accountId ? t("common.removing") : t("common.remove")}
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
                  {invite.email} <span style={{ fontSize: 12, color: "var(--mute)" }}>{t("dash.invitedPending")}</span>
                </span>
                <button
                  className="btn-secondary"
                  style={{ fontSize: 13, padding: "4px 10px" }}
                  disabled={cancelingInviteId === invite.id}
                  onClick={() => onCancelInvite(invite.id)}
                >
                  {cancelingInviteId === invite.id ? t("status.cancelling") : t("dash.cancelInvite")}
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
                  aria-label={t("dash.teammateEmailAria")}
                  type="email"
                  value={newInviteEmail}
                  onChange={(e) => setNewInviteEmail(e.target.value)}
                />
                <button
                  className="btn-secondary"
                  disabled={invitingTeammate || !newInviteEmail.trim()}
                  onClick={onInviteTeammate}
                >
                  {invitingTeammate ? t("common.inviting") : t("dash.sendInvite")}
                </button>
              </div>
            ) : (
              <button className="btn-secondary" style={{ marginTop: 8 }} onClick={() => setShowInviteInput(true)}>
                {t("dash.inviteTeammate")}
              </button>
            )
          ) : (
            <p style={{ fontSize: 12, color: "var(--mute)", marginBottom: 0, marginTop: 8 }}>
              {t("dash.teamOwnerOnly")}
            </p>
          )}

          {recurringQuickActions.length > 0 && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
              <h4 style={{ fontSize: 13, marginBottom: 4 }}>{t("dash.sharedTemplates")}</h4>
              <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 0 }}>
                {t("dash.sharedTemplatesSub")}
              </p>
              {recurringQuickActions.map((qa) => (
                <div key={qa.templateId} style={{ fontSize: 13, padding: "4px 0" }}>
                  {qa.name} <span style={{ fontSize: 12, color: "var(--mute)" }}>({qa.usage.completedCount}×)</span>
                </div>
              ))}
              {!account.isEnterprise && topRecurringUsage?.teamUpsell && (
                <p style={{ fontSize: 13, marginTop: 8, marginBottom: 0 }}>
                  {t("dash.teamEnterpriseUpsell")}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {reassignDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div className="card" style={{ background: "var(--canvas)", boxShadow: "var(--shadow-lg)", maxWidth: 420, width: "92vw" }}>
            <h3 style={{ fontSize: 15, marginTop: 0 }}>{t("dash.reassignTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>{reassignDoc.title}</p>
            {reassignLoading ? (
              <p>{t("dash.loadingSigners")}</p>
            ) : reassignSigners.length === 0 ? (
              <p style={{ marginBottom: 12 }}>{t("dash.noPendingReassign")}</p>
            ) : (
              <>
                <select
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8 }}
                  value={reassignOrder ?? ""}
                  onChange={(e) => {
                    const order = Number(e.target.value);
                    setReassignOrder(order);
                    const signer = reassignSigners.find((s) => s.order === order);
                    if (signer) setReassignName(signer.name);
                  }}
                >
                  <option value="" disabled>
                    {t("dash.selectSigner")}
                  </option>
                  {reassignSigners.map((s) => (
                    <option key={s.order} value={s.order}>
                      {s.order}. {s.name}
                    </option>
                  ))}
                </select>
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8 }}
                  placeholder={t("dash.newName")}
                  aria-label={t("dash.newSignerNameAria")}
                  value={reassignName}
                  onChange={(e) => setReassignName(e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8 }}
                  placeholder={t("dash.newEmail")}
                  aria-label={t("dash.newSignerEmailAria")}
                  type="email"
                  list={contacts.length > 0 ? "dashboard-contacts" : undefined}
                  value={reassignEmail}
                  onChange={(e) => setReassignEmail(e.target.value)}
                />
                {contacts.length > 0 && (
                  <datalist id="dashboard-contacts">
                    {contacts.map((c) => (
                      <option key={c.id} value={c.email}>
                        {c.name}
                      </option>
                    ))}
                  </datalist>
                )}
              </>
            )}
            {reassignError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{reassignError}</p>}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button
                className="btn-primary"
                disabled={
                  reassignLoading ||
                  reassignSaving ||
                  reassignOrder == null ||
                  !reassignName.trim() ||
                  !reassignEmail.trim()
                }
                onClick={onReassign}
              >
                {reassignSaving ? t("dash.reassigning") : t("dash.reassign")}
              </button>
              <button className="btn-secondary" disabled={reassignSaving} onClick={() => setReassignDoc(null)}>
                {t("common.cancel")}
              </button>
            </div>
          </div>
        </div>
      )}

      {embedDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div className="card" style={{ background: "var(--canvas)", boxShadow: "var(--shadow-lg)", maxWidth: 480, width: "92vw" }}>
            <h3 style={{ fontSize: 15, marginTop: 0 }}>{t("dash.embedTitle")}</h3>
            <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>{embedDoc.title}</p>
            {embedLoading ? (
              <p>{t("dash.loadingSigners")}</p>
            ) : embedResult ? (
              <>
                <p style={{ fontSize: 13 }}>{t("dash.embedExpires", { when: new Date(embedResult.expiresAt).toLocaleString() })}</p>
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8, fontSize: 12 }}
                  readOnly
                  value={embedResult.embedUrl}
                  onFocus={(e) => e.target.select()}
                />
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => void navigator.clipboard.writeText(embedResult.embedUrl)}
                >
                  {t("dash.copyEmbedUrl")}
                </button>
              </>
            ) : embedSigners.length === 0 ? (
              <p style={{ marginBottom: 12 }}>{t("dash.noPendingEmbed")}</p>
            ) : (
              <>
                <select
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8 }}
                  value={embedOrder ?? ""}
                  onChange={(e) => setEmbedOrder(Number(e.target.value))}
                >
                  <option value="" disabled>
                    {t("dash.selectSigner")}
                  </option>
                  {embedSigners.map((s) => (
                    <option key={s.order} value={s.order}>
                      {s.order}. {s.name}
                    </option>
                  ))}
                </select>
                <textarea
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8, minHeight: 72, fontSize: 12 }}
                  placeholder={t("dash.allowedOriginsPh")}
                  aria-label={t("dash.allowedOriginsAria")}
                  value={embedOrigins}
                  onChange={(e) => setEmbedOrigins(e.target.value)}
                />
                <input
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8 }}
                  placeholder={t("dash.returnUrlPh")}
                  aria-label={t("dash.returnUrlAria")}
                  value={embedReturnUrl}
                  onChange={(e) => setEmbedReturnUrl(e.target.value)}
                />
              </>
            )}
            {embedError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{embedError}</p>}
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              {!embedResult && (
                <button
                  className="btn-primary"
                  disabled={embedLoading || embedCreating || embedOrder == null || embedSigners.length === 0}
                  onClick={() => void onCreateEmbed()}
                >
                  {embedCreating ? t("common.creating") : t("dash.createEmbedUrl")}
                </button>
              )}
              <button className="btn-secondary" disabled={embedCreating} onClick={() => setEmbedDoc(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {attachmentsDoc && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}
        >
          <div className="card" style={{ background: "var(--canvas)", boxShadow: "var(--shadow-lg)", maxWidth: 420, width: "92vw" }}>
            <h3 style={{ fontSize: 15, marginTop: 0 }}>Signer uploads</h3>
            <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 0 }}>{attachmentsDoc.title}</p>
            {attachmentsLoading ? (
              <p>{t("common.loading")}</p>
            ) : attachmentGroups.length === 0 ? (
              <p style={{ marginBottom: 12 }}>{t("dash.attachmentsEmpty")}</p>
            ) : (
              <SignerAttachmentsList
                groups={attachmentGroups}
                buildDownloadUrl={(order, id) => accountAttachmentDownloadUrl(attachmentsDoc.docId, order, id)}
              />
            )}
            {attachmentsError && <p style={{ color: "var(--danger)", fontSize: 13 }}>{attachmentsError}</p>}
            <button className="btn-secondary" style={{ marginTop: 12 }} onClick={() => setAttachmentsDoc(null)}>
              Close
            </button>
          </div>
        </div>
      )}

      </div>

      <nav className="dashboard-bottom-nav" aria-label={t("dash.dashboard")}>
        <button
          type="button"
          className={`dashboard-bottom-nav-item${activeTab === "dashboard" ? " active" : ""}`}
          onClick={() => {
            setActiveTab("dashboard");
            setMoreSheetOpen(false);
          }}
        >
          <BottomNavIcon name="dashboard" />
          <span>{t("dash.dashboard")}</span>
        </button>
        <button
          type="button"
          className={`dashboard-bottom-nav-item${
            account.isPaid
              ? activeTab === "contacts"
                ? " active"
                : ""
              : activeTab === "templates"
                ? " active"
                : ""
          }`}
          onClick={() => {
            if (account.isPaid) setActiveTab("contacts");
            else setActiveTab("templates");
            setMoreSheetOpen(false);
          }}
        >
          <BottomNavIcon name="contacts" />
          <span>{account.isPaid ? t("dash.contacts") : t("dash.templates")}</span>
        </button>
        <Link to="/prepare" className="dashboard-bottom-nav-fab" aria-label={t("dash.newDocument")}>
          <span aria-hidden="true">+</span>
        </Link>
        <button
          type="button"
          className={`dashboard-bottom-nav-item${activeTab === "documents" ? " active" : ""}`}
          onClick={() => {
            openDocuments("all");
            setMoreSheetOpen(false);
          }}
        >
          <BottomNavIcon name="documents" />
          <span>{t("dash.documents")}</span>
        </button>
        <button
          type="button"
          className={`dashboard-bottom-nav-item${moreSheetOpen ? " active" : ""}`}
          onClick={() => setMoreSheetOpen((o) => !o)}
        >
          <BottomNavIcon name="more" />
          <span>{t("dash.more")}</span>
        </button>
      </nav>

      {moreSheetOpen && (
        <div className="dashboard-more-sheet" role="dialog" aria-label={t("dash.more")}>
          <button type="button" className="dashboard-more-backdrop" aria-label={t("common.close")} onClick={() => setMoreSheetOpen(false)} />
          <div className="dashboard-more-panel">
            <div className="dashboard-more-handle" aria-hidden="true" />
            <p className="dashboard-more-email">{account.email}</p>
            <button
              type="button"
              onClick={() => {
                setActiveTab("templates");
                setMoreSheetOpen(false);
              }}
            >
              {t("dash.templates")}
            </button>
            {account.isPaid &&
              TOOLS_SUBNAV.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => {
                    openTools(item.key);
                    setMoreSheetOpen(false);
                  }}
                >
                  {item.label}
                </button>
              ))}
            {account.isPaid && (
              <button
                type="button"
                onClick={() => {
                  openTools("team");
                  setMoreSheetOpen(false);
                }}
              >
                {t("dash.team")}
              </button>
            )}
            {account.isPaid && isWorkspaceOwner && (
              <button
                type="button"
                onClick={() => {
                  openTools("subscription");
                  setMoreSheetOpen(false);
                }}
              >
                {t("dash.subscription")}
              </button>
            )}
            {isAdmin && (
              <Link to="/admin/analytics" onClick={() => setMoreSheetOpen(false)}>
                {t("dash.admin")}
              </Link>
            )}
            <button
              type="button"
              onClick={() => {
                window.dispatchEvent(new Event("docracy:open-chat"));
                setMoreSheetOpen(false);
              }}
            >
              {t("dash.support")}
            </button>
            <button type="button" className="dashboard-more-danger" onClick={() => void onLogout()}>
              {t("nav.logout")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
