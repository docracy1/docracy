const { BASE_URL } = require("../constants");

const subscribeHook = (z, bundle) =>
  z
    .request({
      url: `${BASE_URL}/api/zapier/hooks/document-created`,
      method: "POST",
      body: { target_url: bundle.targetUrl },
    })
    .then((response) => response.data);

const unsubscribeHook = (z, bundle) =>
  z
    .request({ url: `${BASE_URL}/api/zapier/hooks/${bundle.subscribeData.id}`, method: "DELETE" })
    .then((response) => response.data);

const SAMPLE = { id: "sample-doc-id", docId: "sample-doc-id", title: "Sample Document" };

const perform = (z, bundle) => {
  if (bundle.cleanedRequest && bundle.cleanedRequest.data) {
    const { data } = bundle.cleanedRequest;
    return [Object.assign({ id: data.docId }, data)];
  }
  return [SAMPLE];
};

// Zapier requires a polling fallback even for a pure REST Hook trigger, so the Zap editor's
// "Test trigger" step has something to show before any real event has fired. There's no genuine
// "list recent documents" endpoint behind this — it's the same static sample either way.
const performList = () => [SAMPLE];

module.exports = {
  key: "document_created",
  noun: "Document",
  display: {
    label: "Document Created",
    description: "Triggers when a document is sent for signature, before anyone has signed.",
  },
  operation: {
    type: "hook",
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform,
    performList,
    sample: SAMPLE,
  },
};
