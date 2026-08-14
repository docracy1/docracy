import docracy from "../../docracy.app.mjs";

export default {
  key: "docracy-get-document-status",
  name: "Get Document Status",
  version: "0.0.1",
  type: "action",
  description: "Looks up a document's signing status by its status token.",
  props: {
    docracy,
    statusToken: {
      type: "string",
      label: "Status Token",
      description: "From the `statusToken` field returned by **Send Document From Template** or **Bulk Send From Template**.",
    },
  },
  async run({ $ }) {
    const response = await this.docracy.getStatus({ $, token: this.statusToken });
    $.export("$summary", `Document status: ${response.status}`);
    return response;
  },
};
