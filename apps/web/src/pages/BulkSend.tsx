import { useEffect, useMemo, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import {
  bulkSendFromTemplate,
  fetchMe,
  fetchTemplates,
  type Account,
  type BulkSendResultDoc,
  type TemplateSummary,
} from "../lib/api";
import { useT } from "../lib/i18n";
import { useNoIndex } from "../lib/useNoIndex";
import { paidVaultDays, PAID_TTL_MAX_DAYS } from "../lib/paidVault";

const DEFAULT_TTL = 9;

type SignerSlot = { name: string; email: string };
type RecipientRow = { signers: SignerSlot[]; title: string };

function emptyRow(signerCount: number): RecipientRow {
  return {
    signers: Array.from({ length: signerCount }, () => ({ name: "", email: "" })),
    title: "",
  };
}

export default function BulkSend() {
  useNoIndex();
  const t = useT();
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [rows, setRows] = useState<RecipientRow[]>([emptyRow(1)]);
  const [pasteText, setPasteText] = useState("");
  const [ttlDays, setTtlDays] = useState(DEFAULT_TTL);
  const paidTtlMax = Math.min(PAID_TTL_MAX_DAYS, paidVaultDays());
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<BulkSendResultDoc[] | null>(null);

  useEffect(() => {
    fetchMe()
      .then(async (res) => {
        setAccount(res.account);
        if (res.account?.isPaid) {
          setTtlDays(Math.min(PAID_TTL_MAX_DAYS, paidVaultDays()));
          const { templates: list } = await fetchTemplates();
          setTemplates(list);
          if (list.length > 0) {
            setTemplateId(list[0].id);
            setRows([emptyRow(list[0].signerCount)]);
          }
        }
      })
      .catch(() => setAccount(null));
  }, []);

  const selected = useMemo(
    () => templates.find((tpl) => tpl.id === templateId) ?? null,
    [templates, templateId]
  );
  const signerCount = selected?.signerCount ?? 1;

  const onSelectTemplate = (id: string) => {
    setTemplateId(id);
    const tpl = templates.find((x) => x.id === id);
    setRows([emptyRow(tpl?.signerCount ?? 1)]);
    setResults(null);
    setError(null);
  };

  const updateSigner = (rowIdx: number, signerIdx: number, patch: Partial<SignerSlot>) => {
    setRows((prev) =>
      prev.map((row, i) =>
        i !== rowIdx
          ? row
          : {
              ...row,
              signers: row.signers.map((s, j) => (j === signerIdx ? { ...s, ...patch } : s)),
            }
      )
    );
  };

  const addRow = () => setRows((prev) => [...prev, emptyRow(signerCount)]);

  const removeRow = (idx: number) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== idx)));
  };

  const applyPaste = () => {
    if (signerCount !== 1) return;
    const emails = pasteText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    if (emails.length === 0) return;
    setRows(
      emails.map((email) => ({
        signers: [{ name: email.split("@")[0] || "", email }],
        title: "",
      }))
    );
    setPasteText("");
  };

  const onSubmit = async () => {
    if (!templateId || rows.length === 0) return;
    setSubmitting(true);
    setError(null);
    setResults(null);
    try {
      const { documents } = await bulkSendFromTemplate({
        templateId,
        recipients: rows.map((r) => ({
          signers: r.signers.map((s) => ({ name: s.name.trim(), email: s.email.trim() })),
          title: r.title.trim() || undefined,
        })),
        ttlDays,
      });
      setResults(documents);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setSubmitting(false);
    }
  };

  if (account === undefined) {
    return (
      <div className="container">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  if (!account) {
    return <Navigate to="/login" replace />;
  }

  if (!account.isPaid) {
    return (
      <div className="container">
        <h1>{t("bulkSend.title")}</h1>
        <p>{t("bulkSend.paidOnly")}</p>
        <Link to="/pricing">{t("bulkSend.seePricing")}</Link>
      </div>
    );
  }

  return (
    <div className="container">
      <h1>{t("bulkSend.title")}</h1>
      <p style={{ color: "var(--mute)", marginBottom: 20 }}>{t("bulkSend.sub")}</p>

      {templates.length === 0 ? (
        <div className="card">
          <p style={{ marginBottom: 12 }}>{t("bulkSend.noTemplates")}</p>
          <Link to="/prepare" className="btn-secondary" style={{ textDecoration: "none" }}>
            {t("prepare.title")}
          </Link>
        </div>
      ) : (
        <>
          <div className="card" style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>{t("bulkSend.template")}</label>
            <select
              className="form-input"
              style={{ width: "100%", maxWidth: 420 }}
              value={templateId}
              onChange={(e) => onSelectTemplate(e.target.value)}
              aria-label={t("bulkSend.template")}
            >
              {templates.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {tpl.name}{" "}
                  ({tpl.signerCount === 1
                    ? t("prepare.signersCount", { count: tpl.signerCount })
                    : t("prepare.signersCountPlural", { count: tpl.signerCount })})
                </option>
              ))}
            </select>

            <label style={{ display: "block", fontSize: 13, marginTop: 14, marginBottom: 6 }}>
              {t("bulkSend.retention")}
            </label>
            <input
              className="form-input"
              type="number"
              min={1}
              max={paidTtlMax}
              value={ttlDays}
              onChange={(e) => {
                const n = Number(e.target.value);
                if (!Number.isFinite(n)) return;
                setTtlDays(Math.min(paidTtlMax, Math.max(1, Math.floor(n))));
              }}
              style={{ width: 80 }}
              aria-label={t("bulkSend.retention")}
            />
            <p style={{ fontSize: 12, color: "var(--mute)", marginTop: 6 }}>{t("prepare.taxVaultHint")}</p>
          </div>

          {signerCount === 1 && (
            <div className="card" style={{ marginBottom: 16 }}>
              <label style={{ display: "block", fontSize: 13, marginBottom: 6 }}>
                {t("bulkSend.pasteEmails")}
              </label>
              <textarea
                className="form-input"
                style={{ width: "100%", minHeight: 80, fontFamily: "inherit" }}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                placeholder={t("bulkSend.pastePlaceholder")}
                aria-label={t("bulkSend.pasteEmails")}
              />
              <button
                className="btn-secondary"
                style={{ marginTop: 8 }}
                disabled={!pasteText.trim()}
                onClick={applyPaste}
              >
                {t("bulkSend.addFromPaste")}
              </button>
            </div>
          )}

          <div className="card" style={{ marginBottom: 16 }}>
            <h3 style={{ fontSize: 15, marginBottom: 12 }}>{t("bulkSend.recipients")}</h3>
            {rows.map((row, rowIdx) => (
              <div
                key={rowIdx}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--hairline)",
                }}
              >
                <div style={{ fontSize: 12, color: "var(--mute)", marginBottom: 6 }}>
                  {t("bulkSend.recipientN", { n: rowIdx + 1 })}
                </div>
                {row.signers.map((s, signerIdx) => (
                  <div
                    key={signerIdx}
                    style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 6 }}
                  >
                    {signerCount > 1 && (
                      <span style={{ fontSize: 12, color: "var(--mute)", alignSelf: "center", minWidth: 56 }}>
                        {t("prepare.signerN", { n: signerIdx + 1 })}
                      </span>
                    )}
                    <input
                      className="form-input"
                      placeholder={t("bulkSend.namePlaceholder")}
                      aria-label={t("bulkSend.signerNameAria", { recipient: rowIdx + 1, signer: signerIdx + 1 })}
                      value={s.name}
                      onChange={(e) => updateSigner(rowIdx, signerIdx, { name: e.target.value })}
                      style={{ flex: "1 1 140px" }}
                    />
                    <input
                      className="form-input"
                      type="email"
                      placeholder={t("login.email")}
                      aria-label={t("bulkSend.signerEmailAria", { recipient: rowIdx + 1, signer: signerIdx + 1 })}
                      value={s.email}
                      onChange={(e) => updateSigner(rowIdx, signerIdx, { email: e.target.value })}
                      style={{ flex: "1 1 180px" }}
                    />
                  </div>
                ))}
                <input
                  className="form-input"
                  placeholder={t("bulkSend.titleOptional")}
                  aria-label={t("bulkSend.recipientTitleAria", { n: rowIdx + 1 })}
                  value={row.title}
                  onChange={(e) =>
                    setRows((prev) =>
                      prev.map((r, i) => (i === rowIdx ? { ...r, title: e.target.value } : r))
                    )
                  }
                  style={{ width: "100%", maxWidth: 420, marginTop: 4 }}
                />
                {rows.length > 1 && (
                  <button
                    className="btn-secondary"
                    style={{ marginTop: 8, fontSize: 12, padding: "4px 8px" }}
                    onClick={() => removeRow(rowIdx)}
                  >
                    {t("common.delete")}
                  </button>
                )}
              </div>
            ))}
            <button className="btn-secondary" style={{ marginTop: 12 }} onClick={addRow}>
              {t("bulkSend.addRecipient")}
            </button>
          </div>

          {error && <p style={{ color: "var(--danger)", marginBottom: 12 }}>{error}</p>}

          <button className="btn-primary" disabled={submitting || !templateId} onClick={onSubmit}>
            {submitting
              ? t("common.sending")
              : rows.length === 1
                ? t("bulkSend.sendOne")
                : t("bulkSend.sendMany", { count: rows.length })}
          </button>
        </>
      )}

      {results && (
        <div className="card" style={{ marginTop: 24 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>
            {results.length === 1
              ? t("bulkSend.sentOne")
              : t("bulkSend.sentMany", { count: results.length })}
          </h3>
          {results.map((doc) => (
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
              <span style={{ overflowWrap: "anywhere" }}>
                {doc.title}{" "}
                <span style={{ fontSize: 12, color: "var(--mute)" }}>({doc.recipientLabel})</span>
              </span>
              <Link to={`/status/${doc.statusToken}`} style={{ fontSize: 13 }}>
                {t("bulkSend.statusLink")}
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
