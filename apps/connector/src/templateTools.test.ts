import { describe, it, expect } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerTemplateTools } from "./templateTools";
import { SERVER_INFO } from "./serverInfo";

describe("registerTemplateTools", () => {
  it("registers without throwing", () => {
    const server = new McpServer(SERVER_INFO);
    expect(() => registerTemplateTools(server)).not.toThrow();
  });
});
