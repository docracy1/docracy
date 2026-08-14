import docracy from "../../docracy.app.mjs";

export default {
  key: "docracy-signer-signed",
  name: "Signer Signed (Instant)",
  version: "0.0.1",
  type: "source",
  description: "Emits an event each time an individual signer completes their part of a Docracy document.",
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
        event: "signer-signed",
        targetUrl: this.http.endpoint,
      });
      this.db.set("hookId", id);
    },
    async deactivate() {
      const id = this.db.get("hookId");
      if (id) await this.docracy.unsubscribeHook({ id });
    },
  },
  // Delivered body shape is { event: "document.signer.signed", data: { docId, signerOrder } } —
  // see apps/worker/src/routes/sign.ts's POST /sign/:token handler.
  async run(event) {
    const { data } = event.body;
    this.$emit(data, {
      id: `${data.docId}-${data.signerOrder ?? ""}-${Date.now()}`,
      summary: `Signer #${data.signerOrder} signed document ${data.docId}`,
      ts: Date.now(),
    });
  },
};
