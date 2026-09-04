import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchConstanciaPublic, constanciaReceiptPublicUrl, type ConstanciaPublicPacket } from "../lib/api";
import { localizePath, useI18n } from "../lib/i18n";
import { track } from "../lib/track";
import { useNoIndex } from "../lib/useNoIndex";

/**
 * Public income-proof packet. Anyone with the HMAC token can open it — same trust model as
 * /signed/:token. noindex. Does not show the owner's email.
 */
export default function ConstanciaShare() {
  const { t, locale } = useI18n();
  const { token } = useParams<{ token: string }>();
  const [packet, setPacket] = useState<ConstanciaPublicPacket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useNoIndex();

  useEffect(() => {
    if (!token) return;
    fetchConstanciaPublic(token, locale)
      .then(setPacket)
      .catch((err) => setError(err.message));
  }, [token, locale]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      track("viral_cta_clicked", { source: "constancia_share_copy" });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard blocked */
    }
  };

  if (error) {
    return (
      <div className="container">
        <h1>{t("common.notAvailable")}</h1>
        <p>{error}</p>
      </div>
    );
  }

  if (!packet) {
    return (
      <div className="container">
        <p>{t("common.loading")}</p>
      </div>
    );
  }

  const heading = packet.subjectName.trim()
    ? t("constanciaShare.namedTitle", { name: packet.subjectName, year: packet.year })
    : t("constanciaShare.title", { year: packet.year });

  return (
    <div className="container" style={{ maxWidth: 640 }}>
      <p
        className="hero-kicker"
        style={{ marginBottom: 8, color: "var(--mute)", fontSize: 13, letterSpacing: "0.04em", textTransform: "uppercase" }}
      >
        {t("constanciaShare.kicker")}
      </p>
      <h1>{heading}</h1>
      <p style={{ color: "var(--mute)" }}>{t("constanciaShare.disclaimer")}</p>
      {packet.totals.length > 0 && (
        <div className="card" style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, marginTop: 0 }}>{t("constanciaShare.totalsTitle")}</h2>
          {packet.totals.map((tot) => (
            <div key={tot.currency} style={{ padding: "6px 0", borderBottom: "1px solid var(--hairline)" }}>
              <strong>
                {tot.amount} {tot.currency}
              </strong>
              <span style={{ fontSize: 13, color: "var(--mute)", marginLeft: 8 }}>
                {t("constanciaShare.totalCount", { n: tot.count })}
              </span>
            </div>
          ))}
        </div>
      )}
      <div className="card">
        {packet.documents.length === 0 ? (
          <p style={{ color: "var(--mute)", marginBottom: 0 }}>{t("constanciaShare.empty")}</p>
        ) : (
          packet.documents.map((d, i) => (
            <div key={`${d.signedPageUrl}-${i}`} style={{ padding: "10px 0", borderBottom: "1px solid var(--hairline)" }}>
              <a href={d.signedPageUrl}>{d.title}</a>
              <div style={{ fontSize: 12, color: "var(--mute)" }}>
                {d.completedAt.slice(0, 10)}
                {d.amount ? ` · ${d.amount} ${d.currency}` : ""}
                {d.counterparties.length > 0 ? ` · ${d.counterparties.map((c) => c.name).join(", ")}` : ""}
                {d.kind === "cobro" ? ` · ${t("constanciaShare.kindCobro")}` : ` · ${t("constanciaShare.kindSign")}`}
              </div>
            </div>
          ))
        )}
        {(packet.receipts ?? []).length > 0 && (
          <div style={{ marginTop: 16, paddingTop: 8, borderTop: "1px solid var(--hairline)" }}>
            <h2 style={{ fontSize: 15, margin: "0 0 8px" }}>{t("constanciaShare.receiptsTitle")}</h2>
            {(packet.receipts ?? []).map((r) => (
              <div key={r.id} style={{ padding: "6px 0" }}>
                <a href={token ? constanciaReceiptPublicUrl(token, r.id) : "#"}>{r.filename}</a>
              </div>
            ))}
          </div>
        )}
        <div style={{ marginTop: 16 }}>
          <button type="button" className="btn-secondary" onClick={copyLink}>
            {copied ? t("common.copied") : t("constanciaShare.copyLink")}
          </button>
        </div>
      </div>
      <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 24 }}>
        {t("constanciaShare.forwardHint")}{" "}
        <Link to={localizePath("/income-proof", locale)}>{t("constanciaShare.sendYours")}</Link>
      </p>
    </div>
  );
}
