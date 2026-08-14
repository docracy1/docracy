import docracy from "../../docracy.app.mjs";

const MAX_SIGNER_SLOTS = 4;

const signerProps = {};
for (let i = 1; i <= MAX_SIGNER_SLOTS; i++) {
  signerProps[`signer${i}Name`] = {
    type: "string",
    label: `Signer ${i} Name`,
    optional: i > 1,
  };
  signerProps[`signer${i}Email`] = {
    type: "string",
    label: `Signer ${i} Email`,
    optional: i > 1,
  };
}

export default {
  key: "docracy-send-document-from-template",
  name: "Send Document From Template",
  version: "0.0.1",
  type: "action",
  description: "Sends a saved Docracy template out for signature. [See the docs](https://docracy.io/docs)",
  props: {
    docracy,
    templateId: {
      propDefinition: [docracy, "templateId"],
    },
    ...signerProps,
    ttlDays: {
      type: "integer",
      label: "Expires After (days)",
      description: "How long signers have to complete the document before it expires.",
      optional: true,
    },
  },
  async run({ $ }) {
    const signers = [];
    for (let i = 1; i <= MAX_SIGNER_SLOTS; i++) {
      const name = this[`signer${i}Name`];
      const email = this[`signer${i}Email`];
      if (name && email) signers.push({ name, email });
    }

    const response = await this.docracy.createDocument({
      $,
      data: { templateId: this.templateId, signers, ttlDays: this.ttlDays },
    });

    $.export("$summary", `Sent document for signature (status: ${response.statusUrl})`);
    return response;
  },
};
