import { describe, it, expect, vi } from "vitest";

const bulkSendFromTemplateCreate = require("../creates/bulkSendFromTemplate");

function fakeZ(responseData) {
  return { request: vi.fn().mockResolvedValue({ data: responseData }) };
}

describe("bulkSendFromTemplate create", () => {
  it("POSTs recipients to the bulk endpoint", async () => {
    const z = fakeZ({ batchId: "batch-1", documents: [] });
    const bundle = {
      inputData: {
        templateId: "tpl-1",
        recipient1Signer1Name: "Alice",
        recipient1Signer1Email: "alice@example.com",
        recipient2Signer1Name: "Bob",
        recipient2Signer1Email: "bob@example.com",
        customSubject: "Please sign",
      },
    };
    const result = await bulkSendFromTemplateCreate.operation.perform(z, bundle);
    expect(z.request).toHaveBeenCalledWith({
      url: expect.stringContaining("/api/zapier/documents/bulk"),
      method: "POST",
      body: {
        templateId: "tpl-1",
        recipients: [
          { signers: [{ name: "Alice", email: "alice@example.com" }], title: undefined },
          { signers: [{ name: "Bob", email: "bob@example.com" }], title: undefined },
        ],
        customSubject: "Please sign",
        customMessage: undefined,
      },
    });
    expect(result).toEqual({ batchId: "batch-1", documents: [] });
  });
});
