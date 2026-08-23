import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useI18n } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";
import PdfViewer from "../components/PdfViewer";
import {
  analyzeDocumentRisks,
  createDocument,
  createTemplate,
  explainDocument,
  fetchContacts,
  fetchMarketplaceTemplate,
  fetchMe,
  fetchTemplate,
  fetchTemplates,
  fetchTemplateUsage,
  generateContract,
  importGoogleDoc,
  submitDocumentToMarketplace,
} from "../lib/api";
import type { Account, ContactSummary, ContractRisk, TemplateSummary, TemplateUsageEntry } from "../lib/api";
import { base64ToBytes } from "../lib/base64";
import {
  addTextAnnotation,
  extractDocumentText,
  getPageCount,
  getPageTextSpans,
  rasterizePageAsPng,
  replacePageWithImage,
  replaceTextSpan,
  reorderPages,
} from "../lib/pdfEdit";
import type { TextSpan } from "../lib/pdfEdit";
import { getFreeTemplate } from "../lib/freeTemplates";
import { assignFieldsToSigners, detectAnchorFields, detectFieldCandidates } from "../lib/fieldDetection";
import type { CcRecipientInput, DocField, DocFieldType, SignerInput } from "../lib/types";
import { track } from "../lib/track";
import { takePendingUploadFile } from "../lib/pendingUpload";

const FREE_TIER_MAX_SIGNERS = 2;
const FREE_TIER_MAX_CCS = 2;
const WHATSAPP_FREE_MONTHLY_LIMIT = 1;
const WHATSAPP_PAID_MONTHLY_LIMIT = 10;
const WHATSAPP_ENTERPRISE_MONTHLY_LIMIT = 50;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

// Signature/initials are taller to leave room for the auto-printed "email · date" caption text/date
// fields don't get; text/date are narrower single-line boxes.
const FIELD_SIZE_BY_TYPE: Record<DocFieldType, { w: number; h: number }> = {
  signature: { w: 0.26, h: 0.07 },
  initials: { w: 0.1, h: 0.06 },
  text: { w: 0.22, h: 0.04 },
  date: { w: 0.16, h: 0.04 },
  checkbox: { w: 0.04, h: 0.04 },
  dropdown: { w: 0.22, h: 0.05 },
};

const FIELD_TYPE_LABEL_KEYS = {
  signature: "prepare.signHere",
  initials: "prepare.initialHere",
  text: "prepare.fieldText",
  date: "prepare.fieldDate",
  checkbox: "prepare.fieldCheckbox",
  dropdown: "prepare.fieldDropdown",
} as const satisfies Record<DocFieldType, string>;

/** Shorter names for place-mode chrome (vs. the on-document chip labels above). */
const FIELD_TYPE_NAME_KEYS = {
  signature: "prepare.fieldSignature",
  initials: "prepare.fieldInitials",
  text: "prepare.fieldText",
  date: "prepare.fieldDate",
  checkbox: "prepare.fieldCheckbox",
  dropdown: "prepare.fieldDropdown",
} as const satisfies Record<DocFieldType, string>;

let fieldIdCounter = 0;

// Keep in sync with apps/worker/wrangler.toml's DOC_TTL_DAYS — shown as a cosmetic "expires in"
// hint in the sidebar summary; not worth a network round-trip to fetch for a single number.
const DOC_EXPIRY_DAYS = 9;

function SidebarHeading({ label, count }: { label: string; count?: number }) {
  return (
    <div className="prepare-heading-row">
      <h3 className="prepare-sidebar-heading">{label}</h3>
      {typeof count === "number" && <span className="prepare-count-badge">{count}</span>}
    </div>
  );
}

