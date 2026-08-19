import { Link } from "react-router-dom";
import { FREE_TEMPLATES } from "../lib/freeTemplates";
import { useT } from "../lib/i18n";
import { useSeoMeta } from "../lib/useSeoMeta";

function Section({ id, title, children }: { id: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginTop: 36 }} id={id}>
      <h2 style={{ fontSize: 20 }}>{title}</h2>
      {children}
    </div>
  );
}

export default function Docs() {
  const t = useT();
  useSeoMeta("docs");

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <h1 style={{ fontSize: 30 }}>{t("docs.title")}</h1>
      <p style={{ color: "var(--mute)" }}>{t("docs.sub")}</p>

      <Section id="sending" title={t("docs.sending.title")}>
        <p>
          {t("docs.sending.body1")}{" "}
          <Link to="/prepare">{t("prepare.title")}</Link>
          {t("docs.sending.body2")}
        </p>
      </Section>

      <Section id="fields" title={t("docs.fields.title")}>
        <ul style={{ marginTop: 0 }}>
          <li>{t("docs.fields.sig")}</li>
          <li>{t("docs.fields.text")}</li>
          <li>{t("docs.fields.checkbox")}</li>
          <li>{t("docs.fields.dropdown")}</li>
        </ul>
      </Section>

      <Section id="anchor-tags" title={t("docs.anchorTags.title")}>
        <p>
          {t("docs.anchorTags.body1")}{" "}
          <strong>{t("docs.anchorTags.detect")}</strong>{" "}
          {t("docs.anchorTags.body2")}{" "}
          <code>{"{{sig1}}"}</code>, <code>{"{{date_2}}"}</code>, {t("docs.anchorTags.or")}{" "}
          <code>{"{{dropdown_1:Yes|No|Maybe}}"}</code>. {t("docs.anchorTags.body3")}
        </p>
      </Section>

      <Section id="sms" title={t("docs.sms.title")}>
        <p>{t("docs.sms.body")}</p>
      </Section>

      <Section id="signer-attachments" title={t("docs.signerAttachments.title")}>
        <p>
          {t("docs.signerAttachments.body1")}{" "}
          <strong>{t("docs.signerAttachments.require")}</strong>.{" "}
          {t("docs.signerAttachments.body2")}{" "}
          <strong>{t("docs.signerAttachments.files")}</strong>.
        </p>
      </Section>

      <Section id="templates-free" title={t("docs.templatesFree.title")}>
        <p>
          <Link to="/free-templates">
            {t("docs.templatesFree.link", { count: FREE_TEMPLATES.length })}
          </Link>
          {t("docs.templatesFree.body")}
        </p>
      </Section>

      <Section id="paid" title={t("docs.paid.title")}>
        <p>
          {t("docs.paid.body1")}{" "}
          <Link to="/pricing">{t("pricing.title")}</Link>.
        </p>
      </Section>

      <Section id="cloud-connectors" title={t("docs.cloudConnectors.title")}>
        <p>
          {t("docs.cloudConnectors.body1")}{" "}
          <strong>{t("dash.connectors")}</strong>. {t("docs.cloudConnectors.body2")}
        </p>
        <ul>
          <li><strong>Dropbox</strong></li>
          <li><strong>OneDrive</strong> {t("docs.cloudConnectors.microsoft")}</li>
          <li><strong>Box</strong></li>
          <li><strong>Google Drive</strong></li>
        </ul>
      </Section>

      <Section id="bulk-send" title={t("docs.bulkSend.title")}>
        <p>{t("docs.bulkSend.body")}</p>
      </Section>

      <Section id="expiry" title={t("docs.expiry.title")}>
        <p>{t("docs.expiry.body")}</p>
      </Section>

      <Section id="embed" title={t("docs.embed.title")}>
        <p>{t("docs.embed.body")}</p>
      </Section>

      <Section id="contacts" title={t("docs.contacts.title")}>
        <p>
          {t("docs.contacts.body1")}{" "}
          <strong>{t("dash.contacts")}</strong>. {t("docs.contacts.body2")}
        </p>
      </Section>

      <Section id="enterprise" title={t("docs.enterprise.title")}>
        <p>
          {t("docs.enterprise.body1")}{" "}
          <a href="mailto:sales@docracy.io">sales@docracy.io</a>{" "}
          {t("docs.enterprise.body2")}
        </p>
      </Section>

      <Section id="ai" title={t("docs.ai.title")}>
        <p style={{ marginBottom: 8 }}>{t("docs.ai.intro")}</p>
        <ul style={{ marginTop: 0 }}>
          <li>{t("docs.ai.detect")}</li>
          <li>{t("docs.ai.explain")}</li>
          <li>{t("docs.ai.risk")}</li>
          <li>{t("docs.ai.generate")}</li>
        </ul>
      </Section>

      <Section id="mcp" title={t("docs.mcp.title")}>
        <p>
          {t("docs.mcp.body1")}{" "}
          <a href="https://modelcontextprotocol.io" target="_blank" rel="noreferrer">MCP</a>{" "}
          {t("docs.mcp.body2")}{" "}
          <Link to="/mcp">{t("nav.mcp")}</Link>.
        </p>
      </Section>

      <Section id="automation" title={t("docs.automation.title")}>
        <p>
          {t("docs.automation.body1")}{" "}
          <strong>Zapier</strong> — {t("docs.automation.body2")}
          <br />
          {t("docs.automation.zapierNote")}{" "}
          <strong>{t("docs.automation.webhooks")}</strong>{" "}
          {t("docs.automation.body3")}
        </p>
        <ul style={{ marginTop: 8 }}>
          <li>{t("docs.automation.tip1")}</li>
          <li>{t("docs.automation.tip2")}</li>
          <li>{t("docs.automation.tip3")}</li>
        </ul>
      </Section>

      <Section id="api" title={t("docs.api.title")}>
        <p>{t("docs.api.intro1")}</p>
        <p>
          {t("docs.api.base")} <code>https://api.docracy.io</code>. {t("docs.api.auth")}{" "}
          <code>Authorization: Bearer &lt;your-api-key&gt;</code> {t("docs.api.orToken")}{" "}
          <code>?token=</code> {t("docs.api.queryParam")} {t("docs.api.json")}
        </p>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14, marginTop: 12 }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--hairline)" }}>
              <th style={{ padding: "6px 8px 6px 0" }}>{t("docs.api.colMethod")}</th>
              <th style={{ padding: "6px 8px" }}>{t("docs.api.colWhat")}</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>GET /api/zapier/auth-test</code>
              </td>
              <td style={{ padding: "6px 8px" }}>{t("docs.api.authTest")}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>GET /api/zapier/templates</code>
              </td>
              <td style={{ padding: "6px 8px" }}>{t("docs.api.templates")}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>POST /api/zapier/documents</code>
              </td>
              <td style={{ padding: "6px 8px" }}>{t("docs.api.documents")}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>POST /api/zapier/documents/bulk</code>
              </td>
              <td style={{ padding: "6px 8px" }}>{t("docs.api.bulk")}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>POST /api/zapier/hooks/:event</code>
              </td>
              <td style={{ padding: "6px 8px" }}>{t("docs.api.hooks")}</td>
            </tr>
            <tr style={{ borderBottom: "1px solid var(--hairline)" }}>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>DELETE /api/zapier/hooks/:id</code>
              </td>
              <td style={{ padding: "6px 8px" }}>{t("docs.api.hooksDelete")}</td>
            </tr>
            <tr>
              <td style={{ padding: "6px 8px 6px 0", whiteSpace: "nowrap" }}>
                <code>POST /api/embed/api-token/sessions</code>
              </td>
              <td style={{ padding: "6px 8px" }}>{t("docs.api.embed")}</td>
            </tr>
          </tbody>
        </table>
        <p style={{ fontSize: 13, color: "var(--mute)", marginTop: 10, marginBottom: 0 }}>
          {t("docs.api.footer")}
        </p>
      </Section>

      <Section id="privacy" title={t("docs.privacy.title")}>
        <p style={{ marginBottom: 0 }}>
          {t("docs.privacy.body1")}{" "}
          <Link to="/trust">{t("footer.trust")}</Link>,{" "}
          <Link to="/privacy">{t("footer.privacy")}</Link>, {t("docs.privacy.and")}{" "}
          <Link to="/terms">{t("footer.terms")}</Link>{" "}
          {t("docs.privacy.body2")}
        </p>
      </Section>
    </div>
  );
}
