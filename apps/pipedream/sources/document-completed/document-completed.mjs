import docracy from "../../docracy.app.mjs";

export default {
  key: "docracy-document-completed",
  name: "Document Completed (Instant)",
  version: "0.0.1",
  type: "source",
  description: "Emits an event when every signer has completed a Docracy document.",
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
        event: "document-completed",
        targetUrl: this.http.endpoint,
      });
      this.db.set("hookId", id);
    },
    async deactivate() {
      const id = this.db.get("hookId");
      if (id) await this.docracy.unsubscribeHook({ id });
    },
  },
  // Delivered body shape is { event: "document.completed", data: { docId } } — see
  // apps/worker/src/routes/sign.ts's completion branch of POST /sign/:token.
  async run(event) {
    const { data } = event.body;
    this.$emit(data, {
      id: data.docId || `${Date.now()}`,
      summary: `Document completed: ${data.docId}`,
      ts: Date.now(),
    });
  },
};
