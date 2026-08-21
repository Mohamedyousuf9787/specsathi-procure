# API Status

| Provider / capability | State | Purpose | Fallback |
|---|---|---|---|
| Local demo provider | Enabled | Generic laptop, chair, monitor, legacy multi-item, and safe unknown-category local flows. | N/A — required P0 path. |
| Deterministic brief parser | Enabled | Parses and validates common generic buying briefs; requests clarification for missing or conflicting information. | Local structured demo fixtures. |
| Gemini / Groq LLM | Disabled | Optional future natural-language extraction or explanation. | Deterministic parser and editable preview. |
| Tavily / SerpApi / Brave | Disabled | Optional future web-discovered offers. | Local simulated catalog, clearly labeled. |
| Web Speech / image parsing | Deferred | P2 intake enhancement. | Text input. |

No credentials are used, stored, or needed for the P0 application.
