const { BASE_URL } = require("../constants");

const subscribeHook = (z, bundle) =>
  z
    .request({
      url: `${BASE_URL}/api/zapier/hooks/signer-signed`,
      method: "POST",
      body: { target_url: bundle.targetUrl },
    })
    .then((response) => response.data);

const unsubscribeHook = (z, bundle) =>
  z
    .request({ url: `${BASE_URL}/api/zapier/hooks/${bundle.subscribeData.id}`, method: "DELETE" })
    .then((response) => response.data);

const SAMPLE = { id: "sample-doc-id-1", docId: "sample-doc-id", signerOrder: 1 };

const perform = (z, bundle) => {
  if (bundle.cleanedRequest && bundle.cleanedRequest.data) {
    const { data } = bundle.cleanedRequest;
    // docId + signerOrder together, since signerOrder alone repeats across documents.
    return [Object.assign({ id: `${data.docId}-${data.signerOrder}` }, data)];
  }
  return [SAMPLE];
};

// See documentCreated.js's comment on performList — same reasoning, no genuine "list" endpoint
// behind this, just the fallback sample so the Zap editor's test step has something to show.
const performList = () => [SAMPLE];

module.exports = {
  key: "signer_signed",
  noun: "Signer",
  display: {
    label: "Signer Signed",
    description: "Triggers when an individual signer signs (not just when the whole document completes).",
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
