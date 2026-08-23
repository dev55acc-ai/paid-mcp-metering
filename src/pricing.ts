/**
 * Single source of truth for what is sold, at what price, on which rail.
 *
 * Prices are USD-denominated strings parsed by @x402/core; settlement is
 * USDC on an EIP-155 network selected by X402_NETWORK (default: Base
 * Sepolia testnet, CAIP-2 eip155:84532).
 */

export const NETWORK: string = process.env.X402_NETWORK ?? "eip155:84532";
export const FACILITATOR_URL: string =
  process.env.X402_FACILITATOR_URL ?? "https://x402.org/facilitator";

/** Receiving address. REQUIRED for settlement; unset serves requirements only. */
export const PAY_TO: string = process.env.X402_PAY_TO ?? "";

export interface ToolOutputPart {
  type: "text";
  text: string;
}

export interface ToolDef {
  name: string;
  description: string;
  /** USD price per call, e.g. "$0.001". */
  price: string;
  inputSchema: Record<string, unknown>;
  handler: (args: Record<string, unknown>) => Promise<ToolOutputPart[]>;
}

import { webSearch, deepResearch } from "./tools.js";

export const TOOLS: ToolDef[] = [
  {
    name: "web_search",
    description: "Web search returning ranked live results with source URLs.",
    price: "$0.001",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "Search query" },
        max_results: { type: "number", description: "1-10, default 5" },
      },
      required: ["query"],
    },
    handler: webSearch,
  },
  {
    name: "deep_research",
    description:
      "Advanced multi-source research pass with a synthesized answer plus cited sources.",
    price: "$0.01",
    inputSchema: {
      type: "object",
      properties: {
        topic: { type: "string", description: "Research topic or question" },
        max_results: { type: "number", description: "1-15, default 8" },
      },
      required: ["topic"],
    },
    handler: deepResearch,
  },
];
