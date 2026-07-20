const { BASE_URL } = require("../constants");

// GET /api/zapier/templates returns [{id, name}, ...] already shaped for a dynamic dropdown.
const perform = (z, bundle) => z.request({ url: `${BASE_URL}/api/zapier/templates` }).then((response) => response.data);

// Hidden — this exists only to power the "Template" dropdown on the Send Document action
// (see creates/sendDocumentFromTemplate.js's `dynamic: 'template_list.id.name'`), it's never a
// trigger a user picks directly.
module.exports = {
  key: "template_list",
  noun: "Template",
  display: {
    label: "Template List",
    description: "Used internally to power the template dropdown.",
    hidden: true,
  },
  operation: {
    perform,
    sample: { id: "sample-template-id", name: "Sample Template (2 signers)" },
  },
};
