import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTemplateTools } from "./templateTools";
import { buildServerInfo } from "./serverInfo";

const testEnv = {
  PUBLIC_APP_URL: "https://docracy.io",
  PUBLIC_WORKER_URL: "https://api.docracy.io",
  PUBLIC_CONNECTOR_URL: "https://mcp.docracy.io",
};

describe("registerTemplateTools", () => {
  it("registers without throwing", () => {
    const server = new McpServer(buildServerInfo(testEnv));
    expect(() => registerTemplateTools(server, testEnv)).not.toThrow();
  });
});
