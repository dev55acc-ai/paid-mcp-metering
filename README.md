# paid-mcp-metering

Metered MCP tools, priced per call.

Discovery is free: `POST /mcp` speaks JSON-RPC 2.0 per the Model Context Protocol (`initialize`, `tools/list`, `ping`). Execution is metered: `POST /v1/t/{tool}` sits behind an x402 v2 paywall. An unpaid request gets HTTP `402` with payment requirements; a paid request carries a `PAYMENT-SIGNATURE` header and settles USDC through the facilitator before the tool runs.

## Live deployment

Base URL: `https://paid-mcp-metering-clsiojdd7-benlafreniere6-3913s-projects.vercel.app`

- `GET /health` — free, public
- `POST /mcp` — free discovery
- `POST /v1/t/{tool}` — metered; currently answers `503 settlement_not_configured` because `X402_PAY_TO` is unset on the deployment (`settlementConfigured:false` in `/health` is the honest switch). No payment can be accepted until a receiving address is configured.

`server.json` declares this URL as the registry remote.

## Tools

| Tool | Price | What it returns |
|------|-------|-----------------|
| `web_search` | $0.001/call | Ranked live web results with source URLs |
| `deep_research` | $0.01/call | Multi-source research pass with a synthesized answer plus cited sources |

Upstreams are Exa (primary) and Tavily (fallback). Every handler returns live upstream output or throws — there is no canned response.

## Rails

x402 v2, USDC, EIP-155 network selected by `X402_NETWORK` (default Base Sepolia testnet, CAIP-2 `eip155:84532`). Facilitator defaults to `https://x402.org/facilitator`.

| Env var | Purpose |
|---------|---------|
| `X402_PAY_TO` | Receiving address. Required for settlement; unset serves 402 requirements only |
| `X402_NETWORK` | CAIP-2 network id (default `eip155:84532`) |
| `X402_FACILITATOR_URL` | x402 facilitator endpoint |
| `EXA_API_KEY` / `TAVILY_API_KEY` | Search upstream credentials |

## Run

```bash
npm install
npm run build
npm start          # node dist/x402-server.js
npm test           # build + node --test dist/test-x402.js
```

Free discovery:

```bash
curl -s localhost:4021/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}'
```

Paid execution:

```bash
curl -s localhost:4021/v1/t/web_search -H 'Content-Type: application/json' \
  -d '{"query":"x402 protocol","max_results":3}'
# -> 402 with payment requirements; pay via an x402 client and retry with PAYMENT-SIGNATURE
```

## Registry

`server.json` targets the official MCP Registry as `io.github.dev55acc-ai/paid-mcp-metering`. Tagging `v*` runs `.github/workflows/publish-mcp.yml`: tests, build, npm publish (when `NPM_TOKEN` is set), then registry publish authenticated by GitHub OIDC — no stored registry credential.

## License

MIT
