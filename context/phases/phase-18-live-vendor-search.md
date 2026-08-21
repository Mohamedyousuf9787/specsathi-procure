---
type: phase
id: phase-18-live-vendor-search
status: complete
created: 2026-08-21
updated: 2026-08-21
related:
  - "[[phases/phase-17-real-nlp]]"
---

# Phase 18 — Live Vendor Search

Official Tavily documentation was reviewed. The server-side adapter uses `POST https://api.tavily.com/search`, sends the bearer key only from the server environment, and normalizes title, URL, excerpt, and relevance evidence. The user-provided `TAVILY_API_KEY` passed a bounded health test. An authenticated laptop search returned real evidence. The UI keeps live evidence separate from local deterministic offers and labels snippets as unverified; local Vendor A/Vendor B remain the fallback.
