import docracy from "../../docracy.app.mjs";

export default {
  key: "docracy-document-created",
  name: "Document Created (Instant)",
  version: "0.0.1",
  type: "source",
  description: "Emits an event each time a document is sent for signature via Docracy.",
  dedupe: "unique",
  props: {
    docracy,
    http: {
      type: "$.interface.http",
      customResponse: false,
    },
    db: "$.service.db",
  },
  hooks: {
    async activate() {
      const { id } = await this.docracy.subscribeHook({
        event: "document-created",
        targetUrl: this.http.endpoint,
      });
      this.db.set("hookId", id);
    },
    async deactivate() {
      const id = this.db.get("hookId");
      if (id) await this.docracy.unsubscribeHook({ id });
    },
  },
  // Delivered body shape is { event: "document.created", data: { docId, title } } — see
  // apps/worker/src/lib/webhooks.ts's deliverWebhookEvent / apps/worker/src/lib/documentCreation.ts.
  async run(event) {
    const { data } = event.body;
    this.$emit(data, {
      id: data.docId || `${Date.now()}`,
      summary: `Document created: ${data.title || data.docId}`,
      ts: Date.now(),
    });
  },
};
