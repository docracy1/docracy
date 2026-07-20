const { BASE_URL } = require("../constants");

const subscribeHook = (z, bundle) =>
  z
    .request({
      url: `${BASE_URL}/api/zapier/hooks/document-completed`,
      method: "POST",
      body: { target_url: bundle.targetUrl },
    })
    .then((response) => response.data);

const unsubscribeHook = (z, bundle) =>
  z
    .request({ url: `${BASE_URL}/api/zapier/hooks/${bundle.subscribeData.id}`, method: "DELETE" })
    .then((response) => response.data);

// Called twice, for two different reasons: with a real inbound webhook body (bundle.cleanedRequest
// set) once a Zap is live, or with nothing at all when a user clicks "Test trigger" in the Zap
// editor before any real event has fired — the fallback sample keeps that step from erroring out.
const perform = (z, bundle) => {
  if (bundle.cleanedRequest && bundle.cleanedRequest.data) {
    const { data } = bundle.cleanedRequest;
    return [Object.assign({ id: data.docId }, data)];
  }
  return [{ id: "sample-doc-id", docId: "sample-doc-id", title: "Sample Document" }];
};

module.exports = {
  key: "document_completed",
  noun: "Document",
  display: {
    label: "Document Completed",
    description: "Triggers once every signer has signed a document.",
  },
  operation: {
    type: "hook",
    performSubscribe: subscribeHook,
    performUnsubscribe: unsubscribeHook,
    perform,
    sample: { id: "sample-doc-id", docId: "sample-doc-id", title: "Sample Document" },
  },
};