export default function Prepare() {
  const { t, locale } = useI18n();
  useSeoMeta("prepare");
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const freeTemplateSlug = searchParams.get("freeTemplate");
  const marketplaceTemplateSlug = searchParams.get("marketplaceTemplate");
  // Refs (not state) since these only need to be read once, in an unmount cleanup — a ref keeps
  // that cleanup's closure looking at the live value without adding either to a dependency array.
  const documentSentRef = useRef(false);
  const activeTemplateRef = useRef<{ id: string; category?: string } | null>(null);
  activeTemplateRef.current = templateId
    ? { id: templateId }
    : freeTemplateSlug
      ? { id: freeTemplateSlug, category: getFreeTemplate(freeTemplateSlug)?.recurringCategory }
      : marketplaceTemplateSlug
        ? { id: marketplaceTemplateSlug }
        : null;

  // template_abandoned: fires once, only if a template was actually active and the user never
  // completed a send before leaving — covers both client-side navigation away (cleanup runs) and
  // closing the tab (track()'s keepalive fetch survives that, unlike a plain fetch would).
  useEffect(() => {
    return () => {
      if (activeTemplateRef.current && !documentSentRef.current) {
        track("template_abandoned", {
          templateId: activeTemplateRef.current.id,
          templateCategory: activeTemplateRef.current.category,
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [importingGoogleDoc, setImportingGoogleDoc] = useState(false);
  const [googleDocError, setGoogleDocError] = useState<string | null>(null);
  const [preparerSigns, setPreparerSigns] = useState(false);
  const [preparerEmail, setPreparerEmail] = useState("");
  const [preparerMarketingOptIn, setPreparerMarketingOptIn] = useState(false);
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [signingMode, setSigningMode] = useState<"sequential" | "parallel">("sequential");
  const [signers, setSigners] = useState<SignerInput[]>([
    { order: 1, name: "", email: "" },
    { order: 2, name: "", email: "" },
  ]);
  const [ccRecipients, setCcRecipients] = useState<CcRecipientInput[]>([]);
  const [contacts, setContacts] = useState<ContactSummary[]>([]);
  const [fields, setFields] = useState<DocField[]>([]);
  const [placingSignerOrder, setPlacingSignerOrder] = useState(1);
  const [placingFieldType, setPlacingFieldType] = useState<DocFieldType>("signature");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDraggingUpload, setIsDraggingUpload] = useState(false);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [creatingDrag, setCreatingDrag] = useState<{ x: number; y: number; overPage: boolean } | null>(null);
  /** Mobile: Place signature → tap PDF to drop; placed fields stay finger-draggable. */
  const [preferTapPlace, setPreferTapPlace] = useState(false);
  const [placeMode, setPlaceMode] = useState(false);
  /** Swipesign-style: setup lives in a sheet; document stays full-bleed when sheet is hidden. */
  const [setupOpen, setSetupOpen] = useState(true);
  const pdfColRef = useRef<HTMLDivElement>(null);

  // PDF editing (reorder/delete pages, redact, insert text) — a separate mode from field
  // placement, since the interactions (page-level controls, drag-to-redact, click-to-annotate)
  // would otherwise collide with the field drag/create handlers above.
  const [viewMode, setViewMode] = useState<"fields" | "edit">("fields");
  const [editTool, setEditTool] = useState<"move" | "redact" | "text" | "editText">("move");
  const [totalPages, setTotalPages] = useState(0);
  const [pdfEditBusy, setPdfEditBusy] = useState(false);
  const [pdfEditError, setPdfEditError] = useState<string | null>(null);
  const [pdfEditNotice, setPdfEditNotice] = useState<string | null>(null);
  const [redactDrag, setRedactDrag] = useState<{ page: number; xFrac: number; yFrac: number; wFrac: number; hFrac: number } | null>(null);
  const [pendingRedaction, setPendingRedaction] = useState<{ page: number; xFrac: number; yFrac: number; wFrac: number; hFrac: number } | null>(
    null
  );
  const [textAnnotationAt, setTextAnnotationAt] = useState<{ page: number; xFrac: number; yFrac: number } | null>(null);
  const [textAnnotationValue, setTextAnnotationValue] = useState("");
  const [pageTextSpans, setPageTextSpans] = useState<TextSpan[]>([]);
  const [loadingTextSpans, setLoadingTextSpans] = useState(false);
  const [editingSpan, setEditingSpan] = useState<TextSpan | null>(null);
  const [editingSpanValue, setEditingSpanValue] = useState("");
  const redactStartRef = useRef<{ page: number; rect: DOMRect; xFrac: number; yFrac: number } | null>(null);

  const [detectingFields, setDetectingFields] = useState(false);
  const [detectFieldsError, setDetectFieldsError] = useState<string | null>(null);
  const [detectFieldsNotice, setDetectFieldsNotice] = useState<string | null>(null);
  const [detectingAnchors, setDetectingAnchors] = useState(false);
  const [smsInvites, setSmsInvites] = useState(false);
  const [whatsappInvites, setWhatsappInvites] = useState(false);
  const [signerAttachmentsEnabled, setSignerAttachmentsEnabled] = useState(false);
  const [dropdownOptionsInput, setDropdownOptionsInput] = useState(() => t("prepare.defaultDropdownOptions"));
  const previousDefaultDropdownOptionsRef = useRef(dropdownOptionsInput);
  const [explaining, setExplaining] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [explainError, setExplainError] = useState<string | null>(null);
  const [analyzingRisks, setAnalyzingRisks] = useState(false);
  const [risks, setRisks] = useState<ContractRisk[] | null>(null);
  const [risksError, setRisksError] = useState<string | null>(null);
  const [showGenerate, setShowGenerate] = useState(false);
  const [generatePrompt, setGeneratePrompt] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const [account, setAccount] = useState<Account | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<TemplateSummary[]>([]);
  const [templateUsage, setTemplateUsage] = useState<TemplateUsageEntry[]>([]);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [showTemplateNameInput, setShowTemplateNameInput] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(null);
  const [templateSavedName, setTemplateSavedName] = useState<string | null>(null);
  const [showMarketplaceInput, setShowMarketplaceInput] = useState(false);
  const [marketplaceTitleInput, setMarketplaceTitleInput] = useState("");
  const [submittingToMarketplace, setSubmittingToMarketplace] = useState(false);
  const [marketplaceSubmitError, setMarketplaceSubmitError] = useState<string | null>(null);
  const [marketplaceSubmittedSlug, setMarketplaceSubmittedSlug] = useState<string | null>(null);
  /** Paid custom retention — default matches free/hard-coded DOC_EXPIRY_DAYS. */
  const [ttlDays, setTtlDays] = useState(DOC_EXPIRY_DAYS);

  useEffect(() => {
    const nextDefault = t("prepare.defaultDropdownOptions");
    setDropdownOptionsInput((prev) =>
      prev === previousDefaultDropdownOptionsRef.current ? nextDefault : prev
    );
    previousDefaultDropdownOptionsRef.current = nextDefault;
  }, [t]);

  // Match prepare-grid's 860px stack breakpoint exactly (CSS mobile sheet/dock live in the same
  // media query). Coarse-pointer desktops keep chip drag so wide layouts aren't half-mobile.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 860px)");
    const sync = () => setPreferTapPlace(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!placeMode && !setupOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      if (placeMode) setPlaceMode(false);
      else if (preferTapPlace && setupOpen) setSetupOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [placeMode, setupOpen, preferTapPlace]);

  // Open setup when a PDF first lands on mobile so signers can be filled without hunting for UI.
  // Guarded to fire once per document (not every time preferTapPlace re-evaluates to true) —
  // otherwise this re-opens the sheet right after the user closes it to place a field, since
  // `preferTapPlace` re-settling to the same `true` value still re-runs the effect.
  const autoOpenedForBytesRef = useRef<Uint8Array | null>(null);
  useEffect(() => {
    if (pdfBytes && preferTapPlace && autoOpenedForBytesRef.current !== pdfBytes) {
      autoOpenedForBytesRef.current = pdfBytes;
      setSetupOpen(true);
    }
  }, [pdfBytes, preferTapPlace]);

  // Only used to gate the (paid-only) template UI — anonymous/free usage of this page is
  // otherwise completely unaffected by this call.
  useEffect(() => {
    fetchMe()
      .then((res) => setAccount(res.account))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (!account?.isPaid) {
      setContacts([]);
      return;
    }
    fetchContacts()
      .then((res) => setContacts(res.contacts))
      .catch(() => setContacts([]));
  }, [account?.isPaid]);

  useEffect(() => {
    if (account?.isPaid && !pdfBytes) {
      fetchTemplates()
        .then((res) => setAvailableTemplates(res.templates))
        .catch(() => setAvailableTemplates([]));
      fetchTemplateUsage()
        .then((res) => setTemplateUsage(res.usage))
        .catch(() => setTemplateUsage([]));
    }
  }, [account, pdfBytes]);

  useEffect(() => {
    if (!templateId) return;
    setLoadingTemplate(true);
    setTemplateLoadError(null);
    fetchTemplate(templateId)
      .then((tpl) => {
        const bytes = base64ToBytes(tpl.pdfBase64);
        setPdfBytes(bytes);
        setFields(tpl.fields);
        // Uint8Array's `.buffer` is typed ArrayBufferLike (could be a SharedArrayBuffer) which
        // BlobPart rejects — base64ToBytes's output is always backed by a plain ArrayBuffer.
        setFile(
          new File([bytes as unknown as BlobPart], `${tpl.name || t("prepare.defaultTemplateFilename")}.pdf`, {
            type: "application/pdf",
          })
        );
        setSigners(Array.from({ length: tpl.signerCount }, (_, i) => ({ order: i + 1, name: "", email: "" })));
      })
      .catch((err) => setTemplateLoadError(err instanceof Error ? err.message : t("prepare.loadTemplateError")))
      .finally(() => setLoadingTemplate(false));
  }, [templateId]);

  // Free templates are static PDFs shipped with the site — no account, no D1 lookup, unlike the
  // paid saved-templates flow above.
  useEffect(() => {
    if (!freeTemplateSlug) return;
    const template = getFreeTemplate(freeTemplateSlug);
    if (!template) {
      setTemplateLoadError(t("prepare.freeTemplateMissing"));
      return;
    }
    setLoadingTemplate(true);
    setTemplateLoadError(null);
    fetch(template.pdfPath)
      .then((res) => {
        if (!res.ok) throw new Error(t("prepare.loadTemplatePdfError"));
        return res.arrayBuffer();
      })
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        setPdfBytes(bytes);
        setFields(template.fields);
        setFile(new File([bytes as unknown as BlobPart], `${template.name}.pdf`, { type: "application/pdf" }));
        setSigners(template.signerLabels.map((_, i) => ({ order: i + 1, name: "", email: "" })));
        // Only fired here (the free-template path) — the paid saved-template path above already
        // fires the server-side equivalent (routes/templates.ts's GET /:id) at load time, so
        // firing again here would double-count it.
        track("template_used", { templateId: freeTemplateSlug, templateCategory: template.recurringCategory });
        track("template_started", { templateId: freeTemplateSlug, templateCategory: template.recurringCategory });
      })
      .catch((err) => setTemplateLoadError(err instanceof Error ? err.message : t("prepare.loadTemplateError")))
      .finally(() => setLoadingTemplate(false));
  }, [freeTemplateSlug]);

  // Community (Marketplace-submitted, admin-approved) templates — public, no auth, same shape as
  // the free-template path above but fetched from the API instead of the static bundle.
  useEffect(() => {
    if (!marketplaceTemplateSlug) return;
    setLoadingTemplate(true);
    setTemplateLoadError(null);
    fetchMarketplaceTemplate(marketplaceTemplateSlug)
      .then((tpl) => {
        const bytes = base64ToBytes(tpl.pdfBase64);
        setPdfBytes(bytes);
        setFields(tpl.fields);
        setFile(new File([bytes as unknown as BlobPart], `${tpl.title}.pdf`, { type: "application/pdf" }));
        setSigners(Array.from({ length: tpl.signerCount }, (_, i) => ({ order: i + 1, name: "", email: "" })));
        track("template_used", { templateId: marketplaceTemplateSlug, templateCategory: tpl.category ?? undefined });
        track("template_started", { templateId: marketplaceTemplateSlug, templateCategory: tpl.category ?? undefined });
      })
      .catch((err) => setTemplateLoadError(err instanceof Error ? err.message : t("prepare.loadTemplateError")))
      .finally(() => setLoadingTemplate(false));
  }, [marketplaceTemplateSlug]);

  const acceptFile = async (f: File) => {
    track("document_upload_started");
    if (f.size > MAX_PDF_BYTES) {
      setError(t("prepare.pdfTooBig", { max: MAX_PDF_BYTES / (1024 * 1024), size: (f.size / (1024 * 1024)).toFixed(1) }));
      track("upload_failed", { errorCode: "pdf_too_large" });
      return;
    }
    setError(null);
    setFile(f);
    setPdfBytes(new Uint8Array(await f.arrayBuffer()));
    setFields([]);
    track("document_uploaded");
  };

  const onGoogleDocImport = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = googleDocUrl.trim();
    if (!url) return;
    setGoogleDocError(null);
    setImportingGoogleDoc(true);
    try {
      const blob = await importGoogleDoc(url);
      await acceptFile(new File([blob], "google-doc.pdf", { type: "application/pdf" }));
      setGoogleDocUrl("");
    } catch (err) {
      setGoogleDocError(err instanceof Error ? err.message : t("prepare.googleDocImportError"));
    } finally {
      setImportingGoogleDoc(false);
    }
  };

  // Picks up a file dropped on the homepage hero's upload widget, if any — skips the extra
  // "now upload it again" step for someone who already chose a file before landing here.
  useEffect(() => {
    const handoff = takePendingUploadFile();
    if (handoff) acceptFile(handoff);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    await acceptFile(f);
    if (f.size > MAX_PDF_BYTES) e.target.value = "";
  };

  const onUploadDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (!isDraggingUpload) setIsDraggingUpload(true);
  };

  const onUploadDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    // Only clear once the pointer actually leaves the drop zone itself — children re-firing
    // dragenter/dragleave as the pointer crosses their boundaries would otherwise flicker this off
    // and on while still hovering the same zone.
    if (e.currentTarget.contains(e.relatedTarget as Node | null)) return;
    setIsDraggingUpload(false);
  };

  const onUploadDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingUpload(false);
    const f = e.dataTransfer.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError(t("prepare.pdfOnly"));
      return;
    }
    await acceptFile(f);
  };

  // FirstDocumentPrompt's upload modal (on the homepage) hands its file in via router state
  // rather than a shared upload endpoint — simplest way to carry a live File object across a
  // client-side navigation without round-tripping it through the network first. Consumed once on
  // mount, then replaced out of history so navigating back here later doesn't re-trigger it.
  useEffect(() => {
    const uploadedFile = (location.state as { uploadedFile?: File } | null)?.uploadedFile;
    if (uploadedFile instanceof File) {
      acceptFile(uploadedFile);
      navigate(location.pathname + location.search, { replace: true, state: null });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateSigner = (order: number, patch: Partial<SignerInput>) => {
    setSigners((prev) => prev.map((s) => (s.order === order ? { ...s, ...patch } : s)));
  };

  const addSigner = () => {
    // Free tier hard-caps at FREE_TIER_MAX_SIGNERS server-side — don't let unpaid users add a
    // third signer only to fail at send. Paid / logged-out-but-still-under-cap can add freely.
    if (!account?.isPaid && signers.length >= FREE_TIER_MAX_SIGNERS) {
      track("upgrade_clicked", { source: "prepare_signer_cap" });
      setError(
        t("prepare.freeSignerLimit", { max: FREE_TIER_MAX_SIGNERS })
      );
      return;
    }
    setSigners((prev) => [...prev, { order: prev.length + 1, name: "", email: "" }]);
  };

  const removeSigner = (order: number) => {
    setSigners((prev) =>
      prev
        .filter((s) => s.order !== order)
        .map((s, i) => ({ ...s, order: i + 1 }))
    );
    setFields((prev) => prev.filter((f) => f.signerOrder !== order));
  };

  const updateCc = (index: number, patch: Partial<CcRecipientInput>) => {
    setCcRecipients((prev) => prev.map((cc, i) => (i === index ? { ...cc, ...patch } : cc)));
  };

  const addCc = () => {
    if (!account?.isPaid && ccRecipients.length >= FREE_TIER_MAX_CCS) {
      track("upgrade_clicked", { source: "prepare_cc_cap" });
      setError(
        t("prepare.freeCcLimit", { max: FREE_TIER_MAX_CCS })
      );
      return;
    }
    setCcRecipients((prev) => [...prev, { name: "", email: "" }]);
  };

  const removeCc = (index: number) => {
    setCcRecipients((prev) => prev.filter((_, i) => i !== index));
  };

  const applyContactEmail = (email: string, onMatch: (c: ContactSummary) => void) => {
    const match = contacts.find((c) => c.email.toLowerCase() === email.trim().toLowerCase());
    if (match) onMatch(match);
  };

  const togglePreparerSigns = (checked: boolean) => {
    setPreparerSigns(checked);
    if (checked && signers[0]) {
      updateSigner(signers[0].order, {});
    }
  };

  const removeField = (id: string) => setFields((prev) => prev.filter((f) => f.id !== id));

  const updateField = (id: string, patch: Partial<DocField>) =>
    setFields((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));

  /** Finds the PDF page (if any) under a client-coordinate point, using the `data-page-index`
   *  marker PdfViewer puts on each page's overlay container. */
  const pageAt = (clientX: number, clientY: number): { index: number; rect: DOMRect } | null => {
    const el = document.elementFromPoint(clientX, clientY)?.closest<HTMLElement>("[data-page-index]");
    if (!el) return null;
    return { index: Number(el.dataset.pageIndex), rect: el.getBoundingClientRect() };
  };

  const placeFieldAt = (pageIndex: number, tapXFrac: number, tapYFrac: number) => {
    const size = FIELD_SIZE_BY_TYPE[placingFieldType];
    const xFrac = Math.min(Math.max(tapXFrac - size.w / 2, 0), 1 - size.w);
    const yFrac = Math.min(Math.max(tapYFrac - size.h / 2, 0), 1 - size.h);
    const field: DocField = {
      id: `f${fieldIdCounter++}`,
      signerOrder: placingSignerOrder,
      page: pageIndex,
      xFrac,
      yFrac,
      wFrac: size.w,
      hFrac: size.h,
      type: placingFieldType,
      ...(placingFieldType === "dropdown"
        ? {
            options: dropdownOptionsInput
              .split("\n")
              .map((o) => o.trim())
              .filter(Boolean)
              .slice(0, 20),
          }
        : {}),
    };
    setFields((prev) => {
      if (prev.length === 0) track("fields_added");
      return [...prev, field];
    });
  };

  /** Swipesign-style: pick a signer (and optional field type) → hide setup → tap PDF to place. */
  const enterPlaceMode = (signerOrder: number = placingSignerOrder, fieldType: DocFieldType = placingFieldType) => {
    setPlacingSignerOrder(signerOrder);
    setPlacingFieldType(fieldType);
    setPlaceMode(true);
    if (preferTapPlace) setSetupOpen(false);
    requestAnimationFrame(() => {
      pdfColRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const openSetup = () => {
    setPlaceMode(false);
    setSetupOpen(true);
  };

  const hideSetup = () => {
    setSetupOpen(false);
  };

  const toggleSetup = () => {
    if (setupOpen) {
      hideSetup();
      return;
    }
    openSetup();
  };

  useEffect(() => {
    if (!pdfBytes) {
      setTotalPages(0);
      return;
    }
    let cancelled = false;
    getPageCount(pdfBytes)
      .then((n) => {
        if (!cancelled) setTotalPages(n);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [pdfBytes]);

  const applyPdfBytes = (newBytes: Uint8Array) => {
    setPdfBytes(newBytes);
    setFile(
      (prev) =>
        new File([newBytes as unknown as BlobPart], prev?.name ?? t("prepare.defaultDocumentFilename"), {
          type: "application/pdf",
        })
    );
  };

  const runPdfEdit = async (mutate: (bytes: Uint8Array) => Promise<Uint8Array>, opts: { resetFields?: boolean } = {}) => {
    if (!pdfBytes) return;
    setPdfEditBusy(true);
    setPdfEditError(null);
    try {
      const newBytes = await mutate(pdfBytes);
      applyPdfBytes(newBytes);
      if (opts.resetFields && fields.length > 0) {
        setFields([]);
        setPdfEditNotice(t("prepare.fieldsCleared"));
      }
    } catch (err) {
      setPdfEditError(err instanceof Error ? err.message : t("prepare.applyChangeError"));
    } finally {
      setPdfEditBusy(false);
    }
  };

  const movePage = (index: number, direction: -1 | 1) => {
    if (!totalPages) return;
    const target = index + direction;
    if (target < 0 || target >= totalPages) return;
    const order = Array.from({ length: totalPages }, (_, i) => i);
    [order[index], order[target]] = [order[target], order[index]];
    runPdfEdit((bytes) => reorderPages(bytes, order), { resetFields: true });
  };

  const deletePage = (index: number) => {
    if (!totalPages || totalPages <= 1) return;
    const order = Array.from({ length: totalPages }, (_, i) => i).filter((i) => i !== index);
    runPdfEdit((bytes) => reorderPages(bytes, order), { resetFields: true });
  };

  const applyRedaction = () => {
    if (!pendingRedaction) return;
    const { page, xFrac, yFrac, wFrac, hFrac } = pendingRedaction;
    setPendingRedaction(null);
    runPdfEdit(async (bytes) => {
      const png = await rasterizePageAsPng(bytes, page, { xFrac, yFrac, wFrac, hFrac });
      return replacePageWithImage(bytes, page, png);
    });
  };

  const submitTextAnnotation = () => {
    if (!textAnnotationAt || !textAnnotationValue.trim()) return;
    const { page, xFrac, yFrac } = textAnnotationAt;
    const text = textAnnotationValue.trim();
    setTextAnnotationAt(null);
    setTextAnnotationValue("");
    runPdfEdit((bytes) => addTextAnnotation(bytes, page, xFrac, yFrac, text));
  };

  // Detects the existing text runs on every page once the "edit existing text" tool is active, so
  // they can be clicked directly — re-runs automatically whenever pdfBytes changes (including
  // right after an edit is applied below), keeping the clickable regions in sync with reality.
  useEffect(() => {
    if (viewMode !== "edit" || editTool !== "editText" || !pdfBytes || !totalPages) {
      setPageTextSpans([]);
      return;
    }
    let cancelled = false;
    setLoadingTextSpans(true);
    Promise.all(Array.from({ length: totalPages }, (_, i) => getPageTextSpans(pdfBytes, i)))
      .then((results) => {
        if (!cancelled) setPageTextSpans(results.flat());
      })
      .catch(() => {
        if (!cancelled) setPageTextSpans([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingTextSpans(false);
      });
    return () => {
      cancelled = true;
    };
  }, [viewMode, editTool, pdfBytes, totalPages]);

  const onDetectFields = async () => {
    if (!pdfBytes || !totalPages) return;
    setDetectingFields(true);
    setDetectFieldsError(null);
    setDetectFieldsNotice(null);
    try {
      const candidates = await detectFieldCandidates(pdfBytes, totalPages);
      if (candidates.length === 0) {
        setDetectFieldsNotice(t("prepare.detectNone"));
        return;
      }
      const detected = assignFieldsToSigners(candidates, signers.length, fieldIdCounter);
      fieldIdCounter += detected.length;
      setFields((prev) => {
        if (prev.length === 0) track("fields_added");
        return [...prev, ...detected];
      });
      setDetectFieldsNotice(
        detected.length === 1 ? t("prepare.detectPlaced", { count: detected.length }) : t("prepare.detectPlacedPlural", { count: detected.length })
      );
    } catch (err) {
      setDetectFieldsError(err instanceof Error ? err.message : t("prepare.scanError"));
    } finally {
      setDetectingFields(false);
    }
  };

  const onDetectAnchorTags = async () => {
    if (!pdfBytes || !totalPages) return;
    setDetectingAnchors(true);
    setDetectFieldsError(null);
    setDetectFieldsNotice(null);
    try {
      const { fields: detected, whiteouts } = await detectAnchorFields(pdfBytes, totalPages, fieldIdCounter);
      if (detected.length === 0) {
        setDetectFieldsNotice(
          t("prepare.noAnchors")
        );
        return;
      }
      let bytes = pdfBytes;
      for (const box of whiteouts) {
        bytes = await replaceTextSpan(bytes, box.page, box, "");
      }
      setPdfBytes(bytes);
      if (file) {
        setFile(new File([bytes as unknown as BlobPart], file.name, { type: "application/pdf" }));
      }
      setFields(detected);
      fieldIdCounter += detected.length;
      setDetectFieldsNotice(
        detected.length === 1 ? t("prepare.anchorsPlaced", { count: detected.length }) : t("prepare.anchorsPlacedPlural", { count: detected.length })
      );
    } catch (err) {
      setDetectFieldsError(err instanceof Error ? err.message : t("prepare.anchorScanError"));
    } finally {
      setDetectingAnchors(false);
    }
  };

  const onExplain = async () => {
    if (!pdfBytes || !totalPages) return;
    setExplaining(true);
    setExplainError(null);
    setExplanation(null);
    try {
      const text = await extractDocumentText(pdfBytes, totalPages);
      const { explanation: result } = await explainDocument(text);
      setExplanation(result);
    } catch (err) {
      setExplainError(err instanceof Error ? err.message : t("prepare.explainError"));
    } finally {
      setExplaining(false);
    }
  };

  const onAnalyzeRisks = async () => {
    if (!pdfBytes || !totalPages) return;
    setAnalyzingRisks(true);
    setRisksError(null);
    setRisks(null);
    try {
      const text = await extractDocumentText(pdfBytes, totalPages);
      const { risks: result } = await analyzeDocumentRisks(text);
      setRisks(result);
    } catch (err) {
      setRisksError(err instanceof Error ? err.message : t("prepare.risksError"));
    } finally {
      setAnalyzingRisks(false);
    }
  };

  const onGenerateContract = async () => {
    if (!generatePrompt.trim()) return;
    setGenerating(true);
    setGenerateError(null);
    try {
      const result = await generateContract(generatePrompt.trim());
      const bytes = base64ToBytes(result.pdfBase64);
      setPdfBytes(bytes);
      setFields(result.fields);
      setFile(new File([bytes as unknown as BlobPart], `${result.title}.pdf`, { type: "application/pdf" }));
      setSigners(result.signerLabels.map((_, i) => ({ order: i + 1, name: "", email: "" })));
      setShowGenerate(false);
      setGeneratePrompt("");
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : t("prepare.generateError"));
    } finally {
      setGenerating(false);
    }
  };

  const applyTextSpanEdit = (newText: string) => {
    if (!editingSpan) return;
    const span = editingSpan;
    setEditingSpan(null);
    setEditingSpanValue("");
    runPdfEdit((bytes) => replaceTextSpan(bytes, span.page, span, newText));
  };

  // Drag-to-redact: a plain mousedown/mousemove/mouseup sequence on the page itself (not a field
  // chip), mirroring onFieldDragStart/onCreateDragStart's technique above. Only active while the
  // redact tool is selected, so it never competes with field placement.
  useEffect(() => {
    if (viewMode !== "edit" || editTool !== "redact") return;

    const isOwnControl = (e: MouseEvent) => (e.target as HTMLElement).closest("button, input, textarea");

    const onDown = (e: MouseEvent) => {
      if (pdfEditBusy || isOwnControl(e)) return;
      const target = pageAt(e.clientX, e.clientY);
      if (!target) return;
      const xFrac = (e.clientX - target.rect.left) / target.rect.width;
      const yFrac = (e.clientY - target.rect.top) / target.rect.height;
      redactStartRef.current = { page: target.index, rect: target.rect, xFrac, yFrac };
      setRedactDrag({ page: target.index, xFrac, yFrac, wFrac: 0, hFrac: 0 });
    };
    const onMove = (e: MouseEvent) => {
      const start = redactStartRef.current;
      if (!start) return;
      const curXFrac = Math.min(Math.max((e.clientX - start.rect.left) / start.rect.width, 0), 1);
      const curYFrac = Math.min(Math.max((e.clientY - start.rect.top) / start.rect.height, 0), 1);
      setRedactDrag({
        page: start.page,
        xFrac: Math.min(start.xFrac, curXFrac),
        yFrac: Math.min(start.yFrac, curYFrac),
        wFrac: Math.abs(curXFrac - start.xFrac),
        hFrac: Math.abs(curYFrac - start.yFrac),
      });
    };
    const onUp = () => {
      redactStartRef.current = null;
      setRedactDrag((prev) => {
        if (prev && prev.wFrac > 0.01 && prev.hFrac > 0.01) setPendingRedaction(prev);
        return null;
      });
    };
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [viewMode, editTool, pdfEditBusy]);

  // Click-to-annotate: only active while the text tool is selected.
  useEffect(() => {
    if (viewMode !== "edit" || editTool !== "text") return;
    const onClick = (e: MouseEvent) => {
      if (pdfEditBusy || (e.target as HTMLElement).closest("button, input, textarea")) return;
      const target = pageAt(e.clientX, e.clientY);
      if (!target) return;
      const xFrac = (e.clientX - target.rect.left) / target.rect.width;
      const yFrac = (e.clientY - target.rect.top) / target.rect.height;
      setTextAnnotationAt({ page: target.index, xFrac, yFrac });
      setTextAnnotationValue("");
    };
    window.addEventListener("click", onClick);
    return () => window.removeEventListener("click", onClick);
  }, [viewMode, editTool, pdfEditBusy]);

  const dragState = useRef<{
    id: string;
    startClientX: number;
    startClientY: number;
    startXFrac: number;
    startYFrac: number;
    pageRect: DOMRect;
    wFrac: number;
    hFrac: number;
  } | null>(null);

  /** Pointer-based so fields can be repositioned on touch as well as mouse (incl. during place mode). */
  const onFieldPointerDown = (e: React.PointerEvent<HTMLDivElement>, field: DocField) => {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    // stopPropagation so PdfViewer's tap-to-place does not fire under the field.
    e.stopPropagation();
    e.preventDefault();
    const target = e.currentTarget;
    const pageEl = target.offsetParent as HTMLElement | null;
    if (!pageEl) return;
    try {
      target.setPointerCapture(e.pointerId);
    } catch {
      /* capture optional — window listeners still work */
    }
    const pageRect = pageEl.getBoundingClientRect();
    dragState.current = {
      id: field.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXFrac: field.xFrac,
      startYFrac: field.yFrac,
      pageRect,
      wFrac: field.wFrac,
      hFrac: field.hFrac,
    };
    setDraggingFieldId(field.id);

    const onMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== e.pointerId) return;
      const drag = dragState.current;
      if (!drag) return;
      moveEvent.preventDefault();
      // Live rect — zoom/scroll during drag would otherwise desync finger vs field.
      const liveRect = pageEl.getBoundingClientRect();
      const dxFrac = (moveEvent.clientX - drag.startClientX) / liveRect.width;
      const dyFrac = (moveEvent.clientY - drag.startClientY) / liveRect.height;
      const xFrac = Math.min(Math.max(drag.startXFrac + dxFrac, 0), 1 - drag.wFrac);
      const yFrac = Math.min(Math.max(drag.startYFrac + dyFrac, 0), 1 - drag.hFrac);
      updateField(drag.id, { xFrac, yFrac });
    };
    const onUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId !== e.pointerId) return;
      dragState.current = null;
      setDraggingFieldId(null);
      try {
        if (target.hasPointerCapture(e.pointerId)) target.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
  };

  /** Real drag-and-drop for creating a field: mousedown on the sidebar chip picks it up, a
   *  floating preview follows the cursor, and releasing over the document drops a new field at
   *  that exact spot — releasing anywhere else cancels instead of placing one blind. */
  const creatingDragActive = useRef(false);
  const onCreateDragStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    // Without this guard, a second mousedown before the first drag's mouseup (e.g. a duplicate
    // event from the input device, or React StrictMode double-invoking effects) stacks another
    // window-level mousemove/mouseup listener pair on top of the first. One real mouseup then
    // fires every accumulated onUp closure, each independently placing an identical field.
    if (creatingDragActive.current) return;
    creatingDragActive.current = true;
    setCreatingDrag({ x: e.clientX, y: e.clientY, overPage: !!pageAt(e.clientX, e.clientY) });

    const onMove = (moveEvent: MouseEvent) => {
      setCreatingDrag({ x: moveEvent.clientX, y: moveEvent.clientY, overPage: !!pageAt(moveEvent.clientX, moveEvent.clientY) });
    };
    const onUp = (upEvent: MouseEvent) => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      creatingDragActive.current = false;
      setCreatingDrag(null);

      const target = pageAt(upEvent.clientX, upEvent.clientY);
      if (!target) return; // dropped outside the document — cancel, don't place blind
      const xFrac = (upEvent.clientX - target.rect.left) / target.rect.width;
      const yFrac = (upEvent.clientY - target.rect.top) / target.rect.height;
      placeFieldAt(target.index, xFrac, yFrac);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const signerLabel = (order: number) => {
    const s = signers.find((x) => x.order === order);
    return s?.name || t("prepare.signerN", { n: order });
  };

  const signersWithoutFields = useMemo(
    () => signers.filter((s) => !fields.some((f) => f.signerOrder === s.order)),
    [signers, fields]
  );

  const canSubmit = useMemo(
    () => file && signers.every((s) => s.name.trim() && s.email.trim()) && signersWithoutFields.length === 0,
    [file, signers, signersWithoutFields]
  );

  const onSaveAsTemplate = async () => {
    if (!file || fields.length === 0 || !templateNameInput.trim() || signersWithoutFields.length > 0) return;
    setSavingTemplate(true);
    setTemplateSaveError(null);
    try {
      await createTemplate(file, templateNameInput.trim(), signers.length, fields);
      setTemplateSavedName(templateNameInput.trim());
      setShowTemplateNameInput(false);
      setTemplateNameInput("");
    } catch (err) {
      setTemplateSaveError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSavingTemplate(false);
    }
  };

  const onSubmitToMarketplace = async () => {
    if (!file || fields.length === 0 || !marketplaceTitleInput.trim() || signersWithoutFields.length > 0) return;
    setSubmittingToMarketplace(true);
    setMarketplaceSubmitError(null);
    try {
      const result = await submitDocumentToMarketplace({
        pdf: file,
        title: marketplaceTitleInput.trim(),
        signerCount: signers.length,
        fields,
      });
      setMarketplaceSubmittedSlug(result.slug);
      setShowMarketplaceInput(false);
      setMarketplaceTitleInput("");
    } catch (err) {
      setMarketplaceSubmitError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmittingToMarketplace(false);
    }
  };

  const onStartOver = () => {
    if (!window.confirm(t("prepare.discardConfirm"))) return;
    setFile(null);
    setPdfBytes(null);
    setFields([]);
    setSigners([
      { order: 1, name: "", email: "" },
      { order: 2, name: "", email: "" },
    ]);
    setCcRecipients([]);
    setPreparerSigns(false);
    setPreparerEmail("");
    setPreparerMarketingOptIn(false);
    setShowCustomMessage(false);
    setCustomSubject("");
    setCustomMessage("");
    setError(null);
    setPlaceMode(false);
  };

  const onSubmit = async () => {
    if (!file || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const effectiveSigningMode = signers.length > 1 ? signingMode : undefined;
      const trimmedCcs = ccRecipients
        .map((cc) => ({ name: cc.name?.trim() || undefined, email: cc.email.trim() }))
        .filter((cc) => cc.email);
      const { docId, statusToken, claimToken } = await createDocument(file, preparerSigns, signers, fields, {
        preparerEmail: !preparerSigns && preparerEmail.trim() ? preparerEmail.trim() : undefined,
        preparerMarketingOptIn:
          !preparerSigns && preparerEmail.trim() && preparerMarketingOptIn ? true : undefined,
        customSubject: customSubject.trim() || undefined,
        customMessage: customMessage.trim() || undefined,
        signingMode: effectiveSigningMode,
        ccRecipients: trimmedCcs.length > 0 ? trimmedCcs : undefined,
        templateId: templateId ?? freeTemplateSlug ?? undefined,
        smsInvites: smsInvites || undefined,
        whatsappInvites: whatsappInvites || undefined,
        locale,
        ...(account?.isPaid
          ? {
              ttlDays,
              signerAttachments: signerAttachmentsEnabled ? { enabled: true } : undefined,
            }
          : {}),
      });
      documentSentRef.current = true;
      navigate("/prepare/sent", {
        state: { docId, statusToken, claimToken, signingMode: effectiveSigningMode },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t("common.error");
      setError(message);
      track("field_error", { errorCode: message.slice(0, 100) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
    <div className="container">
      <h1>{t("prepare.title")}</h1>

      {!pdfBytes && (
        <div className="card">
          {loadingTemplate && <p>{t("prepare.loadingTemplate")}</p>}
          {templateLoadError && <p style={{ color: "var(--danger)" }}>{templateLoadError}</p>}
          {!loadingTemplate && (
            <>
              {account?.isPaid && availableTemplates.length > 0 && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--hairline)" }}>
                  <p style={{ marginTop: 0, marginBottom: 6, fontSize: 13, color: "var(--mute)" }}>
                    {t("prepare.startFromTemplate")}
                  </p>
                  {availableTemplates.map((tpl) => {
                    const usage = templateUsage.find((u) => u.templateId === tpl.id);
                    return (
                      <div key={tpl.id} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <Link to={`/prepare?template=${tpl.id}`}>
                          {tpl.name} ({tpl.signerCount === 1
                            ? t("prepare.signersCount", { count: tpl.signerCount })
                            : t("prepare.signersCountPlural", { count: tpl.signerCount })})
                        </Link>
                        {usage?.isRecurring && (
                          <span
                            title={t("prepare.sentTimesTitle", { count: usage.completedCount })}
                            style={{
                              fontSize: 11,
                              fontWeight: 600,
                              color: "var(--primary)",
                              background: "var(--primary-soft)",
                              borderRadius: 999,
                              padding: "1px 8px",
                            }}
                          >
                            {t("prepare.recurringBadge")}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
              <p>{t("prepare.uploadHint")}</p>
              <div
                onDragOver={onUploadDragOver}
                onDragLeave={onUploadDragLeave}
                onDrop={onUploadDrop}
                style={{
                  border: `2px dashed ${isDraggingUpload ? "var(--primary)" : "var(--hairline)"}`,
                  borderRadius: "var(--r-md)",
                  padding: 20,
                  textAlign: "center",
                  background: isDraggingUpload ? "var(--primary-soft)" : "transparent",
                  transition: "border-color 0.15s var(--ease), background 0.15s var(--ease)",
                }}
              >
                <p style={{ margin: "0 0 10px 0", fontSize: 13, color: "var(--mute)" }}>
                  {isDraggingUpload ? t("prepare.dropPdf") : t("prepare.dragOr")}
                </p>
                <input type="file" accept="application/pdf" onChange={onFileChange} />
              </div>
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>{t("prepare.maxSize")}</p>
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0, display: "flex", alignItems: "center", gap: 5 }}>
                <img src="/integrations/whatsapp.svg" alt="" width={14} height={14} style={{ display: "block" }} />
                <Link to="/whatsapp-signing" style={{ color: "var(--mute)" }}>
                  {t("prepare.whatsappAvailableHint")}
                </Link>
              </p>
              <form onSubmit={onGoogleDocImport} style={{ marginTop: 12, display: "flex", gap: 6 }}>
                <input
                  type="text"
                  value={googleDocUrl}
                  onChange={(e) => setGoogleDocUrl(e.target.value)}
                  placeholder={t("prepare.googleDocPlaceholder")}
                  style={{ flex: 1, fontSize: 12.5 }}
                  disabled={importingGoogleDoc}
                />
                <button type="submit" className="btn-secondary" disabled={importingGoogleDoc || !googleDocUrl.trim()}>
                  {importingGoogleDoc ? t("prepare.googleDocImporting") : t("prepare.googleDocImportBtn")}
                </button>
              </form>
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 4, marginBottom: 0 }}>
                {t("prepare.googleDocHint")}
              </p>
              {googleDocError && <p style={{ color: "var(--danger)", fontSize: 12, marginTop: 6 }}>{googleDocError}</p>}
              {error && <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>}

              {account?.isPaid ? (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                  {showGenerate ? (
                    <>
                      <p style={{ marginTop: 0, marginBottom: 6, fontSize: 13, color: "var(--mute)" }}>
                        {t("prepare.describeAgreement")}
                      </p>
                      <textarea
                        className="form-textarea"
                        style={{ width: "100%", minHeight: 80, resize: "vertical", marginBottom: 8 }}
                        placeholder={t("prepare.generatePlaceholder")}
                        maxLength={2000}
                        value={generatePrompt}
                        onChange={(e) => setGeneratePrompt(e.target.value)}
                      />
                      {generateError && <p style={{ color: "var(--danger)", fontSize: 12 }}>{generateError}</p>}
                      <div style={{ display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ flex: 1 }}
                          disabled={generating || !generatePrompt.trim()}
                          onClick={onGenerateContract}
                        >
                          {generating ? t("prepare.drafting") : t("prepare.generate")}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setShowGenerate(false);
                            setGenerateError(null);
                          }}
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                      <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                        {t("prepare.aiDisclaimer")}
                      </p>
                    </>
                  ) : (
                    <button type="button" className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowGenerate(true)}>
                      {t("prepare.generateWithAi")}
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                  <Link to="/login">{t("prepare.signInPaidAi")}</Link> {t("prepare.signInPaidAiSub")}
                </p>
              )}
            </>
          )}
        </div>
      )}
    </div>

    {pdfBytes && (
        <div
          className={[
            "prepare-grid",
            preferTapPlace ? "prepare-grid--mobile" : "",
            placeMode ? "prepare-grid--place-mode" : "",
            preferTapPlace && setupOpen ? "prepare-grid--setup-open" : "",
          ]
            .filter(Boolean)
            .join(" ")}
        >
          <div className="prepare-pdf-col" ref={pdfColRef}>
            <p className="prepare-trust-banner">{t("prepare.trustBanner")}</p>
            {preferTapPlace && placeMode && (
              <div className="prepare-place-tip" role="status">
                <div className="prepare-place-tip-text">
                  <strong>
                    {t("prepare.placeModeBanner", {
                      type: t(FIELD_TYPE_NAME_KEYS[placingFieldType]),
                      signer: signerLabel(placingSignerOrder),
                    })}
                  </strong>
                  <span>{t("prepare.placeModeHint")}</span>
                </div>
                <button type="button" className="btn-secondary prepare-place-done-btn" onClick={openSetup}>
                  {t("prepare.setup")}
                </button>
              </div>
            )}
            {preferTapPlace && !placeMode && !setupOpen && (
              <div className="prepare-place-tip prepare-place-tip--idle" role="note">
                <span>{t("prepare.mobilePlaceInstruction")}</span>
                <button type="button" className="btn-secondary prepare-place-done-btn" onClick={openSetup}>
                  {t("prepare.setup")}
                </button>
              </div>
            )}
            {!preferTapPlace && placeMode && (
              <div className="prepare-place-banner" role="status">
                <div className="prepare-place-banner-text">
                  <strong>
                    {t("prepare.placeModeBanner", {
                      type: t(FIELD_TYPE_NAME_KEYS[placingFieldType]),
                      signer: signerLabel(placingSignerOrder),
                    })}
                  </strong>
                  <span>{t("prepare.placeModeHint")}</span>
                </div>
                <button type="button" className="btn-secondary prepare-place-done-btn" onClick={() => setPlaceMode(false)}>
                  {t("prepare.donePlacing")}
                </button>
              </div>
            )}
            <PdfViewer
              pdfBytes={pdfBytes}
              onPageClick={
                placeMode && viewMode === "fields"
                  ? (_page, xFrac, yFrac) => placeFieldAt(_page.index, xFrac, yFrac)
                  : undefined
              }
              renderPageOverlay={(page) => (
                <>
                  {viewMode === "fields" &&
                  fields
                    .filter((f) => f.page === page.index)
                    .map((f) => {
                      const isDragging = draggingFieldId === f.id;
                      return (
                        <div
                          key={f.id}
                          onPointerDown={(e) => {
                            // Always reposition by drag (incl. place mode / mobile). stopPropagation
                            // so the page tap-to-place handler does not fire under the field.
                            onFieldPointerDown(e, f);
                          }}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            position: "absolute",
                            left: `${f.xFrac * 100}%`,
                            top: `${f.yFrac * 100}%`,
                            width: `${f.wFrac * 100}%`,
                            height: `${f.hFrac * 100}%`,
                            border: "1.5px dashed var(--primary)",
                            borderRadius: "var(--r-sm)",
                            background: isDragging ? "var(--primary-soft-strong)" : "var(--primary-soft)",
                            boxShadow: isDragging ? "var(--shadow-md)" : "none",
                            transform: isDragging ? "scale(1.03)" : "scale(1)",
                            transition: isDragging ? "none" : "box-shadow 0.15s, transform 0.15s",
                            zIndex: isDragging ? 10 : 1,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "center",
                            alignItems: "center",
                            padding: "2px 6px",
                            fontSize: 11,
                            color: "var(--primary)",
                            cursor: isDragging ? "grabbing" : "grab",
                            userSelect: "none",
                            touchAction: "none",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <span>
                              {t(FIELD_TYPE_LABEL_KEYS[f.type ?? "signature"])} · {signerLabel(f.signerOrder)}
                            </span>
                            <button
                              aria-label={t("prepare.removeFieldAria")}
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(f.id);
                              }}
                              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer" }}
                            >
                              ×
                            </button>
                          </div>
                          {(f.type ?? "signature") !== "text" &&
                            (f.type ?? "signature") !== "date" &&
                            (f.type ?? "signature") !== "dropdown" && (
                            <img
                              src="/docracy-wordmark.png"
                              alt=""
                              draggable={false}
                              style={{ height: "40%", width: "auto", marginTop: 2, opacity: 0.85 }}
                            />
                          )}
                        </div>
                      );
                    })}

                  {viewMode === "edit" && (
                    <div style={{ position: "absolute", top: 6, left: 6, display: "flex", gap: 4, zIndex: 5 }}>
                      <button
                        type="button"
                        aria-label={t("prepare.movePageUpAria")}
                        className="btn-secondary"
                        style={{ padding: "2px 8px", fontSize: 12 }}
                        disabled={page.index === 0 || pdfEditBusy}
                        onClick={() => movePage(page.index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label={t("prepare.movePageDownAria")}
                        className="btn-secondary"
                        style={{ padding: "2px 8px", fontSize: 12 }}
                        disabled={page.index === totalPages - 1 || pdfEditBusy}
                        onClick={() => movePage(page.index, 1)}
                      >
                        ↓
                      </button>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ padding: "2px 8px", fontSize: 12, color: "var(--danger)" }}
                        disabled={totalPages <= 1 || pdfEditBusy}
                        onClick={() => deletePage(page.index)}
                      >
                        {t("prepare.deletePage")}
                      </button>
                    </div>
                  )}

                  {viewMode === "edit" && redactDrag?.page === page.index && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${redactDrag.xFrac * 100}%`,
                        top: `${redactDrag.yFrac * 100}%`,
                        width: `${redactDrag.wFrac * 100}%`,
                        height: `${redactDrag.hFrac * 100}%`,
                        background: "rgba(0,0,0,0.55)",
                        border: "1.5px dashed #000",
                        pointerEvents: "none",
                      }}
                    />
                  )}

                  {viewMode === "edit" && pendingRedaction?.page === page.index && (
                    <>
                      <div
                        style={{
                          position: "absolute",
                          left: `${pendingRedaction.xFrac * 100}%`,
                          top: `${pendingRedaction.yFrac * 100}%`,
                          width: `${pendingRedaction.wFrac * 100}%`,
                          height: `${pendingRedaction.hFrac * 100}%`,
                          background: "rgba(0,0,0,0.55)",
                          border: "1.5px dashed #000",
                        }}
                      />
                      <div
                        style={{
                          position: "absolute",
                          left: `${pendingRedaction.xFrac * 100}%`,
                          top: `${(pendingRedaction.yFrac + pendingRedaction.hFrac) * 100}%`,
                          marginTop: 4,
                          background: "var(--surface)",
                          border: "1px solid var(--hairline)",
                          borderRadius: "var(--r-sm)",
                          padding: 8,
                          width: 220,
                          zIndex: 20,
                          boxShadow: "var(--shadow-md)",
                        }}
                      >
                        <p style={{ fontSize: 12, marginTop: 0, marginBottom: 8 }}>
                          {t("prepare.redactConfirm")}
                        </p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                            disabled={pdfEditBusy}
                            onClick={applyRedaction}
                          >
                            {pdfEditBusy ? t("prepare.applying") : t("prepare.redact")}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                            onClick={() => setPendingRedaction(null)}
                          >
                            {t("common.cancel")}
                          </button>
                        </div>
                      </div>
                    </>
                  )}

                  {viewMode === "edit" && textAnnotationAt?.page === page.index && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${textAnnotationAt.xFrac * 100}%`,
                        top: `${textAnnotationAt.yFrac * 100}%`,
                        background: "var(--surface)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-sm)",
                        padding: 8,
                        zIndex: 20,
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      <input
                        autoFocus
                        className="form-input"
                        style={{ width: 180, marginBottom: 6 }}
                        placeholder={t("prepare.textToInsert")}
                        value={textAnnotationValue}
                        onChange={(e) => setTextAnnotationValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            submitTextAnnotation();
                          }
                          if (e.key === "Escape") setTextAnnotationAt(null);
                        }}
                      />
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                          disabled={pdfEditBusy || !textAnnotationValue.trim()}
                          onClick={submitTextAnnotation}
                        >
                          {pdfEditBusy ? t("common.adding") : t("common.save") /* keep short */}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                          onClick={() => setTextAnnotationAt(null)}
                        >
                          {t("common.cancel")}
                        </button>
                      </div>
                    </div>
                  )}

                  {viewMode === "edit" &&
                    editTool === "editText" &&
                    pageTextSpans
                      .filter((s) => s.page === page.index)
                      .map((s, i) => (
                        <div
                          key={`${page.index}-${i}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingSpan(s);
                            setEditingSpanValue(s.text);
                          }}
                          style={{
                            position: "absolute",
                            left: `${s.xFrac * 100}%`,
                            top: `${s.yFrac * 100}%`,
                            width: `${s.wFrac * 100}%`,
                            height: `${s.hFrac * 100}%`,
                            cursor: "pointer",
                            background: editingSpan === s ? "rgba(59,130,246,0.28)" : "rgba(59,130,246,0.12)",
                            border: "1px dashed rgba(59,130,246,0.5)",
                          }}
                          title={s.text}
                        />
                      ))}

                  {viewMode === "edit" && editingSpan?.page === page.index && (
                    <div
                      style={{
                        position: "absolute",
                        left: `${editingSpan.xFrac * 100}%`,
                        top: `${(editingSpan.yFrac + editingSpan.hFrac) * 100}%`,
                        marginTop: 4,
                        background: "var(--surface)",
                        border: "1px solid var(--hairline)",
                        borderRadius: "var(--r-sm)",
                        padding: 8,
                        width: 240,
                        zIndex: 20,
                        boxShadow: "var(--shadow-md)",
                      }}
                    >
                      <input
                        autoFocus
                        className="form-input"
                        aria-label={t("prepare.replacementTextAria")}
                        style={{ width: "100%", marginBottom: 6 }}
                        value={editingSpanValue}
                        onChange={(e) => setEditingSpanValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            applyTextSpanEdit(editingSpanValue);
                          }
                          if (e.key === "Escape") setEditingSpan(null);
                        }}
                      />
                      <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                        <button
                          type="button"
                          className="btn-primary"
                          style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                          disabled={pdfEditBusy}
                          onClick={() => applyTextSpanEdit(editingSpanValue)}
                        >
                          {pdfEditBusy ? t("common.saving") : t("common.save")}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ flex: 1, fontSize: 12, padding: "4px 8px", color: "var(--danger)" }}
                          disabled={pdfEditBusy}
                          onClick={() => applyTextSpanEdit("")}
                        >
                          {t("common.delete")}
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ width: "100%", fontSize: 12, padding: "4px 8px" }}
                        onClick={() => setEditingSpan(null)}
                      >
                        {t("common.cancel")}
                      </button>
                    </div>
                  )}
                </>
              )}
            />
          </div>

          <div className="prepare-sidebar-col" id="prepare-setup-sheet">
            {preferTapPlace && (
              <div className="prepare-setup-sheet-header">
                <div className="prepare-setup-sheet-title-row">
                  <h2 className="prepare-setup-sheet-title">{t("prepare.setup")}</h2>
                  {(fields.length > 0 || signers.length > 0) && (
                    <span className="prepare-setup-sheet-badge" aria-hidden>
                      {fields.length > 0 ? fields.length : signers.length}
                    </span>
                  )}
                </div>
                <button type="button" className="btn-secondary prepare-hide-setup-btn" onClick={hideSetup}>
                  {t("prepare.hideSetup")}
                </button>
              </div>
            )}
            <div className="prepare-sidebar-topbar">
              <span className="prepare-sidebar-filename" title={file?.name}>
                {file?.name ?? t("prepare.untitled")}
              </span>
              <div className="prepare-sidebar-topbar-actions">
                <button type="button" className="prepare-start-over-btn" aria-label={t("prepare.startOver")} onClick={onStartOver}>
                  ×
                </button>
                {!preferTapPlace && (
                  <button
                    type="button"
                    className="btn-primary"
                    style={{ padding: "6px 16px", fontSize: 13 }}
                    disabled={!canSubmit || submitting}
                    onClick={onSubmit}
                  >
                    {submitting ? t("common.sending") : t("prepare.send")}
                  </button>
                )}
              </div>
            </div>
            {error && (
              <div style={{ marginBottom: 12 }}>
                <p style={{ color: "var(--danger)", fontSize: 13, marginBottom: 8 }}>{error}</p>
                {(error.toLowerCase().includes("signer") ||
                  error.toLowerCase().includes("viewer") ||
                  error.toLowerCase().includes("upgrade") ||
                  error.toLowerCase().includes("paid")) && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                    <Link
                      to={account ? "/pricing" : "/login?ref=prepare-cap"}
                      className="btn-primary"
                      style={{ textDecoration: "none", fontSize: 13 }}
                      onClick={() => track("upgrade_clicked", { source: "prepare_cap_error" })}
                    >
                      {account ? t("prepare.seePaidPlans") : t("prepare.signInUpgrade")}
                    </Link>
                  </div>
                )}
              </div>
            )}

            <div className="card">
              <SidebarHeading label={t("prepare.signersViewers")} count={signers.length + ccRecipients.length} />
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
                <button
                  type="button"
                  className={`prepare-pill-btn ${preparerSigns ? "active" : ""}`}
                  onClick={() => togglePreparerSigns(!preparerSigns)}
                >
                  {t("prepare.myself")}
                </button>
                <button
                  type="button"
                  className="prepare-pill-btn"
                  onClick={addSigner}
                  title={
                    !account?.isPaid && signers.length >= FREE_TIER_MAX_SIGNERS
                      ? t("prepare.freePlanSigners", { max: FREE_TIER_MAX_SIGNERS })
                      : undefined
                  }
                >
                  {t("prepare.addSigner")}
                </button>
                <button
                  type="button"
                  className="prepare-pill-btn"
                  onClick={addCc}
                  title={
                    !account?.isPaid && ccRecipients.length >= FREE_TIER_MAX_CCS
                      ? t("prepare.freePlanViewers", { max: FREE_TIER_MAX_CCS })
                      : undefined
                  }
                >
                  {t("prepare.addViewer")}
                </button>
              </div>
              {contacts.length > 0 && (
                <datalist id="prepare-contacts">
                  {contacts.map((c) => (
                    <option key={c.id} value={c.email}>
                      {c.name}
                    </option>
                  ))}
                </datalist>
              )}
              {!preparerSigns && (
                <div
                  style={{
                    marginBottom: 12,
                    padding: 10,
                    background: "var(--primary-soft, var(--canvas-soft))",
                    border: "1px solid var(--hairline)",
                    borderRadius: "var(--r-sm)",
                  }}
                >
                  <input
                    className="form-input"
                    style={{ width: "100%" }}
                    placeholder={t("prepare.yourEmailPh")}
                    aria-label={t("prepare.yourEmailAria")}
                    type="email"
                    value={preparerEmail}
                    onChange={(e) => {
                      setPreparerEmail(e.target.value);
                      if (!e.target.value.trim()) setPreparerMarketingOptIn(false);
                    }}
                  />
                  <p style={{ fontSize: 11.5, marginTop: 6, marginBottom: 0 }}>
                    {t("prepare.recoverStatusHint")}
                  </p>
                  {preparerEmail.trim() && (
                    <label
                      style={{
                        display: "flex",
                        alignItems: "flex-start",
                        gap: 8,
                        marginTop: 10,
                        fontSize: 13,
                        color: "var(--ink)",
                        cursor: "pointer",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={preparerMarketingOptIn}
                        onChange={(e) => setPreparerMarketingOptIn(e.target.checked)}
                        style={{ marginTop: 2 }}
                      />
                      <span>{t("prepare.marketingOptIn")}</span>
                    </label>
                  )}
                </div>
              )}
              {preferTapPlace && (
                <p className="prepare-mobile-place-instruction" style={{ marginBottom: 12 }}>
                  {t("prepare.mobilePlaceInstruction")}
                </p>
              )}
              {signers.map((s, i) => (
                <div key={s.order} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
                  <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>
                    {s.order}. {preparerSigns && i === 0 ? t("prepare.you") : t("prepare.signerN", { n: s.order })}
                    {fields.some((f) => f.signerOrder === s.order) && (
                      <span className="prepare-signer-field-count">
                        {" "}
                        · {fields.filter((f) => f.signerOrder === s.order).length}
                      </span>
                    )}
                  </div>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder={t("prepare.namePh")}
                    aria-label={t("prepare.signerNameAria", { n: s.order })}
                    value={s.name}
                    onChange={(e) => updateSigner(s.order, { name: e.target.value })}
                  />
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder={t("prepare.emailPh")}
                    aria-label={t("prepare.signerEmailAria", { n: s.order })}
                    type="email"
                    list={contacts.length > 0 ? "prepare-contacts" : undefined}
                    value={s.email}
                    onChange={(e) => {
                      const email = e.target.value;
                      updateSigner(s.order, { email });
                      applyContactEmail(email, (c) => updateSigner(s.order, { email: c.email, name: s.name.trim() ? s.name : c.name }));
                    }}
                  />
                  {(account?.isPaid || (whatsappInvites && account)) && (
                    <input
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder={s.whatsappPhone?.trim() ? t("prepare.pinRequiredForWhatsappPh") : t("prepare.pinPh")}
                      aria-label={t("prepare.signerPinAria", { n: s.order })}
                      inputMode="numeric"
                      maxLength={8}
                      value={s.pin ?? ""}
                      onChange={(e) =>
                        updateSigner(s.order, {
                          pin: e.target.value.replace(/\D/g, ""),
                          ...(e.target.value.trim() ? {} : { pinDeliveryChannel: undefined }),
                        })
                      }
                    />
                  )}
                  {s.pin?.trim() && (
                    <>
                      <select
                        className="form-input"
                        style={{ width: "100%", marginTop: 6 }}
                        aria-label={t("prepare.signerPinChannelAria", { n: s.order })}
                        value={s.pinDeliveryChannel ?? ""}
                        onChange={(e) =>
                          updateSigner(s.order, {
                            pinDeliveryChannel: e.target.value ? (e.target.value as SignerInput["pinDeliveryChannel"]) : undefined,
                          })
                        }
                      >
                        {!s.whatsappPhone?.trim() && <option value="">{t("prepare.pinChannelManual")}</option>}
                        <option value="email">{t("prepare.pinChannelEmail")}</option>
                        {s.whatsappPhone?.trim() && <option value="whatsapp">{t("prepare.pinChannelWhatsapp")}</option>}
                        {s.phone?.trim() && s.smsCarrier && <option value="sms">{t("prepare.pinChannelSms")}</option>}
                      </select>
                      <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 4, marginBottom: 0 }}>
                        {s.whatsappPhone?.trim() ? t("prepare.pinChannelHintWhatsapp") : t("prepare.pinChannelHint")}
                      </p>
                    </>
                  )}
                  {smsInvites && (
                    <>
                      <input
                        className="form-input"
                        style={{ width: "100%", marginTop: 6, marginBottom: 6 }}
                        placeholder={t("prepare.mobilePh")}
                        aria-label={t("prepare.signerMobileAria", { n: s.order })}
                        type="tel"
                        value={s.phone ?? ""}
                        onChange={(e) =>
                          updateSigner(s.order, {
                            phone: e.target.value,
                            ...(e.target.value.trim() || s.pinDeliveryChannel !== "sms" ? {} : { pinDeliveryChannel: undefined }),
                          })
                        }
                      />
                      <select
                        className="form-input"
                        style={{ width: "100%" }}
                        aria-label={t("prepare.signerCarrierAria", { n: s.order })}
                        value={s.smsCarrier ?? ""}
                        onChange={(e) =>
                          updateSigner(s.order, {
                            smsCarrier: e.target.value ? (e.target.value as SignerInput["smsCarrier"]) : undefined,
                            ...(e.target.value || s.pinDeliveryChannel !== "sms" ? {} : { pinDeliveryChannel: undefined }),
                          })
                        }
                      >
                        <option value="">{t("prepare.carrierPh")}</option>
                        <option value="att">AT&amp;T</option>
                        <option value="tmobile">T-Mobile</option>
                        <option value="verizon">Verizon</option>
                        <option value="sprint">Sprint</option>
                        <option value="uscc">US Cellular</option>
                      </select>
                    </>
                  )}
                  {whatsappInvites && account && (
                    <input
                      className="form-input"
                      style={{ width: "100%", marginTop: 6 }}
                      placeholder={t("prepare.whatsappPh")}
                      aria-label={t("prepare.signerWhatsappAria", { n: s.order })}
                      type="tel"
                      value={s.whatsappPhone ?? ""}
                      onChange={(e) =>
                        updateSigner(s.order, {
                          whatsappPhone: e.target.value,
                          ...(e.target.value.trim() || s.pinDeliveryChannel !== "whatsapp" ? {} : { pinDeliveryChannel: undefined }),
                        })
                      }
                    />
                  )}
                  <div className="prepare-signer-actions">
                    {preferTapPlace && viewMode === "fields" && (
                      <button
                        type="button"
                        className="btn-primary prepare-signer-place-btn"
                        onClick={() => enterPlaceMode(s.order, "signature")}
                      >
                        {t("prepare.placeSignature")}
                      </button>
                    )}
                    {signers.length > 1 && (
                      <button
                        className="btn-secondary"
                        style={{ fontSize: 12, padding: "4px 8px" }}
                        onClick={() => removeSigner(s.order)}
                      >
                        {t("common.remove")}
                      </button>
                    )}
                  </div>
                </div>
              ))}
              {ccRecipients.map((cc, i) => (
                <div key={`cc-${i}`} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
                  <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>{t("prepare.viewerCc")}</div>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder={t("prepare.nameOptionalPh")}
                    aria-label={t("prepare.viewerNameAria", { n: i + 1 })}
                    value={cc.name ?? ""}
                    onChange={(e) => updateCc(i, { name: e.target.value })}
                  />
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder={t("prepare.emailPh")}
                    aria-label={t("prepare.viewerEmailAria", { n: i + 1 })}
                    type="email"
                    list={contacts.length > 0 ? "prepare-contacts" : undefined}
                    value={cc.email}
                    onChange={(e) => {
                      const email = e.target.value;
                      updateCc(i, { email });
                      applyContactEmail(email, (c) =>
                        updateCc(i, { email: c.email, name: (cc.name ?? "").trim() ? cc.name : c.name })
                      );
                    }}
                  />
                  <button
                    className="btn-secondary"
                    style={{ marginTop: 6, fontSize: 12, padding: "4px 8px" }}
                    onClick={() => removeCc(i)}
                  >
                    {t("common.remove")}
                  </button>
                </div>
              ))}
              {signers.length > 1 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                  <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 0, marginBottom: 6 }}>
                    {t("prepare.signingOrder")}
                  </p>
                  <select
                    className="form-input"
                    style={{ width: "100%" }}
                    value={signingMode}
                    onChange={(e) => setSigningMode(e.target.value as "sequential" | "parallel")}
                  >
                    <option value="sequential">{t("prepare.signingSequential")}</option>
                    <option value="parallel">{t("prepare.signingParallel")}</option>
                  </select>
                </div>
              )}
              {!account?.isPaid && signers.length >= FREE_TIER_MAX_SIGNERS && (
                <div
                  style={{
                    marginTop: 12,
                    padding: 12,
                    borderRadius: 8,
                    border: "1px solid var(--hairline)",
                    background: "var(--surface-2, #f5f7fa)",
                  }}
                >
                  <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 600 }}>
                    {t("prepare.signerUpsellTitle", { max: FREE_TIER_MAX_SIGNERS })}
                  </p>
                  <p style={{ margin: "0 0 10px", fontSize: 13, color: "var(--mute)" }}>
                    {t("prepare.signerUpsellBody")}
                  </p>
                  <Link
                    to={account ? "/pricing" : "/login?ref=prepare-signer-cap"}
                    className="btn-primary"
                    style={{ textDecoration: "none", fontSize: 13 }}
                    onClick={() => track("upgrade_clicked", { source: "prepare_signer_cap_card" })}
                  >
                    {account ? t("prepare.upgradeMonthly") : t("prepare.signInUpgrade")}
                  </Link>
                </div>
              )}
              {!account?.isPaid && ccRecipients.length >= FREE_TIER_MAX_CCS && (
                <p style={{ fontSize: 13, marginTop: 8 }}>
                  {t("prepare.ccCapHint", { max: FREE_TIER_MAX_CCS })}{" "}
                  <Link
                    to={account ? "/pricing" : "/login?ref=prepare-cc-cap"}
                    onClick={() => track("upgrade_clicked", { source: "prepare_cc_cap_card" })}
                  >
                    {t("prepare.upgradeUnlimited")}
                  </Link>
                  .
                </p>
              )}
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginBottom: 8 }}>
                  <input type="checkbox" checked={smsInvites} onChange={(e) => setSmsInvites(e.target.checked)} />
                  <span>
                    {t("prepare.alsoSms")} <span style={{ color: "var(--mute)" }}>{t("prepare.usOnly")}</span>
                  </span>
                </label>
                {smsInvites && (
                  <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 0, marginBottom: 0 }}>
                    {t("prepare.smsHint")}
                  </p>
                )}
              </div>
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                {account ? (
                  <>
                    <label style={{ display: "flex", alignItems: "flex-start", gap: 8, fontSize: 13, marginBottom: 8 }}>
                      <input type="checkbox" checked={whatsappInvites} onChange={(e) => setWhatsappInvites(e.target.checked)} />
                      <span>{t("prepare.alsoWhatsapp")}</span>
                    </label>
                    {whatsappInvites && (
                      <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 0, marginBottom: 0 }}>
                        {account.isEnterprise
                          ? t("prepare.whatsappQuotaHintEnterprise", {
                              remaining: account.whatsappQuotaRemaining ?? WHATSAPP_ENTERPRISE_MONTHLY_LIMIT,
                              max: WHATSAPP_ENTERPRISE_MONTHLY_LIMIT,
                            })
                          : account.isPaid
                            ? t("prepare.whatsappQuotaHintPaid", {
                                remaining: account.whatsappQuotaRemaining ?? WHATSAPP_PAID_MONTHLY_LIMIT,
                                max: WHATSAPP_PAID_MONTHLY_LIMIT,
                              })
                            : t("prepare.whatsappQuotaHint", {
                                remaining: account.whatsappQuotaRemaining ?? WHATSAPP_FREE_MONTHLY_LIMIT,
                                max: WHATSAPP_FREE_MONTHLY_LIMIT,
                                paidMax: WHATSAPP_PAID_MONTHLY_LIMIT,
                              })}
                      </p>
                    )}
                  </>
                ) : (
                  <p style={{ fontSize: 13, margin: 0 }}>
                    {t("prepare.whatsappRequiresAccount")}{" "}
                    <Link
                      to="/login?ref=prepare-whatsapp"
                      onClick={() => track("upgrade_clicked", { source: "prepare_whatsapp_signup" })}
                    >
                      {t("prepare.signUpFree")}
                    </Link>
                    .
                  </p>
                )}
              </div>
              {account?.isPaid && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
                    <input
                      type="checkbox"
                      checked={signerAttachmentsEnabled}
                      onChange={(e) => setSignerAttachmentsEnabled(e.target.checked)}
                    />
                    {t("prepare.requireAttachments")}
                  </label>
                </div>
              )}
            </div>

            <div className="card">
              <h3 className="prepare-sidebar-heading">{t("prepare.editPdf")}</h3>
              {viewMode === "fields" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setPdfEditError(null);
                    setPdfEditNotice(null);
                    setPlaceMode(false);
                    setViewMode("edit");
                  }}
                >
                  {t("prepare.editPdfAction")}
                </button>
              ) : (
                <>
                  <select
                    className="form-input"
                    style={{ width: "100%", marginBottom: 8 }}
                    value={editTool}
                    onChange={(e) => {
                      setEditTool(e.target.value as "move" | "redact" | "text" | "editText");
                      setRedactDrag(null);
                      setPendingRedaction(null);
                      setTextAnnotationAt(null);
                      setEditingSpan(null);
                    }}
                  >
                    <option value="move">{t("prepare.editModeMove")}</option>
                    <option value="redact">{t("prepare.editModeRedact")}</option>
                    <option value="text">{t("prepare.editModeAddText")}</option>
                    <option value="editText">{t("prepare.editModeExistingText")}</option>
                  </select>
                  <p style={{ fontSize: 11, marginTop: 0, marginBottom: 8 }}>
                    {editTool === "move" && t("prepare.editMoveHint")}
                    {editTool === "redact" && t("prepare.editRedactHint")}
                    {editTool === "text" && t("prepare.editTextHint")}
                    {editTool === "editText" &&
                      (loadingTextSpans
                        ? t("prepare.editScanning")
                        : t("prepare.editTextSelectHint"))}
                  </p>
                  {pdfEditError && <p style={{ color: "var(--danger)", fontSize: 12 }}>{pdfEditError}</p>}
                  {pdfEditNotice && <p style={{ color: "var(--body)", fontSize: 12 }}>{pdfEditNotice}</p>}
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ width: "100%" }}
                    onClick={() => {
                      setViewMode("fields");
                      setEditTool("move");
                      setRedactDrag(null);
                      setPendingRedaction(null);
                      setTextAnnotationAt(null);
                      setEditingSpan(null);
                    }}
                  >
                    {t("prepare.doneEditing")}
                  </button>
                </>
              )}
            </div>

            {viewMode === "fields" && account?.isPaid && (
              <div className="card">
                <h3 className="prepare-sidebar-heading">{t("prepare.aiTools")}</h3>

                <button type="button" className="prepare-highlight-card" style={{ marginBottom: 8 }} disabled={detectingFields} onClick={onDetectFields}>
                  <span className="prepare-highlight-icon">✨</span>
                  <span>
                    <span className="prepare-highlight-title">{detectingFields ? t("prepare.scanning") : t("prepare.smartDetect")}</span>
                    <span className="prepare-highlight-sub">{t("prepare.autoDetectSub")}</span>
                  </span>
                </button>
                {detectFieldsError && <p style={{ color: "var(--danger)", fontSize: 12 }}>{detectFieldsError}</p>}
                {detectFieldsNotice && <p style={{ fontSize: 12 }}>{detectFieldsNotice}</p>}

                <button
                  type="button"
                  className="prepare-highlight-card"
                  style={{ marginBottom: 8 }}
                  disabled={detectingAnchors}
                  onClick={onDetectAnchorTags}
                >
                  <span className="prepare-highlight-icon">🏷</span>
                  <span>
                    <span className="prepare-highlight-title">{detectingAnchors ? t("prepare.scanning") : t("prepare.detectAnchors")}</span>
                    <span className="prepare-highlight-sub">{t("prepare.detectAnchorsSub")}</span>
                  </span>
                </button>

                <button type="button" className="prepare-highlight-card" style={{ marginBottom: 8 }} disabled={explaining} onClick={onExplain}>
                  <span className="prepare-highlight-icon">💬</span>
                  <span>
                    <span className="prepare-highlight-title">{explaining ? t("prepare.reading") : t("prepare.explainPlain")}</span>
                    <span className="prepare-highlight-sub">{t("prepare.explainSub")}</span>
                  </span>
                </button>
                {explainError && <p style={{ color: "var(--danger)", fontSize: 12 }}>{explainError}</p>}
                {explanation && (
                  <div
                    style={{
                      fontSize: 12,
                      whiteSpace: "pre-wrap",
                      background: "var(--primary-soft)",
                      borderRadius: "var(--r-sm)",
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    {explanation}
                  </div>
                )}

                <button type="button" className="prepare-highlight-card" disabled={analyzingRisks} onClick={onAnalyzeRisks}>
                  <span className="prepare-highlight-icon">⚠️</span>
                  <span>
                    <span className="prepare-highlight-title">{analyzingRisks ? t("prepare.checking") : t("prepare.checkRisks")}</span>
                    <span className="prepare-highlight-sub">{t("prepare.riskSub")}</span>
                  </span>
                </button>
                {risksError && <p style={{ color: "var(--danger)", fontSize: 12 }}>{risksError}</p>}
                {risks && risks.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--success)" }}>{t("prepare.riskNone")}</p>
                )}
                {risks && risks.length > 0 && (
                  <ul style={{ fontSize: 12, paddingLeft: 18, marginTop: 8, marginBottom: 0 }}>
                    {risks.map((r, i) => (
                      <li key={i} style={{ marginBottom: 6 }}>
                        <strong
                          style={{
                            color:
                              r.severity === "high"
                                ? "var(--danger)"
                                : r.severity === "medium"
                                ? "var(--warning, #b45309)"
                                : "var(--mute)",
                          }}
                        >
                          {r.severity === "high" ? t("prepare.riskHigh") : r.severity === "medium" ? t("prepare.riskMedium") : t("prepare.riskLow")}
                          {r.issue}
                        </strong>
                        <br />
                        {r.detail}
                      </li>
                    ))}
                  </ul>
                )}

                <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                  {t("prepare.aiLegalDisclaimer")}
                </p>
              </div>
            )}

            {viewMode === "fields" && !account?.isPaid && (
              <div className="card">
                <h3 className="prepare-sidebar-heading">{t("prepare.aiTools")}</h3>
                <p style={{ fontSize: 12, marginTop: 0, marginBottom: 0 }}>
                  <Link to="/login">{t("prepare.signInPaidAi")}</Link> {t("prepare.aiPaidToolsSub")}
                </p>
              </div>
            )}

            {viewMode === "fields" && (
            <div className="card">
              <SidebarHeading label={t("prepare.fields")} count={fields.length} />
              <select
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                value={placingFieldType}
                onChange={(e) => setPlacingFieldType(e.target.value as DocFieldType)}
              >
                <option value="signature">{t("prepare.fieldSignature")}</option>
                <option value="initials">{t("prepare.fieldInitials")}</option>
                <option value="text">{t("prepare.fieldText")}</option>
                <option value="date">{t("prepare.fieldDate")}</option>
                <option value="checkbox">{t("prepare.fieldCheckbox")}</option>
                <option value="dropdown">{t("prepare.fieldDropdown")}</option>
              </select>
              {placingFieldType === "dropdown" && (
                <textarea
                  className="form-input"
                  style={{ width: "100%", marginBottom: 8, minHeight: 72, fontSize: 12 }}
                  aria-label={t("prepare.dropdownOptionsAria")}
                  placeholder={t("prepare.oneOptionPerLine")}
                  value={dropdownOptionsInput}
                  onChange={(e) => setDropdownOptionsInput(e.target.value)}
                />
              )}
              <select
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                value={placingSignerOrder}
                onChange={(e) => setPlacingSignerOrder(Number(e.target.value))}
              >
                {signers.map((s) => (
                  <option key={s.order} value={s.order}>
                    {signerLabel(s.order)}
                  </option>
                ))}
              </select>
              {preferTapPlace ? (
                <div className="prepare-mobile-place-block">
                  <p className="prepare-mobile-place-instruction">{t("prepare.moreFieldTypesHint")}</p>
                  {placeMode ? (
                    <button type="button" className="btn-secondary" style={{ width: "100%" }} onClick={hideSetup}>
                      {t("prepare.hideSetup")}
                    </button>
                  ) : (
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ width: "100%" }}
                      onClick={() => enterPlaceMode(placingSignerOrder, placingFieldType)}
                    >
                      {t("prepare.placeFieldCta", { type: t(FIELD_TYPE_NAME_KEYS[placingFieldType]) })}
                    </button>
                  )}
                </div>
              ) : (
                <div
                  onMouseDown={onCreateDragStart}
                  style={{
                    width: "100%",
                    textAlign: "center",
                    padding: "10px 12px",
                    borderRadius: "var(--r-sm)",
                    border: "1.5px dashed var(--primary)",
                    background: "var(--primary-soft)",
                    color: "var(--primary)",
                    fontWeight: 600,
                    fontSize: 14,
                    cursor: "grab",
                    userSelect: "none",
                  }}
                >
                  {t("prepare.dragOntoDoc")}
                </div>
              )}
              <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                {t("prepare.signerStampHint")}
              </p>
            </div>
            )}

            {viewMode === "fields" && account?.isPaid && fields.length > 0 && (
              <div className="card">
                <h3 className="prepare-sidebar-heading">{t("prepare.saveTemplate")}</h3>
                {templateSavedName ? (
                  <p style={{ marginBottom: 0 }}>{t("prepare.templateSaved", { name: templateSavedName })}</p>
                ) : showTemplateNameInput ? (
                  <>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginBottom: 8 }}
                      placeholder={t("prepare.templateNamePh")}
                      value={templateNameInput}
                      onChange={(e) => setTemplateNameInput(e.target.value)}
                    />
                    {templateSaveError && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>{templateSaveError}</p>
                    )}
                    {signersWithoutFields.length > 0 && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>
                        {t("prepare.templateMissingField", {
                          names: signersWithoutFields.map((s) => signerLabel(s.order)).join(", "),
                        })}
                      </p>
                    )}
                    <button
                      className="btn-secondary"
                      style={{ width: "100%" }}
                      disabled={savingTemplate || !templateNameInput.trim() || signersWithoutFields.length > 0}
                      onClick={onSaveAsTemplate}
                    >
                      {savingTemplate ? t("common.saving") : t("common.save")}
                    </button>
                  </>
                ) : (
                  <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowTemplateNameInput(true)}>
                    {t("prepare.saveTemplate")}
                  </button>
                )}
                <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                  {t("prepare.saveTemplateHint")}
                </p>
              </div>
            )}

            {viewMode === "fields" && fields.length > 0 && (
              <div className="card">
                <h3 className="prepare-sidebar-heading">{t("prepare.submitMarketplace")}</h3>
                {marketplaceSubmittedSlug ? (
                  <p style={{ marginBottom: 0 }}>{t("prepare.marketplaceSubmitted")}</p>
                ) : showMarketplaceInput ? (
                  <>
                    <p style={{ fontSize: 12, color: "var(--danger)", marginTop: 0 }}>
                      {t("dash.marketplaceWarning")}
                    </p>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginBottom: 8 }}
                      placeholder={t("prepare.templateNamePh")}
                      value={marketplaceTitleInput}
                      onChange={(e) => setMarketplaceTitleInput(e.target.value)}
                    />
                    {marketplaceSubmitError && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>{marketplaceSubmitError}</p>
                    )}
                    {signersWithoutFields.length > 0 && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>
                        {t("prepare.templateMissingField", {
                          names: signersWithoutFields.map((s) => signerLabel(s.order)).join(", "),
                        })}
                      </p>
                    )}
                    <button
                      className="btn-secondary"
                      style={{ width: "100%" }}
                      disabled={submittingToMarketplace || !marketplaceTitleInput.trim() || signersWithoutFields.length > 0}
                      onClick={onSubmitToMarketplace}
                    >
                      {submittingToMarketplace ? t("dash.marketplaceSubmitting") : t("dash.marketplaceConfirm")}
                    </button>
                  </>
                ) : (
                  <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowMarketplaceInput(true)}>
                    {t("prepare.submitMarketplace")}
                  </button>
                )}
                <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>{t("prepare.submitMarketplaceHint")}</p>
              </div>
            )}

            {signersWithoutFields.length > 0 && fields.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--danger)" }}>
                {t("prepare.missingField", {
                  names: signersWithoutFields.map((s) => signerLabel(s.order)).join(", "),
                })}
              </p>
            )}

            <div className="card">
              <button
                type="button"
                className="prepare-accordion-toggle"
                onClick={() => setShowCustomMessage((v) => !v)}
              >
                <div>
                  <h3 className="prepare-sidebar-heading" style={{ marginBottom: 2 }}>
                    {t("prepare.inviteEmail")}
                  </h3>
                  <p style={{ fontSize: 12, color: "var(--mute)", margin: 0 }}>
                    {customSubject.trim() || customMessage.trim() ? t("prepare.customized") : t("prepare.defaultInvite")}
                  </p>
                </div>
                <span className={`prepare-accordion-chevron ${showCustomMessage ? "open" : ""}`}>⌄</span>
              </button>
              {showCustomMessage && (
                <div style={{ marginTop: 12 }}>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 8 }}
                    placeholder={t("prepare.subjectPh")}
                    maxLength={150}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                  />
                  <textarea
                    className="form-textarea"
                    style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                    placeholder={t("prepare.messagePh")}
                    maxLength={1000}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                </div>
              )}
            </div>

            <div className="card prepare-sidebar-summary">
              <div className="prepare-sidebar-summary-row">
                <span>{t("prepare.files")}</span>
                <strong>1</strong>
              </div>
              <div className="prepare-sidebar-summary-row">
                <span>{t("prepare.signers")}</span>
                <strong>{signers.length}</strong>
              </div>
              <div className="prepare-sidebar-summary-row">
                <span>{t("prepare.fieldsPlaced")}</span>
                <strong>{fields.length}</strong>
              </div>
              <div className="prepare-sidebar-summary-row">
                <span>{t("prepare.expiration")}</span>
                {account?.isPaid ? (
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <span style={{ fontSize: 12, color: "var(--mute)" }}>{t("prepare.inDays")}</span>
                    <input
                      className="form-input"
                      type="number"
                      min={1}
                      max={90}
                      aria-label={t("prepare.retentionAria")}
                      value={ttlDays}
                      onChange={(e) => {
                        const n = Number(e.target.value);
                        if (!Number.isFinite(n)) return;
                        setTtlDays(Math.min(90, Math.max(1, Math.floor(n))));
                      }}
                      style={{ width: 56, padding: "2px 6px", fontSize: 13, fontWeight: 600 }}
                    />
                    <strong style={{ fontSize: 13 }}>{t("prepare.days")}</strong>
                  </span>
                ) : (
                  <strong>
                    {t("prepare.inDays")} {DOC_EXPIRY_DAYS} {t("prepare.days")}
                  </strong>
                )}
              </div>
              <p style={{ fontSize: 11, color: "var(--mute)", margin: "4px 0 0" }}>
                {t("prepare.identityNote")}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "center", padding: "8px 0 0" }}>
              <img src="/docracy-wordmark.png" alt="Docracy" style={{ height: 14, width: "auto", opacity: 0.6 }} />
            </div>
          </div>

          {preferTapPlace && setupOpen && (
            <button
              type="button"
              className="prepare-setup-backdrop"
              aria-label={t("prepare.hideSetup")}
              onClick={hideSetup}
            />
          )}

          {preferTapPlace && (
            <div className="prepare-mobile-dock" role="toolbar" aria-label={t("prepare.setup")}>
              <button
                type="button"
                className="prepare-mobile-dock-setup"
                aria-expanded={setupOpen}
                aria-controls="prepare-setup-sheet"
                onClick={toggleSetup}
              >
                <span>{setupOpen ? t("prepare.hideSetup") : t("prepare.setup")}</span>
                <span className="prepare-mobile-dock-badge" aria-label={t("prepare.fieldsPlaced")}>
                  {fields.length}
                </span>
              </button>
              <button
                type="button"
                className="btn-primary prepare-mobile-dock-send"
                disabled={!canSubmit || submitting}
                onClick={onSubmit}
              >
                {submitting ? t("common.sending") : t("prepare.send")}
              </button>
            </div>
          )}
        </div>
      )}

      {creatingDrag && (
        <div
          style={{
            position: "fixed",
            left: creatingDrag.x,
            top: creatingDrag.y,
            transform: "translate(-50%, -50%)",
            width: 140,
            padding: "6px 10px",
            borderRadius: "var(--r-sm)",
            border: `1.5px dashed ${creatingDrag.overPage ? "var(--success)" : "var(--primary)"}`,
            background: creatingDrag.overPage ? "rgba(16,185,129,0.12)" : "var(--primary-soft-strong)",
            color: creatingDrag.overPage ? "var(--success)" : "var(--primary)",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            pointerEvents: "none",
            zIndex: 1000,
            boxShadow: "0 6px 16px rgba(0,0,0,0.2)",
          }}
        >
          {creatingDrag.overPage ? t("prepare.dropToPlace") : `${t(FIELD_TYPE_LABEL_KEYS[placingFieldType])} · ${signerLabel(placingSignerOrder)}`}
        </div>
      )}
    </>
  );
}
