import docracy from "../../docracy.app.mjs";

const MAX_RECIPIENTS = 5;
const MAX_SIGNERS_PER_RECIPIENT = 2;

const recipientProps = {};
for (let i = 1; i <= MAX_RECIPIENTS; i++) {
  recipientProps[`recipient${i}Title`] = {
    type: "string",
    label: `Recipient ${i} — Title`,
    optional: true,
  };
  for (let j = 1; j <= MAX_SIGNERS_PER_RECIPIENT; j++) {
    recipientProps[`recipient${i}Signer${j}Name`] = {
      type: "string",
      label: `Recipient ${i} — Signer ${j} Name`,
      optional: !(i === 1 && j === 1),
    };
    recipientProps[`recipient${i}Signer${j}Email`] = {
      type: "string",
      label: `Recipient ${i} — Signer ${j} Email`,
      optional: !(i === 1 && j === 1),
    };
  }
}

export default {
  key: "docracy-bulk-send-from-template",
  name: "Bulk Send From Template",
  version: "0.0.1",
  type: "action",
  description:
    "Sends a saved Docracy template to multiple recipients in one step. For templates needing more than " +
    `${MAX_SIGNERS_PER_RECIPIENT} signers per recipient, use **Send Document From Template** instead.`,
  props: {
    docracy,
    templateId: {
      propDefinition: [docracy, "templateId"],
    },
    ...recipientProps,
    customSubject: {
      type: "string",
      label: "Custom Email Subject",
      optional: true,
    },
    customMessage: {
      type: "string",
      label: "Custom Email Message",
      optional: true,
    },
  },
  async run({ $ }) {
    const recipients = [];
    for (let i = 1; i <= MAX_RECIPIENTS; i++) {
      const signers = [];
      for (let j = 1; j <= MAX_SIGNERS_PER_RECIPIENT; j++) {
        const name = this[`recipient${i}Signer${j}Name`];
        const email = this[`recipient${i}Signer${j}Email`];
        if (name && email) signers.push({ name, email });
      }
      const title = this[`recipient${i}Title`];
      if (signers.length > 0) recipients.push({ signers, title: title || undefined });
    }

    const response = await this.docracy.bulkSendFromTemplate({
      $,
      data: {
        templateId: this.templateId,
        recipients,
        customSubject: this.customSubject || undefined,
        customMessage: this.customMessage || undefined,
      },
    });

    $.export("$summary", `Sent ${recipients.length} document(s) from template`);
    return response;
  },
};
