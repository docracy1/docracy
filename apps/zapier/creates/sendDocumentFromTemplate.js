const { BASE_URL } = require("../constants");

const MAX_SIGNER_SLOTS = 4;

// Templates have a variable, per-template signer count, but a Zapier action's fields are static —
// so this offers a fixed number of optional signer slots and only sends the ones actually filled
// in. Docracy's own validation (POST /api/zapier/documents) rejects a mismatch with a clear error
// if the filled-in count doesn't match what the chosen template actually needs.
const perform = (z, bundle) => {
  const signers = [];
  for (let i = 1; i <= MAX_SIGNER_SLOTS; i++) {
    const name = bundle.inputData[`signer${i}Name`];
    const email = bundle.inputData[`signer${i}Email`];
    if (name && email) signers.push({ name, email });
  }

  return z
    .request({
      url: `${BASE_URL}/api/zapier/documents`,
      method: "POST",
      body: { templateId: bundle.inputData.templateId, signers },
    })
    .then((response) => response.data);
};

const signerFields = [];
for (let i = 1; i <= MAX_SIGNER_SLOTS; i++) {
  signerFields.push(
    { key: `signer${i}Name`, label: `Signer ${i} Name`, type: "string", required: i === 1 },
    { key: `signer${i}Email`, label: `Signer ${i} Email`, type: "string", required: i === 1 }
  );
}

module.exports = {
  key: "send_document_from_template",
  noun: "Document",
  display: {
    label: "Send Document From Template",
    description: "Sends a saved Docracy template out for signature.",
  },
  operation: {
    perform,
    inputFields: [
      {
        key: "templateId",
        label: "Template",
        type: "string",
        required: true,
        dynamic: "template_list.id.name",
        helpText: "Save a template first on your Docracy Dashboard (Prepare a document → Save as template).",
      },
      ...signerFields,
    ],
    sample: {
      docId: "sample-doc-id",
      statusToken: "sample-status-token",
      statusUrl: "https://docracy.io/status/sample-status-token",
    },
  },
};
