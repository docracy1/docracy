import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import PdfViewer from "../components/PdfViewer";
import {
  analyzeDocumentRisks,
  createDocument,
  createTemplate,
  explainDocument,
  fetchMe,
  fetchTemplate,
  fetchTemplates,
  generateContract,
} from "../lib/api";
import type { Account, ContractRisk, TemplateSummary } from "../lib/api";
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
import { assignFieldsToSigners, detectFieldCandidates } from "../lib/fieldDetection";
import type { DocField, DocFieldType, SignerInput } from "../lib/types";

const FREE_TIER_MAX_SIGNERS = 2;
const MAX_PDF_BYTES = 15 * 1024 * 1024;

// Signature/initials are taller to leave room for the auto-printed "email · date" caption text/date
// fields don't get; text/date are narrower single-line boxes.
const FIELD_SIZE_BY_TYPE: Record<DocFieldType, { w: number; h: number }> = {
  signature: { w: 0.26, h: 0.07 },
  initials: { w: 0.1, h: 0.06 },
  text: { w: 0.22, h: 0.04 },
  date: { w: 0.16, h: 0.04 },
};

const FIELD_TYPE_LABEL: Record<DocFieldType, string> = {
  signature: "Sign here",
  initials: "Initial here",
  text: "Text",
  date: "Date",
};

let fieldIdCounter = 0;

