/**
 * paid-mcp-metering — HTTP server.
 *
 * Discovery is free (POST /mcp, JSON-RPC 2.0 per the Model Context
 * Protocol). Execution is metered per call (POST /v1/t/{tool}) behind an
 * x402 v2 paywall: an unpaid request receives HTTP 402 with payment
 * requirements; a paid request carries PAYMENT-SIGNATURE and settles USDC
 * through the facilitator before the handler runs.
 */

import express from "express";
import type { Request, Response } from "express";
import { paymentMiddleware } from "@x402/express";
import {
  x402ResourceServer,
  HTTPFacilitatorClient,
} from "@x402/core/server";
import { ExactEvmScheme } from "@x402/evm/exact/server";
import { TOOLS, NETWORK, PAY_TO, FACILITATOR_URL } from "./pricing.js";

const SERVER_INFO = { name: "paid-mcp-metering", version: "2.0.0" } as const;
const PROTOCOL_VERSION = "2025-06-18";

function publicToolDefs() {
  return TOOLS.map((t) => ({
    name: t.name,
    description: `${t.description} Price: ${t.price}/call via x402.`,
    inputSchema: t.inputSchema,
  }));
}

/** Free MCP discovery endpoint: initialize, tools/list, ping. */
export function handleMcp(req: Request, res: Response): void {
  const body = req.body ?? {};
  const { id, method } = body as { id?: unknown; method?: string };
  switch (method) {
    case "initialize":
      res.json({
        jsonrpc: "2.0",
        id: id ?? null,
        result: {
          protocolVersion: PROTOCOL_VERSION,
          capabilities: { tools: {} },
          serverInfo: SERVER_INFO,
        },
      });
      return;
    case "notifications/initialized":
      res.status(202).end();
      return;
    case "tools/list":
      res.json({
        jsonrpc: "2.0",
        id: id ?? null,
        result: { tools: publicToolDefs() },
      });
      return;
    case "ping":
      res.json({ jsonrpc: "2.0", id: id ?? null, result: {} });
      return;
    case "tools/call":
      res.json({
        jsonrpc: "2.0",
        id: id ?? null,
        error: {
          code: -32002,
          message:
            "Execution is metered per call. POST /v1/t/{tool} with an x402 client; discovery on this endpoint is free.",
          data: { tools: TOOLS.map((t) => ({ name: t.name, price: t.price })) },
        },
      });
      return;
    default:
      res.json({
        jsonrpc: "2.0",
        id: id ?? null,
        error: { code: -32601, message: `Method not found: ${String(method)}` },
      });
  }
}

export function createApp(): express.Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "1mb" }));

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      ok: true,
      service: SERVER_INFO.name,
      version: SERVER_INFO.version,
      x402Version: 2,
      network: NETWORK,
      settlementConfigured: PAY_TO !== "",
    });
  });

  app.post("/mcp", handleMcp);

  if (!PAY_TO) {
    // Requirements-only mode: metering contract is servable and testable,
    // but refusing to accept payments to an unset address.
    app.use(
      "/v1/t",
      (_req: Request, res: Response) => {
        res.status(503).json({
          error: "settlement_not_configured",
          detail:
            "X402_PAY_TO is not set on this deployment; no payment can be accepted.",
        });
      }
    );
    return app;
  }

  const facilitator = new HTTPFacilitatorClient({ url: FACILITATOR_URL });
  const resource = new x402ResourceServer(facilitator);
  resource.register("eip155:*", new ExactEvmScheme());

  const routes: Record<string, unknown> = {};
  for (const tool of TOOLS) {
    // Canonical requirements ride the base64url PAYMENT-REQUIRED header per
    // x402 v2. This body mirror keeps body-only agents working.
    const requirement = {
      scheme: "exact",
      network: NETWORK,
      payTo: PAY_TO,
      price: tool.price,
      maxTimeoutSeconds: 60,
    };
    routes[`POST /v1/t/${tool.name}`] = {
      accepts: [requirement],
      description: tool.description,
      mimeType: "application/json",
      unpaidResponseBody: () => ({
        contentType: "application/json",
        body: {
          x402Version: 2,
          error: "Payment required",
          resource: `/v1/t/${tool.name}`,
          accepts: [requirement],
          note: "Canonical x402 v2 requirements are in the base64url PAYMENT-REQUIRED response header; this body mirrors them.",
        },
      }),
    };
  }
  app.use(paymentMiddleware(routes as never, resource));

  for (const tool of TOOLS) {
    app.post(`/v1/t/${tool.name}`, async (req: Request, res: Response) => {
      try {
        const content = await tool.handler((req.body ?? {}) as Record<string, unknown>);
        res.json({ jsonrpc: "2.0", result: { content }, id: null });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        const status = msg.startsWith("invalid_arguments") ? 400 : 502;
        res.status(status).json({ error: msg });
      }
    });
  }

  return app;
}

export async function main(): Promise<void> {
  const port = Number(process.env.PORT ?? 4021);
  const app = createApp();
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.error(
      `paid-mcp-metering listening on :${port} network=${NETWORK} settlement=${PAY_TO ? "configured" : "NOT_CONFIGURED"}`
    );
  });
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  main().catch((e) => {
    console.error(e);
    process.exit(1);
  });
}
