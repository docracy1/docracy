import { axios } from "@pipedream/platform";

// Thin wrapper around the same REST API built for Zapier (see apps/worker/src/routes/zapier.ts
// and apps/zapier/) — same Bearer-token auth, same endpoints. Docracy is a single hosted product,
// so the base URL is a constant rather than a user-entered field.
const BASE_URL = "https://api.docracy.io";

export default {
  type: "app",
  app: "docracy",
  propDefinitions: {
    templateId: {
      type: "string",
      label: "Template",
      description: "A template saved on your Docracy Dashboard (Prepare a document → Save as template).",
      async options() {
        const templates = await this.listTemplates();
        return templates.map((t) => ({ label: t.name, value: t.id }));
      },
    },
  },
  methods: {
    _headers() {
      return { Authorization: `Bearer ${this.$auth.api_key}` };
    },
    async _makeRequest({ $ = this, ...args }) {
      return axios($, {
        baseURL: BASE_URL,
        headers: this._headers(),
        ...args,
      });
    },
    async authTest({ $ } = {}) {
      return this._makeRequest({ $, url: "/api/zapier/auth-test" });
    },
    async listTemplates({ $ } = {}) {
      return this._makeRequest({ $, url: "/api/zapier/templates" });
    },
    async createDocument({ $, data }) {
      return this._makeRequest({ $, method: "POST", url: "/api/zapier/documents", data });
    },
    async bulkSendFromTemplate({ $, data }) {
      return this._makeRequest({ $, method: "POST", url: "/api/zapier/documents/bulk", data });
    },
    // Public, token-based — the statusToken returned by createDocument/bulkSendFromTemplate IS
    // the credential, so this deliberately skips the Bearer auth header (matches
    // apps/worker/src/routes/sign.ts's GET /status/:token, which anyone holding the token can call).
    async getStatus({ $, token }) {
      return axios($ || this, { baseURL: BASE_URL, url: `/api/status/${token}` });
    },
    async subscribeHook({ $, event, targetUrl }) {
      return this._makeRequest({
        $,
        method: "POST",
        url: `/api/zapier/hooks/${event}`,
        data: { target_url: targetUrl },
      });
    },
    async unsubscribeHook({ $, id }) {
      return this._makeRequest({ $, method: "DELETE", url: `/api/zapier/hooks/${id}` });
    },
  },
};
