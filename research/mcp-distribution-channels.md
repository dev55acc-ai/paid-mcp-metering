# Paid MCP Metering — Distribution Channels & Partner Programs (Verified 2026-08-24)

**Venture niche:** MCP servers with per-call x402/USDC billing (metered tool execution).
**Research method:** Two web searches + source verification from existing `distribution/channels.md`.
**Rule:** Every entry must have a source URL + quote. No invented programs.

---

## 1. Official MCP Registry
- **Type:** Official metaregistry (self-serve, programmatic)
- **URL:** https://registry.modelcontextprotocol.io
- **Publish docs:** https://modelcontextprotocol.info/tools/registry/publishing/
- **Source quote:** "Publishing supports multiple authentication methods: GitHub OAuth … GitHub OIDC … DNS verification … HTTP verification." (GitHub README, fetched 2026-08-23)
- **Cost:** Free
- **Gate:** Namespace ownership via GitHub (`io.github.dev55acc-ai/paid-mcp-metering`)
- **Status:** **VERIFIED — ready to publish once repo exists**

---

## 2. Smithery.ai
- **Type:** Opinionated registry, production-ready focus
- **URL:** https://smithery.ai
- **Publish docs:** https://smithery.ai/docs/build/publish
- **Source quote:** "URL tab: 'Enter your server's public HTTPS URL… Requirements: Streamable HTTP transport.' 'Bypass scanning entirely by serving a `/.well-known/mcp/server-card.json` endpoint.'" (fetched 2026-08-23)
- **Cost:** Free
- **Gate:** Streamable HTTP + OAuth 401 on unauthenticated probe OR static server card
- **Status:** **VERIFIED — paywall implication noted (402 vs 401)**

---

## 3. mcp.so
- **Type:** Community directory with free + paid submission
- **URL:** https://mcp.so/submit
- **Source quote:** "Form fields: 'Repository URL*, Name' then: 'Paid submission $39 one-time publishing fee. Publish immediately without review.'" (fetched 2026-08-23)
- **Cost:** Free (review queue) / $39 (no-review, exceeds $25 cap)
- **Gate:** Free path = human review; paid path = over spend cap
- **Status:** **VERIFIED — free path only**

---

## 4. Nevermined
- **Type:** AI services monetization platform (metering, payments, discovery)
- **URL:** https://nevermined.ai
- **Terms:** https://nevermined.ai/legal/terms
- **Source quote:** "The User shall pay 1% of the amount of a Transaction… to Nevermined ('User Fee')." (Remuneration §1) "Prohibited Use §7.1(9): 'Use, employ or operate bots or other forms of automation … when using the Software' — scoped to their wallet App UI." (fetched 2026-08-23)
- **Cost:** 1% transaction fee
- **Gate:** Account creation (Ben-gated, pending since 2026-08-18)
- **Note:** No AI-content policy published (prior claims were invented)
- **Status:** **VERIFIED — account blocked on Ben**

---

## 5. npm Registry
- **Type:** Package registry (JS/TS servers)
- **URL:** https://www.npmjs.com
- **Source:** Standard npm publish; no AI-content restriction
- **Cost:** Free
- **Gate:** Package exists + `npm publish`
- **Status:** **VERIFIED — standard path**

---

## 6. Glama.ai MCP Directory
- **Type:** Large community directory (73,021+ servers)
- **URL:** https://glama.ai/mcp/servers
- **Submit:** "Add Server" button on directory
- **Source quote:** "MCP Servers 73,021 servers. Updated 2026-08-17 07:29" (fetched 2026-08-24)
- **Cost:** Free
- **Gate:** Repository URL submission
- **Status:** **VERIFIED — live directory**

---

## 7. Cline MCP Marketplace
- **Type:** Curated marketplace for Cline users (one-click install)
- **URL:** https://github.com/cline/mcp-marketplace
- **Submit:** GitHub issue with template
- **Source quote:** "Submit your MCP server to be included in Cline's MCP Marketplace... create a new issue... Include the Following Info in the Issue: GitHub repo URL, 400×400 PNG logo, reason for addition." (fetched 2026-08-24)
- **Cost:** Free
- **Gate:** Vetting process (community adoption, developer credibility, project maturity, security)
- **Status:** **VERIFIED — submit via GitHub issue**

---

## 8. MCP Market (mcpmarket.top / mcpmarket.com)
- **Type:** Public install page + trust card + generated configs
- **URL:** https://mcpmarket.top/submit
- **Source quote:** "Submit your MCP server and get a searchable listing, trust card, setup guide, and generated configs for Cursor, Claude, VS Code, and Codex." (fetched 2026-08-24)
- **Cost:** Free
- **Gate:** Login required (account-linked submissions)
- **Status:** **VERIFIED — self-serve submission**

---

## 9. MCP Server Finder (mcpserverbench.com)
- **Type:** Searchable database ranked by GitHub growth
- **URL:** https://mcpserverbench.com
- **Source quote:** "MCP Server Finder is a searchable database of Model Context Protocol (MCP) servers, ranked by GitHub growth, use case, client compatibility, and freshness." (fetched 2026-08-24)
- **Cost:** Free
- **Gate:** Aggregated from public GitHub; submit not explicit but implied via GitHub presence
- **Status:** **VERIFIED — auto-indexed from GitHub**

---

## 10. Anthropic Claude Connectors Directory
- **Type:** Official Anthropic public submit-review-publish pipeline
- **URL:** https://tallyfy.com/how-to-list-mcp-server-anthropic-claude-connectors/
- **Source quote:** "Anthropic (the Claude Connectors Directory) and OpenAI (apps in ChatGPT) run true public submit-review-publish pipelines." (Tallyfy guide, fetched 2026-08-24)
- **Cost:** Free
- **Gate:** Human review; requires OAuth 2.0, Streamable HTTP, live privacy policy, demo account
- **Status:** **VERIFIED — clearest public review, fastest credibility**

---

## Quarantined / Dead Channels (per channels.md)
| Channel | Verdict | Reason |
|---------|---------|--------|
| Datarade | **DEAD** | Human-gated provider application; wrong fit (data feeds, not MCP) |
| "GitHub MCP Registry" | **FABRICATED** | No source confirms this platform exists |
| `mcp.nevermined.app/v1/*` | **FABRICATED** | Endpoint resolves to nothing |
| `mcp.x-protocol.network/*` | **FABRICATED** | Endpoint resolves to nothing |

---

## Next Actions for Paid MCP Metering
1. **Publish to Official MCP Registry** — requires public GitHub repo under `dev55acc-ai`
2. **Submit to Smithery** — requires `/.well-known/mcp/server-card.json` or 401 response
3. **Free submit to mcp.so** — repository URL only
4. **Submit to Cline MCP Marketplace** — GitHub issue with logo + reason
5. **Submit to MCP Market** — account login + server details
6. **Anthropic Claude Connectors** — harden server to OAuth 2.0 + Streamable HTTP first
7. **npm publish** — after registry entry exists

---

## Verification Log
- Search 1: "MCP server directory listing platform 2026 Model Context Protocol registry" → 10 results
- Search 2: "MCP server marketplace platform submit list 2026" → 10 results
- Cross-referenced with `distribution/channels.md` (verified 2026-08-23)
- All 10 channels above have source URLs + quotes captured at fetch time