export default function Prepare() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get("template");
  const freeTemplateSlug = searchParams.get("freeTemplate");
  const [file, setFile] = useState<File | null>(null);
  const [pdfBytes, setPdfBytes] = useState<Uint8Array | null>(null);
  const [preparerSigns, setPreparerSigns] = useState(false);
  const [preparerEmail, setPreparerEmail] = useState("");
  const [showCustomMessage, setShowCustomMessage] = useState(false);
  const [customSubject, setCustomSubject] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [signingMode, setSigningMode] = useState<"sequential" | "parallel">("sequential");
  const [signers, setSigners] = useState<SignerInput[]>([
    { order: 1, name: "", email: "" },
    { order: 2, name: "", email: "" },
  ]);
  const [fields, setFields] = useState<DocField[]>([]);
  const [placingSignerOrder, setPlacingSignerOrder] = useState(1);
  const [placingFieldType, setPlacingFieldType] = useState<DocFieldType>("signature");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draggingFieldId, setDraggingFieldId] = useState<string | null>(null);
  const [creatingDrag, setCreatingDrag] = useState<{ x: number; y: number; overPage: boolean } | null>(null);

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
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [templateLoadError, setTemplateLoadError] = useState<string | null>(null);
  const [showTemplateNameInput, setShowTemplateNameInput] = useState(false);
  const [templateNameInput, setTemplateNameInput] = useState("");
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaveError, setTemplateSaveError] = useState<string | null>(null);
  const [templateSavedName, setTemplateSavedName] = useState<string | null>(null);

  // Only used to gate the (paid-only) template UI — anonymous/free usage of this page is
  // otherwise completely unaffected by this call.
  useEffect(() => {
    fetchMe()
      .then((res) => setAccount(res.account))
      .catch(() => setAccount(null));
  }, []);

  useEffect(() => {
    if (account?.isPaid && !pdfBytes) {
      fetchTemplates()
        .then((res) => setAvailableTemplates(res.templates))
        .catch(() => setAvailableTemplates([]));
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
        setFile(new File([bytes as unknown as BlobPart], `${tpl.name || "template"}.pdf`, { type: "application/pdf" }));
        setSigners(Array.from({ length: tpl.signerCount }, (_, i) => ({ order: i + 1, name: "", email: "" })));
      })
      .catch((err) => setTemplateLoadError(err instanceof Error ? err.message : "Couldn't load that template"))
      .finally(() => setLoadingTemplate(false));
  }, [templateId]);

  // Free templates are static PDFs shipped with the site — no account, no D1 lookup, unlike the
  // paid saved-templates flow above.
  useEffect(() => {
    if (!freeTemplateSlug) return;
    const template = getFreeTemplate(freeTemplateSlug);
    if (!template) {
      setTemplateLoadError("That free template couldn't be found.");
      return;
    }
    setLoadingTemplate(true);
    setTemplateLoadError(null);
    fetch(template.pdfPath)
      .then((res) => {
        if (!res.ok) throw new Error("Couldn't load that template's PDF");
        return res.arrayBuffer();
      })
      .then((buf) => {
        const bytes = new Uint8Array(buf);
        setPdfBytes(bytes);
        setFields(template.fields);
        setFile(new File([bytes as unknown as BlobPart], `${template.name}.pdf`, { type: "application/pdf" }));
        setSigners(template.signerLabels.map((_, i) => ({ order: i + 1, name: "", email: "" })));
      })
      .catch((err) => setTemplateLoadError(err instanceof Error ? err.message : "Couldn't load that template"))
      .finally(() => setLoadingTemplate(false));
  }, [freeTemplateSlug]);

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > MAX_PDF_BYTES) {
      setError(`PDF must be under ${MAX_PDF_BYTES / (1024 * 1024)}MB — this one is ${(f.size / (1024 * 1024)).toFixed(1)}MB.`);
      e.target.value = "";
      return;
    }
    setError(null);
    setFile(f);
    setPdfBytes(new Uint8Array(await f.arrayBuffer()));
    setFields([]);
  };

  const updateSigner = (order: number, patch: Partial<SignerInput>) => {
    setSigners((prev) => prev.map((s) => (s.order === order ? { ...s, ...patch } : s)));
  };

  const addSigner = () => {
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
    setFile((prev) => new File([newBytes as unknown as BlobPart], prev?.name ?? "document.pdf", { type: "application/pdf" }));
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
        setPdfEditNotice("Fields were cleared because the page layout changed — please re-place them.");
      }
    } catch (err) {
      setPdfEditError(err instanceof Error ? err.message : "Couldn't apply that change");
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
        setDetectFieldsNotice("Couldn't find any signature, date, or initial blanks to auto-place — add fields manually below.");
        return;
      }
      const detected = assignFieldsToSigners(candidates, signers.length, fieldIdCounter);
      fieldIdCounter += detected.length;
      setFields((prev) => [...prev, ...detected]);
      setDetectFieldsNotice(
        `Placed ${detected.length} field${detected.length === 1 ? "" : "s"} automatically — review them and adjust or remove any that aren't right.`
      );
    } catch (err) {
      setDetectFieldsError(err instanceof Error ? err.message : "Couldn't scan this document");
    } finally {
      setDetectingFields(false);
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
      setExplainError(err instanceof Error ? err.message : "Couldn't explain this document");
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
      setRisksError(err instanceof Error ? err.message : "Couldn't analyze this document");
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
      setGenerateError(err instanceof Error ? err.message : "Couldn't generate a contract");
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

  const onFieldDragStart = (e: React.MouseEvent<HTMLDivElement>, field: DocField) => {
    e.preventDefault();
    e.stopPropagation();
    const pageEl = e.currentTarget.offsetParent as HTMLElement;
    dragState.current = {
      id: field.id,
      startClientX: e.clientX,
      startClientY: e.clientY,
      startXFrac: field.xFrac,
      startYFrac: field.yFrac,
      pageRect: pageEl.getBoundingClientRect(),
      wFrac: field.wFrac,
      hFrac: field.hFrac,
    };
    setDraggingFieldId(field.id);

    const onMove = (moveEvent: MouseEvent) => {
      const drag = dragState.current;
      if (!drag) return;
      const dxFrac = (moveEvent.clientX - drag.startClientX) / drag.pageRect.width;
      const dyFrac = (moveEvent.clientY - drag.startClientY) / drag.pageRect.height;
      const xFrac = Math.min(Math.max(drag.startXFrac + dxFrac, 0), 1 - drag.wFrac);
      const yFrac = Math.min(Math.max(drag.startYFrac + dyFrac, 0), 1 - drag.hFrac);
      updateField(drag.id, { xFrac, yFrac });
    };
    const onUp = () => {
      dragState.current = null;
      setDraggingFieldId(null);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
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
      const size = FIELD_SIZE_BY_TYPE[placingFieldType];
      const xFrac = Math.min(Math.max((upEvent.clientX - target.rect.left) / target.rect.width - size.w / 2, 0), 1 - size.w);
      const yFrac = Math.min(Math.max((upEvent.clientY - target.rect.top) / target.rect.height - size.h / 2, 0), 1 - size.h);
      const field: DocField = {
        id: `f${fieldIdCounter++}`,
        signerOrder: placingSignerOrder,
        page: target.index,
        xFrac,
        yFrac,
        wFrac: size.w,
        hFrac: size.h,
        type: placingFieldType,
      };
      setFields((prev) => [...prev, field]);
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const signerLabel = (order: number) => {
    const s = signers.find((x) => x.order === order);
    return s?.name || `Signer ${order}`;
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
      setTemplateSaveError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSavingTemplate(false);
    }
  };

  const onSubmit = async () => {
    if (!file || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const effectiveSigningMode = signers.length > 1 ? signingMode : undefined;
      const { docId, statusToken } = await createDocument(file, preparerSigns, signers, fields, {
        preparerEmail: !preparerSigns && preparerEmail.trim() ? preparerEmail.trim() : undefined,
        customSubject: customSubject.trim() || undefined,
        customMessage: customMessage.trim() || undefined,
        signingMode: effectiveSigningMode,
      });
      navigate("/prepare/sent", { state: { docId, statusToken, signingMode: effectiveSigningMode } });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="container">
      <h1>Prepare a document</h1>

      {!pdfBytes && (
        <div className="card">
          {loadingTemplate && <p>Loading template…</p>}
          {templateLoadError && <p style={{ color: "var(--danger)" }}>{templateLoadError}</p>}
          {!loadingTemplate && (
            <>
              {account?.isPaid && availableTemplates.length > 0 && (
                <div style={{ marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--hairline)" }}>
                  <p style={{ marginTop: 0, marginBottom: 6, fontSize: 13, color: "var(--mute)" }}>
                    Start from a template
                  </p>
                  {availableTemplates.map((t) => (
                    <Link
                      key={t.id}
                      to={`/prepare?template=${t.id}`}
                      style={{ display: "block", marginBottom: 4 }}
                    >
                      {t.name} ({t.signerCount} signer{t.signerCount === 1 ? "" : "s"})
                    </Link>
                  ))}
                </div>
              )}
              <p>Upload the PDF you want signed.</p>
              <input type="file" accept="application/pdf" onChange={onFileChange} />
              <p style={{ fontSize: 11, color: "var(--mute)", marginTop: 6, marginBottom: 0 }}>Max file size: 15MB.</p>
              {error && <p style={{ color: "var(--danger)", marginTop: 8 }}>{error}</p>}

              {account?.isPaid ? (
                <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                  {showGenerate ? (
                    <>
                      <p style={{ marginTop: 0, marginBottom: 6, fontSize: 13, color: "var(--mute)" }}>
                        Describe the agreement you need
                      </p>
                      <textarea
                        className="form-textarea"
                        style={{ width: "100%", minHeight: 80, resize: "vertical", marginBottom: 8 }}
                        placeholder='e.g. "A simple web design contract for a $2,500 fixed-price project with a 2-week deadline"'
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
                          {generating ? "Drafting…" : "Generate"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          onClick={() => {
                            setShowGenerate(false);
                            setGenerateError(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                      <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                        AI-drafted — review carefully before sending, this isn't legal advice.
                      </p>
                    </>
                  ) : (
                    <button type="button" className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowGenerate(true)}>
                      Or generate one with AI
                    </button>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: 12, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--hairline)" }}>
                  <Link to="/login">Sign in with a paid account</Link> to generate a contract with AI instead of
                  uploading one.
                </p>
              )}
            </>
          )}
        </div>
      )}

      {pdfBytes && (
        <div className="prepare-grid">
          <div>
            <PdfViewer
              pdfBytes={pdfBytes}
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
                          onMouseDown={(e) => onFieldDragStart(e, f)}
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
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                            <span>
                              {FIELD_TYPE_LABEL[f.type ?? "signature"]} · {signerLabel(f.signerOrder)}
                            </span>
                            <button
                              aria-label="Remove field"
                              onMouseDown={(e) => e.stopPropagation()}
                              onClick={(e) => {
                                e.stopPropagation();
                                removeField(f.id);
                              }}
                              style={{ background: "none", border: "none", color: "var(--primary)", cursor: "pointer" }}
                            >
                              ×
                            </button>
                          </div>
                          {(f.type ?? "signature") !== "text" && (f.type ?? "signature") !== "date" && (
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
                        aria-label="Move page up"
                        className="btn-secondary"
                        style={{ padding: "2px 8px", fontSize: 12 }}
                        disabled={page.index === 0 || pdfEditBusy}
                        onClick={() => movePage(page.index, -1)}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        aria-label="Move page down"
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
                        🗑 Delete page
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
                          Redact this area? The page is flattened to an image — text under it won't be selectable or
                          recoverable afterward.
                        </p>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                            disabled={pdfEditBusy}
                            onClick={applyRedaction}
                          >
                            {pdfEditBusy ? "Applying…" : "Redact"}
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                            onClick={() => setPendingRedaction(null)}
                          >
                            Cancel
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
                        placeholder="Text to insert"
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
                          {pdfEditBusy ? "Adding…" : "Add"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ flex: 1, fontSize: 12, padding: "4px 8px" }}
                          onClick={() => setTextAnnotationAt(null)}
                        >
                          Cancel
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
                        aria-label="Replacement text"
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
                          {pdfEditBusy ? "Saving…" : "Save"}
                        </button>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ flex: 1, fontSize: 12, padding: "4px 8px", color: "var(--danger)" }}
                          disabled={pdfEditBusy}
                          onClick={() => applyTextSpanEdit("")}
                        >
                          Delete
                        </button>
                      </div>
                      <button
                        type="button"
                        className="btn-secondary"
                        style={{ width: "100%", fontSize: 12, padding: "4px 8px" }}
                        onClick={() => setEditingSpan(null)}
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </>
              )}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, position: "sticky", top: 24 }}>
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Signers &amp; order</h3>
              <label style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, color: "var(--body)" }}>
                <input type="checkbox" checked={preparerSigns} onChange={(e) => togglePreparerSigns(e.target.checked)} />
                I also need to sign this
              </label>
              {!preparerSigns && (
                <div style={{ marginBottom: 12 }}>
                  <input
                    className="form-input"
                    style={{ width: "100%" }}
                    placeholder="Your email (optional) — to get the status link"
                    aria-label="Your email"
                    type="email"
                    value={preparerEmail}
                    onChange={(e) => setPreparerEmail(e.target.value)}
                  />
                  <p style={{ fontSize: 11, marginTop: 4, marginBottom: 0 }}>
                    There's no account, so this is the only way to recover the status link if you lose it.
                  </p>
                </div>
              )}
              {signers.map((s, i) => (
                <div key={s.order} style={{ marginBottom: 10, paddingBottom: 10, borderBottom: "1px solid var(--hairline)" }}>
                  <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 4 }}>
                    {s.order}. {preparerSigns && i === 0 ? "You" : `Signer ${s.order}`}
                  </div>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder="Name"
                    aria-label={`Signer ${s.order} name`}
                    value={s.name}
                    onChange={(e) => updateSigner(s.order, { name: e.target.value })}
                  />
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 6 }}
                    placeholder="Email"
                    aria-label={`Signer ${s.order} email`}
                    type="email"
                    value={s.email}
                    onChange={(e) => updateSigner(s.order, { email: e.target.value })}
                  />
                  {account?.isPaid && (
                    <input
                      className="form-input"
                      style={{ width: "100%" }}
                      placeholder="PIN (optional) — 4-8 digits, extra protection for this link"
                      aria-label={`Signer ${s.order} PIN`}
                      inputMode="numeric"
                      maxLength={8}
                      value={s.pin ?? ""}
                      onChange={(e) => updateSigner(s.order, { pin: e.target.value.replace(/\D/g, "") })}
                    />
                  )}
                  {signers.length > 1 && (
                    <button
                      className="btn-secondary"
                      style={{ marginTop: 6, fontSize: 12, padding: "4px 8px" }}
                      onClick={() => removeSigner(s.order)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              ))}
              <button className="btn-secondary" onClick={addSigner} style={{ width: "100%" }}>
                + Add signer
              </button>
              {signers.length > 1 && (
                <div style={{ marginTop: 12, paddingTop: 12, borderTop: "1px solid var(--hairline)" }}>
                  <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 0, marginBottom: 6 }}>Signing order</p>
                  <select
                    className="form-input"
                    style={{ width: "100%" }}
                    value={signingMode}
                    onChange={(e) => setSigningMode(e.target.value as "sequential" | "parallel")}
                  >
                    <option value="sequential">Sequential (default) — one signer at a time, in order</option>
                    <option value="parallel">All at once — every signer can sign as soon as they're invited</option>
                  </select>
                </div>
              )}
              {signers.length > FREE_TIER_MAX_SIGNERS && (
                <p style={{ fontSize: 12, marginTop: 8, color: "var(--body)" }}>
                  Free plan supports up to {FREE_TIER_MAX_SIGNERS} signers.{" "}
                  <Link to="/login">Sign in for unlimited signers</Link>.
                </p>
              )}
              {!account?.isPaid && (
                <p style={{ fontSize: 12, marginTop: 8, color: "var(--body)" }}>
                  <Link to="/login">Sign in with a paid account</Link> to add a PIN to a signer's link.
                </p>
              )}
            </div>

            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Edit document</h3>
              {viewMode === "fields" ? (
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  onClick={() => {
                    setPdfEditError(null);
                    setPdfEditNotice(null);
                    setViewMode("edit");
                  }}
                >
                  Reorder, redact, or insert text
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
                    <option value="move">Reorder / delete pages</option>
                    <option value="redact">Redact — drag a box to black out</option>
                    <option value="text">Add text — click to insert</option>
                    <option value="editText">Edit existing text — click to fix or remove</option>
                  </select>
                  <p style={{ fontSize: 11, marginTop: 0, marginBottom: 8 }}>
                    {editTool === "move" && "Use the ↑ / ↓ / delete controls on each page."}
                    {editTool === "redact" && "Drag a box over the document to black it out permanently."}
                    {editTool === "text" && "Click anywhere on the document to insert a short line of text."}
                    {editTool === "editText" &&
                      (loadingTextSpans
                        ? "Scanning the document for text…"
                        : "Click any existing line of text to edit or remove it. This covers the original with white and " +
                          "draws your change in its place — the old text isn't securely destroyed the way Redact is.")}
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
                    Done editing
                  </button>
                </>
              )}
            </div>

            {viewMode === "fields" && account?.isPaid && (
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>AI tools</h3>

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%", marginBottom: 8 }}
                  disabled={detectingFields}
                  onClick={onDetectFields}
                >
                  {detectingFields ? "Scanning…" : "Auto-detect signature & date fields"}
                </button>
                {detectFieldsError && <p style={{ color: "var(--danger)", fontSize: 12 }}>{detectFieldsError}</p>}
                {detectFieldsNotice && <p style={{ fontSize: 12 }}>{detectFieldsNotice}</p>}

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%", marginBottom: 8 }}
                  disabled={explaining}
                  onClick={onExplain}
                >
                  {explaining ? "Reading…" : "Explain in plain English"}
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

                <button
                  type="button"
                  className="btn-secondary"
                  style={{ width: "100%" }}
                  disabled={analyzingRisks}
                  onClick={onAnalyzeRisks}
                >
                  {analyzingRisks ? "Checking…" : "Check for risky clauses"}
                </button>
                {risksError && <p style={{ color: "var(--danger)", fontSize: 12 }}>{risksError}</p>}
                {risks && risks.length === 0 && (
                  <p style={{ fontSize: 12, color: "var(--success)" }}>Nothing unusual stood out.</p>
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
                          {r.severity === "high" ? "High risk: " : r.severity === "medium" ? "Medium risk: " : "Low risk: "}
                          {r.issue}
                        </strong>
                        <br />
                        {r.detail}
                      </li>
                    ))}
                  </ul>
                )}

                <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                  AI tools are a best guess, not legal advice — always read a contract yourself before sending it.
                </p>
              </div>
            )}

            {viewMode === "fields" && !account?.isPaid && (
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>AI tools</h3>
                <p style={{ fontSize: 12, marginTop: 0, marginBottom: 0 }}>
                  <Link to="/login">Sign in with a paid account</Link> to auto-detect fields, get a plain-English
                  explanation, and check for risky clauses.
                </p>
              </div>
            )}

            {viewMode === "fields" && (
            <div className="card">
              <h3 style={{ marginBottom: 12 }}>Add a field</h3>
              <select
                className="form-input"
                style={{ width: "100%", marginBottom: 8 }}
                value={placingFieldType}
                onChange={(e) => setPlacingFieldType(e.target.value as DocFieldType)}
              >
                <option value="signature">Signature</option>
                <option value="initials">Initials</option>
                <option value="text">Text</option>
                <option value="date">Date</option>
              </select>
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
                ⠿ Drag onto the document
              </div>
              <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                The signer's email and the date get stamped in automatically — no need for separate fields.
              </p>
            </div>
            )}

            {viewMode === "fields" && account?.isPaid && fields.length > 0 && (
              <div className="card">
                <h3 style={{ marginBottom: 12 }}>Save as template</h3>
                {templateSavedName ? (
                  <p style={{ marginBottom: 0 }}>Saved "{templateSavedName}" — find it on your Dashboard.</p>
                ) : showTemplateNameInput ? (
                  <>
                    <input
                      className="form-input"
                      style={{ width: "100%", marginBottom: 8 }}
                      placeholder="Template name"
                      value={templateNameInput}
                      onChange={(e) => setTemplateNameInput(e.target.value)}
                    />
                    {templateSaveError && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>{templateSaveError}</p>
                    )}
                    {signersWithoutFields.length > 0 && (
                      <p style={{ color: "var(--danger)", fontSize: 13 }}>
                        Every signer needs a field before this can be saved — still needs one:{" "}
                        {signersWithoutFields.map((s) => signerLabel(s.order)).join(", ")}
                      </p>
                    )}
                    <button
                      className="btn-secondary"
                      style={{ width: "100%" }}
                      disabled={savingTemplate || !templateNameInput.trim() || signersWithoutFields.length > 0}
                      onClick={onSaveAsTemplate}
                    >
                      {savingTemplate ? "Saving…" : "Save"}
                    </button>
                  </>
                ) : (
                  <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowTemplateNameInput(true)}>
                    Save as template
                  </button>
                )}
                <p style={{ fontSize: 11, marginTop: 8, marginBottom: 0 }}>
                  Saves this PDF and field layout for reuse — signer names and emails aren't stored, just how many
                  signers there are and where their fields go.
                </p>
              </div>
            )}

            {signersWithoutFields.length > 0 && fields.length > 0 && (
              <p style={{ fontSize: 12, color: "var(--danger)" }}>
                Still needs a field: {signersWithoutFields.map((s) => signerLabel(s.order)).join(", ")}
              </p>
            )}

            <div className="card">
              {showCustomMessage ? (
                <>
                  <h3 style={{ marginBottom: 12 }}>Customize the invite email</h3>
                  <input
                    className="form-input"
                    style={{ width: "100%", marginBottom: 8 }}
                    placeholder="Subject (optional)"
                    maxLength={150}
                    value={customSubject}
                    onChange={(e) => setCustomSubject(e.target.value)}
                  />
                  <textarea
                    className="form-textarea"
                    style={{ width: "100%", minHeight: 80, resize: "vertical" }}
                    placeholder="Message to signers (optional) — replaces the default invite text"
                    maxLength={1000}
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                  />
                </>
              ) : (
                <button className="btn-secondary" style={{ width: "100%" }} onClick={() => setShowCustomMessage(true)}>
                  Customize the invite email
                </button>
              )}
            </div>

            {error && <p style={{ color: "var(--danger)" }}>{error}</p>}

            <button className="btn-primary" disabled={!canSubmit || submitting} onClick={onSubmit}>
              {submitting ? "Sending…" : "Send for signing"}
            </button>
            <p style={{ fontSize: 11, color: "var(--mute)" }}>
              Signer identity isn't verified — only use this for documents where that's acceptable.
            </p>
          </div>
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
          {creatingDrag.overPage ? "Drop to place" : `${FIELD_TYPE_LABEL[placingFieldType]} · ${signerLabel(placingSignerOrder)}`}
        </div>
      )}
    </div>
  );
}
