/**
 * Real tool backends. Every handler either returns live upstream output or
 * throws — there is no canned response anywhere in this file.
 *
 * Upstreams:
 *   1. Exa Search API (https://docs.exa.ai) — primary; /search for the
 *      $0.001 tier, /answer for the $0.01 tier.
 *   2. Tavily Search API (https://docs.tavily.com) — fallback when
 *      EXA_API_KEY is absent. Cost per served call is bounded by plan
 *      credits; priced per-call above marginal cost.
 */

interface SearchResult {
  title: string;
  url: string;
  snippet: string;
}

function str(args: Record<string, unknown>, field: string): string {
  const v = args[field];
  if (typeof v !== "string" || v.trim() === "") {
    throw new Error(`invalid_arguments: '${field}' must be a non-empty string`);
  }
  return v.trim();
}

function int(args: Record<string, unknown>, field: string, fallback: number, max: number): number {
  const v = args[field];
  const n = typeof v === "number" ? Math.floor(v) : NaN;
  return Number.isFinite(n) ? Math.min(Math.max(n, 1), max) : fallback;
}

/* ---------------- Exa ---------------- */

async function exaSearch(query: string, numResults: number): Promise<SearchResult[]> {
  const res = await fetch("https://api.exa.ai/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.EXA_API_KEY ?? "",
    },
    body: JSON.stringify({ query, numResults }),
  });
  if (!res.ok) {
    throw new Error(`upstream_error: exa responded HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    results?: Array<{ title?: string; url?: string; text?: string }>;
  };
  return (data.results ?? []).map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: (r.text ?? "").slice(0, 400),
  }));
}

async function exaAnswer(
  query: string,
  numResults: number
): Promise<{ answer: string; results: SearchResult[] }> {
  const res = await fetch("https://api.exa.ai/answer", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.EXA_API_KEY ?? "",
    },
    body: JSON.stringify({ query, text: true, numResults }),
  });
  if (!res.ok) {
    throw new Error(`upstream_error: exa answered HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    answer?: string;
    citations?: Array<{ title?: string; url?: string; text?: string }>;
  };
  return {
    answer: data.answer ?? "",
    results: (data.citations ?? []).slice(0, numResults).map((c) => ({
      title: c.title ?? "",
      url: c.url ?? "",
      snippet: (c.text ?? "").slice(0, 600),
    })),
  };
}

/* ---------------- Tavily (fallback) ---------------- */

async function tavily(
  body: Record<string, unknown>
): Promise<{ answer?: string; results: SearchResult[] }> {
  const key = process.env.TAVILY_API_KEY ?? "";
  if (!key) {
    throw new Error(
      "upstream_not_configured: set EXA_API_KEY or TAVILY_API_KEY on the server"
    );
  }
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    throw new Error(`upstream_error: tavily responded HTTP ${res.status}`);
  }
  const data = (await res.json()) as {
    answer?: string;
    results?: Array<{ title?: string; url?: string; content?: string }>;
  };
  return {
    answer: data.answer,
    results: (data.results ?? []).map((r) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: r.content ?? "",
    })),
  };
}

/** True when an Exa key is configured; Exa is the primary upstream. */
function hasExa(): boolean {
  return Boolean(process.env.EXA_API_KEY);
}

/* ---------------- Sold tools ---------------- */

/** $0.001 tier — basic web search, compact results payload. */
export async function webSearch(args: Record<string, unknown>) {
  const query = str(args, "query");
  const maxResults = int(args, "max_results", 5, 10);
  const results = hasExa()
    ? await exaSearch(query, maxResults)
    : (
        await tavily({
          query,
          search_depth: "basic",
          max_results: maxResults,
        })
      ).results.map((r) => ({ ...r, snippet: r.snippet.slice(0, 400) }));
  return [
    {
      type: "text" as const,
      text: JSON.stringify({ query, count: results.length, results }, null, 2),
    },
  ];
}

/** $0.01 tier — synthesized answer across cited sources. */
export async function deepResearch(args: Record<string, unknown>) {
  const topic = str(args, "topic");
  const maxResults = int(args, "max_results", 8, 15);
  let answer: string;
  let sources: SearchResult[];
  if (hasExa()) {
    const out = await exaAnswer(topic, maxResults);
    answer = out.answer;
    sources = out.results;
  } else {
    const out = await tavily({
      query: topic,
      search_depth: "advanced",
      max_results: maxResults,
      include_answer: true,
    });
    answer = out.answer ?? "";
    sources = out.results;
  }
  return [
    {
      type: "text" as const,
      text: JSON.stringify({ topic, answer, sources }, null, 2),
    },
  ];
}
