const { BASE_URL } = require("../constants");

const MAX_SIGNER_SLOTS = 4;
const MAX_RECIPIENT_ROWS = 10;

function parseRecipients(bundle) {
  const recipients = [];
  for (let i = 1; i <= MAX_RECIPIENT_ROWS; i++) {
    const signers = [];
    for (let j = 1; j <= MAX_SIGNER_SLOTS; j++) {
      const name = bundle.inputData[`recipient${i}Signer${j}Name`];
      const email = bundle.inputData[`recipient${i}Signer${j}Email`];
      if (name && email) signers.push({ name, email });
    }
    const title = bundle.inputData[`recipient${i}Title`];
    if (signers.length > 0) {
      recipients.push({ signers, title: title || undefined });
    }
  }
  return recipients;
}

const perform = (z, bundle) => {
  const recipients = parseRecipients(bundle);
  return z
    .request({
      url: `${BASE_URL}/api/zapier/documents/bulk`,
      method: "POST",
      body: {
        templateId: bundle.inputData.templateId,
        recipients,
        customSubject: bundle.inputData.customSubject || undefined,
        customMessage: bundle.inputData.customMessage || undefined,
      },
    })
    .then((response) => response.data);
};

const recipientFields = [];
for (let i = 1; i <= MAX_RECIPIENT_ROWS; i++) {
  recipientFields.push({
    key: `recipient${i}Title`,
    label: `Recipient ${i} Title (optional)`,
    type: "string",
    required: false,
  });
  for (let j = 1; j <= MAX_SIGNER_SLOTS; j++) {
    recipientFields.push(
      { key: `recipient${i}Signer${j}Name`, label: `Recipient ${i} — Signer ${j} Name`, type: "string", required: i === 1 && j === 1 },
      { key: `recipient${i}Signer${j}Email`, label: `Recipient ${i} — Signer ${j} Email`, type: "string", required: i === 1 && j === 1 }
    );
  }
}

module.exports = {
  key: "bulk_send_from_template",
  noun: "Bulk Send",
  display: {
    label: "Bulk Send From Template",
    description: "Sends a saved template to many recipients at once (up to 50 per run).",
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
        helpText: "Each filled-in recipient row creates a separate document from this template.",
      },
      ...recipientFields,
      {
        key: "customSubject",
        label: "Custom Email Subject (optional)",
        type: "string",
        required: false,
      },
      {
        key: "customMessage",
        label: "Custom Email Message (optional)",
        type: "string",
        required: false,
      },
    ],
    sample: {
      batchId: "sample-batch-id",
      documents: [
        {
          docId: "sample-doc-id",
          statusToken: "sample-status-token",
          statusUrl: "https://docracy.io/status/sample-status-token",
          title: "Sample agreement",
          recipientLabel: "Alice <alice@example.com>",
        },
      ],
    },
  },
};
