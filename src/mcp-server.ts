/**
 * paid-mcp-metering — stdio transport.
 *
 * Local/unmetered transport for development and manual inspection. It runs
 * the same tool implementations as the metered HTTP server; per-call
 * settlement exists only on POST /v1/t/{tool} in x402-server.ts. There is
 * deliberately no payment check here: stdio is not a billing surface.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { TOOLS } from "./pricing.js";

const server = new Server(
  { name: "paid-mcp-metering", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: TOOLS.map((t) => ({
    name: t.name,
    description: `${t.description} Metered at ${t.price}/call on the HTTP transport.`,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const tool = TOOLS.find((t) => t.name === request.params.name);
  if (!tool) {
    throw new Error(`Unknown tool: ${request.params.name}`);
  }
  const content = await tool.handler(
    (request.params.arguments ?? {}) as Record<string, unknown>
  );
  return { content };
});

const transport = new StdioServerTransport();
await server.connect(transport);
console.error("paid-mcp-metering running on stdio (unmetered local transport)");
