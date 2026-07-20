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

const perform = (z, bundle) => {
  if (bundle.cleanedRequest && bundle.cleanedRequest.data) {
    const { data } = bundle.cleanedRequest;
    return [Object.assign({ id: data.docId }, data)];
  }
  return [{ id: "sample-doc-id", docId: "sample-doc-id", title: "Sample Document" }];
};

module.exports = {
  key: "document_created",
  noun: "Document",
  display: {
    label: "Document Created",
    description: "Triggers the moment a document is sent for signature, before anyone has signed.",
  },
  operation: {
    type: "hook",
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform,
    sample: { id: "sample-doc-id", docId: "sample-doc-id", title: "Sample Document" },
  },
};
