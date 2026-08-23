/**
 * Integration tests for the x402-metered HTTP server.
 *
 * The metering gate is asserted strictly against the wire per x402 v2:
 * an unpaid request receives HTTP 402 carrying payment requirements in the
 * base64url PAYMENT-REQUIRED header (canonical), mirrored in the JSON body.
 * A separate live smoke test exercises the real upstream tool backend when
 * TAVILY_API_KEY is present (single call, negligible spend).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { once } from "node:events";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";

process.env.X402_PAY_TO ||= "0x1234567890abcdef1234567890abcdef12345678";

const { createApp } = await import("./x402-server.js");

const httpServer: Server = createApp().listen(0);
await once(httpServer, "listening");
const base = `http://127.0.0.1:${(httpServer.address() as AddressInfo).port}`;

test.after(() => httpServer.close());

interface PaymentRequiredLike {
  x402Version?: number;
  accepts?: Array<{
    scheme?: string;
    network?: string;
    /** Base units of the settlement asset (v2 canonical, header form). */
    amount?: string;
    /** Settlement asset contract, e.g. USDC on Base Sepolia. */
    asset?: string;
    /** USD-denominated price (body mirror form). */
    price?: string | number;
    payTo?: string;
    maxTimeoutSeconds?: number;
  }>;
}

/** Decode the canonical x402 v2 PAYMENT-REQUIRED header. */
function decodeRequiredHeader(res: Response): PaymentRequiredLike {
  const header = res.headers.get("payment-required");
  assert.ok(header, "402 must carry PAYMENT-REQUIRED header");
  return JSON.parse(Buffer.from(header, "base64").toString("utf8")) as PaymentRequiredLike;
}

test("GET /health answers 200 with service identity", async () => {
  const res = await fetch(`${base}/health`);
  assert.equal(res.status, 200);
  const body = (await res.json()) as Record<string, unknown>;
  assert.equal(body.ok, true);
  assert.equal(body.service, "paid-mcp-metering");
  assert.equal(body.x402Version, 2);
});

test("free discovery: MCP initialize + tools/list without payment", async () => {
  let res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "initialize", params: {} }),
  });
  assert.equal(res.status, 200);
  const init = (await res.json()) as { result: { protocolVersion: string; serverInfo: { name: string } } };
  assert.equal(init.result.protocolVersion, "2025-06-18");
  assert.equal(init.result.serverInfo.name, "paid-mcp-metering");

  res = await fetch(`${base}/mcp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" }),
  });
  assert.equal(res.status, 200);
  const list = (await res.json()) as { result: { tools: Array<{ name: string; description: string }> } };
  assert.equal(list.result.tools.length >= 2, true);
  for (const t of list.result.tools) {
    assert.match(t.description, /\$0\.\d+\/call via x402/);
  }
});

test("metered gate: unpaid POST /v1/t/web_search gets HTTP 402 with exact scheme requirements", async () => {
  const res = await fetch(`${base}/v1/t/web_search`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query: "x402 protocol" }),
  });
  assert.equal(res.status, 402);

  const required = decodeRequiredHeader(res);
  assert.equal(required.x402Version, 2);
  assert.ok(required.accepts, "header requirements must carry accepts");
  const req0 = required.accepts![0];
  assert.equal(req0.scheme, "exact");
  assert.equal(req0.network, process.env.X402_NETWORK ?? "eip155:84532");
  assert.ok(req0.amount, "requirement must carry a base-unit amount");
  assert.match(String(req0.asset), /^0x[0-9a-fA-F]{40}$/);
  assert.equal(req0.payTo, process.env.X402_PAY_TO);

  const body = (await res.json()) as PaymentRequiredLike & { resource?: string };
  assert.ok(body.accepts, `body must mirror accepts, got: ${JSON.stringify(body).slice(0, 400)}`);
  assert.equal(body.accepts![0].scheme, "exact");
});

test("metered gate applies per-tool pricing (deep tier costs more than basic)", async () => {
  const prices: string[] = [];
  for (const tool of ["web_search", "deep_research"]) {
    const res = await fetch(`${base}/v1/t/${tool}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [tool === "web_search" ? "query" : "topic"]: "probe" }),
    });
    assert.equal(res.status, 402);
    const required = decodeRequiredHeader(res);
    assert.ok(required.accepts?.[0], `no accepts for ${tool}`);
    prices.push(String(required.accepts[0].amount));
  }
  assert.notEqual(prices[0], prices[1]);
});

test("unknown tool route is not sold: plain 404", async () => {
  const res = await fetch(`${base}/v1/t/nonexistent`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(res.status, 404);
});

test("LIVE upstream smoke: webSearch returns real results (skipped without TAVILY_API_KEY)", { skip: !process.env.TAVILY_API_KEY }, async () => {
  const { webSearch } = await import("./tools.js");
  const out = await webSearch({ query: "x402 payment protocol", max_results: 3 });
  const parsed = JSON.parse(out[0].text) as { count: number; results: Array<{ url: string }> };
  assert.ok(parsed.count >= 1, "expected at least one live search result");
  assert.ok(parsed.results.every((r) => r.url.startsWith("http")));
});
