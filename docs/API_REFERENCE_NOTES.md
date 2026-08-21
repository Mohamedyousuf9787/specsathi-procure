# API reference notes

These notes preserve the official external references consulted while implementing system status.

- Google Gemini Models API documents `GET https://generativelanguage.googleapis.com/v1beta/models` for listing available models: https://ai.google.dev/api/models
- SerpAPI Account API documents `GET https://serpapi.com/account.json?api_key=SECRET_API_KEY` as a free account/key validation endpoint: https://serpapi.com/account-api
- Firecrawl v2 documentation confirms server-side Bearer-key authentication and conventional 2xx/4xx/5xx response handling, including 429 rate-limit responses. This integration does not assume a zero-cost health endpoint; status reports configured/degraded and validates during explicit page verification: https://docs.firecrawl.dev/api-reference/v2-introduction
- Firecrawl partner validation is restricted to approved partner integrations, so it is not used as a general health check: https://docs.firecrawl.dev/partner-integration

Manual production verification on 2026-08-21:

- Root production page returned HTTP 200 and `<title>Specanic</title>`.
- `/api/trpc/status.get` returned HTTP 200 with real service states. With no provider/database keys in the sandbox, the response correctly reported AI, SerpAPI, Firecrawl, Tavily, and database as Not configured rather than Operational.
- Browser production page rendered the Specanic intake screen and the right-side menu with exactly Home, New Procurement, Procurement History, How Specanic Works, System Status, and About Specanic.
